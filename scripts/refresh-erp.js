// רענון קטלוג הפריטים מה-ERP (MCP) — כולל מחיר ומלאי חיים.
// פורמט הפלט תואם-לאחור: [key, name, price, qty] — הקוד הקיים קורא רק [0],[1].
// שימוש: node scripts/refresh-erp.js   (דורש ERP_MCP_URL/ERP_MCP_TOKEN ב-.env)
import { readFileSync, writeFileSync } from 'node:fs';

for (const line of readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}
const URL_ = process.env.ERP_MCP_URL, TOKEN = process.env.ERP_MCP_TOKEN;
if (!URL_ || !TOKEN) { console.error('חסר ERP_MCP_URL/ERP_MCP_TOKEN ב-.env'); process.exit(1); }

const PROTO = '2025-06-18';
let sid = null, seq = 0;
async function post(body, useSid = true) {
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
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(msg).slice(0, 200)}`);
  return msg;
}
async function call(name, args) {
  const r = await post({ jsonrpc: '2.0', id: ++seq, method: 'tools/call', params: { name, arguments: args } });
  if (r.error) throw new Error(r.error.message);
  const res = r.result || {};
  if (res.isError) throw new Error((res.content || []).map(c => c.text).join('\n'));
  return res.structuredContent || JSON.parse((res.content || []).find(c => c.type === 'text')?.text || '{}');
}

await post({ jsonrpc: '2.0', id: ++seq, method: 'initialize', params: { protocolVersion: PROTO, capabilities: {}, clientInfo: { name: 'ko-refresh', version: '1.0' } } }, false);
await post({ jsonrpc: '2.0', method: 'notifications/initialized' });

const items = [];
let page = 1, pages = 1;
do {
  const r = await call('list_items', { page, limit: 1000 });
  pages = r.total_pages || 1;
  for (const it of r.items || []) items.push([it.ItemKey, it.ItemName, it.Price ?? 0, it.Quantity ?? 0]);
  console.log(`page ${page}/${pages} — ${items.length} items`);
  page++;
} while (page <= pages);

items.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
writeFileSync('data/erp_items.json', JSON.stringify(items));
console.log(`✓ wrote ${items.length} items (with price+stock) -> data/erp_items.json`);

/* מראת SQLite (ko.sqlite) — אותם נתונים לשימוש עתידי כ-DB אמיתי */
const { DatabaseSync } = await import('node:sqlite');
const db = new DatabaseSync('data/ko.sqlite');
db.exec('DROP TABLE IF EXISTS items');
db.exec('CREATE TABLE items(key TEXT PRIMARY KEY, name TEXT NOT NULL, price REAL, qty REAL)');
db.exec('CREATE INDEX idx_items_name ON items(name)');
db.exec('BEGIN');
const ins = db.prepare('INSERT OR REPLACE INTO items(key, name, price, qty) VALUES(?,?,?,?)');
for (const [k, n, p, q] of items) ins.run(String(k), String(n), +p || 0, +q || 0);
db.exec('COMMIT');
console.log('✓ synced data/ko.sqlite items table');
