/* ===================================================================================
   🔊 ייבוא דוח תכנון סאונד (סימולציה + דפי מפרט של היצרן) → הצעת מחיר ותכנית
   דוח טיפוסי (K&F / EASE / ArrayCalc): עמוד תמונה של הסימולציה + דף מפרט לכל מוצר.
   1. דפי מפרט: כותרת הדף (הגופן הגדול) = הדגם; טבלת "תווית | ערך" נקראת לפי עמודת התוויות
      (SPL, הספק, אימפדנס, פיזור, מחבר ופינים, משקל, "רמקולים לערוץ", ערוצים פעילים).
      דף סדרת מגברים עם טבלת דגמים (IX60:8 / IX30:4 …) → ערוצים והספק לכל דגם.
   2. עמודי תמונה (בלי טקסט) = צילומי הסימולציה — נשמרים לפרויקט ולדוח, ו-OCR קורא מהם
      נתוני תלייה (משקל, זווית תחתונה, גובה).
   3. כל מוצר מותאם לפריט ERP (מק"ט/מחיר/מלאי) + אביזרים שבשמם מופיע הדגם (פלייבר, מתקנים).
   4. חישוב הגברה: ערוצים לכל רמקול (ways פעילים) × רמקולים לערוץ (מהיצרן, או לפי עומס
      מינימלי והספק המגבר מטבלת המגברים) → כמות מגברים. שום נתון לא מומצא: מה שחסר מסומן.
   =================================================================================== */
