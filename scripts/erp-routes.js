// ראוטי ה-ERP של שרת הלגאסי (מחשב + ענן) — אותם ראוטים שקיימים ב-SvelteKit (src/routes/api/erp/*),
// שבלעדיהם דיאלוג "שלח הצעה ל-ERP" לא מצא לקוחות/פרויקטים והציג "אין חיבור ERP". בעלים בלבד.
import { erpCall } from './erp-client.js';

const TTL = 600_000;
const accCache = new Map(), prjCache = new Map();
let statusCache = null, optCache = null;
const configured = () => !!(process.env.ERP_MCP_URL && process.env.ERP_MCP_TOKEN);
function send(res, code, obj) { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(obj)); }
function readBody(req) { return new Promise((ok, no) => { const ch = []; req.on('data', c => ch.push(c)); req.on('end', () => { try { ok(JSON.parse(Buffer.concat(ch).toString('utf8') || '{}')); } catch (e) { no(e); } }); req.on('error', no); }); }
/* חיפוש עם מטמון לפי שאילתה; קידומת שכבר נשלפה מסוננת מקומית במקום סבב נוסף מול ה-ERP */
async function cachedSearch(cache, q, listKey, textOf, fetcher) {
  const hit = cache.get(q); if (hit && Date.now() - hit.at < TTL) return hit.body;
  for (let n = q.length - 1; n >= 2; n--) {
    const pre = cache.get(q.slice(0, n)); if (!pre || Date.now() - pre.at > TTL) continue;
    const t = q.toLowerCase(), sub = (pre.body[listKey] || []).filter(x => textOf(x).toLowerCase().includes(t));
    if (sub.length) { const body = { ok: true, [listKey]: sub }; cache.set(q, { at: Date.now(), body }); return body; }
    break;
  }
  const body = { ok: true, [listKey]: await fetcher() };
  cache.set(q, { at: Date.now(), body }); if (cache.size > 200) cache.delete(cache.keys().next().value);
  return body;
}
function projectWebUrl(id) {
  const tpl = process.env.ERP_WEB_PROJECT_URL; if (tpl) return tpl.replace('{id}', id);
  try { return new URL(process.env.ERP_MCP_URL).origin + '/projects/' + id; } catch { return ''; }
}

