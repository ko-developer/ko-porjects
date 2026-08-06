// /api/store — קריאה/כתיבה של כל פרויקטי המתכנן מ-data/projects.sqlite
import { json } from '@sveltejs/kit';
import { openDb, readStore, writeStore } from '../../../../scripts/db.js';

const db = openDb();

export function GET() {
  return json(readStore(db));
}

export async function POST({ request }) {
  const n = writeStore(db, await request.json());
  return json({ ok: true, projects: n });
}
