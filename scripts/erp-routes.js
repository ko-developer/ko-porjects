// ראוטי ה-ERP של שרת הלגאסי (מחשב + ענן) — אותם ראוטים שקיימים ב-SvelteKit (src/routes/api/erp/*),
// שבלעדיהם דיאלוג "שלח הצעה ל-ERP" לא מצא לקוחות/פרויקטים והציג "אין חיבור ERP". בעלים בלבד.
import { erpCall } from './erp-client.js';
import { kitsSyncConfig, pushKits } from './erp-kits.js';

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
/* שם פרויקט כמו שה-ERP משווה (create_project / new_project): בלי רווחים מיותרים ובלי הבדלי אותיות */
const sameName = (a, b) => { const n = s => String(s || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase(); return n(a) === n(b); };
const accKey = k => String(k || '').replace(/["\s]/g, '');
function projectWebUrl(id) {
  const tpl = process.env.ERP_WEB_PROJECT_URL; if (tpl) return tpl.replace('{id}', id);
  try { return new URL(process.env.ERP_MCP_URL).origin + '/project/' + id; } catch { return ''; }   /* דף פרויקט ב-ERP: /project/<id> */
}

/* מחזיר true אם הבקשה טופלה */
export async function handleErp(req, res, path0, isOwner) {
  if (!path0.startsWith('/api/erp/') || path0 === '/api/erp/quotes' || path0 === '/api/erp/quote-items') return false;
  if (!isOwner) { send(res, 403, { ok: false, errors: ['owner only'] }); return true; }
  /* כתיבה רק כ-JSON: טופס מאתר אחר (text/plain / form) לא יכול לשלוח בשם הבעלים הצעה או פרסום קיטים */
  if (req.method !== 'GET' && req.method !== 'HEAD' && !/^application\/json\b/i.test(req.headers['content-type'] || '')) { send(res, 415, { ok: false, errors: ['content-type חייב להיות application/json'] }); return true; }
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
      if (wantsProject && !p.project_id && !p.account_key) errors.push('בחר לקוח — פרויקט חדש נוצר ב-ERP על החשבון של הלקוח');
      if (wantsProject && !p.infrastructure_transfer_method) errors.push('חסרה שיטת העברת תשתית (חובה בהצעת פרויקט)');
      if (wantsProject && !p.offer_name) errors.push('חסר שם הצעה (חובה בהצעת פרויקט)');
      const items = (p.items || []).filter(it => it.item_key && (+it.quantity || 0) >= 1);
      if (!items.length) errors.push('אין פריטים עם מק"ט ליצירת הצעה');
      if (errors.length) { send(res, 400, { ok: false, errors }); return true; }
      const args = { currency_code: p.currency_code || 'ILS', items: items.map(it => ({ item_key: it.item_key, item_name: it.item_name, quantity: Math.max(1, Math.round(+it.quantity)), ...(it.unit_price != null ? { unit_price: +it.unit_price } : {}), ...(it.notes ? { notes: it.notes } : {}) })) };
      if (p.offer_name) args.offer_name = p.offer_name;
      if (p.account_key) args.account_key = p.account_key;
      /* אופן המשלוח נשלח תמיד — גם בהצעה ללקוח בלבד. אין "ללא משלוח": בלי שיטה ה-ERP קורא את ההזמנה כקריאת שירות והמחסן לא רואה אותה */
      args.shipment_method = p.shipment_method || 'warehouse_pickup';
      if (p.shipping_address) args.shipping_address = p.shipping_address;
      let note = '';
      if (wantsProject) {
        args.infrastructure_transfer_method = p.infrastructure_transfer_method;
        let pid = p.project_id;
        if (!pid) {
          /* שם בלבד: פרויקט של הלקוח הזה בשם זהה, אחרת ה-ERP יוצר אותו עם ההצעה (new_project). לעולם לא "הראשון ברשימה" — הוא יכול להיות של לקוח אחר */
          const found = await erpCall('list_projects', { account_key: p.account_key, limit: 500 });   /* כל פרויקטי הלקוח, בלי search: חיפוש ה-ERP מחליף ( ) , ברווח ולא מוצא רווח כפול — השוואת השם כאן (sameName) */
          const rows = found?.projects || found?.rows || (Array.isArray(found) ? found : []);
          const same = rows.find(r => accKey(r.account_key) === accKey(p.account_key) && sameName(r.project_name || r.name, p.project_name));
          if (same) { pid = same.id || same.project_id; note = `ללקוח כבר יש פרויקט "${(same.project_name || same.name || '').trim()}" ב-ERP — ההצעה נוספה אליו.`; }
          else args.new_project = { project_name: String(p.project_name).trim(), ...(p.project_address ? { address: String(p.project_address).trim() } : {}) };
        }
        if (pid) args.project_id = pid;
      }
      const result = await erpCall('create_offer', args);
      const pid = (result && result.project_id) || args.project_id;
      send(res, 200, { ok: true, result, note, project_web_url: pid ? projectWebUrl(pid) : '', skipped_without_key: p.items_without_key || [] }); return true;
    }
    /* פרסום הקיטים ל-ERP (scripts/erp-kits.js). GET = האם מוגדר — הכפתור במסך הקיטים מציג למה הוא מושבת */
    if (path0 === '/api/erp/kits-sync') {
      if (req.method === 'GET') { send(res, 200, { ok: true, configured: kitsSyncConfig(process.env).configured }); return true; }
      if (req.method !== 'POST') { send(res, 405, { ok: false, errors: ['POST only'] }); return true; }
      let body;
      try { body = await readBody(req); } catch { send(res, 400, { ok: false, errors: ['גוף הבקשה אינו JSON תקין'] }); return true; }
      const out = await pushKits(process.env, body, sp.get('dry_run') === '1' || body.dry_run === true, sp.get('allow_deactivate') === '1' || body.allow_deactivate === true);
      send(res, out.status, out.body); return true;
    }
  } catch (e) { send(res, 502, { ok: false, errors: [String(e.message || e)] }); return true; }
  send(res, 404, { ok: false, errors: ['unknown ERP route'] }); return true;
}
