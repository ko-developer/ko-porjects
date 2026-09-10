// /rear-img/<file> — תמונות גב מוצרים: קודם שכבת האחסון (העלאות), אחרת הריפו data/rear_images
import { readFileSync, existsSync } from 'node:fs';
import { makeStorage } from '../../../../scripts/storage.js';

const storage = makeStorage();

export async function GET({ params }) {
  const f = String(params.file || '').replace(/[^A-Za-z0-9._-]/g, '');
  const buf = (await storage.read('rear_images/' + f)) || (existsSync('data/rear_images/' + f) ? readFileSync('data/rear_images/' + f) : null);
  if (!buf) return new Response('no image', { status: 404 });
  const ct = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' }[f.split('.').pop().toLowerCase()] || 'application/octet-stream';
  return new Response(buf, { headers: { 'content-type': ct, 'cache-control': 'public, max-age=86400' } });
}
