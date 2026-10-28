// החזרה מדף האישור ב-ERP: state נבדק ונצרך, ה-code מוחלף בטוקן (שרת-לשרת), והטוקן נשמר בצד השרת בלבד (scripts/erp-connect.js)
import { env } from '$env/dynamic/private';
import { isOwner, ownerOnly } from '$lib/server/owner.js';
import { connectCallback } from '../../../../../../scripts/erp-connect.js';
import { makeStorage } from '../../../../../../scripts/storage.js';

const storage = makeStorage();

export async function GET({ request, url, getClientAddress }) {
  if (!isOwner(request, getClientAddress)) return ownerOnly();
  const location = await connectCallback(env, storage, url.searchParams, 'owner (local)');
  return new Response(null, { status: 302, headers: { location, 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' } });
}
