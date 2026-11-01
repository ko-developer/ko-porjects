// דוחות KO (דף /reports) — הנתונים החיים מה-ERP לתקופה: הזמנות/הצעות, שורות הפריטים שלהן והפרויקטים.
// הצבירה (לפי חודש / לקוח / פריט / קטגוריה / סטטוס) נעשית בדף, כדי שסינון (רק מאושרות, חיפוש) לא ידרוש סבב נוסף מול ה-ERP.
// list_orders מוגבל ל-500 שורות בלי עימוד → דפדוף לפי created_before; ל-list_order_items אין סינון תאריך →
// משיכה אחת של 1,000 השורות האחרונות, וההזמנות שלא כוסו מושלמות לפי order_id (במקביל, עד 6 בבת אחת).
import { readFileSync } from 'node:fs';
import { erpCall } from './erp-client.js';

const TTL = 300_000;           /* דוח לתקופה נשמר 5 דקות */
const cache = new Map();
const MAX_ORDERS = 20000, MAX_ITEM_FETCH = 1500;   /* 1,500 הזמנות ≈ 2 דקות השלמה ברקע; מעבר לזה דוחות הפריטים חלקיים (מסומן בדף) */

let filtersCache = null;
function itemFilters() {
  if (filtersCache) return filtersCache;
  try { filtersCache = JSON.parse(readFileSync('data/erp_filters.json', 'utf8')); } catch { filtersCache = {}; }
  return filtersCache;
}
/* קטגוריה לפי קידומת המק"ט (מבנה המק"טים ב-ERP) + שדה Filter (RENT = השכרה) */
export function itemCategory(key, filter) {
  const k = String(key || '').toUpperCase();
  if (/^RENT$/i.test(filter || '') || /^R[A-Z]/.test(k)) return 'השכרה';
  if (/^\d/.test(k)) return 'שירותים וכללי';
  if (/^S/.test(k)) return 'סאונד';
  if (/^(L|ARC|LA)/.test(k)) return 'תאורה';
  if (/^V/.test(k)) return 'וידאו';
  if (/^(CA|C)/.test(k)) return 'כבלים ומחברים';
  if (/^G/.test(k)) return 'במה, טראס ואביזרים';
  return 'אחר';
}
const day = s => String(s || '').slice(0, 10);
/* כל ההזמנות בתקופה: דפדוף אחורה לפי created_before כשהתשובה מלאה (500) */
async function allOrders(from, to) {
  const out = [], seen = new Set();
  let before = to ? to + 'T23:59:59.999Z' : null;
  for (let round = 0; round < MAX_ORDERS / 500; round++) {
    const args = { limit: 500 };
    if (from) args.created_after = from + 'T00:00:00.000Z';
    if (before) args.created_before = before;
    const r = await erpCall('list_orders', args);
    const rows = r?.orders || [];
    let oldest = null;
    for (const o of rows) { if (seen.has(o.id)) continue; seen.add(o.id); out.push(o); if (!oldest || o.created_at < oldest) oldest = o.created_at; }
    if (rows.length < 500 || !oldest || oldest === before) break;
    before = oldest;
  }
  return out;
}
/* שורות הפריטים של ההזמנות: משיכה כללית אחת (מהירה), וההשלמה לפי order_id להזמנות שלא כוסו רצה ברקע —
   הדוח חוזר מיד עם מה שיש (pending = כמה הזמנות עוד מושלמות) והדף שואל שוב עד שההשלמה נגמרת (שומר-הסף של השרת מגביל בקשה ל-40 שניות) */
