// "כניסה עם KO ERP" — ה-ERP הוא הזהות; KO Projects מחליט מי נכנס ובאיזה תפקיד (scripts/auth.js → erpSignIn).
// authorization code + PKCE מול שרת ה-OAuth של ה-ERP, כלקוח הראשי ko-projects (בלי מסך אישור — docs/external-api.md §14.3 ב-ERP):
//   start    → state + code_verifier בזיכרון השרת (10 דקות, שימוש אחד) + עוגיית קשירה לדפדפן → 302 ל-/oauth/authorize
//   callback → state והעוגייה נבדקים ונצרכים → POST /oauth/token → GET /oauth/userinfo → הפרופיל חוזר ל-auth.js
// העוגייה קושרת את החזרה לדפדפן שהתחיל: בלעדיה קישור callback שנשלח למישהו היה מכניס אותו כמשתמש של מי ששלח.
// ה-refresh token של האדם נשמר בצד השרת בלבד (data/erp-user-tokens.json מקומית, secrets/erp-user-tokens.json בדלי), לפי משתמש
// KO Projects — כדי ששליחת הצעה ל-ERP תיווצר בשם האדם עצמו (accessTokenFor). לא בדפדפן, לא ב-users.json, לא בלוג ולא בכתובת.
// רדום עד שה-ERP מפרסם userinfo_endpoint ב-/.well-known/oauth-authorization-server (erpLoginAvailable).
// בנוסף: בדיקה חוזרת כל 10 דקות שחשבונות ה-ERP של הסשנים החיים עדיין פעילים, ושליחת רשימת המשתמשים ל-ERP אחרי כל שינוי —
// שתיהן בטוקן השירות ko-projects ("חיבור ל-ERP", kitsAuth).
import { randomBytes, createHash } from 'node:crypto';
import { open, rename, rm, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { erpBase, kitsAuth } from './erp-connect.js';

export const CLIENT_ID = 'ko-projects';
export const BIND_COOKIE = 'ko_erp_bind';
const STATE_TTL = 10 * 60e3, META_TTL = 10 * 60e3, META_FAIL_TTL = 60e3;
const RECHECK_EVERY = 10 * 60e3, PUSH_DELAY = 3e3;
const b64url = buf => Buffer.from(buf).toString('base64url');

/* ---------- זמינות: ה-ERP מפרסם userinfo_endpoint רק כשהכניסה דרכו פעילה ----------
   וגם טוקן השירות ("חיבור ל-ERP"): ה-ERP דורש אותו בהחלפת הקוד וברענון — בלי מסך אישור, קוד שדלף לא שווה כלום בלעדיו */
let META = { at: 0, base: '', ok: false };
export async function erpLoginAvailable(env, storage) {
  const svc = await kitsAuth(env, storage);
  if (!svc.token) return false;
  const base = erpBase(env);
  if (META.base === base && Date.now() - META.at < (META.ok ? META_TTL : META_FAIL_TTL)) return META.ok;
  let ok = false;
  try {
    const r = await fetch(base + '/.well-known/oauth-authorization-server', { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(8e3) });
    const j = await r.json().catch(() => null);
    ok = !!(r.ok && j && j.userinfo_endpoint);
  } catch {}
  META = { at: Date.now(), base, ok };
  return ok;
}

/* ---------- הזרימה ---------- */
const PENDING = new Map();   /* state → { verifier, bind, redirect_uri, base, join, created_at } */
export const _pending = PENDING;   /* לבדיקות בלבד */
function prune() {
  for (const [k, v] of PENDING) if (Date.now() - v.created_at > STATE_TTL) PENDING.delete(k);
  while (PENDING.size > 200) PENDING.delete(PENDING.keys().next().value);
}
/* origin = הכתובת שבה הדפדפן גולש עכשיו (ה-ERP מקבל רק redirect_uri רשום: שתי כתובות הענן ו-localhost:4177) */
export function loginStart(env, origin, { join } = {}) {
  prune();
  const state = b64url(randomBytes(32)), verifier = b64url(randomBytes(32)), bind = b64url(randomBytes(18));
  const challenge = b64url(createHash('sha256').update(verifier).digest());
  const redirect_uri = String(origin).replace(/\/+$/, '') + '/api/auth/erp/callback';
  const base = erpBase(env);
  PENDING.set(state, { verifier, bind, redirect_uri, base, join: String(join || '').slice(0, 200), created_at: Date.now() });
  const url = base + '/oauth/authorize?' + new URLSearchParams({ client_id: CLIENT_ID, response_type: 'code', redirect_uri, code_challenge: challenge, code_challenge_method: 'S256', state });
  return { url, bind };
}
/* { ok:true, profile, tokens, join } או { ok:false, reason, join } — reason: state | not_allowed | denied | busy | grant | erp | unreachable */
export async function loginCallback(env, storage, query, bindCookie) {
  const state = query.get('state') || '';
  const p = state ? PENDING.get(state) : null;
  if (p) PENDING.delete(state);   /* שימוש אחד — גם כשהחזרה היא שגיאה */
  if (!p || Date.now() - p.created_at > STATE_TTL) return { ok: false, reason: 'state', join: '' };
  const fail = reason => ({ ok: false, reason, join: p.join });
  if (!bindCookie || bindCookie !== p.bind) return fail('state');
  const err = query.get('error');
  if (err) return fail(err === 'access_denied' && query.get('error_description') === 'account_not_allowed' ? 'not_allowed' : err === 'temporarily_unavailable' || err === 'server_error' ? 'busy' : 'denied');
  const code = query.get('code') || '';
  if (!code) return fail('erp');
  const svc = await kitsAuth(env, storage);
  if (!svc.token) return fail('erp');
  let tok;
  try {
    const r = await fetch(p.base + '/oauth/token', {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json', authorization: 'Bearer ' + svc.token },
      body: new URLSearchParams({ grant_type: 'authorization_code', client_id: CLIENT_ID, code, redirect_uri: p.redirect_uri, code_verifier: p.verifier }),
      signal: AbortSignal.timeout(20e3)
    });
    tok = await r.json().catch(() => null);
    if (!r.ok || !tok || typeof tok.access_token !== 'string') return fail(r.status === 400 ? 'grant' : 'erp');
  } catch { return fail('unreachable'); }
  let profile;
  try {
    const r = await fetch(p.base + '/oauth/userinfo', { headers: { authorization: 'Bearer ' + tok.access_token, accept: 'application/json' }, signal: AbortSignal.timeout(15e3) });
    profile = await r.json().catch(() => null);
    if (r.status === 403 && profile && profile.error === 'account_not_allowed') return fail('not_allowed');
    if (!r.ok || !profile || typeof profile.sub !== 'string' || !profile.sub) return fail('erp');
  } catch { return fail('unreachable'); }
  return {
    ok: true, join: p.join, profile,
    tokens: { base: p.base, access_token: tok.access_token, refresh_token: String(tok.refresh_token || ''), expires_at: Date.now() + (Number(tok.expires_in) || 3600) * 1000 }
  };
}

/* ---------- הטוקנים של כל אדם (לשליחת הצעות בשמו) ---------- */
const tokKey = storage => storage.kind === 'fs' ? 'erp-user-tokens.json' : 'secrets/erp-user-tokens.json';
const ACCESS = new Map();   /* uid → { token, exp, base } — בזיכרון בלבד */
let TOK_CHAIN = Promise.resolve();
const serial = fn => { const p = TOK_CHAIN.then(fn, fn); TOK_CHAIN = p.catch(() => {}); return p; };
async function readTokens(storage) {
  try { const j = await storage.readJson(tokKey(storage), null); return j && typeof j === 'object' ? j : {}; }
  catch (e) { console.warn('[erp-login] reading stored ERP sign-ins failed:', e.message); return {}; }
}
async function writeTokens(storage, all) {
  const key = tokKey(storage), data = JSON.stringify(all);
  if (storage.kind !== 'fs') return storage.writeJson(key, all, 0);
  /* מקומית: נוצר ב-600 ומחליף את הקודם בהעברה אטומית (כמו erp-connection.json) */
  const path = join(storage.label, key), tmp = path + '.tmp-' + process.pid;
  await mkdir(dirname(path), { recursive: true });
  await rm(tmp, { force: true });
  const fh = await open(tmp, 'wx', 0o600);
  try { await fh.writeFile(data); } finally { await fh.close(); }
  await rename(tmp, path);
}
export function saveUserTokens(storage, uid, t) {
  if (!storage || !uid || !t) return Promise.resolve();
  ACCESS.set(uid, { token: t.access_token, exp: t.expires_at, base: t.base });
  if (!t.refresh_token) return Promise.resolve();
  return serial(async () => { const all = await readTokens(storage); all[uid] = { base: t.base, refresh_token: t.refresh_token, saved_at: new Date().toISOString() }; await writeTokens(storage, all); });
}
export function forgetUserTokens(storage, uid) {
  ACCESS.delete(uid);
  if (!storage || !uid) return Promise.resolve();
  return serial(async () => { const all = await readTokens(storage); if (!(uid in all)) return; delete all[uid]; await writeTokens(storage, all); });
}
async function refreshOnce(base, refresh_token, serviceToken) {
  const r = await fetch(base + '/oauth/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json', authorization: 'Bearer ' + serviceToken },
    body: new URLSearchParams({ grant_type: 'refresh_token', client_id: CLIENT_ID, refresh_token }), signal: AbortSignal.timeout(20e3)
  });
  const j = await r.json().catch(() => null);
  if (r.ok && j && j.access_token) return { ok: true, j };
  return { ok: false, invalid: r.status === 400 || r.status === 401 };
}
/* טוקן גישה בתוקף בשם האדם: מהזיכרון, אחרת רענון מה-refresh השמור (מסתובב בכל שימוש — נשמר מחדש).
   invalid_grant: אולי השרת השני (מחשב ↔ ענן, אותו דלי) כבר סובב אותו — קוראים שוב פעם אחת; עדיין לא → נדרשת כניסה מחדש */
