// חיפוש לקוחות (חשבונות) מה-ERP — לפי שאילתה, לשדה בחירת הלקוח בהצעה.
// 11K+ לקוחות — אין טעם לטעון הכל; מחפשים חי עם cache קצר לכל שאילתה.
import { json } from '@sveltejs/kit';
import { callTool } from '$lib/server/erp.js';

const cache = new Map(); // q -> { at, body }

export async function GET({ url }) {
  const q = (url.searchParams.get('q') || '').trim();
  if (q.length < 2) return json({ ok: true, accounts: [] });
  const hit = cache.get(q);
  if (hit && Date.now() - hit.at < 120_000) return json(hit.body);
  try {
    const r = await callTool('list_accounts', { search: q, limit: 50 });
    const rows = r?.accounts || [];
    const accounts = rows.map(a => ({
      key: String(a.AccountKey || '').replace(/["\s]/g, ''),
      name: (a.FullName || '').trim()
    })).filter(a => a.key && a.name);
    const body = { ok: true, accounts };
    cache.set(q, body ? { at: Date.now(), body } : undefined);
    if (cache.size > 200) cache.delete(cache.keys().next().value);
    return json(body);
  } catch (e) {
    return json({ ok: false, errors: [String(e.message)] }, { status: 502 });
  }
}
