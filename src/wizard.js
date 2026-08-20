/* ===================================================================================
   KO Projects V2 — אשף זרימה מהיר
   אותו מנוע בדיוק (app.js) בעטיפת UI מונחית-שלבים: תכנית → כיול → אזור → מערכת →
   הצעה מלאה → דוח מתקינים. נטען בכל הגרסאות; ב-/v2 נפתח אוטומטית במסך נקי.
   =================================================================================== */
let WIZ = null; /* { step } */

const WIZ_STEPS = [
  ['plan', '🖼 תכנית'], ['cal', '📏 כיול'], ['zone', '🗺 אזור'],
  ['sys', '🔊 מערכת'], ['offer', '🧾 הצעה'], ['report', '📑 דוח']
];

function wizardStart() {
  WIZ = { step: wizAutoStep() };
  if (!document.getElementById('wizCss')) {
    const st = document.createElement('style');
    st.id = 'wizCss';
    st.textContent = `
      #wiz{position:fixed;top:12px;left:12px;width:340px;max-height:calc(100vh - 24px);z-index:90;background:#fff;border-radius:16px;box-shadow:0 14px 44px rgba(15,20,30,.28);display:flex;flex-direction:column;font-size:13.5px;overflow:hidden;border:1px solid #e7e2d8}
      #wiz .wzhead{background:linear-gradient(135deg,#1a1e28,#2d3444);color:#fff;padding:12px 14px;display:flex;align-items:center;gap:8px}
      #wiz .wzhead b{flex:1;font-size:15px}
      #wiz .wzsteps{display:flex;gap:2px;padding:8px 10px;background:#f7f5f0;border-bottom:1px solid #eee;flex-wrap:nowrap;overflow-x:auto}
      #wiz .wzstep{flex:1;text-align:center;font-size:10.5px;padding:5px 2px;border-radius:8px;cursor:pointer;white-space:nowrap;color:#777}
      #wiz .wzstep.on{background:#c9502e;color:#fff;font-weight:700}
      #wiz .wzstep.done{color:#0f6e56;font-weight:700}
      #wiz .wzbody{padding:12px 14px;overflow-y:auto}
      #wiz .wzbody h4{margin:0 0 6px;font-size:14px}
      #wiz .wzbody p.hint{font-size:11.5px;color:#8a8377;margin:0 0 10px;line-height:1.5}
      #wiz button.big{display:block;width:100%;padding:10px;border-radius:10px;border:none;background:#c9502e;color:#fff;font-weight:700;font-size:13.5px;cursor:pointer;margin-bottom:7px}
      #wiz button.sec{display:block;width:100%;padding:8px;border-radius:10px;border:1px solid #ddd;background:#faf8f4;font-size:12.5px;cursor:pointer;margin-bottom:7px}
      #wiz button.done{background:#eef7f1;color:#0f6e56;border:1px solid #bfe0cd}
      #wiz input,#wiz select{width:100%;padding:8px;border:1px solid #ddd;border-radius:9px;font-size:13.5px;box-sizing:border-box;margin-bottom:7px;font-family:inherit}
      #wiz .wzfoot{padding:8px 14px 12px;display:flex;gap:6px;border-top:1px solid #f0ede6}
      #wiz .wzfoot button{flex:1;padding:8px;border-radius:9px;border:1px solid #ddd;background:#fff;cursor:pointer;font-size:12.5px}
      #wiz .wzfoot button.nx{background:#0f6e56;color:#fff;border:none;font-weight:700}
      #wiz .kpi{display:flex;gap:6px;margin-bottom:8px}
      #wiz .kpi div{flex:1;background:#f7f5f0;border-radius:9px;padding:6px;text-align:center}
      #wiz .kpi b{display:block;font-size:16px}
      #wiz .kpi small{font-size:9.5px;color:#8a8377}
      body.v2 header, body.v2 #side, body.v2 #dock, body.v2 #legend, body.v2 #cablekey{display:none !important}
      body.v2 #canvasWrap{inset:0 !important;width:100vw !important}
      body.v2.wzdock #dock{display:block !important}`;
    document.head.appendChild(st);
  }
  wizRender();
  clearInterval(window.__wizT);
  window.__wizT = setInterval(() => { if (WIZ && document.getElementById('wiz')) wizRefreshBadges(); }, 1200);
}
function wizClose() { WIZ = null; clearInterval(window.__wizT); const w = document.getElementById('wiz'); if (w) w.remove(); document.body.classList.remove('wzdock'); }

