// מזריק לדף הלוגיקה את טבלת "כבל ← קוטר צינור" מ-data/conduit_rules.json (המקור היחיד; האפליקציה
// קוראת את אותו קובץ דרך CONDUIT_RULES). הרצה: node scripts/logic-conduit.js
import { readFileSync, writeFileSync } from 'node:fs';
const PAGE = 'src/pages/logic.html';
const R = JSON.parse(readFileSync('data/conduit_rules.json', 'utf8'));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const html = `<!--CONDUIT-->
<h2>3 · כבל ← קוטר צינור מומלץ</h2>
<p class="note">${esc(R.note)} הטבלה הזאת היא המקור לעמודת "צינור" בלוח משיכת הכבלים של דוח המתקינים.</p>
<div class="scroll" style="max-height:none"><table>
<thead><tr><th>כבל</th><th>גידים × שטח חתך</th><th>צינור מומלץ</th></tr></thead>
<tbody>${R.rules.map(r => `<tr><td><b>${esc(r.cable)}</b></td><td>${r.cores} × ${r.mm} ממ״ר</td><td><b>${r.conduit}</b> מ״מ</td></tr>`).join('')}
${R.special.map(s => `<tr><td colspan="2">${esc(s.what)}</td><td><b>${s.conduit}</b> מ״מ</td></tr>`).join('')}</tbody></table></div>
<div class="logic" style="margin-top:8px"><b>חוט משיכה:</b> ${esc(R.pullWire)}</div>
<!--/CONDUIT-->`;
let s = readFileSync(PAGE, 'utf8');
if (/<!--CONDUIT-->[\s\S]*?<!--\/CONDUIT-->/.test(s)) s = s.replace(/<!--CONDUIT-->[\s\S]*?<!--\/CONDUIT-->/, html);
else s = s.replace(/(<h2>[^<]*&#x5D4;&#x5D4;&#x5D9;&#x5D2;&#x5D9;&#x5D5;&#x5DF; &#x5D4;&#x5DE;&#x5DC;&#x5D0;)/, html + '\n\n$1');
if (!s.includes('<!--CONDUIT-->')) throw new Error('anchor not found');
if (!s.includes('<meta charset')) s = '<meta charset="utf-8">\n' + s;
writeFileSync(PAGE, s);
console.log('logic.html: טבלת צינורות עודכנה (' + R.rules.length + ' כבלים, ' + R.special.length + ' מקרים מיוחדים)');
