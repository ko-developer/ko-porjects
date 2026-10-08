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
/* הצעות מהקטלוג לכיתוב מהתכנית: הכי דומים בשם, ואם אין דמיון — מוצרים מאותו סוג (פנס חכם / סטטי / טראס) לפי מלאי */
function fxSuggest(model, type, n) {
  const norm = s => String(s || '').toUpperCase().replace(/[^A-Z0-9א-ת]+/g, ' ').trim();
  const mt = norm(model).split(' ').filter(t => t.length > 1), GEN = new Set(['LED', 'MOVING', 'HEAD', 'LIGHT', 'FIXTURE', 'W', 'WATT', 'פנס', 'חכם', 'גוף', 'תאורה', 'טראס', 'TRUSS']);
  const kinds = type === 'static' ? ['static', 'effect'] : type ? [type] : null;
  const scored = fxLib().filter(f => !kinds || kinds.includes(f.kind)).map(f => { const ft = new Set(norm(f.name + ' ' + f.sku).split(' ')); let sc = 0; for (const t of mt) if (ft.has(t)) sc += GEN.has(t) ? 0.3 : /^\d+$/.test(t) ? 0.8 : /\d/.test(t) ? 2 : 1.2;   /* דגם עם אותיות+ספרות (F5, RX4508) שווה הכי הרבה; מספר לבד (300) פחות — הוא גם הספק */ return { f, sc }; });
  const byName = scored.filter(x => x.sc >= 1).sort((a, b) => b.sc - a.sc || (fxStock(b.f) > 0) - (fxStock(a.f) > 0)).map(x => x.f);
  const byKind = scored.filter(x => x.sc < 1).sort((a, b) => (fxStock(b.f) > 0) - (fxStock(a.f) > 0) || (b.f.pdf ? 1 : 0) - (a.f.pdf ? 1 : 0)).map(x => x.f);
  return byName.concat(byKind).slice(0, n || 3);
}
function fxMatch(model, type) {
  const norm = s => String(s || '').toUpperCase().replace(/[^A-Z0-9א-ת]+/g, ' ').trim();
  const mt = norm(model).split(' ').filter(t => t.length > 1); if (!mt.length) return null;
  const GEN = new Set(['LED', 'MOVING', 'HEAD', 'LIGHT', 'FIXTURE', 'W', 'WATT', 'פנס', 'חכם', 'גוף', 'תאורה']);
  let best = null, bs = 0;
  for (const f of fxLib()) {
    if (type && f.kind !== type && !(type === 'static' && f.kind === 'effect')) continue;
    const ft = new Set(norm(f.name + ' ' + f.sku).split(' '));
    let sc = 0; for (const t of mt) if (ft.has(t)) sc += GEN.has(t) ? 0.3 : /^\d+$/.test(t) ? 0.8 : /\d/.test(t) ? 2 : 1.2;   /* דגם עם אותיות+ספרות (F5, RX4508) שווה הכי הרבה; מספר לבד (300) פחות — הוא גם הספק */
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
    ${P.fxInventory ? `<button style="width:100%;margin-bottom:6px" onclick="fxDetCommit(P.fxInventory.raw, P.fxInventory.view==='front')" title="הספירה האחרונה מהתכנית — ${esc((P.fxInventory.at || '').slice(0, 16).replace('T', ' '))}">📋 הספירה האחרונה (${(P.fxInventory.raw.fixtures || []).length} פנסים · ${(P.fxInventory.raw.trusses || []).length} טראסים)</button>` : ''}
    <button style="width:100%;margin-bottom:6px;background:#534ab7;color:#fff;font-weight:700" onclick="fxReadPlot()" title="תמונת תכנית תאורה של מעצב (סמלים, מקרא, טראסים) → סימוני זיהוי על התכנית → טבלת ספירה ובחירת מוצרים → הצבה והצעה">🪄 זהה פריטים בתכנית (תמונה)</button>
    ${fxDetPanelHTML()}${!P.fxDet ? '<button style="width:100%;margin-bottom:6px;font-size:11.5px" onclick="fxDetAddMode()" title="בלי קריאה אוטומטית: סמן בעצמך על התכנית מה יש ואיפה, ואז טבלת ספירה">✍ סמן זיהויים ידנית</button>' : ''}
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
/* ציור העמדה על תכנית התקרה כאובייקט שרטוט (נגרר, מסתובב, מידות במטרים): טראס ישר לפי אורך, עגול לפי קוטר */
function fxPosObj(name) { return ((P.sketch && P.sketch.objs) || []).find(o => o.pos && o.pos === name) || null; }   /* השרטוט משותף לכל התכניות בפרויקט */
function fxPosPlace(i) {
  const p = (P.lightPos || [])[i]; if (!p || !p.name) { uiToast('תן שם לעמדה קודם'); return; }
  if (!P.scale) { uiToast('כייל את התכנית קודם — מידות הטראס במטרים'); return; }
  const pxm = 1 / P.scale, c = viewCenterPt(); P.sketch = P.sketch || { walls: [], objs: [] };
  let o = fxPosObj(p.name);
  const circle = p.shape === 'circle', size = +p.size || (circle ? 4 : 3);
  if (!o) { o = { t: circle ? 'trussCircle' : 'truss', x: c.x, y: c.y, w: size * pxm, h: (circle ? size : 0.29) * pxm, r: 0, pos: p.name }; P.sketch.objs.push(o); }
  else { o.t = circle ? 'trussCircle' : 'truss'; o.w = size * pxm; o.h = (circle ? size : 0.29) * pxm; }
  sketchMode = { tool: 'select' }; sketchSel = P.sketch.objs.indexOf(o); if (typeof sketchBar === 'function') sketchBar();
  save(); render(); uiToast('📍 ' + p.name + ' על התכנית — גרור למקום (למשל צמוד לקיר), סובב בידית ⟳; המידות במטרים בסרגל', 7000);
}
/* נקודות על העמדה: t ∈ [0,1] לאורך טראס ישר, או זווית על טראס עגול (אחיד, מתחיל מהחזית = למטה) */
function fxPosPoint(o, t, idx, cnt) {
  const a = (o.r || 0) * Math.PI / 180, cs = Math.cos(a), sn = Math.sin(a);
  let lx, ly;
  if (o.t === 'trussCircle') { const ang = Math.PI / 2 + (idx / Math.max(1, cnt)) * 2 * Math.PI; lx = (o.w / 2) * Math.cos(ang); ly = (o.h / 2) * Math.sin(ang); }
  else { lx = (t - 0.5) * o.w; ly = 0; }
  return { x: o.x + lx * cs - ly * sn, y: o.y + lx * sn + ly * cs };
}
/* פיזור N פנסים על עמדה מצוירת (בלי חזית): "טראס עגול Ø4 עם 8 פנסים" */
function fxSpreadOnPos(i) {
  const p = (P.lightPos || [])[i]; const o = p && fxPosObj(p.name);
  if (!o) { uiToast('קודם 📍 הנח את העמדה על התכנית'); return; }
  uiPrompt('כמה פנסים על ' + p.name + '?', '6').then(v => { const n = Math.max(1, Math.min(60, +v || 0)); if (!n) return;
    fxPicker({ onPick: f => { if (!f) return; for (let k = 0; k < n; k++) { const pt = fxPosPoint(o, n > 1 ? k / (n - 1) : 0.5, k, n); fxAddNode(f.sku, pt, { pos: p.name, hgt: p.h }); } save(); render(); uiToast('🔆 ' + n + '× ' + f.name.slice(0, 30) + ' על ' + p.name); } }); });
}
function fxDepthHTML() {
  const pos = fxPositions(), sh = curSheet(P), front = sheetIsElevation();
  const row = (p, i) => `<div style="display:flex;gap:4px;align-items:center;margin:2px 0;font-size:11.5px">
      <input value="${esc(p.name || '')}" placeholder="שם עמדה (T1 / בר קדמי)" style="flex:1;min-width:0" onchange="P.lightPos[${i}].name=this.value;save()">
      <input type="number" step="0.1" value="${p.h ?? ''}" placeholder="גובה" title="גובה הטראס במטרים (trim)" style="width:58px" onchange="P.lightPos[${i}].h=this.value===''?undefined:+this.value;save()">
      <select style="width:62px;font-size:10.5px" title="צורת הטראס" onchange="P.lightPos[${i}].shape=this.value;save();render()"><option value="bar" ${p.shape !== 'circle' ? 'selected' : ''}>ישר</option><option value="circle" ${p.shape === 'circle' ? 'selected' : ''}>עגול</option></select>
      <input type="number" step="0.1" value="${p.size ?? ''}" placeholder="${p.shape === 'circle' ? 'קוטר' : 'אורך'}" title="${p.shape === 'circle' ? 'קוטר הטראס במטרים' : 'אורך הטראס במטרים'}" style="width:54px" onchange="P.lightPos[${i}].size=this.value===''?undefined:+this.value;save()">
      ${front ? `<input type="number" step="0.1" value="${p.d ?? ''}" placeholder="עומק" title="עומק במטרים מקדמת הבמה — רק אם העמדה לא מצוירת על תכנית התקרה" style="width:52px" onchange="P.lightPos[${i}].d=this.value===''?undefined:+this.value;save()">` : `<button style="padding:1px 6px;font-size:11px;${fxPosObj(p.name) ? 'background:#eef7f1' : ''}" title="${fxPosObj(p.name) ? 'מצויר על התכנית — לחיצה מעדכנת מידות ובוחרת' : 'צייר את הטראס על התכנית במידות האלה, ואז גרור אותו למקום (צמוד לקיר וכד׳)'}" onclick="fxPosPlace(${i})">${fxPosObj(p.name) ? '✓ מצויר' : '📍 הנח'}</button><button style="padding:1px 6px;font-size:11px" title="פיזור N פנסים לאורך הטראס / סביב העיגול" onclick="fxSpreadOnPos(${i})">🔆</button>`}
      <span class="muted" style="font-size:10px;white-space:nowrap">${fxNodes().filter(n => n.fx && n.fx.pos === p.name).length}</span>
      <button style="padding:1px 5px" onclick="P.lightPos.splice(${i},1);save();render()">✕</button></div>`;
  return `<details ${front ? 'open' : ''} style="margin:4px 0 8px"><summary style="cursor:pointer;font-size:12px;font-weight:700">📏 עמדות תלייה — גובה ועומק (${pos.length})</summary>
    <p class="muted" style="font-size:10.5px;margin:3px 0">${front ? 'לכל טראס/בר: גובה, צורה ומידה. על תכנית התקרה מציירים אותו במקומו (📍) — ומשם "העתק" יודע איפה כל פנס. עומק במטרים רק כתחליף כשהטראס לא מצויר.' : 'כל טראס/בר: שם, גובה, צורה (ישר/עגול) ומידה במטרים → 📍 מצייר אותו על התכנית, גוררים למקום (למשל צמוד לקיר) → 🔆 מפזר פנסים עליו, או ⤵ מהחזית.'}</p>
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
    const drawnAll = fxNodes().every(n => n.fx && n.fx.pos && fxPosObj(n.fx.pos));
    if (!tgt.fxRef && !drawnAll) { uiToast('בתכנית "' + tgt.name + '" אין קו ייחוס ולא כל העמדות מצוירות — צייר את הטראסים (📍) או סמן קו ייחוס, וחזור', 8000); return; }
    if (!tgt.scale) { uiToast('תכנית "' + tgt.name + '" לא מכוילת — כייל אותה קודם', 6000); return; }
    const ns = fxNodes(); if (!ns.length) { uiToast('אין פנסים בחזית'); return; }
    /* X יחסי בחזית: לפי קו הייחוס של החזית, ואם אין — לפי הפריסה של הפנסים */
    const cx = n => 2200 - n.x - 20;
    let fl, fr; if (src.fxRef) { fl = Math.min(src.fxRef.x1, src.fxRef.x2); fr = Math.max(src.fxRef.x1, src.fxRef.x2); } else { const xs = ns.map(cx); fl = Math.min(...xs); fr = Math.max(...xs); }
    const span = Math.max(1, fr - fl);
    const R = tgt.fxRef || { x1: 0, y1: 0, x2: 1, y2: 0 }, dx = R.x2 - R.x1, dy = R.y2 - R.y1, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, nx = uy, ny = -ux;   /* נורמל: מהקו והלאה מהקהל (שמאל→ימין כפי שרואים מהקהל) */
    const pxPerM = 1 / tgt.scale, pos = fxPositions();
    tgt.nodes = tgt.nodes || []; let made = 0;
    for (const n of ns) {
      const p = pos.find(q => q.name && n.fx && q.name === n.fx.pos), d = p && p.d != null ? p.d : (P.fxDefDepth || 0), o = p && fxPosObj(p.name);
      let X, Y;
      if (o) {   /* העמדה מצוירת על התקרה: לאורך הטראס לפי המיקום היחסי בחזית (בגבולות הטראס בחזית), או סביב העיגול */
        const sib = ns.filter(q => q.fx && q.fx.pos === p.name), k = sib.indexOf(n);
        const xl = p.x1 != null ? Math.min(p.x1, p.x2) : Math.min(...sib.map(cx)), xr = p.x1 != null ? Math.max(p.x1, p.x2) : Math.max(...sib.map(cx));
        const tt = xr > xl ? (cx(n) - xl) / (xr - xl) : 0.5, pt = fxPosPoint(o, tt, k, sib.length); X = pt.x; Y = pt.y;
      } else { const t = (cx(n) - fl) / span; X = R.x1 + ux * t * len + nx * d * pxPerM; Y = R.y1 + uy * t * len + ny * d * pxPerM; }
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
/* ---------- ספירת מלאי מהתכנית: מה נמצא, כמה, ומה זה בקטלוג ----------
   הטבלה מוצגת לפני שמציבים משהו: לכל דגם — כמה סמלים נספרו, כמה כתוב במקרא (סתירה מודגשת), ההתאמה בקטלוג (ניתנת לשינוי),
   מחיר ליחידה; לכל טראס — צורה, מידה, התאמה לפריט טראס. אורי מאשר/מתקן את הכמויות → הצבה על התכנית ושורות בהצעה (או רק הצעה). */
function fxInventoryDlg(d, front) {
  return new Promise(res => {
    const fixtures = d.fixtures || [], legend = d.legend || [], trusses = d.trusses || [];
    const keyOf = fx => (fx.model || fx.type || '').trim();
    const groups = {}; fixtures.forEach(fx => { const k = keyOf(fx); (groups[k] = groups[k] || { k, type: fx.type, n: 0 }).n++; });
    const gs = Object.values(groups).map(g => { const lg = legend.find(l => l.model && l.model.trim().toLowerCase() === g.k.toLowerCase()); const cnt = (d.counts || []).find(c => (c.model || '').trim().toLowerCase() === g.k.toLowerCase());
      const f = fxMatch(g.k, g.type === 'other' ? '' : g.type), sug = fxSuggest(g.k, g.type === 'other' ? '' : g.type, 4); return { ...g, legendQty: lg ? +lg.qty || null : null, aiQty: cnt ? +cnt.qty || null : null, qty: g.n, sku: f ? f.sku : null, sug }; });
    const ts = trusses.map(t => { const size = t.diameter_m ? 'Ø' + t.diameter_m : t.length_m ? t.length_m + ' מ׳' : (t.segments || []).map(sg => sg.qty + '×' + sg.length_m + 'מ׳').join(' + ') || '';
      const q = (t.shape === 'circle' ? 'טראס עגול ' : 'טראס ') + size, f = fxMatch(q, 'truss'); return { ...t, size, sku: f ? f.sku : null, qty: 1, sug: fxSuggest(q, 'truss', 4) }; });
    const price = sku => { const f = fxOf(sku); return f ? fxPrice(f) : 0; };
    const ov = uiModal(`<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><b style="flex:1;font-size:15px">📋 ספירה מ${front ? 'החזית' : 'תכנית התאורה'} — ${fixtures.length} פנסים · ${trusses.length} טראסים</b></div>
      <p class="muted" style="font-size:11px;margin:0 0 8px">כמות = מה שנספר בציור; במקרא = מה שכתוב במקרא (סתירה באדום). תקן כמויות, שייך דגם מהקטלוג, ואשר.${d.notes ? '<br>הערות הקורא: ' + esc(d.notes) : ''}</p>
      <div style="max-height:50vh;overflow:auto"><table style="width:100%;font-size:11.5px;border-collapse:collapse" data-t="fx"><thead><tr style="background:#f3f1ec"><th style="text-align:right">בציור</th><th>סוג</th><th>כמות</th><th>במקרא</th><th style="text-align:right">בקטלוג של KO</th><th>₪ ליח׳</th></tr></thead><tbody>
      ${gs.map((g, i) => `<tr data-i="${i}" style="border-bottom:1px solid #eee"><td style="text-align:right"><b>${esc(g.k || 'ללא כיתוב')}</b></td><td>${{ moving: '🔦', static: '💡', effect: '✨' }[g.type] || '📦'}</td>
        <td><input type="number" min="0" value="${g.qty}" data-q style="width:52px"></td><td style="color:${g.legendQty != null && g.legendQty !== g.n ? '#c0392b' : '#555'}">${g.legendQty != null ? g.legendQty : '—'}</td>
        <td style="text-align:right">${(() => { const o = gs[i]; const opts = (o.sug || []).map(f => `<option value="${esc(f.sku)}" ${o.sku === f.sku ? 'selected' : ''}>${esc(f.name.slice(0, 46))}${fxPrice(f) ? ' · ₪' + Math.round(fxPrice(f)).toLocaleString() : ''}${fxStock(f) > 0 ? '' : ' · אזל'}</option>`).join(''); return `<select data-sel style="max-width:260px;font-size:11px"><option value="" ${o.sku ? '' : 'selected'}>— בחר מוצר —</option>${opts}</select>`; })()} <button data-pick style="padding:1px 6px;font-size:11px" title="חיפוש בכל הספרייה">🔍</button></td><td data-pr>${g.sku && price(g.sku) ? Math.round(price(g.sku)).toLocaleString() : ''}</td></tr>`).join('')}
      </tbody></table>
      ${ts.length ? `<h4 style="margin:8px 0 4px;font-size:12.5px">🏗 טראסים</h4><table style="width:100%;font-size:11.5px;border-collapse:collapse" data-t="tr"><thead><tr style="background:#f3f1ec"><th style="text-align:right">בציור</th><th>צורה</th><th>מידה</th><th>כמות</th><th style="text-align:right">בקטלוג</th><th>₪</th></tr></thead><tbody>
      ${ts.map((t, i) => `<tr data-i="${i}" style="border-bottom:1px solid #eee"><td style="text-align:right"><b>${esc(t.name || '')}</b></td><td>${t.shape === 'circle' ? '⭕ עגול' : t.shape === 'corner' ? '∟ פינה' : '— ישר'}</td><td>${esc(t.size)}</td><td><input type="number" min="0" value="1" data-q style="width:48px"></td>
        <td style="text-align:right">${(() => { const o = ts[i]; const opts = (o.sug || []).map(f => `<option value="${esc(f.sku)}" ${o.sku === f.sku ? 'selected' : ''}>${esc(f.name.slice(0, 46))}${fxPrice(f) ? ' · ₪' + Math.round(fxPrice(f)).toLocaleString() : ''}${fxStock(f) > 0 ? '' : ' · אזל'}</option>`).join(''); return `<select data-sel style="max-width:260px;font-size:11px"><option value="" ${o.sku ? '' : 'selected'}>— בחר מוצר —</option>${opts}</select>`; })()} <button data-pick style="padding:1px 6px;font-size:11px" title="חיפוש בכל הספרייה">🔍</button></td><td data-pr>${t.sku && price(t.sku) ? Math.round(price(t.sku)).toLocaleString() : ''}</td></tr>`).join('')}</tbody></table>` : ''}</div>
      <p style="font-size:12px;margin:8px 0 4px"><b>סה״כ: <span data-tot></span></b></p>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="primary" data-ok style="flex:2">✓ הצב על התכנית + הצעה</button><button data-offer style="flex:1">🧾 רק להצעה</button><button data-x style="flex:1">ביטול</button></div>`);
    ov.firstElementChild.style.maxWidth = '820px'; ov.firstElementChild.style.width = '95%';
    const tot = () => { let t = 0; ov.querySelectorAll('tr[data-i]').forEach(tr => { const tb = tr.closest('table').dataset.t, i = +tr.dataset.i, o = tb === 'fx' ? gs[i] : ts[i]; o.qty = +tr.querySelector('[data-q]').value || 0; t += o.qty * price(o.sku); }); ov.querySelector('[data-tot]').textContent = '₪' + Math.round(t).toLocaleString(); };
    ov.querySelectorAll('[data-q]').forEach(inp => inp.oninput = tot); tot();
    ov.querySelectorAll('tr[data-i]').forEach(tr => { const tb = tr.closest('table').dataset.t, i = +tr.dataset.i, o = tb === 'fx' ? gs[i] : ts[i];
      const sel = tr.querySelector('[data-sel]'); sel.onchange = () => { o.sku = sel.value || null; tr.querySelector('[data-pr]').textContent = o.sku && price(o.sku) ? Math.round(price(o.sku)).toLocaleString() : ''; tot(); };
      tr.querySelector('[data-pick]').onclick = () => fxPicker({ kind: tb === 'tr' ? 'truss' : '', onPick: f => { if (!f) return; o.sku = f.sku; if (![...sel.options].some(op => op.value === f.sku)) { const op = document.createElement('option'); op.value = f.sku; op.textContent = f.name.slice(0, 46) + (fxPrice(f) ? ' · ₪' + Math.round(fxPrice(f)).toLocaleString() : ''); sel.appendChild(op); } sel.value = f.sku; tr.querySelector('[data-pr]').textContent = price(f.sku) ? Math.round(price(f.sku)).toLocaleString() : ''; tot(); } }); });
    const done = v => { ov.remove(); res(v); };
    ov.querySelector('[data-ok]').onclick = async () => { tot(); const miss = gs.filter(g => g.qty && !g.sku).length + ts.filter(t => t.qty && !t.sku).length; if (miss && !(await uiConfirm(miss + ' שורות בלי מוצר מהאתר — הן יוצבו על התכנית בלי מחיר ולא ייכנסו להצעה. להמשיך?'))) return; done({ groups: gs, trusses: ts, place: true }); };
    ov.querySelector('[data-offer]').onclick = () => { tot(); done({ groups: gs, trusses: ts, place: false }); };
    ov.querySelector('[data-x]').onclick = () => done(null);
  });
}
/* שורות בהצעה מהספירה: טראסים תמיד; פנסים — רק כש"רק להצעה" (בהצבה הפנסים נכנסים דרך fxAddNode) */
function fxInventoryToOffer(ok, placing) {
  const add = (sku, qty, name, placed) => { if (!sku || !qty) return; const f = fxOf(sku); let it = impItems.find(x => x.key === sku && x.dest === 'point'); if (!it) { it = { on: true, qty: 0, name: f ? f.name : name, key: sku, src: 'תכנית תאורה', dest: 'point', cat: 'lighting', u: 1, iid: uid('i'), placed: 0 }; if (typeof autoPrice === 'function') autoPrice(it); impItems.push(it); } it.qty = (+it.qty || 0) + qty; if (placed) it.placed = (it.placed || 0) + qty; };
  if (!placing) for (const g of ok.groups) add(g.sku, g.qty, g.k, false);
  for (const t of ok.trusses) { add(t.sku, t.qty, t.name, false); P.lightPos = P.lightPos || []; if (t.name && !P.lightPos.some(p => p.name === t.name)) P.lightPos.push({ name: t.name, shape: t.shape === 'circle' ? 'circle' : 'bar', size: t.diameter_m || t.length_m || undefined }); }
}
/* ---------- קריאת תכנית תאורה של מעצב (ראייה) ---------- */
var FX_PLOT_PROMPT = `You are reading a stage/event lighting plot (a designer's drawing). Extract EVERY lighting fixture symbol you can see.
Return ONLY JSON: {"fixtures":[{"x":0.0-1.0,"y":0.0-1.0,"type":"moving|static|effect|other","model":"text written for this fixture or its legend entry","label":"unit number/label if written","pos":"name of the truss/bar/position it hangs on, if written"}],
"legend":[{"symbol":"short description of the symbol","model":"model/fixture name as written","qty":N}],
"positions":[{"name":"truss/bar name as written","x1":0-1,"y1":0-1,"x2":0-1,"y2":0-1}],
"trusses":[{"name":"truss/bar name as written","shape":"straight|circle|corner|other","length_m":number or null,"diameter_m":number or null,"segments":[{"length_m":number,"qty":N}],"notes":"as written"}],
"counts":[{"model":"model/type name as in fixtures","type":"moving|static|effect|other","qty":N}],"notes":"anything unclear"}.
counts = your own tally of the fixture entries per model (must equal the number of fixture entries with that model). trusses = every truss/bar as a physical object with its written size (e.g. "3m", "Ø4", "4× 2m segments"); do not invent sizes.
x,y are relative to the whole image (0,0 = top-left, 1,1 = bottom-right), at the centre of each symbol. One entry per physical fixture (if a legend says 8× of a symbol, there should be 8 entries). Copy model names exactly as written (do not guess brands). type: moving = moving head/spot/beam/wash moving; static = PAR/wash/blinder/strobe/static LED bar; effect = haze/smoke/laser/mirror ball.`;
var FX_PLOT_PROMPT_FRONT = `You are reading a FRONT ELEVATION lighting plot (stage seen from the audience): trusses/bars are drawn as horizontal members at their trim heights, fixtures hang below or sit on them, the stage floor is a horizontal line near the bottom. Extract EVERY fixture symbol.
Return ONLY JSON: {"fixtures":[{"x":0.0-1.0,"y":0.0-1.0,"type":"moving|static|effect|other","model":"text written for this fixture or its legend entry","label":"unit number if written","pos":"name of the truss/bar it hangs on, if written"}],
"legend":[{"symbol":"short description","model":"model name as written","qty":N}],
"positions":[{"name":"truss/bar name as written","x1":0-1,"y1":0-1,"x2":0-1,"y2":0-1,"height_m":number or null if a trim height is written}],
"floor_y":0.0-1.0 (relative y of the stage floor line, null if none),
"trusses":[{"name":"truss/bar name as written","shape":"straight|circle|corner|other","length_m":number or null,"diameter_m":number or null,"segments":[{"length_m":number,"qty":N}],"notes":"as written"}],
"counts":[{"model":"model/type name as in fixtures","type":"moving|static|effect|other","qty":N}],"notes":"anything unclear"}.
counts = your own tally of the fixture entries per model (must equal the number of fixture entries with that model). trusses = every truss/bar as a physical object with its written size (e.g. "3m", "Ø4", "4× 2m segments"); do not invent sizes.
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
  /* שלב 1: סימונים על התכנית — בודקים, מוסיפים/מתקנים, ורק אז ➡ לטבלת הספירה */
  fxDetFromRaw(d, front); save(); render(); fxDetWinOpen();
  const n = (P.fxDet.items || []).length;
  uiToast(n ? '🔎 ' + n + ' זיהויים סומנו על התכנית — לחץ על סימון לתיקון, הוסף זיהויים בפאנל, ואז ➡ לטבלת הספירה' : 'לא זוהו גופים' + (d.notes ? ' — ' + d.notes : ''), 9000);
}
/* ---------- סימוני זיהוי (לפני ההצבה) ---------- */
var FX_DET_TYPES = [['moving', '🔦 פנס חכם', '#7a2a9b'], ['static', '💡 פנס סטטי', '#d9780f'], ['effect', '✨ אפקט', '#0f8a7a'], ['truss', '🏗 טראס', '#3a3f4a'], ['other', '📦 אחר', '#2a5db0']];
function fxDetFromRaw(d, front) {
  const L = bgLeft(), T = bgTop(), W = P.bgW || 1400, H = bgHeightPx();
  const items = (d.fixtures || []).map(fx => ({ id: uid('fd'), x: L + (+fx.x || 0) * W, y: T + (+fx.y || 0) * H, type: fx.type || 'other', model: fx.model || '', pos: fx.pos || '', label: fx.label || '' }));
  P.fxDet = { front: !!front, legend: d.legend || [], positions: (d.positions || []).map(p => ({ ...p, X1: L + p.x1 * W, Y1: T + p.y1 * H, X2: L + p.x2 * W, Y2: T + p.y2 * H })), trusses: d.trusses || [], counts: d.counts || [], floor_y: d.floor_y, notes: d.notes || '', items };
}
function fxDetSVG() {
  if (typeof FX_DET_TYPES === 'undefined') return '';   /* הרינדור הראשון רץ לפני שהקובץ הזה הסתיים (var עוד לא הוצב) */
  const D = P.fxDet; if (!D || P.layer !== 'light' && P.layer !== 'all') return '';
  const col = t => (FX_DET_TYPES.find(x => x[0] === t) || FX_DET_TYPES[4])[2];
  let s = '';
  (D.positions || []).forEach(p => { s += `<line x1="${p.X1}" y1="${p.Y1}" x2="${p.X2}" y2="${p.Y2}" stroke="#3a3f4a" stroke-width="3" stroke-dasharray="10 6" opacity=".7"/><text x="${(p.X1 + p.X2) / 2}" y="${(p.Y1 + p.Y2) / 2 - 6}" text-anchor="middle" font-size="11" font-weight="700" fill="#3a3f4a">${esc(p.name || '')}</text>`; });
  (D.items || []).forEach((it, i) => { const c = col(it.type); s += `<g data-fxdet="${it.id}" style="pointer-events:all;cursor:pointer"><title>${esc((it.model || it.type) + (it.pos ? ' · ' + it.pos : ''))} — לחיצה לתיקון/מחיקה</title><circle cx="${it.x}" cy="${it.y}" r="${D.sel === it.id ? 13 : 9}" fill="${c}" fill-opacity=".85" stroke="${D.sel === it.id ? '#ffd166' : '#fff'}" stroke-width="${D.sel === it.id ? 3 : 1.5}"/><text x="${it.x}" y="${it.y + 3.5}" text-anchor="middle" font-size="9" font-weight="800" fill="#fff" style="pointer-events:none">${i + 1}</text></g>`; });
  return s;
}
function fxDetAddAt(pt) {
  const A = window.__fxDetAdd; if (!A || !P.fxDet) return;
  P.fxDet.items.push({ id: uid('fd'), x: pt.x, y: pt.y, type: A.type, model: A.model || '', sku: A.sku || null, pos: A.pos || '', label: '' });
  save(); render(); uiToast('➕ ' + (A.model || A.type) + ' — ' + P.fxDet.items.length + ' זיהויים · Esc לסיום', 2500);
}
function fxDetEdit(id) {
  const D = P.fxDet; const it = D && D.items.find(x => x.id === id); if (!it) return;
  const ov = uiModal(`<b style="font-size:14px">🔎 זיהוי #${D.items.indexOf(it) + 1}</b>
    <div class="fld" style="margin-top:8px"><label>סוג</label><select data-t>${FX_DET_TYPES.map(([v, l]) => `<option value="${v}" ${it.type === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    <div class="fld"><label>דגם / כיתוב בתכנית</label><input data-m value="${esc(it.model || '')}" placeholder="כמו שכתוב אצל המעצב"></div>
    <div class="fld"><label>עמדה (טראס / בר)</label><input data-p value="${esc(it.pos || '')}"></div>
    <div style="display:flex;gap:6px"><button class="primary" data-ok style="flex:2">שמור</button><button data-same style="flex:2" title="מחיל את הסוג והדגם על כל הזיהויים שיש להם אותו כיתוב">על כל הדומים</button><button data-del style="flex:1;color:#c0392b">🗑</button><button data-x style="flex:1">ביטול</button></div>`);
  const apply = all => { const t = ov.querySelector('[data-t]').value, m = ov.querySelector('[data-m]').value.trim(), p = ov.querySelector('[data-p]').value.trim(), m0 = it.model;
    (all ? D.items.filter(x => (x.model || '') === (m0 || '')) : [it]).forEach(x => { x.type = t; x.model = m; if (!all) x.pos = p; }); ov.remove(); save(); render(); };
  ov.querySelector('[data-ok]').onclick = () => apply(false); ov.querySelector('[data-same]').onclick = () => apply(true);
  ov.querySelector('[data-del]').onclick = () => { D.items = D.items.filter(x => x !== it); ov.remove(); save(); render(); };
  ov.querySelector('[data-x]').onclick = () => ov.remove();
}
function fxDetPanelHTML() {
  const D = P.fxDet; if (typeof FX_DET_TYPES === 'undefined') return '';
  if (document.getElementById('fxDetWin')) setTimeout(fxDetWinRender, 0);   /* החלון הצף מתעדכן עם כל רינדור */
  if (!D) return '';
  const A = window.__fxDetAdd, cnt = {}; (D.items || []).forEach(it => { const k = it.type + '|' + (it.model || ''); cnt[k] = (cnt[k] || 0) + 1; });
  const chips = Object.entries(cnt).sort((a, b) => b[1] - a[1]).map(([k, n]) => { const [t, m] = k.split('|'); const T = FX_DET_TYPES.find(x => x[0] === t) || FX_DET_TYPES[4], c = T[2]; return `<span style="display:inline-flex;align-items:center;gap:4px;border:1px solid ${c};color:${c};border-radius:12px;padding:1px 4px 1px 8px;font-size:10.5px;margin:1px">${n}× ${esc(m || T[1].slice(2))}<button style="padding:0 5px;font-size:10px;border-radius:9px;border:1px solid ${c};background:#fff;color:${c}" title="חפש בתמונה עוד פריטים כמו אלה שסומנו" onclick="fxDetFindSimilar('${esc(t)}','${jsq(m)}')">🔎 עוד כמוני</button></span>`; }).join('');
  return `<div style="border:1.5px solid #534ab7;border-radius:10px;padding:8px;margin:0 0 8px;background:#f7f6ff">
    <b style="font-size:12.5px">🔎 זיהויים על התכנית — ${(D.items || []).length}${D.positions && D.positions.length ? ' · ' + D.positions.length + ' עמדות' : ''}</b>
    <div style="margin:4px 0">${chips || '<span class="muted" style="font-size:11px">אין עדיין — הוסף בלחיצה על התכנית</span>'}</div>
    <p class="muted" style="font-size:10.5px;margin:2px 0 6px">לחיצה על סימון = תיקון סוג/דגם או מחיקה. להוספה: בחר סוג וכיתוב ולחץ על התכנית איפה שהפריט (כמה פעמים). Esc מסיים.</p>
    <div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap">
      <select id="fxDetT" style="font-size:11px">${FX_DET_TYPES.map(([v, l]) => `<option value="${v}" ${A && A.type === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <input id="fxDetM" placeholder="דגם / כיתוב" value="${esc(A ? A.model || '' : '')}" style="flex:1;min-width:90px;font-size:11px">
      <button style="font-size:11px;${A ? 'background:#ff8a50;color:#1a1e28;font-weight:700' : ''}" onclick="fxDetAddMode()">${A ? '⏹ סיום הוספה' : '➕ הוסף בלחיצה'}</button>
    </div>
    <div style="display:flex;gap:6px;margin-top:6px"><button style="flex:1" onclick="fxDetWinOpen()" title="טבלת הזיהויים כחלון צף — עריכה תוך כדי לחיצה על התכנית">🪟 טבלה צפה</button><button style="flex:2;background:#534ab7;color:#fff;font-weight:700" onclick="fxDetToTable()">➡ לטבלת הספירה ובחירת מוצרים</button><button style="flex:1;color:#c0392b" onclick="uiConfirm('למחוק את כל הזיהויים?').then(ok=>{if(ok){P.fxDet=null;window.__fxDetAdd=null;save();render()}})">🗑</button></div></div>`;
}
/* "חפש עוד כמוני": הסימונים של קבוצה (סוג+כיתוב) הם הדוגמאות; Claude מקבל את התמונה, חיתוך של דוגמה אחת ואת מיקומי הדוגמאות, ומחזיר את כל המופעים הנוספים */
async function fxDetFindSimilar(type, model) {
  const D = P.fxDet; if (!D || !P.bg) return;
  const ex = D.items.filter(it => it.type === type && (it.model || '') === (model || '')); if (!ex.length) { uiToast('אין סימונים לדוגמה'); return; }
  const L = bgLeft(), T = bgTop(), W = P.bgW || 1400, H = bgHeightPx();
  const rel = it => [+((it.x - L) / W).toFixed(3), +((it.y - T) / H).toFixed(3)];
  const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = P.bg; });
  /* חיתוך סביב הדוגמה הראשונה — 7% מרוחב התמונה, מוגדל */
  const [ux, uy] = rel(ex[0]), bw = Math.round(im.width * 0.07), cv = document.createElement('canvas'); cv.width = 240; cv.height = 240;
  cv.getContext('2d').drawImage(im, Math.max(0, ux * im.width - bw / 2), Math.max(0, uy * im.height - bw / 2), bw, bw, 0, 0, 240, 240);
  const crop = cv.toDataURL('image/png').split(',')[1], mt = /^data:image\/png/i.test(P.bg) ? 'image/png' : 'image/jpeg';
  const name = model || (FX_DET_TYPES.find(x => x[0] === type) || FX_DET_TYPES[4])[1].slice(2);
  uiToast('🔎 מחפש עוד "' + name + '" בתמונה…', 6000);
  let j; try {
    j = await claudeMsg([{ role: 'user', content: [
      { type: 'text', text: 'Image 1 is a lighting drawing or venue photo. Image 2 is a zoomed crop of ONE example of the object "' + name + '". In image 1 this same object is already marked at these relative positions (x,y; 0,0 = top-left, 1,1 = bottom-right): ' + JSON.stringify(ex.slice(0, 12).map(rel)) + '. Find ALL OTHER occurrences of the same kind of object in image 1 that are NOT within 0.02 of a listed position. Return ONLY JSON {"found":[{"x":0-1,"y":0-1,"confidence":0-1}],"notes":"short"}. Do not include the listed ones. If there are none, return an empty list.' },
      { type: 'image', source: { type: 'base64', media_type: mt, data: P.bg.split(',')[1] } },
      { type: 'image', source: { type: 'base64', media_type: 'image/png', data: crop } }] }], 3000);
  } catch (e) { uiToast('החיפוש נכשל: ' + e.message, 6000); return; }
  let d; try { d = claudeJson(j); } catch (e) { uiToast('תשובה לא תקינה'); return; }
  let added = 0;
  for (const f of d.found || []) { if (!(f.confidence >= 0.5)) continue; const x = L + (+f.x || 0) * W, y = T + (+f.y || 0) * H;
    if (D.items.some(it => Math.hypot(it.x - x, it.y - y) < 0.02 * W)) continue;
    D.items.push({ id: uid('fd'), x, y, type, model: model || '', pos: '', label: '' }); added++; }
  save(); render(); uiToast(added ? '🔎 נוספו ' + added + ' "' + name + '" — בדוק את הסימונים, מחק מה שלא נכון' : 'לא נמצאו עוד' + (d.notes ? ' — ' + d.notes : ''), 7000);
}
/* ---------- טבלת הזיהויים כחלון צף (לא חוסם את התכנית — לוחצים על התכנית ועורכים בטבלה במקביל) ---------- */
function fxDetWinOpen() {
  let ov = document.getElementById('fxDetWin');
  if (ov) { fxDetWinRender(); return; }
  ov = document.createElement('div'); ov.id = 'fxDetWin';
  ov.style.cssText = 'position:fixed;inset:0;z-index:' + (++FLOAT_Z) + ';pointer-events:none;display:flex;align-items:flex-start;justify-content:flex-start;padding:70px 0 0 16px;direction:rtl';
  ov.innerHTML = '<div data-box style="pointer-events:auto;background:#fff;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.35);width:min(620px,94vw);max-height:80vh;display:flex;flex-direction:column;padding:10px 12px 10px 24px;border:1.5px solid #534ab7"></div>';
  document.body.appendChild(ov);
  fxDetWinRender();
  if (typeof floatDialog === 'function') floatDialog(ov.querySelector('[data-box]'), 'fxDetWin');
}
function fxDetWinClose() { const ov = document.getElementById('fxDetWin'); if (ov) ov.remove(); if (typeof floatSync === 'function') floatSync(); }
function fxDetWinRender() {
  const ov = document.getElementById('fxDetWin'); if (!ov) return; const box = ov.querySelector('[data-box]'); if (!box) return;
  if (!P.fxDet) P.fxDet = { front: sheetIsElevation(), legend: [], positions: [], trusses: [], items: [] };
  const D = P.fxDet, A = window.__fxDetAdd, T = FX_DET_TYPES, scrollTop = (box.querySelector('[data-tbl]') || {}).scrollTop || 0;
  const typeSel = (v, oc) => `<select style="font-size:11px" onchange="${oc}">${T.map(([k, l]) => `<option value="${k}" ${v === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  const groups = {}; D.items.forEach(it => { const k = it.type + '|' + (it.model || ''); groups[k] = (groups[k] || 0) + 1; });
  const rows = D.items.map((it, i) => { const c = (T.find(x => x[0] === it.type) || T[4])[2], k = it.type + '|' + (it.model || '');
    return `<tr data-row="${it.id}" style="border-bottom:1px solid #eee;${D.sel === it.id ? 'background:#eef' : ''}">
      <td style="text-align:center"><span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:${c};color:#fff;font-size:10px;font-weight:800;line-height:18px;text-align:center;cursor:pointer" title="הצג על התכנית" onclick="fxDetLocate('${it.id}')">${i + 1}</span></td>
      <td>${typeSel(it.type, `fxDetSet('${it.id}','type',this.value)`)}</td>
      <td><input value="${esc(it.model || '')}" placeholder="כיתוב / דגם" style="width:100%;font-size:11px" onchange="fxDetSet('${it.id}','model',this.value)"></td>
      <td><input value="${esc(it.pos || '')}" placeholder="עמדה" style="width:64px;font-size:11px" onchange="fxDetSet('${it.id}','pos',this.value)"></td>
      <td style="white-space:nowrap"><button style="padding:1px 5px;font-size:10.5px" title="חפש בתמונה עוד כמו כל ה-${groups[k]} של הקבוצה הזו" onclick="fxDetFindSimilar('${esc(it.type)}','${jsq(it.model || '')}')">🔎</button>
        <button style="padding:1px 5px;font-size:10.5px" title="החל סוג+כיתוב על כל הדומים (אותו כיתוב)" onclick="fxDetSameAs('${it.id}')">≡</button>
        <button style="padding:1px 5px;font-size:10.5px;color:#c0392b" onclick="fxDetDel('${it.id}')">🗑</button></td></tr>`; }).join('');
  const chips = Object.entries(groups).sort((a, b) => b[1] - a[1]).map(([k, n]) => { const [t, m] = k.split('|'); const Tt = T.find(x => x[0] === t) || T[4]; return `<span style="border:1px solid ${Tt[2]};color:${Tt[2]};border-radius:12px;padding:0 7px;font-size:10.5px">${n}× ${esc(m || Tt[1].slice(2))}</span>`; }).join(' ');
  box.innerHTML = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><b style="flex:1;font-size:14px">🔎 זיהויים על התכנית — ${D.items.length}</b><button onclick="fxDetWinClose()" title="סגור (הזיהויים נשארים)">✕</button></div>
    <div style="font-size:11px;margin-bottom:6px;line-height:1.9">${chips || '<span class="muted">אין עדיין — בחר סוג וכיתוב ולחץ על התכנית</span>'}</div>
    <div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;margin-bottom:6px">
      <select id="fxDetT" style="font-size:11px">${T.map(([v, l]) => `<option value="${v}" ${A && A.type === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <input id="fxDetM" placeholder="כיתוב / דגם" value="${esc(A ? A.model || '' : '')}" style="flex:1;min-width:90px;font-size:11px">
      <button style="font-size:11px;${A ? 'background:#ff8a50;color:#1a1e28;font-weight:700' : ''}" onclick="fxDetAddMode()">${A ? '⏹ סיום הוספה' : '➕ הוסף בלחיצה על התכנית'}</button></div>
    <div data-tbl style="overflow:auto;flex:1;min-height:0;max-height:46vh"><table style="width:100%;font-size:11.5px;border-collapse:collapse"><thead><tr style="background:#f3f1ec;position:sticky;top:0"><th>#</th><th>סוג</th><th style="text-align:right">כיתוב / דגם</th><th>עמדה</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
    <div style="display:flex;gap:6px;margin-top:8px"><button style="flex:2;background:#534ab7;color:#fff;font-weight:700" onclick="fxDetWinClose();fxDetToTable()">➡ לטבלת הספירה ובחירת מוצרים</button><button style="flex:1;color:#c0392b" onclick="uiConfirm('למחוק את כל הזיהויים?').then(ok=>{if(ok){P.fxDet=null;window.__fxDetAdd=null;fxDetWinClose();save();render()}})">🗑 נקה</button></div>`;
  const tbl = box.querySelector('[data-tbl]'); if (tbl) tbl.scrollTop = scrollTop;
}
function fxDetSet(id, k, v) { const it = P.fxDet && P.fxDet.items.find(x => x.id === id); if (!it) return; it[k] = k === 'type' ? v : v.trim(); save(); render(); }
function fxDetDel(id) { if (!P.fxDet) return; P.fxDet.items = P.fxDet.items.filter(x => x.id !== id); save(); render(); }
function fxDetSameAs(id) { const it = P.fxDet && P.fxDet.items.find(x => x.id === id); if (!it) return; const m0 = it.model || ''; let n = 0; P.fxDet.items.forEach(x => { if ((x.model || '') === m0 && x !== it) { x.type = it.type; n++; } }); save(); render(); uiToast('≡ ' + n + ' דומים עודכנו'); }
function fxDetLocate(id) { if (!P.fxDet) return; P.fxDet.sel = id; render(); setTimeout(() => { const g = document.querySelector('[data-fxdet="' + id + '"]'); if (g && g.scrollIntoView) g.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }); }, 50); }
function fxDetAddMode() {
  if (window.__fxDetAdd) { window.__fxDetAdd = null; document.body.style.cursor = ''; render(); return; }
  if (!P.fxDet) P.fxDet = { front: sheetIsElevation(), legend: [], positions: [], trusses: [], items: [] };
  const t = (document.getElementById('fxDetT') || {}).value || 'static', m = (document.getElementById('fxDetM') || {}).value || '';
  window.__fxDetAdd = { type: t, model: m.trim() }; document.body.style.cursor = 'crosshair'; render(); fxDetWinOpen(); uiToast('לחץ על התכנית איפה שיש ' + (m || t) + ' — כל לחיצה מוסיפה סימון · Esc לסיום', 6000);
}
/* הסימונים → נתוני ספירה (באותו מבנה של הקורא) → טבלה → הצבה והצעה */
async function fxDetToTable() {
  const D = P.fxDet; if (!D || !(D.items || []).length && !(D.trusses || []).length) { uiToast('אין זיהויים'); return; }
  window.__fxDetAdd = null; document.body.style.cursor = '';
  const L = bgLeft(), T = bgTop(), W = P.bgW || 1400, H = bgHeightPx();
  const fixtures = D.items.filter(it => it.type !== 'truss').map(it => ({ x: (it.x - L) / W, y: (it.y - T) / H, type: it.type, model: it.model || '', pos: it.pos || '', label: it.label || '', _sku: it.sku || undefined }));
  const trusses = (D.trusses || []).slice(); D.items.filter(it => it.type === 'truss').forEach((it, i) => { const nm = it.model || it.pos || ('טראס ' + (i + 1)); if (!trusses.some(t => t.name === nm)) trusses.push({ name: nm, shape: /עגול|circle|Ø/i.test(nm) ? 'circle' : 'straight', length_m: null, diameter_m: null, segments: [] }); });
  const counts = {}; fixtures.forEach(fx => { const k = (fx.model || fx.type).trim(); counts[k] = counts[k] || { model: k, type: fx.type, qty: 0 }; counts[k].qty++; });
  const d = { fixtures, legend: D.legend || [], positions: (D.positions || []).map(p => ({ name: p.name, x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2, height_m: p.height_m })), trusses, counts: Object.values(counts), floor_y: D.floor_y, notes: D.notes || '' };
  P.fxInventory = { at: new Date().toISOString(), view: D.front ? 'front' : 'plan', raw: d };
  const placed = await fxDetCommit(d, !!D.front);
  if (placed) { P.fxDet = null; save(); render(); }
}
/* שלב 2: טבלת ספירה ובחירת מוצרים → הצבה על התכנית (או הצעה בלבד). מחזיר true אם הוצב/אושר */
async function fxDetCommit(d, front) {
  const fixtures = d.fixtures || [], legend = d.legend || [], positions = d.positions || [];
  if (!fixtures.length && !(d.trusses || []).length) { uiToast('אין מה לספור'); return false; }
  const inv = await fxInventoryDlg(d, front);
  if (!inv) { save(); return false; }
  /* כמויות שאושרו בטבלה: משלימים/מורידים כניסות לפי המודל כדי שמה שיוצב יתאים לספירה */
  for (const g of inv.groups) { const have = fixtures.filter(fx => (fx.model || fx.type || '').trim() === g.k); const want = g.qty;
    if (want < have.length) { let n = have.length - want; for (let i = fixtures.length - 1; i >= 0 && n > 0; i--) if ((fixtures[i].model || fixtures[i].type || '').trim() === g.k) { fixtures.splice(i, 1); n--; } }
    else for (let i = have.length; i < want; i++) { const b = have[have.length - 1] || { x: 0.5, y: 0.5, type: 'static' }; fixtures.push({ ...b, x: Math.min(0.98, (+b.x || 0.5) + 0.02 * (i - have.length + 1)), label: '' }); }
    if (g.sku) fixtures.forEach(fx => { if ((fx.model || fx.type || '').trim() === g.k) fx._sku = g.sku; }); }
  if (!inv.place) { fxInventoryToOffer(inv); save(); render(); return true; }
  fxInventoryToOffer(inv, true);
  const L = bgLeft(), T = bgTop(), W = P.bgW || 1400, H = bgHeightPx();
  /* התאמת דגמים — פעם אחת לכל כיתוב, בלי ניחוש */
  const matchOf = {}; const keyOf = fx => (fx.model || fx.type || '').trim();
  for (const fx of fixtures) { const k = keyOf(fx); if (!(k in matchOf)) { const lg = legend.find(l => l.model && fx.model && l.model.toLowerCase() === fx.model.toLowerCase()); matchOf[k] = fx._sku ? fxOf(fx._sku) : fxMatch(fx.model || (lg && lg.model), fx.type === 'other' ? '' : fx.type); } }
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
  return true;
}
