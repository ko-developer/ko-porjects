// סיווג סוג ההתקנה של רמקולים למטריצה: שקוע קיר / שקוע תקרה / חוץ מוגן מים /
// סטרימר מובנה / Bluetooth. הסיווג נגזר אך ורק מהראיה שכתובה בשם או בתיאור
// הפריט (ERP / יצרן) — מה שאין לו ראיה נשאר בלי תגית, ואורי מתייג ידנית בדף.
//
// הרצה:  node scripts/matrix-kinds.js          (כותב ומזריק)
//        node scripts/matrix-kinds.js --dry     (מדפיס בלבד)
import { readFileSync, writeFileSync } from 'node:fs';

const PAGE = 'src/pages/matrix.html';
const OUT = 'data/speaker_kinds.json';
const MRX = /(<script id="mdata" type="application\/json">)([\s\S]*?)(<\/script>)/;

/* כל ביטוי הוא ראיה מפורשת בשם הפריט — לא ניחוש לפי סוג המוצר */
const RULES = [
  ['wall', /שקוע[^"]{0,12}קיר|תוך[- ]?קיר|\/\s*קיר|קיר\s*\//i],
  ['wall', /IN[- ]?WALL|\bIWM?\s?\d|\bWS\d/i],
  ['ceil', /שקוע[^"]{0,12}תקר|תקרתי|תקרה|IN[- ]?CEIL|CEILING|\bIC[- ]?\d/i],
  ['out', /חיצוני|מוגן מים|עמיד במים|מזג אוויר|WATERPROOF/i],
  ['out', /ALL[- ]?WEATHER|OUTDOOR|MARINE|GARDEN|\bIP\s?[5-6][0-9]\b|\bAW\d|NS-?AW\d/i],
  ['stream', /סטרימר|STREAM|MUSICCAST|AIRPLAY|WI[- ]?FI|SONOS/i],
  ['bt', /BLUETOOTH|בלוטו/i],
];
/* "רמקול שקוע" בלי ציון קיר/תקרה — ראיה שהוא שקוע, בלי לנחש באיזה משטח */
const FLUSH = /שקוע|FLUSH[- ]?MOUNT/i;

const src = readFileSync(PAGE, 'utf8');
const m = src.match(MRX);
if (!m) throw new Error('mdata not found in ' + PAGE);
const D = JSON.parse(m[2]);

/* הראיה לכל דגם: התיאור שבדף (שם הפריט ב-ERP או תיאור היצרן) */
const evidence = {};
for (const model of Object.keys(D.role || {})) {
  const t = (D.fn || {})[model];
  if (t) evidence[model] = t;
}
for (const a of D.activeSpk || []) if (a.n) evidence[a.m] = a.n;

const kinds = {}, audit = {};
for (const [model, text] of Object.entries(evidence)) {
  const hit = [];
  for (const [k, rx] of RULES) if (rx.test(text) && !hit.includes(k)) hit.push(k);
  if (FLUSH.test(text) && !hit.includes('wall') && !hit.includes('ceil')) hit.push('flush');
  if (!hit.length) continue;
  kinds[model] = hit;
  audit[model] = { k: hit, ev: text };
}

const count = k => Object.values(kinds).filter(v => v.includes(k)).length;
console.log(`מסווגים: ${Object.keys(kinds).length} מתוך ${Object.keys(evidence).length} דגמים עם ראיה`);
for (const k of [...new Set(RULES.map(r => r[0])), "flush"]) console.log(`  ${k.padEnd(7)} ${count(k)}`);

if (process.argv.includes('--dry')) {
  for (const [mm, v] of Object.entries(audit)) console.log(` ${v.k.join('+').padEnd(12)} ${mm.padEnd(20)} ${v.ev.slice(0, 70)}`);
  process.exit(0);
}

writeFileSync(OUT, JSON.stringify(audit, null, 1));
D.kind = kinds;
writeFileSync(PAGE, src.slice(0, m.index) + m[1] + JSON.stringify(D) + m[3] + src.slice(m.index + m[0].length));
console.log(`נכתב -> ${OUT} + הוזרק ל-${PAGE}`);
