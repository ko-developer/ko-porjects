// Minimal dev server: rebuilds on each request so the page is always current.
// + API של פרויקטים מעל data/projects.sqlite — האפליקציה נטענת ונשמרת מה-DB כשהשרת רץ.
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { openDb, readStore, writeStore } from './db.js';
import { isLocal, requestUser, sessionUser, handleAuth, handleOwnerLink, filterStore, mergeStore, publicUser } from './auth.js';
import { erpQuotes, erpQuoteItems } from './erp-client.js';
import { handleBugs } from './bugs.js';

const PORT = process.env.PORT || 4177;
const db = openDb();
/* טבלאות העבודה — חיות בתוך הריפו, לא בענן */
const PAGES = { '/matrix': 'src/pages/matrix.html', '/logic': 'src/pages/logic.html' };
/* דפי כניסה וניהול משתמשים — נגישים גם בלי סשן (הכניסה עצמה) */
const AUTH_PAGES = { '/login': 'src/pages/auth.html', '/admin': 'src/pages/admin.html', '/bugs': 'src/pages/bugs.html' };
const sendPage = (res, file, code = 200) => { res.writeHead(code, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); res.end(readFileSync(file)); };
const readState = k => {
  try { return readFileSync(`data/page_state/${k}.json`, 'utf8'); } catch { return '{}'; }
};
createServer(async (req, res) => {
  const path0 = (req.url || '').split('?')[0].replace(/\/$/, '') || '/';
  /* --- משתמשים, הזמנות שיתוף, חסימה (scripts/auth.js) --- */
  if (path0.startsWith('/api/auth/') || path0 === '/api/share' || path0 === '/api/invite' || path0.startsWith('/api/admin/')) {
    let storeNow = {}; try { storeNow = readStore(db); } catch {}
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
  if (req.url === '/api/store') {
    if (req.method === 'GET') {
      try {
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
        res.end(JSON.stringify(filterStore(readStore(db), me)));
      } catch (e) { res.writeHead(500); res.end(String(e.message)); }
      return;
    }
    if (req.method === 'POST') {
      const chunks = [];
      req.on('data', c => chunks.push(c));
      req.on('end', () => {
        try {
          const posted = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          /* מוזמן: רק הפרויקטים שלו בהרשאת עריכה נכתבים; השאר של הבעלים לא נגעו */
          const merged = me.role !== 'owner' ? mergeStore(readStore(db), posted, me) : posted;
          const n = writeStore(db, merged);
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
    try {
      const buf = readFileSync('data/rear_images/' + f);
      const ct = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' }[f.split('.').pop().toLowerCase()] || 'application/octet-stream';
      res.writeHead(200, { 'content-type': ct, 'cache-control': 'public, max-age=86400' }); res.end(buf);
    } catch { res.writeHead(404); res.end('no image'); }
    return;
  }
  if (path === '/api/rear-image' && req.method === 'POST') {
    if (!isOwner) { res.writeHead(403); res.end('owner only'); return; }
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try {
        const b = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        const m = /^data:(image\/(png|jpeg|jpg|webp|gif));base64,(.+)$/s.exec(b.data || ''); if (!m) throw new Error('קובץ תמונה בלבד (PNG/JPG/WebP)');
        const buf = Buffer.from(m[3], 'base64'); if (buf.length > 6 * 1024 * 1024) throw new Error('עד 6MB');
        const name = String(b.name || '').trim(); if (!name) throw new Error('חסר שם דגם');
        const slug = 'custom-' + name.toLowerCase().replace(/[^a-z0-9\u0590-\u05ff]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) + '-' + Date.now().toString(36) + '.' + (m[2] === 'jpeg' ? 'jpg' : m[2]);
        if (!existsSync('data/rear_images')) mkdirSync('data/rear_images', { recursive: true });
        writeFileSync('data/rear_images/' + slug, buf);
        const list = JSON.parse(readFileSync('data/rear_images.json', 'utf8'));
        const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const i = list.findIndex(x => x.re === esc && x.custom); const rec = { re: esc, file: slug, model: name, src: 'העלאה ידנית', custom: true };
        if (i >= 0) list[i] = rec; else list.unshift(rec);   /* העלאה ידנית גוברת על תמונה מהאתר */
        writeFileSync('data/rear_images.json', JSON.stringify(list, null, 1));
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
    req.on('end', () => {
      try {
        const b = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        const name = String(b.name || '').trim().slice(0, 80); if (!name) throw new Error('חסר שם דגם');
        const file = 'data/rear_layouts.json';
        const list = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];
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
        writeFileSync(file, JSON.stringify(list, null, 1));
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
    const file = `data/page_state/${k}.json`;
    if (req.method === 'GET') {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      res.end(readState(k)); return;
    }
    if (req.method === 'POST') {
      const chunks = [];
      req.on('data', c => chunks.push(c));
      req.on('end', () => {
        try {
          const body = Buffer.concat(chunks).toString('utf8');
          JSON.parse(body);                    // לא כותבים JSON פגום
          writeFileSync(file, body);
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
      const page = readFileSync(PAGES[path], 'utf8')
        .replace(/(<script id="mstate" type="application\/json">)[\s\S]*?(<\/script>)/,
          (m, a, b) => a + readState(k) + b);
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
    /* מצב המשתמש מוזרק לדף — הכותרת מציגה שיתוף/ניהול לבעלים, שם ויציאה למוזמן */
    const authState = JSON.stringify({ enabled: true, user: publicUser(me), owner: !!isOwner, gated });
    html = html.replace('<script', '<script>window.__AUTH=' + authState + ';</script><script');
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    res.end(html);
  } catch (e) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('build failed:\n' + e.message);
  }
}).listen(PORT, () => console.log(`${process.env.PREBUILT ? 'server' : 'dev server'}: http://localhost:${PORT}${process.env.STORE_JSON_DIR ? ' · store: ' + process.env.STORE_JSON_DIR : ''}`));
