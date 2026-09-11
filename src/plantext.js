/* ===================================================================================
   KO Projects — כיתובים בתכנית (OCR מקומי, בלי AI): קריאת כל המילים שעל תכנית הרקע
   וסיווגן — אזורי קהל (GENERAL AREA / DINING / BAR / STAGE…), אזורים תפעוליים (KITCHEN /
   STORAGE / OFFICE…), שירותים וטכני (WC / ELEC / MEP…), ריהוט (TABLE / SOFA / COUNTER…),
   מפלסים וגבהים (+0.00 / FFL / LEVEL…). התוצאה נשמרת בפרויקט (P.planText) במיקום יחסי
   לתמונת הרקע, מוצגת על התכנית לפי קטגוריה, מזינה יצירת אזורים, את פאנל האזור ("כיתובים
   באזור") ואת זיהוי האזורים ב-AI (רמזים). משתמש ב-tesseract.js כמו זיהוי קנה המידה (autoscale.js).
   =================================================================================== */
/* var (לא const): app.js מרנדר פעם ראשונה לפני שהקובץ הזה רץ — הפונקציות מוגנות ב-if (!PT_CATS) */
var PT_CATS = {
  audience: { n: 'אזורי קהל', c: '#0f6e56', ic: '👥' },
  ops: { n: 'אזורים תפעוליים', c: '#c96a13', ic: '🧑‍🍳' },
  service: { n: 'שירותים / טכני', c: '#4a5a8a', ic: '🚻' },
  furniture: { n: 'ריהוט', c: '#7f77dd', ic: '🪑' },
  level: { n: 'מפלסים / גבהים', c: '#e24b4a', ic: '📐' },
  other: { n: 'כיתובים אחרים', c: '#8a8377', ic: '🔤' },
};
/* מילון סיווג — מילה/ביטוי (אנגלית + עברית) → קטגוריה; הראשון שמתאים מנצח, הספציפי לפני הכללי */
var PT_DICT = [
  ['level', /^[+\-±]\s?\d+[.,]\d{2,3}\b|\bFFL\b|\bSFL\b|\bLEVEL\b|\bLVL\b|\bFLOOR\s?\d|\bEL\.?\s?[+\-]?\d|\bRL\b|\bTOS\b|\bTOC\b|מפלס|קומה|גובה|ריצוף/i],
  ['service', /\bW\.?C\b|TOILET|RESTROOM|WASHROOM|LAVATOR|\bMEN\b|\bWOMEN\b|\bLADIES\b|\bGENTS\b|ACCESSIBLE|\bELEC\b|ELECTRIC|\bMEP\b|\bHVAC\b|\bAHU\b|\bSERVER\b|\bCOMMS\b|\bIT\s?ROOM\b|\bRACK\b|\bPLANT\b|MECHANICAL|UTILITY|\bFIRE\b|\bRISER\b|\bSHAFT\b|ELEVATOR|\bLIFT\b|\bSTAIR|JANITOR|\bCLEAN|\bDUCT\b|\bPUMP\b|\bGAS\b|\bWATER\b|שירותים|חשמל|טכני|מעלית|מדרגות|תקשורת|ניקיון|מיזוג|כיבוי|מים|גז/i],
  ['ops', /KITCHEN|\bPREP\b|BACK\s?OF\s?HOUSE|\bBOH\b|\bSTAFF\b|OFFICE|STORAGE|\bSTORE\b|\bDISH|\bWASH\b|LOADING|RECEIVING|DELIVER|WORKSHOP|CORRIDOR|\bCASH\b|MANAGER|\bKIOSK\b|CONCESSION|CONSESSION|PANTRY|\bCOLD\b|FREEZER|LOCKER|SECURITY|\bBACK\b|מטבח|מחסן|משרד|צוות|אחסון|הכנה|פריקה|קבלת|קופה|מנהל|קיוסק|דוכן|מסדרון|מלתחה|אבטחה/i],
  ['audience', /DANCE|\bSTAGE\b|\bBAR\b|LOUNGE|DINING|REST\s?AURANT|GENERAL\s?AREA|\bVIP\b|TERRACE|PATIO|GARDEN|OUTDOOR|ENTRANCE|\bLOBBY\b|RECEPTION|SEATING|\bHALL\b|\bCLUB\b|\bCAFE\b|\bGYM\b|STUDIO|\bPOOL\b|\bROOF|BALCONY|FOOD\s?COURT|\bAREA\b|\bZONE\b|\bROOM\b|WAITING|FOYER|\bDECK\b|\bSPA\b|\bSHOP\b|RETAIL|רחבה|במה|\bבר\b|מסעדה|אולם|לובי|כניסה|מרפסת|חוץ|ישיבה|חדר כושר|סטודיו|בריכה|גן|טרקלין|אזור|חלל|קבלה|חנות|מבואה/i],
  ['furniture', /\bTABLE|\bCHAIR|\bSOFA|\bBOOTH|COUNTER|\bSTOOL|\bBENCH|\bDESK\b|\bSHELF|\bSHELV|\bBED\b|\bISLAND\b|CABINET|\bTV\b|SCREEN|PLANTER|\bSEAT\b|שולחן|כיסא|ספה|דלפק|מדף|ארון|מיטה|מסך/i],
];
function ptClassify(t) {
  for (const [cat, re] of PT_DICT) if (re.test(t)) return cat;
  return 'other';
}
/* ניחוש תכלית לאזור קהל לפי הכיתוב */
function ptUsageOf(t) {
  if (/DANCE|רחבת ריקודים|ריקוד/i.test(t)) return 'מוזיקת ריקודים';
  if (/STAGE|במה|LIVE/i.test(t)) return 'הופעות חיות';
  if (/\bBAR\b|LOUNGE|\bבר\b|טרקלין|CLUB/i.test(t)) return 'מוזיקה לבר';
  if (/DINING|RESTAURANT|FOOD|מסעדה|אוכל/i.test(t)) return 'מסעדה';
  if (/CAFE|קפה/i.test(t)) return 'בית קפה';
  if (/GYM|כושר/i.test(t)) return 'חדר כושר — חלל כללי';
  if (/STUDIO|סטודיו/i.test(t)) return 'סטודיו בחדר כושר';
  return 'מוזיקת רקע';
}
/* קיבוץ מילים לשורות/ביטויים ("GENERAL" + "AREA" → "GENERAL AREA") באותה מסגרת */
function ptGroup(tokens, frame) {
  const vert = frame !== 'h', along = vert ? 'y' : 'x', cross = vert ? 'x' : 'y';
  const ts = tokens.filter(t => t.frame === frame).sort((a, b) => a[cross] - b[cross] || a[along] - b[along]);
  const lines = [];
  for (const tk of ts) {
    const ln = lines.find(l => Math.abs(l.c - tk[cross]) < Math.max(3, tk.h * 0.6) && l.items.some(o => Math.abs(o[along] - tk[along]) < (o.w + tk.w) * 0.5 + tk.h * 1.4));
    if (ln) { ln.items.push(tk); ln.c = (ln.c * (ln.items.length - 1) + tk[cross]) / ln.items.length; }
    else lines.push({ c: tk[cross], items: [tk] });
  }
  return lines.map(l => {
    l.items.sort((a, b) => a[along] - b[along]);
    const xs = l.items.map(i => i.x), ys = l.items.map(i => i.y);
    const x0 = Math.min(...l.items.map(i => i.x - i.w / 2)), x1 = Math.max(...l.items.map(i => i.x + i.w / 2));
    const y0 = Math.min(...l.items.map(i => i.y - i.h / 2)), y1 = Math.max(...l.items.map(i => i.y + i.h / 2));
    return { t: l.items.map(i => i.t).join(' ').replace(/\s+/g, ' ').trim(), x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0, frame, c: Math.round(l.items.reduce((s, i) => s + i.c, 0) / l.items.length) };
  });
}
async function ptOcr(cv, lang, frames) {
  if (!window.Tesseract) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js');
  const worker = await Tesseract.createWorker(lang || 'eng+heb');
  await worker.setParameters({ preserve_interword_spaces: '1', tessedit_pageseg_mode: '11' });
  const pass = async (canvas, frame, map) => {
    const res = await worker.recognize(canvas);
    const out = [];
    for (const w of (res.data.words || [])) {
      const t = (w.text || '').replace(/[|_~`^]/g, '').trim();
      if (!t || w.confidence < (frame === 'h' ? 55 : 68)) continue;
      if (!/[A-Za-z֐-׿]{2,}|^[+\-±]?\d+[.,]\d{2,3}$/.test(t)) continue;   /* מילים בלבד (או מפלס) — מספרי מידות כבר מטופלים בזיהוי קנה המידה */
      const bb = w.bbox; const p = map((bb.x0 + bb.x1) / 2, (bb.y0 + bb.y1) / 2);
      out.push({ t, x: p.x, y: p.y, w: bb.x1 - bb.x0, h: bb.y1 - bb.y0, frame, c: w.confidence });
    }
    return out;
  };
  const tokens = await pass(cv, 'h', (x, y) => ({ x, y }));
  if (frames === 'h') { await worker.terminate(); return tokens; }
  const rot = ang => { const rc = document.createElement('canvas'); rc.width = cv.height; rc.height = cv.width; const g = rc.getContext('2d'); g.translate(rc.width / 2, rc.height / 2); g.rotate(ang); g.drawImage(cv, -cv.width / 2, -cv.height / 2); return rc; };
  tokens.push(...await pass(rot(Math.PI / 2), 'v', (x, y) => ({ x: y, y: cv.height - x })));
  tokens.push(...await pass(rot(-Math.PI / 2), 'w', (x, y) => ({ x: cv.width - y, y: x })));
  await worker.terminate();
  return tokens;
}
/* תמונת הרקע מוגדלת (עד ~3600px) ומחודדת לשחור-לבן — כמו בזיהוי קנה המידה */
async function ptCanvas(maxSide) {
  const img = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = P.bg; });
  const k = Math.max(1, Math.min(4, (maxSide || 3600) / Math.max(img.width, img.height)));
  const cv = document.createElement('canvas'); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
  const g = cv.getContext('2d'); g.imageSmoothingQuality = 'high';
  g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(img, 0, 0, cv.width, cv.height);
  const id = g.getImageData(0, 0, cv.width, cv.height), px = id.data;
  for (let i = 0; i < px.length; i += 4) { const l = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]; const v = l < 160 ? 0 : 255; px[i] = px[i + 1] = px[i + 2] = v; }
  g.putImageData(id, 0, 0);
  return cv;
}
/* PDF: שכבת הטקסט של הקובץ (מדויק, בלי OCR) — טוקנים בנקודות PDF, y הפוך; מסובבים לפי P.bgRot */
async function ptFromPdf() {
  if (!window.pdfjsLib) {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  const bytes = typeof bgPdfBytes === 'function' ? bgPdfBytes() : Uint8Array.from(atob(P.bgPdf.replace(/^data:[^,]*,/, '')), ch => ch.charCodeAt(0));
  const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
  const pg = await doc.getPage(P.bgPdfPage || 1);
  const vp = pg.getViewport({ scale: 1 }), tc = await pg.getTextContent();
  const tokens = [];
  for (const it of tc.items) {
    const t = (it.str || '').trim(); if (!t) continue;
    const [a, b, c, d, e, f] = it.transform;
    const rot = Math.atan2(b, a);
    const h = Math.hypot(c, d) || 8, w = it.width || h * 0.6 * t.length;
    const vert = Math.abs(Math.abs(rot) - Math.PI / 2) < 0.3, horiz = Math.abs(rot) < 0.3 || Math.abs(Math.abs(rot) - Math.PI) < 0.3;
    if (!vert && !horiz) continue;
    const cx = e + Math.cos(rot) * w / 2 - Math.sin(rot) * h / 2, cy = f + Math.sin(rot) * w / 2 + Math.cos(rot) * h / 2;
    /* עברית בשכבת הטקסט של PDF יוצאת לרוב בסדר ויזואלי (הפוך) — הופכים כל מילה עברית */
    const t2 = t.split(/\s+/).map(w => /[֐-׿]/.test(w) ? [...w].reverse().join('') : w).join(' ');
    tokens.push({ t: t2, x: cx, y: vp.height - cy, w, h, frame: vert ? 'v' : 'h', c: 99 });
  }
  return { tokens, W: vp.width, H: vp.height };
}
/* סיבוב התכנית (P.bgRot, כפולות של 90° עם כיוון השעון) — מיקום יחסי (u,v) מסתובב איתה */
function ptRotUV(u, v) { let n = ((P.bgRot || 0) / 90) % 4; while (n-- > 0) { const u2 = 1 - v; v = u; u = u2; } return { u, v }; }
/* סינון זבל: מילים אמיתיות בלבד — OCR על סמלי ריהוט מייצר "an"/"mn"/"CD" */
function ptKeep(p) {
  const t = p.t.replace(/[.,;:!]+$/, '').trim(); p.t = t;
  if (!t) return false;
  if (/^[+\-±]?\d+[.,]\d{2,3}$/.test(t)) return true;                       /* מפלס */
  const letters = (t.match(/[A-Za-z֐-׿]/g) || []).length;
  if (letters < 3 || letters / t.replace(/\s/g, '').length < 0.6) return false;
  const cat = ptClassify(t);
  if (cat !== 'other') return true;                                          /* מילה מהמילון — מספיק */
  if (p.c < 72) return false;
  const words = t.split(/\s+/);
  return words.some(w => /^[A-Z][A-Z0-9'&\-]{3,}$/.test(w) || /^[A-Z][a-z]{3,}$/.test(w) || /^[֐-׿]{4,}$/.test(w));   /* כיתוב אמיתי: מילה באותיות גדולות / מילה עברית */
}
/* סריקה מלאה של תמונת הרקע → P.planText */
async function planTextScan() {
  if (!P.bg) { uiToast('אין תכנית רקע'); return; }
  if (window.__ptBusy) { uiToast('הסריקה כבר רצה…'); return; }
  window.__ptBusy = true; render();
  try {
    uiToast(P.bgPdf ? '🔤 קורא את הכיתובים משכבת הטקסט של ה-PDF…' : '🔤 קורא את הכיתובים בתכנית (OCR מקומי, בלי AI) — יכול לקחת כדקה, ממשיכים בינתיים…', 6000);
    let tokens, SW, SH, src = 'ocr';
    if (P.bgPdf) { const r = await ptFromPdf(); tokens = r.tokens; SW = r.W; SH = r.H; src = 'pdf'; }
    else { const cv = await ptCanvas(); tokens = await ptOcr(cv); SW = cv.width; SH = cv.height; }
    window.__ptTokens = tokens;   /* לניפוי: מה נקרא */
    let phrases = [...ptGroup(tokens, 'h'), ...ptGroup(tokens, 'v'), ...ptGroup(tokens, 'w')].filter(ptKeep);
    /* תכנית באנגלית: "מילים" עבריות שלא במילון הן סמלי ריהוט שנקראו כאותיות — מסירים כשהעברית שולית */
    const heb = phrases.filter(p => /[֐-׿]/.test(p.t)).length;
    if (heb && heb < phrases.length * 0.2) phrases = phrases.filter(p => !/[֐-׿]/.test(p.t) || ptClassify(p.t) !== 'other');
    /* אותו מקום נקרא בשני סיבובים — נשאר הבטוח יותר */
    const kept = [];
    for (const p of phrases.sort((a, b) => b.c - a.c)) {
      if (kept.some(q => Math.abs(q.x - p.x) < Math.max(q.w, p.w) * 0.5 && Math.abs(q.y - p.y) < Math.max(q.h, p.h) * 0.8)) continue;
      kept.push(p);
    }
    const items = kept.map(p => { const uv = src === 'pdf' ? ptRotUV(p.x / SW, p.y / SH) : { u: p.x / SW, v: p.y / SH }; const sw = src === 'pdf' && ((P.bgRot || 0) / 90) % 2 ? [p.h / SH, p.w / SW] : [p.w / SW, p.h / SH]; return { t: p.t, u: +uv.u.toFixed(4), v: +uv.v.toFixed(4), w: +sw[0].toFixed(4), h: +sw[1].toFixed(4), cat: ptClassify(p.t), c: Math.round(p.c), vert: p.frame !== 'h' }; })
      .sort((a, b) => a.v - b.v || a.u - b.u);
    const prev = P.planText || {};
    P.planText = { items, at: new Date().toISOString(), src, show: prev.show !== false, cats: prev.cats || { audience: 1, ops: 1, service: 1, furniture: 0, level: 1, other: 0 }, tokens: tokens.length };
    save(); render();
    const cnt = ptCounts();
    uiToast('🔤 נקראו ' + items.length + ' כיתובים' + (src === 'pdf' ? ' משכבת הטקסט של ה-PDF (מדויק)' : ' ב-OCR') + ': ' + Object.entries(cnt).filter(([, n]) => n).map(([c, n]) => PT_CATS[c].n + ' ' + n).join(' · '), 8000);
  } catch (e) { console.warn('planTextScan', e); uiToast('⚠ קריאת הכיתובים נכשלה: ' + (e.message || e)); }
  finally { window.__ptBusy = false; render(); }
}
function ptCounts() { const c = {}; ((P.planText || {}).items || []).forEach(i => c[i.cat] = (c[i.cat] || 0) + 1); return c; }
/* מיקום כיתוב בקואורדינטות הקנבס */
function ptPos(it) { const W = P.bgW || 1400, H = bgHeightPx(); return { x: bgLeft() + it.u * W, y: bgTop() + it.v * H, w: it.w * W, h: it.h * H }; }
function ptInZone(z) { return ((P.planText || {}).items || []).filter(it => inZone(z, ptPos(it))); }
/* הכיתובים על התכנית — תווית צבעונית לפי קטגוריה, רק לקטגוריות המסומנות */
function ptMarksSVG() {
  if (!PT_CATS) return '';
  const pt = P.planText; if (!pt || !pt.items || !pt.items.length || pt.show === false || !P.bg || calMode) return '';
  const fz = Math.max(9, 11 / getZ());
  let out = '';
  pt.items.forEach((it, i) => {
    if (!pt.cats[it.cat]) return;
    const { x, y, w } = ptPos(it), col = PT_CATS[it.cat].c, foc = window.__ptFocus === i;
    const bw = Math.max(w, it.t.length * fz * 0.6 + 10);
    out += `<g style="cursor:pointer" onclick="window.__ptFocus=${i};ui.tab='node';render()"><rect x="${x - bw / 2}" y="${y - fz * 0.75}" width="${bw}" height="${fz * 1.5}" rx="3" fill="${col}" opacity="${foc ? 1 : 0.78}" stroke="${foc ? '#111' : 'none'}" stroke-width="${foc ? 2 : 0}"/><text x="${x}" y="${y + fz * 0.35}" text-anchor="middle" font-size="${fz}" font-weight="700" fill="#fff" direction="ltr" unicode-bidi="embed">${esc(it.t)}</text></g>`;
  });
  return out;
}
/* ---------- גבולות החדר סביב כיתוב: מילוי (flood fill) על תמונת הרקע ----------
   הקירות בשרטוט הם קווים כהים. מעבים אותם מעט (סוגר פתחי דלתות של עד ~1 מ׳), ממלאים מהנקודה
   הלבנה הקרובה לכיתוב עד שנעצרים בקירות, ולוקחים את המלבן החוסם של המילוי. מילוי שבורח
   (חלל פתוח / הגיע לשולי התכנית / גדול מדי) = אזור פתוח → ריבוע 12×12 מ׳ סביב הכיתוב. */
let PT_BIN = null;   /* { w, h, dark: Uint8Array, key } */
async function ptBinary() {
  const OPT = Object.assign({ thr: 200, rM: 0.8 }, window.__ptOpt || {});   /* סף כהות ורדיוס עיבוי (מ׳) — לכוונון */
  const key = (P.bg || '').length + ':' + (P.bgW || 0) + ':' + (P.scale || 0) + ':' + OPT.thr + ':' + OPT.rM;
  if (PT_BIN && PT_BIN.key === key) return PT_BIN;
  const img = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = P.bg; });
  const k = Math.min(1, 1400 / img.width);
  const w = Math.round(img.width * k), h = Math.round(img.height * k);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.drawImage(img, 0, 0, w, h);
  const px = g.getImageData(0, 0, w, h).data, dark0 = new Uint8Array(w * h);
  for (let i = 0, j = 0; i < px.length; i += 4, j++) dark0[j] = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) < OPT.thr ? 1 : 0;
  /* עיבוי הקירות: רדיוס ≈ 0.5 מ׳ (סוגר דלתות) — בפיקסלים של הקנבס */
  const pxPerM = P.scale ? (1 / P.scale) * (w / (P.bgW || 1400)) : w / 60;
  const r = Math.max(1, Math.min(20, Math.round(pxPerM * OPT.rM)));
  const dark = new Uint8Array(w * h);
  /* הרחבה מופרדת (אופקית ואז אנכית) — O(n·r) */
  const tmp = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) { let run = 0; const row = y * w; for (let x = 0; x < w; x++) { if (dark0[row + x]) run = r + 1; if (run > 0) { tmp[row + x] = 1; run--; } } }   /* ימינה */
  for (let y = 0; y < h; y++) { let run = 0; const row = y * w; for (let x = w - 1; x >= 0; x--) { if (dark0[row + x]) run = r + 1; if (run > 0) { tmp[row + x] = 1; run--; } } }   /* שמאלה */
  for (let x = 0; x < w; x++) { let run = 0; for (let y = 0; y < h; y++) { const i = y * w + x; if (tmp[i]) run = r + 1; if (run > 0) { dark[i] = 1; run--; } } }
  for (let x = 0; x < w; x++) { let run = 0; for (let y = h - 1; y >= 0; y--) { const i = y * w + x; if (tmp[i]) run = r + 1; if (run > 0) { dark[i] = 1; run--; } } }
  PT_BIN = { w, h, dark, r, pxPerM, key, thr: OPT.thr, darkFrac: +(dark0.reduce((a, b) => a + b, 0) / (w * h)).toFixed(3) };
  return PT_BIN;
}
/* מילוי מנקודה אחת: { n, edge, box } */
function ptFlood(B, start, maxR) {
  const { w, h, dark } = B;
  const seen = new Uint8Array(w * h), q = new Int32Array(w * h); let qh = 0, qt = 0;
  q[qt++] = start; seen[start] = 1;
  let minX = w, maxX = 0, minY = h, maxY = 0, n = 0, edge = false;
  const cap = Math.round(w * h * 0.35);
  const cx0 = start % w, cy0 = (start - cx0) / w, R2 = maxR ? maxR * maxR : 0;   /* maxR: מילוי מוגבל לרדיוס סביב ההתחלה (חלל פתוח) */
  while (qh < qt) {
    const i = q[qh++]; const x = i % w, y = (i - x) / w;
    if (R2 && (x - cx0) ** 2 + (y - cy0) ** 2 > R2) continue;
    n++;
    if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (x === 0 || y === 0 || x === w - 1 || y === h - 1) edge = true;
    if (n > cap) { edge = true; break; }
    if (x > 0) { const j = i - 1; if (!seen[j] && !dark[j]) { seen[j] = 1; q[qt++] = j; } }
    if (x < w - 1) { const j = i + 1; if (!seen[j] && !dark[j]) { seen[j] = 1; q[qt++] = j; } }
    if (y > 0) { const j = i - w; if (!seen[j] && !dark[j]) { seen[j] = 1; q[qt++] = j; } }
    if (y < h - 1) { const j = i + w; if (!seen[j] && !dark[j]) { seen[j] = 1; q[qt++] = j; } }
  }
  return { n, edge, box: [minX, minY, maxX, maxY] };
}
/* מלבן החדר (בקואורדינטות הקנבס של התכנית) סביב כיתוב; null = חלל פתוח.
   הכיתוב עצמו וריהוט צמוד יוצרים "כיסים" קטנים — מנסים כמה נקודות התחלה סביב הכיתוב ולוקחים
   את המילוי הגדול ביותר שנשאר בתוך קירות (לא הגיע לשוליים, לא גדול מדי, לא כיס זעיר) */
async function ptRoomRect(it) {
  const B = await ptBinary(); const { w, h, dark } = B;
  const W = P.bgW || 1400, H = bgHeightPx(), L = bgLeft(), T = bgTop();
  const sx = Math.round(it.u * w), sy = Math.round(it.v * h);
  const lh = Math.max(3, Math.round(it.h * h)), lw = Math.round(it.w * w / 2);
  const minN = Math.max(60, Math.round((B.pxPerM * 2) ** 2));   /* לפחות ~4 מ״ר — אחרת זה כיס בתוך הטקסט/הריהוט */
  const cands = [];
  for (const m of [1.5, 3, 5, 8]) { cands.push([0, m * lh], [0, -m * lh], [lw + m * lh, 0], [-lw - m * lh, 0]); }
  cands.push([0, 0]);
  let best = null, leak = null; const tried = new Set();
  for (const [dx, dy] of cands) {
    let x = sx + Math.round(dx), y = sy + Math.round(dy);
    if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1) continue;
    /* פיקסל לבן קרוב לנקודת המועמד */
    let start = -1;
    for (let rad = 0; rad < 6 && start < 0; rad++) for (let ddy = -rad; ddy <= rad && start < 0; ddy++) for (let ddx = -rad; ddx <= rad; ddx++) { const xx = x + ddx, yy = y + ddy; if (xx > 0 && yy > 0 && xx < w - 1 && yy < h - 1 && !dark[yy * w + xx]) { start = yy * w + xx; break; } }
    if (start < 0 || tried.has(start)) continue; tried.add(start);
    const f = ptFlood(B, start);
    if (window.__ptDbg) window.__ptDbg.push({ t: it.t.slice(0, 12), dx, dy, n: f.n, frac: +(f.n / (w * h)).toFixed(3), edge: f.edge });
    if (f.n < minN) continue;
    if (f.edge) { if (!leak) leak = start; continue; }
    if (!best || f.n > best.n) best = f;
  }
  let open = false;
  if (!best) {
    /* חלל פתוח: מילוי מוגבל לרדיוס ~10 מ׳ סביב הכיתוב — נעצר בקירות היכן שיש, ובמרחק היכן שאין */
    if (leak == null) return null;
    best = ptFlood(B, leak, Math.round(B.pxPerM * 10)); open = true;
    if (best.n < minN) return null;
  }
  const r = B.r, [minX, minY, maxX, maxY] = best.box;   /* הקירות עובו — מחזירים את הגבול לקיר עצמו */
  const x0 = Math.max(0, minX - r), x1 = Math.min(w, maxX + r + 1), y0 = Math.max(0, minY - r), y1 = Math.min(h, maxY + r + 1);
  return { left: L + x0 / w * W, top: T + y0 / h * H, w: (x1 - x0) / w * W, h: (y1 - y0) / h * H, fill: best.n / (w * h), open };
}
/* יצירת אזורי סאונד מכיתובי הקהל — לפי גבולות החדר סביב כל כיתוב; rebuild = מחליף אזורים שנוצרו מכיתובים */
async function ptMakeZones(rebuild) {
  const pt = P.planText; if (!pt || !pt.items) return;
  const aud = pt.items.filter(i => i.cat === 'audience');
  if (!aud.length) { uiToast('לא נמצאו כיתובי אזורי קהל'); return; }
  P.zones = P.zones || [];
  if (rebuild) P.zones = P.zones.filter(z => !z.fromText);
  const W = P.bgW || 1400, side = P.scale ? 12 / P.scale : W * 0.2;
  const minPx = P.scale ? 2 / P.scale : W * 0.03;
  let n = 0, open = 0;
  uiToast('🗺 מזהה את גבולות החדרים סביב הכיתובים…', 4000);
  for (const it of aud) {
    const p = ptPos(it);
    if (P.zones.some(z => inZone(z, p))) continue;   /* כבר יש אזור שם (גם כיתוב שני באותו חדר) */
    let rr = null; try { rr = await ptRoomRect(it); } catch (e) { console.warn('ptRoomRect', e); }
    let left, top, w, h, isOpen = false;
    if (rr && rr.w >= minPx && rr.h >= minPx) { ({ left, top, w, h } = rr); if (rr.open) { isOpen = true; open++; } }
    else { w = side; h = side; left = p.x - w / 2; top = p.y - h / 2; isOpen = true; open++; }
    /* אותו חדר שכבר נוצר מכיתוב אחר (חפיפה של 70%+) — לא מכפילים; שם שלם עדיף על שבר OCR */
    const dup = P.zones.find(o => { const b = zoneBounds(o); const ix = Math.max(0, Math.min(left + w, b.L + b.W) - Math.max(left, b.L)), iy = Math.max(0, Math.min(top + h, b.T + b.H) - Math.max(top, b.T)); const inter = ix * iy; return inter > 0.7 * Math.min(w * h, b.W * b.H); });
    if (dup) { if (dup.fromText && it.t.length > dup.name.length && it.t.includes(dup.name.slice(-4))) dup.name = it.t; continue; }
    const z = { id: uid('z'), name: it.t, usage: ptUsageOf(it.t), x: Math.max(0, 2200 - left - w), y: Math.max(0, top), w, h, fromText: true };
    if (isOpen) z.openArea = true;
    P.zones.push(z); n++;
  }
  save(); render();
  uiToast(n ? '✓ ' + n + ' אזורים לפי גבולות החדרים' + (open ? ' · ' + open + ' בחלל פתוח (גבול משוער עד ~10 מ׳ מהכיתוב — גרור פינה להתאמה)' : '') + ' · 🔗 מיזוג אזורים בפאנל האזור' : 'לכל כיתובי הקהל כבר יש אזור', 7000);
}
/* מיזוג שני אזורים לאחד: המלבן החוסם של שניהם, השם/התכלית של הראשון, הפריטים של השני עוברים אליו */
function ptMergeZones(aId, bId) {
  const a = (P.zones || []).find(z => z.id === aId), b = (P.zones || []).find(z => z.id === bId);
  if (!a || !b || a === b) return;
  const ba = zoneBounds(a), bb = zoneBounds(b);
  const L = Math.min(ba.L, bb.L), T = Math.min(ba.T, bb.T), R = Math.max(ba.L + ba.W, bb.L + bb.W), Bt = Math.max(ba.T + ba.H, bb.T + bb.H);
  delete a.poly; a.x = Math.max(0, 2200 - L - (R - L)); a.y = T; a.w = R - L; a.h = Bt - T; delete a.openArea;
  (typeof impItems !== 'undefined' ? impItems : []).forEach(it => { if (it.zones && it.zones[b.name] != null) { it.zones[a.name] = (it.zones[a.name] || 0) + it.zones[b.name]; delete it.zones[b.name]; } });
  P.nodes.forEach(nd => { if (nd.sub && nd.sub.includes(b.name)) nd.sub = nd.sub.split(b.name).join(a.name); });
  P.zones = P.zones.filter(z => z !== b);
  selZone = a.id; save(); render();
  uiToast('🔗 "' + b.name + '" מוזג לתוך "' + a.name + '"');
}
/* רמזים ל-AI (זיהוי אזורים): הכיתובים עם מיקום יחסי */
function ptHintText() {
  const pt = P.planText; if (!pt || !pt.items || !pt.items.length) return '';
  const rel = pt.items.filter(i => i.cat !== 'other' && i.cat !== 'furniture').slice(0, 80);
  return '\nכיתובים שנקראו מהתכנית ב-OCR (טקסט; x,y יחסיים 0-1 מהפינה השמאלית-עליונה; קטגוריה): ' + rel.map(i => `"${i.t}" (${i.u.toFixed(2)},${i.v.toFixed(2)}; ${PT_CATS[i.cat].n})`).join(', ') + '. השתמש בהם כדי לקבוע שמות ותכליות ולהימנע מאזורים תפעוליים/שירותים.';
}
/* הפאנל בתכנית — סריקה, ספירה לפי קטגוריה, הצגה, רשימה, יצירת אזורים */
function ptPanelHTML() {
  if (!P.bg || !PT_CATS) return '';
  const pt = P.planText, cnt = ptCounts();
  const busy = window.__ptBusy;
  let h = `<div style="border:1.5px solid #7f77dd;border-radius:9px;padding:7px 9px;margin:0 0 8px;background:#fff;font-size:11.5px;line-height:1.5">
    <b style="color:#534ab7">🔤 כיתובים בתכנית (OCR מקומי, בלי AI)</b>
    <p class="muted" style="margin:0 0 6px;font-size:10.5px">קורא את המילים שעל השרטוט ומסווג: אזורי קהל, אזורים תפעוליים, שירותים/טכני, ריהוט, מפלסים וגבהים — כדי שהתכנון יתייחס לכל הפרטים.</p>
    <button style="width:100%" ${busy ? 'disabled' : ''} onclick="planTextScan()">${busy ? '⏳ קורא כיתובים…' : pt ? '🔤 סרוק שוב את הכיתובים' : '🔤 קרא את הכיתובים בתכנית'}</button>`;
  if (pt && pt.items) {
    h += `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">${Object.entries(PT_CATS).map(([c, m]) => `<label style="display:flex;align-items:center;gap:3px;font-size:10.5px;cursor:pointer;padding:1px 6px;border-radius:10px;background:${m.c}22;border:1px solid ${m.c}"><input type="checkbox" style="width:auto;margin:0" ${pt.cats[c] ? 'checked' : ''} onchange="P.planText.cats['${c}']=this.checked?1:0;save();render()">${m.ic} ${m.n} <b>${cnt[c] || 0}</b></label>`).join('')}</div>
    <div style="display:flex;gap:4px;margin-top:6px"><button style="flex:1" onclick="P.planText.show=!(P.planText.show!==false);save();render()">${pt.show === false ? '👁 הצג על התכנית' : '🙈 הסתר מהתכנית'}</button><button style="flex:1" onclick="ptMakeZones()" title="אזור סאונד לכל כיתוב קהל — לפי גבולות החדר שסביבו (קירות בשרטוט)">🗺 צור אזורים לפי גבולות החדרים</button>${(P.zones || []).some(z => z.fromText) ? `<button onclick="uiConfirm('לבנות מחדש את האזורים שנוצרו מהכיתובים? (אזורים שציירת ידנית נשארים)').then(ok=>{if(ok)ptMakeZones(true)})" title="מוחק את האזורים שנוצרו מכיתובים ובונה אותם שוב">🔄</button>` : ''}</div>
    <details style="margin-top:4px"><summary class="muted" style="cursor:pointer">כל הכיתובים (${pt.items.length}) — לחיצה מסמנת על התכנית</summary><div style="max-height:180px;overflow:auto;font-size:10.5px">`;
    for (const [c, m] of Object.entries(PT_CATS)) {
      const its = pt.items.map((it, i) => ({ it, i })).filter(x => x.it.cat === c); if (!its.length) continue;
      h += `<div style="font-weight:700;color:${m.c};margin-top:3px">${m.ic} ${m.n}</div>` + its.map(({ it, i }) => `<div style="display:flex;gap:4px;align-items:center;padding:1px 0;${window.__ptFocus === i ? 'background:#fff3e6' : ''}"><span style="flex:1;cursor:pointer;direction:ltr;text-align:left" onclick="window.__ptFocus=${i};P.planText.show=true;render()">${esc(it.t)}</span><select style="width:auto;font-size:10px;padding:0 2px" onchange="P.planText.items[${i}].cat=this.value;save();render()">${Object.entries(PT_CATS).map(([c2, m2]) => `<option value="${c2}" ${it.cat === c2 ? 'selected' : ''}>${m2.ic}</option>`).join('')}</select><button style="padding:0 5px;font-size:10px" onclick="P.planText.items.splice(${i},1);save();render()" title="מחק כיתוב שגוי">✕</button></div>`).join('');
    }
    h += `</div></details><div class="muted" style="font-size:10px">${pt.at ? 'נסרק ' + new Date(pt.at).toLocaleString('he-IL') : ''}${pt.src === 'pdf' ? ' · משכבת הטקסט של ה-PDF (מדויק)' : ' · OCR על התמונה — כיתובים קטנים עלולים להיקרא חלקית; PDF מקורי נקרא במדויק'} · הסיווג ניתן לתיקון בבורר ליד כל כיתוב</div>`;
  }
  return h + '</div>';
}
/* שורה בפאנל האזור: אילו כיתובים יושבים בתוך האזור */
function ptZoneLineHTML(z) {
  if (!PT_CATS) return '';
  const others = (P.zones || []).filter(x => x.id !== z.id);
  const merge = others.length ? `<div style="display:flex;gap:4px;align-items:center;margin-top:6px;font-size:11px"><span>🔗 מזג לתוך "${esc(z.name)}":</span><select style="flex:1;font-size:11px;margin:0" onchange="if(this.value){ptMergeZones('${z.id}',this.value)}"><option value="">— בחר אזור למיזוג —</option>${others.map(o => `<option value="${o.id}">${esc(o.name)}${o.usage ? ' · ' + esc(o.usage) : ''}</option>`).join('')}</select></div>` : '';
  const its = ptInZone(z); if (!its.length) return merge;
  return merge + `<div style="background:#f1efff;border-radius:8px;padding:5px 8px;margin-top:6px;font-size:11px"><b>🔤 כיתובים באזור:</b> ${its.map(i => `<span style="display:inline-block;margin:1px 2px;padding:0 5px;border-radius:8px;background:${PT_CATS[i.cat].c};color:#fff;font-size:10px;direction:ltr">${esc(i.t)}</span>`).join('')}${its.some(i => i.cat === 'ops' || i.cat === 'service') ? '<div class="muted" style="font-size:10px">⚠ יש כאן כיתובים תפעוליים/שירותים — לוודא שהאזור לא כולל אותם</div>' : ''}</div>`;
}

/* הרינדור הראשון של app.js קדם להגדרות כאן — מרנדרים שוב כדי שהכיתובים השמורים יופיעו */
if (typeof P !== 'undefined' && P && P.planText && typeof render === 'function') { try { render(); } catch (e) { console.warn('plantext rerender', e); } }
