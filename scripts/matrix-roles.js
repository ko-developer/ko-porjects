// תפקיד טופ/סאב לכל דגם במטריצת טופ↔סאב: תפקיד קיים (D.role), אחרת לפי תיאור הפריט ב-ERP.
// המטריצה עצמה מחלקת בזמן ריצה: שורות = טופים, עמודות = סאבים, מתוך D.mx.sub.all —
// כך שתיקון תפקיד ידני בדף (ST.role) מזיז את הדגם מיד לצד הנכון.
// הרצה: node scripts/matrix-roles.js
import { readFileSync, writeFileSync } from 'node:fs';
const PAGE = 'src/pages/matrix.html';
const src = readFileSync(PAGE, 'utf8');
const MRX = /(<script id="mdata" type="application\/json">)([\s\S]*?)(<\/script>)/;
const mm = src.match(MRX); if (!mm) throw new Error('mdata not found');
const D = JSON.parse(mm[2]);
const sub = D.mx.sub; D.role = D.role || {}; D.fn = D.fn || {};
const SUB_RX = /סאב|\bsub|bass|woofer|וופר|\bLF\b|LFX|\bLS\b|\bLT\b|XLT|XLS|\d{2,3}\s?B\b/i;
/* תיקונים ידועים: תיאור ה-ERP סותר את הקטלוג */
const FIX = { 'C1001': 'top' };   // K&F C1001 = רמקול 10״ דו-דרכי (בתיאור ה-ERP כתוב "סאב" בטעות)
const all = [...new Set([...(sub.all || []), ...sub.rows, ...sub.cols])];
let changed = 0;
for (const m of all) {
  const before = D.role[m];
  const r = FIX[m] || D.role[m] || (SUB_RX.test(m + ' ' + (D.fn[m] || '')) ? 'sub' : 'top');
  if (r !== before) { D.role[m] = r; changed++; }
}
sub.all = all;
sub.rows = all.filter(m => D.role[m] !== 'sub');
sub.cols = all.filter(m => D.role[m] === 'sub');
writeFileSync(PAGE, src.slice(0, mm.index) + mm[1] + JSON.stringify(D) + mm[3] + src.slice(mm.index + mm[0].length));
console.log(`טופ↔סאב: ${sub.rows.length} טופים (שורות) · ${sub.cols.length} סאבים (עמודות) · ${changed} תפקידים עודכנו`);
