// מאגר פרויקטי המתכנן. שני מנועים:
//   json   — מסמך JSON לכל פרויקט (projects/p_<id>.json) + projects/meta.json על שכבת האחסון (storage.js):
//            קבצים מקומיים או דלי Cloud Storage. זה המנוע כשמוגדר DATA_BUCKET או STORE=json.
//            נקראים/נכתבים רק פרויקטים שהשתנו (לפי updated/generation ו-cache) — שמירה של פרויקט אחד לא מעלה 38MB.
//   sqlite — data/projects.sqlite (ברירת המחדל הישנה בלי DATA_BUCKET; נתוני משתמש, מחוץ ל-git)
// הממשק אחיד ו-async: readStore(h) / writeStore(h, store).
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync, readdirSync } from 'node:fs';
import { makeStorage } from './storage.js';

/* מטמון דיסק מקומי לאובייקטים מהדלי (data/.cache-gcs, gitignored): אחרי הפעלה מחדש של השרת המקומי
   לא מורידים שוב 36MB — רק מה שהשתנה (לפי generation). בענן (K_SERVICE) הדיסק זמני — לא בשימוש */
const DISK = process.env.K_SERVICE ? null : 'data/.cache-gcs';
const diskName = name => DISK + '/' + name.replace(/[^A-Za-z0-9._-]/g, '_');
function diskGet(name, key) { if (!DISK) return null; try { const j = JSON.parse(readFileSync(diskName(name), 'utf8')); return j.key === key ? j.str : null; } catch { return null; } }
function diskPut(name, key, str) { if (!DISK) return; try { mkdirSync(DISK, { recursive: true }); writeFileSync(diskName(name), JSON.stringify({ key, str })); } catch {} }
function diskDel(name) { if (!DISK) return; try { unlinkSync(diskName(name)); } catch {} }

