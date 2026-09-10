// ייצוא פרויקטי המתכנן מ-SQLite המקומי לתיקיית JSON (מסמך לפרויקט) — לזריעת הדלי בענן.
//   node scripts/store-export.js <dir>
import { openDb, readStore, writeStore, openJsonStore } from './db.js';
import { makeStorage } from './storage.js';
const dir = process.argv[2];
if (!dir) { console.error('usage: node scripts/store-export.js <dir>'); process.exit(1); }
delete process.env.STORE_JSON_DIR; delete process.env.DATA_BUCKET;                 /* קוראים מה-SQLite */
const store = await readStore(openDb('data/projects.sqlite'));
process.env.DATA_DIR = dir;
const n = await writeStore(openJsonStore(makeStorage(), ''), store);
console.log(`exported ${n} projects -> ${dir}`);
