// לקוח MCP קטן ל-ERP — אותו פרוטוקול של scripts/refresh-erp.js, לשימוש חי מהשרת
// (משיכת הצעות מחיר לתכנית). דורש ERP_MCP_URL / ERP_MCP_TOKEN ב-.env; בלעדיהם — שגיאה ברורה.
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
let sid = null, seq = 0, inited = false;

async function post(body, useSid = true) {
  loadEnv();
  const URL_ = process.env.ERP_MCP_URL, TOKEN = process.env.ERP_MCP_TOKEN;
  if (!URL_ || !TOKEN) throw new Error('חסר ERP_MCP_URL / ERP_MCP_TOKEN ב-.env — אין חיבור ל-ERP');
  const headers = { 'content-type': 'application/json', accept: 'application/json, text/event-stream', authorization: `Bearer ${TOKEN}`, 'mcp-protocol-version': PROTO };
  if (useSid && sid) headers['mcp-session-id'] = sid;
  const res = await fetch(URL_, { method: 'POST', headers, body: JSON.stringify(body) });
  const s = res.headers.get('mcp-session-id'); if (s) sid = s;
  if (res.status === 202) return null;
  const ct = res.headers.get('content-type') || '';
  let msg = null;
  if (ct.includes('text/event-stream')) {
    const datas = (await res.text()).split('\n').filter(l => l.startsWith('data:')).map(l => l.slice(5).trim()).filter(Boolean);
    if (datas.length) msg = JSON.parse(datas[datas.length - 1]);
  } else msg = await res.json().catch(() => null);
  if (!res.ok) { sid = null; inited = false; throw new Error(`ERP HTTP ${res.status}: ${JSON.stringify(msg).slice(0, 200)}`); }
  return msg;
}
async function init() {
  if (inited) return;
  await post({ jsonrpc: '2.0', id: ++seq, method: 'initialize', params: { protocolVersion: PROTO, capabilities: {}, clientInfo: { name: 'ko-projects', version: '1.0' } } }, false);
  await post({ jsonrpc: '2.0', method: 'notifications/initialized' });
  inited = true;
}
/* קריאה לכלי ERP; ניסיון חוזר אחד אם הסשן פג */
export async function erpCall(name, args) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await init();
      const r = await post({ jsonrpc: '2.0', id: ++seq, method: 'tools/call', params: { name, arguments: args || {} } });
      if (!r) throw new Error('ERP: no response');
      if (r.error) throw new Error(r.error.message);
      const res = r.result || {};
      if (res.isError) throw new Error((res.content || []).map(c => c.text).join('\n'));
      return res.structuredContent || JSON.parse((res.content || []).find(c => c.type === 'text')?.text || '{}');
    } catch (e) {
      if (attempt === 0 && /session|HTTP 4/i.test(String(e.message))) { sid = null; inited = false; continue; }
      throw e;
    }
  }
}
/* הצעות מחיר: כברירת מחדל רק מה שממתין לאישור לקוח (= הצעת מחיר פתוחה) */
export async function erpQuotes({ q = '', all = false, limit = 100 } = {}) {
  const args = { limit };
  if (q) args.search = q;
  if (!all) args.status = 'pending_customer_confirmation';
  const r = await erpCall('list_orders', args);
  return (r.orders || []).map(o => ({
    id: o.id, code: o.order_code, name: o.offer_name || '', account: o.account_name || o.account_key || '', accountKey: o.account_key || '',
    status: o.status, confirmed: !!o.customer_confirmed, total: o.total_amount || 0, subtotal: o.subtotal_amount || 0, items: o.items_count || 0,
    date: (o.created_at || '').slice(0, 10), project: o.project_id || null,
  }));
}
export async function erpQuoteItems(orderId) {
  const r = await erpCall('list_order_items', { order_id: orderId, limit: 1000, exclude_cancelled: true });
  return (r.items || []).filter(x => !x.is_cancelled).map(x => ({
    key: x.item_key || '', name: x.item_name || '', qty: +x.quantity || 1, price: +x.unit_price || 0, total: +x.total_price || 0, notes: x.notes || '',
  }));
}
