// ===================================================================================
// KO Projects — שכבת אחסון אחת לכל מה שהשרת כותב: פרויקטים, משתמשים, באגים וקבציהם,
// תמונות/פריסות גב, מצב הטבלאות. שני מנועים עם אותו ממשק (הכל async):
//   fs  — קבצים מקומיים (DATA_DIR, ברירת מחדל data/)            → פיתוח בלי ענן
//   gcs — דלי Cloud Storage (DATA_BUCKET) דרך ה-JSON API, בלי ספריות → מקומי וענן על אותם נתונים
// אימות ל-GCS לפי מה שזמין: GOOGLE_ACCESS_TOKEN → שרת המטא-דאטה (Cloud Run) →
// קובץ ADC (gcloud auth application-default login / חשבון שירות) → gcloud auth print-access-token.
// ===================================================================================
import { readFile, writeFile, readdir, unlink, mkdir, stat, rename } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { execFile } from 'node:child_process';
import { createSign } from 'node:crypto';
import { request as httpsRequest, Agent } from 'node:https';

/* HTTP עם חיבור חי (keep-alive): ה-fetch המובנה פותח TLS חדש לכל בקשה (~3 שניות ממחשב רחוק);
   עם חיבור חי כל קריאה = סיבוב אחד לשרת (~0.4 שניות מהמחשב, מילישניות בענן) */
const agent = new Agent({ keepAlive: true, keepAliveMsecs: 30e3, maxSockets: 24, timeout: 60e3 });
/* timeout קצר לקריאות/רשימות (חיבור תקוע לא עוצר את הדף לדקה), ארוך להעלאות של פרויקטים גדולים */
function http(url, { method = 'GET', headers = {}, body, timeout } = {}) {
  const tmo = timeout || (body && body.length > 65536 ? 120e3 : 15e3);
  return new Promise((resolve, reject) => {
    const r = httpsRequest(url, { method, headers, agent }, res => {
      const ch = []; res.on('data', c => ch.push(c));
      res.on('end', () => { const buf = Buffer.concat(ch); resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, arrayBuffer: async () => buf, text: async () => buf.toString('utf8'), json: async () => JSON.parse(buf.toString('utf8') || 'null') }); });
      res.on('error', reject);
    });
    r.on('error', reject);
    r.setTimeout(tmo, () => r.destroy(new Error('GCS: timeout after ' + tmo / 1000 + 's')));
    if (body) r.write(body);
    r.end();
  });
}

export function makeStorage() {
  const bucket = (process.env.DATA_BUCKET || '').trim();
  return bucket ? gcsStorage(bucket) : fsStorage(process.env.DATA_DIR || 'data');
}

/* ---------- קבצים מקומיים ---------- */
function fsStorage(root) {
  const p = k => join(root, k);
  return {
    kind: 'fs', label: root,
    async check() { await mkdir(root, { recursive: true }); return true; },
    async read(k) { try { return await readFile(p(k)); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } },
    async write(k, data) { await mkdir(dirname(p(k)), { recursive: true }); const tmp = p(k) + '.tmp-' + process.pid; await writeFile(tmp, data); await rename(tmp, p(k)); },
    async delete(k) { try { await unlink(p(k)); } catch (e) { if (e.code !== 'ENOENT') throw e; } },
    async exists(k) { return existsSync(p(k)); },
    async list(prefix) {
      /* prefix = תיקייה/ או תחילת שם בתוך תיקייה */
      const dir = prefix.endsWith('/') ? prefix : dirname(prefix) === '.' ? '' : dirname(prefix) + '/';
      const head = prefix.endsWith('/') ? '' : prefix.slice(dir.length);
      let names = []; try { names = await readdir(p(dir)); } catch { return []; }
      const out = [];
      for (const n of names) {
        if (!n.startsWith(head) || n.endsWith('.tmp-' + process.pid)) continue;
        try { const s = await stat(p(dir + n)); if (s.isFile()) out.push({ name: dir + n, size: s.size, updated: s.mtime.toISOString() }); } catch {}
      }
      return out;
    },
    ...jsonHelpers(),
  };
}

