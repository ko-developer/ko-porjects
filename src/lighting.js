/* ===================================================================================
   💡 תאורה מקצועית — דיסציפלינה שנייה על אותו מנוע (תכנית, אזורים, ארונות, כבלים, הצעה, דוח).
   ספריית הגופים: LIGHT_FIXTURES (data/light_fixtures.json — נקצר מהחנות store.kot.co.il ומדפי הנתונים
   בדלי של האתר ע"י scripts/harvest-light.js). מפרט שלא נמצא בדף הנתונים נשאר ריק — לא ממציאים.
   גוף תאורה בתכנית = מוקד (kind:'point', ptype:'light') עם n.fx = { sku, u (יוניברס), a (כתובת), ch (ערוצים), pos (עמדת תלייה) }.
   "קרא תכנית תאורה": תמונת תכנית של מעצב (סמלים + מקרא) → Claude (ראייה) → גופים על התכנית + שורות בהצעה.
   =================================================================================== */
function fxLib() { return (typeof LIGHT_FIXTURES !== 'undefined' && LIGHT_FIXTURES.items) || []; }
function fxOf(sku) { return sku ? fxLib().find(f => f.sku === sku) || null : null; }
var FX_KINDS = { moving: '🔦 פנס חכם / Moving head', static: '💡 פנס סטטי / ווש / פאר', effect: '✨ אפקטים / עשן / לייזר', control: '🎛 לוחות ופיקוד', dmx: '🔀 בוסטרים / מפצלי DMX', dimmer: '🎚 דימרים', psu: '🔌 ספקים / דרייברים', truss: '🏗 טראסים', hoist: '⛓ מנועים ומתקני הרמה', clamp: '🗜 קלמרות ואבטחה', strip: '〰 סטריפ / פיקסל', arch: '🏛 אדריכלי', lamp: '💡 נורות', other: '📦 אחר' };
/* שורת מפרט קצרה — רק מה שנמצא בדף הנתונים / בחנות */
function fxSpecLine(f) {
  if (!f) return ''; const s = f.spec || {}, p = [];
  if (s.watt) p.push(s.watt + 'W'); if (s.source) p.push(s.source); if (s.lumen) p.push(s.lumen.toLocaleString() + ' lm');
  if (s.beam) p.push(s.beam + (s.beamMax ? '–' + s.beamMax : '') + '°'); if (s.dmx && s.dmx.length) p.push(s.dmx.join('/') + 'ch DMX');
  if (s.ip) p.push(s.ip); if (s.kelvin) p.push(s.kelvin + 'K'); if (s.kg) p.push(s.kg + ' ק״ג');
  return p.join(' · ');
}
function fxImg(f) { return (f && (f.img || (typeof erpImg === 'function' && erpImg(f.sku)))) || ''; }
function fxPrice(f) { const i = typeof erpInfo === 'function' ? erpInfo(f.sku) : null; return i && i.price ? i.price : (f.price || 0); }
function fxStock(f) { const i = typeof erpInfo === 'function' ? erpInfo(f.sku) : null; return i ? i.qty : null; }
/* חיפוש: כל המילים חייבות להופיע בשם / מק"ט / קטגוריה */
function fxFind(q, kind) {
  const toks = String(q || '').toLowerCase().split(/\s+/).filter(Boolean);
  return fxLib().filter(f => (!kind || f.kind === kind) && toks.every(t => (f.name + ' ' + f.sku + ' ' + f.cat).toLowerCase().includes(t)));
}
/* התאמת כיתוב מתכנית של מעצב ("Robe Pointe", "LED PAR 64", "wash 19x40") לגוף בספרייה: ניקוד לפי מילים משותפות,
   תווי דגם (מספרים/אותיות) שווים יותר ממילים כלליות; בלי התאמה — null (לא ממציאים דגם) */
