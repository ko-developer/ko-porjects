// ===================================================================================
// KO Projects — משתמשים, הזמנות שיתוף וחסימה. שרת בלבד (scripts/dev-server.js).
//
// מודל: הבעלים (אורי) לא נרשם אף פעם — גישה מהמחשב שמריץ את השרת (localhost) היא
// אוטומטית הבעלים. משתמשים מוזמנים מגיעים מבחוץ: כל הזמנה = קישור חד-פעמי לפרויקטים
// מסוימים בהרשאת צפייה/עריכה; המוזמן נרשם עם מייל וסיסמה, והבעלים רואה את כולם
// בדף /admin ויכול לחסום / לבטל חסימה / למחוק. בקשה מבחוץ בלי סשן → מסך כניסה.
//
// כניסה עם KO ERP (scripts/erp-login.js → erpSignIn כאן): ה-ERP מוכיח מי האדם; כאן מוחלט אם נכנס ובאיזה תפקיד — לפי
// erpId, אחרת קישור משתמש הסיסמה שכבר מחובר בדפדפן הזה, אחרת אימוץ משתמש לא-מקושר באותו מייל — רק כשהמייל מאומת (חשבון צוות
// ב-ERP; מייל של חשבון חיצוני הוא מה שהוקלד בהרשמה), אחרת הזמנה בתוקף, אחרת בקשת גישה שממתינה לאישור ב-/admin.
// מייל מאומת ב-OWNER_EMAIL / config.ownerEmails שנכנס דרך ה-ERP = הבעלים (סשן uid 'owner', לכל אחד erp משלו). קישור הבעלים נשאר לחירום.
// אחסון: users.json על שכבת האחסון (storage.js — קבצים מקומיים או דלי הענן): users, invites, sessions.
// סיסמאות ב-scrypt+salt. השרת המקומי והענן חולקים את אותו קובץ, ולכן כל שמירה ממזגת את
// הגרסה באחסון עם הזיכרון (איחוד סשנים/משתמשים/הזמנות; מחיקות נרשמות ולא חוזרות).
// ===================================================================================
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const FILE = 'users.json';
const SESSION_DAYS = 30, INVITE_DAYS = 14;

let DB = null, ST = null, loadedAt = 0;
/* חיבורים ל-scripts/erp-login.js (נקבעים ב-dev-server): onChange — שליחת רשימת המשתמשים ל-ERP; onLogout(uid) — מחיקת
   הכניסה השמורה ל-ERP כשנסגר הסשן האחרון; erpLoginAvailable() — האם להציג "כניסה עם KO ERP"; searchErpUsers(q) — חיפוש ב-ERP */
