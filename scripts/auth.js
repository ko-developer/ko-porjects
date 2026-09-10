// ===================================================================================
// KO Projects — משתמשים, הזמנות שיתוף וחסימה. שרת בלבד (scripts/dev-server.js).
//
// מודל: הבעלים (אורי) לא נרשם אף פעם — גישה מהמחשב שמריץ את השרת (localhost) היא
// אוטומטית הבעלים. משתמשים מוזמנים מגיעים מבחוץ: כל הזמנה = קישור חד-פעמי לפרויקטים
// מסוימים בהרשאת צפייה/עריכה; המוזמן נרשם עם מייל וסיסמה, והבעלים רואה את כולם
// בדף /admin ויכול לחסום / לבטל חסימה / למחוק. בקשה מבחוץ בלי סשן → מסך כניסה.
//
// אחסון: users.json על שכבת האחסון (storage.js — קבצים מקומיים או דלי הענן): users, invites, sessions.
// סיסמאות ב-scrypt+salt. השרת המקומי והענן חולקים את אותו קובץ, ולכן כל שמירה ממזגת את
// הגרסה באחסון עם הזיכרון (איחוד סשנים/משתמשים/הזמנות; מחיקות נרשמות ולא חוזרות).
// ===================================================================================
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const FILE = 'users.json';
const SESSION_DAYS = 30, INVITE_DAYS = 14;

let DB = null, ST = null, loadedAt = 0;
function normalize(j) {
  const db = j && typeof j === 'object' ? j : { users: [], invites: [], sessions: {} };
  db.users = db.users || []; db.invites = db.invites || []; db.sessions = db.sessions || {};
  db.config = db.config || {};
  return db;
}
/* חובה לפני כל שימוש: טוען users.json מהאחסון (ויוצר מפתח בעלים בפעם הראשונה) */
export async function initAuth(storage) {
  ST = storage;
  await authRefresh(true);
  if (!DB.config.ownerKey) { DB.config.ownerKey = randomBytes(18).toString('base64url'); await persist(); }
  return DB;
}
/* הקובץ באחסון הוא האמת (המחשב והענן כותבים אליו): לפני כל שינוי קוראים אותו מחדש (force),
   ובקריאות רגילות מרעננים כל 10 שניות — כך סשן/הזמנה שנוצרו בצד השני נראים כאן, ומחיקה בצד אחד לא "קמה לתחייה" בצד השני */
export async function authRefresh(force) {
  if (!ST || (!force && DB && Date.now() - loadedAt < 10e3)) return;
  try { DB = normalize(await ST.readJson(FILE, null)); loadedAt = Date.now(); } catch (e) { if (!DB) throw e; console.warn('users.json refresh failed:', e.message); }
}
function load() { if (!DB) throw new Error('auth not initialized — call initAuth(storage) first'); return DB; }
export function config() { return load().config; }
export function publicUrl() { return (process.env.PUBLIC_URL || load().config.publicUrl || '').replace(/\/$/, ''); }
/* כתיבה מסודרת בתור של כל הקובץ (אחרי refresh) — סשנים שפגו מנוקים */
let chain = Promise.resolve();
function persist() {
  chain = chain.then(async () => {
    const mem = load(), t = Date.now();
    for (const [sid, sess] of Object.entries(mem.sessions)) if (sess.exp < t) delete mem.sessions[sid];
    await ST.writeJson(FILE, mem); loadedAt = Date.now();
  }).catch(e => console.warn('users.json persist failed:', e.message));
  return chain;
}
const now = () => Date.now();
const uid = p => p + randomBytes(8).toString('hex');
const token = () => randomBytes(24).toString('base64url');

