/* ===================================================================================
   KO Projects — רקע חד בכל זום.
   PDF שמועלה נשמר בפרויקט (P.bgPdf, base64) ולא רק כתמונה מוקטנת. בכל שינוי זום/גלילה
   האזור הנראה של התכנית מעובד מחדש מה-PDF (וקטורי) ברזולוציית המסך, ומונח כאריח
   (#bgtile) מעל תמונת התצוגה המקדימה (#bgimg). כך אין טשטוש גם בזום עמוק, והזיכרון
   מוגבל לגודל המסך ולא לגודל התכנית.
   תמונה (JPG/PNG) — אין וקטור; נשמרת ברזולוציה גבוהה יותר (עד 3000px).
   =================================================================================== */
/* var (לא const): הרינדור הראשון של app.js רץ לפני שהקובץ הזה מאותחל */
var BGS = { doc: null, page: null, docFor: '', task: null, t: null, key: '' };
function bgSharpSchedule(ms) { if (!BGS) return; clearTimeout(BGS.t); BGS.t = setTimeout(bgSharpRender, ms == null ? 160 : ms); }
function bgSharpReset() { if (!BGS) return; BGS.doc = null; BGS.page = null; BGS.docFor = ''; BGS.key = ''; const t = document.getElementById('bgtile'); if (t) t.style.display = 'none'; }
function bgPdfBytes() {
  const b64 = P.bgPdf.replace(/^data:[^,]*,/, '');
  const bin = atob(b64), arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}
async function bgSharpRender() {
  const tile = document.getElementById('bgtile'); if (!tile) return;
  if (!P.bgPdf || !P.bg) { tile.style.display = 'none'; return; }
  try {
    if (!window.pdfjsLib) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    const docKey = P.id + ':' + P.bgPdf.length + ':' + (P.bgPdfPage || 1);
    if (BGS.docFor !== docKey) {
      BGS.doc = await pdfjsLib.getDocument({ data: bgPdfBytes() }).promise;
      BGS.page = await BGS.doc.getPage(P.bgPdfPage || 1);
      BGS.docFor = docKey; BGS.key = '';
    }
    const pg = BGS.page, Z = getZ(), dpr = Math.min(2, window.devicePixelRatio || 1);
    const wrap = document.getElementById('canvasWrap');
    const L = bgLeft(), T = bgTop(), W = P.bgW || 1400, H = bgHeightPx();
    /* תמונת התצוגה המקדימה מספיקה? (פיקסלים אמיתיים לכל פיקסל-קנבס) */
    const im = document.getElementById('bgimg');
    const prevRes = im && im.naturalWidth ? im.naturalWidth / W : 1;
    if (Z * dpr <= prevRes * 1.02) { tile.style.display = 'none'; BGS.key = ''; return; }
    /* האזור הנראה בקואורדינטות הקנבס: RTL — scrollLeft שלילי, המקור בימין-למעלה */
    const right = 2200 + wrap.scrollLeft / Z, left = right - wrap.clientWidth / Z;
    const top = wrap.scrollTop / Z, bottom = top + wrap.clientHeight / Z;
    const mx = (right - left) * 0.2, my = (bottom - top) * 0.2;
    const x0 = Math.max(L, left - mx), x1 = Math.min(L + W, right + mx), y0 = Math.max(T, top - my), y1 = Math.min(T + H, bottom + my);
    if (x1 - x0 < 2 || y1 - y0 < 2) { tile.style.display = 'none'; return; }
    let S = Z * dpr;                                     /* פיקסלים אמיתיים לכל פיקסל-קנבס */
    S = Math.min(S, 4096 / (x1 - x0), 4096 / (y1 - y0));
    const key = [x0, y0, x1, y1, S, P.bgRot || 0, P.bgOp ?? 0.5].map(v => Math.round(v * 100)).join('|');
    if (key === BGS.key && tile.style.display !== 'none') return;
    const vp0 = pg.getViewport({ scale: 1, rotation: P.bgRot || 0 });
    const ptPerCss = vp0.width / W;                      /* נקודות PDF לכל פיקסל-קנבס */
    const vp = pg.getViewport({ scale: S / ptPerCss, rotation: P.bgRot || 0, offsetX: -(x0 - L) * S, offsetY: -(y0 - T) * S });
    const cw = Math.round((x1 - x0) * S), ch = Math.round((y1 - y0) * S);
    if (BGS.task) { try { BGS.task.cancel(); } catch (e) {} BGS.task = null; }
    const off = document.createElement('canvas'); off.width = cw; off.height = ch;
    const ctx = off.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cw, ch);
    const task = pg.render({ canvasContext: ctx, viewport: vp });
    BGS.task = task;
    await task.promise;
    if (BGS.task !== task) return;                       /* בקשה חדשה יותר כבר רצה */
    BGS.task = null;
    tile.width = cw; tile.height = ch; tile.getContext('2d').drawImage(off, 0, 0);
    tile.style.left = x0 + 'px'; tile.style.top = y0 + 'px';
    tile.style.width = (x1 - x0) + 'px'; tile.style.height = (y1 - y0) + 'px';
    tile.style.opacity = P.bgOp ?? 0.5; tile.style.display = 'block';
    BGS.key = key;
  } catch (e) {
    if (!/cancel/i.test(String((e && e.name) || e))) console.warn('bgSharp', e);
  }
}
/* גלילה / שינוי גודל חלון → אריח חדש */
document.addEventListener('DOMContentLoaded', () => {
  const wrap = document.getElementById('canvasWrap');
  if (wrap) wrap.addEventListener('scroll', () => bgSharpSchedule(120), { passive: true });
  window.addEventListener('resize', () => bgSharpSchedule(200));
});
window.bgSharpSchedule = bgSharpSchedule;
