// ===================================================================================
// קציר נתוני תאורה מהאתר של KO: מוצרי החנות (Store API ציבורי) + דפי הנתונים (PDF לכל מק"ט
// בדלי ko-wp-images/docs/) → data/light_fixtures.json (מוזרק לאפליקציה כ-LIGHT_FIXTURES).
// לכל מוצר: מק"ט, שם, קטגוריות, תמונה, מחיר אתר, קישור לדף הנתונים, ומפרט שנקרא מה-PDF
// (וואט, לומן, זווית אלומה, ערוצי DMX, IP, משקל, גוון, זום, מקור אור) + שורת הראיה לכל ערך.
// בלי AI ובלי ניחושים: ערך שלא נמצא בטקסט נשאר ריק (מסומן באפליקציה כ"לא ידוע").
// שימוש: node scripts/harvest-light.js [--cats=250,254,253] [--limit=N]
// ===================================================================================
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)=(.*)$/); return m ? [m[1], m[2]] : [a.replace(/^--/, ''), true]; }));
/* קטגוריות-אב בחנות: 250 תאורה מקצועית · 254 בקרה ושליטה · 253 תליה ובמה · 251 תאורה אדריכלית · 252 נורות */
const ROOT_CATS = String(args.cats || '250,254,253,251,252').split(',').map(Number);
const LIMIT = +args.limit || 0;
const OUT = 'data/light_fixtures.json';
const UA = 'Mozilla/5.0 (Macintosh) KO-Projects harvest-light';

async function getJson(u) { const r = await fetch(u, { headers: { 'user-agent': UA } }); if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + u); return r.json(); }

/* ---------- 1. עץ הקטגוריות ---------- */
const cats = [];
for (let page = 1; page <= 5; page++) { const c = await getJson(`https://store.kot.co.il/wp-json/wc/store/v1/products/categories?per_page=100&page=${page}`); if (!c.length) break; cats.push(...c); }
const catById = Object.fromEntries(cats.map(c => [c.id, c]));
const rootOf = id => { let c = catById[id], g = 0; while (c && c.parent && g++ < 6) c = catById[c.parent]; return c ? c.id : id; };
const catPath = id => { const p = []; let c = catById[id], g = 0; while (c && g++ < 6) { p.unshift(c.name); c = c.parent ? catById[c.parent] : null; } return p.join(' / '); };

/* ---------- 2. דפי הנתונים בדלי ---------- */
const docs = new Map();
{ let tok = '';
  do { const j = await getJson(`https://storage.googleapis.com/storage/v1/b/ko-wp-images/o?prefix=docs/&maxResults=1000&fields=items(name,size),nextPageToken${tok ? '&pageToken=' + tok : ''}`);
    for (const it of j.items || []) { const m = it.name.match(/^docs\/(.+)\.(pdf|zip|png)$/i); if (m && !(docs.get(m[1].trim().toUpperCase()) || {}).ext?.match(/pdf/)) docs.set(m[1].trim().toUpperCase(), { url: 'https://storage.googleapis.com/ko-wp-images/' + encodeURIComponent(it.name).replace(/%2F/g, '/'), size: +it.size, ext: m[2].toLowerCase() }); }
    tok = j.nextPageToken || ''; } while (tok); }
console.log('קטגוריות', cats.length, '· דפי נתונים בדלי', docs.size);

