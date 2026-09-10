// ייבוא קובץ גיבוי (ko-backup-*.json או store גולמי) אל data/projects.sqlite
// שימוש: node scripts/import-backup.js [נתיב, ברירת מחדל restore.json]
import { readFileSync } from 'node:fs';
import { openStore, writeStore } from './db.js';
import { makeStorage } from './storage.js';

const path = process.argv[2] || 'restore.json';
const b = JSON.parse(readFileSync(path, 'utf8'));
const store = b && b.kind === 'full-backup' ? b.store : b;
if (!store || !Array.isArray(store.projects) || !store.projects.length) {
  console.error('לא נמצאו פרויקטים ב-' + path);
  process.exit(1);
}
const st = makeStorage();
const n = await writeStore(openStore(st), store);
console.log(`imported ${n} projects -> ${st.kind === 'gcs' ? st.label : 'data/projects.sqlite'}`);
