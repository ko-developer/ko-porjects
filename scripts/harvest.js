// ===================================================================================
// KO Projects — קציר נתונים מקישור (דף יצרן / PDF של דף נתונים) לכרטיס פריט במטריצה.
// המשתמש מדביק קישור בכרטיס ולוחץ "שמור" → POST /api/harvest {url, model, kind} → כאן.
// בלי AI: חיפוש דפוסי "וואט ↔ אוהם" בטקסט (HTML או PDF), עם העדפה לקטע של הדגם המבוקש
// כשהדף מכסה כמה דגמים (למשל דף IPX של K&F עם IPX 1200 + IPX 2400). מחזיר גם את השורות
// שמהן נלקח כל מספר ("ראיות") כדי שאפשר יהיה לבדוק. אם אין ANTHROPIC_API_KEY — אין
// נפילה ל-AI; אם יש, ורק כשהחיפוש לא מצא כלום, Claude מתבקש להוציא JSON מהטקסט (מסומן).
// ===================================================================================
import { readFileSync } from 'node:fs';

const UA = 'Mozilla/5.0 (Macintosh) KO-Projects harvest';
const OHM = '(?:Ω|Ω|ohms?|Ohm|R\\b)';
const NUM = '(\\d{1,3}(?:[.,]\\d{3})+|\\d+(?:[.,]\\d+)?)';
const numOf = s => { let t = String(s); if (/^\d{1,3}(?:[.,]\d{3})+$/.test(t)) t = t.replace(/[.,]/g, ''); else t = t.replace(',', '.'); const v = +t; return isFinite(v) ? v : null; };
const normModel = s => String(s || '').toUpperCase().replace(/\bK&F\b|KLING|FREITAG|\bXTA\b|\bKT\b|UNICORN|FUNKTION[- ]?ONE|\bSUB\b/g, '').replace(/[^A-Z0-9]/g, '');

/* ---------- טקסט מהמקור ---------- */
export async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,application/pdf,*/*' }, redirect: 'follow' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  const buf = Buffer.from(await res.arrayBuffer());
  if (ct.includes('pdf') || /\.pdf(\?|$)/i.test(url) || buf.slice(0, 5).toString() === '%PDF-') return { kind: 'pdf', lines: await pdfLines(buf) };
  return { kind: 'html', lines: htmlLines(buf.toString('utf8')) };
}
function decode(s) { return s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&[a-z]+;/g, ' '); }
export function htmlLines(html) {
  let h = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/gi, ' ');
  const lines = [];
  /* טבלאות: כל שורה → תאים מופרדים ב-" | " (כך כותרת "@ 8Ω" ותאי המספרים נשארים באותה שורה) */
  h = h.replace(/<table[\s\S]*?<\/table>/gi, t => {
    for (const row of t.match(/<tr[\s\S]*?<\/tr>/gi) || []) {
      const cells = (row.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/gi) || []).map(c => decode(c.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()).filter(Boolean);
      if (cells.length) lines.push('¦ ' + cells.join(' | '));
    }
    return '\n';
  });
  for (const l of decode(h.replace(/<br\s*\/?>|<\/(p|div|li|h\d|tr|dt|dd|section|article)>/gi, '\n').replace(/<[^>]+>/g, ' ')).split('\n')) {
    const s = l.replace(/\s+/g, ' ').trim(); if (s) lines.push(s);
  }
  return lines;
}
async function pdfLines(buf) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), useSystemFonts: true, verbosity: 0 }).promise;
  const lines = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const tc = await (await doc.getPage(p)).getTextContent();
    let cur = '', lastY = null;
    for (const it of tc.items) {
      if (!('str' in it)) continue;
      const y = Math.round(it.transform[5]);
      if (lastY !== null && Math.abs(y - lastY) > 2) { if (cur.trim()) lines.push(cur.replace(/\s+/g, ' ').trim()); cur = ''; }
      cur += (cur && !cur.endsWith(' ') ? ' ' : '') + it.str; lastY = y;
    }
    if (cur.trim()) lines.push(cur.replace(/\s+/g, ' ').trim());
  }
  return lines;
}

/* ---------- חילוץ ---------- */
const ohmRe = new RegExp(NUM + '\\s*' + OHM, 'gi');
const wattRe = new RegExp('(?:^|[^\\d.,])' + NUM + '\\s*(?:W\\b|watts?\\b|Watt\\b)', 'gi');
const all = (re, s) => { const out = []; let m; re.lastIndex = 0; while ((m = re.exec(s))) out.push({ v: numOf(m[1]), i: m.index }); return out.filter(x => x.v != null); };
const isOhmVal = v => v >= 1 && v <= 32;