export function accessTokenFor(env, storage, uid) {
  const hit = ACCESS.get(uid);
  if (hit && hit.exp - Date.now() > 60e3) return Promise.resolve({ ok: true, token: hit.token, base: hit.base });
  return serial(async () => {
    const again = ACCESS.get(uid);
    if (again && again.exp - Date.now() > 60e3) return { ok: true, token: again.token, base: again.base };
    const svc = await kitsAuth(env, storage);
    if (!svc.token) return { ok: false, reason: 'signin' };
    let tried = '';
    for (let attempt = 0; attempt < 2; attempt++) {
      const all = await readTokens(storage), rec = all[uid];
      if (!rec || !rec.refresh_token || rec.refresh_token === tried) break;
      tried = rec.refresh_token;
      let out;
      try { out = await refreshOnce(rec.base, rec.refresh_token, svc.token); } catch { return { ok: false, reason: 'unreachable' }; }
      if (out.ok) {
        const t = { base: rec.base, access_token: out.j.access_token, refresh_token: String(out.j.refresh_token || ''), expires_at: Date.now() + (Number(out.j.expires_in) || 3600) * 1000 };
        ACCESS.set(uid, { token: t.access_token, exp: t.expires_at, base: t.base });
        all[uid] = { base: t.base, refresh_token: t.refresh_token, saved_at: new Date().toISOString() };
        await writeTokens(storage, all);
        return { ok: true, token: t.access_token, base: t.base };
      }
      if (!out.invalid) return { ok: false, reason: 'erp' };
    }
    return { ok: false, reason: 'signin' };
  });
}

