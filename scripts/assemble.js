// הרכבת האפליקציה — משותף ל-build הקובץ-הבודד (Netlify) ולנתיבי SvelteKit.
// המקור האחיד: src/app.js + סמני /*__DATA:NAME__*/ + src/index.template.html.
import { readFileSync } from 'node:fs';

export const DATA = ['ERP_ITEMS', 'ERP_PRICES', 'ERP_KITS', 'ERP_CATALOG', 'ERP_IMAGES'];

// JS מלא של האפליקציה עם נתוני ה-ERP מוזרקים + אשף הזרימה (V2)
export function assembleAppJs() {
  let app = readFileSync('src/app.js', 'utf8');
  for (const name of DATA) {
    const json = readFileSync(`data/${name.toLowerCase()}.json`, 'utf8');
    const marker = `/*__DATA:${name}__*/`;
    if (!app.includes(marker)) throw new Error(`marker missing: ${name}`);
    app = app.replace(marker, `const ${name} = ${json};`);
  }
  try { app += '\n' + readFileSync('src/wizard.js', 'utf8'); } catch (e) { /* אשף אופציונלי */ }
  return app;
}

// חיתוך ה-template לחלקים לשימוש עטיפת SvelteKit: CSS + תוכן ה-body (בלי סקריפט הסיום)
export function templateParts() {
  const tpl = readFileSync('src/index.template.html', 'utf8');
  const css = tpl.slice(tpl.indexOf('<style>') + 7, tpl.indexOf('</style>'));
  const bodyInner = tpl.slice(tpl.indexOf('<body>') + 6, tpl.indexOf('<script>/*__APP__*/'));
  if (!css || !bodyInner) throw new Error('template structure changed — update templateParts()');
  return { css, bodyInner };
}