let SR = null;
const SR_LBL = [
  ['design', /^design$/i],
  ['oper', /^operation\s+with/i],
  ['f10', /frequency\s+(response|range).{0,6}(-|±|\+\/-)\s?10|lower\s+cut-?off/i],
  ['f3', /frequency\s+(response|range).{0,6}(-|±|\+\/-)\s?3/i],
  ['freq', /^frequency\s+(response|range)$/i],
  ['cov', /coverage|dispersion/i],
  ['wPeak', /peak\s+power|power\s+handling\s+peak/i],
  ['wProg', /program\s+power|power\s+handling\s+program/i],
  ['wNom', /(nominal|rms|continuous|aes)\s+power|power\s+handling(\s+(nominal|rms|continuous|aes))?$/i],
  ['spl', /max(imum|\.)?\s*spl/i],
  ['ohm', /impedance/i],
  ['perCh', /loudspeakers?\s*(\/|per)\s*channel/i],
  ['comp', /^components$|^drivers?$|^transducers?$/i],
  ['conn', /^connectors?$|^connections?$/i],
  ['encl', /^enclosure$|^cabinet$/i],
  ['dims', /^dimensions/i],
  ['kg', /^(net\s+)?weight/i],
  ['colour', /^colou?r$/i],
  ['acc', /^accessories$/i],
  ['opt', /^options$/i],
];
const SR_HE = { design: 'תכנון', oper: 'מגברים מומלצים', f10: 'תגובת תדר (-10dB)', f3: 'תגובת תדר (±3dB)', freq: 'תגובת תדר', cov: 'פיזור', wNom: 'הספק נומינלי', wProg: 'הספק תוכנית', wPeak: 'הספק שיא', spl: 'SPL מרבי', ohm: 'אימפדנס', perCh: 'רמקולים לערוץ', comp: 'רכיבים', conn: 'מחברים', dims: 'מידות', kg: 'משקל' };
const SR_KIND = { top: '🔊 טופ', sub: '🔉 סאב', amp: '🎚 מגבר' };
const SR_ROLES = ['ראשי', 'פרונט-פיל', 'דיליי', 'מילוי צד', 'מוניטור', 'סאב', 'אחר'];
const srNum = s => { s = String(s || '').trim(); if (/^\d{1,3}([.,]\d{3})+$/.test(s)) return +s.replace(/[.,]/g, ''); return +s.replace(',', '.'); };
/* "2 x 500 Watt" → {n:2, v:500} · "1,600 watts" → {n:1, v:1600} */
function srMult(v, unit) {
  const m = new RegExp('(?:(\\d+)\\s*[x×]\\s*)?(\\d[\\d.,]*)\\s*' + unit, 'i').exec(v || '');
  return m ? { n: m[1] ? +m[1] : 1, v: srNum(m[2]) } : null;
}
async function srPdfjs() {
  if (!window.pdfjsLib) {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  return pdfjsLib;
}
function sndRepPick() {
  let inp = document.getElementById('sndIn');
  if (!inp) { inp = document.createElement('input'); inp.type = 'file'; inp.id = 'sndIn'; inp.accept = '.pdf'; inp.style.display = 'none'; inp.onchange = () => sndRepImport(inp); document.body.appendChild(inp); }
  inp.click();
}
async function sndRepImport(inp) {
  const f = inp.files && inp.files[0]; inp.value = '';
  if (!f) return;
  uiToast('🔊 קורא את דוח הסאונד…');
  try { SR = await srParse(f); srOpen(); srOcr(); }
  catch (e) { alert('קריאת הדוח נכשלה: ' + (e && e.message || e)); }
}
/* ---------- קריאת ה-PDF ---------- */
async function srParse(file) {
  const lib = await srPdfjs();
  const doc = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const pg = await doc.getPage(i), tc = await pg.getTextContent();
    const items = tc.items.filter(it => it.str && it.str.trim()).map(it => ({ x: it.transform[4], y: it.transform[5], s: Math.abs(it.transform[0]) || Math.abs(it.transform[3]), w: it.width || 0, t: it.str.replace(/\s+/g, ' ').trim() }));
    let img = false;
    try { const ops = await pg.getOperatorList(); img = ops.fnArray.some(fn => fn === lib.OPS.paintImageXObject || fn === lib.OPS.paintJpegXObject || fn === lib.OPS.paintInlineImageXObject); } catch (e) {}
    pages.push({ i, pg, items, img, txt: items.map(x => x.t).join(' ') });
  }
  /* עמודי סימולציה — תמונה בלי טקסט */
  const imgs = [];
  for (const p of pages) if (p.img && p.txt.length < 60) { const d = await srRender(p.pg); if (d) imgs.push(d); }
  /* דפי מפרט — מקובצים לפי הכותרת (דף גרפים של אותו מוצר מצטרף לדף הנתונים) */
  const prods = [], byT = {};
  for (const p of pages) {
    if (p.txt.length < 60) continue;
    const title = srTitle(p.items); if (!title) continue;
    const key = srToks(title).join(' ');
    let g = byT[key];
    if (!g) { g = byT[key] = { title, model: srModel(title), brand: /K\s?&\s?F|KLING/i.test(title + p.txt) ? 'K&F' : '', pages: [], specs: {}, lbl: {}, txt: '', models: [] }; prods.push(g); }
    g.pages.push(p.i); g.txt += ' ' + p.txt;
    const sp = srSpecs(p.items);
    if (sp) for (const [k, o] of Object.entries(sp)) if (!g.specs[k]) { g.specs[k] = o.v; g.lbl[k] = o.lbl; }
    g.models.push(...srModelTable(p.items, title));
  }
  prods.forEach(srDerive);
  const out = { file: file.name, prods, imgs, rig: {}, ocr: imgs.length ? 'wait' : 'none', t: Date.now() };
  out.amps = srAmpOptions(out);
  out.ampSel = srAmpDefault(out);
  prods.forEach(g => { if (g.kind !== 'amp') g.amp = out.ampSel; });
  return out;
}
/* רינדור עמוד תמונה → JPEG חתוך מהשוליים השחורים/לבנים */
async function srRender(pg) {
  try {
    const v1 = pg.getViewport({ scale: 1 }), sc = Math.min(3, 1800 / v1.width), vp = pg.getViewport({ scale: sc });
    const cv = document.createElement('canvas'); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
    const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
    await pg.render({ canvasContext: cx, viewport: vp }).promise;
    const d = cx.getImageData(0, 0, cv.width, cv.height).data, W = cv.width, H = cv.height;
    const bgc = [d[0], d[1], d[2]];   /* צבע הפינה = צבע הרקע (שחור בדוח של K&F) */
    const isBg = i => Math.abs(d[i] - bgc[0]) + Math.abs(d[i + 1] - bgc[1]) + Math.abs(d[i + 2] - bgc[2]) < 40;
    let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (!isBg((y * W + x) * 4)) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 <= x0 || y1 <= y0) return null;
    x0 = Math.max(0, x0 - 4); y0 = Math.max(0, y0 - 4); x1 = Math.min(W, x1 + 4); y1 = Math.min(H, y1 + 4);
    const k = Math.min(1, 1600 / (x1 - x0)), out = document.createElement('canvas');
    out.width = Math.round((x1 - x0) * k); out.height = Math.round((y1 - y0) * k);
    out.getContext('2d').drawImage(cv, x0, y0, x1 - x0, y1 - y0, 0, 0, out.width, out.height);
    return out.toDataURL('image/jpeg', 0.8);
  } catch (e) { return null; }
}
/* כותרת הדף — הגופן הגדול ביותר בחלק העליון */
function srTitle(items) {
  const top = items.filter(it => it.s >= 13);
  if (!top.length) return '';
  const mx = Math.max(...top.map(it => it.s));
  const big = top.filter(it => it.s >= mx * 0.75);
  const y0 = Math.max(...big.map(it => it.y));
  const line = items.filter(it => Math.abs(it.y - y0) < mx * 0.6).sort((a, b) => a.x - b.x).map(it => it.t).join(' ');
  return line.replace(/K\s*&\s*F/g, 'K&F').replace(/\s+/g, ' ').trim();
}
function srModel(title) { return title.replace(/\bwith\b.*$/i, '').replace(/K&F|KLING\s*(&|AND)?\s*FREITAG/ig, '').replace(/\s+/g, ' ').trim(); }
const SR_STOP = new Set(['K', 'F', 'KF', 'KLING', 'FREITAG', 'AND', 'WITH', 'VARIQ', 'TECHNOLOGY', 'SERIES', 'THE', 'SUB', 'SUBWOOFER']);
function srToks(s) { return String(s || '').toUpperCase().replace(/&/g, ' ').replace(/(\d)\s+\+/g, '$1+').split(/[^A-Z0-9+:]+/).filter(t => t && !SR_STOP.has(t)); }
/* טבלת "תווית | ערך" — עמודת התוויות = ה-x השכיח של תוויות מוכרות */
function srSpecs(items) {
  const body = items.filter(it => it.s >= 6.5 && it.s < 13);
  const isLbl = t => t.length < 45 && SR_LBL.some(([, re]) => re.test(t));
  const cands = body.filter(it => isLbl(it.t));
  if (cands.length < 3) return null;
  const bx = {}; cands.forEach(it => { const b = Math.round(it.x / 8); bx[b] = (bx[b] || 0) + 1; });
  const lx = +Object.entries(bx).sort((a, b) => b[1] - a[1])[0][0] * 8;
  const col = body.filter(it => it.x >= lx - 10).sort((a, b) => (b.y - a.y) || (a.x - b.x));
  const out = {}; let cur = null;
  for (const it of col) {
    if (it.x < lx + 28) {
      const m = isLbl(it.t) && SR_LBL.find(([, re]) => re.test(it.t));
      if (m) { cur = { k: m[0], lbl: it.t, y: it.y, rows: {} }; if (!out[cur.k]) out[cur.k] = cur; else cur = { k: null, rows: {} }; continue; }
      if (cur && cur.y != null && cur.y - it.y < 14 && /^\(/.test(it.t)) { cur.lbl += ' ' + it.t; continue; }   /* "(H x V)" — המשך התווית */
      cur = null; continue;   /* תווית שאינה ברשימה — הערכים שלה לא נאספים */
    }
    if (!cur || !cur.k) continue;
    const ry = Object.keys(cur.rows).find(y => Math.abs(y - it.y) < 3) || it.y;
    (cur.rows[ry] = cur.rows[ry] || []).push(it);
  }
  const res = {};
  for (const [k, c] of Object.entries(out)) {
    const v = Object.keys(c.rows).sort((a, b) => b - a).map(y => c.rows[y].sort((a, b) => a.x - b.x).map(x => x.t).join(' ')).join(' · ').replace(/\s+/g, ' ').trim();
    if (v) res[k] = { v, lbl: c.lbl };
  }
  return res;
}
/* טבלת דגמים בדף סדרה (IX60:8 | IX60:4 | …) */
function srModelTable(items, title) {
  const fam = (/\b([A-Z]{1,5})\s+Series\b/i.exec(title) || [])[1];
  if (!fam) return [];
  const re = new RegExp('\\b' + fam + '\\s?\\d', 'i');
  const rowsY = {};
  items.forEach(it => { const y = Math.round(it.y); (rowsY[y] = rowsY[y] || []).push(it); });
  const hdrY = Object.keys(rowsY).find(y => rowsY[y].filter(it => re.test(it.t)).length >= 2);
  if (hdrY == null) return [];
  const hdr = rowsY[hdrY].filter(it => re.test(it.t)).sort((a, b) => a.x - b.x);
  const cx = hdr.map(h => h.x + h.w / 2), firstX = hdr[0].x;
  const models = hdr.map(h => ({ name: h.t.replace(/K\s*&\s*F\s*/i, 'K&F '), rows: {} }));
  Object.keys(rowsY).map(Number).filter(y => y < +hdrY && y > +hdrY - 200).sort((a, b) => b - a).forEach(y => {
    const r = rowsY[y], lbl = r.filter(it => it.x < firstX - 5).map(it => it.t).join(' ');
    if (!lbl) return;
    r.filter(it => it.x >= firstX - 5).forEach(it => { const c = it.x + it.w / 2; let bi = 0; cx.forEach((v, i) => { if (Math.abs(v - c) < Math.abs(cx[bi] - c)) bi = i; }); models[bi].rows[lbl] = ((models[bi].rows[lbl] || '') + ' ' + it.t).trim(); });
  });
  return models.map(m => {
    const o = { name: m.name, rows: m.rows, pw: {} };
    for (const [l, v] of Object.entries(m.rows)) {
      if (/amp\s+channels|^channels/i.test(l)) o.ch = parseInt(v, 10) || undefined;
      const om = /power\s+all\s+channels\s+(\d+(?:[.,]\d)?)\s*Ω/i.exec(l);
      if (om) { const w = srMult(v, 'W\\b'); if (w) o.pw[srNum(om[1])] = w.v; }
      if (/total\s+power/i.test(l)) { const w = srMult(v, 'W\\b'); if (w) o.total = w.v; }
      if (/single\s+channel/i.test(l)) { const w = srMult(v, 'W\\b'); if (w) o.single = w.v; }
    }
    return o;
  });
}
/* ערכים מספריים וסיווג */
function srDerive(g) {
  const s = g.specs, all = (g.title + ' ' + g.txt);
  g.kind = (/amplifier|amp\s+channels|\bDSP\b.*\bamp/i.test(all) && !s.spl) || /\b(IPX|IX|PLM|IPD|D)\s+Series\b/i.test(g.title) ? 'amp'
    : /sub\s?-?woofer|\bSUB\b/i.test(g.title + ' ' + (s.design || '') + ' ' + all.slice(0, 600)) || (/lower\s+cut/i.test(g.lbl.f10 || '') && !/\d+\s*°?\s*[x×]\s*\d+/.test(s.cov || '')) ? 'sub' : 'top';
  const spl = /(\d{2,3}(?:[.,]\d)?)\s*dB/i.exec(s.spl || ''); if (spl) g.spl = srNum(spl[1]);
  const w = srMult(s.wNom, '(?:W\\b|watts?)'); if (w) { g.w = w.v; g.wN = w.n; }
  const o = srMult(s.ohm, '(?:Ω|ohms?)'); if (o) { g.o = o.v; g.oN = o.n; }
  const cv = /(\d+)\s*°?\s*[x×]\s*\+?(\d+)\s*°/.exec(s.cov || ''); if (cv) { g.h = +cv[1]; g.v = +cv[2]; }
  const kg = /(\d+(?:[.,]\d+)?)\s*kg/i.exec(s.kg || ''); if (kg) g.kg = srNum(kg[1]);
  const pr = /(\d+)\s*recommended/i.exec(s.perCh || ''); if (pr) g.perRec = +pr[1];
  const px = /max\.?\s*(\d+)/i.exec(s.perCh || ''); if (px) g.perMax = +px[1];
  if (!g.perRec && /^\s*(\d+)\s*$/.test(s.perCh || '')) g.perRec = +s.perCh.trim();
  /* ערוצי הגברה לרמקול: "2-way active" / "with two amp channels" */
  const NW = { one: 1, two: 2, three: 3, four: 4 };
  const aw = /(\d)\s*-?\s*way\s+active/i.exec(s.design || '') || /with\s+(\d|one|two|three|four)\s+amp(?:lifier)?\s+channels/i.exec(g.txt);
  g.act = aw ? (NW[String(aw[1]).toLowerCase()] || +aw[1]) : 1;
  /* פינים ב-NL4: "(1+/1- LF + HF // 2+/2- MF)" */
  const pins = []; const pre = /([1-4])\s*\+\s*\/\s*[1-4]\s*-\s*([A-Z][A-Za-z +&]*?)(?=\s*\/\/|\s*\)|$)/g; let m;
  while ((m = pre.exec(s.conn || ''))) pins.push({ pin: +m[1], band: m[2].trim() });
  if (pins.length && pins.some(p => p.band)) g.pins = pins;
  g.nl = /NL\s?8/i.test(s.conn || '') ? 'NL8' : /NL\s?4|speakON/i.test(s.conn || '') ? 'NL4' : '';
  const ru = /\b(\d)\s?U\b/.exec(g.txt); if (g.kind === 'amp' && ru) g.ru = +ru[1];
  g.role = g.kind === 'sub' ? 'סאב' : g.kind === 'top' ? (/line\s?array|line\s?source/i.test(all) ? 'ראשי' : '') : '';
  g.qty = ''; g.on = g.kind !== 'amp';
  g.cands = g.kind === 'amp' ? [] : srErpCands(g.model);
  g.erp = g.cands.findIndex(c => !c.acc);
  if (g.erp < 0) g.erp = null;
  g.accs = g.cands.filter(c => c.acc).slice(0, 8).map(c => ({ ...c, on: false, qty: '' }));
}
/* התאמת פריט ERP לפי טוקני הדגם (מותג מוסר); אביזרים = שם עם מילת אביזר */
function srErpCands(model) {
  const tk = srToks(model); if (!tk.length) return [];
  const alpha = tk.filter(t => /[A-Z]/.test(t));
  const out = [];
  for (const [k, n] of (typeof ERP_ITEMS !== 'undefined' ? ERP_ITEMS : [])) {
    if (!n || /השכר|ת\.ח|לתיקון|פגום|דוגמא|חלקי חילוף/.test(n)) continue;
    const nt = new Set(srToks(n)), nb = new Set([...nt].map(t => t.replace(/\+$/, '')));
    if (alpha.length && !alpha.some(t => nt.has(t))) continue;
    const acc = isAccessory(n) || /כיסוי|cover|flybar|פלייבר|מתאם|adapter|connector set|מחבר (עגינה|תליה)|בסיס|קייס|case|grill/i.test(n);
    const hit = tk.filter(t => nt.has(t)).length;
    if (acc) {   /* אביזר: משפחת הדגם + המספר הראשון ("מתקן ל-GRAVIS 12" מתאים ל-GRAVIS 12+ XW); בלי מספר — כל מילות הדגם */
      const num = tk.find(t => /^\d/.test(t));
      if (!nt.has(alpha[0]) || (num ? !nb.has(num.replace(/\+$/, '')) : !alpha.every(t => nt.has(t)))) continue;
    } else if (hit < Math.max(1, tk.length - 1)) continue;
    out.push({ k, n, score: hit / tk.length, acc });
  }
  return out.sort((a, b) => (b.score - a.score) || byStockThenSold(a.k, b.k)).slice(0, 14);
}
/* אפשרויות מגבר: דגמי טבלת הסדרה מהדוח + מגברי ERP מאותן משפחות (IPX/IX/PLM/IPD/D) */
function srAmpOptions(rep) {
  const fams = new Set(), famA = new Set();
  rep.prods.filter(g => g.kind === 'amp').forEach(g => (g.title.match(/\b(IPX|IX|PLM|IPD|D\s?Series|DPA)/gi) || []).forEach(f => famA.add(f.toUpperCase().replace(/\s+/g, '').replace('SERIES', ''))));
  rep.prods.forEach(g => {
    const src = g.kind === 'amp' ? g.title : (g.specs.oper || '');
    (src.match(/\b(IPX|IX|PLM|IPD|D\s?Series|DPA|DS\s?\d{3})/gi) || []).forEach(f => fams.add(f.toUpperCase().replace(/\s+/g, '').replace('SERIES', '')));
  });
  const opts = [], seen = {};
  const push = o => { const nk = srToks(o.name).filter(t => /\d/.test(t)).join(' ') || o.name.toUpperCase(); if (seen[nk]) { Object.assign(seen[nk], { ...o, ...seen[nk], key: seen[nk].key || o.key, ch: seen[nk].ch || o.ch }); return; } seen[nk] = o; opts.push(o); };
  rep.prods.filter(g => g.kind === 'amp').forEach(g => g.models.forEach(m => {
    m.fam = true;
    const c = srErpCands(m.name).find(x => !x.acc && /מגבר|amp/i.test(x.n));
    push({ name: m.name, ch: m.ch, pw: Object.keys(m.pw).length ? m.pw : null, mo: Object.keys(m.pw).length ? Math.min(...Object.keys(m.pw).map(Number)) : null, key: c ? c.k : undefined, erpName: c ? c.n : '', src: 'דוח', ru: g.ru, fam: true }); }));
  if (fams.size && typeof ERP_ITEMS !== 'undefined') {
    const re = new RegExp('\\b(' + [...fams].map(f => f === 'D' ? 'D\\s?\\d{2}' : f + '\\s?\\d').join('|') + ')', 'i');
    const famRe = famA.size ? new RegExp('\\b(' + [...famA].map(f => f === 'D' ? 'D\\s?\\d{2}' : f + '\\s?\\d').join('|') + ')', 'i') : null;
    const kf = rep.prods.some(g => g.brand === 'K&F');
    ERP_ITEMS.filter(([, n]) => n && /מגבר/.test(n) && !/כרטיס|card/i.test(n) && re.test(n) && (!kf || /K\s?&\s?F|KLING|LAB\.?\s?GRUPPEN|\bLAB\b/i.test(n)) && !/השכר|ת\.ח|לתיקון|פגום|דוגמא|חלקי חילוף/.test(n))
      .sort((a, b) => ((famRe && famRe.test(b[1]) ? 1 : 0) - (famRe && famRe.test(a[1]) ? 1 : 0)) || byStockThenSold(a[0], b[0])).slice(0, 24).forEach(([k, n]) => {
      const rec = typeof ampRec === 'function' ? ampRec(n) : null;
      const mdl = (/\b(IPX\s?\d+(?::\d+)?|IX\s?\d+:\d|PLM\s?\+?\s?\d+|IPD\s?\d+|D\s?\d{2}:\d)/i.exec(n) || [])[1];
      push({ name: mdl ? 'K&F ' + mdl.toUpperCase().replace(/\s+/g, ' ') : n.slice(0, 40), ch: ampChCount(n), pw: rec && rec.pw || null, mo: rec && rec.mo || null, key: k, erpName: n, src: 'ERP', fam: !!(famRe && famRe.test(n)) });
    });
  }
  return opts;
}
/* ברירת מחדל: מגבר במלאי/נמכר עם הכי הרבה ערוצים ונתוני הספק */
function srAmpDefault(rep) {
  if (!rep.amps.length) return null;
  const spk = rep.prods.filter(g => g.kind !== 'amp' && g.o && g.w);
  const fits = o => spk.filter(g => { const aw = srAmpW(o, g.o); return aw && aw >= g.w; }).length;
  const sc = o => fits(o) * 1000 + (o.fam ? 300 : 0) + (o.pw ? 100 : 0) + (o.key ? 50 : 0) + (o.ch || 0) * 5 - (o.key ? 0 : 0);
  return rep.amps.map((o, i) => [i, sc(o)]).sort((a, b) => b[1] - a[1])[0][0];
}
function srAmpMo(a) { return (a && (a.mo || (a.pw && Math.min(...Object.keys(a.pw).map(Number))))) || null; }
/* הספק לערוץ בעומס נתון — הערך מהטבלה באימפדנס הקרוב שאינו נמוך מהעומס */
function srAmpW(a, z) {
  if (!a || !a.pw || !z) return null;
  const ks = Object.keys(a.pw).map(Number).sort((x, y) => x - y);
  const ge = ks.filter(k => k <= z + 0.05);
  return ge.length ? a.pw[ge[ge.length - 1]] : null;
}
function srCalc(g) {
  const a = g.amp != null ? SR.amps[g.amp] : null, ways = g.act || 1, Z = g.o, W = g.w;
  let per, why;
  if (+g.perUser > 0) { per = +g.perUser; why = 'ידני'; }
  else if (g.perRec) { per = g.perRec; why = 'המלצת היצרן'; }
  else if (Z && a && srAmpMo(a)) {
    const mo = srAmpMo(a); per = 1;
    for (let n = 2; n <= 8; n++) { if (Z / n < mo - 0.05) break; const aw = srAmpW(a, Z / n); if (W && aw && aw < n * W) break; if (W && !aw) break; per = n; }
    why = `עומס מינימלי ${mo}Ω${W && a.pw ? ' והספק' : ''}`;
  } else { per = 1; why = Z ? 'אין נתוני מגבר — 1 לערוץ' : 'אין אימפדנס בדוח — 1 לערוץ'; }
  if (g.perMax && per > g.perMax) per = g.perMax;
  const q = +g.qty || 0, chans = q ? ways * Math.ceil(q / per) : 0;
  const on = Math.min(per, q || per), load = Z ? Z / on : null, aw = a && load ? srAmpW(a, load) : null, need = W ? on * W : null;
  return { per, why, chans, load, aw, need, ways, amp: a };
}
function srAmpTotals() {
  const tot = {};
  SR.prods.filter(g => g.kind !== 'amp' && g.on && +g.qty > 0 && g.amp != null).forEach(g => { const c = srCalc(g); tot[g.amp] = (tot[g.amp] || 0) + c.chans; });
  return Object.entries(tot).map(([i, ch]) => { const a = SR.amps[i]; const per = a.ch || 2; return { i: +i, a, ch, n: Math.ceil(ch / per), spare: Math.ceil(ch / per) * per - ch }; });
}
/* ---------- השוואה לטבלת הרמקולים ---------- */
function srDbDiff(g, name) {
  const d = typeof spkData === 'function' ? spkData(name) : null;
  if (!d) return { d: null, diffs: [] };
  const diffs = [];
  const cmp = (lbl, a, b, unit) => { if (a != null && b != null && Math.abs(+a - +b) > 0.6) diffs.push(`${lbl}: טבלה ${b}${unit} · דוח ${a}${unit}`); };
  const row = d.re && typeof prettyRe === 'function' ? prettyRe(d.re) : (d.src ? 'ספרייה' : '');
  cmp('SPL', g.spl, d.max, ' dB'); cmp('הספק', g.w, d.w, 'W'); cmp('אימפדנס', g.o, d.o, 'Ω');
  if (g.h != null && d.h != null && (g.h !== d.h || g.v !== d.v)) diffs.push(`פיזור: טבלה ${d.h}°×${d.v}° · דוח ${g.h}°×${g.v}°`);
  const dk = d.kg ? parseFloat(String(d.kg).replace(',', '.')) : null; cmp('משקל', g.kg, dk, ' ק״ג');
  return { d, diffs, row };
}
function srSaveDb(i) {
  const g = SR.prods[i], c = g.erp != null ? g.cands[g.erp] : null, names = [c && c.n, g.model].filter(Boolean);
  const d = spkData(names[0]) || {};
  store.spkLib = store.spkLib || {};
  const rec = { ...d, re: null, ok: 1, src: 'דוח סאונד · ' + SR.file };
  if (g.h != null) { rec.h = g.h; rec.v = g.v; }
  if (g.spl != null) rec.max = g.spl; if (g.w != null) rec.w = g.w; if (g.o != null) rec.o = g.o;
  if (g.kg != null) rec.kg = g.kg + ' kg'; if (g.specs.dims) rec.dims = g.specs.dims; if (g.specs.f10) rec.f = g.specs.f10;
  names.forEach(n => { store.spkLib[rearKey(n)] = rec; });
  save(); srPaint(); uiToast('💾 נתוני ' + g.model + ' מהדוח נשמרו בטבלת הרמקולים');
}
/* ---------- OCR של צילום הסימולציה: נתוני תלייה ---------- */
async function srOcr() {
  if (!SR || !SR.imgs.length) return;
  const rep = SR;
  rep.ocr = 'run'; srPaint();
  try {
    if (!window.Tesseract) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.0.5/tesseract.min.js');
    let txt = '';
    /* פי 2 — כיתובי חלון התלייה בצילום מסך קטנים מדי ל-OCR בגודל המקורי */
    for (const im of rep.imgs) {
      txt += '\n' + (await Tesseract.recognize(im, 'eng')).data.text;
      for (const tile of await srTiles(im, 3, 3, 2)) txt += '\n' + (await Tesseract.recognize(tile, 'eng')).data.text;
    }
    const r = rep.rig, f = re => { const m = re.exec(txt); return m ? srNum(m[1]) : null; }, t = re => { const m = re.exec(txt); return m ? m[1].trim() : ''; };
    r.kg = f(/Weight\s*:?\s*([\d]+[.,]\d+|\d+)\s*kg/i);
    r.ang = f(/Bottom\s*Angle\s*:?\s*(-?[\d]+[.,]?\d*)/i);
    { const m = /(\d+)\s*[.,:]\s*(\d+)\s*m\s*above\s*ground/i.exec(txt); r.hgt = m ? +(m[1] + '.' + m[2]) : null; }
    r.title = t(/Project\s*Title\s*:\s*(.+)/i); r.date = t(/\bDate\s*:\s*([\d\\\/.\-]+)/i); r.author = t(/Author\s*:\s*(.+)/i);
    r.models = [...new Set((txt.match(/\b(Spectra\s*\d{3}\w*|Gravis\s*\d+\+?|CA\s*1\d{2}|Nomos\s*\w+|Sequenza\s*\d+\w*)/gi) || []).map(s => s.replace(/\s+/g, ' ')))];
    r.txt = txt.slice(0, 4000);
    rep.ocr = 'done';
  } catch (e) { rep.ocr = 'fail'; }
  if (SR === rep) srPaint();
}
/* חלוקה לאריחים חופפים ×k — כיתובי חלון התלייה בצילום המסך קטנים מדי ל-OCR בגודל המקורי */
function srTiles(src, cols, rows, k) {
  return new Promise(res => { const im = new Image(); im.onload = () => {
    const out = [], tw = im.width / cols, th = im.height / rows, ov = 0.15;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x0 = Math.max(0, (c - ov) * tw), y0 = Math.max(0, (r - ov) * th), w = Math.min(im.width - x0, tw * (1 + 2 * ov)), h = Math.min(im.height - y0, th * (1 + 2 * ov));
      const cv = document.createElement('canvas'); cv.width = w * k; cv.height = h * k; const g = cv.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(im, x0, y0, w, h, 0, 0, cv.width, cv.height); out.push(cv);
    }
    res(out); }; im.onerror = () => res([]); im.src = src; });
}
/* ---------- חלון הייבוא ---------- */
function srOpen() {
  document.getElementById('srOv')?.remove();
  const ov = document.createElement('div');
  ov.id = 'srOv';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(20,24,32,.55);z-index:150;display:flex;align-items:flex-start;justify-content:center;padding:14px;overflow:auto;direction:rtl';
  ov.innerHTML = '<div id="srBox" style="background:#fff;border-radius:14px;box-shadow:0 12px 44px rgba(0,0,0,.4);width:min(1180px,97vw);padding:14px 16px;font-size:12.5px"></div>';
  document.body.appendChild(ov);
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  srPaint();
}
function srSet(i, f, v) { const g = SR.prods[i]; if (!g) return; g[f] = (f === 'amp' || f === 'erp') ? (v === '' ? null : +v) : v; srPaint(); }
function srAccSet(i, j, f, v) { const a = SR.prods[i].accs[j]; a[f] = v; if (f === 'on' && v && !+a.qty) a.qty = SR.prods[i].qty || 1; srPaint(); }
function srAmpAll(v) { SR.ampSel = v === '' ? null : +v; SR.prods.forEach(g => { if (g.kind !== 'amp') g.amp = SR.ampSel; }); srPaint(); }
function srImgView(k) {
  const im = (SR && SR.imgs[k]) || (P.sndImg || [])[k]; if (!im) return;
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:160;display:flex;align-items:center;justify-content:center;cursor:zoom-out';
  ov.innerHTML = `<img src="${im}" style="max-width:98vw;max-height:96vh;border-radius:6px">`;
  ov.onclick = () => ov.remove(); document.body.appendChild(ov);
}
function srPaint() {
  const box = document.getElementById('srBox'); if (!box || !SR) return;
  const spk = SR.prods.map((g, i) => [g, i]).filter(([g]) => g.kind !== 'amp'), amps = SR.prods.filter(g => g.kind === 'amp');
  const ampOpt = sel => `<option value="">— ללא —</option>` + SR.amps.map((a, i) => `<option value="${i}" ${sel === i ? 'selected' : ''}>${esc(a.name)} · ${a.ch || '?'}ch${a.key ? '' : ' (אין מק״ט)'}</option>`).join('');
  const r = SR.rig;
  const ocrTxt = { wait: '⏳ ממתין ל-OCR…', run: '🔎 קורא נתוני תלייה מהסימולציה (OCR)…', fail: '⚠ OCR נכשל — אפשר להזין ידנית', none: '', done: '' }[SR.ocr] || '';
  const rigHtml = SR.ocr === 'done' ? ([r.title ? `פרויקט בדוח: <b>${esc(r.title)}</b>${r.date ? ' · ' + esc(r.date) : ''}${r.author ? ' · ' + esc(r.author) : ''}` : '', r.kg != null ? `משקל תלייה <b>${r.kg} ק״ג</b>` : '', r.ang != null ? `זווית תחתונה <b>${r.ang}°</b>` : '', r.hgt != null ? `גובה <b>${r.hgt} מ׳</b> מהרצפה` : '', r.models && r.models.length ? 'דגמים בסימולציה: <b>' + esc(r.models.join(', ')) + '</b>' : ''].filter(Boolean).join(' · ') || 'לא זוהו נתוני תלייה בתמונה') : ocrTxt;
  const rows = spk.map(([g, i]) => {
    const c = srCalc(g), cand = g.erp != null ? g.cands[g.erp] : null, df = srDbDiff(g, cand ? cand.n : g.model);
    const specLine = [g.spl != null ? g.spl + ' dB' : '', g.w != null ? (g.wN > 1 ? g.wN + '×' : '') + g.w + 'W' : '', g.o != null ? (g.oN > 1 ? g.oN + '×' : '') + g.o + 'Ω' : '', g.h != null ? g.h + '°×' + g.v + '°' : '', g.kg != null ? g.kg + ' ק״ג' : '', g.nl, g.pins ? 'פינים: ' + g.pins.map(p => p.pin + '± ' + p.band).join(' / ') : ''].filter(Boolean).join(' · ');
    const pwOk = c.aw != null && c.need != null ? (c.aw >= c.need ? `<span style="color:#0f6e56">✓ ${c.aw}W ≥ ${c.need}W</span>` : `<span style="color:#c1121f">⚠ ${c.aw}W &lt; ${c.need}W</span>`) : (c.amp && c.load ? '<span class="muted">אין נתון הספק</span>' : '');
    const dbChip = !df.d ? `<span style="color:#8a6a00" title="הדגם לא נמצא בטבלת הרמקולים">➕ חסר בטבלה</span> <button style="padding:0 6px;font-size:10.5px" onclick="srSaveDb(${i})">💾 הוסף מהדוח</button>`
      : df.diffs.length ? `<span style="color:#c1121f" title="${esc(df.diffs.join('\n'))}">⚠ ${df.diffs.length} הבדלים מהטבלה</span>${df.row ? ` <span class="muted" style="font-size:10px">(שורה: ${esc(df.row)})</span>` : ''} <button style="padding:0 6px;font-size:10.5px" title="${esc(df.diffs.join('\n'))}" onclick="srSaveDb(${i})">💾 עדכן לפי הדוח</button><div style="font-size:10.5px;color:#a33">${df.diffs.map(esc).join('<br>')}</div>`
      : '<span style="color:#0f6e56">✓ תואם לטבלת הרמקולים</span>';
    return `<tr style="${g.on ? '' : 'opacity:.45'}">
      <td><input type="checkbox" ${g.on ? 'checked' : ''} onchange="srSet(${i},'on',this.checked)"></td>
      <td style="min-width:210px"><b style="font-size:13.5px">${esc(g.model)}</b> <span style="font-size:10.5px;background:#eef3f8;border-radius:6px;padding:0 5px">${SR_KIND[g.kind]}</span> <span class="muted" style="font-size:10px">עמ׳ ${g.pages.join(',')}</span>
        <div dir="ltr" style="font-size:11px;color:#333;margin-top:2px;text-align:right">${esc(specLine) || '<span class="muted">לא נמצאה טבלת נתונים</span>'}</div>
        <div style="font-size:11px;margin-top:2px">${dbChip}</div></td>
      <td><select style="font-size:11px" onchange="srSet(${i},'role',this.value)"><option value="">—</option>${SR_ROLES.map(x => `<option ${g.role === x ? 'selected' : ''}>${x}</option>`).join('')}</select></td>
      <td><input type="number" min="0" value="${esc(g.qty)}" placeholder="?" style="width:52px;font-weight:700;${+g.qty > 0 ? '' : 'border:2px solid #c96f4a'}" title="כמות לפי הסימולציה" onchange="srSet(${i},'qty',this.value)"></td>
      <td style="min-width:230px">${cand ? imgCell(cand.k, 30, cand.n) : ''}<select style="font-size:11px;max-width:230px;${cand ? '' : 'border-color:#c1121f'}" onchange="srSet(${i},'erp',this.value)"><option value="">— ללא מק״ט (שם מהדוח) —</option>${g.cands.map((x, j) => x.acc ? '' : `<option value="${j}" ${g.erp === j ? 'selected' : ''}>${esc(x.k)} · ${esc(x.n.slice(0, 52))}</option>`).join('')}</select>
        ${cand ? `<div style="font-size:10.5px">${stockTag(cand.k)} ${erpInfo(cand.k) && erpInfo(cand.k).price ? '· ₪' + erpInfo(cand.k).price.toLocaleString() : ''}</div>` : ''}
        ${g.accs.length ? `<details style="margin-top:3px"><summary style="font-size:11px;cursor:pointer">🔩 אביזרים (${g.accs.filter(a => a.on).length}/${g.accs.length})</summary>${g.accs.map((a, j) => `<label style="display:flex;gap:4px;align-items:center;font-size:10.5px;margin:2px 0"><input type="checkbox" ${a.on ? 'checked' : ''} onchange="srAccSet(${i},${j},'on',this.checked)"><input type="number" min="0" value="${esc(a.qty)}" style="width:38px;font-size:10.5px" onchange="srAccSet(${i},${j},'qty',this.value)"><span style="flex:1">${esc(a.n.slice(0, 60))}</span>${stockTag(a.k)}</label>`).join('')}</details>` : ''}</td>
      <td style="font-size:11px;min-width:190px"><select style="font-size:11px;max-width:180px" onchange="srSet(${i},'amp',this.value)">${ampOpt(g.amp)}</select>
        <div>${c.ways > 1 ? `<b>${c.ways} ערוצים לרמקול</b> <span class="muted">(${esc((/\d\s*-?\s*way\s+active|\w+\s+amp\s+channels/i.exec(g.specs.design + ' ' + g.txt) || [''])[0])})</span> · ` : ''}עד <input type="number" min="1" max="16" value="${esc(g.perUser || '')}" placeholder="${c.per}" style="width:36px;font-size:11px" title="רמקולים לערוץ — ריק = ${esc(c.why)}" onchange="srSet(${i},'perUser',this.value)"> לערוץ <span class="muted">(${esc(c.why)})</span></div>
        <div>${c.chans ? `<b>${c.chans} ערוצים</b>` : ''}${c.load ? ` · עומס ${Math.round(c.load * 10) / 10}Ω` : ''} ${pwOk}</div></td>
    </tr>`;
  }).join('');
  const tots = srAmpTotals();
  const ampRows = tots.map(t => `<tr><td><b>${esc(t.a.name)}</b>${t.a.erpName ? `<div class="muted" style="font-size:10.5px">${esc(t.a.key)} · ${esc(t.a.erpName.slice(0, 60))}</div>` : '<div style="font-size:10.5px;color:#c1121f">אין מק״ט ב-ERP — ייכנס בשם בלבד</div>'}</td><td>${t.ch} ערוצים</td><td>${t.a.ch || '?'} לכל מגבר</td><td style="font-size:15px"><b>× ${t.n}</b></td><td class="muted">${t.spare ? t.spare + ' ערוצים פנויים' : 'ניצול מלא'}</td><td>${t.a.key ? stockTag(t.a.key) : ''}</td></tr>`).join('');
  const seriesHtml = amps.map(g => `<div style="margin-top:4px"><b>${esc(g.title)}</b>${g.models.length ? ': ' + g.models.map(m => `${esc(m.name)} (${m.ch || '?'}ch${m.pw && Object.keys(m.pw).length ? ' · ' + Object.entries(m.pw).map(([o, w]) => w + 'W@' + o + 'Ω').join(' / ') : ''})`).join(' · ') : ' <span class="muted">— דף סדרה בלי טבלת דגמים; הדגמים נלקחים מה-ERP</span>'}</div>`).join('');
  const nAdd = spk.filter(([g]) => g.on && +g.qty > 0).length;
  box.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><b style="font-size:16px;flex:1">🔊 ייבוא דוח תכנון סאונד — ${esc(SR.file)}</b><button onclick="document.getElementById('srOv').remove()">✕</button></div>
    ${SR.imgs.length ? `<div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:8px;background:#f6f7f9;border-radius:10px;padding:8px">
      ${SR.imgs.map((im, k) => `<img src="${im}" onclick="srImgView(${k})" title="הגדל" style="height:230px;max-width:60%;object-fit:contain;border-radius:6px;cursor:zoom-in;border:1px solid #ddd;background:#000">`).join('')}
      <div style="flex:1;font-size:12px;line-height:1.6"><b>צילום הסימולציה</b> — נשמר בפרויקט ובדוח. ספור בו את הרמקולים והזן כמויות בטבלה.<br>${rigHtml}</div></div>` : '<p class="muted">לא נמצאו עמודי סימולציה (תמונה) בקובץ.</p>'}
    <table class="cablelist" style="width:100%;font-size:12px"><tr><th></th><th>מוצר מהדוח</th><th>תפקיד</th><th>כמות</th><th>פריט בקטלוג (ERP)</th><th>הגברה</th></tr>${rows || '<tr><td colspan="6" class="muted">לא זוהו רמקולים בדוח</td></tr>'}</table>
    <div style="margin-top:10px;background:#f4f7fb;border-radius:10px;padding:8px 10px">
      <div style="display:flex;gap:8px;align-items:center"><b style="flex:1">🎚 תכנון מגברים</b><span style="font-size:11.5px">מגבר לכל הרמקולים:</span><select style="font-size:11.5px" onchange="srAmpAll(this.value)">${ampOpt(SR.ampSel)}</select></div>
      ${seriesHtml}
      ${ampRows ? `<table class="cablelist" style="width:100%;margin-top:6px">${ampRows}</table>` : '<p class="muted" style="margin:6px 0 0">הזן כמויות כדי לחשב מגברים.</p>'}
    </div>
    <div style="display:flex;gap:8px;margin-top:12px;align-items:center">
      <button class="primary" style="flex:1;font-size:14px;font-weight:800;padding:10px" onclick="srApply()" ${nAdd ? '' : 'disabled'}>➕ הוסף להצעת המחיר ולהצבה בתכנית (${nAdd} מוצרים${tots.length ? ' + ' + tots.reduce((s, t) => s + t.n, 0) + ' מגברים' : ''})</button>
      <button onclick="srApply(true)" title="שומר רק את צילום הסימולציה והנתונים לפרויקט ולדוח — בלי לשנות את ההצעה">💾 שמור לדוח בלבד</button>
    </div>
    <p class="muted" style="font-size:11px;margin:6px 0 0">הנתונים נקראו מדפי היצרן שבקובץ. מה שלא הופיע בדוח לא הומצא: שדה ריק, "?" או הסבר בסוגריים. אחרי ההוספה הפריטים מופיעים בהצעה (🧾) ומוכנים לנעיצה על התכנית (📌), ומשם לחיווט האוטומטי.</p>`;
}
/* ---------- החלה: הצעה + שמירת הדוח לפרויקט ---------- */
function srApply(onlySave) {
  if (!SR) return;
  const src = 'דוח סאונד · ' + SR.file.slice(0, 40);
  let nNew = 0, nUpd = 0;
  if (!onlySave) {
    const put = (name, key, qty, extra) => {
      let it = key && impItems.find(x => x.key === key && x.dest === extra.dest);
      if (it) { if ((+it.qty || 0) < qty) { it.qty = qty; nUpd++; } return it; }
      it = { on: true, qty, name: String(name).slice(0, 70), key: key || undefined, src, cat: 'other', u: 1, iid: uid('i'), ...extra };
      autoPrice(it); impItems.push(it); nNew++; return it;
    };
    SR.prods.filter(g => g.kind !== 'amp' && g.on && +g.qty > 0).forEach(g => {
      const c = g.erp != null ? g.cands[g.erp] : null;
      const rg = SR.rig, inSim = (rg.models || []).some(m => srToks(g.model).slice(0, 2).every(t => srToks(m).includes(t)));
      const note = [g.role, inSim && rg.hgt != null ? 'גובה ' + rg.hgt + ' מ׳' : '', inSim && rg.ang != null ? 'זווית ' + rg.ang + '°' : ''].filter(Boolean).join(' · ');
      const it = put(c ? c.n : 'K&F ' + g.model, c && c.k, +g.qty, { dest: 'point', note });
      g.accs.filter(a => a.on && +a.qty > 0).forEach(a => put(a.n, a.k, +a.qty, { dest: 'acc', parentIid: it.iid }));
    });
    srAmpTotals().forEach(t => {
      const it = put(t.a.erpName || t.a.name, t.a.key, t.n, { dest: 'unit', cat: 'amp', u: t.a.ru || 2, note: t.ch + ' ערוצים לפי דוח הסאונד' });
      if (!it.rack) it.rack = guessRackFor(it);
    });
  }
  P.sndRep = {
    file: SR.file, t: SR.t, rig: { kg: SR.rig.kg, ang: SR.rig.ang, hgt: SR.rig.hgt, models: SR.rig.models, title: SR.rig.title, date: SR.rig.date, author: SR.rig.author },
    prods: SR.prods.map(g => { const c = g.kind !== 'amp' ? srCalc(g) : null, e = g.erp != null ? g.cands[g.erp] : null;
      return { model: g.model, title: g.title, kind: g.kind, role: g.role, qty: +g.qty || 0, key: e ? e.k : null, erpName: e ? e.n : '', specs: g.specs, spl: g.spl, w: g.w, wN: g.wN, o: g.o, oN: g.oN, h: g.h, v: g.v, kg: g.kg, act: g.act, pins: g.pins, nl: g.nl, models: g.models,
        calc: c ? { per: c.per, why: c.why, chans: c.chans, load: c.load, aw: c.aw, need: c.need, amp: c.amp ? c.amp.name : '' } : null }; }),
    amps: srAmpTotals().map(t => ({ name: t.a.name, key: t.a.key, ch: t.ch, per: t.a.ch, n: t.n })),
  };
  if (SR.imgs.length) P.sndImg = SR.imgs;
  save(); render();
  document.getElementById('srOv')?.remove();
  if (!onlySave) { renderImp(); uiToast(`🔊 מהדוח: ${nNew} שורות חדשות בהצעה${nUpd ? ', ' + nUpd + ' עודכנו' : ''} — נעץ את הרמקולים בתכנית (📌)`); }
  else uiToast('💾 דוח הסאונד נשמר לפרויקט — מופיע בדוח הפרויקט');
}
/* פרק בדוח הפרויקט */
function sndRepReportHTML() {
  const R = P.sndRep; if (!R) return '';
  const imgs = P.sndImg || [];
  const spk = R.prods.filter(g => g.kind !== 'amp');
  const r = R.rig || {};
  return `<div class="rp-sec"><h3>🔊 תכנון סאונד — סימולציה ונתוני יצרן</h3>
    <p style="font-size:12px;color:#555;margin:0 0 8px">מקור: ${esc(R.file)}${r.title ? ' · ' + esc(r.title) : ''}${r.date ? ' · ' + esc(r.date) : ''}${r.author ? ' · ' + esc(r.author) : ''}${r.kg != null ? ' · משקל תלייה ' + r.kg + ' ק״ג' : ''}${r.ang != null ? ' · זווית תחתונה ' + r.ang + '°' : ''}${r.hgt != null ? ' · גובה ' + r.hgt + ' מ׳' : ''}</p>
    ${imgs.map(im => `<img src="${im}" style="width:100%;max-width:980px;border-radius:6px;margin-bottom:8px">`).join('')}
    <table class="cablelist"><tr><th>מוצר</th><th>תפקיד</th><th>כמות</th><th>SPL</th><th>הספק</th><th>אימפדנס</th><th>פיזור</th><th>משקל</th><th>מחבר</th><th>הגברה</th></tr>
    ${spk.map(g => `<tr><td><b>${esc(g.model)}</b>${g.key ? `<div style="font-size:10px;color:#777">${esc(g.key)}</div>` : ''}</td><td>${esc(g.role || '—')}</td><td>${g.qty || '—'}</td><td dir="ltr" style="text-align:right">${g.spl ?? '—'}${g.spl != null ? ' dB' : ''}</td><td dir="ltr" style="text-align:right">${g.w != null ? (g.wN > 1 ? g.wN + '×' : '') + g.w + 'W' : '—'}</td><td dir="ltr" style="text-align:right">${g.o != null ? (g.oN > 1 ? g.oN + '×' : '') + g.o + 'Ω' : '—'}</td><td dir="ltr" style="text-align:right">${g.h != null ? g.h + '°×' + g.v + '°' : '—'}</td><td dir="ltr" style="text-align:right">${g.kg != null ? g.kg + ' ק״ג' : '—'}</td><td dir="ltr" style="font-size:11px;text-align:right">${esc(g.nl || '')}${g.pins ? '<br>' + g.pins.map(p => p.pin + '± ' + esc(p.band)).join(' / ') : ''}</td><td style="font-size:11px">${g.calc && g.calc.chans ? `${g.calc.chans} ערוצים · ${g.calc.per} לערוץ${g.act > 1 ? ' · ' + g.act + ' ערוצים לרמקול' : ''}${g.calc.amp ? ' · ' + esc(g.calc.amp) : ''}` : '—'}</td></tr>`).join('')}</table>
    ${R.amps && R.amps.length ? `<p style="font-size:12.5px;margin:8px 0 0"><b>מגברים:</b> ${R.amps.map(a => `${esc(a.name)} × ${a.n} (${a.ch} ערוצים בשימוש מתוך ${a.n * (a.per || 0)})`).join(' · ')}</p>` : ''}
  </div>`;
}
