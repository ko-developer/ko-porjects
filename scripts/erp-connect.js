// "חיבור ל-ERP" בלחיצה אחת: authorization code + PKCE מול ה-ERP, בלי שאף אחד מעתיק טוקן או עורך .env.
// משותף לשרת הלגאסי (scripts/erp-routes.js) ולראוטי SvelteKit (src/routes/api/erp/connect/*). בעלים בלבד — הבדיקה בראוטים.
//   start    → state + code_verifier בזיכרון השרת (10 דקות, שימוש אחד) → 302 לדף האישור ב-ERP
//   callback → state נבדק ונצרך → POST ${ERP_BASE}/api/external/kits/connect { code, code_verifier, redirect_uri } → הטוקן נשמר
// הטוקן נשמר בצד השרת בלבד: מקומית data/erp-connection.json (מחוץ לגיט), בענן אובייקט נפרד בדלי (secrets/erp-connection.json).
// הוא לא חוזר לדפדפן, לא ל-/api/store, לא ללוג ולא לכתובת. ERP_KITS_TOKEN מה-env גובר על החיבור השמור.
import { randomBytes, createHash } from 'node:crypto';
import { open, rename, rm, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';

export const ERP_DEFAULT_BASE = 'https://erp.kot.co.il';
const STATE_TTL = 10 * 60e3;
const IDS_TTL = 3600e3, IDS_FAIL_TTL = 5 * 60e3;

const b64url = buf => Buffer.from(buf).toString('base64url');
export const erpBase = env => String(env.ERP_API_URL || '').trim().replace(/\/+$/, '') || ERP_DEFAULT_BASE;
const connKey = storage => storage.kind === 'fs' ? 'erp-connection.json' : 'secrets/erp-connection.json';

/* ---------- החיבור השמור ---------- */
export async function readConnection(storage) {
  if (!storage) return null;
  try { const c = await storage.readJson(connKey(storage), null); return c && typeof c.token === 'string' && c.token ? c : null; }
  catch (e) { console.warn('[erp-connect] reading the stored connection failed:', e.message); return null; }
}
export async function saveConnection(storage, rec) {
  const key = connKey(storage), data = JSON.stringify({ token: rec.token, erp_base: rec.erp_base, connected_at: rec.connected_at, connected_by: rec.connected_by }, null, 1);
  if (storage.kind !== 'fs') return storage.writeJson(key, JSON.parse(data));
  /* מקומית: הקובץ נוצר מראש ב-600 (לא נכתב ב-644 ומוגבל אחר כך), ומחליף את הקודם בהעברה אטומית */
  const path = join(storage.label, key), tmp = path + '.tmp-' + process.pid;
  await mkdir(dirname(path), { recursive: true });
  await rm(tmp, { force: true });
  const fh = await open(tmp, 'wx', 0o600);
  try { await fh.writeFile(data); } finally { await fh.close(); }
  await rename(tmp, path);
}
export async function deleteConnection(storage) { await storage.delete(connKey(storage)); IDS = { ...NO_IDS }; }

/* הטוקן לפרסום: ERP_KITS_TOKEN מה-env, אחרת החיבור השמור (עם כתובת ה-ERP שאליה התחבר) */
export async function kitsAuth(env, storage) {
  const envTok = String(env.ERP_KITS_TOKEN || '').trim();
  if (envTok) return { base: erpBase(env), token: envTok, source: 'env', connected_at: null, connected_by: null };
  const c = await readConnection(storage);
  if (c) return { base: String(c.erp_base || '').replace(/\/+$/, '') || erpBase(env), token: c.token, source: 'connected', connected_at: c.connected_at || null, connected_by: c.connected_by || null };
  return { base: erpBase(env), token: '', source: null, connected_at: null, connected_by: null };
}
/* מה ש-GET /api/erp/kits-sync מחזיר — בלי הטוקן */
export async function kitsStatus(env, storage) {
  const a = await kitsAuth(env, storage);
  return { ok: true, configured: !!a.token, source: a.source, connected_at: a.connected_at, connected_by: a.connected_by };
}

/* ---------- הזרימה ---------- */
const PENDING = new Map();   /* state → { verifier, redirect_uri, base, created_at } */
export const _pending = PENDING;   /* לבדיקות בלבד */
function prune() {
  for (const [k, v] of PENDING) if (Date.now() - v.created_at > STATE_TTL) PENDING.delete(k);
  while (PENDING.size > 50) PENDING.delete(PENDING.keys().next().value);
}
/* origin = הכתובת שבה הבעלים גולש עכשיו (כך החזרה מה-ERP מגיעה עם אותה עוגיית כניסה); ה-ERP מאשר רק redirect_uri מרשימה סגורה */
export function connectStart(env, origin) {
  prune();
  const state = b64url(randomBytes(32)), verifier = b64url(randomBytes(32));
  const challenge = b64url(createHash('sha256').update(verifier).digest());
  const redirect_uri = String(origin).replace(/\/+$/, '') + '/api/erp/connect/callback';
  const base = erpBase(env);
  PENDING.set(state, { verifier, redirect_uri, base, created_at: Date.now() });
  return base + '/integrations/ko-projects/connect?' + new URLSearchParams({ state, code_challenge: challenge, redirect_uri });
}
/* מחזיר את הכתובת (יחסית) לחזרה למסך הקיטים: ?erp_connect=ok או ?erp_connect=error:<סיבה>. בלי code ובלי טוקן */
export async function connectCallback(env, storage, query, who) {
  const back = err => '/?erp_connect=' + (err ? 'error:' + err : 'ok');
  const state = query.get('state') || '';
  const p = state ? PENDING.get(state) : null;
  if (p) PENDING.delete(state);                                   /* שימוש אחד — גם כשהחזרה היא ביטול או שגיאה */
  if (!p || Date.now() - p.created_at > STATE_TTL) return back('state');
  if (query.get('error')) return back(query.get('error') === 'access_denied' ? 'denied' : 'erp');
  const code = query.get('code') || '';
  if (!code) return back('erp');
  let r, j;
  try {
    r = await fetch(p.base + '/api/external/kits/connect', {
      method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ code, code_verifier: p.verifier, redirect_uri: p.redirect_uri }), signal: AbortSignal.timeout(20e3)
    });
    j = await r.json().catch(() => null);
  } catch { return back('unreachable'); }
  if (!r.ok || !j || typeof j.token !== 'string' || !j.token) return back(r.status === 400 ? 'grant' : 'erp');
  try { await saveConnection(storage, { token: j.token, erp_base: p.base, connected_at: new Date().toISOString(), connected_by: who || '' }); }
  catch (e) { console.warn('[erp-connect] saving the connection failed:', e.message); return back('save'); }
  IDS = { ...NO_IDS };
  try { await kitIds(env, storage, { force: true }); } catch {}   /* מזהי הקיטים מיד עם החיבור */
  return back(null);
}

