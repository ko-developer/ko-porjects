// מזהי ה-ERP של קיטי הבסיס (data/erp_kits.json) — ה-ref היציב שבו פרסום הקיטים (/api/erp/kits-sync) מזהה כל קיט ב-ERP.
// קורא list_kits מה-MCP (קריאה בלבד) ומוסיף לכל קיט שכבר בקובץ את ה-id שלו. לא מוסיף ולא מוחק קיטים, ולא משנה שמות,
// קטגוריות או פריטים — רשימת הבסיס והמיזוג עם הקיטים שלי (allKits) נשארים כמו שהם.
// התאמה: שם זהה (אחרי trim; כשיש כמה — הפעיל היחיד); אחרת שם ה-ERP שנחתך ל-60 תווים (כך נשמרו 4 קיטים), רק כשיש התאמה אחת בדיוק.
// שימוש: node scripts/erp-kit-ids.js [--dry]   (ERP_MCP_URL / ERP_MCP_TOKEN ב-.env)
import { readFileSync, writeFileSync } from 'node:fs';
import { erpCall } from './erp-client.js';

const FILE = 'data/erp_kits.json';
const dry = process.argv.includes('--dry');
const raw = readFileSync(FILE, 'utf8');
const kits = JSON.parse(raw);

/* הקובץ נכתב במקור ב-Python (json.dumps: ", " ו-": ") — נכתב באותו פורמט כדי שה-diff יראה רק את ה-id */
const py = v => Array.isArray(v) ? '[' + v.map(py).join(', ') + ']'
  : v && typeof v === 'object' ? '{' + Object.entries(v).map(([k, x]) => JSON.stringify(k) + ': ' + py(x)).join(', ') + '}'
  : JSON.stringify(v);
const samePy = py(kits) === raw;

const r = await erpCall('list_kits', { include_inactive: true, limit: 500 });
const rows = (r?.kits || []).filter(k => k && k.id && k.name);
if ((r?.kits || []).length >= 500) console.warn('⚠ list_kits החזיר 500 קיטים (המקסימום) — ייתכן שחסרים קיטים');
console.log(`ERP: ${rows.length} kits (${rows.filter(k => k.is_active).length} active) · file: ${kits.length} kits`);

const norm = s => String(s || '').trim();
const used = new Set();
function pick(cands) {
  const free = cands.filter(k => !used.has(k.id));
  if (free.length === 1) return free[0];
  const act = free.filter(k => k.is_active);
  return act.length === 1 ? act[0] : null;
}
const match = kits.map(k => { const m = pick(rows.filter(e => norm(e.name) === norm(k.name))); if (m) used.add(m.id); return m; });
kits.forEach((k, i) => {
  if (match[i]) return;
  const m = pick(rows.filter(e => norm(e.name).slice(0, 60).trim() === norm(k.name)));
  if (m) { match[i] = m; used.add(m.id); console.log(`  60-char prefix: "${norm(k.name)}" → "${norm(m.name)}"`); }
});

let added = 0, changed = 0;
const out = kits.map((k, i) => {
  const m = match[i]; if (!m) return k;
  if (k.id === m.id) return k;
  if (k.id) { changed++; console.log(`  id changed: "${norm(k.name)}" ${k.id} → ${m.id}`); } else added++;
  const { id: _old, ...rest } = k;
  return { id: m.id, ...rest };
});
const miss = kits.filter((k, i) => !match[i]);
if (miss.length) console.warn(`⚠ ${miss.length} kits not found in the ERP (no id): ` + miss.map(k => `"${norm(k.name)}"`).join(', '));
const inactive = kits.filter((k, i) => match[i] && !match[i].is_active);
if (inactive.length) console.log(`ℹ ${inactive.length} matched ERP kits are inactive: ` + inactive.map(k => `"${norm(k.name)}"`).join(', '));
console.log(`ids: ${added} added, ${changed} changed, ${kits.length - miss.length} matched of ${kits.length}`);
if (dry) { console.log('--dry: nothing written'); process.exit(0); }
writeFileSync(FILE, samePy ? py(out) : JSON.stringify(out));
console.log('✓ wrote ' + FILE);
