// קישורי דוח לקריאה בלבד — /r/<token> (scripts/dev-server.js). ה-ERP מטמיע את הדוח של הפרויקט (תכנית ללקוח, הדרכה לחשמלאי,
// הדרכה למתקין) בכרטיס הפרויקט, בדף הפרויקט, בהזמנה ובקישור להצעות קבלנים — באג 724708e1 ב-ERP. הקישור נשלח עם ההצעה
// (source_plan ב-create_offer, scripts/erp-routes.js).
// הטוקן הוא ההרשאה: מי שמחזיק בו רואה את הדוח של אותו פרויקט בלבד, בלי כניסה (קבלנים אין להם משתמש, ובתוך iframe של ה-ERP
// אין עוגיות של צד שלישי). לכן הוא נוצר בשרת בלבד (24 בתים אקראיים), נשמר רק בצד השרת — data/report-links.json מקומית
// (מחוץ לגיט), secrets/report-links.json בדלי — ולא בפרויקט עצמו, שהדפדפן יכול לשנות. טוקן חדש לפרויקט = ביטול הקודם.
import { randomBytes } from 'node:crypto';
import { open, rename, rm, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';

const key = st => st.kind === 'fs' ? 'report-links.json' : 'secrets/report-links.json';
const TTL = 60e3;
let CACHE = { at: 0, label: '', data: null };
let CHAIN = Promise.resolve();
const serial = fn => { const p = CHAIN.then(fn, fn); CHAIN = p.catch(() => {}); return p; };
const TOKEN_RX = /^[A-Za-z0-9_-]{24,64}$/;

async function readAll(st, force) {
  if (!force && CACHE.data && CACHE.label === st.label && Date.now() - CACHE.at < TTL) return CACHE.data;
  let j = null;
  try { j = await st.readJson(key(st), null); } catch (e) { console.warn('[report-links] read failed:', e.message); if (CACHE.data && CACHE.label === st.label) return CACHE.data; }
  const data = j && typeof j === 'object' && j.byProject ? j : { byProject: {} };
  CACHE = { at: Date.now(), label: st.label, data };
  return data;
}
async function writeAll(st, data) {
  if (st.kind !== 'fs') await st.writeJson(key(st), data, 0);
  else {   /* מקומית: נוצר ב-600 ומחליף את הקודם בהעברה אטומית (כמו erp-connection.json) */
    const path = join(st.label, key(st)), tmp = path + '.tmp-' + process.pid;
    await mkdir(dirname(path), { recursive: true });
    await rm(tmp, { force: true });
    const fh = await open(tmp, 'wx', 0o600);
    try { await fh.writeFile(JSON.stringify(data)); } finally { await fh.close(); }
    await rename(tmp, path);
  }
  CACHE = { at: Date.now(), label: st.label, data };
}

/* הטוקן של הפרויקט — נוצר בפעם הראשונה; regenerate = טוקן חדש (הקודם מפסיק לעבוד) */
export function reportTokenFor(st, projectId, { regenerate = false } = {}) {
  return serial(async () => {
    const data = await readAll(st, true);
    const cur = data.byProject[projectId];
    if (cur && !regenerate) return cur;
    data.byProject[projectId] = randomBytes(24).toString('base64url');
    await writeAll(st, data);
    return data.byProject[projectId];
  });
}
/* הפרויקט של טוקן, או null. בהחמצה קוראים שוב — אולי נוצר בשרת השני (מחשב ↔ ענן) — אבל לכל היותר פעם ב-10 שניות,
   כדי שניחוש טוקנים לא יהפוך לקריאה מהדלי בכל בקשה */
let lastForced = 0;
export async function projectForReportToken(st, token) {
  if (!TOKEN_RX.test(String(token || ''))) return null;
  const find = d => { for (const [pid, t] of Object.entries(d.byProject)) if (t === token) return pid; return null; };
  const hit = find(await readAll(st, false));
  if (hit || Date.now() - lastForced < 10e3) return hit;
  lastForced = Date.now();
  return find(await readAll(st, true));
}
