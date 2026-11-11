// ===================================================================================
// KO Projects — שכבת אחסון אחת לכל מה שהשרת כותב: פרויקטים, משתמשים, באגים וקבציהם,
// תמונות/פריסות גב, מצב הטבלאות. שני מנועים עם אותו ממשק (הכל async):
//   fs  — קבצים מקומיים (DATA_DIR, ברירת מחדל data/)            → פיתוח בלי ענן
//   gcs — דלי Cloud Storage (DATA_BUCKET) דרך ה-JSON API, בלי ספריות → מקומי וענן על אותם נתונים
// אימות ל-GCS לפי מה שזמין: GOOGLE_ACCESS_TOKEN → שרת המטא-דאטה (Cloud Run) →
// קובץ ADC (gcloud auth application-default login / חשבון שירות) → gcloud auth print-access-token.
// ===================================================================================
import { readFile, writeFile, readdir, unlink, mkdir, stat, rename } from 'node:fs/promises';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { execFile } from 'node:child_process';
import { createSign } from 'node:crypto';
import { request as httpsRequest, Agent } from 'node:https';
import { Resolver, lookup as sysLookup } from 'node:dns';

/* פתרון שמות ל-Google דרך 8.8.8.8 / 1.1.1.1 ולא דרך ה-DNS של הרשת: ה-DNS של הראוטר במשרד (FortiGuard 208.91.112.x) החזיר
   ל-storage.googleapis.com כתובות בסינגפור — 340–400 מילישניות לכל סיבוב ו-150KB/s, במקום 6 מילישניות לשרת של גוגל בישראל.
   בענן (K_SERVICE) ו-GCS_DNS=system — פתרון השמות של המערכת. כישלון (UDP 53 חסום) → נפילה למערכת, ונזכר לדקה כדי לא לחכות שוב */
const FAST_DNS = !process.env.K_SERVICE && process.env.GCS_DNS !== 'system';
/* כל שרת DNS נשאל במקביל (1.1.1.1 קרוב יותר מ-8.8.8.8 מישראל) — הראשון שעונה מנצח; תשובה טובה נשמרת שעה בזיכרון,
   ו"הכתובת הטובה האחרונה" נשמרת גם על הדיסק (data/.cache-gcs/dns.json) ומשמשת כשכל השרתים לא עונים (ETIMEOUT/ENOTFOUND של
   ה-DNS במשרד) — כך תקלת DNS רגעית לא מפילה את הדלי ולא גוררת "עותק זמני". שגיאת חיבור לכתובת → הכתובת נזרקת ונשאלים מחדש */
