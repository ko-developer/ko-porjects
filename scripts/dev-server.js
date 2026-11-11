// Minimal dev server: rebuilds on each request so the page is always current.
// + API של פרויקטים מעל data/projects.sqlite — האפליקציה נטענת ונשמרת מה-DB כשהשרת רץ.
import { createServer, get as httpGet } from 'node:http';
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { gzipSync, gzip } from 'node:zlib';
import { execFile } from 'node:child_process';
import { stat, readdir, readFile, writeFile } from 'node:fs/promises';
import { makeStorage } from './storage.js';
import { openStore, readStore, writeStore } from './db.js';
import { isLocal, requestUser, sessionUser, handleAuth, handleOwnerLink, filterStore, mergeStore, publicUser, initAuth, authRefresh, isAdmin, erpSignIn, erpLinkedUsers, endErpSessions, setAuthHooks, inviteForSignup, signupEmailCheck, erpTokenKey } from './auth.js';
import { erpLoginAvailable, loginStart, loginCallback, BIND_COOKIE, saveUserTokens, forgetUserTokens, startErpSync, searchErpUsers, accessTokenFor, requestSignupLink } from './erp-login.js';
import { erpQuotes, erpQuoteItems, erpOrdersIndex } from './erp-client.js';
import { handleErp } from './erp-routes.js';
import { reportTokenFor, projectForReportToken } from './report-links.js';
import { handleBugs, initBugs } from './bugs.js';
import { injectLogicData } from './logic-data.js';

/* .env (לא בגיט): DATA_BUCKET, PUBLIC_URL, מפתחות — כמו בענן, רק מקומית */
try { for (const line of readFileSync('.env', 'utf8').split('\n')) { const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim(); } } catch {}
const PORT = process.env.PORT || 4177;
/* שכבת האחסון: DATA_BUCKET → דלי הענן (מקומי והענן על אותם נתונים); בלעדיו — data/ מקומית */
let storage = makeStorage(), storageWarn = '', fallbackSince = 0, fallbackWrites = 0;
/* בדיקת הדלי בעלייה — עד 6 ניסיונות (כחצי דקה): כשל רגעי (רשת, מחשב עמוס) לא מפיל אותנו לנתונים מקומיים */
const checkStorage = async tries => { let last; for (let i = 0; i < tries; i++) { try { await storage.check(); return; } catch (e) { last = e; console.warn('[storage] ניסיון ' + (i + 1) + '/' + tries + ' נכשל: ' + (e.message || e)); if (i < tries - 1) await new Promise(r => setTimeout(r, 5000)); } } throw last; };
try { await checkStorage(process.env.K_SERVICE ? 1 : 6); }
catch (e) {
  /* הדלי לא זמין — לא נופלים: עובדים על data/ מקומית עם אזהרה בולטת בטרמינל ובאפליקציה,
     ומנסים להתחבר מחדש ברקע כל 30 שניות; כשהחיבור חוזר השרת מתאתחל לבד (לולאת ההפעלה מרימה אותו על הדלי) */
  const why = String(e.message || e);
  if (process.env.K_SERVICE || process.env.DATA_FALLBACK === 'off') { console.error('\n❌ אחסון לא זמין (' + storage.label + '): ' + why + '\n'); process.exit(1); }
  storageWarn = 'הדלי בענן לא זמין — עובדים על נתונים מקומיים (לא מסונכרן עם השרת!). ' + why;
  console.error('\n⚠  ' + storageWarn + '\n   השרת ינסה להתחבר מחדש כל 30 שניות ויתאתחל לבד כשהדלי יחזור' + (/gcloud/.test(why) ? '   (תיקון ידני: gcloud auth login)' : '') + '\n');
  const cloud = storage; fallbackSince = Date.now();
  delete process.env.DATA_BUCKET; storage = makeStorage();
  setInterval(async () => {
    try { await cloud.check(); } catch { return; }
    /* שמירות שנעשו בינתיים על הנתונים המקומיים — נשמרות לקובץ לפני האתחול, כדי שלא יאבדו */
    if (fallbackWrites) {
      try {
        const st = await readStore(db), { projects = [], cur, ...extra } = st;
        const changed = projects.filter(p => (+p.upd || 0) >= fallbackSince);
        const f = 'data/fallback-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.json';
        writeFileSync(f, JSON.stringify({ cur, extra, projects: changed }));
        console.error('[storage] ' + changed.length + ' פרויקטים נשמרו מקומית בזמן הניתוק — עותק ב-' + f);
      } catch (e2) { console.error('[storage] שמירת הגיבוי המקומי נכשלה:', e2.message); }
    }
    console.error('[storage] הדלי חזר להיות זמין — מאתחל את השרת כדי לעבוד עליו');
    process.exit(3);
  }, 30e3).unref();
}
/* מטמון קצר לקבצים שנקראים בכל בקשה (פריסות/תמונות גב, מצב טבלאות) — קריאה לדלי פעם ב-15 שניות, לא בכל טעינת דף */
const CUR_TTL = 15e3, curCache = new Map(), curInflight = new Map();
const CUR_DISK = process.env.K_SERVICE ? null : 'data/.cache-gcs';
const curDisk = key => CUR_DISK + '/cur-' + key.replace(/[^A-Za-z0-9._-]/g, '_');
/* הדף לא מחכה לדלי: מגישים מיד מהזיכרון / ממטמון הדיסק / מהריפו, ומרעננים מהדלי ברקע (פעם ב-15 שניות, בקשה אחת בכל פעם) */
const readCached = (key, fn, ttl = CUR_TTL) => {
  const c = curCache.get(key);
  const refresh = () => {
    if (curInflight.has(key)) return curInflight.get(key);
    const p = fn().then(v => { curCache.set(key, { t: Date.now(), v }); if (CUR_DISK && v) { try { mkdirSync(CUR_DISK, { recursive: true }); writeFile(curDisk(key), v).catch(() => {}); } catch {} } return v; })
      .catch(e => { console.warn('refresh ' + key + ' failed:', e.message); return c ? c.v : null; })
      .finally(() => curInflight.delete(key));
    curInflight.set(key, p); return p;
  };
  if (c) { if (c.t < Date.now() - ttl) refresh(); return Promise.resolve(c.v); }
  if (CUR_DISK && existsSync(curDisk(key))) { const v = readFileSync(curDisk(key)); curCache.set(key, { t: 0, v }); refresh(); return Promise.resolve(v); }
  return refresh();
};
const imgVer = new Map();   /* קובץ תמונה → ה-?v= האחרון שנשאל */
const curInvalidate = key => { curCache.delete(key); if (CUR_DISK) { try { unlinkSync(curDisk(key)); } catch {} } };
const db = openStore(storage);
/* תשובות טקסט גדולות (הדף, ה-store) נדחסות gzip כשהדפדפן תומך — 2.4MB HTML → ~0.5MB */
const imgProxyCache = new Map();   /* /img-proxy — תמונות מוצרים שהובאו ממקור אחר */

function sendText(req, res, code, headers, body) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(body, 'utf8');
  if (buf.length > 1024 && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
    gzip(buf, { level: 6 }, (e, out) => { if (e) { res.writeHead(code, headers); res.end(buf); return; } res.writeHead(code, { ...headers, 'content-encoding': 'gzip', vary: 'accept-encoding' }); res.end(out); });
  } else { res.writeHead(code, headers); res.end(buf); }
}
/* בנייה מקומית של הדף: רק כשקובץ מקור (src/, data/*.json, scripts/assemble.js) חדש מהבנייה האחרונה — ברקע, לא חוסמת,
   ובקשות מקבילות ממתינות לאותה בנייה. בעבר רצה בנייה מלאה סינכרונית (כולל 74 תמונות) בכל טעינת דף — וחסמה את כל השרת */
