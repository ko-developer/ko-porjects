/* ===== 🎛 פריסטים ל-DSP — דף הגדרות לפרוססור מתוך התכנית והחיווט =====
   לכל פרוססור בארון (DigiSynthetic קודם: DMX208A/L, DMX0808, DS418E/DS458E/DS356, DSK…) נבנה "פריסט": שמות ערוצים (עד 32 תווים —
   המגבלה של DigisynLink3), כניסות ← מקורות, יציאות ← מגבר/ערוץ ← רמקולים ← אזור, מסנני חיתוך מוצעים לפי תחום התדרים שפורסם לרמקול,
   דיליי לפי המרחקים בתכנית (אותו חישוב כמו בעורך החיווט), ניתוב כניסות→יציאות לפי האזורים, ונתוני ההספק ללימיטר.
   מה שאינו מפרט יצרן מסומן "מוצע" — הפריסט הוא נקודת פתיחה למכוון, לא תחליף למדידה.
   DigiSynthetic: קובץ התוכנית (Export/Import to PC ב-DigisynLink3) הוא בפורמט סגור שלא פורסם — הפריסט נשמר כ-JSON של KO + דף להדפסה,
   וההזנה ל-DSP נעשית לפי הדף. כשיתקבל הפורמט/פקודות ה-UDP (פורט 9993) — ממירים מאותו JSON. */
const DSP_STD_HZ = [25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 120, 150, 200, 250, 300, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000];
const DSP_NAME_MAX = 32;
/* תחום התדרים שפורסם ("60Hz–20KHz ± 3dB", "35 - 120 Hz") → [נמוך, גבוה] בהרץ */
function dspFreqRange(f) {
  const out = []; const rx = /(\d+(?:\.\d+)?)\s*(k)?\s*hz?/gi; let m;
  while ((m = rx.exec(String(f || '')))) out.push(Math.round(+m[1] * (m[2] ? 1000 : 1)));
  if (!out.length) { const nums = String(f || '').match(/\d+(?:\.\d+)?/g) || []; nums.slice(0, 2).forEach((x, i) => out.push(Math.round(+x * (i === 1 && +x < 100 ? 1000 : 1)))); }
  return out.length ? [out[0], out[1] || null] : null;
}
const dspStdUp = hz => DSP_STD_HZ.find(x => x >= hz) || Math.round(hz);
const dspIsSub = name => KIT_SUB_RX.test(name || '');
/* הרמקולים שמוזנים מיציאה (כולל שרשור רמקול→רמקול) — על הרשימות של הגיליון, לא רק הגיליון הפתוח */
function dspChain(nodes, cables, rkId, unitId, port) {
  const byId2 = id => nodes.find(n => n.id === id);
  const seen = new Set(), spks = [];
  const frontier = cables.filter(c => c.from === rkId && (c.fromUnit || null) === (unitId || null) && c.pOut === port).map(c => c.to);
  while (frontier.length) {
    const t = frontier.pop(); if (seen.has(t)) continue; seen.add(t);
    const tn = byId2(t); if (!tn || tn.kind !== 'point') continue;
    spks.push(tn);
    cables.forEach(c => { if (c.from === t && !seen.has(c.to)) frontier.push(c.to); if (c.to === t && !seen.has(c.from)) { const f2 = byId2(c.from); if (f2 && f2.kind === 'point') frontier.push(c.from); } });
  }
  return spks;
}
/* כל הפרוססורים בפרויקט (כל התכניות): יחידת כניסות שאינה מגבר */
function dspProcessors() {
  const out = [];
  (P.sheets || []).forEach(sh => (sh.nodes || []).forEach(rk => { if (rk.kind !== 'rack') return;
    (rk.units || []).forEach(u => { if (!isInUnit(u.name) || isAmpUnit(u)) return;
      const ports = rearPortsAuto(rearLayout(u.name) || []);
      const ins = ports.filter(p => /^IN\b/i.test(p.port || '')), outs = ports.filter(p => /^OUT\b/i.test(p.port || ''));
      if (!outs.length) return;
      out.push({ sh, rk, u, ins, outs, digi: DIGI_BRAND_RX.test(u.name || '') }); }); }));
  return out;
}
/* מסנני חיתוך מוצעים לרמקול: סאב — HPF מהגבול התחתון שפורסם (או 30Hz) ו-LPF 80Hz (או הגבול העליון שפורסם אם נמוך יותר);
   טופ עם סאב באזור — HPF 80Hz (או הגבול התחתון אם גבוה יותר); טופ בלי סאב — HPF לפי הגבול התחתון שפורסם; פס של bi-amp — לפי תחום הפס */