/* --- סיסמאות --- */
function hashPw(pw, salt) { return scryptSync(String(pw), salt, 48).toString('hex'); }
function checkPw(user, pw) {
  const h = Buffer.from(hashPw(pw, user.salt), 'hex'), s = Buffer.from(user.hash, 'hex');
  return h.length === s.length && timingSafeEqual(h, s);
}
const normEmail = e => String(e || '').trim().toLowerCase();
/* הזמנה תקפה: לא בוטלה ולא פגה. קישור פתוח (בלי מייל) אפשר להשתמש בו כמה פעמים עד שפג —
   כך הבעלים יכול לבדוק אותו בעצמו ואז לשלוח אותו הלאה; קישור נעול למייל = שימוש אחד לאותו מייל */
function inviteValid(inv) { return !!inv && !inv.revoked && inv.exp >= Date.now() && !(inv.email && inv.usedBy); }
function inviteUse(inv, u) { inv.uses = inv.uses || []; inv.uses.push({ uid: u.id, email: u.email, at: new Date().toISOString() }); if (!inv.usedBy) { inv.usedBy = u.id; inv.usedAt = new Date().toISOString(); } }
const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/* --- הבעלים המקומי --- */
const OWNER = { id: 'owner', email: process.env.OWNER_EMAIL || '', name: process.env.OWNER_NAME || 'אורי', role: 'owner', grants: {}, local: true };
export function isLocal(req) {
  if (req.headers['x-forwarded-for']) return false;            /* מאחורי פרוקסי = מבחוץ */
  const a = String(req.socket && req.socket.remoteAddress || '');
  return a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1';
}
export function authEnabled() { return true; }
export function owner() { return OWNER; }

/* --- עוגיות וסשנים --- */
function cookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(p => { const i = p.indexOf('='); if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); });
  return out;
}
export function sessionUser(req) {
  const db = load(), sid = cookies(req).ko_sid;
  if (!sid || !db.sessions[sid]) return null;
  const s = db.sessions[sid];
  if (s.exp < now()) return null;   /* ינוקה בשמירה הבאה */
  const u = db.users.find(x => x.id === s.uid);
  if (!u || u.blocked) return null;
  return u;
}
/* המשתמש של הבקשה: סשן אם יש (גם מקומית — כדי לבדוק מה מוזמן רואה), אחרת בעלים מקומי,
   או בעלים מבחוץ עם עוגיית המפתח (קישור הבעלים מדף /admin — בלי הרשמה) */