const DNS_SERVERS = (process.env.GCS_DNS || '1.1.1.1,8.8.8.8').split(',').map(s => s.trim()).filter(Boolean);
const RESOLVERS = FAST_DNS ? DNS_SERVERS.map(s => { const r = new Resolver({ timeout: 1200, tries: 1 }); r.setServers([s]); return r; }) : [];
const RESOLVER = RESOLVERS.length ? RESOLVERS[0] : null;
const DNS_FILE = process.env.K_SERVICE ? '' : 'data/.cache-gcs/dns.json';
const DNS_CACHE = new Map();   /* host → { ips, exp, good, inflight } — good = הכתובות הטובות האחרונות (לא פגות) */
try { if (DNS_FILE && existsSync(DNS_FILE)) for (const [h, ips] of Object.entries(JSON.parse(readFileSync(DNS_FILE, 'utf8')))) if (Array.isArray(ips) && ips.length) DNS_CACHE.set(h, { ips: [], exp: 0, good: ips }); } catch {}
function dnsPersist() { if (!DNS_FILE) return; try { mkdirSync(dirname(DNS_FILE), { recursive: true }); writeFileSync(DNS_FILE, JSON.stringify(Object.fromEntries([...DNS_CACHE].filter(([, c]) => c.good && c.good.length).map(([h, c]) => [h, c.good])))); } catch {} }
function dnsResolveAll(host) {
  return new Promise(res => {
    let left = RESOLVERS.length, done = false;
    const fin = ips => { if (done) return; done = true; res(ips); };
    for (const r of RESOLVERS) r.resolve4(host, (err, ips) => { if (!err && ips && ips.length) return fin(ips); if (!--left) fin(null); });
    if (!left) fin(null);
  });
}
function fastLookup(host, opts, cb) {
  if (typeof opts === 'function') { cb = opts; opts = {}; }
  opts = opts || {};
  const done = ips => opts.all ? cb(null, ips.map(address => ({ address, family: 4 }))) : cb(null, ips[0], 4);
  let c = DNS_CACHE.get(host);
  if (c && c.exp > Date.now() && c.ips.length) return done(c.ips);
  if (!c) { c = { ips: [], exp: 0, good: null, inflight: null }; DNS_CACHE.set(host, c); }
  if (!c.inflight) c.inflight = dnsResolveAll(host).then(ips => {
    if (ips) { c.ips = ips; c.good = ips; c.exp = Date.now() + 3600e3; dnsPersist(); return ips; }
    c.ips = []; c.exp = Date.now() + 30e3;   /* נכשל — לא שואלים שוב ב-30 השניות הקרובות, משתמשים בכתובת הטובה האחרונה */
    return null;
  }).finally(() => { c.inflight = null; });
  c.inflight.then(ips => {
    if (ips) return done(ips);
    if (c.good && c.good.length) { if (!c.warned) { c.warned = true; console.warn('[dns] ' + host + ': DNS לא עונה — ממשיכים עם הכתובת הטובה האחרונה ' + c.good[0]); } return done(c.good); }
    sysLookup(host, opts, cb);
  });
}
/* שגיאת חיבור (timeout / refused) לכתובת מהמטמון — נזרקת, הבקשה הבאה שואלת מחדש */
function dnsBust(host) { const c = DNS_CACHE.get(host); if (c) { c.exp = 0; c.warned = false; } }
const AGENT_LOOKUP = RESOLVER ? { lookup: fastLookup } : {};

/* HTTP עם חיבור חי (keep-alive): ה-fetch המובנה פותח TLS חדש לכל בקשה (~3 שניות ממחשב רחוק);
   עם חיבור חי כל קריאה = סיבוב אחד לשרת (~0.4 שניות מהמחשב, מילישניות בענן) */