/* מחזיר true אם הבקשה טופלה */
export async function handleErp(req, res, path0, isOwner) {
  if (!path0.startsWith('/api/erp/') || path0 === '/api/erp/quotes' || path0 === '/api/erp/quote-items') return false;
  if (!isOwner) { send(res, 403, { ok: false, errors: ['owner only'] }); return true; }
  const sp = new URL(req.url, 'http://x').searchParams;
  try {
    if (path0 === '/api/erp/status') {
      /* טוען .env דרך erp-client בקריאה הראשונה — לכן בודקים configured אחרי ניסיון */
      if (statusCache && Date.now() - statusCache.at < 60_000) { send(res, 200, statusCache.body); return true; }
      let body;
      try { await erpCall('get_offer_options', {}); body = { configured: true, ok: true }; }
      catch (e) { body = { configured: configured(), ok: false, error: String(e.message) }; }
      statusCache = { at: Date.now(), body }; send(res, 200, body); return true;
    }
    if (path0 === '/api/erp/options') {
      if (!optCache || Date.now() - optCache.at > 3_600_000) optCache = { at: Date.now(), body: { ok: true, ...((await erpCall('get_offer_options', {})) || {}) } };
      send(res, 200, optCache.body); return true;
    }
    if (path0 === '/api/erp/accounts') {
      const q = (sp.get('q') || '').trim(); if (q.length < 2) { send(res, 200, { ok: true, accounts: [] }); return true; }
      const body = await cachedSearch(accCache, q, 'accounts', a => a.name + ' ' + a.key, async () => {
        const r = await erpCall('list_accounts', { search: q, limit: 60 }); const seen = new Set();
        return (r?.accounts || []).map(a => ({ key: String(a.AccountKey || '').replace(/["\s]/g, ''), name: (a.FullName || '').trim() }))
          .filter(a => { if (!a.key || !a.name) return false; const k = a.key + '|' + a.name; if (seen.has(k)) return false; seen.add(k); return true; });
      });
      send(res, 200, body); return true;
    }
    if (path0 === '/api/erp/projects') {
      const q = (sp.get('q') || '').trim(); if (q.length < 2) { send(res, 200, { ok: true, projects: [] }); return true; }
      const body = await cachedSearch(prjCache, q, 'projects', p => p.name + ' ' + (p.account || '') + ' ' + (p.address || ''), async () => {
        const r = await erpCall('list_projects', { search: q, limit: 40 }); const rows = r?.projects || r?.rows || (Array.isArray(r) ? r : []); const seen = new Set();
        return rows.map(p => ({ id: p.id || p.project_id || p.uuid || '', name: (p.name || p.project_name || '').trim(), account: (p.account_name || p.account || '').trim(), accountKey: String(p.account_key || '').replace(/["\s]/g, ''), address: (p.address || '').trim() }))
          .filter(p => { if (!p.id || !p.name || seen.has(p.id)) return false; seen.add(p.id); return true; });
      });
      send(res, 200, body); return true;
    }
    if (path0 === '/api/erp/item-future') {
      const key = (sp.get('key') || '').trim(); if (!key) { send(res, 400, { ok: false, errors: ['חסר מק"ט'] }); return true; }
      const r = await erpCall('list_order_items', { search: key, exclude_cancelled: true, limit: 500 });
      const items = r?.items || r?.rows || (Array.isArray(r) ? r : []); const CLOSED = /completed|delivered|cancelled|closed/i;
      const rows = items.filter(it => it.item_key === key && !it.is_cancelled && !CLOSED.test(it.order?.status || '') && ((+it.quantity || 0) - (+it.installed_qty || 0)) > 0)
        .map(it => ({ order_code: it.order?.order_code || '', account: it.order?.account_name || '', quantity: (+it.quantity || 0) - (+it.installed_qty || 0), status: it.order?.status || '', date: it.created_at || null }))
        .sort((a, b) => String(b.date).localeCompare(String(a.date)));
      send(res, 200, { ok: true, rows, committed: rows.reduce((s, x) => s + x.quantity, 0) }); return true;
    }
    if (path0 === '/api/erp/offer' && req.method === 'POST') {
      const p = await readBody(req); const errors = [];
      const wantsProject = !!(p.project_id || p.project_name);
      if (!wantsProject && !p.account_key) errors.push('בחר פרויקט קיים או לקוח — הצעה חייבת שיוך');
      if (wantsProject && !p.infrastructure_transfer_method) errors.push('חסרה שיטת העברת תשתית (חובה בהצעת פרויקט)');
      if (wantsProject && !p.offer_name) errors.push('חסר שם הצעה (חובה בהצעת פרויקט)');
      const items = (p.items || []).filter(it => it.item_key && (+it.quantity || 0) >= 1);
      if (!items.length) errors.push('אין פריטים עם מק"ט ליצירת הצעה');
      if (errors.length) { send(res, 400, { ok: false, errors }); return true; }
      const args = { currency_code: p.currency_code || 'ILS', items: items.map(it => ({ item_key: it.item_key, item_name: it.item_name, quantity: Math.max(1, Math.round(+it.quantity)), ...(it.unit_price != null ? { unit_price: +it.unit_price } : {}), ...(it.notes ? { notes: it.notes } : {}) })) };
      if (p.offer_name) args.offer_name = p.offer_name;
      if (p.account_key) args.account_key = p.account_key;
      let note = '';
      if (wantsProject) {
        let pid = p.project_id;
        if (!pid) { const found = await erpCall('list_projects', { search: p.project_name, limit: 10 }); const rows = found?.projects || found?.rows || (Array.isArray(found) ? found : []); const proj = rows.find(r => (r.name || r.project_name) === p.project_name) || rows[0]; pid = proj && (proj.id || proj.project_id || proj.uuid); }
        if (pid) { args.project_id = pid; args.infrastructure_transfer_method = p.infrastructure_transfer_method; if (p.shipment_method) args.shipment_method = p.shipment_method; if (p.shipping_address) args.shipping_address = p.shipping_address; }
        else if (p.account_key) note = `פרויקט "${p.project_name}" לא קיים ב-ERP — ההצעה נוצרה ללקוח בלבד. אפשר לשייך אותה לפרויקט בתוך ה-ERP.`;
        else { send(res, 404, { ok: false, errors: [`פרויקט "${p.project_name}" לא נמצא ב-ERP, וגם לא נבחר לקוח. בחר פרויקט קיים מהרשימה, או בחר לקוח וסמן "הצעה ללקוח בלבד".`] }); return true; }
      }
      const result = await erpCall('create_offer', args);
      send(res, 200, { ok: true, result, note, project_web_url: args.project_id ? projectWebUrl(args.project_id) : '', skipped_without_key: p.items_without_key || [] }); return true;
    }
  } catch (e) { send(res, 502, { ok: false, errors: [String(e.message || e)] }); return true; }
  send(res, 404, { ok: false, errors: ['unknown ERP route'] }); return true;
}