async function bulkItems(orders) {
  const byOrder = new Set(orders.map(o => o.id));
  const items = [], seen = new Set();
  const take = it => { if (seen.has(it.id) || it.is_cancelled || !byOrder.has(it.order_id)) return false; seen.add(it.id); items.push(it); return true; };
  const r = await erpCall('list_order_items', { limit: 1000, exclude_cancelled: true });
  const bulk = r?.items || [];
  let oldest = null;
  for (const it of bulk) { take(it); if (!oldest || it.created_at < oldest) oldest = it.created_at; }
  /* הזמנה לא כוסתה אם היא ישנה מהשורה הישנה ביותר שנמשכה (הזמנה צעירה יותר שלא הופיעה — אין לה שורות) */
  const covered = new Set(bulk.map(it => it.order_id));
  const full = bulk.length < 1000;
  const missing = orders.filter(o => (o.items_count || 0) > 0 && !covered.has(o.id) && !(full || (oldest && o.created_at > oldest)));
  return { items, take, missing };
}
async function completeItems(body, take, missing, filters) {
  const todo = missing.slice(0, MAX_ITEM_FETCH); body.itemsPartial = missing.length - todo.length; body.pending = todo.length;
  for (let i = 0; i < todo.length; i += 10) {
    await Promise.all(todo.slice(i, i + 10).map(async o => {
      try { const rr = await erpCall('list_order_items', { order_id: o.id, limit: 1000, exclude_cancelled: true }); for (const it of rr?.items || []) if (take(it)) body.items.push(normItem(it, filters)); }
      catch { body.itemsPartial++; }
    }));
    body.pending = Math.max(0, todo.length - i - 10);
  }
  body.pending = 0; body.doneAt = Date.now();
}
const normItem = (it, filters) => ({
  order: it.order_id, key: it.item_key || '', name: it.item_name || '', qty: +it.quantity || 0, price: +it.unit_price || 0, discount: +it.discount_amount || 0, total: +it.total_price || 0,
  installed: +it.installed_qty || 0, returned: +it.returned_qty || 0, invoiced: +it.invoiced_qty || 0, cat: itemCategory(it.item_key, filters[it.item_key]), date: day(it.created_at),
});
/* פרויקטים בתקופה — אותו דפדוף אחורה כמו בהזמנות (list_projects מוגבל ל-500 בלי עימוד) */
async function projectsInRange(from, to) {
  const out = [], seen = new Set();
  let before = to ? to + 'T23:59:59.999Z' : null;
  for (let round = 0; round < 40; round++) {
    const args = { limit: 500 };
    if (from) args.created_after = from + 'T00:00:00.000Z';
    if (before) args.created_before = before;
    const r = await erpCall('list_projects', args);
    const rows = r?.projects || r?.rows || [];
    let oldest = null;
    for (const p of rows) { if (seen.has(p.id)) continue; seen.add(p.id); out.push(p); if (!oldest || p.created_at < oldest) oldest = p.created_at; }
    if (rows.length < 500 || !oldest || oldest === before) break;
    before = oldest;
  }
  return out;
}
let prjAll = { at: 0, rows: [] };
async function projects(from, to) {
  const inRange = await projectsInRange(from, to);
  /* שמות לפרויקטים של הזמנות בתקופה שנפתחו לפני התקופה — 500 האחרונים, פעם בשעה */
  if (Date.now() - prjAll.at > 3_600_000) { try { const a = await erpCall('list_projects', { limit: 500 }); prjAll = { at: Date.now(), rows: a?.projects || a?.rows || [] }; } catch { prjAll.at = Date.now(); } }
  return { inRange, all: prjAll.rows };
}
export async function erpReport({ from = '', to = '' } = {}) {
  const key = from + '|' + to;
  /* מטמון: כל עוד ההשלמה ברקע רצה — התשובה תמיד מהמטמון (אחרת הסקרים של הדף היו מתחילים הכול מחדש); אחרי שנגמרה — 5 דקות מהסיום */
  const hit = cache.get(key); if (hit && (hit.body.pending > 0 || Date.now() - (hit.body.doneAt || hit.at) < TTL)) return hit.body;
  const t0 = Date.now();
  const [orders, prj] = await Promise.all([allOrders(from, to), projects(from, to)]);
  const names = new Map(); for (const p of [...prj.all, ...prj.inRange]) names.set(p.id, p.project_name || p.name || '');
  const filters = itemFilters();
  const { items: rawItems, take, missing } = await bulkItems(orders);
  const body = {
    ok: true, from, to, at: new Date().toISOString(), ms: Date.now() - t0, itemsPartial: 0, pending: 0,
    orders: orders.map(o => ({
      id: o.id, code: o.order_code || '', track: o.offer_name || '', accountKey: String(o.account_key || '').replace(/["\s]/g, ''), account: (o.account_name || '').trim(),
      status: o.status || '', acct: o.accounting_status || '', deliv: o.delivery_status || '', confirmed: !!o.customer_confirmed, confirmedAt: day(o.customer_confirmed_at),
      subtotal: +o.subtotal_amount || 0, discount: +o.discount_total || 0, vat: +o.vat_amount || 0, total: +o.total_amount || 0, due: +o.due_amount || 0,
      project: o.project_id || '', projectName: (o.project_id && names.get(o.project_id)) || '', date: day(o.created_at), updated: day(o.updated_at), n: +o.items_count || 0,
    })),
    items: rawItems.map(it => normItem(it, filters)),
    projects: prj.inRange.map(p => ({
      id: p.id, name: (p.project_name || p.name || '').trim(), accountKey: String(p.account_key || '').replace(/["\s]/g, ''), account: (p.account_name || '').trim(),
      address: p.address || '', date: day(p.created_at), orders: +p.orders_count || 0,
    })),
  };
  cache.set(key, { at: Date.now(), body }); if (cache.size > 30) cache.delete(cache.keys().next().value);
  /* ההשלמה ממשיכה ברקע על אותו אובייקט שבמטמון — הבקשה הבאה מקבלת יותר שורות ו-pending קטן יותר */
  if (missing.length) { body.pending = Math.min(missing.length, MAX_ITEM_FETCH); completeItems(body, take, missing, filters).catch(e => { console.warn('erp report items', e); body.pending = 0; body.doneAt = Date.now(); }); }
  return body;
}
export function reportInvalidate() { cache.clear(); }
