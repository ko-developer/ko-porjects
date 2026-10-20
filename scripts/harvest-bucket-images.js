// קצירת תמונות מוצרים מהדלי הציבורי של אתר החנות (storage.googleapis.com/ko-wp-images) — מיפוי מק"ט → URL.
// האתר מגיש את תמונות המוצרים משם (lazy-load): <SKU>.png|jpg = תמונה ראשית, <SKU>_1.jpg… = גלריה.
// שימוש: node scripts/harvest-bucket-images.js  →  data/erp_images.json (תמונת הדלי גוברת על התמונה הממוזערת מה-Store API)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const BUCKET = 'ko-wp-images', BASE = 'https://storage.googleapis.com/' + BUCKET + '/';
const erp = JSON.parse(readFileSync('data/erp_items.json', 'utf8'));
const keys = new Set(erp.map(it => it[0]));
const prev = existsSync('data/erp_images.json') ? JSON.parse(readFileSync('data/erp_images.json', 'utf8')) : {};
const items = []; let tok = '';
for (let i = 0; i < 100; i++) {
  const u = 'https://storage.googleapis.com/storage/v1/b/' + BUCKET + '/o?maxResults=1000&fields=items(name,size,md5Hash,updated),nextPageToken' + (tok ? '&pageToken=' + encodeURIComponent(tok) : '');
  const r = await fetch(u); if (!r.ok) { console.error('list failed', r.status); process.exit(1); }
  const j = await r.json(); (j.items || []).forEach(x => items.push(x)); tok = j.nextPageToken; if (!tok) break;
}
console.log('objects in bucket:', items.length);
/* קובץ שחוזר עשרות פעמים באותו hash = תמונת placeholder — לא נכנסת */
const byHash = {}; items.forEach(x => { byHash[x.md5Hash] = (byHash[x.md5Hash] || 0) + 1; });
const placeholder = new Set(Object.entries(byHash).filter(([, n]) => n >= 50).map(([h]) => h));
const main = {}, gallery = {};
items.forEach(x => {
  const m = /^([A-Za-z0-9\-]+?)(?:_(\d+))?\.(png|jpe?g|webp)$/i.exec(x.name); if (!m) return;
  const sku = m[1]; if (!keys.has(sku) || placeholder.has(x.md5Hash) || +x.size < 1500) return;
  if (m[2]) (gallery[sku] = gallery[sku] || []).push(BASE + x.name);
  else if (!main[sku] || /\.png$/i.test(x.name)) main[sku] = BASE + x.name;   /* png עדיף על jpg כשיש שניהם */
});
const out = { ...prev }; let replaced = 0, added = 0;
for (const [sku, url] of Object.entries(main)) { if (out[sku] && out[sku] !== url) replaced++; else if (!out[sku]) added++; out[sku] = url; }
writeFileSync('data/erp_images.json', JSON.stringify(out));
console.log(`✓ data/erp_images.json: ${Object.keys(out).length} מק"טים עם תמונה (מהדלי: ${Object.keys(main).length} · חדשים: ${added} · הוחלפו: ${replaced} · גלריה ל-${Object.keys(gallery).length})`);
