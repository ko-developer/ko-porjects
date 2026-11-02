// חילוץ מקטעי טקסט בעברית מהמקור (JS + HTML) למילון התרגום data/i18n_en.json.
// הגישה: לא מפרסרים JS — חותכים את הטקסט בגבולות של מחרוזות/תבניות/תגיות, ומפצלים במפרידים (· — | : ( ) \n) בדיוק כמו
// שכבת התרגום בזמן ריצה (src/i18n.js) מפצלת צמתי טקסט, כך שהמפתחות נפגשים. מספרים → #.
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
export const SRC = ['src/index.template.html', 'src/app.js', 'src/wizard.js', 'src/autoscale.js', 'src/plantext.js', 'src/sysdesign.js', 'src/soundreport.js', 'src/zonetrain.js', 'src/lighting.js', 'src/bgsharp.js'];
const HEB = /[֐-׿]/;
/* אותה נורמליזציה כמו בזמן ריצה: רווחים, מספרים → #, קיצוץ סימני פיסוק בקצוות */
export function normKey(s) {
  return String(s).replace(/\s+/g, ' ').replace(/\d+([.,]\d+)?/g, '#').replace(/^[\s#%₪$:,.;!?…\-–—()\[\]{}"'«»×*•·|/+=&~]+/, '').replace(/[\s#%₪$:,.;!?…\-–—()\[\]{}"'«»×*•·|/+=&~]+$/, '').trim();
}
/* מפצל מקטע למקטעי-משנה לפי המפרידים שבהם שכבת התרגום מפצלת */
export const SPLIT_RX = /(\s[·—|•]\s|\s[-–]\s|\n|\\n|<br\s*\/?>|:\s|\(|\)|\[|\]|\s\/\s|\.\s|\?\s|!\s|…)/;
export function pieces(s) { return String(s).split(SPLIT_RX).filter(p => p && !SPLIT_RX.test(p)); }
export function extract() {
  const keys = new Map();
  const add = (seg, file) => { for (const p of pieces(seg)) { if (!HEB.test(p)) continue; const k = normKey(p); if (k.length < 2 || !HEB.test(k)) continue; if (!keys.has(k)) keys.set(k, file); } };
  for (const f of SRC) {
    if (!existsSync(f)) continue;
    let t = readFileSync(f, 'utf8');
    /* הערות קוד: לא טקסט של ממשק */
    /* הערות בלוק רק כשה-"/*" פותח אחרי רווח/סימן (לא accept="image/*"); הערות שורה רק ב-JS; הערות HTML תמיד */
    t = t.replace(/<!--[\s\S]*?-->/g, ' ').replace(/(^|[\s;{}(),=\[])\/\*[\s\S]*?\*\//g, '$1 ');
    if (/\.js$/.test(f)) t = t.replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1 ');
    /* גבולות: ציטוטים, גרשיים, backtick, ${ }, תגיות HTML, ישויות — גרש/גרשיים בין אותיות עבריות (מק"ט, סה"כ) אינם גבול */
    const segs = t.split(/\$\{|\}|<\/?[a-zA-Z][^<>]*>|(?<![֐-׿])["']|["'](?![֐-׿])|`|&[a-z]+;|\\n/);
    for (const s of segs) if (HEB.test(s)) add(s, f);
  }
  return keys;
}
if (process.argv[1] && /i18n-extract\.js$/.test(process.argv[1])) {
  const keys = extract();
  const dictPath = 'data/i18n_en.json';
  const dict = existsSync(dictPath) ? JSON.parse(readFileSync(dictPath, 'utf8')) : {};
  const missing = [...keys.keys()].filter(k => !(k in dict));
  console.log('keys:', keys.size, 'translated:', Object.keys(dict).length, 'missing:', missing.length);
  if (process.argv.includes('--dump')) writeFileSync('/tmp/i18n-missing.txt', missing.join('\n'));
}
