// ===================================================================================
// KO Projects — הגירת גבי המוצרים לקובץ נתונים אחד: data/rear_layouts.json
// מקור: בסיס הידע המובנה בקוד (REAR_KB ב-src/app.js) + המיקומים שנמדדו על התמונות
// (pos ב-data/rear_images.json). כל דגם מקבל רשומה {name, re, items[...]} שבה לכל מחבר
// יש סוג (t), תווית (label), הפורט המשויך (port) ומיקום על התמונה (x,y באחוזים, w = רוחב
// הסמן, side = 'front' למחברים שיושבים בחזית). הקובץ הזה הוא מה שהעורך על התמונה עורך
// ושומר (POST /api/rear-layout). REAR_KB נשאר בקוד כגיבוי בלבד — לא נמחק שום דבר.
//   node scripts/rear-migrate.js            — מוסיף רק דגמים שעדיין לא בקובץ
//   node scripts/rear-migrate.js --force    — בונה מחדש גם דגמים קיימים (דורס עריכות!)
// ===================================================================================
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const force = process.argv.includes('--force');
const app = readFileSync('src/app.js', 'utf8');
const a = app.indexOf('function ampRear('), b = app.indexOf('function rearLibKey(');
if (a < 0 || b < 0) throw new Error('REAR_KB block not found in src/app.js');
/* מריצים רק את קטע הקוד של בסיס הידע — פונקציות עזר טהורות בלי תלות ב-DOM */
const { REAR_KB: kb, rearPretty: pretty } = new Function('connGlyph', app.slice(a, b) + '\nreturn { REAR_KB, rearPretty };')(() => '');
const images = JSON.parse(readFileSync('data/rear_images.json', 'utf8'));
const out = existsSync('data/rear_layouts.json') ? JSON.parse(readFileSync('data/rear_layouts.json', 'utf8')) : [];

const imageFor = (re, name) => images.find(im => { try { return new RegExp(im.re, 'i').test(name) || (im.model && re.test(im.model)); } catch { return false; } });

let added = 0, updated = 0;
for (const e of kb) {
  const name = pretty(e.re);
  const im = imageFor(e.re, name);
  const pos = (im && im.pos) || {};
  const items = e.items.map((it, i) => {
    const o = { t: it.t, label: it.label || '' };
    if (it.port) o.port = it.port;
    const pp = pos[(it.label || '').trim()] || pos[(it.label || '').trim().toUpperCase()];
    if (pp) {
      o.x = pp[0]; o.y = pp[1];
      const w = pp.slice(2).find(v => typeof v === 'number'); if (w != null) o.w = w;
      if (pp.includes('f')) o.side = 'front';
    }
    return o;
  });
  const rec = { name, re: e.re.source, items, img: im ? im.re : undefined, src: 'migrated', updated: new Date().toISOString().slice(0, 10) };
  const k = out.findIndex(r => r.re === rec.re || r.name === name);
  if (k >= 0) { if (!force) continue; out[k] = { ...out[k], ...rec, src: out[k].src === 'editor' ? 'editor' : 'migrated' }; updated++; }
  else { out.push(rec); added++; }
}
writeFileSync('data/rear_layouts.json', JSON.stringify(out, null, 1));
console.log(`rear-migrate: ${out.length} layouts (${added} added, ${updated} rebuilt) -> data/rear_layouts.json`);
