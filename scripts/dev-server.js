// Minimal dev server: rebuilds on each request so the page is always current.
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const PORT = process.env.PORT || 4177;
createServer((req, res) => {
  try {
    execFileSync(process.execPath, ['scripts/build.js'], { stdio: 'pipe' });
    const html = readFileSync('dist/index.html');
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    res.end(html);
  } catch (e) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('build failed:\n' + e.message);
  }
}).listen(PORT, () => console.log(`dev server: http://localhost:${PORT}`));
