// "חיבור ל-ERP" בלחיצה אחת: authorization code + PKCE מול ה-ERP, בלי שאף אחד מעתיק טוקן או עורך .env.
// משותף לשרת הלגאסי (scripts/erp-routes.js) ולראוטי SvelteKit (src/routes/api/erp/connect/*). בעלים בלבד — הבדיקה בראוטים.
//   start    → state + code_verifier בזיכרון השרת (10 דקות, שימוש אחד) → 302 לדף האישור ב-ERP
//   callback → state נבדק ונצרך → POST ${ERP_BASE}/api/external/kits/connect { code, code_verifier, redirect_uri } → הטוקן נשמר
// הטוקן נשמר בצד השרת בלבד: מקומית data/erp-connection.json (מחוץ לגיט), בענן אובייקט נפרד בדלי (secrets/erp-connection.json).
// הוא לא חוזר לדפדפן, לא ל-/api/store, לא ללוג ולא לכתובת. ERP_KITS_TOKEN מה-env גובר על החיבור השמור.
import { randomBytes, createHash } from 'node:crypto';
import { chmod } from 'node:fs/promises';
import { join } from 'node:path';

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
  const key = connKey(storage);
  await storage.writeJson(key, { token: rec.token, erp_base: rec.erp_base, connected_at: rec.connected_at, connected_by: rec.connected_by });
  if (storage.kind === 'fs') { try { await chmod(join(storage.label, key), 0o600); } catch {} }
}
export async function deleteConnection(storage) { await storage.delete(connKey(storage)); IDS = { at: 0, map: null, base: '', err: '', failAt: 0 }; }

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
  IDS = { at: 0, map: null, base: '', err: '', failAt: 0 };
  try { await kitIds(env, storage, { force: true }); } catch {}   /* מזהי הקיטים מיד עם החיבור */
  return back(null);
}

/* ---------- מזהי ה-ERP לקיטי הבסיס: שם → id ----------
   GET ${base}/api/external/kits → { kits: [{ id, name, category, is_active, external_ref }] }, לכל היותר פעם בשעה.
   לכל שם: רק קיט שמקורו ב-ERP (בלי external_ref, או שה-ref שלו הוא ה-id שלו / erp-name:) — קיט שנוצר מכאן (kp-…) אינו קיט בסיס;
   כמה כאלה באותו שם — הפעיל היחיד; עדיין לא חד-משמעי — השם לא נכנס. המפה לא סודית ונשלחת לדפדפן */
let IDS = { at: 0, map: null, base: '', err: '', failAt: 0 };
export function buildIdMap(kits) {
  const by = new Map();
  for (const k of kits || []) {
    const n = String(k && k.name || '').trim(); if (!n || !k.id) continue;
    if (!by.has(n)) by.set(n, []);
    by.get(n).push(k);
  }
  const out = {};
  for (const [n, list] of by) {
    const origin = list.filter(k => !k.external_ref || k.external_ref === k.id || String(k.external_ref).startsWith('erp-name:'));
    let pick = origin.length === 1 ? origin[0] : null;
    if (!pick && origin.length > 1) { const act = origin.filter(k => k.is_active); if (act.length === 1) pick = act[0]; }
    if (pick) out[n] = pick.id;
  }
  return out;
}
export async function kitIds(env, storage, { force } = {}) {
  const a = await kitsAuth(env, storage);
  if (!a.token) return { ok: false, configured: false, ids: {} };
  const fresh = IDS.map && IDS.base === a.base && Date.now() - IDS.at < IDS_TTL;
  if (!force && fresh) return { ok: true, ids: IDS.map, fetched_at: new Date(IDS.at).toISOString() };
  if (!force && IDS.base === a.base && Date.now() - IDS.failAt < IDS_FAIL_TTL) return IDS.map ? { ok: true, stale: true, ids: IDS.map, fetched_at: new Date(IDS.at).toISOString() } : { ok: false, error: IDS.err, ids: {} };
  try {
    const r = await fetch(a.base + '/api/external/kits', { headers: { authorization: 'Bearer ' + a.token, accept: 'application/json' }, signal: AbortSignal.timeout(30e3) });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j || !Array.isArray(j.kits)) throw new Error('ERP HTTP ' + r.status + (j && j.error ? ' ' + j.error : ''));
    IDS = { at: Date.now(), map: buildIdMap(j.kits), base: a.base, err: '', failAt: 0 };
    return { ok: true, ids: IDS.map, fetched_at: new Date(IDS.at).toISOString() };
  } catch (e) {
    IDS = { ...IDS, base: a.base, err: String(e.message || e), failAt: Date.now() };
    return IDS.map ? { ok: true, stale: true, ids: IDS.map, fetched_at: new Date(IDS.at).toISOString() } : { ok: false, error: IDS.err, ids: {} };
  }
}
