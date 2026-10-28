// מזהי ה-ERP לקיטי הבסיס (שם → id) — לא סודי; מה-ERP לכל היותר פעם בשעה (scripts/erp-connect.js)
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { isOwner, ownerOnly } from '$lib/server/owner.js';
import { kitIds } from '../../../../../scripts/erp-connect.js';
import { makeStorage } from '../../../../../scripts/storage.js';

const storage = makeStorage();

export async function GET({ request, getClientAddress }) {
  if (!isOwner(request, getClientAddress)) return ownerOnly();
  return json(await kitIds(env, storage));
}