/* ---------- סנכרון עם ה-ERP בטוקן השירות: בדיקת חשבונות + רשימת המשתמשים ---------- */
async function serviceFetch(env, storage, path, init = {}) {
  const a = await kitsAuth(env, storage);
  if (!a.token) return null;   /* עוד לא "חובר ל-ERP" — אין מה לעשות */
  const r = await fetch(a.base + path, { ...init, headers: { ...(init.headers || {}), authorization: 'Bearer ' + a.token, accept: 'application/json' }, signal: AbortSignal.timeout(30e3) });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error('ERP HTTP ' + r.status + (j && j.error ? ' ' + j.error : ''));
  return j;
}
/* חיפוש בספריית האנשים של ה-ERP לדף /admin ("הוסף מה-ERP") */
export async function searchErpUsers(env, storage, q) {
  const j = await serviceFetch(env, storage, '/api/external/ko-projects/users?q=' + encodeURIComponent(q));
  if (!j) return { ok: false, error: 'not_connected' };
  return { ok: true, users: Array.isArray(j.users) ? j.users : [] };
}
/* auth = { erpLinkedUsers(), endErpSessions(erpIds) } מ-scripts/auth.js; getStorage — האחסון עשוי להתחלף בזמן ריצה (נפילה לקבצים) */
export function startErpSync({ env, getStorage, auth }) {
  let lastPush = '', timer = 0;
  const pushNow = async () => {
    timer = 0;
    const members = auth.erpLinkedUsers().map(u => ({ erp_user_id: u.erpId, role: u.pending ? 'pending' : (u.role === 'owner' ? 'admin' : u.role), blocked: !!u.blocked, last_login: u.lastLogin || null, project_count: u.projectCount || 0 }));
    const body = JSON.stringify({ members });
    if (body === lastPush) return;
    try { const j = await serviceFetch(env, getStorage(), '/api/external/ko-projects/members', { method: 'PUT', headers: { 'content-type': 'application/json' }, body }); if (j) lastPush = body; }
    catch (e) { console.warn('[erp-login] sending the user list to the ERP failed:', e.message); }
  };
  const pushSoon = () => { if (!timer) timer = setTimeout(pushNow, PUSH_DELAY); };
  const recheck = async () => {
    const ids = [...new Set(auth.erpLinkedUsers().filter(u => u.live).map(u => u.erpId))].slice(0, 500);
    if (!ids.length) return;
    try {
      const j = await serviceFetch(env, getStorage(), '/api/external/ko-projects/users?ids=' + ids.join(','));
      if (!j || !Array.isArray(j.users)) return;
      const gone = j.users.filter(x => x && x.status !== 'active').map(x => x.id);
      if (gone.length) { await auth.endErpSessions(gone); for (const id of gone) console.log('[erp-login] ERP account ' + id + ' is no longer active — its KO Projects sessions ended'); }
    } catch (e) { console.warn('[erp-login] checking ERP accounts failed:', e.message); }
  };
  setInterval(recheck, RECHECK_EVERY).unref();
  return { pushSoon };
}
