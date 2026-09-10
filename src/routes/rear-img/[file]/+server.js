// /rear-img/<file> — תמונות גב מוצרים מ-data/rear_images (כמו בשרת הלגאסי)
import { readFileSync } from 'node:fs';

export function GET({ params }) {
  const f = String(params.file || '').replace(/[^A-Za-z0-9._-]/g, '');
  try {
    const buf = readFileSync('data/rear_images/' + f);
    const ct = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' }[f.split('.').pop().toLowerCase()] || 'application/octet-stream';
    return new Response(buf, { headers: { 'content-type': ct, 'cache-control': 'public, max-age=86400' } });
  } catch { return new Response('no image', { status: 404 }); }
}
