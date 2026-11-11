// לקוח MCP קטן ל-ERP — אותו פרוטוקול של scripts/refresh-erp.js, לשימוש חי מהשרת
// (משיכת הצעות מחיר לתכנית). שתי דרכים: auth = { url, token } — הטוקן של האדם שנכנס עם KO ERP (scripts/erp-login.js),
// כך שמה שנוצר ב-ERP נרשם עליו (התחילית שלו, לא MCP-); בלי auth — ERP_MCP_URL / ERP_MCP_TOKEN מה-.env (טוקן משותף).
import { readFileSync } from 'node:fs';

function loadEnv() {
  try {
    for (const line of readFileSync('.env', 'utf8').split('\n')) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch {}
}
const PROTO = '2025-06-18';
let seq = 0;
/* מצב סשן MCP לכל טוקן (משותף / של כל אדם); טוקני אנשים מתחלפים כל שעה, לכן המפה מוגבלת */
const SESS = new Map();
function target(auth) {
  if (auth && auth.url && auth.token) return { url: auth.url, token: auth.token, key: 'u:' + auth.token.slice(0, 16) };
  loadEnv();
  const URL_ = process.env.ERP_MCP_URL, TOKEN = process.env.ERP_MCP_TOKEN;
  if (!URL_ || !TOKEN) throw new Error('חסר ERP_MCP_URL / ERP_MCP_TOKEN ב-.env — אין חיבור ל-ERP');
  return { url: URL_, token: TOKEN, key: 'shared' };
}
function sessOf(t) {
  let s = SESS.get(t.key);
  if (!s) { s = { sid: null, inited: false }; SESS.set(t.key, s); while (SESS.size > 50) SESS.delete(SESS.keys().next().value); }
  return s;
}

async function post(t, body, useSid = true) {
  const st = sessOf(t);
  const headers = { 'content-type': 'application/json', accept: 'application/json, text/event-stream', authorization: `Bearer ${t.token}`, 'mcp-protocol-version': PROTO };
  if (useSid && st.sid) headers['mcp-session-id'] = st.sid;
  const res = await fetch(t.url, { method: 'POST', headers, body: JSON.stringify(body) });
  const s = res.headers.get('mcp-session-id'); if (s) st.sid = s;
  if (res.status === 202) return null;
  const ct = res.headers.get('content-type') || '';
  let msg = null;
  if (ct.includes('text/event-stream')) {
    const datas = (await res.text()).split('\n').filter(l => l.startsWith('data:')).map(l => l.slice(5).trim()).filter(Boolean);
    if (datas.length) msg = JSON.parse(datas[datas.length - 1]);
  } else msg = await res.json().catch(() => null);
  if (!res.ok) { st.sid = null; st.inited = false; throw Object.assign(new Error(`ERP HTTP ${res.status}: ${JSON.stringify(msg).slice(0, 200)}`), { status: res.status }); }
  return msg;
}
async function init(t) {
  const st = sessOf(t);
  if (st.inited) return;
  await post(t, { jsonrpc: '2.0', id: ++seq, method: 'initialize', params: { protocolVersion: PROTO, capabilities: {}, clientInfo: { name: 'ko-projects', version: '1.0' } } }, false);
  await post(t, { jsonrpc: '2.0', method: 'notifications/initialized' });
  st.inited = true;
}
/* קריאה לכלי ERP; ניסיון חוזר אחד אם הסשן פג. auth — ראה למעלה */
export async function erpCall(name, args, auth) {
  const t = target(auth);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await init(t);
      const r = await post(t, { jsonrpc: '2.0', id: ++seq, method: 'tools/call', params: { name, arguments: args || {} } });
      if (!r) throw new Error('ERP: no response');
      if (r.error) throw new Error(r.error.message);
      const res = r.result || {};
      if (res.isError) throw new Error((res.content || []).map(c => c.text).join('\n'));
      return res.structuredContent || JSON.parse((res.content || []).find(c => c.type === 'text')?.text || '{}');
    } catch (e) {
      if (attempt === 0 && e.status !== 401 && e.status !== 403 && /session|HTTP 4/i.test(String(e.message))) { const st = sessOf(t); st.sid = null; st.inited = false; continue; }
      throw e;
    }
  }
}
/* הצעות מחיר: כברירת מחדל רק מה שממתין לאישור לקוח (= הצעת מחיר פתוחה) */
/* שמות פרויקטים לפי מזהה — נטענים פעם בשעה (list_projects), כדי להציג לאיזה פרויקט שייכת כל הצעה */
let prjNames = { at: 0, map: new Map() };
async function projectNames(auth) {
  if (Date.now() - prjNames.at < 3_600_000 && prjNames.map.size) return prjNames.map;
  try {
    const r = await erpCall('list_projects', { limit: 500 }, auth); const rows = r?.projects || r?.rows || (Array.isArray(r) ? r : []);
    const m = new Map(); for (const p of rows) { const id = p.id || p.project_id || p.uuid; if (id) m.set(id, (p.name || p.project_name || '').trim()); }
    prjNames = { at: Date.now(), map: m };
  } catch { prjNames.at = Date.now(); }
  return prjNames.map;
}
export async function erpQuotes({ q = '', all = false, limit = 200 } = {}, auth) {
  const args = { limit };
  if (q) args.search = q;
  if (!all) args.status = 'pending_customer_confirmation';
  const r = await erpCall('list_orders', args, auth);
  const pn = await projectNames(auth);
  /* ב-ERP אין להצעה כותרת: offer_name הוא שם המסלול (אספקת סחורה / פרויקט ללקוח…) — מוחזר כ-track */
  return (r.orders || []).map(o => ({
    id: o.id, code: o.order_code, name: '', track: o.offer_name || '', account: o.account_name || o.account_key || '', accountKey: o.account_key || '',
    status: o.status, confirmed: !!o.customer_confirmed, total: o.total_amount || 0, subtotal: o.subtotal_amount || 0, items: o.items_count || 0,
    date: (o.created_at || '').slice(0, 10), project: o.project_id || null, projectName: (o.project_id && pn.get(o.project_id)) || '',
  }));
}
/* אינדקס ההצעות למנהל הפרויקטים: כל ההזמנות (חדשות קודם, דפים של 500) — קוד, תאריך, סטטוס, אישור לקוח, פרויקט ב-ERP */
export async function erpOrdersIndex(auth) {
  const out = [], seen = new Set(); let before = '';
  for (let page = 0; page < 4; page++) {
    const args = { limit: 500 }; if (before) args.created_before = before;
    const r = await erpCall('list_orders', args, auth);
    const rows = r.orders || [];
    for (const o of rows) { if (!o.id || seen.has(o.id)) continue; seen.add(o.id);
      out.push({ id: o.id, code: o.order_code || '', status: o.status || '', confirmed: !!o.customer_confirmed, confirmedAt: (o.customer_confirmed_at || '').slice(0, 10), date: (o.created_at || '').slice(0, 10), project: o.project_id || null, accountKey: o.account_key || '', total: o.total_amount || 0, track: o.offer_name || '' }); }
    if (rows.length < 500) break;
    const last = rows[rows.length - 1].created_at; if (!last || last === before) break; before = last;
  }
  return out;
}
export async function erpQuoteItems(orderId, auth) {
  const r = await erpCall('list_order_items', { order_id: orderId, limit: 1000, exclude_cancelled: true }, auth);
  return (r.items || []).filter(x => !x.is_cancelled).map(x => ({
    key: x.item_key || '', name: x.item_name || '', qty: +x.quantity || 1, price: +x.unit_price || 0, total: +x.total_price || 0, notes: x.notes || '',
  }));
}
