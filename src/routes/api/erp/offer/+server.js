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
  const wantsProject = !!(p.project_id || p.project_name);
  if (!wantsProject && !p.account_key) errors.push('בחר פרויקט קיים או לקוח — הצעה חייבת שיוך');
  if (wantsProject && !p.infrastructure_transfer_method) errors.push('חסרה שיטת העברת תשתית (חובה בהצעת פרויקט)');
  if (wantsProject && !p.offer_name) errors.push('חסר שם הצעה (חובה בהצעת פרויקט)');
  const items = (p.items || []).filter(it => it.item_key && (+it.quantity || 0) >= 1);
  if (!items.length) errors.push('אין פריטים עם מק"ט ליצירת הצעה');
  if (errors.length) return json({ ok: false, errors }, { status: 400 });

  try {
    const args = {
      currency_code: p.currency_code || 'ILS',
      items: items.map(it => ({
        item_key: it.item_key,
        item_name: it.item_name,
        quantity: Math.max(1, Math.round(+it.quantity)),
        ...(it.unit_price != null ? { unit_price: +it.unit_price } : {}),
        ...(it.notes ? { notes: it.notes } : {})
      }))
    };
    if (p.offer_name) args.offer_name = p.offer_name;
    if (p.account_key) args.account_key = p.account_key; /* שיוך מפורש ללקוח */

    let note = '';
    if (wantsProject) {
      let pid = p.project_id;
      if (!pid) {
        /* נבחר שם בלבד — מנסים לאתר פרויקט קיים בעל אותו שם */
        const found = await callTool('list_projects', { search: p.project_name, limit: 10 });
        const rows = found?.projects || found?.rows || (Array.isArray(found) ? found : []);
        const proj = rows.find(r => (r.name || r.project_name) === p.project_name) || rows[0];
        pid = proj && (proj.id || proj.project_id || proj.uuid);
      }
      if (pid) {
        args.project_id = pid;
        args.infrastructure_transfer_method = p.infrastructure_transfer_method;
        if (p.shipment_method) args.shipment_method = p.shipment_method;
        if (p.shipping_address) args.shipping_address = p.shipping_address;
      } else if (p.account_key) {
        /* ה-ERP לא מאפשר ליצור פרויקט מכאן — במקום להיכשל, יוצרים הצעה ללקוח.
           שדות הפרויקט אסורים בהצעה כזו ולכן לא נשלחים. */
        note = `פרויקט "${p.project_name}" לא קיים ב-ERP — ההצעה נוצרה ללקוח בלבד. אפשר לשייך אותה לפרויקט בתוך ה-ERP.`;
      } else {
        return json({ ok: false, errors: [`פרויקט "${p.project_name}" לא נמצא ב-ERP, וגם לא נבחר לקוח. בחר פרויקט קיים מהרשימה, או בחר לקוח וסמן "הצעה ללקוח בלבד".`] }, { status: 404 });
      }
    }

    const result = await callTool('create_offer', args);
    return json({ ok: true, result, note, project_web_url: args.project_id ? projectWebUrl(args.project_id) : '', skipped_without_key: p.items_without_key || [] });
  } catch (e) {
    return json({ ok: false, errors: [String(e.message)] }, { status: 502 });
  }
}
