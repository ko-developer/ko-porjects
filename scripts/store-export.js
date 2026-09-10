// ייצוא פרויקטי המתכנן מ-SQLite המקומי לתיקיית JSON (מסמך לפרויקט) — לזריעת הדלי בענן.
//   node scripts/store-export.js <dir>
const dir = process.argv[2];
if (!dir) { console.error('usage: node scripts/store-export.js <dir>'); process.exit(1); }
delete process.env.STORE_JSON_DIR;                          /* קוראים מה-SQLite, לא מהתיקייה */
const { openDb, readStore, writeStore, openJsonStore } = await import('./db.js');
const store = readStore(openDb('data/projects.sqlite'));
const n = writeStore(openJsonStore(dir), store);
console.log(`exported ${n} projects -> ${dir}`);
