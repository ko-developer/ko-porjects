// לקוח MCP מינימלי מול שרת ה-ERP (Streamable HTTP, JSON-RPC).
// תצורה ב-.env: ERP_MCP_URL + ERP_MCP_TOKEN (אותו endpoint/token של קונקטור Claude).
import { env } from '$env/dynamic/private';

const PROTO = '2025-06-18';
let sid = null;
let seq = 0;

export function configured() {
  return !!(env.ERP_MCP_URL && env.ERP_MCP_TOKEN);
}

async function post(body, useSid = true) {
  const headers = {
    'content-type': 'application/json',
    accept: 'application/json, text/event-stream',
    authorization: `Bearer ${env.ERP_MCP_TOKEN}`,
    'mcp-protocol-version': PROTO
  };
  if (useSid && sid) headers['mcp-session-id'] = sid;
  const res = await fetch(env.ERP_MCP_URL, { method: 'POST', headers, body: JSON.stringify(body) });
  const s = res.headers.get('mcp-session-id');
  if (s) sid = s;
  if (res.status === 202) return null; // notification התקבלה
  let msg = null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('text/event-stream')) {
    const datas = (await res.text()).split('\n').filter(l => l.startsWith('data:')).map(l => l.slice(5).trim()).filter(Boolean);
    if (datas.length) msg = JSON.parse(datas[datas.length - 1]);
  } else {
    msg = await res.json().catch(() => null);
  }
  if (!res.ok) throw new Error(`ERP MCP HTTP ${res.status}: ${msg ? JSON.stringify(msg).slice(0, 300) : res.statusText}`);
  return msg;
}

async function ensureInit() {
  if (sid) return;
  const r = await post({
    jsonrpc: '2.0', id: ++seq, method: 'initialize',
    params: { protocolVersion: PROTO, capabilities: {}, clientInfo: { name: 'ko-projects-app', version: '1.0.0' } }
  }, false);
  if (r && r.error) { sid = null; throw new Error('MCP initialize failed: ' + r.error.message); }
  await post({ jsonrpc: '2.0', method: 'notifications/initialized' });
}

// קריאת כלי: מחזיר את התוכן המפוענח (structuredContent או JSON מתוך text)
export async function callTool(name, args = {}) {
  if (!configured()) throw new Error('חיבור ERP לא מוגדר — קבע ERP_MCP_URL ו-ERP_MCP_TOKEN בקובץ .env');
  await ensureInit();
  let r;
  try {
    r = await post({ jsonrpc: '2.0', id: ++seq, method: 'tools/call', params: { name, arguments: args } });
  } catch (e) {
    sid = null; // session אולי פג — אתחול וניסיון נוסף אחד
    await ensureInit();
    r = await post({ jsonrpc: '2.0', id: ++seq, method: 'tools/call', params: { name, arguments: args } });
  }
  if (r?.error) throw new Error(r.error.message || 'MCP error');
  const result = r?.result || {};
  if (result.isError) {
    throw new Error((result.content || []).map(c => c.text || '').filter(Boolean).join('\n') || 'ERP tool error');
  }
  if (result.structuredContent) return result.structuredContent;
  const txt = (result.content || []).find(c => c.type === 'text')?.text ?? '';
  try { return JSON.parse(txt); } catch { return txt; }
}
