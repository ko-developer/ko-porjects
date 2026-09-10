// /api/rear-layout — שמירת פריסת גב מוצר מהעורך על התמונה אל rear_layouts.json בשכבת האחסון (כמו בשרת הלגאסי)
import { json } from '@sveltejs/kit';
import { readFileSync, existsSync } from 'node:fs';
import { makeStorage } from '../../../../scripts/storage.js';

const storage = makeStorage();

export async function POST({ request }) {
  const b = await request.json();
  const name = String(b.name || '').trim().slice(0, 80);
  if (!name) return json({ error: 'חסר שם דגם' }, { status: 400 });
  const raw = (await storage.read('rear_layouts.json')) || (existsSync('data/rear_layouts.json') ? readFileSync('data/rear_layouts.json') : null);
  const list = raw ? JSON.parse(raw.toString('utf8')) : [];
  let rec = null;
  if (b.remove) {
    const k = list.findIndex(x => x.name === name); if (k >= 0) list.splice(k, 1);
  } else {
    if (!Array.isArray(b.items)) return json({ error: 'חסרים מחברים' }, { status: 400 });
    const items = b.items.map(it => {
      const o = { t: String(it.t || 'xlrf').slice(0, 16), label: String(it.label || '').slice(0, 24) };
      if (it.port) o.port = String(it.port).slice(0, 12);
      for (const k of ['x', 'y', 'w']) if (typeof it[k] === 'number' && isFinite(it[k])) o[k] = Math.round(it[k] * 10) / 10;
      if (it.side === 'front') o.side = 'front';
      return o;
    });
    const re = String(b.re || name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).slice(0, 200);
    try { new RegExp(re, 'i'); } catch { return json({ error: 'regex לא תקין' }, { status: 400 }); }
    rec = { name, re, items, img: b.img || undefined, src: 'editor', updated: new Date().toISOString().slice(0, 10) };
    const k = list.findIndex(x => x.name === name || x.re === re);
    if (k >= 0) list[k] = { ...list[k], ...rec }; else list.unshift(rec);
  }
  await storage.writeJson('rear_layouts.json', list);
  return json({ ok: true, rec });
}
