// SQLite של פרויקטי המתכנן — data/projects.sqlite (נפרד מ-ko.sqlite של ה-ERP; מחוץ ל-git — נתוני משתמש)
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, writeFileSync, readdirSync, renameSync, unlinkSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

/* בענן (Cloud Run + דלי Cloud Storage מורכב כתיקייה): SQLite לא בטוח על תיקייה מורכבת, ולכן
   STORE_JSON_DIR=<תיקייה> מחליף אותו במסמך JSON לכל פרויקט (p_<id>.json) + meta.json.
   נכתבים רק פרויקטים שהשתנו — שמירה של פרויקט אחד לא מעלה 38MB לדלי. */
export function openJsonStore(dir) {
  mkdirSync(dir, { recursive: true });
  return { json: true, dir, cache: new Map() };
}
const safeId = id => String(id).replace(/[^A-Za-z0-9_-]/g, '_');
function readJsonStore(db) {
  const projects = [];
  for (const f of readdirSync(db.dir)) {
    if (!/^p_.*\.json$/.test(f)) continue;
    try { const s = readFileSync(join(db.dir, f), 'utf8'); db.cache.set(f, s); projects.push(JSON.parse(s)); } catch {}
  }
  let meta = {};
  try { const s = readFileSync(join(db.dir, 'meta.json'), 'utf8'); db.cache.set('meta.json', s); meta = JSON.parse(s); } catch {}
  if (meta.order) { const rank = Object.fromEntries(meta.order.map((id, i) => [id, i])); projects.sort((a, b) => (rank[a.id] ?? 1e9) - (rank[b.id] ?? 1e9)); }
  return { ...(meta.extra || {}), cur: meta.cur || (projects[0] && projects[0].id) || 'p1', projects };
}
function writeJsonStore(db, store) {
  const { projects = [], cur, ...extra } = store;
  const put = (f, s) => { if (db.cache.get(f) === s) return; const tmp = join(db.dir, f + '.tmp'); writeFileSync(tmp, s); renameSync(tmp, join(db.dir, f)); db.cache.set(f, s); };
  const seen = new Set();
  for (const p of projects) { const f = 'p_' + safeId(p.id) + '.json'; seen.add(f); put(f, JSON.stringify(p)); }
  for (const f of readdirSync(db.dir)) if (/^p_.*\.json$/.test(f) && !seen.has(f)) { try { unlinkSync(join(db.dir, f)); } catch {} db.cache.delete(f); }
  put('meta.json', JSON.stringify({ cur: cur || '', extra, order: projects.map(p => p.id), updated: new Date().toISOString() }));
  return projects.length;
}

export function openDb(path = 'data/projects.sqlite') {
  if (process.env.STORE_JSON_DIR) return openJsonStore(process.env.STORE_JSON_DIR);
  const db = new DatabaseSync(path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY, name TEXT, updated_at TEXT, data TEXT);
    CREATE TABLE IF NOT EXISTS meta(k TEXT PRIMARY KEY, v TEXT);
  `);
  return db;
}

// מרכיב store שלם { cur, projects, ...extra } משורות ה-DB
export function readStore(db) {
  if (db.json) return readJsonStore(db);
  const projects = db.prepare('SELECT data FROM projects').all().map(r => JSON.parse(r.data));
  const meta = Object.fromEntries(db.prepare('SELECT k, v FROM meta').all().map(r => [r.k, r.v]));
  const extra = meta.extra ? JSON.parse(meta.extra) : {};
  return { ...extra, cur: meta.cur || (projects[0] && projects[0].id) || 'p1', projects };
}

// כותב store שלם — פרויקט לשורה, והשאר (cur, spkLib וכו') ב-meta
export function writeStore(db, store) {
  if (db.json) return writeJsonStore(db, store);
  const { projects = [], cur, ...extra } = store;
  const now = new Date().toISOString();
  db.exec('BEGIN');
  try {
    db.exec('DELETE FROM projects');
    const ins = db.prepare('INSERT INTO projects(id, name, updated_at, data) VALUES(?,?,?,?)');
    for (const p of projects) ins.run(String(p.id), String(p.name || ''), now, JSON.stringify(p));
    const mset = db.prepare('INSERT OR REPLACE INTO meta(k, v) VALUES(?,?)');
    mset.run('cur', String(cur || ''));
    mset.run('extra', JSON.stringify(extra));
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
  return projects.length;
}
