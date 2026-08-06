// ייבוא קובץ גיבוי (ko-backup-*.json או store גולמי) אל data/projects.sqlite
// שימוש: node scripts/import-backup.js [נתיב, ברירת מחדל restore.json]
import { readFileSync } from 'node:fs';
import { openDb, writeStore } from './db.js';

const path = process.argv[2] || 'restore.json';
const b = JSON.parse(readFileSync(path, 'utf8'));
const store = b && b.kind === 'full-backup' ? b.store : b;
if (!store || !Array.isArray(store.projects) || !store.projects.length) {
  console.error('לא נמצאו פרויקטים ב-' + path);
  process.exit(1);
}
const n = writeStore(openDb(), store);
console.log(`imported ${n} projects -> data/projects.sqlite`);
