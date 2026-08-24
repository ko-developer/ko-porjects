// אפשרויות ההצעה מה-ERP (get_offer_options) — שיטות העברת תשתית/משלוח, מע"מ וסטטוסים.
import { json } from '@sveltejs/kit';
import { callTool } from '$lib/server/erp.js';

let cache = null;

export async function GET() {
  if (cache && Date.now() - cache.at < 3_600_000) return json(cache.body);
  try {
    const r = await callTool('get_offer_options', {});
    const body = { ok: true, ...(r || {}) };
    cache = { at: Date.now(), body };
    return json(body);
  } catch (e) {
    return json({ ok: false, errors: [String(e.message)] }, { status: 502 });
  }
}
