// Minimal dev server: rebuilds on each request so the page is always current.
// + API של פרויקטים מעל data/projects.sqlite — האפליקציה נטענת ונשמרת מה-DB כשהשרת רץ.
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { makeStorage } from './storage.js';
import { openStore, readStore, writeStore } from './db.js';
import { isLocal, requestUser, sessionUser, handleAuth, handleOwnerLink, filterStore, mergeStore, publicUser, initAuth, authRefresh } from './auth.js';
import { erpQuotes, erpQuoteItems } from './erp-client.js';
import { handleBugs, initBugs } from './bugs.js';

/* .env (לא בגיט): DATA_BUCKET, PUBLIC_URL, מפתחות — כמו בענן, רק מקומית */
try { for (const line of readFileSync('.env', 'utf8').split('\n')) { const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim(); } } catch {}
const PORT = process.env.PORT || 4177;
/* שכבת האחסון: DATA_BUCKET → דלי הענן (מקומי והענן על אותם נתונים); בלעדיו — data/ מקומית */
let storage = makeStorage(), storageWarn = '';
try { await storage.check(); }
catch (e) {
  /* הדלי לא זמין (בדרך כלל: הכניסה ל-gcloud פגה) — לא נופלים: עובדים על data/ מקומית עם אזהרה בולטת בטרמינל ובאפליקציה */
  const why = String(e.message || e);
  if (process.env.K_SERVICE || process.env.DATA_FALLBACK === 'off') { console.error('\n❌ אחסון לא זמין (' + storage.label + '): ' + why + '\n'); process.exit(1); }
  storageWarn = 'הדלי בענן לא זמין — עובדים על נתונים מקומיים (לא מסונכרן עם השרת!). ' + why;
  console.error('\n⚠  ' + storageWarn + '\n   תיקון: gcloud auth login   (או: scripts/deploy-gcp.sh devkey — מפתח קבוע שלא פג)\n');
  delete process.env.DATA_BUCKET; storage = makeStorage();
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
    const p = fn().then(v => { curCache.set(key, { t: Date.now(), v }); if (CUR_DISK && v) { try { mkdirSync(CUR_DISK, { recursive: true }); writeFileSync(curDisk(key), v); } catch {} } return v; })
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
function sendText(req, res, code, headers, body) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(body, 'utf8');
  if (buf.length > 1024 && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) { res.writeHead(code, { ...headers, 'content-encoding': 'gzip', vary: 'accept-encoding' }); res.end(gzipSync(buf, { level: 6 })); }
  else { res.writeHead(code, headers); res.end(buf); }
}
/* store "קל" לדפדפן: הכבדים (תמונת רקע, PDF מקורי, היסטוריית גרסאות = ~40MB על 113 פרויקטים) לא נשלחים —
   רק הפרויקט הפתוח מקבל את תמונת הרקע שלו; השאר מסומנים hasBg/hasPdf/versN ונטענים לפי דרישה מ-/api/project/<id>.
   בשמירה (POST) הדפדפן מחזיר את הפרויקטים בלי הכבדים — hydrateStore משלים אותם מהעותק השמור */
