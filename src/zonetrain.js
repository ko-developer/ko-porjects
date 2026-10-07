/* ===================================================================================
   🎓 אימון אזורים — הסימונים הידניים של אורי הם האמת; הזיהוי האוטומטי נמדד מולם.
   כל דוגמה = פרויקט + תכנית + האזורים הנכונים (קואורדינטות יחסיות לתמונת התכנית, 0–1).
   "הרץ" מריץ את החלוקה האוטומטית על אותה תכנית בלי לשמור, ומשווה: חפיפה (IoU) לכל אזור,
   אזורים חסרים / מיותרים / מפוצלים, וציון כולל. הדוגמאות נשארות כבדיקת רגרסיה לכל שינוי במנגנון.
   =================================================================================== */
function ztList() { store.zoneTrain = store.zoneTrain || []; return store.zoneTrain; }
function ztRel(pts) { const L = bgLeft(), T = bgTop(), W = P.bgW || 1400, H = bgHeightPx(); return pts.map(p => [+((p.x - L) / W).toFixed(4), +((p.y - T) / H).toFixed(4)]); }
function ztZones() { return (P.zones || []).map(z => ({ name: z.name, usage: z.usage || '', poly: ztRel(z.poly || zoneRectPts(z)) })); }
/* שמירת החלוקה שעל המסך כ"אמת" לאימון (מחליפה דוגמה קודמת של אותה תכנית) */
function ztSave() {
  if (!P.bg || !(P.zones || []).length) { uiToast('אין תכנית או אזורים לשמור כדוגמת אימון'); return; }
  const sh = curSheet(P), list = ztList(), prev = list.find(e => e.pid === P.id && e.sid === (sh && sh.id));
  const img = new Image();
  img.onload = () => {
    const k = Math.min(1, 560 / img.width), cv = document.createElement('canvas'); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
    const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(img, 0, 0, cv.width, cv.height);
    const ex = { id: prev ? prev.id : uid('zt'), pid: P.id, sid: sh && sh.id, name: P.name + ((P.sheets || []).length > 1 && sh ? ' · ' + sh.name : ''), at: new Date().toISOString(), scale: P.scale || 0, zones: ztZones(), note: prev ? prev.note : '', thumb: cv.toDataURL('image/jpeg', 0.55), last: null };
    if (prev) list[list.indexOf(prev)] = ex; else list.push(ex);
    save(); render();
    uiToast('🎓 נשמר כדוגמת אימון (' + ex.zones.length + ' אזורים) — ' + list.length + ' דוגמאות', 5000);
  };
  img.onerror = () => uiToast('לא הצלחתי לקרוא את תמונת התכנית');
  img.src = P.bg;
}
/* רסטר של פוליגון יחסי על רשת GW×GH */
function ztRaster(poly, GW, GH) {
  const m = new Uint8Array(GW * GH); if (!poly || poly.length < 3) return m;
  for (let y = 0; y < GH; y++) { const py = (y + 0.5) / GH; const xs = [];
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > py) !== (yj > py)) xs.push(xi + (py - yi) / (yj - yi) * (xj - xi)); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) { const x0 = Math.max(0, Math.round(xs[k] * GW)), x1 = Math.min(GW, Math.round(xs[k + 1] * GW)); for (let x = x0; x < x1; x++) m[y * GW + x] = 1; } }
  return m;
}
/* השוואה: לכל אזור-אמת האזור המזוהה הקרוב ביותר; ציון = ממוצע החפיפה פחות קנס על מיותרים */
function ztScore(truth, det, aspect) {
  const GW = 360, GH = Math.max(40, Math.round(360 * (aspect || 0.7)));
  const T = truth.map(z => ztRaster(z.poly, GW, GH)), D = det.map(z => ztRaster(z.poly, GW, GH));
  const cnt = m => { let n = 0; for (let i = 0; i < m.length; i++) n += m[i]; return n; };
  const iou = (a, b) => { let i = 0, u = 0; for (let k = 0; k < a.length; k++) { if (a[k] && b[k]) i++; if (a[k] || b[k]) u++; } return u ? i / u : 0; };
  const inter = (a, b) => { let i = 0; for (let k = 0; k < a.length; k++) if (a[k] && b[k]) i++; return i; };
  const per = truth.map((z, ti) => {
    const tn = cnt(T[ti]) || 1; let best = -1, bi = 0; const parts = [];
    D.forEach((d, di) => { const v = iou(T[ti], d); if (v > bi) { bi = v; best = di; } if (inter(T[ti], d) / tn >= 0.2) parts.push(di); });
    return { name: z.name, iou: +bi.toFixed(2), best, split: parts.length >= 2 ? parts.length : 0, missing: bi < 0.3 };
  });
  const used = new Set(per.filter(p => !p.missing).map(p => p.best));
  const extras = det.map((z, di) => ({ name: z.name, di, ok: used.has(di) || T.some(t => inter(t, D[di]) / (cnt(D[di]) || 1) >= 0.6) })).filter(e => !e.ok).map(e => e.name);
  const mean = per.length ? per.reduce((s, p) => s + p.iou, 0) / per.length : 0;
  const grade = Math.max(0, Math.min(100, Math.round(100 * mean - 10 * extras.length)));
  return { grade, mean: +mean.toFixed(2), per, extras, nDet: det.length };
}
/* הרצת הזיהוי האוטומטי על דוגמה — בלי לשמור, ומחזירים את המסך למצבו */
async function ztRun(exId) {
  const ex = ztList().find(e => e.id === exId); if (!ex) return;
  const pr = store.projects.find(p => p.id === ex.pid); if (!pr) { ex.last = { err: 'הפרויקט נמחק' }; return ex.last; }
  const prevPid = P.id, prevSid = P.curSheet;
  const save0 = window.save, push0 = window.pushSrv, toast0 = window.uiToast;
  window.save = () => {}; window.pushSrv = () => {}; window.uiToast = () => {};
  const t0 = Date.now(); let err = null, det = [];
  try {
    if (P.id !== ex.pid) switchProj(ex.pid);
    if (ex.sid && P.curSheet !== ex.sid) { P.curSheet = ex.sid; render(); }
    if (!P.bg && typeof sheetFetchBg === 'function') { try { await sheetFetchBg(P, curSheet(P), true); } catch (e) {} }
    if (!P.bg) throw new Error('אין תמונת תכנית');
    const orig = JSON.stringify(P.zones || []);
    try {
      P.zones = [];
      if (!(P.planText && P.planText.items) && typeof planTextScan === 'function') await planTextScan();
      await ptPartition();
      det = ztZones();
    } catch (e) { err = String(e && e.message || e); console.warn('ztRun', e); }
    finally { P.zones = JSON.parse(orig); }
  } catch (e) { err = String(e && e.message || e); }
  finally {
    window.save = save0; window.pushSrv = push0; window.uiToast = toast0;
    if (P.id !== prevPid) switchProj(prevPid); else { if (P.curSheet !== prevSid) P.curSheet = prevSid; render(); }
  }
  const aspect = ex.thumb ? await new Promise(r => { const im = new Image(); im.onload = () => r(im.height / im.width); im.onerror = () => r(0.7); im.src = ex.thumb; }) : 0.7;
  ex.last = { at: Date.now(), ms: Date.now() - t0, err, det, ...ztScore(ex.zones, det, aspect) };
  save();
  return ex.last;
}
async function ztRunAll() {
  const list = ztList(); let i = 0;
  for (const ex of list) { i++; const h = document.getElementById('ztStat'); if (h) h.textContent = '⏳ מריץ ' + i + '/' + list.length + ' — ' + ex.name; try { await ztRun(ex.id); } catch (e) { console.warn(e); } ztRender(); }
  const h = document.getElementById('ztStat'); if (h) h.textContent = '';
}
/* ציור דוגמה: תמונת התכנית + אמת (ירוק) + זיהוי אחרון (כתום מקווקו) */
function ztDraw(cv, ex, w) {
  const im = new Image();
  im.onload = () => {
    const k = w / im.width; cv.width = w; cv.height = Math.round(im.height * k);
    const g = cv.getContext('2d'); g.drawImage(im, 0, 0, cv.width, cv.height);
    const path = poly => { g.beginPath(); poly.forEach((p, j) => { const x = p[0] * cv.width, y = p[1] * cv.height; j ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); };
    ex.zones.forEach(z => { path(z.poly); g.fillStyle = 'rgba(0,160,90,.22)'; g.fill(); g.lineWidth = Math.max(1.5, w / 300); g.strokeStyle = '#00a05a'; g.setLineDash([]); g.stroke(); });
    (ex.last && ex.last.det || []).forEach(z => { path(z.poly); g.fillStyle = 'rgba(230,100,0,.14)'; g.fill(); g.lineWidth = Math.max(1.5, w / 350); g.strokeStyle = '#e06000'; g.setLineDash([6, 4]); g.stroke(); });
    g.setLineDash([]);
  };
  im.src = ex.thumb || '';
}
function ztBig(exId) {
  const ex = ztList().find(e => e.id === exId); if (!ex) return;
  const old = document.getElementById('ztBig'); if (old) old.remove();
  const ov = document.createElement('div'); ov.id = 'ztBig';
  ov.style.cssText = 'position:fixed;inset:0;z-index:160;background:rgba(15,18,26,.9);display:flex;flex-direction:column;align-items:center;direction:rtl;padding:10px;gap:6px';
  ov.innerHTML = `<div style="color:#fff;font-size:13px;display:flex;gap:14px;align-items:center"><b>${esc(ex.name)}</b><span style="color:#7fe0b0">■ הסימון שלך</span><span style="color:#ffb070">▦ הזיהוי האוטומטי</span><button data-x style="padding:4px 12px;border-radius:7px;border:none;cursor:pointer">סגור</button></div><canvas style="max-width:100%;max-height:calc(100vh - 60px);background:#fff;border-radius:8px"></canvas>`;
  document.body.appendChild(ov);
  ov.querySelector('[data-x]').onclick = () => ov.remove(); ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  ztDraw(ov.querySelector('canvas'), ex, Math.min(1600, window.innerWidth - 40));
}
function ztDel(exId) { uiConfirm('למחוק את דוגמת האימון הזו?').then(ok => { if (!ok) return; store.zoneTrain = ztList().filter(e => e.id !== exId); save(); ztRender(); render(); }); }
function ztOpen(exId) { const ex = ztList().find(e => e.id === exId); if (!ex) return; document.getElementById('ztOv')?.remove(); switchProj(ex.pid); if (ex.sid && P.curSheet !== ex.sid) sheetGo(ex.sid); }
function ztRender() {
  const host = document.getElementById('ztBody'); if (!host) return;
  const list = ztList();
  const graded = list.filter(e => e.last && !e.last.err);
  const avg = graded.length ? Math.round(graded.reduce((s, e) => s + e.last.grade, 0) / graded.length) : null;
  const col = g => g >= 85 ? '#0f6e56' : g >= 60 ? '#b7791f' : '#c0392b';
  const hdr = document.getElementById('ztAvg'); if (hdr) hdr.innerHTML = avg == null ? '' : `ציון ממוצע <b style="color:${col(avg)};font-size:18px">${avg}</b> / 100 · ${graded.length} מתוך ${list.length} דוגמאות נבדקו`;
  host.innerHTML = list.length ? list.map(ex => {
    const r = ex.last;
    const res = !r ? '<span class="muted">עוד לא הורץ</span>' : r.err ? `<span style="color:#c0392b">שגיאה: ${esc(r.err)}</span>` :
      `<b style="color:${col(r.grade)};font-size:20px">${r.grade}</b><span class="muted" style="font-size:10.5px"> / 100 · ${r.nDet} אזורים זוהו · ${(r.ms / 1000).toFixed(1)} שנ׳</span>
       <div style="font-size:11px;margin-top:3px">${r.per.map(p => `<div>${p.missing ? '❌' : p.iou >= 0.8 ? '✅' : '⚠️'} ${esc(p.name)} — חפיפה ${Math.round(p.iou * 100)}%${p.split ? ' · מפוצל ל-' + p.split : ''}${p.missing ? ' · חסר' : ''}</div>`).join('')}
       ${r.extras.length ? `<div style="color:#c0392b">➕ מיותרים: ${r.extras.map(esc).join(', ')}</div>` : ''}</div>`;
    return `<div style="display:flex;gap:10px;border:1px solid #e3e6ee;border-radius:10px;padding:8px;margin-bottom:8px;background:#fff;align-items:flex-start">
      <canvas data-ex="${ex.id}" onclick="ztBig('${ex.id}')" style="width:260px;flex:none;border-radius:6px;cursor:zoom-in;background:#f4f4f4" title="לחץ להגדלה"></canvas>
      <div style="flex:1;min-width:0">
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><b style="font-size:13px">${esc(ex.name)}</b><span class="muted" style="font-size:10.5px">${esc(ex.at.slice(0, 10))} · ${ex.zones.length} אזורים: ${ex.zones.map(z => esc(z.name)).join(', ')}</span></div>
        <input value="${esc(ex.note || '')}" placeholder="למה הגבול עובר כאן? (קיר / מעקה / סוף הריהוט / מפלס…)" style="width:100%;margin:4px 0;font-size:11.5px" onchange="ztList().find(e=>e.id==='${ex.id}').note=this.value;save()">
        <div>${res}</div>
        <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">
          <button style="background:#0f6e56;color:#fff;border:none;font-weight:700" onclick="this.disabled=true;this.textContent='⏳';ztRun('${ex.id}').then(()=>ztRender())">▶ הרץ זיהוי</button>
          <button onclick="ztOpen('${ex.id}')">↗ פתח את התכנית</button>
          <button style="color:#c0392b" onclick="ztDel('${ex.id}')">🗑</button>
        </div>
      </div></div>`;
  }).join('') : '<p class="hint">אין עדיין דוגמאות. סמן את החלוקה הנכונה על תכנית ולחץ "🎓 שמור כחלוקה נכונה לאימון" בפאנל האזורים.</p>';
  host.querySelectorAll('canvas[data-ex]').forEach(cv => ztDraw(cv, list.find(e => e.id === cv.dataset.ex), 520));
}
function zoneTrainOpen() {
  document.getElementById('ztOv')?.remove();
  const ov = document.createElement('div'); ov.id = 'ztOv';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(18,20,26,.6);z-index:130;display:flex;align-items:center;justify-content:center;direction:rtl';
  ov.innerHTML = `<div style="background:#f7f8fb;border-radius:14px;padding:14px 16px;width:min(1100px,96vw);max-height:92vh;display:flex;flex-direction:column;gap:8px;box-shadow:0 12px 40px rgba(0,0,0,.4)">
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <b style="font-size:15px">🎓 אימון אזורים</b>
      <span id="ztAvg" style="font-size:12px"></span>
      <span id="ztStat" style="font-size:11.5px;color:#b7791f;flex:1"></span>
      <button style="background:#0f6e56;color:#fff;border:none;font-weight:700" onclick="ztRunAll()">▶ הרץ הכל</button>
      <button data-x>סגור</button>
    </div>
    <p class="muted" style="font-size:11px;margin:0">ירוק = הסימון שלך (האמת) · כתום מקווקו = מה שהזיהוי האוטומטי מצא. הציון: ממוצע החפיפה של כל אזור שלך עם האזור המזוהה הקרוב, פחות 10 לכל אזור מיותר.</p>
    <div class="fld" style="margin:0"><label>📝 כללים והערות שלך (מה שברור לך בתכנית ולא למנגנון)</label><textarea rows="3" style="width:100%;font-size:11.5px" onchange="store.zoneTrainNotes=this.value;save()">${esc(store.zoneTrainNotes || '')}</textarea></div>
    <div id="ztBody" style="overflow-y:auto;flex:1"></div>
  </div>`;
  document.body.appendChild(ov);
  ov.querySelector('[data-x]').onclick = () => ov.remove(); ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  ztRender();
}