export function requestUser(req) {
  const s = sessionUser(req); if (s) return s;
  if (isLocal(req)) return OWNER;
  const k = cookies(req).ko_owner;
  if (k && k === load().config.ownerKey) return { ...OWNER, local: false };
  return null;
}
/* /owner/<key> → עוגייה לשנה וחזרה לאפליקציה */
export function handleOwnerLink(req, res, path) {
  const m = /^\/owner\/([A-Za-z0-9_-]+)$/.exec(path); if (!m) return false;
  if (m[1] !== load().config.ownerKey) { res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' }); res.end('קישור בעלים לא תקף'); return true; }
  const secure = (req.headers['x-forwarded-proto'] || '').includes('https') ? '; Secure' : '';
  res.writeHead(302, { location: '/', 'set-cookie': `ko_owner=${m[1]}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${365 * 86400}${secure}` });
  res.end(); return true;
}
async function setSession(res, user, req) {
  const db = load(), sid = token();
  db.sessions[sid] = { uid: user.id, exp: now() + SESSION_DAYS * 864e5, at: now(), ua: String(req.headers['user-agent'] || '').slice(0, 80) };
  user.lastLogin = new Date().toISOString();
  await persist();
  const secure = (req.headers['x-forwarded-proto'] || '').includes('https') ? '; Secure' : '';
  res.setHeader('set-cookie', `ko_sid=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure}`);
}
async function clearSession(req, res) {
  const db = load(), sid = cookies(req).ko_sid;
  if (sid) { delete db.sessions[sid]; await persist(); }
  res.setHeader('set-cookie', 'ko_sid=; Path=/; HttpOnly; Max-Age=0');
}

/* --- מה משתמש רואה --- */
export function publicUser(u) {
  return u ? { id: u.id, email: u.email, name: u.name, role: u.role, grants: u.grants || {}, blocked: !!u.blocked, local: !!u.local } : null;
}
/* store מסונן למשתמש מוזמן: רק הפרויקטים שהוענקו לו (עם דגל הרשאה בכל פרויקט) */
export function filterStore(store, user) {
  if (!user || user.role === 'owner') return store;
  const g = user.grants || {};
  const projects = (store.projects || []).filter(p => g[p.id]).map(p => ({ ...p, _perm: g[p.id] }));
  const cur = projects.some(p => p.id === store.cur) ? store.cur : (projects[0] && projects[0].id) || '';
  return { cur, projects, rearLib: store.rearLib || {}, ampLib: store.ampLib || {}, _shared: true };
}
/* שמירה ממשתמש מוזמן: רק פרויקטים בהרשאת עריכה מוחלפים ב-store המלא; השאר לא נגעו */
export function mergeStore(full, posted, user) {
  if (!user || user.role === 'owner') return posted;
  const g = user.grants || {};
  const byId = new Map((full.projects || []).map(p => [p.id, p]));
  for (const p of (posted.projects || [])) {
    if (g[p.id] === 'edit' && byId.has(p.id)) { const { _perm, ...clean } = p; byId.set(p.id, clean); }
  }
  return { ...full, projects: [...byId.values()] };
}

/* --- API --- */
function json(res, code, obj) { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(obj)); }
function body(req) {
  return new Promise((resolve, reject) => {
    const ch = []; req.on('data', c => ch.push(c));
    req.on('end', () => { try { resolve(ch.length ? JSON.parse(Buffer.concat(ch).toString('utf8')) : {}); } catch (e) { reject(e); } });
  });
}
function origin(req) {
  const pub = publicUrl(); if (pub) return pub;
  const proto = (req.headers['x-forwarded-proto'] || 'http').split(',')[0];
  return `${proto}://${req.headers['x-forwarded-host'] || req.headers.host}`;
}
const isLocalUrl = u => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)(:|\/|$)/i.test(u || '');

