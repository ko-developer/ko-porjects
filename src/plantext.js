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
  ['passage', /ENTRANCE|\bENTRY\b|VESTIBULE|\bEXIT\b|CORRIDOR|HALLWAY|PASSAGE|\bכניסה\b|מבואה|יציאה|מסדרון/i],   /* כניסה / מסדרון — מעבר, לא אזור השמעה; לא מרעיל שכנים כמו מטבח */
  ['ops', /KITCHEN|\bPREP\b|BACK\s?OF\s?HOUSE|\bBOH\b|\bSTAFF\b|OFFICE|STORAGE|\bSTORE\b|\bDISH|\bWASH\b|LOADING|RECEIVING|DELIVER|WORKSHOP|\bCASH\b|MANAGER|\bKIOSK\b|CONCESSION|CONSESSION|PANTRY|\bCOLD\b|FREEZER|LOCKER|SECURITY|\bBACK\b|מטבח|מחסן|משרד|צוות|אחסון|הכנה|פריקה|קבלת|קופה|מנהל|קיוסק|דוכן|מלתחה|אבטחה/i],
  ['audience', /DANCE|\bSTAGE\b|\bBAR\b|LOUNGE|DINING|REST\s?AURANT|GENERAL\s?AREA|\bVIP\b|TERRACE|PATIO|GARDEN|OUTDOOR|\bLOBBY\b|RECEPTION|SEATING|\bHALL\b|\bCLUB\b|\bCAFE\b|\bGYM\b|STUDIO|\bPOOL\b|\bROOF|BALCONY|FOOD\s?COURT|\bAREA\b|\bZONE\b|\bROOM\b|WAITING|FOYER|\bDECK\b|\bSPA\b|\bSHOP\b|RETAIL|רחבה|במה|\bבר\b|מסעדה|אולם|לובי|מרפסת|חוץ|ישיבה|חדר כושר|סטודיו|בריכה|גן|טרקלין|אזור|חלל|קבלה|חנות/i],
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
  /* תכנית צבעונית (הדמיה: רצפות, שולחנות וכיסאות בצבע) — הקירות בה שחורים, והכל השאר צבעוני.
     בשרטוט קווי (שחור-לבן) הסף 200 תופס קווים דקים ואפורים; בהדמיה סף כזה הופך כל רצפת עץ ל"קיר".
     מזהים הדמיה לפי חלק הפיקסלים הרוויים בצבע, ואז רק כהה-מאוד (< 70) נחשב קיר */
  /* תכנית עם רצפות צבועות/אפורות (הדמיה, או שרטוט עם מילוי): רוב הפיקסלים אינם לבנים. שם הקירות הם הגוון
     הכהה ביותר, והרצפות גוון ביניים — הסף נבחר אוטומטית (Otsu על הפיקסלים הלא-לבנים) במקום 200 הקבוע של שרטוט קווי.
     בנוסף, לבן-נייר שנוגע בשולי התמונה = "מחוץ לתכנית" (חוסם): כך מרפסת עם רצפה אפורה מחוץ לקירות היא חלל משלה
     ולא נבלעת בשוליים. בשרטוט קווי (רצפה לבנה) זה לא מופעל — שם רצפה לבנה שנוגעת בשוליים היא סתם תכנית חתוכה */
  const luma = new Uint8Array(w * h); const hist = new Uint32Array(256);
  let sat = 0, nonWhite = 0;
  for (let i = 0, j = 0; i < px.length; i += 4, j++) { const r = px[i], gg = px[i + 1], b = px[i + 2]; const l = Math.round(0.299 * r + 0.587 * gg + 0.114 * b); luma[j] = l; if (l < 235) { nonWhite++; hist[l]++; if (Math.max(r, gg, b) - Math.min(r, gg, b) > 40) sat++; }
  }
  const filled = nonWhite / (w * h) > 0.3;
  const rendered = nonWhite > 0 && sat / nonWhite > 0.25;
  let thr = OPT.thr;
  if (window.__ptOpt && window.__ptOpt.thr) thr = window.__ptOpt.thr;
  else if (filled || rendered) {
    /* Otsu על הלא-לבנים: הסף שמפריד "כהה" (קירות/קווים) מ"בהיר" (רצפות) */
    let total = 0, sum = 0; for (let t = 0; t < 235; t++) { total += hist[t]; sum += t * hist[t]; }
    let best = 100, bestV = -1, wB = 0, sumB = 0;
    for (let t = 0; t < 235; t++) { wB += hist[t]; if (!wB) continue; const wF = total - wB; if (!wF) break; sumB += t * hist[t]; const mB = sumB / wB, mF = (sum - sumB) / wF, v = wB * wF * (mB - mF) ** 2; if (v > bestV) { bestV = v; best = t; } }
    thr = Math.max(60, Math.min(170, best));
  }
  for (let j = 0; j < w * h; j++) dark0[j] = luma[j] < thr ? 1 : 0;
  /* (תכנית צבועה: "החוץ" מזוהה ב-ptFilledRegions — לבן-נייר רחב שמגיע לשוליים — ולא כאן) */
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
  PT_BIN = { w, h, dark, dark0, r, pxPerM, key, thr, rendered, filled, darkFrac: +(dark0.reduce((a, b) => a + b, 0) / (w * h)).toFixed(3) };
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
  zoneTakeOver(a, b);
  selZone = a.id; zoneAbsorb(a); save(); render();
  uiToast('🔗 "' + b.name + '" מוזג לתוך "' + a.name + '"');
}
/* ---------- חלוקת כל החלל לאזורים (מוזיקה בכל מקום שיש בו לקוחות) ----------
   הכללים (ZONE_RULES ב-app.js, מהדוגמאות של אורי): גבול = קיר או פתח עם דלת; ריהוט/דלפקים בתוך האזור;
   אולם פתוח = אזור אחד; מטבח/משרד/צוות/פיר/מדרגות/מבואה — לא אזור; שירותים — כן; חדר עם קירות משלו — אזור נפרד.
   כאן זה ממומש על תמונת התכנית (קווים כהים = קירות; דלתות נסגרות בעיבוי; פנים ריהוט צמוד נבלע לאזור).
   על תכניות שבהן קווי הריהוט זהים לקווי הקירות (קווים דקים כפולים) הזיהוי מוגבל — שם עדיף "🤖 סמן לי אזורים" (ראייה של Claude, אותם כללים).
   כל שטח לבן רציף בין קירות (אחרי עיבוי הקירות) = "חלל". חללים שנוגעים בשולי התכנית = חוץ.
   לכל חלל: הכיתובים שבתוכו קובעים — שירותים/מטבח/מחסן = לא אזור; DANCE = רחבת ריקודים;
   כיתוב קהל = השם והתכלית; בלי כיתוב = "חלל N" עם תכלית ברירת המחדל. הגבול = פוליגון של החלל
   (עוקב אחרי הקירות, נקודות עריכות). חוץ: אם יש כיתוב חוץ (TERRACE/GARDEN/PATIO) — אזור מסומן "חוץ". */
function ptComponents(B) {
  const { w, h, dark } = B, comp = new Int32Array(w * h).fill(-1), info = [];
  const q = new Int32Array(w * h);
  for (let s0 = 0; s0 < w * h; s0++) {
    if (dark[s0] || comp[s0] >= 0) continue;
    const id = info.length; let qh = 0, qt = 0; q[qt++] = s0; comp[s0] = id;
    let n = 0, edge = false, minX = w, maxX = 0, minY = h, maxY = 0;
    while (qh < qt) {
      const i = q[qh++], x = i % w, y = (i - x) / w; n++;
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) edge = true;
      if (x > 0 && comp[i - 1] < 0 && !dark[i - 1]) { comp[i - 1] = id; q[qt++] = i - 1; }
      if (x < w - 1 && comp[i + 1] < 0 && !dark[i + 1]) { comp[i + 1] = id; q[qt++] = i + 1; }
      if (y > 0 && comp[i - w] < 0 && !dark[i - w]) { comp[i - w] = id; q[qt++] = i - w; }
      if (y < h - 1 && comp[i + w] < 0 && !dark[i + w]) { comp[i + w] = id; q[qt++] = i + w; }
    }
    info.push({ id, n, edge, box: [minX, minY, maxX, maxY] });
  }
  return { comp, info };
}
/* עיבוי מלבני ברדיוס r (ריצה בזמן קבוע לפיקסל) */
function ptDilateN(src, w, h, r) {
  const t = new Uint8Array(w * h), out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) { let run = 0; const row = y * w; for (let x = 0; x < w; x++) { if (src[row + x]) run = r + 1; if (run > 0) { t[row + x] = 1; run--; } } }
  for (let y = 0; y < h; y++) { let run = 0; const row = y * w; for (let x = w - 1; x >= 0; x--) { if (src[row + x]) run = r + 1; if (run > 0) { t[row + x] = 1; run--; } } }
  for (let x = 0; x < w; x++) { let run = 0; for (let y = 0; y < h; y++) { const i = y * w + x; if (t[i]) run = r + 1; if (run > 0) { out[i] = 1; run--; } } }
  for (let x = 0; x < w; x++) { let run = 0; for (let y = h - 1; y >= 0; y--) { const i = y * w + x; if (t[i]) run = r + 1; if (run > 0) { out[i] = 1; run--; } } }
  return out;
}
/* מסכת חלל אחד, מורחבת חזרה עד הקירות המקוריים (העיבוי כיווץ אותה) */
function ptCompMask(B, comp, id) {
  const { w, h, r, dark0 } = B, m = new Uint8Array(w * h), t = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) if (comp[i] === id) m[i] = 1;
  for (let y = 0; y < h; y++) { let run = 0; const row = y * w; for (let x = 0; x < w; x++) { if (m[row + x]) run = r + 1; if (run > 0) { t[row + x] = 1; run--; } } }
  for (let y = 0; y < h; y++) { let run = 0; const row = y * w; for (let x = w - 1; x >= 0; x--) { if (m[row + x]) run = r + 1; if (run > 0) { t[row + x] = 1; run--; } } }
  const out = new Uint8Array(w * h);
  for (let x = 0; x < w; x++) { let run = 0; for (let y = 0; y < h; y++) { const i = y * w + x; if (t[i]) run = r + 1; if (run > 0) { out[i] = 1; run--; } } }
  for (let x = 0; x < w; x++) { let run = 0; for (let y = h - 1; y >= 0; y--) { const i = y * w + x; if (t[i]) run = r + 1; if (run > 0) { out[i] = 1; run--; } } }
  for (let i = 0; i < w * h; i++) if (out[i] && dark0[i] && !m[i]) out[i] = 0;   /* לא לתוך הקיר עצמו */
  for (let i = 0; i < w * h; i++) if (m[i]) out[i] = 1;
  return out;
}
/* עיבוי/כרסום מלבניים (רדיוס r) — ריצה בזמן קבוע לפיקסל */
function ptErodeN(src, w, h, r) { const inv = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) inv[i] = src[i] ? 0 : 1; const d = ptDilateN(inv, w, h, r); for (let i = 0; i < w * h; i++) inv[i] = d[i] ? 0 : 1; return inv; }
/* טביעת הרגל של המבנה: סגירה מורפולוגית של כל מה שמצויר ברדיוס ~1.2 מ׳ — פתחים (עד ~2.4 מ׳) נסגרים, השטח הלבן
   מסביב לתכנית נשאר בחוץ. מה שמחוץ לטביעת הרגל נחשב "קיר": כך אולם שפתוח אל מרפסת/רחוב לא מתחבר לשוליים ולא נזרק כ"חוץ" */
