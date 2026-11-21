/* ===================================================================================
   KO Studio — מנוע הסריקה של KO Projects (src/plantext.js) בתוך Studio
   אורי, 22.11.2026: "באשף ובסטודיו תכניס את הקנה מידה אוטומטית, ואת סימון האזורים תציע ישר".
   עד היום היה ל-Studio מנגנון משלו (OCR על רצועות השוליים — עד דקה; "חללים" כמלבנים). כאן אותו קוד
   בדיוק של KO Projects רץ בתוך פונקציה סגורה, מול "מתאם" קטן שמציג לו את התכנית של Studio כפרויקט:
   S.plan = תמונת הרקע, S.scale = מטר לפיקסל ברוחב 1400, בלי היסט. שום דבר לא דולף לשמות של Studio.
   scripts/assemble.js מחליף את הסמן שלמטה בתוכן של src/plantext.js.
   =================================================================================== */
const KOSCAN = (function () {
  const ctx = { pdf: null, pdfFor: null, zones: [], planText: undefined };
  /* הפרויקט כפי שהמנוע רואה אותו */
  const P = {
    id: 'studio', curSheet: 's', bgOff: { x: 0, y: 0 }, bgPdfPage: 1, bgRot: 0, autoScale: null, sketch: null,
    get bg() { return S.plan; }, get scale() { return S.scale; }, set scale(v) { /* הכיול נקבע ב-Studio עצמו */ },
    get bgW() { return S.planW || 1400; },
    get zones() { return ctx.zones; }, set zones(v) { ctx.zones = v || []; },
    get planText() { return ctx.planText; }, set planText(v) { ctx.planText = v; },
    /* שכבת הטקסט של ה-PDF תקפה רק כל עוד התמונה לא נחתכה (אחרת המיקומים לא מתאימים) — אז הכיתובים נקראים ב-OCR מהתמונה */
    get bgPdf() { return ctx.pdf && ctx.pdfFor === S.plan ? 'pdf' : undefined; }
  };
  const store = { zoneRel: {} };
  const noop = () => {};
  const render = noop, save = noop, uiToast = noop, asApplyRatioN = noop;
  const asScaleFromText = () => null, asPdfPage = async () => null, skWallClosed = () => false;
  const asNiceRatios = () => [10, 20, 25, 30, 40, 50, 75, 100, 125, 150, 200, 250, 300, 400, 500, 750, 1000];
  const loadScript = u => liteLoadScript(u);
  const uid = pre => (pre || 'z') + Math.random().toString(36).slice(2, 9);
  const bgLeft = () => 0, bgTop = () => 0, bgHeightPx = () => S.planH || 900;
  const bgPdfBytes = () => ctx.pdf.slice();   /* pdf.js מעביר את המאגר ל-worker — כל קריאה מקבלת עותק */
  /* אזור בפורמט של KO Projects: מצולע בקואורדינטות התכנית, או מלבן עם x משוקף (2200 − ימין) */
  const inZone = (z, pt) => {
    if (z.poly) { let inside = false; const p = z.poly; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i].y > pt.y) !== (p[j].y > pt.y) && pt.x < (p[j].x - p[i].x) * (pt.y - p[i].y) / (p[j].y - p[i].y) + p[i].x) inside = !inside; return inside; }
    const L = 2200 - z.x - z.w; return pt.x >= L && pt.x <= L + z.w && pt.y >= z.y && pt.y <= z.y + z.h;
  };
  const zoneBounds = z => {
    if (z.poly) { const xs = z.poly.map(p => p.x), ys = z.poly.map(p => p.y); return { L: Math.min(...xs), T: Math.min(...ys), W: Math.max(...xs) - Math.min(...xs), H: Math.max(...ys) - Math.min(...ys) }; }
    return { L: 2200 - z.x - z.w, T: z.y, W: z.w, H: z.h };
  };
  const zoneArea = z => { if (!z.poly) return z.w * z.h; let a = 0; const p = z.poly; for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; a += p[i].x * q.y - q.x * p[i].y; } return Math.abs(a) / 2; };
  const zoneRectPts = z => { const L = 2200 - z.x - z.w, R = 2200 - z.x, T = z.y, B = z.y + z.h; return [{ x: L, y: T }, { x: R, y: T }, { x: R, y: B }, { x: L, y: B }]; };

  /*__PLANTEXT__*/

  /* קנה מידה: האיתור המהיר לפי צורת הכיתוב "1:N" (ועל רינדור מלא של דף ה-PDF אם יש), עם גיבוי קצר ברצועות השוליים */
  async function scale(o) { o = o || {}; return ptScaleScan(null, { pg: o.pg, pageMm: o.pageMm }); }
  /* אזורים: אותה זרימה של autoZones ב-KO Projects — כיתובים, שני המנועים, ובחירה לפי חדרי הקהל שזוהו בשמם */
  async function zones() {
    ctx.zones = []; ctx.planText = undefined; window.__rfPlain = true;
    try {
      try { await planTextScan({ noScale: true }); } catch (e) { console.warn('KOSCAN labels', e); }
      let info = null; try { info = await zonesByWalls(); } catch (e) { console.warn('KOSCAN walls', e); }
      try { const li = await zonesByLines(); if (li && li.zones.length && (!info || !info.zones.length || zoneScoreBetter(zoneNamedScore(li), zoneNamedScore(info), 1.3))) info = li; } catch (e) { console.warn('KOSCAN lines', e); }
      return ((info && info.zones) || []).map(z => ({ name: z.name, usage: z.usage || '', m2: z._m2 || 0, poly: (z.poly || zoneRectPts(z)).map(p => ({ x: p.x, y: p.y })) }));
    } finally { window.__rfPlain = false; window.__ptBusy = false; }
  }
  return { scale, zones, setPdf(bytes, url) { ctx.pdf = bytes || null; ctx.pdfFor = url || null; } };
})();