const SRC_WATCH = ['src', 'data', 'scripts/assemble.js', 'scripts/build.js', 'scripts/build-lite.js'];
let buildP = null; const builtStamp = {};
async function srcStamp() {
  let m = 0;
  for (const d of SRC_WATCH) { try { const st0 = await stat(d); if (!st0.isDirectory()) { if (st0.mtimeMs > m) m = st0.mtimeMs; continue; }
    for (const f of await readdir(d)) { if (f.startsWith('.')) continue; try { const st1 = await stat(d + '/' + f); if (st1.isFile() && st1.mtimeMs > m) m = st1.mtimeMs; } catch {} } } catch {} }
  return m;
}
async function ensureBuilt(isStudio) {
  if (process.env.PREBUILT) return;
  const key = isStudio ? 'studio' : 'app', out = isStudio ? 'dist/studio.html' : 'dist/index.html';
  const stamp = await srcStamp();
  if ((builtStamp[key] || 0) >= stamp && existsSync(out)) return;
  if (!buildP) buildP = new Promise((res, rej) => execFile(process.execPath, [isStudio ? 'scripts/build-lite.js' : 'scripts/build.js'], { maxBuffer: 16e6 }, (e, so, se) => e ? rej(new Error(String(se || e.message))) : res()))
    .then(() => { builtStamp[key] = stamp; }).finally(() => { buildP = null; });
  await buildP;
}
/* store "קל" לדפדפן: הכבדים (תמונת רקע, PDF מקורי, היסטוריית גרסאות = ~40MB על 113 פרויקטים) לא נשלחים —
   רק הפרויקט הפתוח מקבל את תמונת הרקע שלו; השאר מסומנים hasBg/hasPdf/versN ונטענים לפי דרישה מ-/api/project/<id>.
   בשמירה (POST) הדפדפן מחזיר את הפרויקטים בלי הכבדים — hydrateStore משלים אותם מהעותק השמור */
const HEAVY = ['bg', 'bgPdf', 'bgs', 'bgPdfs', 'vers', 'thumb', 'sndImg'];
const ORD_IDX = new Map();   /* אינדקס ההצעות מה-ERP למנהל הפרויקטים — לפי מי שמחובר */
/* גרסה = תוכן בלבד: תמונות שנכנסו לצילום גרסה (דפדפן ישן) נמחקות — 30 גרסאות × 5MB תמונות הפילו את השרת בענן */
function slimVers(p) {
  if (!p || !Array.isArray(p.vers)) return p;
  for (const v of p.vers) { const x = v && v.d; if (!x || typeof x !== 'object') continue; for (const k of ['bg', 'bgPdf', 'bgs', 'bgPdfs', 'thumb', 'sndImg', 'vers']) if (k in x) delete x[k]; }
  return p;
}
function liteStore(st, curId) {
  return { ...st, projects: (st.projects || []).map(p => {
    const { bg, bgPdf, bgs, bgPdfs, vers, thumb, sndImg, ...rest } = p;
    if (sndImg) { if (p.id === curId) rest.sndImg = sndImg; else rest.hasSnd = true; }   /* צילומי סימולציה מדוח הסאונד */
    if (thumb) rest.hasThumb = true;   /* תמונה ממוזערת של התכנית (לרשימת הפרויקטים) — מוגשת מ-/api/project/<id>/thumb */
    if (bg) { if (p.id === curId) rest.bg = bg; else rest.hasBg = true; }
    if (bgPdf) rest.hasPdf = true;
    if (bgs && Object.keys(bgs).length) { if (p.id === curId) rest.bgs = bgs; else rest.hasBgs = true; }        /* תכניות רקע של כל גיליונות הפרויקט */
    if (bgPdfs && Object.keys(bgPdfs).length) { if (p.id === curId) rest.bgPdfs = bgPdfs; else rest.hasPdfs = true; }
    if (vers && vers.length) rest.versN = vers.length;
    rest._lite = true; return rest; }) };
}
function hydrateStore(full, posted) {
  const byId = new Map((full.projects || []).map(p => [p.id, p]));
  return { ...posted, projects: (posted.projects || []).map(p => {
    if (!p._lite) return p;
    if (!byId.has(p.id)) return null;   /* פרויקט קל שכבר לא קיים בשרת (נמחק מצד אחר) — לא מוחזר לחיים מעותק חלקי */
    const { _lite, hasBg, hasPdf, hasBgs, hasPdfs, hasThumb, hasSnd, versN, ...q } = p, old = byId.get(p.id) || {};
    if (!('bgs' in q) && hasBgs && old.bgs) q.bgs = old.bgs;
    if (!('bgPdfs' in q) && hasPdfs && old.bgPdfs) q.bgPdfs = old.bgPdfs;
    /* מעבר לפרויקט מרובה-תכניות: התמונות עברו ממפתח p.bg למפה p.bgs לפי גיליון.
       גיליון שמסומן hasBg אבל התמונה שלו לא נשלחה — משלימים מהעותק השמור (bgs לפי מזהה, או p.bg הישן של הגיליון הראשון).
       בלי זה שמירה ראשונה אחרי המעבר מוחקת את תכנית הרקע. */
    if (Array.isArray(q.sheets) && q.sheets.length) {
      q.bgs = { ...(old.bgs || {}), ...(q.bgs || {}) };
      q.bgPdfs = { ...(old.bgPdfs || {}), ...(q.bgPdfs || {}) };
      const first = q.sheets[0];
      if (first && first.hasBg && !q.bgs[first.id] && old.bg) q.bgs[first.id] = old.bg;
      if (first && first.hasPdf && !q.bgPdfs[first.id] && old.bgPdf) q.bgPdfs[first.id] = old.bgPdf;
      for (const sh of q.sheets) { if (!q.bgs[sh.id] && old.bgs && old.bgs[sh.id]) q.bgs[sh.id] = old.bgs[sh.id]; }
      if (Object.keys(q.bgs).length) { delete q.bg; delete q.bgPdf; } else { if (old.bg) q.bg = old.bg; if (old.bgPdf) q.bgPdf = old.bgPdf; }
    }
    if (!('sndImg' in q) && hasSnd && old.sndImg) q.sndImg = old.sndImg;
    if (!('thumb' in q) && hasThumb && old.thumb) q.thumb = old.thumb;
    if (!('bg' in q) && hasBg && old.bg) q.bg = old.bg;              /* לא נשלחה תמונה אבל הייתה — נשארת; בלי hasBg = המשתמש מחק */
    if (!('bgPdf' in q) && hasPdf && old.bgPdf) q.bgPdf = old.bgPdf;
    if (old.vers && old.vers.length) {                                /* גרסאות: הישנות מהשרת + החדשות מהדפדפן, בלי כפילויות, עד 30 */
      const seen = new Set((q.vers || []).map(v => v.t)); q.vers = [...old.vers.filter(v => !seen.has(v.t)), ...(q.vers || [])].sort((a, b) => a.t - b.t).slice(-30);
    }
    slimVers(q);
    /* סדר המפתחות כמו בעותק השמור — פרויקט שלא השתנה נותן JSON זהה ולא נכתב שוב לדלי */
    const ordered = {}; for (const k of Object.keys(old)) if (k in q) ordered[k] = q[k]; for (const k of Object.keys(q)) if (!(k in ordered)) ordered[k] = q[k];
    return ordered; }).filter(Boolean) };
}
await initAuth(storage); await initBugs(storage);
/* כניסה עם KO ERP (scripts/erp-login.js): רשימת המשתמשים נשלחת ל-ERP אחרי כל שינוי, וחשבונות ERP שהושבתו מנתקים את הסשנים שלהם */
const erpSync = startErpSync({ env: process.env, getStorage: () => storage, auth: { erpLinkedUsers, endErpSessions } });
setAuthHooks({
  onChange: erpSync.pushSoon,
  onLogout: uid => forgetUserTokens(storage, uid),
  erpLoginAvailable: () => erpLoginAvailable(process.env, storage),
  searchErpUsers: q => searchErpUsers(process.env, storage, q)
});
/* בשם מי פונים ל-ERP: הטוקן של האדם שנכנס עם KO ERP (גם הבעלים, אם נכנס כך — לכל מייל בעלים טוקן משלו, 'owner:'+erp). בלעדיו — { personal:false, reason } */
async function erpCaller(me) {
  const uidT = erpTokenKey(me);
  const name = me.name || me.email || '';
  if (!uidT) return { personal: false, name, reason: 'not_signed_in' };
  if (me.erpCanOffer === false) return { personal: false, name, reason: me.erpOffersRefusal || 'account_not_allowed' };
  const t = await accessTokenFor(process.env, storage, uidT);
  if (!t.ok) return { personal: false, name, reason: t.reason === 'signin' ? 'signin_again' : 'erp_unreachable' };
  return { personal: true, name, auth: { url: t.base + '/api/mcp', token: t.token } };
}
const reqOrigin = req => `${String(req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim()}://${req.headers['x-forwarded-host'] || req.headers.host}`;
/* קישור דוח לקריאה בלבד (/r/<token>, scripts/report-links.js): מי שמחזיק בטוקן רואה את הדוח של פרויקט אחד, בלי כניסה —
   גם בתוך iframe של ה-ERP, שבו אין עוגיות של צד שלישי. הזהות: הדף עצמו לפי הנתיב; קריאות fetch מהדף לפי x-ko-report (ראו
   REPORT_SHIM); תמונות לפי ה-Referer מאותו מקור (Referrer-Policy: same-origin בדף). הצופה רואה רק את הפרויקט, בהרשאת צפייה,
   ולא נוגע בשום ראוט אחר — גם מ-localhost, שבו אחרת הבעלים */
