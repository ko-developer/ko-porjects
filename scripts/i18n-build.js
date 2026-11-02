// בניית מילון התרגום לאנגלית data/i18n_en.json: מחלץ את מקטעי העברית מהמקור (i18n-extract.js) ומתרגם את מה שחסר
// דרך שרת הפיתוח המקומי (/api/ai → Anthropic עם המפתח שבשרת; המפתח לא נקרא כאן). שומר אחרי כל אצווה.
// שימוש: node scripts/i18n-build.js [--server http://localhost:4177] [--batch 60] [--limit N]
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { extract } from './i18n-extract.js';
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const SERVER = arg('--server', 'http://localhost:4177'), BATCH = +arg('--batch', 60), LIMIT = +arg('--limit', 0), CONC = +arg('--conc', 4);
const DICT = 'data/i18n_en.json';
const dict = existsSync(DICT) ? JSON.parse(readFileSync(DICT, 'utf8')) : {};
const keys = [...extract().keys()].filter(k => !(k in dict));
const todo = LIMIT ? keys.slice(0, LIMIT) : keys;
console.log('missing', keys.length, 'translating', todo.length, 'in batches of', BATCH);
const GLOSSARY = 'Glossary (Hebrew → English): ארון=rack · מוקד=device (a placed item on the plan) · אזור=zone · קיט=kit · הצעת מחיר=quote · הצעה=quote · תכנית=plan · רמקול=speaker · סאב=sub · מגבר=amplifier · פרוססור=processor · ספיקון=Speakon · כבל=cable · חיווט=wiring · תשתיות=infrastructure · שרטוט=sketch · כיול=calibration · קנה מידה=scale · מתקין=installer · חשמלאי=electrician · כיוון סאונד=sound tuning · מלאי=stock · מק"ט=SKU · תכלית=purpose · עוצמה=level (SPL) · קומה=floor · מבנה=building · פאנל=panel · קיפד=keypad · מטריצה=matrix · מסלול=route · צנרת=conduit · תעלה=cable tray · הכנת חשמל=power point · שקע=outlet · מוגבר=powered · פאסיבי=passive · גב ארון=rack rear · יחידה=unit · דוח=report · טופ=top (full-range speaker) · רחבה=dance floor · פינת ישיבה=lounge · בר=bar.';
const SYS = 'You translate user-interface strings of "KO Projects", an Israeli professional audio/AV installation planning app (speakers, subwoofers, amplifiers, racks, cables, zones, kits, ERP quotes, floor plans), from Hebrew to concise, natural, professional English as used in pro-audio software. Rules: keep every emoji, symbol, "#" placeholder (it stands for a number), product/brand/model names, units and punctuation in place; keep the same tone (imperative for buttons); do not add explanations; never leave Hebrew letters. ' + GLOSSARY + ' Return ONLY a JSON array of strings, same length and order as the input array.';
async function translate(batch) {
  const body = { max_tokens: 8000, messages: [{ role: 'user', content: SYS + '\n\nInput JSON array:\n' + JSON.stringify(batch) }] };
  const r = await fetch(SERVER + '/api/ai', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  const txt = (j.content || []).map(c => c.text || '').join('');
  const a = txt.indexOf('['), b = txt.lastIndexOf(']');
  const arr = JSON.parse(txt.slice(a, b + 1));
  if (!Array.isArray(arr) || arr.length !== batch.length) throw new Error('length mismatch ' + (arr && arr.length) + ' vs ' + batch.length);
  return arr;
}
const batches = []; for (let i = 0; i < todo.length; i += BATCH) batches.push(todo.slice(i, i + BATCH));
let done = 0, failed = 0;
const save = () => writeFileSync(DICT, JSON.stringify(dict, null, 0).replace(/","/g, '",\n"'));
async function worker() {
  while (batches.length) {
    const b = batches.shift();
    for (let attempt = 1; attempt <= 3; attempt++) {
      try { const out = await translate(b); b.forEach((k, i) => { const v = String(out[i] || '').trim(); if (v && !/[֐-׿]/.test(v)) dict[k] = v; }); done += b.length; save(); console.log('ok', done, '/', todo.length); break; }
      catch (e) { console.warn('batch failed (' + attempt + '):', e.message); if (attempt === 3) failed += b.length; else await new Promise(r => setTimeout(r, 3000 * attempt)); }
    }
  }
}
await Promise.all(Array.from({ length: CONC }, worker));
save();
console.log('done', done, 'failed', failed, 'dict size', Object.keys(dict).length);
