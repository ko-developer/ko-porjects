// מאגר פרויקטי המתכנן. שני מנועים:
//   json   — מסמך JSON לכל פרויקט (projects/p_<id>.json) + projects/meta.json על שכבת האחסון (storage.js):
//            קבצים מקומיים או דלי Cloud Storage. זה המנוע כשמוגדר DATA_BUCKET או STORE=json.
//            נקראים/נכתבים רק פרויקטים שהשתנו (לפי updated/generation ו-cache) — שמירה של פרויקט אחד לא מעלה 38MB.
//   sqlite — data/projects.sqlite (ברירת המחדל הישנה בלי DATA_BUCKET; נתוני משתמש, מחוץ ל-git)
// הממשק אחיד ו-async: readStore(h) / writeStore(h, store).
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
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
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(24, need.length) }, async () => {
    while (i < need.length) {
      const it = need[i++], key = it.gen || it.updated, b = await h.st.read(it.name);
      if (b) { const str = b.toString('utf8'); h.cache.set(it.name, { key, str }); if (h.st.kind === 'gcs') diskPut(it.name, key, str); }
    }
  }));
}
async function readJsonStore(h) {
  const items = (await h.st.list(h.prefix)).filter(it => /(^|\/)(p_[^/]*\.json|meta\.json)$/.test(it.name));
  await fetchChanged(h, items);
  for (const k of [...h.cache.keys()]) if (!items.some(it => it.name === k)) { h.cache.delete(k); diskDel(k); }   /* נמחק בצד השני */
  const projects = [];
  let meta = {};
  for (const it of items) {
    const c = h.cache.get(it.name); if (!c) continue;
    try { if (it.name.endsWith('meta.json')) meta = JSON.parse(c.str); else projects.push(JSON.parse(c.str)); } catch {}
  }
  if (meta.order) { const rank = Object.fromEntries(meta.order.map((id, i) => [id, i])); projects.sort((a, b) => (rank[a.id] ?? 1e9) - (rank[b.id] ?? 1e9)); }
  return { ...(meta.extra || {}), cur: meta.cur || (projects[0] && projects[0].id) || 'p1', projects };
}
async function writeJsonStore(h, store) {
  const { projects = [], cur, ...extra } = store;
  const put = async (name, str) => {
    const c = h.cache.get(name); if (c && c.str === str) return false;
    await h.st.write(name, str, 'application/json; charset=utf-8');
    h.cache.set(name, { key: 'local-' + Date.now(), str }); return true;
  };
  const seen = new Set(); let changed = 0;
  for (const p of projects) { const name = h.prefix + 'p_' + safeId(p.id) + '.json'; seen.add(name); if (await put(name, JSON.stringify(p))) changed++; }
  for (const it of await h.st.list(h.prefix)) {
    if (/(^|\/)p_[^/]*\.json$/.test(it.name) && !seen.has(it.name)) { await h.st.delete(it.name); h.cache.delete(it.name); diskDel(it.name); changed++; }
  }
  await put(h.prefix + 'meta.json', JSON.stringify({ cur: cur || '', extra, order: projects.map(p => p.id), updated: new Date().toISOString() }));
  /* אחרי כתיבה ה-cache מסומן "local-" — הקריאה הבאה תיקח את הגרסה מהאחסון (updated/generation) ותשווה תוכן */
  h.lastWrite = { at: Date.now(), changed };
  return projects.length;
}
