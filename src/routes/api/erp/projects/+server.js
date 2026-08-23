// חיפוש פרויקטים קיימים ב-ERP — לבורר הפרויקט בהצעה.
// ה-MCP לא תומך ביצירת פרויקט, ולכן חייבים לבחור פרויקט שכבר קיים (או לוותר ולשייך ללקוח).
import { json } from '@sveltejs/kit';
import { callTool } from '$lib/server/erp.js';

const cache = new Map(); // q -> { at, body }
const TTL = 600_000;

export async function GET({ url }) {
  const q = (url.searchParams.get('q') || '').trim();
  if (q.length < 2) return json({ ok: true, projects: [] });
  const hit = cache.get(q);
  if (hit && Date.now() - hit.at < TTL) return json(hit.body);
  /* קידומת שכבר נשלפה — סינון מקומי במקום סבב נוסף מול ה-ERP */
  for (let n = q.length - 1; n >= 2; n--) {
    const pre = cache.get(q.slice(0, n));
    if (!pre || Date.now() - pre.at > TTL) continue;
    const t = q.toLowerCase();
    const sub = (pre.body.projects || []).filter(p => (p.name + ' ' + (p.account || '') + ' ' + (p.address || '')).toLowerCase().includes(t));
    if (sub.length) { const body = { ok: true, projects: sub }; cache.set(q, { at: Date.now(), body }); return json(body); }
    break;
  }
  try {
    const r = await callTool('list_projects', { search: q, limit: 40 });
    const rows = r?.projects || r?.rows || (Array.isArray(r) ? r : []);
    const seen = new Set();
    const projects = rows.map(p => ({
      id: p.id || p.project_id || p.uuid || '',
      name: (p.name || p.project_name || '').trim(),
      account: (p.account_name || p.account || '').trim(),
      accountKey: String(p.account_key || '').replace(/["\s]/g, ''),
      address: (p.address || '').trim()
    })).filter(p => {
      if (!p.id || !p.name || seen.has(p.id)) return false;
      seen.add(p.id); return true;
    });
    const body = { ok: true, projects };
    cache.set(q, { at: Date.now(), body });
    if (cache.size > 200) cache.delete(cache.keys().next().value);
    return json(body);
  } catch (e) {
    return json({ ok: false, errors: [String(e.message)] }, { status: 502 });
  }
}
