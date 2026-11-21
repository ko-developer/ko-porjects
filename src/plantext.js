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
  passage: { n: 'מעברים / כניסות', c: '#6b7b8c', ic: '🚪' },   /* הקטגוריה קיימת במילון (ENTRANCE / מסדרון) אבל לא הייתה כאן — PT_CATS[cat].c נפל, ופאנל האזור קרס */
  other: { n: 'כיתובים אחרים', c: '#8a8377', ic: '🔤' },
};
/* מילון סיווג — מילה/ביטוי (אנגלית + עברית) → קטגוריה; הראשון שמתאים מנצח, הספציפי לפני הכללי */
var PT_DICT = [
  ['level', /^[+\-±]\s?\d+[.,]\d{2,3}\b|\bFFL\b|\bSFL\b|\bLEVEL\b|\bLVL\b|\bFLOOR\s?\d|\bEL\.?\s?[+\-]?\d|\bRL\b|\bTOS\b|\bTOC\b|מפלס|קומה|גובה|ריצוף/i],
  ['service', /\bW\.?C\b|TOILET|RESTROOM|WASHROOM|LAVATOR|\bMEN\b|\bWOMEN\b|\bLADIES\b|\bGENTS\b|ACCESSIBLE|\bELEC\b|ELECTRIC|\bMEP\b|\bHVAC\b|\bAHU\b|\bSERVER\b|\bCOMMS\b|\bIT\s?ROOM\b|\bRACK\b|\bPLANT\b|MECHANICAL|UTILITY|\bFIRE\b|\bRISER\b|\bSHAFT\b|ELEVATOR|\bLIFT\b|\bSTAIR|JANITOR|\bCLEAN|\bDUCT\b|\bPUMP\b|\bGAS\b|\bWATER\b|שירותים|חשמל|טכני|מעלית|מדרגות|תקשורת|ניקיון|מיזוג|כיבוי|מים|גז|ממ"?ד|מקלט|מכונות|גנרטור|משאבות|חני+ה|נכים|מקלחות/i],
  ['passage', /ENTRANCE|\bENTRY\b|VESTIBULE|\bEXIT\b|CORRIDOR|HALLWAY|PASSAGE|\bVOID\b|\bכניסה\b|מבואה|יציאה|מסדרון/i],   /* כניסה / מסדרון — מעבר, לא אזור השמעה; לא מרעיל שכנים כמו מטבח */
  ['ops', /KITCHEN|\bPREP\b|\bKEG\b|CELLAR|REFUSE|\bBINS?\b|\bHOIST\b|\bCPD\b|BACK\s?OF\s?HOUSE|\bBOH\b|\bSTAFF\b|OFFICE|STORAGE|\bSTORE\b|\bDISH|\bWASH\b|LOADING|RECEIVING|DELIVER|WORKSHOP|\bCASH\b|MANAGER|\bKIOSK\b|CONCESSION|CONSESSION|PANTRY|\bCOLD\b|FREEZER|LOCKER|SECURITY|\bBACK\b|מטבח|מחסן|משרד|צוות|אחסון|הכנה|פריקה|קבלת|קופה|מנהל|קיוסק|דוכן|מלתחה|אבטחה|שטיפה|קירור|מקפיא|קצביה|יבשים|הנהלה|עובדים|אשפה/i],
  ['audience', /DANCE|\bSTAGE\b|\bBAR\b|\bPUB\b|\bSEATED\b|\bSTANDING\b|\bPERSONS\b|\bCOVERS\b|AUDITORIUM|LOUNGE|DINING|REST\s?AURANT|GENERAL\s?AREA|\bVIP\b|TERRACE|PATIO|GARDEN|OUTDOOR|\bLOBBY\b|RECEPTION|SEATING|\bHALL\b|\bCLUB\b|\bCAFE\b|\bGYM\b|STUDIO|\bPOOL\b|\bROOF|BALCONY|FOOD\s?COURT|\bAREA\b|\bZONE\b|\bROOM\b|WAITING|FOYER|\bDECK\b|\bSPA\b|\bSHOP\b|RETAIL|רחבה|במה|\bבר\b|מסעדה|אולם|לובי|מרפסת|חוץ|ישיבה|חדר כושר|סטודיו|בריכה|גן|טרקלין|אזור|חלל|קבלה|חנות|מועדון|אירועים|קהל|חצר|גינה|ספא|כיתה|חדר ישיבות|תצוגה|המתנה|חדר אוכל|סלון|פאטיו|אטריום|לאונג|טרסה/i],
  ['furniture', /\bTABLE|\bCHAIR|\bSOFA|\bBOOTH|COUNTER|\bSTOOL|\bBENCH|\bDESK\b|\bSHELF|\bSHELV|\bBED\b|\bISLAND\b|CABINET|\bTV\b|SCREEN|PLANTER|\bSEAT\b|שולחן|כיסא|ספה|דלפק|מדף|ארון|מיטה|מסך/i],
];
function ptClassify(t) {
  t = String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');   /* "Café" = CAFE */
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
  const mk = async () => { const wk = await Tesseract.createWorker(lang || 'eng+heb'); await wk.setParameters({ preserve_interword_spaces: '1', tessedit_pageseg_mode: '11' }); return wk; };
  const pass = async (worker, canvas, frame, map) => {
    const res = await worker.recognize(canvas);
    const out = [];
    for (const w of (res.data.words || [])) {
      const t = (w.text || '').replace(/[|_~`^]/g, '').trim();
      if (!t || w.confidence < (frame === 'h' ? 55 : 68)) continue;
      if (!/[A-Za-z֐-׿]{2,}|^[+\-±]?\d+[.,]\d{2,3}$|^1\s*[:\/]\s*\d{2,4}$/.test(t)) continue;   /* מילים בלבד (או מפלס, או קנה מידה "1:50") — מספרי מידות לא נשמרים */
      const bb = w.bbox; const p = map((bb.x0 + bb.x1) / 2, (bb.y0 + bb.y1) / 2);
      out.push({ t, x: p.x, y: p.y, w: bb.x1 - bb.x0, h: bb.y1 - bb.y0, frame, c: w.confidence });
    }
    return out;
  };
  if (frames === 'h') { const w0 = await mk(); try { return await pass(w0, cv, 'h', (x, y) => ({ x, y })); } finally { await w0.terminate(); } }
  const rot = ang => { const rc = document.createElement('canvas'); rc.width = cv.height; rc.height = cv.width; const g = rc.getContext('2d'); g.translate(rc.width / 2, rc.height / 2); g.rotate(ang); g.drawImage(cv, -cv.width / 2, -cv.height / 2); return rc; };
  /* שלושת הכיוונים (אופקי + שני סיבובים) במקביל, כל אחד במנוע משלו — במקום ~25 שניות ברצף */
  const ws = await Promise.all([mk(), mk(), mk()]);
  try { const parts = await Promise.all([pass(ws[0], cv, 'h', (x, y) => ({ x, y })), pass(ws[1], rot(Math.PI / 2), 'v', (x, y) => ({ x: y, y: cv.height - x })), pass(ws[2], rot(-Math.PI / 2), 'w', (x, y) => ({ x: cv.width - y, y: x }))]); return parts.flat(); }
  finally { await Promise.all(ws.map(wk => wk.terminate().catch(() => {}))); }
}
/* ===== הצעד הראשון: קנה המידה מטבלת הכותרת שבשולי הגיליון — רצועות הצד/התחתית מוגדלות פי כמה, OCR ממוקד ל-"1:N"
   (הכיתוב בטבלת הכותרת קטן ולעיתים בפונט מתאר דק — הסריקה הכללית מפספסת אותו). הרצועות: ימין, שמאל, תחתית, עליון; רצועות הצד גם מסובבות ===== */
/* הסרת קווים ישרים ארוכים (מסגרות טבלת הכותרת, קירות) לפני OCR — טסרקט מתייחס לטבלה מסורגת כגרפיקה ומפספס את הטקסט שבתאים.
   ריצה שחורה ארוכה מ-12% מהצלע הקצרה נצבעת לבן; משיכות אותיות קצרות בהרבה ונשארות */
function ocrStripLines(id, cw, ch) {
  const px = id.data, bin = new Uint8Array(cw * ch), minLen = Math.round(Math.min(cw, ch) * 0.12);
  for (let i = 0, j = 0; i < px.length; i += 4, j++) bin[j] = px[i] < 128 ? 1 : 0;
  for (let y = 0; y < ch; y++) { let run = 0; for (let x = 0; x <= cw; x++) { const v = x < cw ? bin[y * cw + x] : 0; if (v) run++; else { if (run >= minLen) for (let x2 = x - run; x2 < x; x2++) bin[y * cw + x2] = 2; run = 0; } } }
  for (let x = 0; x < cw; x++) { let run = 0; for (let y = 0; y <= ch; y++) { const v = y < ch ? (bin[y * cw + x] ? 1 : 0) : 0; if (v) run++; else { if (run >= minLen) for (let y2 = y - run; y2 < y; y2++) bin[y2 * cw + x] = 2; run = 0; } } }
  for (let j = 0, i = 0; j < bin.length; j++, i += 4) if (bin[j] === 2) px[i] = px[i + 1] = px[i + 2] = 255;
}
/* ===== ⚡ קנה מידה בשניות (אורי, 21.11.2026): מאתרים את הכיתוב "1:N" לפי הצורה שלו, וקוראים רק אותו =====
   OCR על רצועות שוליים שלמות לוקח עשרות שניות ונכשל כשהכיתוב קטן או לא בשוליים. כאן:
   1. התמונה ברזולוציה מלאה (ה-PDF כפי שרונדר בהעלאה, לפני ההקטנה) הופכת לשחור-לבן ומפורקת לרכיבים מחוברים (אות = רכיב).
   2. נקודתיים = שתי נקודות קטנות ודומות אחת מעל השנייה, בלי נקודות נוספות סביבן (לא רסטר / קו מקווקו);
      משמאל להן אות צרה אחת ("1") ומימין שרשרת של 2–4 אותיות באותו גובה (ספרות).
   3. רק המלבנים הקטנים האלה נקראים ב-OCR (ספרות בלבד, כמה קריאות והצבעה), ועוד קריאה של השורה שסביבם בשביל התווית
      קנ"מ / SCALE, כותרת השרטוט (תכנית / חתך / פרט) ו-"@ A1".
   כל התהליך שניות בודדות, בכל מקום בגיליון — לא רק בשוליים. נבדק על 21 תכניות מהרשת (CLAUDE.md). */
function ptCCL(bin, W, H, maxSide) {
  let cap = 1 << 18, par = new Int32Array(cap), bx0 = new Int32Array(cap), bx1 = new Int32Array(cap), by0 = new Int32Array(cap), by1 = new Int32Array(cap), ar = new Int32Array(cap), n = 0;
  const grow = () => { const c2 = cap * 2, g = a => { const b = new Int32Array(c2); b.set(a); return b; }; par = g(par); bx0 = g(bx0); bx1 = g(bx1); by0 = g(by0); by1 = g(by1); ar = g(ar); cap = c2; };
  const find = i => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; };
  const half = (W >> 1) + 2; let pS = new Int32Array(half), pE = new Int32Array(half), pL = new Int32Array(half), pn = 0, cS = new Int32Array(half), cE = new Int32Array(half), cL = new Int32Array(half), cn = 0;
  for (let y = 0; y < H; y++) {
    cn = 0; let x = 0, j = 0; const row = y * W;
    while (x < W) {
      if (!bin[row + x]) { x++; continue; }
      const s = x; while (x < W && bin[row + x]) x++; const e = x - 1;
      while (j < pn && pE[j] < s - 1) j++;
      let l = -1;
      for (let jj = j; jj < pn && pS[jj] <= e + 1; jj++) { const r = find(pL[jj]); if (l < 0) l = r; else if (r !== l) par[r] = l; }
      if (l < 0) { if (n >= cap) grow(); l = n++; par[l] = l; bx0[l] = s; bx1[l] = e; by0[l] = y; by1[l] = y; ar[l] = 0; }
      if (s < bx0[l]) bx0[l] = s; if (e > bx1[l]) bx1[l] = e; by1[l] = y; ar[l] += e - s + 1;
      cS[cn] = s; cE[cn] = e; cL[cn] = l; cn++;
    }
    let t = pS; pS = cS; cS = t; t = pE; pE = cE; cE = t; t = pL; pL = cL; cL = t; pn = cn;
  }
  for (let i = 0; i < n; i++) { const r = find(i); if (r === i) continue; if (bx0[i] < bx0[r]) bx0[r] = bx0[i]; if (bx1[i] > bx1[r]) bx1[r] = bx1[i]; if (by0[i] < by0[r]) by0[r] = by0[i]; if (by1[i] > by1[r]) by1[r] = by1[i]; ar[r] += ar[i]; }
  const out = [];
  for (let i = 0; i < n; i++) { if (par[i] !== i) continue; const w = bx1[i] - bx0[i] + 1, h = by1[i] - by0[i] + 1; if (w > maxSide || h > maxSide) continue; out.push({ x0: bx0[i], x1: bx1[i], y0: by0[i], y1: by1[i], w, h, a: ar[i] }); }
  return out;
}
/* מועמדים ל-"1:N" לפי הצורה. מחזיר מלבנים בקואורדינטות של תמונת העבודה (W×H). probe = {x,y,r} (פיקסלים) לדיבוג: למה נפסל מה שסביב הנקודה */
function ptColonCands(bin, W, H, probe) {
  const comps = ptCCL(bin, W, H, 130);
  const dots = [], gly = [], rej = {}, plog = [];
  for (const c of comps) {
    if (c.w <= 14 && c.h <= 14 && Math.max(c.w, c.h) >= 2 && Math.max(c.w, c.h) <= 3 * Math.min(c.w, c.h) + 1 && c.a >= 0.45 * c.w * c.h) dots.push(c);   /* כולל נקודה של גופן שרטוט דק (SHX): קו ברוחב פיקסל אחד */
    if (c.h >= 7 && c.h <= 120 && c.w <= 1.25 * c.h + 2) gly.push(c);
  }
  const DC = 16, GC = 32, DW = Math.ceil(W / DC) + 1, GW = Math.ceil(W / GC) + 1, dB = new Map(), gB = new Map();
  const put = (m, k, v) => { const a = m.get(k); if (a) a.push(v); else m.set(k, [v]); };
  for (const d of dots) { d.cx = (d.x0 + d.x1) / 2; d.cy = (d.y0 + d.y1) / 2; d.s = Math.max(d.w, d.h); put(dB, (d.cy / DC | 0) * DW + (d.cx / DC | 0), d); }
  for (const c of gly) put(gB, (((c.y0 + c.y1) / 2) / GC | 0) * GW + (((c.x0 + c.x1) / 2) / GC | 0), c);
  const dotsIn = (x0, y0, x1, y1, f) => { for (let r = Math.max(0, y0 / DC | 0); r <= (y1 / DC | 0); r++) for (let q = Math.max(0, x0 / DC | 0); q <= (x1 / DC | 0); q++) { const a = dB.get(r * DW + q); if (a) for (const d of a) if (d.cx >= x0 && d.cx <= x1 && d.cy >= y0 && d.cy <= y1) if (f(d)) return true; } return false; };
  const glyIn = (x0, y0, x1, y1) => { const o = []; for (let r = Math.max(0, y0 / GC | 0); r <= (y1 / GC | 0); r++) for (let q = Math.max(0, x0 / GC | 0); q <= (x1 / GC | 0); q++) { const a = gB.get(r * GW + q); if (a) for (const c of a) o.push(c); } return o; };
  const out = [];
  for (const a of dots) {
    let hit = null;
    dotsIn(a.cx - 4, a.y1 + 1, a.cx + 4, a.y1 + Math.min(48, 8 * a.s) + 8, b => {
      if (b === a || b.y0 <= a.y1) return false; const d = b.cy - a.cy;
      if (d > 8 * a.s || d > 48 || b.y0 - a.y1 - 1 < Math.max(1, 0.4 * a.s)) return false;
      if (Math.abs(b.cx - a.cx) > Math.max(1.5, 0.4 * a.s) || Math.abs(b.s - a.s) > Math.max(1.5, 0.5 * a.s)) return false;
      hit = b; return true; });
    const b = hit; if (!b) continue;
    const inP = probe && Math.abs(a.cx - probe.x) < probe.r && Math.abs(a.cy - probe.y) < probe.r;
    const no = why => { rej[why] = (rej[why] || 0) + 1; if (inP) plog.push(why + ' @' + Math.round(a.cx) + ',' + Math.round(a.cy) + ' s' + a.s + ' d' + (b.cy - a.cy)); };
    const d = b.cy - a.cy, cx0 = Math.min(a.x0, b.x0), cx1 = Math.max(a.x1, b.x1), cxm = (cx0 + cx1) / 2;
    /* אות שהנקודתיים "יושבות" בגובה שלה: ראשה מעל הנקודה העליונה, בסיסה ליד הנקודה התחתונה */
    const fits = c => c !== a && c !== b && c.h >= 1.4 * d && c.h <= 5.2 * d && c.y0 <= a.y0 + 0.12 * c.h && Math.abs(c.y1 - b.y1) <= 0.25 * c.h + 1;
    const around = glyIn(cx0 - 7 * d - 80, a.y0 - 5.5 * d, cx1 + 30 * d + 160, b.y1 + 2 * d), near = around.filter(fits);
    let L = null, R = null;
    for (const c of near) { const gl = cx0 - c.x1, gr = c.x0 - cx1; if (gl >= -1 && gl <= 1.4 * c.h && (!L || gl < cx0 - L.x1)) L = c; if (gr >= -1 && gr <= 1.4 * c.h && (!R || gr < R.x0 - cx1)) R = c; }
    if (!L) { no('noL'); continue; } if (!R) { no('noR'); continue; }
    if (L.w > 0.72 * L.h) { no('wideL'); continue; } if (Math.abs(R.h - L.h) > 0.3 * L.h) { no('hDiff'); continue; }
    if (R.w > 0.9 * R.h) { no('wideR'); continue; }   /* ספרה צרה מגובהה; "@" ו-"A" לא */
    const Hh = Math.max(L.h, R.h), chain = [R]; let last = R;
    /* שרשרת הספרות נעצרת ברווח, באות רחבה ("@") או בגובה אחר */
    /* האות הצמודה הבאה נבחרת מכל הרכיבים (גם "@" שגבוה מהספרות) — אם היא לא ספרה, השרשרת נגמרת שם ולא מדלגת מעליה ("1:75@A1" אינו "1:751") */
    for (;;) { let nx = null; for (const c of around) { const gp = c.x0 - last.x1; if (c === last || c === a || c === b || gp < -1 || gp > 0.7 * Hh || c.h < 0.5 * Hh) continue; if (Math.min(c.y1, last.y1) - Math.max(c.y0, last.y0) < 0.5 * Math.min(c.h, last.h)) continue; if (!nx || gp < nx.x0 - last.x1) nx = c; }
      if (!nx || !fits(nx) || Math.abs(nx.h - Hh) > 0.3 * Hh || nx.w > 0.9 * nx.h || chain.length >= 5) break; chain.push(nx); last = nx; }
    if (chain.length < 2) { no('chain'); continue; }
    /* עוד אות צמודה משמאל ל-"1" = מספר ארוך / מילה ("11:30"), לא קנה מידה */
    if (near.some(c => c !== L && L.x0 - c.x1 >= -1 && L.x0 - c.x1 <= 0.3 * Hh && Math.abs(c.h - Hh) <= 0.3 * Hh)) { no('leftAdj'); continue; }
    /* בידוד: נקודות נוספות סביב הנקודתיים = רסטר נקודות / קו מקווקו */
    if (dotsIn(cxm - 1.2 * d, a.cy - 1.3 * d, cxm + 1.2 * d, b.cy + 1.3 * d, o => o !== a && o !== b)) { no('iso'); continue; }
    const top = Math.min(L.y0, ...chain.map(c => c.y0)), bot = Math.max(L.y1, ...chain.map(c => c.y1));
    out.push({ x0: L.x0, x1: last.x1, dx0: chain[0].x0, y0: top, y1: bot, H: Hh, digits: chain.length, cx: cxm, gb: chain.map(c => [c.x0, c.y0, c.x1, c.y1]), fill: chain.reduce((s2, c) => s2 + c.a, 0) / chain.reduce((s2, c) => s2 + c.w * c.h, 0) });
    if (inP) plog.push('OK @' + Math.round(a.cx) + ',' + Math.round(a.cy) + ' dg' + chain.length);
  }
  /* אותו כיתוב פעמיים (נקודה שנשברה לשני רכיבים) */
  const uniq = [];
  for (const c of out.sort((p, q) => q.H - p.H)) if (!uniq.some(u => Math.abs(u.cx - c.cx) < c.H && Math.abs((u.y0 + u.y1) / 2 - (c.y0 + c.y1) / 2) < c.H)) uniq.push(c);
  return { cands: uniq, nComps: comps.length, nDots: dots.length, nGly: gly.length, rej, plog };
}
/* טבלה של יחסים (תקן חניה: "1:50", "1:200", "1:300" בתאים סמוכים) אינה קנה מידה. list = [{n, cx, cy, H}] — מסמן tbl:
   תא שסביבו (עד 3.5 גבהי אות למעלה/למטה, 32 לצדדים, אותו גובה אות) שני ערכים שונים ממנו ויותר, ולפחות אחד מהם בעמודה אחרת
   (עמודה אחת של ערכים = רשימת השרטוטים בטבלת הכותרת, לא טבלת יחסים); ואז גם תא שצמוד לתא מסומן (שורת הקצה של הטבלה) */
function ptTblFlag(list) {
  const near = (c, o) => o !== c && Math.abs(o.H - c.H) <= 0.15 * c.H && Math.abs(o.cy - c.cy) <= 3.5 * c.H && Math.abs(o.cx - c.cx) <= 32 * c.H;
  for (const c of list) { const nb = list.filter(o => near(c, o) && o.n !== c.n); c.tbl = nb.length >= 2 && nb.some(o => Math.abs(o.cx - c.cx) > 3 * c.H); }
  for (let again = true; again;) { again = false; for (const c of list) if (!c.tbl && list.some(o => o.tbl && near(c, o))) { c.tbl = true; again = true; } }
  return list;
}
/* בחירת קנה המידה מתוך כל הכיתובים שנקראו: [{n, lbl (תווית קנ"מ לידו), plan (כותרת תכנית/קומה), sect (חתך/חזית/פרט)}] */
function ptScalePick(vals) {
  if (!vals || !vals.length) return null;
  const nice = typeof asNiceRatios === 'function' ? asNiceRatios() : [10, 20, 25, 50, 100, 200, 250, 500];
  const cnt = arr => { const m = new Map(); arr.forEach(v => m.set(v.n, (m.get(v.n) || 0) + 1)); return [...m.entries()].sort((p, q) => q[1] - p[1]); };
  const all = cnt(vals), rest = n => all.map(x => x[0]).filter(m => m !== n);
  if (all.length === 1 && !vals.every(v => v.tbl)) { const n = all[0][0]; return { n, weak: !(nice.includes(n) || vals.some(v => v.lbl)), lbl: vals.some(v => v.lbl) }; }
  /* כמה ערכים שונים בגיליון (תכניות, חתכים, פרטים, טבלאות של יחסים): רק כיתובים עם התווית קנ"מ / SCALE נחשבים, אם יש כאלה;
     מתוכם כותרת של תכנית/קומה גוברת על חתך/פרט; אחרת ערך שחוזר הרבה יותר מהאחרים; אחרת המשתמש בוחר */
  const real = vals.filter(v => !v.tbl); if (!real.length) return null;   /* tbl = תא בטבלה של יחסים (תקן חניה "1:50") — לא קנה מידה; רק טבלה = לא נמצא (במסלול שכבת הטקסט זה מעביר ל-OCR) */
  const use = real;
  const one = (arr, note) => { const d = [...new Set(arr.map(v => v.n))]; return d.length === 1 ? { n: d[0], lbl: arr.some(v => v.lbl), weak: !arr.some(v => v.lbl) && !nice.includes(d[0]), note, others: rest(d[0]) } : null; };
  /* titled = כיתוב עם תווית קנ"מ או כותרת תכנית, שאינו חתך/פרט. כשיש כמה כאלה עם ערכים שונים (טבלת הכותרת אומרת 1:500, התכניות 1:250) — לא מנחשים */
  const titled = use.filter(v => (v.lbl || v.plan) && !v.sect), noSect = use.filter(v => !v.sect);
  const r1 = one(use, 'label') || (titled.length ? one(titled, 'label') : (noSect.length && one(noSect, 'plan')));
  if (r1) return r1;
  /* ערך שחוזר הרבה יותר מהאחרים — הספירה על כל המופעים של הערכים שבמאגר */
  const pool = titled.length ? titled : noSect.length ? noSect : use, ns = new Set(pool.map(v => v.n)), c = cnt(use.filter(v => ns.has(v.n)));
  if (c.length > 1 && c[0][1] >= 3 && c[0][1] >= 3 * c[1][1]) return { n: c[0][0], lbl: true, note: 'most', others: rest(c[0][0]) };
  return { multi: c.map(x => x[0]).slice(0, 5) };
}
/* "1:50 @ A1 / 1:100 @ A3": קנה המידה תלוי בגודל הדף שעליו הודפס. pairs = [{n, fmt:'A1'}], pageMm = [w,h] של הדף בפועל (אם ידוע) */
var PT_A_MM = { A0: 1189, A1: 841, A2: 594, A3: 420, A4: 297 };
function ptScaleAtSheet(pairs, pageMm) {
  if (!pairs || !pairs.length) return null;
  const nice = typeof asNiceRatios === 'function' ? asNiceRatios() : [];
  if (pageMm && pageMm[0] && pageMm[1]) {
    const long = Math.max(pageMm[0], pageMm[1]);
    const exact = pairs.find(p => Math.abs(PT_A_MM[p.fmt] - long) <= PT_A_MM[p.fmt] * 0.04); if (exact) return { n: exact.n, sheet: exact.fmt, note: 'fmt' };
    /* הדף בפועל בגודל אחר מאלה שכתובים: יחס ישר (1:50 על A1 = 1:100 על A3) */
    const p = pairs[0], n0 = p.n * PT_A_MM[p.fmt] / long, n = nice.find(v => Math.abs(v - n0) <= v * 0.03) || Math.round(n0);
    return { n, note: 'fmt', weak: !nice.includes(n) };
  }
  const big = pairs.slice().sort((p, q) => PT_A_MM[q.fmt] - PT_A_MM[p.fmt])[0];   /* בלי גודל דף: הגיליון המקורי (הגדול) */
  return { n: big.n, sheet: big.fmt, note: 'fmt', weak: true };
}
var PT_SC_LABEL = /קנ\s?["״׳']?\s?מ|קנמ|ק\s?[."״׳']\s?מ|SCALE|קנה\s?מ[יד]+ה|ECHELLE|MASSSTAB|MAßSTAB/i, PT_SC_PLAN = /תכנית|תוכנית|קומ[הת]|קרקע|מפלס|PLAN|FLOOR|LEVEL|LAYOUT/i, PT_SC_SECT = /חת[ךרכד]|חזית|פרט|פריסה|רמפה|מדרגות|SECTION|ELEVATION|DETAIL|RAMP|STAIR/i;   /* חת[ךרכד]: ה-OCR קורא "חתר" */
async function ptScaleFast(src, opts) {
  opts = opts || {};
  const T0 = performance.now(), dbg = window.__ptFastDbg = { t: {} }, budget = opts.budget || 8000, left = () => budget - (performance.now() - T0);
  const SW = src.width, SH = src.height; if (!SW || !SH) return null;
  const tessP = window.Tesseract ? Promise.resolve() : loadScript('https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js');
  /* תמונת העבודה: המקור עצמו עד 64MP; גיליון ענק מוקטן, תמונה קטנה מוגדלת (נקודות של 1px לא מזוהות) */
  const area = SW * SH, MAXPX = 64e6, k = area > MAXPX ? Math.sqrt(MAXPX / area) : (area < 5e6 ? Math.min(2, Math.sqrt(12e6 / area)) : 1);
  const W = Math.round(SW * k), H = Math.round(SH * k);
  let g;
  if (k === 1 && src.getContext) g = src.getContext('2d');
  else { const wc = document.createElement('canvas'); wc.width = W; wc.height = H; g = wc.getContext('2d', { willReadFrequently: true }); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, W, H); }
  const thr = opts.thr || 190, bin = new Uint8Array(W * H), BAND = 512;
  for (let y = 0; y < H; y += BAND) { const hh = Math.min(BAND, H - y), d = g.getImageData(0, y, W, hh).data; let o = y * W; for (let i = 0; i < d.length; i += 4, o++) if (d[i + 3] > 40 && d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114 < thr) bin[o] = 1; }
  dbg.t.bin = Math.round(performance.now() - T0); dbg.k = +k.toFixed(3); dbg.W = W; dbg.H = H;
  const pr = window.__ptFastProbe, found = ptColonCands(bin, W, H, pr ? { x: pr.x * W, y: pr.y * H, r: (pr.r || 0.03) * W } : null);
  dbg.t.cc = Math.round(performance.now() - T0); dbg.nComps = found.nComps; dbg.nDots = found.nDots; dbg.nCands = found.cands.length; dbg.rej = found.rej; dbg.plog = found.plog;
  if (pr && window.__ptFastKeep) { try { const r = Math.round((pr.r || 0.03) * W), x0 = Math.max(0, Math.round(pr.x * W - r)), y0 = Math.max(0, Math.round(pr.y * H - r * 0.6)), cw = Math.min(W - x0, r * 2), ch = Math.min(H - y0, Math.round(r * 1.2)), pc = document.createElement('canvas'); pc.width = cw; pc.height = ch; const pg = pc.getContext('2d'), id = pg.createImageData(cw, ch); for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const v = bin[(y0 + y) * W + x0 + x] ? 0 : 255, o = (y * cw + x) * 4; id.data[o] = id.data[o + 1] = id.data[o + 2] = v; id.data[o + 3] = 255; } pg.putImageData(id, 0, 0); dbg.probeImg = pc.toDataURL('image/png'); } catch (e) {} }
  const cands = found.cands.slice(0, 40);
  if (!cands.length) return null;
  await tessP;
  /* חיתוך מהמקור (רזולוציה מלאה), מוגדל כך שגובה האות ~target px, שחור-לבן; dil = עיבוי קו דק; strip = מחיקת קווי טבלה ארוכים */
  const cut = (x0, y0, x1, y1, Hh, target, dil, strip) => {
    x0 = Math.max(0, x0 / k); y0 = Math.max(0, y0 / k); x1 = Math.min(SW, x1 / k); y1 = Math.min(SH, y1 / k);
    const z = Math.max(0.4, Math.min(6, target / Math.max(4, Hh / k))), pad = 16, cw = Math.round((x1 - x0) * z) + pad * 2, ch = Math.round((y1 - y0) * z) + pad * 2;
    const c = document.createElement('canvas'); c.width = cw; c.height = ch; const cg = c.getContext('2d', { willReadFrequently: true }); cg.fillStyle = '#fff'; cg.fillRect(0, 0, cw, ch); cg.imageSmoothingQuality = 'high';
    cg.drawImage(src, x0, y0, x1 - x0, y1 - y0, pad, pad, cw - pad * 2, ch - pad * 2);
    const id = cg.getImageData(0, 0, cw, ch), px = id.data, b = new Uint8Array(cw * ch);
    for (let i = 0, j = 0; i < px.length; i += 4, j++) b[j] = px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114 < thr ? 1 : 0;
    if (strip) { const minLen = Math.round(target * 6);
      for (let y = 0; y < ch; y++) { let run = 0; for (let x = 0; x <= cw; x++) { const v = x < cw ? b[y * cw + x] : 0; if (v) run++; else { if (run >= minLen) for (let x2 = x - run; x2 < x; x2++) b[y * cw + x2] = 2; run = 0; } } }
      for (let x = 0; x < cw; x++) { let run = 0; for (let y = 0; y <= ch; y++) { const v = y < ch ? (b[y * cw + x] ? 1 : 0) : 0; if (v) run++; else { if (run >= Math.round(target * 2.2)) for (let y2 = y - run; y2 < y; y2++) b[y2 * cw + x] = 2; run = 0; } } }
      for (let j = 0; j < b.length; j++) if (b[j] === 2) b[j] = 0; }
    for (let q = 0; q < (+dil || 0); q++) { const b2 = b.slice(); for (let y = 1; y < ch - 1; y++) for (let x = 1; x < cw - 1; x++) { const j = y * cw + x; if (!b2[j] && (b2[j - 1] || b2[j + 1] || b2[j - cw] || b2[j + cw])) b[j] = 1; } }
    for (let i = 0, j = 0; i < px.length; i += 4, j++) px[i] = px[i + 1] = px[i + 2] = b[j] ? 0 : 255;
    cg.putImageData(id, 0, 0); return c;
  };
  const norm = t => String(t || '').replace(/[‏‎]/g, '').replace(/[∶：;]/g, ':');
  const nice = typeof asNiceRatios === 'function' ? asNiceRatios() : [];
  /* ל-Tesseract נשלח data-URL ולא canvas: עם canvas הספרייה קוראת ל-toBlob, ובחלון שאינו בפוקוס הדפדפן מעכב את ה-callback בשנייה שלמה —
     כל קריאה של מלבן זעיר לקחה ~1,030ms במקום ~20ms (נמדד), וכל הסריקה 8 שניות במקום שנייה */
  const png = cv2 => cv2.toDataURL('image/png');
  let wDig = null, wTxt = null; const vals = [], pairs = [];
  try {
    [wDig, wTxt] = await Promise.all([Tesseract.createWorker('eng'), Tesseract.createWorker('eng+heb')]);
    await Promise.all([wDig.setParameters({ tessedit_char_whitelist: '0123456789:', tessedit_pageseg_mode: '7' }), wTxt.setParameters({ preserve_interword_spaces: '1', tessedit_pageseg_mode: '6' })]);
    dbg.t.workers = Math.round(performance.now() - T0);
    /* הערך. המבנה כבר ידוע ("1", נקודתיים, N ספרות), ולכן קוראים גם את הכיתוב כולו וגם את הספרות לבדן, ומצביעים:
       OCR של ספרות בגופן שרטוט (SHX) טועה לפעמים ("1:250" → "1:230"), ושתי קריאות שונות לא טועות אותו דבר */
    /* מצב הקריאה חשוב: "שורה" (7) קורא "1:250" בגופן שרטוט דק כ-"1:230"; "מילה אחת" (8) ו"שורה גולמית" (13) עם עיבוי קו קוראים נכון — נבדק על 4 כיתובים כאלה, 14 צירופים */
    let psmNow = '7';
    const dg = async (x0, x1, cd, target, dil, psm) => { const c = cut(x0 - 1, cd.y0 - 2, x1 + 1, cd.y1 + 2, cd.H, target, dil); if (psm !== psmNow) { await wDig.setParameters({ tessedit_pageseg_mode: psm }); psmNow = psm; } const r = await wDig.recognize(png(c)); let cf = r.data.confidence || 0; if (!cf) { const ws = (r.data.words || []).filter(w => /\d/.test(w.text || '')); if (ws.length) cf = ws.reduce((s2, w) => s2 + w.confidence, 0) / ws.length; }   /* "1 : 100" עם רווחים מחזיר ביטחון כולל 0 — ממוצע המילים */
      return { t: norm(r.data.text).replace(/\s+/g, ''), c: Math.round(cf), img: window.__ptFastKeep ? c.toDataURL('image/png') : undefined }; };
    for (const cd of cands) {
      if (left() < 2500) break;
      const reads = [], add = (r, full) => { const mc = full && /^1:(\d{2,4})$/.exec(r.t), m = mc || (full ? /^1(\d+)$/.exec(r.t) : /^(\d+)$/.exec(r.t)); if (m && m[1].length === cd.digits) reads.push({ n: +m[1], c: r.c, colon: !!mc }); cd.txt = (cd.txt ? cd.txt + ' | ' : '') + r.t + '/' + r.c; };
      const thin = cd.fill < 0.3;   /* קו דק (גופן שרטוט) מעובה לפני הקריאה; גופן מלא לא — העיבוי מדביק בו ספרות */
      const r1 = await dg(cd.x0, cd.x1, cd, 44, thin ? 2 : 0, '13'); add(r1, true); cd.img = r1.img;
      add(await dg(cd.dx0, cd.x1, cd, 44, thin ? 1 : 0, '8'), false);
      if (!(reads.length === 2 && reads[0].n === reads[1].n)) { add(await dg(cd.dx0, cd.x1, cd, 44, thin ? 2 : 1, '13'), false); if (reads.length < 2 || new Set(reads.map(r => r.n)).size > 1) { add(await dg(cd.x0, cd.x1, cd, 44, 0, '7'), true); add(await dg(cd.dx0, cd.x1, cd, 28, thin ? 1 : 0, '8'), false); } }
      if (!reads.length) continue;
      const by = new Map(); reads.forEach(r => { const e = by.get(r.n) || { n: r.n, k: 0, c: 0, colon: false }; e.k++; e.c = Math.max(e.c, r.c); e.colon = e.colon || r.colon; by.set(r.n, e); });
      const best = [...by.values()].sort((p, q) => q.k - p.k || (nice.includes(q.n) ? 1 : 0) - (nice.includes(p.n) ? 1 : 0) || q.c - p.c)[0];
      /* גופן שרטוט (SHX): ה-OCR קורא "5" כ-"3" או "9" בעקביות ("1:250" → "1:230"). ערך לא עגול נבדק מול מבנה הספרה עצמה
         (ברצועה שמתחת לראש הספרה: ב-5 יש דיו רק משמאל, ב-3 וב-2 רק מימין, ב-9 משני הצדדים), והתיקון מתקבל רק אם יוצא ערך עגול */
      if (!nice.includes(best.n) && String(best.n).length === cd.gb.length) for (const [u0, u1] of [[0.25, 0.38], [0.2, 0.32], [0.15, 0.27]]) { let fx = '';   /* גובה הרצועה תלוי בגופן — מנסים שלוש */
        for (let i = 0; i < cd.gb.length; i++) { let ch = String(best.n)[i]; const [gx0, gy0, gx1, gy1] = cd.gb[i], gw = gx1 - gx0 + 1, gh = gy1 - gy0 + 1;
          if ('2359'.includes(ch) && gh >= 9 && gw >= 4) { const band = (f0, f1) => { let l = 0, r = 0; const t = Math.max(1, Math.floor(gw * 0.3)); for (let y = Math.round(gy0 + gh * f0); y <= Math.round(gy0 + gh * f1); y++) { for (let x = gx0; x < gx0 + t; x++) if (bin[y * W + x]) l++; for (let x = gx1 - t + 1; x <= gx1; x++) if (bin[y * W + x]) r++; } return [l > 0, r > 0]; };
            const [uL, uR] = band(u0, u1), [lL, lR] = band(0.62, 0.74); if (uL && !uR) ch = '5'; else if (!uL && uR) ch = lL && !lR ? '2' : '3'; else if (uL && uR) ch = '9'; }
          fx += ch; }
        if (window.__ptFastKeep) cd.txt += ' ~' + fx;
        if (+fx !== best.n && nice.includes(+fx)) { cd.txt += ' => ' + fx; best.n = +fx; best.k = Math.max(best.k, 2); break; } }
      if (best.n >= 5 && best.n <= 1000 && (best.k >= 2 || best.c >= 60 || (best.colon && nice.includes(best.n)))) { cd.n = best.n; cd.conf = best.c; cd.agree = best.k; }
    }
    /* "1:75@A1" / "1:150(@A3)": הסיומת שאחרי הספרות נקראת לבדה (רק התווים @ A 0–4) — קריאת השורה כולה מפספסת אותה לפעמים, ואז שני הערכים נראים כסתירה */
    dbg.t.reads = Math.round(performance.now() - T0);
    { const ok = cands.filter(c => c.n != null).slice(0, 12); if (ok.length) { await wDig.setParameters({ tessedit_char_whitelist: '@A01234(', tessedit_pageseg_mode: '7' }); psmNow = '7';
        for (const cd of ok) { if (left() < 1500) break; const c = cut(cd.x1 + cd.H * 0.08, cd.y0 - cd.H * 0.25, cd.x1 + cd.H * 4.6, cd.y1 + cd.H * 0.25, cd.H, 40, 0); const r = await wDig.recognize(png(c)), m = /^[\s(]*@\s*\(?\s*A\s?([0-4])/.exec(norm(r.data.text)); if (m) { cd.at = 'A' + m[1]; if (!pairs.some(p => p.n === cd.n && p.fmt === cd.at)) pairs.push({ n: cd.n, fmt: cd.at }); } }
        await wDig.setParameters({ tessedit_char_whitelist: '0123456789:' }); } }
    dbg.t.digits = Math.round(performance.now() - T0);
    /* הסביבה: שורת הכיתוב ושתי שורות מעליה — עד שתי קריאות לכל ערך (הכיתובים הגדולים קודם) */
    ptTblFlag(cands.filter(c => c.n != null).map(c => { c.cy = (c.y0 + c.y1) / 2; return c; }));
    let sheet = null; const seenN = new Map(); let nCtx = 0;
    for (const cd of cands) {
      if (cd.n == null) continue; vals.push(cd);
      const sn = seenN.get(cd.n) || 0; if (cd.tbl || sn >= 2 || nCtx >= 10 || left() < 600) continue; seenN.set(cd.n, sn + 1); nCtx++;
      const c = cut(cd.x0 - cd.H * 14, cd.y0 - cd.H * 2.6, cd.x1 + cd.H * 26, cd.y1 + cd.H * 0.9, cd.H, 30, false, true);   /* בעברית התווית מימין לערך ("תכנית מרתף עליון   1:250") */
      const r = await wTxt.recognize(png(c)), txt = norm(r.data.text); if (window.__ptFastKeep) cd.cimg = c.toDataURL('image/png');
      cd.ctx = txt.replace(/\s+/g, ' ').trim().slice(0, 160); cd.lbl = PT_SC_LABEL.test(txt); cd.plan = PT_SC_PLAN.test(txt); cd.sect = PT_SC_SECT.test(txt);
      const re = /1\s*:\s*(\d{1,4})\s*[(\[]?\s*(?:[@©®]|\bat\b)\s*A\s?([0-4])/gi; let m; while ((m = re.exec(txt))) if (!pairs.some(p => p.n === +m[1] && p.fmt === 'A' + m[2])) pairs.push({ n: +m[1], fmt: 'A' + m[2] });
      const fm = /(?:גיליון|גליון|פורמט|sheet|size|format)\D{0,12}A\s?([0-4])\b/i.exec(txt); if (fm && !sheet) sheet = 'A' + fm[1];
    }
    dbg.t.ctx = Math.round(performance.now() - T0); dbg.pairs = pairs;
    dbg.cands = cands.map(c => ({ x: Math.round((c.x0 + c.x1) / 2 / W * 100), y: Math.round((c.y0 + c.y1) / 2 / H * 100), H: c.H, dg: c.digits, txt: c.txt, conf: c.conf, n: c.n, tbl: c.tbl, lbl: c.lbl, plan: c.plan, sect: c.sect, ctx: c.ctx, img: c.img, cimg: c.cimg }));
    const at = ptScaleAtSheet(pairs, opts.pageMm), pick = at || ptScalePick(vals);
    if (!pick) return null;
    if (pick.multi) return { multi: pick.multi, ms: Math.round(performance.now() - T0) };
    const bestC = vals.filter(v => v.n === pick.n).sort((p, q) => (q.lbl ? 1 : 0) - (p.lbl ? 1 : 0) || q.H - p.H)[0] || vals[0];
    let thumb = null;
    try { const px0 = Math.max(0, (bestC.x0 - bestC.H * 6) / k), py0 = Math.max(0, (bestC.y0 - bestC.H * 1.6) / k), px1 = Math.min(SW, (bestC.x1 + bestC.H * 6) / k), py1 = Math.min(SH, (bestC.y1 + bestC.H * 1.2) / k), z = Math.min(3, 300 / Math.max(1, px1 - px0)); const tc = document.createElement('canvas'); tc.width = Math.round((px1 - px0) * z); tc.height = Math.round((py1 - py0) * z); const tg = tc.getContext('2d'); tg.fillStyle = '#fff'; tg.fillRect(0, 0, tc.width, tc.height); tg.imageSmoothingQuality = 'high'; tg.drawImage(src, px0, py0, px1 - px0, py1 - py0, 0, 0, tc.width, tc.height); thumb = tc.toDataURL('image/jpeg', 0.75); } catch (e) {}
    return { n: pick.n, t: '1:' + pick.n, where: 'fast', c: bestC.conf || 0, weak: !!pick.weak, thumb, sheet: pick.sheet || sheet, note: pick.note, others: (pick.others || []).filter(n => n !== pick.n), ms: Math.round(performance.now() - T0) };
  } finally { try { if (wDig) await wDig.terminate(); } catch (e) {} try { if (wTxt) await wTxt.terminate(); } catch (e) {} dbg.t.end = Math.round(performance.now() - T0); }
}
window.ptScaleFast = ptScaleFast;
async function ptScaleScan(onStep, opts) {
  if (!P.bg) return null;
  opts = opts || {};
  const img = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = P.bg; });
  /* ⚡ קודם האיתור המהיר לפי צורת הכיתוב (על הרינדור המלא אם יש); הסריקה ברצועות היא רק גיבוי קצר */
  if (!opts.noFast) { try {
    /* דף PDF קטן (A2–A4): ב-144dpi כיתוב של 1.5 מ״מ הוא 8px והנקודתיים פיקסל בודד — מרנדרים שוב כך שהצלע הארוכה ~6200px */
    if (opts.pg) { try { const v1 = opts.pg.getViewport({ scale: 1 }), s = Math.min(6, 6200 / Math.max(v1.width, v1.height)); if (s >= 3) { const vp = opts.pg.getViewport({ scale: s }), c2 = document.createElement('canvas'); c2.width = Math.round(vp.width); c2.height = Math.round(vp.height); await opts.pg.render({ canvasContext: c2.getContext('2d', { willReadFrequently: true }), viewport: vp }).promise; opts.hi = c2; } } catch (e) { console.warn('ptScaleScan hi render', e); } }
    const f = await ptScaleFast(opts.hi || img, { thr: opts.hi ? 190 : 175, pageMm: opts.pageMm }); if (f && (f.n || f.multi)) return { ...f, imgW: img.width, imgH: img.height }; } catch (e) { console.warn("ptScaleFast", e); } }
  if (!window.Tesseract) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js');
  const W = img.width, H = img.height;
  /* רצועות השוליים: ימין ותחתית קודם (שם טבלת הכותרת בדרך כלל), אחר כך שמאל ועליון */
  const strips = [['right', W * 0.68, 0, W * 0.32, H], ['bottom', 0, H * 0.72, W, H * 0.28], ['left', 0, 0, W * 0.32, H], ['top', 0, 0, W, H * 0.22]];
  /* הפינות נסרקות לפני הרצועות: טבלת הכותרת יושבת כמעט תמיד בפינה (ימין-תחתון קודם), ותמונת פינה קטנה פי ~3 מרצועה — מעבר OCR קצר בהרבה */
  const corners = [['bottom-right', W * 0.64, H * 0.68, W * 0.36, H * 0.32, ['bottom', 'right']], ['bottom-left', 0, H * 0.68, W * 0.36, H * 0.32, ['bottom', 'left']], ['top-right', W * 0.64, 0, W * 0.36, H * 0.32, ['right', 'top']], ['top-left', 0, 0, W * 0.36, H * 0.32, ['left', 'top']]];
  /* פונט מתאר דק נקרא רק בהגדלה מסוימת — סורקים כמה הגדלות סביב ~3× (יחסית לרוחב 1400px) */
  const base = 1400 / Math.max(W, H * 1.4), scales = [3, 2.75, 3.25, 2.5, 3.5, 4].map(k => +(k * base).toFixed(2));
  const worker = await Tesseract.createWorker('eng+heb');   /* עברית בשביל התווית "קנ"מ" שליד הערך */
  const norm = t => String(t || '').replace(/[\u200f\u200e]/g, '').replace(/[∶：;]/g, ':').replace(/^[lI|]/, '1').replace(/[oO]/g, '0');
  const rx = /(?:^|[^\d.,])1\s*[:\/]\s*(\d{1,4})(?![\d.,])/, LABEL = /קנ\s?["״׳']?\s?מ|קנמ|SCALE|קנה\s?מידה/i;
  const nice = typeof asNiceRatios === 'function' ? asNiceRatios() : [10, 20, 25, 30, 40, 50, 75, 100, 125, 150, 200, 250, 300, 400, 500, 750, 1000];
  let best = null;
  const crop = (sx, sy, sw, sh, k, thr, rot) => {
    const cw = Math.round(sw * k), ch = Math.round(sh * k);
    const c0 = document.createElement('canvas'); c0.width = cw; c0.height = ch; const g0 = c0.getContext('2d'); g0.imageSmoothingQuality = 'high';
    g0.fillStyle = '#fff'; g0.fillRect(0, 0, cw, ch); g0.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
    const id = g0.getImageData(0, 0, cw, ch), px = id.data;
    for (let i = 0; i < px.length; i += 4) { const l = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]; const v = l < thr ? 0 : 255; px[i] = px[i + 1] = px[i + 2] = v; }
    ocrStripLines(id, cw, ch);
    g0.putImageData(id, 0, 0);
    if (!rot) return c0;
    const rc = document.createElement('canvas'); rc.width = ch; rc.height = cw; const g = rc.getContext('2d'); g.translate(rc.width / 2, rc.height / 2); g.rotate(rot); g.drawImage(c0, -cw / 2, -ch / 2); return rc;
  };
  /* "1:20" בדיוק — תבנית ספציפית מספיק כדי לקבל גם ביטחון נמוך (פונט מתאר דק נקרא ב-30%); כיתוב ארוך יותר דורש ביטחון סביר */
  /* "1:20" בדיוק — תבנית ספציפית מספיק כדי לקבל גם ביטחון נמוך (פונט מתאר דק נקרא ב-30%); כיתוב ארוך יותר דורש ביטחון סביר.
     box = מיקום הכיתוב בתמונת המקור (לתמונה המוקטנת שמוצגת לאימות); weak = מספר ליד התווית שלא נקרא איתו "1:" */
  const consider = (t, c, where, box, weak, lbl) => { const s2 = norm(t).trim(); const exact = /^1\s*[:\/]\s*\d{1,4}$/.test(s2); if (c < (exact ? 15 : 35)) return; const m = rx.exec(s2); if (!m) return; const n = +m[1]; if (!(n >= 5 && n <= 2000)) return; const score = (nice.includes(n) ? 100 : 0) + (exact ? 40 : 0) + c - (weak ? 60 : 0); if (!best || score > best.score) best = { n, t: s2, c: Math.round(c), where, score, box: box || null, weak: !!weak, lbl: !!lbl && !weak }; };
  /* כיתוב "1:N" מפורש שנמצא ליד התווית קנ"מ / SCALE הוא הראיה החזקה ביותר — עוצרים שם (בלי זה ערך לא "עגול" כמו 1:80 סרק את כל ארבע הרצועות, ~40 שניות) */
  /* …או אותו "1:N" שנקרא בביטחון בשתי סריקות שונות, בלי ערך מתחרה שנקרא פעמיים */
  const seenPass = new Map();
  const good = () => best && !best.weak && (best.score >= 140 || best.lbl || ((seenPass.get(best.n) || 0) >= 2 && ![...seenPass].some(([k, v]) => k !== best.n && v >= 2)));
  let psm = '6';
  let wDig = null; const lblStrips = new Set();
  /* תקרת זמן לגיבוי: 6 שניות — האיתור המהיר (ptScaleFast) כבר רץ לפניו; מחזירים את הטוב ביותר שנמצא */
  const T0 = Date.now(), over = () => Date.now() - T0 > (opts.capMs || 6000);
  /* פורמט הגיליון מטבלת הכותרת ("גיליון A3") — בתמונה אין גודל דף, ובלעדיו אי אפשר להפוך 1:N לכיול */
  let fmt = null, fmtLbl = null;
  const FMT_LBL = /גיליון|גליון|פורמט|גודל|sheet|format|size/i;
  /* קריאה חוזרת של תא התווית בספרות בלבד: בשורה מעורבת עברית+ספרות ("קנ"מ: 1:180") טסרקט מפיל את "1:1" ומחזיר "80" בביטחון גבוה —
     כאן המילים שאינן מספר נמחקות מהתמונה והאזור נקרא שוב עם רשימת תווים 0-9 : / בלבד */
  const reread = async (cvs, x0, y0, x1, y1, words) => {
    x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(cvs.width, Math.ceil(x1)); y1 = Math.min(cvs.height, Math.ceil(y1));
    const w = x1 - x0, h = y1 - y0; if (w < 8 || h < 8) return '';
    const z = Math.max(1, Math.min(3, 60 / Math.max(8, h)));   /* שורה בגובה ~60px */
    const c1 = document.createElement('canvas'); c1.width = Math.round(w * z) + 20; c1.height = Math.round(h * z) + 20; const g1 = c1.getContext('2d');
    g1.fillStyle = '#fff'; g1.fillRect(0, 0, c1.width, c1.height); g1.imageSmoothingQuality = 'high'; g1.drawImage(cvs, x0, y0, w, h, 10, 10, w * z, h * z);
    for (const wd of words) { if (/\d/.test(wd.text || '')) continue; const b2 = wd.bbox; if (b2.x1 < x0 || b2.x0 > x1 || b2.y1 < y0 || b2.y0 > y1) continue; g1.fillRect(10 + (b2.x0 - x0) * z - 1, 10 + (b2.y0 - y0) * z - 1, (b2.x1 - b2.x0) * z + 2, (b2.y1 - b2.y0) * z + 2); }
    /* מנוע נפרד לספרות בלבד — הפרמטרים של המנוע הראשי לא משתנים. איפוס רשימת התווים למחרוזת ריקה לא ניקה אותה: מאותו רגע כל סריקה קראה ספרות בלבד, התווית לא נמצאה והסריקה נמשכה דקות */
    try { if (!wDig) { wDig = await Tesseract.createWorker('eng'); await wDig.setParameters({ tessedit_char_whitelist: '0123456789:/', tessedit_pageseg_mode: '7' }); } const r2 = await wDig.recognize(c1); return norm(r2.data.text || '').replace(/\s+/g, ''); }
    catch (e) { return ''; }

  };
  const pass = async (where, sx, sy, sw, sh, k, thr, rot) => {
    const cvs = crop(sx, sy, sw, sh, k, thr, rot);
    const res = await worker.recognize(cvs), words = res.data.words || [];
    /* מיקום בתמונת המקור — רק ברצועה לא מסובבת */
    const boxOf = (...ws) => rot ? null : { x: sx + Math.min(...ws.map(w => w.bbox.x0)) / k, y: sy + Math.min(...ws.map(w => w.bbox.y0)) / k, x2: sx + Math.max(...ws.map(w => w.bbox.x1)) / k, y2: sy + Math.max(...ws.map(w => w.bbox.y1)) / k };
    words.forEach(w => consider(w.text, w.confidence, where, boxOf(w)));
    { const inPass = new Set(); for (const w of words) { const mm = /^1\s*[:\/]\s*(\d{2,4})$/.exec(norm(w.text).trim()); if (mm && w.confidence >= 75 && +mm[1] >= 10 && +mm[1] <= 2000) inPass.add(+mm[1]); } inPass.forEach(n => seenPass.set(n, (seenPass.get(n) || 0) + 1)); }
    for (const w of words) { const m = /^A\s?([0-4])$/i.exec(String(w.text || '').replace(/[\u200e\u200f\s:.,]/g, '')); if (!m || w.confidence < 55) continue; const v = 'A' + m[1], hh = Math.max(8, w.bbox.y1 - w.bbox.y0), cy0 = (w.bbox.y0 + w.bbox.y1) / 2;
      if (!fmt) fmt = v; if (!fmtLbl && words.some(o => o !== w && FMT_LBL.test(o.text || '') && Math.abs((o.bbox.y0 + o.bbox.y1) / 2 - cy0) < hh * 1.2)) fmtLbl = v; }
    for (let i = 0; i + 1 < words.length; i++) { const a = words[i], b = words[i + 1]; if (Math.abs(a.bbox.y0 - b.bbox.y0) < (a.bbox.y1 - a.bbox.y0) && b.bbox.x0 - a.bbox.x1 < (a.bbox.y1 - a.bbox.y0) * 2) consider(a.text + b.text, Math.min(a.confidence, b.confidence), where, boxOf(a, b)); }
    /* תווית "קנ"מ" / SCALE: מספר מתחתיה או לידה (אותו תא בטבלת הכותרת) הוא ה-N גם בלי "1:" — אחרי אימות בקריאת ספרות בלבד */
    if (words.some(w => LABEL.test(w.text || ''))) lblStrips.add(where);
    for (const lb of words.filter(w => LABEL.test(w.text || ''))) {
      const h = Math.max(8, lb.bbox.y1 - lb.bbox.y0), cx = (lb.bbox.x0 + lb.bbox.x1) / 2, cy = (lb.bbox.y0 + lb.bbox.y1) / 2;
      for (const w of words) { if (w === lb) continue; const m = /^(?:1\s*[:\/]\s*)?(\d{2,4})$/.exec(norm(w.text).trim()); if (!m) continue;
        const wx = (w.bbox.x0 + w.bbox.x1) / 2, wy = (w.bbox.y0 + w.bbox.y1) / 2;
        /* אותה שורה עד 16 גבהי אות (ערך ותווית בתאים סמוכים בטבלת הכותרת: "1:80 | קנ"מ"), או מתחת/צמוד כמו קודם */
        if (!((Math.abs(wy - cy) < h * 0.9 && Math.abs(wx - cx) < h * 16) || (Math.abs(wx - cx) < h * 6 && wy - cy > -h && wy - cy < h * 3.5))) continue;
        const explicit = /^1\s*[:\/]/.test(norm(w.text).trim());
        /* "1:N" מפורש שנקרא בביטחון ליד התווית — ראיה מספיקה, בלי קריאה חוזרת */
        if (explicit && w.confidence >= 75) { consider('1:' + m[1], w.confidence + 15, where, boxOf(lb, w), false, true); continue; }
        /* אותה שורה כמו המספר, מורחבת לצדדים — שם נמצא ה-"1:" שנשמט */
        const dg = await reread(cvs, Math.min(w.bbox.x0, lb.bbox.x0) - h * 5, w.bbox.y0 - h * 0.35, Math.max(w.bbox.x1, lb.bbox.x1) + h * 5, w.bbox.y1 + h * 0.35, words);
        const m2 = /(?:^|[^\d])1[:\/](\d{2,4})(?!\d)/.exec(dg);
        if (m2 && +m2[1] >= 10 && +m2[1] <= 2000) consider('1:' + m2[1], Math.max(w.confidence, 20) + 15, where, boxOf(lb, w), false, true);
        else consider('1:' + m[1], Math.max(w.confidence, 20) + 15, where, boxOf(lb, w), !explicit, explicit); }
    }
  };
  try {
    await worker.setParameters({ preserve_interword_spaces: '1', tessedit_pageseg_mode: '6' });
    /* שלב הפינות: מעבר אחד על כל פינה; פינה שבה נראתה התווית קנ"מ / SCALE נסרקת מיד לעומק (כמה הגדלות) לפני שממשיכים */
    for (const [where, sx, sy, sw, sh, sides] of corners) {
      if (onStep) onStep(where); await pass(where, sx, sy, sw, sh, scales[0], 200, 0); if (good() || over()) break;
      if (!lblStrips.has(where)) continue;
      sides.forEach(sd => lblStrips.add(sd));
      for (const k of scales) { for (const thr of [200, 150]) { if (k === scales[0] && thr === 200) continue; await pass(where, sx, sy, sw, sh, k, thr, 0); if (good() || over()) break; } if (good() || over()) break; }
      if (good() || over()) break;
    }
    /* סבב מהיר: מעבר אחד על כל ארבע הרצועות — טבלת כותרת באמצע צד נמצאת בלי לסרוק קודם לעומק את ימין ותחתית */
    if (!good() && !over()) for (const [where, sx, sy, sw, sh] of strips) { if (onStep) onStep(where); await pass(where, sx, sy, sw, sh, scales[0], 200, 0); if (good() || over()) break; }
    /* סריקת העומק מתחילה ברצועה שבה נמצאה התווית קנ"מ / SCALE בסבב המהיר */
    const deep = [...strips.filter(st => lblStrips.has(st[0])), ...strips.filter(st => !lblStrips.has(st[0]))];
    if (!good() && !over()) for (const [where, sx, sy, sw, sh] of deep) {
      if (onStep) onStep(where);
      for (const k of scales) { for (const thr of [200, 150]) { await pass(where, sx, sy, sw, sh, k, thr, 0); if (good() || over()) break; } if (good() || over()) break; }
      if (!good() && !over() && (where === 'right' || where === 'left')) for (const rot of [Math.PI / 2, -Math.PI / 2]) { await pass(where, sx, sy, sw, sh, scales[0], 200, rot); if (good() || over()) break; }
      if (good() || over()) break;
    }
    if (!best && !over()) { psm = '11'; await worker.setParameters({ tessedit_pageseg_mode: '11' }); for (const [where, sx, sy, sw, sh] of strips) { await pass(where, sx, sy, sw, sh, scales[0], 200, 0); if (best) break; } }
  } finally { await worker.terminate(); if (wDig) { try { await wDig.terminate(); } catch (e) {} } }
  /* תמונה מוקטנת של המקום שבו נקרא הכיתוב — המשתמש רואה את הכיתוב המקורי ליד הערך שנכנס לשדה */
  let thumb = null;
  if (best && best.box) { try { const bx = best.box, ph = Math.max(10, (bx.y2 - bx.y) * 1.2), pw = Math.max(40, (bx.x2 - bx.x) * 0.6); const x0 = Math.max(0, bx.x - pw), y0 = Math.max(0, bx.y - ph), x1 = Math.min(W, bx.x2 + pw), y1 = Math.min(H, bx.y2 + ph); const z = Math.min(3, 300 / Math.max(1, x1 - x0)); const tc = document.createElement('canvas'); tc.width = Math.round((x1 - x0) * z); tc.height = Math.round((y1 - y0) * z); const tg = tc.getContext('2d'); tg.imageSmoothingQuality = 'high'; tg.drawImage(img, x0, y0, x1 - x0, y1 - y0, 0, 0, tc.width, tc.height); thumb = tc.toDataURL('image/jpeg', 0.7); } catch (e) {} }
  return best ? { n: best.n, t: best.t, where: best.where, c: best.c, weak: !!best.weak, thumb, sheet: fmtLbl || fmt || null, imgW: W, imgH: H } : null;
}
window.ptScaleScan = ptScaleScan;
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
    const cx = e + Math.cos(rot) * w / 2 - Math.sin(rot) * h / 2, cy = f + Math.sin(rot) * w / 2 + Math.cos(rot) * h / 2;
    /* אל מרחב התצוגה: בדף עם /Rotate המיקומים במרחב ה-PDF מסובבים ביחס לתמונה — הכיתובים של קומה אחת נפלו על הקומה השנייה, ואזורים קיבלו שמות של חדרים אחרים */
    const pc = vp.convertToViewportPoint(cx, cy), p0 = vp.convertToViewportPoint(e, f), p1 = vp.convertToViewportPoint(e + Math.cos(rot), f + Math.sin(rot)), rotV = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
    const vert = Math.abs(Math.abs(rotV) - Math.PI / 2) < 0.3, horiz = Math.abs(rotV) < 0.3 || Math.abs(Math.abs(rotV) - Math.PI) < 0.3;
    if (!vert && !horiz) continue;
    /* עברית בשכבת הטקסט של PDF יוצאת לרוב בסדר ויזואלי (הפוך) — הופכים כל מילה עברית */
    const t2 = t.split(/\s+/).map(w => /[֐-׿]/.test(w) ? [...w].reverse().join('') : w).join(' ');
    tokens.push({ t: t2, x: pc[0], y: pc[1], w, h, frame: vert ? 'v' : 'h', c: 99 });
  }
  let layers = [];
  try { layers = await ptPdfLayers(pg, vp); } catch (e) { console.warn('ptPdfLayers', e); }
  return { tokens, W: vp.width, H: vp.height, layers };
}
/* ---------- שכבות ה-PDF (AutoCAD / Revit שומרים את שמות השכבות בקובץ) ----------
   שכבת "ריהוט" = איפה יושבים: מקבצים את הציור שבה לפי קרבה → אזורי ישיבה. שכבת "ברים" → בר,
   כלים סניטריים → שירותים, מטבח → מטבח, במה → במה. זה מדויק יותר מכיתוב — זה הציור עצמו. */
var PT_LAYERS = [
  { k: 'seat', re: /ריהוט|FURN|SEAT|CHAIR|TABLE|ישיבה|כסא|כיסא|שולחנ/i, t: 'אזור ישיבה', cat: 'audience', gap: 2.0, minN: 12, minM2: 4 },   /* פחות מ-4 מ״ר = סמלי ריהוט במקרא/בחותמת, לא אזור */
  { k: 'bar', re: /(^|[^א-ת])בר(ים)?($|[^א-ת])|(^|[^A-Za-z])BARS?($|[^A-Za-z])/i, t: 'בר', cat: 'audience', gap: 2.0, minN: 6, minM2: 1 },
  { k: 'stage', re: /STAGE|במה/i, t: 'במה', cat: 'audience', gap: 2.0, minN: 3, minM2: 2 },
  { k: 'wc', re: /SANR|SANIT|PLUMB|סניטר|שירותים/i, t: 'שירותים', cat: 'service', gap: 2.5, minN: 6, minM2: 1 },
  { k: 'kitchen', re: /KITCH|מטבח/i, t: 'מטבח', cat: 'ops', gap: 2.5, minN: 6, minM2: 2 },
];
async function ptPdfLayers(pg, vp) {
  const cfg = await pg._transport.getOptionalContentConfig(), groups = cfg && cfg.getGroups ? (cfg.getGroups() || {}) : {};
  const names = {}; Object.entries(groups).forEach(([id, g]) => { names[id] = (g && g.name) || ''; });
  if (!Object.keys(names).length) return [];
  const ol = await pg.getOperatorList(), O = pdfjsLib.OPS;
  const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
  let ctm = [1, 0, 0, 1, 0, 0]; const st = [], mc = [], per = {};
  const pageA = vp.width * vp.height;
  for (let i = 0; i < ol.fnArray.length; i++) {
    const f = ol.fnArray[i], a = ol.argsArray[i];
    if (f === O.save) st.push(ctm.slice());
    else if (f === O.restore) ctm = st.pop() || ctm;
    else if (f === O.transform) ctm = mul(ctm, a);
    else if (f === O.paintFormXObjectBegin) { st.push(ctm.slice()); if (a && a[0]) ctm = mul(ctm, a[0]); }
    else if (f === O.paintFormXObjectEnd) ctm = st.pop() || ctm;
    else if (f === O.beginMarkedContentProps) mc.push(a && a[0] === 'OC' && a[1] && a[1].id ? a[1].id : null);
    else if (f === O.beginMarkedContent) mc.push(null);
    else if (f === O.endMarkedContent) mc.pop();
    else if (f === O.constructPath) {
      let id = null; for (let j = mc.length - 1; j >= 0; j--) if (mc[j]) { id = mc[j]; break; }
      const mm = a && a[2]; if (!id || !mm) continue;
      /* minMax = [minX, maxX, minY, maxY] במרחב המשתמש → נקודות התצוגה (y כלפי מטה) */
      const cs = [[mm[0], mm[2]], [mm[1], mm[2]], [mm[0], mm[3]], [mm[1], mm[3]]].map(([x, y]) => vp.convertToViewportPoint(ctm[0] * x + ctm[2] * y + ctm[4], ctm[1] * x + ctm[3] * y + ctm[5]));
      const xs = cs.map(p => p[0]), ys = cs.map(p => p[1]), b = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
      if (!isFinite(b.x0 + b.x1 + b.y0 + b.y1) || (b.x1 - b.x0) * (b.y1 - b.y0) > pageA * 0.25) continue;   /* מסגרת הגיליון וכד׳ */
      if (b.x1 < 0 || b.y1 < 0 || b.x0 > vp.width || b.y0 > vp.height) continue;
      (per[id] = per[id] || []).push(b);
    }
  }
  /* נקודות PDF למטר: מהכיתוב 1:N, אחרת מהכיול, אחרת 2% מרוחב הדף */
  const ratio = P.autoScale && P.autoScale.ratio, ptPerM = ratio ? (1000 * 72 / 25.4) / ratio : (P.scale ? (1 / P.scale) * (vp.width / (P.bgW || 1400)) : vp.width * 0.02);
  /* קירות מתוך שכבות הקירות שבקובץ: אזור לעולם לא חוצה קיר — לא בקיבוץ הריהוט ולא בשוליים */
  const wallIds = Object.entries(names).filter(([, n]) => /WALL|קיר|PARTITION|מחיצ/i.test(n) && !/PATT|FNSH|HATCH|TEXT|DIM/i.test(n)).map(([id]) => id);
  const mainIds = wallIds.filter(id => /^A-WALL$|קיר/i.test(names[id]));
  const wallsOf = ids => ids.flatMap(id => per[id] || []).filter(b => Math.max(b.x1 - b.x0, b.y1 - b.y0) >= 0.8 * ptPerM0());
  function ptPerM0() { const ratio0 = P.autoScale && P.autoScale.ratio; return ratio0 ? (1000 * 72 / 25.4) / ratio0 : (P.scale ? (1 / P.scale) * (vp.width / (P.bgW || 1400)) : vp.width * 0.02); }
  const walls = wallsOf(wallIds), mainWalls = mainIds.length ? wallsOf(mainIds) : walls;
  /* האם הקטע בין שתי נקודות חוצה מלבן (Liang–Barsky) */
  const segHits = (ax, ay, bx, by, r) => { let t0 = 0, t1 = 1; const dx = bx - ax, dy = by - ay; for (const [p, q] of [[-dx, ax - r.x0], [dx, r.x1 - ax], [-dy, ay - r.y0], [dy, r.y1 - ay]]) { if (p === 0) { if (q < 0) return false; } else { const t = q / p; if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; } } } return true; };
  /* אינדקס רשת לקירות: בדיקת "חוצה קיר" רק מול הקירות שבתאים שהקטע עובר בהם (בלי זה: כל זוג פריטים × כל הקירות — תכנית עם אלפי פריטים נתקעה לדקות) */
  const WC = Math.max(8, 2 * ptPerM0()), wGrid = new Map();
  walls.forEach(w => { for (let gy = Math.floor(w.y0 / WC); gy <= Math.floor(w.y1 / WC); gy++) for (let gx = Math.floor(w.x0 / WC); gx <= Math.floor(w.x1 / WC); gx++) { const k = gy * 100003 + gx; let l = wGrid.get(k); if (!l) wGrid.set(k, l = []); l.push(w); } });
  const crossesWall = (p, q) => { const ax = (p.x0 + p.x1) / 2, ay = (p.y0 + p.y1) / 2, bx = (q.x0 + q.x1) / 2, by = (q.y0 + q.y1) / 2;
    for (let gy = Math.floor(Math.min(ay, by) / WC); gy <= Math.floor(Math.max(ay, by) / WC); gy++) for (let gx = Math.floor(Math.min(ax, bx) / WC); gx <= Math.floor(Math.max(ax, bx) / WC); gx++) { const l = wGrid.get(gy * 100003 + gx); if (l && l.some(w => segHits(ax, ay, bx, by, w))) return true; } return false; };
  /* הרחבת מלבן עד הקיר הקרוב בכל צד (עד maxD), ובלי קיר — שוליים של defPad; לעולם לא מעבר לקיר */
  const toWalls = (c, ws, maxD, defPad) => { const b = { ...c }, ov = (a0, a1, b0, b1) => Math.min(a1, b1) - Math.max(a0, b0) > 0.2 * ptPerM0();
    const V = ws.filter(w => (w.y1 - w.y0) >= (w.x1 - w.x0) && ov(w.y0, w.y1, c.y0, c.y1)), Hz = ws.filter(w => (w.x1 - w.x0) > (w.y1 - w.y0) && ov(w.x0, w.x1, c.x0, c.x1));
    const eps = 0.15 * ptPerM0();
    const l = V.filter(w => w.x1 <= c.x0 + eps && w.x1 >= c.x0 - maxD).map(w => w.x1), r = V.filter(w => w.x0 >= c.x1 - eps && w.x0 <= c.x1 + maxD).map(w => w.x0);
    const t = Hz.filter(w => w.y1 <= c.y0 + eps && w.y1 >= c.y0 - maxD).map(w => w.y1), bt = Hz.filter(w => w.y0 >= c.y1 - eps && w.y0 <= c.y1 + maxD).map(w => w.y0);
    b.x0 = l.length ? Math.min(c.x0, Math.max(...l)) : c.x0 - defPad; b.x1 = r.length ? Math.max(c.x1, Math.min(...r)) : c.x1 + defPad;
    b.y0 = t.length ? Math.min(c.y0, Math.max(...t)) : c.y0 - defPad; b.y1 = bt.length ? Math.max(c.y1, Math.min(...bt)) : c.y1 + defPad;
    return b; };
  const out = []; window.__ptLayerInfo = Object.entries(names).map(([id, n]) => ({ id, name: n, paths: (per[id] || []).length }));
  for (const [id, name] of Object.entries(names)) {
    const def = PT_LAYERS.find(d => d.re.test(name)), bs = per[id]; if (!def || !bs || !bs.length) continue;
    let els = def.k === 'seat' ? bs.filter(b => Math.max(b.x1 - b.x0, b.y1 - b.y0) < 6 * ptPerM) : bs; const gap = def.gap * ptPerM;
    if (els.length > 12000) { const st = Math.ceil(els.length / 12000); els = els.filter((_, i) => i % st === 0); }   /* שכבה עם עשרות אלפי קטעים — דגימה מספיקה לקיבוץ */
    /* קיבוץ לפי קרבה (union-find): שני קטעים במרחק קטן מהסף שייכים לאותו אזור */
    const par = els.map((_, i) => i), find = i => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; };
    /* שכנים דרך רשת בגודל הסף: כל פריט נרשם בתאים שהוא נוגע בהם, ונבדק רק מול פריטים בתאים שסביבו */
    const CG = Math.max(4, gap), eGrid = new Map(), stamp = new Int32Array(els.length).fill(-1);
    els.forEach((b, i) => { for (let gy = Math.floor(b.y0 / CG); gy <= Math.floor(b.y1 / CG); gy++) for (let gx = Math.floor(b.x0 / CG); gx <= Math.floor(b.x1 / CG); gx++) { const k = gy * 100003 + gx; let l = eGrid.get(k); if (!l) eGrid.set(k, l = []); l.push(i); } });
    for (let i = 0; i < els.length; i++) { const p = els[i];
      for (let gy = Math.floor((p.y0 - gap) / CG); gy <= Math.floor((p.y1 + gap) / CG); gy++) for (let gx = Math.floor((p.x0 - gap) / CG); gx <= Math.floor((p.x1 + gap) / CG); gx++) { const l = eGrid.get(gy * 100003 + gx); if (!l) continue;
        for (const j of l) { if (j <= i || stamp[j] === i) continue; stamp[j] = i; const q = els[j]; if (find(i) === find(j)) continue;
          const dx = Math.max(0, Math.max(p.x0, q.x0) - Math.min(p.x1, q.x1)), dy = Math.max(0, Math.max(p.y0, q.y0) - Math.min(p.y1, q.y1));
          if (dx <= gap && dy <= gap && dx * dx + dy * dy <= gap * gap && (def.k === 'wc' || !crossesWall(p, q))) { const a2 = find(i), b2 = find(j); if (a2 !== b2) par[a2] = b2; } } } }
    const cl = {}; els.forEach((b, i) => { const r = find(i), c = cl[r] = cl[r] || { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity, n: 0 }; c.x0 = Math.min(c.x0, b.x0); c.y0 = Math.min(c.y0, b.y0); c.x1 = Math.max(c.x1, b.x1); c.y1 = Math.max(c.y1, b.y1); c.n++; });
    const keep = Object.values(cl).filter(c => c.n >= def.minN && ((c.x1 - c.x0) * (c.y1 - c.y0)) / (ptPerM * ptPerM) >= def.minM2).sort((a2, b2) => (a2.y0 - b2.y0) || (a2.x0 - b2.x0));
    keep.forEach((c, i) => { const z = def.k === 'wc' ? toWalls(c, mainWalls, 3.5 * ptPerM, 1 * ptPerM) : toWalls(c, walls, 0.5 * ptPerM, 0.5 * ptPerM);   /* שירותים: התאים + החלל המרכזי — עד הקירות הראשיים; אחרים: שוליים של חצי מטר שנעצרים בקיר */
      out.push({ t: def.t + (keep.length > 1 ? ' ' + (i + 1) : ''), cat: def.cat, ly: name, n: c.n, x0: c.x0, y0: c.y0, x1: c.x1, y1: c.y1, z, m2: Math.round(((c.x1 - c.x0) * (c.y1 - c.y0)) / (ptPerM * ptPerM)) }); });
  }
  return out;
}
/* סיבוב התכנית (P.bgRot, כפולות של 90° עם כיוון השעון) — מיקום יחסי (u,v) מסתובב איתה */
function ptRotUV(u, v) { let n = ((P.bgRot || 0) / 90) % 4; while (n-- > 0) { const u2 = 1 - v; v = u; u = u2; } return { u, v }; }
/* סינון זבל: מילים אמיתיות בלבד — OCR על סמלי ריהוט מייצר "an"/"mn"/"CD" */
function ptKeep(p) {
  const t = p.t.replace(/[.,;:!]+$/, '').trim(); p.t = t;
  if (!t) return false;
  if (/^[+\-±]?\d+[.,]\d{2,3}$/.test(t)) return true;                       /* מפלס */
  const letters = (t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/[A-Za-z֐-׿]/g) || []).length;
  if (letters < 3 || letters / t.replace(/\s/g, '').length < 0.6) return false;
  const cat = ptClassify(t);
  if (cat !== 'other') return true;                                          /* מילה מהמילון — מספיק */
  if (p.c < 72) return false;
  const words = t.split(/\s+/);
  return words.some(w => /^[A-Z][A-Z0-9'&\-]{3,}$/.test(w) || /^[A-Z][a-z]{3,}$/.test(w) || /^[֐-׿]{4,}$/.test(w));   /* כיתוב אמיתי: מילה באותיות גדולות / מילה עברית */
}
/* סריקה מלאה של תמונת הרקע → P.planText */
/* עברית משובשת: אות סופית באמצע מילה, או מ/נ/צ/פ/כ רגילה בסוף מילה (3+ אותיות). כמה מילים כאלה + חלק ניכר מהמילים = שכבת הטקסט לא אמינה */
function ptGarbled(tokens) {
  let n = 0, bad = 0;
  for (const tk of tokens || []) for (const wd of String((tk && tk.t) || tk || '').split(/[^א-ת]+/)) { if (wd.length < 3) continue; n++; if (/[ךםןףץ](?=[א-ת])/.test(wd) || /[כמנפצ]$/.test(wd)) bad++; }
  return bad >= 4 && bad / Math.max(1, n) >= 0.15;
}
async function planTextScan(opts) {
  if (!P.bg) { uiToast('אין תכנית רקע'); return; }
  if (window.__ptBusy) { uiToast('הסריקה כבר רצה…'); return; }
  window.__ptBusy = true; render();
  try {
    uiToast(P.bgPdf ? '🔤 קורא את הכיתובים משכבת הטקסט של ה-PDF…' : '🔤 קורא את הכיתובים בתכנית (OCR מקומי, בלי AI) — יכול לקחת כדקה, ממשיכים בינתיים…', 6000);
    /* צעד ראשון: קנה המידה מטבלת הכותרת שבשולי הגיליון (רצועות הצד מוגדלות, OCR ממוקד) — לפני הסריקה הכללית */
    let ptScale0 = null;
    if (!P.bgPdf && !(opts && opts.noScale)) { try { uiToast('📐 מחפש את קנה המידה בטבלת הכותרת (שולי הגיליון)…', 4000); ptScale0 = await ptScaleScan(); if (ptScale0) uiToast('📐 נמצא קנה מידה 1:' + ptScale0.n + ' בשוליים (' + ptScale0.where + ') — ממשיך לקרוא את הכיתובים…', 5000); } catch (e) { console.warn('pt scale scan', e); } }
    let tokens, SW, SH, src = 'ocr', layers = [];
    if (P.bgPdf) { const r = await ptFromPdf(); tokens = r.tokens; SW = r.W; SH = r.H; src = 'pdf'; layers = r.layers || []; }
    /* שכבת טקסט משובשת (מיפוי גופן שבור ב-PDF: "מטבח הכנות" מגיע כ"עונות מטבן") — קוראים ב-OCR מהתמונה; בלי תוויות השכבות */
    if (src === 'pdf' && ptGarbled(tokens)) { uiToast('🔤 שכבת הטקסט של ה-PDF משובשת — קורא את הכיתובים ב-OCR מהתמונה…', 6000); const cvG = await ptCanvas(); tokens = await ptOcr(cvG); SW = cvG.width; SH = cvG.height; src = 'ocr'; layers = []; }   /* תוויות השכבות ביחידות דף ה-PDF — לא מתאימות לקואורדינטות התמונה */
    else if (!P.bgPdf) { const cv = await ptCanvas(); tokens = await ptOcr(cv); SW = cv.width; SH = cv.height; }
    window.__ptTokens = tokens;   /* לניפוי: מה נקרא */
    /* קנה מידה מהכיתובים ("1:50", "קנ"מ 1:100") — נבדק על הטוקנים הגולמיים, לפני סינון המילים */
    let ptScale = null; if (!(opts && opts.noScale)) try { ptScale = typeof asScaleFromText === 'function' ? asScaleFromText([...ptGroup(tokens, 'h').map(p => p.t), ...tokens.map(p => p.t)]) : null; } catch (e) { console.warn('pt scale', e); }
    if (ptScale0 && (!ptScale || typeof asNiceRatios !== 'function' || !asNiceRatios().includes(ptScale.n) || asNiceRatios().includes(ptScale0.n))) ptScale = ptScale0;   /* טבלת הכותרת גוברת */
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
    /* אזורים מתוך שכבות ה-PDF (ריהוט → אזורי ישיבה, ברים, שירותים…) — עם המלבן המדויק של הציור */
    for (const ly of layers) { const a = ptRotUV(ly.x0 / SW, ly.y0 / SH), b = ptRotUV(ly.x1 / SW, ly.y1 / SH), u0 = Math.min(a.u, b.u), u1 = Math.max(a.u, b.u), v0 = Math.min(a.v, b.v), v1 = Math.max(a.v, b.v);
      items.push({ t: ly.t, u: +((u0 + u1) / 2).toFixed(4), v: +((v0 + v1) / 2).toFixed(4), w: 0.03, h: 0.012, cat: ly.cat, c: 100, ly: ly.ly, n: ly.n, m2: ly.m2, bu: +u0.toFixed(4), bv: +v0.toFixed(4), bw: +(u1 - u0).toFixed(4), bh: +(v1 - v0).toFixed(4), ...(() => { if (!ly.z) return {}; const a2 = ptRotUV(ly.z.x0 / SW, ly.z.y0 / SH), b2 = ptRotUV(ly.z.x1 / SW, ly.z.y1 / SH); return { zu: +Math.min(a2.u, b2.u).toFixed(4), zv: +Math.min(a2.v, b2.v).toFixed(4), zw: +Math.abs(a2.u - b2.u).toFixed(4), zh: +Math.abs(a2.v - b2.v).toFixed(4) }; })() }); }
    /* שכבת טקסט דלה או משובשת (פונט חסר ב-PDF) — משלימים ב-OCR על התמונה, ומוסיפים מה שלא נקרא */
    let ocrAdded = 0;
    if (src === 'pdf' && items.filter(i => !i.ly).length < 8) {
      try { uiToast('🔤 שכבת הטקסט של ה-PDF דלה — משלים בקריאת OCR של השרטוט (כדקה)…', 6000);
        const cv = await ptCanvas(), tk2 = await ptOcr(cv); let ph2 = [...ptGroup(tk2, 'h'), ...ptGroup(tk2, 'v'), ...ptGroup(tk2, 'w')].filter(ptKeep);
        for (const p of ph2.sort((a, b) => b.c - a.c)) { const u = p.x / cv.width, v = p.y / cv.height;
          /* אותו מקום כבר נקרא משכבת הטקסט: כש-OCR בטוח וקרא משהו אחר — שכבת הטקסט שם משובשת (פונט חסר), וה-OCR מחליף אותה */
          const same = items.find(q => !q.ly && Math.abs(q.u - u) < 0.025 && Math.abs(q.v - v) < 0.02);
          if (same) { if (!same.ocr && p.c >= 80 && p.t !== same.t && ptClassify(same.t) === 'other') { same.t = p.t; same.cat = ptClassify(p.t); same.ocr = 1; ocrAdded++; } continue; }
          items.push({ t: p.t, u: +u.toFixed(4), v: +v.toFixed(4), w: +(p.w / cv.width).toFixed(4), h: +(p.h / cv.height).toFixed(4), cat: ptClassify(p.t), c: Math.round(p.c), ocr: 1 }); ocrAdded++; }
      } catch (e) { console.warn('pt ocr fallback', e); } }
    items.sort((a, b) => a.v - b.v || a.u - b.u);
    const prev = P.planText || {};
    P.planText = { layerInfo: window.__ptLayerInfo && src === 'pdf' ? window.__ptLayerInfo.filter(l => l.paths).map(l => l.name) : undefined, ocrAdded, items, at: new Date().toISOString(), src, show: prev.show !== false, cats: prev.cats || { audience: 1, ops: 1, service: 1, furniture: 0, level: 1, other: 0 }, tokens: tokens.length };
    if (ptScale) { P.planText.scale = ptScale; if (P.calSrc !== 'manual' && typeof asApplyRatioN === 'function') asApplyRatioN(ptScale.n, null, 'ocr'); }   /* נכנס לשדה קנה המידה; מוחל כשאין כיול ידני */
    save(); render();
    const cnt = ptCounts();
    uiToast('🔤 נמצאו ' + items.length + ' פריטים' + (layers.length ? ' · ' + layers.length + ' אזורים משכבות ה-PDF (' + [...new Set(layers.map(l => l.ly))].join(', ') + ')' : '') + (ocrAdded ? ' · ' + ocrAdded + ' הושלמו ב-OCR' : '') + ': ' + Object.entries(cnt).filter(([, n]) => n).map(([c, n]) => PT_CATS[c].n + ' ' + n).join(' · '), 8000);
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
    const { x, y, w } = ptPos(it), col = (PT_CATS[it.cat] || PT_CATS.other).c, foc = window.__ptFocus === i;
    /* המלבן המקווקו סביב הכיתוב (גבולות חדר משוערים) בלבל — נראה כמו אזור. מוצג רק אם הודלק במפורש (pt.boxes); התווית עצמה נשארת (אורי, 21.11.2026) */
    if (it.bw && pt.boxes) { const Wb = P.bgW || 1400, Hb = bgHeightPx(), zq = it.zw ? [it.zu, it.zv, it.zw, it.zh] : [it.bu, it.bv, it.bw, it.bh]; out += `<rect x="${bgLeft() + zq[0] * Wb}" y="${bgTop() + zq[1] * Hb}" width="${zq[2] * Wb}" height="${zq[3] * Hb}" rx="6" fill="${col}" fill-opacity="${foc ? 0.22 : 0.1}" stroke="${col}" stroke-width="${(foc ? 3 : 1.6) / getZ()}" stroke-dasharray="${7 / getZ()} ${4 / getZ()}" style="pointer-events:none"/>`; }
    const bw = Math.max(w, it.t.length * fz * 0.6 + 10);
    out += `<g style="cursor:pointer" onclick="window.__ptFocus=${i};ui.tab='node';render()"><rect x="${x - bw / 2}" y="${y - fz * 0.75}" width="${bw}" height="${fz * 1.5}" rx="3" fill="${col}" opacity="${foc ? 1 : 0.78}" stroke="${foc ? '#111' : 'none'}" stroke-width="${foc ? 2 : 0}"/><text x="${x}" y="${y + fz * 0.35}" text-anchor="middle" font-size="${fz}" font-weight="700" fill="#fff" direction="ltr" unicode-bidi="embed">${esc(it.t)}</text></g>`;
  });
  return out;
}
/* ---------- גבולות החדר סביב כיתוב: מילוי (flood fill) על תמונת הרקע ----------
   הקירות בשרטוט הם קווים כהים. מעבים אותם מעט (סוגר פתחי דלתות של עד ~1 מ׳), ממלאים מהנקודה
   הלבנה הקרובה לכיתוב עד שנעצרים בקירות, ולוקחים את המלבן החוסם של המילוי. מילוי שבורח
   (חלל פתוח / הגיע לשולי התכנית / גדול מדי) = אזור פתוח → ריבוע 12×12 מ׳ סביב הכיתוב. */
/* ---------- תמונת מבנה: רק הקירות והמפרידים הפיזיים ----------
   ב-PDF עם שכבות (AutoCAD/Revit) מרנדרים את הדף כשכל מה שאינו מבנה כבוי — ריהוט, מידות, טקסט, צמחייה, תאורה,
   כלים סניטריים, דלתות. כך חלוקת החלל לאזורים נשענת על קירות ומפרידים בלבד, ולא נחתכת סביב כיסאות וקווי מידה.
   מחזיר canvas באותו כיוון ויחס כמו P.bg, או null (אין PDF / אין שכבות / אין שכבת קירות). */
var PT_NONSTRUCT = /COLS?\b|COLUMN|עמוד|ריהוט|FURN|TEXT|ANNO|DIM|טקסט|צמח|PLNT|PLANT|תאורה|טאורה|LIGHT|LITE|SANR|FIXT|EQPM|(^|[^א-ת])בר(ים)?($|[^א-ת])|\bBAR|DOOR|דלת|HDLN|SYMB|TITLE|VIEWPORT|Defpoints/i;
let PT_STRUCT = null;
async function ptStructCanvas() {
  if (window.__ptNoStruct) return null;
  try {
    const pg = typeof asPdfPage === 'function' ? await asPdfPage() : null; if (!pg) return null;
    const key = P.id + '|' + (P.curSheet || '') + '|' + (P.bgPdfPage || 1) + '|' + (P.bgPdf || '').length + '|' + (P.bgRot || 0);
    if (PT_STRUCT && PT_STRUCT.key === key) return PT_STRUCT.cv;
    const cfg = await pg._transport.getOptionalContentConfig(), groups = cfg && cfg.getGroups ? (cfg.getGroups() || {}) : {};
    const ents = Object.entries(groups).map(([id, g]) => [id, (g && g.name) || '']);
    if (!ents.some(([, n]) => /WALL|קיר/i.test(n))) { PT_STRUCT = { key, cv: null }; return null; }
    const hidden = []; ents.forEach(([id, n]) => { if (PT_NONSTRUCT.test(n) && !/WALL|קיר/i.test(n)) { cfg.setVisibility(id, false); hidden.push(n); } });
    const vp1 = pg.getViewport({ scale: 1 }), k = Math.min(3, 1700 / Math.max(vp1.width, vp1.height)), vp = pg.getViewport({ scale: k });
    const c0 = document.createElement('canvas'); c0.width = Math.round(vp.width); c0.height = Math.round(vp.height);
    const g0 = c0.getContext('2d'); g0.fillStyle = '#fff'; g0.fillRect(0, 0, c0.width, c0.height);
    await pg.render({ canvasContext: g0, viewport: vp, optionalContentConfigPromise: Promise.resolve(cfg) }).promise;
    let cv = c0, n = ((P.bgRot || 0) / 90) % 4;
    while (n-- > 0) { const r = document.createElement('canvas'); r.width = cv.height; r.height = cv.width; const g = r.getContext('2d'); g.translate(r.width / 2, r.height / 2); g.rotate(Math.PI / 2); g.drawImage(cv, -cv.width / 2, -cv.height / 2); cv = r; }
    PT_STRUCT = { key, cv, hidden, shown: ents.map(e => e[1]).filter(n2 => !hidden.includes(n2)) };
    return cv;
  } catch (e) { console.warn('ptStructCanvas', e); return null; }
}
let PT_BIN = null;   /* { w, h, dark: Uint8Array, key } */
async function ptBinary() {
  const OPT = Object.assign({ thr: 200, rM: 0.8 }, window.__ptOpt || {});   /* סף כהות ורדיוס עיבוי (מ׳) — לכוונון */
  const sc = await ptStructCanvas();   /* PDF עם שכבות: רק קירות ומפרידים */
  const key = (P.bg || '').length + ':' + (P.bgW || 0) + ':' + (P.scale || 0) + ':' + OPT.thr + ':' + OPT.rM + (sc ? ':S' : '');
  if (PT_BIN && PT_BIN.key === key) return PT_BIN;
  const img = sc || await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = P.bg; });
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
  if (sc) { for (let j = 0, i = 0; j < w * h; j++, i += 4) { const mx = Math.max(px[i], px[i + 1], px[i + 2]), mn = Math.min(px[i], px[i + 1], px[i + 2]); dark0[j] = luma[j] < thr && mx - mn < 50 ? 1 : 0; } }   /* תמונת מבנה: קיר הוא שחור/אפור — קו צבעוני (מידה, סימון) אינו קיר */
  else for (let j = 0; j < w * h; j++) dark0[j] = luma[j] < thr ? 1 : 0;
  /* (תכנית צבועה: "החוץ" מזוהה ב-ptFilledRegions — לבן-נייר רחב שמגיע לשוליים — ולא כאן) */
  /* עיבוי הקירות: רדיוס ≈ 0.5 מ׳ (סוגר דלתות) — בפיקסלים של הקנבס */
  const pxPerM = P.scale ? (1 / P.scale) * (w / (P.bgW || 1400)) : w / 60;
  /* תמונת מבנה: גוף כהה קטן וחופשי (עמוד, סמל, נקודת תאורה — עד ~1.5 מ׳, לא מחובר לקיר) אינו גבול אזור — מוסר */
  if (sc) { const lab = new Int32Array(w * h).fill(-1), q = new Int32Array(w * h), T = 1.5 * pxPerM;
    for (let s0 = 0; s0 < w * h; s0++) { if (!dark0[s0] || lab[s0] >= 0) continue; let qh = 0, qt = 0; q[qt++] = s0; lab[s0] = s0; let x0 = w, x1 = 0, y0 = h, y1 = 0;
      while (qh < qt) { const i = q[qh++], x = i % w, y = (i - x) / w; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const j = yy * w + xx; if (dark0[j] && lab[j] < 0) { lab[j] = s0; q[qt++] = j; } } }
      if (x1 - x0 < T && y1 - y0 < T) for (let k = 0; k < qt; k++) dark0[q[k]] = 0; } }
  const r = Math.max(1, Math.min(20, Math.round(pxPerM * OPT.rM)));
  const dark = new Uint8Array(w * h);
  /* הרחבה מופרדת (אופקית ואז אנכית) — O(n·r) */
  const tmp = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) { let run = 0; const row = y * w; for (let x = 0; x < w; x++) { if (dark0[row + x]) run = r + 1; if (run > 0) { tmp[row + x] = 1; run--; } } }   /* ימינה */
  for (let y = 0; y < h; y++) { let run = 0; const row = y * w; for (let x = w - 1; x >= 0; x--) { if (dark0[row + x]) run = r + 1; if (run > 0) { tmp[row + x] = 1; run--; } } }   /* שמאלה */
  for (let x = 0; x < w; x++) { let run = 0; for (let y = 0; y < h; y++) { const i = y * w + x; if (tmp[i]) run = r + 1; if (run > 0) { dark[i] = 1; run--; } } }
  for (let x = 0; x < w; x++) { let run = 0; for (let y = h - 1; y >= 0; y--) { const i = y * w + x; if (tmp[i]) run = r + 1; if (run > 0) { dark[i] = 1; run--; } } }
  PT_BIN = { struct: !!sc, w, h, dark, dark0, r, pxPerM, key, thr, rendered, filled, darkFrac: +(dark0.reduce((a, b) => a + b, 0) / (w * h)).toFixed(3) };
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
async function ptMakeWcZones(rebuild) {
  /* 🚻 שירותים — תמיד אזור: התאים והחלל המרכזי יחד. מאחדים את החדרים שסביב הכלים הסניטריים / הכיתוב (כל תא הוא חדר קטן) עם מלבן הכלים עצמו */
  let nWc = 0; const pt = P.planText; if (!pt || !pt.items) return 0;
  const PT_WC_RE = /\bW\.?C\b|TOILET|RESTROOM|WASHROOM|LAVATOR|שירותים|שרותים|תא נכים/i;
  const wcs = pt.items.filter(i => i.cat === 'service' && (PT_WC_RE.test(i.t) || /SANR|SANIT|PLUMB|סניטר/i.test(i.ly || '')));
  if (!wcs.length) return 0;
  P.zones = P.zones || [];
  { const Wb = P.bgW || 1400, Hb = bgHeightPx(), mPx = P.scale ? 1 / P.scale : Wb * 0.02, boxes = [];
    for (const it of wcs) {
      let L, T, R, B;
      if (it.zw) { L = bgLeft() + it.zu * Wb; T = bgTop() + it.zv * Hb; boxes.push({ L, T, R: L + it.zw * Wb, B: T + it.zh * Hb }); continue; }   /* משכבות ה-PDF: כבר הורחב עד הקירות */
      if (it.bw) { L = bgLeft() + it.bu * Wb; T = bgTop() + it.bv * Hb; R = L + it.bw * Wb; B = T + it.bh * Hb; }
      else { const p = ptPos(it); L = p.x - mPx * 0.5; R = p.x + mPx * 0.5; T = p.y - mPx * 0.5; B = p.y + mPx * 0.5; }
      /* זרעים: המרכז, ונקודות לאורך המלבן ומחוצה לו (החלל המרכזי שמול התאים) */
      const seeds = [[(L + R) / 2, (T + B) / 2]]; const nx = Math.max(1, Math.round((R - L) / mPx)), ny = Math.max(1, Math.round((B - T) / mPx));
      for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) seeds.push([L + (R - L) * i / nx, T + (B - T) * j / ny]);
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => seeds.push([(L + R) / 2 + dx * ((R - L) / 2 + mPx * 0.8), (T + B) / 2 + dy * ((B - T) / 2 + mPx * 0.8)]));
      const maxA = (mPx * mPx) * 45;   /* חדר שירותים — עד ~45 מ״ר; מילוי גדול יותר = ברח לחלל אחר */
      for (const [sx, sy] of seeds) { let rr = null; try { rr = await ptRoomRect({ t: 'wc', u: (sx - bgLeft()) / Wb, v: (sy - bgTop()) / Hb, w: 0.004, h: 0.004 }); } catch (e) {}
        if (!rr || rr.open || rr.w * rr.h > maxA) continue;
        /* רק חדר שנוגע במלבן הכלים (או קרוב אליו עד 1.5 מ׳) */
        if (rr.left > R + mPx * 1.5 || rr.left + rr.w < L - mPx * 1.5 || rr.top > B + mPx * 1.5 || rr.top + rr.h < T - mPx * 1.5) continue;
        L = Math.min(L, rr.left); T = Math.min(T, rr.top); R = Math.max(R, rr.left + rr.w); B = Math.max(B, rr.top + rr.h); }
      if (it.bw || R - L > mPx * 1.2) boxes.push({ L: L - mPx * 0.15, T: T - mPx * 0.15, R: R + mPx * 0.15, B: B + mPx * 0.15 });
    }
    /* כיתובים/קבוצות סמוכים (גברים / נשים / נכים) — אזור שירותים אחד */
    const merged = [];
    for (const b of boxes) { const m = merged.find(o => b.L < o.R + mPx && b.R > o.L - mPx && b.T < o.B + mPx && b.B > o.T - mPx); if (m) { m.L = Math.min(m.L, b.L); m.T = Math.min(m.T, b.T); m.R = Math.max(m.R, b.R); m.B = Math.max(m.B, b.B); } else merged.push({ ...b }); }
    if (rebuild) P.zones = P.zones.filter(z => !z.wc);
    merged.forEach((b, i) => { const cx = (b.L + b.R) / 2, cy = (b.T + b.B) / 2;
      if (P.zones.some(z => z.wc && inZone(z, { x: cx, y: cy }))) return;
      const zw = { id: uid('z'), name: 'שירותים' + (merged.length > 1 ? ' ' + (i + 1) : ''), usage: 'מוזיקת רקע', x: Math.max(0, 2200 - b.L - (b.R - b.L)), y: Math.max(0, b.T), w: b.R - b.L, h: b.B - b.T, fromText: true, wc: true };
      if (!zoneNoOverlap(zw, P.zones)) return;
      P.zones.push(zw); nWc++; });
  }
  return nWc;
}
/* אזורים לעולם לא חופפים: אזור אחד נגמר איפה שהאחר מתחיל. חותכים את האזור החדש בציר שבו החפיפה קטנה יותר, כך שהוא נצמד לגבול של השכן */
function zoneNoOverlap(z, others) {
  if (z.poly) return true;
  for (const o of others) { if (o === z || o.poly) continue;
    const a = zoneBounds(z), b = zoneBounds(o);
    const ix = Math.min(a.L + a.W, b.L + b.W) - Math.max(a.L, b.L), iy = Math.min(a.T + a.H, b.T + b.H) - Math.max(a.T, b.T);
    if (ix <= 0.5 || iy <= 0.5) continue;
    let L = a.L, T = a.T, W = a.W, H = a.H;
    if (ix <= iy) { if (a.L + a.W / 2 < b.L + b.W / 2) W = b.L - a.L; else { const nl = b.L + b.W; W = a.L + a.W - nl; L = nl; } }
    else { if (a.T + a.H / 2 < b.T + b.H / 2) H = b.T - a.T; else { const nt = b.T + b.H; H = a.T + a.H - nt; T = nt; } }
    if (W < 8 || H < 8) return false;   /* נבלע כולו בשכן */
    z.w = W; z.h = H; z.y = Math.max(0, T); z.x = Math.max(0, 2200 - L - W);
  }
  return true;
}
/* יצירת אזורי סאונד מכיתובי הקהל — לפי גבולות החדר סביב כל כיתוב; rebuild = מחליף אזורים שנוצרו מכיתובים */
async function ptMakeZones(rebuild) {
  if (typeof sheetIsElevation === 'function' && sheetIsElevation()) { uiToast('🎭 זו חזית — אזורים מסמנים על תכנית תקרה/העמדה (מבט מלמעלה)', 6000); return; }
  const pt = P.planText; if (!pt || !pt.items) return;
  /* כשיש תמונת מבנה (PDF עם שכבות): גבולות האזור נקבעים לפי הקירות בלבד — הריהוט והכיתובים קובעים מה יש באזור (שם ותכלית), לא איפה הוא נגמר */
  if (!window.__ptNoPart && await ptStructCanvas()) { if (rebuild) P.zones = (P.zones || []).filter(z => !z.fromText); return ptPartition(); }
  const aud = pt.items.filter(i => i.cat === 'audience').sort((a, b) => (b.bw || 0) * (b.bh || 0) - (a.bw || 0) * (a.bh || 0));   /* אזורים משכבות ה-PDF קודם, מהגדול לקטן */
  const PT_WC_RE = /\bW\.?C\b|TOILET|RESTROOM|WASHROOM|LAVATOR|שירותים|שרותים|תא נכים/i;
  const wcs = pt.items.filter(i => i.cat === 'service' && (PT_WC_RE.test(i.t) || /SANR|SANIT|PLUMB|סניטר/i.test(i.ly || '')));
  if (!aud.length && !wcs.length) { uiToast('לא נמצאו כיתובי אזורי קהל'); return; }
  P.zones = P.zones || [];
  if (rebuild) P.zones = P.zones.filter(z => !z.fromText);
  const W = P.bgW || 1400, side = P.scale ? 12 / P.scale : W * 0.2;
  const minPx = P.scale ? 2 / P.scale : W * 0.03;
  let n = 0, open = 0;
  uiToast('🗺 מזהה את גבולות החדרים סביב הכיתובים…', 4000);
  for (const it of aud) {
    const p = ptPos(it);
    if (P.zones.some(z => inZone(z, p))) continue;   /* כבר יש אזור שם (גם כיתוב שני באותו חדר) */
    let rr = null;
    /* המלבן החוסם של שכבת הריהוט (zw) אינו גבול — ריהוט פזור על כל הקומה עטף גם מדרגות ומעלית. הגבול = החדר סביב הכיתוב */
    if (it.bw && !it.zw) { const Wb = P.bgW || 1400, Hb = bgHeightPx(), pad = P.scale ? 0.6 / P.scale : Wb * 0.01; rr = { left: bgLeft() + it.bu * Wb - pad, top: bgTop() + it.bv * Hb - pad, w: it.bw * Wb + 2 * pad, h: it.bh * Hb + 2 * pad }; }   /* אזור משכבת ה-PDF — המלבן של הציור עצמו (+60 ס״מ) */
    else try { rr = await ptRoomRect(it); } catch (e) { console.warn('ptRoomRect', e); }
    let left, top, w, h, isOpen = false;
    if (rr && (it.bw || (rr.w >= minPx && rr.h >= minPx))) { ({ left, top, w, h } = rr); if (rr.open) { isOpen = true; open++; } }
    else { w = side; h = side; left = p.x - w / 2; top = p.y - h / 2; isOpen = true; open++; }
    /* אותו חדר שכבר נוצר מכיתוב אחר (חפיפה של 70%+) — לא מכפילים; שם שלם עדיף על שבר OCR */
    const dup = P.zones.find(o => { const b = zoneBounds(o); const ix = Math.max(0, Math.min(left + w, b.L + b.W) - Math.max(left, b.L)), iy = Math.max(0, Math.min(top + h, b.T + b.H) - Math.max(top, b.T)); const inter = ix * iy; return inter > 0.7 * Math.min(w * h, b.W * b.H); });
    if (dup) { if (dup.fromText && it.t.length > dup.name.length && it.t.includes(dup.name.slice(-4))) dup.name = it.t; continue; }
    const z = { id: uid('z'), name: it.t, usage: ptUsageOf(it.t), x: Math.max(0, 2200 - left - w), y: Math.max(0, top), w, h, fromText: true };
    if (isOpen) z.openArea = true;
    if (!zoneNoOverlap(z, P.zones)) continue;
    P.zones.push(z); n++;
  }
  const nWc = await ptMakeWcZones(rebuild);
  save(); render();
  if (nWc) uiToast('🚻 ' + nWc + ' אזורי שירותים נוצרו — התאים והחלל המרכזי', 5000);
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
/* תמונת מבנה: החלל גדל חזרה עד פני הקיר בלי לעבור דרכו — התפשטות מכל החללים בו-זמנית, רק דרך פיקסלים שאינם קיר,
   עד מרחק r. פתח דלת מתחלק באמצע בין שני החדרים; קיר דק לא נחצה לעולם. */
function ptGeoLabels(B, comp) {
  if (B._geo && B._geoComp === comp) return B._geo;
  const { w, h, r, dark0 } = B, lab = Int32Array.from(comp), dist = new Uint16Array(w * h), q = new Int32Array(w * h); let qh = 0, qt = 0;
  for (let i = 0; i < w * h; i++) if (comp[i] >= 0) { const x = i % w, y = (i - x) / w;
    if ((x > 0 && comp[i - 1] < 0) || (x < w - 1 && comp[i + 1] < 0) || (y > 0 && comp[i - w] < 0) || (y < h - 1 && comp[i + w] < 0)) q[qt++] = i; }
  /* גדלים רק בתוך הרצועה שהעיבוי אכל (עד r מכל חלל, בקו ישר) — אבל מגיעים אליה בעקיפה, כך שגם פינה שמאחורי בליטת קיר מתמלאת */
  const near = ptDilateN(Uint8Array.from(comp, v => v >= 0 ? 1 : 0), w, h, r + 1);
  while (qh < qt) { const i = q[qh++], d = dist[i]; if (!near[i]) continue; const x = i % w, y = (i - x) / w, id = lab[i];
    if (x > 0 && lab[i - 1] < 0 && !dark0[i - 1] && near[i - 1]) { lab[i - 1] = id; q[qt++] = i - 1; }
    if (x < w - 1 && lab[i + 1] < 0 && !dark0[i + 1] && near[i + 1]) { lab[i + 1] = id; q[qt++] = i + 1; }
    if (y > 0 && lab[i - w] < 0 && !dark0[i - w] && near[i - w]) { lab[i - w] = id; q[qt++] = i - w; }
    if (y < h - 1 && lab[i + w] < 0 && !dark0[i + w] && near[i + w]) { lab[i + w] = id; q[qt++] = i + w; } }
  B._geo = lab; B._geoComp = comp; return lab;
}
function ptCompMask(B, comp, id) {
  if (B.struct) { const lab = ptGeoLabels(B, comp), o = new Uint8Array(B.w * B.h); for (let i = 0; i < o.length; i++) if (lab[i] === id) o[i] = 1; return o; }
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
  const { w, h, dark0, pxPerM } = B, maxN = Math.round((B.struct ? 4 : 6) * pxPerM * pxPerM);
  const lab = new Int32Array(w * h).fill(-1), q = new Int32Array(w * h), pockets = [];
  /* תמונת מבנה: כיס נבלע רק אם הוא שקע בתוך המלבן החוסם של החדר — לא הרחבה החוצה אל מעבר לקיר */
  let bx0 = 0, by0 = 0, bx1 = w, by1 = h;
  if (B.struct) { bx0 = w; by0 = h; bx1 = 0; by1 = 0; for (let i = 0; i < w * h; i++) if (mask[i]) { const x = i % w, y = (i - x) / w; if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; } const mg = Math.max(2, Math.round(0.3 * pxPerM)); bx0 -= mg; by0 -= mg; bx1 += mg; by1 += mg; }
  for (let s0 = 0; s0 < w * h; s0++) {
    if (dark0[s0] || mask[s0] || lab[s0] >= 0) continue;
    const id = pockets.length; let qh = 0, qt = 0, n = 0, other = false; q[qt++] = s0; lab[s0] = id; const start = 0;
    while (qh < qt) { const i = q[qh++], x = i % w; n++;
      if (comp[i] >= 0 && comp[i] !== selfId) other = true;
      if (B.struct && !other) { const y = (i - x) / w; if (x < bx0 || x > bx1 || y < by0 || y > by1) other = true; }
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
/* יישור מצולע של חדר לקירות: מוחקים שיניים קטנות (נקודה שהסרתה משנה שטח קטן מ-minSeg²/2 — Visvalingam),
   ואז מיישרים צלעות כמעט-אופקיות/אנכיות לציר ומסירים נקודות על קו ישר. חדר מלבני יוצא עם 4–8 נקודות. */
function ptSquare(pts, minSeg) {
  let p = pts.map(q => [q[0], q[1]]); const thr = minSeg * minSeg / 2, tiny = minSeg * 0.2;
  const triA = (a, b, c) => Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2;
  const at = i => p[(i + p.length) % p.length];
  if (p.length > 3 && Math.hypot(p[0][0] - at(-1)[0], p[0][1] - at(-1)[1]) < 1e-6) p.pop();   /* מתאר סגור: בלי נקודת סיום כפולה */
  /* "קוצים" (קו שיוצא וחוזר על עצמו — פתח דלת, קו ברוחב פיקסל) ונקודות צמודות: מוחקים עד שאין */
  const clean = () => { for (let ch = true, g = 0; ch && g < 60; g++) { ch = false;
    for (let i = p.length - 1; i >= 0 && p.length > 3; i--) { const a = at(i - 1), b = p[i], c = at(i + 1);
      const ux = a[0] - b[0], uy = a[1] - b[1], vx = c[0] - b[0], vy = c[1] - b[1], lu = Math.hypot(ux, uy), lv = Math.hypot(vx, vy);
      if (lu < tiny || lv < tiny) { p.splice(i, 1); ch = true; continue; }
      if ((ux * vx + uy * vy) / (lu * lv) > 0.94) { p.splice(i, 1); ch = true; } } } };
  clean();
  for (let guard = 0; guard < 2000 && p.length > 4; guard++) { let bi = -1, ba = thr; for (let i = 0; i < p.length; i++) { const a = triA(at(i - 1), p[i], at(i + 1)); if (a < ba) { ba = a; bi = i; } } if (bi < 0) break; p.splice(bi, 1); }
  clean();
  for (let pass = 0; pass < 3; pass++) for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length], dx = Math.abs(b[0] - a[0]), dy = Math.abs(b[1] - a[1]);
    if (dy <= dx * 0.12) { const y = (a[1] + b[1]) / 2; a[1] = b[1] = y; } else if (dx <= dy * 0.12) { const x = (a[0] + b[0]) / 2; a[0] = b[0] = x; } }
  /* נקודות על קו ישר (סטייה קטנה מ-~1/8 מהסף ביחס לאורך) — נמחקות: נשארות רק פינות */
  for (let i = p.length - 1; i >= 0 && p.length > 3; i--) { const a = at(i - 1), b = p[i], c = at(i + 1), base = Math.hypot(c[0] - a[0], c[1] - a[1]) || 1; if (2 * triA(a, b, c) / base < Math.max(0.5, minSeg * 0.12) || Math.hypot(b[0] - a[0], b[1] - a[1]) < 1) p.splice(i, 1); }
  return p.length >= 3 ? p : pts;
}
/* פישוט אזור קיים (נקודות במסך) — אותו יישור: קווים ארוכים, בלי שיניים וקוצים */
function zoneSimplify(zid) {
  const z = (P.zones || []).find(x => x.id === zid); if (!z || !z.poly) return;
  const m = P.scale ? 1 / P.scale : (P.bgW || 1400) * 0.02, n0 = z.poly.length;
  const sp = ptSquare(z.poly.map(q => [q.x, q.y]), m);
  if (sp.length >= n0) { uiToast('הסימון כבר פשוט — ' + n0 + ' נקודות'); return; }
  if (typeof pushUndo === 'function') pushUndo();
  z.poly = sp.map(([x, y]) => ({ x: Math.round(x), y: Math.round(y) })); z.walls = {};
  const xs = z.poly.map(q => q.x), ys = z.poly.map(q => q.y), left = Math.min(...xs), top = Math.min(...ys);
  z.w = Math.max(...xs) - left; z.h = Math.max(...ys) - top; z.y = top; z.x = Math.max(0, 2200 - left - z.w);
  save(); render(); uiToast('✂ ' + n0 + ' → ' + z.poly.length + ' נקודות');
}
/* ניקוי מסכה לפני המתאר: פתיחה מורפולוגית ברדיוס ~20 ס״מ מוחקת לשונות דקות (פתחי דלת, קווים) שיוצרות קוצים */
function ptOpenMask(B, mask) {
  const { w, h } = B, r = Math.max(1, Math.round(B.pxPerM * 0.2));
  const o = ptDilateN(ptErodeN(mask, w, h, r), w, h, r); let n0 = 0; for (let i = 0; i < w * h; i++) { if (mask[i]) n0++; else o[i] = 0; }
  const parts = ptSplitMask(o, w, h).sort((a, b) => b.n - a.n);
  return parts.length && parts[0].n > 0.6 * n0 ? parts[0].mask : mask;
}
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
  if (typeof sheetIsElevation === 'function' && sheetIsElevation()) { uiToast('🎭 זו חזית — אזורים מסמנים על תכנית תקרה/העמדה (מבט מלמעלה)', 6000); return; }
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
    mask = ptOpenMask(B, mask);
    const tr = ptTrace(mask, w, h);
    const eps = Math.max(1.5, B.pxPerM * 0.2);
    let sp = tr.length >= 4 ? ptRdp(tr, eps) : [];
    if (sp.length > 4) sp = ptSquare(sp, B.pxPerM * (B.struct ? 1 : 0.8));   /* קווים ארוכים: מיישרים ומוחקים שיניים/קוצים עד ~1 מ׳ */
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
    if (!aud.length && c.n < minArea) { if (dbg) dbg.push({ id: c.id, m2: +(c.n / pxPerM2).toFixed(1), why: 'small-unlabeled' }); continue; }
    /* חותמת השרטוט (תאריך / קנ״מ / פורמט / הערות…) היא מסגרת, לא חלל */
    if (!aud.length && labs.some(it => /תאריך|הערות|קנ\s*["״']?\s*מ|פורמט|גיליון|גליון|עיצוב ותכנון|\bSCALE\b|\bDATE\b|\bDRAWN\b|\bSHEET\b|\bREV\b/i.test(it.t))) { if (dbg) dbg.push({ id: c.id, why: 'title-block' }); continue; }                          /* חלל קטן בלי כיתוב — פינה/ארון */
    /* כיס קטן שקו דק מפריד אותו מהחדר (ארון, מקרר, דלפק צמוד-קיר) הוא חלק מהחדר — לא מעקף. קיר אמיתי בתמונת המבנה עבה (ממולא), ולכן לא נחצה */
    const mask = ptAbsorbPockets(B, ptCompMask(B, comp, c.id), comp, c.id);
    /* כיסים שנבלעו מעבר לקו לא מחוברים פיזית למסכה — מעבים ב-2 פיקסלים כדי לגשר, ומקיפים את החלק הגדול */
    const bridged = B.struct ? ptErodeN(ptDilateN(mask, w, h, 2), w, h, 2) : ptDilateN(mask, w, h, 2);   /* מבנה: סגירה (בלי התרחבות החוצה) — רק ממלאת את הקו הדק שבין הכיס לחדר */
    const parts = ptSplitMask(bridged, w, h).sort((a, b) => b.n - a.n); if (!parts.length) { if (dbg) dbg.push({ id: c.id, why: 'no-parts' }); continue; }
    const poly = mkPoly(parts[0].mask); if (!poly) { if (dbg) dbg.push({ id: c.id, m2: +(c.n / pxPerM2).toFixed(1), why: 'no-poly', part: +(parts[0].n / pxPerM2).toFixed(1) }); continue; }
    if (dbg) dbg.push({ id: c.id, m2: +(c.n / pxPerM2).toFixed(1), why: 'zone', part: +(parts[0].n / pxPerM2).toFixed(1), pts: poly.length });
    let name, usage;
    if (aud.length) { const best = aud.slice().sort((a, b) => b.t.length - a.t.length)[0]; name = best.t; usage = ptUsageOf(best.t); }
    else { name = 'חלל ' + (++idx); usage = (P.room && P.room.usage) || 'מוזיקת רקע'; }
    if (seenNames[name]) name += ' ' + (++seenNames[name]); else seenNames[name] = 1;
    addZone(name, usage, poly, aud.some(x => /DANCE|ריקוד/i.test(x.t)) ? { dance: true } : {});
  }
  try { made += await ptMakeWcZones(false); } catch (e) { console.warn('wc zones', e); }   /* שירותים — תמיד אזור */
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
    mask = ptOpenMask(B, mask);
    const tr = ptTrace(mask, w, h), eps = Math.max(1.5, B.pxPerM * 0.2);
    let sp = tr.length >= 4 ? ptRdp(tr, eps) : [];
    if (sp.length > 4) sp = ptSquare(sp, B.pxPerM * 0.8);
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
  if (!P.bg || !PT_CATS || !P.planText) return '';   /* כפתור הקריאה הראשונה יושב בתיבת קנה המידה; כאן רק התוצאות */
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
      h += `<div style="font-weight:700;color:${m.c};margin-top:3px">${m.ic} ${m.n}</div>` + its.map(({ it, i }) => `<div style="display:flex;gap:4px;align-items:center;padding:1px 0;${window.__ptFocus === i ? 'background:#fff3e6' : ''}"><span style="flex:1;cursor:pointer;direction:ltr;text-align:left" onclick="window.__ptFocus=${i};P.planText.show=true;render()">${esc(it.t)}${it.ly ? ' <span style="color:#888">· שכבה “' + esc(it.ly) + '”' + (it.m2 ? ' · ~' + it.m2 + ' מ״ר' : '') + '</span>' : it.ocr ? ' <span style="color:#888">· OCR</span>' : ''}</span><select style="width:auto;font-size:10px;padding:0 2px" onchange="P.planText.items[${i}].cat=this.value;save();render()">${Object.entries(PT_CATS).map(([c2, m2]) => `<option value="${c2}" ${it.cat === c2 ? 'selected' : ''}>${m2.ic}</option>`).join('')}</select><button style="padding:0 5px;font-size:10px" onclick="P.planText.items.splice(${i},1);save();render()" title="מחק כיתוב שגוי">✕</button></div>`).join('');
    }
    h += `</div></details><div class="muted" style="font-size:10px">${pt.at ? 'נסרק ' + new Date(pt.at).toLocaleString('he-IL') : ''}${pt.src === 'pdf' ? ' · משכבת הטקסט של ה-PDF' + (pt.ocrAdded ? ' + ' + pt.ocrAdded + ' מ-OCR' : '') + (pt.layerInfo && pt.layerInfo.length ? ' · שכבות בקובץ: ' + esc(pt.layerInfo.join(', ')) : '') : ' · OCR על התמונה — כיתובים קטנים עלולים להיקרא חלקית; PDF מקורי נקרא במדויק'} · הסיווג ניתן לתיקון בבורר ליד כל כיתוב</div>`;
  }
  return h + '</div>';
}
/* שורה בפאנל האזור: אילו כיתובים יושבים בתוך האזור */
function ptZoneLineHTML(z) {
  if (!PT_CATS) return '';
  const others = (P.zones || []).filter(x => x.id !== z.id);
  const merge = others.length ? `<div style="display:flex;gap:4px;align-items:center;margin-top:6px;font-size:11px"><span>🔗 מזג לתוך "${esc(z.name)}":</span><select style="flex:1;font-size:11px;margin:0" onchange="if(this.value){ptMergeZones('${z.id}',this.value)}"><option value="">— בחר אזור למיזוג —</option>${others.map(o => `<option value="${o.id}">${esc(o.name)}${o.usage ? ' · ' + esc(o.usage) : ''}</option>`).join('')}</select></div>` : '';
  const its = ptInZone(z); if (!its.length) return merge;
  return merge + `<div style="background:#f1efff;border-radius:8px;padding:5px 8px;margin-top:6px;font-size:11px"><b>🔤 כיתובים באזור:</b> ${its.map(i => `<span style="display:inline-block;margin:1px 2px;padding:0 5px;border-radius:8px;background:${(PT_CATS[i.cat] || PT_CATS.other).c};color:#fff;font-size:10px;direction:ltr">${esc(i.t)}</span>`).join('')}${its.some(i => i.cat === 'ops' || i.cat === 'service') ? '<div class="muted" style="font-size:10px">⚠ יש כאן כיתובים תפעוליים/שירותים — לוודא שהאזור לא כולל אותם</div>' : ''}</div>`;
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
  /* window.__rfPlain (זיהוי אזורים אוטומטי): קירות מהתמונה המרונדרת ולא משכבת הקירות — בשכבות בלי דלתות הפתחים פתוחים, וחדרים מתאחדים דרכם (מועדון + מטבח = 283 מ״ר) */
  const sc = window.__rfPlain ? null : await ptStructCanvas();   /* PDF עם שכבות: רק קירות ומפרידים */
  const key = (P.bg || '').length + '|' + P.scale + '|' + (P.bgW || 0) + '|' + JSON.stringify(P.virtWalls || []) + (sc ? '|S' : '') + (window.__rfPlain ? '|P' : '');
  if (ROOMFILL && ROOMFILL.key === key) return ROOMFILL;
  const img = sc || await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = P.bg; });
  const k = Math.min(1, 1600 / Math.max(img.width, img.height)), w = Math.round(img.width * k), h = Math.round(img.height * k);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.drawImage(img, 0, 0, w, h);
  const px = g.getImageData(0, 0, w, h).data, dark = new Uint8Array(w * h);
  /* קירות במילוי אפור בהיר (למשל 192) בהירים מהסף הקבוע 185 ולא נחשבו קיר — "לחץ בתוך חדר" מילא את כל התכנית.
     מחפשים שיא של אפור ניטרלי (150–235) שתופס ≥0.6% מהתמונה; אם יש, הסף לפיקסלים ניטרליים עולה מעט מעליו. צבעוני נשאר ב-185 */
  let thrN = 185;
  { const hist = new Uint32Array(22);
    for (let i = 0; i < w * h; i++) { const r0 = px[i * 4], g0 = px[i * 4 + 1], b0 = px[i * 4 + 2]; if (Math.max(r0, g0, b0) - Math.min(r0, g0, b0) >= 22) continue; const l = 0.299 * r0 + 0.587 * g0 + 0.114 * b0; if (l >= 150 && l < 236) hist[Math.min(21, (l - 150) >> 2)]++; }
    let bi = -1, bs = 0; for (let i = 1; i < 21; i++) { const sum = hist[i - 1] + hist[i] + hist[i + 1]; if (sum > bs) { bs = sum; bi = i; } }
    if (bi >= 0 && bs >= 0.006 * w * h) thrN = Math.max(185, Math.min(236, 150 + (bi + 0.5) * 4 + 14)); }
  for (let i = 0; i < w * h; i++) { const r0 = px[i * 4], g0 = px[i * 4 + 1], b0 = px[i * 4 + 2], l = 0.299 * r0 + 0.587 * g0 + 0.114 * b0, sat = Math.max(r0, g0, b0) - Math.min(r0, g0, b0); dark[i] = l < (sat < 22 ? thrN : 185) && (!sc || sat < 50) ? 1 : 0; }
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
/* חדר משורטט (קירות סגורים) שהנקודה בתוכו — הקטן ביותר שמכיל אותה; השרטוט מספיק, לא צריך תכנית רקע */
function rfSketchRoom(pt) {
  const walls = ((P.sketch && P.sketch.walls) || []).filter(wl => typeof skWallClosed === 'function' && skWallClosed(wl));
  const inPoly = (p, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) c = !c; } return c; };
  const area = poly => Math.abs(poly.reduce((a, p, i) => { const q = poly[(i + 1) % poly.length]; return a + p.x * q.y - q.x * p.y; }, 0)) / 2;
  let best = null;
  for (const wl of walls) { const poly = wl.slice(0, -1).map(p => ({ x: Math.round(p.x), y: Math.round(p.y) })); if (poly.length < 3 || !inPoly(pt, poly)) continue; const A = area(poly); if (!best || A < best.A) best = { poly, A }; }
  if (!best) return null;
  const { poly, A } = best, xs = poly.map(p => p.x), ys = poly.map(p => p.y), left = Math.min(...xs), top = Math.min(...ys), zw = Math.max(...xs) - left, zh = Math.max(...ys) - top;
  const rect = poly.length === 4 && poly.every(p => (Math.abs(p.x - left) < 2 || Math.abs(p.x - left - zw) < 2) && (Math.abs(p.y - top) < 2 || Math.abs(p.y - top - zh) < 2));
  return { poly, rect, left, top, zw, zh, m2: Math.round(A * (P.scale || 0) * (P.scale || 0)), edge: false, sketch: true };
}
/* הגאומטריה בלבד — בלי לשנות את הפרויקט: {poly, rect, left, top, zw, zh, m2, edge} או {err} */
async function zoneFillCore(pt, opts) {
  const sk = rfSketchRoom(pt); if (sk) return sk;   /* חדר משורטט — הקירות ידועים במדויק */
  if (!P.bg) { return { err: ((P.sketch && P.sketch.walls) || []).length ? 'לחץ בתוך חדר סגור בשרטוט (או סגור את הקירות)' : 'אין תכנית רקע ואין שרטוט — שרטט חדר או העלה תכנית' }; }
  if (!P.scale) { return { err: '📏 כייל קודם את התכנית — לפי הכיול יודעים מה עובי קיר' }; }
  const R = await rfWalls(), { w, h, walls } = R;
  const L = bgLeft(), T = bgTop(), W = P.bgW || 1400, H = bgHeightPx();
  const sx = Math.round((pt.x - L) / W * w), sy = Math.round((pt.y - T) / H * h);
  if (sx < 0 || sy < 0 || sx >= w || sy >= h) { return { err: 'לחץ בתוך התכנית' }; }
  /* סגירת פתחים מסתגלת: מתחילים מפתח צר ומרחיבים; כל עוד הרחבה נוספת מקטינה את השטח בחדות — המילוי ברח דרך פתח, ונסגר.
     עוצרים כשהשטח יציב. P.fillGap (אם נקבע ידנית) = נקודת ההתחלה */
  const GAPS = opts && opts.gap ? [opts.gap] : [0.4, 0.55, 0.75, 1.0, 1.3].filter(g => g >= (P.fillGap ? P.fillGap - 0.01 : 0));   /* opts.gap = סגירת פתחים קבועה (zonesByWalls: הפרדת חדר קהל מחדר שירות שדלף אליו) */
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
  /* ניקוי זליגות צרות דרך פתחים ("שן" לתוך תא שירותים / חדר שכן): פתיחה מורפולוגית ברדיוס ~0.45 מ׳, ונשאר הרכיב שמחובר לנקודת הלחיצה.
     חל רק כשרוב החדר שורד (≥ 60%) — חדר שהוא באמת צר נשאר כמו שהוא */
  { const ro = Math.max(2, Math.round(0.45 * R.pxPerM)), op = rfBox(rfBox(grown, w, h, ro, false), w, h, ro, true);
    let s0 = -1; for (let r = 0; r <= ro * 3 && s0 < 0; r++) for (let dy = -r; dy <= r && s0 < 0; dy++) for (let dx = -r; dx <= r; dx++) { const x = sx + dx, y = sy + dy; if (x >= 0 && y >= 0 && x < w && y < h && op[y * w + x] && grown[y * w + x]) { s0 = y * w + x; break; } }
    if (s0 >= 0) { const keep = new Uint8Array(w * h), q2 = new Int32Array(w * h); let a = 0, b = 0, nk = 0, ng = 0; keep[s0] = 1; q2[b++] = s0;
      while (a < b) { const i = q2[a++], x = i % w, y = (i - x) / w; nk++; for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (j >= 0 && !keep[j] && op[j] && grown[j]) { keep[j] = 1; q2[b++] = j; } }
      for (let i = 0; i < w * h; i++) if (grown[i]) ng++;
      if (nk >= 0.6 * ng) for (let i = 0; i < w * h; i++) grown[i] = keep[i]; } }
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
/* ===== 🧩 אזורים אוטומטיים בלי AI (אורי, 21.11.2026) — חדרים בין קירות עבים + כיתובי התכנית =====
   אותו מנוע של "לחץ בתוך חדר" (zoneFillCore: קירות = גושים כהים בעובי קיר, פתחי דלתות נסגרים בהסתגלות), מופעל מעצמו:
   1. "חוץ" = כל מה שמגיע לשולי התמונה כשפתחים עד ~1.5 מ׳ סגורים (נייר ריק, טבלת כותרת — קווי המסגרת דקים ואינם קיר).
   2. זרעים: מיקומי הכיתובים ואז רשת כל 2.5 מ׳; כל זרע שאינו בחוץ ואינו בחדר שכבר נמצא → מילוי עד הקירות.
   3. מיון לפי הכיתובים שבתוך החדר: מטבח/מחסן/שירותים בלי כיתוב קהל = לא אזור השמעה; שם האזור = הכיתוב הגדול ביותר בחדר
      (כותרת החדר נכתבת באות הגדולה); בלי כיתוב — "אזור N" אם ≥ 12 מ״ר. בלי ניחוש ובלי טוקנים. */
/* i18n-ignore */
var ZW_OPS = /טבח|הכנות|קירור|מקפיא|שטיפ|קצבי|מחסן|יבשים|אחסון|משרד|צוות|kitchen|storage|store\b|office|freezer|prep\b/i;
var ZW_JUNK = /^[\d\s.,=+\-:×xXH"'°]+$|^H\s?=|קורת|קורה|בטון|ידית|בהלה|אקוסטי|תאריך|מקרא|הערות|תכנו[ןו]|גיליון|גליון|פורמט|קנ.?מ|עיון|ביצוע|ספסל|^מר$|^מ"ר$|sqm|air\/c/i;
/* i18n-ignore-end */
/* "חוץ": מה שמגיע לשולי התמונה כשפתחי הדלתות סגורים. רדיוס הסגירה מסתגל: ב-PDF עם שכבות הקירות נלקחים משכבת הקירות בלבד
   (בלי דלתות), ופתח כניסה של 1.8–2.4 מ׳ נשאר פתוח — ה"חוץ" זלג לכל פנים המבנה והכול נפסל כ"מחוץ למבנה". מנסים 0.75 → 1.25 → 1.75 → 2.5 מ׳
   ובוחרים את הרדיוס הקטן ביותר שממנו הגדלה נוספת כבר לא מחזירה שטח פנים משמעותי (< 4% מהתמונה). נשמר על ROOMFILL */
async function zwOutMask() {
  const R = await rfWalls(), { w, h } = R;
  if (!R.out) {
    const flood = rM => { const bar = rfBarrier(R, rM).barrier, out = new Uint8Array(w * h), q = new Int32Array(w * h); let qh = 0, qt = 0, n = 0;
      const push = i => { if (!out[i] && !bar[i]) { out[i] = 1; q[qt++] = i; } };
      for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); } for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
      while (qh < qt) { const i = q[qh++], x = i % w, y = (i - x) / w; n++; if (x > 0) push(i - 1); if (x < w - 1) push(i + 1); if (y > 0) push(i - w); if (y < h - 1) push(i + w); }
      return { out, n }; };
    const radii = [0.75, 1.25, 1.75, 2.5], res = radii.map(flood); let pick = res.length - 1;
    for (let i = 0; i < res.length - 1; i++) if (res[i].n - res[i + 1].n < 0.04 * w * h) { pick = i; break; }
    R.out = res[pick].out; R.outR = radii[pick]; }
  const L = bgLeft(), T = bgTop(), W = P.bgW || 1400, H = bgHeightPx();
  const isOut = pt => { const x = Math.round((pt.x - L) / W * w), y = Math.round((pt.y - T) / H * h); return x < 1 || y < 1 || x >= w - 1 || y >= h - 1 || !!R.out[y * w + x]; };
  return { R, isOut };
}
/* ===== 🚻 תאי שירותים לפי הצורה (בלי כיתוב) =====
   שורת תאים = לפחות 4 מחיצות דקות מקבילות, כל אחת 1–2.2 מ׳, במרווח אחיד של 0.7–1.2 מ׳ וזו מול זו. מדרגות (מרווח ~0.3 מ׳), מדפים,
   שולחנות וספסלים לא עונים על זה. נבדק על "נחלת בנימין": נמצאו שתי שורות התאים ושום דבר אחר. מחזיר גושים (מלבנים בפיקסלי ROOMFILL),
   מורחבים עד קו הקיר הקרוב בכל צד (עד 3 מ׳) — כך הגוש כולל גם את אזור הכיורים שלפני התאים. תכנית מסובבת (לא מיושרת לצירים) → לא נמצא כלום. */
async function zwWcBlocks() {
  const R = await rfWalls(); if (R.wc) return R.wc;
  const { w, h, pxPerM } = R; R.wc = [];
  if (pxPerM < 20) return R.wc;   /* תכנית רחבה מ-~80 מ׳: מחיצת תא היא כמה פיקסלים בודדים — לא מספיק כדי לזהות בביטחון */
  try {
    const im = await new Promise((res, rej) => { const i2 = new Image(); i2.onload = () => res(i2); i2.onerror = rej; i2.src = P.bg; });
    const c2 = document.createElement('canvas'); c2.width = w; c2.height = h; const g2 = c2.getContext('2d'); g2.fillStyle = '#fff'; g2.fillRect(0, 0, w, h); g2.drawImage(im, 0, 0, w, h);
    const px = g2.getImageData(0, 0, w, h).data, dark = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) dark[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2] < 200 ? 1 : 0;
    const minL = Math.round(1.0 * pxPerM), maxL = Math.round(2.2 * pxPerM), maxT = Math.max(3, Math.round(0.16 * pxPerM));
    const segs = horiz => { const A = horiz ? w : h, B = horiz ? h : w, at = (a, b) => horiz ? dark[b * w + a] : dark[a * w + b], raw = [];
      for (let b = 0; b < B; b++) { let run = 0, gap = 0, start = 0; for (let a = 0; a <= A; a++) { const v = a < A ? at(a, b) : 0; if (v) { if (!run) start = a; run += 1 + gap; gap = 0; } else if (run && gap < 2 && a < A) gap++; else { if (run >= minL && run <= maxL) raw.push({ b, a0: start, a1: start + run }); run = 0; gap = 0; } } }
      if (raw.length > 40000) return [];   /* תכנית מלאה בקווקווים — לא מנסים */
      /* איחוד לעובי הקו: לכל קטע מחפשים המשך רק בשורה הבאה (אינדקס לפי שורה — ליניארי) */
      const byRow = new Map(); for (const r of raw) { let l = byRow.get(r.b); if (!l) byRow.set(r.b, l = []); l.push(r); }
      const out = [];
      for (const r0 of raw) { if (r0.used) continue; const sg = { b: r0.b, b1: r0.b, a0: r0.a0, a1: r0.a1 }; r0.used = true;
        for (;;) { const nx = (byRow.get(sg.b1 + 1) || []).find(r => !r.used && Math.min(r.a1, sg.a1) - Math.max(r.a0, sg.a0) > 0.8 * Math.min(r.a1 - r.a0, sg.a1 - sg.a0)); if (!nx) break; nx.used = true; sg.b1 = nx.b; sg.a0 = Math.min(sg.a0, nx.a0); sg.a1 = Math.max(sg.a1, nx.a1); if (sg.b1 - sg.b > maxT) break; }
        if (sg.b1 - sg.b + 1 <= maxT) out.push({ pos: (sg.b + sg.b1) / 2, a0: sg.a0, a1: sg.a1 }); }
      return out; };
    /* הרשימה ממוינת לפי מיקום — המחיצה הבאה נמצאת רק בחלון של 0.7–1.2 מ׳ קדימה (ליניארי; תכנית צפופה עם אלפי קטעים לא נתקעת) */
    const chains = list => { const res = [], usedC = new Set(); list.sort((p, q) => p.pos - q.pos); if (list.length > 8000) return res;
      const dMin = 0.7 * pxPerM, dMax = 1.2 * pxPerM;
      for (let i = 0; i < list.length; i++) { if (usedC.has(i)) continue; const ch = [i]; let last = list[i], li = i;
        for (;;) { let best = -1; for (let j = li + 1; j < list.length && list[j].pos - last.pos <= dMax; j++) { if (usedC.has(j)) continue; const sg = list[j]; if (sg.pos - last.pos < dMin) continue; const ov = Math.min(sg.a1, last.a1) - Math.max(sg.a0, last.a0); if (ov < 0.7 * Math.min(sg.a1 - sg.a0, last.a1 - last.a0)) continue; best = j; break; } if (best < 0) break; ch.push(best); last = list[best]; li = best; }
        if (ch.length < 4) continue; const ss = ch.map(k => list[k]), sp = ss.slice(1).map((sg, k) => sg.pos - ss[k].pos); if (Math.max(...sp) / Math.min(...sp) > 1.35) continue;
        ch.forEach(k => usedC.add(k)); res.push({ p0: ss[0].pos, p1: ss[ss.length - 1].pos, a0: Math.min(...ss.map(x => x.a0)), a1: Math.max(...ss.map(x => x.a1)), n: ch.length }); }
      return res; };
    const rows = [...chains(segs(true)).map(c => ({ x0: c.a0, x1: c.a1, y0: c.p0, y1: c.p1, n: c.n })), ...chains(segs(false)).map(c => ({ x0: c.p0, x1: c.p1, y0: c.a0, y1: c.a1, n: c.n }))];
    /* שורות סמוכות (עד 1.5 מ׳) = גוש אחד */
    const near = 1.5 * pxPerM, blocks = [];
    for (const r of rows) { const b = blocks.find(q => r.x0 <= q.x1 + near && r.x1 >= q.x0 - near && r.y0 <= q.y1 + near && r.y1 >= q.y0 - near); if (b) { b.x0 = Math.min(b.x0, r.x0); b.x1 = Math.max(b.x1, r.x1); b.y0 = Math.min(b.y0, r.y0); b.y1 = Math.max(b.y1, r.y1); b.cells += r.n - 1; } else blocks.push({ x0: r.x0, x1: r.x1, y0: r.y0, y1: r.y1, cells: r.n - 1 }); }
    /* הרחבה עד קו קיר: עמודה/שורה שרובה (≥ 60%) כהה לאורך כל הגוש, עד 3 מ׳ */
    const maxE = Math.round(3 * pxPerM), frac = (horizLine, pos, a0, a1) => { if (pos < 0 || pos >= (horizLine ? h : w)) return 1; let n = 0, d = 0; for (let a = Math.max(0, Math.round(a0)); a <= Math.min((horizLine ? w : h) - 1, Math.round(a1)); a++) { n++; if (horizLine ? dark[pos * w + a] : dark[a * w + pos]) d++; } return n ? d / n : 0; };
    for (const b of blocks) { const o = { ...b };
      for (let e = 0; e <= maxE; e++) { const x = Math.round(o.x0) - e; if (frac(false, x, o.y0, o.y1) >= 0.6) { b.x0 = x; break; } }
      for (let e = 0; e <= maxE; e++) { const x = Math.round(o.x1) + e; if (frac(false, x, o.y0, o.y1) >= 0.6) { b.x1 = x; break; } }
      for (let e = 0; e <= maxE; e++) { const y = Math.round(o.y0) - e; if (frac(true, y, o.x0, o.x1) >= 0.6) { b.y0 = y; break; } }
      for (let e = 0; e <= maxE; e++) { const y = Math.round(o.y1) + e; if (frac(true, y, o.x0, o.x1) >= 0.6) { b.y1 = y; break; } }
      b.m2 = Math.round((b.x1 - b.x0) * (b.y1 - b.y0) / (pxPerM * pxPerM)); }
    /* ביטחון: גוש של 5 תאים ומעלה (שורה ארוכה או שתי שורות); 3–4 תאים רק כשיש לידם כיתוב שירותים — שלוש מחיצות במרווח מטר קורות גם בריהוט */
    const wcLbl = ((P.planText || {}).items || []).filter(it => /שירותים|נכים|\bW\.?C\b|TOILET|RESTROOM|WASHROOM/i.test(String(it.t || ''))).map(it => ({ x: it.u * w, y: it.v * h })), m1 = pxPerM;
    R.wc = blocks.filter(b => b.m2 <= 80 && (b.cells >= 5 || (b.cells >= 3 && wcLbl.some(q => q.x >= b.x0 - m1 && q.x <= b.x1 + m1 && q.y >= b.y0 - m1 && q.y <= b.y1 + m1))));
  } catch (e) { console.warn('zwWcBlocks', e); }
  return R.wc;
}
/* גוש שירותים שנמצא בתוך אזור — נחתך ממנו (האזור נשאר בלי תאי השירותים והכיורים). מחזיר את מה שנחתך [{m2, pt}] */
async function zwCarveWc(z) {
  const blocks = await zwWcBlocks(); if (!blocks.length) return [];
  const R = await rfWalls(), { w, h, pxPerM } = R, L = bgLeft(), T = bgTop(), W = P.bgW || 1400, H = bgHeightPx();
  const toC = (x, y) => ({ x: Math.round(L + x / w * W), y: Math.round(T + y / h * H) });
  const hit = blocks.filter(b => inZone(z, toC((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2))); if (!hit.length) return [];
  const pts = z.poly || zoneRectPts(z), cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
  g.beginPath(); pts.forEach((q, i) => { const x = (q.x - L) / W * w, y = (q.y - T) / H * h; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.fill();
  const md = g.getImageData(0, 0, w, h).data, mask = new Uint8Array(w * h); let n0 = 0; for (let i = 0; i < w * h; i++) if (md[i * 4 + 3] > 128) { mask[i] = 1; n0++; }
  const pad = Math.round(0.1 * pxPerM); let cut = 0;
  for (const b of hit) for (let y = Math.max(0, Math.round(b.y0) - pad); y <= Math.min(h - 1, Math.round(b.y1) + pad); y++) for (let x = Math.max(0, Math.round(b.x0) - pad); x <= Math.min(w - 1, Math.round(b.x1) + pad); x++) if (mask[y * w + x]) { mask[y * w + x] = 0; cut++; }
  if (!cut || cut > 0.5 * n0) return [];   /* רוב האזור הוא שירותים — לא חותכים; בדיקת הרלוונטיות תפסול אותו */
  /* ניקוי שאריות דקות ונשאר הרכיב הגדול */
  const ro = Math.max(2, Math.round(0.3 * pxPerM)), op = rfBox(rfBox(mask, w, h, ro, false), w, h, ro, true), lab = new Int32Array(w * h), q = new Int32Array(w * h); let bestId = 0, bestN = 0, id = 0;
  for (let s0 = 0; s0 < w * h; s0++) { if (!op[s0] || !mask[s0] || lab[s0]) continue; id++; let a = 0, b2 = 0, n = 0; lab[s0] = id; q[b2++] = s0;
    while (a < b2) { const i = q[a++], x = i % w, y = (i - x) / w; n++; for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (j >= 0 && op[j] && mask[j] && !lab[j]) { lab[j] = id; q[b2++] = j; } }
    if (n > bestN) { bestN = n; bestId = id; } }
  if (!bestId || bestN < 0.4 * n0) return [];
  const keep = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) keep[i] = lab[i] === bestId ? 1 : 0;
  const tr = ptTrace(keep, w, h), sp = tr.length >= 4 ? ptRdp(tr, Math.max(1.5, pxPerM * 0.2)) : []; if (sp.length < 3) return [];
  z.poly = sp.map(([x, y]) => toC(x, y));
  const xs = z.poly.map(p => p.x), ys = z.poly.map(p => p.y), left = Math.min(...xs), top = Math.min(...ys);
  z.x = Math.max(0, 2200 - left - (Math.max(...xs) - left)); z.y = top; z.w = Math.max(...xs) - left; z.h = Math.max(...ys) - top;
  return hit.map(b => ({ m2: Math.round(cut / hit.length / (pxPerM * pxPerM)), pt: toC((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2), cells: b.cells }));
}
/* ===== האם אזור רלוונטי לסאונד (אורי, 21.11.2026: "תשפר את היכולת להבחין איזה אזורים רלוונטיים לסאונד ואיזה לא") =====
   חל על כל אזור שנוצר אוטומטית (zonesByWalls, וגם תוצאות המנוע הישן). מחזיר { ok, why, name, usage }. סדר הבדיקות:
   1. מה שלמדתי מהמשתמש (store.zoneRel — כיתוב שאזור אוטומטי בשמו נמחק 3 פעמים = לא אזור; כיתוב שהוסיף "בכל זאת" = אזור, וגובר)
   2. מחוץ למבנה (רוב השטח ב"חוץ") · טבלת כותרת / מקרא
   3. הכיתוב הדומיננטי בחדר (האות הגדולה = כותרת החדר): תפעול / שירות-טכני / מעבר בלי כיתוב קהל גדול = לא אזור
   4. גאומטריה: קטן מ-6 מ״ר, מעבר צר (רוחב משוער < 1.4 מ׳), חלל בלי שום כיתוב מתחת ל-12 מ״ר */
/* i18n-ignore */
var ZW_TITLE = /תאריך|קנ.?מ|גי?ליון|פורמט|מקרא|הערות|חתימ|עיון|ביצוע|מתכנן|אדריכל|שרטט|מהדורה|scale|\bdate\b|drawn|sheet|\brev\b|revision|amendment|legend|\bkey\b|drawing|\bjob\b|\bstatus\b|\bclient\b|\bproject\b|architect|copyright|specification|\bnotes?\b/i;
/* i18n-ignore-end */
function zwNorm(t) { return String(t || '').replace(/["'״׳.,:;()\d]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase(); }
function zoneRelMark(labels, d) { store.zoneRel = store.zoneRel || {}; for (const t of [].concat(labels || [])) { const k = zwNorm(t); if (k.length < 2 || /^(אזור|חלל)$/.test(k)) continue; const v = (store.zoneRel[k] || 0) + d; store.zoneRel[k] = Math.max(-5, Math.min(5, d > 0 ? Math.max(1, v) : v)); } }   /* הוספה מפורשת (d>0) תמיד מנצחת מחיקות קודמות */
async function zoneRelevance(z, m2) {
  const items = ((P.planText || {}).items || []).map(it => { const p = ptPos(it); return { it, pt: { x: p.x, y: p.y }, t: String(it.t || '').trim(), hh: +it.h || 0 }; }).filter(o => o.t && inZone(z, o.pt));
  const cat = o => ZW_OPS.test(o.t) ? 'ops' : (o.it.cat || 'other');
  const aud = items.filter(o => cat(o) === 'audience'), ops = items.filter(o => cat(o) === 'ops'), svc = items.filter(o => cat(o) === 'service'), pas = items.filter(o => cat(o) === 'passage');
  /* סימוני תפוסה ("34 SEATED", "STANDING 15m2 x 2 = 30 persons") מעידים שיש קהל אבל אינם שם החדר; שם שהוא מילה מהמילון ("Bar", "Hall") קודם לכיתוב סתמי */
  const NOTE = /\bSEATED\b|\bSTANDING\b|\bPERSONS?\b|\bCOVERS\b|\d\s?m2\b|^\d+\b|\bOPENING\b|\bCLEAR\b|\d\s?MM\b/i, isAud = o => cat(o) === 'audience' && !NOTE.test(o.t);
  const names = items.filter(o => !ZW_JUNK.test(o.t) && !ZW_TITLE.test(o.t) && !NOTE.test(o.t) && !['ops', 'service', 'furniture', 'level', 'passage'].includes(cat(o)) && /[A-Za-zא-ת]{2}/.test(o.t)).sort((a, b) => (isAud(b) ? 1 : 0) - (isAud(a) ? 1 : 0) || b.hh - a.hh);
  const rel = store.zoneRel || {}, learnedNo = items.find(o => (rel[zwNorm(o.t)] || 0) <= -3), learnedYes = items.find(o => (rel[zwNorm(o.t)] || 0) >= 1);
  let top = names[0]; const b = zoneBounds(z);
  /* שם סתמי ("area" / "room") הוא חצי שם: "DJ" מעל "area" בשתי שורות → "DJ area"; בלי שורה מעליו — אין שם */
  if (top && /^(room|area|zone|space)$/i.test(top.t.trim())) { const up = items.find(o => o !== top && !['ops', 'service'].includes(cat(o)) && Math.abs(o.pt.x - top.pt.x) < 30 && top.pt.y - o.pt.y > 2 && top.pt.y - o.pt.y < 28 && /[A-Za-zא-ת]{2}/.test(o.t)); top = up ? { ...top, t: up.t + ' ' + top.t } : names.find(o => !/^(room|area|zone|space)$/i.test(o.t.trim())); }
  const done = (ok, why) => { const u1 = top && typeof ptUsageOf === 'function' ? ptUsageOf(top.t) : '', u2 = aud.length && typeof ptUsageOf === 'function' ? ptUsageOf(aud.map(o => o.t).join(' ')) : ''; return { ok, why: why || '', name: top ? top.t.slice(0, 40) : '', usage: u1 && u1 !== 'מוזיקת רקע' ? u1 : (u2 || u1 || 'מוזיקת רקע'), labels: items.map(o => o.t) }; };
  if (learnedYes) return done(true);
  if (learnedNo) return done(false, 'למדתי ממך ש"' + learnedNo.t + '" אינו אזור השמעה');
  /* מחוץ למבנה: דגימת רשת בתוך האזור */
  if (z.auto !== 'lines') try { const om = await zwOutMask(); let n = 0, o = 0; const st = Math.max(6, Math.min(b.W, b.H) / 12); for (let y = b.T + st / 2; y < b.T + b.H; y += st) for (let x = b.L + st / 2; x < b.L + b.W; x += st) { const pt = { x, y }; if (!inZone(z, pt)) continue; n++; if (om.isOut(pt)) o++; } if (n >= 6 && o / n > 0.5) return done(false, 'מחוץ למבנה'); } catch (e) {}
  { const tn = items.filter(o => ZW_TITLE.test(o.t)).length; if (tn >= 2 && tn >= aud.filter(o => !ZW_TITLE.test(o.t)).length) return done(false, 'טבלת כותרת / מקרא'); }
  /* חדר נפרד שכולו תאי שירותים (זוהו לפי הצורה), בלי כיתוב קהל */
  if (!aud.length && m2 > 0 && m2 < 45) { try { const blocks = await zwWcBlocks(), R2 = await rfWalls(), L2 = bgLeft(), T2 = bgTop(), W2 = P.bgW || 1400, H2 = bgHeightPx(); if (blocks.some(bk => inZone(z, { x: L2 + (bk.x0 + bk.x1) / 2 / R2.w * W2, y: T2 + (bk.y0 + bk.y1) / 2 / R2.h * H2 }))) return done(false, 'שירותים (זוהו תאים)'); } catch (e) {} }
  if (m2 > 0 && m2 < 6) return done(false, 'קטן מדי (' + m2 + ' מ״ר)');
  /* הכיתוב הגדול ביותר שאינו קהל — אם הוא תפעול/שירות/מעבר ואין כיתוב קהל גדול כמעט כמוהו, הוא כותרת החדר */
  /* "ROOM" / "AREA" / "אזור" לבדו אינו עדות לקהל כשיש לידו כיתוב תפעול ("KEG" + "ROOM" בשתי שורות) */
  const audS = aud.filter(o => !/^(room|area|zone|space|אזור|חלל|חדר)$/i.test(o.t.trim()));
  const audMax = Math.max(0, ...audS.map(o => o.hh), ...(top && audS.length ? [top.hh] : []));
  const bad = [...ops.map(o => ({ o, k: 'תפעול' })), ...svc.map(o => ({ o, k: 'שירות / טכני' })), ...(audS.length ? [] : pas.map(o => ({ o, k: 'מעבר' })))].sort((x, y) => y.o.hh - x.o.hh)[0];   /* כיתוב מעבר (EXIT / ENTRANCE) פוסל רק חדר שאין בו שום כיתוב קהל */
  if (bad && (!audMax || (bad.k !== 'שירות / טכני' && bad.o.hh > audMax * 1.25) || (!audS.length && bad.k === 'תפעול'))) return done(false, bad.k + ': ' + bad.o.t.slice(0, 24));
  if (bad && bad.k === 'שירות / טכני' && !aud.length && !names.length) return done(false, bad.k + ': ' + bad.o.t.slice(0, 24));
  if (!aud.length && !names.length && P.scale) { const wM = b.W * P.scale, hM = b.H * P.scale, est = m2 / Math.max(wM, hM); if (est < 1.4 && m2 < 25) return done(false, 'מעבר צר (' + est.toFixed(1) + ' מ׳)'); }
  if (!items.length && m2 > 0 && m2 < 12) return done(false, 'בלי כיתוב וקטן (' + m2 + ' מ״ר)');
  return done(true);
}
async function zonesByWalls() {
  if (!P.bg || !P.scale || typeof rfWalls !== 'function') return null;
  const om = await zwOutMask(), R = om.R, isOut = om.isOut, { w, h } = R;
  const L = bgLeft(), T = bgTop(), W = P.bgW || 1400, H = bgHeightPx(), sc2 = P.scale * P.scale;
  const items = ((P.planText || {}).items || []).map(it => { const p = ptPos(it); return { it, pt: { x: p.x, y: p.y }, t: String(it.t || '').trim(), hh: +it.h || 0 }; });
  const seeds = items.filter(o => o.t && !ZW_JUNK.test(o.t)).map(o => o.pt);
  const stepPx = 2.5 / P.scale; for (let y = T + stepPx / 2; y < T + H; y += stepPx) for (let x = L + stepPx / 2; x < L + W; x += stepPx) seeds.push({ x, y });
  const userZones = (P.zones || []).filter(z => !z.prop);
  const found = [];   /* כל חדר שנמצא (גם כזה שלא יהפוך לאזור) — כדי לא למלא אותו שוב מזרע אחר */
  const seen = [], tSeed = performance.now();   /* כל מצולע שמולא (גם כפול / שנדחה); ותקרת זמן — תכנית עם מאות זרעים לא נמשכת חצי דקה */
  for (const pt of seeds) {
    if (performance.now() - tSeed > 9000) break;
    if (isOut(pt) || found.some(g => inZone(g.z, pt)) || seen.some(pl => inZone({ poly: pl }, pt)) || userZones.some(z => inZone(z, pt))) continue;
    let G = null; try { G = await zoneFillCore(pt); } catch (e) { G = null; }
    if (!G || G.err || !G.poly) continue;
    seen.push(G.poly);
    /* החדר מכיל גם כיתוב קהל ("Hall") וגם כיתובי תפעול / שירות ("Store", "Toilet")? המילוי דלף דרך דלת רחבה (דלת כפולה 1.6 מ׳ לא נסגרת
       בסגירה המסתגלת כשהחדר השכן קטן). ממלאים שוב מכיתוב הקהל הגדול עם סגירה רחבה יותר, כל עוד זה מוציא כיתובים זרים ולא מאבד יותר מחצי מהשטח */
    { const inG = (o, GG) => inZone({ poly: GG.poly }, o.pt), catOf = o => ZW_OPS.test(o.t) ? 'ops' : (o.it.cat || 'other');
      const lbl = items.filter(o => o.t && !ZW_JUNK.test(o.t)), frn = GG => lbl.filter(o => ['ops', 'service'].includes(catOf(o)) && inG(o, GG)).length;
      const aud = lbl.filter(o => catOf(o) === 'audience' && inG(o, G)).sort((a, b) => b.hh - a.hh)[0];
      if (aud && frn(G)) for (const gap of [0.75, 1.0, 1.3, 1.6]) { let G2 = null; try { G2 = await zoneFillCore(aud.pt, { gap }); } catch (e) {} if (!G2 || G2.err || !G2.poly || G2.m2 < 0.5 * G.m2) continue; if (inG(aud, G2) && frn(G2) < frn(G)) { G = G2; if (!frn(G)) break; } } }
    const z = { id: uid('z'), name: '', x: Math.max(0, 2200 - G.left - G.zw), y: G.top, w: G.zw, h: G.zh, fill: true, auto: 'walls' };
    if (!G.rect) z.poly = G.poly;
    const cen = { x: G.left + G.zw / 2, y: G.top + G.zh / 2 };
    if (found.some(g => inZone(g.z, cen) && Math.abs(g.m2 - G.m2) < 0.2 * Math.max(g.m2, G.m2))) continue;   /* אותו חדר דרך זרע אחר */
    const leaked = G.zw > 0.85 * W && G.zh > 0.85 * H;   /* ברח לכל התכנית — לא חדר */
    found.push({ z, m2: G.m2, leaked, seed: { x: pt.x, y: pt.y } });
  }
  const zones = [], skipped = { ops: 0, small: 0 }, skippedList = []; let nAuto = (P.zones || []).length;
  for (const g of found) {
    if (g.leaked) continue;
    const r = await zoneRelevance(g.z, g.m2), b0 = zoneBounds(g.z);
    if (!r.ok) { if (/קטן|כיתוב/.test(r.why)) skipped.small++; else skipped.ops++; if (g.m2 >= 3) skippedList.push({ name: r.name || '', why: r.why, m2: g.m2, pt: g.seed || { x: b0.L + b0.W / 2, y: b0.T + b0.H / 2 }, labels: r.labels }); continue; }
    g.z.name = r.name || ('אזור ' + (++nAuto)); g.z.usage = r.usage; g.z._m2 = g.m2;
    try { const cutL = await zwCarveWc(g.z); for (const c of cutL) { skippedList.push({ name: 'שירותים', why: 'תאי שירותים בתוך "' + g.z.name + '" — הוצאו מהאזור', m2: c.m2, pt: c.pt, labels: [] }); } if (cutL.length && typeof zoneArea === 'function') g.z._m2 = Math.round(zoneArea(g.z) * sc2); } catch (e) { console.warn('zwCarveWc', e); }
    zones.push(g.z);
  }
  return { zones, skipped, skippedList, rooms: found.length };
}
/* ===== 🧩 אזורים בתכנית שקירותיה קווים דקים (אורי, 21.11.2026 — אימון על תכניות מהרשת) =====
   בתכניות פנים רבות הקיר מצויר כשני קווים דקים בלי מילוי; zonesByWalls מחפש גושים כהים בעובי קיר, לא מוצא חדרים, והמנוע הישן
   סימן מלבנים על כותרת הגיליון. כאן כל קו כהה הוא מחסום: כנף דלת וקשת הפתיחה שלה סוגרות את הפתח בעצמן, ריהוט נשאר "אי" בתוך החדר.
   1. מחסום = פיקסלים כהים וניטרליים (סימוני תפוסה אדומים / כחולים לא נחשבים), מעובה ב-6 / 18 / 35 ס״מ — נבחרת הרמה הקטנה שבה
      ה"חוץ" (מה שמחובר לשולי התמונה) מפסיק לזלוג לתוך המבנה.
   2. כל רכיב מחובר של שטח פנוי שאינו "חוץ" ושטחו ≥ 3 מ״ר = חדר; הגבול החיצוני שלו (חורים של ריהוט מתמלאים) = המצולע.
   3. רכיב קטן שיושב בתוך חדר אחר (דלפק, אי, שולחן גדול) אינו חדר. ריצוף אריחים מפרק חדר שירותים לתאים זעירים — ולכן הוא לא נמצא בכלל.
   4. אותה בדיקת רלוונטיות ואותם שמות כמו ב-zonesByWalls (בלי בדיקת "מחוץ למבנה" של מסכת הקירות העבים, שכאן ריקה). */
async function zonesByLines() {
  /* סף הכהות של "קו" תלוי בשרטוט: ב-200 קו דלת דק ומוחלק נספר (החדר נסגר), אבל גם דוגמת ריצוף בהירה מפרקת חדר; ב-150 להפך.
     מריצים בשניהם ולוקחים את התוצאה עם יותר שטח של אזורים ששמם בא מכיתוב בתכנית (בשוויון — יותר אזורים כאלה).
     לפי שטח ולא לפי מספר: שלושה תאי טבלת-כותרת עם שם ניצחו אולם אחד גדול */
  let best = null;
  for (const thr of [200, 150]) { let r = null; try { r = await zonesByLinesAt(thr); } catch (e) { console.warn('zonesByLines', thr, e); } if (!r) continue;
    const nm = r.zones.filter(z => !/^אזור \d+$/.test(z.name || '')); r.nNamed = nm.length; r.aNamed = nm.reduce((s2, z) => s2 + (z._m2 || 0), 0); r.thr = thr;
    if (!best || r.aNamed > best.aNamed * 1.1 || (r.aNamed >= best.aNamed * 0.9 && r.nNamed > best.nNamed)) best = r; }
  return best;
}
async function zonesByLinesAt(thr) {
  if (!P.bg || !P.scale) return null;
  const img = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = P.bg; });
  const k = Math.min(1, 2000 / Math.max(img.width, img.height)), w = Math.round(img.width * k), h = Math.round(img.height * k);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d', { willReadFrequently: true }); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.drawImage(img, 0, 0, w, h);
  const px = g.getImageData(0, 0, w, h).data, line = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) { const r0 = px[i * 4], g0 = px[i * 4 + 1], b0 = px[i * 4 + 2], l = 0.299 * r0 + 0.587 * g0 + 0.114 * b0; line[i] = l < thr && Math.max(r0, g0, b0) - Math.min(r0, g0, b0) < 70 ? 1 : 0; }
  const W = P.bgW || 1400, pxPerM = (w / W) / P.scale; if (pxPerM < 8) return null;   /* גיליון רחב מ-~250 מ׳: חדר הוא כמה פיקסלים */
  const L = bgLeft(), T = bgTop(), H = bgHeightPx(), toC = (x, y) => ({ x: Math.round(L + x / w * W), y: Math.round(T + y / h * H) });
  const label = bar => { const lab = new Int32Array(w * h), q = new Int32Array(w * h), comps = [null]; let id = 0;
    for (let s = 0; s < w * h; s++) { if (bar[s] || lab[s]) continue; id++; let a = 0, b = 0, n = 0, edge = false, x0 = w, y0 = h, x1 = 0, y1 = 0; lab[s] = id; q[b++] = s;
      while (a < b) { const i = q[a++], x = i % w, y = (i - x) / w; n++; if (x === 0 || y === 0 || x === w - 1 || y === h - 1) edge = true; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        if (x > 0 && !bar[i - 1] && !lab[i - 1]) { lab[i - 1] = id; q[b++] = i - 1; } if (x < w - 1 && !bar[i + 1] && !lab[i + 1]) { lab[i + 1] = id; q[b++] = i + 1; } if (y > 0 && !bar[i - w] && !lab[i - w]) { lab[i - w] = id; q[b++] = i - w; } if (y < h - 1 && !bar[i + w] && !lab[i + w]) { lab[i + w] = id; q[b++] = i + w; } }
      comps.push({ id, n, edge, x0, y0, x1, y1, s }); }
    return { lab, comps }; };
  const levels = [0.06, 0.18, 0.35].map(gm => { const r = Math.max(1, Math.round(gm * pxPerM)), bar = rfBox(line, w, h, r, true), lb = label(bar); return { r, bar, lb, out: lb.comps.reduce((s2, c) => s2 + (c && c.edge ? c.n : 0), 0) }; });
  let pick = levels.length - 1; for (let i = 0; i < levels.length - 1; i++) if (levels[i].out - levels[i + 1].out < 0.03 * w * h) { pick = i; break; }
  const lv = levels[pick], { lab, comps } = lv.lb, minPx = 3 * pxPerM * pxPerM;
  const cand = comps.filter(c => c && !c.edge && c.n >= minPx * 0.6).sort((a, b) => b.n - a.n).slice(0, 80), rooms = [];
  /* אזור נקבע לפי קירות, לא לפי ריהוט (אורי, 21.11.2026: "אתה מונה אזור מסביב לריהוט הישיבה במקום לכלול אותו — אתה אמור להיות ממוקד בקירות").
     קיר = קו שהוא חלק מרכיב קווים גדול (מלבן חוסם ≥ 2.2 מ׳ — רשת הקירות מחוברת); כיסא / שולחן / כורסה חופשיים הם רכיבים קטנים.
     מהשטח הפנוי של החדר ממשיכים דרך כל מה שאינו קיר (קווי ריהוט, הכיסים שבין הריהוט לקיר) עד הקירות — אבל לא לתוך חדר אחר,
     לא החוצה, ולא יותר מ-2.5 מ׳ מהשטח הפנוי המקורי (דלת שקשת הפתיחה שלה מנותקת מהקיר לא תזליג את האזור לחדר השכן) */
  const wallHalo = (() => { const l1 = rfBox(line, w, h, 1, true), inv = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) inv[i] = l1[i] ? 0 : 1;
    const ll = label(inv), big = new Uint8Array(ll.comps.length), minS = 2.2 * pxPerM; ll.comps.forEach(c => { if (c && Math.max(c.x1 - c.x0, c.y1 - c.y0) >= minS) big[c.id] = 1; });
    const wm = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) if (ll.lab[i] && big[ll.lab[i]]) wm[i] = 1;
    /* פתח דלת = רווח בקו הקיר. סוגרים רווחים עד ~1.3 מ׳ (סגירה מורפולוגית של מסכת הקירות), אחרת ההתפשטות עוברת דרך הדלת למחסן / לשירותים השכנים:
       קשת הפתיחה של הדלת היא רכיב קטן ומנותק, כמו כיסא, ולא נחשבת קיר. לאורך קיר ישר הסגירה לא מוסיפה כלום — רצועת ריהוט שצמודה לקיר נשארת פתוחה */
    const rc = Math.max(2, Math.round(0.65 * pxPerM)), wc = rfBox(rfBox(wm, w, h, rc, true), w, h, rc, false);
    return lv.r > 1 ? rfBox(wc, w, h, lv.r - 1, true) : wc; })();
  const kind = new Uint8Array(comps.length); comps.forEach(c => { if (c && c.edge) kind[c.id] = 1; }); cand.forEach(c => { kind[c.id] = 1; });   /* 1 = חוץ או חדר — אליהם לא מתפשטים */
  const reach = Math.round(2.5 * pxPerM);
  for (const c of cand) {
    /* תת-מסכה סביב הרכיב: התפשטות עד הקירות, הרחבה חזרה (ברדיוס העיבוי) ועקיבה אחרי הגבול החיצוני */
    const pad = lv.r + 3 + reach, bx0 = Math.max(0, c.x0 - pad), by0 = Math.max(0, c.y0 - pad), bw = Math.min(w, c.x1 + pad + 1) - bx0, bh = Math.min(h, c.y1 + pad + 1) - by0, m = new Uint8Array(bw * bh);
    { const q = new Int32Array(bw * bh); let qa = 0, qb = 0;
      for (let y = c.y0; y <= c.y1; y++) for (let x = c.x0; x <= c.x1; x++) if (lab[y * w + x] === c.id) { const j = (y - by0) * bw + (x - bx0); m[j] = 1; q[qb++] = j; }
      const ok = j => { if (m[j]) return false; const x = j % bw, y = (j - x) / bw, gi = (y + by0) * w + x + bx0; if (wallHalo[gi]) return false; const id = lab[gi]; return !id || !kind[id]; };
      while (qa < qb) { const j = q[qa++], x = j % bw, y = (j - x) / bw;
        if (x > 0 && ok(j - 1)) { m[j - 1] = 1; q[qb++] = j - 1; } if (x < bw - 1 && ok(j + 1)) { m[j + 1] = 1; q[qb++] = j + 1; } if (y > 0 && ok(j - bw)) { m[j - bw] = 1; q[qb++] = j - bw; } if (y < bh - 1 && ok(j + bw)) { m[j + bw] = 1; q[qb++] = j + bw; } } }
    const grown = rfBox(m, bw, bh, lv.r, true), tr = ptTrace(grown, bw, bh), sp = tr.length >= 4 ? ptRdp(tr, Math.max(1.5, pxPerM * 0.15)) : []; if (sp.length < 3) continue;
    const poly = sp.map(([x, y]) => toC(x + bx0, y + by0));
    const A = Math.abs(poly.reduce((s2, p, i) => { const q2 = poly[(i + 1) % poly.length]; return s2 + p.x * q2.y - q2.x * p.y; }, 0)) / 2, m2 = Math.round(A * P.scale * P.scale); if (m2 < 3) continue;
    const sx = c.s % w, sy = (c.s - sx) / w;
    rooms.push({ poly, m2, seed: toC(sx, sy), fill: c.n / Math.max(1, A * (w / W) * (h / H)) });
  }
  /* רכיב שיושב בתוך חדר גדול ממנו = אי / דלפק / ריהוט (עד 15 מ״ר), לא חדר */
  const inPoly = (p, poly) => { let cIn = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) cIn = !cIn; } return cIn; };
  rooms.sort((a, b) => b.m2 - a.m2);
  /* חדר עם ריצוף / מילוי מקווקו מתפרק לתאים זעירים. קבוצת תאים צפופה (מכסה ≥ 60% מהמצולע שלה — לא אותיות של טקסט) בשטח ≥ 6 מ״ר ורוחב ≥ 1.8 מ׳ = חדר אחד */
  { const cellMax = 1.6 * pxPerM * pxPerM, cm = new Uint8Array(w * h); let any = false;   /* גם רצועות של ריצוף פרקט (0.25 × 5 מ׳) */
    for (let i = 0; i < w * h; i++) { const c = lab[i] ? comps[lab[i]] : null; if (c && !c.edge && c.n < cellMax) { cm[i] = 1; any = true; } }
    if (any) { const rr = lv.r + 2, cd = rfBox(cm, w, h, rr, true), inv = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) inv[i] = cd[i] ? 0 : 1;
      const gl = label(inv);
      for (const c of gl.comps) { if (!c || c.n < 6 * pxPerM * pxPerM || Math.min(c.x1 - c.x0, c.y1 - c.y0) < 1.8 * pxPerM) continue;
        const bw = c.x1 - c.x0 + 3, bh = c.y1 - c.y0 + 3, m = new Uint8Array(bw * bh); let cells = 0;
        for (let y = c.y0; y <= c.y1; y++) for (let x = c.x0; x <= c.x1; x++) if (gl.lab[y * w + x] === c.id) { m[(y - c.y0 + 1) * bw + (x - c.x0 + 1)] = 1; if (cm[y * w + x]) cells++; }
        const tr = ptTrace(m, bw, bh), sp = tr.length >= 4 ? ptRdp(tr, Math.max(1.5, pxPerM * 0.15)) : []; if (sp.length < 3) continue;
        const poly = sp.map(([x, y]) => toC(x + c.x0 - 1, y + c.y0 - 1)), A = Math.abs(poly.reduce((s2, p, i) => { const q2 = poly[(i + 1) % poly.length]; return s2 + p.x * q2.y - q2.x * p.y; }, 0)) / 2, apx = A * (w / W) * (h / H);
        if (cells < 0.6 * apx) continue;
        const sx = c.s % w, sy = (c.s - sx) / w; rooms.push({ poly, m2: Math.round(A * P.scale * P.scale), seed: toC(sx, sy), hatch: true }); } } }
  rooms.sort((a, b) => b.m2 - a.m2);
  /* רקע: רכיב שהמצולע שלו מכיל שני חדרים אחרים ומעלה (≥ 6 מ״ר כל אחד, יחד ≥ רבע משטחו) = הנייר שבין מסגרת הגיליון למבנה / המגרש — לא חדר */
  const bg = new Set(rooms.filter(r => { const ins = rooms.filter(o => o !== r && o.m2 >= 6 && o.m2 < r.m2 && inPoly(o.seed, r.poly)); return ins.length >= 2 && ins.reduce((s2, o) => s2 + o.m2, 0) >= 0.25 * r.m2; }));
  let keep = rooms.filter((r, i) => !bg.has(r) && !(r.m2 <= 15 && rooms.slice(0, i).some(big => !bg.has(big) && big.m2 > r.m2 * 1.5 && inPoly(r.seed, big.poly))));
  /* תא שנוגע במסגרת הגיליון (עד 3.5% משולי התמונה) = עמודת הכותרת / ההערות / המקרא; המבנה עצמו לא מגיע עד המסגרת */
  { const mg = 0.035 * W, bbOf = r => { const xs = r.poly.map(p => p.x), ys = r.poly.map(p => p.y); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
    /* מסגרת הגיליון עצמה מצוירת פנימה מהשוליים: המלבן של רכיב ה"רקע" הגדול הוא המסגרת, ותא שנוגע בו מבפנים (עד 1.2%) הוא תא כותרת */
    const fr = [...bg].map(bbOf).filter(b => b[2] - b[0] >= 0.7 * W && b[3] - b[1] >= 0.7 * H).sort((p, q) => (q[2] - q[0]) - (p[2] - p[0]))[0] || [L, T, L + W, T + H], m2g = 0.012 * W;   /* רק רכיב רקע שמשתרע על רוב הגיליון הוא המסגרת — לא קו המתאר של המבנה */
    const k2 = keep.filter(r => { const b = bbOf(r); return !(b[0] < L + mg || b[2] > L + W - mg || b[1] < T + mg || b[3] > T + H - mg || b[0] < fr[0] + m2g || b[2] > fr[2] - m2g || b[1] < fr[1] + m2g || b[3] > fr[3] - m2g); }); if (k2.length) keep = k2; }
  /* המבנה = קבוצת חדרים צמודים שיש בה "מילות חדר" (קהל / תפעול / שירות / מעבר). תאי טבלת הכותרת והמקרא הם גם מלבנים סגורים וצמודים,
     אבל הכיתובים בהם אינם שמות חדרים — קבוצה כזו נזרקת. שתי קומות על אותו גיליון = שתי קבוצות, שתיהן נשארות */
  { const bb = keep.map(r => { const xs = r.poly.map(p => p.x), ys = r.poly.map(p => p.y); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; }), gapC = 0.6 / P.scale;
    const par = keep.map((_, i) => i), find = i => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; };
    for (let i = 0; i < keep.length; i++) for (let j = i + 1; j < keep.length; j++) if (bb[i][0] <= bb[j][2] + gapC && bb[j][0] <= bb[i][2] + gapC && bb[i][1] <= bb[j][3] + gapC && bb[j][1] <= bb[i][3] + gapC) { const a = find(i), b = find(j); if (a !== b) par[a] = b; }
    const pos = it => { const p = ptPos(it); return { x: p.x, y: p.y }; }, all = (P.planText || {}).items || [];
    const words = all.filter(it => ['audience', 'ops', 'service', 'passage'].includes(it.cat) && !ZW_JUNK.test(String(it.t || '')) && !ZW_TITLE.test(String(it.t || ''))).map(pos), titles = all.filter(it => ZW_TITLE.test(String(it.t || ''))).map(pos);
    let cid = keep.map((_, i) => find(i)); const score = new Map(), th = new Map(), tot = new Map();
    keep.forEach((r, i) => { const c = cid[i]; score.set(c, (score.get(c) || 0) + words.filter(q => inPoly(q, r.poly)).length); th.set(c, (th.get(c) || 0) + titles.filter(q => inPoly(q, r.poly)).length); tot.set(c, (tot.get(c) || 0) + r.m2); });
    const only = ok => { const k2 = [], c2 = []; keep.forEach((r, i) => { if (ok(cid[i])) { k2.push(r); c2.push(cid[i]); } }); if (k2.length) { keep = k2; cid = c2; } };
    /* קבוצה שבתאים שלה יש שתי מילות טבלת-כותרת ומעלה (date / revision / scale / תאריך…) = עמודת הכותרת וההערות, גם אם כתוב בה "Roof" או שם האולם */
    only(c => !((th.get(c) || 0) >= 2 && (th.get(c) || 0) >= 0.5 * (score.get(c) || 0)));
    const best = Math.max(0, ...cid.map(c => score.get(c) || 0));
    if (best >= 2) only(c => (score.get(c) || 0) >= Math.max(2, 0.25 * best));
    else { /* אין שמות חדרים בתכנית: נשארת קבוצת החדרים הגדולה (המבנה) */ const mx = Math.max(0, ...cid.map(c => tot.get(c) || 0)); only(c => (tot.get(c) || 0) >= 0.5 * mx); } }
  const userZones = (P.zones || []).filter(z => !z.prop), zones = [], skipped = { ops: 0, small: 0 }, skippedList = []; let nAuto = (P.zones || []).length;
  for (const r of keep) {
    if (r.m2 * (w / W) * (h / H) / (P.scale * P.scale) > 0.6 * w * h) continue;   /* יותר מ-60% מהגיליון — לא חדר */
    const xs = r.poly.map(p => p.x), ys = r.poly.map(p => p.y), left = Math.min(...xs), top = Math.min(...ys), zw = Math.max(...xs) - left, zh = Math.max(...ys) - top;
    if (zw > 0.9 * W && zh > 0.9 * H) continue;   /* מסגרת הגיליון */
    const z = { id: uid('z'), name: '', x: Math.max(0, 2200 - left - zw), y: top, w: zw, h: zh, fill: true, auto: 'lines', poly: r.poly };
    if (userZones.some(u => inZone(u, { x: left + zw / 2, y: top + zh / 2 }))) continue;
    const rel = await zoneRelevance(z, r.m2);
    if (!rel.ok) { if (/קטן|כיתוב/.test(rel.why)) skipped.small++; else skipped.ops++; if (r.m2 >= 3) skippedList.push({ name: rel.name || '', why: rel.why, m2: r.m2, pt: r.seed, labels: rel.labels }); continue; }
    z.name = rel.name || ('אזור ' + (++nAuto)); z.usage = rel.usage; z._m2 = r.m2; zones.push(z);
  }
  return { zones, skipped, skippedList, rooms: keep.length, level: pick };
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