/* מחזיר true אם הבקשה טופלה */
export async function handleAuth(req, res, path, store) {
  await authRefresh(req.method !== 'GET');   /* שינוי = קודם הגרסה העדכנית מהאחסון */
  const db = load();
  const me = requestUser(req);
  const method = req.method;
  try {
    if (path === '/api/auth/me' && method === 'GET') {
      const isOw = !!(me && me.role === 'owner');
      return json(res, 200, { enabled: true, user: publicUser(me), owner: isOw, local: isLocal(req), publicUrl: isOw ? publicUrl() : undefined, ownerLink: isOw ? origin(req) + '/owner/' + db.config.ownerKey : undefined, localOnly: isOw ? isLocalUrl(origin(req)) : undefined }), true;
    }
    if (path === '/api/auth/register' && method === 'POST') {
      const b = await body(req);
      const email = normEmail(b.email), pw = String(b.password || ''), name = String(b.name || '').trim().slice(0, 60);
      if (!validEmail(email)) return json(res, 400, { error: 'כתובת מייל לא תקינה' }), true;
      if (pw.length < 8) return json(res, 400, { error: 'סיסמה — לפחות 8 תווים' }), true;
      if (db.users.some(u => u.email === email)) return json(res, 409, { error: 'המייל הזה כבר רשום — עבור ללשונית "כניסה" והתחבר עם הסיסמה שלך (ההרשאות מהקישור יתווספו בכניסה)' }), true;
      let role = 'user', grants = {};
      /* הרשמה רק דרך קישור הזמנה — הבעלים לא נרשם */
      const inv = db.invites.find(i => i.token === b.token);
      if (!inv) return json(res, 403, { error: b.token ? 'קישור ההזמנה לא נמצא — בקש קישור חדש מבעל המערכת' : 'הרשמה רק דרך קישור הזמנה — פתח את הקישור שקיבלת מבעל המערכת' }), true;
      if (inv.revoked) return json(res, 403, { error: 'קישור ההזמנה בוטל — בקש קישור חדש' }), true;
      if (inv.exp < now()) return json(res, 403, { error: 'קישור ההזמנה פג (14 יום) — בקש קישור חדש' }), true;
      if (inv.email && inv.email !== email) return json(res, 403, { error: 'הקישור הזה יועד לכתובת מייל אחרת' }), true;
      if (inv.email && inv.usedBy) return json(res, 403, { error: 'הקישור הזה כבר נוצל — התחבר עם הסיסמה שלך' }), true;
      inv.projects.forEach(pid => { grants[pid] = inv.perm; });
      const salt = randomBytes(16).toString('hex');
      const u = { id: uid('u'), email, name: name || email.split('@')[0], role, salt, hash: hashPw(pw, salt), grants, blocked: false, createdAt: new Date().toISOString(), invitedBy: inv ? inv.by : null };
      db.users.push(u);
      inviteUse(inv, u);
      await setSession(res, u, req);
      return json(res, 200, { ok: true, user: publicUser(u) }), true;
    }
    if (path === '/api/auth/login' && method === 'POST') {
      const b = await body(req), email = normEmail(b.email);
      const u = db.users.find(x => x.email === email);
      if (!u || !checkPw(u, b.password || '')) return json(res, 401, { error: 'מייל או סיסמה לא נכונים' }), true;
      if (u.blocked) return json(res, 403, { error: 'החשבון חסום — פנה לבעל המערכת' }), true;
      /* כניסה דרך קישור הזמנה של משתמש קיים — ההרשאות שבקישור מתווספות לו */
      const inv = b.token ? db.invites.find(i => i.token === b.token) : null;
      if (inv && inviteValid(inv) && (!inv.email || inv.email === email)) { u.grants = u.grants || {}; inv.projects.forEach(pid => { if (u.grants[pid] !== 'edit') u.grants[pid] = inv.perm; }); inviteUse(inv, u); }
      await setSession(res, u, req);
      return json(res, 200, { ok: true, user: publicUser(u) }), true;
    }
    if (path === '/api/auth/logout' && method === 'POST') { await clearSession(req, res); return json(res, 200, { ok: true }), true; }
    if (path === '/api/invite' && method === 'GET') {
      /* פרטי הזמנה לדף ההרשמה: לאיזה פרויקטים, ממי */
      const t = new URL(req.url, 'http://x').searchParams.get('t');
      const inv = db.invites.find(i => i.token === t);
      if (!inv) return json(res, 404, { error: 'הזמנה לא נמצאה' }), true;
      const names = (store.projects || []).filter(p => inv.projects.includes(p.id)).map(p => p.name);
      const by = inv.by === 'owner' ? OWNER : db.users.find(u => u.id === inv.by);
      return json(res, 200, { ok: inviteValid(inv), used: !!(inv.email && inv.usedBy), uses: (inv.uses || []).length, expired: inv.exp < now(), revoked: !!inv.revoked, projects: names, perm: inv.perm, by: by ? by.name : '', email: inv.email || '' }), true;
    }
    /* --- פעולות בעלים --- */
    const isOwner = me && me.role === 'owner';
    if (path === '/api/share' && method === 'POST') {
      if (!isOwner) return json(res, 403, { error: 'רק בעל המערכת יכול לשתף' }), true;
      const b = await body(req);
      const projects = (b.projects || []).filter(id => (store.projects || []).some(p => p.id === id));
      if (!projects.length) return json(res, 400, { error: 'בחר לפחות פרויקט אחד' }), true;
      const inv = { token: token(), projects, perm: b.perm === 'view' ? 'view' : 'edit', email: normEmail(b.email) || '', label: String(b.label || '').slice(0, 60), by: me.id, createdAt: new Date().toISOString(), exp: now() + INVITE_DAYS * 864e5, usedBy: null };
      db.invites.push(inv); await persist();
      const url = origin(req) + '/join/' + inv.token;
      return json(res, 200, { ok: true, url, exp: inv.exp, invite: inv, localOnly: isLocalUrl(url) }), true;
    }
    if (path === '/api/admin/users' && method === 'GET') {
      if (!isOwner) return json(res, 403, { error: 'forbidden' }), true;
      const pn = Object.fromEntries((store.projects || []).map(p => [p.id, p.name]));
      return json(res, 200, {
        users: db.users.map(u => ({ ...publicUser(u), createdAt: u.createdAt, lastLogin: u.lastLogin || null, projects: Object.entries(u.grants || {}).map(([id, perm]) => ({ id, name: pn[id] || id, perm })) })),
        invites: db.invites.map(i => ({ token: i.token, url: origin(req) + '/join/' + i.token, uses: (i.uses || []).length, valid: inviteValid(i), projects: i.projects.map(id => pn[id] || id), perm: i.perm, email: i.email, label: i.label, createdAt: i.createdAt, exp: i.exp, usedBy: i.usedBy ? (db.users.find(u => u.id === i.usedBy) || {}).email : null, revoked: !!i.revoked })),
      }), true;
    }
    if (path === '/api/admin/user' && method === 'POST') {
      if (!isOwner) return json(res, 403, { error: 'forbidden' }), true;
      const b = await body(req); const u = db.users.find(x => x.id === b.id);
      if (!u) return json(res, 404, { error: 'משתמש לא נמצא' }), true;
      if (u.role === 'owner') return json(res, 400, { error: 'הבעלים הוא הגישה המקומית — אין מה לחסום' }), true;
      const dropSessions = () => Object.keys(db.sessions).forEach(s => { if (db.sessions[s].uid === u.id) delete db.sessions[s]; });
      if (b.action === 'block') { u.blocked = true; dropSessions(); }
      else if (b.action === 'unblock') u.blocked = false;
      else if (b.action === 'delete') { db.users = db.users.filter(x => x.id !== u.id); dropSessions(); }
      else if (b.action === 'grant') { u.grants = u.grants || {}; if (b.perm === 'none') delete u.grants[b.project]; else u.grants[b.project] = b.perm === 'view' ? 'view' : 'edit'; }
      else return json(res, 400, { error: 'unknown action' }), true;
      await persist();
      return json(res, 200, { ok: true }), true;
    }
    if (path === '/api/admin/config' && method === 'GET') {
      if (!isOwner) return json(res, 403, { error: 'forbidden' }), true;
      return json(res, 200, { publicUrl: db.config.publicUrl || '', envPublicUrl: process.env.PUBLIC_URL || '', effective: publicUrl(), ownerLink: origin(req) + '/owner/' + db.config.ownerKey, localOnly: isLocalUrl(origin(req)) }), true;
    }
    if (path === '/api/admin/config' && method === 'POST') {
      if (!isOwner) return json(res, 403, { error: 'forbidden' }), true;
      const b = await body(req);
      const u = String(b.publicUrl || '').trim().replace(/\/$/, '');
      if (u && !/^https?:\/\/[^\s/]+/.test(u)) return json(res, 400, { error: 'כתובת לא תקינה — למשל https://ko.example.com' }), true;
      db.config.publicUrl = u; await persist();
      return json(res, 200, { ok: true, effective: publicUrl(), ownerLink: origin(req) + '/owner/' + db.config.ownerKey }), true;
    }
    if (path === '/api/admin/invite' && method === 'POST') {
      if (!isOwner) return json(res, 403, { error: 'forbidden' }), true;
      const b = await body(req); const inv = db.invites.find(i => i.token === b.token);
      if (!inv) return json(res, 404, { error: 'הזמנה לא נמצאה' }), true;
      if (b.action === 'revoke') inv.revoked = true;
      else if (b.action === 'delete') db.invites = db.invites.filter(i => i !== inv);
      await persist();
      return json(res, 200, { ok: true }), true;
    }
  } catch (e) { return json(res, 400, { error: String(e.message || e) }), true; }
  return false;
}
