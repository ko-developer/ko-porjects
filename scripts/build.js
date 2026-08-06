// Assembles dist/index.html — a single self-contained file (Netlify drag-and-drop friendly).
// Data lives in data/*.json (flat files, later a real DB); the app in src/app.js.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const DATA = ['ERP_ITEMS', 'ERP_PRICES', 'ERP_KITS', 'ERP_CATALOG'];
let app = readFileSync('src/app.js', 'utf8');

for (const name of DATA) {
  const json = readFileSync(`data/${name.toLowerCase()}.json`, 'utf8');
  const marker = `/*__DATA:${name}__*/`;
  if (!app.includes(marker)) throw new Error(`marker missing: ${name}`);
  app = app.replace(marker, `const ${name} = ${json};`);
}

const tpl = readFileSync('src/index.template.html', 'utf8');
if (!tpl.includes('/*__APP__*/')) throw new Error('template marker missing');
const out = tpl.replace('/*__APP__*/', () => app);

mkdirSync('dist', { recursive: true });
writeFileSync('dist/index.html', out);
console.log(`build OK -> dist/index.html (${Math.round(out.length / 1024)}KB)`);
