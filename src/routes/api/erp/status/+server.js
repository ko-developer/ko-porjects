// סטטוס חיבור ה-ERP — האם מוגדר והאם ה-endpoint עונה (עם cache קצר)
import { json } from '@sveltejs/kit';
import { configured, callTool } from '$lib/server/erp.js';

let cache = null; // { at, body }

export async function GET() {
  if (!configured()) return json({ configured: false, ok: false });
  if (cache && Date.now() - cache.at < 60_000) return json(cache.body);
  let body;
  try {
    await callTool('get_offer_options', {});
    body = { configured: true, ok: true };
  } catch (e) {
    body = { configured: true, ok: false, error: String(e.message) };
  }
  cache = { at: Date.now(), body };
  return json(body);
}