function dspXover(spk, band, hasSub) {
  const d = spkData(nodeFullName(spk)) || {};
  const bd = band && d.bd && (d.bd.bi || d.bd.tri) && (d.bd.bi || d.bd.tri)[band];
  const fr = dspFreqRange(bd ? bd.f : d.f);
  const sub = dspIsSub(nodeFullName(spk));
  const r = { hpf: null, lpf: null, type: 'LR 24dB/oct', pub: fr ? (bd ? bd.f : d.f) : '', suggested: true };
  if (bd && fr) { r.hpf = dspStdUp(fr[0]); if (fr[1] && fr[1] < 18000) r.lpf = dspStdUp(fr[1]); return r; }
  if (sub) { r.hpf = dspStdUp(fr ? Math.max(fr[0], 25) : 30); r.lpf = fr && fr[1] && fr[1] < 80 ? dspStdUp(fr[1]) : 80; return r; }
  const lo = fr ? fr[0] : null;
  r.hpf = hasSub ? Math.max(80, lo ? dspStdUp(lo) : 0) : (lo ? dspStdUp(lo) : null);
  if (!lo && !hasSub) r.pub = '';
  return r;
}
/* הפריסט לפרוססור אחד */
function dspPresetBuild(pr) {
  const { sh, rk, u } = pr;
  const nodes = sh.nodes || [], cables = sh.cables || [], zones = sh.zones || [], scale = +sh.scale || 0;
  const byId2 = id => nodes.find(n => n.id === id);
  const zoneOf = n => zones.find(z => nodeInZone(n, z)) || null;
  const cut = s => String(s || '').replace(/\s+/g, ' ').trim().slice(0, DSP_NAME_MAX);
  /* כניסות: מקורות אל הפרוססור */
  const inputs = pr.ins.map(p => ({ ch: p.port, label: p.label || '', name: '', sources: [], net: false, gain: 0, mute: false }));
  cables.forEach(c => {
    if (!((c.to === rk.id && c.toUnit === u.id) || c.logUnit === u.id)) return;
    const src = byId2(c.from);
    /* מקור בתוך הארון בלי יחידה (נגן/מחשב בפאץ׳ פנימי) — השם מההערה של הכבל ("🖥 מחשב / נגן L → DMX0808") */
    const fu = src && src.kind === 'rack' ? (src.units || []).find(x => x.id === c.fromUnit) : null;
    const srcName = src ? (src.kind === 'rack' ? (fu ? modelOf(fu.name) + ' ' + (c.pOut || '') : (String(c.note || '').split(/→|->/)[0].replace(/\s+[LR]$/, '').trim() || src.name)) : nodeFullName(src)) : (c.vsrc || '');
    if (c.srcNet) { let e = inputs.find(x => x.ch === c.srcNet); if (!e) { e = { ch: c.srcNet, label: 'AES67', name: '', sources: [], net: true, gain: 0, mute: false }; inputs.push(e); } e.sources.push(srcName + (c.srcCh ? ' ' + c.srcCh : '')); return; }
    const nums = String(c.logIn || c.pIn || '').match(/\d+/g) || [];
    if (!nums.length) return;
    const chs = c.srcCh === 'LR' && nums.length === 2 ? [['L', +nums[0]], ['R', +nums[1]]] : [[c.srcCh || '', +nums[0]]];
    chs.forEach(([chn, n]) => { const e = inputs.find(x => (x.ch.match(/\d+/) || [])[0] === String(n)); if (e) e.sources.push(srcName + (chn ? ' ' + chn : '')); });
  });
  inputs.forEach(e => { e.name = cut(e.sources[0] || e.label || e.ch); });
  /* יציאות: פרוססור → מגבר/ערוץ → רמקולים */
  const outputs = pr.outs.map(p => ({ ch: p.port, label: p.label || '', name: '', feeds: null, speakers: [], zone: '', zoneId: '', band: '', spkW: 0, ohm: null, ampW: null, hpf: null, lpf: null, xType: '', pub: '', delayMs: null, dist: null, gain: 0, polarity: '+', mute: false, notes: [] }));
  const ampCh = (rkX, amp, inPort) => { const n = +((inPort || '').match(/\d+/) || [0])[0]; if (!n) return null; const outPort = 'OUT ' + n; const spks = dspChain(nodes, cables, rkX.id, amp.id, outPort); return { outPort, n, spks, bridged: !!amp.bridged }; };
  cables.forEach(c => {
    if (c.from !== rk.id || c.fromUnit !== u.id || !/^OUT\b/i.test(c.pOut || '')) return;
    const o = outputs.find(x => x.ch === c.pOut); if (!o) return;
    const to = byId2(c.to);
    if (to && to.kind === 'rack') {
      const amp = (to.units || []).find(x => x.id === c.toUnit); if (!amp) return;
      if (isAmpUnit(amp)) {
        const a = ampCh(to, amp, c.pIn);
        const same = (to.units || []).filter(x => isAmpUnit(x) && modelOf(x.name) === modelOf(amp.name));   /* כמה מגברים מאותו דגם בארון — #1 / #2 לפי הסדר בארון */
        o.feeds = { kind: 'amp', amp: modelOf(amp.name) + (same.length > 1 ? ' #' + (same.indexOf(amp) + 1) : ''), ampFull: amp.name, rack: to.name, ampIn: c.pIn || '', ampOut: a ? a.outPort + (a.bridged ? ' (bridge)' : '') : '' };
        if (a) a.spks.forEach(s => { if (!o.speakers.includes(s)) o.speakers.push(s); });
        if (c.bands && c.bands.length) o.band = c.bands[0].band || ''; else if (/^(HI|MID|LOW)$/i.test(c.pIn || '')) o.band = String(c.pIn).toLowerCase();
      } else o.feeds = { kind: 'unit', amp: modelOf(amp.name), ampFull: amp.name, rack: to.name, ampIn: c.pIn || '', ampOut: '' };
    } else if (to && to.kind === 'point') {   /* רמקול/סאב אקטיבי ישירות מהפרוססור */
      o.feeds = { kind: 'active', amp: '', ampFull: '', rack: '', ampIn: c.pIn || '', ampOut: '' };
      dspChain(nodes, cables, rk.id, u.id, c.pOut).forEach(s => { if (!o.speakers.includes(s)) o.speakers.push(s); });
      if (/^(HI|MID|LOW)$/i.test(c.pIn || '')) o.band = String(c.pIn).toLowerCase();
    }
  });
  /* אזור, הספקים, חיתוך */
  const zoneHasSub = {}; outputs.forEach(o => o.speakers.forEach(s => { const z = zoneOf(s); if (z && dspIsSub(nodeFullName(s))) zoneHasSub[z.id] = true; }));
  outputs.forEach(o => {
    if (!o.speakers.length) { if (o.feeds) o.notes.push('היציאה מחווטת אבל אין רמקולים על ערוץ המגבר'); return; }
    const z = zoneOf(o.speakers[0]); o.zone = z ? z.name : ''; o.zoneId = z ? z.id : '';
    const models = {}; o.speakers.forEach(s => { const m = modelOf(nodeFullName(s)); models[m] = (models[m] || 0) + 1; });
    o.models = Object.entries(models).map(([m, n]) => ({ model: m, n }));
    o.spkW = o.speakers.reduce((s2, n2) => s2 + (spkWatt(o.band ? Object.assign(Object.create(n2), { band: o.band }) : n2) ?? 150), 0);
    const inv = o.speakers.reduce((s2, n2) => s2 + 1 / (spkOhm(o.band ? Object.assign(Object.create(n2), { band: o.band }) : n2) || 8), 0); o.ohm = inv ? Math.round(10 / inv) / 10 : null;
    if (o.feeds && o.feeds.kind === 'amp' && o.ohm) { try { o.ampW = ampChW(o.feeds.ampFull, o.ohm) || null; } catch (e) { o.ampW = null; } }
    const x = dspXover(o.speakers[0], o.band, !!(z && zoneHasSub[z.id] && !dspIsSub(nodeFullName(o.speakers[0]))));
    o.hpf = x.hpf; o.lpf = x.lpf; o.xType = x.type; o.pub = x.pub;
    if (!x.pub) o.notes.push('אין תחום תדרים שפורסם לדגם — ה-HPF לפי כלל אצבע בלבד');
    const sub = dspIsSub(nodeFullName(o.speakers[0]));
    /* שם הערוץ עד 32 תווים: דגם + פס/SUB + כמות; האזור נוסף רק אם נכנס */
    const core = [o.models[0].model, o.band ? o.band.toUpperCase() : (sub && !/sub/i.test(o.models[0].model) ? 'SUB' : ''), o.speakers.length > 1 ? 'x' + o.speakers.length : ''].filter(Boolean).join(' ');
    o.name = o.zone && (o.zone + ' ' + core).length <= DSP_NAME_MAX ? o.zone + ' ' + core : cut(core);
    /* מרחק ממוצע מנקודת הייחוס של האזור (מיקרופון מדידה / עמדת נגינה / במה) — לדיליי */
    const ref = nodes.find(n => n.ptype === 'mic' && n.dlyRef !== false) || (z && nodes.find(n => n.kind === 'point' && /עמדת נגינה|\bDJ\b|במה|stage/i.test(n.name) && nodeInZone(n, z))) || nodes.find(n => n.kind === 'point' && /עמדת נגינה|\bDJ\b|במה|stage/i.test(n.name)) || null;
    o._ref = ref;
    if (ref && scale) o.dist = o.speakers.reduce((s2, n2) => s2 + Math.hypot(n2.x - ref.x, n2.y - ref.y) * scale, 0) / o.speakers.length;
  });
  /* דיליי לכל אזור: מול מקור (במה/DJ) — הקרוב 0 והרחוקים מתעכבים (+15ms Haas כשמוגדר); מול מיקרופון מדידה — הרחוק 0 והקרובים ממתינים */
  const byZone = {}; outputs.forEach(o => { if (o.dist != null && o.zoneId) (byZone[o.zoneId] = byZone[o.zoneId] || []).push(o); });
  Object.values(byZone).forEach(list => {
    const ref = list[0]._ref, mode = store.dlyMode || (ref ? 'haas' : 'geo'); if (mode === 'off') return;
    const ds = list.map(o => o.dist);
    if (ref && ref.ptype === 'mic') { const far = Math.max(...ds); list.forEach(o => { const ms = (far - o.dist) * SND_MS_M; o.delayMs = ms < 0.5 ? 0 : +ms.toFixed(1); }); }
    else { const base = Math.min(...ds); list.forEach(o => { const ms = (o.dist - base) * SND_MS_M; o.delayMs = ms < 0.5 ? 0 : +(ms + (mode === 'haas' ? 15 : 0)).toFixed(1); }); }
  });
  outputs.forEach(o => { delete o._ref; });
  /* ניתוב מוצע כניסה→יציאה: מקור שנמצא בתוך אזור → היציאות של אותו אזור; מקור כללי (מיקסר/מחשב/בלי אזור) → כל היציאות */
  const matrix = [];
  inputs.forEach(i => {
    const srcNode = nodes.find(n => n.kind === 'point' && i.sources.some(s => s.startsWith(nodeFullName(n))));
    const sz = srcNode ? zoneOf(srcNode) : null;
    outputs.forEach(o => { if (!o.speakers.length) return; matrix.push({ in: i.ch, out: o.ch, on: !sz || sz.id === o.zoneId }); });
  });
  const unknownIO = pr.ins.length === 0 || !rearVerified(u.name);
  return {
    app: 'ko-projects', kind: 'dsp-preset', v: 1, at: new Date().toISOString(), project: P.name, projectId: P.id, sheet: sh.name,
    processor: { model: modelOf(u.name), name: u.name, key: u.key || '', unitId: u.id, rack: rk.name, rackId: rk.id, digisynthetic: pr.digi, portsVerified: !unknownIO },
    program: { name: cut(P.name), slot: 1, nameMax: DSP_NAME_MAX, slots: 20 },
    inputs: inputs.map(({ ch, label, name, sources, net, gain, mute }) => ({ ch, label, name, sources, net, gain, mute })),
    outputs: outputs.map(o => ({ ch: o.ch, label: o.label, name: o.name, feeds: o.feeds, zone: o.zone, band: o.band, speakers: (o.models || []).map(m => ({ model: m.model, n: m.n })), hpf: o.hpf != null ? { hz: o.hpf, type: o.xType, suggested: true } : null, lpf: o.lpf != null ? { hz: o.lpf, type: o.xType, suggested: true } : null, published: o.pub, delayMs: o.delayMs, distM: o.dist != null ? +o.dist.toFixed(1) : null, gain: o.gain, polarity: o.polarity, mute: o.mute, limiter: { speakersW: o.spkW || null, loadOhm: o.ohm, ampChannelW: o.ampW, threshold: null, note: 'סף הלימיטר נקבע בכיוון לפי הגבר המגבר ורגישות הכניסה — אין נתון יצרן' }, notes: o.notes })),
    matrix,
    notes: [
      'HPF/LPF — הצעה מתחום התדרים שפורסם לרמקול (LR 24dB/oct ברירת מחדל מקובלת); לאימות מול דף הנתונים ובמדידה.',
      'דיליי — לפי המרחקים בתכנית מנקודת הייחוס (מיקרופון מדידה / עמדת נגינה / במה), ' + (store.dlyMode === 'off' ? 'מצב דיליי כבוי' : store.dlyMode === 'geo' ? 'יישור גיאומטרי' : 'יישור + 15ms (Haas) כשיש מקור') + '.',
      'שמות ערוצים ותוכנית — עד ' + DSP_NAME_MAX + ' תווים (DigisynLink3).',
      pr.digi ? 'DigiSynthetic: Export/Import to PC ב-DigisynLink3 הוא פורמט סגור — הפריסט מוזן ידנית לפי הדף; פקודות UDP (פורט 9993) מתועדות רק ל-setCfg.' : '',
    ].filter(Boolean),
  };
}
/* ===== ממשק ===== */
let DSP_UI = { i: 0 };
function dspPresetDialog(idx) {
  const procs = dspProcessors();
  if (!procs.length) { uiToast('אין פרוססור בארונות של הפרויקט — הוסף פרוססור (למשל DigiSynthetic DMX208A) לארון וחווט אותו'); return; }
  DSP_UI.i = Math.min(idx || 0, procs.length - 1);
  const pr = procs[DSP_UI.i], ps = dspPresetBuild(pr);
  DSP_UI.last = ps;
  const old = document.getElementById('dspOv'); if (old) old.remove();
  const fmtHz = v => v == null ? '—' : v >= 1000 ? (v / 1000) + 'k' : v;
  const feedTxt = o => !o.feeds ? '<span class="muted">לא מחווט</span>' : o.feeds.kind === 'active' ? 'ישירות (אקטיבי)' : esc(o.feeds.amp) + (o.feeds.ampIn ? ' ' + esc(o.feeds.ampIn) : '') + (o.feeds.ampOut ? ' → ' + esc(o.feeds.ampOut) : '');
  const spkTxt = o => o.speakers.length ? o.speakers.map(m => esc(m.model) + (m.n > 1 ? ' ×' + m.n : '')).join(', ') : '<span class="muted">—</span>';
  const appr = typeof pmErpOf === 'function' ? pmErpOf(P) : null;
  const apprTxt = appr && appr.approved ? `<span style="color:#0f6e56;font-weight:700">✅ ההצעה אושרה ב-ERP · ${esc(appr.approved.code)} · ${typeof pmFmtD === 'function' ? pmFmtD(appr.approved.confirmedAt || appr.approved.date) : ''}</span>`
    : appr ? `<span style="color:#c96a13">⏳ ההצעה ${esc(appr.last.code)} טרם אושרה ב-ERP — אפשר להכין את הפריסט כבר עכשיו</span>`
    : (typeof PM_ERP !== 'undefined' && PM_ERP) ? '<span class="muted">אין הצעה ב-ERP שמקושרת לפרויקט</span>' : '<span class="muted">סטטוס ההצעה ב-ERP נטען…</span>';
  const ov = uiModal(`<div id="dspBox">
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><b style="font-size:15px">🎛 פריסט ל-DSP — ${esc(ps.processor.model)}</b><span class="muted" style="font-size:11.5px">${esc(ps.processor.rack)} · ${esc(ps.sheet)}</span><span style="flex:1"></span>${procs.length > 1 ? `<select onchange="dspPresetDialog(+this.value)" style="font-size:12px">${procs.map((p, i) => `<option value="${i}" ${i === DSP_UI.i ? 'selected' : ''}>${esc(modelOf(p.u.name))} · ${esc(p.rk.name)}</option>`).join('')}</select>` : ''}</div>
    <div style="font-size:12px;margin:6px 0 8px">${apprTxt}${ps.processor.portsVerified ? '' : ' · <span style="color:#c1121f">⚠ פריסת הגב של הפרוססור לא אומתה — מספרי הערוצים לפי הנחה</span>'}</div>
    <div style="font-size:11.5px;color:#555;margin-bottom:6px">תוכנית: <b>${esc(ps.program.name)}</b> (משבצת ${ps.program.slot} מתוך ${ps.program.slots}) · שמות עד ${DSP_NAME_MAX} תווים</div>
    <b style="font-size:12.5px">כניסות</b>
    <table class="cablelist" style="margin:4px 0 10px"><tr><th>ערוץ</th><th>שם בפרוססור</th><th>מקור</th><th>Gain</th></tr>
      ${ps.inputs.map(i => `<tr><td>${esc(i.ch)}${i.label && i.label !== i.ch ? ' <small class="muted">' + esc(i.label) + '</small>' : ''}</td><td><b>${esc(i.name)}</b></td><td>${i.sources.length ? esc(i.sources.join(', ')) : '<span class="muted">לא מחווט</span>'}</td><td>${i.gain} dB</td></tr>`).join('') || '<tr><td colspan="4" class="muted">אין כניסות בפריסת הגב</td></tr>'}
    </table>
    <b style="font-size:12.5px">יציאות</b>
    <table class="cablelist" style="margin:4px 0 10px"><tr><th>ערוץ</th><th>שם בפרוססור</th><th>מזין</th><th>רמקולים</th><th>אזור</th><th>HPF</th><th>LPF</th><th>דיליי</th><th>עומס</th><th>לימיטר</th></tr>
      ${ps.outputs.map(o => `<tr><td>${esc(o.ch)}</td><td><b>${esc(o.name || '—')}</b>${o.band ? ' <small style="background:#eef;border-radius:5px;padding:0 5px">' + esc(o.band.toUpperCase()) + '</small>' : ''}</td><td>${feedTxt(o)}</td><td>${spkTxt(o)}</td><td>${esc(o.zone || '—')}</td>
        <td title="${esc(o.published ? 'תחום שפורסם: ' + o.published : '')}">${o.hpf ? fmtHz(o.hpf.hz) + ' <small class="muted">' + esc(o.hpf.type) + '</small>' : '—'}</td><td>${o.lpf ? fmtHz(o.lpf.hz) + ' <small class="muted">' + esc(o.lpf.type) + '</small>' : '—'}</td>
        <td>${o.delayMs != null ? o.delayMs + ' ms' + (o.distM != null ? ' <small class="muted">(' + o.distM + ' מ׳)</small>' : '') : '—'}</td>
        <td>${o.limiter.loadOhm ? o.limiter.loadOhm + 'Ω · ' + o.limiter.speakersW + 'W' + (o.limiter.ampChannelW ? ' / מגבר ' + o.limiter.ampChannelW + 'W' : '') : '—'}</td>
        <td class="muted" style="font-size:10.5px">${o.speakers.length ? 'לפי הגבר המגבר' : '—'}${o.notes.length ? '<br><span style="color:#c96a13">' + o.notes.map(esc).join('<br>') + '</span>' : ''}</td></tr>`).join('')}
    </table>
    <b style="font-size:12.5px">ניתוב כניסות → יציאות (מוצע)</b>
    <table class="cablelist" style="margin:4px 0 10px;font-size:11px"><tr><th></th>${ps.outputs.filter(o => o.speakers.length).map(o => `<th>${esc(o.ch)}<br><small>${esc(o.zone || '')}</small></th>`).join('')}</tr>
      ${ps.inputs.map(i => `<tr><td><b>${esc(i.ch)}</b> <small class="muted">${esc(i.name)}</small></td>${ps.outputs.filter(o => o.speakers.length).map(o => { const m = ps.matrix.find(x => x.in === i.ch && x.out === o.ch); return `<td style="text-align:center;${m && m.on ? 'background:#dbeafe;font-weight:700' : ''}">${m && m.on ? '●' : ''}</td>`; }).join('')}</tr>`).join('')}
    </table>
    <div class="muted" style="font-size:11px;line-height:1.6">${ps.notes.map(n => '• ' + esc(n)).join('<br>')}</div>
    <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">
      <button class="primary" onclick="dspPresetDownload()" style="flex:1;min-width:140px">⬇ הורד JSON</button>
      <button onclick="dspPresetPrint()" style="flex:1;min-width:120px">🖨 הדפס דף פריסט</button>
      <button onclick="dspPresetCopy()" style="flex:1;min-width:120px">📋 העתק טבלה</button>
      <button onclick="dspPresetSave()" style="flex:1;min-width:120px">💾 שמור בפרויקט</button>
      <button onclick="document.getElementById('dspOv').remove()">סגור</button>
    </div></div>`);
  ov.id = 'dspOv';
  const box = ov.querySelector('div'); if (box) { box.style.maxWidth = '1100px'; box.style.width = '96%'; }
  if (!appr && typeof pmLoadErp === 'function' && (typeof PM_ERP === 'undefined' || !PM_ERP)) pmLoadErp().then(() => { if (document.getElementById('dspOv')) dspPresetDialog(DSP_UI.i); });
}
function dspPresetDownload() {
  const ps = DSP_UI.last; if (!ps) return;
  const blob = new Blob([JSON.stringify(ps, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'ko-dsp-preset-' + String(ps.project).replace(/[^\w֐-׿-]+/g, '_').slice(0, 40) + '-' + String(ps.processor.model).replace(/[^\w-]+/g, '_') + '.json'; a.click();
}
function dspPresetCopy() {
  const ps = DSP_UI.last; if (!ps) return;
  const rows = [['ערוץ', 'שם', 'מזין', 'רמקולים', 'אזור', 'HPF', 'LPF', 'דיליי ms', 'עומס Ω', 'רמקולים W', 'מגבר W']];
  ps.inputs.forEach(i => rows.push([i.ch, i.name, i.sources.join(' / '), '', '', '', '', '', '', '', '']));
  ps.outputs.forEach(o => rows.push([o.ch, o.name, o.feeds ? (o.feeds.amp + ' ' + o.feeds.ampIn).trim() : '', o.speakers.map(m => m.model + (m.n > 1 ? ' x' + m.n : '')).join(' / '), o.zone, o.hpf ? o.hpf.hz : '', o.lpf ? o.lpf.hz : '', o.delayMs ?? '', o.limiter.loadOhm ?? '', o.limiter.speakersW ?? '', o.limiter.ampChannelW ?? '']));
  navigator.clipboard.writeText(rows.map(r => r.join('\t')).join('\n')).then(() => uiToast('📋 הטבלה הועתקה (טאבים — להדבקה באקסל)'));
}
function dspPresetSave() {
  const ps = DSP_UI.last; if (!ps) return;
  P.dspPresets = P.dspPresets || {}; P.dspPresets[ps.processor.unitId] = ps; P.upd = Date.now(); save();
  uiToast('💾 הפריסט נשמר בפרויקט (' + ps.processor.model + ')');
}
function dspPresetPrint() {
  const box = document.getElementById('dspBox'); if (!box) return;
  const w = window.open('', '_blank'); if (!w) { uiToast('הדפדפן חסם חלון — אפשר הדפסה מחלון קופץ'); return; }
  w.document.write('<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8"><title>פריסט DSP — ' + esc(P.name) + '</title><style>body{font-family:system-ui,Arial;padding:18px;color:#222;font-size:12px}table{border-collapse:collapse;width:100%;margin:6px 0 12px}th,td{border:1px solid #ccc;padding:3px 6px;text-align:right;font-size:11px}th{background:#f1efe9}button,select{display:none}.muted{color:#777}</style></head><body><h2 style="margin:0 0 4px">KO Projects · פריסט DSP — ' + esc(P.name) + '</h2>' + box.innerHTML + '</body></html>');
  w.document.close(); setTimeout(() => { try { w.print(); } catch (e) {} }, 400);
}
/* אחרי טעינת הפרויקט: ההצעה אושרה ב-ERP + יש פרוססור + עוד לא נשמר פריסט → תזכורת פעם אחת לפרויקט */
function dspApprovalNudge() {
  try {
    if (!P || typeof pmErpOf !== 'function' || !PM_ERP) return;
    const e = pmErpOf(P); if (!e || !e.approved) return;
    const procs = dspProcessors(); if (!procs.length) return;
    if (P.dspPresets && procs.every(p => P.dspPresets[p.u.id])) return;
    window.__dspNudged = window.__dspNudged || new Set(); if (window.__dspNudged.has(P.id)) return; window.__dspNudged.add(P.id);
    uiToast('✅ ההצעה אושרה ב-ERP — אפשר ליצור את הפריסטים ל-DSP: פעולות ← 🎛 פריסטים ל-DSP');
  } catch (e) {}
}
window.dspPresetDialog = dspPresetDialog; window.dspPresetDownload = dspPresetDownload; window.dspPresetCopy = dspPresetCopy; window.dspPresetSave = dspPresetSave; window.dspPresetPrint = dspPresetPrint; window.dspApprovalNudge = dspApprovalNudge;
