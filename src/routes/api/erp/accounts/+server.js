// חיפוש לקוחות (חשבונות) מה-ERP — לפי שאילתה, לשדה בחירת הלקוח בהצעה.
// 11K+ לקוחות — אין טעם לטעון הכל; מחפשים חי עם cache קצר לכל שאילתה.
import { json } from '@sveltejs/kit';
import { callTool } from '$lib/server/erp.js';

const cache = new Map(); // q -> { at, body }

export async function GET({ url }) {
  const q = (url.searchParams.get('q') || '').trim();
  if (q.length < 2) return json({ ok: true, accounts: [] });
  const hit = cache.get(q);
  if (hit && Date.now() - hit.at < 600_000) return json(hit.body);
  /* קידומת שכבר נשלפה — מסננים ממנה מיידית במקום עוד סבב מול ה-ERP */
  for (let n = q.length - 1; n >= 2; n--) {
    const pre = cache.get(q.slice(0, n));
    if (!pre || Date.now() - pre.at > 600_000) continue;
    const t = q.toLowerCase();
    const sub = (pre.body.accounts || []).filter(a => (a.name + ' ' + a.key).toLowerCase().includes(t));
    if (sub.length) { const body = { ok: true, accounts: sub }; cache.set(q, { at: Date.now(), body }); return json(body); }
    break;
  }
  try {
    const r = await callTool('list_accounts', { search: q, limit: 60 });
    const rows = r?.accounts || [];
    const seen = new Set();
    const accounts = rows.map(a => ({
      key: String(a.AccountKey || '').replace(/["\s]/g, ''),
      name: (a.FullName || '').trim()
    })).filter(a => {
      if (!a.key || !a.name) return false;
      const k = a.key + '|' + a.name;
      if (seen.has(k)) return false;   /* אותו חשבון חוזר מה-ERP — מוצג פעם אחת */
      seen.add(k); return true;
    });
    const body = { ok: true, accounts };
    cache.set(q, body ? { at: Date.now(), body } : undefined);
    if (cache.size > 200) cache.delete(cache.keys().next().value);
    return json(body);
  } catch (e) {
    return json({ ok: false, errors: [String(e.message)] }, { status: 502 });
  }
}
