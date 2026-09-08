// מקורות למטריצה: לכל מגבר/פרוססור — קישור דף היצרן מתוך AMP_DATA (src/app.js), ולכל
// רמקול — url של המפרט. מה שאין לו מקור מסומן כך שבכרטיס הפריט יופיע "אין מקור מתועד".
// הרצה: node scripts/matrix-sources.js
import { readFileSync, writeFileSync } from 'node:fs';
const PAGE = 'src/pages/matrix.html';
const app = readFileSync('src/app.js', 'utf8');
const m = /const AMP_DATA = (\[[\s\S]*?\n\]);/.exec(app);
if (!m) throw new Error('AMP_DATA not found');
const AMP_DATA = new Function('return ' + m[1])();
const src = readFileSync(PAGE, 'utf8');
const MRX = /(<script id="mdata" type="application\/json">)([\s\S]*?)(<\/script>)/;
const mm = src.match(MRX); if (!mm) throw new Error('mdata not found');
const D = JSON.parse(mm[2]);
const models = new Set();
for (const k of ['amp', 'dsp', 'sub', 'act']) { const x = D.mx[k]; if (x) { x.rows.forEach(r => models.add(r)); x.cols.forEach(c => models.add(c)); } }
D.src = {}; D.srcKind = {};
for (const model of models) {
  const fn = (D.fn || {})[model] || '';
  const hay = model + ' ' + fn;
  const hit = AMP_DATA.find(d => d.re && (d.re.test(model) || d.re.test(fn)));
  const sp = (D.specs || {})[model];
  if (sp && sp.url) { D.src[model] = sp.url; D.srcKind[model] = 'manufacturer'; }
  else if (hit && hit.url) {
    /* כניסת סדרה כללית ("דגם לא מפורט") = דף הסדרה, לא הדגם — מסומן כך שלא ייראה כמאומת */
    const generic = /לא מפורט/.test(hit.w || '');
    D.src[model] = hit.url; D.srcKind[model] = generic ? 'series' : (hit.ok ? 'manufacturer' : 'manufacturer-unverified');
    if (hit.ok && hit.pw && !generic) { D.pw = D.pw || {}; D.pw[model] = { ...hit.pw }; }   /* טבלת הספק מאומתת מדף היצרן מחליפה מספר שנגזר משם הפריט */
  }
  else if ((D.pw || {})[model]) D.srcKind[model] = 'erp-name';   /* המספר נגזר משם הפריט ב-ERP בלבד */
}
const n = Object.keys(D.src).length, e = Object.values(D.srcKind).filter(x => x === 'erp-name').length;
writeFileSync(PAGE, src.slice(0, mm.index) + mm[1] + JSON.stringify(D) + mm[3] + src.slice(mm.index + mm[0].length));
console.log(`מקורות: ${n} דגמים עם קישור · ${e} מגברים שההספק שלהם רק משם הפריט ב-ERP · ${models.size} דגמים במטריצה`);