/* השלב ההגיוני הבא לפי מצב הפרויקט — נכנסים ישר לאיפה שעצרת */
function wizAutoStep() {
  if (!P.bg) return 0;
  if (!P.scale) return 1;
  if (!(P.zones || []).length) return 2;
  if (!(P.zones || []).some(z => z._built)) return 3;
  return 4;
}
function wizZone() { return (P.zones || []).find(z => z.id === WIZ?.zid) || (P.zones || [])[0]; }
function wizDone(i) {
  const z = wizZone();
  return [!!P.bg, !!P.scale, !!(P.zones || []).length, !!(z && z._built), impItems.length > 0, false][i];
}
function wizRefreshBadges() {
  document.querySelectorAll('#wiz .wzstep').forEach((el, i) => el.classList.toggle('done', wizDone(i) && i !== WIZ.step));
}

function wizRender() {
  const old = document.getElementById('wiz'); if (old) old.remove();
  if (!WIZ) return;
  const w = document.createElement('div');
  w.id = 'wiz';
  const steps = WIZ_STEPS.map(([k, l], i) =>
    `<div class="wzstep ${i === WIZ.step ? 'on' : ''} ${wizDone(i) && i !== WIZ.step ? 'done' : ''}" onclick="WIZ.step=${i};wizRender()">${wizDone(i) && i !== WIZ.step ? '✓ ' : ''}${l}</div>`).join('');
  w.innerHTML = `
    <div class="wzhead"><b>⚡ KO V2 — אשף מהיר</b>
      <span style="font-size:11px;opacity:.75">${esc(P.name.slice(0, 18))}</span>
      <button onclick="wizClose()" style="background:transparent;border:none;color:#fff;font-size:15px;cursor:pointer" title="סגור אשף">✕</button></div>
    <div class="wzsteps">${steps}</div>
    <div class="wzbody" id="wizBody">${wizStepHTML(WIZ.step)}</div>
    <div class="wzfoot">
      <button onclick="WIZ.step=Math.max(0,WIZ.step-1);wizRender()" ${WIZ.step === 0 ? 'disabled' : ''}>▶ הקודם</button>
      <button class="nx" onclick="WIZ.step=Math.min(${WIZ_STEPS.length - 1},WIZ.step+1);wizRender()" ${WIZ.step === WIZ_STEPS.length - 1 ? 'disabled' : ''}>הבא ◀</button>
    </div>`;
  document.body.appendChild(w);
}