function pairsInLine(line) {
  /* "800 W (2 Ω)" · "1000W @ 4Ω" · "4 ohms 1000 W" · "2 x 500 W / 8 Ω" · "8Ω | 1000W x 4" */
  const ohms = all(ohmRe, line).filter(x => isOhmVal(x.v)), watts = all(wattRe, line).filter(x => x.v >= 20 && x.v <= 30000);
  if (!ohms.length || !watts.length) return [];
  if (ohms.length === 1) return watts.slice(0, 1).map(w => ({ o: ohms[0].v, w: w.v }));   /* וואט ראשון בשורה — "2 x 500 W" נותן 500 */
  if (ohms.length === watts.length) return ohms.map((o, k) => ({ o: o.v, w: watts[k].v }));
  return [];
}
export function extract(lines, model, kind) {
  const key = normModel(model);
  const same = k => !!k && (k === key || k.startsWith(key) || key.startsWith(k));
  const hits = [];                       /* {o, w, line, idx, bridge} */
  const evidence = [];
  let hdr = null;                        /* כותרת "Load 2Ω 2.7Ω 4Ω 8Ω" או תאי טבלה עם אוהם */
  let hdrCols = null;
  /* כותרות דגם: שורות קצרות שמכילות שם דגם — לקביעת "הקטע" של כל מספר */
  const heads = [];
  const prefix = (key.match(/^[A-Z]+/) || [''])[0];
  lines.forEach((l, i) => {
    if (l.length > 60) return;
    const k = normModel(l.replace(/^¦ /, '').split('|')[0].replace(/:$/, ''));
    if (k && prefix && k.startsWith(prefix) && /\d/.test(k) && k.length <= key.length + 6) heads.push({ i, k });
  });
  const sectionOf = i => { let s = ''; for (const h of heads) { if (h.i <= i) s = h.k; else break; } return s; };
  lines.forEach((l, i) => {
    const bridge = /bridg|גשר|גישור/i.test(l);
    const plain = l.replace(/^¦ /, '');
    /* טבלה עם כותרת עמודות באוהם ("(W) Per Ch. (@ 8R)" / "8Ω | 4Ω | 2Ω") */
    if (l.startsWith('¦ ')) {
      const cells = plain.split(' | ');
      const ohmCols = cells.map(c => { const o = all(ohmRe, c).filter(x => isOhmVal(x.v)); return o.length === 1 && !all(wattRe, c).length ? o[0].v : null; });
      if (ohmCols.filter(Boolean).length >= 2 && !cells.some(c => /^\d+$/.test(c))) { hdrCols = { cols: ohmCols, bridge: cells.map(c => /bridg/i.test(c)) }; return; }
      if (hdrCols && cells.length === hdrCols.cols.length) {
        const rowKey = normModel(cells[0]);
        cells.forEach((c, k) => { const o = hdrCols.cols[k]; const w = numOf(c.replace(/\s*W.*$/i, '')); if (o && w != null && /^\s*[\d.,]+\s*(W|watts?)?\s*(x\s*\d)?\s*$/i.test(c) && w >= 20) hits.push({ o, w, line: l, i, bridge: bridge || hdrCols.bridge[k], row: rowKey }); });
        return;
      }
    }
    /* שורת כותרת "Load 2 Ω 2,7 Ω 4 Ω 8 Ω" ואחריה "… 375 W 375 W 375 W 375 W" */
    const ohmsOnly = all(ohmRe, plain).filter(x => isOhmVal(x.v));
    if (ohmsOnly.length >= 2 && !all(wattRe, plain).length) { hdr = { ohms: ohmsOnly.map(x => x.v), i }; return; }
    if (hdr && i - hdr.i <= 6) {
      const ws = all(wattRe, plain).filter(x => x.v >= 20);
      if (ws.length === hdr.ohms.length && !ohmsOnly.length) { hdr.ohms.forEach((o, k) => hits.push({ o, w: ws[k].v, line: l, i, bridge })); return; }
    }
    for (const p of pairsInLine(plain)) hits.push({ ...p, line: l, i, bridge });
  });
  /* בחירת הקטע: קודם מה שנמצא תחת כותרת/שורה של הדגם המבוקש; אחרת — רק אם הדף לא מדבר על דגמים אחרים */
  /* "IX15" מול כותרת "IX15:4" → IX154 — התאמה בקידומת לשני הכיוונים */
  const mine = hits.filter(h => (h.row && h.row.includes(key)) || (!h.row && same(sectionOf(h.i))));
  const otherModels = new Set(hits.map(h => h.row || sectionOf(h.i)).filter(k => k && !same(k) && !(k.includes(key))));
  let use = mine.length ? mine : (otherModels.size === 0 ? hits : []);
  const ambiguous = !mine.length && otherModels.size > 0;
  const pw = {}, br = {};
  for (const h of use) {
    const tgt = h.bridge ? br : pw;
    if (tgt[h.o] == null) { tgt[h.o] = h.w; evidence.push((h.bridge ? 'גשר ' : '') + h.w + 'W @ ' + h.o + 'Ω ← "' + h.line.replace(/^¦ /, '').slice(0, 90) + '"'); }
  }
  /* ערוצים */
  let ch = null;
  const chLine = lines.findIndex(l => /number of channels|channels/i.test(l) && !/\d/.test(l));
  if (chLine >= 0 && /^\d$/.test(lines[chLine + 1] || '')) ch = +lines[chLine + 1];
  for (const l of use.map(h => h.line)) { const m = /(\d)\s*[x×]\s*[\d.,]+\s*W/i.exec(l); if (m) { ch = +m[1]; break; } }
  if (!ch) { const m = lines.map(l => /(\d)[- ]channel/i.exec(l)).find(Boolean); if (m) ch = +m[1]; }
  /* רמקול: הספק נומינלי, עכבה, רגישות, SPL, כיסוי */
  const spk = {};
  if (kind !== 'amp') {
    const hasMine = heads.some(h => same(h.k));
    const sec = lines.filter((l, i) => !hasMine || same(sectionOf(i)));
    const find = (re, valRe) => { for (const l of sec) if (re.test(l)) { const m = valRe.exec(l); if (m) return { v: numOf(m[1]), line: l }; } return null; };
    const w = find(/power handling|nominal power|power \(?rms|aes power|continuous|program power|hasspek|הספק/i, new RegExp(NUM + '\\s*(?:W\\b|watts?)', 'i'));
    const o = find(/impedance|עכבה/i, new RegExp(NUM + '\\s*' + OHM, 'i'));
    const sens = find(/sensitivity|רגישות/i, new RegExp(NUM + '\\s*dB', 'i'));
    const spl = find(/max\.? ?spl|maximum spl|peak spl|spl max|spl peak/i, new RegExp(NUM + '\\s*dB', 'i'));
    const cov = (() => { for (const l of sec) if (/coverage|dispersion|כיסוי/i.test(l)) { const m = /(\d{2,3})\s*°?\s*[x×]\s*(\d{2,3})\s*°?/.exec(l); if (m) return { v: m[1] + '°×' + m[2] + '°', line: l }; } return null; })();
    if (w && w.v >= 10) { spk.w = w.v; evidence.push('הספק ' + w.v + 'W ← "' + w.line.slice(0, 90) + '"'); }
    if (o && isOhmVal(o.v)) { spk.o = o.v; evidence.push('עכבה ' + o.v + 'Ω ← "' + o.line.slice(0, 90) + '"'); }
    if (sens && sens.v > 70 && sens.v < 120) { spk.sens = sens.v; evidence.push('רגישות ' + sens.v + 'dB ← "' + sens.line.slice(0, 90) + '"'); }
    if (spl && spl.v > 90 && spl.v < 160) { spk.spl = spl.v; evidence.push('SPL ' + spl.v + 'dB ← "' + spl.line.slice(0, 90) + '"'); }
    if (cov) { spk.cov = cov.v; evidence.push('כיסוי ' + cov.v + ' ← "' + cov.line.slice(0, 90) + '"'); }
  }
  return { pw, br, ch, spk, evidence, ambiguous, others: [...otherModels].slice(0, 8), found: Object.keys(pw).length > 0 || Object.keys(spk).length > 0 };
}

/* ---------- נפילה ל-Claude (רק אם יש מפתח, ורק כשלא נמצא כלום) ---------- */
async function claudeExtract(lines, model, kind) {
  let key = process.env.ANTHROPIC_API_KEY;
  if (!key) { try { const m = /^ANTHROPIC_API_KEY=(.+)$/m.exec(readFileSync('.env', 'utf8')); if (m) key = m[1].trim(); } catch {} }
  if (!key) return null;
  const text = lines.join('\n').slice(0, 14000);
  const prompt = `From the manufacturer text below, extract verified numbers for the product "${model}" only (ignore other models). Return ONLY JSON: {"pw":{"8":W,"4":W,"2.7":W,"2":W},"br":{"8":W,"4":W},"ch":N,"spk":{"w":W,"o":ohm,"sens":dB,"spl":dB,"cov":"HxV"}} — omit any key you cannot find verbatim in the text. Never guess.\n\n${text}`;
  const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5', max_tokens: 500, messages: [{ role: 'user', content: prompt }] }) });
  if (!res.ok) return null;
  const j = await res.json(); const t = (j.content || []).map(c => c.text || '').join('');
  const m = /\{[\s\S]*\}/.exec(t); if (!m) return null;
  try { const o = JSON.parse(m[0]); return { pw: o.pw || {}, br: o.br || {}, ch: o.ch || null, spk: o.spk || {}, evidence: ['נקצר ע"י Claude מהטקסט של הדף — לבדוק מול המקור'], ai: true, found: !!(Object.keys(o.pw || {}).length || Object.keys(o.spk || {}).length) }; } catch { return null; }
}

export async function harvest({ url, model, kind }) {
  const src = await fetchText(url);
  let r = extract(src.lines, model, kind);
  if (!r.found && !r.ambiguous) { const ai = await claudeExtract(src.lines, model, kind); if (ai && ai.found) r = ai; }
  return { ...r, source: src.kind, lines: src.lines.length, url };
}

/* CLI: node scripts/harvest.js <url> <model> [amp|spk] */
if (process.argv[1] && /harvest\.js$/.test(process.argv[1]) && process.argv[2]) {
  harvest({ url: process.argv[2], model: process.argv[3] || '', kind: process.argv[4] || 'amp' }).then(r => console.log(JSON.stringify(r, null, 1))).catch(e => { console.error(e.message); process.exit(1); });
}
