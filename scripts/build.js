// Assembles dist/index.html — a single self-contained file (Netlify drag-and-drop friendly).
// ההרכבה המשותפת (קוד + נתונים) יושבת ב-assemble.js ומשמשת גם את SvelteKit.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { assembleAppJs } from './assemble.js';

const app = assembleAppJs();
const tpl = readFileSync('src/index.template.html', 'utf8');
if (!tpl.includes('/*__APP__*/')) throw new Error('template marker missing');
const out = tpl.replace('/*__APP__*/', () => app);

mkdirSync('dist', { recursive: true });
writeFileSync('dist/index.html', out);
console.log(`build OK -> dist/index.html (${Math.round(out.length / 1024)}KB)`);

/* טבלאות העבודה — מטריצת ההתאמות וטבלאות ההיגיון: עמודים מקומיים של האפליקציה.
   המצב השמור מוזרק לתוך העמוד, כך ש-dist עומד בפני עצמו גם בלי השרת. */
for (const k of ['matrix', 'logic']) {
  let state = '{}';
  try { state = readFileSync(`data/page_state/${k}.json`, 'utf8'); } catch {}
  const page = readFileSync(`src/pages/${k}.html`, 'utf8')
    .replace(/(<script id="mstate" type="application\/json">)[\s\S]*?(<\/script>)/, (m, a, b) => a + state + b);
  writeFileSync(`dist/${k}.html`, page);
  console.log(`build OK -> dist/${k}.html (${Math.round(page.length / 1024)}KB)`);
}

/* תמונות גב המוצרים — מועתקות ל-dist/rear-img כדי שגם הפריסה הסטטית (Netlify) תציג את הגבים על התמונות */
try {
  mkdirSync('dist/rear-img', { recursive: true });
  let n = 0;
  for (const f of readdirSync('data/rear_images')) if (/\.(jpe?g|png|webp|gif)$/i.test(f)) { copyFileSync('data/rear_images/' + f, 'dist/rear-img/' + f); n++; }
  console.log(`build OK -> dist/rear-img/ (${n} images)`);
} catch (e) { console.warn('rear images not copied:', e.message); }