export function openStore(storage) {
  if (storage && storage.kind !== 'fs' || process.env.DATA_BUCKET || process.env.STORE === 'json') return openJsonStore(storage || makeStorage());
  return openDb('data/projects.sqlite');
}
export function openJsonStore(storage, prefix = 'projects/') {
  return { json: true, st: storage, prefix, cache: new Map() };   /* cache: name → { key: updated|gen, str } */
}
export function openDb(path = 'data/projects.sqlite') {
  if (process.env.STORE_JSON_DIR) return openJsonStore(makeStorageDir(process.env.STORE_JSON_DIR), '');
  const db = new DatabaseSync(path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY, name TEXT, updated_at TEXT, data TEXT);
    CREATE TABLE IF NOT EXISTS meta(k TEXT PRIMARY KEY, v TEXT);
  `);
  return db;
}
function makeStorageDir(dir) { const prev = process.env.DATA_DIR; process.env.DATA_DIR = dir; const st = makeStorage(); if (prev === undefined) delete process.env.DATA_DIR; else process.env.DATA_DIR = prev; return st; }
const safeId = id => String(id).replace(/[^A-Za-z0-9_-]/g, '_');

export async function readStore(h) {
  if (h.json) return readJsonStore(h);
  const projects = h.prepare('SELECT data FROM projects').all().map(r => JSON.parse(r.data));
  const meta = Object.fromEntries(h.prepare('SELECT k, v FROM meta').all().map(r => [r.k, r.v]));
  const extra = meta.extra ? JSON.parse(meta.extra) : {};
  return { ...extra, cur: meta.cur || (projects[0] && projects[0].id) || 'p1', projects };
}
export async function writeStore(h, store) {
  if (h.json) return writeJsonStore(h, store);
  const { projects = [], cur, ...extra } = store;
  const now = new Date().toISOString();
  h.exec('BEGIN');
  try {
    h.exec('DELETE FROM projects');
    const ins = h.prepare('INSERT INTO projects(id, name, updated_at, data) VALUES(?,?,?,?)');
    for (const p of projects) ins.run(String(p.id), String(p.name || ''), now, JSON.stringify(p));
    const mset = h.prepare('INSERT OR REPLACE INTO meta(k, v) VALUES(?,?)');
    mset.run('cur', String(cur || ''));
    mset.run('extra', JSON.stringify(extra));
    h.exec('COMMIT');
  } catch (e) { h.exec('ROLLBACK'); throw e; }
  return projects.length;
}

/* ---------- JSON על שכבת האחסון ---------- */
async function fetchChanged(h, items) {
  /* מביא רק קבצים שהשתנו מאז הקריאה הקודמת (עד 24 במקביל, על חיבורים חיים) */
  const need = [];
  for (const it of items) {
    const key = it.gen || it.updated, c = h.cache.get(it.name);
    if (c && c.key === key) continue;
    const d = h.st.kind === 'gcs' ? diskGet(it.name, key) : null;
    if (d != null) { h.cache.set(it.name, { key, str: d }); continue; }
    need.push(it);
  }
  /* 8 במקביל + שלושה ניסיונות לכל קובץ: על חיבור איטי או קבצים גדולים קריאה בודדת נופלת,
     וקובץ שלא ירד היה נעלם מה-store (ובעבר גם נמחק בשמירה הבאה) */
  const readRetry = async name => {
    for (let k = 1; k <= 3; k++) {
      try { const b = await h.st.read(name); if (b) return b; } catch (e) { /* ניסיון נוסף */ }
      await new Promise(r => setTimeout(r, 400 * k));
    }
    return null;
  };
  let i = 0, failed = 0;
  await Promise.all(Array.from({ length: Math.min(8, need.length) }, async () => {
    while (i < need.length) {
      const it = need[i++], key = it.gen || it.updated, b = await readRetry(it.name);
      if (b) { const str = b.toString('utf8'); h.cache.set(it.name, { key, str }); if (h.st.kind === 'gcs') diskPut(it.name, key, str); }
      else failed++;
    }
  }));
  if (failed) console.warn('store: ' + failed + ' קבצים לא ירדו בסבב הזה — יימשכו בקריאה הבאה');
}
/* קריאת המאגר לא מחכה לדלי איטי: כשיש עותק בזיכרון והדלי לא ענה תוך 2.5 שניות — מגישים את העותק, והרענון ממשיך ברקע (הקריאה הבאה כבר מעודכנת) */
/* הפעלה קרה (שרת שזה עתה עלה) מול דלי איטי: בונים את המאגר מהעותקים שבמטמון הדיסק, והקריאה מהדלי ממשיכה ברקע */
function storeFromDisk(h) {
  if (!DISK || h.st.kind !== 'gcs') return null;
  try {
    const pre = (h.prefix + 'p_').replace(/[^A-Za-z0-9._-]/g, '_'), metaF = (h.prefix + 'meta.json').replace(/[^A-Za-z0-9._-]/g, '_');
    const projects = []; let meta = {};
    for (const f of readdirSync(DISK)) { if (!f.startsWith(pre) && f !== metaF) continue; try { const j = JSON.parse(readFileSync(DISK + '/' + f, 'utf8')); if (f === metaF) meta = JSON.parse(j.str); else projects.push(JSON.parse(j.str)); } catch {} }
    if (!projects.length) return null;
    /* רק פרויקטים שהמטא מכיר — קובץ מטמון של פרויקט שנמחק לא חוזר לחיים */
    const known = meta.order ? projects.filter(p2 => meta.order.includes(p2.id)) : projects;
    if (meta.order) { const rank = Object.fromEntries(meta.order.map((id, i) => [id, i])); known.sort((a, b) => (rank[a.id] ?? 1e9) - (rank[b.id] ?? 1e9)); }
    return { ...(meta.extra || {}), cur: meta.cur || (known[0] && known[0].id) || 'p1', projects: known };
  } catch { return null; }
}
async function readJsonStore(h) {
  if (!h.cache.size) {
    if (!h.refreshing) h.refreshing = readJsonStoreFresh(h).finally(() => { h.refreshing = null; });
    const cold = await Promise.race([h.refreshing.catch(() => null), new Promise(res => setTimeout(() => res(null), 3000))]);
    if (cold) return cold;
    const d = storeFromDisk(h); if (d) { console.warn('store: bucket slow on cold start — serving the local disk copy, refresh continues in background'); return d; }
    return h.refreshing || readJsonStoreFresh(h);
  }
  if (!h.refreshing) h.refreshing = readJsonStoreFresh(h).then(v => { h.lastGood = v; return v; }).finally(() => { h.refreshing = null; });
  const slow = new Promise(res => setTimeout(() => res(null), 2500));
  const v = await Promise.race([h.refreshing.catch(() => null), slow]);
  if (v) return v;
  if (h.lastGood) { console.warn('store: bucket slow — serving the in-memory copy, refresh continues in background'); return h.lastGood; }
  return h.refreshing;
}
async function readJsonStoreFresh(h) {
  let items;
  try { items = (await h.st.list(h.prefix)).filter(it => /(^|\/)(p_[^/]*\.json|meta\.json)$/.test(it.name)); h.lastList = items; }
  catch (e) {
    /* הדלי לא ענה — מגישים את מה שכבר בזיכרון (הקריאה הבאה תנסה שוב) */
    if (!h.lastList) throw e;
    console.warn('store list failed, serving cached copy:', e.message); items = h.lastList;
  }
  await fetchChanged(h, items);
  for (const k of [...h.cache.keys()]) if (!items.some(it => it.name === k)) { h.cache.delete(k); diskDel(k); }   /* נמחק בצד השני */
  const projects = [];
  let meta = {};
  /* קובץ שלא ירד (דלי איטי / שגיאה) — לוקחים את העותק הטוב האחרון שלו, ומסמנים שהקריאה חלקית.
     בלי זה הפרויקט נעלם מה-store, והשמירה הבאה הייתה מוחקת את הקובץ שלו מהדלי. */
  const lastById = new Map(((h.lastGood && h.lastGood.projects) || []).map(p2 => [String(p2.id), p2]));
  h.partial = false;
  for (const it of items) {
    const c = h.cache.get(it.name);
    if (!c) {
      const id = (it.name.match(/p_([^/]*)\.json$/) || [])[1];
      const prev = id && lastById.get(id);
      if (prev) { projects.push(prev); h.partial = true; console.warn('store: לא ירד ' + it.name + ' — מוגש העותק הקודם'); }
      else if (!it.name.endsWith('meta.json')) { h.partial = true; console.warn('store: לא ירד ' + it.name + ' ואין עותק קודם'); }
      continue;
    }
    try { if (it.name.endsWith('meta.json')) meta = JSON.parse(c.str); else projects.push(JSON.parse(c.str)); } catch { h.partial = true; }
  }
  if (meta.order) { const rank = Object.fromEntries(meta.order.map((id, i) => [id, i])); projects.sort((a, b) => (rank[a.id] ?? 1e9) - (rank[b.id] ?? 1e9)); }
  const out = { ...(meta.extra || {}), cur: meta.cur || (projects[0] && projects[0].id) || 'p1', projects };
  h.lastGood = out; return out;
}
async function writeJsonStore(h, store) {
  const { projects = [], cur, _del, ...extra } = store;
  const delIds = new Set((_del || []).map(String));
  const put = async (name, str) => {
    const c = h.cache.get(name); if (c && c.str === str) return false;
    await h.st.write(name, str, 'application/json; charset=utf-8');
    h.cache.set(name, { key: 'local-' + Date.now(), str }); return true;
  };
  const seen = new Set(); let changed = 0;
  for (const p of projects) { const name = h.prefix + 'p_' + safeId(p.id) + '.json'; seen.add(name); if (await put(name, JSON.stringify(p))) changed++; }
  /* מחיקת קובץ של פרויקט שאינו ברשימה — רק כשהקריאה האחרונה מהדלי הייתה שלמה.
     אחרי קריאה חלקית מוחקים רק מה שנמחק במפורש (store._del), כדי שתקלת רשת לא תמחק פרויקטים. */
  for (const it of await h.st.list(h.prefix)) {
    if (!/(^|\/)p_[^/]*\.json$/.test(it.name) || seen.has(it.name)) continue;
    const id = (it.name.match(/p_([^/]*)\.json$/) || [])[1];
    if (h.partial && !delIds.has(String(id))) { console.warn('store: קריאה חלקית — לא מוחק את ' + it.name); continue; }
    await h.st.delete(it.name); h.cache.delete(it.name); diskDel(it.name); changed++;
  }
  await put(h.prefix + 'meta.json', JSON.stringify({ cur: cur || '', extra, order: projects.map(p => p.id), updated: new Date().toISOString() }));
  /* אחרי כתיבה ה-cache מסומן "local-" — הקריאה הבאה תיקח את הגרסה מהאחסון (updated/generation) ותשווה תוכן */
  h.lastWrite = { at: Date.now(), changed };
  return projects.length;
}
