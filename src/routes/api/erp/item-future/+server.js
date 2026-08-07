// כמויות עתידיות לפריט: שורות הזמנה פתוחות (טרם סופקו) על המק"ט, עם תאריכים
import { json } from '@sveltejs/kit';
import { callTool } from '$lib/server/erp.js';

export async function GET({ url }) {
  const key = (url.searchParams.get('key') || '').trim();
  if (!key) return json({ ok: false, errors: ['חסר מק"ט'] }, { status: 400 });
  try {
    const r = await callTool('list_order_items', { search: key, exclude_cancelled: true, limit: 500 });
    const items = r?.items || r?.rows || (Array.isArray(r) ? r : []);
    const CLOSED = /completed|delivered|cancelled|closed/i;
    const open = items.filter(it =>
      it.item_key === key && !it.is_cancelled &&
      !CLOSED.test(it.order?.status || '') &&
      ((+it.quantity || 0) - (+it.installed_qty || 0)) > 0
    );
    const rows = open.map(it => ({
      order_code: it.order?.order_code || '',
      account: it.order?.account_name || '',
      quantity: (+it.quantity || 0) - (+it.installed_qty || 0),
      status: it.order?.status || '',
      date: it.created_at || null
    })).sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const committed = rows.reduce((s, x) => s + x.quantity, 0);
    return json({ ok: true, rows, committed });
  } catch (e) {
    return json({ ok: false, errors: [String(e.message)] }, { status: 502 });
  }
}