const HOOKS = { onChange: null, onLogout: null, erpLoginAvailable: null, searchErpUsers: null };
export function setAuthHooks(h) { Object.assign(HOOKS, h || {}); }
function normalize(j) {
  const db = j && typeof j === 'object' ? j : { users: [], invites: [], sessions: {} };
  db.users = db.users || []; db.invites = db.invites || []; db.sessions = db.sessions || {};
  db.config = db.config || {};
  db.deleted = db.deleted || { users: [], invites: [], sessions: [] };   /* מה שנמחק כאן — לא חוזר מהעותק של הצד השני */
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
let refreshing = null;
export async function authRefresh(force) {
  if (!ST || (!force && DB && Date.now() - loadedAt < 10e3)) return;
  const run = async () => { try { DB = normalize(await ST.readJson(FILE, null)); loadedAt = Date.now(); } catch (e) { if (!DB) throw e; console.warn('users.json refresh failed:', e.message); } finally { refreshing = null; } };
  /* כשכבר יש עותק בזיכרון — הרענון רץ ברקע ולא מעכב את הבקשה (כל בקשה לדף חיכתה כאן לקריאה מהדלי); רק טעינה ראשונה או force ממתינים */
  if (DB && !force) { if (!refreshing) { loadedAt = Date.now(); refreshing = run().catch(() => {}); } return; }
  return run();
}
function load() { if (!DB) throw new Error('auth not initialized — call initAuth(storage) first'); return DB; }
export function config() { return load().config; }
export function publicUrl() { return (process.env.PUBLIC_URL || load().config.publicUrl || '').replace(/\/$/, ''); }
/* כתיבה מסודרת בתור של כל הקובץ (אחרי refresh) — סשנים שפגו מנוקים */
let chain = Promise.resolve();
function persist() {
  chain = chain.then(async () => {
    const mem = load(), t = Date.now();
    /* מיזוג עם הקובץ שבאחסון לפני הכתיבה: משתמש שנרשם / התחבר בצד השני (ענן ↔ מחשב) בין הרענון לכתיבה לא נמחק בדריסה */
    let fresh = null; try { fresh = normalize(await ST.readJson(FILE, null)); } catch (e) {}
    if (fresh) {
      const delU = new Set(mem.deleted.users), delI = new Set(mem.deleted.invites), delS = new Set(mem.deleted.sessions);
      const ids = new Set(mem.users.map(u => u.id)), mails = new Set(mem.users.map(u => u.email));
      for (const u of fresh.users) {
        if (delU.has(u.id)) continue;
        const m = mem.users.find(x => x.id === u.id);
        /* נרשם בצד השני. מייל כפול נדחה (שתי הרשמות סיסמה במקביל) — חוץ ממשתמש ERP חדש: מייל של חשבון חיצוני לא מאומת ויכול להיות זהה לשל משתמש קיים */
        if (!m) { if (!mails.has(u.email) || (u.erpId && !mem.users.some(x => x.erpId === u.erpId))) { mem.users.push(u); ids.add(u.id); mails.add(u.email); } continue; }
        if (u.lastLogin && (!m.lastLogin || u.lastLogin > m.lastLogin)) m.lastLogin = u.lastLogin;
        if (u.cur && !m.cur) m.cur = u.cur;
      }
      const toks = new Set(mem.invites.map(i => i.token));
      for (const i of fresh.invites) { if (delI.has(i.token)) continue; const m = mem.invites.find(x => x.token === i.token); if (!m) mem.invites.push(i); else if ((i.uses || []).length > (m.uses || []).length) { m.uses = i.uses; m.usedBy = m.usedBy || i.usedBy; m.usedAt = m.usedAt || i.usedAt; } }
      for (const [sid, sess] of Object.entries(fresh.sessions)) { if (mem.sessions[sid] || delS.has(sid) || sess.exp < t) continue; const u = sess.uid === 'owner' ? OWNER : mem.users.find(x => x.id === sess.uid); if (u && !u.blocked) mem.sessions[sid] = sess; }   /* התחבר בצד השני */
    }
    for (const [sid, sess] of Object.entries(mem.sessions)) if (sess.exp < t) delete mem.sessions[sid];
    if (mem.deleted.sessions.length > 500) mem.deleted.sessions = mem.deleted.sessions.slice(-200);
    await ST.writeJson(FILE, mem); loadedAt = Date.now();
    if (HOOKS.onChange) try { HOOKS.onChange(); } catch {}
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
/* מיילים שכניסה איתם דרך ה-ERP היא הבעלים: OWNER_EMAIL (אפשר כמה, בפסיקים) + מה שהבעלים הגדיר ב-/admin */
function ownerEmails() {
  const env = String(process.env.OWNER_EMAIL || '').split(',');
  return [...env, ...(load().config.ownerEmails || [])].map(normEmail).filter(Boolean);
}
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
  if (s.uid === 'owner') {   /* הבעלים שנכנס עם KO ERP — כל מייל בעלים הוא אדם אחר ב-ERP: השם, ההרשאה להצעות והטוקן לפי ה-erp של הסשן */
    const o = (s.erp && (db.config.ownerErp || {})[s.erp]) || {};
    return { ...OWNER, name: o.name || OWNER.name, email: o.email || OWNER.email, local: false, erpId: s.erp || '', erpCanOffer: o.canOffer !== false, erpOffersRefusal: o.refusal || null };
  }
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
async function setSession(res, user, req, extra) {
  const db = load(), sid = token();
  db.sessions[sid] = { uid: user.id, exp: now() + SESSION_DAYS * 864e5, at: now(), ua: String(req.headers['user-agent'] || '').slice(0, 80), ...(extra || {}) };
  if (user.id === 'owner') db.config.ownerLastLogin = new Date().toISOString(); else user.lastLogin = new Date().toISOString();
  await persist();
  const secure = (req.headers['x-forwarded-proto'] || '').includes('https') ? '; Secure' : '';
  res.setHeader('set-cookie', `ko_sid=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure}`);
}
/* המפתח שתחתיו נשמרת הכניסה ל-ERP של אדם (scripts/erp-login.js): המשתמש, ולבעלים 'owner:'+<erp sub> — לכל מייל בעלים טוקן משלו */
const sessTokenKey = s => s.uid === 'owner' ? (s.erp ? 'owner:' + s.erp : '') : s.uid;
export function erpTokenKey(u) { return !u || !u.erpId ? '' : u.role === 'owner' ? 'owner:' + u.erpId : u.id; }
async function clearSession(req, res) {
  const db = load(), sid = cookies(req).ko_sid;
  const keyOut = sid && db.sessions[sid] ? sessTokenKey(db.sessions[sid]) : '';
  if (sid) { delete db.sessions[sid]; db.deleted.sessions.push(sid); await persist(); }
  if (keyOut && HOOKS.onLogout && !Object.values(db.sessions).some(x => sessTokenKey(x) === keyOut && x.exp >= now())) try { await HOOKS.onLogout(keyOut); } catch {}
  res.setHeader('set-cookie', 'ko_sid=; Path=/; HttpOnly; Max-Age=0');
}

/* --- מה משתמש רואה --- */
export function publicUser(u) {
  return u ? { id: u.id, email: u.email, name: u.name, role: u.role, grants: u.grants || {}, blocked: !!u.blocked, local: !!u.local, erp: !!u.erpId, pending: !!u.pending, emailUnverified: !!u.emailUnverified } : null;
}
/* store מסונן למשתמש מוזמן: רק הפרויקטים שהוענקו לו (עם דגל הרשאה בכל פרויקט) */
/* תפקידים: owner = הגישה המקומית (הכול) · admin = צופה ועורך הכול · pm = מנהל פרויקטים KO: רואה הכול, עורך את שלו ומה שהוענק לו
   · user = משתמש חיצוני: רק מה שיצר ומה ששותף איתו (צפייה / עריכה) */
export const ROLES = ['admin', 'pm', 'user'];
export const ROLE_HE = { owner: 'בעלים', admin: 'אדמין — צופה ועורך הכול', pm: 'מנהל פרויקטים KO — רואה הכול, עורך את שלו', user: 'משתמש חיצוני — רק מה ששותף איתו' };
export const isAdmin = u => !!u && (u.role === 'owner' || u.role === 'admin');
export const isStaff = u => !!u && (u.role === 'owner' || u.role === 'admin' || u.role === 'pm');
export function filterStore(store, user) {
  if (!user || user.role === 'owner') return store;
  if (user.role === 'admin' || user.role === 'pm') {   /* רואה הכול — אבל הפרויקט הפתוח הוא שלו, לא של הבעלים; למנהל פרויקטים: עריכה רק בשלו ובמה שהוענק */
    const g = user.grants || {}, all = store.projects || [];
    const projects = user.role === 'pm' ? all.map(p => ({ ...p, _perm: p.by === user.id || g[p.id] === 'edit' ? 'edit' : 'view' })) : all;
    const want = user.cur;
    return { ...store, projects, cur: want && projects.some(p => p.id === want) ? want : (projects.find(p => p.by === user.id) || projects[0] || {}).id || store.cur, _admin: user.role === 'admin', _staff: true };
  }
  const g = user.grants || {};
  const projects = (store.projects || []).filter(p => g[p.id]).map(p => ({ ...p, _perm: g[p.id] }));
  /* הפרויקט הפתוח נשמר לכל מוזמן בנפרד — אחרת ריענון מחזיר אותו לפרויקט הראשון (או לזה שהבעלים פתח) */
  const want = user.cur || store.cur;
  const cur = projects.some(p => p.id === want) ? want : (projects[0] && projects[0].id) || '';
  return { cur, projects, rearLib: store.rearLib || {}, ampLib: store.ampLib || {}, _shared: true };
}
/* שמירה ממשתמש מוזמן: רק פרויקטים בהרשאת עריכה מוחלפים ב-store המלא; השאר לא נגעו */
export function mergeStore(full, posted, user) {
  if (!user || user.role === 'owner') return posted;
  if (user.role === 'pm') {   /* מנהל פרויקטים: נכתבים רק הפרויקטים שלו ומה שהוענק לו בעריכה; פרויקט חדש נרשם על שמו */
    const g = user.grants || {}, byId = new Map((full.projects || []).map(p => [p.id, p]));
    for (const p of (posted.projects || [])) { const { _perm, ...clean } = p; const o = byId.get(p.id);
      if (o && (o.by === user.id || g[p.id] === 'edit')) { clean.by = clean.by || o.by; byId.set(p.id, clean); }
      else if (!o && !p._lite && p.id) { clean.by = clean.by || user.id; byId.set(p.id, clean); } }
    if (posted.cur && user.cur !== posted.cur) { user.cur = posted.cur; persist(); }
    return { ...full, projects: [...byId.values()] };
  }
  if (user.role === 'admin') {   /* כמו הבעלים — אבל "הפרויקט הפתוח" של הבעלים לא משתנה, ופרויקט חדש נרשם על שמו */
    const had = new Set((full.projects || []).map(p => p.id));
    (posted.projects || []).forEach(p => { if (!had.has(p.id) && !p.by) p.by = user.id; });
    if (posted.cur && user.cur !== posted.cur) { user.cur = posted.cur; persist(); }
    return { ...posted, cur: full.cur };
  }
  const g = user.grants || {};
  const byId = new Map((full.projects || []).map(p => [p.id, p]));
  let dirty = false;
  for (const p of (posted.projects || [])) {
    const { _perm, ...clean } = p;
    if (g[p.id] === 'edit' && byId.has(p.id)) byId.set(p.id, clean);
    /* פרויקט חדש שהמוזמן יצר: נשמר ונרשם לו בהרשאת עריכה — בלי זה הוא נעלם בריענון */
    else if (!byId.has(p.id) && !p._lite && p.id) { clean.by = clean.by || user.id; byId.set(p.id, clean); user.grants = user.grants || {}; user.grants[p.id] = 'edit'; dirty = true; }
  }
  if (posted.cur && user.grants && user.grants[posted.cur] && user.cur !== posted.cur) { user.cur = posted.cur; dirty = true; }
  if (dirty && user.id !== 'owner') persist();
  return { ...full, projects: [...byId.values()] };
}

/* --- כניסה עם KO ERP --- */
/* profile = מה ש-/oauth/userinfo של ה-ERP החזיר: { sub, email, email_verified, name, kind, erp_admin, can_create_offers, offers_refusal }.
   email_verified = true רק לחשבון צוות (נוצר ע"י מנהל ב-ERP); בחשבון חיצוני המייל הוא מה שהאדם הקליד בהרשמה, בלי הוכחה. ERP ישן
   בלי השדה: לפי kind === 'staff'. מייל לא מאומת לא מאמץ אף רשומה קיימת ולא הופך לבעלים — אחרת כל מי שמחזיק קישור הזמנה היה פותח
   חשבון ERP במייל של מישהו אחר ונכנס כאותו אדם.
   opts.linkUid — משתמש הסיסמה שהסשן שלו היה בדפדפן כשהכניסה התחילה (scripts/erp-login.js loginStart); מקושר רק אם הסשן עדיין שלו.
   מחזיר { outcome: 'session' | 'pending' | 'blocked', uid, tokenKey } — 'session' כבר קבע עוגיית סשן; tokenKey = איפה לשמור את הטוקן של האדם */
export async function erpSignIn(req, res, profile, joinToken, opts = {}) {
  await authRefresh(true);
  const db = load();
  const sub = String(profile.sub || ''), email = normEmail(profile.email), name = String(profile.name || '').trim().slice(0, 60);
  if (!sub) return { outcome: 'blocked' };
  const verified = typeof profile.email_verified === 'boolean' ? profile.email_verified : profile.kind === 'staff';
  /* מה שה-ERP אמר עכשיו: האם הטוקן של האדם יכול ליצור הצעות (Google של KO + הרשאת מכירות) — לסיבה על כפתור "שלח" */
  const canOffer = profile.can_create_offers === true, refusal = canOffer ? null : String(profile.offers_refusal || 'account_not_allowed');
  if (profile.kind === 'staff' && verified && email && ownerEmails().includes(email)) {
    db.config.ownerErp = db.config.ownerErp || {};
    db.config.ownerErp[sub] = { email, name, canOffer, refusal, lastLogin: new Date().toISOString() };
    await setSession(res, OWNER, req, { erp: sub });
    return { outcome: 'session', uid: 'owner', tokenKey: 'owner:' + sub };
  }
  let u = db.users.find(x => x.erpId === sub);
  if (!u && opts.linkUid) {   /* מי שכבר מחובר כאן עם סיסמה ונכנס עכשיו עם KO ERP — זה הוא, לפי הסשן ולא לפי המייל */
    const cur = sessionUser(req);
    if (cur && cur.id === opts.linkUid && cur.id !== 'owner' && !cur.erpId && db.users.includes(cur)) u = cur;
  }
  if (!u && email && verified) u = db.users.find(x => !x.erpId && x.email === email);   /* חשבון סיסמה קיים באותו מייל מאומת — מאמצים אותו (תפקיד, הרשאות, פרויקטים) */
  const inv = joinToken ? db.invites.find(i => i.token === joinToken) : null;
  const invOk = !!inv && inviteValid(inv) && (!inv.email || inv.email === email);
  if (u) {
    if (u.blocked) return { outcome: 'blocked' };
    u.erpId = sub; u.erpCanOffer = canOffer; u.erpOffersRefusal = refusal;
    /* מייל מאומת של ה-ERP הוא המעודכן; מייל לא מאומת לא מחליף את מה שברשומה */
    if (verified) { delete u.emailUnverified; if (email && email !== u.email && !db.users.some(x => x !== u && x.email === email)) u.email = email; }
    if (!u.name && name) u.name = name;
    if (invOk) {
      u.grants = u.grants || {}; inv.projects.forEach(pid => { if (u.grants[pid] !== 'edit') u.grants[pid] = inv.perm; });
      if (u.pending) { u.pending = false; if (ROLES.includes(inv.role)) u.role = inv.role; }   /* הזמנה בתוקף = אישור */
      inviteUse(inv, u);
    }
    if (u.pending) { await persist(); return { outcome: 'pending' }; }
    await setSession(res, u, req);
    return { outcome: 'session', uid: u.id, tokenKey: u.id };
  }
  /* מכאן — רשומה חדשה לאדם הזה, גם כשהמייל (הלא מאומת) שלו זהה לשל משתמש קיים: ב-/admin מסומן "מייל לא מאומת" */
  const unv = verified ? {} : { emailUnverified: true };
  if (invOk) {
    const grants = {}; inv.projects.forEach(pid => { grants[pid] = inv.perm; });
    const nu = { id: uid('u'), email, name: name || email.split('@')[0], role: ROLES.includes(inv.role) ? inv.role : 'user', grants, blocked: false, erpId: sub, erpCanOffer: canOffer, erpOffersRefusal: refusal, ...unv, createdAt: new Date().toISOString(), invitedBy: inv.by };
    db.users.push(nu); inviteUse(inv, nu);
    await setSession(res, nu, req);
    return { outcome: 'session', uid: nu.id, tokenKey: nu.id };
  }
  /* לא מוכר, בלי הזמנה: בקשת גישה — מנהל מאשר ב-/admin ובוחר תפקיד; עד אז אין סשן */
  db.users.push({ id: uid('u'), email, name: name || (email ? email.split('@')[0] : 'ERP'), role: 'user', grants: {}, blocked: false, pending: true, erpId: sub, erpCanOffer: canOffer, erpOffersRefusal: refusal, ...unv, createdAt: new Date().toISOString(), invitedBy: null });
  await persist();
  return { outcome: 'pending' };
}
/* דף הכניסה (src/pages/auth.html) לא עובר דרך שכבת התרגום — ההודעה בשתי השפות */
const SIGNUP_TAKEN = 'למייל הזה כבר יש חשבון ב-KO Projects — היכנס קודם עם הכניסה הקיימת שלך, ואז לחץ שוב "צור חשבון KO" כדי לקשר אותו. / This email already has a KO Projects account — sign in with your existing login first, then press "Create KO account" again to link it.';
/* "צור חשבון KO" (/api/auth/erp/signup) למייל שכבר שייך לרשומה כאן: מותר רק למי שמחובר כבר כאותה רשומה (לא מקושרת) —
   הוא יוצר לעצמו חשבון ERP וחוזר לקישור לפי הסשן. אחרת מסרבים: חשבון ERP חדש במייל של רשומה קיימת הוא בדיוק דרך ההשתלטות.
   { ok:true, linking } או { ok:false, error } */
export async function signupEmailCheck(req, email) {
  await authRefresh(true);
  const db = load(), e = normEmail(email);
  const holders = db.users.filter(x => x.email === e);
  if (!holders.length && !ownerEmails().includes(e)) return { ok: true, linking: false };
  const cur = sessionUser(req);
  if (cur && cur.id !== 'owner' && !cur.erpId && holders.includes(cur)) return { ok: true, linking: true };
  return { ok: false, error: SIGNUP_TAKEN };
}
/* הזמנה שמותר ליצור איתה חשבון ERP: בתוקף, ונעולה (אם בכלל) לאותו מייל */
export function inviteForSignup(joinToken, email) {
  const db = load(), inv = db.invites.find(i => i.token === joinToken);
  if (!inv || !inviteValid(inv)) return { ok: false, error: 'קישור ההזמנה לא בתוקף — בקש קישור חדש מבעל המערכת' };
  if (inv.email && inv.email !== normEmail(email)) return { ok: false, error: 'הקישור הזה יועד לכתובת מייל אחרת' };
  return { ok: true };
}
/* למסנכרן מול ה-ERP (erp-login.js startErpSync): המשתמשים המקושרים, ומי מהם עם סשן חי */
export function erpLinkedUsers() {
  const db = load(), t = now(), live = new Set(), liveErp = new Set();
  for (const s of Object.values(db.sessions)) if (s.exp >= t) { live.add(s.uid); if (s.erp) liveErp.add(s.erp); }
  const out = db.users.filter(u => u.erpId).map(u => ({ erpId: u.erpId, role: u.role, pending: !!u.pending, blocked: !!u.blocked, lastLogin: u.lastLogin || null, projectCount: Object.keys(u.grants || {}).length, live: live.has(u.id) }));
  for (const [erpId, o] of Object.entries(db.config.ownerErp || {})) out.push({ erpId, role: 'owner', pending: false, blocked: false, lastLogin: o.lastLogin || null, projectCount: 0, live: liveErp.has(erpId) });
  return out;
}
/* חשבון ERP שהושבת / נמחק: כל הסשנים שלו כאן נסגרים (גם של הבעלים שנכנס דרכו). קישור הבעלים לא נוגע */
export async function endErpSessions(erpIds) {
  await authRefresh(true);
  const db = load(), ids = new Set(erpIds), uids = new Set(db.users.filter(u => ids.has(u.erpId)).map(u => u.id));
  let n = 0;
  for (const [sid, s] of Object.entries(db.sessions)) if (uids.has(s.uid) || (s.uid === 'owner' && s.erp && ids.has(s.erp))) { delete db.sessions[sid]; db.deleted.sessions.push(sid); n++; }
  if (n) await persist();
  return n;
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
  /* כתיבה רק כ-JSON: טופס או text/plain מאתר אחר לא יכול לשנות כאן כלום (מ-localhost כל בקשה היא הבעלים) — JSON מאתר אחר דורש preflight שלא יעבור */
  if (method === 'POST' && !/^application\/json\b/i.test(req.headers['content-type'] || '')) return json(res, 415, { error: 'JSON only' }), true;
  try {
    if (path === '/api/auth/me' && method === 'GET') {
      const isOw = !!(me && me.role === 'owner');
      const erpLogin = HOOKS.erpLoginAvailable ? await HOOKS.erpLoginAvailable().catch(() => false) : false;
      return json(res, 200, { enabled: true, erpLogin, user: publicUser(me), owner: isOw, local: isLocal(req), publicUrl: isOw ? publicUrl() : undefined, ownerLink: isOw ? origin(req) + '/owner/' + db.config.ownerKey : undefined, localOnly: isOw ? isLocalUrl(origin(req)) : undefined }), true;
    }
    if (path === '/api/auth/register' && method === 'POST') {
      /* מרגע שהכניסה עם KO ERP פעילה, חשבון חדש נוצר ב-ERP (משתמשים אחד לשתי המערכות) — לא כאן */
      if (HOOKS.erpLoginAvailable && await HOOKS.erpLoginAvailable().catch(() => false)) return json(res, 409, { error: 'יצירת חשבון עוברת דרך KO ERP — לחץ "צור חשבון KO"' }), true;
      const b = await body(req);
      const email = normEmail(b.email), pw = String(b.password || ''), name = String(b.name || '').trim().slice(0, 60);
      if (!validEmail(email)) return json(res, 400, { error: 'כתובת מייל לא תקינה' }), true;
      if (pw.length < 8) return json(res, 400, { error: 'סיסמה — לפחות 8 תווים' }), true;
      if (db.users.some(u => u.email === email)) return json(res, 409, { error: 'המייל הזה כבר רשום — עבור ללשונית "כניסה" והתחבר עם הסיסמה שלך (ההרשאות מהקישור יתווספו בכניסה)' }), true;
      let role = 'user', grants = {};   /* התפקיד נקבע בהזמנה (admin / pm / user) */
      /* הרשמה רק דרך קישור הזמנה — הבעלים לא נרשם */
      const inv = db.invites.find(i => i.token === b.token);
      if (!inv) return json(res, 403, { error: b.token ? 'קישור ההזמנה לא נמצא — בקש קישור חדש מבעל המערכת' : 'הרשמה רק דרך קישור הזמנה — פתח את הקישור שקיבלת מבעל המערכת' }), true;
      if (inv.revoked) return json(res, 403, { error: 'קישור ההזמנה בוטל — בקש קישור חדש' }), true;
      if (inv.exp < now()) return json(res, 403, { error: 'קישור ההזמנה פג (14 יום) — בקש קישור חדש' }), true;
      if (inv.email && inv.email !== email) return json(res, 403, { error: 'הקישור הזה יועד לכתובת מייל אחרת' }), true;
      if (inv.email && inv.usedBy) return json(res, 403, { error: 'הקישור הזה כבר נוצל — התחבר עם הסיסמה שלך' }), true;
      inv.projects.forEach(pid => { grants[pid] = inv.perm; });
      if (ROLES.includes(inv.role)) role = inv.role;
      const salt = randomBytes(16).toString('hex');
      const u = { id: uid('u'), email, name: name || email.split('@')[0], role, salt, hash: hashPw(pw, salt), grants, blocked: false, createdAt: new Date().toISOString(), invitedBy: inv ? inv.by : null };
      db.users.push(u);
      inviteUse(inv, u);
      await setSession(res, u, req);
      return json(res, 200, { ok: true, user: publicUser(u) }), true;
    }
    if (path === '/api/auth/login' && method === 'POST') {
      const b = await body(req), email = normEmail(b.email);
      const u = db.users.find(x => x.email === email && x.hash) || db.users.find(x => x.email === email);   /* חשבון ERP חיצוני יכול לשאת מייל זהה (לא מאומת) — הסיסמה של בעל המייל קודמת */
      if (u && !u.hash) return json(res, 401, { error: 'החשבון הזה נכנס עם KO ERP — לחץ "כניסה עם KO ERP"' }), true;
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
    const isOwner = me && me.role === 'owner', isAdm = isAdmin(me);
    if (path === '/api/share' && method === 'POST') {
      if (!isStaff(me)) return json(res, 403, { error: 'רק בעל המערכת, אדמין או מנהל פרויקטים יכולים לשתף' }), true;
      const b = await body(req);
      /* מנהל פרויקטים משתף רק את הפרויקטים שלו / שהוענקו לו בעריכה, ורק למשתמשים חיצוניים */
      const canShare = p => isAdm || p.by === me.id || (me.grants || {})[p.id] === 'edit';
      const projects = (b.projects || []).filter(id => (store.projects || []).some(p => p.id === id && canShare(p)));
      const role = ROLES.includes(b.role) && (isAdm || b.role === 'user') ? b.role : 'user';
      if (!projects.length) return json(res, 400, { error: 'בחר לפחות פרויקט אחד' }), true;
      const inv = { token: token(), projects, role, perm: b.perm === 'view' ? 'view' : 'edit', email: normEmail(b.email) || '', label: String(b.label || '').slice(0, 60), by: me.id, createdAt: new Date().toISOString(), exp: now() + INVITE_DAYS * 864e5, usedBy: null };
      db.invites.push(inv); await persist();
      const url = origin(req) + '/join/' + inv.token;
      return json(res, 200, { ok: true, url, exp: inv.exp, invite: inv, localOnly: isLocalUrl(url) }), true;
    }
    if (path === '/api/admin/users' && method === 'GET') {
      if (!isStaff(me)) return json(res, 403, { error: 'forbidden' }), true;
      const pn = Object.fromEntries((store.projects || []).map(p => [p.id, p.name])), pById = new Map((store.projects || []).map(p => [p.id, p]));
      /* לכל משתמש: פרויקטים ששותפו איתו + פרויקטים שהוא יצר (by), עם זמן עריכה אחרון — כדי לפתוח אותם מהאפליקציה */
      const projOf = u => { const g = { ...(u.grants || {}) }; for (const p of store.projects || []) if (p.by === u.id && !g[p.id]) g[p.id] = 'edit';
        return Object.entries(g).filter(([id]) => pById.has(id)).map(([id, perm]) => { const p = pById.get(id); return { id, name: pn[id] || id, perm, created: p.by === u.id, upd: +p.upd || null, nodes: (p.nodes || []).length }; }).sort((a, b) => (b.upd || 0) - (a.upd || 0)); };
      return json(res, 200, {
        users: db.users.map(u => ({ ...publicUser(u), createdAt: u.createdAt, lastLogin: u.lastLogin || null, projects: projOf(u) })),
        invites: db.invites.map(i => ({ token: i.token, url: origin(req) + '/join/' + i.token, uses: (i.uses || []).length, valid: inviteValid(i), projects: i.projects.map(id => pn[id] || id), perm: i.perm, email: i.email, label: i.label, createdAt: i.createdAt, exp: i.exp, usedBy: i.usedBy ? (db.users.find(u => u.id === i.usedBy) || {}).email : null, revoked: !!i.revoked })),
      }), true;
    }
    /* "הוסף מה-ERP": חיפוש בספריית האנשים של ה-ERP, והוספה לפני שהאדם נכנס בכלל */
    if (path === '/api/admin/erp-search' && method === 'GET') {
      if (!isOwner) return json(res, 403, { error: 'forbidden' }), true;
      const q = String(new URL(req.url, 'http://x').searchParams.get('q') || '').trim();
      if (q.length < 2) return json(res, 200, { ok: true, users: [] }), true;
      if (!HOOKS.searchErpUsers) return json(res, 503, { error: 'החיבור ל-ERP לא זמין' }), true;
      try {
        const r = await HOOKS.searchErpUsers(q);
        if (!r.ok) return json(res, 409, { error: 'KO Projects עוד לא מחובר ל-ERP — "חיבור ל-ERP" במסך הקיטים' }), true;
        const known = new Map(db.users.filter(x => x.erpId).map(x => [x.erpId, x.id]));
        return json(res, 200, { ok: true, users: r.users.map(x => ({ ...x, linked: known.has(x.id) })) }), true;
      } catch (e) { return json(res, 502, { error: 'ה-ERP לא השיב — נסה שוב' }), true; }
    }
    if (path === '/api/admin/erp-add' && method === 'POST') {
      if (!isOwner) return json(res, 403, { error: 'forbidden' }), true;
      const b = await body(req);
      const sub = String(b.erpId || ''), email = normEmail(b.email), role = ROLES.includes(b.role) ? b.role : 'user';
      if (!/^[0-9a-f-]{36}$/i.test(sub) || !validEmail(email)) return json(res, 400, { error: 'משתמש ERP לא תקין' }), true;
      if (db.users.some(x => x.erpId === sub)) return json(res, 409, { error: 'כבר ברשימה' }), true;
      const ex = db.users.find(x => !x.erpId && x.email === email);
      if (ex) { ex.erpId = sub; ex.pending = false; ex.role = role; }
      else db.users.push({ id: uid('u'), email, name: String(b.name || '').trim().slice(0, 60) || email.split('@')[0], role, grants: {}, blocked: false, erpId: sub, createdAt: new Date().toISOString(), invitedBy: me.id });
      await persist();
      return json(res, 200, { ok: true }), true;
    }
    if (path === '/api/admin/user' && method === 'POST') {
      if (!isOwner) return json(res, 403, { error: 'forbidden' }), true;
      const b = await body(req); const u = db.users.find(x => x.id === b.id);
      if (!u) return json(res, 404, { error: 'משתמש לא נמצא' }), true;
      if (u.role === 'owner') return json(res, 400, { error: 'הבעלים הוא הגישה המקומית — אין מה לחסום' }), true;
      const dropSessions = () => Object.keys(db.sessions).forEach(s => { if (db.sessions[s].uid === u.id) { delete db.sessions[s]; db.deleted.sessions.push(s); } });
      if (b.action === 'block') { u.blocked = true; dropSessions(); }
      else if (b.action === 'unblock') u.blocked = false;
      else if (b.action === 'delete') { db.users = db.users.filter(x => x.id !== u.id); db.deleted.users.push(u.id); dropSessions(); }
      else if (b.action === 'role') { u.role = ROLES.includes(b.role) ? b.role : 'user'; dropSessions(); }
      else if (b.action === 'approve') { u.pending = false; u.role = ROLES.includes(b.role) ? b.role : 'user'; }   /* בקשת גישה מ-KO ERP: נכנס בפעם הבאה */
      else if (b.action === 'reject') { db.users = db.users.filter(x => x.id !== u.id); db.deleted.users.push(u.id); dropSessions(); }   /* admin רואה את כל הפרויקטים; הסשן מתחדש כדי שהתפקיד ייכנס לתוקף */
      else if (b.action === 'grant') { u.grants = u.grants || {}; if (b.perm === 'none') { delete u.grants[b.project]; if (u.cur === b.project) delete u.cur; } else { u.grants[b.project] = b.perm === 'view' ? 'view' : 'edit'; u.cur = b.project; /* ייפתח אצלו בכניסה הבאה */ } }
      else return json(res, 400, { error: 'unknown action' }), true;
      await persist();
      return json(res, 200, { ok: true }), true;
    }
    if (path === '/api/admin/config' && method === 'GET') {
      if (!isOwner) return json(res, 403, { error: 'forbidden' }), true;
      /* erpLogin — מיילי הבעלים ו"הוסף מה-ERP" מוצגים רק כשהכניסה עם KO ERP פעילה (כמו הכפתור בדף הכניסה) */
      const erpLogin = HOOKS.erpLoginAvailable ? await HOOKS.erpLoginAvailable().catch(() => false) : false;
      return json(res, 200, { publicUrl: db.config.publicUrl || '', envPublicUrl: process.env.PUBLIC_URL || '', effective: publicUrl(), ownerLink: origin(req) + '/owner/' + db.config.ownerKey, localOnly: isLocalUrl(origin(req)), ownerEmails: db.config.ownerEmails || [], envOwnerEmail: process.env.OWNER_EMAIL || '', erpLogin }), true;
    }
    if (path === '/api/admin/config' && method === 'POST') {
      if (!isOwner) return json(res, 403, { error: 'forbidden' }), true;
      const b = await body(req);
      if (Array.isArray(b.ownerEmails)) {   /* מיילים שכניסה איתם דרך KO ERP היא הבעלים */
        const list = b.ownerEmails.map(normEmail).filter(Boolean);
        if (list.some(e => !validEmail(e))) return json(res, 400, { error: 'מייל לא תקין ברשימת הבעלים' }), true;
        db.config.ownerEmails = [...new Set(list)].slice(0, 10); await persist();
        return json(res, 200, { ok: true, ownerEmails: db.config.ownerEmails }), true;
      }
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
      else if (b.action === 'delete') { db.invites = db.invites.filter(i => i !== inv); db.deleted.invites.push(inv.token); }
      await persist();
      return json(res, 200, { ok: true }), true;
    }
  } catch (e) { return json(res, 400, { error: String(e.message || e) }), true; }
  return false;
}