function ptFootprint(B) {
  const { w, h, dark0, pxPerM } = B, r = Math.max(4, Math.min(90, Math.round(pxPerM * 1.2)));
  return ptErodeN(ptDilateN(dark0, w, h, r), w, h, r);
}
/* פנים של ריהוט צמוד (ספות, תאים, דלפקים) — "כיס" לבן שקו דק מפריד אותו מהרצפה: כיס עד ~6 מ״ר שצמוד למסכת
   החלל דרך קו של עד 3 פיקסלים ואינו נוגע בחלל אחר מצטרף לאזור (כלל: ריהוט אינו גבול). כמה סבבים (כיס ליד כיס) */
function ptAbsorbPockets(B, mask, comp, selfId) {
  const { w, h, dark0, pxPerM } = B, maxN = Math.round(6 * pxPerM * pxPerM);
  const lab = new Int32Array(w * h).fill(-1), q = new Int32Array(w * h), pockets = [];
  for (let s0 = 0; s0 < w * h; s0++) {
    if (dark0[s0] || mask[s0] || lab[s0] >= 0) continue;
    const id = pockets.length; let qh = 0, qt = 0, n = 0, other = false; q[qt++] = s0; lab[s0] = id; const start = 0;
    while (qh < qt) { const i = q[qh++], x = i % w; n++;
      if (comp[i] >= 0 && comp[i] !== selfId) other = true;
      const nb = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w];
      for (const j of nb) { if (j < 0 || j >= w * h || dark0[j] || mask[j] || lab[j] >= 0) continue; lab[j] = id; q[qt++] = j; } }
    pockets.push({ id, n, ok: n <= maxN && !other, px: n <= maxN && !other ? Array.from(q.subarray(0, qt)) : null });
  }
  for (let pass = 0; pass < 3; pass++) {
    let added = 0;
    for (const pk of pockets) {
      if (!pk.ok || pk.done) continue;
      let touch = false;
      for (const i of pk.px) { const x = i % w, y = (i - x) / w;
        for (let d = 1; d <= 3 && !touch; d++) for (const [dx, dy] of [[d, 0], [-d, 0], [0, d], [0, -d]]) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < h && mask[yy * w + xx]) { touch = true; break; } }
        if (touch) break; }
      if (touch) { for (const i of pk.px) mask[i] = 1; pk.done = true; added++; }
    }
    if (!added) break;
  }
  return mask;
}
/* פיצול מסכה לחלקים רציפים */
function ptSplitMask(mask, w, h) {
  const seen = new Uint8Array(w * h), q = new Int32Array(w * h), parts = [];
  for (let s0 = 0; s0 < w * h; s0++) {
    if (!mask[s0] || seen[s0]) continue;
    const m = new Uint8Array(w * h); let qh = 0, qt = 0, n = 0; q[qt++] = s0; seen[s0] = 1;
    while (qh < qt) { const i = q[qh++], x = i % w; m[i] = 1; n++;
      if (x > 0 && mask[i - 1] && !seen[i - 1]) { seen[i - 1] = 1; q[qt++] = i - 1; }
      if (x < w - 1 && mask[i + 1] && !seen[i + 1]) { seen[i + 1] = 1; q[qt++] = i + 1; }
      if (i >= w && mask[i - w] && !seen[i - w]) { seen[i - w] = 1; q[qt++] = i - w; }
      if (i + w < w * h && mask[i + w] && !seen[i + w]) { seen[i + w] = 1; q[qt++] = i + w; } }
    parts.push({ mask: m, n });
  }
  return parts;
}
/* קו המתאר החיצוני של מסכה (Moore neighbour tracing עם קריטריון העצירה של Jacob) → נקודות פיקסל.
   בלי הקריטריון, "זיז" ברוחב פיקסל ליד נקודת ההתחלה סוגר את הלולאה אחרי 2 צעדים ומחזיר פוליגון ריק */
function ptTrace(mask, w, h) {
  let s = -1; for (let i = 0; i < w * h; i++) if (mask[i]) { s = i; break; }
  if (s < 0) return [];
  const at = (x, y) => x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x] ? 1 : 0;
  /* שכנים עם כיוון השעון החל ממערב: W, NW, N, NE, E, SE, S, SW */
  const N = [[-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1]];
  const sx = s % w, sy = (s - sx) / w;
  let cx = sx, cy = sy, bdir = 0;           /* bdir = כיוון ה-backtrack (השכן שממנו הגענו); מתחילים ממערב */
  const pts = [[cx, cy]];
  let firstMove = -1, guard = 0;
  while (guard++ < w * h * 2) {
    let found = -1;
    for (let k = 1; k <= 8; k++) { const d = (bdir + k) % 8; if (at(cx + N[d][0], cy + N[d][1])) { found = d; break; } }
    if (found < 0) break;                     /* פיקסל בודד */
    if (cx === sx && cy === sy) { if (firstMove < 0) firstMove = found; else if (found === firstMove) break; }
    cx += N[found][0]; cy += N[found][1];
    pts.push([cx, cy]);
    bdir = (found + 5) % 8;                   /* ה-backtrack החדש: השכן שנבדק ממש לפני זה שנמצא, מנקודת המבט של הפיקסל החדש */
  }
  return pts;
}
/* פישוט Ramer–Douglas–Peucker */
function ptRdp(pts, eps) {
  if (pts.length < 3) return pts;
  const d2 = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L)); const px = a[0] + t * dx - p[0], py = a[1] + t * dy - p[1]; return px * px + py * py; };
  const out = []; const stack = [[0, pts.length - 1]]; const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  while (stack.length) { const [i, j] = stack.pop(); let best = -1, bd = eps * eps; for (let k = i + 1; k < j; k++) { const d = d2(pts[k], pts[i], pts[j]); if (d > bd) { bd = d; best = k; } } if (best > 0) { keep[best] = 1; stack.push([i, best], [best, j]); } }
  for (let k = 0; k < pts.length; k++) if (keep[k]) out.push(pts[k]);
  return out;
}
/* ===== חלוקה לאזורים בתכנית צבועה / מרונדרת (רצפות בצבע, ריהוט מצויר) =====
   בתכנית כזו "קיר" ≠ "כל קו כהה": שולחנות, כיסאות, קרשי דק וקווי זכוכית כולם כהים. לכן:
   1. קיר = ריצה ישרה ארוכה (≥ 1 מ׳) של פיקסלים כהים בעובי ≥ 3 px, וכל מה שמחובר אליה (סטאבים, כנפי דלת, דלפקים צמודים).
   2. דלת = פער קצר (≤ 1.5 מ׳) לאורך הקיר בין שני קטעי קיר — נסגר.
   3. "חוץ" = לבן-נייר רחב (פתיחה מורפולוגית ברדיוס ~1 מ׳) שמגיע לשולי התמונה — חור בקיר חיצוני לא מציף את הפנים.
   4. קצה קיר חופשי (לא פינה / לא T) מוארך בקו ישר עד הקיר הבא אם הוא במרחק ≤ 3 מ׳ — הגבול המשתמע של פתח (למשל קיר-ברך אל דלפק המארחת).
   5. הרצפה מקובצת לפי צבע (חציון 5×5, סובלנות 70): כל חלל רצפה = אזור; ריהוט כהה שאינו קיר עובר "שקוף".
   6. חורים (ריהוט) מתמלאים; ריהוט צמוד לקיר נבלע בסגירה ברדיוס ~0.6 מ׳ שלא חוצה קירות.
   נבדק מול הסימונים הידניים של המשתמש (פטיו 70% חפיפה, מסעדה מרונדרת 45%). דורש כיול — רוחב דלת נמדד במטרים. */