/* ---------- Cloud Storage ---------- */
function gcsStorage(bucket) {
  const B = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}`;
  const UP = `https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(bucket)}/o`;
  let tok = null;                       /* { v, exp } */
  const cache = new Map();              /* קריאות חוזרות באותה בקשה: TTL קצר */
  const TTL = 1500;
  async function token() {
    if (tok && tok.exp > Date.now() + 60e3) return tok.v;
    tok = await fetchToken();
    return tok.v;
  }
  async function call(url, opts = {}, tries = 3) {
    let last;
    for (let i = 0; i < tries; i++) {
      try {
        const r = await http(url, { ...opts, headers: { ...(opts.headers || {}), authorization: 'Bearer ' + await token() } });
        if (r.status === 401 && i === 0) { tok = null; continue; }
        if ((r.status >= 500 || r.status === 429) && i < tries - 1) { await sleep(300 * 2 ** i); continue; }
        return r;
      } catch (e) { last = e; if (i < tries - 1) { await sleep(300 * 2 ** i); continue; } }
    }
    throw last || new Error('GCS: request failed');
  }
  const enc = k => encodeURIComponent(k);
  return {
    kind: 'gcs', label: 'gs://' + bucket,
    async check() {
      /* רשימת אובייקט אחד ולא מטא-דאטה של הדלי — כך מספיקה הרשאת objectAdmin על הדלי בלבד (המפתח המקומי) */
      const r = await call(`${B}/o?maxResults=1&fields=items(name)`);
      if (!r.ok) throw new Error(`GCS bucket ${bucket}: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
      return true;
    },
    async read(k) {
      const c = cache.get(k); if (c && c.t > Date.now() - TTL) return c.v;
      const r = await call(`${B}/o/${enc(k)}?alt=media`);
      if (r.status === 404) { cache.set(k, { t: Date.now(), v: null }); return null; }
      if (!r.ok) throw new Error(`GCS read ${k}: HTTP ${r.status}`);
      const v = Buffer.from(await r.arrayBuffer()); cache.set(k, { t: Date.now(), v }); return v;
    },
    async write(k, data, contentType) {
      const buf = Buffer.isBuffer(data) ? data : Buffer.from(String(data));
      const ct = contentType || (k.endsWith('.json') ? 'application/json; charset=utf-8' : guessType(k));
      const r = await call(`${UP}?uploadType=media&name=${enc(k)}`, { method: 'POST', headers: { 'content-type': ct, 'content-length': String(buf.length) }, body: buf });
      if (!r.ok) throw new Error(`GCS write ${k}: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
      cache.set(k, { t: Date.now(), v: buf });
    },
    async delete(k) {
      const r = await call(`${B}/o/${enc(k)}`, { method: 'DELETE' });
      if (!r.ok && r.status !== 404) throw new Error(`GCS delete ${k}: HTTP ${r.status}`);
      cache.delete(k);
    },
    async exists(k) { const r = await call(`${B}/o/${enc(k)}?fields=name`); return r.ok; },
    async list(prefix) {
      const out = []; let pageToken = '';
      do {
        const r = await call(`${B}/o?prefix=${enc(prefix)}&maxResults=1000&fields=items(name,size,updated,generation),nextPageToken${pageToken ? '&pageToken=' + enc(pageToken) : ''}`);
        if (!r.ok) throw new Error(`GCS list ${prefix}: HTTP ${r.status}`);
        const j = await r.json();
        for (const it of j.items || []) out.push({ name: it.name, size: +it.size, updated: it.updated, gen: it.generation });
        pageToken = j.nextPageToken || '';
      } while (pageToken);
      return out;
    },
    ...jsonHelpers(),
  };
}
function jsonHelpers() {
  return {
    async readJson(k, def = null) { const b = await this.read(k); if (!b) return def; try { return JSON.parse(b.toString('utf8')); } catch { return def; } },
    async writeJson(k, obj, pretty = 1) { await this.write(k, JSON.stringify(obj, null, pretty), 'application/json; charset=utf-8'); },
    async readText(k) { const b = await this.read(k); return b ? b.toString('utf8') : null; },
  };
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
function guessType(k) {
  const e = k.split('.').pop().toLowerCase();
  return { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', pdf: 'application/pdf', webm: 'video/webm', mp4: 'video/mp4', mov: 'video/quicktime', txt: 'text/plain', json: 'application/json' }[e] || 'application/octet-stream';
}

/* ---------- אסימון גישה ל-Google ---------- */
async function fetchToken() {
  if (process.env.GOOGLE_ACCESS_TOKEN) return { v: process.env.GOOGLE_ACCESS_TOKEN, exp: Date.now() + 3600e3 };
  /* Cloud Run / GCE — שרת המטא-דאטה */
  if (process.env.K_SERVICE || process.env.GCE_METADATA_HOST || process.env.GOOGLE_CLOUD_RUN) {
    const r = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', { headers: { 'Metadata-Flavor': 'Google' } });
    if (r.ok) { const j = await r.json(); return { v: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1e3 }; }
  }
  /* קובץ ADC — משתמש (gcloud auth application-default login) או חשבון שירות */
  const adc = process.env.GOOGLE_APPLICATION_CREDENTIALS || join(homedir(), '.config/gcloud/application_default_credentials.json');
  if (existsSync(adc)) {
    try {
      const c = JSON.parse(readFileSync(adc, 'utf8'));
      if (c.type === 'authorized_user') {
        const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: c.client_id, client_secret: c.client_secret, refresh_token: c.refresh_token, grant_type: 'refresh_token' }) });
        if (r.ok) { const j = await r.json(); return { v: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1e3 }; }
      } else if (c.type === 'service_account') {
        const now = Math.floor(Date.now() / 1e3);
        const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
        const unsigned = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({ iss: c.client_email, scope: 'https://www.googleapis.com/auth/devstorage.read_write', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
        const sig = createSign('RSA-SHA256').update(unsigned).sign(c.private_key, 'base64url');
        const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: unsigned + '.' + sig }) });
        if (r.ok) { const j = await r.json(); return { v: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1e3 }; }
      }
    } catch (e) { console.warn('ADC token failed:', e.message); }
  }
  /* gcloud CLI — הכניסה של המשתמש במחשב */
  const bins = [process.env.GCLOUD_BIN, 'gcloud', join(homedir(), '.local/google-cloud-sdk/bin/gcloud')].filter(Boolean);
  const env = { ...process.env };
  if (!env.CLOUDSDK_PYTHON && existsSync(join(homedir(), '.local/python/python/bin/python3'))) env.CLOUDSDK_PYTHON = join(homedir(), '.local/python/python/bin/python3');
  for (const bin of bins) {
    try {
      /* בלי פרומפטים: כשהכניסה פגה gcloud מנסה לשאול שאלה ונתקע — כאן הוא נכשל מיד ואנחנו נופלים לנתונים מקומיים */
      const v = await new Promise((res, rej) => execFile(bin, ['auth', 'print-access-token', '--quiet'], { env: { ...env, CLOUDSDK_CORE_DISABLE_PROMPTS: '1' }, timeout: 15e3 }, (e, out) => e ? rej(e) : res(out.trim())));
      if (v) return { v, exp: Date.now() + 50 * 60e3 };
    } catch {}
  }
  throw new Error('אין אסימון גישה ל-Cloud Storage: הרץ `gcloud auth login` (או `gcloud auth application-default login`), או הסר DATA_BUCKET מ-.env כדי לעבוד על קבצים מקומיים');
}