/* ---------- 3. מוצרי החנות ---------- */
const prods = [];
for (let page = 1; page <= 40; page++) {
  const items = await getJson(`https://store.kot.co.il/wp-json/wc/store/v1/products?per_page=100&page=${page}`);
  if (!items.length) break;
  for (const p of items) {
    const sku = (p.sku || '').trim(); if (!sku) continue;
    const roots = new Set(p.categories.map(c => rootOf(c.id)));
    if (!p.categories.some(c => ROOT_CATS.includes(rootOf(c.id)))) continue;
    const lead = p.categories.map(c => c.id).sort((a, b) => (catById[a] && catById[a].parent ? 0 : 1) - (catById[b] && catById[b].parent ? 0 : 1))[0];
    prods.push({ sku, name: p.name.replace(/&#8211;|&#215;/g, m => ({ '&#8211;': '–', '&#215;': '×' }[m])).replace(/\s+/g, ' ').trim(), cat: catPath(lead), root: rootOf(lead), cats: p.categories.map(c => c.name),
      price: p.prices && +p.prices.price ? +p.prices.price / Math.pow(10, +p.prices.currency_minor_unit || 0) : null, img: (p.images[0] || {}).src || '',
      desc: (p.short_description + ' ' + p.description).replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#8211;|&#215;|&quot;/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 900), link: p.permalink, roots: [...roots] });
  }
}
console.log('מוצרי תאורה/בקרה/תליה בחנות', prods.length);

/* ---------- 4. מפרט מה-PDF ---------- */
let pdfjs = null;
async function pdfText(url) {
  if (!pdfjs) pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  let buf = null, last = null;
  for (let t = 0; t < 4 && !buf; t++) { try { const r = await fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(60e3) }); if (!r.ok) throw new Error('HTTP ' + r.status); buf = await r.arrayBuffer(); } catch (e) { last = e; await new Promise(r => setTimeout(r, 1500 * (t + 1))); } }
  if (!buf) throw last || new Error('fetch failed');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), useSystemFonts: true, verbosity: 0 }).promise;
  const lines = [];
  for (let p = 1; p <= Math.min(doc.numPages, 12); p++) {
    const tc = await (await doc.getPage(p)).getTextContent(); let cur = '', lastY = null;
    for (const it of tc.items) { if (!('str' in it)) continue; const y = Math.round(it.transform[5]); if (lastY !== null && Math.abs(y - lastY) > 2) { if (cur.trim()) lines.push(cur.trim()); cur = ''; } cur += (it.str || '') + (it.hasEOL ? ' ' : ' '); lastY = y; }
    if (cur.trim()) lines.push(cur.trim());
  }
  return lines;
}
const NUM = '(\\d+(?:[.,]\\d+)?)';
const RX = {
  watt: [new RegExp('(?:power(?:\\s*consumption)?|rated power|max(?:imum)? power|wattage|total power|הספק|צריכת חשמל)[^\\n\\d]{0,25}' + NUM + '\\s*W\\b', 'i'), new RegExp(NUM + '\\s*W(?:att)?\\b[^\\n]{0,20}(?:power|consumption|הספק)', 'i')],
  lumen: [new RegExp('(?:luminous flux|lumen(?:s)? output|light output|lumens|lumen|total lumen|שטף אור|לומן)[^\\n\\d]{0,30}' + NUM + '\\s*(?:lm|lumens?)\\b', 'i'), new RegExp(NUM + '\\s*(?:lm|lumens)\\b', 'i')],
  beam: [new RegExp('(?:beam angle|beam|zoom(?: range)?|field angle|זווית(?: אלומה| פיזור)?)[^\\n\\d]{0,20}' + NUM + '\\s*°?\\s*(?:[-–~to]+\\s*' + NUM + ')?\\s*°', 'i'), new RegExp(NUM + '\\s*°\\s*(?:[-–~]\\s*' + NUM + '\\s*°)?\\s*(?:beam|zoom)', 'i')],
  dmx: [new RegExp('(?:DMX(?: 512)?(?:\\s*channels?| modes?| control)?|channels?(?: modes?)?|ערוצי DMX|ערוצים)[^\\n\\d]{0,25}' + NUM + '(?:\\s*(?:/|,|or|\\|)\\s*' + NUM + ')*\\s*(?:ch(?:annels?)?\\b|CH\\b|ערוצים)', 'i'), new RegExp(NUM + '\\s*(?:/\\s*' + NUM + ')*\\s*(?:DMX )?ch(?:annels?)?\\b', 'i')],
  ip: [/\bIP\s?(\d\d)\b/],
  kg: [new RegExp('(?:weight|net weight|משקל)[^\\n\\d]{0,20}' + NUM + '\\s*kg', 'i'), new RegExp(NUM + '\\s*kg\\b', 'i')],
  kelvin: [new RegExp('(?:colou?r temp(?:erature)?|CCT|גוון|טמפרטורת צבע)[^\\n\\d]{0,20}' + NUM + '\\s*K\\b', 'i'), new RegExp('\\b(\\d{4})\\s*K\\b')],
  source: [/\b(\d+)\s*[x×]\s*(\d+(?:\.\d+)?)\s*W\s*(RGBW?A?L?|LED|white|warm white|CW|WW)?/i, /\b(LED|OSRAM|Philips|discharge|halogen|laser)\b[^\n]{0,30}?(\d+)\s*W/i],
  pan: [new RegExp('pan[^\\n\\d]{0,15}' + NUM + '\\s*°', 'i')], tilt: [new RegExp('tilt[^\\n\\d]{0,15}' + NUM + '\\s*°', 'i')],
};
const num = s => +String(s).replace(',', '.');
function extract(lines) {
  const spec = {}, ev = {};
  const txt = lines.join('\n');
  for (const [k, rxs] of Object.entries(RX)) {
    for (const rx of rxs) {
      const m = txt.match(rx); if (!m) continue;
      const line = lines.find(l => rx.test(l)) || m[0];
      if (k === 'beam') { spec.beam = num(m[1]); if (m[2]) spec.beamMax = num(m[2]); }
      else if (k === 'dmx') { const all = m[0].match(/\d+/g).map(Number).filter(n => n > 0 && n <= 512); spec.dmx = all; }
      else if (k === 'source') { spec.source = m[0].replace(/\s+/g, ' ').trim(); }
      else if (k === 'ip') spec.ip = 'IP' + m[1];
      else spec[k] = num(m[1]);
      ev[k] = line.slice(0, 160); break;
    }
  }
  return { spec, ev };
}
const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { items: [] };
const prevBy = new Map((prev.items || []).map(x => [x.sku, x]));
const out = []; let withPdf = 0, parsed = 0, fail = 0, i = 0;
for (const p of prods) {
  if (LIMIT && i++ >= LIMIT) break;
  const d = docs.get(p.sku.toUpperCase()) || docs.get(p.sku.toUpperCase().replace(/S$/, '')) || null;
  const rec = { ...p, pdf: d ? d.url : null, spec: {}, ev: {} };
  if (d && d.ext === 'pdf') {
    withPdf++;
    const old = prevBy.get(p.sku);
    if (old && old.pdf === d.url && old.spec && old.parsedAt) { rec.spec = old.spec; rec.ev = old.ev; rec.parsedAt = old.parsedAt; parsed++; }
    else { try { const { spec, ev } = extract(await pdfText(d.url)); rec.spec = spec; rec.ev = ev; rec.parsedAt = new Date().toISOString(); parsed++; } catch (e) { fail++; rec.pdfErr = String(e.message || e).slice(0, 80); } }
  }
  /* השלמה מהשם ומהתיאור בחנות (רק מה שכתוב במפורש) */
  const nm = p.name + ' ' + p.desc;
  if (rec.spec.watt == null) { const m = nm.match(/(\d+)\s*[x×]\s*(\d+(?:\.\d+)?)\s*W\b/i) || nm.match(/\b(\d{2,4})\s*W(?:att)?\b/i); if (m) { rec.spec.watt = m[2] ? +m[1] * +m[2] : +m[1]; rec.ev.watt = 'שם/תיאור בחנות: ' + m[0]; } }
  if (!rec.spec.ip) { const m = nm.match(/\bIP\s?(\d\d)\b/); if (m) { rec.spec.ip = 'IP' + m[1]; rec.ev.ip = 'שם/תיאור בחנות'; } }
  if (!rec.spec.source) { const m = nm.match(/(\d+)\s*[x×]\s*(\d+(?:\.\d+)?)\s*W\s*(RGBW?A?L?|LED)?/i); if (m) { rec.spec.source = m[0].replace(/\s+/g, ' '); rec.ev.source = 'שם/תיאור בחנות'; } }
  if (rec.spec.kelvin == null) { const m = nm.match(/\b(\d{4})\s*K\b/); if (m) { rec.spec.kelvin = +m[1]; rec.ev.kelvin = 'שם/תיאור בחנות'; } }
  /* סוג הגוף — לפי הקטגוריה והשם */
  const t = p.cat + ' ' + p.name;
  rec.kind = /חכמ|moving|בים|beam|ספוט ווש|wash zoom|spot wash/i.test(t) && /פנס/i.test(t) ? 'moving' : /ווש|wash|פאר|par\b|בלינדר|blinder|פנסי במה סטטיים|מוגני מים|פנס/i.test(t) ? 'static' :
    /אפקט|עשן|ערפל|מראות|לייזר|laser|סטרוב|strobe/i.test(t) ? 'effect' : /דימר|dimmer/i.test(t) ? 'dimmer' : /בקר|לוח|פיקוד|console|controller|ChamSys|שלט/i.test(t) ? 'control' : /ספק|power supply|דרייבר|driver/i.test(t) ? 'psu' :
    /בוסטר|מפצל|splitter|node/i.test(t) ? 'dmx' : /טראס|truss/i.test(t) ? 'truss' : /מתקני הרמה|מנוע|hoist|chain/i.test(t) ? 'hoist' : /קלמר|clamp|כבלי אבטחה|safety/i.test(t) ? 'clamp' :
    /סטריפ|פס לד|ניאון|פיקסל|pixel|פרופיל/i.test(t) ? 'strip' : /שקוע|ספוט|צבירה|גוף תאורה|downlight|track/i.test(t) ? 'arch' : /נורה|נורות|bulb|lamp/i.test(t) ? 'lamp' : 'other';
  out.push(rec);
}
writeFileSync(OUT, JSON.stringify({ at: new Date().toISOString(), source: 'store.kot.co.il + gs://ko-wp-images/docs', n: out.length, items: out }, null, 1));
const byKind = out.reduce((m, x) => (m[x.kind] = (m[x.kind] || 0) + 1, m), {});
console.log('נשמרו', out.length, 'פריטים →', OUT, '· עם דף נתונים', withPdf, '· נקראו', parsed, '· נכשלו', fail);
console.log('לפי סוג:', JSON.stringify(byKind));
const sp = out.filter(x => x.pdf).map(x => Object.keys(x.spec).length); console.log('ממוצע שדות מפרט ל-PDF:', (sp.reduce((a, b) => a + b, 0) / (sp.length || 1)).toFixed(1));