const agent = new Agent({ keepAlive: true, keepAliveMsecs: 30e3, maxSockets: 24, timeout: 60e3, scheduling: 'lifo', ...AGENT_LOOKUP });
/* timeout קצר לקריאות/רשימות (חיבור תקוע לא עוצר את הדף לדקה), ארוך להעלאות של פרויקטים גדולים */
function http(url, { method = 'GET', headers = {}, body, timeout, fresh } = {}) {
  const tmo = timeout || (body && body.length > 65536 ? 120e3 : 15e3);
  return new Promise((resolve, reject) => {
    /* fresh — ניסיון חוזר על חיבור חדש: חיבור חי "מת" (אחרי שינה/החלפת רשת) נתקע עד ה-timeout, וחזרה לאותו מאגר חיבורים רק חוזרת על התקיעה */
    const r = httpsRequest(url, { method, headers, agent: fresh ? new Agent({ keepAlive: false, ...AGENT_LOOKUP }) : agent }, res => {
      const ch = []; res.on('data', c => ch.push(c));
      res.on('end', () => { const buf = Buffer.concat(ch); resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, arrayBuffer: async () => buf, text: async () => buf.toString('utf8'), json: async () => JSON.parse(buf.toString('utf8') || 'null') }); });
      res.on('error', reject);
    });
    r.on('error', e => { if (RESOLVER && /ECONNREFUSED|ETIMEDOUT|EHOSTUNREACH|ENETUNREACH|timeout|stalled/i.test(String(e && e.message))) { try { dnsBust(new URL(url).hostname); } catch {} } reject(e); });
    r.setTimeout(tmo, () => r.destroy(new Error('GCS: timeout after ' + tmo / 1000 + 's')));
    /* deadline כולל: בקשה שממתינה בתור ל-socket (כל 24 החיבורים תקועים אחרי שינה) לא מקבלת setTimeout — וחיכתה לנצח */
    const dead = setTimeout(() => r.destroy(new Error('GCS: no socket / stalled after ' + ((tmo + 5e3) / 1000) + 's')), tmo + 5e3);
    r.on('close', () => clearTimeout(dead));
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
        /* קריאות (בלי גוף): timeout קצר שעולה בהדרגה — 5, 8, 12 שניות — והניסיונות החוזרים על חיבור חדש; קודם כל תקיעה עלתה 3×15 שניות והדף חיכה לה */
        const quick = !opts.body && !opts.timeout ? { timeout: [5e3, 8e3, 12e3][Math.min(i, 2)], fresh: i > 0 } : { fresh: i > 0 && !opts.body };
        const r = await http(url, { ...opts, ...quick, headers: { ...(opts.headers || {}), authorization: 'Bearer ' + await token() } });
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
/* הבקשה לאסימון הולכת דרך http() (ה-agent עם ה-DNS המהיר + timeout) ולא דרך fetch הגלובלי שמשתמש ב-DNS של המערכת:
   במשרד oauth2.googleapis.com מתורגם לשרת רחוק (400ms) ולפעמים נכשל — ואז כל הקריאות לדלי נפלו ("ADC token failed") */
function tokenPost(params) {
  const body = params.toString();
  return http('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'content-length': Buffer.byteLength(body) }, body, timeout: 15e3 });
}
async function fetchToken() {
  if (process.env.GOOGLE_ACCESS_TOKEN) return { v: process.env.GOOGLE_ACCESS_TOKEN, exp: Date.now() + 3600e3 };
  /* Cloud Run / GCE — שרת המטא-דאטה */
  if (process.env.K_SERVICE || process.env.GCE_METADATA_HOST || process.env.GOOGLE_CLOUD_RUN) {
    const r = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', { headers: { 'Metadata-Flavor': 'Google' } });
    if (r.ok) { const j = await r.json(); return { v: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1e3 }; }
  }
  /* קובץ ADC — משתמש (gcloud auth application-default login) או חשבון שירות */
  const adc = process.env.GOOGLE_APPLICATION_CREDENTIALS || join(homedir(), '.config/gcloud/application_default_credentials.json');
  let adcErr = '';
  if (existsSync(adc)) {
    try {
      const c = JSON.parse(readFileSync(adc, 'utf8'));
      if (c.type === 'authorized_user') {
        const r = await tokenPost(new URLSearchParams({ client_id: c.client_id, client_secret: c.client_secret, refresh_token: c.refresh_token, grant_type: 'refresh_token' }));
        if (r.ok) { const j = await r.json(); return { v: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1e3 }; }
      } else if (c.type === 'service_account') {
        const now = Math.floor(Date.now() / 1e3);
        const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
        const unsigned = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({ iss: c.client_email, scope: 'https://www.googleapis.com/auth/devstorage.read_write', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
        const sig = createSign('RSA-SHA256').update(unsigned).sign(c.private_key, 'base64url');
        const r = await tokenPost(new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: unsigned + '.' + sig }));
        if (r.ok) { const j = await r.json(); return { v: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1e3 }; }
        adcErr = 'HTTP ' + r.status + ' ' + (await r.text()).slice(0, 120);
      }
    } catch (e) { console.warn('ADC token failed:', e.message); adcErr = e.message; }
  }
  /* יש קובץ מפתח של חשבון שירות (לא פג) — הכשל הוא ברשת/בשירות האסימונים, לא בכניסה */
  if (adcErr && process.env.GOOGLE_APPLICATION_CREDENTIALS) throw new Error('בקשת אסימון גישה ל-Cloud Storage נכשלה (' + adcErr + ') — קובץ המפתח קיים; כנראה תקלת רשת רגעית');
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
