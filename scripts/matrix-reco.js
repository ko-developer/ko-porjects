// המלצות יצרן + כלל גודל לטופ↔סאב.
// 1. Funktion-One — מה שכתוב באתר היצרן (funktion-one.com, נקרא 2026-09-07) על אילו ארונות בס
//    מתאימים לאילו טופים, כולל יחס כשצוין (SB8A: 2×F5.2 · SB10A: 2×F81.2). נכנס כ-D.reco.
// 2. כלל גודל לכל המותגים: סאב שהוופר שלו קטן מהוופר של הטופ = לא הגיוני → D.autoNo (✗ אוטומטי,
//    ניתן לדריסה בלחיצה על התא). גדלים: מפה ידנית ל-Funktion-One, אחרת מתיאור הפריט ב-ERP.
// הרצה: node scripts/matrix-reco.js
import { readFileSync, writeFileSync } from 'node:fs';
const PAGE = 'src/pages/matrix.html';
const src = readFileSync(PAGE, 'utf8');
const MRX = /(<script id="mdata" type="application\/json">)([\s\S]*?)(<\/script>)/;
const mm = src.match(MRX); if (!mm) throw new Error('mdata not found');
const D = JSON.parse(mm[2]);
const F1 = 'https://funktion-one.com/product/';
/* --- אתר Funktion-One: לכל סאב, אילו טופים מומלצים (ציטוט) --- */
const RECO = [
  { sub: 'SB8', tops: ['F5', 'F55', 'F81'], v: { 'F5': '2:1' }, q: 'SB8A: satellite outputs for 2x F5.2; bass extension for the F5, F55 or F81.2 in a 2.1 system', url: F1 + 'sb8-compact-range/' },
  { sub: 'SB10', tops: ['F5', 'F81'], v: { 'F81': '2:1' }, q: 'SB10A: satellite outputs for 2 x F81.2; bass extension for the F5.2 or F81.2', url: F1 + 'sb10-compact-range/' },
  { sub: 'SB12', tops: ['F81', 'F101', 'F55'], q: 'SB12 works with the F81.2 and F101.2 as the low frequency reinforcement · F55: SB10, SB12, SB212LP, BR115 make the perfect complement', url: F1 + 'sb12-compact-range/' },
  { sub: 'SB212LP', tops: ['F101', 'F1201', 'F55'], q: 'SB212LP combines with F101.2 and F1201.2 as the low frequency reinforcement', url: F1 + 'sb212lp-compact-range/' },
  { sub: 'BR115', tops: ['F81', 'F55'], q: 'BR115: ideal for mobile systems with F81.2 · F55 lists BR115 as complement', url: F1 + 'br115/' },
  { sub: 'MB 112', tops: ['F81', 'F5', 'F55', 'F61'], q: 'F81s are ideally complemented with our MB112 · MB112 pairs with Compact Range loudspeakers', url: F1 + 'mb112/' },
  { sub: 'MB 212', tops: ['F88', 'F101', 'F81', 'F1201'], q: 'F88: MB212, F118 or BR118 · F101: MB210LP, MB212, F118, F215 · MB212 provides bass extension to Compact Range', url: F1 + 'mb212/' },
  { sub: 'MB 210 LP', tops: ['F101', 'F81', 'F88'], q: 'F101 forms a potent system with MB210LP, MB212, F118 and F215 · Microbass 210: bass extension to the smaller Funktion-One loudspeakers', url: F1 + 'mb210/' },
  { sub: 'F118', tops: ['F101', 'F1201', 'F88'], q: 'F118 MkII: pole mount for use with F101, F1201, F88, R1 and R2SH', url: F1 + 'f118-mk2/' },
  { sub: 'BR118', tops: ['F88', 'F101', 'F1201'], q: 'F88: MB212, F118 or BR118 · BR118 pairs exceptionally well with a wide range of Funktion-One loudspeakers', url: F1 + 'br118/' },
  { sub: 'F121', tops: ['EVO6E', 'F1201', 'F101'], q: 'F121 can be used with virtually all Funktion-One mid-high loudspeakers · Evo 6E: F124, F121, F221 or BR221', url: F1 + 'f121/' },
  { sub: 'F124', tops: ['EVO6E'], q: 'F124: the perfect bass partner for Evo systems · Evo 6E recommends F124, F121, F221 or BR221', url: F1 + 'f124/' },
  { sub: 'BR121', tops: ['EVO6E'], q: 'BR121 provides excellent results when paired with the Evo 6E or Evo X for a medium club system', url: F1 + 'br121/' },
  { sub: 'F115 MK2', tops: ['F101', 'F1201'], q: 'F115 MkII = single-15 version of F215 · F101 lists F215 as partner (אין ציטוט ישיר ל-F115)', url: F1 + 'f115-mk2/', weak: true },
];
/* גדלי וופרים (אינץ׳) — Funktion-One לפי דפי היצרן; שאר המותגים מתיאור הפריט */
const SIZE = { 'F5': 5, 'F5 / F5.2': 5, 'F55': 5, 'F61': 6, 'F81': 8, 'F101': 10, 'F1201': 12, 'F88': 8, 'EVO6E': 15, 'EVO 6E': 15,
  'SB8': 8, 'SB 8': 8, 'SB10': 10, 'SB12': 12, 'SB212LP': 12, 'MB 112': 12, 'MB 212': 12, 'MB 210 LP': 10, 'BR115': 15, 'BR118': 18, 'BR121': 21, 'BR121 BASS REFLEX ': 21,
  'F115 MK2': 15, 'F118': 18, 'F121': 21, 'F124': 24, 'F218': 18 };