/* ה-ERP המקומי (localhost:5890) רק כשהשרת רץ על המחשב — בענן (K_SERVICE) רק מה שמוגדר */
const ERP_FRAME_ORIGINS = String(process.env.ERP_FRAME_ORIGINS || ('https://erp.kot.co.il' + (process.env.K_SERVICE ? '' : ',http://localhost:5890'))).split(',').map(s => s.trim().replace(/\/+$/, '')).filter(Boolean);
const VIEWER_PATHS = [/^\/r\/[A-Za-z0-9_-]+$/, /^\/api\/store$/, /^\/api\/project\/[A-Za-z0-9_-]+(\/thumb)?$/, /^\/rear-img\//, /^\/img-proxy$/];
async function reportViewer(req, path0) {
  let token = '';
  const m = /^\/r\/([A-Za-z0-9_-]+)$/.exec(path0);
  if (m) token = m[1];
  else if (req.headers['x-ko-report']) token = String(req.headers['x-ko-report']);
  else if (/^\/(rear-img\/|img-proxy$|api\/project\/[A-Za-z0-9_-]+\/thumb$)/.test(path0)) {
    try { const ref = new URL(String(req.headers.referer || '')); const rm = /^\/r\/([A-Za-z0-9_-]+)$/.exec(ref.pathname); if (rm && ref.host === req.headers.host) token = rm[1]; } catch {}
  }
  if (!token) return null;
  const pid = await projectForReportToken(storage, token);
  if (!pid) return null;
  return { id: 'viewer', role: 'user', name: '', email: '', grants: { [pid]: 'view' }, viewer: true, projectId: pid, token };
}
/* בדף הצופה: כל fetch לאותו מקור נושא את הטוקן; שמירה של ה-store לא יוצאת בכלל (הדוח לקריאה בלבד) */
const REPORT_SHIM = token => `<script>(function(){var T=${JSON.stringify(token)},F=window.fetch;window.fetch=function(u,o){try{var url=new URL(typeof u==='string'?u:u.url,location.href);if(url.origin===location.origin){o=Object.assign({},o||{});var m=String(o.method||'GET').toUpperCase();if(m!=='GET'&&m!=='HEAD'&&url.pathname==='/api/store')return Promise.resolve(new Response('{"ok":true}',{status:200,headers:{'content-type':'application/json'}}));var h=new Headers(o.headers||(typeof u!=='string'&&u.headers)||{});h.set('x-ko-report',T);o.headers=h;}}catch(e){}return F.call(this,u,o);};})();</script>`;
/* מה שהצופה מקבל: קישור הדוח הולך לקבלנים בלי כניסה, ולכן הדף לא נושא מחירים, קיטים, הזמנות או נתוני מכירה.
   הדוח עצמו (exportPDF0) קורא מהקטלוג רק שמות פריטים (תמונות לפי דגם, אביזרי תלייה) ואת הסדר "קודם הכי הרבה במלאי, אחר כך
   מה שנמכר לאחרונה" שבו mountProductFor בוחר אביזר תלייה לטבלת המתקין — לכן ERP_ITEMS נשאר עם שמות ודירוג מלאי במקום מחיר
   וכמות, ו-ERP_SOLD עם דירוג במקום תאריכים וכמויות: אותו סדר בדיוק (byStockThenSold), בלי המספרים. השאר — ריק */
const rankOf = vals => { const m = new Map([...new Set(vals)].sort((a, b) => a - b).map((v, i) => [v, i + 1])); return v => m.get(v); };
const VIEWER_DATA = {
  ERP_PRICES: () => ({}),
  ERP_KITS: () => [],
  ERP_CATALOG: () => [],
  ERP_FILTERS: () => ({}),
  KIT_META: () => ({}),
  ERP_ITEMS: rows => { const r = rankOf(rows.map(x => +x[3] || 0).filter(q => q > 0)); return rows.map(([k, n, , q]) => [k, n, 0, +q > 0 ? r(+q) : 0]); },
  /* stockRank: פריט שאזל — לפי תאריך המכירה האחרונה ואז מספר השורות. דירוג אחד לזוג, כתאריך מלאכותי (2000-01-01 + הדירוג בימים) */
  ERP_SOLD: sold => {
    const keyOf = v => [Date.parse(v[0] + 'T00:00:00') || 0, +v[1] || 0];
    const idx = new Map();
    Object.values(sold).map(keyOf).filter(p => p[0]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).forEach(p => { if (!idx.has(p.join())) idx.set(p.join(), idx.size + 1); });
    const out = {};
    for (const [k, v] of Object.entries(sold)) { const i = idx.get(keyOf(v).join()); out[k] = [i ? new Date(Date.UTC(2000, 0, 1) + i * 864e5).toISOString().slice(0, 10) : '', 0, 0]; }
    return out;
  },
  LIGHT_FIXTURES: lf => ({ ...lf, items: (lf.items || []).map(({ price, ...it }) => it) })
};
const viewerCache = new Map();   /* NAME → { src, out } */
function viewerPage(html) {
  for (const [name, fn] of Object.entries(VIEWER_DATA)) {
    const m = new RegExp('const ' + name + ' = ([\\s\\S]*?);/\\*__END:' + name + '__\\*/').exec(html);
    if (!m) throw new Error('report page: data block ' + name + ' not found');   /* לא מגישים את הדף עם הנתונים המלאים */
    let c = viewerCache.get(name);
    if (!c || c.src !== m[1]) { c = { src: m[1], out: JSON.stringify(fn(JSON.parse(m[1]))) }; viewerCache.set(name, c); }
    html = injectData(html, name, c.out);
  }
  return html;
}
/* הפרויקט לצופה: בלי היסטוריית הגרסאות ובלי המחירים שבשורות ההצעה (הדוח לא מציג מחיר) */
function viewerProject(p) {
  const { vers, versN, ...q } = p;
  if (Array.isArray(q.impSaved)) q.impSaved = q.impSaved.map(({ price, ...it }) => it);
  return q;
}
const reqCookie = (req, name) => { for (const part of String(req.headers.cookie || '').split(';')) { const i = part.indexOf('='); if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim()); } return ''; };
/* קבצים שנערכים באפליקציה ויש להם גם גרסת ריפו (זריעה): קודם האחסון, אחרת הריפו */
/* תמונות גב/חזית — מזוהות בכתובת עם ?v= ומתחלפות רק דרך /api/rear-image (שמנקה את המטמון), לכן נשמרות בזיכרון שעה ולא נקראות מהדלי כל 15 שניות */
const readCurated = (key, repoPath) => readCached(key, async () => (await storage.read(key)) || (existsSync(repoPath) ? readFileSync(repoPath) : null), key.startsWith('rear_images/') ? 3600e3 : CUR_TTL);
const injectData = (html, name, json) => json ? html.replace(new RegExp('const ' + name + ' = [\\s\\S]*?;/\\*__END:' + name + '__\\*/'), () => 'const ' + name + ' = ' + json + ';/*__END:' + name + '__*/') : html;
/* טבלאות העבודה — חיות בתוך הריפו, לא בענן */
const PAGES = { '/matrix': 'src/pages/matrix.html', '/logic': 'src/pages/logic.html', '/reports': 'src/pages/reports.html' };   /* /reports = דוחות KO מה-ERP (scripts/erp-report.js) */
/* דפי כניסה וניהול משתמשים — נגישים גם בלי סשן (הכניסה עצמה) */
const AUTH_PAGES = { '/login': 'src/pages/auth.html', '/admin': 'src/pages/admin.html', '/bugs': 'src/pages/bugs.html' };
const sendPage = (res, file, code = 200) => { res.writeHead(code, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); res.end(readFileSync(file)); };
const window_store = { v: null, t: 0 };   /* מטמון ה-store לקריאות חוזרות */
const readState = async k => { const b = await readCurated(`page_state/${k}.json`, `data/page_state/${k}.json`); return b ? b.toString('utf8') : '{}'; };
/* שומר-סף: בקשה שלא נענתה תוך 40 שניות מקבלת 503 (הדף לא נתקע), ובקשה איטית מ-3 שניות נרשמת בלוג עם הנתיב — כדי שנראה מה תוקע */
const guard = handle => (req, res) => {
  const t0 = Date.now(), path0 = (req.url || '').split('?')[0];
  const wd = setTimeout(() => { if (!res.headersSent) { console.warn('[watchdog] ' + path0 + ' — אין תשובה אחרי 40s, מחזיר 503'); try { res.writeHead(503, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end('{"error":"השרת עסוק — נסה שוב בעוד רגע"}'); } catch {} } }, 40e3);
  res.on('finish', () => { clearTimeout(wd); const ms = Date.now() - t0; if (ms > 3000) console.warn('[slow] ' + path0 + ' ' + (ms / 1000).toFixed(1) + 's'); });
  res.on('close', () => clearTimeout(wd));
  Promise.resolve().then(() => handle(req, res)).catch(e => { console.error('[request error] ' + path0, e); if (!res.headersSent) { try { res.writeHead(500); res.end(String(e && e.message || e)); } catch {} } });
};
/* בדיקה עצמית: כל 30 שניות /health מקומי; שני כשלונות רצופים = השרת תקוע → יציאה (לולאת ההפעלה / Cloud Run מרימים אותו מחדש) */
let selfFails = 0;
setInterval(() => {
  const r = httpGet({ host: '127.0.0.1', port: PORT, path: '/health', timeout: 15e3 }, res => { res.resume(); selfFails = 0; });
  r.on('timeout', () => r.destroy(new Error('timeout'))); r.on('error', () => { if (++selfFails >= 2) { console.error('[watchdog] השרת לא עונה ל-/health פעמיים ברצף — מאתחל'); process.exit(3); } });
}, 30e3).unref();
const handleReq = async (req, res) => {
  const path0 = (req.url || '').split('?')[0].replace(/\/$/, '') || '/';
  await authRefresh();   /* סשנים/הזמנות שנוצרו בצד השני (מחשב↔ענן) — עד 10 שניות */
  if (path0 === '/health') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ ok: true, storage: storage.kind, label: storage.label, warn: storageWarn || undefined, prebuilt: !!process.env.PREBUILT })); return; }
  /* קישור דוח (/r/<token>): צופה בפרויקט אחד — לפני כל ראוט אחר (גם הכניסה והניהול), וגם לפני הבעלים המקומי */
  let viewer;
  try { viewer = await reportViewer(req, path0); }
  catch (e) { console.warn('[report-links] ' + e.message); res.writeHead(503, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' }); res.end('Report temporarily unavailable — try again shortly'); return; }   /* קובץ הקישורים לא נקרא — לא "קישור לא תקף" */
  if (viewer && !VIEWER_PATHS.some(rx => rx.test(path0))) { res.writeHead(403, { 'content-type': 'application/json' }); res.end('{"error":"read-only report link"}'); return; }
  if (viewer && req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(403, { 'content-type': 'application/json' }); res.end('{"error":"read-only report link"}'); return; }
  if (!viewer && /^\/r\/[^/]+$/.test(path0)) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' }); res.end('הקישור לדוח לא תקף או בוטל'); return; }
  /* --- כניסה עם KO ERP (scripts/erp-login.js → auth.js erpSignIn) --- */
  if (path0 === '/api/auth/erp/start' && req.method === 'GET') {
    const join = new URLSearchParams((req.url || '').split('?')[1] || '').get('join') || '';
    const back = '/login?erp=unavailable' + (join ? '&t=' + encodeURIComponent(join) : '');
    if (!(await erpLoginAvailable(process.env, storage))) { res.writeHead(302, { location: back, 'cache-control': 'no-store' }); res.end(); return; }
    /* כבר מחובר כאן עם סיסמה, בלי קישור ל-ERP: זה הדרך הבטוחה לקשר — הרשומה נקבעת לפי הסשן (ונבדקת שוב בחזרה), לא לפי המייל */
    const cur = sessionUser(req);
    const linkUid = cur && cur.id !== 'owner' && !cur.erpId ? cur.id : '';
    const { url, bind } = loginStart(process.env, reqOrigin(req), { join, linkUid });
    const secure = String(req.headers['x-forwarded-proto'] || '').includes('https') ? '; Secure' : '';
    res.writeHead(302, { location: url, 'set-cookie': `${BIND_COOKIE}=${bind}; Path=/api/auth/erp; HttpOnly; SameSite=Lax; Max-Age=600${secure}`, 'cache-control': 'no-store' }); res.end(); return;
  }
  if (path0 === '/api/auth/erp/callback' && req.method === 'GET') {
    const r = await loginCallback(process.env, storage, new URLSearchParams((req.url || '').split('?')[1] || ''), reqCookie(req, BIND_COOKIE));
    let location;
    if (!r.ok) location = '/login?erp=' + r.reason + (r.join ? '&t=' + encodeURIComponent(r.join) : '');
    else {
      const out = await erpSignIn(req, res, r.profile, r.join, { linkUid: r.linkUid });
      if (out.outcome === 'session') {
        try { await saveUserTokens(storage, out.tokenKey, r.tokens); } catch (e) { console.warn('[erp-login] saving the ERP sign-in failed:', e.message); }
        location = '/';
      } else location = '/login?erp=' + out.outcome;
    }
    const set = [].concat(res.getHeader('set-cookie') || [], `${BIND_COOKIE}=; Path=/api/auth/erp; HttpOnly; Max-Age=0`);
    res.writeHead(302, { location, 'set-cookie': set, 'cache-control': 'no-store' }); res.end(); return;
  }
  /* מוזמן בלי חשבון ERP: קישור יצירת חשבון מה-ERP, ואחריו חזרה לכאן עם ההזמנה (/api/auth/erp/start?join=) */
  if (path0 === '/api/auth/erp/signup' && req.method === 'POST') {
    const out = (code, obj) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(obj)); };
    if (!/^application\/json\b/i.test(req.headers['content-type'] || '')) return out(415, { error: 'JSON only' });
    let b = {};
    try { b = JSON.parse(await new Promise((ok, no) => { const ch = []; req.on('data', c => ch.push(c)); req.on('end', () => ok(Buffer.concat(ch).toString('utf8') || '{}')); req.on('error', no); })); } catch { return out(400, { error: 'גוף הבקשה אינו JSON תקין' }); }
    const join = String(b.token || ''), email = String(b.email || '').trim().toLowerCase(), name = String(b.name || '').trim().slice(0, 100);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return out(400, { error: 'כתובת מייל לא תקינה' });
    /* מייל של רשומה קיימת כאן: רק מי שכבר מחובר כאותה רשומה (ואז ההזמנה לא נדרשת — הוא כבר משתמש; הקישור נעשה לפי הסשן).
       ההזמנה נבדקת קודם, כדי שבלי קישור בתוקף אי אפשר לברר אילו מיילים רשומים */
    const own = await signupEmailCheck(req, email);
    if (!own.linking) { const chk = inviteForSignup(join, email); if (!chk.ok) return out(403, { error: chk.error }); }
    if (!own.ok) return out(409, { error: own.error });
    if (!(await erpLoginAvailable(process.env, storage))) return out(409, { error: 'הכניסה דרך ה-ERP עוד לא זמינה — הירשם עם מייל וסיסמה' });
    const back = reqOrigin(req) + '/api/auth/erp/start?join=' + encodeURIComponent(join);
    try {
      const r = await requestSignupLink(process.env, storage, { email, name, returnUrl: back });
      if (!r.ok) return out(409, { error: 'KO Projects עוד לא מחובר ל-ERP — פנה לבעל המערכת' });
      return out(200, { go: r.existing ? '/api/auth/erp/start?join=' + encodeURIComponent(join) : r.url, existing: r.existing });
    } catch (e) { console.warn('[erp-login] sign-up link failed:', e.message); return out(502, { error: 'ה-ERP לא השיב — נסה שוב בעוד רגע' }); }
  }
  /* --- משתמשים, הזמנות שיתוף, חסימה (scripts/auth.js) --- */
  if (path0.startsWith('/api/auth/') || path0 === '/api/share' || path0 === '/api/invite' || path0.startsWith('/api/admin/')) {
    /* שמות הפרויקטים וההרשאות — מהעותק האחרון (עד 30 שניות), בלי להמתין לדלי בכל בקשה; מעבר ל-8 שניות מתרענן ברקע */
    let storeNow = {};
    try {
      if (window_store.v && window_store.t > Date.now() - 30e3) { storeNow = window_store.v; if (window_store.t < Date.now() - 8e3 && !window_store.bg) window_store.bg = readStore(db).then(v => { window_store.v = v; window_store.t = Date.now(); window_store.stale = db.stale || ''; }).catch(() => {}).finally(() => { window_store.bg = null; }); }
      else { storeNow = window_store.v = await readStore(db); window_store.t = Date.now(); window_store.stale = db.stale || ''; }
    } catch {}
    if (await handleAuth(req, res, path0, storeNow)) return;
  }
  if (path0 === '/login' || path0.startsWith('/join/')) { sendPage(res, AUTH_PAGES['/login']); return; }
  if (handleOwnerLink(req, res, path0)) return;
  if (path0 === '/admin') {
    const u = requestUser(req);
    if (!isAdmin(u)) { res.writeHead(302, { location: '/login' }); res.end(); return; }
    sendPage(res, AUTH_PAGES['/admin']); return;
  }
  /* מקומי = הבעלים, בלי כניסה. מבחוץ — חייב סשן של מוזמן (בדיקה מקומית: סשן גובר) */
  const me = viewer || requestUser(req);
  const gated = !!viewer || !!sessionUser(req) || !isLocal(req);
  if (!me) {
    if (path0.startsWith('/api/')) { res.writeHead(401, { 'content-type': 'application/json' }); res.end('{"error":"login required"}'); return; }
    res.writeHead(302, { location: '/login' }); res.end(); return;
  }
  const isOwner = me.role === 'owner';
  /* פרוקסי תמונות מוצרים (דלי האתר, החנות, אתרי יצרנים) מאותו מקור — html2canvas בהורדת PDF לא מצייר תמונה ממקור אחר בלי CORS.
     רק hosts מוכרים, רק תמונות, עד 12MB, מטמון בזיכרון */
  if (path0 === '/img-proxy' && req.method === 'GET') {
    const u = new URLSearchParams((req.url || '').split('?')[1] || '').get('u') || '';
    const okHost = /^https:\/\/(storage\.googleapis\.com\/ko-wp-images\/|store\.kot\.co\.il\/|kot\.co\.il\/|images\.prismic\.io\/|prismic-io\.s3\.amazonaws\.com\/|cdn\.shopify\.com\/|www\.kling-freitag\.com\/|xta\.co\.uk\/|www\.sea-distribution\.com\/|nstaudio\.com\/|www\.saeaudio\.com\/|d3b79pswu7f4ma\.cloudfront\.net\/|www\.kt-audio\.com\/|en\.soundlightup\.com\/|archive\.org\/|files\.digisynthetic\.cn\/|products\.dynacord\.com\/|www\.proaudiodesign\.com\/|funktion-one\.com\/|www\.funktion-one\.com\/)/i.test(u);
    if (!okHost) { res.writeHead(400); res.end('host not allowed'); return; }
    try {
      let hit = imgProxyCache.get(u);
      if (!hit) {
        const r = await fetch(u, { redirect: 'follow', signal: AbortSignal.timeout(20000) });
        if (!r.ok) throw new Error('upstream ' + r.status);
        const buf = Buffer.from(await r.arrayBuffer()); if (buf.length > 12 * 1024 * 1024) throw new Error('too big');
        let ct = String(r.headers.get('content-type') || '').split(';')[0].trim();
        if (!/^image\//.test(ct)) ct = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml' }[(u.split('?')[0].split('.').pop() || '').toLowerCase()] || '';
        if (!ct) throw new Error('not an image');
        hit = { buf, ct }; imgProxyCache.set(u, hit); if (imgProxyCache.size > 400) imgProxyCache.delete(imgProxyCache.keys().next().value);
      }
      res.writeHead(200, { 'content-type': hit.ct, 'cache-control': 'public, max-age=86400' }); res.end(hit.buf);
    } catch (e) { res.writeHead(502); res.end('image unavailable: ' + (e.message || e)); }
    return;
  }
  /* --- מעקב באגים: דיווח לכל משתמש מחובר, ניהול לבעלים (scripts/bugs.js) --- */
  if (await handleBugs(req, res, path0, me)) return;
  if (path0 === '/bugs') { if (!isOwner) { res.writeHead(302, { location: '/' }); res.end(); return; } sendPage(res, AUTH_PAGES['/bugs']); return; }
  /* --- שאר ראוטי ה-ERP: סטטוס, לקוחות, פרויקטים, אפשרויות, כמויות עתידיות, יצירת הצעה (scripts/erp-routes.js) --- */
  /* קישור הדוח של פרויקט (לשליחה ל-ERP / העתקה): בעלים, אדמין, או מי שיכול לערוך את הפרויקט. regenerate = ביטול הקודם */
  if (path0 === '/api/report-link' && req.method === 'POST') {
    const out = (code, obj) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(obj)); };
    if (!/^application\/json\b/i.test(req.headers['content-type'] || '')) return out(415, { error: 'JSON only' });
    let b = {}; try { b = JSON.parse(await new Promise((ok, no) => { const ch = []; req.on('data', c => ch.push(c)); req.on('end', () => ok(Buffer.concat(ch).toString('utf8') || '{}')); req.on('error', no); })); } catch { return out(400, { error: 'גוף הבקשה אינו JSON תקין' }); }
    const pid = String(b.projectId || '');
    const st = (window_store.t > Date.now() - 8e3 && window_store.v) ? window_store.v : (window_store.v = await readStore(db), window_store.t = Date.now(), window_store.v);
    const p = (st.projects || []).find(x => x.id === pid);
    const canEdit = !!p && (isOwner || me.role === 'admin' || p.by === me.id || (me.grants || {})[pid] === 'edit');
    if (!canEdit) return out(403, { error: 'אין הרשאת עריכה לפרויקט הזה' });
    let token;
    try { token = await reportTokenFor(storage, pid, { regenerate: b.regenerate === true }); }
    catch (e) { console.warn('[report-links] ' + e.message); return out(503, { error: 'קישורי הדוחות לא נקראו מהאחסון — נסה שוב בעוד רגע' }); }   /* בלי קריאה תקינה לא כותבים — אחרת נמחקים הקישורים של כל הפרויקטים */
    return out(200, { ok: true, url: (process.env.PUBLIC_URL || reqOrigin(req)).replace(/\/+$/, '') + '/r/' + token });
  }
  let callerOnce = null;   /* מחושב פעם אחת לבקשה, רק כשראוט צריך אותו */
  const caller = () => (callerOnce = callerOnce || erpCaller(me));
  /* קישור הדוח לפרויקט שההצעה עליו — רק למי שיכול לערוך את הפרויקט (כמו /api/report-link) */
  const reportLink = async pid => {
    const st = (window_store.t > Date.now() - 8e3 && window_store.v) ? window_store.v : (window_store.v = await readStore(db), window_store.t = Date.now(), window_store.v);
    const p = (st.projects || []).find(x => x.id === pid);
    if (!p || !(isOwner || me.role === 'admin' || p.by === me.id || (me.grants || {})[pid] === 'edit')) return null;
    const base = (process.env.PUBLIC_URL || reqOrigin(req)).replace(/\/+$/, '');
    return { report_url: base + '/r/' + await reportTokenFor(storage, pid), open_url: base + '/?open=' + encodeURIComponent(pid) };
  };
  if (await handleErp(req, res, path0, isOwner, { storage, user: me, caller, reportLink, erpLoginLive: () => erpLoginAvailable(process.env, storage) })) return;
  /* --- 🧾 אינדקס ההצעות למנהל הפרויקטים (תאריך הצעה אחרונה + אישור) — בעלים בלבד, מטמון 5 דקות (?fresh=1 מרענן) --- */
  if (path0 === '/api/erp/orders-index') {
    if (!isOwner) { res.writeHead(403, { 'content-type': 'application/json' }); res.end('{"error":"owner only"}'); return; }
    try {
      const c = await caller(), auth = c.personal ? c.auth : undefined, key = c.personal ? 'me:' + (me.id || '') : 'shared';
      const hit = ORD_IDX.get(key);
      const orders = hit && hit.at > Date.now() - 5 * 60e3 && !/[?&]fresh=1/.test(req.url || '') ? hit.v : await erpOrdersIndex(auth);
      ORD_IDX.set(key, { at: hit && hit.v === orders ? hit.at : Date.now(), v: orders });
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      res.end(JSON.stringify({ orders }));
    } catch (e) { res.writeHead(502, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ error: String(e.message || e) })); }
    return;
  }
  /* --- הצעות מחיר מה-ERP (חי, דרך MCP) — בעלים בלבד --- */
  if (path0 === '/api/erp/quotes' || path0 === '/api/erp/quote-items') {
    if (!isOwner) { res.writeHead(403, { 'content-type': 'application/json' }); res.end('{"error":"owner only"}'); return; }
    const sp = new URL(req.url, 'http://x').searchParams;
    try {
      const c = await caller(), auth = c.personal ? c.auth : undefined;   /* בעלים בלבד: של האדם אם נכנס עם KO ERP, אחרת המשותף */
      const out = path0 === '/api/erp/quotes'
        ? { quotes: await erpQuotes({ q: sp.get('q') || '', all: sp.get('all') === '1' }, auth) }
        : { items: await erpQuoteItems(sp.get('order_id') || '', auth) };
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      res.end(JSON.stringify(out));
    } catch (e) {
      res.writeHead(502, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: String(e.message || e) }));
    }
    return;
  }
  /* תמונה ממוזערת של תכנית הפרויקט — כקובץ תמונה (ל-<img>), עם מטמון בדפדפן לפי הגרסה שב-?v= */
  { const tm = /^\/api\/project\/([A-Za-z0-9_-]+)\/thumb(?:\?.*)?$/.exec(req.url || '');
    if (tm && req.method === 'GET') {
      try {
        const st = (window_store.t > Date.now() - 8e3 && window_store.v) ? window_store.v : (window_store.v = await readStore(db), window_store.t = Date.now(), window_store.v);
        const p = (filterStore(st, me).projects || []).find(x => x.id === tm[1]), m = p && /^data:(image\/[a-z+]+);base64,(.+)$/.exec(p.thumb || '');
        if (!m) { res.writeHead(404); res.end('no thumb'); return; }
        res.writeHead(200, { 'content-type': m[1], 'cache-control': 'private, max-age=86400' }); res.end(Buffer.from(m[2], 'base64'));
      } catch (e) { res.writeHead(500); res.end(String(e.message)); }
      return;
    } }
  /* חלקים כבדים של פרויקט לפי דרישה: /api/project/<id>?f=bg,bgPdf,vers */
  { const pm = /^\/api\/project\/([A-Za-z0-9_-]+)(?:\?f=([a-zA-Z,]+))?$/.exec(req.url || '');
    if (pm && req.method === 'GET') {
      try {
        const st = (window_store.t > Date.now() - 8e3 && window_store.v) ? window_store.v : (window_store.v = await readStore(db), window_store.t = Date.now(), window_store.v);
        const p = (filterStore(st, me).projects || []).find(x => x.id === pm[1]);
        if (!p) { res.writeHead(404); res.end('no project'); return; }
        const want = (pm[2] || 'bg').split(',').filter(f => HEAVY.includes(f) && !(viewer && f === 'vers')), out = {};   /* צופה בקישור דוח: בלי היסטוריית הגרסאות */
        for (const f of want) if (p[f] != null) out[f] = p[f];
        sendText(req, res, 200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, JSON.stringify(out));
      } catch (e) { res.writeHead(500); res.end(String(e.message)); }
      return;
    } }
  /* מצב העותק שהשרת מגיש: stale = עותק זמני (דיסק/זיכרון) כי הדלי איטי — הדפדפן מחכה ולא שומר ממנו */
  if ((req.url || '').split('?')[0] === '/api/store/state') { sendText(req, res, 200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, JSON.stringify({ ok: true, stale: !!db.stale, kind: db.stale || '', label: storage.label })); return; }
  if ((req.url || '').split('?')[0] === '/api/store') {
    if (req.method === 'GET') {
      try {
        /* עד 8 שניות מהקריאה הקודמת — אותו store בלי לפנות לדלי שוב (טעינת דף = כמה בקשות) */
        const st = (window_store.t > Date.now() - 8e3 && window_store.v) ? window_store.v : (window_store.v = await readStore(db), window_store.t = Date.now(), window_store.stale = db.stale || '', window_store.v);
        if (window_store.stale) res.setHeader('x-ko-stale', window_store.stale);
        const full = /[?&]full=1/.test(req.url || '');   /* גיבוי מלא — לפי בקשה מפורשת בלבד */
        const vis = filterStore(st, me);
        let body = full ? vis : liteStore(vis, vis.cur);
        if (viewer) body = { ...body, projects: (body.projects || []).map(viewerProject) };   /* קישור דוח: בלי גרסאות ומחירים, ובלי שם הדלי בכותרת */
        sendText(req, res, 200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...(viewer ? {} : { 'x-ko-store': storage.label }) }, JSON.stringify(body));
      } catch (e) { res.writeHead(500); res.end(String(e.message)); }
      return;
    }
    if (req.method === 'POST') {
      const chunks = [];
      req.on('data', c => chunks.push(c));
      req.on('end', async () => {
        /* מקומית: לשונית שה-store שלה נטען ממקור אחסון אחר (נתונים מקומיים בזמן ניתוק מהדלי, או להפך) לא דורסת —
           מקבלת 409 והדף נטען מחדש מהמקור הנוכחי */
        if (!process.env.K_SERVICE && (req.headers['x-ko-store'] || '') !== storage.label) {
          console.warn('[store] שמירה נדחתה: הלשונית נטענה מ-"' + (req.headers['x-ko-store'] || '?') + '" והשרת עובד על "' + storage.label + '"');
          res.writeHead(409, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ error: 'stale-store', label: storage.label })); return;
        }
        try {
          const raw = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          const fullSt = (window_store.t > Date.now() - 8e3 && window_store.v) ? window_store.v : await readStore(db);
          const posted = hydrateStore(fullSt, raw);   /* משלים תמונות רקע / PDF / גרסאות שהדפדפן לא שלח */
          /* כמה משתמשים על אותו store: לשונית ישנה לא דורסת פרויקט שנערך אחריה במקום אחר (upd חדש יותר),
             ופרויקט שחסר ברשימה שנשלחה (נוצר ע"י מוזמן אחרי שהלשונית נטענה) נשמר — נמחק רק מה שב-_del */
          { const srv = new Map((fullSt.projects || []).map(p => [p.id, p])), del = new Set(raw._del || []), seen = new Set();
            posted.projects = (posted.projects || []).map(p => { seen.add(p.id); const o = srv.get(p.id); return o && (+o.upd || 0) > (+p.upd || 0) ? o : p; });
            if (isAdmin(me)) for (const o of fullSt.projects || []) if (!seen.has(o.id) && !del.has(o.id)) posted.projects.push(o);
            posted._del = [...del]; }   /* מועבר ל-writeStore: מחיקה מפורשת בלבד */
          /* 🧰 הקיטים שלי (userKits): מיזוג לכל קיט — קיט שחסר ברשימה שנשלחה ולא נמחק במפורש (_delKits) נשאר, כך שלשונית שנטענה
             מעותק ישן (למשל בזמן שהדלי היה איטי) לא מוחקת קיטים; קיט שקיים בשניהם — החדש לפי upd (חותמת מהדפדפן) */
          if (Array.isArray(raw.userKits)) {
            const sk = fullSt.userKits || [], pk = posted.userKits || [], del = new Set((raw._delKits || []).map(String));
            const keyOf = k => k.id || ('n:' + String(k.name || '').trim()), pm = new Map(pk.map(k => [keyOf(k), k])), out = pk.slice(); let kept = 0;
            for (const o of sk) { const key = keyOf(o), p = pm.get(key); if (!p) { if (!del.has(key) && !(o.id && del.has(String(o.id)))) { out.push(o); kept++; } continue; } if ((+o.upd || 0) > (+p.upd || 0)) out[out.indexOf(p)] = o; }
            if (kept) console.warn('[store] ' + kept + ' קיטים שלי חסרו ברשימה שנשלחה ולא נמחקו במפורש — נשמרו');
            posted.userKits = out;
          }
          delete posted._delKits;
          /* מוזמן: רק הפרויקטים שלו בהרשאת עריכה נכתבים; השאר של הבעלים לא נגעו */
          const merged = me.role !== 'owner' ? mergeStore(fullSt, posted, me) : posted;
          const n = await writeStore(db, merged);
          if (storageWarn) fallbackWrites++;
          window_store.v = merged; window_store.t = Date.now();
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ ok: true, projects: n }));
        } catch (e) { res.writeHead(400); res.end(String(e.message)); }
      });
      return;
    }
  }
  // restore.json (בשורש הריפו, מחוץ ל-git) — משמש לשחזור גיבוי מקומי דרך הדפדפן
  if (req.url === '/restore.json') {
    try {
      const b = readFileSync('restore.json');
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      res.end(b);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('no restore.json in repo root');
    }
    return;
  }
  const path = (req.url || '').split('?')[0].replace(/\/$/, '') || '/';
  /* תמונות גב מוצרים — data/rear_images/ (קבצים מהאתר של היצרן או העלאה מהעורך) */
  if (path.startsWith('/rear-img/')) {
    const f = decodeURIComponent(path.slice('/rear-img/'.length)).replace(/[^A-Za-z0-9._-]/g, '');
    /* ?v= חדש לקובץ = התמונה הוחלפה בדלי (בשם זהה) — מנקים את המטמון הארוך כדי לא להגיש את הגרסה הישנה */
    const v = new URLSearchParams((req.url || '').split('?')[1] || '').get('v') || '';
    if (imgVer.get(f) !== v) { if (imgVer.has(f)) curInvalidate('rear_images/' + f); imgVer.set(f, v); }
    try {
      const buf = await readCurated('rear_images/' + f, 'data/rear_images/' + f);
      if (!buf) throw new Error('no image');
      const ct = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' }[f.split('.').pop().toLowerCase()] || 'application/octet-stream';
      res.writeHead(200, { 'content-type': ct, 'cache-control': 'public, max-age=2592000, immutable' }); res.end(buf);   /* הכתובת נושאת ?v= — גרסה חדשה = כתובת חדשה */
    } catch { res.writeHead(404); res.end('no image'); }
    return;
  }
  /* /api/rear-front — נתיב נפרד לצילום חזית: שרת ישן שלא מכיר אותו מחזיר שגיאה, במקום לדרוס את צילום הגב */
  if ((path === '/api/rear-image' || path === '/api/rear-front') && req.method === 'POST') {
    if (!isOwner) { res.writeHead(403); res.end('owner only'); return; }
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', async () => {
      try {
        const b = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        const m = /^data:(image\/(png|jpeg|jpg|webp|gif));base64,(.+)$/s.exec(b.data || ''); if (!m) throw new Error('קובץ תמונה בלבד (PNG/JPG/WebP)');
        const buf = Buffer.from(m[3], 'base64'); if (buf.length > 6 * 1024 * 1024) throw new Error('עד 6MB');
        const name = String(b.name || '').trim(); if (!name) throw new Error('חסר שם דגם');
        const isFront = path === '/api/rear-front';
        const slug = (isFront ? 'front-' : 'custom-') + name.toLowerCase().replace(/[^a-z0-9\u0590-\u05ff]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) + '-' + Date.now().toString(36) + '.' + (m[2] === 'jpeg' ? 'jpg' : m[2]);
        await storage.write('rear_images/' + slug, buf, m[1]);
        const list = JSON.parse((await readCurated('rear_images.json', 'data/rear_images.json')).toString('utf8'));
        /* ביטוי זיהוי מפורש (למשל SG\\s?-?121[0O]P — שמות בקטלוג עם שגיאות כתיב/רווחים) — אחרת השם עצמו */
        let esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (b.re) { try { new RegExp(String(b.re), 'i'); esc = String(b.re).slice(0, 200); } catch { throw new Error('regex לא תקין'); } }
        const i = list.findIndex(x => x.re === esc && x.custom); let rec;
        if (isFront) {
          /* צילום חזית: נשמר לצד צילום הגב. רשומה אישית לדגם — מעתיקה את צילום הגב והמיקומים מהרשומה הכללית שמתאימה לו, כך ששני דגמים עם אותו גב (IPD 1200 / 2400) יכולים לקבל חזית שונה */
          const base = i >= 0 ? list[i] : (list.find(x => { try { return new RegExp(x.re, 'i').test(name); } catch { return false; } }) || {});
          rec = { ...base, re: esc, model: i >= 0 ? base.model : name + (base.model ? ' — ' + base.model : ''), custom: true, front: slug, v: (base.v || 1) + 1 };
          if (+b.w > 0 && +b.h > 0) { rec.fw = Math.round(+b.w); rec.fh = Math.round(+b.h); } else { delete rec.fw; delete rec.fh; }
        } else { rec = { ...(i >= 0 && list[i].front ? { front: list[i].front, fw: list[i].fw, fh: list[i].fh } : {}), re: esc, file: slug, model: name, src: 'העלאה ידנית', custom: true }; if (+b.w > 0 && +b.h > 0) { rec.w = Math.round(+b.w); rec.h = Math.round(+b.h); } }
        if (i >= 0) list[i] = rec; else list.unshift(rec);   /* העלאה ידנית גוברת על תמונה מהאתר */
        await storage.writeJson('rear_images.json', list); curInvalidate('rear_images.json');
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ ok: true, rec }));
      } catch (e) { res.writeHead(400, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ error: String(e.message || e) })); }
    });
    return;
  }
  /* פריסות גב מוצרים — data/rear_layouts.json: מה שהעורך על התמונה שומר (מחברים, מיקומים, פורטים). upsert / remove */
  if (path === '/api/rear-layout' && req.method === 'POST') {
    if (!isOwner) { res.writeHead(403); res.end('owner only'); return; }
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', async () => {
      try {
        const b = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        const name = String(b.name || '').trim().slice(0, 80); if (!name) throw new Error('חסר שם דגם');
        const raw = await readCurated('rear_layouts.json', 'data/rear_layouts.json');
        const list = raw ? JSON.parse(raw.toString('utf8')) : [];
        let rec = null;
        if (b.remove) {
          const k = list.findIndex(x => x.name === name); if (k >= 0) list.splice(k, 1);
        } else {
          if (!Array.isArray(b.items)) throw new Error('חסרים מחברים');
          const items = b.items.map(it => {
            const o = { t: String(it.t || 'xlrf').slice(0, 16), label: String(it.label || '').slice(0, 24) };
            if (it.port) o.port = String(it.port).slice(0, 12);
            for (const k of ['x', 'y', 'w']) if (typeof it[k] === 'number' && isFinite(it[k])) o[k] = Math.round(it[k] * 10) / 10;
            if (it.side === 'front') o.side = 'front';
            if (/^(anet|anet2|ctrl|poe|port)$/.test(String(it.role || ''))) o.role = it.role;   /* תפקיד פורט רשת: אודיו ראשי/משני, בקרה, PoE, פורט מתג */
            return o;
          });
          const re = String(b.re || name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).slice(0, 200);
          try { new RegExp(re, 'i'); } catch { throw new Error('regex לא תקין'); }
          rec = { name, re, items, img: b.img || undefined, src: 'editor', updated: new Date().toISOString().slice(0, 10) };
          const k = list.findIndex(x => x.name === name || x.re === re);
          if (k >= 0) list[k] = { ...list[k], ...rec }; else list.unshift(rec);   /* דגם חדש = ספציפי → לפני הכלליים */
        }
        await storage.writeJson('rear_layouts.json', list); curInvalidate('rear_layouts.json');
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ ok: true, rec }));
      } catch (e) { res.writeHead(400, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ error: String(e.message || e) })); }
    });
    return;
  }
  /* פרוקסי ל-Claude API (כמו src/routes/api/ai ב-SvelteKit): המפתח ב-.env בשרת, לעולם לא בדפדפן.
     GET → { configured } · POST { messages, max_tokens, model? } → /v1/messages. בלי מפתח: 503 והלקוח נופל לבקשת מפתח אישי */
  if (path === '/api/ai') {
    const key = (process.env.ANTHROPIC_API_KEY || '').trim(), MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5', WS = (process.env.ANTHROPIC_WORKSPACE_ID || '').trim();   /* מפתח ברמת משתמש (sk-ant-usr) דורש anthropic-workspace-id */
    if (req.method === 'GET') { res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify({ configured: !!key, model: MODEL })); return; }
    if (req.method !== 'POST') { res.writeHead(405); res.end(); return; }
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', async () => {
      const out = (code, obj) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };
      if (!key) return out(503, { error: 'ANTHROPIC_API_KEY לא מוגדר ב-.env' });
      let p; try { p = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return out(400, { error: 'גוף בקשה לא תקין' }); }
      if (!Array.isArray(p.messages) || !p.messages.length) return out(400, { error: 'חסרות הודעות' });
      try {
        const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', ...(WS ? { 'anthropic-workspace-id': WS } : {}) },
          body: JSON.stringify({ model: p.model || MODEL, max_tokens: Math.min(Math.max(+p.max_tokens || 2000, 256), 8000), messages: p.messages }) });
        const j = await r.json();
        if (!r.ok || j.error) return out(r.ok ? 502 : r.status, { error: (j.error && j.error.message) || ('שגיאת API ' + r.status) });
        out(200, j);
      } catch (e) { out(502, { error: 'הקריאה ל-Anthropic נכשלה: ' + String(e.message) }); }
    });
    return;
  }
  /* קציר נתונים מקישור שהודבק בכרטיס פריט במטריצה (scripts/harvest.js) */
  if (path === '/api/harvest' && req.method === 'POST') {
    if (!isOwner) { res.writeHead(403); res.end('owner only'); return; }
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', async () => {
      try {
        const b = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
        if (!/^https?:\/\//i.test(b.url || '')) throw new Error('קישור לא תקין');
        const { harvest } = await import('./harvest.js');
        const r = await harvest({ url: b.url, model: String(b.model || ''), kind: b.kind === 'amp' ? 'amp' : 'spk' });
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(r));
      } catch (e) { res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ error: String(e.message || e) })); }
    });
    return;
  }
  /* מצב הטבלאות — נשמר מקומית ב-data/page_state, לא בענן */
  if (path === '/api/pagestate') {
    if (!isOwner) { res.writeHead(403); res.end('owner only'); return; }
    const k = new URL(req.url, 'http://x').searchParams.get('k');
    if (!PAGES['/' + k]) { res.writeHead(404); res.end('unknown page'); return; }
    if (req.method === 'GET') {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      res.end(await readState(k)); return;
    }
    if (req.method === 'POST') {
      const chunks = [];
      req.on('data', c => chunks.push(c));
      req.on('end', async () => {
        try {
          const body = Buffer.concat(chunks).toString('utf8');
          JSON.parse(body);                    // לא כותבים JSON פגום
          await storage.write(`page_state/${k}.json`, body, 'application/json; charset=utf-8'); curInvalidate(`page_state/${k}.json`);
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ ok: true, bytes: body.length }));
        } catch (e) { res.writeHead(400); res.end(String(e.message)); }
      });
      return;
    }
  }
  /* הטבלאות עצמן — עמודים מקומיים בריפו, המצב מוזרק לתוכם בהגשה */
  if (PAGES[path]) {
    if (!isOwner) { res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' }); res.end('הטבלאות הפנימיות זמינות לבעל המערכת בלבד'); return; }
    try {
      const k = path.slice(1);
      const st = await readState(k);
      let page = readFileSync(PAGES[path], 'utf8')
        .replace(/(<script id="mstate" type="application\/json">)[\s\S]*?(<\/script>)/,
          (m, a, b) => a + st + b);
      /* תכלית ← קיטים: הקיטים והיכולת חיים — מה-ERP + הגרסאות שלי מה-store, לפי הרמקול החלש בקיט (scripts/logic-data.js) */
      if (k === 'logic') { try { const full = (window_store.t > Date.now() - 8e3 && window_store.v) ? window_store.v : (window_store.v = await readStore(db), window_store.t = Date.now(), window_store.v); page = injectLogicData(page, full); } catch (e) { console.warn('logic live data', e); } }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      res.end(page);
    } catch (e) {
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('page failed:\n' + e.message);
    }
    return;
  }
  /* KO Studio — נתיב /studio מגיש את גרסת משתמשי הקצה (build:studio) */
  const isStudio = path === '/studio';
  const isReport = !!viewer && path.startsWith('/r/');
  try {
    /* בענן (PREBUILT=1) ה-dist נבנה פעם אחת בבניית התמונה; מקומית — נבנה מחדש בכל בקשה כדי שהדף תמיד עדכני */
    await ensureBuilt(isStudio);
    let html = await readFile(isStudio ? 'dist/studio.html' : 'dist/index.html', 'utf8');
    /* נתונים שנערכים באפליקציה (פריסות/תמונות גב) — הגרסה העדכנית מהאחסון במקום זו שנאפתה בבנייה */
    if (!isStudio) for (const [name, key] of [['REAR_LAYOUTS', 'rear_layouts.json'], ['REAR_IMAGES', 'rear_images.json']]) { const j = await readCached(key, () => storage.read(key)); if (j) html = injectData(html, name, j.toString('utf8')); }
    /* מצב המשתמש מוזרק לדף — הכותרת מציגה שיתוף/ניהול לבעלים, שם ויציאה למוזמן */
    let report = null, headers = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' };
    if (isReport) {
      /* דף הדוח: ?embed=1 (בתוך ה-ERP), ?lang=he|en, ?parent=<מקור ה-ERP> — רק מקור מהרשימה מקבל הודעות גובה (postMessage) */
      const q = new URLSearchParams((req.url || '').split('?')[1] || ''), parent = (q.get('parent') || '').replace(/\/+$/, '');
      report = { projectId: viewer.projectId, embed: q.get('embed') === '1', lang: q.get('lang') === 'en' ? 'en' : q.get('lang') === 'he' ? 'he' : '', parent: ERP_FRAME_ORIGINS.includes(parent) ? parent : '', part: ['all', 'cust', 'elec', 'inst'].includes(q.get('part')) ? q.get('part') : '' };
      headers = { ...headers, 'content-security-policy': "frame-ancestors 'self' " + ERP_FRAME_ORIGINS.join(' '), 'x-robots-tag': 'noindex, nofollow', 'referrer-policy': 'same-origin' };
      html = viewerPage(html).replace('<script', REPORT_SHIM(viewer.token) + '<script');
    }
    /* לצופה בקישור דוח — בלי פרטי האחסון (שם הדלי) */
    const authState = JSON.stringify({ enabled: true, user: publicUser(me), owner: !!isOwner, gated, ...(report ? { report } : { storage: { kind: storage.kind, label: storage.label, warn: storageWarn } }) });
    html = html.replace('<script', '<script>window.__AUTH=' + authState + ';</script><script');
    sendText(req, res, 200, headers, html);
  } catch (e) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('build failed:\n' + e.message);
  }
};
createServer(guard(handleReq)).listen(PORT, () => console.log(`${process.env.PREBUILT ? 'server' : 'dev server'}: http://localhost:${PORT} · data: ${storage.label} (${storage.kind})${process.env.PUBLIC_URL ? ' · public: ' + process.env.PUBLIC_URL : ''}`));
