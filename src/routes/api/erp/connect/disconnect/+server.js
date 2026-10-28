// ניתוק: מוחק את החיבור השמור בלבד; הטוקן עצמו נשלל ב-ERP (Admin)
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { isOwner, ownerOnly } from '$lib/server/owner.js';
import { deleteConnection, kitsStatus } from '../../../../../../scripts/erp-connect.js';
import { makeStorage } from '../../../../../../scripts/storage.js';

const storage = makeStorage();

export async function POST({ request, getClientAddress }) {
  if (!isOwner(request, getClientAddress)) return ownerOnly();
  await deleteConnection(storage);
  return json(await kitsStatus(env, storage));
}