const norm = m => m.replace(/\s*\/.*$/, '').replace(/\.2$/, '').trim();          /* "F81 / F81.2" → "F81" */
function sizeOf(model) {
  const n = norm(model);
  if (SIZE[model] != null) return SIZE[model];
  if (SIZE[n] != null) return SIZE[n];
  const fn = (D.fn || {})[model] || '';
  let m = /וופר\s*(\d{1,2})|(\d{1,2})\s*(?:"|״|׳׳|אינץ|inch)|(?:\d\s*[x×*]\s*)?"?(\d{1,2})"(?!\d)/i.exec(fn);
  if (m) { const v = +(m[1] || m[2] || m[3]); if (v >= 4 && v <= 32) return v; }
  m = /(?:MS|TILL|SUB|E|CLUB|IWAC|PAGAZ\s?1)(\d)?(\d{2})\b/i.exec(model);           /* MS18, TILL 15, SUB118, E218B */
  if (m) { const v = +m[2]; if (v >= 8 && v <= 21) return v; }
  return null;
}
const sub = D.mx.sub; const role = D.role || {};
/* MB112 / MB212 — ארונות בס לפי האתר (היו רשומים כטופים) */
for (const k of ['MB 112', 'MB 212']) if (role[k] !== 'sub') { role[k] = 'sub'; }
sub.all = [...new Set([...(sub.all || []), ...sub.rows, ...sub.cols])];
sub.rows = sub.all.filter(m => role[m] !== 'sub'); sub.cols = sub.all.filter(m => role[m] === 'sub');
D.reco = {}; D.autoNo = {}; D.size = {};
const tops = sub.rows, subs = sub.cols;
const findModel = key => sub.all.find(m => norm(m) === key || m === key || norm(m).replace(/\s/g, '') === key.replace(/\s/g, ''));
for (const r of RECO) {
  const sModel = findModel(r.sub); if (!sModel) continue;
  for (const t of r.tops) {
    const tModel = tops.find(m => norm(m) === t || norm(m).replace(/\s/g, '') === t.replace(/\s/g, ''));
    if (!tModel) continue;
    D.reco[tModel + '|' + sModel] = { v: (r.v || {})[t] || 'ok', why: 'Funktion-One: ' + r.q, url: r.url, weak: !!r.weak };
  }
}
for (const m of sub.all) { const s = sizeOf(m); if (s) D.size[m] = s; }
let nNo = 0;
for (const t of tops) for (const s of subs) {
  const k = t + '|' + s; if (D.reco[k]) continue;
  const ts = D.size[t], ss = D.size[s];
  if (ts && ss && ss < ts) { D.autoNo[k] = 'סאב ' + ss + '″ קטן מהוופר של הטופ (' + ts + '″) — לא הגיוני'; nNo++; }
}
writeFileSync(PAGE, src.slice(0, mm.index) + mm[1] + JSON.stringify(D) + mm[3] + src.slice(mm.index + mm[0].length));
console.log(`המלצות יצרן: ${Object.keys(D.reco).length} זוגות · ✗ אוטומטי לפי גודל: ${nNo} · גדלים ידועים: ${Object.keys(D.size).length}/${sub.all.length}`);
