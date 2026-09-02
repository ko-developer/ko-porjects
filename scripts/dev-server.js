// Minimal dev server: rebuilds on each request so the page is always current.
// + API של פרויקטים מעל data/projects.sqlite — האפליקציה נטענת ונשמרת מה-DB כשהשרת רץ.
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { openDb, readStore, writeStore } from './db.js';

const PORT = process.env.PORT || 4177;
const db = openDb();
/* טבלאות העבודה — חיות בתוך הריפו, לא בענן */
const PAGES = { '/matrix': 'src/pages/matrix.html', '/logic': 'src/pages/logic.html' };
const readState = k => {
  try { return readFileSync(`data/page_state/${k}.json`, 'utf8'); } catch { return '{}'; }
};
createServer((req, res) => {
  if (req.url === '/api/store') {
    if (req.method === 'GET') {
      try {
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
        res.end(JSON.stringify(readStore(db)));
      } catch (e) { res.writeHead(500); res.end(String(e.message)); }
      return;
    }
    if (req.method === 'POST') {
      const chunks = [];
      req.on('data', c => chunks.push(c));
      req.on('end', () => {
        try {
          const n = writeStore(db, JSON.parse(Buffer.concat(chunks).toString('utf8')));
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
    const html = readFileSync(isStudio ? 'dist/studio.html' : 'dist/index.html');
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    res.end(html);
  } catch (e) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('build failed:\n' + e.message);
  }
}).listen(PORT, () => console.log(`dev server: http://localhost:${PORT}`));
