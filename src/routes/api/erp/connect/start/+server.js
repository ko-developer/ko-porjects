// "חיבור ל-ERP": state + PKCE בזיכרון השרת → 302 לדף האישור ב-ERP (scripts/erp-connect.js)
import { env } from '$env/dynamic/private';
import { isOwner, ownerOnly } from '$lib/server/owner.js';
import { connectStart } from '../../../../../../scripts/erp-connect.js';

export function GET({ request, url, getClientAddress }) {
  if (!isOwner(request, getClientAddress)) return ownerOnly();
  return new Response(null, { status: 302, headers: { location: connectStart(env, url.origin), 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' } });
}