function fxMatch(model, type) {
  const norm = s => String(s || '').toUpperCase().replace(/[^A-Z0-9א-ת]+/g, ' ').trim();
  const mt = norm(model).split(' ').filter(t => t.length > 1); if (!mt.length) return null;
  const GEN = new Set(['LED', 'MOVING', 'HEAD', 'LIGHT', 'FIXTURE', 'W', 'WATT', 'פנס', 'חכם', 'גוף', 'תאורה']);
  let best = null, bs = 0;
  for (const f of fxLib()) {
    if (type && f.kind !== type && !(type === 'static' && f.kind === 'effect')) continue;
    const ft = new Set(norm(f.name + ' ' + f.sku).split(' '));
    let sc = 0; for (const t of mt) if (ft.has(t)) sc += GEN.has(t) ? 0.3 : /\d/.test(t) ? 2 : 1;
    if (sc > bs) { bs = sc; best = f; }
  }
  return bs >= 2 ? best : null;
}
function fxNodes() { return (P.nodes || []).filter(n => n.kind === 'point' && n.ptype === 'light' && !n.hidden); }
/* הוספת גוף לתכנית + שורה בהצעה (גופים מאותו דגם חולקים שורה אחת, הכמות עולה) */
function fxAddNode(sku, pos, opts) {
  const f = fxOf(sku); opts = opts || {};
  const c = pos || (typeof viewCenterPt === 'function' ? viewCenterPt() : { x: 1100, y: 700 });
  let it = f ? impItems.find(x => x.key === f.sku && x.dest === 'point') : null;
  if (f && !it) { it = { on: true, qty: 0, name: f.name, key: f.sku, src: 'תאורה', dest: 'point', cat: 'lighting', u: 1, iid: uid('i'), placed: 0 }; if (typeof autoPrice === 'function') autoPrice(it); impItems.push(it); }
  if (it) { it.qty = (+it.qty || 0) + 1; it.placed = (it.placed || 0) + 1; }
  const n = { id: uid('n'), kind: 'point', ptype: 'light', name: (opts.name || (f ? f.name : 'גוף תאורה')).slice(0, 60), sub: opts.sub || '', x: Math.max(0, Math.round(2200 - c.x - 20)), y: Math.max(0, Math.round(c.y - 24)), mini: true, mount: 'טראס/הנפה', hgt: opts.hgt ?? 5,
    srcIid: it ? it.iid : undefined, fx: { sku: f ? f.sku : null, u: 1, a: 0, ch: f && f.spec && f.spec.dmx && f.spec.dmx.length ? f.spec.dmx[0] : 0, pos: opts.pos || '', type: opts.type || (f ? f.kind : ''), model: opts.model || '' } };
  P.nodes.push(n); return n;
}
/* ---------- פאנל גוף (בכרטיס המוקד) ---------- */
function fxNodeHTML(n) {
  const fx = n.fx || (n.fx = { sku: null, u: 1, a: 0, ch: 0, pos: '' }), f = fxOf(fx.sku), s = f && f.spec || {};
  const modes = (s.dmx || []).slice().sort((a, b) => a - b);
  return `<h3 class="sec">💡 גוף תאורה</h3>
    <div class="fld"><label>דגם מהספרייה</label>
      <div style="display:flex;gap:6px;align-items:center">${f ? `<img src="${esc(fxImg(f))}" style="width:40px;height:40px;object-fit:contain;border-radius:6px;background:#f4f4f4" onerror="this.style.display='none'">` : ''}
      <div style="flex:1;font-size:12px"><b>${f ? esc(f.name.slice(0, 70)) : '<span style="color:#a32222">לא משויך לדגם</span>'}</b>${f ? `<div class="muted" style="font-size:10.5px">${esc(f.sku)} · ${esc(fxSpecLine(f) || 'אין מפרט בדף הנתונים')}</div>` : (fx.model ? `<div class="muted" style="font-size:10.5px">בתכנית: ${esc(fx.model)}</div>` : '')}</div>
      <button onclick="fxPicker({forNode:'${n.id}'})" title="בחר דגם מהספרייה">🔍</button></div>
      ${f && f.pdf ? `<a href="${esc(f.pdf)}" target="_blank" style="font-size:11px">📄 דף נתונים</a>` : ''}</div>
    <div class="row2">
      <div class="fld"><label>עמדת תלייה (טראס / בר)</label><input list="fxPosList" value="${esc(fx.pos || '')}" onchange="byId('${n.id}').fx.pos=this.value;save()"><datalist id="fxPosList">${[...new Set(fxNodes().map(x => x.fx && x.fx.pos).filter(Boolean))].map(p => `<option value="${esc(p)}">`).join('')}</datalist></div>
      <div class="fld"><label>ערוצי DMX (מצב)</label>${modes.length ? `<select onchange="byId('${n.id}').fx.ch=+this.value;save();render()">${modes.map(m => `<option value="${m}" ${+fx.ch === m ? 'selected' : ''}>${m} ערוצים</option>`).join('')}${modes.includes(+fx.ch) || !fx.ch ? '' : `<option value="${fx.ch}" selected>${fx.ch}</option>`}</select>` : `<input type="number" min="0" max="512" value="${fx.ch || ''}" placeholder="לא ידוע" onchange="byId('${n.id}').fx.ch=+this.value;save()">`}</div>
    </div>
    <div class="row2">
      <div class="fld"><label>יוניברס</label><input type="number" min="1" max="64" value="${fx.u || 1}" onchange="byId('${n.id}').fx.u=+this.value;save();render()"></div>
      <div class="fld"><label>כתובת DMX</label><input type="number" min="0" max="512" value="${fx.a || ''}" placeholder="— (⚡ אוטומטי)" onchange="byId('${n.id}').fx.a=+this.value;save();render()"></div>
    </div>
    ${s.watt ? `<p class="muted" style="font-size:11px;margin:0">⚡ ${s.watt}W${s.beam ? ' · אלומה ' + s.beam + (s.beamMax ? '–' + s.beamMax : '') + '°' : ''}${s.pan ? ' · Pan ' + s.pan + '°' : ''}${s.tilt ? ' / Tilt ' + s.tilt + '°' : ''}</p>` : ''}`;
}
/* ---------- אייקון על התכנית ---------- */
function fxIcon(n, mc) {
  const f = fxOf(n.fx && n.fx.sku), k = (f && f.kind) || (n.fx && n.fx.type) || 'static';
  if (k === 'moving') return `<svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="${mc}" stroke-width="2"/><circle cx="12" cy="12" r="3.2" fill="${mc}"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4" stroke="${mc}" stroke-width="1.8"/></svg>`;
  if (k === 'effect') return `<svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" fill="none" stroke="${mc}" stroke-width="2" stroke-linejoin="round"/></svg>`;
  /* פאר / ווש: עיגול עם אלומה */
  return `<svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="9" r="6" fill="none" stroke="${mc}" stroke-width="2"/><path d="M8 15l-2 7h12l-2-7" fill="none" stroke="${mc}" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
}
/* ---------- פאנל התאורה (הגדרות תכנית) ---------- */
function fxPanelHTML() {
  const ns = fxNodes(), lib = fxLib().length;
  if (P.layer !== 'light' && P.layer !== 'all' && !ns.length) return '';
  const W = ns.reduce((s, n) => { const f = fxOf(n.fx && n.fx.sku); return s + (f && f.spec && f.spec.watt || 0); }, 0);
  const unk = ns.filter(n => !(n.fx && n.fx.sku)).length, noAddr = ns.filter(n => n.fx && n.fx.sku && !n.fx.a).length;
  const univ = new Set(ns.filter(n => n.fx && n.fx.a).map(n => n.fx.u || 1)).size;
  return `<h3 class="sec">💡 תאורה מקצועית</h3>
    <p class="muted" style="font-size:11px;margin:-2px 0 6px">${ns.length} גופים בתכנית${W ? ' · ' + W.toLocaleString() + 'W' : ''}${univ ? ' · ' + univ + ' יוניברסים' : ''}${unk ? ' · <span style="color:#a32222">' + unk + ' בלי דגם</span>' : ''}${noAddr ? ' · ' + noAddr + ' בלי כתובת' : ''} · ספרייה: ${lib} פריטים מהאתר</p>
    <button style="width:100%;margin-bottom:6px;background:#534ab7;color:#fff;font-weight:700" onclick="fxReadPlot()" title="תמונת תכנית תאורה של מעצב (סמלים, מקרא, טראסים) → הגופים על התכנית ושורות בהצעה">🪄 קרא תכנית תאורה מהתמונה</button>
    ${fxDepthHTML()}
    <div style="display:flex;gap:6px;margin-bottom:6px"><button style="flex:1" onclick="fxPicker({})">➕ גוף מהספרייה</button><button style="flex:1" onclick="fxAutoAddress()" title="כתובות DMX לפי עמדת תלייה ומיקום, יוניברס חדש כשנגמרים 512 ערוצים">⚡ מספור DMX</button><button style="flex:1" onclick="fxPatchTable()">📋 טבלת פאץ׳</button></div>`;
}
function discToggle() { setLayer(P.layer === 'light' ? 'audio' : 'light'); }
/* ---------- בורר גופים ---------- */
function fxPicker(opts) {
  opts = opts || {}; const old = document.getElementById('fxPick'); if (old) old.remove();
  const ov = uiModal(`<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><b style="flex:1;font-size:15px">💡 ספריית התאורה של KO</b><button data-x>✕</button></div>
    <input data-q placeholder="🔍 דגם / מק״ט / קטגוריה…" style="width:100%;padding:6px;box-sizing:border-box;margin-bottom:6px">
    <div data-kinds style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px"></div>
    <div data-body style="max-height:56vh;overflow-y:auto"></div>`);
  ov.id = 'fxPick'; const box = ov.firstElementChild; box.style.maxWidth = '640px'; box.style.width = '94%';
  let kind = opts.kind || ''; const q = ov.querySelector('[data-q]'), body = ov.querySelector('[data-body]'), kh = ov.querySelector('[data-kinds]');
  const counts = fxLib().reduce((m, f) => (m[f.kind] = (m[f.kind] || 0) + 1, m), {});
  const paintKinds = () => { kh.innerHTML = [['', 'הכל']].concat(Object.entries(FX_KINDS).filter(([k]) => counts[k])).map(([k, l]) => `<button data-k="${k}" style="padding:2px 9px;border-radius:12px;font-size:10.5px;border:1px solid ${kind === k ? '#534ab7' : '#ccc'};background:${kind === k ? '#534ab7' : '#fff'};color:${kind === k ? '#fff' : '#333'}">${l}${k ? ' ' + counts[k] : ''}</button>`).join(''); kh.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { kind = b.dataset.k; paintKinds(); paint(); }); };
  const paint = () => {
    const rows = fxFind(q.value, kind).sort((a, b) => (fxStock(b) > 0) - (fxStock(a) > 0) || (b.pdf ? 1 : 0) - (a.pdf ? 1 : 0)).slice(0, 60);
    body.innerHTML = rows.map(f => { const st = fxStock(f), pr = fxPrice(f); return `<div style="display:flex;gap:8px;align-items:center;border:1px solid #e6e3dc;border-radius:10px;padding:6px 8px;margin-bottom:5px">
        <img src="${esc(fxImg(f))}" style="width:44px;height:44px;object-fit:contain;border-radius:6px;background:#f4f4f4;flex:none" onerror="this.style.visibility='hidden'">
        <div style="flex:1;min-width:0;font-size:12px"><b>${esc(f.name.slice(0, 80))}</b><div class="muted" style="font-size:10.5px">${esc(f.sku)} · ${esc(f.cat.split(' / ').pop())}${fxSpecLine(f) ? ' · ' + esc(fxSpecLine(f)) : ' · <span style="color:#a32222">אין מפרט</span>'}${f.pdf ? ' · <a href="' + esc(f.pdf) + '" target="_blank">📄</a>' : ''}</div></div>
        <div style="text-align:left;font-size:11px;white-space:nowrap">${pr ? '<b>₪' + Math.round(pr).toLocaleString() + '</b>' : ''}<br>${st == null ? '' : st > 0 ? '<span style="color:#0a7a4b">במלאי ' + st + '</span>' : '<span style="color:#a32222">אזל</span>'}</div>
        <button class="primary" data-pick="${esc(f.sku)}" style="white-space:nowrap">${opts.forNode ? 'שייך' : opts.onPick ? 'בחר' : '➕'}</button></div>`; }).join('') || '<p class="muted">אין תוצאות</p>';
    body.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => { const sku = b.dataset.pick; ov.remove();
      if (opts.onPick) { opts.onPick(fxOf(sku)); return; }
      if (opts.forNode) { const n = byId(opts.forNode); if (!n) return; const f = fxOf(sku); const was = n.srcIid && impItems.find(x => x.iid === n.srcIid);
        if (was) { was.qty = Math.max(0, (+was.qty || 0) - 1); was.placed = Math.max(0, (was.placed || 0) - 1); if (!was.qty) impItems = impItems.filter(x => x !== was); }
        let it = impItems.find(x => x.key === sku && x.dest === 'point'); if (!it) { it = { on: true, qty: 0, name: f.name, key: f.sku, src: 'תאורה', dest: 'point', cat: 'lighting', u: 1, iid: uid('i'), placed: 0 }; if (typeof autoPrice === 'function') autoPrice(it); impItems.push(it); }
        it.qty = (+it.qty || 0) + 1; it.placed = (it.placed || 0) + 1; n.srcIid = it.iid; n.fx = { ...(n.fx || {}), sku, ch: f.spec && f.spec.dmx && f.spec.dmx.length ? f.spec.dmx[0] : (n.fx && n.fx.ch) || 0, type: f.kind }; n.name = f.name.slice(0, 60);
        save(); render(); return; }
      const n = fxAddNode(sku); sel = n.id; ui.tab = 'node'; save(); render(); uiToast('💡 ' + n.name.slice(0, 40) + ' נוסף במרכז המסך ובהצעה'); });
  };
  q.oninput = paint; paintKinds(); paint();
  ov.querySelector('[data-x]').onclick = () => ov.remove(); ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
}
/* ---------- מספור DMX אוטומטי ---------- */
function fxAutoAddress() {
  const ns = fxNodes().filter(n => n.fx && n.fx.sku && n.fx.ch > 0);
  if (!ns.length) { uiToast('אין גופים עם דגם ומספר ערוצים ידוע'); return; }
  ns.sort((a, b) => String(a.fx.pos || '').localeCompare(String(b.fx.pos || ''), 'he') || (b.x - a.x) || (a.y - b.y));   /* לפי עמדה, ואז מימין לשמאל (x נמדד מימין) */
  let u = 1, a = 1, n0 = 0;
  for (const n of ns) { if (a + n.fx.ch - 1 > 512) { u++; a = 1; } n.fx.u = u; n.fx.a = a; a += n.fx.ch; n0++; }
  save(); render(); uiToast('⚡ ' + n0 + ' גופים מוענו ב-' + u + ' יוניברסים');
}
/* ---------- טבלת פאץ׳ ---------- */
function fxPatchTable() {
  const ns = fxNodes().slice().sort((a, b) => (a.fx && a.fx.u || 1) - (b.fx && b.fx.u || 1) || (a.fx && a.fx.a || 0) - (b.fx && b.fx.a || 0));
  const rows = ns.map((n, i) => { const f = fxOf(n.fx && n.fx.sku), s = f && f.spec || {}; return { i: i + 1, name: f ? f.name.slice(0, 50) : n.name, sku: f ? f.sku : '', pos: n.fx && n.fx.pos || '', u: n.fx && n.fx.u || 1, a: n.fx && n.fx.a || '', ch: n.fx && n.fx.ch || '', w: s.watt || '' }; });
  const W = rows.reduce((s, r) => s + (+r.w || 0), 0);
  const csv = ['#,שם,מק"ט,עמדה,יוניברס,כתובת,ערוצים,W'].concat(rows.map(r => [r.i, '"' + r.name.replace(/"/g, '""') + '"', r.sku, r.pos, r.u, r.a, r.ch, r.w].join(','))).join('\n');
  const ov = uiModal(`<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><b style="flex:1;font-size:15px">📋 טבלת פאץ׳ DMX — ${esc(P.name)}</b><button data-csv>⬇ CSV</button><button data-x>✕</button></div>
    <div style="max-height:60vh;overflow:auto"><table style="width:100%;font-size:11.5px;border-collapse:collapse"><thead><tr style="background:#f3f1ec"><th>#</th><th style="text-align:right">גוף</th><th>עמדה</th><th>יוניברס</th><th>כתובת</th><th>ערוצים</th><th>W</th></tr></thead>
    <tbody>${rows.map(r => `<tr style="border-bottom:1px solid #eee"><td>${r.i}</td><td style="text-align:right">${esc(r.name)}<div class="muted" style="font-size:10px">${esc(r.sku)}</div></td><td>${esc(r.pos)}</td><td>${r.u}</td><td>${r.a || '<span style="color:#a32222">—</span>'}</td><td>${r.ch || '?'}</td><td>${r.w}</td></tr>`).join('')}</tbody>
    <tfoot><tr style="font-weight:700"><td colspan="6">סה״כ ${rows.length} גופים</td><td>${W.toLocaleString()}</td></tr></tfoot></table></div>`);
  ov.firstElementChild.style.maxWidth = '760px'; ov.firstElementChild.style.width = '94%';
  ov.querySelector('[data-x]').onclick = () => ov.remove(); ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  ov.querySelector('[data-csv]').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = 'KO-DMX-' + (P.name || '').slice(0, 40) + '.csv'; a.click(); };
}
/* ---------- סוג המבט של השרטוט: תכנית (מלמעלה) / חזית (מהקהל) / חתך ----------
   בסאונד תכנית העמדה היא תמיד מבט מלמעלה; בתאורה המעצב מצייר לרוב חזית: הטראסים בגובה, הפנסים תלויים עליהם.
   בחזית ציר y של התמונה הוא גובה, לא עומק — לכן הקריאה שונה, ואזורים/כיסוי לא נבנים עליה. */
function sheetView() { const sh = typeof curSheet === 'function' ? curSheet(P) : null; return (sh && sh.view) || 'plan'; }
function sheetIsElevation() { return sheetView() === 'front' || sheetView() === 'side'; }
function sheetSetView(v) { const sh = curSheet(P); if (!sh) return; sh.view = v && v !== 'plan' ? v : undefined; save(); render(); }
function fxAfterUpload() {
  if (P.layer !== 'light') return;   /* בסאונד — תמיד תכנית */
  const ov = uiModal(`<b style="font-size:14px">💡 איזה מבט זה?</b>
    <p class="muted" style="font-size:11.5px;margin:4px 0 10px">בתאורה השרטוט הוא לרוב חזית. בחזית ציר הגובה הוא למעלה-למטה, והפנסים נקראים לפי הטראס שהם תלויים עליו.</p>
    <div style="display:grid;gap:6px">
      <button data-v="front" style="text-align:right;padding:9px 12px"><b>🎭 חזית</b> — מבט מהקהל אל הבמה: טראסים בגובה, פנסים תלויים</button>
      <button data-v="plan" style="text-align:right;padding:9px 12px"><b>🗺 תכנית תקרה / העמדה</b> — מבט מלמעלה</button>
      <button data-v="side" style="text-align:right;padding:9px 12px"><b>↔ חתך / צד</b></button>
      <button data-v="auto" style="text-align:right;padding:9px 12px;background:#eef">🤖 זהה אוטומטית מהתמונה</button>
    </div>`);
  ov.querySelectorAll('[data-v]').forEach(b => b.onclick = async () => { ov.remove(); const v = b.dataset.v;
    if (v !== 'auto') { sheetSetView(v); uiToast(v === 'front' ? '🎭 חזית — "קרא תכנית תאורה" יקרא טראסים בגובה ופנסים עליהם' : v === 'side' ? '↔ חתך' : '🗺 תכנית'); return; }
    const d = await fxDetectView(); if (!d) return; sheetSetView(d.view);
    uiToast('🤖 ' + (d.view === 'front' ? '🎭 חזית' : d.view === 'side' ? '↔ חתך' : '🗺 תכנית מלמעלה') + (d.why ? ' — ' + d.why : ''), 7000); });
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
}
async function fxDetectView() {
  if (!P.bg || typeof claudeMsg !== 'function') return null;
  uiToast('🤖 מזהה את סוג המבט…', 4000);
  try {
    const mt = /^data:image\/png/i.test(P.bg) ? 'image/png' : 'image/jpeg';
    const j = await claudeMsg([{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: mt, data: P.bg.split(',')[1] } },
      { type: 'text', text: 'Is this technical drawing a top-down plan (floor/ceiling/rigging plan seen from above), a front elevation (stage seen from the audience: trusses drawn as horizontal bars at heights, fixtures hanging below them, floor line at the bottom), or a side section? Answer ONLY JSON: {"view":"plan|front|side","why":"one short sentence in Hebrew"}' }] }], 300);
    const d = claudeJson(j); return d && d.view ? d : null;
  } catch (e) { uiToast('הזיהוי נכשל: ' + e.message); return null; }
}
/* ---------- כיול עומק: חזית ↔ תכנית תקרה ----------
   בחזית יש X וגובה בלבד. העומק ניתן לכל עמדה (טראס/בר) במטרים מקדמת הבמה, וקו ייחוס על תכנית התקרה
   (קדמת הבמה, משמאל לימין כפי שרואים מהקהל) אומר איפה "0 עומק" ולאן העומק גדל. "העתק לתכנית התקרה" מציב כל פנס
   על קו העמדה שלו: X לפי המיקום היחסי בחזית, עומק לפי העמדה, גובה נשמר. */
function fxPick2(msg, done) { window.__pick2 = { pts: [], done }; document.body.style.cursor = 'crosshair'; uiToast('📏 ' + msg, 8000); }
function fxRefSet() {
  const sh = curSheet(P);
  fxPick2(sheetIsElevation() ? 'לחץ על קצה הבמה השמאלי ואז על הימני (בחזית)' : 'לחץ על קצה הבמה השמאלי ואז על הימני — כפי שרואים מהקהל; העומק גדל מהקו והלאה מהקהל', pts => {
    sh.fxRef = { x1: pts[0].x, y1: pts[0].y, x2: pts[1].x, y2: pts[1].y }; save(); render();
    uiToast('✓ קו ייחוס נשמר' + (P.scale ? ' — אורך ' + (Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) * P.scale).toFixed(1) + ' מ׳' : ''));
  });
}
function fxPositions() {
  P.lightPos = P.lightPos || [];
  /* עמדות שהפנסים מזכירים ואין להן רשומה */
  for (const n of fxNodes()) { const p = n.fx && n.fx.pos; if (p && !P.lightPos.some(q => q.name === p)) P.lightPos.push({ name: p }); }
  return P.lightPos;
}
function fxDepthHTML() {
  const pos = fxPositions(), sh = curSheet(P), front = sheetIsElevation();
  const row = (p, i) => `<div style="display:flex;gap:4px;align-items:center;margin:2px 0;font-size:11.5px">
      <input value="${esc(p.name || '')}" placeholder="שם עמדה (T1 / בר קדמי)" style="flex:1;min-width:0" onchange="P.lightPos[${i}].name=this.value;save()">
      <input type="number" step="0.1" value="${p.h ?? ''}" placeholder="גובה" title="גובה הטראס במטרים (trim)" style="width:58px" onchange="P.lightPos[${i}].h=this.value===''?undefined:+this.value;save()">
      <input type="number" step="0.1" value="${p.d ?? ''}" placeholder="עומק" title="עומק במטרים מקדמת הבמה (קו הייחוס) ואחורה" style="width:58px" onchange="P.lightPos[${i}].d=this.value===''?undefined:+this.value;save()">
      <span class="muted" style="font-size:10px;white-space:nowrap">${fxNodes().filter(n => n.fx && n.fx.pos === p.name).length} פנסים</span>
      <button style="padding:1px 5px" onclick="P.lightPos.splice(${i},1);save();render()">✕</button></div>`;
  return `<details ${front ? 'open' : ''} style="margin:4px 0 8px"><summary style="cursor:pointer;font-size:12px;font-weight:700">📏 עמדות תלייה — גובה ועומק (${pos.length})</summary>
    <p class="muted" style="font-size:10.5px;margin:3px 0">לכל טראס/בר: גובה במטרים ועומק מקדמת הבמה. זה "כיול העומק" של החזית — ממנו נקבע המיקום על תכנית התקרה.</p>
    ${pos.map(row).join('')}
    <div style="display:flex;gap:4px;margin-top:4px"><button style="flex:1;font-size:11px" onclick="P.lightPos=P.lightPos||[];P.lightPos.push({name:'T'+(P.lightPos.length+1)});save();render()">➕ עמדה</button>
      <button style="flex:1;font-size:11px;${sh.fxRef ? 'background:#eef7f1' : ''}" onclick="fxRefSet()" title="${front ? 'קצוות הבמה בחזית — כדי לתרגם X לתכנית' : 'קדמת הבמה על תכנית התקרה — נקודת האפס של העומק'}">${sh.fxRef ? '✓ קו ייחוס (שנה)' : '📏 קו ייחוס — קצוות הבמה'}</button>
      ${front ? `<button style="flex:1;font-size:11px;background:#534ab7;color:#fff;font-weight:700" onclick="fxCopyToPlan()" title="מציב את הפנסים על תכנית התקרה לפי X מהחזית, עומק מהעמדה וגובה">⤵ העתק לתכנית התקרה</button>` : ''}</div>
    <div class="fld" style="margin-top:4px"><label style="font-size:10.5px">עומק ברירת מחדל לפנס בלי עמדה (מ׳)</label><input type="number" step="0.1" value="${P.fxDefDepth ?? ''}" placeholder="0" onchange="P.fxDefDepth=+this.value;save()"></div></details>`;
}
function fxCopyToPlan() {
  const src = curSheet(P); if (!src || !sheetIsElevation()) { uiToast('הפעולה מחזית בלבד'); return; }
  const targets = (P.sheets || []).filter(sh => sh.id !== src.id && !sh.view);
  if (!targets.length) { uiToast('אין תכנית תקרה/העמדה בפרויקט — הוסף תכנית (➕ תכנית) עם מבט מלמעלה וסמן עליה קו ייחוס', 7000); return; }
  const go = tgt => {
    if (!tgt.fxRef) { uiToast('בתכנית "' + tgt.name + '" אין קו ייחוס — עבור אליה, 📏 קו ייחוס — קצוות הבמה, וחזור', 7000); return; }
    if (!tgt.scale) { uiToast('תכנית "' + tgt.name + '" לא מכוילת — כייל אותה קודם', 6000); return; }
    const ns = fxNodes(); if (!ns.length) { uiToast('אין פנסים בחזית'); return; }
    /* X יחסי בחזית: לפי קו הייחוס של החזית, ואם אין — לפי הפריסה של הפנסים */
    const cx = n => 2200 - n.x - 20;
    let fl, fr; if (src.fxRef) { fl = Math.min(src.fxRef.x1, src.fxRef.x2); fr = Math.max(src.fxRef.x1, src.fxRef.x2); } else { const xs = ns.map(cx); fl = Math.min(...xs); fr = Math.max(...xs); }
    const span = Math.max(1, fr - fl);
    const R = tgt.fxRef, dx = R.x2 - R.x1, dy = R.y2 - R.y1, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, nx = uy, ny = -ux;   /* נורמל: מהקו והלאה מהקהל (שמאל→ימין כפי שרואים מהקהל) */
    const pxPerM = 1 / tgt.scale, pos = fxPositions();
    tgt.nodes = tgt.nodes || []; let made = 0;
    for (const n of ns) {
      const t = (cx(n) - fl) / span, p = pos.find(q => q.name && n.fx && q.name === n.fx.pos), d = p && p.d != null ? p.d : (P.fxDefDepth || 0);
      const X = R.x1 + ux * t * len + nx * d * pxPerM, Y = R.y1 + uy * t * len + ny * d * pxPerM;
      const old = tgt.nodes.find(o => o.fx && o.fx.from === n.id);
      const c = old || { id: uid('n'), kind: 'point', ptype: 'light', mini: true, mount: 'טראס/הנפה' };
      Object.assign(c, { name: n.name, sub: n.sub, x: Math.max(0, Math.round(2200 - X - 20)), y: Math.max(0, Math.round(Y - 24)), hgt: n.hgt ?? (p && p.h) ?? c.hgt, srcIid: n.srcIid, fx: { ...(n.fx || {}), from: n.id, view: 'plan' } });
      if (!old) tgt.nodes.push(c); n.fx = { ...(n.fx || {}), mirror: true }; n.srcIid = undefined;   /* הספירה בהצעה — לפי העותק שעל התכנית */
      made++;
    }
    save(); uiToast('⤵ ' + made + ' פנסים הועתקו לתכנית "' + tgt.name + '" — X מהחזית, עומק מהעמדות, גובה נשמר', 7000); sheetGo(tgt.id);
  };
  if (targets.length === 1) { go(targets[0]); return; }
  const ov = uiModal(`<b style="font-size:14px">⤵ לאיזו תכנית תקרה?</b><div style="display:grid;gap:6px;margin:10px 0">${targets.map(t => `<button data-t="${t.id}" style="text-align:right;padding:8px 12px">🗺 ${esc(t.name)}${t.fxRef ? ' <span class="muted">· יש קו ייחוס</span>' : ' <span style="color:#a32222">· אין קו ייחוס</span>'}</button>`).join('')}</div><button data-x style="width:100%">ביטול</button>`);
  ov.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { ov.remove(); go(targets.find(t => t.id === b.dataset.t)); });
  ov.querySelector('[data-x]').onclick = () => ov.remove();
}
/* ---------- קריאת תכנית תאורה של מעצב (ראייה) ---------- */
var FX_PLOT_PROMPT = `You are reading a stage/event lighting plot (a designer's drawing). Extract EVERY lighting fixture symbol you can see.
Return ONLY JSON: {"fixtures":[{"x":0.0-1.0,"y":0.0-1.0,"type":"moving|static|effect|other","model":"text written for this fixture or its legend entry","label":"unit number/label if written","pos":"name of the truss/bar/position it hangs on, if written"}],
"legend":[{"symbol":"short description of the symbol","model":"model/fixture name as written","qty":N}],
"positions":[{"name":"truss/bar name as written","x1":0-1,"y1":0-1,"x2":0-1,"y2":0-1}],"notes":"anything unclear"}.
x,y are relative to the whole image (0,0 = top-left, 1,1 = bottom-right), at the centre of each symbol. One entry per physical fixture (if a legend says 8× of a symbol, there should be 8 entries). Copy model names exactly as written (do not guess brands). type: moving = moving head/spot/beam/wash moving; static = PAR/wash/blinder/strobe/static LED bar; effect = haze/smoke/laser/mirror ball.`;
var FX_PLOT_PROMPT_FRONT = `You are reading a FRONT ELEVATION lighting plot (stage seen from the audience): trusses/bars are drawn as horizontal members at their trim heights, fixtures hang below or sit on them, the stage floor is a horizontal line near the bottom. Extract EVERY fixture symbol.
Return ONLY JSON: {"fixtures":[{"x":0.0-1.0,"y":0.0-1.0,"type":"moving|static|effect|other","model":"text written for this fixture or its legend entry","label":"unit number if written","pos":"name of the truss/bar it hangs on, if written"}],
"legend":[{"symbol":"short description","model":"model name as written","qty":N}],
"positions":[{"name":"truss/bar name as written","x1":0-1,"y1":0-1,"x2":0-1,"y2":0-1,"height_m":number or null if a trim height is written}],
"floor_y":0.0-1.0 (relative y of the stage floor line, null if none),"notes":"anything unclear"}.
x,y are relative to the whole image (0,0 = top-left, 1,1 = bottom-right), at the centre of each symbol. One entry per physical fixture. Copy model names exactly as written (do not guess brands). type: moving = moving head/spot/beam/wash moving; static = PAR/wash/blinder/strobe/static bar; effect = haze/smoke/laser/mirror ball.`;
async function fxReadPlot() {
  if (!P.bg) { uiToast('העלה קודם את תמונת תכנית התאורה כרקע (📁 תכנית)'); return; }
  const front = sheetView() === 'front';
  if (typeof claudeMsg !== 'function') { uiToast('אין חיבור ל-AI'); return; }
  uiToast('🪄 קורא את תכנית התאורה… (10–40 שניות)', 8000);
  let j;
  try {
    const mt = /^data:image\/png/i.test(P.bg) ? 'image/png' : 'image/jpeg';
    j = await claudeMsg([{ role: 'user', content: [{ type: 'text', text: front ? FX_PLOT_PROMPT_FRONT : FX_PLOT_PROMPT }, { type: 'image', source: { type: 'base64', media_type: mt, data: P.bg.split(',')[1] } }, { type: 'text', text: 'Return the JSON only.' }] }], 8000);
  } catch (e) { if (e.message === 'NOKEY') { uiToast('אין מפתח API — צריך ANTHROPIC_API_KEY בשרת'); return; } uiToast('הקריאה נכשלה: ' + e.message, 7000); return; }
  let d; try { d = claudeJson(j); } catch (e) { uiToast('תשובה לא תקינה מה-AI'); console.warn(j); return; }
  const fixtures = d.fixtures || [], legend = d.legend || [], positions = d.positions || [];
  if (!fixtures.length) { uiToast('לא זוהו גופי תאורה בתמונה' + (d.notes ? ' — ' + d.notes : ''), 7000); return; }
  const L = bgLeft(), T = bgTop(), W = P.bgW || 1400, H = bgHeightPx();
  /* התאמת דגמים — פעם אחת לכל כיתוב, בלי ניחוש */
  const matchOf = {}; const keyOf = fx => (fx.model || fx.type || '').trim();
  for (const fx of fixtures) { const k = keyOf(fx); if (!(k in matchOf)) { const lg = legend.find(l => l.model && fx.model && l.model.toLowerCase() === fx.model.toLowerCase()); matchOf[k] = fxMatch(fx.model || (lg && lg.model), fx.type === 'other' ? '' : fx.type); } }
  P.sketch = P.sketch || { walls: [], objs: [] }; { const prevPos = P.lightPos || []; P.lightPos = positions.map(p => { const o = prevPos.find(q => q.name === p.name) || {}; return { ...o, name: p.name, x1: L + p.x1 * W, y1: T + p.y1 * H, x2: L + p.x2 * W, y2: T + p.y2 * H, h: p.height_m != null ? +p.height_m : o.h, view: front ? 'front' : 'plan' }; }); for (const o of prevPos) if (!P.lightPos.some(q => q.name === o.name)) P.lightPos.push(o); }
  /* חזית: הגובה של כל פנס מהמרחק מקו הרצפה (לפי הכיול), או מגובה הטראס אם כתוב */
  const floorY = front && d.floor_y != null ? T + (+d.floor_y) * H : null;
  const hgtOf = fx => { const pos = positions.find(p => p.name && fx.pos && p.name.toLowerCase() === String(fx.pos).toLowerCase()); if (pos && pos.height_m != null) return +pos.height_m; if (floorY != null && P.scale) return +Math.max(0, (floorY - (T + (+fx.y || 0) * H)) * P.scale).toFixed(1); return undefined; };
  for (const p of P.lightPos) if (isFinite(p.x1) && isFinite(p.x2)) P.sketch.walls.push([{ x: p.x1, y: p.y1 }, { x: p.x2, y: p.y2 }]);
  P.disc = 'light'; P.layer = 'light';
  const made = [];
  fixtures.forEach((fx, i) => { const f = matchOf[keyOf(fx)]; const n = fxAddNode(f ? f.sku : null, { x: L + (+fx.x || 0) * W, y: T + (+fx.y || 0) * H }, { name: f ? f.name : (fx.model || 'גוף תאורה'), sub: fx.label ? '#' + fx.label : '', pos: fx.pos || '', type: fx.type, model: fx.model || '', hgt: front ? hgtOf(fx) : undefined }); if (front) n.fx.view = 'front'; made.push({ n, fx, f }); });
  save(); render();
  /* סיכום: מה שויך לקטלוג, מה לא — ולכל לא-משויך כפתור לבחירת דגם */
  const groups = {}; made.forEach(m => { const k = keyOf(m.fx); (groups[k] = groups[k] || { k, f: m.f, n: 0, ids: [] }).n++; groups[k].ids.push(m.n.id); });
  const gs = Object.values(groups), ok = gs.filter(g => g.f), bad = gs.filter(g => !g.f);
  const ov = uiModal(`<b style="font-size:15px">🪄 ${front ? 'החזית' : 'תכנית התאורה'} נקראה — ${made.length} גופים</b>${front ? '<p class="muted" style="font-size:11px;margin:2px 0">חזית: הגובה של כל פנס חושב מקו הרצפה' + (P.scale ? '' : ' — <b>התכנית לא מכוילת</b>, כייל לפי גובה טראס ידוע כדי לקבל גבהים') + '; העומק (מיקום על תכנית התקרה) נקבע לפי הטראס.</p>' : ''}
    <p class="muted" style="font-size:11.5px;margin:4px 0 8px">${legend.length ? 'מקרא: ' + legend.map(l => esc((l.qty ? l.qty + '× ' : '') + (l.model || l.symbol || ''))).join(' · ') + '<br>' : ''}${positions.length ? 'עמדות: ' + positions.map(p => esc(p.name)).join(', ') : ''}${d.notes ? '<br>הערות: ' + esc(d.notes) : ''}</p>
    ${ok.length ? '<div style="font-size:12px;margin-bottom:6px"><b>✓ שויכו לקטלוג (נכנסו להצעה):</b>' + ok.map(g => `<div>${g.n}× ${esc(g.f.name.slice(0, 60))} <span class="muted">(${esc(g.k)})</span></div>`).join('') + '</div>' : ''}
    ${bad.length ? '<div style="font-size:12px"><b style="color:#a32222">✗ בלי התאמה בקטלוג — בחר דגם לכל אחד:</b>' + bad.map(g => `<div style="display:flex;gap:6px;align-items:center;margin:3px 0"><span style="flex:1">${g.n}× ${esc(g.k || 'ללא כיתוב')}</span><button data-fix="${esc(g.ids.join(','))}">🔍 בחר דגם</button></div>`).join('') + '</div>' : ''}
    <button data-x style="width:100%;margin-top:10px">סגור</button>`);
  ov.querySelector('[data-x]').onclick = () => ov.remove();
  ov.querySelectorAll('[data-fix]').forEach(b => b.onclick = () => { const ids = b.dataset.fix.split(','); fxPicker({ onPick: f => { if (!f) return;
    let it = impItems.find(x => x.key === f.sku && x.dest === 'point'); if (!it) { it = { on: true, qty: 0, name: f.name, key: f.sku, src: 'תאורה', dest: 'point', cat: 'lighting', u: 1, iid: uid('i'), placed: 0 }; if (typeof autoPrice === 'function') autoPrice(it); impItems.push(it); }
    ids.forEach(id => { const n = byId(id); if (!n) return; it.qty = (+it.qty || 0) + 1; it.placed = (it.placed || 0) + 1; n.srcIid = it.iid; n.fx = { ...(n.fx || {}), sku: f.sku, ch: f.spec && f.spec.dmx && f.spec.dmx.length ? f.spec.dmx[0] : 0, type: f.kind }; n.name = f.name.slice(0, 60); });
    b.parentElement.innerHTML = `<span style="flex:1;color:#0a7a4b">✓ ${ids.length}× ${esc(f.name.slice(0, 50))}</span>`; save(); render(); } }); });
}
