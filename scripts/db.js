// SQLite של פרויקטי המתכנן — data/projects.sqlite (נפרד מ-ko.sqlite של ה-ERP; מחוץ ל-git — נתוני משתמש)
import { DatabaseSync } from 'node:sqlite';

export function openDb(path = 'data/projects.sqlite') {
  const db = new DatabaseSync(path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY, name TEXT, updated_at TEXT, data TEXT);
    CREATE TABLE IF NOT EXISTS meta(k TEXT PRIMARY KEY, v TEXT);
  `);
  return db;
}

// מרכיב store שלם { cur, projects, ...extra } משורות ה-DB
export function readStore(db) {
  const projects = db.prepare('SELECT data FROM projects').all().map(r => JSON.parse(r.data));
  const meta = Object.fromEntries(db.prepare('SELECT k, v FROM meta').all().map(r => [r.k, r.v]));
  const extra = meta.extra ? JSON.parse(meta.extra) : {};
  return { ...extra, cur: meta.cur || (projects[0] && projects[0].id) || 'p1', projects };
}

// כותב store שלם — פרויקט לשורה, והשאר (cur, spkLib וכו') ב-meta
export function writeStore(db, store) {
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
