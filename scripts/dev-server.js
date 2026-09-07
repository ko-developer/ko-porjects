// Minimal dev server: rebuilds on each request so the page is always current.
// + API של פרויקטים מעל data/projects.sqlite — האפליקציה נטענת ונשמרת מה-DB כשהשרת רץ.
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { openDb, readStore, writeStore } from './db.js';
import { isLocal, requestUser, sessionUser, handleAuth, handleOwnerLink, filterStore, mergeStore, publicUser } from './auth.js';

const PORT = process.env.PORT || 4177;
const db = openDb();
/* טבלאות העבודה — חיות בתוך הריפו, לא בענן */
const PAGES = { '/matrix': 'src/pages/matrix.html', '/logic': 'src/pages/logic.html' };
/* דפי כניסה וניהול משתמשים — נגישים גם בלי סשן (הכניסה עצמה) */
const AUTH_PAGES = { '/login': 'src/pages/auth.html', '/admin': 'src/pages/admin.html' };
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
    execFileSync(process.execPath, [isStudio ? 'scripts/build-lite.js' : 'scripts/build.js'], { stdio: 'pipe' });
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
}).listen(PORT, () => console.log(`dev server: http://localhost:${PORT}`));
