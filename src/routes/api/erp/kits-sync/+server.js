// פרסום הקיטים ל-ERP — אותו ראוט כמו בשרת הלגאסי (scripts/erp-routes.js); ההעברה עצמה ב-scripts/erp-kits.js
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { kitsSyncConfig, pushKits } from '../../../../../scripts/erp-kits.js';

/* בעלים בלבד. ב-SvelteKit אין משתמשים — כמו בשרת הלגאסי (scripts/auth.js isLocal): בקשה מהמחשב עצמו = הבעלים */
function isOwner(request, getClientAddress) {
  if (request.headers.get('x-forwarded-for')) return false;
  const a = String(getClientAddress() || '');
  return a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1';
}

export function GET({ request, getClientAddress }) {
  if (!isOwner(request, getClientAddress)) return json({ ok: false, errors: ['owner only'] }, { status: 403 });
  return json({ ok: true, configured: kitsSyncConfig(env).configured });
}

export async function POST({ request, url, getClientAddress }) {
  if (!isOwner(request, getClientAddress)) return json({ ok: false, errors: ['owner only'] }, { status: 403 });
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, errors: ['גוף הבקשה אינו JSON תקין'] }, { status: 400 }); }
  const out = await pushKits(env, body, url.searchParams.get('dry_run') === '1' || body?.dry_run === true);
  return json(out.body, { status: out.status });
}
