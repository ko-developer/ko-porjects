// 🌐 שומר האנגלית — רץ מתוך scripts/validate.js (לפני כל קומיט, ובזרימת הפריסה ב-GitHub לפני כל פריסה).
// נכשל כש:
//   • יש טקסט עברי חדש בממשק (מחולץ מהמקור ב-scripts/i18n-extract.js) שאין לו אנגלית ב-data/i18n_en.json —
//     "מכוסה" בדיוק כמו בזמן ריצה (src/i18n.js): המפתח עצמו, גרסת גרש/גרשיים, בלי אימוג'י בתחילה, או כל חלק סביב מספר;
//   • ערך באנגלית שעדיין יש בו עברית, או שאיבד / הוסיף # (מספר).
// עברית שאינה ממשק (פרומפטים ל-AI, אוצר מילים של OCR, ביטויים רגולריים כמחרוזת, ערכים שמורים) — בין
// /* i18n-ignore */ … /* i18n-ignore-end */ במקור, או ב-data/i18n_ignore.json.
// מעקף לחירום בלבד: I18N_ALLOW_MISSING=1 — מדפיס את הרשימה ולא נכשל.
import { readFileSync, existsSync } from 'node:fs';
import { extract, PRECISE } from './i18n-extract.js';

const DICT = 'data/i18n_en.json', IGNORE = 'data/i18n_ignore.json';
const HEB = /[֐-׿]/;

export function check() {
  const D = JSON.parse(readFileSync(DICT, 'utf8'));
  const ignore = new Set(existsSync(IGNORE) ? JSON.parse(readFileSync(IGNORE, 'utf8')) : []);
  const has = k => !!(D[k] || D[k.replace(/״/g, '"').replace(/׳/g, "'")] || D[k.replace(/"/g, '״').replace(/'/g, '׳')]);
  const covered = k => {
    if (has(k)) return true;
    const m2 = /^([^\p{L}\p{N}#]+\s*)([\s\S]+)$/u.exec(k);   /* "🖊 ערוך" → "ערוך" */
    if (m2 && has(m2[2].trim())) return true;
    if (/#/.test(k)) {   /* "לומד מ-# דוגמאות": כל חלק סביב המספר */
      const parts = k.split('#').map(s => s.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').trim()).filter(s => HEB.test(s));
      if (parts.length && parts.every(has)) return true;
    }
    return false;
  };
  const missing = [...extract().entries()].filter(([k]) => !ignore.has(k) && !covered(k)).map(([k, f]) => ({ k, f }));
  const bad = Object.entries(D).filter(([k, v]) => typeof v !== 'string' || HEB.test(v) || (k.match(/#/g) || []).length !== (v.match(/#/g) || []).length).map(([k, v]) => ({ k, v }));
  return { missing, bad };
}

if (process.argv[1] && /i18n-check\.js$/.test(process.argv[1])) {
  /* בלי acorn (npm ci בלי תלויות פיתוח) החילוץ נופל לחיתוך הישן, שסופר כל regex עברי כ"חסר" — אז לא נכשלים על רעש */
  if (!PRECISE) { console.warn('i18n check skipped — acorn is not installed (npm ci without dev dependencies)'); process.exit(0); }
  const { missing, bad } = check();
  if (!missing.length && !bad.length) { console.log('i18n OK — every UI text has English'); process.exit(0); }
  if (missing.length) {
    console.error(`\n🌐 ${missing.length} טקסטים בעברית בלי אנגלית / ${missing.length} Hebrew UI texts have no English:`);
    for (const m of missing.slice(0, 40)) console.error('   ' + m.f + '  ' + JSON.stringify(m.k));
    if (missing.length > 40) console.error('   …');
  }
  if (bad.length) {
    console.error(`\n🌐 ${bad.length} ערכים פגומים ב-${DICT} (עברית בערך, או # שאבד) / bad English values:`);
    for (const b of bad.slice(0, 20)) console.error('   ' + JSON.stringify(b.k) + ' → ' + JSON.stringify(b.v));
  }
  console.error(`
מה לעשות / What to do:
  • טקסט ממשק חדש: npm run i18n (שרת הפיתוח רץ עם ANTHROPIC_API_KEY) או הוסף את האנגלית ידנית ל-${DICT}
    New UI text: run \`npm run i18n\` with the dev server up, or add the English to ${DICT} by hand.
  • עברית שאינה ממשק (פרומפט ל-AI, OCR, regex כמחרוזת, ערך שמור): עטוף ב-/* i18n-ignore */ … /* i18n-ignore-end */ או הוסף ל-${IGNORE}
    Hebrew that is not UI: wrap it in /* i18n-ignore */ … /* i18n-ignore-end */, or list it in ${IGNORE}.
  • חירום בלבד / emergency only: I18N_ALLOW_MISSING=1
`);
  process.exit(process.env.I18N_ALLOW_MISSING ? 0 : 1);
}
