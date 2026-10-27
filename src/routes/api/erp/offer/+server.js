// יצירת הצעה ב-ERP: פרויקט קיים / פרויקט חדש (new_project) / לקוח בלבד → create_offer, ישירות מול ה-MCP
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { callTool } from '$lib/server/erp.js';

// כתובת דף הפרויקט באפליקציית ה-ERP — תבנית עם {id}; ברירת מחדל: origin של ה-MCP + /project/{id}
function projectWebUrl(id) {
  const tpl = env.ERP_WEB_PROJECT_URL;
  if (tpl) return tpl.replace('{id}', id);
  try { return new URL(env.ERP_MCP_URL).origin + '/project/' + id; } catch { return ''; }
}
/* שם פרויקט כמו שה-ERP משווה (create_project / new_project): בלי רווחים מיותרים ובלי הבדלי אותיות */
const sameName = (a, b) => { const n = s => String(s || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase(); return n(a) === n(b); };
const accKey = k => String(k || '').replace(/["\s]/g, '');

export async function POST({ request }) {
  const p = await request.json();
  const errors = [];
  const wantsProject = !!(p.project_id || p.project_name);
  if (!wantsProject && !p.account_key) errors.push('בחר פרויקט קיים או לקוח — הצעה חייבת שיוך');
  if (wantsProject && !p.project_id && !p.account_key) errors.push('בחר לקוח — פרויקט חדש נוצר ב-ERP על החשבון של הלקוח');
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
    /* אופן המשלוח נשלח תמיד — גם בהצעה ללקוח בלבד. אין "ללא משלוח": בלי שיטה ה-ERP קורא את ההזמנה כקריאת שירות והמחסן לא רואה אותה */
    args.shipment_method = p.shipment_method || 'warehouse_pickup';
    if (p.shipping_address) args.shipping_address = p.shipping_address;

    let note = '';
    if (wantsProject) {
      args.infrastructure_transfer_method = p.infrastructure_transfer_method;
      let pid = p.project_id;
      if (!pid) {
        /* שם בלבד: פרויקט של הלקוח הזה בשם זהה, אחרת ה-ERP יוצר אותו עם ההצעה (new_project).
           לעולם לא "הראשון ברשימה" — הוא יכול להיות של לקוח אחר */
        const found = await callTool('list_projects', { account_key: p.account_key, limit: 500 });   /* כל פרויקטי הלקוח, בלי search: חיפוש ה-ERP מחליף ( ) , ברווח ולא מוצא רווח כפול — השוואת השם כאן (sameName) */
        const rows = found?.projects || found?.rows || (Array.isArray(found) ? found : []);
        const same = rows.find(r => accKey(r.account_key) === accKey(p.account_key) && sameName(r.project_name || r.name, p.project_name));
        if (same) {
          pid = same.id || same.project_id;
          note = `ללקוח כבר יש פרויקט "${(same.project_name || same.name || '').trim()}" ב-ERP — ההצעה נוספה אליו.`;
        } else {
          args.new_project = { project_name: String(p.project_name).trim(), ...(p.project_address ? { address: String(p.project_address).trim() } : {}) };
        }
      }
      if (pid) args.project_id = pid;
    }

    const result = await callTool('create_offer', args);
    const pid = (result && result.project_id) || args.project_id;
    return json({ ok: true, result, note, project_web_url: pid ? projectWebUrl(pid) : '', skipped_without_key: p.items_without_key || [] });
  } catch (e) {
    return json({ ok: false, errors: [String(e.message)] }, { status: 502 });
  }
}
