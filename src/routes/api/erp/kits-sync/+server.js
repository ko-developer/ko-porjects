// פרסום הקיטים ל-ERP — אותו ראוט כמו בשרת הלגאסי (scripts/erp-routes.js); ההעברה ב-scripts/erp-kits.js, הטוקן ב-scripts/erp-connect.js
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { isOwner, ownerOnly } from '$lib/server/owner.js';
import { pushKits } from '../../../../../scripts/erp-kits.js';
import { kitsStatus } from '../../../../../scripts/erp-connect.js';
import { makeStorage } from '../../../../../scripts/storage.js';

const storage = makeStorage();

/* מצב החיבור { configured, source, connected_at, connected_by } — בלי הטוקן */
export async function GET({ request, getClientAddress }) {
  if (!isOwner(request, getClientAddress)) return ownerOnly();
  return json(await kitsStatus(env, storage));
}

export async function POST({ request, url, getClientAddress }) {
  if (!isOwner(request, getClientAddress)) return ownerOnly();
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, errors: ['גוף הבקשה אינו JSON תקין'] }, { status: 400 }); }
  const sp = url.searchParams;
  const out = await pushKits(env, storage, body, sp.get('dry_run') === '1' || body?.dry_run === true, sp.get('allow_deactivate') === '1' || body?.allow_deactivate === true);
  return json(out.body, { status: out.status });
}