const HEAVY = ['bg', 'bgPdf', 'vers'];
function liteStore(st, curId) {
  return { ...st, projects: (st.projects || []).map(p => {
    const { bg, bgPdf, vers, ...rest } = p;
    if (bg) { if (p.id === curId) rest.bg = bg; else rest.hasBg = true; }
    if (bgPdf) rest.hasPdf = true;
    if (vers && vers.length) rest.versN = vers.length;
    rest._lite = true; return rest; }) };
}
function hydrateStore(full, posted) {
  const byId = new Map((full.projects || []).map(p => [p.id, p]));
  return { ...posted, projects: (posted.projects || []).map(p => {
    if (!p._lite) return p;
    if (!byId.has(p.id)) return null;   /* פרויקט קל שכבר לא קיים בשרת (נמחק מצד אחר) — לא מוחזר לחיים מעותק חלקי */
    const { _lite, hasBg, hasPdf, versN, ...q } = p, old = byId.get(p.id) || {};
    if (!('bg' in q) && hasBg && old.bg) q.bg = old.bg;              /* לא נשלחה תמונה אבל הייתה — נשארת; בלי hasBg = המשתמש מחק */
    if (!('bgPdf' in q) && hasPdf && old.bgPdf) q.bgPdf = old.bgPdf;
    if (old.vers && old.vers.length) {                                /* גרסאות: הישנות מהשרת + החדשות מהדפדפן, בלי כפילויות, עד 30 */
      const seen = new Set((q.vers || []).map(v => v.t)); q.vers = [...old.vers.filter(v => !seen.has(v.t)), ...(q.vers || [])].sort((a, b) => a.t - b.t).slice(-30);
    }
    /* סדר המפתחות כמו בעותק השמור — פרויקט שלא השתנה נותן JSON זהה ולא נכתב שוב לדלי */
    const ordered = {}; for (const k of Object.keys(old)) if (k in q) ordered[k] = q[k]; for (const k of Object.keys(q)) if (!(k in ordered)) ordered[k] = q[k];
    return ordered; }).filter(Boolean) };
}
await initAuth(storage); await initBugs(storage);
/* קבצים שנערכים באפליקציה ויש להם גם גרסת ריפו (זריעה): קודם האחסון, אחרת הריפו */
/* תמונות גב/חזית — מזוהות בכתובת עם ?v= ומתחלפות רק דרך /api/rear-image (שמנקה את המטמון), לכן נשמרות בזיכרון שעה ולא נקראות מהדלי כל 15 שניות */
const readCurated = (key, repoPath) => readCached(key, async () => (await storage.read(key)) || (existsSync(repoPath) ? readFileSync(repoPath) : null), key.startsWith('rear_images/') ? 3600e3 : CUR_TTL);
const injectData = (html, name, json) => json ? html.replace(new RegExp('const ' + name + ' = [\\s\\S]*?;/\\*__END:' + name + '__\\*/'), () => 'const ' + name + ' = ' + json + ';/*__END:' + name + '__*/') : html;
/* טבלאות העבודה — חיות בתוך הריפו, לא בענן */
const PAGES = { '/matrix': 'src/pages/matrix.html', '/logic': 'src/pages/logic.html' };
/* דפי כניסה וניהול משתמשים — נגישים גם בלי סשן (הכניסה עצמה) */
const AUTH_PAGES = { '/login': 'src/pages/auth.html', '/admin': 'src/pages/admin.html', '/bugs': 'src/pages/bugs.html' };
const sendPage = (res, file, code = 200) => { res.writeHead(code, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); res.end(readFileSync(file)); };
const window_store = { v: null, t: 0 };   /* מטמון ה-store לקריאות חוזרות */
const readState = async k => { const b = await readCurated(`page_state/${k}.json`, `data/page_state/${k}.json`); return b ? b.toString('utf8') : '{}'; };
createServer(async (req, res) => {
  const path0 = (req.url || '').split('?')[0].replace(/\/$/, '') || '/';
  await authRefresh();   /* סשנים/הזמנות שנוצרו בצד השני (מחשב↔ענן) — עד 10 שניות */
  if (path0 === '/health') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ ok: true, storage: storage.kind, label: storage.label, warn: storageWarn || undefined, prebuilt: !!process.env.PREBUILT })); return; }
  /* --- משתמשים, הזמנות שיתוף, חסימה (scripts/auth.js) --- */
  if (path0.startsWith('/api/auth/') || path0 === '/api/share' || path0 === '/api/invite' || path0.startsWith('/api/admin/')) {
    let storeNow = {}; try { storeNow = await readStore(db); } catch {}
    if (await handleAuth(req, res, path0, storeNow)) return;
  }
  if (path0 === '/login' || path0.startsWith('/join/')) { sendPage(res, AUTH_PAGES['/login']); return; }
  if (handleOwnerLink(req, res, path0)) return;
  if (path0 === '/admin') {
    const u = requestUser(req);
    if (!u || u.role !== 'owner') { res.writeHead(302, { location: '/login' }); res.end(); return; }
    sendPage(res, AUTH_PAGES['/admin']); return;
  }
  /* מקומי = הבעלים, בלי כניסה. מבחוץ — חייב סשן של מוזמן (בדיקה מקומית: סשן גובר) */
  const me = requestUser(req);
  const gated = !!sessionUser(req) || !isLocal(req);
  if (!me) {
    if (path0.startsWith('/api/')) { res.writeHead(401, { 'content-type': 'application/json' }); res.end('{"error":"login required"}'); return; }
    res.writeHead(302, { location: '/login' }); res.end(); return;
  }
  const isOwner = me.role === 'owner';
  /* --- מעקב באגים: דיווח לכל משתמש מחובר, ניהול לבעלים (scripts/bugs.js) --- */
  if (await handleBugs(req, res, path0, me)) return;
  if (path0 === '/bugs') { if (!isOwner) { res.writeHead(302, { location: '/' }); res.end(); return; } sendPage(res, AUTH_PAGES['/bugs']); return; }
  /* --- הצעות מחיר מה-ERP (חי, דרך MCP) — בעלים בלבד --- */
  if (path0 === '/api/erp/quotes' || path0 === '/api/erp/quote-items') {
    if (!isOwner) { res.writeHead(403, { 'content-type': 'application/json' }); res.end('{"error":"owner only"}'); return; }
    const sp = new URL(req.url, 'http://x').searchParams;
    try {
      const out = path0 === '/api/erp/quotes'
        ? { quotes: await erpQuotes({ q: sp.get('q') || '', all: sp.get('all') === '1' }) }
        : { items: await erpQuoteItems(sp.get('order_id') || '') };
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      res.end(JSON.stringify(out));
    } catch (e) {
      res.writeHead(502, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: String(e.message || e) }));
    }
    return;
  }
  /* חלקים כבדים של פרויקט לפי דרישה: /api/project/<id>?f=bg,bgPdf,vers */
  { const pm = /^\/api\/project\/([A-Za-z0-9_-]+)(?:\?f=([a-zA-Z,]+))?$/.exec(req.url || '');
    if (pm && req.method === 'GET') {
      try {
        const st = (window_store.t > Date.now() - 8e3 && window_store.v) ? window_store.v : (window_store.v = await readStore(db), window_store.t = Date.now(), window_store.v);
        const p = (filterStore(st, me).projects || []).find(x => x.id === pm[1]);
        if (!p) { res.writeHead(404); res.end('no project'); return; }
        const want = (pm[2] || 'bg').split(',').filter(f => HEAVY.includes(f)), out = {};
        for (const f of want) if (p[f] != null) out[f] = p[f];
        sendText(req, res, 200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, JSON.stringify(out));
      } catch (e) { res.writeHead(500); res.end(String(e.message)); }
      return;
    } }
  if ((req.url || '').split('?')[0] === '/api/store') {
    if (req.method === 'GET') {
      try {
        /* עד 8 שניות מהקריאה הקודמת — אותו store בלי לפנות לדלי שוב (טעינת דף = כמה בקשות) */
        const st = (window_store.t > Date.now() - 8e3 && window_store.v) ? window_store.v : (window_store.v = await readStore(db), window_store.t = Date.now(), window_store.v);
        const full = /[?&]full=1/.test(req.url || '');   /* גיבוי מלא — לפי בקשה מפורשת בלבד */
        const vis = filterStore(st, me);
        sendText(req, res, 200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, JSON.stringify(full ? vis : liteStore(vis, vis.cur)));
      } catch (e) { res.writeHead(500); res.end(String(e.message)); }
      return;
    }
    if (req.method === 'POST') {
      const chunks = [];
      req.on('data', c => chunks.push(c));
      req.on('end', async () => {
        try {
          const raw = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          const fullSt = (window_store.t > Date.now() - 8e3 && window_store.v) ? window_store.v : await readStore(db);
          const posted = hydrateStore(fullSt, raw);   /* משלים תמונות רקע / PDF / גרסאות שהדפדפן לא שלח */
          /* מוזמן: רק הפרויקטים שלו בהרשאת עריכה נכתבים; השאר של הבעלים לא נגעו */
          const merged = me.role !== 'owner' ? mergeStore(fullSt, posted, me) : posted;
          const n = await writeStore(db, merged);
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
  if (path === '/api/rear-image' && req.method === 'POST') {
    if (!isOwner) { res.writeHead(403); res.end('owner only'); return; }
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', async () => {
      try {
        const b = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        const m = /^data:(image\/(png|jpeg|jpg|webp|gif));base64,(.+)$/s.exec(b.data || ''); if (!m) throw new Error('קובץ תמונה בלבד (PNG/JPG/WebP)');
        const buf = Buffer.from(m[3], 'base64'); if (buf.length > 6 * 1024 * 1024) throw new Error('עד 6MB');
        const name = String(b.name || '').trim(); if (!name) throw new Error('חסר שם דגם');
        const slug = 'custom-' + name.toLowerCase().replace(/[^a-z0-9\u0590-\u05ff]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) + '-' + Date.now().toString(36) + '.' + (m[2] === 'jpeg' ? 'jpg' : m[2]);
        await storage.write('rear_images/' + slug, buf, m[1]);
        const list = JSON.parse((await readCurated('rear_images.json', 'data/rear_images.json')).toString('utf8'));
        const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const i = list.findIndex(x => x.re === esc && x.custom); const rec = { re: esc, file: slug, model: name, src: 'העלאה ידנית', custom: true };
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
      const page = readFileSync(PAGES[path], 'utf8')
        .replace(/(<script id="mstate" type="application\/json">)[\s\S]*?(<\/script>)/,
          (m, a, b) => a + st + b);
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
  try {
    /* בענן (PREBUILT=1) ה-dist נבנה פעם אחת בבניית התמונה; מקומית — נבנה מחדש בכל בקשה כדי שהדף תמיד עדכני */
    if (!process.env.PREBUILT) execFileSync(process.execPath, [isStudio ? 'scripts/build-lite.js' : 'scripts/build.js'], { stdio: 'pipe' });
    let html = readFileSync(isStudio ? 'dist/studio.html' : 'dist/index.html', 'utf8');
    /* נתונים שנערכים באפליקציה (פריסות/תמונות גב) — הגרסה העדכנית מהאחסון במקום זו שנאפתה בבנייה */
    if (!isStudio) for (const [name, key] of [['REAR_LAYOUTS', 'rear_layouts.json'], ['REAR_IMAGES', 'rear_images.json']]) { const j = await readCached(key, () => storage.read(key)); if (j) html = injectData(html, name, j.toString('utf8')); }
    /* מצב המשתמש מוזרק לדף — הכותרת מציגה שיתוף/ניהול לבעלים, שם ויציאה למוזמן */
    const authState = JSON.stringify({ enabled: true, user: publicUser(me), owner: !!isOwner, gated, storage: { kind: storage.kind, label: storage.label, warn: storageWarn } });
    html = html.replace('<script', '<script>window.__AUTH=' + authState + ';</script><script');
    sendText(req, res, 200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }, html);
  } catch (e) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('build failed:\n' + e.message);
  }
}).listen(PORT, () => console.log(`${process.env.PREBUILT ? 'server' : 'dev server'}: http://localhost:${PORT} · data: ${storage.label} (${storage.kind})${process.env.PUBLIC_URL ? ' · public: ' + process.env.PUBLIC_URL : ''}`));
