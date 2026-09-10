// /api/store — קריאה/כתיבה של כל פרויקטי המתכנן דרך שכבת האחסון (DATA_BUCKET → דלי הענן; אחרת SQLite מקומי)
import { json } from '@sveltejs/kit';
import { makeStorage } from '../../../../scripts/storage.js';
import { openStore, readStore, writeStore } from '../../../../scripts/db.js';

const db = openStore(makeStorage());

export async function GET() {
  return json(await readStore(db));
}

export async function POST({ request }) {
  const n = await writeStore(db, await request.json());
  return json({ ok: true, projects: n });
}
