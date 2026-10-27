// פרסום הקיטים ל-ERP: PUT ${ERP_API_URL}/api/external/kits עם טוקן שירות משלו (ERP_KITS_TOKEN, מקור ko-projects) — לא דרך MCP.
// משותף לשרת הלגאסי (scripts/erp-routes.js, מה שרץ בענן) ולראוט SvelteKit (src/routes/api/erp/kits-sync).
// הרשימה שנשלחת מלאה: קיט ERP שלא נמצא בה מושבת ב-ERP (is_active=false), לא נמחק. ?dry_run=1 מחזיר את אותו דוח בלי לכתוב.
// ה-ERP מסרב (409 would_deactivate_many) לפרסום שמשבית יותר מדי קיטים שבאו מכאן — גם בבדיקה — אלא אם נשלח ?allow_deactivate=1.

export function kitsSyncConfig(env) {
  const base = String(env.ERP_API_URL || '').trim().replace(/\/+$/, '');
  const token = String(env.ERP_KITS_TOKEN || '').trim();
  return { base, token, configured: !!(base && token) };
}

const errText = x => typeof x === 'string' ? x : x && typeof x === 'object' ? (x.message || JSON.stringify(x)) : String(x);

/* מחזיר { status, body } — ה-body של ה-ERP כמו שהוא כשהצליח; בכישלון תמיד ok:false + errors (מערך מחרוזות) + erp_status */
export async function pushKits(env, body, dry, allowDeactivate) {
  const { base, token, configured } = kitsSyncConfig(env);
  if (!configured) return { status: 503, body: { ok: false, errors: ['פרסום ל-ERP עוד לא הוגדר בשרת'] } };
  if (!body || !Array.isArray(body.kits)) return { status: 400, body: { ok: false, errors: ['חסרה רשימת kits'] } };
  /* רשימה ריקה הייתה משביתה ב-ERP את כל הקיטים — לא נשלחת */
  if (!body.kits.length) return { status: 400, body: { ok: false, errors: ['רשימת הקיטים ריקה — לא נשלחה ל-ERP'] } };
  let r;
  try {
    const q = new URLSearchParams();
    if (dry) q.set('dry_run', '1');
    if (allowDeactivate) q.set('allow_deactivate', '1');
    const qs = q.toString();
    r = await fetch(base + '/api/external/kits' + (qs ? '?' + qs : ''), {
      method: 'PUT',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ kits: body.kits }),
      signal: AbortSignal.timeout(120e3)
    });
  } catch (e) {
    return { status: 502, body: { ok: false, errors: ['ה-ERP לא ענה: ' + (e.message || e)] } };
  }
  const text = await r.text();
  let j = null;
  try { j = JSON.parse(text); } catch {}
  if (r.ok && j && j.ok !== false) return { status: 200, body: j };
  const errs = j && typeof j === 'object' ? [].concat(j.errors ?? j.error ?? j.message ?? []).map(errText) : [];
  if (errs.length && j.field) errs[0] += ' (' + j.field + ')';
  if (errs.length && j.details != null) errs[0] += ': ' + [].concat(j.details).map(errText).join('; ');
  return {
    status: r.ok ? 502 : r.status,
    body: { ...(j && typeof j === 'object' ? j : {}), ok: false, erp_status: r.status, errors: errs.length ? errs : ['ERP HTTP ' + r.status + (text ? ': ' + text.slice(0, 200) : '')] }
  };
}
