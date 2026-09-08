// ===================================================================================
// KO Projects — מעקב באגים. שרת בלבד (scripts/dev-server.js).
// כל משתמש מחובר (בעלים או מוזמן) מדווח באג: כותרת, תיאור, קבצים (צילומי מסך, סרטון מסך
// שהוקלט בדפדפן, PDF). הבעלים רואה את כולם ב-/bugs, משנה סטטוס ומגיב; המדווח רואה את
// הבאגים שלו ואת התגובות בתוך האפליקציה.
// אחסון: data/bugs.json + data/bug_files/ (שניהם מחוץ ל-git).
// ===================================================================================
import { readFileSync, writeFileSync, existsSync, mkdirSync, createReadStream, statSync, unlinkSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const FILE = 'data/bugs.json', DIR = 'data/bug_files';
export const STATUSES = ['new', 'open', 'fixed', 'closed', 'wontfix'];
export const STATUS_HE = { new: 'חדש', open: 'בטיפול', fixed: 'תוקן', closed: 'סגור', wontfix: 'לא יתוקן' };
const MAX_FILE = 80 * 1024 * 1024;   /* 80MB לקובץ — סרטון מסך של כמה דקות */

let DB = null;
function load() {
  if (DB) return DB;
  try { DB = existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : null; } catch { DB = null; }
  DB = DB || { bugs: [] }; DB.bugs = DB.bugs || [];
  return DB;
}
function persist() { writeFileSync(FILE, JSON.stringify(load(), null, 1)); }
const uid = p => p + randomBytes(6).toString('hex');
const nowIso = () => new Date().toISOString();
function json(res, code, obj) { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(obj)); }
function body(req, limit = 120 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const ch = []; let n = 0;
    req.on('data', c => { n += c.length; if (n > limit) { reject(new Error('הקובץ גדול מדי')); req.destroy(); } else ch.push(c); });
    req.on('end', () => { try { resolve(ch.length ? JSON.parse(Buffer.concat(ch).toString('utf8')) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}
const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp', 'video/webm': 'webm', 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'application/pdf': 'pdf', 'text/plain': 'txt' };
function saveAttachment(a) {
  /* a = { name, type, data (base64 data-URL או base64 גולמי) } */
  const m = /^data:([^;]+);base64,(.*)$/s.exec(a.data || '');
  const type = (m ? m[1] : a.type) || 'application/octet-stream';
  const buf = Buffer.from(m ? m[2] : (a.data || ''), 'base64');
  if (!buf.length) return null;
  if (buf.length > MAX_FILE) throw new Error('קובץ "' + (a.name || '') + '" גדול מ-80MB');
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
  const ext = EXT[type] || (String(a.name || '').split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'bin';
  const id = uid('f'), file = `${id}.${ext}`;
  writeFileSync(`${DIR}/${file}`, buf);
  return { id, name: String(a.name || file).slice(0, 80), type, size: buf.length, file };
}
const isOwner = u => u && u.role === 'owner';
const canSee = (u, b) => isOwner(u) || (u && b.by && b.by.id === u.id);
export function publicBug(b, u) {
  return { ...b, mine: !!(u && b.by && b.by.id === u.id) };
}
export function newCount() { return load().bugs.filter(b => b.status === 'new').length; }

/* מחזיר true אם הבקשה טופלה. me = המשתמש (חובה — בלי משתמש אין גישה) */
export async function handleBugs(req, res, path, me, ctx) {
  if (!path.startsWith('/api/bugs')) return false;
  const db = load(), method = req.method;
  if (!me) return json(res, 401, { error: 'login required' }), true;
  try {
    if (path === '/api/bugs' && method === 'GET') {
      const list = db.bugs.filter(b => canSee(me, b)).map(b => publicBug(b, me)).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      return json(res, 200, { bugs: list, owner: isOwner(me), statuses: STATUSES, statusHe: STATUS_HE }), true;
    }
    if (path === '/api/bugs/count' && method === 'GET') {
      const mine = db.bugs.filter(b => canSee(me, b));
      /* לבעלים: באגים חדשים; למדווח: תגובות של הבעלים שעוד לא נראו */
      const n = isOwner(me) ? mine.filter(b => b.status === 'new').length : mine.filter(b => (b.comments || []).some(c => c.owner && !(b.seenBy || {})[me.id] )).length;
      return json(res, 200, { n }), true;
    }
    if (path === '/api/bugs' && method === 'POST') {
      const b = await body(req);
      const title = String(b.title || '').trim().slice(0, 140), desc = String(b.desc || '').trim().slice(0, 5000);
      if (!title && !desc) return json(res, 400, { error: 'כתוב כותרת או תיאור' }), true;
      const atts = [];
      for (const a of (b.attachments || []).slice(0, 8)) { const s = saveAttachment(a); if (s) atts.push(s); }
      const bug = { id: uid('b'), title: title || desc.slice(0, 60), desc, status: 'new', by: { id: me.id, name: me.name, email: me.email || '' },
        createdAt: nowIso(), updatedAt: nowIso(), page: String(b.page || '').slice(0, 200), project: String(b.project || '').slice(0, 80), ua: String(req.headers['user-agent'] || '').slice(0, 120), attachments: atts, comments: [], seenBy: { [me.id]: nowIso() } };
      db.bugs.push(bug); persist();
      return json(res, 200, { ok: true, bug: publicBug(bug, me) }), true;
    }
    const m = /^\/api\/bugs\/([A-Za-z0-9]+)\/(comment|status|seen|delete)$/.exec(path);
    if (m && method === 'POST') {
      const bug = db.bugs.find(x => x.id === m[1]);
      if (!bug || !canSee(me, bug)) return json(res, 404, { error: 'באג לא נמצא' }), true;
      const b = await body(req);
      if (m[2] === 'comment') {
        const text = String(b.text || '').trim().slice(0, 4000);
        const atts = []; for (const a of (b.attachments || []).slice(0, 4)) { const s = saveAttachment(a); if (s) atts.push(s); }
        if (!text && !atts.length) return json(res, 400, { error: 'תגובה ריקה' }), true;
        bug.comments.push({ id: uid('c'), by: me.id, name: me.name, owner: isOwner(me), text, attachments: atts, at: nowIso() });
        bug.updatedAt = nowIso(); bug.seenBy = { ...(bug.seenBy || {}), [me.id]: nowIso() };
        if (!isOwner(me) && bug.status === 'closed') bug.status = 'open';   /* המדווח חזר — נפתח מחדש */
      } else if (m[2] === 'status') {
        if (!isOwner(me)) return json(res, 403, { error: 'רק הבעלים משנה סטטוס' }), true;
        if (!STATUSES.includes(b.status)) return json(res, 400, { error: 'סטטוס לא חוקי' }), true;
        bug.status = b.status; bug.updatedAt = nowIso();
      } else if (m[2] === 'seen') {
        bug.seenBy = { ...(bug.seenBy || {}), [me.id]: nowIso() };
      } else if (m[2] === 'delete') {
        if (!isOwner(me)) return json(res, 403, { error: 'רק הבעלים מוחק' }), true;
        for (const a of bug.attachments || []) { try { unlinkSync(`${DIR}/${a.file}`); } catch {} }
        db.bugs = db.bugs.filter(x => x !== bug);
      }
      persist();
      return json(res, 200, { ok: true, bug: db.bugs.includes(bug) ? publicBug(bug, me) : null }), true;
    }
    const f = /^\/api\/bugs\/file\/([A-Za-z0-9]+)$/.exec(path);
    if (f && method === 'GET') {
      let att = null, bug = null;
      for (const bg of db.bugs) {
        const all = [...(bg.attachments || []), ...(bg.comments || []).flatMap(c => c.attachments || [])];
        const a = all.find(x => x.id === f[1]); if (a) { att = a; bug = bg; break; }
      }
      if (!att || !canSee(me, bug)) { res.writeHead(404); res.end('not found'); return true; }
      const p = `${DIR}/${att.file}`;
      if (!existsSync(p)) { res.writeHead(404); res.end('file missing'); return true; }
      res.writeHead(200, { 'content-type': att.type || 'application/octet-stream', 'content-length': statSync(p).size, 'cache-control': 'private, max-age=3600', 'content-disposition': 'inline; filename="' + encodeURIComponent(att.name) + '"' });
      createReadStream(p).pipe(res); return true;
    }
  } catch (e) { return json(res, 400, { error: String(e.message || e) }), true; }
  return false;
}