function wizStepHTML(s) {
  const z = wizZone();
  if (s === 0) return `
    <h4>העלאת תכנית</h4>
    <p class="hint">גרור/בחר צילום או PDF-תמונה של התכנית. אפשר גם להמשיך עם התכנית הקיימת.</p>
    ${P.bg ? `<button class="sec done">✓ יש תכנית בפרויקט — אפשר להמשיך</button>` : ''}
    <input type="file" accept="image/*" onchange="wizUploadBg(this)">
    <button class="sec" onclick="wizNewProject()">🗂 התחל פרויקט חדש נקי</button>`;
  if (s === 1) return `
    <h4>כיול קנה מידה</h4>
    ${P.scale ? `<button class="sec done">✓ מכויל — 1 מ׳ = ${(1 / P.scale).toFixed(1)}px</button>` : `<p class="hint">הדרך המהירה: הקלד את רוחב השטח המצולם במטרים. לדיוק מלא — שתי לחיצות על מידה ידועה.</p>`}
    <input id="wizWidthM" type="number" step="0.1" placeholder="רוחב התכנית במטרים (למשל 23.7)">
    <button class="big" onclick="wizCalByWidth()">⚡ כייל לפי רוחב</button>
    <button class="sec" onclick="calMode={pts:[]};render()">📏 כיול מדויק — לחץ על 2 נקודות שהמרחק ביניהן ידוע</button>`;
  if (s === 2) return `
    <h4>סימון אזור סאונד</h4>
    ${(P.zones || []).map(zz => `<button class="sec ${zz.id === (WIZ.zid || (P.zones[0] || {}).id) ? 'done' : ''}" onclick="WIZ.zid='${zz.id}';selZone='${zz.id}';render();wizRender()">🗺 ${esc(zz.name)} · ${zoneAreaM(zz).toFixed(0)} מ"ר</button>`).join('')}
    <input id="wizZName" placeholder="שם האזור (למשל: מסעדה / רחבה)">
    <button class="big" onclick="wizDrawZone()">➕ צייר אזור — ניקור נקודות על התכנית</button>
    <button class="sec" onclick="autoZones()">🤖 זיהוי אזורים אוטומטי (AI)</button>`;
  if (s === 3) {
    if (!z) return '<p class="hint">קודם סמן אזור בשלב הקודם.</p>';
    const usages = ['מוזיקת רקע', 'בית קפה', 'מסעדה', 'מוזיקה לבר', 'הופעות חיות', 'מוזיקת ריקודים', 'מועדון על מלא'];
    return `
    <h4>מערכת לאזור "${esc(z.name)}"</h4>
    <select onchange="setZoneField('${z.id}','usage',this.value)">
      <option value="">— תכלית / עוצמה —</option>
      ${usages.map(u => `<option ${z.usage === u ? 'selected' : ''}>${u}</option>`).join('')}
    </select>
    <input id="wizKitQ" placeholder="🔍 חפש קיט או רמקול…" oninput="wizKitSearch(this.value)">
    <div id="wizKitRes" style="max-height:150px;overflow-y:auto"></div>
    <p class="hint" style="margin-top:4px">${z._spk ? '🔊 ' + esc(z._spk.slice(0, 42)) : 'לא נבחר רמקול — הבנייה תציע מהקטלוג'}</p>
    <label style="display:flex;gap:6px;align-items:center;font-size:12px;margin-bottom:7px"><input type="checkbox" style="width:auto" ${z._djInRack !== false ? 'checked' : ''} onchange="const zz=wizZone();zz._djInRack=this.checked;save()"> 🖥 מוזיקה ממחשב בארון (בלי עמדת DJ)</label>
    <button class="big" onclick="wizBuildAll()">🚀 בנה הכל — מערכת + ארון + חיווט</button>
    ${z._built ? '<button class="sec done">✓ נבנתה — לחיצה על "בנה הכל" תבנה מחדש</button>' : ''}`;
  }
  if (s === 4) {
    const rows = impItems.filter(it => it.on !== false);
    const total = rows.reduce((s2, it) => s2 + (+it.price || 0) * (+it.qty || 0), 0);
    const noKey = rows.filter(it => !it.key).length;
    const cablesNoRef = P.cables.filter(c => !c.stockRef && c.inst !== 'exist' && +c.len > 0).length;
    return `
    <h4>הצעת מחיר מלאה</h4>
    <div class="kpi"><div><b>${rows.length}</b><small>שורות</small></div><div><b>₪${Math.round(total).toLocaleString()}</b><small>לפני מע"מ</small></div><div><b>${P.cables.length}</b><small>כבלים</small></div></div>
    ${cablesNoRef ? `<button class="big" onclick="wizFillCables()">🧵 השלם פריטי כבלים (${cablesNoRef} קווים ללא מוצר)</button>` : '<button class="sec done">✓ כל הכבלים משויכים למוצרים</button>'}
    ${noKey ? `<p class="hint">⚠ ${noKey} שורות בלי מק"ט — פתח את ההצעה להשלמה.</p>` : ''}
    <button class="sec" onclick="document.body.classList.toggle('wzdock');dockOpen=true;dockMin=false;renderImp()">🧾 הצג/הסתר את ההצעה המלאה</button>
    <button class="big" style="background:#0f6e56" onclick="sendOffer()">📤 שלח הצעה ל-ERP</button>`;
  }
  return `
    <h4>דוחות</h4>
    <p class="hint">דוח המתקינים כולל: לוח ארונות, לוח משיכת כבלים (מ→אל, סוג, אורך, מחברים), לוח תליית רמקולים (גובה/תושבת/כיוון) ורשימת ציוד.</p>
    <button class="big" onclick="installerReport()">🔧 דוח מתקינים / חשמלאים</button>
    <button class="sec" onclick="window.print()">🖨 הדפסת התכנית והמפתח (הקיים)</button>`;
}

/* ---- פעולות האשף ---- */
function wizUploadBg(inp) {
  const f = inp.files && inp.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => { P.bg = r.result; P.bgW = P.bgW || 1400; render(); save(); WIZ.step = 1; wizRender(); uiToast('✓ התכנית נטענה — עכשיו כיול'); };
  r.readAsDataURL(f);
}
function wizNewProject() { newProj(); WIZ.step = 0; wizRender(); }
function wizCalByWidth() {
  const m = parseFloat(document.getElementById('wizWidthM').value);
  if (!(m > 1)) { uiToast('הקלד רוחב במטרים'); return; }
  P.scale = m / (P.bgW || 1400);
  recalcCableLengths(); save(); render();
  WIZ.step = 2; wizRender();
  uiToast('✓ כויל: 1 מ׳ = ' + (1 / P.scale).toFixed(1) + 'px — לדיוק מלא השתמש בכיול 2 הנקודות');
}
function wizDrawZone() {
  const nm = document.getElementById('wizZName').value.trim();
  zoneNameNext = nm || 'אזור ' + ((P.zones || []).length + 1);
  zoneMode = { poly: [] }; render();
  uiToast('נקר נקודות סביב האזור על התכנית · לחיצה על הנקודה הראשונה סוגרת');
}
function wizKitSearch(q) {
  const el = document.getElementById('wizKitRes'); if (!el) return;
  const z = wizZone(); if (!z) return;
  const toks = String(q || '').toLowerCase().split(/\s+/).filter(Boolean);
  if (!toks.length) { el.innerHTML = ''; return; }
  const kits = allKits().map((k, i) => ({ k, i })).filter(x => toks.every(t => x.k.name.toLowerCase().includes(t))).slice(0, 6);
  const spks = dockSearchResults(q).filter(r => r.type !== 'kit' && r.key && isSpeakerItem(r.name)).slice(0, 6);
  el.innerHTML =
    kits.map(x => `<button class="sec" onclick="zoneKitConfirm('${esc(z.name).replace(/'/g, '&#39;')}',${x.i})">🧰 ${esc(x.k.name.slice(0, 40))}</button>`).join('') +
    spks.map(r => `<button class="sec" onclick="pickZoneSpk('${z.id}','${esc(r.name).replace(/'/g, '&#39;')}','${r.key}',${/סאב|\bsub\b/i.test(r.name)});wizRender()">🔊 ${esc(r.name.slice(0, 40))} ${erpInfo(r.key) ? '· מלאי ' + erpInfo(r.key).qty : ''}</button>`).join('') ||
    '<p class="hint">אין תוצאות</p>';
}
function wizBuildAll() {
  const z = wizZone(); if (!z) return;
  if (z._djInRack === undefined) z._djInRack = true;
  /* ארון ריכוז אוטומטי בפינת האזור אם אין */
  if (!z._rackNodeId || !byId(z._rackNodeId)) {
    const b = zoneBounds(z);
    const rk = { id: uid('n'), kind: 'rack', name: 'ריכוז ' + z.name, sub: '', x: Math.max(10, 2200 - b.L - 60), y: Math.max(10, b.T - 10), ru: 12, units: [], min: true };
    P.nodes.push(rk); z._rackNodeId = rk.id;
  }
  window.__autoFlow = true;
  try {
    buildZoneSystem(z.id);
    placeZoneRackItems(z);
    setTimeout(() => { smartWire(z.id).finally?.(() => { window.__autoFlow = false; }); setTimeout(() => { window.__autoFlow = false; wizRender(); }, 1500); }, 600);
  } catch (e) { window.__autoFlow = false; uiToast('⚠ ' + e.message); }
  setTimeout(() => wizRender(), 900);
}
/* השלמת כבלים: כל קו בלי מוצר מקבל שורת "גליל" מהקטלוג לפי סוג, עם המטרים */
function wizFillCables() {
  const need = {};
  P.cables.forEach(c => { if (!c.stockRef && c.inst !== 'exist' && +c.len > 0) need[c.type] = (need[c.type] || 0) + Math.ceil(+c.len * 1.15); /* +15% רזרבה */ });
  let added = 0;
  for (const [t, meters] of Object.entries(need)) {
    const kw = { dmx: 'DMX', cat: 'רשת', nl4: 'רמקול', multi: 'מולטי', xlr: 'XLR', fiber: 'אופטי', sdi: 'BNC', hdmi: 'HDMI', pwr: 'חשמל' }[t] || t;
    const hit = (typeof ERP_ITEMS !== 'undefined') && ERP_ITEMS.find(([k, n]) => n && /גליל|לפי מטר|כבל/i.test(n) && n.toLowerCase().includes(kw.toLowerCase()));
    const it = { on: true, qty: meters, name: hit ? hit[1] : 'כבל ' + (CTYPES[t]?.n || t) + ' (לפי מטר)', key: hit ? hit[0] : undefined, src: 'אשף V2 — השלמת כבלים', dest: 'reel', type: t, cat: 'cable', u: 1, iid: uid('i'), note: meters + ' מ׳ כולל 15% רזרבה' };
    autoPrice(it); impItems.push(it); added++;
  }
  render(); save(); wizRender();
  uiToast('✓ נוספו ' + added + ' שורות כבלים לפי סוג (עם 15% רזרבה)');
}

/* ---- דוח מתקינים — כל מה שצוות ההתקנה צריך, מוכן להדפסה ---- */
function installerReport() {
  const LBL = cableLabels();
  const zsum = (P.zones || []).map(z => `<tr><td>${esc(z.name)}</td><td>${esc(z.usage || '—')}</td><td>${zoneAreaM(z).toFixed(0)} מ"ר</td><td>${z.ceil ?? P.room?.ceil ?? '—'} מ׳</td></tr>`).join('');
  const racks = P.nodes.filter(n => n.kind === 'rack').map(rk => `
    <h3>🗄 ${esc(rk.name)} · ${rk.ru}U</h3>
    <table><tr><th>מיקום U</th><th>יחידה</th><th>גובה</th></tr>
      ${(rk.units || []).slice().sort((a, b) => a.pos - b.pos).map(u => `<tr><td>${u.pos + 1}–${u.pos + u.u}</td><td>${esc(u.name)}</td><td>${u.u}U</td></tr>`).join('') || '<tr><td colspan="3">ריק</td></tr>'}
    </table>`).join('');
  const spk = P.nodes.filter(n => n.kind === 'point' && (!n.ptype || n.ptype === 'speaker' || n.ptype === 'sub')).map(n => `
    <tr><td>${esc(n.name.slice(0, 40))}</td><td>${esc((n.sub || '').slice(0, 24))}</td><td>${n.hgt ?? '—'} מ׳</td><td>${esc(n.mount || '—')}</td><td>${n.aim != null ? n.aim + '°' : '—'}</td></tr>`).join('');
  const cbl = P.cables.map(c => {
    const conns = (c.conn ? (CONNS[c.conn]?.n || c.conn) : '') + (c.conn2 && c.conn2 !== c.conn ? ' ← ' + (CONNS[c.conn2]?.n || c.conn2) : '');
    return `<tr><td><b>${LBL[c.id]}</b></td><td>${esc(endNameTxt(c.from, c.fromUnit))}${c.pOut ? ' · ' + esc(c.pOut) : c.fromHole ? ' · חור ' + c.fromHole : ''}</td>
      <td>${esc(endNameTxt(c.to, c.toUnit))}${c.pIn ? ' · ' + esc(c.pIn) : c.toHole ? ' · חור ' + c.toHole : ''}</td>
      <td>${CTYPES[c.type]?.n || c.type}${c.cores ? ' ×' + c.cores : ''}</td><td>${c.len ? c.len + ' מ׳' : '—'}</td><td>${esc(conns)}</td>
      <td>${c.inst === 'exist' ? 'קיים' : c.inst === 'pull' ? 'העברה' : 'חדש'}</td><td>${esc(c.note || '')}</td></tr>`;
  }).join('');
  const items = impItems.filter(it => it.on !== false).map(it => `<tr><td>${esc(it.name.slice(0, 55))}</td><td>${esc(it.key || '—')}</td><td>${it.qty}</td><td>${it.zones ? esc(Object.keys(it.zones).join(', ')) : '—'}</td></tr>`).join('');
  const win = window.open('', '_blank');
  win.document.write(`<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8"><title>דוח מתקינים — ${esc(P.name)}</title>
    <style>body{font-family:-apple-system,'Segoe UI',Arial;margin:24px;color:#1a1e28;font-size:12.5px}
    h1{font-size:20px;border-bottom:3px solid #c9502e;padding-bottom:6px}h2{font-size:16px;margin:22px 0 6px;background:#f4f2ec;padding:5px 10px;border-radius:7px}h3{font-size:13.5px;margin:12px 0 4px}
    table{border-collapse:collapse;width:100%;margin-bottom:8px}th,td{border:1px solid #ccc;padding:4px 7px;text-align:right;font-size:11.5px}th{background:#f4f2ec}
    .meta{color:#777;font-size:11px}@media print{h2{break-after:avoid}}</style></head><body>
    <h1>🔧 דוח מתקינים — ${esc(P.name)}</h1>
    <p class="meta">הופק ${new Date().toLocaleString('he-IL')} · KO Projects V2 · ${P.cables.length} כבלים · ${impItems.length} פריטים</p>
    <h2>אזורים</h2><table><tr><th>אזור</th><th>תכלית</th><th>שטח</th><th>תקרה</th></tr>${zsum || '<tr><td colspan="4">—</td></tr>'}</table>
    <h2>ארונות — סדר הרכבה</h2>${racks || '<p>אין ארונות</p>'}
    <h2>רמקולים — תלייה וכיוון</h2><table><tr><th>רמקול</th><th>מיקום</th><th>גובה</th><th>תושבת</th><th>כיוון</th></tr>${spk || '<tr><td colspan="5">—</td></tr>'}</table>
    <h2>לוח משיכת כבלים</h2><table><tr><th>#</th><th>מ־</th><th>אל</th><th>סוג</th><th>אורך</th><th>מחברים</th><th>סטטוס</th><th>הערה</th></tr>${cbl || '<tr><td colspan="8">—</td></tr>'}</table>
    <h2>רשימת ציוד מלאה</h2><table><tr><th>פריט</th><th>מק"ט</th><th>כמות</th><th>אזור</th></tr>${items || '<tr><td colspan="4">—</td></tr>'}</table>
    <script>window.print()<\/script></body></html>`);
  win.document.close();
}
