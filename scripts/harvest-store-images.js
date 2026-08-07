// קצירת תמונות מוצרים מחנות הווב (WooCommerce Store API, ציבורי) — מיפוי מק"ט → URL תמונה.
// שימוש: node scripts/harvest-store-images.js  →  data/erp_images.json
const out = {};
let total = 0, withImg = 0;
for (let page = 1; page <= 40; page++) {
  const res = await fetch(`https://store.kot.co.il/wp-json/wc/store/v1/products?per_page=100&page=${page}`);
  if (!res.ok) break;
  const items = await res.json();
  if (!items.length) break;
  for (const p of items) {
    total++;
    const sku = (p.sku || '').trim();
    const img = p.images && p.images[0];
    if (sku && img && (img.thumbnail || img.src)) { out[sku] = img.thumbnail || img.src; withImg++; }
  }
  console.log(`page ${page}: ${total} products, ${withImg} with image+sku`);
  if (items.length < 100) break;
}
const { writeFileSync } = await import('node:fs');
writeFileSync('data/erp_images.json', JSON.stringify(out));
console.log(`✓ wrote ${Object.keys(out).length} sku→image mappings -> data/erp_images.json`);