function ptRunLen(mask, w, h, vertical) {
  const out = new Uint16Array(w * h);
  if (!vertical) { for (let y = 0; y < h; y++) { const row = y * w; let x = 0; while (x < w) { if (!mask[row + x]) { x++; continue; } let e = x; while (e < w && mask[row + e]) e++; const n = Math.min(65535, e - x); for (let k = x; k < e; k++) out[row + k] = n; x = e; } } }
  else { for (let x = 0; x < w; x++) { let y = 0; while (y < h) { if (!mask[y * w + x]) { y++; continue; } let e = y; while (e < h && mask[e * w + x]) e++; const n = Math.min(65535, e - y); for (let k = y; k < e; k++) out[k * w + x] = n; y = e; } } }
  return out;
}
/* פיקסלים של dark שמחוברים (8 שכנים) לפיקסל זרע */
function ptAttached(dark, seed, w, h) {
  const out = new Uint8Array(w * h), q = new Int32Array(w * h); let qt = 0;
  for (let i = 0; i < w * h; i++) if (seed[i] && dark[i]) { out[i] = 1; q[qt++] = i; }
  let qh = 0;
  while (qh < qt) { const i = q[qh++], x = i % w, y = (i - x) / w;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const j = yy * w + xx; if (dark[j] && !out[j]) { out[j] = 1; q[qt++] = j; } } }
  return out;
}
/* הארכת קצה קיר חופשי לאורך כיוונו עד הקיר הבא (≤ Dmax), רק אם הקצה אינו פינה / צומת T */
function ptExtendWalls(thick, passable, w, h, Lmin, Dmax) {
  const ext = new Uint8Array(w * h);
  const rlH = ptRunLen(thick, w, h, false), rlV = ptRunLen(thick, w, h, true);
  const walk = (vertical) => {
    const perp = vertical ? rlH : rlV;            /* אורך הריצה הניצבת דרך פיקסל */
    const N1 = vertical ? h : w, N2 = vertical ? w : h;
    const at = (p, q) => vertical ? p * w + q : q * w + p;   /* p = לאורך הריצה (x בהליכה אופקית, y באנכית), q = השורה/העמודה */
    for (let q = 0; q < N2; q++) {
      let p = 0;
      while (p < N1) {
        if (!thick[at(p, q)]) { p++; continue; }
        let e = p; while (e < N1 && thick[at(e, q)]) e++;
        if (e - p >= Lmin) {
          /* עובי הקיר עצמו = חציון הריצה הניצבת לאורך הקטע */
          const arr = []; for (let k = p; k < e; k += Math.max(1, ((e - p) / 15) | 0)) arr.push(perp[at(k, q)]); arr.sort((a, b) => a - b); const t = arr[arr.length >> 1] || 1;
          for (const [p0, step] of [[e, 1], [p - 1, -1]]) {
            /* פינה / T: ריצה ניצבת ארוכה מעובי הקיר נוגעת בקצה */
            let att = false;
            for (let dq = -1; dq <= 1 && !att; dq++) for (let dp = -2; dp <= 2; dp++) { const pp = p0 + dp, qq = q + dq; if (pp < 0 || qq < 0 || pp >= N1 || qq >= N2) continue; if (perp[at(pp, qq)] > t + 3) { att = true; break; } }
            if (att) continue;
            let x = p0, n = 0, hit = false;
            while (x >= 0 && x < N1 && n <= Dmax) { const i = at(x, q); if (thick[i]) { hit = n > 0; break; } if (!passable[i]) break; x += step; n++; }
            if (hit && n >= 2) { const a = step > 0 ? p0 : x + 1, b = step > 0 ? x : p0 + 1; for (let k = a; k < b; k++) ext[at(k, q)] = 1; if (window.__ptDbg2) (window.__ptDbg2.exts = window.__ptDbg2.exts || []).push([vertical ? 'V' : 'H', q, p0, step, n, t, e - p]); }
          }
        }
        p = e;
      }
    }
  };
  walk(false); walk(true);
  return ext;
}
/* תיוג רכיבים (4 שכנים) של מסכה → Int32Array תוויות + גדלים */
function ptLabel(mask, w, h) {
  const lab = new Int32Array(w * h).fill(-1), q = new Int32Array(w * h), sizes = [];
  for (let s0 = 0; s0 < w * h; s0++) {
    if (!mask[s0] || lab[s0] >= 0) continue;
    const id = sizes.length; let qh = 0, qt = 0, n = 0; q[qt++] = s0; lab[s0] = id;
    while (qh < qt) { const i = q[qh++], x = i % w; n++;
      if (x > 0 && mask[i - 1] && lab[i - 1] < 0) { lab[i - 1] = id; q[qt++] = i - 1; }
      if (x < w - 1 && mask[i + 1] && lab[i + 1] < 0) { lab[i + 1] = id; q[qt++] = i + 1; }
      if (i >= w && mask[i - w] && lab[i - w] < 0) { lab[i - w] = id; q[qt++] = i - w; }
      if (i + w < w * h && mask[i + w] && lab[i + w] < 0) { lab[i + w] = id; q[qt++] = i + w; } }
    sizes.push(n);
  }
  return { lab, sizes };
}
/* מילוי חורים במסכה: חור בלי פיקסלי קיר תמיד; חור עם קירות רק אם קטן מ-maxA */
function ptFillHoles(m, w, h, walls, maxA) {
  const inv = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) inv[i] = m[i] ? 0 : 1;
  const { lab, sizes } = ptLabel(inv, w, h);
  const ok = new Uint8Array(sizes.length).fill(1), wc = new Uint32Array(sizes.length);
  for (let i = 0; i < w * h; i++) { const l = lab[i]; if (l < 0) continue; const x = i % w, y = (i - x) / w; if (x === 0 || y === 0 || x === w - 1 || y === h - 1) ok[l] = 0; if (walls && walls[i]) wc[l]++; }
  for (let l = 0; l < sizes.length; l++) if (ok[l] && walls && wc[l] > 0 && !(maxA && sizes[l] < maxA)) ok[l] = 0;
  const out = new Uint8Array(m);
  for (let i = 0; i < w * h; i++) if (lab[i] >= 0 && ok[lab[i]]) out[i] = 1;
  return out;
}
/* כל מסכות החללים בתכנית צבועה. מחזיר { regions:[{mask,n,mean}], lab, walls, outside, thick } */
async function ptFilledRegions(B) {
  const { w, h, dark0, pxPerM, thr } = B;
  /* צבעי הרצפה (חציון 5×5 להשטחת טקסטורות) — מציירים שוב את התמונה באותו גודל */
  const img = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = P.bg; });
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.drawImage(img, 0, 0, w, h);
  const px = g.getImageData(0, 0, w, h).data;
  const med = new Uint8Array(w * h * 3); const buf = new Uint8Array(25);
  for (let c = 0; c < 3; c++) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let n = 0; for (let dy = -2; dy <= 2; dy++) { const yy = Math.min(h - 1, Math.max(0, y + dy)); for (let dx = -2; dx <= 2; dx++) { const xx = Math.min(w - 1, Math.max(0, x + dx)); buf[n++] = px[(yy * w + xx) * 4 + c]; } }
    const a = Array.prototype.slice.call(buf, 0, n).sort((p, q) => p - q); med[(y * w + x) * 3 + c] = a[12];
  }
  const paper = new Uint8Array(w * h);
  for (let i = 0, j = 0; i < px.length; i += 4, j++) { const r = px[i], gg = px[i + 1], b = px[i + 2]; if (Math.min(r, gg, b) >= 246 && Math.max(r, gg, b) - Math.min(r, gg, b) <= 8) paper[j] = 1; }
  const Lmin = Math.max(6, Math.round(pxPerM * 1.0)), D = Math.max(4, Math.round(pxPerM * 1.5)), Dmax = Math.round(pxPerM * 3.0);
  const rCl = Math.max(1, Math.min(40, Math.round(pxPerM * 1.0)));   /* סגירה: ריהוט צמוד לקיר (ספסלים, כיסאות) נבלע עד ~2 מ׳ רוחב; לא חוצה קירות */
  /* 1. קירות: ריצות ישרות ארוכות ובעובי ≥ 3 + כל מה שמחובר אליהן */
  const rlH = ptRunLen(dark0, w, h, false), rlV = ptRunLen(dark0, w, h, true), seed = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) if (dark0[i] && ((rlH[i] >= Lmin && rlV[i] >= 3) || (rlV[i] >= Lmin && rlH[i] >= 3))) seed[i] = 1;
  const thick = ptAttached(dark0, seed, w, h);
  /* 2. דלתות: נסגרות בשלב 4 (קצה קיר חופשי מוארך עד הקיר שמולו). סגירת פערים "עיוורת" בין כל שני פיקסלי קיר
     הופכת רשת אריחים שנוגעת בקיר לגוש אחד — לכן אין כאן gap-fill */
  const walls = new Uint8Array(thick);
  /* 3. חוץ: לבן-נייר לא-קיר, פתיחה ברדיוס e, מחובר לשוליים (+ רצועת שוליים) */
  const e = Math.max(2, Math.min(Math.round(pxPerM * 1.0), Math.round(w * 0.03)));
  const cand = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) cand[i] = paper[i] && !walls[i] ? 1 : 0;
  const candInv = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) candInv[i] = cand[i] ? 0 : 1;
  const er = ptDilateN(candInv, w, h, e); for (let i = 0; i < w * h; i++) er[i] = er[i] ? 0 : 1;   /* כרסום; השוליים לא נחשבים "לא-מועמד" */
  /* כרסום ליד שולי התמונה: הפיקסלים שמעבר לשוליים נחשבים מועמדים — נחזיר את הרצועה */
  for (let i = 0; i < w * h; i++) { const x = i % w, y = (i - x) / w; if (cand[i] && (x < e || y < e || x >= w - e || y >= h - e)) er[i] = 1; }
  const L1 = ptLabel(er, w, h); const border = new Uint8Array(L1.sizes.length);
  for (let x = 0; x < w; x++) { if (L1.lab[x] >= 0) border[L1.lab[x]] = 1; if (L1.lab[(h - 1) * w + x] >= 0) border[L1.lab[(h - 1) * w + x]] = 1; }
  for (let y = 0; y < h; y++) { if (L1.lab[y * w] >= 0) border[L1.lab[y * w]] = 1; if (L1.lab[y * w + w - 1] >= 0) border[L1.lab[y * w + w - 1]] = 1; }
  const outside = new Uint8Array(w * h), q = new Int32Array(w * h); let qt = 0;
  for (let i = 0; i < w * h; i++) { const x = i % w, y = (i - x) / w; if ((L1.lab[i] >= 0 && border[L1.lab[i]]) || (cand[i] && (x < 2 * e || y < 2 * e || x >= w - 2 * e || y >= h - 2 * e))) { outside[i] = 1; q[qt++] = i; } }
  { let qh = 0; const dist = new Uint16Array(w * h);
    while (qh < qt) { const i = q[qh++]; if (dist[i] >= e) continue; const x = i % w; const nb = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i >= w ? i - w : -1, i + w < w * h ? i + w : -1]; for (const j of nb) if (j >= 0 && cand[j] && !outside[j]) { outside[j] = 1; dist[j] = dist[i] + 1; q[qt++] = j; } } }
  /* 4. הארכת קצות קיר חופשיים */
  const passable = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) passable[i] = !thick[i] && !outside[i] ? 1 : 0;
  const ext = ptDilateN(ptExtendWalls(thick, passable, w, h, Lmin, Dmax), w, h, 1);
  for (let i = 0; i < w * h; i++) if (ext[i]) walls[i] = 1;
  /* 5. קיבוץ רצפה לפי צבע */
  const free = new Uint8Array(w * h), neutral = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) { if (!walls[i] && !outside[i]) { if (dark0[i]) neutral[i] = 1; else free[i] = 1; } }
  const lab = new Int32Array(w * h).fill(-1), regions = [];
  for (let s0 = 0; s0 < w * h; s0++) {
    if (!free[s0] || lab[s0] >= 0) continue;
    const id = regions.length; let qh = 0; qt = 0; q[qt++] = s0; lab[s0] = id;
    let n = 0, sr = 0, sg = 0, sb = 0, mr = med[s0 * 3], mg = med[s0 * 3 + 1], mb = med[s0 * 3 + 2], cnt = 0;
    while (qh < qt) {
      const i = q[qh++], x = i % w; cnt++;
      if (free[i]) { n++; sr += med[i * 3]; sg += med[i * 3 + 1]; sb += med[i * 3 + 2]; if (n < 50 || n % 50 === 0) { mr = sr / n; mg = sg / n; mb = sb / n; } }
      const nb = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i >= w ? i - w : -1, i + w < w * h ? i + w : -1];
      for (const j of nb) { if (j < 0 || lab[j] >= 0) continue;
        if (free[j]) { if (Math.abs(med[j * 3] - mr) + Math.abs(med[j * 3 + 1] - mg) + Math.abs(med[j * 3 + 2] - mb) < 70) { lab[j] = id; q[qt++] = j; } }
        else if (neutral[j]) { lab[j] = id; q[qt++] = j; } }
    }
    regions.push({ id, n: cnt, mean: [mr, mg, mb] });
  }
  /* 6. מסכה סופית לכל חלל */
  const minA = 1.5 * pxPerM * pxPerM, holeMax = 25 * pxPerM * pxPerM;   /* תא שירותים קטן נשאר; חלל קטן בלי כיתוב נזרק אחר כך */
  const out = [];
  const dbgR = window.__ptDbg2 ? (window.__ptDbg2.regs = []) : null;
  for (const rg of regions) {
    if (dbgR && rg.n >= 0.4 * pxPerM * pxPerM) { let x0 = w, y0 = h, x1 = 0, y1 = 0; for (let i = 0; i < w * h; i++) if (lab[i] === rg.id) { const x = i % w, y = (i - x) / w; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; } dbgR.push({ id: rg.id, m2: +(rg.n / pxPerM / pxPerM).toFixed(1), box: [x0, y0, x1, y1], mean: rg.mean.map(Math.round) }); }
    if (rg.n < minA) continue;
    let m = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) if (lab[i] === rg.id) m[i] = 1;
    m = ptFillHoles(m, w, h, thick, holeMax);
    const cl = ptErodeN(ptDilateN(m, w, h, rCl), w, h, rCl);
    for (let i = 0; i < w * h; i++) if (walls[i] || outside[i]) cl[i] = 0;
    let m2 = ptFillHoles(cl, w, h, thick, holeMax);
    const L2 = ptLabel(m2, w, h); const cnt = new Uint32Array(L2.sizes.length);
    for (let i = 0; i < w * h; i++) if (m[i] && L2.lab[i] >= 0) cnt[L2.lab[i]]++;
    let best = -1; for (let k = 0; k < cnt.length; k++) if (best < 0 || cnt[k] > cnt[best]) best = k;
    if (best < 0) continue;
    const fm = new Uint8Array(w * h); let fn = 0; for (let i = 0; i < w * h; i++) if (L2.lab[i] === best) { fm[i] = 1; fn++; }
    if (dbgR) { const d = dbgR.find(x => x.id === rg.id); if (d) d.after = +(fn / pxPerM / pxPerM).toFixed(1); }
    if (fn < minA) continue;
    out.push({ id: rg.id, mask: fm, n: fn, mean: rg.mean });
  }
  if (window.__ptDbg2) { const cnt = a => { let n = 0; for (let i = 0; i < a.length; i++) if (a[i]) n++; return n; }; window.__ptDbg2.filled = { w, h, thr, Lmin, D, Dmax, e, rCl, regions: regions.length, kept: out.length, dark0: cnt(dark0), seed: cnt(seed), thick: cnt(thick), walls: cnt(walls), ext: cnt(ext), outside: cnt(outside), paper: cnt(paper), free: cnt(free), neutral: cnt(neutral) }; }
  return { regions: out, lab, walls, outside, thick };
}
async function ptPartition() {
  if (!P.bg) { uiToast('אין תכנית'); return; }
  uiToast('🧩 מחלק את החלל לאזורים לפי הקירות…', 5000);
  const B = await ptBinary(); const { w, h } = B;
  if (B.filled || B.rendered) {
    if (!P.scale) { uiToast('⚠ תכנית צבועה: כדי לזהות דלתות ופתחים צריך קנה מידה — כייל את התכנית קודם (📏)', 8000); return; }
    return ptPartitionFilled(B);
  }
  const { comp, info } = ptComponents(B);
  const W = P.bgW || 1400, H = bgHeightPx(), L = bgLeft(), T = bgTop();
  const pxPerM2 = B.pxPerM * B.pxPerM, minArea = 8 * pxPerM2, labelMin = 3 * pxPerM2;
  /* איזה כיתוב יושב באיזה חלל (הכיתוב עצמו כהה — מחפשים פיקסל לבן צמוד) */
  const items = ((P.planText || {}).items || []).map(it => {
    /* דגימה בטבעת סביב תיבת הכיתוב (8 כיוונים × 3 מרחקים) — החלל שמופיע הכי הרבה */
    const sx = Math.round(it.u * w), sy = Math.round(it.v * h), lh = Math.max(3, Math.round(it.h * h)), lw = Math.round(it.w * w / 2);
    const votes = {};
    for (const m of [1.5, 3, 5]) for (let k = 0; k < 8; k++) {
      const ang = k * Math.PI / 4, x = sx + Math.round(Math.cos(ang) * (lw + m * lh)), y = sy + Math.round(Math.sin(ang) * m * lh);
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const id = comp[y * w + x]; if (id >= 0) votes[id] = (votes[id] || 0) + 1;
    }
    let cid = -1, bestV = 0; for (const [id, v] of Object.entries(votes)) if (v > bestV) { bestV = v; cid = +id; }
    return { ...it, cid };
  });
  const SERVICE = it => it.cat === 'service' || it.cat === 'ops';
  const OUT_RE = /TERRACE|PATIO|GARDEN|OUTDOOR|BALCONY|ROOF|DECK|מרפסת|חוץ|גן|גג/i;
  P.zones = (P.zones || []).filter(z => !z.auto);
  let made = 0, skipped = 0, outdoor = 0, idx = 0;
  const seenNames = {};
  const mkPoly = (mask) => {
    const tr = ptTrace(mask, w, h);
    const eps = Math.max(1.5, B.pxPerM * 0.2);
    let sp = tr.length >= 4 ? ptRdp(tr, eps) : [];
    if (sp.length < 3) {   /* מתאר מנוון — המלבן החוסם של המסכה */
      let x0 = w, y0 = h, x1 = 0, y1 = 0; for (let i = 0; i < w * h; i++) if (mask[i]) { const x = i % w, y = (i - x) / w; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
      if (x1 <= x0 || y1 <= y0) return null; sp = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    }
    return sp.map(([x, y]) => ({ x: Math.round(L + x / w * W), y: Math.round(T + y / h * H) }));
  };
  const addZone = (name, usage, poly, extra) => {
    if (!poly || poly.length < 3) return;
    const xs = poly.map(p => p.x), ys = poly.map(p => p.y), left = Math.min(...xs), top = Math.min(...ys);
    const z = { id: uid('z'), name, usage, poly, x: Math.max(0, 2200 - left - (Math.max(...xs) - left)), y: top, w: Math.max(...xs) - left, h: Math.max(...ys) - top, auto: 'partition', fromText: true, ...extra };
    P.zones.push(z); made++;
  };
  /* "חוץ" = החללים שמכילים את פינות התכנית; חלל שנוגע בשוליים כי התכנית חתוכה (ויש בו כיתוב קהל, או שאינו ענק) נשאר פנימי */
  /* בתכנית עם רצפות צבועות "החוץ" הוא רק לבן-הנייר (כבר חסום) — רצפה אפורה בפינת התמונה היא מרפסת, לא חוץ */
  const cornerIds = B.filled || B.rendered ? new Set() : new Set([comp[0], comp[w - 1], comp[(h - 1) * w], comp[h * w - 1]].filter(i => i >= 0));
  for (const c of info) {
    const labs = items.filter(it => it.cid === c.id);
    const aud = labs.filter(it => it.cat === 'audience'), svc = labs.filter(SERVICE);
    const isOutside = cornerIds.has(c.id) || (c.edge && !aud.length && c.n > 0.25 * w * h);
    if (isOutside) {
      /* חלל שפתוח אל השוליים (מרפסת לרחוב, תכנית חתוכה): לכל כיתוב קהל שיושב בו — אזור בגבול הקירות עד ~10 מ׳ מהכיתוב */
      for (const it of aud) {
        const p = ptPos(it); if (P.zones.some(z => inZone(z, p))) continue;
        const rr = await ptRoomRect(it); if (!rr) continue;
        const isOut = OUT_RE.test(it.t);
        addZone(it.t, ptUsageOf(it.t), [{ x: rr.left, y: rr.top }, { x: rr.left + rr.w, y: rr.top }, { x: rr.left + rr.w, y: rr.top + rr.h }, { x: rr.left, y: rr.top + rr.h }].map(p => ({ x: Math.round(p.x), y: Math.round(p.y) })), { outdoor: isOut || undefined, openArea: true }); if (isOut) outdoor++;
      }
      continue;
    }
    const dbg = window.__ptDbg2 ? (window.__ptDbg2.trace = window.__ptDbg2.trace || []) : null;
    if (c.n < labelMin) { if (dbg) dbg.push({ id: c.id, m2: +(c.n / pxPerM2).toFixed(1), why: 'tiny' }); continue; }
    if (svc.length && !aud.length) { skipped++; if (dbg) dbg.push({ id: c.id, m2: +(c.n / pxPerM2).toFixed(1), why: 'service' }); continue; }
    if (labs.some(it => it.cat === 'passage') && !aud.length) { skipped++; if (dbg) dbg.push({ id: c.id, m2: +(c.n / pxPerM2).toFixed(1), why: 'passage' }); continue; }   /* כניסה / מסדרון — לא אזור */             /* שירותים / מטבח / מחסן — בלי מוזיקה */
    if (!aud.length && c.n < minArea) { if (dbg) dbg.push({ id: c.id, m2: +(c.n / pxPerM2).toFixed(1), why: 'small-unlabeled' }); continue; }                          /* חלל קטן בלי כיתוב — פינה/ארון */
    const mask = ptAbsorbPockets(B, ptCompMask(B, comp, c.id), comp, c.id);
    /* כיסים שנבלעו מעבר לקו לא מחוברים פיזית למסכה — מעבים ב-2 פיקסלים כדי לגשר, ומקיפים את החלק הגדול */
    const bridged = ptDilateN(mask, w, h, 2);
    const parts = ptSplitMask(bridged, w, h).sort((a, b) => b.n - a.n); if (!parts.length) { if (dbg) dbg.push({ id: c.id, why: 'no-parts' }); continue; }
    const poly = mkPoly(parts[0].mask); if (!poly) { if (dbg) dbg.push({ id: c.id, m2: +(c.n / pxPerM2).toFixed(1), why: 'no-poly', part: +(parts[0].n / pxPerM2).toFixed(1) }); continue; }
    if (dbg) dbg.push({ id: c.id, m2: +(c.n / pxPerM2).toFixed(1), why: 'zone', part: +(parts[0].n / pxPerM2).toFixed(1), pts: poly.length });
    let name, usage;
    if (aud.length) { const best = aud.slice().sort((a, b) => b.t.length - a.t.length)[0]; name = best.t; usage = ptUsageOf(best.t); }
    else { name = 'חלל ' + (++idx); usage = (P.room && P.room.usage) || 'מוזיקת רקע'; }
    if (seenNames[name]) name += ' ' + (++seenNames[name]); else seenNames[name] = 1;
    addZone(name, usage, poly, aud.some(x => /DANCE|ריקוד/i.test(x.t)) ? { dance: true } : {});
  }
  save(); render();
  uiToast(made ? '🧩 ' + made + ' אזורים לפי הקירות' + (skipped ? ' · ' + skipped + ' חללי שירות/תפעול הושמטו' : '') + (outdoor ? ' · ' + outdoor + ' בחוץ' : '') + ' — גרור נקודות לעריכה, אזור שנבלע מתמזג' : 'לא זוהו חללים סגורים — כייל את התכנית ובדוק שהקירות כהים', 8000);
}
/* OCR ממוקד לכל חלל: חיתוך תיבת החלל מהתמונה המקורית, הגדלה ×3, סף יחסי לרצפה (טקסט כהה מהרצפה ב-45+; קווי אריחים בהירים נשארים לבנים)
   → מילים → סיווג (PT_DICT). זה מה שתופס "Kitchen" / "Walk-In Fridge" / "RESTROOM" שה-OCR הכללי מפספס על רקע מרושת */
async function ptRoomWords(B, regions) {
  const { w, h } = B;
  const img = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = P.bg; });
  const sx = img.width / w, sy = img.height / h;
  if (!window.Tesseract) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js');
  const worker = await Tesseract.createWorker('eng');
  await worker.setParameters({ preserve_interword_spaces: '1', tessedit_pageseg_mode: '11' });
  const out = new Map();
  try {
    for (const rg of regions) {
      let x0 = w, y0 = h, x1 = 0, y1 = 0; const m = rg.mask;
      for (let i = 0; i < w * h; i++) if (m[i]) { const x = i % w, y = (i - x) / w; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
      const cw = (x1 - x0 + 1) * sx, ch = (y1 - y0 + 1) * sy; if (cw < 8 || ch < 8) continue;
      const k = Math.max(1, Math.min(4, 1400 / Math.max(cw, ch)));
      const cv = document.createElement('canvas'); cv.width = Math.round(cw * k); cv.height = Math.round(ch * k);
      const g = cv.getContext('2d'); g.imageSmoothingQuality = 'high'; g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
      g.drawImage(img, x0 * sx, y0 * sy, cw, ch, 0, 0, cv.width, cv.height);
      const id = g.getImageData(0, 0, cv.width, cv.height), px = id.data, lum = new Uint8Array(cv.width * cv.height), hist = new Uint32Array(256);
      for (let i = 0, j = 0; i < px.length; i += 4, j++) { const l = Math.round(0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]); lum[j] = l; hist[l]++; }
      let acc = 0, medL = 200; for (let l = 0; l < 256; l++) { acc += hist[l]; if (acc >= lum.length / 2) { medL = l; break; } }
      const thr = Math.max(60, Math.min(200, medL - 25));   /* טקסט אפור בהיר על אריחים: 25 מתחת לחציון הרצפה */
      /* פיקסלים מחוץ למסכת החלל (מהתמונה המוקטנת) → לבן, כדי שקירות/חדרים שכנים לא ייקראו */
      for (let j = 0; j < lum.length; j++) { const x = j % cv.width, y = (j - x) / cv.width; const mx = x0 + Math.floor(x / k / sx), my = y0 + Math.floor(y / k / sy); const inside = mx >= 0 && my >= 0 && mx < w && my < h && m[my * w + mx]; const v = inside && lum[j] < thr ? 0 : 255; px[j * 4] = px[j * 4 + 1] = px[j * 4 + 2] = v; }
      g.putImageData(id, 0, 0);
      if (window.__ptDbg2) { const c3 = document.createElement('canvas'); const f = Math.min(1, 500 / Math.max(cv.width, cv.height)); c3.width = Math.round(cv.width * f); c3.height = Math.round(cv.height * f); c3.getContext('2d').drawImage(cv, 0, 0, c3.width, c3.height); (window.__ptDbg2.crops = window.__ptDbg2.crops || []).push({ id: rg.id, medL, thr, url: c3.toDataURL('image/jpeg', 0.5) }); }
      const res = await worker.recognize(cv);
      const words = [];
      for (const wd of (res.data.words || [])) { const t = (wd.text || '').replace(/[|_~`^]/g, '').trim(); if (t.length >= 3 && wd.confidence >= 60 && /[A-Za-z]{3,}/.test(t)) words.push(t); }
      out.set(rg.id, words);
    }
  } finally { await worker.terminate(); }
  return out;
}
/* חלוקה בתכנית צבועה: חללי הרצפה מ-ptFilledRegions → אזורים (בלי שירותים/תפעול), שמות לפי כיתובי הקהל */
async function ptPartitionFilled(B) {
  const { w, h } = B;
  const R = await ptFilledRegions(B);
  const W = P.bgW || 1400, H = bgHeightPx(), L = bgLeft(), T = bgTop();
  const pxPerM2 = B.pxPerM * B.pxPerM;
  const items = ((P.planText || {}).items || []).map(it => {
    const sx = Math.round(it.u * w), sy = Math.round(it.v * h), lh = Math.max(3, Math.round(it.h * h)), lw = Math.round(it.w * w / 2);
    const votes = {};
    for (const m of [1.5, 3, 5]) for (let k = 0; k < 8; k++) {
      const ang = k * Math.PI / 4, x = sx + Math.round(Math.cos(ang) * (lw + m * lh)), y = sy + Math.round(Math.sin(ang) * m * lh);
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const id = R.lab[y * w + x]; if (id >= 0) votes[id] = (votes[id] || 0) + 1;
    }
    let cid = -1, bestV = 0; for (const [id, v] of Object.entries(votes)) if (v > bestV) { bestV = v; cid = +id; }
    return { ...it, cid };
  });
  const SERVICE = it => it.cat === 'service' || it.cat === 'ops';
  const OUT_RE = /TERRACE|PATIO|GARDEN|OUTDOOR|BALCONY|ROOF|DECK|מרפסת|חוץ|גן|גג/i;
  P.zones = (P.zones || []).filter(z => !z.auto);
  let made = 0, skipped = 0, outdoor = 0, idx = 0; const seenNames = {};
  const mkPoly = (mask) => {
    const tr = ptTrace(mask, w, h), eps = Math.max(1.5, B.pxPerM * 0.2);
    let sp = tr.length >= 4 ? ptRdp(tr, eps) : [];
    if (sp.length < 3) { let x0 = w, y0 = h, x1 = 0, y1 = 0; for (let i = 0; i < w * h; i++) if (mask[i]) { const x = i % w, y = (i - x) / w; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; } if (x1 <= x0 || y1 <= y0) return null; sp = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; }
    return sp.map(([x, y]) => ({ x: Math.round(L + x / w * W), y: Math.round(T + y / h * H) }));
  };
  const dbg = window.__ptDbg2 ? (window.__ptDbg2.trace = window.__ptDbg2.trace || []) : null;
  const regs = R.regions.sort((a, b) => b.n - a.n);
  uiToast('🔤 קורא את הכיתובים בתוך ' + regs.length + ' חללים (מטבח / שירותים / קהל)…', 6000);
  let roomWords = new Map(); try { roomWords = await ptRoomWords(B, regs); } catch (e) { console.warn('ptRoomWords', e); }
  const WC_RE = /W\.?C\b|TOILET|RESTROOM|WASHROOM|LAVATOR|BATHROOM|HANDICAP|WOMEN|LADIES|GENTS|שירותים/i;
  /* כיתוב תפעולי (KITCHEN / PANTRY / מטבח…) מרעיל כל חלל שנמצא עד 1 מ׳ ממנו — גם דלפק/מעבר צר ליד הכיתוב, גם כשהכיתוב יושב מחוץ לחלל */
  const opsNear = new Set();
  { const R1 = Math.round(B.pxPerM * 1.0);
    /* הליכה מהכיתוב עד 1 מ׳ בלי לחצות קירות (קיר אמיתי בין חדר האוכל לחדר הכלים לא מעביר את ההרעלה) */
    for (const it of items) { if (!SERVICE(it)) continue; const cx = Math.round(it.u * w), cy = Math.round(it.v * h); if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue;
      const seen = new Map([[cy * w + cx, 0]]); const q = [cy * w + cx];
      while (q.length) { const i = q.shift(), d = seen.get(i); const id = R.lab[i]; if (id >= 0) opsNear.add(id); if (d >= R1) continue; const x = i % w;
        for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i >= w ? i - w : -1, i + w < w * h ? i + w : -1]) { if (j < 0 || seen.has(j) || R.walls[j]) continue; seen.set(j, d + 1); q.push(j); } } } }
  /* תיבה חוסמת לכל חלל; חלל בלי כיתוב שיושב (≥ 80% משטחו) בתוך התיבה של חלל תפעולי = חלק מהמטבח (מעבר בין דלפקים) */
  const bboxOf = m => { let x0 = w, y0 = h, x1 = 0, y1 = 0; for (let i = 0; i < w * h; i++) if (m[i]) { const x = i % w, y = (i - x) / w; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; } return { x0, y0, x1, y1 }; };
  regs.forEach(rg => { rg.bb = bboxOf(rg.mask); });
  const opsBoxes = regs.filter(rg => opsNear.has(rg.id) || items.some(it => it.cid === rg.id && SERVICE(it) && !/W\.?C\b|TOILET|RESTROOM|WASHROOM|LAVATOR|BATHROOM|HANDICAP|WOMEN|LADIES|GENTS|שירותים/i.test(it.t))).map(rg => rg.bb);
  const insideOps = rg => opsBoxes.some(b => { let n = 0, inb = 0; const m = rg.mask; for (let y = rg.bb.y0; y <= rg.bb.y1; y++) for (let x = rg.bb.x0; x <= rg.bb.x1; x++) { if (!m[y * w + x]) continue; n++; if (x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1) inb++; } return n && inb / n >= 0.8 && (b.x1 - b.x0) * (b.y1 - b.y0) > 1.5 * (rg.bb.x1 - rg.bb.x0) * (rg.bb.y1 - rg.bb.y0); });
  const wcZones = [], smallRooms = [];
  for (const rg of regs) {
    const labs = items.filter(it => it.cid === rg.id);
    const words = roomWords.get(rg.id) || [];
    const wcats = words.map(t => ({ t, cat: ptClassify(t) }));
    const aud = labs.filter(it => it.cat === 'audience').concat(wcats.filter(x => x.cat === 'audience'));
    const svc = labs.filter(SERVICE).concat(wcats.filter(x => x.cat === 'ops' || x.cat === 'service'));
    const m2 = rg.n / pxPerM2;
    const pas = labs.filter(it => it.cat === 'passage').concat(wcats.filter(x => x.cat === 'passage'));
    const isOps = opsNear.has(rg.id) || svc.some(x => !WC_RE.test(x.t)) || (!aud.length && insideOps(rg));   /* מטבח/תפעול גובר על הכל — שם אין מוזיקה */
    const isWC = !isOps && svc.some(x => WC_RE.test(x.t)) && m2 < 12;
    if (dbg) dbg.push({ id: rg.id, m2: +m2.toFixed(1), words, labs: labs.map(x => x.t), ops: isOps });
    if (isWC) { const poly = mkPoly(rg.mask); if (poly && poly.length >= 3) wcZones.push({ poly, m2 }); continue; }
    if (isOps && !aud.length) { skipped++; if (dbg) dbg[dbg.length - 1].why = 'service'; continue; }
    if (isOps && aud.length && m2 < 12) { skipped++; if (dbg) dbg[dbg.length - 1].why = 'service+aud-small'; continue; }
    /* ENTRANCE / VESTIBULE / CORRIDOR בלי כיתוב קהל — מעבר, לא אזור השמעה */
    if (pas.length && !aud.length) { skipped++; if (dbg) dbg[dbg.length - 1].why = 'passage'; continue; }
    /* אזור קהל זעיר (< 4 מ״ר) — רצועה ליד דלת, לא חלל שמנגנים בו */
    if (aud.length && m2 < 4) { skipped++; if (dbg) dbg[dbg.length - 1].why = 'aud-tiny'; continue; }
    /* חלל צר (פחות מ-1.2 מ׳ רוחב בכל מקום — מעבר בין דלפקים, רצועה ליד ציוד) בלי כיתוב קהל — לא אזור */
    if (!aud.length) { const er = ptErodeN(rg.mask, w, h, Math.max(1, Math.round(B.pxPerM * 0.6))); let any = 0; for (let i = 0; i < w * h && !any; i++) if (er[i]) any = 1; if (!any) { if (dbg) dbg[dbg.length - 1].why = 'thin'; continue; } }
    if (!aud.length && m2 < 5) {
      /* חדר קטן בלי כיתוב: לבד = מקרר / ארון (לא אזור); שניים או יותר צמודים = תאי שירותים (גברים/נשים/נגיש) → אזור שירותים אחד */
      if (m2 >= 1.5) { const poly = mkPoly(rg.mask); if (poly && poly.length >= 3) smallRooms.push({ poly, m2 }); }
      if (dbg) dbg[dbg.length - 1].why = 'small-unlabeled'; continue;
    }
    const poly = mkPoly(rg.mask); if (!poly || poly.length < 3) continue;
    let name, usage;
    /* שם: כיתוב שמרכזו בתוך החלל עדיף על כיתוב שרק נוגע בגבול (DECK ENTRANCE יושב על גבול חדר האוכל, לא בתוכו) */
    const inside = it => it.u != null && rg.mask[Math.round(it.v * h) * w + Math.round(it.u * w)];
    let best = null;
    if (aud.length) { best = aud.slice().sort((a, b) => (inside(b) ? 1 : 0) - (inside(a) ? 1 : 0) || b.t.length - a.t.length)[0]; name = best.t; usage = ptUsageOf(best.t); }
    else { name = 'חלל ' + (++idx); usage = (P.room && P.room.usage) || 'מוזיקת רקע'; }
    if (seenNames[name]) name += ' ' + (++seenNames[name]); else seenNames[name] = 1;
    const isOut = !!best && OUT_RE.test(best.t);
    const xs = poly.map(p => p.x), ys = poly.map(p => p.y), left = Math.min(...xs), top = Math.min(...ys);
    P.zones.push({ id: uid('z'), name, usage, poly, x: Math.max(0, 2200 - left - (Math.max(...xs) - left)), y: top, w: Math.max(...xs) - left, h: Math.max(...ys) - top, auto: 'partition', fromText: true, outdoor: isOut || undefined, dance: aud.some(x => /DANCE|ריקוד/i.test(x.t)) || undefined });
    made++; if (isOut) outdoor++;
    if (dbg) { dbg[dbg.length - 1].why = 'zone'; dbg[dbg.length - 1].name = name; }
  }
  /* שירותים סמוכים = אזור אחד (כלל המשתמש): קבוצות של תאי שירותים במרחק ≤ 1.5 מ׳ → מלבן מאחד.
     חדרים קטנים בלי כיתוב שצמודים זה לזה (≥ 2) מצטרפים כקבוצת שירותים; חדר קטן בודד נשאר בחוץ */
  const nearM = 1.5 / (P.scale || 0.02);
  const bbOf = z => { const xs = z.poly.map(p => p.x), ys = z.poly.map(p => p.y); return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) }; };
  const near = (a, b) => a.x0 < b.x1 + nearM && a.x1 > b.x0 - nearM && a.y0 < b.y1 + nearM && a.y1 > b.y0 - nearM;
  const smallBB = smallRooms.map(bbOf);
  smallBB.forEach((bb, i) => { if (smallBB.some((o, j) => j !== i && near(bb, o)) || wcZones.some(z => near(bb, bbOf(z)))) wcZones.push(smallRooms[i]); });
  const groups = [];
  for (const z of wcZones) {
    const xs = z.poly.map(p => p.x), ys = z.poly.map(p => p.y); const bb = { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
    const gI = groups.find(g => bb.x0 < g.x1 + nearM && bb.x1 > g.x0 - nearM && bb.y0 < g.y1 + nearM && bb.y1 > g.y0 - nearM);
    if (gI) { gI.x0 = Math.min(gI.x0, bb.x0); gI.y0 = Math.min(gI.y0, bb.y0); gI.x1 = Math.max(gI.x1, bb.x1); gI.y1 = Math.max(gI.y1, bb.y1); gI.n++; } else groups.push({ ...bb, n: 1 });
  }
  groups.forEach((g, i) => {
    const poly = [{ x: g.x0, y: g.y0 }, { x: g.x1, y: g.y0 }, { x: g.x1, y: g.y1 }, { x: g.x0, y: g.y1 }].map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));
    P.zones.push({ id: uid('z'), name: 'שירותים' + (groups.length > 1 ? ' ' + (i + 1) : ''), usage: 'מוזיקת רקע', poly, x: Math.max(0, 2200 - g.x0 - (g.x1 - g.x0)), y: g.y0, w: g.x1 - g.x0, h: g.y1 - g.y0, auto: 'partition', fromText: true, wc: true });
    made++;
  });
  save(); render();
  uiToast(made ? '🧩 ' + made + ' אזורים לפי הרצפות והקירות' + (skipped ? ' · ' + skipped + ' חללי שירות/תפעול הושמטו' : '') + (outdoor ? ' · ' + outdoor + ' בחוץ' : '') + ' — גרור נקודות לעריכה, אזור שנבלע מתמזג' : 'לא זוהו חללים — בדוק שהתכנית מכוילת ושהקירות כהים', 8000);
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
    <div style="display:flex;gap:4px;margin-top:6px"><button style="flex:1" onclick="P.planText.show=!(P.planText.show!==false);save();render()">${pt.show === false ? '👁 הצג על התכנית' : '🙈 הסתר מהתכנית'}</button><button style="flex:1" onclick="ptMakeZones()" title="אזור סאונד לכל כיתוב קהל — לפי גבולות החדר שסביבו (קירות בשרטוט)">🗺 אזורים סביב כיתובי הקהל</button><button style="flex:1;background:#eef7f1;border-color:#0f6e56;color:#0f6e56;font-weight:700" onclick="ptPartition()" title="כל חלל בין קירות = אזור (חוץ משירותים/מטבח/מחסן) — מוזיקה בכל מקום שיש בו לקוחות">🧩 חלק את כל החלל לאזורים</button>${(P.zones || []).some(z => z.fromText) ? `<button onclick="uiConfirm('לבנות מחדש את האזורים שנוצרו מהכיתובים? (אזורים שציירת ידנית נשארים)').then(ok=>{if(ok)ptMakeZones(true)})" title="מוחק את האזורים שנוצרו מכיתובים ובונה אותם שוב">🔄</button>` : ''}</div>
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
/* ===== 🪄 אזור בלחיצה אחת בתוך החדר =====
   קיר = רק מה שעבה (≥ ~12 ס״מ לפי הכיול) — פתיחה מורפולוגית מוחקת קווים דקים: מידות, ריהוט, טקסט, צנרת משורטטת.
   פתחים/דלתות עד ~1.2 מ׳ נסגרים זמנית (הרחבת הקירות) כדי שהמילוי לא יברח, ואחרי המילוי האזור מורחב חזרה עד הקירות.
   אזור כמעט-מלבני → מלבן נקי; אחרת מתאר מפושט. לחיצה בתוך אזור מוצע מחליפה אותו. */
var ROOMFILL = null;   /* מטמון מסכת הקירות לתמונה הנוכחית */
function rfBox(src, w, h, r, isMax) {   /* מינימום/מקסימום בחלון ריבועי (2r+1) — ניתן להפרדה: שורות ואז עמודות */
  const tmp = new Uint8Array(w * h), out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) { const o = y * w; let cnt = 0; for (let x = -r; x < w + r; x++) { const a = x + r, b = x - r - 1; if (a < w && a >= 0 && src[o + a]) cnt++; if (b >= 0 && b < w && src[o + b]) cnt--; if (x >= 0 && x < w) { const win = Math.min(w - 1, x + r) - Math.max(0, x - r) + 1; tmp[o + x] = isMax ? (cnt > 0 ? 1 : 0) : (cnt === win ? 1 : 0); } } }
  for (let x = 0; x < w; x++) { let cnt = 0; for (let y = -r; y < h + r; y++) { const a = y + r, b = y - r - 1; if (a < h && a >= 0 && tmp[a * w + x]) cnt++; if (b >= 0 && b < h && tmp[b * w + x]) cnt--; if (y >= 0 && y < h) { const win = Math.min(h - 1, y + r) - Math.max(0, y - r) + 1; out[y * w + x] = isMax ? (cnt > 0 ? 1 : 0) : (cnt === win ? 1 : 0); } } }
  return out;
}
async function rfWalls() {
  const key = (P.bg || '').length + '|' + P.scale + '|' + (P.bgW || 0) + '|' + JSON.stringify(P.virtWalls || []);
  if (ROOMFILL && ROOMFILL.key === key) return ROOMFILL;
  const img = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = P.bg; });
  const k = Math.min(1, 1600 / Math.max(img.width, img.height)), w = Math.round(img.width * k), h = Math.round(img.height * k);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.drawImage(img, 0, 0, w, h);
  const px = g.getImageData(0, 0, w, h).data, dark = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) { const l = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]; dark[i] = l < 185 ? 1 : 0; }
  const W = P.bgW || 1400, pxPerM = (w / W) / (P.scale || 0.01);
  const rThin = Math.max(1, Math.round(0.06 * pxPerM));   /* חצי עובי קיר מינימלי */
  const walls = rfBox(rfBox(dark, w, h, rThin, false), w, h, rThin, true);
  /* קירות וירטואליים שהמשתמש שרטט (Shift+גרירה) — סוגרים מעבר פתוח שבו האזור צריך להיגמר */
  { const L = bgLeft(), T = bgTop(), H = bgHeightPx(), t = Math.max(1, rThin);
    for (const vw of P.virtWalls || []) { const ax = (vw.a.x - L) / W * w, ay = (vw.a.y - T) / H * h, bx = (vw.b.x - L) / W * w, by = (vw.b.y - T) / H * h, steps = Math.ceil(Math.hypot(bx - ax, by - ay)) + 1;
      for (let k = 0; k <= steps; k++) { const cx = Math.round(ax + (bx - ax) * k / steps), cy = Math.round(ay + (by - ay) * k / steps); for (let dy = -t; dy <= t; dy++) for (let dx = -t; dx <= t; dx++) { const x = cx + dx, y = cy + dy; if (x >= 0 && y >= 0 && x < w && y < h) walls[y * w + x] = 1; } } } }
  ROOMFILL = { key, w, h, walls, pxPerM, bars: {} };
  return ROOMFILL;
}
function rfBarrier(R, gapM) { const g = Math.max(1, Math.round(gapM * R.pxPerM)); if (!R.bars[g]) R.bars[g] = rfBox(R.walls, R.w, R.h, g, true); return { gap: g, barrier: R.bars[g] }; }
/* מילוי מנקודה בתוך מחסום נתון → {reg, n, edge} או null כשהנקודה חסומה */
function rfFlood(R, barrier, sx, sy, gap) {
  const { w, h } = R;
  if (barrier[sy * w + sx]) { let best = null; for (let r = 1; r <= gap * 2 && !best; r++) for (let dy = -r; dy <= r && !best; dy++) for (let dx = -r; dx <= r; dx++) { const x = sx + dx, y = sy + dy; if (x >= 0 && y >= 0 && x < w && y < h && !barrier[y * w + x]) { best = [x, y]; break; } } if (!best) return null; [sx, sy] = best; }
  const reg = new Uint8Array(w * h), q = new Int32Array(w * h); let qh = 0, qt = 0, n = 0, edge = false;
  reg[sy * w + sx] = 1; q[qt++] = sy * w + sx;
  while (qh < qt) { const i = q[qh++]; n++; const x = i % w, y = (i - x) / w; if (x === 0 || y === 0 || x === w - 1 || y === h - 1) edge = true;
    for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (j >= 0 && !reg[j] && !barrier[j]) { reg[j] = 1; q[qt++] = j; } }
  return { reg, n, edge, gap };
}
/* הגאומטריה בלבד — בלי לשנות את הפרויקט: {poly, rect, left, top, zw, zh, m2, edge} או {err} */
async function zoneFillCore(pt) {
  if (!P.bg) { return { err: 'אין תכנית רקע' }; }
  if (!P.scale) { return { err: '📏 כייל קודם את התכנית — לפי הכיול יודעים מה עובי קיר' }; }
  const R = await rfWalls(), { w, h, walls } = R;
  const L = bgLeft(), T = bgTop(), W = P.bgW || 1400, H = bgHeightPx();
  const sx = Math.round((pt.x - L) / W * w), sy = Math.round((pt.y - T) / H * h);
  if (sx < 0 || sy < 0 || sx >= w || sy >= h) { return { err: 'לחץ בתוך התכנית' }; }
  /* סגירת פתחים מסתגלת: מתחילים מפתח צר ומרחיבים; כל עוד הרחבה נוספת מקטינה את השטח בחדות — המילוי ברח דרך פתח, ונסגר.
     עוצרים כשהשטח יציב. P.fillGap (אם נקבע ידנית) = נקודת ההתחלה */
  const GAPS = [0.4, 0.55, 0.75, 1.0, 1.3].filter(g => g >= (P.fillGap ? P.fillGap - 0.01 : 0));
  let best = null;
  for (let gi = 0; gi < GAPS.length; gi++) {
    const b = rfBarrier(R, GAPS[gi]), f = rfFlood(R, b.barrier, sx, sy, b.gap);
    if (!f) continue;
    if (!best) { best = f; continue; }
    if (f.n < 0.75 * best.n || (best.edge && !f.edge)) best = f; else break;
  }
  if (!best) { return { err: 'הלחיצה על קיר — לחץ באמצע החדר' }; }
  const { reg, n, edge, gap } = best;
  /* חזרה עד הקירות: הרחבה ברדיוס הפתח, רק על פיקסלים שאינם קיר */
  const grown = rfBox(reg, w, h, gap, true); for (let i = 0; i < w * h; i++) if (walls[i]) grown[i] = 0;
  /* הרכיב המחובר לנקודה בלבד (ההרחבה יכולה לדלוף דרך פתח לחדר השכן) — מוגבל לתחום המקורי + gap */
  let x0 = w, y0 = h, x1 = 0, y1 = 0, cnt = 0;
  for (let i = 0; i < w * h; i++) if (grown[i]) { const x = i % w, y = (i - x) / w; cnt++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const toC = (x, y) => ({ x: Math.round(L + x / w * W), y: Math.round(T + y / h * H) });
  const fill = cnt / ((x1 - x0 + 1) * (y1 - y0 + 1));
  let poly;
  if (fill >= 0.78) { const a = toC(x0, y0), b = toC(x1 + 1, y1 + 1); poly = [a, { x: b.x, y: a.y }, b, { x: a.x, y: b.y }]; }
  else { const tr = ptTrace(grown, w, h); const sp = tr.length >= 4 ? ptRdp(tr, Math.max(1.5, R.pxPerM * 0.2)) : []; if (sp.length < 3) { return { err: 'לא הצלחתי לקבוע גבול — צייר ידנית' }; } poly = sp.map(([x, y]) => toC(x, y)); }
  const xs = poly.map(p => p.x), ys = poly.map(p => p.y), left = Math.min(...xs), top = Math.min(...ys), zw = Math.max(...xs) - left, zh = Math.max(...ys) - top;
  return { poly, rect: fill >= 0.78, left, top, zw, zh, m2: Math.round(cnt / (R.pxPerM * R.pxPerM)), edge };
}
async function zoneFillAt(pt) {
  const G = await zoneFillCore(pt); if (!G) return; if (G.err) { uiToast(G.err, 6000); return; }
  const { poly, rect, left, top, zw, zh, m2, edge } = G;
  /* אזור מוצע/אוטומטי שהלחיצה בתוכו — מוחלף */
  const hit = (P.zones || []).filter(z => (z.prop || z.auto || z.fromText || z.fill) && inZone(z, pt));
  const z = { id: uid('z'), name: '', x: Math.max(0, 2200 - left - zw), y: top, w: zw, h: zh, fill: true };
  if (!rect) z.poly = poly;
  const lab = ((P.planText || {}).items || []).find(it => it.cat === 'audience' && inZone(z, ptPos(it)));
  const old = hit.find(o => o.name && !/^חלל \d+$/.test(o.name));
  z.name = (lab && lab.t) || (old && old.name) || ('אזור ' + ((P.zones || []).length + 1));
  if (old && old.usage) z.usage = old.usage; else if (lab && typeof ptUsageOf === 'function') z.usage = ptUsageOf(lab.t);
  if (hit.some(o => o.prop)) zoneLearnLog('fill', { replaced: hit.filter(o => o.prop).length });
  P.zones = (P.zones || []).filter(o => !hit.includes(o)); P.zones.push(z);
  selZone = z.id; if (typeof WIZ !== 'undefined' && WIZ) WIZ.zid = z.id;
  render(); save(); if (typeof wizRender === 'function' && document.getElementById('wiz')) wizRender();
  uiToast(`🪄 ${esc(z.name)} · ~${m2} מ״ר${hit.length ? ' · החליף ' + hit.length + ' אזור מוצע' : ''}${edge ? ' · ⚠ נוגע בשולי התכנית' : ''} — לחץ בחדר הבא, Esc לסיום`, 5000);
}
function roomFillMode(on) {
  window.__roomFill = on === undefined ? !window.__roomFill : !!on;
  document.body.style.cursor = window.__roomFill ? 'crosshair' : '';
  if (window.__roomFill) uiToast('🪄 לחץ בתוך חדר — האזור יתמלא עד הקירות. Esc לסיום', 5000);
  render(); if (typeof wizRender === 'function' && document.getElementById('wiz')) wizRender();
}
document.addEventListener('pointerdown', e => {
  if (!window.__roomFill || e.button || !e.target.closest || !e.target.closest('#canvasWrap')) return;
  e.stopPropagation(); e.preventDefault();
  if (e.shiftKey || window.__vwMode) { window.__vwDraw = { a: canvasPt(e), b: canvasPt(e) }; return; }   /* ✏ קיר וירטואלי */
  zoneFillAt(canvasPt(e));
}, true);
document.addEventListener('pointermove', e => { if (!window.__vwDraw) return; const p2 = canvasPt(e), a = window.__vwDraw.a;
  /* יישור לאופקי/אנכי כשכמעט ישר */ if (Math.abs(p2.x - a.x) < Math.abs(p2.y - a.y) * 0.15) p2.x = a.x; else if (Math.abs(p2.y - a.y) < Math.abs(p2.x - a.x) * 0.15) p2.y = a.y;
  window.__vwDraw.b = p2; renderZones(); }, true);
document.addEventListener('pointerup', e => { const d = window.__vwDraw; if (!d) return; window.__vwDraw = null; e.stopPropagation();
  if (Math.hypot(d.b.x - d.a.x, d.b.y - d.a.y) > 8) { P.virtWalls = [...(P.virtWalls || []), { a: d.a, b: d.b }]; window.__vwMode = false; save(); uiToast('✏ קיר וירטואלי נוסף — עכשיו לחץ שוב בתוך החדר', 4000); }
  renderZones(); if (typeof wizRender === 'function' && document.getElementById('wiz')) wizRender(); }, true);
function vwSvg() {
  const vs = [...(P.virtWalls || []), ...(window.__vwDraw ? [window.__vwDraw] : [])]; if (!vs.length || (!window.__roomFill && !window.__vwShow)) return '';
  return vs.map((v, i) => `<line x1="${v.a.x}" y1="${v.a.y}" x2="${v.b.x}" y2="${v.b.y}" stroke="#7b2cbf" stroke-width="5" stroke-dasharray="10 5" stroke-linecap="round"/>`).join('');
}
function vwUndo() { (P.virtWalls || []).pop(); save(); renderZones(); if (typeof wizRender === 'function') wizRender(); }
document.addEventListener('keydown', e => { if (window.__roomFill && e.key === 'Escape') roomFillMode(false); });
/* ===== 🔗 מיזוג אזורים (אשף + ידני) ===== */
var ZMSEL = [];   /* בחירה למיזוג בפאנל הידני */
function zonesMergeIds(ids) {
  const zs = ids.map(id => (P.zones || []).find(z => z.id === id)).filter(Boolean); if (zs.length < 2) return null;
  const area = z => { const b = zoneBounds(z); return b.W * b.H; };
  const keep = zs.find(z => !/^(חלל|אזור) \d+$/.test(z.name)) || zs.slice().sort((a, b) => area(b) - area(a))[0];
  const wasProp = zs.some(z => z.prop);
  zoneLearnLog('merge', { n: zs.length, prop: wasProp, m2: zs.map(z => zoneM2(z)) });
  zs.filter(z => z !== keep).forEach(z => ptMergeZones(keep.id, z.id));
  if (wasProp) keep.prop = true;
  selZone = keep.id; return keep;
}
function zoneMSel(id, on) { ZMSEL = ZMSEL.filter(x => x !== id); if (on) ZMSEL.push(id); render(); }
function zoneMergeSel() { const k = zonesMergeIds(ZMSEL); ZMSEL = []; if (k) { save(); render(); uiToast('🔗 אוחדו לאזור אחד: ' + k.name); } }
function zoneM2(z) { const b = zoneBounds(z); return P.scale ? Math.round(b.W * b.H * P.scale * P.scale) : 0; }
/* ===== 📚 לומד מהתיקונים של המשתמש באזורים המוצעים =====
   כל פעולה על הצעה נרשמת (store.zoneLearn — משותף לכל הפרויקטים): אישור/דחייה עם השטח והאם היה כיתוב, מיזוג, החלפה במילוי 🪄.
   בהצעה הבאה מוחלים הכללים שנלמדו:
   1. סינון — אזור בלי כיתוב קטן מסף שהמשתמש דוחה שוב ושוב לא מוצע.
   2. מיזוג אוטומטי — אחרי 2 מיזוגים: הצעות צמודות שאין ביניהן קיר עבה מתאחדות מראש.
   3. מילוי — אחרי 2 החלפות במילוי 🪄: כל הצעה מחושבת מחדש במילוי עד הקירות העבים (אם התוצאה סבירה). */
function zoneLearn() { store.zoneLearn = store.zoneLearn || { ev: [] }; return store.zoneLearn; }
function zoneLearnLog(kind, data) { const L = zoneLearn(); L.ev.push({ k: kind, t: Date.now(), p: P.id, ...data }); if (L.ev.length > 400) L.ev = L.ev.slice(-400); }
function zoneLearnRules() {
  const ev = zoneLearn().ev;
  const rej = ev.filter(e => e.k === 'reject' && !e.lab), ok = ev.filter(e => e.k === 'approve' && !e.lab);
  let minM2 = 0;
  for (const r of rej.map(e => e.m2).filter(v => v > 0).sort((a, b) => a - b)) { const nr = rej.filter(e => e.m2 <= r).length, na = ok.filter(e => e.m2 <= r).length; if (nr >= 2 && nr >= 2 * na) minM2 = r; }
  const merges = ev.filter(e => e.k === 'merge' && e.prop).length, fills = ev.filter(e => e.k === 'fill').reduce((s, e) => s + (e.replaced || 1), 0);
  return { minM2, autoMerge: merges >= 2, refill: fills >= 2, n: ev.length, merges, fills, rej: rej.length };
}
function zoneLearnLine() {
  const R = zoneLearnRules(); if (!R.n) return '';
  const on = [R.minM2 ? `לא מציע חללים בלי כיתוב עד ${R.minM2} מ״ר` : '', R.autoMerge ? 'ממזג מראש חללים צמודים בלי קיר עבה' : '', R.refill ? 'מחשב כל הצעה במילוי עד הקירות 🪄' : ''].filter(Boolean);
  return `<p class="hint" style="margin:6px 0 0;color:#4b3fb8">📚 למדתי מ-${R.n} תיקונים שלך${on.length ? ': ' + on.join(' · ') : ' (עוד לא מספיק כדי לשנות את ההצעות)'} · <a href="#" onclick="if(confirm('לאפס את מה שנלמד מהתיקונים?')){store.zoneLearn={ev:[]};save();render();if(typeof wizRender==='function')wizRender()}return false">איפוס</a></p>`;
}
/* האם יש קיר עבה בין שני אזורים צמודים: לאורך הגבול המשותף, איזה חלק ממנו חסום בקיר (עמודה/שורה ברצועה של ±25 ס״מ שיש בה פיקסל קיר).
   קיר אמיתי חוסם את רוב הגבול (למעט דלת); ריהוט/עמוד/דלפק — חלק קטן. מחזיר חלק 0..1, או null כשהאזורים לא צמודים */
async function zoneWallBetween(a, b) {
  const A = zoneBounds(a), B = zoneBounds(b), tol = P.scale ? 0.6 / P.scale : 25;
  const ox0 = Math.max(A.L, B.L), ox1 = Math.min(A.L + A.W, B.L + B.W), oy0 = Math.max(A.T, B.T), oy1 = Math.min(A.T + A.H, B.T + B.H);
  let horiz;   /* גבול אופקי (אחד מעל השני) או אנכי */
  if (ox1 - ox0 > 0 && Math.abs(oy1 - oy0) <= tol + Math.min(A.H, B.H) * 0.1 && (oy1 - oy0) < Math.min(A.H, B.H) * 0.3) horiz = true;
  else if (oy1 - oy0 > 0 && (ox1 - ox0) < Math.min(A.W, B.W) * 0.3 && ox1 - ox0 > -tol) horiz = false;
  else return null;
  const R = await rfWalls(), L = bgLeft(), T = bgTop(), W = P.bgW || 1400, H = bgHeightPx(), band = P.scale ? 0.25 / P.scale : 10;
  const toPx = (x, y) => [Math.round((x - L) / W * R.w), Math.round((y - T) / H * R.h)];
  const mid = horiz ? (oy0 + oy1) / 2 : (ox0 + ox1) / 2, s0 = horiz ? ox0 : oy0, s1 = horiz ? ox1 : oy1, N = 60;
  let blocked = 0, tot = 0;
  for (let k = 0; k <= N; k++) { const t = s0 + (s1 - s0) * k / N; let hit = false;
    for (let d = -band; d <= band && !hit; d += band / 6) { const [px, py] = horiz ? toPx(t, mid + d) : toPx(mid + d, t); if (px >= 0 && py >= 0 && px < R.w && py < R.h && R.walls[py * R.w + px]) hit = true; }
    tot++; if (hit) blocked++; }
  return tot ? blocked / tot : null;
}
async function zoneLearnApply(fresh) {
  const R = zoneLearnRules(), notes = [];
  if (!R.n || !fresh.length) return fresh;
  let list = fresh;
  if (R.minM2) { const drop = list.filter(z => /^חלל \d+$/.test(z.name) && zoneM2(z) <= R.minM2); if (drop.length) { P.zones = P.zones.filter(z => !drop.includes(z)); list = list.filter(z => !drop.includes(z)); notes.push(drop.length + ' קטנים סוננו'); } }
  if (R.refill && P.scale) { let n = 0; for (const z of list) { const b = zoneBounds(z), G = await zoneFillCore({ x: b.L + b.W / 2, y: b.T + b.H / 2 }); if (!G || G.err) continue; const r = G.m2 / Math.max(1, zoneM2(z)); if (r < 0.5 || r > 1.6) continue;
    z.x = Math.max(0, 2200 - G.left - G.zw); z.y = G.top; z.w = G.zw; z.h = G.zh; if (G.rect) delete z.poly; else z.poly = G.poly; z.fill = true; n++; } if (n) notes.push(n + ' חושבו במילוי'); }
  if (R.autoMerge) { let merged = 0, again = true; while (again) { again = false;
    for (let i = 0; i < list.length && !again; i++) for (let j = i + 1; j < list.length && !again; j++) { const f = await zoneWallBetween(list[i], list[j]); if (f != null && f < 0.5) { const k = zonesMergeIds([list[i].id, list[j].id]); zoneLearn().ev.pop(); /* מיזוג אוטומטי — לא נספר כתיקון של המשתמש */ list = list.filter(z => P.zones.includes(z)); if (k && !list.includes(k)) list.push(k); merged++; again = true; } } }
    if (merged) notes.push(merged + ' מוזגו'); }
  if (notes.length) uiToast('📚 לפי מה שלמדתי מהתיקונים שלך: ' + notes.join(' · '), 7000);
  return list;
}
