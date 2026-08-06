// יצירת הצעת פרויקט ב-ERP: איתור הפרויקט → create_offer, ישירות מול ה-MCP
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { callTool } from '$lib/server/erp.js';

// כתובת דף הפרויקט באפליקציית ה-ERP — תבנית עם {id}; ברירת מחדל: origin של ה-MCP + /projects/{id}
function projectWebUrl(id) {
  const tpl = env.ERP_WEB_PROJECT_URL;
  if (tpl) return tpl.replace('{id}', id);
  try { return new URL(env.ERP_MCP_URL).origin + '/projects/' + id; } catch { return ''; }
}

export async function POST({ request }) {
  const p = await request.json();
  const errors = [];
  if (!p.project_name) errors.push('חסר שם פרויקט');
  if (!p.offer_name) errors.push('חסר שם הצעה (חובה בהצעת פרויקט)');
  if (!p.infrastructure_transfer_method) errors.push('חסרה שיטת העברת תשתית');
  const items = (p.items || []).filter(it => it.item_key && (+it.quantity || 0) >= 1);
  if (!items.length) errors.push('אין פריטים עם מק"ט ליצירת הצעה');
  if (errors.length) return json({ ok: false, errors }, { status: 400 });

  try {
    // איתור הפרויקט לפי שם (התאמה מדויקת עדיפה, אחרת הראשון)
    const found = await callTool('list_projects', { search: p.project_name, limit: 10 });
    const rows = found?.projects || found?.rows || (Array.isArray(found) ? found : []);
    const proj = rows.find(r => (r.name || r.project_name) === p.project_name) || rows[0];
    if (!proj) return json({ ok: false, errors: [`פרויקט "${p.project_name}" לא נמצא ב-ERP`] }, { status: 404 });

    const args = {
      project_id: proj.id || proj.project_id || proj.uuid,
      offer_name: p.offer_name,
      infrastructure_transfer_method: p.infrastructure_transfer_method,
      currency_code: p.currency_code || 'ILS',
      items: items.map(it => ({
        item_key: it.item_key,
        item_name: it.item_name,
        quantity: Math.max(1, Math.round(+it.quantity)),
        ...(it.unit_price != null ? { unit_price: +it.unit_price } : {}),
        ...(it.notes ? { notes: it.notes } : {})
      }))
    };
    if (p.shipment_method) args.shipment_method = p.shipment_method;
    if (p.shipping_address) args.shipping_address = p.shipping_address;

    const result = await callTool('create_offer', args);
    return json({ ok: true, result, project_web_url: projectWebUrl(args.project_id), skipped_without_key: p.items_without_key || [] });
  } catch (e) {
    return json({ ok: false, errors: [String(e.message)] }, { status: 502 });
  }
}