/* ---------- מזהי ה-ERP לקיטי הבסיס: שם → id ----------
   GET ${base}/api/external/kits → { kits: [{ id, name, category, is_active, external_ref }] }, לכל היותר פעם בשעה.
   לכל שם: רק קיט שמקורו ב-ERP (בלי external_ref, או שה-ref שלו הוא ה-id שלו / erp-name:) — קיט שנוצר מכאן (kp-…) אינו קיט בסיס;
   כמה כאלה באותו שם — הפעיל היחיד; עדיין לא חד-משמעי — השם לא נכנס למפה אלא ל-ambiguous (ה-ERP מכריע בעצמו כשנשלח
   erp-name:<שם>). המפה לא סודית ונשלחת לדפדפן */
const NO_IDS = { at: 0, map: null, ambiguous: [], base: '', err: '', errStatus: 0, failAt: 0 };
let IDS = { ...NO_IDS };
export function buildIdMap(kits) { return buildIdIndex(kits).ids; }
export function buildIdIndex(kits) {
  const by = new Map();
  for (const k of kits || []) {
    const n = String(k && k.name || '').trim(); if (!n || !k.id) continue;
    if (!by.has(n)) by.set(n, []);
    by.get(n).push(k);
  }
  const ids = {}, ambiguous = [];
  for (const [n, list] of by) {
    const origin = list.filter(k => !k.external_ref || k.external_ref === k.id || String(k.external_ref).startsWith('erp-name:'));
    let pick = origin.length === 1 ? origin[0] : null;
    if (!pick && origin.length > 1) { const act = origin.filter(k => k.is_active); if (act.length === 1) pick = act[0]; }
    if (pick) ids[n] = pick.id; else if (origin.length > 1) ambiguous.push(n);
  }
  return { ids, ambiguous };
}
export async function kitIds(env, storage, { force } = {}) {
  const a = await kitsAuth(env, storage);
  if (!a.token) return { ok: false, configured: false, ids: {} };
  const fresh = IDS.map && IDS.base === a.base && Date.now() - IDS.at < IDS_TTL;
  const okOut = extra => ({ ok: true, ids: IDS.map, ambiguous: IDS.ambiguous, fetched_at: new Date(IDS.at).toISOString(), ...extra });
  /* 401 = הטוקן בוטל ב-ERP: לא מגישים מפה ישנה, והדפדפן מציע להתחבר מחדש */
  const failOut = () => IDS.map && IDS.errStatus !== 401 ? okOut({ stale: true }) : { ok: false, error: IDS.err, erp_status: IDS.errStatus || 0, source: a.source, ids: {} };
  if (!force && fresh) return okOut();
  if (!force && IDS.base === a.base && Date.now() - IDS.failAt < IDS_FAIL_TTL) return failOut();
  try {
    const r = await fetch(a.base + '/api/external/kits', { headers: { authorization: 'Bearer ' + a.token, accept: 'application/json' }, signal: AbortSignal.timeout(30e3) });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j || !Array.isArray(j.kits)) throw Object.assign(new Error('ERP HTTP ' + r.status + (j && j.error ? ' ' + j.error : '')), { status: r.status });
    const idx = buildIdIndex(j.kits);
    IDS = { ...NO_IDS, at: Date.now(), map: idx.ids, ambiguous: idx.ambiguous, base: a.base };
    return okOut();
  } catch (e) {
    IDS = { ...IDS, base: a.base, err: String(e.message || e), errStatus: e.status || 0, failAt: Date.now() };
    return failOut();
  }
}
