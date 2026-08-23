
const CATS = {
  amp:    { n: 'מגבר',        c: '#0f6e56' },
  patch:  { n: 'ניתוב/פאנל',  c: '#534ab7' },
  net:    { n: 'רשת',         c: '#185fa5' },
  video:  { n: 'וידאו',       c: '#993c1d' },
  light:  { n: 'תאורה',       c: '#854f0b' },
  audio:  { n: 'אודיו',       c: '#3b6d11' },
  other:  { n: 'אחר',         c: '#5f5e5a' },
};
const CTYPES = {
  xlr:   { n: 'XLR בודד',    c: '#c2185b' },
  multi: { n: 'מולטי XLR',   c: '#d32f2f' },
  nl4:   { n: 'NL4 רמקול',   c: '#e65100' },
  cat:   { n: 'Cat6 רשת',    c: '#6a4fc9' },
  fiber: { n: 'אופטי',       c: '#0f8a6d' },
  dmx:   { n: 'DMX',         c: '#b8860b' },
  sdi:   { n: 'SDI/וידאו',   c: '#2e7d32' },
  pwr:   { n: 'חשמל',        c: '#616161' },
};
const UPX = 15;
const LSKEY = 'installPlanner_v1';
/*__DATA:ERP_ITEMS__*/

/*__DATA:ERP_PRICES__*/

/*__DATA:ERP_KITS__*/

/*__DATA:ERP_CATALOG__*/
/*__DATA:ERP_IMAGES__*/
/*__DATA:ERP_SOLD__*/

const CONNS = {
  xlrf:    { n: 'XLR נקבה', c: '#5f5e5a' },
  xlrm:    { n: 'XLR זכר',  c: '#5f5e5a', fill: 1 },
  speakon: { n: 'ספיקון NL4', c: '#e65100' },
  bnc:     { n: 'BNC/SDI', c: '#2e7d32' },
  rj45:    { n: 'RJ45 רשת', c: '#6a4fc9', sq: 1 },
  hdmi:    { n: 'HDMI', c: '#185fa5', sq: 1 },
  fiber:   { n: 'אופטי', c: '#0f8a6d' },
  pwr:     { n: 'חשמל', c: '#a32222', sq: 1 },
  rca:     { n: 'RCA', c: '#c98a2e' },
  empty:   { n: 'ריק', c: '#bbbbbb' },
};
/* סאב מוגבר (אקטיבי) — מקבל כבל סיגנל (RCA/XLR), לא קו רמקול */
const isActiveSub = s => /סאב|sub|וופר/i.test(s || '') && /מוגבר|אקטיבי|active|powered/i.test(s || '');
const defPanel = (count = 16, rows = 2, conn = 'xlrf') =>
  ({ mode: 'matrix', rows, holes: Array.from({ length: count }, () => ({ conn })) });
const pCols = p => Math.ceil(p.holes.length / Math.max(1, p.rows || 1));

function seedBH() {
  return {
    id: 'p1', name: 'פרויקט דוגמה — בית החייל ת"א',
    nodes: [
      { id:'n1', kind:'rack', name:'ארון מגברים', sub:'במה — חדש', x:120, y:90, ru:16, units:[
        { id:'u11', name:'פאנל 4×Cat6 + SDI', u:1, cat:'patch', pos:0 },
        { id:'u12', name:'ראוטר Aruba', u:1, cat:'net', pos:1 },
        { id:'u13', name:'הנגשת שמע Bettear', u:1, cat:'audio', pos:2 },
        { id:'u14', name:'פאנל ניתוב XLR OUT 1-16', u:1, cat:'patch', pos:3 },
        { id:'u15', name:'פאנל ניתוב XLR IN 1-32', u:2, cat:'patch', pos:4 },
        { id:'u16', name:'K&F IPX 15:4 (1)', u:2, cat:'amp', pos:7 },
        { id:'u17', name:'K&F IPX 15:4 (2)', u:2, cat:'amp', pos:9 },
        { id:'u18', name:'K&F IPX 10:4', u:2, cat:'amp', pos:11 },
      ]},
      { id:'n2', kind:'rack', name:'ארון קונטרול', sub:'קיים — שינויים', x:640, y:90, ru:16, units:[
        { id:'u21', name:'ניתוב HD/SDI למקרנים', u:2, cat:'video', pos:0 },
        { id:'u22', name:'ספליטרים DMX', u:1, cat:'light', pos:3 },
      ]},
      { id:'n3', kind:'rack', name:'ארון מסד במה', sub:'חדש', x:1130, y:90, ru:8, units:[
        { id:'u31', name:'פאנל 4 קווים אופטיים', u:1, cat:'net', pos:0 },
        { id:'u32', name:'פאנל DMX ×4', u:1, cat:'light', pos:1 },
        { id:'u33', name:'פאנל עיוור', u:1, cat:'other', pos:2 },
      ]},
      { id:'n4', kind:'panel', name:'קופסאת מולטי', sub:'במה', x:120, y:520, panel:{ mode:'matrix', rows:4, holes:[
        ...Array.from({length:16},()=>({conn:'xlrf'})),
        ...Array.from({length:8},()=>({conn:'xlrm'})),
        {conn:'bnc'},{conn:'rj45'},{conn:'rj45'},{conn:'rj45'},
        {conn:'empty'},{conn:'empty'},{conn:'empty'},{conn:'empty'} ] } },
      { id:'n5', kind:'point', name:'SPECTRA שמאל', sub:'צמוד לקיר', x:420, y:470 },
      { id:'n6', kind:'point', name:'SPECTRA ימין', sub:'צמוד לקיר', x:420, y:580 },
      { id:'n7', kind:'point', name:'3× NOMOS שמאל', sub:'מאחורי הספקטרה', x:640, y:470 },
      { id:'n8', kind:'point', name:'3× NOMOS ימין', sub:'מאחורי הספקטרה', x:640, y:580 },
      { id:'n9', kind:'point', name:'פרונט פילים CA 106', sub:'שרשור לאורך הבמה', x:860, y:470 },
      { id:'n10', kind:'point', name:'GRAVIS מרכז', sub:'בקו הספקטרות', x:860, y:580 },
      { id:'n11', kind:'point', name:'מקרנים', sub:'', x:1130, y:470 },
      { id:'n12', kind:'point', name:'תאורת אולם', sub:'', x:1130, y:580 },
    ],
    cables: [
      { id:'c1', from:'n4', to:'n1', toUnit:'u15', type:'multi', qty:'1', spec:'מולטי 24 ערוצים', note:'במה ← פאנל ניתוב IN', dir:'both' },
      { id:'c2', from:'n1', fromUnit:'u14', to:'n2', type:'multi', qty:'1', spec:'המשך מולטי', note:'פאנל OUT ← קונטרול', dir:'both' },
      { id:'c3', from:'n2', to:'n1', toUnit:'u11', type:'cat', qty:'4', spec:'Cat6 + 1×SDI', note:'לפאנל בארון המגברים' },
      { id:'c4', from:'n2', to:'n3', toUnit:'u31', type:'fiber', qty:'4', spec:'אופטי', note:'' },
      { id:'c5', from:'n2', to:'n3', toUnit:'u32', type:'dmx', qty:'4', spec:'DMX חדשים', note:'חיבור בתוך הארון' },
      { id:'c6', from:'n1', fromUnit:'u16', to:'n5', type:'nl4', qty:'1', spec:'4×4 ממ״ר', note:'' },
      { id:'c7', from:'n1', fromUnit:'u16', to:'n6', type:'nl4', qty:'1', spec:'4×4 ממ״ר', note:'' },
      { id:'c8', from:'n1', fromUnit:'u18', to:'n7', type:'nl4', qty:'1', spec:'2×4 ממ״ר', note:'' },
      { id:'c9', from:'n1', fromUnit:'u18', to:'n8', type:'nl4', qty:'1', spec:'2×4 ממ״ר', note:'' },
      { id:'c10', from:'n1', fromUnit:'u17', to:'n9', type:'nl4', qty:'1', spec:'2×2.5 ממ״ר · שרשור', note:'' },
      { id:'c11', from:'n1', fromUnit:'u18', to:'n10', type:'nl4', qty:'1', spec:'2×2.5 ממ״ר', note:'' },
      { id:'c12', from:'n2', fromUnit:'u21', to:'n11', type:'sdi', qty:'1', spec:'HD-SDI', note:'' },
      { id:'c13', from:'n2', fromUnit:'u22', to:'n12', type:'dmx', qty:'1', spec:'' , note:'' },
    ],
  };
}

let store = load();
let P = store.projects.find(p => p.id === store.cur) || store.projects[0];
let sel = null, selCable = null, ui = { tab: 'node' }, drag = null, cnt = 1000;
let marq = null; const selMulti = new Set();
normalizeAll();

/* ===== מצב שרת (dev) — DB אמיתי ב-data/projects.sqlite =====
   כשהשרת רץ (localhost) ה-store נטען מ-/api/store ונשמר אליו אוטומטית;
   בפריסה סטטית (Netlify) ה-fetch נכשל וממשיכים עם localStorage כרגיל. */
let SRV = false, srvT = null;
(async () => {
  try {
    const r = await fetch('/api/store', { cache: 'no-store' });
    if (!r.ok) return;
    const s = await r.json();
    SRV = true;
    if (s && Array.isArray(s.projects) && s.projects.length) {
      store = s;
      P = store.projects.find(p => p.id === store.cur) || store.projects[0];
      sel = null; selCable = null; selMulti.clear(); normalizeAll();
      if (typeof impItems !== 'undefined') impItems = P.impSaved || [];
      try { localStorage.setItem(LSKEY, JSON.stringify(store)); } catch (e) {}
      render();
    } else {
      pushSrv(); // DB ריק — זרע אותו ממה שיש בדפדפן
    }
  } catch (e) {}
})();
function pushSrv() {
  if (!SRV) return;
  clearTimeout(srvT);
  srvT = setTimeout(() => {
    fetch('/api/store', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(store) }).catch(() => {});
  }, 800);
}

function load() {
  try {
    const raw = localStorage.getItem(LSKEY);
    if (raw) { const s = JSON.parse(raw); if (s.projects && s.projects.length) return s; }
  } catch (e) {}
  return { cur: 'p1', projects: [seedBH()] };
}
/* ===== היסטוריה — חזרה אחורה/קדימה =====
   כל save() מצלם את מצב הפרויקט. הצילום נדחה ב-tick כדי ששינוי אחד
   (שלעתים קורא ל-save כמה פעמים) ייחשב כצעד אחד בהיסטוריה. */
const HIST = { past: [], future: [], busy: false, t: null };
const HIST_MAX = 60;
function snapProject() { return JSON.stringify({ nodes: P.nodes, cables: P.cables, zones: P.zones, imp: typeof impItems !== 'undefined' ? impItems : [] }); }
function pushHistory() {
  if (HIST.busy) return;
  clearTimeout(HIST.t);
  HIST.t = setTimeout(() => {
    const s = snapProject();
    if (HIST.past.length && HIST.past[HIST.past.length - 1] === s) return;
    HIST.past.push(s);
    if (HIST.past.length > HIST_MAX) HIST.past.shift();
    HIST.future.length = 0;
    renderHistBtns();
  }, 260);
}
function applySnap(s) {
  const d = JSON.parse(s);
  P.nodes = d.nodes; P.cables = d.cables; P.zones = d.zones;
  if (typeof impItems !== 'undefined') impItems = d.imp || [];
  sel = null; selCable = null; selZone = null; selMulti.clear();
  HIST.busy = true;
  render(); save();
  HIST.busy = false;
  renderHistBtns();
}
function undo() {
  if (HIST.past.length < 2) return;
  HIST.future.push(HIST.past.pop());
  applySnap(HIST.past[HIST.past.length - 1]);
}
function redo() {
  if (!HIST.future.length) return;
  const s = HIST.future.pop();
  HIST.past.push(s);
  applySnap(s);
}
function renderHistBtns() {
  const u = document.getElementById('btnUndo'), r = document.getElementById('btnRedo');
  if (u) { u.disabled = HIST.past.length < 2; u.style.opacity = u.disabled ? .35 : 1; }
  if (r) { r.disabled = !HIST.future.length; r.style.opacity = r.disabled ? .35 : 1; }
}
function save() {
  store.cur = P.id;
  if (typeof impItems !== 'undefined') P.impSaved = impItems;
  verSnapshot();
  try { localStorage.setItem(LSKEY, JSON.stringify(store)); } catch (e) {}
  pushSrv();
  pushHistory();
}
/* ===================================================================================
   🕘 היסטוריית גרסאות — כל שמירה משמעותית שומרת snapshot של הפרויקט (עד 30 גרסאות),
   כך שאפשר לחזור אחורה מכל טעות: מחיקה, בנייה מחדש, או שינוי שלא רצית. */
const VER_MAX = 30, VER_MIN_GAP = 45e3; /* גרסה חדשה לכל היותר כל 45 שניות */
function verSnapshot(force) {
  try {
    if (!P || !P.id) return;
    P.vers = P.vers || [];
    const now = Date.now();
    const last = P.vers[P.vers.length - 1];
    const stat = { n: (P.nodes || []).length, c: (P.cables || []).length, i: (typeof impItems !== 'undefined' ? impItems.length : 0), z: (P.zones || []).length };
    const sameShape = last && last.stat.n === stat.n && last.stat.c === stat.c && last.stat.i === stat.i && last.stat.z === stat.z;
    if (!force && last && (sameShape || now - last.t < VER_MIN_GAP)) return;
    /* התמונה עצמה (base64) לא משוכפלת — גרסה שומרת רק את התוכן שמשתנה */
    const { vers, bg, impSaved, ...rest } = P;
    const snap = JSON.parse(JSON.stringify({ ...rest, impSaved: (typeof impItems !== 'undefined' ? impItems : []) }));
    P.vers.push({ t: now, stat, d: snap });
    while (P.vers.length > VER_MAX) P.vers.shift();
  } catch (e) {}
}
function verTime(t) {
  const d = new Date(t), n = Date.now();
  const mins = Math.round((n - t) / 60000);
  const rel = mins < 1 ? 'עכשיו' : mins < 60 ? 'לפני ' + mins + ' דק׳' : mins < 1440 ? 'לפני ' + Math.round(mins / 60) + ' שע׳' : 'לפני ' + Math.round(mins / 1440) + ' ימים';
  return rel + ' · ' + d.toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function verManager() {
  verSnapshot(true);
  const vs = (P.vers || []).slice().reverse();
  const ov = uiModal(`
    <b style="font-size:14px">🕘 היסטוריית גרסאות — ${esc(P.name.slice(0, 26))}</b>
    <p class="muted" style="font-size:10.5px;margin:4px 0">כל שינוי משמעותי נשמר אוטומטית (עד ${VER_MAX} גרסאות). שחזור יוצר קודם גיבוי של המצב הנוכחי — אפשר תמיד לחזור.</p>
    <div style="max-height:52vh;overflow-y:auto;margin:6px 0">
      ${vs.length ? vs.map((v, i) => `<div style="display:flex;gap:8px;align-items:center;border:1px solid #eee;border-radius:9px;padding:6px 8px;margin-bottom:4px;background:${i === 0 ? '#eef7f1' : '#faf8f4'}">
        <span style="flex:1;font-size:11.5px">${i === 0 ? '<b>המצב הנוכחי</b> · ' : ''}${esc(verTime(v.t))}<br>
          <span class="muted" style="font-size:10.5px">${v.stat.n} מוקדים · ${v.stat.c} כבלים · ${v.stat.i} פריטים · ${v.stat.z} אזורים</span></span>
        ${i === 0 ? '' : `<button style="white-space:nowrap;font-size:11.5px;background:#0f6e56;color:#fff;border:none;border-radius:7px;padding:5px 9px;cursor:pointer" onclick="verRestore(${(P.vers || []).length - 1 - i})">↩ שחזר גרסה זו</button>`}
      </div>`).join('') : '<p class="hint">אין עדיין גרסאות שמורות</p>'}
    </div>
    <button data-close style="width:100%;padding:8px;border-radius:9px;border:1px solid #ddd;background:#fff;cursor:pointer">סגור</button>`);
  ov.querySelector('[data-close]').onclick = () => ov.remove();
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
}
async function verRestore(idx) {
  const v = (P.vers || [])[idx]; if (!v) return;
  if (!(await uiConfirm('לשחזר את הגרסה מ' + verTime(v.t) + '?\n' + v.stat.n + ' מוקדים · ' + v.stat.c + ' כבלים · ' + v.stat.i + ' פריטים\n\nהמצב הנוכחי יישמר כגרסה, כך שאפשר לחזור אליו.'))) return;
  verSnapshot(true);
  const keep = { id: P.id, name: P.name, bg: P.bg, bgW: P.bgW, bgOp: P.bgOp, vers: P.vers };
  const d = JSON.parse(JSON.stringify(v.d));
  Object.keys(P).forEach(k => { if (!(k in keep)) delete P[k]; });
  Object.assign(P, d, keep);
  if (typeof impItems !== 'undefined') { impItems.length = 0; impItems.push(...(d.impSaved || [])); }
  document.querySelectorAll('.uiDlgOv').forEach(x => x.remove());
  render(); save();
  uiToast('↩ שוחזרה הגרסה מ' + verTime(v.t) + ' — המצב הקודם נשמר בהיסטוריה');
}
function normalizeAll() {
  for (const pr of store.projects) { ensureStock(pr); pr.route = pr.route || 'ortho'; }
  for (const pr of store.projects)
    for (const n of pr.nodes || [])
      if (n.kind === 'rack') {
        let next = 0;
        for (const u of n.units) {
          if (typeof u.pos !== 'number') { u.pos = next; }
          if (!u.id) u.id = uid('u');
          if (u.panel) normPanel(u.panel);
          next = Math.max(next, u.pos + u.u);
        }
      } else if (n.kind === 'panel' && n.panel) normPanel(n.panel);
}
function ensureStock(pr) {
  pr.stock = pr.stock || {};
  pr.stock.cables = pr.stock.cables || [];
  pr.stock.reels = pr.stock.reels || [];
  pr.stock.conns = pr.stock.conns || [];
}
function normPanel(p) {
  if (!p.rows) p.rows = p.cols ? Math.max(1, Math.ceil(p.holes.length / p.cols)) : 2;
  delete p.cols;
}
function unitOf(nodeId, unitId) {
  const n = byId(nodeId);
  return n && n.kind === 'rack' && unitId ? n.units.find(u => u.id === unitId) : null;
}
function endName(nodeId, unitId) {
  const n = byId(nodeId);
  if (!n) return '?';
  const u = unitOf(nodeId, unitId);
  return esc(n.name) + (u ? ' · <b>' + esc(u.name) + '</b>' : '');
}
function unitOpts(nodeId, selId) {
  const n = byId(nodeId);
  let h = '<option value="">— הארון עצמו —</option>';
  if (n && n.kind === 'rack')
    h += n.units.map(u => `<option value="${u.id}" ${u.id === selId ? 'selected' : ''}>${esc(u.name)}</option>`).join('');
  return h;
}
function uid(pre) { return pre + Date.now().toString(36) + (++cnt); }

function newProj() { const p = { id: uid('p'), name: 'פרויקט חדש', nodes: [], cables: [], route: 'ortho' }; ensureStock(p); store.projects.push(p); P = p; sel = selCable = null; impItems = []; render(); }
function dupProj() { const p = JSON.parse(JSON.stringify(P)); p.id = uid('p'); p.name = P.name + ' (עותק)'; store.projects.push(p); P = p; sel = selCable = null; render(); }
async function delProj() {
  if (store.projects.length === 1) { alert('חייב להישאר לפחות פרויקט אחד'); return; }
  if (!(await uiConfirm('למחוק את הפרויקט "' + P.name + '"?'))) return;
  store.projects = store.projects.filter(p => p.id !== P.id);
  P = store.projects[0]; sel = selCable = null; impItems = P.impSaved || []; render();
}
function switchProj(id) { P = store.projects.find(p => p.id === id) || P; sel = selCable = null; impItems = P.impSaved || []; render(); }
/* ===== מנהל פרויקטים — חיפוש, לקוח, בחירה מרובה ומחיקה ===== */
function projManager() {
  const old = document.getElementById('pmOv'); if (old) old.remove();
  const ov = document.createElement('div');
  ov.id = 'pmOv';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(20,24,32,.5);z-index:98;display:flex;align-items:center;justify-content:center';
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  ov.innerHTML = `<div style="background:#fff;border-radius:12px;padding:16px;max-width:600px;width:94%;max-height:86vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,.35)">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><b style="flex:1">🗂 ניהול פרויקטים (${store.projects.length})</b><button onclick="document.getElementById('pmOv').remove()">✕</button></div>
    <input id="pmQ" placeholder="🔍 חיפוש לפי שם פרויקט / לקוח / מספר לקוח…" style="width:100%" oninput="pmRender(this.value)">
    <div style="display:flex;gap:6px;margin:8px 0">
      <button style="flex:1" onclick="pmToggleAll()">☑ סמן/נקה את המסוננים</button>
      <button style="flex:1;background:#f3d9d2;color:#8c2f16" onclick="pmDeleteSel()">🗑 מחק את המסומנים</button>
    </div>
    <div id="pmList"></div></div>`;
  document.body.appendChild(ov);
  window.__pmSel = new Set();
  pmRender('');
  setTimeout(() => { const q = document.getElementById('pmQ'); if (q) q.focus(); }, 50);
}
function pmFiltered(q) {
  const toks = String(q || '').toLowerCase().split(/\s+/).filter(Boolean);
  return store.projects.filter(p => {
    const s = (p.name + ' ' + (p.accountName || '') + ' ' + (p.accountKey || '') + ' ' + (p.customer || '')).toLowerCase();
    return toks.every(t => s.includes(t));
  });
}
function pmRender(q) {
  const el = document.getElementById('pmList'); if (!el) return;
  window.__pmQ = q;
  el.innerHTML = pmFiltered(q).map(p => `<div style="display:flex;gap:8px;align-items:center;padding:6px 8px;border:1px solid #eee;border-radius:8px;margin-bottom:4px;${p.id === P.id ? 'background:#f2faf4' : ''}">
      <input type="checkbox" style="width:auto" ${window.__pmSel.has(p.id) ? 'checked' : ''} onchange="this.checked?window.__pmSel.add('${p.id}'):window.__pmSel.delete('${p.id}')">
      <b style="flex:1;font-size:12.5px;cursor:pointer" title="עבור לפרויקט" onclick="switchProj('${p.id}');document.getElementById('pmOv').remove()">${esc(p.name)}${p.id === P.id ? ' ←' : ''}</b>
      <span class="muted" style="font-size:11px;white-space:nowrap">👤 ${esc(p.accountName || p.customer || '—')}${p.accountKey ? ' · ' + esc(p.accountKey) : ''}</span>
      <span class="muted" style="font-size:10px;white-space:nowrap">${(p.nodes || []).length} מוקדים</span>
      ${p.offerSent ? '<span title="נשלחה הצעה ל-ERP" style="font-size:12px">📤</span>' : ''}
    </div>`).join('') || '<p class="muted" style="font-size:12px">אין תוצאות</p>';
}
function pmToggleAll() {
  const ids = pmFiltered(window.__pmQ || '').map(p => p.id);
  const allOn = ids.every(id => window.__pmSel.has(id));
  ids.forEach(id => allOn ? window.__pmSel.delete(id) : window.__pmSel.add(id));
  pmRender(window.__pmQ || '');
}
async function pmDeleteSel() {
  const ids = [...(window.__pmSel || [])];
  if (!ids.length) { uiToast('סמן פרויקטים למחיקה (בתיבות הסימון)'); return; }
  if (store.projects.length - ids.length < 1) { alert('חייב להישאר לפחות פרויקט אחד'); return; }
  const withOffer = ids.filter(id => store.projects.find(p => p.id === id)?.offerSent).length;
  if (!(await uiConfirm(`למחוק ${ids.length} פרויקטים לצמיתות?${withOffer ? '\n⚠ ' + withOffer + ' מהם עם הצעה שכבר נשלחה ל-ERP!' : ''}`, { okText: '🗑 מחק ' + ids.length }))) return;
  store.projects = store.projects.filter(p => !ids.includes(p.id));
  if (!store.projects.find(p => p.id === P.id)) { P = store.projects[0]; impItems = P.impSaved || []; sel = null; selCable = null; }
  window.__pmSel.clear();
  render(); save();
  const t = document.querySelector('#pmOv b'); if (t) t.textContent = '🗂 ניהול פרויקטים (' + store.projects.length + ')';
  pmRender(window.__pmQ || '');
  uiToast('✓ נמחקו ' + ids.length + ' פרויקטים');
}
function renameProj(v) { P.name = v; render(); }

const $ = s => document.querySelector(s);
const byId = id => P.nodes.find(n => n.id === id);
const cById = id => P.cables.find(c => c.id === id);

function addNode(kind) {
  const id = uid('n');
  P.nodes.push(kind === 'rack'
    ? { id, kind, name:'ארון חדש', sub:'', x:150, y:150, ru:12, units:[] }
    : kind === 'panel'
    ? { id, kind, name:'פאנל מחברים', sub:'', x:150, y:150, panel: defPanel(16, 2) }
    : { id, kind, name:'מוקד חדש', sub:'', x:150, y:150 });
  sel = id; ui.tab = 'node'; render();
}
async function delNode(id) {
  if (!(await uiConfirm('למחוק את המוקד וכל הכבלים שלו?'))) return;
  const n = byId(id);
  if (n) {
    if (n.srcIid) unplace(n.srcIid); /* מחיקה מחזירה את הפריט לרשימה למשיכה חוזרת */
    (n.units || []).forEach(u => u.srcIid && unplace(u.srcIid));
  }
  P.nodes = P.nodes.filter(n => n.id !== id);
  P.cables = P.cables.filter(c => c.from !== id && c.to !== id);
  if (sel === id) sel = null;
  render();
}

/* ---- units with explicit rack position ---- */
function fits(rack, pos, u, skipIdx) {
  if (pos < 0 || pos + u > rack.ru) return false;
  return !rack.units.some((x, i) => i !== skipIdx && pos < x.pos + x.u && x.pos < pos + u);
}
function firstFree(rack, u) {
  for (let p = 0; p <= rack.ru - u; p++) if (fits(rack, p, u, -1)) return p;
  return -1;
}
/* ＋ על שטח פנוי בארון — בוחר את הארון, מסמן את מיקום ההוספה וממקד את טופס היחידה */
function addUnitAt(nid, pos) {
  sel = nid; ui.tab = 'node';
  window.__addUPos = { nid, pos };
  render();
  setTimeout(() => {
    const f = document.querySelector('#panel input[name="nm"]');
    if (f) { f.focus(); f.placeholder = 'שם היחידה — תתווסף במיקום ' + (pos + 1) + 'U'; if (f.scrollIntoView) f.scrollIntoView({ block: 'center' }); }
  }, 60);
}
function addU(id, f) {
  const r = byId(id), u = +f.u.value || 1;
  let p = firstFree(r, u);
  const pend = window.__addUPos;
  if (pend && pend.nid === id) { p = pend.pos; window.__addUPos = null; } /* מיקום שנבחר ב-＋ */
  if (p < 0) { alert('אין מקום פנוי בארון — הגדל את גובה הארון'); return; }
  const unit = { id: uid('u'), name: f.nm.value, u, cat: f.cat.value, pos: p };
  const isPanel = f.isp && f.isp.checked;
  if (isPanel) { unit.panel = defPanel(8, 1); if (f.cat.value === 'other') unit.cat = 'patch'; }
  r.units.push(unit);
  if (isPanel) panelEdit = { nid: id, ui: r.units.length - 1 };
  render();
}
function mvU(id, i, d) {
  const r = byId(id), u = r.units[i];
  let p = u.pos + d;
  while (p >= 0 && p + u.u <= r.ru) {
    if (fits(r, p, u.u, i)) { u.pos = p; render(); return; }
    p += d;
  }
}
function setPos(id, i, v) {
  const r = byId(id), u = r.units[i];
  const p = Math.max(0, Math.min(r.ru - u.u, (+v || 1) - 1));
  if (fits(r, p, u.u, i)) u.pos = p; else alert('המיקום תפוס על ידי יחידה אחרת');
  render();
}

function stockFormHTML() {
  ensureStock(P);
  const S = P.stock;
  if (!S.cables.length && !S.reels.length) return '';
  const copts = S.cables.map(s => `<option value="cable|${s.id}">כבל מוכן: ${esc(s.name.slice(0, 32))}${s.len ? ' · ' + s.len + ' מ׳' : ''}${s.conn && CONNS[s.conn] ? ' · ' + CONNS[s.conn].n : ''} (${s.qty - (s.used || 0)}/${s.qty})</option>`).join('');
  const ropts = S.reels.map(s => `<option value="reel|${s.id}">גליל: ${esc(s.name.slice(0, 36))} (נותרו ${Math.max(0, s.total - (s.used || 0))} מ׳)</option>`).join('');
  const nopts = S.conns.map(s => `<option value="${s.id}">${esc(s.name.slice(0, 36))} (${s.qty - (s.used || 0)}/${s.qty})</option>`).join('');
  return `<h3 class="sec">📦 שימוש במלאי מההצעה</h3>
    <div class="fld"><label>מקור הכבל</label><select name="stockSrc">
      <option value="">— הגדרה ידנית —</option>${copts}${ropts}</select></div>
    <div class="fld"><label>מחברים לקצוות (חיתוך מגליל צורך 2 יח׳)</label><select name="stockConn">
      <option value="">— ללא —</option>${nopts}</select></div>`;
}
function applyStock(f, c) {
  applyStockRef(f.stockSrc && f.stockSrc.value, f.stockConn && f.stockConn.value, c);
}
function applyStockRef(srcVal, connVal, c) {
  if (!srcVal) return;
  ensureStock(P);
  c.stockRef = srcVal; /* נשמר כדי להחזיר כמויות במחיקה */
  const [kind, id] = srcVal.split('|');
  if (kind === 'cable') {
    const st = P.stock.cables.find(s => s.id === id);
    if (!st) return;
    st.used = (st.used || 0) + 1;
    c.type = st.type || c.type;
    c.conn = st.conn || connFor(c.type);
    if (st.len && !c.len) c.len = st.len;
    if (st.mm && !c.mm) c.mm = st.mm;
    if (!c.spec) c.spec = st.name.slice(0, 42);
    c.note = (c.note ? c.note + ' · ' : '') + 'מהמלאי';
    if (st.used > st.qty) alert('שים לב: נוצלו ' + st.used + ' מתוך ' + st.qty + ' של "' + st.name.slice(0, 30) + '"');
  } else if (kind === 'reel') {
    const st = P.stock.reels.find(s => s.id === id);
    if (!st) return;
    const L = +c.len || 0;
    if (L) st.used = (st.used || 0) + L; /* מרחק אופציונלי — אפשר להוסיף בעריכה מאוחר יותר */
    c.type = st.type || c.type;
    if (st.mm && !c.mm) c.mm = st.mm;
    if (!c.spec) c.spec = 'נחתך מגליל: ' + st.name.slice(0, 34);
    if (connVal) {
      const co = P.stock.conns.find(s => s.id === connVal);
      if (co) {
        co.used = (co.used || 0) + 2;
        c.note = (c.note ? c.note + ' · ' : '') + '2× ' + co.name.slice(0, 26);
        if (co.used > co.qty) alert('חריגה במלאי המחברים "' + co.name.slice(0, 30) + '": ' + co.used + '/' + co.qty);
      }
    }
  }
}
/* ===== שלוש רמות חיבור לכל קצה =====
   ארון → מכשיר בארון → מחבר ספציפי. הרמה נקבעת ממה שמלא:
   רק node = ארון · node+unit = מכשיר · node+unit+port = מחבר.
   מאפשר להתחיל גס ("הכבל מגיע לארון") ולדייק אחר-כך בלי לפרק את החיבור. */
function endLevelHTML(side, c, nid0, selId) {
  const isFrom = side === 'from';
  const nid = (isFrom ? c?.from : c?.to) ?? nid0;
  const uidv = isFrom ? c?.fromUnit : c?.toUnit;
  const port = (isFrom ? c?.pOut : c?.pIn) || '';
  const n = byId(nid);
  const lvl = port ? 'port' : (uidv ? 'unit' : 'rack');
  const uName = isFrom ? 'fromUnit' : 'toUnit';
  const pName = isFrom ? 'pOut' : 'pIn';
  const lbl = isFrom ? 'מוצא' : 'יעד';
  const hasUnits = n && ((n.units || []).length || (n.kind === 'panel' && n.panel));
  /* אפשרויות המחבר — מפריסת הגב של המכשיר, או מחורי הפאנל */
  let portOpts = '<option value="">— בחר מחבר —</option>';
  if (n) {
    if (uidv) {
      const u = (n.units || []).find(x => x.id === uidv);
      if (u) (rearLayout(u.name) || []).forEach(it => {
        if (!it.port) return;
        portOpts += `<option value="${esc(it.port)}" ${port === it.port ? 'selected' : ''}>${esc(it.port)}${it.label ? ' · ' + esc(it.label) : ''}</option>`;
      });
    } else if (n.kind === 'panel' && n.panel) {
      (n.panel.holes || []).forEach((h, i) => {
        const v = 'חור ' + (i + 1);
        portOpts += `<option value="${v}" ${port === v ? 'selected' : ''}>${v}${h.label ? ' · ' + esc(h.label) : ''} (${(CONNS[h.conn] || CONNS.empty).n})</option>`;
      });
    }
  }
  const badge = { rack: ['ארון', '#5f5e5a'], unit: ['מכשיר', '#185fa5'], port: ['מחבר', '#0f6e56'] }[lvl];
  /* קומפקטי: שורה אחת — שם + קפיצה למוקד + שלושת מצבי הדיוק כאייקונים */
  return `<div style="background:#f4f2ec;border-radius:8px;padding:5px 7px;margin-bottom:5px">
    <div style="display:flex;align-items:center;gap:4px;margin-bottom:3px">
      <b style="font-size:11.5px;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${esc(n ? n.name : '')}">${lbl}: ${esc(n ? n.name.slice(0, 22) : '—')}</b>
      <span style="background:${badge[1]};color:#fff;font-size:9.5px;font-weight:700;padding:0 7px;border-radius:10px">${badge[0]}</span>
      <button type="button" onclick="jumpToNode('${nid}')" title="עבור אל המוקד בתכנית" style="padding:1px 6px;font-size:11px">👁</button>
      ${[['rack', '🗄', 'לארון'], ['unit', '📦', 'למכשיר'], ['port', '🔌', 'למחבר']].map(([v, ic, t]) =>
        `<button type="button" onclick="setEndLevel(this.form,'${side}','${v}')" title="${t}" style="padding:1px 7px;font-size:11px;${lvl === v ? 'background:#c9502e;color:#fff' : ''}" ${v === 'unit' && !hasUnits ? 'disabled' : ''}>${ic}</button>`).join('')}
    </div>
    <div class="fld" style="margin:0 0 3px;${lvl === 'rack' ? 'display:none' : ''}">
      <select name="${uName}" id="${selId}">${unitOpts(nid, uidv)}</select></div>
    <div class="fld" style="margin:0;${lvl === 'port' ? '' : 'display:none'}">
      <select name="${pName}">${portOpts}</select></div>
  </div>`;
}
/* כמות עתידית — הזמנות פתוחות על המק"ט מה-ERP (דרך שרת האפליקציה), עם תאריכים */
async function futureQty(key, name) {
  const ov = uiModal(`<b style="font-size:14px">📅 כמויות עתידיות — ${esc(name || key)}</b>
    <div data-fq style="font-size:12px;margin-top:8px;line-height:1.6">⏳ טוען הזמנות פתוחות מה-ERP…</div>
    <button style="width:100%;margin-top:10px" onclick="this.closest('.uiDlgOv').remove()">סגור</button>`);
  const box = ov.querySelector('[data-fq]');
  try {
    const r = await fetch('/api/erp/item-future?key=' + encodeURIComponent(key));
    const j = await r.json();
    if (!j.ok) throw new Error((j.errors || ['שגיאה']).join(', '));
    const inf = erpInfo(key);
    if (!j.rows.length) { box.innerHTML = `במלאי כרגע: <b>${inf ? inf.qty : '?'}</b><br>אין הזמנות פתוחות על הפריט — אין תנועות עתידיות.`; return; }
    box.innerHTML = `במלאי כרגע: <b>${inf ? inf.qty : '?'}</b> · מחויב להזמנות פתוחות: <b style="color:#a35c00">${j.committed}</b> · צפי נטו: <b>${inf ? inf.qty - j.committed : '?'}</b>
      <table style="width:100%;font-size:11px;margin-top:6px;border-collapse:collapse">
        <tr style="border-bottom:1px solid #ddd"><th style="text-align:right">הזמנה</th><th>כמות</th><th>סטטוס</th><th>תאריך</th></tr>
        ${j.rows.map(r2 => `<tr style="border-bottom:1px solid #f0f0f0"><td>${esc(r2.order_code || '')}${r2.account ? ' · ' + esc(r2.account.slice(0, 18)) : ''}</td><td style="text-align:center">${r2.quantity}</td><td style="text-align:center">${esc(r2.status || '')}</td><td style="text-align:center">${r2.date ? new Date(r2.date).toLocaleDateString('he-IL') : '—'}</td></tr>`).join('')}
      </table>`;
  } catch (e) {
    box.innerHTML = '❌ ' + esc(e.message) + '<br><span class="muted">זמין רק כשהשרת רץ עם חיבור ERP (.env)</span>';
  }
}
/* קפיצה אל מוקד בתכנית — בחירה + גלילה אליו */
function jumpToNode(nid) {
  const n = byId(nid); if (!n) return;
  sel = nid; ui.tab = 'node';
  render();
  setTimeout(() => { const el = document.getElementById('nd_' + nid); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }); }, 60);
}
/* מעבר בין רמות — מנקה את מה שכבר לא רלוונטי כדי שלא יישאר מידע מטעה */
function setEndLevel(form, side, lvl) {
  if (!form) return;
  const c = selCable && cById(selCable); if (!c) return;
  if (side === 'from') {
    if (lvl === 'rack') { c.fromUnit = undefined; c.pOut = undefined; }
    else if (lvl === 'unit') { c.pOut = undefined; if (!c.fromUnit) { const n = byId(c.from); c.fromUnit = (n && (n.units || [])[0]) ? n.units[0].id : undefined; } }
  } else {
    if (lvl === 'rack') { c.toUnit = undefined; c.pIn = undefined; }
    else if (lvl === 'unit') { c.pIn = undefined; if (!c.toUnit) { const n = byId(c.to); c.toUnit = (n && (n.units || [])[0]) ? n.units[0].id : undefined; } }
  }
  if (lvl === 'port') {
    /* מחבר דורש מכשיר, אלא אם היעד הוא פאנל שהחורים שלו הם המחברים */
    const nid = side === 'from' ? c.from : c.to;
    const n = byId(nid);
    if (n && n.kind !== 'panel' && !(side === 'from' ? c.fromUnit : c.toUnit)) {
      const u = (n.units || [])[0];
      if (u) { if (side === 'from') c.fromUnit = u.id; else c.toUnit = u.id; }
    }
  }
  render(); save();
}
function cableVals(f) {
  return { from: f.from.value, fromUnit: f.fromUnit.value || undefined,
    to: f.to.value, toUnit: f.toUnit.value || undefined, type: f.type.value,
    conn: f.conn ? f.conn.value : undefined,
    conn2: f.conn2 ? (f.conn2.value || undefined) : undefined,
    pOut: f.pOut ? (f.pOut.value || undefined) : undefined,
    pIn: f.pIn ? (f.pIn.value || undefined) : undefined,
    qty: f.qty.value || '1', spec: f.spec.value, note: f.note.value,
    cores: f.cores && f.cores.value ? +f.cores.value : undefined,
    fiber: f.fiber && f.fiber.value ? f.fiber.value : undefined,
    dir: f.dir.checked ? 'both' : 'one',
    mm: f.mm.value ? +f.mm.value : undefined,
    inst: f.inst ? (f.inst.value || undefined) : undefined,
    len: f.len.value ? +f.len.value : undefined,
    lenManual: f.len.value ? true : undefined,
    imp: f.imp.value ? +f.imp.value : undefined };
}
/* מולטי XLR → מספר קווי XLR פנימיים אוטומטית ממספר החורים בקופסה/פאנל */
function autoCores(c) {
  if (c.type !== 'multi' || c.cores) return;
  const holesOf = (nid, uid) => { const n = byId(nid); if (!n) return 0; if (n.kind === 'panel' && n.panel) return n.panel.holes.filter(h => /xlr/i.test(h.conn || '')).length || n.panel.holes.length; const u = uid && (n.units || []).find(x => x.id === uid); if (u && u.panel) return u.panel.holes.filter(h => /xlr/i.test(h.conn || '')).length || u.panel.holes.length; return 0; };
  const h = Math.max(holesOf(c.from, c.fromUnit), holesOf(c.to, c.toUnit));
  if (h) c.cores = h;
}
function addCable(f) {
  const c = { id: uid('c'), ...cableVals(f) };
  applyStock(f, c);
  autoCores(c);
  P.cables.push(c);
  render();
}
function updCable(id, f) {
  const c = cById(id); if (!c) return;
  Object.assign(c, cableVals(f));
  render();
}
function swapCable(id) { const c = cById(id); [c.from, c.to] = [c.to, c.from]; [c.fromUnit, c.toUnit] = [c.toUnit, c.fromUnit]; render(); }
function dupCable(id) {
  const c = cById(id);
  const d = { ...c, id: uid('c') };
  P.cables.splice(P.cables.indexOf(c) + 1, 0, d);
  selCable = d.id; render();
}
function delCable(id) {
  const c = cById(id);
  if (c) {
    ensureStock(P);
    /* מחיקת כבל מחזירה את הכמויות — מלאי, מטרים ומחברים */
    if (c.stockRef) {
      const [k, sid] = c.stockRef.split('|');
      if (k === 'cable') { const s = P.stock.cables.find(x => x.id === sid); if (s && s.used) s.used--; }
      else if (k === 'reel') { const s = P.stock.reels.find(x => x.id === sid); if (s) s.used = Math.max(0, (s.used || 0) - (+c.len || 0)); }
    }
    if (c.connUse) {
      const it = impItems.find(x => x.iid === c.connUse);
      if (it) {
        it.placed = Math.max(0, (it.placed || 0) - 2);
        const s = it.stockId && P.stock.conns.find(x => x.id === it.stockId);
        if (s) s.used = Math.max(0, (s.used || 0) - 2);
        if (it.placed < it.qty) it.added = false;
      }
    }
  }
  P.cables = P.cables.filter(c => c.id !== id);
  if (selCable === id) selCable = null;
  render();
}
function pickCable(id) { selCable = id; ui.tab = 'cable'; render(); }

function nodeBox(n) {
  const el = document.getElementById('nd_' + n.id);
  /* _fanX/_fanY — היסט התצוגה של מוקדים שיושבים באותה נקודה, כדי שהקווים יגיעו לאייקון */
  const x = n.x + (n._fanX || 0), y = n.y + (n._fanY || 0);
  return el ? { x, y, w: el.offsetWidth, h: el.offsetHeight } : { x, y, w: 172, h: 80 };
}

function uploadBg(inp) {
  const file = inp.files[0]; inp.value = '';
  if (!file) return;
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'dwg' || ext === 'dxf') {
    alert('קבצי AutoCAD: הדפס מאוטוקאד ל-PDF (Plot → PDF) והעלה את ה-PDF — הוא ייטען כרקע באיכות מלאה.');
    return;
  }
  if (ext === 'pdf') {
    (async () => {
      try {
        if (!window.pdfjsLib) {
          await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        const doc = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
        const pg = await doc.getPage(1);
        const vp = pg.getViewport({ scale: 2 });
        const cv = document.createElement('canvas');
        cv.width = vp.width; cv.height = vp.height;
        await pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
        const k = Math.min(1, 1800 / cv.width);
        const cv2 = document.createElement('canvas');
        cv2.width = Math.round(cv.width * k); cv2.height = Math.round(cv.height * k);
        cv2.getContext('2d').drawImage(cv, 0, 0, cv2.width, cv2.height);
        P.bg = cv2.toDataURL('image/jpeg', 0.8);
        P.bgW = P.bgW || 1400;
        P.bgOp = P.bgOp ?? 0.5;
        sel = null; ui.tab = 'node';
        render();
        setTimeout(resetView100, 100); /* פתיחה ב-100% זום */
      } catch (err) { alert('קריאת ה-PDF נכשלה (נדרש אינטרנט לטעינת הספרייה): ' + err.message); }
    })();
    return;
  }
  const img = new Image();
  img.onload = () => {
    const scale = Math.min(1, 1800 / img.width);
    const cv = document.createElement('canvas');
    cv.width = Math.round(img.width * scale);
    cv.height = Math.round(img.height * scale);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    P.bg = cv.toDataURL('image/jpeg', 0.72);
    P.bgW = P.bgW || 1400;
    P.bgOp = P.bgOp ?? 0.5;
    sel = null; ui.tab = 'node';
    render();
    setTimeout(resetView100, 100); /* פתיחה ב-100% זום */
  };
  img.src = URL.createObjectURL(file);
}
function resetView100() {
  P.zoom = 1;
  applyZoom();
  save();
  const w = $('#canvasWrap');
  w.scrollTop = 0;
  w.scrollLeft = 0;
}
async function removeBg() {
  delete P.bg;
  delete P.calLine;
  if ((P.zones || []).length && await uiConfirm('להסיר גם את ' + P.zones.length + ' האזורים המסומנים על הרקע?')) P.zones = [];
  render();
}
function rotateBg() {
  if (!P.bg) return;
  const img = new Image();
  img.onload = () => {
    const cv = document.createElement('canvas');
    cv.width = img.height; cv.height = img.width;
    const ctx = cv.getContext('2d');
    ctx.translate(cv.width / 2, cv.height / 2);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    P.bg = cv.toDataURL('image/jpeg', 0.85);
    P.bgRot = ((P.bgRot || 0) + 90) % 360;
    render();
  };
  img.src = P.bg;
}
function renderBg() {
  const im = $('#bgimg');
  if (P.bg) {
    im.src = P.bg;
    im.style.width = (P.bgW || 1400) + 'px';
    im.style.opacity = P.bgOp ?? 0.5;
    im.style.display = 'block';
  } else im.style.display = 'none';
}
const getZ = () => P.zoom || 1;
function applyZoom() {
  const Z = getZ();
  $('#canvas').style.transform = `scale(${Z})`;
  $('#zoomer').style.width = 2200 * Z + 'px';
  $('#zoomer').style.height = 1400 * Z + 'px';
  const zl = $('#zlab');
  if (document.activeElement !== zl) zl.value = Math.round(Z * 100);
}
function setZoomPct(v) {
  const p = parseFloat(String(v).replace('%', ''));
  if (!isNaN(p) && p > 0) P.zoom = Math.min(5, Math.max(0.15, p / 100));
  applyZoom(); save();
}
function zoomBy(f) {
  P.zoom = Math.min(5, Math.max(0.15, getZ() * f));
  applyZoom(); save();
}
function fitView() {
  let xmax = 400, ymax = 300;
  for (const n of P.nodes) {
    const el = document.getElementById('nd_' + n.id);
    xmax = Math.max(xmax, n.x + (el ? el.offsetWidth : 180));
    ymax = Math.max(ymax, n.y + (el ? el.offsetHeight : 120));
  }
  const bg = $('#bgimg');
  if (P.bg && bg.offsetHeight) { xmax = Math.max(xmax, P.bgW || 1400); ymax = Math.max(ymax, bg.offsetHeight); }
  const wrap = $('#canvasWrap');
  /* ממלא את כל הקנבס הפנוי — מקטין או מגדיל לפי הצורך */
  P.zoom = Math.min(3, Math.max(0.15, Math.min(wrap.clientWidth / (xmax + 40), wrap.clientHeight / (ymax + 40))));
  applyZoom(); save();
  wrap.scrollTop = 0; wrap.scrollLeft = 0;
}
document.addEventListener('wheel', e => {
  if (!e.ctrlKey || !e.target.closest('#canvasWrap')) return;
  e.preventDefault();
  zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15);
}, { passive: false });
function render() {
  renderHeader(); renderBg(); applyZoom(); renderZones(); renderCoverage(); renderNodes(); renderWires(); renderPanel(); renderLegend(); renderCableKey();
  if (dockOpen) renderImp();
  $('#tabNode').classList.toggle('active', ui.tab === 'node');
  $('#tabCable').classList.toggle('active', ui.tab === 'cable');
  save();
}

function renderHeader() {
  $('#projSel').innerHTML = store.projects.map(p =>
    `<option value="${p.id}" ${p.id === P.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
  $('#projName').value = P.name;
  $('#viewMenu').innerHTML = viewMenuHTML();
  const auto = P.autoIds && P.autoIds.length;
  $('#actBtn').classList.toggle('on', P.route === 'ortho' || !!auto);
  $('#actionsMenu').innerHTML = `
    <button onclick="tidy()">${P.route === 'ortho' ? '〰 סדר אותי — חזור למעוגל' : '⚡ סדר אותי — קווים ישרים'}</button>
    <button onclick="autoConnect()">${auto ? `🔌 בטל חיבור אוטומטי (${P.autoIds.length})` : '🔌 חבר אותי — שידוך אוטומטי'}</button>
    <button onclick="designBrief()">🎯 תכנן לי מערכת לחלל זה</button>
    <button onclick="showBom()">🧾 כתב כמויות / הצעת מחיר</button>
    <button onclick="showKits()">🧰 קיטים — רשימה, עריכה ויצירה</button>
    <button onclick="verManager()">🕘 היסטוריית גרסאות — שחזור מצב קודם</button>
    <button onclick="installManager()">🔧 התקנה ותמחור — טבלה נערכת</button>
    <button onclick="rearLibManager()">🛠 ספריית גבי מוצרים</button>
    <button onclick="spkDataManager()">🔊 טבלת נתוני רמקולים/מגברים</button>`;
  document.body.classList.toggle('wiring', !!wireMode || !!pinMode || !!calMode || !!zoneMode || !!connPin || !!window.__rackPlace || !!window.__djPlace || !!window.__micPlace);
}

function viewMenuHTML() {
  const grp = (title, kind) => {
    const arr = P.nodes.filter(n => n.kind === kind);
    if (!arr.length) return '';
    const anyVis = arr.some(n => !n.hidden);
    return `<div style="display:flex;align-items:center;gap:6px;margin:6px 4px 2px">
        <span style="flex:1;font-weight:700;font-size:11px;color:#9aa3b5">${title}</span>
        <button style="font-size:10px;padding:1px 8px;border:1px solid #444d61" onclick="setGroupVis('${kind}')">${anyVis ? 'הסתר הכל' : 'הצג הכל'}</button>
      </div>` +
      arr.map(n => `<label style="display:flex;gap:6px;align-items:center;color:#fff;font-size:12px;padding:2px 6px;cursor:pointer;border-radius:5px">
        <input type="checkbox" style="width:auto" ${n.hidden ? '' : 'checked'} onchange="toggleVis('${n.id}',this.checked)">
        <span style="flex:1">${esc(n.name)}</span></label>`).join('');
  };
  /* סינון כבלים לפי דיסציפלינה — בתכנית עמוסה זה מה שמאפשר לקרוא אותה */
  P.cabVis = P.cabVis || {};
  const cabCat = [
    ['audio', '🔊 כבלי סאונד', ['multi', 'xlr', 'nl4']],
    ['light', '💡 כבלי תאורה', ['dmx']],
    ['video', '📺 כבלי וידאו', ['sdi', 'hdmi']],
    ['data', '🌐 רשת ואופטי', ['cat', 'fiber']],
    ['power', '⚡ חשמל', ['pwr']]
  ];
  const cabRows = cabCat.map(([k, lbl, types]) => {
    const n = (P.cables || []).filter(c => types.includes(c.type)).length;
    if (!n) return '';
    const on = P.cabVis[k] !== false;
    return `<label style="display:flex;gap:6px;align-items:center;color:#fff;font-size:12px;padding:2px 6px;cursor:pointer;border-radius:5px">
      <input type="checkbox" style="width:auto" ${on ? 'checked' : ''} onchange="P.cabVis['${k}']=this.checked;render();save()">
      <span style="flex:1">${lbl}</span><span style="color:#9aa3b5;font-size:10px">${n}</span></label>`;
  }).join('');
  return `<div style="max-height:62vh;overflow-y:auto;min-width:240px">
    <div style="display:flex;gap:4px;margin-bottom:4px">
      <button style="flex:1;border:1px solid #444d61" onclick="setAllVis(true)">הצג הכל</button>
      <button style="flex:1;border:1px solid #444d61" onclick="setAllVis(false)">הסתר הכל</button>
    </div>` +
    (cabRows ? `<div style="display:flex;align-items:center;gap:6px;margin:6px 4px 2px">
        <span style="flex:1;font-weight:700;font-size:11px;color:#9aa3b5">כבלים לפי סוג</span>
        <button style="font-size:10px;padding:1px 8px;border:1px solid #444d61" onclick="cabVisAll()">הצג/הסתר</button>
      </div>` + cabRows : '') +
    grp('ארונות', 'rack') +
    grp('פאנלים ומולטי', 'panel') +
    grp('מוקדי קצה', 'point') +
    '</div>';
}
function toggleVis(id, vis) { const n = byId(id); if (n) n.hidden = !vis; render(); }
/* מקרא צבעי כבלים — רק סוגים שבאמת בתכנית, אחרת זה רעש */
function renderCableKey() {
  const el = document.getElementById('cablekey'); if (!el) return;
  const used = {};
  (P.cables || []).forEach(c => { if (cableVisible(c)) used[c.type] = (used[c.type] || 0) + 1; });
  const keys = Object.keys(used);
  if (!keys.length || P.hideKey) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  el.innerHTML = `<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">
      <b style="flex:1;font-size:11px">מקרא כבלים</b>
      <span onclick="P.hideKey=true;render();save()" title="הסתר" style="cursor:pointer;color:#888">✕</span></div>` +
    keys.map(t => `<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
      <span style="width:18px;height:3px;border-radius:2px;background:${CTYPES[t].c};flex:none"></span>
      <span style="flex:1">${CTYPES[t].n}</span>
      <span style="color:#888">${used[t]}</span></div>`).join('') +
    ((P.cables || []).some(c => c.inst) ? `<div style="border-top:1px solid #ddd;margin-top:4px;padding-top:4px">
      <div style="display:flex;align-items:center;gap:6px"><span style="width:18px;border-top:2px dashed #555;flex:none"></span><span>♻️ קיים במקום</span></div>
      <div style="display:flex;align-items:center;gap:6px"><span style="width:18px;border-top:3px solid #555;flex:none;opacity:.6"></span><span>🚚 להעברה במקום</span></div></div>` : '');
}
const CAB_GROUP = { multi: 'audio', xlr: 'audio', nl4: 'audio', dmx: 'light', sdi: 'video', hdmi: 'video', cat: 'data', fiber: 'data', pwr: 'power' };
function cableVisible(c) {
  const g = CAB_GROUP[c.type] || 'audio';
  if ((P.cabVis || {})[g] === false) return false;
  /* הסתרה ברמת מוקד — אם אחד הקצוות הסתיר את הקטגוריה, הקו לא מצויר */
  for (const nid of [c.from, c.to]) {
    const n = byId(nid);
    if (n && n.cabVis && n.cabVis[g] === false) return false;
  }
  return true;
}
function cabVisAll() {
  P.cabVis = P.cabVis || {};
  const keys = ['audio', 'light', 'video', 'data', 'power'];
  const anyOn = keys.some(k => P.cabVis[k] !== false);
  keys.forEach(k => P.cabVis[k] = !anyOn);
  render(); save();
}
function setGroupVis(kind) {
  const arr = P.nodes.filter(n => n.kind === kind);
  const anyVis = arr.some(n => !n.hidden);
  arr.forEach(n => n.hidden = anyVis);
  render();
}
function setAllVis(v) { P.nodes.forEach(n => n.hidden = !v); render(); }
const MPAL = ['#c9502e', '#2e6bc9', '#0f8a5f', '#8a2fb8', '#c9871f', '#d1367a', '#3d6f74'];
let MCOLS = {}, REARPORTS = {}, REAREXIT = {}, REARUNIT = {}, aiming = null;
function aimUpdate(e) {
  const n = byId(aiming); if (!n) { aiming = null; return; }
  const pt = canvasPt(e);
  const cx = 2200 - n.x - 20, cy = n.y + 24;
  n.aim = Math.round(Math.atan2(pt.y - cy, pt.x - cx) * 180 / Math.PI);
  if (n.aim < 0) n.aim += 360;
  renderCoverage();
}
document.addEventListener('pointermove', e => { if (aiming) aimUpdate(e); });
document.addEventListener('pointerup', () => { if (aiming) { aiming = null; save(); render(); } });
const REAR_UPX = 66; /* גובה U בגב — מספיק למחברים אמיתיים */
/* ===== ספריית גב-מוצר — פריסת המחברים האמיתית לכל דגם ===== */
function ampRear(nOut, nIn, opts = {}) {
  const items = [{ t: 'power', label: 'AC' }];
  for (let k = nOut; k >= 1; k--) items.push({ t: 'speakon', label: 'CH' + k, port: 'OUT ' + k });
  if (opts.dip) items.push({ t: 'dip', label: 'MODE' });
  for (let k = 1; k <= nIn; k++) {
    items.push({ t: 'xlrf', label: 'IN' + k, port: 'IN ' + k });
    if (opts.link) items.push({ t: 'xlrm', label: 'LNK' + k, port: 'LNK ' + k }); /* לינק = יציאה (loop-through) */
  }
  if (opts.net) items.push({ t: 'rj45', label: opts.net });
  return items;
}
const REAR_KB = [
  /* XTA — DPA / DNA (כל הסדרה, אותו גב) */
  { re: /DPA\s?\d/i, items: ampRear(4, 4, { net: 'DANTE' }) },
  { re: /DNA\s?\d|XTA.*DNA/i, items: ampRear(4, 4, { net: 'ETH', link: true }) },
  /* NST Audio */
  { re: /NST|D48S/i, items: [{ t: 'power', label: 'AC' }, ...[8, 7, 6, 5, 4, 3, 2, 1].map(k => ({ t: 'xlrm', label: 'OUT' + k, port: 'OUT ' + k })), ...[1, 2, 3, 4].map(k => ({ t: 'xlrf', label: 'IN' + k, port: 'IN ' + k })), { t: 'rj45', label: 'NET' }] },
  { re: /D24S/i, items: [{ t: 'power', label: 'AC' }, ...[4, 3, 2, 1].map(k => ({ t: 'xlrm', label: 'OUT' + k, port: 'OUT ' + k })), ...[1, 2].map(k => ({ t: 'xlrf', label: 'IN' + k, port: 'IN ' + k })), { t: 'rj45', label: 'NET' }] },
  /* SAE */
  { re: /PQM\s?13|SAE.*4\s?[xX×]\s?1300/i, items: ampRear(4, 4, { dip: true, link: true }) },
  { re: /MA\s?800\b/i, items: ampRear(2, 2, { link: true }) },
  { re: /MA\s?1200\b/i, items: ampRear(2, 2, { link: true }) },
  { re: /MA\s?3600\b/i, items: ampRear(2, 2, { link: true }) },
  { re: /MA\s?8004/i, items: ampRear(4, 4, { link: true }) },
  { re: /MAX\s?2400/i, items: ampRear(2, 2, { link: true }) },
  { re: /MAX\s?3600/i, items: ampRear(2, 2, { link: true }) },
  { re: /MAX\s?4800/i, items: ampRear(2, 2, { link: true }) },
  /* LAB GRUPPEN */
  { re: /IPD[\s-]?1200/i, items: ampRear(2, 2, { net: 'ETH', dip: true }) },
  { re: /IPD[\s-]?2400/i, items: ampRear(2, 2, { net: 'ETH', dip: true }) },
  { re: /PLM\s?(12K44|20K44)/i, items: ampRear(4, 4, { net: 'DANTE' }) },
  { re: /XLI\s?2500/i, items: [{ t: 'power', label: 'AC' }, { t: 'binding', label: 'CH1', port: 'OUT 1' }, { t: 'speakon', label: 'CH1', port: 'OUT 2' }, { t: 'binding', label: 'CH2', port: 'OUT 3' }, { t: 'speakon', label: 'CH2', port: 'OUT 4' }, { t: 'xlrf', label: 'IN1', port: 'IN 1' }, { t: 'rca', label: 'RCA1' }, { t: 'xlrf', label: 'IN2', port: 'IN 2' }, { t: 'rca', label: 'RCA2' }] },
  /* MAGNETIC */
  { re: /TD\s?10000|MAGNETIC.*TD/i, items: ampRear(4, 4, { dip: true, link: true }) },
  { re: /DH\s?408/i, items: [{ t: 'power', label: 'AC' }, ...[8, 7, 6, 5, 4, 3, 2, 1].map(k => ({ t: 'xlrm', label: 'OUT' + k, port: 'OUT ' + k })), ...[1, 2, 3, 4].map(k => ({ t: 'xlrf', label: 'IN' + k, port: 'IN ' + k })), { t: 'rj45', label: 'NET' }] },
  { re: /\bM\s?408\b/i, items: [{ t: 'power', label: 'AC' }, ...[8, 7, 6, 5, 4, 3, 2, 1].map(k => ({ t: 'xlrm', label: 'OUT' + k, port: 'OUT ' + k })), ...[1, 2, 3, 4].map(k => ({ t: 'xlrf', label: 'IN' + k, port: 'IN ' + k })), { t: 'rj45', label: 'NET' }] },
  /* פרוססורים */
  { re: /DC\s?1048|XTA.*DC10/i, items: [{ t: 'power', label: 'AC' }, ...[8, 7, 6, 5, 4, 3, 2, 1].map(k => ({ t: 'xlrm', label: 'OUT' + k, port: 'OUT ' + k })), ...[1, 2, 3, 4].map(k => ({ t: 'xlrf', label: 'IN' + k, port: 'IN ' + k })), { t: 'rj45', label: 'RS485' }] },
  { re: /PRISM\s?12|Symetrix.*12/i, items: [{ t: 'power', label: 'AC' }, ...[12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(k => ({ t: 'pwr', label: 'O' + k, port: 'OUT ' + k })), ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(k => ({ t: 'pwr', label: 'I' + k, port: 'IN ' + k })), { t: 'rj45', label: 'DANTE' }] },
  { re: /Symetrix.*8|PRISM\s?8/i, items: [{ t: 'power', label: 'AC' }, ...[8, 7, 6, 5, 4, 3, 2, 1].map(k => ({ t: 'pwr', label: 'O' + k, port: 'OUT ' + k })), ...[1, 2, 3, 4, 5, 6, 7, 8].map(k => ({ t: 'pwr', label: 'I' + k, port: 'IN ' + k })), { t: 'rj45', label: 'DANTE' }] },
  { re: /DSK\s?3\.?1|DIGI.*DSK/i, items: [{ t: 'power', label: 'AC' }, ...[6, 5, 4, 3, 2, 1].map(k => ({ t: 'xlrm', label: 'OUT' + k, port: 'OUT ' + k })), ...[1, 2].map(k => ({ t: 'xlrf', label: 'IN' + k, port: 'IN ' + k })), { t: 'rj45', label: 'NET' }] },
  /* מיקסרים לראק */
  { re: /MIDAS.*32R|M32R/i, items: [{ t: 'power', label: 'AC' }, ...[16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(k => ({ t: 'xlrf', label: String(k), port: 'IN ' + k })), ...[1, 2, 3, 4, 5, 6, 7, 8].map(k => ({ t: 'xlrm', label: 'O' + k, port: 'OUT ' + k })), { t: 'rj45', label: 'AES50' }] },
  { re: /MIDAS.*DM12|DM\s?12/i, items: [{ t: 'power', label: 'AC' }, ...[12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(k => ({ t: 'xlrf', label: String(k), port: 'IN ' + k })), { t: 'xlrm', label: 'MainL', port: 'OUT 1' }, { t: 'xlrm', label: 'MainR', port: 'OUT 2' }, { t: 'xlrm', label: 'AUX1', port: 'OUT 3' }, { t: 'xlrm', label: 'AUX2', port: 'OUT 4' }] },
  { re: /BERINGER\s?UL|BEHRINGER.*UL|ULTRAZONE/i, items: [{ t: 'power', label: 'AC' }, ...[6, 5, 4, 3, 2, 1].map(k => ({ t: 'xlrm', label: 'Z' + k, port: 'OUT ' + k })), { t: 'xlrf', label: 'IN1', port: 'IN 1' }, { t: 'xlrf', label: 'IN2', port: 'IN 2' }] },
  { re: /XTA\s*(DNA|APA)|DNA\s?20/i, items: ampRear(4, 4, { net: 'ETH', link: true }) },
  { re: /IPX\s?(5|10|15|20)\s?:\s?4/i, items: ampRear(4, 4, { net: 'DANTE' }) },
  { re: /\bIX\s?(15|30|60)/i, items: [{ t: 'power', label: 'AC' }, { t: 'binding', label: 'OUT1', port: 'OUT 1' }, { t: 'binding', label: 'OUT2', port: 'OUT 2' }, { t: 'binding', label: 'OUT3', port: 'OUT 3' }, { t: 'binding', label: 'OUT4', port: 'OUT 4' }, { t: 'xlrf', label: 'IN1', port: 'IN 1' }, { t: 'xlrf', label: 'IN2', port: 'IN 2' }, { t: 'rj45', label: 'DANTE' }] },
  { re: /DYNAMIQ\s?450/i, items: [{ t: 'power', label: 'AC' }, { t: 'speakon', label: 'A', port: 'OUT 1' }, { t: 'speakon', label: 'B', port: 'OUT 2' }, { t: 'dip', label: 'DSP' }, { t: 'xlrf', label: 'IN L', port: 'IN 1' }, { t: 'xlrf', label: 'IN R', port: 'IN 2' }, { t: 'rca', label: 'AUX' }] },
  { re: /DS\s?418|418E|DIGITAL LOUDSPEAKER|processor|פרוססור|DSP/i, items: [{ t: 'power', label: 'AC' }, { t: 'xlrf', label: 'IN1', port: 'IN 1' }, { t: 'xlrf', label: 'IN2', port: 'IN 2' }, { t: 'xlrm', label: 'OUT1', port: 'OUT 1' }, { t: 'xlrm', label: 'OUT2', port: 'OUT 2' }, { t: 'xlrm', label: 'OUT3', port: 'OUT 3' }, { t: 'xlrm', label: 'OUT4', port: 'OUT 4' }, { t: 'rj45', label: 'NET' }] },
  { re: /מיקסר|mixer|console/i, items: [{ t: 'power', label: 'AC' }, { t: 'xlrf', label: 'IN1', port: 'IN 1' }, { t: 'xlrf', label: 'IN2', port: 'IN 2' }, { t: 'xlrf', label: 'IN3', port: 'IN 3' }, { t: 'xlrf', label: 'IN4', port: 'IN 4' }, { t: 'xlrm', label: 'MAIN L', port: 'OUT 1' }, { t: 'xlrm', label: 'MAIN R', port: 'OUT 2' }, { t: 'xlrm', label: 'AUX', port: 'OUT 3' }] },
];
function rearKey(name) { return (name || '').replace(/\s*\(\d+\)\s*$/, '').trim(); }
function rearLayout(name) {
  const lib = (store && store.rearLib) || {};
  const key = rearKey(name);
  if (lib[key]) return lib[key];
  const hit = REAR_KB.find(e => e.re.test(name || ''));
  if (hit) return hit.items;
  /* ברירת מחדל מבסיס ה-IO אם קיים, אחרת גנרי */
  const io = ioFor(name);
  const cnt = t => { const m = t && t.match(/(\d+)\s*[-×x]/i); return m ? Math.min(+m[1], 8) : 2; };
  if (io) {
    const isAmp = /ספיקון|NL4|בורג/i.test(io.o);
    return ampRear(cnt(io.o), cnt(io.i), { dip: /מגבר|amp/i.test(name), net: /Dante|OMNEO|רשת/i.test(io.x || '') ? 'NET' : null });
  }
  return [{ t: 'power', label: 'AC' }, { t: 'xlrf', label: 'IN', port: 'IN 1' }, { t: 'xlrm', label: 'OUT', port: 'OUT 1' }];
}
function rearGlyph(t) {
  if (['speakon', 'xlrf', 'xlrm', 'rj45', 'bnc', 'pwr', 'hdmi', 'fiber'].includes(t)) return connGlyph(t);
  if (t === 'multi') return connGlyph('xlrm');
  if (t === 'dmx') return connGlyph('xlrf');
  const S = 'width="22" height="22" viewBox="0 0 22 22"';
  if (t === 'power') return `<svg ${S}><circle cx="11" cy="11" r="9" fill="#111" stroke="#888" stroke-width="1.5"/><path d="M11 5v6" stroke="#ccc" stroke-width="1.8"/><path d="M7.5 8a5 5 0 1 0 7 0" fill="none" stroke="#ccc" stroke-width="1.8"/></svg>`;
  if (t === 'dip') return `<svg ${S}><rect x="3" y="6" width="16" height="10" rx="1.5" fill="#b02a2a"/><rect x="4.5" y="7.5" width="2" height="4" fill="#fff"/><rect x="7.5" y="9" width="2" height="4" fill="#fff"/><rect x="10.5" y="7.5" width="2" height="4" fill="#fff"/><rect x="13.5" y="9" width="2" height="4" fill="#fff"/></svg>`;
  if (t === 'rca') return `<svg ${S}><circle cx="11" cy="11" r="8" fill="#111" stroke="#c94" stroke-width="1.8"/><circle cx="11" cy="11" r="2.4" fill="#c94"/></svg>`;
  if (t === 'binding') return `<svg ${S}><circle cx="7.5" cy="11" r="3.4" fill="#b02a2a" stroke="#fff" stroke-width="1"/><circle cx="14.5" cy="11" r="3.4" fill="#111" stroke="#fff" stroke-width="1"/></svg>`;
  return connGlyph('xlrf');
}
const REAR_TYPES = [['speakon', 'ספיקון NL4'], ['xlrf', 'XLR נקבה'], ['xlrm', 'XLR זכר'], ['multi', 'מולטי XLR'], ['rj45', 'רשת RJ45 / Cat6'], ['fiber', 'אופטי LC/SC'], ['dmx', 'DMX (XLR 5/3)'], ['bnc', 'BNC / SDI'], ['hdmi', 'HDMI / וידאו'], ['rca', 'RCA'], ['binding', 'בורג/בננה'], ['power', 'חשמל'], ['dip', 'מתגי DIP']];
function rearEditor(unitId) {
  for (const n of P.nodes) if (n.kind === 'rack') { const u = (n.units || []).find(x => x.id === unitId); if (u) { rearEditorByName(u.name); return; } }
}
function rearEditorByName(uname) {
  const items = JSON.parse(JSON.stringify(rearLayout(uname)));
  const mgr = document.getElementById('rearLibOv'); if (mgr) mgr.remove();
  window.__rearDraft = items;
  window.__rearSel = items.length ? 0 : -1;
  window.__rearName = rearKey(uname);
  const ov = document.createElement('div');
  ov.id = 'rearEdOv';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(20,24,32,.5);z-index:99;display:flex;align-items:center;justify-content:center';
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  ov.innerHTML = `<div style="background:#fff;border-radius:12px;padding:16px;max-width:640px;width:94%;max-height:86vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,.35)">
    <b style="display:block;margin-bottom:2px">✎ עריכת גב הדגם — ${esc(window.__rearName)}</b>
    <p class="muted" style="margin:0 0 8px">לחץ על מחבר בגב לעריכה · גרור להזזה עם ◀ ▶ · השם והתפקיד נערכים למטה. נשמר לכל המופעים של הדגם.</p>
    <div class="fld" style="margin-bottom:8px"><label>📋 משוך פריסת גב ממוצר אחר (מעתיק את כל המחברים)</label>
      <select onchange="if(this.value!==''){rearCopyFrom(this.value);this.value='';}">
        <option value="">— בחר דגם להעתקה —</option>
        ${(() => {
          const names = new Set(Object.keys(store.rearLib || {}));
          REAR_KB.forEach(e => names.add(prettyRe(e.re)));
          return [...names].filter(nm => rearKey(nm) !== window.__rearName).sort().map(nm => `<option value="${esc(nm).replace(/"/g, '&quot;')}">${esc(nm)}</option>`).join('');
        })()}
      </select></div>
    <div id="rearEdPanel"></div>
    <div id="rearEdEdit"></div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="primary" style="flex:1" onclick="rearSave()">שמור לספרייה</button>
      <button style="flex:1" onclick="document.getElementById('rearEdOv').remove()">ביטול</button>
    </div></div>`;
  document.body.appendChild(ov);
  rearEdRender();
}
function rearEdRender() {
  const items = window.__rearDraft, sel = window.__rearSel;
  const panel = document.getElementById('rearEdPanel'), edit = document.getElementById('rearEdEdit');
  if (!panel) return;
  /* פאנל גב גרפי — המחברים כמו שהם על המוצר */
  const conns = items.map((it, i) => {
    const on = i === sel;
    const isOut = it.port && /^OUT/.test(it.port), isIn = it.port && /^IN/.test(it.port);
    const chipBg = isOut ? '#c94a24' : isIn ? '#0f6e56' : '#0d0f14';
    return `<div onclick="__rearSel=${i};rearEdRender()" title="${esc(it.label || '')}" style="flex:none;width:40px;text-align:center;cursor:pointer;padding:4px 2px;border-radius:6px;${on ? 'background:#3a4150;outline:2px solid #ff8a50' : ''}">
      <div style="position:relative;width:24px;height:24px;margin:0 auto">${rearGlyph(it.t)}
        <div style="position:absolute;left:50%;bottom:-3px;transform:translateX(-50%);background:${chipBg};color:#fff;font-size:7px;font-weight:800;padding:0 3px;border-radius:3px;white-space:nowrap">${esc(it.label || '·')}</div></div></div>`;
  }).join('');
  panel.innerHTML = `<div style="background:#16191f;border-radius:8px;padding:12px 10px;display:flex;gap:2px;align-items:center;overflow-x:auto;direction:ltr">
      ${conns || '<span style="color:#8b93a3;font-size:12px">אין מחברים — הוסף למטה</span>'}
      <button onclick="rearAddItem()" title="הוסף מחבר" style="flex:none;width:34px;height:34px;border-radius:8px;background:#2d3444;color:#fff;font-size:18px;margin-left:6px">+</button>
    </div>
    <div style="font-size:10px;color:#8b93a3;text-align:center;margin-top:3px;direction:ltr">◀ שמאל (יציאות) · ימין (כניסות) ▶ — כמו בגב האמיתי</div>`;
  if (sel < 0 || sel >= items.length) { edit.innerHTML = ''; return; }
  const it = items[sel];
  edit.innerHTML = `<div style="background:#f4f2ec;border-radius:8px;padding:10px;margin-top:10px">
    <div class="row2">
      <div class="fld"><label>סוג מחבר</label><select onchange="__rearDraft[${sel}].t=this.value;rearEdRender()">${REAR_TYPES.map(([v, l]) => `<option value="${v}" ${it.t === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="fld"><label>תווית (בתוך המחבר)</label><input value="${esc(it.label || '')}" placeholder="למשל CH1 / IN1" onchange="__rearDraft[${sel}].label=this.value;rearEdRender()"></div>
    </div>
    <div class="fld"><label>תפקיד — יציאה / כניסה</label><select onchange="__rearDraft[${sel}].port=this.value||undefined;rearEdRender()">
      <option value="" ${!it.port ? 'selected' : ''}>— ללא (חשמל/מתג/לינק) —</option>
      ${[1, 2, 3, 4, 5, 6, 7, 8].map(k => `<option value="OUT ${k}" ${it.port === 'OUT ' + k ? 'selected' : ''}>יציאה OUT ${k}</option>`).join('')}
      ${[1, 2, 3, 4, 5, 6, 7, 8].map(k => `<option value="IN ${k}" ${it.port === 'IN ' + k ? 'selected' : ''}>כניסה IN ${k}</option>`).join('')}
    </select></div>
    <div style="display:flex;gap:6px;margin-top:4px">
      <button style="flex:1" onclick="rearMove(${sel},-1)" ${sel === 0 ? 'disabled' : ''}>◀ הזז שמאלה</button>
      <button style="flex:1" onclick="rearMove(${sel},1)" ${sel === items.length - 1 ? 'disabled' : ''}>הזז ימינה ▶</button>
      <button style="background:#f3d9d2;color:#8c2f16" onclick="__rearDraft.splice(${sel},1);__rearSel=Math.max(0,${sel}-1);rearEdRender()">✕ מחק מחבר</button>
    </div>
    <div style="display:flex;gap:6px;margin-top:6px">
      <button style="flex:1" onclick="rearInsert(${sel},0)">➕◀ הוסף משמאלו</button>
      <button style="flex:1" onclick="rearInsert(${sel},1)">הוסף מימינו ▶➕</button>
    </div></div>`;
}
/* הוספת מחבר צמוד למחבר הנבחר — משמאלו (after=0) או מימינו (after=1) */
function rearInsert(i, after) {
  const a = window.__rearDraft;
  const src = a[i] || { t: 'xlrf' };
  a.splice(i + after, 0, { t: src.t, label: '', port: undefined });
  window.__rearSel = i + after;
  rearEdRender();
}
function rearMove(i, dir) {
  const a = window.__rearDraft, j = i + dir;
  if (j < 0 || j >= a.length) return;
  [a[i], a[j]] = [a[j], a[i]];
  window.__rearSel = j;
  rearEdRender();
}
function rearAddItem() {
  /* מציע את המחבר האחרון ששמת, עם תווית/פורט מוגדלים ב-1 */
  const a = window.__rearDraft, last = a[a.length - 1];
  let t = 'xlrf', label = '', port;
  if (last) {
    t = last.t;
    const m = (last.label || '').match(/^(.*?)(\d+)\s*$/);
    label = m ? m[1] + (+m[2] + 1) : (last.label ? last.label + ' 2' : '');
    if (last.port) { const pm = last.port.match(/^(OUT|IN|LNK)\s*(\d+)/i); if (pm) port = pm[1].toUpperCase() + ' ' + (+pm[2] + 1); }
  }
  a.push({ t, label, port });
  window.__rearSel = a.length - 1;
  rearEdRender();
}
/* העתקת פריסת גב ממוצר אחר לתוך הטיוטה הנוכחית */
async function rearCopyFrom(srcName) {
  const src = rearLayout(srcName);
  if (!src || !src.length) { alert('לא נמצאה פריסה למקור.'); return; }
  if (window.__rearDraft.filter(x => x.t).length && !(await uiConfirm('להחליף את פריסת הגב הנוכחית בפריסה של "' + srcName + '"?'))) return;
  window.__rearDraft = JSON.parse(JSON.stringify(src));
  window.__rearSel = window.__rearDraft.length ? 0 : -1;
  rearEdRender();
}
function rearSave() {
  store.rearLib = store.rearLib || {};
  store.rearLib[window.__rearName] = window.__rearDraft.filter(it => it.t);
  save();
  const ov = document.getElementById('rearEdOv'); if (ov) ov.remove();
  render();
}
/* ===== מנהל ספריית הגבים — כל הדגמים, עריכה, הוספה, ייבוא/ייצוא ===== */
function rearLibManager() {
  const old = document.getElementById('rearLibOv'); if (old) old.remove();
  const lib = store.rearLib || {};
  const rows = [];
  for (const [name, items] of Object.entries(lib))
    rows.push({ name, n: items.length, src: 'מותאם', custom: true });
  REAR_KB.forEach(e => {
    const nm = String(e.re).replace(/^\/|\/i?$/g, '').split('|')[0]
      .replace(/\[[^\]]*\]\??/g, ' ').replace(/\\s\?|\\s\*|\\s|\\b|\\\.|\(|\)|\?|\^|\$/g, ' ').replace(/\s+/g, ' ').trim();
    if (!rows.some(r => r.name === nm)) rows.push({ name: nm, n: e.items.length, src: 'מובנה', custom: false, re: String(e.re) });
  });
  const ov = document.createElement('div');
  ov.id = 'rearLibOv';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(20,24,32,.5);z-index:98;display:flex;align-items:center;justify-content:center';
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  ov.innerHTML = `<div style="background:#fff;border-radius:12px;padding:16px;max-width:560px;width:94%;max-height:86vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,.35)">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><b style="flex:1">🛠 ספריית גבי מוצרים (${rows.length} דגמים)</b>
      <button onclick="document.getElementById('rearLibOv').remove()">✕</button></div>
    <p class="muted" style="margin:0 0 8px;font-size:11px">✎ = עריכת פריסת הגב (נשמר כמותאם) · דגם מובנה שנערך הופך למותאם וגובר עליו.</p>
    <div style="display:flex;gap:6px;margin-bottom:8px">
      <button style="flex:1" onclick="uiPrompt('שם הדגם החדש (כפי שמופיע בשם המוצר):').then(nm=>{if(nm){document.getElementById('rearLibOv').remove();rearEditorByName(nm.trim());}})">+ דגם חדש</button>
      <button style="flex:1" onclick="rearLibExport()">💾 ייצוא JSON</button>
      <button style="flex:1" onclick="$('#rearLibIn').click()">📥 ייבוא JSON</button>
    </div>
    ${rows.map(r => `<div style="display:flex;gap:8px;align-items:center;padding:5px 8px;border:1px solid #eee;border-radius:7px;margin-bottom:4px">
      <b style="flex:1;font-size:12px">${esc(r.name)}</b>
      <span class="muted" style="font-size:10px">${r.n} מחברים · ${r.src}</span>
      <button style="padding:1px 8px" onclick="document.getElementById('rearLibOv').remove();rearEditorByName('${esc(r.name).replace(/'/g, '&#39;')}')">✎</button>
      ${r.custom ? `<button style="padding:1px 8px;background:#f3d9d2" onclick="uiConfirm('למחוק את הדגם המותאם?').then(ok=>{if(ok){delete store.rearLib['${esc(r.name).replace(/'/g, '&#39;')}'];save();document.getElementById('rearLibOv').remove();rearLibManager();}})">✕</button>` : ''}
    </div>`).join('')}</div>`;
  document.body.appendChild(ov);
}
function rearLibExport() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(store.rearLib || {}, null, 1)], { type: 'application/json' }));
  a.download = 'rear-library.json';
  a.click();
}
function rearLibImport(inp) {
  const f = inp.files[0]; if (!f) return; inp.value = '';
  const r = new FileReader();
  r.onload = () => {
    try {
      const j = JSON.parse(r.result);
      store.rearLib = Object.assign(store.rearLib || {}, j);
      save();
      alert('יובאו ' + Object.keys(j).length + ' דגמים לספריית הגבים.');
      const ov = document.getElementById('rearLibOv'); if (ov) { ov.remove(); rearLibManager(); }
    } catch (e) { alert('קובץ לא תקין: ' + e.message); }
  };
  r.readAsText(f);
}
function renderNodes() {
  const host = $('#nodes');
  host.innerHTML = '';
  MCOLS = {}; REARPORTS = {}; REAREXIT = {}; REARUNIT = {}; PANELPORT = {}; /* מאופסים בכל רינדור */
  /* מוקדים שיושבים בדיוק אחד על השני — נפרשים במניפה קטנה כדי ששניהם יהיו גלויים
     וניתנים ללחיצה, עם מסגרת שמסמנת שהם חולקים מיקום. */
  const stackAt = {}, stackOf = {};
  for (const n of P.nodes) {
    if (n.hidden) continue;
    /* ארון פתוח הוא גדול — רק ארון מכווץ נחשב "אייקון" שאפשר לפרוש */
    if (n.kind === 'rack' && !n.min) continue;
    const k = Math.round(n.x / 26) + '|' + Math.round(n.y / 26);
    (stackAt[k] = stackAt[k] || []).push(n.id);
  }
  Object.values(stackAt).forEach(ids => {
    if (ids.length < 2) return;
    ids.forEach((id, i) => stackOf[id] = { i, tot: ids.length });
  });
  P.nodes.forEach(n => { n._fanX = 0; n._fanY = 0; });
  for (const n of P.nodes) {
    if (n.hidden) continue;
    const stk = stackOf[n.id];
    const d = document.createElement('div');
    d.className = 'node' + (sel === n.id ? ' sel' : '') + (n.kind === 'rack' && n.rear ? ' rear' : '')
      + (wireMode?.from?.nid === n.id ? ' wsrc' : '');
    d.id = 'nd_' + n.id;
    let sx = 0, sy = 0;
    if (stk) { /* פריסה במניפה: 15px לכל שכבה, לסירוגין ימין-שמאל ומעלה-מטה */
      const a = stk.i * (Math.PI * 2 / Math.max(3, stk.tot)) - Math.PI / 4;
      const r = 15 + stk.i * 3;
      sx = Math.round(Math.cos(a) * r); sy = Math.round(Math.sin(a) * r);
      d.dataset.stack = stk.i + '/' + stk.tot;
      n._fanX = sx; n._fanY = sy;
    }
    d.style.right = (n.x + sx) + 'px';
    d.style.top = (n.y + sy) + 'px';
    if (stk) { d.style.zIndex = 9 + stk.i; d.title = (d.title || '') + ' · ' + stk.tot + ' מוקדים באותה נקודה — נפרשו לתצוגה'; }
    /* גב ארון = שכבה עליונה כדי שלא יוסתר ע"י פאנלים/מוקדים אחרים */
    if (n.kind === 'rack' && n.rear) d.style.zIndex = (sel === n.id ? 60 : 20);
    else if (sel === n.id) d.style.zIndex = 8;
    /* כשגב ארון פתוח — הקווים מעל הכל כדי שהחיבור אל הקונקטור לא יוסתר */
    if (P.nodes.some(x => x.kind === 'rack' && x.rear)) $('#wires').style.zIndex = 61; else $('#wires').style.zIndex = 3;

    let body, flip = '';
    if (n.kind === 'rack' && n.min) {
      /* ארון מכווץ לאייקון */
      d.className += ' mini';
      d.innerHTML = `<div data-drag="${n.id}" title="${esc(n.name)} · ${n.ru}U · ${n.units.length} יחידות · לחץ לפתיחה" style="cursor:grab;position:relative">
        <div class="mnum" style="background:#2d3444">${n.ru}U</div>
        <div class="mic" style="border-color:#2d3444" title="לחץ לפתיחת הארון"><svg width="18" height="18" viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="1.5" fill="none" stroke="#2d3444" stroke-width="2"/><line x1="8.5" y1="7" x2="15.5" y2="7" stroke="#2d3444" stroke-width="2"/><line x1="8.5" y1="11" x2="15.5" y2="11" stroke="#2d3444" stroke-width="2"/><line x1="8.5" y1="15" x2="15.5" y2="15" stroke="#2d3444" stroke-width="2"/></svg></div>
</div>`;
      d.addEventListener('pointerdown', e => {
        if (wireMode) { handleWireClick(n.id); e.stopPropagation(); e.preventDefault(); return; }
        sel = n.id; ui.tab = 'node';
        if (!e.target.closest('button')) miniOpenOnTap(e, () => toggleRackMin(n.id), n.id);
      });
      host.appendChild(d);
      continue;
    }
    if (n.kind === 'rack') {
      /* במצב גב הכותרת צרה — משאירים רק את כפתור החזרה לחזית */
      flip = n.rear
        ? `<span class="flip" onpointerdown="event.stopPropagation()" onclick="toggleRear('${n.id}')" title="חזרה לחזית" style="white-space:nowrap">⇄ חזית</span>`
        : `<span class="flip" onpointerdown="event.stopPropagation()" onclick="event.stopPropagation();rackZoom('${n.id}',-1)" title="הקטן ארון">−</span>
        <span class="flip" onpointerdown="event.stopPropagation()" onclick="event.stopPropagation();rackZoom('${n.id}',1)" title="הגדל ארון">+</span>
        <span class="flip" onpointerdown="event.stopPropagation()" onclick="toggleRackMin('${n.id}')" title="כווץ לאייקון">⤡</span><span class="flip" onpointerdown="event.stopPropagation()" onclick="toggleRear('${n.id}')" title="הפוך חזית/גב">⇄</span>`;
      let used = 0, rows = '';
      if (n.rear) {
        /* גב הארון — פאנל סכמטי: יציאות משמאל, כניסות מימין, תעלה בין הפאנל לתווית */
        const upx = REAR_UPX;
        const STEP = 42, PADL = 16, PADR = 16, GAP = 54, CHW = 48, LBLW = 128;
        const LBL2 = cableLabels();
        const isRight = it => (it.port && /^IN/.test(it.port)) || it.t === 'rj45';
        let panelW = 360;
        for (const u of n.units) {
          const items = rearLayout(u.name);
          const L = items.filter(it => !isRight(it)).length, R = items.filter(isRight).length;
          const w = PADL + L * STEP + GAP + R * STEP + PADR;
          if (w > panelW) panelW = w;
          REARPORTS[u.id] = {};
        }
        const chanXlocal = 8 + panelW + CHW / 2; /* תעלה אנכית בין פאנל לתווית */
        /* הגב מוקטן לרוחב החזית — לא תופס יותר שטח יחסי בתכנית; הזום מפצה על הקריאות */
        const rearWnat = panelW + CHW + LBLW + 44;
        const RK = Math.min(1, (n._frontW || 240) / rearWnat);
        n._rearK = RK; d._rearK = RK;
        d.style.width = Math.round(rearWnat * RK) + 'px';
        const pnum = s => { const m = /(\d+)/.exec(s || ''); return m ? +m[1] : null; };
        /* פריסה סכמטית: כל יחידה בגובה נוח + רווח אנכי ברור ביניהן, כמו בהדמיה */
        window.__chainLoad = window.__chainLoad || null;
        const RZ = (n.uz || 1);
        const GAPV = 26 * RZ, ROWMIN = 96 * RZ, yTop = 14;
        const sortedU = n.units.slice().sort((a, b) => a.pos - b.pos);
        let yCur = yTop;
        for (const u of sortedU) {
          const items = rearLayout(u.name);
          const picked = ((rearPick && rearPick.nodeId === n.id && rearPick.unitId === u.id)
            || (wireMode?.from?.nid === n.id && wireMode.from.unitId === u.id)) ? ' picked' : '';
          const h = Math.max(ROWMIN, u.u * 56 * RZ), top = yCur, cy = h / 2;
          REARUNIT[u.id] = { top, h };
          const rightItems = items.filter(isRight), R = rightItems.length;
          let conns = '', li = 0, ri = 0;
          items.forEach(it => {
            let cx;
            if (isRight(it)) { cx = panelW - PADR - (R - ri) * STEP + STEP / 2; ri++; }
            else { cx = PADL + li * STEP + STEP / 2; li++; }
            let cc = null, role = '';
            if (it.port && /^(OUT|LNK)/.test(it.port)) { role = 'out'; cc = P.cables.find(c => c.from === n.id && c.fromUnit === u.id && c.pOut === it.port); }
            else if (it.port && /^IN/.test(it.port)) { role = 'in'; cc = P.cables.find(c => c.to === n.id && c.toUnit === u.id && c.pIn === it.port); }
            const tt = cc
              ? `${it.label} ${role === 'out' ? '⟶ אל' : '⟵ מ'}: ${endNameTxt(cc[role === 'out' ? 'to' : 'from'], cc[role === 'out' ? 'toUnit' : 'fromUnit'])} · כבל ${LBL2[cc.id]}`
              : (it.port ? `${it.label} — לחץ לחיבור (מכל סדר)` : it.label);
            const click = !it.port ? '' : cc ? `pickCable('${cc.id}')` : `portClick('${n.id}','${u.id}','${it.port}',${role === 'out'})`;
            const cursor = it.port ? 'cursor:pointer' : '';
            const col = cc ? CTYPES[cc.type].c : null;
            const ring = col ? `outline:3px solid ${col};border-radius:50%` : '';
            const chipBg = col || '#0d0f14';
            const chipTxt = col ? '#fff' : (role === 'out' ? '#ffcbb3' : role === 'in' ? '#bfe6d6' : '#c3cad6');
            /* עומס אום + הספק — רק מעל יציאות ספיקון עם כבל מחובר */
            let loadB = '';
            if (role === 'out' && it.t === 'speakon' && cc) {
              const L = chainLoad(n.id, u.id, it.port);
              if (L) {
                const chw = ampChW(u.name, L.z);
                const mo = ampMinOhm(u.name);
                const underMin = L.z < mo - 0.05;
                const bad = underMin || (chw && L.w > chw);
                const zTxt = L.z >= 10 ? L.z.toFixed(0) : L.z.toFixed(1).replace(/\.0$/, '');
                const wTxt = (L.est ? '~' : '') + L.w;
                loadB = `<div title="${L.n} רמקולים במקביל · עומס ${zTxt}Ω${underMin ? ' ⚠ מתחת למינ׳ ' + mo + 'Ω של המגבר!' : ' (מינ׳ ' + mo + 'Ω)'} · צריכה ${wTxt}W${L.est ? ' (הערכה 150W/יח׳)' : ''} · זמין ${chw || '?'}W לערוץ" style="position:absolute;left:50%;top:-15px;transform:translateX(-50%);background:${bad ? '#c1121f' : '#0f6e56'};color:#fff;font-size:8px;font-weight:800;padding:0 4px;border-radius:4px;line-height:12px;white-space:nowrap;box-shadow:0 0 0 1px rgba(0,0,0,.4);z-index:3">${underMin ? '⚠' : ''}${zTxt}Ω·${wTxt}${chw ? '/' + chw : ''}W</div>`;
              }
            }
            /* מספר/אות הכבל על המחבר — כמו בפאנל */
            const numB = cc ? `<span style="position:absolute;top:-8px;left:-8px;background:#fff;border:2px solid ${col};color:${col};border-radius:50%;min-width:15px;height:15px;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;z-index:4;padding:0 2px">${LBL2[cc.id]}</span>` : '';
            conns += `<div ${it.port ? `data-cport="${u.id}|${it.port}"` : ''} style="position:absolute;left:${cx - 18}px;top:${cy - 19}px;width:36px;height:38px;text-align:center;${cursor}" ${it.port ? `onpointerdown="event.stopPropagation()" onclick="event.stopPropagation();${click}"` : ''} title="${esc(tt)}">
              <div class="cglyph" style="position:relative;width:34px;height:34px;margin:0 auto;display:flex;align-items:center;justify-content:center">${loadB}${numB}
                <span style="display:inline-flex;transform:scale(1.32);${ring}">${rearGlyph(it.t)}</span>
                <div style="position:absolute;left:50%;bottom:-4px;transform:translateX(-50%);background:${chipBg};color:${chipTxt};font-size:7.5px;font-weight:800;padding:0 3px;border-radius:3px;line-height:11px;white-space:nowrap;box-shadow:0 0 0 1px rgba(0,0,0,.45)">${esc(it.label)}</div>
              </div></div>`;
          });
          rows += `<div class="runit${picked}" data-runit="${u.id}" style="top:${top}px;height:${h}px">
            <div class="runit-panel" style="width:${panelW}px;height:${h}px;flex:none">${conns}</div>
            <div style="width:${CHW}px;flex:none"></div>
            <div class="runit-lbl" style="background:${CATS[u.cat].c};width:${LBLW}px;height:${h}px;flex:none;position:relative"><b>${esc(u.name)}</b><small>${u.u}U · פאנל אחורי</small>
              <button class="runit-edit" onpointerdown="event.stopPropagation()" onclick="event.stopPropagation();rearEditor('${u.id}')" title="ערוך את פריסת הגב של הדגם" style="position:absolute;bottom:3px;left:3px">✎ גב</button></div></div>`;
          used += u.u;
          yCur += h + GAPV;
        }
        const railHrear = yCur;
        /* הקווים מצוירים אחרי הכנסה ל-DOM לפי מדידת מיקום המחברים בפועל — drawRearCables */
        const rw = `<svg class="rearsvg" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:5"></svg>`;
        d._drawRear = true;
        const rearHnat = railHrear + 12 + 64; /* גוף + שורת סיכום + רמז */
        body = `<div style="position:relative;height:${Math.round(rearHnat * RK)}px">
          <div style="position:absolute;top:0;right:0;width:${rearWnat}px;transform:scale(${RK});transform-origin:top right">
          <div class="rackbody rearbody"><div class="rearchassis" style="position:relative;height:${railHrear + 12}px">
          <div class="rails rear" style="height:${railHrear}px">${rows}</div>${rw}</div>
          <div class="muted" style="margin-top:6px">${used}U בשימוש · ${Math.max(0, n.ru - used)}U פנוי</div>
          <div class="rearhint">חיבור: לחץ על מחבר OUT ← ואז על מחבר IN במכשיר אחר (או על רמקול בתכנית) · ✎ גב = עריכת פריסת הדגם</div></div>
          </div></div>`;
      } else {
        for (const u of n.units) {
          const attr = ` data-uid="${u.id}"`;
          const UZ = UPX * (n.uz || 1);
          rows += `<div class="unit"${attr} title="${esc(ioTip(u.name))}" style="top:${u.pos * UZ}px;height:${u.u * UZ}px;background:${CATS[u.cat].c};font-size:${(n.uz || 1) >= 1.6 ? 12 : 10}px"><b>${esc(u.name)}</b><span>${u.panel ? '🧩' + u.panel.holes.length + '·' : ''}${u.u}U</span><button onpointerdown="event.stopPropagation()" onclick="event.stopPropagation();rearEditor('${u.id}')" title="עריכת המחברים של המוצר (פריסת הגב)" style="position:absolute;left:2px;top:2px;padding:0 4px;font-size:10px;line-height:16px;border-radius:5px;background:rgba(255,255,255,.88);border:none;cursor:pointer;z-index:2">🔌✎</button></div>`;
          used += u.u;
        }
        /* ＋ בכל רצף פנוי — הוספת יחידה ישר במקום */
        {
          const UZ3 = UPX * (n.uz || 1);
          const occ = [];
          n.units.forEach(u => { for (let i2 = u.pos; i2 < u.pos + u.u; i2++) occ[i2] = true; });
          let g = null;
          for (let i2 = 0; i2 <= n.ru; i2++) {
            if (i2 < n.ru && !occ[i2]) { if (!g) g = { start: i2, len: 0 }; g.len++; }
            else if (g) {
              rows += `<div style="position:absolute;top:${g.start * UZ3}px;height:${g.len * UZ3}px;left:0;right:0;display:flex;align-items:center;justify-content:center;pointer-events:none">
                <button onpointerdown="event.stopPropagation()" onclick="event.stopPropagation();addUnitAt('${n.id}',${g.start})" title="הוסף יחידה כאן — ${g.len}U פנוי" style="pointer-events:all;padding:0 10px;font-size:13px;line-height:19px;border-radius:7px;background:rgba(255,255,255,.14);color:#cfd6e4;border:1px dashed #5a6274;cursor:pointer">＋</button></div>`;
              g = null;
            }
          }
        }
        body = `<div class="rackbody"><div class="rails" style="height:${n.ru * UPX * (n.uz || 1)}px">${rows}</div>
          <div class="muted" style="margin-top:4px">${used}U בשימוש · ${Math.max(0, n.ru - used)}U פנוי</div></div>`;
      }
    } else if (n.kind === 'panel' && n.pmin) {
      /* פאנל מכווץ — אייקון קטן כמו רמקול מוקטן */
      const p = n.panel || (n.panel = defPanel());
      const cnt = P.cables.filter(c => c.from === n.id || c.to === n.id).length;
      d.className += ' mini';
      d.style.width = '';
      /* לחיצה על האייקון עצמו פותחת את הפאנל (גרירה עדיין עובדת) */
      d.innerHTML = `<div data-drag="${n.id}" title="${esc(n.name)}${n.mount ? ' · ' + esc(n.mount) : ''} · לחץ לפתיחה" style="cursor:grab;position:relative">
        <div class="mnum" style="background:#c9502e">${p.holes.length}</div>
        <div class="mic" style="border-color:#c9502e"><svg width="18" height="18" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2" fill="none" stroke="#c9502e" stroke-width="2"/><circle cx="8" cy="12" r="2" fill="#c9502e"/><circle cx="14" cy="12" r="2" fill="#c9502e"/></svg></div>
        ${cnt ? `<div class="mnum" style="background:#0f6e56;left:auto;right:-6px;top:-6px">${cnt}</div>` : ''}</div>`;
      d.addEventListener('pointerdown', e => {
        if (wireMode) { handleWireClick(n.id); e.stopPropagation(); e.preventDefault(); return; }
        sel = n.id; ui.tab = 'node';
        miniOpenOnTap(e, () => { n.pmin = false; render(); save(); }, n.id);
      });
      $('#nodes').appendChild(d);
      continue;
    } else if (n.kind === 'panel') {
      const p = n.panel || (n.panel = defPanel());
      const w = p.mode === 'matrix' ? Math.max(140, pCols(p) * 29 + 6) : (p.w || 240);
      d.style.width = (w + 22) + 'px';
      body = p.mode === 'free'
        ? `<div class="pnl" style="position:relative;height:${p.h || 140}px;display:block">${holesHTML(p, n.id, -1)}</div>`
        : `<div class="pnl" style="display:flex;flex-direction:column;gap:5px">${holesMatrixHTML(p, n.id, -1)}</div>`;
    } else {
      body = `<div class="pointbody">${esc(n.sub || 'נקודת קצה')}</div>`;
    }
    /* פאנל פתוח — כל השטח הריק שלו נגרר (חוץ מחורים/כפתורים) */
    if (n.kind === 'panel' && !n.pmin) d.dataset.drag = n.id;
    const isMini = n.kind === 'point' && (n.mini || (n.srcIid && !n.full));
    if (isMini) {
      d.className += ' mini';
      const mm = n.name.match(/\((\d+)\)(?!.*\(\d+\))/);
      /* צבע לפי קבוצת מוצר + אייקון לפי סוג: קולונה / סאב / רמקול */
      const baseNm = n.name.replace(/\s*\(\d+\)\s*$/, '');
      if (!(baseNm in MCOLS)) MCOLS[baseNm] = MPAL[Object.keys(MCOLS).length % MPAL.length];
      const mc = MCOLS[baseNm];
      let icon;
      /* סוג המוקד קובע את האייקון — פיקוד תאורה הוא לא רמקול */
      const mpt = n.ptype || (/מגבר|פרוססור|amplifier|processor|קרוסאובר/i.test(n.name) ? 'device'
        : /פיקוד|בקר|controller|control/i.test(n.name) ? 'device'
        : /מסך|מקרן|screen|projector|לד\b/i.test(n.name) ? 'screen'
        : /תאורה|light|par\b/i.test(n.name) ? 'light'
        : /מצלמה|camera/i.test(n.name) ? 'camera'
        : /מיקרופון|mic\b/i.test(n.name) ? 'mic'
        : /עמדת נגינה|DJ/i.test(n.name) ? 'device'
        : 'speaker');
      if (mpt === 'screen')
        icon = `<svg width="18" height="18" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="13" rx="2" fill="none" stroke="${mc}" stroke-width="2"/><path d="M8 21h8M12 17v4" stroke="${mc}" stroke-width="2"/></svg>`;
      else if (mpt === 'light')
        icon = `<svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="10" r="6" fill="none" stroke="${mc}" stroke-width="2"/><path d="M9 18h6M10 21h4M12 1v2M4 10H2M22 10h-2M5 3l1.5 1.5M19 3l-1.5 1.5" stroke="${mc}" stroke-width="1.8"/></svg>`;
      else if (mpt === 'camera')
        icon = `<svg width="18" height="18" viewBox="0 0 24 24"><rect x="2" y="7" width="14" height="11" rx="2" fill="none" stroke="${mc}" stroke-width="2"/><path d="M16 11l6-3v9l-6-3z" fill="${mc}"/></svg>`;
      else if (mpt === 'mic')
        icon = `<svg width="18" height="18" viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="12" rx="3" fill="none" stroke="${mc}" stroke-width="2"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4" stroke="${mc}" stroke-width="2" fill="none"/></svg>`;
      else if (mpt === 'amp')
        icon = `<svg width="18" height="18" viewBox="0 0 24 24"><rect x="2.5" y="6" width="19" height="12" rx="2" fill="none" stroke="${mc}" stroke-width="2"/><circle cx="7.5" cy="12" r="2.4" fill="none" stroke="${mc}" stroke-width="1.8"/><path d="M12.5 9.5h6M12.5 12h6M12.5 14.5h4" stroke="${mc}" stroke-width="1.6"/></svg>`;
      else if (mpt === 'proc')
        icon = `<svg width="18" height="18" viewBox="0 0 24 24"><rect x="2.5" y="6" width="19" height="12" rx="2" fill="none" stroke="${mc}" stroke-width="2"/><path d="M7 9v6M12 9v6M17 9v6" stroke="${mc}" stroke-width="1.6"/><circle cx="7" cy="14" r="1.5" fill="${mc}"/><circle cx="12" cy="10.5" r="1.5" fill="${mc}"/><circle cx="17" cy="12.5" r="1.5" fill="${mc}"/></svg>`;
      else if (mpt === 'player')
        icon = `<svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="${mc}" stroke-width="2"/><path d="M10 8.5l6 3.5-6 3.5z" fill="${mc}"/></svg>`;
      else if (mpt === 'device' || mpt === 'ap' || mpt === 'other')
        icon = `<svg width="18" height="18" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="10" rx="2" fill="none" stroke="${mc}" stroke-width="2"/><circle cx="8" cy="12" r="1.6" fill="${mc}"/><path d="M12 10.5h6M12 13.5h6" stroke="${mc}" stroke-width="1.6"/></svg>`;
      else if (/קולונ|column|441|INTERPID|SEQUENZA/i.test(n.name))
        icon = `<svg width="18" height="18" viewBox="0 0 24 24"><rect x="8.5" y="1" width="7" height="22" rx="2" fill="none" stroke="${mc}" stroke-width="2"/><circle cx="12" cy="6" r="1.4" fill="${mc}"/><circle cx="12" cy="10" r="1.4" fill="${mc}"/><circle cx="12" cy="14" r="1.4" fill="${mc}"/><circle cx="12" cy="18" r="1.4" fill="${mc}"/></svg>`;
      else if (/סאב|sub|NOMOS|TILL\s?18|SB-?\d|וופר/i.test(n.name))
        icon = `<svg width="18" height="18" viewBox="0 0 24 24"><rect x="2.5" y="4" width="19" height="16" rx="2" fill="none" stroke="${mc}" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="${mc}" stroke-width="2"/><circle cx="12" cy="12" r="1.6" fill="${mc}"/></svg>`;
      else
        icon = `<svg width="18" height="18" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" fill="none" stroke="${mc}" stroke-width="2"/><circle cx="12" cy="15" r="4" fill="none" stroke="${mc}" stroke-width="2"/><circle cx="12" cy="7" r="1.8" fill="${mc}"/></svg>`;
      d.innerHTML = `<div data-drag="${n.id}" title="${esc(n.name)}" style="cursor:grab;position:relative">
        <div class="mnum" style="background:${mc}">${mm ? mm[1] : '•'}</div>
        <div class="mic" style="border-color:${mc}">${icon}</div>
</div>`; /* לחיצה על האייקון פותחת — אין צורך בכפתור צף */
      /* לחיצה על האייקון עצמו פותחת את המוקד — כמו בארון ובפאנל; גרירה נשארת גרירה */
      d.addEventListener('pointerdown', e => {
        if (wireMode || pinMode || connPin || calMode || zoneMode || window.__moveEnd) return;
        miniOpenOnTap(e, () => toggleMini(n.id, false), n.id);
      });
    } else
    d.innerHTML = `<div class="hd" data-drag="${n.id}"><span>${esc(n.name)}${n.kind === 'panel' && n.mount ? ` <small style="opacity:.75">· ${esc(n.mount)}</small>` : ''}</span><span style="display:flex;gap:6px;align-items:center">${n.kind === 'point' ? `<span class="flip" onpointerdown="event.stopPropagation()" onclick="event.stopPropagation();toggleMini('${n.id}',true)" title="כווץ לאייקון" style="background:#ff8a50;color:#1a1e28;font-weight:800">⤡</span>` : ''}<small>${n.kind === 'rack' ? n.ru + 'U' : n.kind === 'panel' ? n.panel.holes.length + ' חורים · ' + P.cables.filter(c => c.from === n.id || c.to === n.id).length + ' חיבורים' : ''}</small>${n.kind === 'panel' ? `<span class="flip" onpointerdown="event.stopPropagation()" onclick="byId('${n.id}').pmin=${n.pmin ? 'false' : 'true'};render();save()" title="${n.pmin ? 'פתח פאנל' : 'כווץ פאנל'}" style="background:#ff8a50;color:#1a1e28;font-weight:800">${n.pmin ? '⤢' : '⤡'}</span><span class="flip" onpointerdown="event.stopPropagation()" onclick="multiView('${n.id}')" title="תצוגה מורחבת — כל הניתוב">⤢</span>` : ''}${flip}</span></div>` + body;
    d.addEventListener('pointerdown', e => {
      if (pinMode || calMode) return; /* מטופל ברמת המסמך */
      if (wireMode) {
        /* בגב ארון — חיבור אך ורק דרך מחברים (OUT→IN), לא לגוף המוצר */
        if (n.kind === 'rack' && n.rear) { e.stopPropagation(); e.preventDefault(); return; }
        const uel = e.target.closest('[data-uid],[data-runit]');
        handleWireClick(n.id, uel ? (uel.dataset.uid || uel.dataset.runit) : undefined);
        e.stopPropagation();
        e.preventDefault();
        return;
      }
      selZone = null;
      const ru = e.target.closest('[data-runit]');
      if (ru && n.rear) { sel = n.id; ui.tab = 'node'; pickRear(n.id, ru.dataset.runit); return; }
      const ue = e.target.closest('[data-uid]');
      if (ue && n.kind === 'rack' && !n.rear) {
        const uu = n.units.find(x => x.id === ue.dataset.uid);
        pendingU = { nid: n.id, uid: ue.dataset.uid, sx: e.clientX, sy: e.clientY, name: uu ? uu.name : '' };
      }
      sel = n.id; ui.tab = 'node';
      if (!e.target.closest('[data-drag]')) render();
    });
    if (n.kind === 'point') d.addEventListener('dblclick', e => {
      /* דאבל-קליק על רמקול → הצג כיסוי ובחר (הסיבוב עצמו בגרירת הידית) */
      e.stopPropagation(); sel = n.id; ui.tab = 'node'; P.showCoverage = true; render();
    });
    host.appendChild(d);
    if (d._drawRear) drawRearCables(n, d);
    if (n.kind === 'panel' && !n.pmin) drawPanelCables(n, d);
  }
  /* ידית סיבוב לרמקול הנבחר — גרירה ישירה, ללא כפתור */
  const sn = sel && byId(sel);
  if (sn && sn.kind === 'point' && P.showCoverage && (sn.disp ?? guessDisp(sn.name)) < 300) {
    const cx = 2200 - sn.x - 20, cy = sn.y + 24, a = (sn.aim ?? 0) * Math.PI / 180;
    const hx = cx + 48 * Math.cos(a), hy = cy + 48 * Math.sin(a);
    const hd = document.createElement('div');
    hd.style.cssText = `position:absolute;left:${hx - 11}px;top:${hy - 11}px;width:22px;height:22px;border-radius:50%;background:#c9502e;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);cursor:grab;z-index:6;touch-action:none`;
    hd.title = 'גרור לסיבוב הרמקול';
    hd.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" style="margin:2px"><path d="M12 4 V1 L8 5 l4 4 V6 a6 6 0 1 1-6 6" fill="none" stroke="#fff" stroke-width="2"/></svg>';
    hd.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); aiming = sn.id; });
    host.appendChild(hd);
  }
}
/* מצייר את חיבורי הגב לפי מדידת מיקום המחברים בפועל — הקו נוגע ממש במחבר */
/* מסלולי כבלים בתוך פאנל מחברים — מקצה הפאנל עד המחבר עצמו, בצבע הסוג */
function drawPanelCables(n, d) {
  const old = d.querySelector('.pcablesvg'); if (old) old.remove();
  if (n.hideInt) return; /* המשתמש ביקש פאנל נקי — בלי מסלולים פנימיים */
  const holes = d.querySelectorAll('[data-hole]');
  if (!holes.length) return;
  const z = getZ ? getZ() : 1;
  const rect = d.getBoundingClientRect();
  const W = rect.width / z, H = rect.height / z;
  let out = '';
  /* מפת מיקומי החורים מה-DOM */
  const holePos = {};
  holes.forEach(el => {
    const [nid, ui2, idx] = el.dataset.hole.split('|');
    if (+ui2 !== -1 || nid !== n.id) return;
    const r2 = el.getBoundingClientRect();
    holePos[+idx] = { hx: (r2.left + r2.width / 2 - rect.left) / z, hy: (r2.top + r2.height / 2 - rect.top) / z };
  });
  /* איסוף לפי כבלים — כל כבל (וגם כל ליבת מולטי) מקבל מעבר פנימי עד המחבר שלו,
     גם כשכמה כבלים יושבים על אותו חור */
  const ents = [];
  for (const c of P.cables) {
    if (!cableVisible(c)) continue;
    const sides = [];
    if (c.from === n.id) sides.push(c.fromHole ? [c.fromHole - 1] : (c.chans || []).map(x => x.a - 1));
    if (c.to === n.id) sides.push(c.toHole ? [c.toHole - 1] : (c.chans || []).map(x => x.b - 1));
    for (const idxs of sides) for (const hi of idxs) {
      const p2 = holePos[hi];
      if (p2) ents.push({ c, hx: p2.hx, hy: p2.hy });
    }
  }
  if (!ents.length) return;
  const LBLc = cableLabels();
  const nodeLeft = 2200 - n.x - W; /* שמאל הפאנל בקואורדינטות קנבס */
  ents.forEach((e, k) => {
    const col = CTYPES[e.c.type].c;
    const rowY = e.hy + 14 + (k % 3) * 2.5; /* חציה מתחת לשורת המחברים (השמות למעלה — האזור פנוי) */
    /* כל כבל נכנס מהצד הקרוב למחבר שלו — קו קצר, בלי זנב שחוצה חורים אחרים */
    const right = e.hx > W / 2;
    const inX = e.hx + (right ? 3 : -3);
    const edgeX = right ? W : 0;
    /* קו רציף: הכבל החיצוני מסתיים בדיוק בנקודה הזו על שפת הפאנל (PANELPORT),
       והמעבר הפנימי ממשיך ממנה ישר אל המחבר — בלי קטעים מנותקים */
    out += `<path d="M ${edgeX} ${rowY} L ${inX} ${rowY}" fill="none" stroke="${col}" stroke-width="1.8" stroke-linecap="round" opacity="0.85"/>`;
    PANELPORT[e.c.id + '|' + n.id] = { x: nodeLeft + edgeX, y: n.y + rowY };
    /* מספר הכבל בנקודת החיבור עצמה — פעם אחת, למטה, בלי לתפוס מקום מעל המחבר */
    const lb = LBLc[e.c.id];
    out += `<g style="pointer-events:all;cursor:pointer" onclick="pickCable('${e.c.id}')"><circle cx="${inX}" cy="${rowY}" r="6" fill="#fff" stroke="${col}" stroke-width="1.5"/><text x="${inX}" y="${rowY + 2.6}" text-anchor="middle" font-size="${String(lb).length > 2 ? 5.5 : 7}" font-weight="800" fill="${col}">${lb}</text></g>`;
  });
  if (!out) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'pcablesvg');
  svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:1';
  svg.innerHTML = out;
  d.appendChild(svg);
}
function drawRearCables(n, d) {
  const chassis = d.querySelector('.rearchassis'), svg = d.querySelector('.rearsvg');
  if (!chassis || !svg) return;
  /* הגב מוקטן ב-scale(K) — המדידות מוחזרות לקואורדינטות הטבעיות של השלדה,
     כי ה-SVG הפנימי עצמו כבר בתוך העטיפה המוקטנת */
  const cr = chassis.getBoundingClientRect(), dr = d.getBoundingClientRect(), Z = getZ() || 1;
  const K = d._rearK || 1, ZK = Z * K;
  const nodeLeftCanvas = 2200 - n.x - d.offsetWidth;
  const ctr = el => { const r = el.getBoundingClientRect(); return { x: (r.left + r.width / 2 - cr.left) / ZK, y: (r.top + r.height / 2 - cr.top) / ZK }; };
  const toCanvas = (chx, chy) => ({ x: nodeLeftCanvas + (cr.left + chx * ZK - dr.left) / Z, y: n.y + (cr.top + chy * ZK - dr.top) / Z });
  const port = {}, ubox = {};
  d.querySelectorAll('[data-cport]').forEach(el => { port[el.dataset.cport] = ctr(el); });
  d.querySelectorAll('.runit[data-runit]').forEach(el => { const r = el.getBoundingClientRect(); ubox[el.dataset.runit] = { top: (r.top - cr.top) / ZK, bottom: (r.bottom - cr.top) / ZK }; });
  const LBL = cableLabels();
  const badge = (x, y, t, c, id) => `<g style="pointer-events:all;cursor:pointer" onclick="pickCable('${id}')"><circle cx="${x}" cy="${y}" r="9" fill="#fff" stroke="${c}" stroke-width="1.8"/><text x="${x}" y="${y + 3.4}" text-anchor="middle" font-size="10" font-weight="800" fill="${c}">${t}</text></g>`;
  let out = '';
  /* פנימי: OUT → מטה → אופקי במרווח מעל היעד → מטה לתוך IN מלמעלה. אות בשני הקצוות. */
  P.cables.filter(c => c.from === n.id && c.to === n.id && c.fromUnit && c.toUnit && !n.hideInt && cableVisible(c)).forEach((c, k) => {
    const pa = port[c.fromUnit + '|' + (c.pOut || '')], pb = port[c.toUnit + '|' + (c.pIn || '')];
    if (!pa || !pb) return;
    const col = CTYPES[c.type].c, dir = pb.y > pa.y ? 1 : -1, tb = ubox[c.toUnit] || { top: pb.y - 40, bottom: pb.y + 40 };
    /* התעלה האופקית רצה ברווח שבין המכשירים — לא על מכשיר */
    const laneY = (dir > 0 ? tb.top - 8 : tb.bottom + 8) - dir * (k % 3) * 6;
    out += `<path d="M ${pa.x} ${pa.y} L ${pa.x} ${laneY} L ${pb.x} ${laneY} L ${pb.x} ${pb.y}" fill="none" stroke="${col}" stroke-width="2.6" stroke-linecap="square"/>`;
    out += `<circle cx="${pa.x}" cy="${pa.y}" r="4" fill="${col}" stroke="#fff" stroke-width="1.2"/><circle cx="${pb.x}" cy="${pb.y}" r="4" fill="${col}" stroke="#fff" stroke-width="1.2"/>`;
    out += badge(pa.x, pa.y + dir * 15, LBL[c.id], col, c.id) + badge(pb.x, pb.y - dir * 15, LBL[c.id], col, c.id);
  });
  /* חיצוני לרמקולים: מטה לתחתית המגבר → שמאלה החוצה. מספר על הכבל. */
  P.cables.filter(c => (c.from === n.id) !== (c.to === n.id) && (c.fromUnit || c.toUnit) && cableVisible(c)).forEach((c, k) => {
    const isFrom = c.from === n.id, uid = isFrom ? c.fromUnit : c.toUnit, p = isFrom ? c.pOut : c.pIn;
    const ub = ubox[uid];
    if (!ub) return;
    /* מחובר למחבר → יוצא מהמחבר. מחובר למכשיר בלבד → יוצא מאמצע שורת המכשיר,
       כדי שהנקודה תשב על המכשיר ולא תיפול לקצה הארון.
       (panelW לא קיים כאן — נגזר מרוחב השלדה בקואורדינטות הטבעיות) */
    const natW = cr.width / ZK;
    const pp = port[uid + '|' + (p || '')] || { x: Math.max(40, natW - 250), y: (ub.top + ub.bottom) / 2 };
    if (!pp) return;
    /* כל כבל יוצא בנתיב משלו — התעלה רצה ברווח שמתחת למכשיר, לא עליו */
    const col = CTYPES[c.type].c;
    const laneY = ub.bottom + 5 + (k % 8) * 5;   /* נתיב נפרד לכל כבל — בלי חזרות שמאחדות קווים */
    const exitX = 3, exitY = laneY;               /* היציאה באותו גובה של הנתיב — קו ישר ונפרד */
    out += `<path d="M ${pp.x} ${pp.y} L ${pp.x} ${laneY} L ${exitX + 14} ${laneY} L ${exitX} ${exitY}" fill="none" stroke="${col}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
    out += `<circle cx="${pp.x}" cy="${pp.y}" r="4" fill="${col}" stroke="#fff" stroke-width="1.2"/>`;
    out += badge(pp.x, (pp.y + laneY) / 2, LBL[c.id], col, c.id);
    REAREXIT[c.id] = { nodeId: n.id, pt: toCanvas(exitX, exitY) };
  });
  svg.innerHTML = out;
}
let rearPick = null, brush = 'xlrf', brushOn = false, panelEdit = null, wireMode = null, selHole = null;
/* לחיצה על חור: מברשת פעילה → צביעה · אחרת בחירה, וחור שני בפאנל אחר → מתיחת כבל בין החורים */
function holeTap(nid, ui, idx, h) {
  /* מצב העברת חיבור — הלחיצה הזו היא חור היעד */
  if (window.__moveEnd) {
    const mv = window.__moveEnd; window.__moveEnd = null;
    const { f } = mv;
    if (f.kind === 'direct') {
      const end = (f.c.from === mv.nid && f.c.fromHole === mv.idx + 1) ? 'from' : 'to';
      f.c[end] = nid;
      f.c[end + 'Hole'] = idx + 1;
      f.c[end === 'from' ? 'pOut' : 'pIn'] = 'חור ' + (idx + 1);
    } else {
      if (nid !== mv.nid) { uiToast('ליבת מולטי אפשר להעביר רק בתוך אותו פאנל'); return; }
      const ch = (f.c.chans || []).find(x => (f.side === 'a' ? x.a : x.b) === mv.idx + 1);
      if (ch) { if (f.side === 'a') ch.a = idx + 1; else ch.b = idx + 1; }
    }
    render(); save();
    uiToast('✓ החיבור הועבר לחור ' + (idx + 1));
    return;
  }
  if (brushOn) { h.conn = brush; render(); return; }
  if (selHole && !(selHole.nid === nid && selHole.ui === ui && selHole.idx === idx)) {
    if (selHole.nid !== nid || selHole.ui !== ui) { connectHoles(selHole, { nid, ui, idx, h }); return; }
  }
  /* חור מחובר — הצע ניתוק; דחייה = בחירת החור (התחלת חיבור חדש) */
  if (!selHole && ui < 0 && holeConnOf(nid, idx)) {
    disconnectHole(nid, idx).then(done => { if (!done) { selHole = { nid, ui, idx, conn: h.conn }; render(); } });
    return;
  }
  selHole = (selHole && selHole.nid === nid && selHole.ui === ui && selHole.idx === idx) ? null : { nid, ui, idx, conn: h.conn };
  render();
}
/* תצוגה מורחבת של קופסת מולטי — כל חור, מחבר, שם, ולאן מחובר */
function multiView(nid) {
  const n = byId(nid); if (!n || !n.panel) return;
  const LBL = cableLabels();
  const rows = n.panel.holes.map((h, i) => {
    const t = CONNS[h.conn] || CONNS.empty;
    const outC = P.cables.filter(c => c.from === nid && c.fromHole === i + 1);
    const inC = P.cables.filter(c => c.to === nid && c.toHole === i + 1);
    /* ליבות בתוך מולטי */
    const chansA = P.cables.filter(c => c.from === nid && c.chans && c.chans.some(x => x.a === i + 1));
    const chansB = P.cables.filter(c => c.to === nid && c.chans && c.chans.some(x => x.b === i + 1));
    const conns = [...outC.map(c => `⟵ אל ${endName(c.to, c.toUnit)}${c.pIn ? ' · ' + esc(c.pIn) : ''} <span class="badge" style="background:${CTYPES[c.type].c}">${LBL[c.id]}</span>`),
      ...inC.map(c => `⟶ מ-${endName(c.from, c.fromUnit)}${c.pOut ? ' · ' + esc(c.pOut) : ''} <span class="badge" style="background:${CTYPES[c.type].c}">${LBL[c.id]}</span>`),
      ...chansA.map(c => { const ch = c.chans.find(x => x.a === i + 1); return `🧵 ליבה במולטי ${LBL[c.id]} ⟵ ${endName(c.to, c.toUnit)} חור ${ch.b}`; }),
      ...chansB.map(c => { const ch = c.chans.find(x => x.b === i + 1); return `🧵 ליבה במולטי ${LBL[c.id]} ⟶ ${endName(c.from, c.fromUnit)} חור ${ch.a}`; })];
    const allC = [...outC, ...inC, ...chansA, ...chansB];
    return `<div style="display:flex;gap:8px;align-items:center;padding:4px 8px;border-bottom:1px solid #eee;${conns.length ? 'background:#f4faf6' : ''}">
      <span style="width:26px;text-align:center;font-weight:800">${i + 1}</span>
      <span style="width:28px">${connGlyph(h.conn)}</span>
      <span style="width:120px;font-size:11px">${esc(h.label || t.n)}</span>
      <span style="flex:1;font-size:11px">${conns.length ? conns.map((c2, j) => `<div ${j ? 'style="margin-top:2px"' : ''} onclick="pickCable('${allC[j].id}');document.getElementById('multiVOv').remove()" style="cursor:pointer">${c2}</div>`).join('') : '<span class="muted">— פנוי —</span>'}</span>
    </div>`;
  }).join('');
  const old = document.getElementById('multiVOv'); if (old) old.remove();
  const ov = document.createElement('div');
  ov.id = 'multiVOv';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(20,24,32,.5);z-index:99;display:flex;align-items:center;justify-content:center';
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  ov.innerHTML = `<div style="background:#fff;border-radius:12px;padding:16px;max-width:640px;width:94%;max-height:86vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,.35)">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><b style="flex:1">🧩 ${esc(n.name)} — ניתוב מלא (${n.panel.holes.length} חורים)</b>
    <button onclick="document.getElementById('multiVOv').remove()">✕</button></div>
    <p class="muted" style="margin:0 0 8px;font-size:11px">שורה ירקרקה = חור מחובר. לחיצה על חיבור פותחת את הכבל. חיבור חדש: סגור, לחץ על חור (סימון 1) ואז על חור בפאנל אחר.</p>
    ${rows}</div>`;
  document.body.appendChild(ov);
}
async function connectHoles(a, b) {
  const unitIdOf = (nid, ui) => { const n = byId(nid); return (ui >= 0 && n && n.units && n.units[ui]) ? n.units[ui].id : undefined; };
  const typeOf = k => /rj45/.test(k) ? 'cat' : /bnc|hdmi/.test(k) ? 'sdi' : /fiber|אופטי/.test(k) ? 'fiber' : /speakon/.test(k) ? 'nl4' : /pwr/.test(k) ? 'pwr' : 'xlr';
  /* מולטי נושא סוג אחד בלבד — כבל מולטי XLR לא מכיל רשת/HDMI/אופטי.
     לכן רק XLR↔XLR רוכב על מולטי קיים כליבה; כל סוג אחר מקבל קו משלו. */
  const isXlr = k => /^xlr/i.test(k || '');
  if (!isXlr(a.conn) !== !isXlr(b.h.conn)) {
    const nm = k => (CONNS[k] && CONNS[k].n) || k || 'ריק';
    if (!(await uiConfirm(`חיבור בין סוגים שונים: ${nm(a.conn)} ↔ ${nm(b.h.conn)}.\nלרוב זו טעות — כבל מחבר שני מחברים מאותו סוג.\n\nלהמשיך בכל זאת?`))) { selHole = null; render(); return; }
  }
  const existing = isXlr(a.conn) && isXlr(b.h.conn) && P.cables.find(c => c.type === 'multi' &&
    ((c.from === a.nid && c.to === b.nid) || (c.from === b.nid && c.to === a.nid)));
  if (existing) {
    existing.chans = existing.chans || [];
    const fwd = existing.from === a.nid;
    const chan = { a: fwd ? a.idx + 1 : b.idx + 1, b: fwd ? b.idx + 1 : a.idx + 1 };
    if (!existing.chans.some(x => x.a === chan.a && x.b === chan.b)) existing.chans.push(chan);
    /* הצעה: לחבר את כל חורי ה-XLR התואמים במספר בין שני הפאנלים דרך המולטי */
    if (a.ui < 0 && b.ui < 0) {
      const pa = byId(a.nid)?.panel, pb = byId(b.nid)?.panel;
      if (pa && pb) {
        const cand = [];
        const NA = Math.min(pa.holes.length, pb.holes.length);
        for (let i = 0; i < NA; i++) {
          if (isXlr(pa.holes[i].conn) && isXlr(pb.holes[i].conn)) {
            const ch2 = { a: fwd ? i + 1 : i + 1, b: i + 1 };
            if (!existing.chans.some(x => x.a === i + 1 && x.b === i + 1)) cand.push(i + 1);
          }
        }
        if (cand.length >= 2 && await uiConfirm(`לחבר אוטומטית את כל ${cand.length} חורי ה-XLR התואמים (מספר-למספר) דרך המולטי?`))
          cand.forEach(i => existing.chans.push({ a: i, b: i }));
      }
    }
    if (!existing.cores || existing.cores < existing.chans.length) existing.cores = Math.max(existing.cores || 0, existing.chans.length);
    selHole = null; selCable = existing.id; ui.tab = 'cable';
    render(); save();
    return;
  }
  /* שני פאנלים עם כמה XLR תואמים ואין ביניהם מולטי — מציעים מולטי אחד
     שנושא את כולם, במקום N כבלים בודדים. זה מה שקורה בפועל בשטח. */
  if (isXlr(a.conn) && isXlr(b.h.conn) && a.ui < 0 && b.ui < 0) {
    const pa = byId(a.nid)?.panel, pb = byId(b.nid)?.panel;
    if (pa && pb) {
      const pairs = [];
      for (let i = 0; i < Math.min(pa.holes.length, pb.holes.length); i++)
        if (isXlr(pa.holes[i].conn) && isXlr(pb.holes[i].conn)) pairs.push(i + 1);
      if (pairs.length >= 2) {
        const asMulti = await uiConfirm(`בשני הפאנלים יש ${pairs.length} חורי XLR תואמים.\n\nמולטי אחד = כבל שנושא את כל ${pairs.length} הליבות (מספר אחד במפתח).`, { okText: 'מולטי אחד לכולם', cancelText: 'רק החיבור הבודד' });
        if (asMulti) {
          const cm = { id: uid('c'), from: a.nid, fromUnit: unitIdOf(a.nid, a.ui), to: b.nid, toUnit: unitIdOf(b.nid, b.ui),
            type: 'multi', qty: '1', spec: '', note: 'מולטי ' + pairs.length + '× XLR', conn: 'xlrm', conn2: 'xlrf',
            cores: pairs.length, chans: pairs.map(i => ({ a: i, b: i })),
            pOut: 'חורים ' + pairs[0] + '–' + pairs[pairs.length - 1], pIn: 'חורים ' + pairs[0] + '–' + pairs[pairs.length - 1] };
          if (P.scale) { const na = byId(cm.from), nb = byId(cm.to); if (na && nb && na !== nb) cm.len = +(Math.hypot(na.x - nb.x, na.y - nb.y) * P.scale).toFixed(1); }
          P.cables.push(cm);
          selHole = null; selCable = cm.id; ui.tab = 'cable';
          render(); save();
          return;
        }
      }
    }
  }
  const c = { id: uid('c'), from: a.nid, fromUnit: unitIdOf(a.nid, a.ui), to: b.nid, toUnit: unitIdOf(b.nid, b.ui),
    type: typeOf(a.conn || b.h.conn || ''), qty: '1', spec: '', note: '',
    pOut: 'חור ' + (a.idx + 1), pIn: 'חור ' + (b.idx + 1), fromHole: a.idx + 1, toHole: b.idx + 1 };
  c.conn = a.conn && a.conn !== 'empty' ? a.conn : connFor(c.type);
  c.conn2 = b.h.conn && b.h.conn !== 'empty' ? b.h.conn : undefined;
  if (P.scale) { const na = byId(c.from), nb = byId(c.to); if (na && nb && na !== nb) c.len = +(Math.hypot(na.x - nb.x, na.y - nb.y) * P.scale).toFixed(1); }
  P.cables.push(c);
  selHole = null; selCable = c.id; ui.tab = 'cable';
  render();
  offerCableLink(c);
}
/* ניתוק חור — כבל ישיר או ליבה בתוך מולטי */
function holeConnOf(nid, idx) {
  for (const c of P.cables) {
    if (c.from === nid && c.fromHole === idx + 1) return { c, kind: 'direct' };
    if (c.to === nid && c.toHole === idx + 1) return { c, kind: 'direct' };
    if (c.chans) {
      if (c.from === nid && c.chans.some(x => x.a === idx + 1)) return { c, kind: 'chan', side: 'a' };
      if (c.to === nid && c.chans.some(x => x.b === idx + 1)) return { c, kind: 'chan', side: 'b' };
    }
  }
  return null;
}
async function disconnectHole(nid, idx) {
  const f = holeConnOf(nid, idx);
  if (!f) return false;
  const LBL = cableLabels();
  const isDirect = f.kind === 'direct';
  /* שלוש דרכים: העברה למחבר אחר · ניתוק · ביטול */
  return new Promise(res => {
    const ov = uiModal(`
      <p style="font-size:13.5px;margin:0 0 12px;line-height:1.55">${isDirect ? `כבל <b>${LBL[f.c.id]}</b> מחובר לחור ${idx + 1}.` : `ליבה ${idx + 1} מחוברת למולטי (כבל <b>${LBL[f.c.id]}</b>).`}</p>
      <button class="primary" data-move style="width:100%;margin-bottom:6px">➡ העבר למחבר אחר — ואז לחץ על חור היעד</button>
      <button data-del style="width:100%;margin-bottom:6px;background:#f3d9d2;color:#8c2f16">🗑 ${isDirect ? 'נתק — הכבל יימחק' : 'נתק את הליבה (המולטי נשאר)'}</button>
      <button data-cancel style="width:100%">ביטול</button>`);
    const done = v => { ov.remove(); res(v); };
    ov.querySelector('[data-move]').onclick = () => {
      window.__moveEnd = { f, nid, idx };
      done(true);
      uiToast('🎯 לחץ על החור שאליו להעביר את החיבור (Esc לביטול)');
      render();
    };
    ov.querySelector('[data-del]').onclick = () => {
      if (isDirect) delCable(f.c.id);
      else { f.c.chans = f.c.chans.filter(x => f.side === 'a' ? x.a !== idx + 1 : x.b !== idx + 1); render(); save(); }
      done(true);
    };
    ov.querySelector('[data-cancel]').onclick = () => done(false);
    ov.addEventListener('click', e => { if (e.target === ov) done(false); });
  });
}
function toggleWire() { wireMode = wireMode ? null : { from: null }; if (!wireMode) wireStock = null; render(); }
function wireTypeFor(nid) {
  const n = byId(nid);
  const s = ((n?.name || '') + ' ' + (n?.sub || ''));
  if (isActiveSub(s)) return 'xlr'; /* סאב מוגבר — סיגנל RCA/XLR (עד ~10 מ׳), לא קו הגברה */
  if (/(רמקול|SPECTRA|NOMOS|GRAVIS|CA\s?106|סאב|פיל|מוניטור|דיליי|speaker)/i.test(s)) return 'nl4';
  if (/(מקרן|proj|וידאו)/i.test(s)) return 'sdi';
  if (/(תאור|light|dmx)/i.test(s)) return 'dmx';
  if (/(רשת|אינטרנט|ראוטר)/i.test(s)) return 'cat';
  return 'multi';
}
function handleWireClick(nid, unitId) {
  if (!wireMode.from) {
    wireMode.from = { nid, unitId };
    render();
    return;
  }
  const f = wireMode.from;
  if (f.nid === nid && (f.unitId || null) === (unitId || null)) return;
  const c = { id: uid('c'), from: f.nid, fromUnit: f.unitId, to: nid, toUnit: unitId,
    type: wireMode.chain ? 'nl4' : (wireTypeFor(nid) === 'multi' ? wireTypeFor(f.nid) : wireTypeFor(nid)),
    qty: '1', spec: '', note: f.nid === nid ? 'חיבור פנימי' : '' };
  if (wireMode.pOut) c.pOut = wireMode.pOut; /* הכבל משויך ליציאה שנבחרה בפנל */
  if (wireMode.pIn) c.pIn = wireMode.pIn; /* וגם לכניסה שנבחרה ביעד */
  /* מילוי מרחק אוטומטי מהתכנית המכוילת — לפני חיוב הגליל */
  if (P.scale) {
    const na = byId(c.from), nb = byId(c.to);
    if (na && nb && na !== nb) c.len = +(Math.hypot(na.x - nb.x, na.y - nb.y) * P.scale).toFixed(1);
  }
  /* חיבור פנימי באותו ארון (למשל LNK→IN) — ברירת מחדל כבל XLR קצר 1 מ׳ */
  if (f.nid === nid && !c.len) c.len = 1;
  const usedStock = wireStock;
  if (usedStock) applyStockRef(usedStock, '', c);
  /* מילוי אוטומטי של שני המחברים + צריכת 2 מחברים מהרשימה (לא לכבל מוכן) */
  c.conn = c.conn || connFor(c.type);
  c.conn2 = c.conn2 || c.conn;
  if (!usedStock || usedStock.startsWith('reel|')) autoConnectors(c);
  autoCores(c);
  P.cables.push(c);
  if (usedStock) {
    /* נשארים במצב חיבור עם אותו כבל — Esc או הכפתור מסיימים */
    wireMode = { from: null };
    selCable = c.id;
    render();
    return;
  }
  wireMode = null;
  selCable = c.id; ui.tab = 'cable';
  render();
  offerCableLink(c);
}
/* ===== קישור כבל חדש להצעת המחיר =====
   כבל חדש שנמדד בתכנית צריך להופיע בכסף: אם יש כבר גליל/כבל מאותו סוג
   בהצעה — מוסיפים אליו את המטרים. אם אין — בוחרים מוצר מתוך הקטלוג. */
function offerCableLink(c) {
  if (!c || c.stockRef || c.inst === 'exist') return; /* קיים במקום = לא עולה כסף */
  const L = +c.len || 0;
  const it = impItems.find(x => x.dest === 'reel' && (x.type || 'nl4') === c.type)
    || impItems.find(x => x.dest === 'cable' && (x.type || 'multi') === c.type);
  if (it) {
    /* שלוש דרכים: לשייך למוצע · לבחור כבל אחר מהקטלוג · לבטל */
    const ov = uiModal(`
      <p style="font-size:13.5px;margin:0 0 12px;line-height:1.55">📏 הכבל נמדד: <b>${L || '?'} מ׳</b> (${CTYPES[c.type].n}).<br>יש פריט מתאים בהצעה: <b>"${esc(it.name.slice(0, 46))}"</b></p>
      <button class="primary" data-ok style="width:100%;margin-bottom:6px">✓ שייך אליו והוסף את המטרים</button>
      <button data-other style="width:100%;margin-bottom:6px">🔍 לא מתאים — בחר כבל אחר מהקטלוג</button>
      <button data-cancel style="width:100%">ביטול — בלי שיוך</button>`);
    const done = () => ov.remove();
    ov.querySelector('[data-ok]').onclick = () => {
      done();
      const st = ensureStockItem(it);
      applyStockRef((it.dest === 'reel' ? 'reel|' : 'cable|') + st.id, '', c);
      render(); save();
    };
    ov.querySelector('[data-other]').onclick = () => { done(); offerCablePick(c); };
    ov.querySelector('[data-cancel]').onclick = done;
    ov.addEventListener('click', e => { if (e.target === ov) done(); });
    return;
  }
  offerCablePick(c);
}
function offerCablePick(c) {
  const old = document.getElementById('ocpOv'); if (old) old.remove();
  const ov = document.createElement('div');
  ov.id = 'ocpOv';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(20,24,32,.5);z-index:99;display:flex;align-items:center;justify-content:center';
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  ov.innerHTML = `<div style="background:#fff;border-radius:12px;padding:16px;max-width:460px;width:94%;max-height:76vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,.35)">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><b style="flex:1">📏 כבל חדש (${c.len || '?'} מ׳ · ${CTYPES[c.type].n}) — אין פריט מתאים בהצעה</b><button onclick="document.getElementById('ocpOv').remove()">✕</button></div>
    <p class="muted" style="margin:0 0 8px;font-size:12px">בחר מוצר כבל מהקטלוג — ייכנס להצעה כגליל והמטרים של הקו יירשמו עליו:</p>
    <div style="display:flex;gap:5px;margin-bottom:6px">
      ${[['all', 'הכל'], ['reel', '🧵 גליל / לפי מטר'], ['ready', '🔌 כבל מוכן']].map(([v, l]) => `<button data-ocpf="${v}" onclick="window.__ocpF='${v}';ocpSearch(document.getElementById('ocpQ').value,'${c.id}');document.querySelectorAll('[data-ocpf]').forEach(b2=>{b2.style.background=b2.dataset.ocpf===window.__ocpF?'#c9502e':'';b2.style.color=b2.dataset.ocpf===window.__ocpF?'#fff':''})" style="flex:1;padding:3px;font-size:11px;${v === 'all' ? 'background:#c9502e;color:#fff' : ''}">${l}</button>`).join('')}
    </div>
    <input id="ocpQ" placeholder="🔍 חפש כבל בקטלוג…" style="width:100%" oninput="ocpSearch(this.value,'${c.id}')">
    <div id="ocpRes" style="margin-top:6px"></div>
    <button style="width:100%;margin-top:8px;background:#f4f2ec" onclick="document.getElementById('ocpOv').remove()">דלג — בלי שיוך להצעה</button>
  </div>`;
  document.body.appendChild(ov);
  const seed = { dmx: 'DMX', cat: 'רשת', nl4: 'רמקול', multi: 'מולטי', xlr: 'XLR', fiber: 'אופטי', sdi: 'BNC', hdmi: 'HDMI', pwr: 'חשמל' }[c.type] || '';
  const qEl0 = document.getElementById('ocpQ'); if (qEl0) qEl0.value = seed;
  ocpSearch(seed, c.id);
  const q = document.getElementById('ocpQ'); if (q) q.focus();
}
function ocpSearch(q, cid) {
  const el = document.getElementById('ocpRes'); if (!el) return;
  const toks = String(q || '').toLowerCase().split(/\s+/).filter(Boolean);
  const mode = window.__ocpF || 'all';
  const isReel = n => /גליל|לפי מטר|מטר רץ|למטר|100\s?מ|305\s?מ/i.test(n);
  const hits = [];
  if (typeof ERP_ITEMS !== 'undefined')
    for (const [k, n] of ERP_ITEMS) {
      if (hits.length >= 12) break;
      if (!n) continue; /* פריטים בלי שם בקטלוג */
      /* חייב להיות כבל/גליל באמת — שם שרק מזכיר משהו אחר לא נכנס */
      if (!/כבל|גליל|cable|מולטי/i.test(n)) continue;
      if (mode === 'reel' && !isReel(n)) continue;
      if (mode === 'ready' && isReel(n)) continue;
      const l = n.toLowerCase();
      if (toks.every(t => l.includes(t))) hits.push([k, n, isReel(n)]);
    }
  hits.sort((a, b) => byStockThenSold(a[0], b[0]));
  el.innerHTML = hits.map(([k, n, rl]) => `<button style="display:flex;gap:6px;align-items:center;width:100%;text-align:right;margin-bottom:4px;font-size:12px" onclick="ocpPick('${k}','${esc(n).replace(/'/g, '&#39;')}','${cid}',${rl ? 1 : 0})"><span style="flex:1;text-align:right">${rl ? '🧵' : '🔌'} ${esc(n.slice(0, 46))}</span>${stockTag(k)}</button>`).join('')
    || '<p class="muted" style="font-size:12px">אין תוצאות — נסה מילה אחרת</p>';
}
function ocpPick(key, name, cid, isReel) {
  const c = cById(cid); if (!c) return;
  const it = isReel
    ? { on: true, qty: 1, name, key, src: 'שיוך כבל מהתכנית', dest: 'reel', cat: 'other', u: 1, type: c.type, len: 100, iid: uid('i') }
    : { on: true, qty: 1, name, key, src: 'שיוך כבל מהתכנית', dest: 'cable', cat: 'other', u: 1, type: c.type, iid: uid('i') };
  autoPrice(it); impItems.push(it);
  const st = ensureStockItem(it);
  applyStockRef((isReel ? 'reel|' : 'cable|') + st.id, '', c);
  const ov = document.getElementById('ocpOv'); if (ov) ov.remove();
  render(); save();
}
/* בכל חיבור: מציע/צורך 2 מחברים מתאימים מרשימת הפריטים */
/* מונחי חיפוש למחבר-שטח לפי סוג המחבר בפועל — HDMI↔HDMI, רשת↔keystone, XLR↔XLR */
const CONN_SEARCH = {
  speakon: /ספיקון|speakon|NL4/i, xlrf: /XLR/i, xlrm: /XLR/i,
  rj45: /keystone|קיסטון|RJ ?45/i, hdmi: /HDMI/i, bnc: /BNC/i, fiber: /אופטי|LC |SC /i, pwr: /פאוור|powercon/i
};
async function autoConnectors(c) {
  const kind = c.conn || connFor(c.type);
  if (kind === 'empty') return;
  const re = CONN_SEARCH[kind] || /מחבר/i;
  /* 1. מחבר קיים ברשימת הפריטים — מאותו סוג בדיוק */
  let it = impItems.find(x => x.dest === 'conn' && ((x.kind || connKindOf(x.name)) === kind))
    || impItems.find(x => /מחבר|קונקטור|connector|keystone|קיסטון/i.test(x.name) && re.test(x.name));
  if (it && it.dest !== 'conn') { it.dest = 'conn'; it.kind = it.kind || kind; }
  /* 2. חיפוש בקטלוג ה-ERP — מחבר מתאים אמיתי (למשל keystone זכר לרשת) */
  if (!it && typeof ERP_ITEMS !== 'undefined') {
    const hit = ERP_ITEMS.find(([k, n]) => /מחבר|קונקטור|connector|keystone|קיסטון/i.test(n) && re.test(n));
    if (hit) {
      it = { on: true, qty: 0, name: hit[1], key: hit[0], src: 'אוטומטי — קטלוג', dest: 'conn', kind, cat: 'other', u: 1, iid: uid('i') };
      impItems.push(it); autoPrice(it);
    }
  }
  if (!it) {
    const nm = 'מחבר ' + ((CONNS[kind] && CONNS[kind].n) || kind);
    if (!(await uiConfirm('לחיבור זה דרושים 2× ' + nm + ' ואין כזה ברשימת הפריטים.\nלהוסיף אותו להצעת המחיר ולצרוך 2 יחידות?'))) return;
    it = { on: true, qty: 0, name: nm, src: 'אוטומטי — חיבור כבל', dest: 'conn', kind, cat: 'other', u: 1, iid: uid('i') };
    impItems.push(it);
    autoPrice(it);
  }
  const s = ensureStockItem(it);
  s.kind = s.kind || kind;
  s.used = (s.used || 0) + 2;
  if (s.used > (s.qty || 0)) s.qty = s.used;
  bumpPlaced(it); bumpPlaced(it); /* ההערה נשארת ריקה — המחברים מוצגים בשדות המחבר */
  c.connUse = it.iid; /* נשמר כדי להחזיר 2 מחברים אם הכבל יימחק */
}
function wireStockName() {
  if (!wireStock) return '';
  ensureStock(P);
  const [kind, id] = wireStock.split('|');
  const s = (kind === 'reel' ? P.stock.reels : P.stock.cables).find(s => s.id === id);
  return s ? s.name.slice(0, 30) : '';
}
document.addEventListener('keydown', e => {
  /* Ctrl/Cmd+Z לבטל · Ctrl+Shift+Z או Ctrl+Y לבצע שוב */
  if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z' || e.key === 'y')) {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    e.preventDefault();
    if (e.key === 'y' || e.shiftKey) redo(); else undo();
    return;
  }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    /* מחיקת מוצר/כבל מסומן במקלדת — לא בזמן הקלדה בשדה */
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    if (selMulti.size) {
      uiConfirm('למחוק ' + selMulti.size + ' רמקולים/מוקדים מסומנים?').then(ok => {
        if (!ok) return;
        [...selMulti].forEach(id => { const n = byId(id); if (n && n.srcIid) unplace(n.srcIid); });
        P.nodes = P.nodes.filter(n => !selMulti.has(n.id));
        P.cables = P.cables.filter(c => byId(c.from) && byId(c.to));
        selMulti.clear(); sel = null; render(); save();
      });
      e.preventDefault(); return;
    }
    if (selCable) { delCable(selCable); e.preventDefault(); return; }
    if (sel) { delNode(sel); e.preventDefault(); return; }
    return;
  }
  if (e.key !== 'Escape') return;
  if (aiming) { aiming = null; save(); render(); return; }
  if (selHole || brushOn) { selHole = null; brushOn = false; render(); return; }
  if (sketchMode) { if (sketchMode.cur && sketchMode.cur.length) { sketchMode.cur = []; renderWires(); } else sketchEnd(); return; }
  if (wireMode || pinMode || calMode || zoneMode || connPin || replFor || window.__moveEnd) { wireMode = null; wireStock = null; pinMode = null; calMode = null; zoneMode = null; connPin = null; replFor = null; window.__moveEnd = null; render(); }
});
function connGlyph(conn) {
  const C = (CONNS[conn] || CONNS.empty).c;
  const S = 'width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg"';
  switch (conn) {
    case 'xlrf': return `<svg ${S}><circle cx="11" cy="11" r="9" fill="#fff" stroke="${C}" stroke-width="1.8"/><circle cx="11" cy="6.4" r="1.5" fill="${C}"/><circle cx="6.8" cy="14" r="1.5" fill="${C}"/><circle cx="15.2" cy="14" r="1.5" fill="${C}"/><text x="11" y="13.8" font-size="7" font-weight="700" fill="${C}" text-anchor="middle" font-family="Arial">F</text></svg>`;
    case 'xlrm': return `<svg ${S}><circle cx="11" cy="11" r="9" fill="${C}"/><circle cx="11" cy="6.4" r="1.5" fill="none" stroke="#fff" stroke-width="1"/><circle cx="6.8" cy="14" r="1.5" fill="none" stroke="#fff" stroke-width="1"/><circle cx="15.2" cy="14" r="1.5" fill="none" stroke="#fff" stroke-width="1"/><text x="11" y="13.8" font-size="7" font-weight="700" fill="#fff" text-anchor="middle" font-family="Arial">M</text></svg>`;
    case 'speakon': return `<svg ${S}><circle cx="11" cy="11" r="9" fill="#fff" stroke="${C}" stroke-width="1.8"/><rect x="9.6" y="2" width="2.8" height="4.2" fill="${C}"/><circle cx="11" cy="12" r="3.2" fill="none" stroke="${C}" stroke-width="1.6"/></svg>`;
    case 'bnc': return `<svg ${S}><circle cx="11" cy="11" r="9" fill="#fff" stroke="${C}" stroke-width="1.8"/><circle cx="11" cy="11" r="4.6" fill="none" stroke="${C}" stroke-width="1.4"/><circle cx="11" cy="11" r="1.6" fill="${C}"/></svg>`;
    case 'rj45': return `<svg ${S}><rect x="3" y="4" width="16" height="14" rx="2" fill="#fff" stroke="${C}" stroke-width="1.8"/><path d="M6.5 4.9v3.6M9.5 4.9v3.6M12.5 4.9v3.6M15.5 4.9v3.6" stroke="${C}" stroke-width="1.2"/><rect x="8" y="14" width="6" height="4" fill="${C}"/></svg>`;
    case 'hdmi': return `<svg ${S}><path d="M2.5 7.5h17v5l-3.2 3.2H5.7L2.5 12.5z" fill="#fff" stroke="${C}" stroke-width="1.8"/><path d="M6 10.5h10" stroke="${C}" stroke-width="1.4"/></svg>`;
    case 'fiber': return `<svg ${S}><rect x="2.5" y="6" width="17" height="10" rx="2.5" fill="#fff" stroke="${C}" stroke-width="1.8"/><circle cx="8" cy="11" r="2" fill="${C}"/><circle cx="14" cy="11" r="2" fill="${C}"/></svg>`;
    case 'pwr': return `<svg ${S}><circle cx="11" cy="11" r="9" fill="#fff" stroke="${C}" stroke-width="1.8"/><path d="M11 4.5v6" stroke="${C}" stroke-width="1.8" stroke-linecap="round"/><path d="M7.2 8.2a5.4 5.4 0 1 0 7.6 0" fill="none" stroke="${C}" stroke-width="1.8" stroke-linecap="round"/></svg>`;
    default: return `<svg ${S}><circle cx="11" cy="11" r="8.5" fill="none" stroke="#bbb" stroke-width="1.6" stroke-dasharray="3 2.4"/></svg>`;
  }
}
function holeCell(p, h, idx, nid, ui, ro, noPos) {
  const t = CONNS[h.conn] || CONNS.empty;
  const isSel = selHole && selHole.nid === nid && selHole.ui === ui && selHole.idx === idx;
  /* חורים מחוברים — עיגול צבעוני (כולל ליבות בתוך מולטי) */
  const hcf = !ro && holeConnOf(nid, idx);
  const hc = hcf && hcf.c;
  const selStyle = isSel ? 'outline:3px solid #ff8a50;border-radius:50%;' : (hc ? `outline:2.5px solid ${CTYPES[hc.type].c};border-radius:50%;` : '');
  const selBadge = isSel ? '<span style="position:absolute;top:-7px;right:-7px;background:#ff8a50;color:#fff;border-radius:50%;width:15px;height:15px;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;z-index:3">1</span>' : '';
  const hole = `<div class="hole gph" ${ro ? '' : `data-hole="${nid}|${ui}|${idx}"`} style="position:relative;${selStyle}" title="${t.n}${h.label ? ' · ' + esc(h.label) : ''}${hc ? ' · מחובר (כבל)' : ''}${isSel ? ' · נבחר — לחץ על חור בפאנל אחר לחיבור' : ''}">${connGlyph(h.conn)}${selBadge}</div>`;
  const num = `<span class="hnum">${idx + 1}</span>`;
  /* מקום קבוע לשם — גם כשאין תווית, כדי שכל המחברים יתיישרו באותו גובה */
  const lbl = `<span class="hlbl">${esc(h.label || ' ')}</span>`;
  /* מספר הכבל מצויר בנקודת החיבור למטה (drawPanelCables) — לא תג נוסף מעל המחבר */
  const pos = (p.mode === 'free' && !noPos) ? ` style="position:absolute;left:${h.x ?? 8 + (idx % 8) * 27}px;top:${h.y ?? 8 + Math.floor(idx / 8) * 27}px"` : '';
  /* מספר החור והשם מעל המחבר — קריאים תמיד, לא מוסתרים ע"י קווי הניתוב */
  return `<div class="hcell"${pos || ' style="position:relative"'}>${num}${lbl}${hole}</div>`;
}
let rgFrom = null, rgTo = null, rgCtx = null;
function applyRange(nid, ui, from, to) {
  const p = panelOf(nid, ui);
  let a = Math.max(1, Math.min(+from || 1, +to || 1)) - 1;
  let b = Math.min(p.holes.length, Math.max(+from || 1, +to || 1)) - 1;
  for (let i = a; i <= b; i++) p.holes[i].conn = brush;
  /* הצעת הטווח הפנוי (ריק) הבא */
  let s = -1, e = -1;
  for (let i = 0; i < p.holes.length; i++) {
    if (p.holes[i].conn === 'empty') { if (s < 0) s = i; e = i; }
    else if (s >= 0) break;
  }
  if (s >= 0) { rgFrom = s + 1; rgTo = e + 1; }
  else { rgFrom = Math.min(b + 2, p.holes.length); rgTo = p.holes.length; }
  render();
}
function holesHTML(p, nid, ui, ro) {
  return p.holes.map((h, idx) => holeCell(p, h, idx, nid, ui, ro)).join('');
}
/* מטריצה מדויקת — שורות מפורשות, בדיוק לפי חורים-בשורה */
function holesMatrixHTML(p, nid, ui, ro) {
  const cpr = pCols(p);
  let out = '';
  for (let r = 0; r < (p.rows || 1); r++) {
    const cells = p.holes.slice(r * cpr, (r + 1) * cpr).map((h, j) => holeCell(p, h, r * cpr + j, nid, ui, ro, true)).join('');
    out += `<div style="display:flex;gap:5px;direction:ltr;margin-bottom:16px">${cells}</div>`;
  }
  return out;
}
/* פאנל 19 אינץ׳ — רוחב קבוע, הגובה לפי U */
function faceHTML(p, nid, ui, ro) {
  const W = 400, rowH = 42;
  let inner;
  if (p.mode === 'free') {
    inner = `<div style="position:relative;height:${(p.rows || 1) * rowH}px">${holesHTML(p, nid, ui, ro)}</div>`;
  } else {
    const cpr = pCols(p);
    inner = '';
    for (let r = 0; r < (p.rows || 1); r++) {
      const cells = p.holes.slice(r * cpr, (r + 1) * cpr).map((h, j) => holeCell(p, h, r * cpr + j, nid, ui, ro, true)).join('');
      inner += `<div style="display:flex;justify-content:space-around;align-items:center;height:${rowH}px;direction:ltr">${cells}</div>`;
    }
  }
  const sc = pos => `<span style="position:absolute;${pos};width:7px;height:7px;border-radius:50%;background:#555;border:1px solid #777"></span>`;
  return `<div class="face" style="width:${W}px;position:relative">${sc('top:5px;right:6px')}${sc('top:5px;left:6px')}${sc('bottom:5px;right:6px')}${sc('bottom:5px;left:6px')}${inner}</div>`;
}
function syncUnitPanel(nid, ui, v) {
  const u = byId(nid).units[ui];
  u.u = Math.max(1, Math.min(12, +v || 1));
  if (u.panel && u.panel.mode === 'matrix') {
    const cpr = pCols(u.panel);
    u.panel.rows = u.u;
    sizeTo(u.panel, u.u * cpr);
  } else if (u.panel) u.panel.rows = u.u;
  render();
}
function sizeTo(p, total) {
  total = Math.max(1, total);
  while (p.holes.length < total) p.holes.push({ conn: brush });
  p.holes.length = total;
}
function panelOf(nid, ui) {
  const n = byId(nid);
  return ui < 0 ? n?.panel : n?.units[ui]?.panel;
}
function resizeHoles(nid, ui, v) {
  const p = panelOf(nid, ui); const n = Math.max(1, Math.min(96, +v || 1));
  while (p.holes.length < n) p.holes.push({ conn: brush });
  p.holes.length = n;
  render();
}
function setPMode(nid, ui, v) {
  const p = panelOf(nid, ui);
  p.mode = v;
  if (v === 'free') p.holes.forEach((h, i) => { h.x ??= 8 + (i % 8) * 27; h.y ??= 8 + Math.floor(i / 8) * 27; });
  render();
}
function setPRows(nid, ui, v) {
  const p = panelOf(nid, ui);
  const cpr = pCols(p);
  p.rows = Math.max(1, Math.min(12, +v || 2));
  sizeTo(p, p.rows * cpr);
  render();
}
function setPCpr(nid, ui, v) {
  const p = panelOf(nid, ui);
  const cpr = Math.max(1, Math.min(24, +v || 8));
  sizeTo(p, (p.rows || 1) * cpr);
  render();
}
let labelMode = false;
function setPH(nid, ui, v) { panelOf(nid, ui).h = Math.max(60, +v || 140); render(); }
function fillAll(nid, ui) { panelOf(nid, ui).holes.forEach(h => h.conn = brush); render(); }
function openPanelEd(nid, i) {
  const u = byId(nid).units[i];
  u.panel = u.panel || defPanel(8, 1);
  panelEdit = { nid, ui: i };
  render();
}
function panelEditor(p, nid, ui) {
  const A = `'${nid}',${ui}`;
  if (rgCtx !== nid + '|' + ui) { rgCtx = nid + '|' + ui; rgFrom = null; rgTo = null; }
  const brushes = Object.entries(CONNS).map(([k, v]) =>
    `<button style="border:1.5px solid ${brushOn && brush === k ? '#c96f4a' : '#ddd'};${brushOn && brush === k ? 'background:#ff8a50;font-weight:700' : ''}" title="לחיצה מפעילה מברשת — כל לחיצה על חור מחילה. לחיצה נוספת מכבה." onclick="if(brushOn&&brush==='${k}'){brushOn=false}else{brush='${k}';brushOn=true}render()">${connGlyph(k)} ${v.n}</button>`).join('');
  const counts = {};
  p.holes.forEach(h => counts[h.conn] = (counts[h.conn] || 0) + 1);
  const cs = Object.entries(counts).map(([k, v]) => `${v}× ${CONNS[k].n}`).join(' · ');
  return `
    <div class="fld"><label>פריסה</label><select onchange="setPMode(${A},this.value)">
      <option value="matrix" ${p.mode === 'matrix' ? 'selected' : ''}>מטריצה (סימטרית)</option>
      <option value="free" ${p.mode === 'free' ? 'selected' : ''}>תכנון חופשי</option></select></div>
    ${p.mode === 'matrix'
      ? `<div class="row2">
          <div class="fld"><label>שורות${ui >= 0 ? ' (= גובה U)' : ''}</label><input type="number" min="1" max="12" value="${p.rows || 2}" ${ui >= 0 ? 'disabled' : `onchange="setPRows(${A},this.value)"`}></div>
          <div class="fld"><label>חורים בשורה</label><input type="number" min="1" max="24" value="${pCols(p)}" onchange="setPCpr(${A},this.value)"></div>
        </div>
        <p class="muted">סה״כ ${p.holes.length} חורים · חלוקה שווה תמיד בין השורות</p>`
      : `<div class="row2">
          <div class="fld"><label>מספר חורים</label><input type="number" min="1" max="96" value="${p.holes.length}" onchange="resizeHoles(${A},this.value)"></div>
          <div class="fld"><label>גובה אזור (px)</label><input type="number" min="60" value="${p.h || 140}" onchange="setPH(${A},this.value)"></div>
        </div>`}
    <h3 class="sec">מחבר — בחר סוג ולחץ על חורים</h3>
    <div class="brush">${brushes}</div>
    <button style="width:100%" onclick="fillAll(${A})">שבץ את כל החורים במחבר הנבחר</button>
    <div class="row2" style="margin-top:8px">
      <div class="fld"><label>מחור</label><input id="rgFrom" type="number" min="1" max="${p.holes.length}" value="${rgFrom ?? 1}" oninput="rgFrom=+this.value"></div>
      <div class="fld"><label>עד חור</label><input id="rgTo" type="number" min="1" max="${p.holes.length}" value="${rgTo ?? p.holes.length}" oninput="rgTo=+this.value"></div>
    </div>
    <button style="width:100%" onclick="applyRange(${A},document.getElementById('rgFrom').value,document.getElementById('rgTo').value)">שייך את הטווח למחבר הנבחר</button>
    <button style="width:100%;margin-top:6px;${labelMode ? 'background:#ff8a50;color:#1a1e28;font-weight:700' : ''}" onclick="labelMode=!labelMode;render()">🏷 ${labelMode ? 'מצב שמות פעיל — לחץ על חור כדי לתת שם' : 'מצב שמות — תן שמות לחורים (למשל Main L/R)'}</button>
    <p class="muted" style="margin-top:6px">${cs}</p>`;
}
function toggleRear(id) {
  const n = byId(id);
  const el = document.getElementById('nd_' + id);
  n.rear = !n.rear;
  rearPick = null;
  if (n.rear) {
    /* הארון נשאר במקומו! הגב מוקטן לאותו שטח כמו החזית (scale ברינדור),
       והזום של כל הקנבס עולה (עד 400%) כדי שהפירוט יהיה קריא. */
    n._frontW = el ? el.offsetWidth : 240;
    n._preZoom = getZ();
    setTimeout(() => {
      const k = n._rearK || 0.35;
      const target = Math.min(5, (n._preZoom || 1) / Math.max(k, 0.2)); /* עד 500% אם הגב זקוק לזה */
      if (target > getZ()) { P.zoom = target; applyZoom(); }
      const el2 = document.getElementById('nd_' + n.id);
      if (el2 && el2.scrollIntoView) el2.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }, 80);
  } else {
    if (n._preRear) { n.x = n._preRear.x; n.y = n._preRear.y; n._preRear = undefined; } /* ארונות שהוזזו בגרסה הישנה */
    if (n._preZoom) { P.zoom = n._preZoom; applyZoom(); n._preZoom = undefined; }
  }
  render(); }
function pickRear(nodeId, unitId) {
  /* אין יותר חיבור מכשיר-למכשיר: לחיצה על מוצר בגב רק מציגה את הניתוב שלו.
     חיבור נעשה אך ורק ממחבר OUT אל מחבר IN. */
  rearPick = { nodeId, unitId };
  render();
}
/* לחיצה על מחבר — חיבור מכל סדר (OUT/LNK או IN, לא משנה מה קודם) */
function portClick(nid, unitId, portStr, isOut) {
  /* חור בפאנל נבחר ← לחיצה על מחבר בגב מכשיר = חיבור חור→מחבר */
  if (selHole) { connectHoleToPort(selHole, nid, unitId, portStr, isOut); return; }
  if (wireMode && wireMode.from) return finishPortWire(nid, unitId, portStr, isOut);
  startPortWire(nid, unitId, portStr, isOut);
}
/* חיבור בין חור בפאנל מחברים לבין מחבר בגב מכשיר (IN/OUT) */
function connectHoleToPort(a, nid, unitId, port, isOut) {
  const typeOf = k => /rj45/.test(k) ? 'cat' : /bnc|hdmi/.test(k) ? 'sdi' : /fiber|אופטי/.test(k) ? 'fiber' : /speakon/.test(k) ? 'nl4' : /pwr/.test(k) ? 'pwr' : 'xlr';
  const c = { id: uid('c'), qty: '1', spec: '', note: '', type: typeOf(a.conn || '') };
  if (isOut) { /* יציאת המכשיר → אל החור */
    c.from = nid; c.fromUnit = unitId; c.pOut = port;
    c.to = a.nid; c.toHole = a.idx + 1; c.pIn = 'חור ' + (a.idx + 1);
  } else { /* מהחור → אל כניסת המכשיר */
    c.from = a.nid; c.fromHole = a.idx + 1; c.pOut = 'חור ' + (a.idx + 1);
    c.to = nid; c.toUnit = unitId; c.pIn = port;
  }
  c.conn = a.conn && a.conn !== 'empty' ? a.conn : connFor(c.type);
  if (P.scale) { const na = byId(a.nid), nb = byId(nid); if (na && nb && na !== nb) c.len = +(Math.hypot(na.x - nb.x, na.y - nb.y) * P.scale).toFixed(1); }
  P.cables.push(c);
  selHole = null; selCable = c.id; ui.tab = 'cable';
  render(); save();
  offerCableLink(c);
}
function finishPortWire(nid, unitId, portStr, isOut) {
  if (!wireMode || !wireMode.from) { startPortWire(nid, unitId, portStr, isOut); return; }
  const start = { nid: wireMode.from.nid, unitId: wireMode.from.unitId, port: wireMode.srcPort, isOut: wireMode.srcIsOut };
  const fin = { nid, unitId, port: portStr, isOut };
  if (start.nid === fin.nid && (start.unitId || null) === (fin.unitId || null)) return;
  /* היציאה (OUT/LNK) היא המקור, הכניסה היא היעד */
  const src = start.isOut ? start : (fin.isOut ? fin : start);
  const dst = (src === start) ? fin : start;
  wireMode.from = { nid: src.nid, unitId: src.unitId };
  wireMode.pOut = src.isOut ? src.port : undefined;
  wireMode.pIn = dst.isOut ? undefined : dst.port;
  handleWireClick(dst.nid, dst.unitId);
}

/* חיווט פנימי בארון (מכשיר↔מכשיר) = אותיות A,B,C... · חיצוני (לרמקולים/מוקדים) = מספרים עם תת-ספרור לשרשור */
function isInternalCable(c) {
  if (c.from !== c.to && c.fromUnit && c.toUnit) {
    const a = byId(c.from), b = byId(c.to);
    return a && b && a.kind === 'rack' && b.kind === 'rack';
  }
  return c.from === c.to && c.fromUnit && c.toUnit; /* אותו ארון */
}
function letterLbl(i) {
  let s = ''; i++;
  while (i > 0) { i--; s = String.fromCharCode(65 + (i % 26)) + s; i = Math.floor(i / 26); }
  return s;
}
function cableLabels() {
  const lbl = {}, childCnt = {};
  let base = 0, li = 0;
  P.cables.forEach((c, i) => {
    if (isInternalCable(c)) { lbl[c.id] = letterLbl(li++); return; }
    const p = P.cables.find((q, j) => j < i && !isInternalCable(q) && q.to === c.from && q.type === c.type && q.from !== c.to);
    if (p && lbl[p.id]) {
      const root = String(lbl[p.id]).split('.')[0];
      childCnt[root] = (childCnt[root] || 0) + 1;
      lbl[c.id] = root + '.' + childCnt[root];
    } else {
      base++;
      lbl[c.id] = String(base);
    }
  });
  return lbl;
}
function renderWires() {
  const LBL = cableLabels();
  const svg = $('#wires');
  const W = $('#canvas').offsetWidth;
  const ortho = P.route === 'ortho';
  const sibG = {};
  P.cables.forEach(c => { const k = c.from + '|' + c.to; (sibG[k] = sibG[k] || []).push(c); });

  const info = c => {
    const a = byId(c.from), b = byId(c.to);
    if (!a || !b || c.from === c.to) return null;
    if (a.hidden || b.hidden) return null; /* מוצר מוסתר — גם הכבלים שלו מוסתרים */
    const A = nodeBox(a), B = nodeBox(b);
    const acx = W - A.x - A.w / 2, bcx = W - B.x - B.w / 2;
    return { A, B, aside: bcx < acx ? 'L' : 'R', bside: acx < bcx ? 'L' : 'R' };
  };
  /* ספירת חיבורים לכל צד של מוקד — כדי לפזר כניסות */
  const sideTot = {}, sideIdx = {};
  P.cables.forEach(c => {
    const f = info(c); if (!f || !cableVisible(c)) return;
    const fn2 = byId(c.from), tn2 = byId(c.to);
    /* ארון ממוזער — גם חיבורי יחידות נספרים, כדי לפרוש יציאה נפרדת לכל כבל */
    if (!unitOf(c.from, c.fromUnit) || (fn2 && fn2.min)) { const k = c.from + '|' + f.aside; sideTot[k] = (sideTot[k] || 0) + 1; }
    if (!unitOf(c.to, c.toUnit) || (tn2 && tn2.min)) { const k = c.to + '|' + f.bside; sideTot[k] = (sideTot[k] || 0) + 1; }
  });
  const endPt = (c, end, side, box) => {
    const nid = c[end], unitId = c[end + 'Unit'];
    const x = side === 'L' ? W - box.x - box.w : W - box.x;
    const u = unitOf(nid, unitId);
    let y, dot = false;
    if (u) {
      const mnode = byId(nid);
      if (mnode && mnode.min) {
        /* יציאה נפרדת לכל כבל מארון ממוזער — נפרשות במניפה על גובה הארון */
        const k = nid + '|' + side;
        const idx = sideIdx[k] = (sideIdx[k] || 0) + 1;
        const tot = sideTot[k] || 1;
        const span = Math.min(box.h + 26, Math.max(22, (tot - 1) * 19));
        y = box.y + box.h / 2 + (tot > 1 ? (idx - 1) / (tot - 1) - 0.5 : 0) * span;
        dot = true;
      }
      else {
        const el = document.getElementById('nd_' + nid);
        const rails = el && el.querySelector('.rails');
        const rear = mnode && mnode.rear;
        const railsTop = rails ? rails.offsetTop : 40;
        if (rear) {
          /* בגב — הקו הראשי ממשיך מנקודת היציאה המדודה (המשך לסטאב שצויר בפאנל) */
          const ex = REAREXIT[c.id];
          if (ex && ex.nodeId === nid && ex.pt) return { x: ex.pt.x, y: ex.pt.y, dot: false };
          const nodeLeftCanvas = W - box.x - box.w;
          const ru3 = REARUNIT[u.id];
          y = box.y + railsTop + (ru3 ? ru3.top + ru3.h / 2 : (u.pos + u.u / 2) * REAR_UPX);
        } else {
          y = box.y + railsTop + (u.pos + u.u / 2) * UPX;
        }
        dot = true;
      }
    } else {
      /* כבל שמחובר למחבר ספציפי בפאנל — נכנס בדיוק בנקודת המעבר הפנימי (קו רציף) */
      const pp = PANELPORT[c.id + '|' + nid];
      if (pp) return { x: pp.x, y: pp.y, dot: false };
      const k = nid + '|' + side;
      const idx = sideIdx[k] = (sideIdx[k] || 0) + 1;
      /* ריווח 26px — עיגולי הקצה הממוספרים לא עולים זה על זה ולא מסתירים קווים */
      y = box.y + box.h / 2 + (idx - 1 - ((sideTot[k] || 1) - 1) / 2) * 26;
    }
    y += c.aoff?.[end] || 0;
    y = Math.max(box.y + 8, Math.min(box.y + box.h - 8, y));
    return { x, y, dot };
  };

  const items = [];
  WIREPTS = {};
  P.cables.forEach((c, i) => {
    const f = info(c); if (!f || !cableVisible(c)) return;
    let pa = endPt(c, 'from', f.aside, f.A);
    let pb = endPt(c, 'to', f.bside, f.B);
    if (dragE && dragE.c.id === c.id && dragE.cur) {
      if (dragE.end === 'from') pa = { x: dragE.cur.x, y: dragE.cur.y, dot: true };
      else pb = { x: dragE.cur.x, y: dragE.cur.y, dot: true };
    }
    const sib = sibG[c.from + '|' + c.to];
    const off = (sib.indexOf(c) - (sib.length - 1) / 2) * 16;
    WIREPTS[c.id] = { a: { x: pa.x, y: pa.y }, b: { x: pb.x, y: pb.y } };
    items.push({ c, i, pa, pb, off, A: f.A, B: f.B });
  });

  /* הקצאת נתיבים אנכיים ואופקיים ללא חפיפה (מצב מעגל חשמלי) */
  const lanes = [], hlanes = [];
  for (const it of items) {
    const { pa, pb, off, c } = it;
    if (ortho) {
      let mx = (pa.x + pb.x) / 2 + off + (c.bend?.dx || 0);
      /* הקו האנכי לא חוצה את הארון/פאנל של הקצוות — עובר לצד החיצוני שלהם */
      for (const box of [it.A, it.B]) {
        if (!box) continue;
        const L = 2200 - box.x - box.w, R = 2200 - box.x;
        if (mx > L - 6 && mx < R + 6) mx = (mx - L < R - mx) ? L - 14 : R + 14;
      }
      const y1 = Math.min(pa.y, pb.y), y2 = Math.max(pa.y, pb.y);
      let g = 0;
      while (g++ < 50 && lanes.some(v => Math.abs(v.mx - mx) < 15 && y1 < v.y2 + 12 && v.y1 - 12 < y2)) mx += 17;
      lanes.push({ mx, y1, y2 });
      /* מסדרון אופקי: שני קווים באותו גובה שרצים על אותו קטע — מקבלים פס משלהם
         וירידה קצרה לתוך נקודת החיבור, כך שאפשר לספור כל קו בנפרד */
      /* גם הקטע האופקי היוצא (מהמקור אל התעלה) נרשם — כדי שלא ישב על קו אחר */
      hlanes.push({ y: pa.y, x1: Math.min(pa.x, mx), x2: Math.max(pa.x, mx) });
      const hx1 = Math.min(mx, pb.x), hx2 = Math.max(mx, pb.x);
      let hoff = 0, g2 = 0;
      while (g2++ < 12 && hlanes.some(v => Math.abs(v.y - (pb.y + hoff)) < 9 && hx1 < v.x2 + 10 && v.x1 - 10 < hx2))
        hoff = hoff <= 0 ? -hoff + 9 : -hoff;
      if (Math.abs(hoff) > 0 && Math.abs(mx - pb.x) < 26) hoff = 0; /* קטע קצר מדי לפס נפרד */
      hlanes.push({ y: pb.y + hoff, x1: hx1, x2: hx2 });
      it.hoff = hoff;
      it.mx = mx;
      it.bx = mx;
      it.by = Math.abs(pa.y - pb.y) < 10 ? pa.y - 16 : (pa.y + pb.y) / 2 + (c.bend?.dy || 0);
    } else {
      it.mx = (pa.x + pb.x) / 2 + off + (c.bend?.dx || 0);
      it.by = (pa.y + pb.y) / 2 + off + (c.bend?.dy || 0);
      it.bx = it.mx;
    }
  }
  /* מניעת חפיפה בין מספרי כבלים */
  for (let i = 0; i < items.length; i++)
    for (let j = 0; j < i; j++) {
      let g = 0;
      while (g++ < 25 && Math.abs(items[i].bx - items[j].bx) < 25 && Math.abs(items[i].by - items[j].by) < 25)
        items[i].by += 27;
    }

  let out = '<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1L9 5L1 9" fill="none" stroke="context-stroke" stroke-width="1.6"/></marker></defs>';
  /* שכבת שרטוט התכנית — קירות ואובייקטים (תחליף להעלאת תמונה) */
  if (P.sketch && ((P.sketch.walls || []).length || (P.sketch.objs || []).length || sketchMode)) {
    const wallW = Math.max(4, Math.min(14, P.scale ? 0.15 / P.scale : 8));
    const dimFz = Math.max(10, 13 / (getZ() || 1));
    const dimTxt = (x, y, t, rot) => `<g transform="translate(${x} ${y})${rot ? ' rotate(' + rot + ')' : ''}" style="pointer-events:none">
        <rect x="${-t.length * dimFz * 0.31 - 4}" y="${-dimFz * 0.78}" width="${t.length * dimFz * 0.62 + 8}" height="${dimFz * 1.25}" rx="3" fill="#fff" opacity="0.82"/>
        <text x="0" y="${dimFz * 0.34}" text-anchor="middle" font-size="${dimFz.toFixed(1)}" font-weight="700" fill="#3f3a33">${t}</text></g>`;
    (P.sketch.walls || []).forEach((wl, wi) => {
      out += `<polyline points="${wl.map(p => p.x + ',' + p.y).join(' ')}" fill="none" stroke="#3f3a33" stroke-width="${wallW}" stroke-linecap="square" stroke-linejoin="miter"${sketchMode ? ` style="pointer-events:stroke;cursor:${sketchMode.tool === 'erase' ? 'not-allowed' : 'default'}" onclick="if(sketchMode&&sketchMode.tool==='erase'){P.sketch.walls.splice(${wi},1);save();renderWires();}"` : ''}><title>קיר${P.scale ? ' · ' + (wl.slice(1).reduce((s5, p5, i5) => s5 + Math.hypot(p5.x - wl[i5].x, p5.y - wl[i5].y), 0) * P.scale).toFixed(1) + ' מ׳' : ''}${sketchMode && sketchMode.tool === 'erase' ? ' — לחיצה מוחקת' : ''}</title></polyline>`;
      /* מידה על כל מקטע קיר — קריאה גם כשהקו אנכי (הטקסט מסתובב עם הקיר) */
      if (P.scale) wl.slice(1).forEach((p2, i2) => {
        const p1 = wl[i2], len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        if (len * P.scale < 0.4) return;
        let ang = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
        if (ang > 90 || ang < -90) ang += 180;
        out += dimTxt((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, (len * P.scale).toFixed(2) + ' מ׳', ang.toFixed(1));
      });
    });
    (P.sketch.objs || []).forEach((o, oi) => {
      const d = SK_OBJS[o.t] || { n: o.t, c: '#666' };
      const selO = sketchMode && sketchSel === oi;
      const fs = Math.max(9, Math.min(o.w * 0.28, 22));
      out += `<g data-skobj="${oi}" transform="rotate(${o.r || 0} ${o.x} ${o.y})" style="cursor:${sketchMode ? 'move' : 'default'};pointer-events:${sketchMode ? 'all' : 'none'}">` +
        (d.round ? `<ellipse cx="${o.x}" cy="${o.y}" rx="${o.w / 2}" ry="${o.h / 2}" fill="${d.c}22" stroke="${d.c}" stroke-width="${selO ? 3.5 : 1.8}"${d.dash ? ' stroke-dasharray="7 5"' : ''}/>`
          : `<rect x="${o.x - o.w / 2}" y="${o.y - o.h / 2}" width="${o.w}" height="${o.h}" rx="4" fill="${d.c}22" stroke="${d.c}" stroke-width="${selO ? 3.5 : 1.8}"${d.dash ? ' stroke-dasharray="7 5"' : ''}/>`) +
        `<text x="${o.x}" y="${o.y + fs * 0.35}" text-anchor="middle" font-size="${fs}" font-weight="600" fill="${d.c}" style="user-select:none">${d.n}</text>` +
        (P.scale ? `<text x="${o.x}" y="${o.y + o.h / 2 + fs * 0.95}" text-anchor="middle" font-size="${(fs * 0.72).toFixed(1)}" fill="${d.c}" opacity="0.85" style="user-select:none">${(o.w * P.scale).toFixed(2)}×${(o.h * P.scale).toFixed(2)} מ׳</text>` : '') +
        `<title>${d.n}${P.scale ? ` · ${(o.w * P.scale).toFixed(1)}×${(o.h * P.scale).toFixed(1)} מ׳` : ''} — במצב שרטוט: גרירה מזיזה, הסרגל מסובב/משנה גודל</title></g>`;
    });
    if (sketchMode && sketchMode.cur && sketchMode.cur.length) {
      const c = sketchMode.cur;
      out += `<polyline points="${c.map(p => p.x + ',' + p.y).join(' ')}" fill="none" stroke="#3f3a33" stroke-width="${wallW}" opacity="0.65"/>`;
      if (sketchMode.cur2) {
        const l2 = c[c.length - 1];
        out += `<line x1="${l2.x}" y1="${l2.y}" x2="${sketchMode.cur2.x}" y2="${sketchMode.cur2.y}" stroke="#3f3a33" stroke-width="${wallW}" stroke-dasharray="7 6" opacity="0.5"/>`;
        /* מידה חיה תוך כדי ציור — רואים את האורך לפני שמניחים את הנקודה */
        if (P.scale) {
          const lv = Math.hypot(sketchMode.cur2.x - l2.x, sketchMode.cur2.y - l2.y) * P.scale;
          const t2 = sketchMode.tool === 'rect' ? (Math.abs(sketchMode.cur2.x - l2.x) * P.scale).toFixed(2) + ' × ' + (Math.abs(sketchMode.cur2.y - l2.y) * P.scale).toFixed(2) + ' מ׳' : lv.toFixed(2) + ' מ׳';
          out += dimTxt((l2.x + sketchMode.cur2.x) / 2, (l2.y + sketchMode.cur2.y) / 2 - 14, t2, 0);
        }
      }
      c.forEach((p2, pi) => out += `<circle cx="${p2.x}" cy="${p2.y}" r="${pi === 0 ? 7 : 5.5}" fill="${pi === 0 ? '#fff' : '#c9502e'}" stroke="#c9502e" stroke-width="2"><title>${pi === 0 ? 'לחיצה כאן סוגרת מסלול' : 'לחיצה על נקודה קיימת מסיימת את הקיר'}</title></circle>`);
    }
  }
  /* בזום גבוה העיגולים מתכווצים ביחס הפוך — שלא יסתירו את המוצרים */
  const ZW = getZ() || 1, shrink = Math.min(1, 1.6 / ZW);
  const escCnt = {}; /* מונה עקיפות לכל קופסה+צד — מסלולים מקבילים נפרדים */
  for (const it of items) {
    const { c, i, pa, pb } = it;
    const col = CTYPES[c.type].c;
    const selw = c.id === selCable ? 4 : 2.2;
    let dpath;
    if (ortho) {
      /* קצה שנכנס בשפת פאנל/ארון והיעד בצד הנגדי — בורח החוצה ועוקף את הקופסה
         מבחוץ (מעל/מתחת) במקום לחצות אותה. זה מה שקורה בשטח עם כבל אמיתי. */
      /* כמה כבלים שעוקפים את אותה קופסה מאותו צד — כל אחד במסלול מקביל משלו (מדורג 6px) */
      const escape = (pt, box, towardX, otherY) => {
        if (!box) return null;
        const L = 2200 - box.x - box.w, R = 2200 - box.x, T = box.y, B = box.y + (box.h || 0);
        const up = otherY < (T + B) / 2;
        const mk = side => {
          const key = box.x + '|' + box.y + '|' + side + '|' + (up ? 'T' : 'B');
          const li = (escCnt[key] = (escCnt[key] || 0) + 1) - 1;
          return { x: side === 'R' ? R + 14 + li * 11 : L - 14 - li * 11, y: up ? T - 12 - li * 11 : B + 12 + li * 11 };
        };
        if (Math.abs(pt.x - R) < 3 && towardX < pt.x - 4) return mk('R');
        if (Math.abs(pt.x - L) < 3 && towardX > pt.x + 4) return mk('L');
        return null;
      };
      const e1 = escape(pa, it.A, it.mx, pb.y);
      const e2 = escape(pb, it.B, it.mx, e1 ? e1.y : pa.y);
      dpath = `M${pa.x} ${pa.y}`;
      if (e1) dpath += ` H ${e1.x} V ${e1.y}`;
      dpath += ` H ${it.mx}`;
      if (e2) dpath += ` V ${e2.y} H ${e2.x}`;
      const ho = it.hoff || 0;
      if (ho) {
        /* פס מקביל ואז ירידה קצרה לנקודת החיבור — בלי צמתים משותפים */
        const jog = pb.x > it.mx ? -14 : 14;
        dpath += ` V ${pb.y + ho} H ${pb.x + jog} V ${pb.y} H ${pb.x}`;
      } else dpath += ` V ${pb.y} H ${pb.x}`;
    } else {
      const cx = 2 * it.bx - (pa.x + pb.x) / 2, cy = 2 * it.by - (pa.y + pb.y) / 2;
      dpath = `M${pa.x} ${pa.y} Q ${cx} ${cy} ${pb.x} ${pb.y}`;
    }
    const instDash = c.inst === 'exist' ? '7 5' : c.inst === 'pull' ? '14 6' : null;
    /* קצה שמחובר למכשיר בארון או למחבר ספציפי בפאנל — הקו נכנס ישר, בלי חץ ובלי עיגול
       (המספר מוצג על נקודת החיבור עצמה בתוך הפאנל/הגב) */
    const aUnit = !!unitOf(c.from, c.fromUnit) || !!c.fromHole, bUnit = !!unitOf(c.to, c.toUnit) || !!c.toHole;
    const mEnd = bUnit ? '' : ' marker-end="url(#ah)"';
    const mStart = (c.dir === 'both' && !aUnit) ? ' marker-start="url(#ah)"' : '';
    out += `<path d="${dpath}" fill="none"stroke="transparent" stroke-width="14" style="pointer-events:stroke;cursor:pointer" onclick="pickCable('${c.id}')"/>`;
    out += `<path d="${dpath}" fill="none" stroke="${col}" stroke-width="${selw}"${instDash ? ` stroke-dasharray="${instDash}"` : ''}${mStart}${mEnd} opacity="0.9" style="pointer-events:none"/>`;
    /* קצה הכבל = עיגול אחד עם מספר הכבל בתוכו — גם מזהה וגם ידית גרירה.
       קצה שמחובר למכשיר בתוך ארון — נקודה קטנה בלבד, בלי מספר (המספר כבר בגב). */
    const handle = (x, y, end) => {
      const lbl = LBL[c.id], big = String(lbl).length > 2;
      const toUnit = !!unitOf(c[end], c[end + 'Unit']) || !!(end === 'from' ? c.fromHole : c.toHole);
      if (dragE && dragE.c.id === c.id && dragE.end === end)
        return `<circle cx="${x}" cy="${y}" r="${Math.max(3, 6 * shrink)}" fill="${col}" stroke="#fff" stroke-width="1.5" style="pointer-events:none"/>`;
      const cn = end === 'to' ? (c.conn2 || c.conn) : c.conn;
      const tip = (cn && CONNS[cn] ? 'מחבר: ' + CONNS[cn].n + ' · ' : '') + 'גרור למכשיר אחר';
      if (toUnit) /* בלתי-נראה — רק אזור אחיזה לגרירה בנקודת החיבור למכשיר */
        return `<circle cx="${x}" cy="${y}" r="${Math.max(7, 10 * shrink)}" fill="transparent" style="pointer-events:all;cursor:grab" data-cend="${c.id}|${end}"><title>${tip}</title></circle>`;
      const r = Math.max(6, (big ? 11 : 9) * shrink);
      const fs = Math.max(5.5, (big ? 8.5 : 10) * shrink);
      return `<g style="pointer-events:all;cursor:grab" data-cend="${c.id}|${end}"><title>${tip}</title>
        <circle cx="${x}" cy="${y}" r="${r.toFixed(1)}" fill="#fff" stroke="${col}" stroke-width="${(c.id === selCable ? 3 : 2) * shrink}"/>
        <text x="${x}" y="${y + fs * 0.36}" text-anchor="middle" font-size="${fs.toFixed(1)}" font-weight="800" fill="${col}" style="user-select:none">${lbl}</text></g>`;
    };
    out += handle(pa.x, pa.y, 'from') + handle(pb.x, pb.y, 'to');
    if (ortho) {
      const corner = (x, y, end) => `<rect x="${x - 4.5}" y="${y - 4.5}" width="9" height="9" rx="2" fill="#fff" stroke="${col}" stroke-width="1.5" style="pointer-events:all;cursor:move" data-corner="${c.id}|${end}"><title>גרירה אופקית — הזזת הקו · אנכית — נקודת החיבור</title></rect>`;
      out += corner(it.mx, pa.y, 'from') + corner(it.mx, pb.y, 'to');
    }
    const btip = esc(`${CTYPES[c.type].n}${c.cores ? ' · ' + c.cores + '× XLR' : ''}${c.fiber ? ' · ' + c.fiber : ''}${c.spec ? ' · ' + c.spec : ''}${c.len ? ' · ' + c.len + ' מ׳' : ''}${c.conn && CONNS[c.conn] ? ' · ' + CONNS[c.conn].n + (c.conn2 && CONNS[c.conn2] && c.conn2 !== c.conn ? ' ← ' + CONNS[c.conn2].n : '') : ''}${c.note ? ' · ' + c.note : ''}${c.pOut || c.pIn ? ' · ' + (c.pOut || '?') + ' ← ' + (c.pIn || '?') : ''}`);
    /* המספר יושב בתוך עיגול הקצה עצמו (handle) — אין תג נפרד */
    const bR = Math.max(7, (String(LBL[c.id]).length > 2 ? 13 : 11) * shrink);
    const bF = Math.max(6, (String(LBL[c.id]).length > 2 ? 9.5 : 11) * shrink);
    out += `<g style="pointer-events:all;cursor:grab" data-cbadge="${c.id}"><title>${btip}</title><circle cx="${it.bx}" cy="${it.by}" r="${bR.toFixed(1)}" fill="#fff" stroke="${col}" stroke-width="${(c.id === selCable ? 3.5 : 2) * shrink}"/><text x="${it.bx}" y="${it.by + bF * 0.37}" text-anchor="middle" font-size="${bF.toFixed(1)}" font-weight="700" fill="${col}" style="user-select:none">${LBL[c.id]}</text></g>`;
  }
  /* קווי יישור בזמן גרירת מוקד */
  if (window.__alignG) {
    const g = window.__alignG, EX = 6000;
    if (g.x != null) out += `<line x1="${g.x}" y1="0" x2="${g.x}" y2="${EX}" stroke="#e2438a" stroke-width="1.5" stroke-dasharray="7 5" opacity="0.95" style="pointer-events:none"/>`;
    if (g.y != null) out += `<line x1="0" y1="${g.y}" x2="${EX}" y2="${g.y}" stroke="#e2438a" stroke-width="1.5" stroke-dasharray="7 5" opacity="0.95" style="pointer-events:none"/>`;
  }
  /* פוליגון אזור בזמן ציור */
  if (zoneMode && zoneMode.poly && zoneMode.poly.length) {
    const pp = zoneMode.poly;
    const pathPts = pp.map(p => p.x + ',' + p.y).join(' ');
    out += `<polyline points="${pathPts}" fill="#c96f4a1a" stroke="#c96f4a" stroke-width="2.5" stroke-dasharray="7 5"/>`;
    pp.forEach((p, i) => out += `<circle cx="${p.x}" cy="${p.y}" r="${i === 0 ? 8 : 5}" fill="${i === 0 ? '#fff' : '#c96f4a'}" stroke="#c96f4a" stroke-width="2.5"/>`);
    if (zoneMode.cur) out += `<line x1="${pp[pp.length - 1].x}" y1="${pp[pp.length - 1].y}" x2="${zoneMode.cur.x}" y2="${zoneMode.cur.y}" stroke="#c96f4a" stroke-width="2" stroke-dasharray="4 4"/>`;
  }
  /* קו הכיול הקבוע — תזכורת קנה המידה על התכנית */
  if (P.calLine && P.scale && !calMode) {
    const { p1, p2 } = P.calLine;
    const px = Math.hypot(p1.x - p2.x, p1.y - p2.y);
    out += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="#e24b4a" stroke-width="2" stroke-dasharray="7 5" opacity="0.85"/>`;
    out += `<circle cx="${p1.x}" cy="${p1.y}" r="4.5" fill="#e24b4a"/><circle cx="${p2.x}" cy="${p2.y}" r="4.5" fill="#e24b4a"/>`;
    const fz = Math.max(14, 18 / getZ());
    const mx = (p1.x + p2.x) / 2, my = Math.min(p1.y, p2.y) - 10;
    const txt = '📏 ' + (px * P.scale).toFixed(1) + ' מ׳';
    const bw = txt.length * fz * 0.62 + 18;
    out += `<rect x="${mx - bw / 2}" y="${my - fz - 8}" width="${bw}" height="${fz + 10}" rx="6" fill="#e24b4a" opacity="0.92"/><text x="${mx}" y="${my - 4}" text-anchor="middle" font-size="${fz}" font-weight="700" fill="#fff">${txt}</text>`;
  }
  /* קו כיול חי — רואים בדיוק מה מודדים */
  if (calMode && calMode.pts.length) {
    const p1 = calMode.pts[0];
    out += `<circle cx="${p1.x}" cy="${p1.y}" r="6" fill="#e24b4a" stroke="#fff" stroke-width="2"/>`;
    if (calMode.cur) {
      const p2 = calMode.cur;
      const px = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      out += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="#e24b4a" stroke-width="2.5" stroke-dasharray="7 5"/>`;
      out += `<circle cx="${p2.x}" cy="${p2.y}" r="6" fill="#e24b4a" stroke="#fff" stroke-width="2"/>`;
      const fz = Math.max(16, 22 / getZ());
      const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2 - fz;
      const txt = P.scale ? (px * P.scale).toFixed(1) + ' מ׳' : Math.round(px) + 'px';
      const bw = txt.length * fz * 0.65 + 20;
      out += `<rect x="${mx - bw / 2}" y="${my - fz - 6}" width="${bw}" height="${fz + 12}" rx="6" fill="#e24b4a"/><text x="${mx}" y="${my - 1}" text-anchor="middle" font-size="${fz}" font-weight="700" fill="#fff">${txt}</text>`;
    }
  }
  svg.innerHTML = out;
}
function tidy() {
  P.route = P.route === 'ortho' ? 'curve' : 'ortho';
  render();
}
function designBrief() {
  const r = P.room || {};
  const racks = P.nodes.filter(n => n.kind === 'rack').map(n => n.name + ' (' + n.ru + 'U)').join(', ');
  const pts = P.nodes.filter(n => n.kind === 'point').map(n => n.name).join(', ');
  const wM = P.scale && P.bgW ? Math.round(P.bgW * P.scale) : null;
  const txt = `תכנן לי מערכת הגברה לחלל הזה:
פרויקט: ${P.name}
גובה תקרה: ${r.ceil || 'לא הוזן'} מ׳ · ספיגה אקוסטית: ${r.absorb ?? 'לא הוזן'}/10 · אופי שימוש: ${r.usage || 'לא הוזן'}
${wM ? 'רוחב התכנית המכוילת: ~' + wM + ' מ׳' : 'קנה מידה: טרם כויל'}
${(P.zones || []).length ? 'אזורי סאונד: ' + P.zones.map(z => z.name + ' — ' + (z.usage || 'לא הוגדר') + (z.ceil ? ', תקרה ' + z.ceil + ' מ׳' : '') + (z.absorb != null ? ', ספיגה ' + z.absorb + '/10' : '') + (z.brand ? ', מותג ' + z.brand : '') + (P.scale ? ' (~' + Math.round(zoneArea(z) * P.scale * P.scale) + ' מ"ר)' : '')).join(' · ') + '\n' : ''}מותג מועדף: ${(P.room && P.room.brand && P.room.brand !== '— ללא העדפה —') ? P.room.brand : 'KT Audio / K&F / Funktion-One / Lambda Labs (בחר)'}
ציוד קיים — ארונות: ${racks || 'אין'} · מוקדים: ${pts || 'אין'}
מצורף צילום של התכנית${P.scale ? ' (מכוילת)' : ''}.
בקשה: פריסת רמקולים עם דגמים ספציפיים וזוויות פיזור, מיקומי סאבים ודיליי לפי גובה התקרה והספיגה, בחירת מגברים והספקים, וקובץ JSON לייבוא ל-KO Projects (פורמט items).`;
  try { navigator.clipboard.writeText(txt); } catch (e) {}
  alert('📋 בריף התכנון הועתק ללוח!\n\n1. פתח שיחה חדשה עם Claude\n2. הדבק את הבריף\n3. צרף צילום מסך של התכנית + את קובץ speakers-kb.md (בסיס ידע המותגים)\n\nתקבל חזרה פריסה מנומקת + קובץ ייבוא מוכן.');
}
function autoConnect() {
  /* toggle off = undo: מוחק את כל מה שנוצר אוטומטית בסבב האחרון */
  if (P.autoIds && P.autoIds.length) {
    P.cables = P.cables.filter(c => !P.autoIds.includes(c.id));
    P.autoIds = [];
    render();
    return;
  }
  const connUnits = new Set(), connNodes = new Set();
  P.cables.forEach(c => {
    connNodes.add(c.from); connNodes.add(c.to);
    if (c.fromUnit) connUnits.add(c.fromUnit);
    if (c.toUnit) connUnits.add(c.toUnit);
  });
  const units = [];
  P.nodes.forEach(n => { if (n.kind === 'rack') n.units.forEach(u => units.push({ n, u })); });
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const pick = (fromNode, pred) => {
    const cand = units.filter(pred);
    cand.sort((p, q) => dist(fromNode, p.n) - dist(fromNode, q.n));
    return cand[0] || null;
  };
  const added = [];
  const mk = (fn, fu, tn, tu, type, dir) => {
    const c = { id: uid('c'), from: fn, fromUnit: fu, to: tn, toUnit: tu, type, qty: '1', spec: '', note: 'חיבור אוטומטי', dir };
    P.cables.push(c); added.push(c.id);
  };
  /* מוקדי קצה לא מחוברים → מוצא להם ספק מתאים */
  for (const n of P.nodes.filter(n => (n.kind === 'point' || n.kind === 'panel') && !connNodes.has(n.id))) {
    const s = n.name + ' ' + (n.sub || '');
    let prov = null, type = null, dir;
    if (/(רמקול|SPECTRA|NOMOS|GRAVIS|CA\s?106|סאב|פיל|מוניטור|דיליי|speaker|sub)/i.test(s)) { prov = pick(n, p => p.u.cat === 'amp'); type = 'nl4'; }
    else if (/(מקרן|proj|וידאו|video)/i.test(s)) { prov = pick(n, p => p.u.cat === 'video'); type = 'sdi'; }
    else if (/(תאור|light|dmx)/i.test(s)) { prov = pick(n, p => p.u.cat === 'light'); type = 'dmx'; }
    else if (/(מולטי|multi|stage ?box)/i.test(s)) { prov = pick(n, p => p.u.cat === 'patch'); type = 'multi'; dir = 'both'; }
    else if (/(רשת|אינטרנט|net|wifi)/i.test(s)) { prov = pick(n, p => p.u.cat === 'net'); type = 'cat'; }
    if (prov && type) { mk(prov.n.id, prov.u.id, n.id, undefined, type, dir); connNodes.add(n.id); }
  }
  /* יחידות רשת/וידאו/תאורה לא מחוברות → מקבילה בארון אחר */
  for (const { n, u } of units.filter(p => !connUnits.has(p.u.id))) {
    const typeBy = { net: 'cat', video: 'sdi', light: 'dmx', patch: 'multi' }[u.cat];
    if (!typeBy) continue;
    const t = pick(n, p => p.n.id !== n.id && p.u.cat === u.cat && !connUnits.has(p.u.id));
    if (t) {
      mk(n.id, u.id, t.n.id, t.u.id, typeBy);
      connUnits.add(u.id); connUnits.add(t.u.id);
    }
  }
  P.autoIds = added;
  if (!added.length) alert('הכל כבר מחובר — לא נמצאו מוצרים לא מחוברים שאפשר לשדך');
  render();
}

/* בסיס ידע ממשקי חיבור — כניסות/יציאות לפי שם המוצר (מהקטלוג ומדפי היצרן) */
const IO_KB = [
  { re: /XTA\s*(DNA|APA)|DNA\s?20|מגבר תוצרת XTA/i, io: { i: '4× XLR (אנלוגי/AES3)', o: '4× ספיקון NL4', x: 'רשת לניהול DSP' } },
  { re: /PQM\s?13|SAE.*1300/i, io: { i: '4× XLR', o: '4× ספיקון NL4' } },
  { re: /IPX\s?(5|10|15|20)\s?:\s?4/i, io: { i: '4× XLR אנלוגי + Dante/OMNEO', o: '4× ספיקון NL4', x: 'FIR-DSP, רשת כפולה' } },
  { re: /\bIX\s?(15|30|60)/i, io: { i: 'Dante + אנלוגי XLR', o: '4-8× Hi-Z/Lo-Z בורג', x: 'ghostPOWER' } },
  { re: /DYNAMIQ\s?450/i, io: { i: '2× XLR/RCA + BT', o: '2-4× ספיקון/בורג', x: 'DSP מובנה' } },
  { re: /רסיבר|receiver/i, io: { i: '4× RCA · אופטי · BT', o: 'בורג רמקולים A/B' } },
  { re: /מיקסר|mixer|console/i, io: { i: 'XLR/TRS מרובים', o: 'Main XLR L/R + Aux' } },
  { re: /SPECTRA|GRAVIS|NOMOS|CA\s?-?106|F81|F101|TILL|EUPHORIA|NIKO|INTERPID|UNICORN\s?441|רמקול פאסיבי/i, io: { i: '1× ספיקון NL4 IN', o: '1× ספיקון NL4 LINK (שרשור)' } },
  { re: /סאב מוגבר|active sub|R-101SW/i, io: { i: 'RCA/LFE IN', o: 'RCA OUT (שרשור)' } },
  { re: /מגבר|amplifier|\bamp\b/i, io: { i: '2-4× XLR', o: '2-4× ספיקון NL4' } },
];
function ioFor(name) { const e = IO_KB.find(e => e.re.test(name || '')); return e ? e.io : null; }
function ioTip(name) { const io = ioFor(name); return io ? 'כניסות: ' + io.i + ' | יציאות: ' + io.o + (io.x ? ' | ' + io.x : '') : ''; }
/* ציור פנל חיבורים גרפי של מוצר — לפי בסיס הידע */
function ioPanelHTML(name, nid, unitId) {
  /* קודם — הפריסה האמיתית מספריית הגב (המחברים כפי שהם על המוצר) */
  const layout = rearLayout(name);
  if (layout && layout.length) {
    const LBL = cableLabels();
    const chip = (it) => {
      const isOut = it.port && /^(OUT|LNK)/.test(it.port), isIn = it.port && /^IN/.test(it.port);
      let cc = null;
      if (isOut) cc = P.cables.find(c => c.from === nid && c.fromUnit === unitId && c.pOut === it.port);
      else if (isIn) cc = P.cables.find(c => c.to === nid && c.toUnit === unitId && c.pIn === it.port);
      const col = cc ? CTYPES[cc.type].c : null;
      const click = it.port ? (cc ? `pickCable('${cc.id}')` : `portClick('${nid}','${unitId}','${it.port}',${isOut})`) : '';
      return `<span onclick="${click}" title="${esc(it.label || it.t)}${cc ? ' · כבל ' + LBL[cc.id] : it.port ? ' — לחץ לחיבור' : ''}" style="position:relative;cursor:${it.port ? 'pointer' : 'default'};display:inline-flex;flex-direction:column;align-items:center">
        <span style="${col ? 'outline:2.5px solid ' + col + ';border-radius:50%' : ''}">${rearGlyph(it.t)}</span>
        ${cc ? `<span style="position:absolute;top:-7px;right:-7px;background:#fff;border:2px solid ${col};color:${col};border-radius:50%;min-width:14px;height:14px;font-size:8px;font-weight:800;display:flex;align-items:center;justify-content:center">${LBL[cc.id]}</span>` : ''}
        <small style="color:#cbd2e0;font-size:8px">${esc(it.label || '')}</small></span>`;
    };
    const outs = layout.filter(it => it.port && /^(OUT|LNK)/.test(it.port));
    const ins = layout.filter(it => it.port && /^IN/.test(it.port));
    const other = layout.filter(it => !it.port);
    const rowW = (label, arr) => arr.length ? `<div style="display:flex;align-items:center;gap:8px;background:#2d3444;border-radius:7px;padding:6px 9px;margin-top:4px;direction:ltr">
      <b style="color:#fff;font-size:10px;min-width:38px">${label}</b><span style="display:flex;gap:8px;flex-wrap:wrap">${arr.map(chip).join('')}</span></div>` : '';
    return rowW('OUT ⭢', outs) + rowW('IN ⭠', ins) + (other.length ? rowW('· · ·', other) : '')
      + (nid ? '<p class="muted" style="font-size:10px;margin-top:3px">💡 לחץ על יציאה ואז על מוצר בתכנית — הכבל ישויך למחבר. ✎ גב לעריכת הפריסה.</p>' : '');
  }
  const io = ioFor(name);
  if (!io) return '<p class="muted">אין נתוני ממשק למוצר זה — פתח "✎ גב" והגדר את המחברים, או שלח לי את שם הדגם ואוסיף</p>';
  const row = (label, txt, isOut) => {
    const m = txt.match(/(\d+)\s*[-×x]/i);
    const cnt = m ? Math.min(+m[1], 8) : 2;
    const kind = /ספיקון|NL4/i.test(txt) ? 'speakon' : /XLR/i.test(txt) ? (isOut ? 'xlrm' : 'xlrf') : /RCA|BNC/i.test(txt) ? 'bnc' : /Dante|OMNEO|רשת/i.test(txt) ? 'rj45' : /בורג|Hi-Z/i.test(txt) ? 'pwr' : 'xlrf';
    let g = '';
    for (let k = 0; k < cnt; k++) {
      const glyph = connGlyph(kind);
      /* לחיצה על יציאה מתחילה כבל מהיציאה הזו — ואז לוחצים על הרמקול בתכנית */
      g += (nid)
        ? `<span onclick="portClick('${nid}','${unitId}','${(isOut ? 'OUT ' : 'IN ') + (k + 1)}',${isOut})" title="חבר כבל מ-${(isOut ? 'OUT ' : 'IN ') + (k + 1)}" style="cursor:pointer;${wireMode?.[isOut ? 'pOut' : 'pIn'] === (isOut ? 'OUT ' : 'IN ') + (k + 1) && wireMode?.from?.unitId === unitId ? 'outline:2px solid #ff8a50;border-radius:50%' : ''}">${glyph}</span>`
        : glyph;
    }
    return `<div style="display:flex;align-items:center;gap:6px;background:#2d3444;border-radius:7px;padding:6px 9px;margin-top:4px;direction:ltr">
      <b style="color:#fff;font-size:10px;min-width:38px">${label}</b><span style="display:flex;gap:3px;flex-wrap:wrap">${g}</span>
      <small style="color:#cbd2e0;font-size:9px;flex:1;text-align:right;direction:rtl">${esc(txt)}</small></div>`;
  };
  return row('IN ⭠', io.i, false) + row('OUT ⭢', io.o, true)
    + (io.x ? `<p class="muted" style="font-size:10px;margin-top:3px">${esc(io.x)}</p>` : '')
    + (nid ? '<p class="muted" style="font-size:10px;margin-top:3px">💡 לחץ על יציאה ואז על מוצר בתכנית — הכבל ישויך ליציאה</p>' : '');
}
function endNameTxt(nid, unitId) {
  const n = byId(nid);
  if (!n) return '?';
  const u = unitId && (n.units || []).find(x => x.id === unitId);
  return (u ? u.name : n.name);
}
function startPortWire(nid, unitId, portStr, isOut) {
  /* לחיצה על מחבר: בוחרים איזה כבל לפרוס, ואז לוחצים על היעד בתכנית */
  if (isOut === undefined) isOut = true; /* תאימות לאחור */
  ensureStock(P);
  /* כבל מומלץ לפי סוג המחבר במקור (XLR→כבל XLR 1 מ׳, speakon→ספיקון וכו') */
  let recType = 'multi', recName = 'כבל XLR', recLen;
  for (const nn of P.nodes) if (nn.id === nid && nn.kind === 'rack') { const uu = (nn.units || []).find(x => x.id === unitId); if (uu) { const ci = (rearLayout(uu.name) || []).find(x => x.port === portStr); const t = ci && ci.t; if (t === 'speakon') { recType = 'nl4'; recName = 'כבל ספיקון NL4'; } else if (t === 'rj45') { recType = 'cat'; recName = 'כבל רשת CAT6'; } else if (t === 'bnc') { recType = 'sdi'; recName = 'כבל BNC/SDI'; } else if (t === 'rca') { recType = 'multi'; recName = 'כבל RCA'; } else { recType = 'multi'; recName = 'כבל XLR'; recLen = 1; } } }
  const opts = [];
  P.stock.cables.forEach(s => opts.push({ ref: 'cable|' + s.id, type: s.type, nm: '🔌 כבל מוכן: ' + s.name.slice(0, 40) + ` · ${s.used || 0}/${s.qty || 0}` }));
  P.stock.reels.forEach(s => opts.push({ ref: 'reel|' + s.id, type: s.type, nm: '🧵 מגליל: ' + s.name.slice(0, 40) + ` · ${Math.round(s.used || 0)}/${s.total || 0} מ׳` }));
  /* כבלים/גלילים מתוך הצעת המחיר שעדיין לא נכנסו למלאי */
  impItems.forEach(it => {
    if ((it.dest === 'cable' || it.dest === 'reel') && !it.stockId)
      opts.push({ iid: it.iid, type: it.type, nm: (it.dest === 'reel' ? '🧵 מהצעה (גליל): ' : '🔌 מהצעה: ') + it.name.slice(0, 40) });
  });
  /* המלצה ראשית — כבל/גליל שכבר בהצעה, מסוג המחבר. תמיד מוצג ראשון עם "מתוך הצעה" */
  const offerRec = opts.find(o => o.type === recType) || opts.find(o => recType === 'nl4' && o.type === 'nl4') || null;
  const go = (ref, iid) => {
    const ov = document.getElementById('portPickOv');
    if (ov) ov.remove();
    if (iid) { const it = impItems.find(x => x.iid === iid); const s = it && ensureStockItem(it); ref = s ? ((it.dest === 'reel' ? 'reel|' : 'cable|') + s.id) : null; }
    wireStock = ref || null;
    wireMode = { from: { nid, unitId }, srcPort: portStr, srcIsOut: isOut };
    if (isOut) wireMode.pOut = portStr; else wireMode.pIn = portStr;
    pinMode = null; connPin = null;
    render();
  };
  if (!opts.length) { go(null); return; }
  const old = document.getElementById('portPickOv');
  if (old) old.remove();
  const ov = document.createElement('div');
  ov.id = 'portPickOv';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(20,24,32,.45);z-index:99;display:flex;align-items:center;justify-content:center';
  ov.innerHTML = `<div style="background:#fff;border-radius:12px;padding:16px;max-width:420px;width:92%;max-height:70vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,.35)">
      <b style="display:block;margin-bottom:8px">${esc(portStr)} — באיזה כבל להשתמש?</b>
      ${offerRec ? `<button style="display:block;width:100%;text-align:right;margin-bottom:5px;background:#0f6e56;color:#fff;font-weight:700" onclick="__portGo('${offerRec.ref || ''}','${offerRec.iid || ''}')">⭐ מומלץ (מתוך הצעה): ${esc(offerRec.nm.replace(/^[🔌🧵]\s*(מהצעה( \(גליל\))?: |כבל מוכן: |מגליל: )/, ''))}</button>` : ''}
      <button style="display:block;width:100%;text-align:right;margin-bottom:5px;background:${offerRec ? '#f4f2ec' : '#0f6e56'};${offerRec ? '' : 'color:#fff;font-weight:700'}" onclick="__portRec()">${offerRec ? '' : '⭐ מומלץ: '}${esc(recName)}${recLen ? ' · ' + recLen + ' מ׳' : ''}</button>
      <button style="display:block;width:100%;text-align:right;margin-bottom:5px;background:#f4f2ec" onclick="__portGo('','')">➰ כבל רגיל לפי סוג החיבור</button>
      ${opts.filter(o => o !== offerRec).map((o, i) => `<button style="display:block;width:100%;text-align:right;margin-bottom:5px" onclick="__portGo('${o.ref || ''}','${o.iid || ''}')">${esc(o.nm)}</button>`).join('')}
      <div style="border-top:1px solid #eee;margin:8px 0 6px;padding-top:8px">
        <input id="portSearch" placeholder="🔍 חפש כבל מההצעה / טבלת הפריטים…" style="width:100%" oninput="__portSearchRender(this.value)">
        <div id="portSearchRes" style="margin-top:4px"></div>
      </div>
      <button style="display:block;width:100%;margin-top:6px;background:#f3d9d2" onclick="document.getElementById('portPickOv').remove()">ביטול</button>
    </div>`;
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  window.__portGo = (ref, iid) => go(ref || null, iid || null);
  window.__portRec = () => {
    /* יוצר/מוצא כבל מוכן מומלץ בהצעה ומשתמש בו */
    let it = impItems.find(x => x.dest === 'cable' && x.name === recName);
    if (!it) { it = { on: true, qty: 1, name: recName, src: 'אוטומטי — חיבור', dest: 'cable', cat: 'other', u: 1, type: recType, len: recLen, conn: connFor(recType), iid: uid('i') }; autoPrice(it); impItems.push(it); }
    const s = ensureStockItem(it);
    go('cable|' + s.id, null);
  };
  window.__portSearchRender = q => {
    q = (q || '').trim();
    const box = document.getElementById('portSearchRes');
    if (!box) return;
    const res = q ? dockSearchResults(q).filter(r => r.type === 'item') : [];
    box.innerHTML = res.map(r => `<button style="display:block;width:100%;text-align:right;margin-bottom:4px;font-size:12px" onclick="__portSearchGo('${esc(r.name).replace(/'/g, '&#39;')}','${r.key || ''}')">🧾 ${esc(r.name.slice(0, 46))}</button>`).join('') || (q ? '<p class="muted" style="font-size:11px">לא נמצא</p>' : '');
  };
  window.__portSearchGo = (name, key) => {
    let it = impItems.find(x => x.name === name && (x.dest === 'cable' || x.dest === 'reel'));
    if (!it) {
      const st = classifyStock(name);
      it = (st && (st.dest === 'cable' || st.dest === 'reel'))
        ? { on: true, qty: 1, name, src: 'חיפוש כבל', key, ...st }
        : { on: true, qty: 1, name, src: 'חיפוש כבל', key, dest: 'cable', cat: 'other', u: 1, type: cabTypeOf(name), len: 1 };
      it.iid = uid('i'); autoPrice(it); impItems.push(it);
    }
    const s = ensureStockItem(it);
    go((it.dest === 'reel' ? 'reel|' : 'cable|') + s.id, null);
  };
  document.body.appendChild(ov);
}
/* ניתוב פורטים — אילו יציאות/כניסות תפוסות, לאן, ואילו פנויות לחיבור בלחיצה */
function ioRoutingHTML(name, nid, unitId) {
  const io = ioFor(name);
  const cntOf = txt => { const m = txt && txt.match(/(\d+)\s*[-×x]/i); return m ? Math.min(+m[1], 8) : 4; };
  const outN = io ? cntOf(io.o) : 4, inN = io ? cntOf(io.i) : 4;
  const LBL = cableLabels();
  const line = (txt, cls, click) => `<div onclick="${click || ''}" style="display:flex;align-items:center;gap:6px;font-size:11px;padding:4px 8px;margin:3px 0;border-radius:6px;cursor:pointer;${cls === 'used' ? 'background:#e9f4ee;border:1px solid #bcd9c8' : cls === 'act' ? 'background:#ff8a50;font-weight:700' : 'border:1px dashed #c9b9a5;color:#7a6f60'}">${txt}</div>`;
  let h = `<div style="font-weight:800;font-size:11px;margin-top:8px">יציאות OUT — לחץ על פנויה ואז על היעד בתכנית</div>`;
  for (let k = 1; k <= outN; k++) {
    const c = P.cables.find(c => c.from === nid && c.fromUnit === unitId && c.pOut === 'OUT ' + k);
    const act = wireMode && wireMode.pOut === 'OUT ' + k && wireMode.from && wireMode.from.unitId === unitId;
    h += c
      ? line(`<b>OUT ${k}</b> תפוס ⟵ ${endName(c.to, c.toUnit)} <span class="badge" style="background:${CTYPES[c.type].c}">${LBL[c.id]}</span>`, 'used', `pickCable('${c.id}')`)
      : line(act ? `<b>OUT ${k}</b> — עכשיו לחץ על המוצר היעד בתכנית…` : `<b>OUT ${k}</b> פנוי — לחץ לחיבור`, act ? 'act' : 'free', `portClick('${nid}','${unitId}','OUT ${k}',true)`);
  }
  h += `<div style="font-weight:800;font-size:11px;margin-top:8px">כניסות IN</div>`;
  for (let k = 1; k <= inN; k++) {
    const c = P.cables.find(c => c.to === nid && c.toUnit === unitId && c.pIn === 'IN ' + k);
    h += c
      ? line(`<b>IN ${k}</b> תפוס ⟵ מ-${endName(c.from, c.fromUnit)} <span class="badge" style="background:${CTYPES[c.type].c}">${LBL[c.id]}</span>`, 'used', `pickCable('${c.id}')`)
      : line(`<b>IN ${k}</b> פנוי — לחץ לחיבור`, 'free', `portClick('${nid}','${unitId}','IN ${k}',false)`);
  }
  const un = P.cables.filter(c => (c.from === nid && c.fromUnit === unitId && !c.pOut) || (c.to === nid && c.toUnit === unitId && !c.pIn));
  if (un.length)
    h += `<div style="font-weight:800;font-size:11px;margin-top:8px">כבלים ללא שיוך פורט (${un.length}) — לחץ לפתיחה ושיוך</div>` +
      un.map(c => line(`<span class="badge" style="background:${CTYPES[c.type].c}">${LBL[c.id]}</span> ${endName(c.from, c.fromUnit)} ⟵ ${endName(c.to, c.toUnit)}`, 'used', `pickCable('${c.id}')`)).join('');
  return h;
}
function connFor(type) {
  return { nl4: 'speakon', multi: 'xlrm', xlr: 'xlrm', cat: 'rj45', sdi: 'bnc', dmx: 'xlrm', pwr: 'pwr', fiber: 'fiber' }[type] || 'xlrf';
}
function cableForm(c) {
  const opts = v => P.nodes.map(n => `<option value="${n.id}" ${v === n.id ? 'selected' : ''}>${esc(n.name)}</option>`).join('');
  const cnid = 'cn' + Math.random().toString(36).slice(2);
  const curConn = c?.conn || connFor(c?.type || 'multi');
  const copts = Object.entries(CONNS).filter(([k]) => k !== 'empty').map(([k, v]) => `<option value="${k}" ${curConn === k ? 'selected' : ''}>${v.n}</option>`).join('');
  const topts = Object.entries(CTYPES).map(([k, v]) => `<option value="${k}" ${c && c.type === k ? 'selected' : ''}>${v.n}</option>`).join('');
  const f0 = c?.from ?? P.nodes[0]?.id, t0 = c?.to ?? P.nodes[0]?.id;
  const fid = 'fu' + Math.random().toString(36).slice(2), tid = 'tu' + Math.random().toString(36).slice(2);
  return `
    <div class="fld"><label>סטטוס התקנה</label><select name="inst">
      <option value="" ${!c?.inst ? 'selected' : ''}>➕ כבל חדש (מהמלאי/הצעה)</option>
      <option value="exist" ${c?.inst === 'exist' ? 'selected' : ''}>♻️ כבל קיים במקום — שימוש חוזר</option>
      <option value="pull" ${c?.inst === 'pull' ? 'selected' : ''}>🚚 כבל חדש להעברה במקום</option>
    </select></div>
    <div class="row2">
      <div class="fld"><label>מ־ (מוקד)</label><select name="from" onchange="document.getElementById('${fid}').innerHTML=unitOpts(this.value,null)">${opts(f0)}</select></div>
      <div class="fld"><label>אל (מוקד)</label><select name="to" onchange="document.getElementById('${tid}').innerHTML=unitOpts(this.value,null)">${opts(t0)}</select></div>
    </div>
    ${endLevelHTML('from', c, f0, fid)}
    ${endLevelHTML('to', c, t0, tid)}
    <div class="row2"><div class="fld"><label>סוג כבל</label><select name="type" onchange="document.getElementById('${cnid}').value=connFor(this.value)">${topts}</select></div>
    <div class="fld"><label>כמות</label><input name="qty" value="${esc(c?.qty ?? '1')}"></div></div>
    <div class="fld"><label>קווי XLR פנימיים במולטי (מספר · מולטי XLR)</label><input name="cores" type="number" min="1" value="${c?.cores ?? ''}" placeholder="למשל 24 — לא משנה זכר/נקבה"></div>
    <div class="fld"><label>סוג סיב (לכבל אופטי)</label><select name="fiber">
      ${['', 'Single Mode OS2', 'Multimode OM3', 'Multimode OM4', 'Multimode OM5'].map(fm => `<option value="${fm}" ${(c?.fiber || '') === fm ? 'selected' : ''}>${fm || '— לא אופטי / לא צוין —'}</option>`).join('')}
    </select></div>
    <div class="row2">
      <div class="fld"><label>מחבר בקצה מוצא</label><select name="conn" id="${cnid}">${copts}</select></div>
      <div class="fld"><label>מחבר בקצה יעד</label><select name="conn2">${'<option value="">— כמו מוצא —</option>' + Object.entries(CONNS).filter(([k]) => k !== 'empty').map(([k, v]) => `<option value="${k}" ${c?.conn2 === k ? 'selected' : ''}>${v.n}</option>`).join('')}</select></div>
    </div>

    <div class="fld"><label>עובי / מפרט</label><input name="spec" value="${esc(c?.spec ?? '')}" placeholder="למשל 4×4 ממ״ר"></div>
    <div class="fld"><label>הערה</label><input name="note" value="${esc(c?.note ?? '')}"></div>
    <div class="fld"><label style="display:flex;align-items:center;gap:6px;cursor:pointer"><input type="checkbox" name="dir" style="width:auto" ${c?.dir === 'both' ? 'checked' : ''}> כבל דו־כיווני (חץ בשני הצדדים)</label></div>
    ${c ? '' : stockFormHTML()}
    <h3 class="sec">ירידת מתח — קו רמקול</h3>
    <div class="row2">
      <div class="fld"><label>חתך גיד (ממ״ר)</label><select name="mm" oninput="vdLive(this.form)">
        <option value="">—</option>${[1.5, 2.5, 4, 6, 10].map(v => `<option value="${v}" ${c?.mm === v ? 'selected' : ''}>${v}</option>`).join('')}
      </select></div>
      <div class="fld"><label>מרחק (מ׳)</label><input name="len" type="number" min="0" step="1" value="${c?.len ?? ''}" oninput="vdLive(this.form)"></div>
    </div>
    ${c && P.scale ? measuredHTML(c) : ''}
    <div class="row2">
      ${(() => {
    const L = c && c.pOut && !/חור/.test(c.pOut || '') ? chainLoad(c.from, c.fromUnit, c.pOut) : null;
    /* ירוק = תקין עד האום המינימלי של המגבר עצמו (מטבלת הנתונים), לא סף קבוע */
    const uL = c && unitOf(c.from, c.fromUnit);
    const moL = uL ? ampMinOhm(uL.name) : 4;
    const note = L && L.n > 1 ? ` <span style="color:${L.z < moL - 0.05 ? '#c1121f' : '#0f6e56'};font-size:10px;font-weight:700" title="מינ׳ ${moL}Ω למגבר זה">חוק אום: ${L.n} רמקולים במקביל = ${L.z.toFixed(1)}Ω${L.z < moL - 0.05 ? ' ⚠ מתחת למינ׳ ' + moL + 'Ω' : ' ✓ (מינ׳ ' + moL + 'Ω)'}</span>` : '';
    return `<div class="fld"><label>עומס בקצה (Ω)${note}</label><input name="imp" type="number" min="0.5" step="0.5" value="${c?.imp ?? (L ? +L.z.toFixed(1) : guessZ(c))}" oninput="vdLive(this.form)"></div>`;
  })()}
      <div class="fld"><label>תוצאה</label><div class="vd" data-vd>${vdText(c?.mm, c?.len, c?.imp ?? guessZ(c))}</div></div>
    </div>`;
}
function measuredHTML(c) {
  const a = byId(c.from), b = byId(c.to);
  if (!a || !b || a === b) return '';
  const d = Math.hypot(a.x - b.x, a.y - b.y) * P.scale;
  return `<p class="muted" style="margin:-2px 0 8px">📏 מרחק מדוד בתכנית: <b>${d.toFixed(1)} מ׳</b> (קו אווירי)
    <button style="padding:1px 8px" onclick="cById('${c.id}').len=${+d.toFixed(1)};render()">השתמש</button></p>`;
}
/* מינימום עומס לערוץ מגבר — מטבלת המגברים, לפי שם היחידה. ברירת מחדל 4Ω */
function ampMinOhm(uname) {
  const src = (typeof AMP_DATA !== 'undefined' ? AMP_DATA : []).find(d => d.kind === 'amp' && d.re && d.re.test(uname || ''));
  const custom = (store.ampLib && Object.entries(store.ampLib).find(([k, v]) => v.kind === 'amp' && uname && rearKey(uname).includes(k)));
  return (custom && custom[1].mo) || (src && src.mo) || 4;
}
/* סרגל פעולה צף כשמסומנים כמה רמקולים בריבוע */
function showMultiBar() {
  const old = document.getElementById('multiBar'); if (old) old.remove();
  if (!selMulti.size) return;
  const spk = [...selMulti].map(byId).filter(n => n && n.kind === 'point' && !/סאב|\bsub\b/i.test(n.name));
  const bar = document.createElement('div');
  bar.id = 'multiBar';
  bar.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:70;background:#1a1e28;color:#fff;border-radius:12px;padding:10px 14px;box-shadow:0 6px 24px rgba(0,0,0,.4);display:flex;gap:10px;align-items:center;direction:rtl';
  bar.innerHTML = `<b style="font-size:13px">${selMulti.size} מסומנים</b>
    ${spk.length >= 2 ? `<button style="background:#0f6e56;color:#fff;font-weight:700;padding:6px 12px;border-radius:8px" onclick="chainSelectedToAmp()">🔗 שרשר ${spk.length} רמקולים למגבר</button>` : ''}
    <button style="background:#f3d9d2;color:#8c2f16;padding:6px 12px;border-radius:8px" onclick="uiConfirm('למחוק ${selMulti.size} מסומנים?').then(ok=>{if(!ok)return;[...selMulti].forEach(id=>{const n=byId(id);if(n&&n.srcIid)unplace(n.srcIid)});P.nodes=P.nodes.filter(n=>!selMulti.has(n.id));P.cables=P.cables.filter(c=>byId(c.from)&&byId(c.to));selMulti.clear();render();save();document.getElementById('multiBar').remove();})">🗑 מחק</button>
    <button style="background:#3a4152;color:#fff;padding:6px 10px;border-radius:8px" onclick="selMulti.clear();render();document.getElementById('multiBar').remove()">✕</button>`;
  document.body.appendChild(bar);
}
/* שרשור הרמקולים המסומנים (בחירת ריבוע) לערוצי מגבר */
async function chainSelectedToAmp(forceAmp) {
  const spk = [...selMulti].map(byId).filter(n => n && n.kind === 'point' && !/סאב|\bsub\b/i.test(n.name));
  if (spk.length < 2) return;
  /* בחירת מגבר */
  const amps = [];
  P.nodes.filter(n => n.kind === 'rack').forEach(rk => (rk.units || []).forEach(u => { if (/מגבר|amp|DPA|DNA|MA\s?\d|IPD|PLM|XLI|DYNAMIQ|DAP\s?\d|MX3/i.test(u.name)) amps.push({ rk, u }); }));
  let amp = forceAmp || amps[0];
  if (!forceAmp && amps.length > 1) {
    const list = amps.map((a, i) => `${i + 1}. ${a.u.name.slice(0, 30)}`).join('\n');
    const pick = await uiPrompt('לאיזה מגבר לחבר?\n' + list + '\n\nהקלד מספר:', '1', { type: 'number' });
    if (pick === null) return; amp = amps[(+pick || 1) - 1] || amps[0];
  }
  const minOhm = amp ? ampMinOhm(amp.u.name) : 4;
  const chCount = amp ? ampChCount(amp.u.name) : 1;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const avail = spk.slice();
  const chains = [];
  for (let ch = 0; ch < chCount && avail.length; ch++) {
    let si = 0; if (amp) { let bd = Infinity; avail.forEach((p, i) => { const d = dist(amp.rk, p); if (d < bd) { bd = d; si = i; } }); }
    let cur = avail.splice(si, 1)[0]; const seg = []; let invZ = 1 / spkOhm(cur), head = cur, cnt = 1;
    while (avail.length) { let bi = -1, bd = Infinity; avail.forEach((p, i) => { const d = dist(cur, p); if (d < bd) { bd = d; bi = i; } }); const nx = avail[bi]; const ni = invZ + 1 / spkOhm(nx); if (1 / ni < minOhm - 0.05) break; avail.splice(bi, 1); seg.push({ from: cur, to: nx }); invZ = ni; cur = nx; cnt++; }
    chains.push({ seg, head, count: cnt, z: 1 / invZ });
  }
  const desc = chains.map((c, i) => `ערוץ ${i + 1}: ${c.count} רמקולים · ${c.z.toFixed(1)}Ω`).join('\n');
  const choice2 = await wireConfirm(`${amp ? amp.u.name.slice(0, 28) + ' · ' : ''}${chCount} ערוצים · מינ׳ ${minOhm}Ω\n\n${desc}${avail.length ? '\n\n⚠ נשארו ' + avail.length + ' ללא ערוץ' : ''}`);
  if (!choice2) return;
  if (choice2 === 'pick') { const a = await pickAmpDialog(); if (a) return chainSelectedToAmp(a); return; }
  chains.forEach((c, i) => {
    if (amp) { const cc = { id: uid('c'), from: amp.rk.id, fromUnit: amp.u.id, to: c.head.id, type: 'nl4', qty: '1', spec: '', note: 'ערוץ ' + (i + 1), conn: 'speakon', conn2: 'speakon', pOut: 'OUT ' + (i + 1) }; if (P.scale) cc.len = +(dist(amp.rk, c.head) * P.scale).toFixed(1); P.cables.push(cc); }
    c.seg.forEach(s => { const cb = { id: uid('c'), from: s.from.id, to: s.to.id, type: 'nl4', qty: '1', spec: '', note: 'שרשור', conn: 'speakon', conn2: 'speakon' }; if (P.scale) cb.len = +(dist(s.from, s.to) * P.scale).toFixed(1); P.cables.push(cb); });
  });
  selMulti.clear(); const b = document.getElementById('multiBar'); if (b) b.remove();
  render(); save();
}
/* מותגי פרימיום — כל רמקול מקבל קו נפרד למגבר, בלי שרשור */
const PREMIUM_RE = /FUNKTION|F1[02]1|F1201|\bF8[18]\b|\bF55\b|\bF5\b|RES\s?\d|EVO|MB2\d|BR\s?1|F118|F221|GRAVIS|SPECTRA|CA\s?-?10|NOMOS|K&F|KLING|LAMBDA|CX-?\d/i;
/* 🔌 חיווט חכם — מחבר את כל רמקולי האזור למגבר לפי הכללים:
   פרימיום (F-One/K&F/Lambda) = קו נפרד לכל רמקול · סאב = תמיד קו נפרד ·
   רמקולי רקע (KT/Unicorn) = שרשור לפי קרבה עד מינימום העומס של המגבר */
/* ===================================================================
   עורך חיווט גרפי — מטריצת מגברים × ערוצים.
   גוררים (או מקישים) רמקולים בין יציאות, רואים עומס/הספק חי, ומחברים.
   =================================================================== */
let PATCH = null;
function patchCss() {
  if (document.getElementById('patchCss')) return;
  const st = document.createElement('style');
  st.id = 'patchCss';
  st.textContent = `
    /* חלון צף ולא-חוסם — התכנית נשארת גלויה ולחיצה, והחלון נגרר לאן שנוח */
    #patchOv{position:fixed;inset:0;z-index:130;pointer-events:none}
    #patchBox{position:absolute;background:#fff;border-radius:14px;width:min(680px,94vw);max-height:88vh;display:flex;flex-direction:column;box-shadow:0 16px 50px rgba(0,0,0,.4);overflow:hidden;pointer-events:auto;border:1px solid #d8d2c6}
    #patchBox .ph{background:linear-gradient(135deg,#1a1e28,#2d3444);color:#fff;padding:11px 14px;display:flex;align-items:center;gap:8px;cursor:grab;user-select:none;touch-action:none}
    #patchBox .ph:active{cursor:grabbing}
    .node.pchHi{outline:4px solid #ff8a50;outline-offset:3px;border-radius:12px;z-index:88 !important;filter:drop-shadow(0 0 8px rgba(255,138,80,.9))}
    #patchBox .ph b{flex:1;font-size:15px}
    #patchBox .pb{padding:12px 14px;overflow-y:auto;background:#faf8f4}
    .pchAmp{background:#fff;border:1px solid #e3ded3;border-radius:11px;margin-bottom:9px;overflow:hidden}
    .pchAmpHd{background:#f4f2ec;padding:6px 10px;font-size:12.5px;font-weight:700;display:flex;align-items:center;gap:8px}
    .pchAmpHd small{font-weight:400;color:#8a8377;font-size:11px}
    .pchCh{display:flex;align-items:center;gap:8px;padding:5px 9px;border-top:1px solid #f0ede6;min-height:38px}
    .pchCh.drop{background:#eef7f1;outline:2px dashed #0f6e56;outline-offset:-3px}
    .pchCh.lock{opacity:.5}
    .pchOut{flex:none;width:56px;font-size:11.5px;font-weight:800;color:#c9502e}
    .pchChips{flex:1;display:flex;flex-wrap:wrap;gap:4px;min-height:24px;align-items:center}
    .pchZ{flex:none;font-size:11px;font-weight:700;white-space:nowrap;padding:1px 7px;border-radius:9px}
    .pchZ.ok{background:#eef7f1;color:#0f6e56}.pchZ.bad{background:#fdeeee;color:#c1121f}.pchZ.emp{background:#f4f2ec;color:#a9a396}
    .pchip{display:inline-flex;align-items:center;gap:4px;background:#2d3444;color:#fff;border-radius:8px;padding:2px 7px;font-size:11px;cursor:grab;user-select:none;border:2px solid transparent}
    .pchip.sel{border-color:#ff8a50;box-shadow:0 0 0 2px rgba(255,138,80,.35)}
    .pchip.sub{background:#6a4fc9}.pchip.prem{background:#0f6e56}
    .pchip b{font-size:12px}
    .pchPool{background:#fff;border:2px dashed #d9d2c4;border-radius:11px;padding:8px 10px;min-height:44px}
    .pchPool.drop{background:#eef7f1;border-color:#0f6e56}
    #patchBox .pf{padding:9px 14px;border-top:1px solid #eee;display:flex;gap:7px;background:#fff}
    #patchBox .pf button{flex:1;padding:9px;border-radius:9px;border:1px solid #ddd;background:#fff;cursor:pointer;font-size:13px}
    #patchBox .pf button.go{background:#0f6e56;color:#fff;border:none;font-weight:700}`;
  document.head.appendChild(st);
}
const patchNum = n => { const m = (n.name || '').match(/\((\d+)\)(?!.*\(\d+\))/); return m ? m[1] : '•'; };
/* שם המוצר המלא של מוקד — שמות על התכנית נחתכים ל-40 תווים ומאבדים את הדגם,
   אז מעדיפים את שם הפריט המקורי מהצעת המחיר */
function nodeFullName(n) {
  if (n && n.srcIid) { const it = impItems.find(x => x.iid === n.srcIid); if (it && it.name) return it.name; }
  return (n && n.name) || '';
}
/* שם קצר וקריא לדגם — "…מדגם F81 100W…" → "F81" */
function shortModel(name) {
  const s = String(name || '').replace(/\(\d+\)\s*$/, '').trim();
  const m = /מדגם\s+(.{2,22}?)(?:\s+(?:בעוצמה|וואט|\d+W\b|גודל|בצבע|עם|\d+X)|$)/i.exec(s);
  if (m) return m[1].trim();
  const en = s.match(/[A-Z][A-Z0-9\- ]{2,18}/);
  if (en) return en[0].trim();
  return s.replace(/^(רמקול|סאב|מגבר)\s+(פאסיבי|אקטיבי|מוגבר)?\s*(תוצרת)?\s*/i, '').slice(0, 18).trim();
}
/* סוג המוצר מטבלת הנתונים הטכניים — כולל דריסות ידניות בעמודת "סוג" */
function dbSpkType(prodName) {
  const nm = prodName || '';
  const d = spkData(nm);
  const rowNm = d && d.re ? prettyRe(d.re) : rearKey(nm);
  const m = (store.spkMeta || {})[rearKey(rowNm)] || (store.spkMeta || {})[rearKey(nm)];
  if (m && m.typ) return m.typ;
  if (/סאב|\bsub\b|\bSB\s?\d|BR\s?1\d\d|BASS|INFRA|MB\d|F118|F121|F221|F215|NOMOS/i.test(rowNm + ' ' + nm)) return 'סאב';
  if (/column|קולום|VERTUS/i.test(rowNm + ' ' + nm)) return 'קולום';
  if (/שקוע|ceiling|\bCS\s?\d/i.test(rowNm + ' ' + nm)) return 'שקוע';
  return null;
}
const patchKind = n => dbSpkType(n.name) === 'סאב' || isActiveSub(n.name) || /סאב|\bsub\b|NOMOS|MB2|BR\s?1|F118|F221/i.test(n.name) ? 'sub' : PREMIUM_RE.test(n.name) ? 'prem' : '';
function patchOpen(z, amps, lines, leftover) {
  patchCss();
  PATCH = {
    zid: z.id, sel: null,
    amps: amps.map(a => ({ rk: a.rk, u: a.u, minOhm: a.minOhm, chTotal: a.chTotal, pre: a.pre || new Set() })),
    slots: {}, pool: leftover.map(n => n.id)
  };
  lines.forEach(l => { PATCH.slots[amps.indexOf(l.amp) + '|' + l.ch] = [l.head.id, ...l.seg.map(s => s.to.id)]; });
  /* ערוצים שכבר מחוברים — מציגים את הרמקולים המחוברים בפועל; 🔓 משחרר לעריכה */
  PATCH.preCables = {}; PATCH.redo = {}; PATCH.orig = {};
  PATCH.amps.forEach((a, ai) => {
    [...a.pre].forEach(ch => {
      const port = 'OUT ' + ch;
      const head = P.cables.find(c => c.from === a.rk.id && (c.fromUnit || null) === (a.u.id || null) && c.pOut === port);
      if (!head) return;
      const cl = chainLoad(a.rk.id, a.u.id, port);
      const ids = cl && cl.spks && cl.spks.length ? cl.spks.map(n => n.id) : [head.to];
      PATCH.slots[ai + '|' + ch] = ids;
      PATCH.orig[ai + '|' + ch] = ids.join(',');
      const inSet = new Set(ids);
      PATCH.preCables[ai + '|' + ch] = P.cables.filter(c => c.id === head.id || (inSet.has(c.from) && inSet.has(c.to))).map(c => c.id);
    });
    a.pre = new Set(); /* אין ערוצים נעולים — הכול ניתן לעריכה בכל שלב */
  });
  const ov = document.createElement('div');
  ov.id = 'patchOv';
  ov.innerHTML = `<div id="patchBox">
      <div class="ph" id="patchDrag"><span style="opacity:.6">⠿</span><b>🔌 חיווט — ניתוב רמקולים למגברים</b>
        <small style="opacity:.8;font-size:11px">גרור צ׳יפ ליציאה · הקש עליו כדי לראות אותו על התכנית</small>
        <button onclick="patchClose()" style="background:transparent;border:none;color:#fff;font-size:16px;cursor:pointer">✕</button></div>
      <div class="pb" id="patchBody"></div>
      <div style="display:flex;gap:6px;align-items:center;padding:6px 12px;border-top:1px solid #eee;font-size:12px;background:#faf8f4">
        🧵 <span style="white-space:nowrap">כבל הרמקולים ייחתך מ:</span>
        <select id="pchCableSrc" title="הקווים שייווצרו ישויכו למוצר הכבל הזה — המטרים נצרכים ממנו" style="flex:1;font-size:12px;padding:3px 6px;border:1px solid #ddd;border-radius:7px">${patchCableOpts()}</select>
      </div>
      <div class="pf">
        <button onclick="patchClose()">ביטול</button>
        <button onclick="patchAutoFill()">⚡ סדר אוטומטית</button>
        <button onclick="patchAddAmp()">➕ הוסף מגבר</button>
        <button class="go" onclick="patchApply()">🔌 חבר</button>
      </div></div>`;
  document.body.appendChild(ov);
  /* מיקום ברירת מחדל — צד שמאל, כדי שהתכנית מימין תישאר גלויה */
  const box = document.getElementById('patchBox');
  const pos = store.patchPos || { x: 16, y: Math.max(12, (window.innerHeight - 560) / 2) };
  box.style.left = Math.min(pos.x, window.innerWidth - 220) + 'px';
  box.style.top = Math.min(pos.y, window.innerHeight - 120) + 'px';
  /* גרירת החלון בכותרת */
  document.getElementById('patchDrag').addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    const r = box.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
    const mv = ev => {
      const x = Math.max(-r.width + 120, Math.min(window.innerWidth - 120, ev.clientX - dx));
      const y = Math.max(0, Math.min(window.innerHeight - 60, ev.clientY - dy));
      box.style.left = x + 'px'; box.style.top = y + 'px';
      store.patchPos = { x, y };
    };
    const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); save(); };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    e.preventDefault();
  });
  patchRender();
}
function patchClose() { PATCH = null; patchHiClear(); const o = document.getElementById('patchOv'); if (o) o.remove(); }
function patchHi(id, on) { const el = document.getElementById('nd_' + id); if (el) el.classList.toggle('pchHi', on); }
function patchHiClear() { document.querySelectorAll('.node.pchHi').forEach(e => e.classList.remove('pchHi')); }
/* נקודת הייחוס לדיליי — עמדת הנגינה/DJ של האזור (מקור הסאונד), אחרת ריכוז המגברים */
function zoneDelayRef(z) {
  const inZ = n => z && (n.sub || '').includes(z.name);
  return P.nodes.find(n => n.kind === 'point' && /עמדת נגינה|\bDJ\b|במה|stage/i.test(n.name) && inZ(n))
    || P.nodes.find(n => n.kind === 'point' && /עמדת נגינה|\bDJ\b|במה|stage/i.test(n.name))
    || (z && z._rackNodeId && byId(z._rackNodeId)) || null;
}
/* מרחק במטרים מנקודת הייחוס (0 כשאין כיול/ייחוס) */
function delayDistM(n, ref) { return (ref && P.scale) ? Math.hypot(n.x - ref.x, n.y - ref.y) * P.scale : 0; }
/* מקור עיקרי אמיתי לדיליי — במה/עמדת נגינה/DJ בלבד. ארון מגברים אינו מקור קול. */
function zoneSourceRef(z) {
  const inZ = n => z && (n.sub || '').includes(z.name);
  /* מיקרופון מדידה שהוצב ידנית גובר על הכול — זו הנקודה שממנה המתכנן רוצה לחשב */
  return P.nodes.find(n => n.ptype === 'mic' && n.dlyRef !== false)
    || P.nodes.find(n => n.kind === 'point' && /עמדת נגינה|\bDJ\b|במה|stage/i.test(n.name) && inZ(n))
    || P.nodes.find(n => n.kind === 'point' && /עמדת נגינה|\bDJ\b|במה|stage/i.test(n.name)) || null;
}
/* הצבת נקודת ייחוס לדיליי מתוך עורך החיווט */
function dlyMicPlace() {
  window.__micPlace = true;
  const w = document.getElementById('patchBox');
  if (w) w.style.opacity = '0.25';
  render();
  uiToast('🎙 לחץ על התכנית במקום שבו יימדד הדיליי — כל הערכים יחושבו ממנו');
}
/* מצב הדיליי: off = בלי (מוזיקת רקע מפוזרת) · geo = יישור גיאומטרי למקור · haas = geo + 15ms
   (אפקט קדימות — המאזין ממקם את המקור בבמה למרות שהקול מגיע מרמקול קרוב) */
function dlyMode(z) { return store.dlyMode || (zoneSourceRef(z) ? 'haas' : 'geo'); }
/* נקודת הייחוס בפועל: מקור אמיתי אם יש, אחרת ריכוז המגברים (יישור יחסי בלבד) */
function dlyRefOf(z) { return zoneSourceRef(z) || zoneDelayRef(z); }
const SND_MS_M = 1000 / 343; /* 2.92 ms למטר (343 מ׳/שנ׳ ב-20°C) */
/* תכנון דיליי לערוצים — הערוץ הקרוב למקור מקבל 0, השאר יחסית אליו */
function delayPlan(chans, src, mode) {
  const out = {};
  if (!src || !P.scale || mode === 'off') return out;
  const avg = {};
  chans.forEach(c => { if (c.nodes.length) avg[c.key] = c.nodes.reduce((s6, n6) => s6 + delayDistM(n6, src), 0) / c.nodes.length; });
  const vals = Object.values(avg);
  if (!vals.length) return out;
  const haas = mode === 'haas' ? 15 : 0;
  if (src.ptype === 'mic') {
    /* נקודת האזנה (מיקרופון מדידה): כל הרמקולים צריכים להגיע אליה יחד —
       הרחוק ביותר מקבל 0 והקרובים "ממתינים" לו. הפוך מיישור למקור. */
    const far = Math.max(...vals);
    Object.entries(avg).forEach(([k, v]) => { const ms = (far - v) * SND_MS_M; out[k] = ms < 0.5 ? 0 : ms; });
    return out;
  }
  /* מקור קול (במה/DJ): הקרוב למקור = 0, הרחוקים מתעכבים כדי להתלכד עם גל הבמה */
  const base = Math.min(...vals);
  Object.entries(avg).forEach(([k, v]) => { const ms = (v - base) * SND_MS_M; out[k] = ms < 0.5 ? 0 : ms + haas; });
  return out;
}
function patchZ(ids) { const inv = ids.map(byId).filter(Boolean).reduce((s, n) => s + 1 / spkOhm(n), 0); return inv ? 1 / inv : 0; }
function patchChip(id, ro) {
  const n = byId(id); if (!n) return '';
  const full = nodeFullName(n);
  return `<span class="pchip ${patchKind(n)} ${PATCH.sel === id ? 'sel' : ''}" ${ro ? `data-chipro="${id}" style="opacity:.85"` : `draggable="true" data-chip="${id}"`}
     title="${esc(full)} · ${spkOhm(n)}Ω · ${esc(n.sub || '')}"><b>${patchNum(n)}</b>${esc(shortModel(full))} <small style="opacity:.7">${spkOhm(n)}Ω</small></span>`;
}
function patchRender() {
  const body = document.getElementById('patchBody'); if (!body || !PATCH) return;
  let totAmpW = 0, totSpkW = 0;
  /* דיליי — לפי המקור העיקרי (במה/DJ) ובמצב שנבחר; ערוץ אחד לפחות תמיד 0 */
  const zD = (P.zones || []).find(x => x.id === PATCH.zid);
  const dSrcReal = zoneSourceRef(zD), dSrc = dlyRefOf(zD), dMode = dlyMode(zD);
  const dPlan = delayPlan(Object.entries(PATCH.slots).map(([k2, ids2]) => ({ key: k2, nodes: ids2.map(byId).filter(Boolean) })), dSrc, dMode);
  let anySpread = false;
  const amps = PATCH.amps.map((a, ai) => {
    const chs = [];
    for (let ch = 1; ch <= a.chTotal; ch++) {
      const key = ai + '|' + ch, ids = PATCH.slots[key] || [], locked = false;
      const zz = patchZ(ids), w = ids.length ? ampChW(a.u.name, zz) : null;
      /* צריכת הרמקולים בערוץ — RMS מנתוני הדגם (150W ברירת מחדל כשלא ידוע) */
      const sw = ids.reduce((s3, id2) => { const n3 = byId(id2); const pw = n3 ? (n3.pow ?? (spkData(n3.name) || {}).w) : null; return s3 + (pw == null ? 150 : +pw); }, 0);
      if (w) totAmpW += w; totSpkW += sw;
      const bad = ids.length && zz < a.minOhm - 0.05;
      /* דיליי מומלץ לערוץ + פער בתוך הערוץ (ערוץ = דיליי אחד לכולם) */
      const dts = ids.map(id2 => { const n2 = byId(id2); return n2 ? delayDistM(n2, dSrc) : 0; });
      const dMs = dPlan[key] != null ? dPlan[key] : null;
      const dSpread = dSrc && dMode !== 'off' && dts.length > 1 ? (Math.max(...dts) - Math.min(...dts)) * SND_MS_M : 0;
      if (dSpread > 5) anySpread = true;
      /* יחס הספק מגבר/רמקולים — אדום: המגבר חלש מהרמקולים · כתום: פחות מ-×2 ·
         ירוק: ×2 ומעלה (הכלל המקובל — headroom של 3dB) · זהב: ×3 ומעלה */
      const ratio = (w && sw) ? w / sw : null;
      const rc = ratio == null ? '' : ratio < 1 ? '#c1121f' : ratio < 2 ? '#c96a13' : ratio < 3 ? '#0f8a5f' : '#b7900f';
      const rTip = ratio == null ? '' : ratio < 1 ? 'המגבר חלש מהרמקולים — סכנת קליפ/שריפה' : ratio < 2 ? 'פחות מ-×2 — headroom נמוך' : ratio < 3 ? '×2 ומעלה — תקין (3dB headroom)' : '×3 ומעלה — headroom נדיב';
      const wTxt = w ? ` · <b style="color:${rc}" title="${rTip}">🎚${w}W${ratio ? ' (×' + ratio.toFixed(1) + ')' : ''}</b>` : '';
      const zTxt = ids.length ? (bad ? '⚠ ' : '') + zz.toFixed(1) + 'Ω' + wTxt + (sw ? ' · 🔊' + sw + 'W' : '') + (dMs != null ? ` · <span style="${dSpread > 5 ? 'color:#c1121f;font-weight:700' : ''}">⏱${dMs.toFixed(1)}ms${dSpread > 5 ? '±' + (dSpread / 2).toFixed(1) : ''}</span>` : '') : '—';
      chs.push(`<div class="pchCh ${locked ? 'lock' : ''}" data-slot="${key}">
        <span class="pchOut" title="${PATCH.orig && PATCH.orig[key] != null ? 'ערוץ מחווט — כל שינוי כאן יחליף את הקווים הקיימים בעת החיבור' : 'ערוץ פנוי'}">${PATCH.orig && PATCH.orig[key] != null ? '🔌 ' : ''}OUT ${ch}</span>
        <div class="pchChips">${ids.map(id2 => patchChip(id2)).join('') || (locked ? '<small style="color:#a9a396;font-size:10.5px">מחובר כבר</small>' : '<small style="color:#c9c2b4;font-size:10.5px">גרור לכאן</small>')}</div>
        <span class="pchZ ${!ids.length ? 'emp' : bad ? 'bad' : 'ok'}" title="עומס: ${ids.length ? zz.toFixed(1) : '—'}Ω · 🎚 הספק המגבר בעומס זה: ${w || '—'}W לערוץ · 🔊 צריכת הרמקולים יחד: ${sw}W RMS${dMs != null ? ` · ⏱ דיליי מומלץ לערוץ: ${dMs.toFixed(1)}ms (יחסית לרמקול הקרוב לעמדת ההשמעה)${dSpread > 5 ? ' · ⚠ פער ' + dSpread.toFixed(1) + 'ms בין רמקולי הערוץ — ערוץ אחד = דיליי אחד, שקול לפצל' : ''}` : ''}">${zTxt}</span></div>`);
    }
    return `<div class="pchAmp"><div class="pchAmpHd" title="${esc(a.u.name)}">🎚 ${esc(shortModel(a.u.name))}
        <small>
          <input type="number" min="1" max="16" value="${a.chTotal}" title="מספר ערוצי המגבר — ניתן לתיקון, נשמר לדגם" style="width:34px;font-size:11px;padding:1px 3px;border:1px solid #ddd;border-radius:5px;text-align:center" onchange="patchAmpSet(${ai},'ch',this.value)"> ערוצים ·
          מינ׳ <input type="number" min="1" max="16" step="0.1" value="${a.minOhm}" title="אום מינימלי לערוץ (סטריאו) — ניתן לתיקון, נשמר לדגם" style="width:38px;font-size:11px;padding:1px 3px;border:1px solid #ddd;border-radius:5px;text-align:center" onchange="patchAmpSet(${ai},'mo',this.value)">Ω ·
          ${esc(a.rk.name.slice(0, 14))}</small></div>${chs.join('')}</div>`;
  }).join('');
  /* אומדן מחברים: כל קו = 2 קצוות (ספיקון / XLR-RCA לסאב אקטיבי) — מאושר כאן לפני החיבור */
  let estCables = 0;
  Object.keys(PATCH.slots).forEach(k => { estCables += (PATCH.slots[k] || []).length; });
  body.innerHTML = amps + `
    <div style="font-size:12px;font-weight:700;margin:10px 0 5px">${PATCH.pool.length ? '⚠ ' : '✓ '}רמקולים ללא ערוץ (${PATCH.pool.length})</div>
    <div class="pchPool ${PATCH.pool.length ? '' : 'ok'}" data-slot="pool">${PATCH.pool.map(id2 => patchChip(id2)).join('') || '<small style="color:#0f6e56;font-size:11.5px">כל הרמקולים מנותבים ✓</small>'}</div>
    ${estCables ? `<div style="font-size:11px;color:#8a8377;margin-top:6px;background:#f7f5f0;border-radius:8px;padding:6px 8px">🔌 בעת החיבור ייווצרו ${estCables} קווים · ~${estCables * 2} מחברים ייצרכו/יתווספו להצעה אוטומטית</div>` : ''}
    ${totSpkW ? `<div style="font-size:11px;color:#8a8377;margin-top:4px;background:#f7f5f0;border-radius:8px;padding:6px 8px">⚡ סיכום הספקים: 🎚 מגברים ${totAmpW ? totAmpW.toLocaleString() + 'W' : '—'} זמינים בערוצים המאוישים · 🔊 רמקולים צורכים ${totSpkW.toLocaleString()}W RMS<br>
      <span style="font-size:10.5px">יחס הספק לערוץ: <b style="color:#c1121f">אדום</b> = מגבר חלש מהרמקולים · <b style="color:#c96a13">כתום</b> = פחות מ-×2 · <b style="color:#0f8a5f">ירוק</b> = ×2 ומעלה · <b style="color:#b7900f">זהב</b> = ×3 ומעלה</span></div>` : ''}
    <div style="font-size:11px;color:#8a8377;margin-top:4px;background:${anySpread ? '#fdeeee' : '#f7f5f0'};border-radius:8px;padding:6px 8px">
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">⏱ דיליי:
        <select onchange="store.dlyMode=this.value;save();patchRender()" style="font-size:11px;padding:2px 4px;border:1px solid #ddd;border-radius:6px">
          <option value="off" ${dMode === 'off' ? 'selected' : ''}>ללא — מוזיקת רקע מפוזרת</option>
          <option value="geo" ${dMode === 'geo' ? 'selected' : ''}>יישור למקור (גיאומטרי)</option>
          <option value="haas" ${dMode === 'haas' ? 'selected' : ''}>יישור + 15ms Haas (מומלץ עם במה)</option>
        </select>
        ${dSrcReal ? `מקור: <b>${esc((dSrcReal.name || '').slice(0, 20))}</b>` : dSrc ? `ייחוס: <b>${esc((dSrc.name || '').slice(0, 18))}</b> · אין במה/עמדת נגינה בתכנית — היישור יחסי בלבד` : ''}
        <button onclick="dlyMicPlace()" title="הצב מיקרופון מדידה על התכנית — הדיליי יחושב מהנקודה הזו" style="font-size:11px;padding:2px 7px;border-radius:7px;border:1px solid #ddd;background:#fff;cursor:pointer">🎙 נקודת ייחוס</button>
      </div>
      ${dMode !== 'off' && dSrc && dSrc.ptype === 'mic' ? `<div style="margin-top:3px">🎙 <b>נקודת האזנה</b> — כל הרמקולים אמורים להגיע למיקרופון יחד: הערוץ ה<b>רחוק</b> ביותר = 0ms והקרובים ממתינים לו (2.92ms/מ׳)${anySpread ? ' · <b style="color:#c1121f">⚠ ערוץ עם פער >5ms בין רמקוליו</b>' : ''}</div>`
        : dMode !== 'off' && dSrc ? `<div style="margin-top:3px">הערוץ הקרוב לייחוס = 0ms, השאר מתעכבים ביחס אליו (2.92ms/מ׳)${dMode === 'haas' ? ' + 15ms קדימות' : ''}${anySpread ? ' · <b style="color:#c1121f">⚠ ערוץ עם פער >5ms בין רמקוליו — ערוץ מקבל דיליי אחד, עדיף לקבץ לפי מרחק</b>' : ''}</div>` : ''}
    </div>`;
  /* גרירה + הקשה */
  body.querySelectorAll('[data-chipro]').forEach(el => {
    const id = el.dataset.chipro;
    el.addEventListener('mouseenter', () => patchHi(id, true));
    el.addEventListener('mouseleave', () => patchHi(id, false));
    el.addEventListener('click', e => { e.stopPropagation(); const nd = document.getElementById('nd_' + id); if (nd && nd.scrollIntoView) nd.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }); });
  });
  body.querySelectorAll('[data-chip]').forEach(el => {
    const id = el.dataset.chip;
    el.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', id); PATCH.sel = id; });
    /* ריחוף/בחירה מדגישים את הרמקול על התכנית — רואים בדיוק על מה מדובר */
    el.addEventListener('mouseenter', () => patchHi(id, true));
    el.addEventListener('mouseleave', () => { if (PATCH.sel !== id) patchHi(id, false); });
    el.addEventListener('click', e => {
      e.stopPropagation();
      patchHiClear();
      PATCH.sel = PATCH.sel === id ? null : id;
      if (PATCH.sel) { patchHi(id, true); const nd = document.getElementById('nd_' + id); if (nd && nd.scrollIntoView) nd.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }); }
      patchRender();
    });
  });
  body.querySelectorAll('[data-slot]').forEach(el => {
    el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('drop'); });
    el.addEventListener('dragleave', () => el.classList.remove('drop'));
    el.addEventListener('drop', e => { e.preventDefault(); el.classList.remove('drop'); patchMove(e.dataTransfer.getData('text/plain'), el.dataset.slot); });
    el.addEventListener('click', () => { if (PATCH.sel) patchMove(PATCH.sel, el.dataset.slot); });
  });
}
/* תיקון נתוני המגבר מתוך עורך החיווט — נשמר לספריית המגברים ומשפיע על כל התכנון */
function patchAmpSet(ai, field, val) {
  const a = PATCH.amps[ai]; if (!a) return;
  const v = +val; if (!(v > 0)) return;
  store.ampLib = store.ampLib || {};
  const k = rearKey(a.u.name);
  const cur = store.ampLib[k] || {};
  store.ampLib[k] = { ...cur, kind: 'amp', ch: field === 'ch' ? v : (cur.ch || a.chTotal), mo: field === 'mo' ? v : (cur.mo || a.minOhm), ok: true };
  if (field === 'ch') {
    a.chTotal = v;
    /* ערוצים שנעלמו — הרמקולים שלהם חוזרים למאגר */
    Object.keys(PATCH.slots).forEach(kk => { const [ai2, ch2] = kk.split('|').map(Number); if (ai2 === ai && ch2 > v) { PATCH.pool.push(...PATCH.slots[kk]); delete PATCH.slots[kk]; } });
  } else a.minOhm = v;
  save(); patchRender();
  uiToast('✓ עודכן ל' + (field === 'ch' ? v + ' ערוצים' : 'מינ׳ ' + v + 'Ω') + ' — נשמר לדגם "' + shortModel(a.u.name) + '"');
}
/* שחרור ערוץ נעול — הרמקולים המחוברים הופכים לעריכים; בחיבור הקווים הישנים יוחלפו */
function patchUnlock(key) {
  const [ai, ch] = key.split('|').map(Number);
  PATCH.amps[ai].pre.delete(ch);
  (PATCH.redo = PATCH.redo || {})[key] = 1;
  patchRender();
  uiToast('🔓 הערוץ שוחרר — אפשר לגרור; בעת החיבור הניתוב הישן יוחלף בחדש');
}
function patchMove(id, slot) {
  if (!id || !PATCH) return;
  const a = PATCH.slots;
  for (const k of Object.keys(a)) a[k] = a[k].filter(x => x !== id);
  PATCH.pool = PATCH.pool.filter(x => x !== id);
  if (slot === 'pool') PATCH.pool.push(id);
  else {
    const [ai, ch] = slot.split('|').map(Number);
    if (PATCH.amps[ai].pre.has(ch)) { uiToast('הערוץ כבר מחובר — נתק אותו קודם'); PATCH.pool.push(id); }
    else (a[slot] = a[slot] || []).push(id);
  }
  PATCH.sel = null;
  patchRender();
}
/* מקצה מאוזן: מנצל את כל הערוצים הפנויים ואת יכולת האום המינימלי של כל מגבר.
   סאב = קו נפרד · רמקולים מחולקים שווה על הערוצים (ceil(N/ערוצים)), כל ערוץ עד תקרת
   העומס (Ω רמקול ÷ Ω מינימלי), בשרשור לפי קרבה — כך שכל שרשרת נשארת באזור השמעה
   אחד וניתן להנמיך אותה בנפרד. */
function allocBalanced(freeSlots, speakerNodes, dRef) {
  const dist = (x, y) => Math.hypot(x.x - y.x, x.y - y.y);
  /* רמקולים על אותו ערוץ חולקים דיליי אחד — השרשור מעדיף שכנים במרחק דומה מעמדת ההשמעה */
  const rad = n => dRef ? dist(dRef, n) : 0;
  const subs = speakerNodes.filter(n => patchKind(n) === 'sub');
  let spk = speakerNodes.filter(n => patchKind(n) !== 'sub');
  const out = []; /* [{slot, ids}] */
  const slots = freeSlots.slice();
  /* כמה ערוצים חייבים להישאר לרמקולים כדי שאף אחד לא ייתקע בלי קו?
     סאב מקבל קו נפרד רק כשיש שפע — כשחסר, הסאבים משתשרים יחד עד גבול האום */
  if (subs.length && slots.length) {
    const capS = Math.max(1, Math.floor(spkOhm(spk[0] || subs[0]) / slots[0].a.minOhm + 1e-6));
    const spkNeed = Math.ceil(spk.length / capS);
    const subSlots = Math.max(1, Math.min(subs.length, slots.length - spkNeed));
    const rem = subs.slice();
    for (let k = 0; k < subSlots && rem.length; k++) {
      const slot = slots.shift();
      const per = Math.ceil(rem.length / (subSlots - k));
      const nodes = []; let inv = 0;
      while (nodes.length < per && rem.length) {
        const cand = rem[0], ni = inv + 1 / spkOhm(cand);
        if (nodes.length && 1 / ni < slot.a.minOhm - 0.05) break;
        nodes.push(rem.shift()); inv = ni;
      }
      out.push({ slot, ids: nodes.map(n => n.id) });
    }
    spk = spk.concat(rem); /* סאבים שלא נכנסו — מצטרפים לחלוקה הכללית */
  }
  while (spk.length && slots.length) {
    const per = Math.ceil(spk.length / slots.length);
    const f = slots.shift();
    const capOhm = Math.max(1, Math.floor(spkOhm(spk[0]) / f.a.minOhm + 1e-6));
    const take = Math.min(per, capOhm);
    let si = 0, bd = Infinity; spk.forEach((pp, i) => { const d = dist(f.a.rk, pp); if (d < bd) { bd = d; si = i; } });
    let cur = spk.splice(si, 1)[0]; const nodes = [cur]; let inv = 1 / spkOhm(cur);
    while (nodes.length < take && spk.length) {
      /* ציון = קרבה פיזית + חצי מהפרש הרדיוס מהמקור (דיליי דומה) */
      let bi = -1, b2 = Infinity; spk.forEach((pp, i) => { const d = dist(cur, pp) + 0.5 * Math.abs(rad(pp) - rad(cur)); if (d < b2) { b2 = d; bi = i; } });
      const ni = inv + 1 / spkOhm(spk[bi]);
      if (1 / ni < f.a.minOhm - 0.05) break;
      cur = spk.splice(bi, 1)[0]; nodes.push(cur); inv = ni;
    }
    out.push({ slot: f, ids: nodes.map(n => n.id) });
  }
  return { assigned: out, leftover: spk.map(n => n.id) };
}
function patchAutoFill() {
  const pool = PATCH.pool.map(byId).filter(Boolean);
  if (!pool.length) { uiToast('אין רמקולים ממתינים'); return; }
  const free = [];
  PATCH.amps.forEach((a, ai) => { for (let ch = 1; ch <= a.chTotal; ch++) { const key = ai + '|' + ch; if (!a.pre.has(ch) && !(PATCH.slots[key] || []).length) free.push({ a, ai, ch, key }); } });
  if (!free.length) { uiToast('אין ערוצים פנויים — הוסף מגבר'); return; }
  const { assigned, leftover } = allocBalanced(free, pool, zoneDelayRef((P.zones || []).find(x => x.id === PATCH.zid)));
  assigned.forEach(x => { PATCH.slots[x.slot.key] = x.ids; });
  PATCH.pool = leftover;
  patchRender();
  uiToast('⚡ חולקו ' + assigned.reduce((s2, x) => s2 + x.ids.length, 0) + ' רמקולים על ' + assigned.length + ' ערוצים' + (leftover.length ? ' · נשארו ' + leftover.length : ''));
}
/* הוספת מגבר נוסף (משכפל את האחרון) — לארון, להצעה ולמטריצה */
function patchAddAmp() {
  const last = PATCH.amps[PATCH.amps.length - 1];
  if (!last) { uiToast('אין מגבר לשכפול — הוסף מגבר לארון'); return; }
  const z = (P.zones || []).find(x => x.id === PATCH.zid);
  const nu = { id: uid('u'), name: last.u.name, u: last.u.u || 2, cat: last.u.cat || 'amp', pos: (last.rk.units || []).reduce((s, x) => Math.max(s, x.pos + x.u), 0) };
  if (nu.pos + nu.u > last.rk.ru) last.rk.ru = nu.pos + nu.u;
  last.rk.units.push(nu);
  let it = impItems.find(x => x.name === last.u.name && x.dest === 'unit');
  if (it) { it.qty = (+it.qty || 1) + 1; it.placed = (it.placed || 0) + 1; if (z) { it.zones = it.zones || {}; it.zones[z.name] = (it.zones[z.name] || 0) + 1; } }
  else { it = { on: true, qty: 1, name: last.u.name, src: 'חיווט · ' + (z ? z.name : ''), dest: 'unit', cat: 'amp', u: nu.u, iid: uid('i'), added: true, placed: 1, zones: z ? { [z.name]: 1 } : undefined }; autoPrice(it); impItems.push(it); }
  PATCH.amps.push({ rk: last.rk, u: nu, minOhm: ampMinOhm(nu.name), chTotal: ampChCount(nu.name), pre: new Set() });
  render(); save();
  patchRender();
  uiToast('✓ נוסף מגבר "' + nu.name.slice(0, 26) + '" לארון ולהצעה');
}
/* אפשרויות מקור כבל הרמקולים — גלילים מהמלאי ומהצעת המחיר; ההמלצה נבחרת אוטומטית */
function patchCableOpts() {
  ensureStock(P);
  const opts = [];
  P.stock.reels.forEach(st => { if (!st.type || st.type === 'nl4' || /רמקול/.test(st.name)) opts.push({ v: 'ref:reel|' + st.id, nm: '🧵 גליל במלאי: ' + st.name.slice(0, 40) + ' · נותרו ' + Math.max(0, (st.total || 0) - (st.used || 0)) + ' מ׳' }); });
  impItems.forEach(it => {
    if (it.on === false || it.stockId) return;
    if ((it.dest === 'reel' || it.dest === 'cable') && (it.type === 'nl4' || /רמקול/.test(it.name)))
      opts.push({ v: 'iid:' + it.iid, nm: '🧵 מההצעה: ' + it.name.slice(0, 44) });
  });
  return opts.map((o, i) => `<option value="${o.v}" ${i === 0 ? 'selected' : ''}>${esc(o.nm)}</option>`).join('') +
    `<option value="" ${opts.length ? '' : 'selected'}>ללא שיוך — כבל חדש (יושלם בבדיקת השלמות)</option>`;
}
/* יצירת הכבלים בפועל מהמטריצה — כולל צריכת המחברים הדרושים לכל קצה */
async function patchApply() {
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const zid0 = PATCH.zid;
  const made = [];
  const zA = (P.zones || []).find(x => x.id === zid0);
  const dlyPlanMap = delayPlan(Object.entries(PATCH.slots).map(([k2, ids2]) => ({ key: k2, nodes: ids2.map(byId).filter(Boolean) })), dlyRefOf(zA), dlyMode(zA));
  /* מקור הכבל שנבחר בעורך — הקווים משויכים אליו והמטרים נצרכים מהגליל */
  let cblRef = null;
  const srcSel = document.getElementById('pchCableSrc');
  if (srcSel && srcSel.value) {
    if (srcSel.value.startsWith('iid:')) {
      const it = impItems.find(x => x.iid === srcSel.value.slice(4));
      const st = it && ensureStockItem(it);
      if (st) cblRef = (it.dest === 'reel' ? 'reel|' : 'cable|') + st.id;
    } else cblRef = srcSel.value.slice(4);
  }
  let n2 = 0;
  for (const [key, ids] of Object.entries(PATCH.slots)) {
    if (!ids.length) continue;
    const [ai, ch] = key.split('|').map(Number);
    const a = PATCH.amps[ai];
    /* ערוץ שלא נגעו בו — משאירים את הקווים הקיימים; ערוץ ששונה — מחליפים אותם */
    if (PATCH.orig && PATCH.orig[key] === ids.join(',')) continue;
    if (PATCH.preCables && PATCH.preCables[key]) {
      const del = new Set(PATCH.preCables[key]);
      P.cables = P.cables.filter(c => !del.has(c.id));
    }
    const nodes = ids.map(byId).filter(Boolean);
    if (!nodes.length) continue;
    const head = nodes[0];
    let note = nodes.length > 1 ? 'שרשור (' + nodes.length + ' רמקולים)' : 'קו בודד';
    /* דיליי מומלץ לערוץ — נרשם על הקו כדי שיופיע במפתח הכבלים ובדוח המתקינים */
    if (dlyPlanMap[key] != null) note += ' · ⏱ דיליי ' + (dlyPlanMap[key] ? '~' + dlyPlanMap[key].toFixed(1) + 'ms' : '0ms (ייחוס)');
    const cc = { id: uid('c'), from: a.rk.id, fromUnit: a.u.id, to: head.id, type: 'nl4', qty: '1', spec: '', note, conn: 'speakon', conn2: 'speakon', pOut: 'OUT ' + ch };
    if (isActiveSub(head.name)) { cc.type = 'xlr'; cc.conn = 'xlrm'; cc.conn2 = 'rca'; cc.note = 'סיגנל לסאב מוגבר — RCA/XLR עד ~10 מ׳'; }
    if (P.scale) cc.len = +(dist(a.rk, head) * P.scale).toFixed(1);
    if (cblRef && cc.type === 'nl4') applyStockRef(cblRef, null, cc);
    P.cables.push(cc); n2++; made.push(cc);
    for (let i = 1; i < nodes.length; i++) {
      const cb = { id: uid('c'), from: nodes[i - 1].id, to: nodes[i].id, type: 'nl4', qty: '1', spec: '', note: 'שרשור', conn: 'speakon', conn2: 'speakon' };
      if (P.scale) cb.len = +(dist(nodes[i - 1], nodes[i]) * P.scale).toFixed(1);
      if (cblRef) applyStockRef(cblRef, null, cb);
      P.cables.push(cb); n2++; made.push(cb);
    }
  }
  /* ערוצים שרוקנו לגמרי — הקווים הישנים שלהם נמחקים */
  Object.entries(PATCH.preCables || {}).forEach(([k5, cids]) => {
    if (PATCH.orig[k5] === (PATCH.slots[k5] || []).join(',')) return;
    if ((PATCH.slots[k5] || []).length) return;
    const del = new Set(cids);
    P.cables = P.cables.filter(c => !del.has(c.id));
  });
  const left = PATCH.pool.length;
  patchClose();
  /* מחברים: כל קו צורך 2 מחברים מתאימים (ספיקון/RCA) — נוספים להצעה אוטומטית */
  const beforeConn = impItems.filter(it => it.dest === 'conn').reduce((s2, it) => s2 + (+it.qty || 0), 0);
  for (const c of made) { try { await autoConnectors(c); } catch (e) {} }
  const addedConn = impItems.filter(it => it.dest === 'conn').reduce((s2, it) => s2 + (+it.qty || 0), 0) - beforeConn;
  render(); save();
  uiToast('✓ חוברו ' + n2 + ' כבלים' + (addedConn > 0 ? ' · נוספו ' + addedConn + ' מחברים להצעה' : '') + (left ? ' · ⚠ ' + left + ' רמקולים ללא ערוץ' : ''));
  /* הצעת קיטי התקנה/אביזרים לפרויקט — סוגרים את הפרויקט בקנייה אחת */
  setTimeout(() => patchOfferKits(zid0), 400);
}
/* 🤔 "האם שכחתי משהו?" — סריקת שלמות: עובר על התכנית וההצעה ומציע את מה שחסר.
   כל ממצא עם כפתור פעולה שמתקן במקום — כך שההצעה יוצאת שלמה בלחיצה. */
function projGapCheck() {
  const finds = [];
  const spkN = P.nodes.filter(n => n.kind === 'point' && (!n.ptype || n.ptype === 'speaker' || n.ptype === 'sub') && !/עמדת נגינה|מגבר|פרוססור/i.test(n.name));
  const rows = impItems.filter(it => it.on !== false);
  const qsum = f => rows.filter(f).reduce((s2, it) => s2 + (+it.qty || 0), 0);
  /* 1. רמקולים לא מחווטים */
  const fed = new Set(); P.cables.forEach(c => { if (c.to) fed.add(c.to); });
  (P.zones || []).forEach(z => {
    const un = spkN.filter(n => (n.sub || '').includes(z.name) && !fed.has(n.id)).length;
    if (un) finds.push({ i: '🔌', t: un + ' רמקולים לא מחווטים באזור "' + esc(z.name) + '"', b: 'חווט עכשיו', fn: `smartWire('${z.id}')` });
  });
  /* 2. קווים בלי מוצר כבל בהצעה */
  const noRef = P.cables.filter(c => !c.stockRef && c.inst !== 'exist' && +c.len > 0).length;
  if (noRef) finds.push({ i: '🧵', t: noRef + ' קווים ללא שורת כבל בהצעה', b: 'השלם גלילי כבל (+15% רזרבה)', fn: 'wizFillCables()' });
  /* 3. מחברים — 2 לכל קו חדש מול מה שבהצעה */
  let needC = 0;
  P.cables.forEach(c => {
    if (c.inst === 'exist') return;
    if ((c.conn || connFor(c.type)) !== 'empty') needC++;
    if ((c.conn2 || c.conn || connFor(c.type)) !== 'empty') needC++;
  });
  const haveC = qsum(it => it.dest === 'conn' || /מחבר|קונקטור|connector/i.test(it.name));
  if (needC > haveC) finds.push({ i: '🔩', t: 'דרושים ~' + needC + ' מחברים לקצוות · בהצעה ' + haveC, b: 'הוסף מחברים לכל הקווים', fn: 'gapFixConnectors()' });
  /* 3b. מולטי-קייבל: לכל גיד דרוש מחבר בכל קצה — וקופסת XLR מרובה סופרת כגידים */
  const coresOf = nm => { const m = /(\d+)\s*[xX×]\s*[\d.]+/.exec(nm || '') || /\b(\d+)\s*(?:גידים|cores?)\b/i.exec(nm || ''); return m ? +m[1] : 0; };
  let mcCores = 0;
  rows.forEach(it => { if (/מולטי|multi/i.test(it.name)) mcCores += coresOf(it.name) * (+it.qty || 1); });
  P.cables.forEach(c => { if (c.type === 'multi' && c.cores) mcCores += +c.cores; });
  if (mcCores) {
    const xlrHave = qsum(it => /XLR/i.test(it.name) && /מחבר|connector|פנל|קופס|panel/i.test(it.name)) +
      rows.filter(it => /פנל|קופס/i.test(it.name) && /XLR/i.test(it.name)).reduce((s3, it) => s3 + coresOf(it.name) * (+it.qty || 1), 0);
    const need = mcCores * 2; /* שני קצוות לכל גיד */
    if (need > xlrHave) finds.push({ i: '🎚', t: 'מולטי עם ' + mcCores + ' גידים — דרושים ~' + need + ' מחברי XLR (זכר/נקבה) · בהצעה ' + xlrHave, b: 'חפש מחבר XLR', fn: "gapSearch('מחבר XLR')" });
  }
  /* 4. תושבות ומתקנים לרמקולים תלויים */
  const hung = spkN.filter(n => patchKind(n) !== 'sub' && !/שקוע|תקרת גבס/.test((n.name || '') + (n.mount || ''))).length;
  const mounts = qsum(it => /מתקן|תושבת|יוקה|YOKE|ברקט|bracket/i.test(it.name));
  if (hung > mounts) finds.push({ i: '🔧', t: hung + ' רמקולים תלויים · רק ' + mounts + ' תושבות/מתקנים בהצעה', b: 'חפש מתקן בקטלוג', fn: "gapSearch('מתקן לרמקול')" });
  /* 5. ארון בלי פס שקעים */
  const racks = P.nodes.filter(n => n.kind === 'rack' && (n.units || []).length);
  if (racks.length && !qsum(it => /פס שקעים|פס חשמל|שקעים לארון|PDU/i.test(it.name))) finds.push({ i: '⚡', t: racks.length + ' ארונות מאובזרים — אין פס שקעים בהצעה', b: 'חפש פס שקעים', fn: "gapSearch('פס שקעים')" });
  /* 6. שורת התקנה */
  if (!rows.some(it => it.dest === 'work' || /התקנה/.test(it.name))) finds.push({ i: '🔧', t: 'אין שורת התקנה/עבודה בהצעה', b: 'פתח טבלת התקנה ותמחור', fn: 'installManager()' });
  /* 7. קיט התקנה (תשתיות עמדה/ארון) */
  if (!P._instKit && installKitList().length) finds.push({ i: '🧰', t: 'לא נבחר קיט התקנה (עמדה/ארון/סטנדרט)', b: 'בחר קיט התקנה', fn: `patchOfferKits('${(P.zones && P.zones[0] || {}).id || ''}')` });
  /* 8. שורות בלי מק"ט — לא ייכנסו להזמנת ERP */
  const noKey = rows.filter(it => !it.key).length;
  if (noKey) finds.push({ i: '🏷', t: noKey + ' שורות ללא מק"ט ERP — לא ייקלטו בהצעה', b: 'פתח את ההצעה להשלמה', fn: 'openImported()' });
  P._gapOk = true; save();
  const ov = uiModal(`
    <b style="font-size:14px">🤔 האם שכחתי משהו? — בדיקת שלמות</b>
    ${finds.length ? `<p class="hint" style="font-size:11.5px;color:#8a8377;margin:6px 0">${finds.length} ממצאים — כל אחד עם תיקון בלחיצה:</p>
      <div style="max-height:52vh;overflow-y:auto">${finds.map(f => `
        <div style="display:flex;gap:8px;align-items:center;border:1px solid #eee;border-radius:9px;padding:7px 9px;margin-bottom:5px;background:#faf8f4">
          <span style="font-size:16px">${f.i}</span>
          <span style="flex:1;font-size:12px">${f.t}</span>
          <button style="white-space:nowrap;font-size:11.5px;background:#0f6e56;color:#fff;border:none;border-radius:7px;padding:5px 9px;cursor:pointer" onclick="document.querySelector('.uiDlgOv')?.remove();${f.fn}">${f.b}</button>
        </div>`).join('')}</div>`
      : '<p style="font-size:13px;color:#0f6e56;margin:10px 0">✓ לא נמצאו חוסרים — התכנית וההצעה שלמות: חיווט, כבלים, מחברים, תושבות, התקנה ומק"טים.</p>'}
    <button style="width:100%;margin-top:6px;padding:8px;border-radius:9px;border:1px solid #ddd;background:#fff;cursor:pointer" onclick="document.querySelector('.uiDlgOv')?.remove()">סגור</button>`);
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
}
/* משלים מחברים לכל הקווים שקיימים — צריכה של 2 לקו דרך אותו מנגנון של החיבור */
async function gapFixConnectors() {
  let n = 0;
  for (const c of P.cables) {
    if (c.inst === 'exist') continue;
    try { await autoConnectors(c); n++; } catch (e) {}
  }
  render(); save();
  uiToast('🔩 עודכנו מחברים ל-' + n + ' קווים');
}
/* פתיחת חיפוש הקטלוג עם שאילתה מוכנה — לבחירת פריט משלים */
function gapSearch(q) {
  dockOpen = true; dockMin = false; dockQ = q; renderImp();
  uiToast('🔍 בחר מהתוצאות — לחיצה מוסיפה להצעה');
}
/* קיטי ההתקנה האמיתיים — Project Accessories Kit עם "התקנה" בשם (עמדה/ארון/סטנדרט) + קיטים אישיים */
function installKitList() {
  return allKits().map((k, i) => ({ k, i }))
    .filter(x => (x.k.sys === 'Project Accessories Kit' && /התקנ/.test(x.k.name)) || (/קיט/.test(x.k.name) && /התקנ/.test(x.k.name) && !/מסך|לד\b/i.test(x.k.name)));
}
/* אחרי חיווט: קיטים של אביזרים/התקנות שמתאימים להשלמת הפרויקט */
function patchOfferKits(zid) {
  const z = (P.zones || []).find(x => x.id === zid) || (P.zones || [])[0];
  const zname = z ? z.name : '';
  const kits = installKitList();
  if (!kits.length) return;
  const ov = uiModal(`
    <b style="font-size:14px">🧰 קיט התקנה וחיווט לפרויקט?</b>
    <p class="hint" style="font-size:11.5px;color:#8a8377;margin:6px 0">החיווט הושלם — אפשר להוסיף קיט אביזרים/התקנה מוכן (כמויות ניתנות לעריכה לפני ההוספה):</p>
    <div style="max-height:44vh;overflow-y:auto">
      ${kits.slice(0, 14).map(x => `<button class="sec" style="display:block;width:100%;text-align:right;margin-bottom:4px;font-size:12px;padding:7px;border:1px solid #ddd;border-radius:8px;background:#faf8f4;cursor:pointer" onclick="document.querySelector('.uiDlgOv')?.remove();P._instKit=1;zoneKitConfirm('${esc(zname).replace(/'/g, '&#39;')}',${x.i})">🧰 ${esc(x.k.name.slice(0, 46))} · ${(x.k.items || []).length} פריטים</button>`).join('')}
    </div>
    <button data-skip style="width:100%;margin-top:8px;padding:8px;border-radius:9px;border:1px solid #ddd;background:#fff;cursor:pointer">דלג — בלי קיט</button>`);
  ov.querySelector('[data-skip]').onclick = () => ov.remove();
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
}
async function smartWire(zid) {
  const z = (P.zones || []).find(x => x.id === zid); if (!z) return;
  const inZone = n => (n.sub || '').includes(z.name);
  const fed = new Set(); P.cables.forEach(c => { if (c.type === 'nl4' && c.to) fed.add(c.to); });
  const spks = P.nodes.filter(n => n.kind === 'point' && (!n.ptype || n.ptype === 'speaker' || n.ptype === 'sub') && !/מגבר|פרוססור|amplifier|processor/i.test(n.name) && inZone(n) && !fed.has(n.id) && !/עמדת נגינה/.test(n.name));
  const noNew = !spks.length; /* הכול מחווט? עדיין נפתח לעריכת הניתוב הקיים */
  /* כל המגברים: קודם מריכוז האזור, אחר-כך שאר הארונות */
  /* מגבר אמיתי — לא כרטיס/מתקן/כבל שהמילה "מגבר" מופיעה בשמם */
  const isAmpU = u => /מגבר|amp|DPA|DNA|MA\s?\d|IPD|PLM|XLI|DYNAMIQ|DAP\s?\d|MX3|PQM/i.test(u.name)
    && !/כרטיס|\bcard\b|מתקן|תושבת|כבל|מחבר|ערכת|מדף|מאוורר/i.test(u.name);
  const amps = [];
  const rkPref = z._rackNodeId && byId(z._rackNodeId);
  const pushAmps = rk => (rk.units || []).forEach(u => { if (isAmpU(u)) amps.push({ rk, u, minOhm: ampMinOhm(u.name), chTotal: ampChCount(u.name), used: new Set() }); });
  if (rkPref) pushAmps(rkPref);
  P.nodes.filter(n => n.kind === 'rack' && n !== rkPref).forEach(pushAmps);
  if (!amps.length) { alert('אין מגבר בתכנית — הוסף מגבר לריכוז המגברים קודם.'); return; }
  amps.forEach(a => P.cables.forEach(c => { if (c.from === a.rk.id && c.fromUnit === a.u.id && c.pOut) { const m = c.pOut.match(/OUT (\d+)/); if (m) a.used.add(+m[1]); } }));
  amps.forEach(a => { a.pre = new Set(a.used); }); /* ערוצים שכבר מחוברים — נעולים בעורך */
  if (noNew && !amps.some(a => a.used.size)) { alert('אין רמקולים באזור.'); return; }
  if (noNew && window.__autoFlow) return;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const isSub = n => /סאב|\bsub\b|NOMOS|MB2|BR\s?1|F118|F221|TILL\s?1[58]P?\s?SUB/i.test(n.name);
  /* הצעה התחלתית — המקצה המאוזן (מנצל את כל הערוצים עד האום המינימלי) */
  const freeSlots = [];
  amps.forEach(a => { for (let ch = 1; ch <= a.chTotal; ch++) if (!a.used.has(ch)) freeSlots.push({ a, ch }); });
  const { assigned, leftover } = allocBalanced(freeSlots, spks, zoneDelayRef(z));
  const lines = assigned.map(x => {
    const nodes = x.ids.map(byId).filter(Boolean);
    const invZ = nodes.reduce((s2, n) => s2 + 1 / spkOhm(n), 0);
    return { amp: x.slot.a, ch: x.slot.ch, head: nodes[0],
      seg: nodes.slice(1).map((n, k) => ({ from: nodes[k], to: n })),
      z: invZ ? 1 / invZ : 0,
      label: nodes.length > 1 ? 'שרשור (' + nodes.length + ' רמקולים)' : (patchKind(nodes[0]) === 'sub' ? 'סאב — קו בודד' : 'קו בודד') };
  });
  const singles = [], bg = leftover.map(byId).filter(Boolean);
  /* עורך חיווט גרפי — רואים את הניתוב, גוררים בין יציאות, מוסיפים מגבר, ומחברים.
     מסלול אוטומטי (אשף V2) מדלג על העורך ומחבר ישירות. */
  if (!window.__autoFlow) { patchOpen(z, amps, lines, bg); return; }
  if (!lines.length) { alert('לא הוקצו קווים.'); return; }
  if (bg.length) uiToast('⚠ ' + bg.length + ' רמקולים ללא ערוץ — הוסף מגבר');
  const made2 = [];
  lines.forEach(l => {
    const cc = { id: uid('c'), from: l.amp.rk.id, fromUnit: l.amp.u.id, to: l.head.id, type: 'nl4', qty: '1', spec: '', note: l.label, conn: 'speakon', conn2: 'speakon', pOut: 'OUT ' + l.ch };
    /* סאב מוגבר: כבל סיגנל (XLR→RCA, עד ~10 מ׳) במקום קו רמקול */
    if (isActiveSub(l.head.name)) { cc.type = 'xlr'; cc.conn = 'xlrm'; cc.conn2 = 'rca'; cc.note = 'סיגנל לסאב מוגבר — RCA/XLR עד ~10 מ׳'; }
    if (P.scale) cc.len = +(dist(l.amp.rk, l.head) * P.scale).toFixed(1);
    P.cables.push(cc);
    made2.push(cc);
    l.seg.forEach(sg => { const cb = { id: uid('c'), from: sg.from.id, to: sg.to.id, type: 'nl4', qty: '1', spec: '', note: 'שרשור', conn: 'speakon', conn2: 'speakon' }; if (P.scale) cb.len = +(dist(sg.from, sg.to) * P.scale).toFixed(1); P.cables.push(cb); made2.push(cb); });
  });
  /* גם במסלול האוטומטי — המחברים נצרכים/נוספים להצעה כמו בעורך הגרפי */
  for (const c of made2) { try { await autoConnectors(c); } catch (e) {} }
  render(); save();
}
/* מספר ערוצי מגבר לפי שם היחידה */
function ampChCount(uname) {
  const src = (typeof AMP_DATA !== 'undefined' ? AMP_DATA : []).find(d => d.kind === 'amp' && d.re && d.re.test(uname || ''));
  const custom = store.ampLib && Object.entries(store.ampLib).find(([k, v]) => v.kind === 'amp' && uname && rearKey(uname).includes(k));
  /* "4 ערוצים" מפורש בשם המוצר גובר על ניחוש מהטבלה — מגבר 4CH לא ינוצל כ-2 */
  const named = /(\d+)\s*(?:ערוצים|ch\b|channels)/i.exec(uname || '');
  return (custom && custom[1].ch) || (named && +named[1]) || (src && src.ch) || 2;
}
/* דיאלוג אישור חיווט עם שינוי מהיר — חבר / בחר מגבר אחר / ביטול */
function wireConfirm(msg) {
  if (window.__autoFlow) { uiToast('🔌 ' + msg.split('\n')[0]); return Promise.resolve('go'); } /* אשף V2 — אישור אוטומטי */
  return new Promise(res => {
    const ov = uiModal(`
      <p style="font-size:13.5px;margin:0 0 12px;line-height:1.55;white-space:pre-line">${esc(msg)}</p>
      <button class="primary" data-go style="width:100%;margin-bottom:6px">🔗 חבר</button>
      <button data-pick style="width:100%;margin-bottom:6px">🔄 לא טוב לי — בחר מגבר אחר</button>
      <button data-cancel style="width:100%">ביטול</button>`);
    const done = v => { ov.remove(); res(v); };
    ov.querySelector('[data-go]').onclick = () => done('go');
    ov.querySelector('[data-pick]').onclick = () => done('pick');
    ov.querySelector('[data-cancel]').onclick = () => done(null);
    ov.addEventListener('click', e => { if (e.target === ov) done(null); });
  });
}
/* כל המגברים בתכנית — לבחירה ידנית */
function allAmps() {
  const out = [];
  P.nodes.filter(n => n.kind === 'rack').forEach(rk => (rk.units || []).forEach(u => { if (/מגבר|amp|DPA|DNA|MA\s?\d|IPD|PLM|XLI|DYNAMIQ|DAP\s?\d|MX3|PQM/i.test(u.name)) out.push({ rk, u }); }));
  return out;
}
async function pickAmpDialog() {
  const amps = allAmps();
  if (!amps.length) { alert('אין מגברים בתכנית'); return null; }
  const list = amps.map((a, i) => `${i + 1}. ${a.u.name.slice(0, 34)} (${esc(a.rk.name.slice(0, 16))})`).join('\n');
  const pick = await uiPrompt('בחר מגבר:\n' + list + '\n\nהקלד מספר:', '1', { type: 'number' });
  if (pick === null) return null;
  return amps[(+pick || 1) - 1] || amps[0];
}
/* שרשור אוטומטי — מפזר את כל רמקולי הקבוצה על ערוצי המגבר, כל ערוץ עד מינימום העומס */
async function autoChainFrom(nid, forceAmp) {
  const start = byId(nid); if (!start || start.kind !== 'point') return;
  const groupKey = n => start.srcIid ? n.srcIid === start.srcIid : (n.sub || '').split('·').pop() === (start.sub || '').split('·').pop();
  const isSpk = n => n.kind === 'point' && !/סאב|\bsub\b/i.test(n.name);
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  /* כל הרמקולים בקבוצה (כולל ההתחלה) שאינם כבר מחוברים לשרשרת/מגבר */
  const fedNL4 = new Set(); P.cables.forEach(c => { if (c.type === 'nl4' && c.to) fedNL4.add(c.to); });
  const all = P.nodes.filter(n => isSpk(n) && groupKey(n) && !fedNL4.has(n.id));
  if (!all.length) { alert('אין רמקולים פנויים לשרשור בקבוצה.'); return; }

  /* מגבר: נבחר ידנית → מחובר לרמקול ההתחלה → הראשון בתכנית */
  let ampNode = null, ampUnit = null;
  if (forceAmp) { ampNode = forceAmp.rk; ampUnit = forceAmp.u; }
  if (!ampUnit) {
    const srcCable = P.cables.find(c => c.to === start.id && c.fromUnit);
    if (srcCable) { ampNode = byId(srcCable.from); ampUnit = ampNode && (ampNode.units || []).find(x => x.id === srcCable.fromUnit); }
  }
  if (!ampUnit) { for (const rk of P.nodes.filter(n => n.kind === 'rack')) { const u = (rk.units || []).find(x => /מגבר|amp|DPA|DNA|MA\s?\d|IPD|PLM|XLI|DYNAMIQ|DAP\s?\d|MX3/i.test(x.name)); if (u) { ampNode = rk; ampUnit = u; break; } } }

  const minOhm = ampUnit ? ampMinOhm(ampUnit.name) : 4;
  const chCount = ampUnit ? ampChCount(ampUnit.name) : 1;

  /* בונים ערוצים: כל ערוץ שרשרת nearest-neighbor עד סף העומס */
  const avail = all.slice();
  const chains = []; /* [{seg:[{from,to}], head, count, z}] */
  for (let ch = 0; ch < chCount && avail.length; ch++) {
    /* נקודת מוצא לערוץ — הרמקול הקרוב ביותר למגבר (אם יש) אחרת הראשון */
    let si = 0;
    if (ampNode) { let bd = Infinity; avail.forEach((p, i) => { const d = dist(ampNode, p); if (d < bd) { bd = d; si = i; } }); }
    let cur = avail.splice(si, 1)[0];
    const seg = []; let invZ = 1 / spkOhm(cur), head = cur, cnt = 1;
    while (avail.length) {
      let bi = -1, bd = Infinity; avail.forEach((p, i) => { const d = dist(cur, p); if (d < bd) { bd = d; bi = i; } });
      const nx = avail[bi]; const ni = invZ + 1 / spkOhm(nx);
      if (1 / ni < minOhm - 0.05) break;
      avail.splice(bi, 1); seg.push({ from: cur, to: nx }); invZ = ni; cur = nx; cnt++;
    }
    chains.push({ seg, head, count: cnt, z: 1 / invZ });
  }
  const placed = chains.reduce((s, c) => s + c.count, 0);
  const left = avail.length;
  const chDesc = chains.map((c, i) => `ערוץ ${i + 1}: ${c.count} רמקולים · ${c.z.toFixed(1)}Ω`).join('\n');
  const msg = `${ampUnit ? esc(ampUnit.name.slice(0, 30)) + ' — ' : ''}${chCount} ערוצים · מינ׳ ${minOhm}Ω\n\n${chDesc}` +
    (left ? `\n\n⚠ נשארו ${left} רמקולים ללא ערוץ — צריך מגבר נוסף.` : '');
  const choice = await wireConfirm(msg);
  if (!choice) return;
  if (choice === 'pick') { const a = await pickAmpDialog(); if (a) return autoChainFrom(nid, a); return; }

  chains.forEach((c, i) => {
    /* חיבור מיציאת המגבר לראש השרשרת */
    if (ampNode && ampUnit) {
      const cc = { id: uid('c'), from: ampNode.id, fromUnit: ampUnit.id, to: c.head.id, type: 'nl4', qty: '1', spec: '', note: 'ערוץ ' + (i + 1), conn: 'speakon', conn2: 'speakon', pOut: 'OUT ' + (i + 1) };
      if (P.scale) cc.len = +(Math.hypot(ampNode.x - c.head.x, ampNode.y - c.head.y) * P.scale).toFixed(1);
      P.cables.push(cc);
    }
    c.seg.forEach(s => {
      const cb = { id: uid('c'), from: s.from.id, to: s.to.id, type: 'nl4', qty: '1', spec: '', note: 'שרשור ערוץ ' + (i + 1), conn: 'speakon', conn2: 'speakon' };
      if (P.scale) cb.len = +(dist(s.from, s.to) * P.scale).toFixed(1);
      P.cables.push(cb);
    });
  });
  render(); save();
}
/* ===== חוק אום — עומס מקבילי על קו רמקולים ===== */
function spkOhm(n) { return n.ohm ?? (spkData(n.name)?.o) ?? 8; }
/* כל הרמקולים שמוזנים מיציאה מסוימת (כולל שרשור רמקול→רמקול) — מחושבים במקביל */
function chainLoad(nid, unitId, port) {
  const seen = new Set(); const spks = [];
  const frontier = P.cables.filter(c => c.from === nid && (c.fromUnit || null) === (unitId || null) && c.pOut === port).map(c => c.to);
  while (frontier.length) {
    const t = frontier.pop();
    if (seen.has(t)) continue; seen.add(t);
    const tn = byId(t); if (!tn || tn.kind !== 'point') continue;
    spks.push(tn);
    P.cables.forEach(c => {
      if (c.from === t && !seen.has(c.to)) frontier.push(c.to);
      if (c.to === t && !seen.has(c.from)) { const fn2 = byId(c.from); if (fn2 && fn2.kind === 'point') frontier.push(c.from); }
    });
  }
  if (!spks.length) return null;
  const inv = spks.reduce((s, x) => s + 1 / spkOhm(x), 0);
  let est = false;
  const w = spks.reduce((s, x) => { let pw = x.pow ?? spkData(x.name)?.w; if (pw == null) { pw = 150; est = true; } return s + pw; }, 0);
  return { z: 1 / inv, n: spks.length, w, est, spks };
}
/* הספק זמין לערוץ מגבר — מנותח משם המוצר או מטבלת המגברים (4×1300W → 1300) */
function ampRec(uname) {
  const base = (typeof AMP_DATA !== 'undefined' ? AMP_DATA : []).find(d => d.kind === 'amp' && d.re && d.re.test(uname || '')) || null;
  const custom = store.ampLib && Object.entries(store.ampLib).find(([k, v]) => v.kind === 'amp' && uname && rearKey(uname).includes(k));
  /* עריכה ידנית (ערוצים/אום) גוברת, אבל טבלת ההספק המאומתת נשמרת */
  if (custom) return base ? { ...base, ...Object.fromEntries(Object.entries(custom[1]).filter(([, v]) => v != null && v !== '')) } : custom[1];
  return base;
}
/* הספק זמין לערוץ — לפי טבלת ההספק באימפדנס בפועל (8/4/2.7/2Ω), עם אינטרפולציה לערך הקרוב */
function ampChW(uname, loadOhm) {
  const src = ampRec(uname);
  if (src && src.pw) {
    const keys = Object.keys(src.pw).map(Number).sort((a, b) => b - a);
    if (loadOhm != null) {
      let best = keys[0], bd = Infinity;
      keys.forEach(k => { const d = Math.abs(k - loadOhm); if (d < bd) { bd = d; best = k; } });
      return src.pw[best];
    }
    return src.pw[keys[0]];
  }
  const s2 = ((src && src.w) || '') + ' ' + (uname || '');
  let m = s2.match(/(\d+)\s*[xX×]\s*(\d+)\s*W/i);
  if (m) return +m[2];
  m = s2.match(/(\d{3,5})\s*W/i);
  if (m && src && src.ch) return Math.round(+m[1] / src.ch);
  return m ? +m[1] : null;
}
function guessZ(c) {
  const n = c && byId(c.to);
  const s = ((n?.name || '') + ' ' + (n?.sub || ''));
  if (/CA\s?106/i.test(s)) return 16;
  if (/(SPECTRA|NOMOS|GRAVIS|רמקול|סאב)/i.test(s)) return 8;
  return 8;
}
/* בסיס נתונים אקוסטי ברמת EASE/GLL — זווית H×V, רגישות (dB@1W/1m), Max SPL. ניתן לדריסה ע"י store.spkLib וייבוא CSV. */
/* ok:1 = זוויות מאומתות מדף היצרן · בלי ok = הערכה בלבד */
const SPEAKER_DATA = [
  /* ===== מותגים נוספים (מאומת מדפי היצרן) ===== */
  { re: /SPECTRA\s?212/i, h: 120, v: 30, sens: 107, max: 138, ok: 1 },
  { re: /GRAVIS\s?12/i, h: 110, v: 50, sens: 103, max: 132, ok: 1 , url: 'https://www.kling-freitag.com/prorental/gravis/gravis-12p-xw/' },
  { re: /GRAVIS\s?15/i, h: 110, v: 50, sens: 105, max: 134, ok: 1 , url: 'https://www.kling-freitag.com/prorental/gravis/gravis-15-xw/' }, /* K&F: הורן 110×50 מסתובב */
  { re: /CA\s?-?106/i, h: 90, v: 60, sens: 92, max: 125, ok: 1 },
  { re: /NOMOS/i, h: 360, v: 360, sens: 99, max: 136, ok: 1 },
  { re: /CX-?2/i, h: 75, v: 75, sens: 102, max: 134, ok: 1 , url: 'http://lambda-labs.com/en/cx-2a.html' }, /* Lambda: 75×75 אקסיאלי */
  { re: /CX-?\d/i, h: 60, v: 60, sens: 102, max: 130 },
  /* ===== Funktion-One — נקצר מ-Prismic API של funktion-one.com (2026-08) — כל 95 הדגמים עם
     מפרט חשמלי מלא. max = חישוב sens+10log(W) (F-One לא מפרסמת Max SPL). pdf = דף מפרט · man = מדריך ===== */
  /* ===== KT Audio — נקצר מ-kt-audio.com (Shopify) ומדפי ה-PDF (2026-08) ===== */
  { re: /SATELLITE\s?TWEETER\s?POD/i, h: 360, sens: 105, max: 124, w: 75, o: 5, ok: 1, url: 'https://funktion-one.com/product/satellite-tweeter-pod' }, /* Funktion-One SATELLITE TWEETER POD — 3x HF Slot · 5kHz - up · 360° */
  { re: /EVO\s?6SH\s?SKELETAL\s?-?1\b/i, h: 50, v: 25, sens: 112, max: 136, w: 250, o: 24, ok: 1, url: 'https://funktion-one.com/product/evo-6sh-skeletal1', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/7931aacf-0dec-41f5-a350-ee4e3cea6a81_Funktion-One_Evo6SH_Spec_Sheet.pdf' }, /* Funktion-One EVO 6SH SKELETAL1 — 10" · 200Hz - 4kHz · 50° Horizontal x 25° Vertical · 2-way */
  { re: /EVO\s?7SH\s?SKELETAL\s?-?1\b/i, h: 40, v: 20, sens: 112, max: 136, w: 250, o: 24, ok: 1, url: 'https://funktion-one.com/product/evo-7sh-skeletal1', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/c0305dbd-39be-4e84-b359-d6fd40e2e2df_Funktion-One_Evo7SH_Spec_Sheet.pdf' }, /* Funktion-One EVO 7SH SKELETAL1 — 10" · 200Hz - 4kHz · 40° Horizontal x 20° Vertical · 2-way */
  { re: /EVO\s?6SH\s?SKELETAL/i, h: 50, v: 25, sens: 112, max: 136, w: 250, o: 24, ok: 1, url: 'https://funktion-one.com/product/evo-6sh-skeletal', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/7931aacf-0dec-41f5-a350-ee4e3cea6a81_Funktion-One_Evo6SH_Spec_Sheet.pdf' }, /* Funktion-One EVO 6SH SKELETAL — 10" · 200Hz - 4kHz · 50° Horizontal x 25° Vertical · 2-way */
  { re: /EVO\s?7SH\s?SKELETAL/i, h: 40, v: 20, sens: 112, max: 136, w: 250, o: 24, ok: 1, url: 'https://funktion-one.com/product/evo-7sh-skeletal', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/c0305dbd-39be-4e84-b359-d6fd40e2e2df_Funktion-One_Evo7SH_Spec_Sheet.pdf' }, /* Funktion-One EVO 7SH SKELETAL — 10" · 200Hz - 4kHz · 40° Horizontal x 20° Vertical · 2-way */
  { re: /EVOLUTION\s?XSH\s?-?11\b/i, h: 90, v: 13, sens: 107, max: 130, w: 200, o: 16, ok: 1, url: 'https://funktion-one.com/product/evolution-xsh11', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/ZogKYx5LeNNTw009_EvolutionXSH-F1-DS%3DD0002-01.pdf' }, /* Funktion-One EVOLUTION XSH11 — 8" · 280Hz - 5kHz · 90° Horizontal x 13° Vertical · 2-way */
  { re: /Euphoria\s?12\s?Sub/i, h: 360, v: 360, sens: 99, max: 125, w: 400, o: 8, ok: 1, url: 'https://www.kt-audio.com/products/unicorn-euphoria-12-sub' }, /* KT Audio Euphoria 12 Sub — 50Hz-200Hz ± 3dB */
  { re: /Array\s?SUB\s?1000\b/i, h: 360, v: 360, sens: 86, max: 111, w: 300, o: 4, ok: 1, url: 'https://www.kt-audio.com/products/array-sub', pdf: 'https://cdn.shopify.com/s/files/1/0821/7804/8283/files/Array_SUB.pdf' }, /* KT Audio Array SUB 1000 — 10" Polypropylene Cone · 20 - 300Hz */
  { re: /EVOLUTION\s?XSH\s?-?1\b/i, h: 90, v: 13, sens: 107, max: 130, w: 200, o: 16, ok: 1, url: 'https://funktion-one.com/product/evolution-xsh1', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/ZogKYx5LeNNTw009_EvolutionXSH-F1-DS%3DD0002-01.pdf' }, /* Funktion-One EVOLUTION XSH1 — 8" · 280Hz - 5kHz · 90° Horizontal x 13° Vertical · 2-way */
  { re: /Euphoria\s?8\s?WR/i, h: 90, v: 60, sens: 94, max: 117, w: 200, o: 8, ok: 1, url: 'https://www.kt-audio.com/products/unicorn-euphoria-8-wr' }, /* KT Audio Euphoria 8 WR — 60Hz–20KHz ± 3dB · 90° horizontal, 60° vertical */
  { re: /INTERPID\s?800\b/i, h: 90, v: 60, sens: 90, max: 109, w: 80, o: 8, ok: 1, url: 'https://www.kt-audio.com/products/kt-interpid-800', pdf: 'https://cdn.shopify.com/s/files/1/0821/7804/8283/files/Interpid_800.pdf' }, /* KT Audio INTERPID 800 — 8" (203mm) Graphite Cone with Rubber Surround · 56Hz to 20Khz · PDF: 8 */
  { re: /Till\s?15P\s?SUB/i, h: 360, v: 360, sens: 96, max: 123, w: 500, o: 8, ok: 1, url: 'https://www.kt-audio.com/products/unicorn-till-15p-sub', pdf: 'https://cdn.shopify.com/s/files/1/0821/7804/8283/files/Till_Series.pdf' }, /* KT Audio Till 15P SUB — 15” subwoofer · 38-120Hz */
  { re: /Till\s?18P\s?SUB/i, h: 360, v: 360, sens: 96, max: 124, w: 600, o: 8, ok: 1, url: 'https://www.kt-audio.com/products/unicorn-till-18p-sub', pdf: 'https://cdn.shopify.com/s/files/1/0821/7804/8283/files/Till_Series.pdf' }, /* KT Audio Till 18P SUB — 18” subwoofer · 35-120Hz */
  { re: /EVO\s?7TL\s?215\b/i, h: 360, v: 360, sens: 102, max: 105, w: 2, o: 2, ok: 1, url: 'https://funktion-one.com/product/evo-7tl-215', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/37f9ba41-e0da-4c94-95fd-178168c2a177_Funktion-One_Evo7TL_Spec_Sheet.pdf' }, /* Funktion-One EVO 7TL 215 — 2 x 15" · 65Hz - 300Hz · Array dependent */
  { re: /EVOLUTION\s?X/i, h: 90, v: 13, sens: 102, max: 128, w: 400, o: 8, ok: 1, url: 'https://funktion-one.com/product/evolution-x', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/ZessfXUurf2G3NzE_EvolutionX-F1-DS%3DD0001-02.pdf', man: 'https://funktion-one.cdn.prismic.io/funktion-one/ZestRHUurf2G3Nzi_Evolution_X_User_Guide_V1.3.pdf' }, /* Funktion-One EVOLUTION X — 15" · 35/85Hz - 280Hz · 90° Horizontal x 13° Vertical · 3-way */
  { re: /Euphoria\s?5\b/i, h: 80, v: 60, sens: 90, max: 110, w: 100, o: 8, ok: 1, url: 'https://www.kt-audio.com/products/unicorn-euphoria-5', pdf: 'https://cdn.shopify.com/s/files/1/0821/7804/8283/files/Euphoria_5_Specifications.pdf' }, /* KT Audio Euphoria 5 — 80Hz-20KHz ± 3dB · 80° horizontal, 60° vertical */
  { re: /Euphoria\s?8\b/i, h: 90, v: 60, sens: 94, max: 117, w: 200, o: 8, ok: 1, url: 'https://www.kt-audio.com/products/unicorn-euphoria-8', pdf: 'https://cdn.shopify.com/s/files/1/0821/7804/8283/files/Euphoria_8_manual.pdf' }, /* KT Audio Euphoria 8 — 60Hz–20KHz ± 3dB · 90° horizontal, 60° vertical */
  { re: /Pagaz\s?115S/i, h: 360, v: 360, sens: 94, max: 113, w: 75, o: 8, ok: 1, url: 'https://www.kt-audio.com/products/kt-array-sub', pdf: 'https://cdn.shopify.com/s/files/1/0821/7804/8283/files/Pagaz_115S.pdf' }, /* KT Audio Pagaz 115S — 45Hz-3.5kHz */
  { re: /ARRAY\s?400\b/i, w: 20, o: 16, url: 'https://www.kt-audio.com/products/kt-array-400', pdf: 'https://cdn.shopify.com/s/files/1/0821/7804/8283/files/ARRAY-400-manual.pdf' }, /* KT Audio ARRAY 400 — 4" (138mm) Graphite Cone with Rubber Surround */
  { re: /ARRAY\s?500\b/i, w: 30, o: 16, url: 'https://www.kt-audio.com/products/kt-array-500', pdf: 'https://cdn.shopify.com/s/files/1/0821/7804/8283/files/ARRAY_500_Manual.pdf' }, /* KT Audio ARRAY 500 — 5" (170mm) Graphite Cone with Rubber Surround */
  { re: /ARRAY\s?650\b/i, w: 40, o: 16, url: 'https://www.kt-audio.com/products/kt-array-650', pdf: 'https://cdn.shopify.com/s/files/1/0821/7804/8283/files/ARRAY-650-manual.pdf' }, /* KT Audio ARRAY 650 — 6" (208mm) Graphite Cone with Rubber Surround */
  { re: /Array\s?300\b/i, w: 40, o: 16, url: 'https://www.kt-audio.com/products/kt-array-300', pdf: 'https://cdn.shopify.com/s/files/1/0821/7804/8283/files/MINIRAY_300.pdf' }, /* KT Audio Array 300 */
  { re: /DS\s?-?15\s?BASS/i, h: 360, v: 360, sens: 103, max: 129, w: 400, o: 8, ok: 1, url: 'https://funktion-one.com/product/ds15-bass', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/27681974-c14c-450a-bd72-6da38faf3756_Funktion-One_DS15_Spec_Sheet.pdf' }, /* Funktion-One DS15 BASS — 15" · 105Hz - 220Hz · N/A */
  { re: /PSM\s?-?318\s?DJ/i, h: 70, sens: 101, max: 131, w: 1100, o: 4, ok: 1, url: 'https://funktion-one.com/product/psm318-dj', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/acUOZZGXnQHGY_Gz_PSM318-F1-DS%3DD0049-05.pdf' }, /* Funktion-One PSM318 DJ — 2 x 18" (PSM318L) · 25Hz - 85Hz · 70° Conical · 4-way */
  { re: /Pagaz\s?441\b/i, h: 100, v: 50, sens: 94, max: 115, w: 130, o: 8, ok: 1, url: 'https://www.kt-audio.com/products/pagaz-441', pdf: 'https://cdn.shopify.com/s/files/1/0821/7804/8283/files/Pagaz_441.pdf' }, /* KT Audio Pagaz 441 — 90Hz-18kHz · 100°×50° */
  { re: /Pagaz\s?641\b/i, h: 100, v: 40, sens: 96, max: 119, w: 200, o: 6, ok: 1, url: 'https://www.kt-audio.com/products/unicorn-pagaz-641', pdf: 'https://cdn.shopify.com/s/files/1/0821/7804/8283/files/Pagaz_641.pdf' }, /* KT Audio Pagaz 641 — 90Hz-18kHz · 100°×40° */
  { re: /RES\s?1\.5TT/i, h: 90, v: 25, sens: 100, max: 128, w: 700, o: 4, ok: 1, url: 'https://funktion-one.com/product/res-1.5tt', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/4a6278ce-7238-4b39-a3f4-ce6ca5566421_Funktion-One_Res1.5TT_Spec_Sheet.pdf', man: 'https://funktion-one.cdn.prismic.io/funktion-one/9f0832f3-5751-45c5-aa65-2b863edf2422_R1_UserManual_EN_1_0_0_1.pdf' }, /* Funktion-One RES 1.5TT — 2 x 12" · 25Hz - 520Hz · 90° Horizontal x 25° Vertical · 2-way */
  { re: /V\s?-?1241VERO/i, h: 360, v: 360, sens: 104, max: 107, w: 2, o: 2, ok: 1, url: 'https://funktion-one.com/product/v1241vero', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/9e3fd306-e4ca-473c-b0c4-2a6acb28a857_Funktion-One_F124_Spec_Sheet.pdf' }, /* Funktion-One V1241VERO — 24" dual voice coil · 20Hz - 85Hz · Array dependent */
  { re: /DS\s?-?210MK\s?-?1\b/i, h: 100, v: 25, sens: 108, max: 134, w: 400, o: 8, ok: 1, url: 'https://funktion-one.com/product/ds210mk1' }, /* Funktion-One DS210MK1 — 2 x 10" · 227Hz - 6kHz · 100° Horizontal x 25° Vertical · 2-way */
  { re: /EVO\s?7EH\s?-?1\b/i, h: 40, v: 20, sens: 112, max: 136, w: 250, o: 24, ok: 1, url: 'https://funktion-one.com/product/evo-7eh1', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/a3d1b151-f192-48ae-8d3f-ce8576d52687_Funktion-One_Evo7EH_Spec_Sheet.pdf' }, /* Funktion-One EVO 7EH1 — 10" · 200Hz - 4kHz · 40° Horizontal x 20° Vertical · 2-way */
  { re: /EVO\s?7EL\s?-?1\b/i, h: 360, v: 360, sens: 103, max: 129, w: 400, o: 8, ok: 1, url: 'https://funktion-one.com/product/evo-7el1', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/4acf25bf-10e5-4eb7-a53b-a73e8d58edcf_Funktion-One_Evo7EL_Spec_Sheet.pdf' }, /* Funktion-One EVO 7EL1 — 15" · 85Hz - 250Hz · Array dependent */
  { re: /EVO\s?-?2SHPA/i, h: 50, v: 25, sens: 111, max: 134, w: 200, o: 16, ok: 1, url: 'https://funktion-one.com/product/evo2shpa', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/Z5pyW5bqstJ9-AlP_Evo2SH-F1-DS%3DD0076-01.pdf' }, /* Funktion-One EVO2SHPA — 8" + 1" · 280Hz - 18kHz · 50° Horizontal x 25° Vertical */
  { re: /F\s?-?101\s?MK\s?-?1\b/i, h: 90, v: 70, sens: 100, max: 122, w: 150, o: 8, ok: 1, url: 'https://funktion-one.com/product/f101-mk1', man: 'https://funktion-one.cdn.prismic.io/funktion-one/aAehX_IqRLdaBd6m_F101UserGuidev1.2.pdf' }, /* Funktion-One F101 MK1 — 10" + 1" · 100Hz - 18kHz · 90° x 70° */
  { re: /F\s?-?115\s?MK\s?-?2\b/i, h: 360, v: 360, sens: 102, max: 128, w: 400, o: 8, ok: 1, url: 'https://funktion-one.com/product/f115-mk2', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/ad756b25-06f3-4019-81d0-a175ed004f50_Funktion-One_F115MkII_Spec_Sheet.pdf' }, /* Funktion-One F115 MK2 — 15" · 55/85Hz - 250Hz · Array dependent */
  { re: /F\s?-?118\s?MK\s?-?2\b/i, h: 360, v: 360, sens: 102, max: 129, w: 450, o: 8, ok: 1, url: 'https://funktion-one.com/product/f118-mk2', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/f7956233-5f45-4677-b3a1-f1779d97b642_Funktion-One_F118MkII_Spec_Sheet.pdf' }, /* Funktion-One F118 MK2 — 18" · 25Hz - 200Hz · Array dependent */
  { re: /F\s?-?215\s?MK\s?-?1\b/i, sens: 105, max: 108, w: 2, o: 2, ok: 1, url: 'https://funktion-one.com/product/f215-mk1' }, /* Funktion-One F215 MK1 — 2 x 15" · 60Hz - 280Hz · N/A */
  { re: /F\s?-?215\s?MK\s?-?2\b/i, h: 360, v: 360, sens: 102, max: 105, w: 2, o: 2, ok: 1, url: 'https://funktion-one.com/product/f215-mk2', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/1e2aba1c-5944-4f65-acc6-322af58e6924_Funktion-One_F215MkII_Spec_Sheet.pdf' }, /* Funktion-One F215 MK2 — 2 x 15" · 55/85Hz - 250Hz · Array dependent */
  { re: /F\s?-?218\s?MK\s?-?1\b/i, h: 360, v: 360, sens: 102, max: 132, w: 900, o: 2, ok: 1, url: 'https://funktion-one.com/product/f218-mk1' }, /* Funktion-One F218 MK1 — 2 x 18" · 25Hz - 125Hz · N/A */
  { re: /F\s?-?218\s?MK\s?-?2\b/i, h: 360, v: 360, sens: 102, max: 105, w: 2, o: 2, ok: 1, url: 'https://funktion-one.com/product/f218-mk2', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/982b3d38-abca-48d7-92c8-8f0acd00194a_Funktion-One_F218MkII_Spec_Sheet.pdf' }, /* Funktion-One F218 MK2 — 2 x 18" · 25Hz - 200Hz · Array dependent */
  { re: /RES\s?2MK\s?-?1\b/i, h: 50, v: 25, sens: 102, max: 128, w: 400, o: 8, ok: 1, url: 'https://funktion-one.com/product/res-2mk1' }, /* Funktion-One RES 2MK1 — 15" · 28Hz - 250Hz · 50° Horizontal x 25° Vertical · 2-way */
  { re: /Till\s?12P/i, h: 90, v: 60, sens: 95, max: 120, w: 300, o: 8, ok: 1, url: 'https://www.kt-audio.com/products/unicorn-till-12p', pdf: 'https://cdn.shopify.com/s/files/1/0821/7804/8283/files/Till_Series.pdf' }, /* KT Audio Till 12P — 12” woofer · 50-20KHz · 90°x60° */
  { re: /V\s?-?221VERO/i, h: 360, v: 360, sens: 104, max: 107, w: 2, o: 2, ok: 1, url: 'https://funktion-one.com/product/v221vero', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/b944a7e3-aad8-4552-a1ca-ab4415818b9e_Funktion-One_F221_Spec_Sheet.pdf' }, /* Funktion-One V221VERO — 2 x 21" · 20Hz - 85Hz · Array dependent */
  { re: /BR\s?-?118(?:\.2)?\b/i, h: 360, v: 360, sens: 101, max: 128, w: 550, o: 8, ok: 1, url: 'https://funktion-one.com/product/br118.2', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/Z5pyp5bqstJ9-AlY_BR118.2-F1-DS%3DD0072-02.pdf' }, /* Funktion-One BR118.2 — 18” · 35Hz - 100Hz · Array dependent */
  { re: /EVO\s?6EH/i, h: 50, v: 25, sens: 112, max: 136, w: 250, o: 24, ok: 1, url: 'https://funktion-one.com/product/evo-6eh', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/3cec9b09-09f4-4d76-9c64-82caa0b9d8e7_Funktion-One_Evo6EH_Spec_Sheet.pdf' }, /* Funktion-One EVO 6EH — 10" · 200Hz - 4kHz · 50° Horizontal x 25° Vertical · 2-way */
  { re: /EVO\s?6EL/i, h: 360, v: 360, sens: 103, max: 129, w: 400, o: 8, ok: 1, url: 'https://funktion-one.com/product/evo-6el', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/1b61103a-37ff-4714-9ef2-c3ee8be48092_Funktion-One_Evo6EL_Spec_Sheet.pdf' }, /* Funktion-One EVO 6EL — 15" · 85Hz - 250Hz · Array dependent */
  { re: /EVO\s?7TH/i, h: 40, v: 20, sens: 112, max: 136, w: 250, o: 24, ok: 1, url: 'https://funktion-one.com/product/evo-7th', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/e6ccb1d3-93e3-4bfe-91a8-3ecd9e0ed7df_Funktion-One_Evo7TH_Spec_Sheet.pdf' }, /* Funktion-One EVO 7TH — 10" · 200Hz - 4kHz · 40° Horizontal x 20° Vertical · 2-way */
  { re: /F\s?-?1201(?:\.2)?\b/i, h: 90, v: 60, sens: 100, max: 125, w: 350, o: 8, ok: 1, url: 'https://funktion-one.com/product/f1201.2', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/0e6146e3-e38f-47b3-9af7-c1a379fae6f1_Funktion-One_F1201_Spec_Sheet.pdf' }, /* Funktion-One F1201.2 — 12" + 1" · 55/85Hz - Up · 90° x 60° */
  { re: /MB\s?-?210LP/i, h: 360, v: 360, sens: 101, max: 129, w: 600, o: 4, ok: 1, url: 'https://funktion-one.com/product/mb210lp' }, /* Funktion-One MB210LP — 2 x 10" · 55Hz - 160Hz · N/A */
  { re: /RES\s?1\.5\b/i, h: 90, v: 25, sens: 102, max: 128, w: 400, o: 8, ok: 1, url: 'https://funktion-one.com/product/res-1.5', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/60ed72e2-fbdc-465c-941c-9f76746893de_Funktion-One_Res1.5_Spec_Sheet.pdf', man: 'https://funktion-one.cdn.prismic.io/funktion-one/9f0832f3-5751-45c5-aa65-2b863edf2422_R1_UserManual_EN_1_0_0_1.pdf' }, /* Funktion-One RES 1.5 — 18" · 55Hz - 595Hz · 90° Horizontal x 25° Vertical · 3-way */
  { re: /RES\s?2S\s?-?8\b/i, h: 50, v: 25, sens: 106, max: 129, w: 200, o: 16, ok: 1, url: 'https://funktion-one.com/product/res-2s8', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/0d936a3d-5b7b-44c6-b478-7a062cdd0006_R2S8-F1-DS%3DD0061-00.pdf' }, /* Funktion-One RES 2S8 — 8" · 250Hz - Up · 50° Horizontal x 25° Vertical */
  { re: /RES\s?2SH/i, h: 50, v: 25, sens: 106, max: 130, w: 250, o: 12, ok: 1, url: 'https://funktion-one.com/product/res-2sh', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/4663eb87-d382-42c6-9d4d-0658f2113df0_Funktion-One_Res2SH_Spec_Sheet.pdf' }, /* Funktion-One RES 2SH — 8" + 1" · 250Hz - Up · 50° Horizontal x 25° Vertical */
  { re: /RES\s?3EH/i, h: 50, v: 25, sens: 111, max: 135, w: 250, o: 16, ok: 1, url: 'https://funktion-one.com/product/res-3eh' }, /* Funktion-One RES 3EH — 10" · 170Hz - 5.99Hz · 50° Horizontal x 25° Vertical · 2-way */
  { re: /RES\s?3SH/i, h: 50, v: 25, sens: 111, max: 135, w: 250, o: 16, ok: 1, url: 'https://funktion-one.com/product/res-3sh' }, /* Funktion-One RES 3SH — 10" · 170Hz - 5.99Hz · 50° Horizontal x 25° Vertical · 2-way */
  { re: /SB\s?-?212LP/i, h: 360, v: 360, sens: 100, max: 128, w: 700, o: 4, ok: 1, url: 'https://funktion-one.com/product/sb212lp', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/Z5pyB5bqstJ9-AlE_SB212LP-F1-DS%3DD0073-02.pdf' }, /* Funktion-One SB212LP — 12” · 32Hz - 150Hz · N/A */
  { re: /SB\s?-?212LP/i, h: 360, v: 360, sens: 100, max: 128, w: 700, o: 4, ok: 1, url: 'https://funktion-one.com/product/sb212lp-compact-range', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/Z5pyB5bqstJ9-AlE_SB212LP-F1-DS%3DD0073-02.pdf' }, /* Funktion-One SB212LP — 12” · 32Hz - 150Hz · N/A */
  { re: /Till\s?8P/i, h: 90, v: 60, sens: 93, max: 116, w: 200, o: 8, ok: 1, url: 'https://www.kt-audio.com/products/unicorn-till-8p', pdf: 'https://cdn.shopify.com/s/files/1/0821/7804/8283/files/Till_Series.pdf' }, /* KT Audio Till 8P — 8" subwoofer · 70-20KHz · 90°x60° */
  { re: /Bold\s?8\b/i, sens: 89, max: 110, w: 120, o: 4, url: 'https://www.kt-audio.com/products/kt-bold-8', pdf: 'https://cdn.shopify.com/s/files/1/0821/7804/8283/files/BOLD_8_ROCK_SPEAKER.pdf' }, /* KT Audio Bold 8 — 8" PP Cone Rubber Surround · 45Hz~20KHz */
  { re: /EVO\s?6E/i, h: 50, v: 25, sens: 103, max: 129, w: 400, o: 8, ok: 1, url: 'https://funktion-one.com/product/evo-6e', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/3c215aa9-5259-4277-9fba-3cd48f64f544_Funktion-One_Evo6E_Spec_Sheet.pdf' }, /* Funktion-One EVO 6E — 15" · 85Hz - 220Hz · 50° Horizontal x 25° Vertical · 3-way */
  { re: /EVO\s?7E/i, h: 40, v: 20, sens: 103, max: 129, w: 400, o: 8, ok: 1, url: 'https://funktion-one.com/product/evo-7e', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/45dc168c-0538-444e-a185-433751ec9f67_Funktion-One_Evo7E_Spec_Sheet.pdf' }, /* Funktion-One EVO 7E — 15" · 85Hz - 220Hz · 40° Horizontal x 20° Vertical · 3-way */
  { re: /EVO\s?7T/i, h: 40, v: 20, sens: 103, max: 129, w: 400, o: 8, ok: 1, url: 'https://funktion-one.com/product/evo-7t', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/94bca4de-a856-4c0a-95aa-9c3280a54341_Funktion-One_Evo7T_Spec_Sheet.pdf' }, /* Funktion-One EVO 7T — 15" · 85Hz - 220Hz · 40° Horizontal x 20° Vertical · 3-way */
  { re: /EVO\s?-?2SH/i, h: 50, v: 25, sens: 111, max: 134, w: 200, o: 16, ok: 1, url: 'https://funktion-one.com/product/evo2sh', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/Z5pyW5bqstJ9-AlP_Evo2SH-F1-DS%3DD0076-01.pdf' }, /* Funktion-One EVO2SH — 8" + 1" · 280Hz - 18kHz · 50° Horizontal x 25° Vertical */
  { re: /F\s?-?101(?:\.2)?\b/i, h: 90, v: 60, sens: 100, max: 122, w: 150, o: 8, ok: 1, url: 'https://funktion-one.com/product/f101.2', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/b3ac884f-0ba9-4ddd-acd0-978fcf603cb0_Funktion-One_F101.2_Spec_Sheet.pdf' }, /* Funktion-One F101.2 — 10" + 1" · 100Hz - 20kHz · 90° x 60° */
  { re: /F\s?-?5_MK\s?-?1\b/i, sens: 90, max: 105, w: 30, o: 16, ok: 1, url: 'https://funktion-one.com/product/f5_mk1', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/2fcd7901-9203-4e99-8f12-1b19a0585004_F5_Specsheet2020.pdf' }, /* Funktion-One F5_MK1 — 5” · 100Hz - up · Conical */
  { re: /RES\s?18\b/i, sens: 102, max: 129, w: 450, o: 8, ok: 1, url: 'https://funktion-one.com/product/res-18', man: 'https://funktion-one.cdn.prismic.io/funktion-one/f5650a88-9f11-4fab-b53d-096c3443a853_Res+5+series+UG+091213.pdf' }, /* Funktion-One RES 18 — 18" · 40Hz - 250Hz · Array dependent */
  { re: /RES\s?2A/i, h: 50, v: 25, sens: 102, max: 128, w: 400, o: 8, ok: 1, url: 'https://funktion-one.com/product/res-2a', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/2deeeb49-3b21-4764-aba2-f6196bf997b1_Funktion-One_Res2_Spec_Sheet.pdf', man: 'https://funktion-one.cdn.prismic.io/funktion-one/8ced3bb3-926f-4e3b-9e41-4dce8dc00603_A4_%26_A6_Manual_Live%21_Version.pdf' }, /* Funktion-One RES 2A — 15" · 28Hz - 250Hz · 50° Horizontal x 25° Vertical · 2-way */
  { re: /RES\s?4D/i, h: 25, v: 50, sens: 108, max: 131, w: 200, o: 16, ok: 1, url: 'https://funktion-one.com/product/res-4d', man: 'https://funktion-one.cdn.prismic.io/funktion-one/c11b8787-93fc-43d1-897c-009b4b9b2133_Res+4+series+UG+091213.pdf' }, /* Funktion-One RES 4D — 8" · 445Hz - 5.77kHz · 25° Horizontal x 50° Vertical · 2-way */
  { re: /RES\s?4E/i, h: 50, v: 25, sens: 105, max: 130, w: 300, o: 8, ok: 1, url: 'https://funktion-one.com/product/res-4e', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/9f77740d-feb6-4dc0-b66e-70f6355429ee_Funktion-One_Res4E_Spec_Sheet.pdf', man: 'https://funktion-one.cdn.prismic.io/funktion-one/c11b8787-93fc-43d1-897c-009b4b9b2133_Res+4+series+UG+091213.pdf' }, /* Funktion-One RES 4E — 12" · 114Hz - 445Hz · 50° Horizontal x 25° Vertical · 3-way */
  { re: /RES\s?4S/i, h: 50, v: 25, sens: 105, max: 130, w: 300, o: 8, ok: 1, url: 'https://funktion-one.com/product/res-4s' }, /* Funktion-One RES 4S — 12" · 114Hz - 445Hz · 50° Horizontal x 25° Vertical · 3-way */
  { re: /RES\s?4T/i, h: 50, v: 25, sens: 105, max: 130, w: 300, o: 8, ok: 1, url: 'https://funktion-one.com/product/res-4t', man: 'https://funktion-one.cdn.prismic.io/funktion-one/c11b8787-93fc-43d1-897c-009b4b9b2133_Res+4+series+UG+091213.pdf' }, /* Funktion-One RES 4T — 12" · 114Hz - 445Hz · 50° Horizontal x 25° Vertical · 3-way */
  { re: /RES\s?5E/i, h: 25, v: 20, sens: 105, max: 130, w: 300, o: 8, ok: 1, url: 'https://funktion-one.com/product/res-5e', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/88420eec-31f7-4cd0-802f-db51fcc7a6c2_Funktion-One_Res5E_Spec_Sheet.pdf', man: 'https://funktion-one.cdn.prismic.io/funktion-one/f5650a88-9f11-4fab-b53d-096c3443a853_Res+5+series+UG+091213.pdf' }, /* Funktion-One RES 5E — 12" · 114Hz - 445Hz · 25° Horizontal x 20° Vertical · 3-way */
  { re: /RES\s?5S/i, h: 25, v: 20, sens: 105, max: 130, w: 300, o: 8, ok: 1, url: 'https://funktion-one.com/product/res-5s' }, /* Funktion-One RES 5S — 12" · 114Hz - 445Hz · 25° Horizontal x 20° Vertical · 3-way */
  { re: /RES\s?5T/i, h: 25, v: 20, sens: 105, max: 130, w: 300, o: 8, ok: 1, url: 'https://funktion-one.com/product/res-5t', man: 'https://funktion-one.cdn.prismic.io/funktion-one/f5650a88-9f11-4fab-b53d-096c3443a853_Res+5+series+UG+091213.pdf' }, /* Funktion-One RES 5T — 12" · 114Hz - 445Hz · 25° Horizontal x 20° Vertical · 3-way */
  { re: /SB\s?-?210A/i, h: 360, v: 360, sens: 105, max: 131, w: 400, o: 4, ok: 1, url: 'https://funktion-one.com/product/sb210a' }, /* Funktion-One SB210A — 2 x 10" · 60Hz - 150Hz · N/A */
  { re: /WR\s?600\b/i, sens: 86, max: 102, w: 40, o: 16, url: 'https://www.kt-audio.com/products/kt-wr-600', pdf: 'https://cdn.shopify.com/s/files/1/0821/7804/8283/files/WR_600.pdf' }, /* KT Audio WR 600 — 6.5 inch */
  { re: /BR\s?-?115\b/i, h: 360, v: 360, sens: 100, max: 127, w: 500, o: 8, ok: 1, url: 'https://funktion-one.com/product/br115', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/e599794d-7122-48a6-b137-258726c4a63d_Funktion-One_BR115_Spec_Sheet.pdf' }, /* Funktion-One BR115 — 15” · 45Hz - 100Hz · Array dependent */
  { re: /BR\s?-?118\b/i, h: 360, v: 360, sens: 100, max: 127, w: 550, o: 8, ok: 1, url: 'https://funktion-one.com/product/br118', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/4169e61e-4594-4a4b-a05a-1d48ee95284b_Funktion-One_BR118_Spec_Sheet.pdf' }, /* Funktion-One BR118 — 18” · 25Hz - 85Hz · Array dependent */
  { re: /BR\s?-?121\b/i, h: 360, v: 360, sens: 100, max: 128, w: 650, o: 8, ok: 1, url: 'https://funktion-one.com/product/br121', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/8d182a10-ec99-4184-9079-e4027a0f77c4_Funktion-One_BR121_Spec_Sheet.pdf' }, /* Funktion-One BR121 — 21" · 25Hz - 85Hz · Array dependent */
  { re: /BR\s?-?218\b/i, h: 360, v: 360, sens: 102, max: 105, w: 2, o: 2, ok: 1, url: 'https://funktion-one.com/product/br218', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/b9ac374f-9808-45f5-8386-fed62b205d67_Funktion-One_BR218_Spec_Sheet.pdf' }, /* Funktion-One BR218 — 2 x 18" · 35Hz - 85Hz · Array dependent */
  { re: /BR\s?-?221\b/i, h: 360, v: 360, sens: 102, max: 105, w: 2, o: 2, ok: 1, url: 'https://funktion-one.com/product/br221', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/365d96a7-0e04-4ea2-9760-6ab86f0161e0_Funktion-One_BR221_Spec_Sheet.pdf' }, /* Funktion-One BR221 — 2 x 21” · 25Hz - 85Hz · Array dependent */
  { re: /DS\s?-?210\b/i, h: 100, v: 25, sens: 112, max: 139, w: 500, o: 12, ok: 1, url: 'https://funktion-one.com/product/ds210', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/f823e17f-d8b1-41dd-a0e8-8eddf051d445_Funktion-One_DS210_Spec_Sheet.pdf' }, /* Funktion-One DS210 — 2 x 10" · 220Hz - 4kHz · 100° Horizontal x 25° Vertical · 2-way */
  { re: /EVO\s?2\b/i, h: 50, v: 25, sens: 100, max: 128, w: 600, o: 8, ok: 1, url: 'https://funktion-one.com/product/evo-2', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/Z0Ryoq8jQArT1RYm_Evo2-F1-DS%3DD0069-02.pdf', man: 'https://funktion-one.cdn.prismic.io/funktion-one/aF0g3nfc4bHWivrP_Evo2UserGuideV2.0.pdf' }, /* Funktion-One EVO 2 — 12" · 60/85Hz - 280Hz · 50° Horizontal x 25° Vertical · 4-way */
  { re: /EVO\s?-?2L/i, sens: 100, max: 128, w: 600, o: 8, ok: 1, url: 'https://funktion-one.com/product/evo2l', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/ad-KnZ1ZCF7ETNuk_Evo2L-F1-DS%3DD0075-02.pdf', man: 'https://funktion-one.cdn.prismic.io/funktion-one/aF0g3nfc4bHWivrP_Evo2UserGuideV2.0.pdf' }, /* Funktion-One EVO2L — 12" · 60/85Hz - 280Hz · N/A */
  { re: /F\s?-?1201\b/i, h: 90, v: 40, sens: 100, max: 125, w: 350, o: 8, ok: 1, url: 'https://funktion-one.com/product/f1201', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/d7d58ec9-dfd3-440a-81b7-8f7112e832a1_F1201_WebSheet2015.pdf', man: 'https://funktion-one.cdn.prismic.io/funktion-one/7a6f38bf-2138-401a-8eac-93822d4603d5_F1201+User+Guide+v1.41.pdf' }, /* Funktion-One F1201 — 12" + 1" · 80Hz - up · 90° Horizontal x 40° Vertical (rotatable) */
  { re: /F\s?-?221A/i, sens: 104, max: 107, w: 2, o: 2, ok: 1, url: 'https://funktion-one.com/product/f221a', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/b944a7e3-aad8-4552-a1ca-ab4415818b9e_Funktion-One_F221_Spec_Sheet.pdf', man: 'https://funktion-one.cdn.prismic.io/funktion-one/8ced3bb3-926f-4e3b-9e41-4dce8dc00603_A4_%26_A6_Manual_Live%21_Version.pdf' }, /* Funktion-One F221A — 2 x 21" · 20Hz - 200Hz · Array dependent */
  { re: /F\s?-?81\s?1\b/i, h: 90, v: 70, sens: 98, max: 118, w: 100, o: 8, ok: 1, url: 'https://funktion-one.com/product/f81-1', man: 'https://funktion-one.cdn.prismic.io/funktion-one/aAehI_IqRLdaBd6g_F81UserGuidev1.2.pdf' }, /* Funktion-One F81 1 — 8" + 1" · 110Hz - 18kHz · 90° x 70° */
  { re: /F\s?-?81(?:\.2)?\b/i, h: 90, v: 60, sens: 98, max: 118, w: 100, o: 8, ok: 1, url: 'https://funktion-one.com/product/f81.2', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/c09e0b53-9f15-445b-8307-8ea255878dd3_F81.2_Spec_Sheet.pdf' }, /* Funktion-One F81.2 — 8" + 1" · 100Hz - 20kHz · 90° x 60° */
  { re: /IB\s?-?218\b/i, sens: 100, max: 103, w: 2, o: 2, ok: 1, url: 'https://funktion-one.com/product/ib218', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/d6c9161e-618b-439d-882c-bba82ac13500_IB218-F1-DS%3DD0059-00.pdf' }, /* Funktion-One IB218 — 2 x 18" · 20Hz - 80Hz · N/A */
  { re: /MB\s?-?112\b/i, h: 360, v: 360, sens: 104, max: 128, w: 250, o: 8, ok: 1, url: 'https://funktion-one.com/product/mb112', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/b1b69c6e-46a3-479d-9ec7-5572001fa290_Funktion-One_MB112_Spec_Sheet.pdf' }, /* Funktion-One MB112 — 12" · 60Hz - 160Hz · N/A */
  { re: /MB\s?-?210\b/i, h: 360, v: 360, sens: 103, max: 129, w: 400, o: 8, ok: 1, url: 'https://funktion-one.com/product/mb210' }, /* Funktion-One MB210 — 2 x 10" · 50Hz - 150Hz · N/A */
  { re: /MB\s?-?212\b/i, h: 360, v: 360, sens: 104, max: 132, w: 600, o: 8, ok: 1, url: 'https://funktion-one.com/product/mb212', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/6c4fde0d-bf46-4005-a1ab-237c51794411_Funktion-One_MB212_Spec_Sheet.pdf' }, /* Funktion-One MB212 — 2 x 12" · 35Hz - 125Hz · N/A */
  { re: /MB\s?-?308\b/i, h: 360, v: 360, sens: 101, max: 126, w: 300, o: 8, ok: 1, url: 'https://funktion-one.com/product/mb308' }, /* Funktion-One MB308 — 3 x 8" · 60Hz - 140Hz · N/A */
  { re: /PSM\s?-?12\b/i, h: 70, sens: 101, max: 127, w: 400, o: 8, ok: 1, url: 'https://funktion-one.com/product/psm12-point-source', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/5e9fd992-1981-459d-96b2-979adc9ef188_Funktion-One_PSM12_Spec_Sheet.pdf' }, /* Funktion-One PSM12 — 12" · 40Hz - 2.5kHz · 70° Conical · 3-way */
  { re: /PSM\s?-?15\b/i, h: 50, v: 70, sens: 96, max: 124, w: 600, o: 8, ok: 1, url: 'https://funktion-one.com/product/psm15', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/aWYn0QIvOtkhBbt2_PSM15-F1-DS%3DD0086-01.pdf', man: 'https://funktion-one.cdn.prismic.io/funktion-one/adjtpZ1ZCF7ETEmV_PSM15_User_Guide_V1.0.pdf' }, /* Funktion-One PSM15 — 15" (LF) · 60Hz - 1kHz · 50° Horizontal x 70° Vertical (rotatable by 9 */
  { re: /PSM\s?-?18\b/i, h: 70, sens: 104, max: 132, w: 600, o: 8, ok: 1, url: 'https://funktion-one.com/product/psm18-point-source', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/acUOSZGXnQHGY_Gv_PSM18-F1-DS%3DD0048-03.pdf' }, /* Funktion-One PSM18 — 18" · 30Hz - 694Hz · 70° Conical · 3-way */
  { re: /RES\s?1\b/i, h: 40, v: 25, sens: 102, max: 127, w: 350, o: 8, ok: 1, url: 'https://funktion-one.com/product/res-1', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/184a455d-1c5e-49f5-acf2-a7ab8a435a07_Res1-F1-DS%3DD0024-01.pdf', man: 'https://funktion-one.cdn.prismic.io/funktion-one/29882e8e-0600-42d1-adb2-776af18921d0_R1_UserManual_EN_1_0_0_1.pdf' }, /* Funktion-One RES 1 — 12" · 25Hz - 520Hz · 40° Horizontal x 25° Vertical · 3-way */
  { re: /RES\s?2\b/i, h: 50, v: 25, sens: 102, max: 128, w: 400, o: 8, ok: 1, url: 'https://funktion-one.com/product/res-2', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/2deeeb49-3b21-4764-aba2-f6196bf997b1_Funktion-One_Res2_Spec_Sheet.pdf' }, /* Funktion-One RES 2 — 15" · 28Hz - 250Hz · 50° Horizontal x 25° Vertical · 2-way */
  { re: /RES\s?3\b/i, h: 50, v: 25, sens: 103, max: 130, w: 500, o: 8, ok: 1, url: 'https://funktion-one.com/product/res-3' }, /* Funktion-One RES 3 — 18" · 20Hz - 200Hz · 50° Horizontal x 25° Vertical · 3-way */
  { re: /RES\s?9\b/i, h: 25, v: 25, sens: 107, max: 135, w: 700, o: 4, ok: 1, url: 'https://funktion-one.com/product/res-9' }, /* Funktion-One RES 9 — 2 x 15" · 75Hz - 445Hz · 25° Horizontal x 25° Vertical · 3-way */
  { re: /AX\s?-?88\b/i, h: 60, v: 55, sens: 108, max: 134, w: 400, o: 8, ok: 1, url: 'https://funktion-one.com/product/ax88', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/6eac61b9-ca16-4670-a5e5-017954f0d05e_Funktion-One_AX88_Spec_Sheet.pdf' }, /* Funktion-One AX88 — 2 x 8" + 1" · 180Hz - Up · 60° Horizontal x 55° Vertical */
  { re: /DS\s?-?15\b/i, sens: 103, max: 129, w: 400, o: 8, ok: 1, url: 'https://funktion-one.com/product/ds15', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/27681974-c14c-450a-bd72-6da38faf3756_Funktion-One_DS15_Spec_Sheet.pdf' }, /* Funktion-One DS15 — 15" · 105 - 220Hz · - */
  { re: /F\s?-?121\b/i, h: 360, v: 360, sens: 101, max: 130, w: 750, o: 8, ok: 1, url: 'https://funktion-one.com/product/f121', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/ZtWvQUaF0TcGJq7k_Funktion-One_F121_Spec_Sheet_2.pdf' }, /* Funktion-One F121 — 21" · 20Hz - 200Hz · Array dependent */
  { re: /F\s?-?124\b/i, h: 360, v: 360, sens: 104, max: 107, w: 2, o: 2, ok: 1, url: 'https://funktion-one.com/product/f124', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/9e3fd306-e4ca-473c-b0c4-2a6acb28a857_Funktion-One_F124_Spec_Sheet.pdf' }, /* Funktion-One F124 — 24" dual voice coil · 20Hz - 85Hz · Array dependent */
  { re: /F\s?-?221\b/i, h: 360, v: 360, sens: 104, max: 107, w: 2, o: 2, ok: 1, url: 'https://funktion-one.com/product/f221', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/b944a7e3-aad8-4552-a1ca-ab4415818b9e_Funktion-One_F221_Spec_Sheet.pdf' }, /* Funktion-One F221 — 2 x 21" · 20Hz - 85Hz · Array dependent */
  { re: /F\s?-?315\b/i, h: 360, v: 360, sens: 101, max: 132, w: 1200, o: 2, ok: 1, url: 'https://funktion-one.com/product/f315', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/5a400252-1c5f-4094-9bb0-ae3c82035287_Funktion-One_F315_Spec_Sheet.pdf' }, /* Funktion-One F315 — 3 x 15" · 85Hz - 250Hz · N/A */
  { re: /F\s?-?5(?:\.2)?\b/i, sens: 90, max: 105, w: 30, o: 16, ok: 1, url: 'https://funktion-one.com/product/f5.2', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/Z2Qh25bqstJ98rf__F5.2-F1-DS%3DD0014-01.pdf' }, /* Funktion-One F5.2 — 5” · 150Hz - 13kHz · Conical */
  { re: /RM\s?-?12\b/i, h: 25, v: 50, sens: 100, max: 125, w: 300, o: 8, ok: 1, url: 'https://funktion-one.com/product/rm12' }, /* Funktion-One RM12 — 12" · 40Hz - 721Hz · 25° x 50° · 2-way */
  { re: /RM\s?-?15\b/i, h: 25, v: 50, sens: 102, max: 128, w: 400, o: 8, ok: 1, url: 'https://funktion-one.com/product/rm15' }, /* Funktion-One RM15 — 15" · 30Hz - 721Hz · 25° x 50° · 2-way */
  { re: /SB\s?-?10\b/i, h: 360, v: 360, sens: 98, max: 123, w: 300, o: 8, ok: 1, url: 'https://funktion-one.com/product/sb10-compact-range', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/ZiZ0KvPdc1huKraO_SB10-F1-DS%3DD0021-02.pdf', man: 'https://funktion-one.cdn.prismic.io/funktion-one/Zv6dWbVsGrYSwVqO_SB8A_SB10A_User_Guide_V1.2.pdf' }, /* Funktion-One SB10 — 10” · 40Hz - 130Hz · N/A */
  { re: /SB\s?-?10\b/i, h: 360, v: 360, sens: 98, max: 123, w: 300, o: 8, ok: 1, url: 'https://funktion-one.com/product/sb10', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/ZiZ0KvPdc1huKraO_SB10-F1-DS%3DD0021-02.pdf', man: 'https://funktion-one.cdn.prismic.io/funktion-one/Zv6dWbVsGrYSwVqO_SB8A_SB10A_User_Guide_V1.2.pdf' }, /* Funktion-One SB10 — 10” · 40Hz - 130Hz · N/A */
  { re: /SB\s?-?12\b/i, h: 360, v: 360, sens: 97, max: 122, w: 350, o: 8, ok: 1, url: 'https://funktion-one.com/product/sb12-compact-range', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/aWToPwIvOtkhBTtK_SB12-F1-DS%3DD0077-05.pdf' }, /* Funktion-One SB12 — 12” · 35Hz - 150Hz · N/A */
  { re: /SB\s?-?12\b/i, h: 360, v: 360, sens: 97, max: 122, w: 350, o: 8, ok: 1, url: 'https://funktion-one.com/product/sb12', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/aWToPwIvOtkhBTtK_SB12-F1-DS%3DD0077-05.pdf' }, /* Funktion-One SB12 — 12” · 35Hz - 150Hz · N/A */
  { re: /V\s?-?124\b/i, h: 360, v: 360, sens: 104, max: 107, w: 2, o: 2, ok: 1, url: 'https://funktion-one.com/product/v124', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/9e3fd306-e4ca-473c-b0c4-2a6acb28a857_Funktion-One_F124_Spec_Sheet.pdf' }, /* Funktion-One V124 — 24" dual voice coil · 20Hz - 85Hz · Array dependent */
  { re: /V\s?-?221\b/i, h: 360, v: 360, sens: 104, max: 107, w: 2, o: 2, ok: 1, url: 'https://funktion-one.com/product/v221', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/b944a7e3-aad8-4552-a1ca-ab4415818b9e_Funktion-One_F221_Spec_Sheet.pdf' }, /* Funktion-One V221 — 2 x 21" · 20Hz - 85Hz · Array dependent */
  { re: /V\s?-?315\b/i, h: 360, v: 360, sens: 106, max: 138, w: 1500, o: 2, ok: 1, url: 'https://funktion-one.com/product/v315', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/5a400252-1c5f-4094-9bb0-ae3c82035287_Funktion-One_F315_Spec_Sheet.pdf', man: 'https://funktion-one.cdn.prismic.io/funktion-one/a600e254-dc06-4264-a4ec-063e2409e628_Vero+User+Guide+29_04_2018+%28v0.96%29.pdf' }, /* Funktion-One V315 — 3 x 15" · 50Hz - 200Hz · Array dependent */
  { re: /VX\s?-?90\b/i, h: 90, v: 13, sens: 107, max: 130, w: 200, o: 16, ok: 1, url: 'https://funktion-one.com/product/vx90', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/fc25906c-1d9a-461b-b91c-12199f294282_Funktion-One_VX90_Spec_Sheet.pdf', man: 'https://funktion-one.cdn.prismic.io/funktion-one/b232089e-ac7e-43de-a049-41c8cb4e8306_VX+Rigging+Manual_V1_32.pdf' }, /* Funktion-One VX90 — 1 x 8" · 280Hz – 5kHz · 90° Horizontal / 13° Vertical · 3-way */
  { re: /AX\s?-?8\b/i, sens: 109, max: 132, w: 200, o: 16, ok: 1, url: 'https://funktion-one.com/product/ax8', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/a190ccc1-c5b1-4801-bc44-3a1a3ad0a893_Funktion-One_AX8_Spec_Sheet.pdf' }, /* Funktion-One AX8 — 8" · 180Hz - 8kHz · 13.5kg (30 lbs) */
  { re: /F\s?-?55\b/i, h: 90, v: 45, sens: 95, max: 113, w: 60, o: 8, ok: 1, url: 'https://funktion-one.com/product/f55', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/18ca46ce-3d97-411b-823c-5aa0bf7a6a1d_Funktion-One_F55_Spec_Sheet.pdf', man: 'https://funktion-one.cdn.prismic.io/funktion-one/5e3d5a4c-8d64-4ea7-b4b8-b83e249b0407_F55+User+Guide+v1.1-2.pdf' }, /* Funktion-One F55 — 2 x 5" · 160Hz - 13kHz · 90° x 45° */
  { re: /F\s?-?61\b/i, h: 90, v: 60, sens: 92, max: 112, w: 100, o: 16, ok: 1, url: 'https://funktion-one.com/product/f61', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/aBTvcvIqRLdaB1GT_F61-F1-DS%3DD0074-02.pdf' }, /* Funktion-One F61 — 6" + 1" · 100Hz - 20kHz · 90° x 60° */
  { re: /F\s?-?88\b/i, h: 110, v: 40, sens: 98, max: 124, w: 400, o: 6, ok: 1, url: 'https://funktion-one.com/product/f88', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/e0eb3cc3-db12-47de-9d2b-0ebfbd179ace_Funktion-One_F88_Spec_Sheet.pdf' }, /* Funktion-One F88 — 2 x 8" HF Slot · 70Hz - 18kHz · 110° x 40° */
  { re: /SB\s?-?8\b/i, h: 360, v: 360, sens: 95, max: 119, w: 250, o: 8, ok: 1, url: 'https://funktion-one.com/product/sb8', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/46a4e4d3-697f-48aa-88ff-e656c532a379_SB8-F1-DS%3DD0020-01.pdf', man: 'https://funktion-one.cdn.prismic.io/funktion-one/Zv6dWbVsGrYSwVqO_SB8A_SB10A_User_Guide_V1.2.pdf' }, /* Funktion-One SB8 — 8” · 50Hz - 300Hz · N/A */
  { re: /SB\s?-?8\b/i, h: 360, v: 360, sens: 95, max: 119, w: 250, o: 8, ok: 1, url: 'https://funktion-one.com/product/sb8-compact-range', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/46a4e4d3-697f-48aa-88ff-e656c532a379_SB8-F1-DS%3DD0020-01.pdf', man: 'https://funktion-one.cdn.prismic.io/funktion-one/Zv6dWbVsGrYSwVqO_SB8A_SB10A_User_Guide_V1.2.pdf' }, /* Funktion-One SB8 — 8” · 50Hz - 300Hz · N/A */
  { re: /V\s?-?60\b/i, h: 60, v: 6, sens: 111, max: 138, w: 500, o: 12, ok: 1, url: 'https://funktion-one.com/product/v60', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/aa8265b1-b8d7-4487-954e-acc0087f552b_Funktion-One_V60_Spec_Sheet.pdf', man: 'https://funktion-one.cdn.prismic.io/funktion-one/a600e254-dc06-4264-a4ec-063e2409e628_Vero+User+Guide+29_04_2018+%28v0.96%29.pdf' }, /* Funktion-One V60 — 2 x 10" · 200Hz - 4kHz · 60° horizontal x 6° vertical · 2-way */
  { re: /V\s?-?90\b/i, h: 90, sens: 110, max: 137, w: 500, o: 12, ok: 1, url: 'https://funktion-one.com/product/v90', pdf: 'https://funktion-one.cdn.prismic.io/funktion-one/5fdfc51b-7c33-4155-98a3-654c3240d540_Funktion-One_V90__Spec_Sheet.pdf', man: 'https://funktion-one.cdn.prismic.io/funktion-one/a600e254-dc06-4264-a4ec-063e2409e628_Vero+User+Guide+29_04_2018+%28v0.96%29.pdf' }, /* Funktion-One V90 — 2 x 10" · 200Hz - 4kHz · 90° horizontal x 12º vertical · 2-way */
];
function spkData(name) {
  const lib = (store && store.spkLib) || {};
  const key = rearKey(name);
  if (lib[key]) return lib[key];
  return SPEAKER_DATA.find(d => d.re.test(name || '')) || null;
}
function guessVdisp(name) { const d = spkData(name); return (d && d.v) ? d.v : 50; }
/* ייבוא נתוני רמקולים מ-EASE/GLL Viewer (CSV: model,H,V,sens,max · או JSON) לספריית store.spkLib */
function importSpkData(inp) {
  const f = inp.files[0]; if (!f) return; inp.value = '';
  const r = new FileReader();
  r.onload = () => {
    store.spkLib = store.spkLib || {};
    let n = 0;
    try {
      const txt = String(r.result).trim();
      let rows = [];
      if (txt[0] === '[' || txt[0] === '{') {
        const j = JSON.parse(txt); rows = (Array.isArray(j) ? j : [j]).map(x => ({ model: x.model || x.name, h: +x.h || +x.H, v: +x.v || +x.V, sens: x.sens != null ? +x.sens : (x.sensitivity != null ? +x.sensitivity : undefined), max: x.max != null ? +x.max : (x.maxspl != null ? +x.maxspl : undefined) }));
      } else {
        const lines = txt.split(/\r?\n/).filter(l => l.trim());
        const head = lines[0].toLowerCase().split(',').map(s => s.trim());
        const gi = k => head.findIndex(h => h.includes(k));
        const im = gi('model') >= 0 ? gi('model') : 0, ih = gi('h'), iv = gi('v'), is = gi('sens'), ix = gi('max');
        for (let i = 1; i < lines.length; i++) { const c = lines[i].split(','); rows.push({ model: (c[im] || '').trim(), h: +c[ih], v: +c[iv], sens: is >= 0 && c[is] ? +c[is] : undefined, max: ix >= 0 && c[ix] ? +c[ix] : undefined }); }
      }
      rows.forEach(x => { if (x.model) { store.spkLib[rearKey(x.model)] = { re: null, h: x.h || 90, v: x.v || 50, sens: x.sens, max: x.max || 126, ok: true }; n++; } });
      save(); render();
      alert(`יובאו ${n} דגמי רמקולים לספריית הנתונים.`);
    } catch (e) { alert('קובץ לא תקין: ' + e.message); }
  };
  r.readAsText(f);
}
/* ===== נתוני מגברים ופרוססורים — מקור: שמות פריטי ה-ERP + דפי יצרן ===== */
/* mo = מינימום עומס לערוץ (Ω) — השרשור לא ירד מתחתיו */
const AMP_DATA = [
  /* ===== YAMAHA ביתיים — נקצר מדפי המפרט הרשמיים (usa/uk/europe/au.yamaha.com), 2026-08.
     ch = ערוצי הגברה בפועל (7.2 → 7) · אימפדנס מינימלי לא מפורסם בדפים — ברירת המחדל 4Ω ===== */
  { re: /RX\s?-?V\s?-?6A?\b/i, kind: 'amp', ch: 7, ok: 1, w: '7ch · 100W @8Ω · 80W @6Ω (20Hz-20kHz, 2ch)', pw: { 8: 100, 6: 80 }, url: 'https://usa.yamaha.com/products/audio_visual/av_receivers_amps/rx-v6a/specs.html' },
  { re: /RX\s?-?V\s?-?4A?\b/i, kind: 'amp', ch: 5, ok: 1, w: '5ch · 100W @8Ω · 80W @6Ω (20Hz-20kHz, 2ch)', pw: { 8: 100, 6: 80 }, url: 'https://usa.yamaha.com/products/audio_visual/av_receivers_amps/rx-v4a/specs.html' },
  { re: /RX\s?-?A\s?-?2A\b/i, kind: 'amp', ch: 7, ok: 1, w: '7ch · 100W @8Ω (20Hz-20kHz, 2ch) · Zone2 preout', pw: { 8: 100 }, url: 'https://usa.yamaha.com/products/audio_visual/av_receivers_amps/rx-a2a/specs.html' },
  { re: /RX\s?-?A\s?-?4A\b/i, kind: 'amp', ch: 7, ok: 1, w: '7ch · 110W @8Ω (20Hz-20kHz, 2ch) · Zone2 preout/HDMI', pw: { 8: 110 }, url: 'https://usa.yamaha.com/products/audio_visual/av_receivers_amps/rx-a4a/specs.html' },
  { re: /RX\s?-?V\s?-?385/i, kind: 'amp', ch: 5, ok: 1, w: '5.1 · 70W @6Ω rated · מקס 135W @6Ω (JEITA)', pw: { 6: 70 }, url: 'https://europe.yamaha.com/products/audio_visual/av_receivers_amps/rx-v385/specs.html' },
  { re: /RX\s?-?V\s?-?485/i, kind: 'amp', ch: 5, ok: 1, w: '5.1 · 80W @6Ω rated · מקס 145W @6Ω (JEITA)', pw: { 6: 80 }, url: 'https://uk.yamaha.com/products/audio_visual/av_receivers_amps/rx-v485/specs.html' },
  { re: /RX\s?-?V\s?-?483/i, kind: 'amp', ch: 5, ok: 1, w: '5.1 · 80W @6Ω rated · מקס 145W @6Ω (JEITA)', pw: { 6: 80 }, url: 'https://au.yamaha.com/en/products/audio_visual/av_receivers_amps/rx-v483/specs.html' },
  { re: /RX\s?-?V\s?-?585/i, kind: 'amp', ch: 7, ok: 1, w: '7.2 · 80W @6Ω rated · מקס 145W @6Ω (JEITA)', pw: { 6: 80 }, url: 'https://uk.yamaha.com/products/audio_visual/av_receivers_amps/rx-v585/specs.html' },
  { re: /RX\s?-?V\s?-?685/i, kind: 'amp', ch: 7, ok: 1, w: '7.2 · 90W @8Ω rated · 150W @4Ω (1kHz) · דינמי 125W @8Ω', pw: { 8: 90, 4: 150 }, url: 'https://uk.yamaha.com/products/audio_visual/av_receivers_amps/rx-v685/specs.html' },
  { re: /RX\s?-?V\s?-?381/i, kind: 'amp', ch: 5, ok: 1, w: '5.1 · 70W @6Ω rated · מקס 140W @6Ω (JEITA)', pw: { 6: 70 }, url: 'https://uk.yamaha.com/products/audio_visual/av_receivers_amps/rx-v381/specs.html' },
  { re: /RX\s?-?A\s?-?2070/i, kind: 'amp', ch: 9, ok: 1, w: '9.2 · 140W @8Ω rated · 220W @4Ω (1kHz) · Zone2+3', pw: { 8: 140, 4: 220 }, url: 'https://usa.yamaha.com/products/audio_visual/av_receivers_amps/rx-a2070/specs.html' },
  { re: /RX\s?-?A\s?-?2080|YAMAHA\s?2080/i, kind: 'amp', ch: 9, ok: 1, w: '9.2 · 140W @8Ω rated · 220W @4Ω (1kHz) · Zone2+3', pw: { 8: 140, 4: 220 }, url: 'https://uk.yamaha.com/products/audio_visual/av_receivers_amps/rx-a2080/specs.html' },
  { re: /RX\s?-?A\s?-?880/i, kind: 'amp', ch: 7, ok: 1, w: '7.2 · 100W @8Ω rated · 160W @4Ω (1kHz) · Zone2/B', pw: { 8: 100, 4: 160 }, url: 'https://uk.yamaha.com/products/audio_visual/av_receivers_amps/rx-a880/specs.html' },
  { re: /R\s?-?N\s?-?303/i, kind: 'amp', ch: 2, ok: 1, w: 'סטריאו · 100W+100W @8Ω RMS · דינמי עד 180W @2Ω', pw: { 8: 100 }, url: 'https://usa.yamaha.com/products/audio_visual/hifi_components/r-n303/specs.html' },
  { re: /R\s?-?N\s?-?402/i, kind: 'amp', ch: 2, ok: 1, w: 'סטריאו · 100W+100W @8Ω RMS · דינמי עד 180W @2Ω', pw: { 8: 100 }, url: 'https://usa.yamaha.com/products/audio_visual/hifi_components/r-n402/specs.html' },
  { re: /R\s?-?N\s?-?602/i, kind: 'amp', ch: 2, ok: 1, w: 'סטריאו · 80W+80W @8Ω RMS · 105W @4Ω מקס', pw: { 8: 80, 4: 105 }, url: 'https://usa.yamaha.com/products/audio_visual/hifi_components/r-n602/specs.html' },
  { re: /R\s?-?S\s?-?202/i, kind: 'amp', ch: 2, ok: 1, w: 'סטריאו · מקס 140W+140W @8Ω (10% THD) · rated לא פורסם בדף', url: 'https://usa.yamaha.com/products/audio_visual/hifi_components/r-s202/specs.html' },
  { re: /R\s?-?S\s?-?500/i, kind: 'amp', ch: 2, ok: 0, w: '75W×2 RMS — אימפדנס לא צוין בדף המוצר', url: 'https://usa.yamaha.com/products/audio_visual/hifi_components/r-s500/specs.html' },
  { re: /WXA\s?-?50/i, kind: 'amp', ch: 2, ok: 1, w: 'סטרימר מוגבר · 70W+70W @6Ω rated · מקס 90W @6Ω', pw: { 6: 70 }, url: 'https://usa.yamaha.com/products/audio_visual/wireless_streaming_amplifiers/wxa-50/specs.html' },
  { re: /WXC\s?-?50/i, kind: 'proc', io: 'קדם-מגבר/סטרימר · 2ch · ללא הגברה', ok: 1, url: 'https://usa.yamaha.com/products/audio_visual/wireless_streaming_amplifiers/wxc-50/specs.html' },
  { re: /RX\s?-?S\s?-?601/i, kind: 'amp', ch: 5, ok: 0, w: 'דף מפרט לא זמין — להשלים מה-manual (5.1 slim)', url: '' },
  { re: /RX\s?-?A\s?-?820|YAMAHA\s?820\b/i, kind: 'amp', ch: 7, ok: 0, w: 'דף מפרט לא זמין — להשלים מה-manual (7.2)', url: '' },
  { re: /XDA\s?-?QS5400/i, kind: 'amp', ch: 8, ok: 0, w: 'מולטי-רום 4 אזורים — דף מפרט לא זמין, להשלים מה-datasheet', url: '' },
  /* ===== XTA / MC² — מאומת מ-xta.co.uk (טבלת הספק מלאה בכל אימפדנס) ===== */
  { re: /DPA\s?40|DSP\s?40|DELTA\s?40/i, kind: 'amp', ch: 4, mo: 2, ok: 1, w: '4×500W @8Ω · 1000W @4Ω · 1400W @2.7Ω · 1200W @2Ω · גשר 2400W @8Ω', pw: { 8: 500, 4: 1000, 2.7: 1400, 2: 1200 }, br: { 8: 2400, 4: 2000 }, url: 'https://xta.co.uk/portfolio/delta-dpa-dna-legacy/' },
  { re: /DPA\s?80|DSP\s?80|DELTA\s?80/i, kind: 'amp', ch: 4, mo: 2, ok: 1, w: '4×1000W @8Ω · 2000W @4Ω · 2200W @2.7Ω · 2000W @2Ω · גשר 4000W', pw: { 8: 1000, 4: 2000, 2.7: 2200, 2: 2000 }, br: { 8: 4000, 4: 4000 }, url: 'https://xta.co.uk/portfolio/delta-dpa-dna-legacy/' },
  { re: /DPA\s?100|DSP\s?100|DELTA\s?100/i, kind: 'amp', ch: 4, mo: 2, ok: 1, w: '4×1400W @8Ω · 2700W @4Ω · 3700W @2.7Ω · 3500W @2Ω · גשר 7000W @4Ω', pw: { 8: 1400, 4: 2700, 2.7: 3700, 2: 3500 }, br: { 8: 5400, 4: 7000 }, url: 'https://xta.co.uk/portfolio/delta-dpa-dna-legacy/' },
  { re: /DNA\s?20|20ND/i, kind: 'amp', ch: 4, mo: 2, ok: 1, w: '4×175W @8Ω · 350W @4Ω · 480W @2.7Ω · 340W @2Ω · 100V: 200W/ערוץ', pw: { 8: 175, 4: 350, 2.7: 480, 2: 340 }, br: { 8: 700, 4: 660 }, url: 'https://xta.co.uk/portfolio/delta-dpa-dna-legacy/' },
  { re: /DNA\s?40|40ND/i, kind: 'amp', ch: 4, mo: 2, ok: 1, w: '4×500W @8Ω · 1000W @4Ω · 1400W @2.7Ω · 1200W @2Ω · גשר 2400W @8Ω', pw: { 8: 500, 4: 1000, 2.7: 1400, 2: 1200 }, br: { 8: 2400, 4: 2000 }, url: 'https://xta.co.uk/portfolio/delta-dpa-dna-legacy/' },
  { re: /50ND|DELTA\s?50/i, kind: 'amp', ch: 2, mo: 2, ok: 1, w: '2×1500W @8Ω · 3000W @4Ω · 3700W @2.7Ω · 3500W @2Ω · גשר 7000W @4Ω', pw: { 8: 1500, 4: 3000, 2.7: 3700, 2: 3500 }, br: { 8: 6000, 4: 7000 }, url: 'https://xta.co.uk/portfolio/delta-dpa-dna-legacy/' },
  { re: /DNA\s?80|80ND/i, kind: 'amp', ch: 4, mo: 2, ok: 1, w: '4×1000W @8Ω · 2000W @4Ω · 2200W @2.7Ω · 2000W @2Ω · גשר 4000W', pw: { 8: 1000, 4: 2000, 2.7: 2200, 2: 2000 }, br: { 8: 4000, 4: 4000 }, url: 'https://xta.co.uk/portfolio/delta-dpa-dna-legacy/' },
  { re: /DNA\s?100|100ND/i, kind: 'amp', ch: 4, mo: 2, ok: 1, w: '4×1400W @8Ω · 2700W @4Ω · 3700W @2.7Ω · 3500W @2Ω · גשר 7000W @4Ω', pw: { 8: 1400, 4: 2700, 2.7: 3700, 2: 3500 }, br: { 8: 5400, 4: 7000 }, url: 'https://xta.co.uk/portfolio/delta-dpa-dna-legacy/' },
  { re: /DNA\s?120|120ND|DELTA\s?120/i, kind: 'amp', ch: 2, mo: 2, ok: 1, w: '2×2400W @8Ω · 4600W @4Ω · 6250W @2.7Ω · 6800W @2Ω (ללא גשר)', pw: { 8: 2400, 4: 4600, 2.7: 6250, 2: 6800 }, url: 'https://xta.co.uk/portfolio/delta-dpa-dna-legacy/' },
  /* דגם לא מפורט בשם המוצר ("XTA DPA" בלי מספר) — נופל לנתוני הסדרה:
     כל סדרת DPA/DNA/DELTA יציבה ב-2Ω ו-4 ערוצים (DNA120 הדו-ערוצי נתפס למעלה).
     בלי טבלת הספק — לא ממציאים מספרים לדגם לא ידוע. */
  { re: /\bDPA\b|\bDNA\b|\bXTA\b/i, kind: 'amp', ch: 4, mo: 2, ok: 1, w: 'מגבר XTA — דגם לא מפורט בשם · מגברי XTA יציבים 2Ω', url: 'https://xta.co.uk/portfolio/delta-dpa-dna-legacy/' },
  /* ===== KT Audio — מאומת מ-kt-audio.com ===== */
  { re: /DYNAMIQ\s?450/i, kind: 'amp', ch: 2, mo: 4, ok: 1, w: '2×300W @8Ω · 2×450W @4Ω · גשר 900W @8Ω · DSP + AES67', pw: { 8: 300, 4: 450 }, br: { 8: 900 }, url: 'https://www.kt-audio.com/products/unicorn-dynamiq-450', pdf: 'https://cdn.shopify.com/s/files/1/0821/7804/8283/files/Dynamiq.pdf' },
  { re: /DYNAMIQ\s?750/i, kind: 'amp', ch: 2, mo: 4, ok: 1, w: '2×500W @8Ω · 2×750W @4Ω · גשר 1500W @8Ω · DSP + AES67', pw: { 8: 500, 4: 750 }, br: { 8: 1500 }, url: 'https://www.kt-audio.com/products/unicorn-dynamiq-750', pdf: 'https://cdn.shopify.com/s/files/1/0821/7804/8283/files/Dynamiq.pdf' },
  { re: /MX3\s?-?\s?700/i, kind: 'amp', ch: 2, mo: 4, ok: 1, w: '2×700W @8Ω · 2×1000W @4Ω · גשר 2000W @8Ω', pw: { 8: 700, 4: 1000 }, br: { 8: 2000 }, url: 'https://www.kt-audio.com/products/unicorn-mx3-700' },
  { re: /MX3\s?-?\s?200/i, kind: 'amp', ch: 2, mo: 4, ok: 1, w: '2×200W @8Ω · MX3 Series', pw: { 8: 200 }, url: 'https://www.kt-audio.com/products/unicorn-mx3-200-750' },
  { re: /DAP\s?4200/i, kind: 'amp', ch: 3, mo: 4, ok: 1, w: '2×400W + 1500W sub @8Ω · 2×800W + 2000W @4Ω · DSP', pw: { 8: 400, 4: 800 }, url: 'https://www.kt-audio.com/products/unicorn-dap-4200' },
  { re: /DAP\s?800/i, kind: 'amp', ch: 2, mo: 4, ok: 1, w: '2×800W @4Ω · DSP', pw: { 4: 800 }, url: 'https://www.kt-audio.com/products/unicorn-dap-800' },
  { re: /DAP\s?500/i, kind: 'amp', ch: 2, mo: 4, ok: 1, w: '2×500W @4Ω · DSP', pw: { 4: 500 }, url: 'https://www.kt-audio.com/products/unicorn-dap-500' },
  /* ===== Kling & Freitag SystemAmps — מאומת מ-kling-freitag.com ===== */
  { re: /IPX\s?20:?4/i, kind: 'amp', ch: 4, mo: 2, ok: 1, w: '4×2500W @8Ω · 5000W @4Ω · 6000W @2.7Ω · 5200W @2Ω · מקבילי 10000W @2Ω · ללא גשר · Dante/OMNEO', pw: { 8: 2500, 4: 5000, 2.7: 6000, 2: 5200 }, dd: { 70: 3550, 100: 5000, 140: 5000 }, url: 'https://www.kling-freitag.com/proinstall/ipx-series/ipx204/', pdf: 'https://www.kling-freitag.com/content/uploads/man_ipx-dsp_en.pdf' },
  { re: /IPX\s?10:?8/i, kind: 'amp', ch: 8, mo: 2, ok: 1, w: '8×1250W @8Ω · 1250W @4Ω · 1500W @2.7Ω · 1300W @2Ω · גשר 2600W @4Ω · Dante/OMNEO', pw: { 8: 1250, 4: 1250, 2.7: 1500, 2: 1300 }, br: { 8: 2500, 4: 2600 }, dd: { 70: 1250, 100: 1250, 140: 2500, 200: 2500 }, url: 'https://www.kling-freitag.com/proinstall/ipx-series/ipx108/', pdf: 'https://www.kling-freitag.com/content/uploads/man_ipx-dsp_en.pdf' },
  { re: /IPX\s?10:?4/i, kind: 'amp', ch: 4, mo: 2, ok: 1, w: '4×1250W @8Ω · 2500W @4Ω · 3000W @2.7Ω · 2600W @2Ω · גשר 5200W @4Ω', pw: { 8: 1250, 4: 2500, 2.7: 3000, 2: 2600 }, br: { 8: 5000, 4: 5200 }, dd: { 70: 2500, 100: 2500, 140: 5000, 200: 5000 }, url: 'https://www.kling-freitag.com/proinstall/ipx-series/ipx104/', pdf: 'https://www.kling-freitag.com/content/uploads/man_ipx-dsp_en.pdf' },
  { re: /IPX\s?5:?4/i, kind: 'amp', ch: 4, mo: 2, ok: 1, w: '4×1250W @8Ω · 1250W @4Ω · 1500W @2.7Ω · 1300W @2Ω · גשר 2600W @4Ω · Dante/OMNEO', pw: { 8: 1250, 4: 1250, 2.7: 1500, 2: 1300 }, br: { 8: 2500, 4: 2600 }, dd: { 70: 1250, 100: 1250, 140: 2500, 200: 2500 }, url: 'https://www.kling-freitag.com/proinstall/ipx-series/ipx54/', pdf: 'https://www.kling-freitag.com/content/uploads/man_ipx-dsp_en.pdf' },
  { re: /TGX\s?\d/i, kind: 'amp', ch: 4, mo: 2, w: 'K&F TGX — ⚠ הספק לפי דגם ספציפי, ראה דף היצרן', url: 'https://www.kling-freitag.com/proinstall/tgx-series/' },
  { re: /\bIX\s?\d|K&F\s?IX/i, kind: 'amp', ch: 4, mo: 2, w: 'K&F IX — ⚠ הספק לפי דגם ספציפי, ראה דף היצרן', url: 'https://www.kling-freitag.com/proinstall/ix-series/' },
  { re: /SCALA/i, kind: 'amp', ch: 4, mo: 4, w: 'K&F SCALA — ⚠ נתוני הספק לא אומתו', url: 'https://www.kling-freitag.com/proinstall/kf-scala/' },
  /* ===== SAE ===== */
  { re: /PQM\s?13/i, kind: 'amp', ch: 4, mo: 2, ok: 1, w: '4×1300W @8Ω · 2100W @4Ω · 2500W @2Ω · גשר 4200W @8Ω / 5000W @4Ω · gain 42.3dB', pw: { 8: 1300, 4: 2100, 2: 2500 }, br: { 8: 4200, 4: 5000 }, url: 'http://www.saeaudio.com/pqm-series/' },
  { re: /PQM\s?8\b/i, kind: 'amp', ch: 4, mo: 2, ok: 1, w: '4×800W @8Ω · 1400W @4Ω · 1600W @2Ω · גשר 2800W @8Ω / 3200W @4Ω · gain 40.3dB', pw: { 8: 800, 4: 1400, 2: 1600 }, br: { 8: 2800, 4: 3200 }, url: 'http://www.saeaudio.com/pqm-series/' },
  { re: /MA\s?800\b/i, kind: 'amp', ch: 2, mo: 4, w: '2×700W @8Ω (משם הפריט ב-ERP — לא אומת מדף יצרן)', pw: { 8: 700 }, url: 'http://www.saeaudio.com/' },
  { re: /MA\s?1200\b/i, kind: 'amp', ch: 2, mo: 4, w: '2×900W @8Ω (משם הפריט ב-ERP)', pw: { 8: 900 }, url: 'http://www.saeaudio.com/' },
  { re: /MA\s?3600\b/i, kind: 'amp', ch: 2, mo: 4, w: '2×1500W @8Ω (משם הפריט ב-ERP)', pw: { 8: 1500 }, url: 'http://www.saeaudio.com/' },
  { re: /MA\s?8004/i, kind: 'amp', ch: 4, mo: 4, w: '4×900W @8Ω (משם הפריט ב-ERP)', pw: { 8: 900 }, url: 'http://www.saeaudio.com/' },
  { re: /MAX\s?2400/i, kind: 'amp', ch: 2, mo: 4, w: '2×450W @8Ω (משם הפריט ב-ERP)', pw: { 8: 450 }, url: 'http://www.saeaudio.com/' },
  { re: /MAX\s?3600/i, kind: 'amp', ch: 2, mo: 4, w: '2×520W @8Ω (משם הפריט ב-ERP)', pw: { 8: 520 }, url: 'http://www.saeaudio.com/' },
  { re: /MAX\s?4800/i, kind: 'amp', ch: 2, mo: 4, w: '2×830W @8Ω · 1250W @4Ω (משם הפריט ב-ERP)', pw: { 8: 830, 4: 1250 }, url: 'http://www.saeaudio.com/' },
  /* ===== Lab Gruppen / Crown / Magnetic ===== */
  { re: /IPD[\s-]?1200/i, kind: 'amp', ch: 2, mo: 4, ok: 1, w: '2×600W @4Ω · DSP', pw: { 4: 600 }, url: 'https://labgruppen.com/' },
  { re: /IPD[\s-]?2400/i, kind: 'amp', ch: 2, mo: 4, ok: 1, w: '2×1200W @4Ω · DSP', pw: { 4: 1200 }, url: 'https://labgruppen.com/' },
  { re: /PLM\s?20K44/i, kind: 'amp', ch: 4, mo: 2, ok: 1, w: '4×5000W · Lake DSP · Dante', pw: { 4: 5000 }, url: 'https://labgruppen.com/' },
  { re: /PLM\s?12K44/i, kind: 'amp', ch: 4, mo: 2, ok: 1, w: '4×3000W · Lake DSP · Dante', pw: { 4: 3000 }, url: 'https://labgruppen.com/' },
  { re: /XLI\s?2500/i, kind: 'amp', ch: 2, mo: 4, ok: 1, w: '2×500W @8Ω · 750W @4Ω', pw: { 8: 500, 4: 750 }, url: 'https://www.crownaudio.com/' },
  { re: /TD\s?10000/i, kind: 'amp', ch: 4, mo: 4, w: '4 ערוצים — ⚠ נתונים חסרים, יש להזין ידנית או לצרף דף נתונים' },
  /* ===== פרוססורים ===== */
  /* ===== DIGISYNTHETIC — מטריצות רשת AES67 (מאומת מ-digisynthetic.com) ===== */
  { re: /DMX\s?1616/i, kind: 'proc', io: '16×16', ok: 1, w: '16×16 AES67/ST2110-30 + 16×16 אנלוגי פיניקס (48V) · אוטומיקסר 36×36 · 4× AEC · 48kHz · 2× USB · GPIO/RS232/RS485 · 40W', url: 'https://www.digisynthetic.com/en/products/matrix/dmx1616' },
  { re: /DMX\s?0808/i, kind: 'proc', io: '8×8', ok: 1, w: '8×8 AES67/ST2110-30 + 8×8 אנלוגי פיניקס (48V) · אוטומיקסר 16×16 · 4× AEC · 48kHz · 2× USB · GPIO/RS232/RS485 · 40W', url: 'https://www.digisynthetic.com/en/products/matrix/dmx0808' },
  { re: /DMX\s?232\b/i, kind: 'proc', io: '4×4 אנלוגי', ok: 1, w: 'מיקסר מטריצה — 28×28 ערוצי רשת AES67 + 4×4 אנלוגי · אוטומיקסר 32×32 · 48/96kHz · PoE-af 15W או DC12V · 1/4U חצי רוחב', url: 'https://www.digisynthetic.com/en/products/matrix/dmx232' },
  { re: /DMX\s?208A/i, kind: 'proc', io: '4×4', ok: 1, w: '4×4 AES67/ST2110-30 + 4×4 אנלוגי פיניקס (48V) · אוטומיקסר 8×8 · 48/96kHz · AEC/ANS/AGC/AFC · PoE-af 15W · תוסף Q-SYS · 1/4U', url: 'https://www.digisynthetic.com/en/products/matrix/dmx208a' },
  { re: /DLA-?\s?04/i, kind: 'proc', io: '4×4', ok: 1, w: 'סטייג׳בוקס רשת — 4×4 AES67/ST2110-30 + 4×4 אנלוגי פיניקס (48V) · 48/96kHz · PoE-af 15W או DC12V · 1/4U · ללא DSP', url: 'https://www.digisynthetic.com/en/products/matrix/dla04' },
  { re: /DC\s?1048/i, kind: 'proc', io: '4×8', w: 'XTA — ניהול רמקולים', ok: 1 },
  { re: /DH\s?408/i, kind: 'proc', io: '4×8', w: 'MAGNETIC', ok: 1 },
  { re: /\bM\s?408\b/i, kind: 'proc', io: '4×8', w: 'MAGNETIC', ok: 1 },
  { re: /DSK\s?3\.?1/i, kind: 'proc', io: '2×6', w: 'DIGI' },
  { re: /DS\s?418|418E/i, kind: 'proc', io: '4×8', w: 'DIGISYNTHETIC' },
  { re: /PRISM\s?12/i, kind: 'proc', io: '12×12', w: 'Symetrix · Dante', ok: 1 },
  { re: /Symetrix.*8|PRISM\s?8/i, kind: 'proc', io: '8×8', w: 'Symetrix · Dante', ok: 1 },
  { re: /D48S/i, kind: 'proc', io: '4×8', w: 'NST Audio', ok: 1 },
  { re: /D24S/i, kind: 'proc', io: '2×4', w: 'NST Audio', ok: 1 },
  { re: /\bSIX\b|XTA.*SIX/i, kind: 'proc', io: '6×6', w: 'XTA Six', ok: 1, url: 'https://xta.co.uk/portfolio/six/' },
  { re: /\bMX36\b|XTA.*MX/i, kind: 'proc', io: '3×6', w: 'XTA MX', ok: 1, url: 'https://xta.co.uk/portfolio/mx36/' },
  { re: /DS8000/i, kind: 'proc', io: '8×8', w: 'XTA DS8000', ok: 1, url: 'https://xta.co.uk/portfolio/ds8000/' }
];
const prettyRe = re => String(re).replace(/^\/|\/i?$/g, '').split('|')[0]
  .replace(/\[[^\]]*\]\??/g, ' ').replace(/\\s\?|\\s\*|\\s|\\b|\\\.|\(|\)|\?|\^|\$|-\?/g, ' ').replace(/\s+/g, ' ').trim();
/* ===== מנהל טבלת נתונים — טאבים: רמקולים / מגברים / פרוססורים ===== */
function spkDataManager(tab) {
  tab = tab || window.__spkTab || 'spk'; window.__spkTab = tab;
  const old = document.getElementById('spkDbOv'); if (old) old.remove();
  const cell = (v) => v == null || v === '' ? '—' : v;
  const rows = [];
  /* סוג מוצר משוער משם הדגם — ניתן לדריסה בעמודת "סוג" */
  const guessTyp = nm => /סאב|\bsub\b|\bSB\s?\d|BR\s?1\d\d|BASS|INFRA|MB\d|F118|F121|F221|F215/i.test(nm) ? 'סאב'
    : /column|קולום|VERTUS|2L\b|6EL\b/i.test(nm) ? 'קולום'
    : /שקוע|ceiling|\bCS\s?\d/i.test(nm) ? 'שקוע'
    : /monitor|מוניטור/i.test(nm) ? 'מוניטור' : 'רמקול';
  /* DSP במגבר — מזוהה מנתוני ההספק/שם; עריך. DPA/DNA = מגבר משולב פרוססור */
  const guessDsp = (d, nm) => /DPA|DNA/i.test(nm) ? '✓ מלא — משולב פרוססור' :
    /DSP|Lake|Dante|OMNEO|AES67/i.test((d && d.w) || '') ? '✓' : /XLI|MA\s?\d|MAX\s?\d/i.test(nm) ? '—' : '';
  /* רשת/תאימות לפרוססור — מה שמופיע במפרט */
  const guessNet = d => { const w2 = (d && d.w) || ''; const hits = []; if (/AES67|ST2110/i.test(w2)) hits.push('AES67/ST2110'); if (/Dante/i.test(w2)) hits.push('Dante'); if (/OMNEO/i.test(w2)) hits.push('OMNEO'); return hits.join(' + ') || (/אנלוג/i.test(w2) ? 'אנלוגי' : ''); };
  const metaStore = tab === 'spk' ? (store.spkMeta = store.spkMeta || {}) : (store.ampMeta = store.ampMeta || {});
  const metaOf = nm => metaStore[rearKey(nm)] || {};
  /* זיהוי מותג לפי שם הדגם — לקיבוץ */
  const brandOf = nm => /\bSIX\b|DS8000|DP[45]|Ti1048/i.test(nm) ? 'XTA'
    : /GRAVIS|SPECTRA|CA\s?10|NOMOS|IPX\s?\d|TGX|SCALA|\bIX\b/i.test(nm) ? 'Kling & Freitag'
    : /\bF\s?\d|Res|EVO|MB\d|MINIBASS|MICROBASS|INFRABASS|BR\s?1\d\d|\bSB\s?\d|VERO/i.test(nm) ? 'Funktion-One'
    : /YAMAHA|XMV|PX\d|MA2030|PA2030|MTX\d|MRX\d|DME\d|A-S\d|R-N\d|CRX|WXA|WXC|STAGEPAS/i.test(nm) ? 'Yamaha'
    : /TILL|PAGAZ|UNICORN|EUPHORIA|INTERPID|WR\s?600|BOLD|ALPHA|KT\s?ARRAY|NIKO|DYNAMIQ|MX3|DAP\s?\d/i.test(nm) ? 'KT Audio'
    : /CX-?\d|Lambda/i.test(nm) ? 'Lambda Labs'
    : /DMX\s?\d|DLA-?\s?0|DIGI|DSK|418/i.test(nm) ? 'DigiSynthetic'
    : /DPA|DNA|DC\s?10|XTA|\d+ND/i.test(nm) ? 'XTA'
    : /MA\s?\d|MAX\s?\d|PQM/i.test(nm) ? 'SAE'
    : /IPD|PLM|LAB/i.test(nm) ? 'Lab Gruppen'
    : /Symetrix|PRISM/i.test(nm) ? 'Symetrix'
    : /NST|D\d\dS/i.test(nm) ? 'NST Audio'
    : /XLI|Crown/i.test(nm) ? 'Crown'
    : /MAGNETIC|DH\s?4|M\s?408|TD\s?100/i.test(nm) ? 'Magnetic'
    : /DIGI|DSK|418/i.test(nm) ? 'DigiSynthetic'
    : /MIDAS|BEHRINGER|BERINGER/i.test(nm) ? 'Midas/Behringer'
    : 'אחר';
  if (tab === 'spk') {
    SPEAKER_DATA.forEach((d, i) => rows.push({ name: prettyRe(d.re), d, ok: !!d.ok, src: 'מובנה', bi: i }));
    for (const [k, d] of Object.entries(store.spkLib || {})) rows.push({ name: k, d, ok: d.ok !== false, src: 'מיובא', lk: k });
  } else {
    AMP_DATA.forEach((d, i) => { if (d.kind === (tab === 'amp' ? 'amp' : 'proc')) rows.push({ name: prettyRe(d.re), d, ok: !!d.ok, src: 'מובנה', bi: i }); });
    for (const [k, d] of Object.entries(store.ampLib || {})) if (d.kind === (tab === 'amp' ? 'amp' : 'proc')) rows.push({ name: k, d, ok: d.ok !== false, src: 'מותאם', lk: k });
  }
  /* איחוד כפילויות: אותו שם (בלי רגישות לרישיות) = שורה אחת, עריכות ידניות גוברות;
     גרסת צבע (WR/WH/BK/WHITE/BLACK/לבן/שחור) מנוהלת בשורת הבסיס ולא כשורה נפרדת */
  {
    const normNm = nm => String(nm).toLowerCase().replace(/\s+/g, ' ').trim();
    const clrRe = /\s+(wr|wh|bk|white|black|לבן|שחור)$/i;
    const seenNm = new Map(); const merged = [];
    for (const r of rows) {
      const k = normNm(r.name);
      const ex = seenNm.get(k);
      if (ex) {
        if (r.lk) { const d2 = { ...ex.d }; Object.entries(r.d).forEach(([f, v]) => { if (v != null) d2[f] = v; }); ex.d = d2; ex.lk = r.lk; ex.ok = r.ok; ex.src = 'מובנה + עריכה'; }
        continue;
      }
      seenNm.set(k, r); merged.push(r);
    }
    for (const r of merged.slice()) {
      const b = normNm(r.name).replace(clrRe, '');
      if (b !== normNm(r.name) && seenNm.has(b)) {
        const ex = seenNm.get(b);
        ex.variants = (ex.variants || []).concat((r.name.match(/\S+$/) || [''])[0]);
        merged.splice(merged.indexOf(r), 1);
      }
    }
    rows.length = 0; rows.push(...merged);
  }
  /* חיפוש */
  const q2 = (window.__spkQ || '').trim().toLowerCase();
  if (q2) { const rowsF = rows.filter(r => r.name.toLowerCase().includes(q2)); rows.length = 0; rows.push(...rowsF); }
  /* קיבוץ ומיון לפי מותג */
  rows.forEach(r => r.brand = metaOf(r.name).brand || brandOf(r.name));
  rows.sort((a, b) => a.brand === b.brand ? a.name.localeCompare(b.name) : a.brand.localeCompare(b.brand));
  const allBrands = [...new Set(rows.map(r => r.brand).concat(['Funktion-One', 'Kling & Freitag', 'KT Audio', 'XTA', 'Yamaha', 'SAE', 'Lab Gruppen', 'Crown', 'DigiSynthetic', 'Lambda Labs', 'אחר']))].sort();
  const tabBtn = (t, l) => `<button onclick="spkDataManager('${t}')" style="flex:1;padding:5px;border-radius:8px;font-weight:700;${tab === t ? 'background:#c9502e;color:#fff' : 'background:#f0ede8'}">${l}</button>`;
  const heads = tab === 'spk' ? '<th>סוג</th><th>מותג</th><th>H°</th><th>V°</th><th>רגישות<br>dB@1W</th><th>Max<br>SPL</th><th>W<br>RMS</th><th>Ω</th><th>קישורים<br>🔗📄📘</th>' :
    tab === 'amp' ? '<th>ערוצים</th><th>מינ׳ Ω</th><th>DSP</th><th style="text-align:right">הספק</th><th>קישור</th>' : '<th>כניסות×יציאות</th><th>רשת / תאימות</th><th style="text-align:right">הערות</th><th>קישור</th>';
  const ov = document.createElement('div');
  ov.id = 'spkDbOv';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(20,24,32,.5);z-index:98;display:flex;align-items:center;justify-content:center';
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  ov.innerHTML = `<div style="background:#fff;border-radius:12px;padding:16px;max-width:820px;width:96%;max-height:88vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,.35)">
    <style>#spkDbOv table a{font-size:17px;margin:0 5px;text-decoration:none;display:inline-block}#spkDbOv table a:hover{transform:scale(1.25)}#spkDbOv table td{padding:6px 5px}#spkDbOv table td button{font-size:12.5px;padding:2px 7px}</style>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><b style="flex:1">📚 טבלת נתונים טכניים (${rows.length})</b>
      <button onclick="document.getElementById('spkDbOv').remove()">✕</button></div>
    <div style="display:flex;gap:5px;margin-bottom:8px">${tabBtn('spk', '🔊 רמקולים')}${tabBtn('amp', '🎚 מגברים')}${tabBtn('proc', '🎛 פרוססורים')}</div>
    <p class="muted" style="margin:0 0 4px;font-size:11px">🟢 = מאומת (דף יצרן / שם פריט ב-ERP) · 🔴 = הערכה. עריכה שומרת כמותאם ומסמנת כמאומת.</p>
    <p style="margin:0 0 8px;font-size:11.5px;background:#f7f5f0;border-radius:8px;padding:5px 9px">מקרא קישורים: 🔗 דף המוצר באתר היצרן · 📄 מפרט טכני PDF · 📘 מדריך משתמש PDF · ✎ עריכת הקישורים</p>
    <div class="fld" style="margin-bottom:6px"><input id="spkDbQ" placeholder="🔍 חפש דגם…" value="${esc(window.__spkQ || '')}" oninput="window.__spkQ=this.value;spkDataManager('${tab}');const e2=document.getElementById('spkDbQ');e2.focus();e2.setSelectionRange(e2.value.length,e2.value.length)"></div>
    <div style="display:flex;gap:6px;margin-bottom:8px">
      <button style="flex:1" onclick="spkDbAddModel('${tab}')">+ דגם חדש</button>
      <button style="flex:1" onclick="spkDbExport()">💾 ייצוא JSON</button>
      ${tab === 'spk' ? `<button style="flex:1" onclick="$('#spkDataIn').click()">📥 ייבוא CSV/JSON</button>` : ''}
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="background:#f4f2ee"><th style="text-align:right;padding:5px">דגם</th>${heads}<th>אימות</th><th></th></tr></thead><tbody>
      ${rows.map((r, ri) => {
    const c = r.ok ? '#0f8a5f' : '#c1121f';
    const bg = r.ok ? '#eef7f1' : '#fdeeee';
    const arg = r.lk ? `'${esc(r.lk).replace(/'/g, '&#39;')}'` : `null,${r.bi}`;
    const colspan = tab === 'spk' ? 11 : 7;
    const brandHdr = (ri === 0 || rows[ri - 1].brand !== r.brand) ? `<tr style="background:#e9e4db"><td colspan="${colspan}" style="padding:4px 6px;font-weight:800;font-size:12px">🏷 ${esc(r.brand)}</td></tr>` : '';
    const fn = tab === 'spk' ? 'editSpkDb' : 'editAmpDb';
    const nmA = esc(r.name).replace(/'/g, '&#39;');
    const meta = metaOf(r.name);
    const cells = tab === 'spk' ?
      `<td style="text-align:center"><select style="font-size:11px;border:1px solid #ccc;border-radius:4px;background:#fff" onchange="spkMetaSet('${nmA}','typ',this.value)">${['רמקול', 'סאב', 'קולום', 'שקוע', 'מוניטור', 'אחר'].map(t => `<option ${(meta.typ || guessTyp(r.name)) === t ? 'selected' : ''}>${t}</option>`).join('')}</select></td>
       <td style="text-align:center"><select title="מותג — הבחירה מסדרת את הקיבוץ בטבלה" style="max-width:112px;border:1px solid #ccc;border-radius:4px;font-size:11px;background:#fff" onchange="if(this.value==='__new'){spkBrandNew('${nmA}')}else spkMetaSet('${nmA}','brand',this.value)">${allBrands.map(b2 => `<option ${r.brand === b2 ? 'selected' : ''}>${esc(b2)}</option>`).join('')}<option value="__new">➕ מותג חדש…</option></select></td>
       <td style="text-align:center"><input value="${cell(r.d.h)}" style="width:44px;text-align:center;border:1px solid ${c};background:${bg};border-radius:4px" onchange="${fn}(${arg},'h',this.value)"></td>
       <td style="text-align:center"><input value="${cell(r.d.v)}" style="width:44px;text-align:center;border:1px solid ${c};background:${bg};border-radius:4px" onchange="${fn}(${arg},'v',this.value)"></td>
       <td style="text-align:center"><input value="${cell(r.d.sens)}" style="width:44px;text-align:center;border:1px solid #ccc;border-radius:4px" onchange="${fn}(${arg},'sens',this.value)"></td>
       <td style="text-align:center"><input value="${cell(r.d.max)}" style="width:44px;text-align:center;border:1px solid #ccc;border-radius:4px" onchange="${fn}(${arg},'max',this.value)"></td>
       <td style="text-align:center"><input value="${cell(r.d.w)}" style="width:44px;text-align:center;border:1px solid #ccc;border-radius:4px" onchange="${fn}(${arg},'w',this.value)"></td>
       <td style="text-align:center"><input value="${cell(r.d.o)}" style="width:32px;text-align:center;border:1px solid #ccc;border-radius:4px" onchange="${fn}(${arg},'o',this.value)"></td>
       <td style="text-align:center;white-space:nowrap">${r.d.url ? `<a href="${esc(r.d.url)}" target="_blank" title="דף המוצר">🔗</a>` : ''}${r.d.pdf ? `<a href="${esc(r.d.pdf)}" target="_blank" title="מפרט PDF">📄</a>` : ''}${r.d.man ? `<a href="${esc(r.d.man)}" target="_blank" title="מדריך משתמש (PDF)">📘</a>` : ''}<button style="padding:0 4px;font-size:10px" title="ערוך קישור/PDF" onclick="editSpkLink(${arg})">✎</button></td>` :
      tab === 'amp' ?
        `<td style="text-align:center"><input value="${cell(r.d.ch)}" style="width:40px;text-align:center;border:1px solid ${c};background:${bg};border-radius:4px" onchange="${fn}(${arg},'ch',this.value)"></td>
       <td style="text-align:center"><input value="${cell(r.d.mo)}" placeholder="4" style="width:38px;text-align:center;border:1px solid ${c};background:${bg};border-radius:4px" onchange="${fn}(${arg},'mo',this.value)"></td>
       <td style="text-align:center"><input value="${esc(meta.dsp != null ? meta.dsp : guessDsp(r.d, r.name))}" placeholder="?" title="DSP: ✓ = יש · ציין ערוצים עודפים לשליטה במוצרים ללא DSP" style="width:96px;text-align:center;border:1px solid #ccc;border-radius:4px;font-size:10.5px" onchange="spkMetaSet('${nmA}','dsp',this.value)"></td>
       <td><input value="${esc(r.d.w || '')}" style="width:100%;border:1px solid ${c};background:${bg};border-radius:4px;font-size:11px" onchange="${fn}(${arg},'w',this.value)"></td>
       <td style="text-align:center;white-space:nowrap">${r.d.url ? `<a href="${esc(r.d.url)}" target="_blank" title="דף המוצר">🔗</a>` : ''}${r.d.pdf ? `<a href="${esc(r.d.pdf)}" target="_blank" title="PDF">📄</a>` : ''}${r.d.man ? `<a href="${esc(r.d.man)}" target="_blank" title="מדריך משתמש (PDF)">📘</a>` : ''}<button style="padding:0 4px;font-size:10px" title="עריכת קישור לדף המוצר / PDF" onclick="editAmpLink(${arg})">✎</button></td>` :
        `<td style="text-align:center"><input value="${esc(r.d.io || '')}" style="width:56px;text-align:center;border:1px solid ${c};background:${bg};border-radius:4px" onchange="${fn}(${arg},'io',this.value)"></td>
       <td style="text-align:center"><input value="${esc(meta.net != null ? meta.net : guessNet(r.d))}" placeholder="?" title="רשת דיגיטלית (Dante / AES67 / OMNEO) ותאימות תכנה עם מוצרים אחרים" style="width:110px;text-align:center;border:1px solid #ccc;border-radius:4px;font-size:10.5px" onchange="spkMetaSet('${nmA}','net',this.value)"></td>
       <td><input value="${esc(r.d.w || '')}" style="width:100%;border:1px solid #ccc;border-radius:4px;font-size:11px" onchange="${fn}(${arg},'w',this.value)"></td>
       <td style="text-align:center;white-space:nowrap">${r.d.url ? `<a href="${esc(r.d.url)}" target="_blank" title="דף המוצר">🔗</a>` : ''}${r.d.pdf ? `<a href="${esc(r.d.pdf)}" target="_blank" title="PDF">📄</a>` : ''}${r.d.man ? `<a href="${esc(r.d.man)}" target="_blank" title="מדריך משתמש (PDF)">📘</a>` : ''}<button style="padding:0 4px;font-size:10px" title="עריכת קישור לדף המוצר / PDF" onclick="editAmpLink(${arg})">✎</button></td>`;
    return `${brandHdr}<tr style="border-bottom:1px solid #eee">
        <td style="padding:4px 5px;font-weight:600"><a href="#" onclick="event.preventDefault();specSheet('${tab}','${esc(r.name).replace(/'/g, '&#39;')}')" style="color:#c9502e;text-decoration:none;border-bottom:1px dotted #c9502e">${esc(r.name)}</a><div class="muted" style="font-size:9px">${r.src}${r.variants ? ' · גרסאות צבע: ' + esc(r.variants.join(', ')) : ''}</div></td>
        ${cells}
        <td style="text-align:center;color:${c};font-weight:700;cursor:pointer" title="לחץ לשינוי" onclick="${fn}(${arg},'ok',${r.ok ? 'false' : 'true'})">${r.ok ? '✓' : '⚠'}</td>
        <td style="text-align:center">${r.lk ? `<button style="padding:0 6px" onclick="delete store.${tab === 'spk' ? 'spkLib' : 'ampLib'}['${esc(r.lk).replace(/'/g, '&#39;')}'];save();spkDataManager()">✕</button>` : ''}</td>
      </tr>`;
  }).join('')}
      </tbody></table>
    <p class="muted" style="font-size:10px;margin-top:6px">להרחבת הטבלה עם כל המוצרים מאתרי היצרנים — שלח לצ׳אט את שמות הדגמים או דפי נתונים ואחזיר קובץ ייבוא.</p></div>`;
  document.body.appendChild(ov);
}
/* דף מוצר — כל הנתונים, טבלת הספק לפי אימפדנס, קישורים למדריך ולדף היצרן */
function specSheet(tab, name) {
  const key = rearKey(name);
  let d = null;
  if (tab === 'spk') d = (store.spkLib || {})[key] || SPEAKER_DATA.find(x => x.re && x.re.test(name));
  else d = (store.ampLib || {})[key] || AMP_DATA.find(x => x.re && x.re.test(name));
  if (!d) { alert('לא נמצאו נתונים לדגם.'); return; }
  const old = document.getElementById('specOv'); if (old) old.remove();
  const row = (k, v) => v == null || v === '' ? '' : `<tr><td style="padding:4px 8px;color:#666">${k}</td><td style="padding:4px 8px;font-weight:600">${esc(String(v))}</td></tr>`;
  let body = '';
  if (tab === 'spk') {
    body = row('פיזור אופקי', d.h ? d.h + '°' : null) + row('פיזור אנכי', d.v ? d.v + '°' : null)
      + row('רגישות', d.sens ? d.sens + ' dB@1W/1m' : null) + row('Max SPL', d.max ? d.max + ' dB' : null)
      + row('הספק (RMS/AES)', d.w ? d.w + ' W' : null) + row('אימפדנס', d.o ? d.o + ' Ω' : null)
      + row('אימות', d.ok ? '✓ מאומת מדף היצרן' : '⚠ הערכה — לא מאומת');
  } else {
    body = row('ערוצים', d.ch) + row('מינימום עומס', d.mo ? d.mo + ' Ω' : '4 Ω (ברירת מחדל)')
      + row('כניסות×יציאות', d.io) + row('תיאור', d.w)
      + row('אימות', d.ok ? '✓ מאומת מדף היצרן' : '⚠ הערכה — לא מאומת');
    if (d.pw) {
      body += `<tr><td colspan="2" style="padding:8px 8px 2px;font-weight:800">הספק לערוץ לפי אימפדנס</td></tr>`;
      Object.keys(d.pw).map(Number).sort((a, b) => b - a).forEach(o => {
        body += `<tr><td style="padding:3px 8px;color:#666">${o}Ω</td><td style="padding:3px 8px;font-weight:700">${d.pw[o]} W ${d.ch ? '× ' + d.ch + ' ערוצים = ' + (d.pw[o] * d.ch) + 'W סה"כ' : ''}</td></tr>`;
      });
    }
    if (d.dd) {
      body += `<tr><td colspan="2" style="padding:8px 8px 2px;font-weight:800">מצב 70/100V (Direct Drive)</td></tr>`;
      Object.keys(d.dd).map(Number).sort((a, b) => a - b).forEach(v => {
        body += `<tr><td style="padding:3px 8px;color:#666">${v}V</td><td style="padding:3px 8px;font-weight:700">${d.dd[v]} W</td></tr>`;
      });
    }
    if (d.br) {
      body += `<tr><td colspan="2" style="padding:8px 8px 2px;font-weight:800">מצב גשר (Bridged)</td></tr>`;
      Object.keys(d.br).map(Number).sort((a, b) => b - a).forEach(o => {
        body += `<tr><td style="padding:3px 8px;color:#666">${o}Ω גשר</td><td style="padding:3px 8px;font-weight:700">${d.br[o]} W לזוג ערוצים</td></tr>`;
      });
    }
  }
  const ov = document.createElement('div');
  ov.id = 'specOv';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(20,24,32,.55);z-index:99;display:flex;align-items:center;justify-content:center';
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  ov.innerHTML = `<div style="background:#fff;border-radius:12px;padding:18px;max-width:520px;width:94%;max-height:86vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,.4)">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><b style="flex:1;font-size:17px">${esc(name)}</b><button onclick="document.getElementById('specOv').remove()">✕</button></div>
    <table style="width:100%;border-collapse:collapse;font-size:13px">${body}</table>
    <div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap">
      ${d.url ? `<a href="${esc(d.url)}" target="_blank" style="flex:1;text-align:center;padding:8px;background:#0f6e56;color:#fff;border-radius:8px;text-decoration:none;font-weight:700">🔗 דף המוצר</a>` : ''}
      ${d.pdf ? `<a href="${esc(d.pdf)}" target="_blank" style="flex:1;text-align:center;padding:8px;background:#c9502e;color:#fff;border-radius:8px;text-decoration:none;font-weight:700">📄 מפרט PDF</a>` : ''}
      ${d.man ? `<a href="${esc(d.man)}" target="_blank" style="flex:1;text-align:center;padding:8px;background:#534ab7;color:#fff;border-radius:8px;text-decoration:none;font-weight:700">📘 מדריך משתמש</a>` : ''}
      ${d.pdf ? `<a href="${esc(d.pdf)}" target="_blank" style="flex:1;text-align:center;padding:8px;background:#534ab7;color:#fff;border-radius:8px;text-decoration:none;font-weight:700">📄 מדריך / Spec Sheet</a>` : ''}
      <button style="flex:1" onclick="document.getElementById('specOv').remove();${tab === 'spk' ? 'editSpkLink' : 'editAmpLink'}('${esc(key).replace(/'/g, '&#39;')}')">✎ ערוך קישורים</button>
    </div>
    ${!d.url && !d.pdf ? '<p class="muted" style="font-size:11px;margin-top:8px">אין עדיין קישורים לדגם — לחץ ✎ להוספת דף מוצר ומדריך.</p>' : ''}
  </div>`;
  document.body.appendChild(ov);
}
async function spkDbAddModel(tab) {
  const nm = await uiPrompt('שם הדגם החדש:'); if (!nm) return;
  if (tab === 'spk') { store.spkLib = store.spkLib || {}; store.spkLib[rearKey(nm.trim())] = { re: null, h: 90, v: 50, sens: 99, max: 126, ok: false }; }
  else { store.ampLib = store.ampLib || {}; store.ampLib[rearKey(nm.trim())] = { re: null, kind: tab === 'amp' ? 'amp' : 'proc', ch: tab === 'amp' ? 2 : undefined, io: tab === 'proc' ? '2×4' : undefined, w: '', ok: false }; }
  save(); spkDataManager(tab);
}
async function editAmpLink(libKey, bi) {
  const cur = libKey === null ? (store.ampLib && store.ampLib[rearKey(prettyRe(AMP_DATA[bi].re))] || AMP_DATA[bi]) : ((store.ampLib || {})[libKey] || {});
  const url = await uiPrompt('קישור לדף המוצר:', cur.url || ''); if (url === null) return;
  const pdf = await uiPrompt('קישור למפרט PDF:', cur.pdf || ''); if (pdf === null) return;
  if (libKey === null) { editAmpDb(null, bi, 'url', url); editAmpDb(null, bi, 'pdf', pdf); }
  else { editAmpDb(libKey, 'url', url); editAmpDb(libKey, 'pdf', pdf); }
}
function editAmpDb(libKey, biOrField, arg3, arg4) {
  store.ampLib = store.ampLib || {};
  let key, field, val;
  if (libKey === null) { const bi = biOrField; field = arg3; val = arg4; const bd = AMP_DATA[bi]; key = rearKey(prettyRe(bd.re)); if (!store.ampLib[key]) store.ampLib[key] = { re: null, kind: bd.kind, ch: bd.ch, io: bd.io, w: bd.w, ok: bd.ok }; }
  else { key = libKey; field = biOrField; val = arg3; }
  if (!store.ampLib[key]) return;
  if (field === 'ok') store.ampLib[key].ok = (val === true || val === 'true');
  else if (field === 'ch' || field === 'mo') { store.ampLib[key][field] = (val === '' || val == null) ? undefined : (+val || undefined); store.ampLib[key].ok = true; }
  else { store.ampLib[key][field] = val; store.ampLib[key].ok = true; }
  save(); spkDataManager();
}
/* עריכת ערך — דגם מובנה נשמר לספריית spkLib (מותאם), דגם מיובא מתעדכן במקום */
/* עריכת קישור לדף המוצר + מפרט PDF */
async function editSpkLink(libKey, bi) {
  const cur = libKey === null ? (store.spkLib[rearKey(prettyRe(SPEAKER_DATA[bi].re))] || SPEAKER_DATA[bi]) : (store.spkLib[libKey] || {});
  const url = await uiPrompt('קישור לדף המוצר באתר היצרן:', cur.url || '');
  if (url === null) return;
  const pdf = await uiPrompt('קישור למפרט/מדריך PDF:', cur.pdf || '');
  if (pdf === null) return;
  if (libKey === null) editSpkDb(null, bi, 'url', url), editSpkDb(null, bi, 'pdf', pdf);
  else editSpkDb(libKey, 'url', url), editSpkDb(libKey, 'pdf', pdf);
}
function editSpkDb(libKey, biOrField, arg3, arg4) {
  store.spkLib = store.spkLib || {};
  let key, field, val;
  if (libKey === null) { const bi = biOrField; field = arg3; val = arg4; const bd = SPEAKER_DATA[bi]; const nm = String(bd.re).replace(/^\/|\/i?$/g, '').split('|')[0].replace(/\[[^\]]*\]\??/g, ' ').replace(/\\s\?|\\s\*|\\s|\\b|\\\.|\(|\)|\?|\^|\$|-\?/g, ' ').replace(/\s+/g, ' ').trim(); key = rearKey(nm); if (!store.spkLib[key]) store.spkLib[key] = { re: null, h: bd.h, v: bd.v, sens: bd.sens, max: bd.max, ok: bd.ok }; }
  else { key = libKey; field = biOrField; val = arg3; if (!store.spkLib[key]) store.spkLib[key] = { re: null, h: 90, v: 50, sens: 99, max: 126 }; }
  if (field === 'ok') store.spkLib[key].ok = (val === true || val === 'true');
  else if (field === 'url' || field === 'pdf') store.spkLib[key][field] = val || undefined;
  else { store.spkLib[key][field] = val === '' || val === '—' ? undefined : +val; if (field === 'h' || field === 'v') store.spkLib[key].ok = true; }
  save(); render(); spkDataManager();
}
/* מטא-נתונים לטבלה (סוג/מותג/DSP/רשת) — לפי מפתח שם, בלי לשכפל את הרשומה */
function spkMetaSet(name, field, val) {
  const tab = window.__spkTab || 'spk';
  const ms = tab === 'spk' ? (store.spkMeta = store.spkMeta || {}) : (store.ampMeta = store.ampMeta || {});
  const k = rearKey(name);
  ms[k] = ms[k] || {};
  ms[k][field] = (val === '' || val == null) ? undefined : val;
  save(); spkDataManager(tab);
}
async function spkBrandNew(name) {
  const b = await uiPrompt('שם המותג החדש:', '');
  if (b === null) { spkDataManager(); return; }
  spkMetaSet(name, 'brand', b.trim());
}
function spkDbExport() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ speakers: store.spkLib || {}, amps: store.ampLib || {}, meta: { spk: store.spkMeta || {}, amp: store.ampMeta || {} } }, null, 1)], { type: 'application/json' }));
  a.download = 'speaker-amp-data.json'; a.click();
}
function guessSens(name) { const d = spkData(name); return d ? d.sens : null; }
/* SPL אפקטיבי @1מ׳ — מרגישות×הספק אם קיים, אחרת Max SPL */
function effSpl(n) {
  if (n.spl != null) return n.spl;
  let sens = n.sens ?? guessSens(n.name);
  /* רגישות שנמדדה ב-2.83V: ב-4Ω זה 2W — ממירים ל-dB@1W לפי האימפדנס */
  if (sens != null && n.sensRef === 'v') sens -= 10 * Math.log10(8 / spkOhm(n));
  if (sens != null && n.pow) return sens + 10 * Math.log10(n.pow);
  return guessSpl(n.name);
}
/* פיזור אופקי (מעלות) ו-SPL מקס @1מ׳ לפי דגם — מבסיס הידע (speakers-kb) */
function guessDisp(name) {
  const d = spkData(name); if (d && d.h) return d.h; /* רשומה בלי פיזור מפורסם — נופלים להיוריסטיקה */
  const s = name || '';
  if (/SPECTRA\s?212/i.test(s)) return 120;
  if (/GRAVIS/i.test(s)) return 110;
  if (/CA\s?-?106/i.test(s)) return 90;
  if (/NOMOS|סאב|sub/i.test(s)) return 360;
  if (/F81|F101|F55|Res\s?2|Evo/i.test(s)) return 60;
  if (/CX-?\d|קואקס|coax/i.test(s)) return 60;
  if (/קולונ|column|441|SEQUENZA|line\s?array/i.test(s)) return 100;
  if (/EUPHORIA|UNICORN|TILL|NIKO|PASSIO/i.test(s)) return 90;
  return 90;
}
function guessSpl(name) {
  const d = spkData(name); if (d && d.max) return d.max;
  const s = name || '';
  if (/SPECTRA\s?212/i.test(s)) return 138;
  if (/GRAVIS/i.test(s)) return 132;
  if (/CA\s?-?106/i.test(s)) return 125;
  if (/NOMOS|TILL\s?18|SB-?18|סאב/i.test(s)) return 136;
  if (/Res\s?2|Evo|F101/i.test(s)) return 132;
  if (/F81|F55|CA\s?1215/i.test(s)) return 128;
  return 126;
}
/* סקאלת EASE — מפת jet, טווח משתנה לפי תכלית המערכת */
let COV_FLOOR = 70, COV_TOP = 110;
/* הסקאלה נגזרת מיעד ה-SPL: פסגה = היעד (אדום מלא בהגעה ליעד), רצפה = יעד−18dB.
   כך שהחלפת תכלית חלשה יותר צובעת את אותה עוצמה באדום יותר. */
function covRange() {
  const u = P.covUsage || (P.zones || []).map(z => z.usage).find(Boolean) || P.room?.usage || 'מוזיקה לבר';
  const tgt = (typeof USAGE_SPL !== 'undefined' && USAGE_SPL[u]) || 88;
  return [tgt - 18, tgt];
}
function jetColor(t) {
  t = Math.max(0, Math.min(1, t));
  const r = Math.round(255 * Math.max(0, Math.min(1, 1.5 - Math.abs(4 * t - 3))));
  const g = Math.round(255 * Math.max(0, Math.min(1, 1.5 - Math.abs(4 * t - 2))));
  const b = Math.round(255 * Math.max(0, Math.min(1, 1.5 - Math.abs(4 * t - 1))));
  return `rgb(${r},${g},${b})`;
}
function splColorAbs(db) { return jetColor((db - COV_FLOOR) / (COV_TOP - COV_FLOOR)); }
/* מקרא צבעים אנכי בצד המסך — משתנה לפי התכלית */
function renderCovBar(bar) {
  bar.style.display = 'block';
  const u = P.covUsage || (P.zones || []).map(z => z.usage).find(Boolean) || P.room?.usage || 'מוזיקה לבר';
  const steps = 40, h = 150;
  let grad = '';
  for (let i = 0; i <= steps; i++) { const db = COV_TOP - (i / steps) * (COV_TOP - COV_FLOOR); grad += `<div style="height:${h / (steps + 1)}px;background:${splColorAbs(db)}"></div>`; }
  const ticks = [];
  for (let db = Math.ceil(COV_TOP / 5) * 5; db >= COV_FLOOR; db -= 5) ticks.push(db);
  bar.innerHTML = `<div style="font-size:10px;font-weight:700;text-align:center;margin-bottom:3px">SPL · ${esc(u)}</div>
    <div style="display:flex;gap:4px;align-items:stretch">
      <div style="width:18px;height:${h}px;border-radius:3px;overflow:hidden;display:flex;flex-direction:column">${grad}</div>
      <div style="position:relative;height:${h}px;font-size:9px;width:26px">${ticks.map(db => `<span style="position:absolute;top:${((COV_TOP - db) / (COV_TOP - COV_FLOOR) * h - 5).toFixed(0)}px">${db}</span>`).join('')}</div>
    </div>
    <div style="font-size:9px;color:#666;text-align:center;margin-top:2px">dB</div>`;
}
const SPL_LEGEND = [115, 110, 105, 100, 95, 90, 85, 80, 75, 70].map(db => [db + '', splColorAbs(db), db === 115 ? 'חזק' : db === 70 ? 'קצה' : '']);
/* גבולות אזור לחיתוך הכיסוי — קירות סגורים עוצרים את הקול, קירות פתוחים מרחיבים החוצה */
function zoneClipPolys(z) {
  const BIG = 3000, polys = [];
  z.walls = z.walls || {};
  if (z.poly && z.poly.length >= 3) {
    polys.push(z.poly.map(p => [p.x, p.y]));
    const cxz = z.poly.reduce((s, p) => s + p.x, 0) / z.poly.length, cyz = z.poly.reduce((s, p) => s + p.y, 0) / z.poly.length;
    z.poly.forEach((p, i) => {
      if (!(z.walls['e' + i] || {}).open) return;
      const q = z.poly[(i + 1) % z.poly.length], mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
      let nx = mx - cxz, ny = my - cyz; const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
      polys.push([[p.x, p.y], [q.x, q.y], [q.x + nx * BIG, q.y + ny * BIG], [p.x + nx * BIG, p.y + ny * BIG]]);
    });
  } else {
    const L = 2200 - z.x - z.w, R = 2200 - z.x, T = z.y, B = z.y + z.h;
    polys.push([[L, T], [R, T], [R, B], [L, B]]);
    if ((z.walls.top || {}).open) polys.push([[L, T], [R, T], [R, T - BIG], [L, T - BIG]]);
    if ((z.walls.bottom || {}).open) polys.push([[L, B], [R, B], [R, B + BIG], [L, B + BIG]]);
    if ((z.walls.left || {}).open) polys.push([[L, T], [L, B], [L - BIG, B], [L - BIG, T]]);
    if ((z.walls.right || {}).open) polys.push([[R, T], [R, B], [R + BIG, B], [R + BIG, T]]);
  }
  return polys;
}
function renderCoverage() {
  const svg = $('#coverage'), bar = $('#covbar');
  if (!svg) return;
  if (!P.showCoverage) { svg.innerHTML = ''; if (bar) bar.style.display = 'none'; return; }
  [COV_FLOOR, COV_TOP] = covRange();
  if (bar) renderCovBar(bar);
  const mPerPx = P.scale || (1 / 40);
  const pxPerM = 1 / mPerPx;
  let defs = '', shapes = '', labels = '', handles = '';
  const level = COV_TOP; /* רמת המקור בתכנון = מקסימום התכלית */
  P.nodes.filter(n => {
    if (n.kind !== 'point' || n.hidden || n.noCov) return false;
    /* רק רמקול/סאב מקרינים כיסוי — מסך/תאורה/מצלמה/מגבר/פרוססור לא */
    if (n.ptype && n.ptype !== 'speaker' && n.ptype !== 'sub') return false;
    if (!n.ptype && /מגבר|פרוססור|amplifier|processor|קרוסאובר|xover/i.test(n.name)) return false;
    const isSub = (n.disp ?? guessDisp(n.name)) >= 300;
    if (isSub && P.covSub === false) return false;
    if (!isSub && P.covSpk === false) return false;
    return true;
  }).forEach((n, i) => {
    const disp = n.disp ?? guessDisp(n.name);
    /* רמת המקור לצביעה — נחתכת לתקרת הסקאלה כדי לשמור על מדרג הצבעים המלא */
    const spl = Math.min(effSpl(n), COV_TOP);
    const aim = (n.aim ?? 0) * Math.PI / 180;
    /* קודקוד הקונוס בגב האייקון — כל האייקון בתוך הקונוס, הפיזור "יוצא" מהרמקול */
    const backPx = 22; /* חצי רוחב האייקון + שוליים, בקואורדינטות קנבס */
    const cx0 = 2200 - n.x - 20, cy0 = n.y + 24;
    /* רמקול שקוע בתקרה מקרין מטה — עיגול, לא קונוס קיר */
    const isCeil = /שקוע|ceiling/i.test(n.name || '') || /תקרה/.test(n.mount || '');
    const isOmni = disp >= 300 || isCeil;
    const cx = isOmni ? cx0 : cx0 - backPx * Math.cos(aim);
    const cy = isOmni ? cy0 : cy0 - backPx * Math.sin(aim);
    /* חיתוך לפי גבולות האזור */
    let clip = '';
    const zc = zoneAt({ x: cx0, y: cy0 });
    if (zc) {
      const cid = 'zclip' + i;
      defs += `<clipPath id="${cid}">${zoneClipPolys(zc).map(pts => `<polygon points="${pts.map(p => p[0] + ',' + p[1]).join(' ')}"/>`).join('')}</clipPath>`;
      clip = ` clip-path="url(#${cid})"`;
    }
    /* מצייר קונוס/עיגול ממקור נתון — משמש גם למקור הישיר וגם להחזרות */
    const drawSrc = (sx, sy, sAim, sSpl, gid, opMul, capM) => {
      let mR = Math.min(60, Math.pow(10, (sSpl - COV_FLOOR) / 20));
      if (capM) mR = Math.min(mR, capM); /* תקרה: רדיוס מוגבל גאומטרית */
      if (mR <= 0.6) return 0;
      const R = mR * pxPerM;
      let stops = '';
      for (let f = 0; f <= 1.0001; f += 1 / 12) {
        const m = Math.max(0.5, f * mR);
        const db = sSpl - 20 * Math.log10(m);
        stops += `<stop offset="${(f * 100).toFixed(0)}%" stop-color="${splColorAbs(db)}" stop-opacity="${(opMul * 0.5 * (1 - f * 0.5)).toFixed(2)}"/>`;
      }
      defs += `<radialGradient id="${gid}" gradientUnits="userSpaceOnUse" cx="${sx}" cy="${sy}" r="${R}">${stops}</radialGradient>`;
      if (isOmni) shapes += `<circle cx="${sx}" cy="${sy}" r="${R}" fill="url(#${gid})"${clip}/>`;
      else {
        const half = disp / 2 * Math.PI / 180, a1 = sAim - half, a2 = sAim + half;
        shapes += `<path d="M ${sx} ${sy} L ${sx + R * Math.cos(a1)} ${sy + R * Math.sin(a1)} A ${R} ${R} 0 ${disp > 180 ? 1 : 0} 1 ${sx + R * Math.cos(a2)} ${sy + R * Math.sin(a2)} Z" fill="url(#${gid})"${clip}/>`;
      }
      return R;
    };
    /* רמקול שקוע: הגובה קובע גם את העוצמה במישור האוזן וגם את רדיוס הכיסוי —
       הצליל יורד אנכית, ההנחתה היא מרחק הגובה, והעיגול = קונוס הפיזור על רצפת ההאזנה */
    let srcSpl = spl, srcCap;
    if (isCeil) {
      const hh = n.hgt ?? zc?.ceil ?? P.room?.ceil ?? 3;
      const drop = Math.max(0.5, hh - 1.2); /* עד גובה אוזן */
      srcSpl = spl - 20 * Math.log10(Math.max(1, drop));
      const effD = disp >= 300 ? 90 : Math.min(disp, 150); /* שקוע טיפוסי ~90° */
      srcCap = Math.max(1.5, drop * Math.tan(effD / 2 * Math.PI / 180) * 1.6);
    }
    const R = drawSrc(cx, cy, aim, srcSpl, 'cov' + i, 1, srcCap);
    /* החזרות מסדר ראשון מקירות סגורים — מקור-מראה מוחלש לפי חומר הקיר וספיגת החלל */
    if (zc && P.covRefl !== false) {
      const RLOSS = { 'בטון': 3, 'בלוק': 4, 'זכוכית': 2, 'גבס': 5, 'עץ': 5, 'וילון': 12, 'ספיגה אקוסטית': 15 };
      const absRoom = (zc.abs ?? P.room?.abs ?? 5) * 0.6;
      let ri = 0;
      for (const [ws] of zoneWallList(zc)) {
        if (ri >= 4) break;
        const wcfg = (zc.walls || {})[ws];
        if (wcfg && wcfg.open) continue;
        const seg = zoneWallSeg({ ...zc, _wall: ws, _walls: undefined }); if (!seg) continue;
        const loss = (RLOSS[(wcfg && wcfg.mat) || 'בלוק'] ?? 4) + absRoom;
        const rSpl = spl - loss;
        if (rSpl < COV_FLOOR + 3) continue;
        /* שיקוף המקור מעבר לקו הקיר */
        const dx = seg.x2 - seg.x1, dy = seg.y2 - seg.y1;
        const L2 = dx * dx + dy * dy; if (!L2) continue;
        const t = ((cx - seg.x1) * dx + (cy - seg.y1) * dy) / L2;
        const px2 = seg.x1 + t * dx, py2 = seg.y1 + t * dy;
        const mx = 2 * px2 - cx, my = 2 * py2 - cy;
        const wallAng = Math.atan2(dy, dx);
        const rAim = 2 * wallAng - aim;
        drawSrc(mx, my, rAim, rSpl, 'covr' + i + '_' + ri, 0.55);
        ri++;
      }
    }
    /* תוויות ד"ב על ציר הכיוון: פיק, −6, −12, −18 */
    if (sel === n.id || P.nodes.filter(x => x.kind === 'point' && !x.hidden).length <= 12) {
      /* אזור שכל קירותיו סגורים — אין תוויות dB מחוץ לו */
      const allClosed = zc && zoneWallList(zc).every(([ws2]) => !((zc.walls || {})[ws2] || {}).open);
      [[1, spl], [2, spl - 6], [4, spl - 12], [8, spl - 18], [16, spl - 24], [32, spl - 30]].forEach(([m, db]) => {
        if (db < COV_FLOOR - 2) return;
        const rr = m * pxPerM; if (rr > R + 4) return;
        const lx = cx + rr * Math.cos(aim), ly = cy + rr * Math.sin(aim);
        if (allClosed && zoneAt({ x: lx, y: ly }) !== zc) return;
        labels += `<g><rect x="${lx - 15}" y="${ly - 8}" width="30" height="15" rx="4" fill="#fff" opacity="0.85"/><text x="${lx}" y="${ly + 3.5}" text-anchor="middle" font-size="10" font-weight="700" fill="#333">${Math.round(db)}</text></g>`;
      });
    }
    /* קו כיוון לרמקול הנבחר — הידית הנגררת עצמה היא אלמנט DOM נפרד */
    if (sel === n.id && disp < 300) {
      const hx = cx + 48 * Math.cos(aim), hy = cy + 48 * Math.sin(aim);
      handles += `<line x1="${cx}" y1="${cy}" x2="${hx}" y2="${hy}" stroke="#c9502e" stroke-width="2.5"/>`;
    }
  });
  /* מיקרופוני מדידה — SPL מצטבר (סכימה אנרגטית) מכל הרמקולים */
  P.nodes.filter(n => n.ptype === 'mic' && !n.hidden).forEach(mic => {
    const mx = 2200 - mic.x - 20, my = mic.y + 24;
    let e = 0;
    P.nodes.forEach(n => {
      if (n.kind !== 'point' || n.hidden || n.noCov) return;
      if (n.ptype && n.ptype !== 'speaker' && n.ptype !== 'sub') return;
      const sx = 2200 - n.x - 20, sy = n.y + 24;
      const dM = Math.max(0.5, Math.hypot(mx - sx, my - sy) * mPerPx);
      let db = effSpl(n) - 20 * Math.log10(dM);
      const disp2 = n.disp ?? guessDisp(n.name);
      if (disp2 < 300) { /* מחוץ לקונוס — הנחתה צידית */
        const ang = Math.atan2(my - sy, mx - sx);
        let dAng = Math.abs(ang - (n.aim ?? 0) * Math.PI / 180);
        while (dAng > Math.PI) dAng = Math.abs(dAng - 2 * Math.PI);
        if (dAng > disp2 / 2 * Math.PI / 180) db -= 12;
      }
      if (db > 20) e += Math.pow(10, db / 10);
    });
    const tot = e > 0 ? (10 * Math.log10(e)).toFixed(1) : '—';
    labels += `<g><rect x="${mx - 34}" y="${my - 42}" width="68" height="20" rx="6" fill="#1a1e28" opacity="0.92"/><text x="${mx}" y="${my - 28}" text-anchor="middle" font-size="12" font-weight="800" fill="#7fe0b0">🎙 ${tot} dB</text></g>`;
  });
  svg.innerHTML = `<defs>${defs}</defs>${shapes}${labels}${handles}`;
}
function vdCalc(mm, len, imp) {
  mm = +mm; len = +len; imp = +imp;
  if (!mm || !len || !imp) return null;
  const R = 2 * len * 0.0175 / mm; /* נחושת, הלוך-חזור */
  const ratio = R / imp;
  const loss = 20 * Math.log10(1 + ratio);
  const st = ratio <= 0.05 ? 'ok' : ratio <= 0.10 ? 'warn' : 'bad';
  return { R, ratio, loss, st };
}
function vdText(mm, len, imp) {
  const r = vdCalc(mm, len, imp);
  if (!r) return 'הזן חתך ומרחק';
  const lbl = r.st === 'ok' ? '✔ תקין' : r.st === 'warn' ? '⚠ גבולי' : '✖ לא תקין';
  return `R=${r.R.toFixed(2)}Ω · ${r.loss.toFixed(2)}dB · ${lbl}`;
}
function vdLive(f) {
  const el = f.querySelector('[data-vd]');
  const r = vdCalc(f.mm.value, f.len.value, f.imp.value);
  el.className = 'vd' + (r ? ' ' + r.st : '');
  el.textContent = vdText(f.mm.value, f.len.value, f.imp.value);
}

function renderPanel() {
  const p = $('#panel');
  if (ui.tab === 'cable') {
    const c = selCable && cById(selCable);
    let html = `<button style="width:100%;margin-bottom:10px;${wireMode ? 'background:#ff8a50;color:#1a1e28;font-weight:700' : ''}" onclick="toggleWire()">🖱 ${wireMode ? (wireMode.from ? 'עכשיו לחץ על היעד בקנבס…' : 'פעיל — לחץ על המוצר הראשון בקנבס') : 'חיבור בלחיצה — הפעל'}${wireStock ? '<br><span style="font-size:11px">🔌 ' + esc(wireStockName()) + '</span>' : ''}</button>`;
    if (c) {
      const idx = cableLabels()[c.id] || (P.cables.indexOf(c) + 1);
      html += `<h3 class="sec">עריכת כבל <span class="badge" style="background:${CTYPES[c.type].c}">${idx}</span></h3>
        <p style="font-size:12px;margin:2px 0 8px;line-height:1.6;background:#eef3ee;border-radius:8px;padding:6px 9px">
          <b>מ:</b> <a style="cursor:pointer;text-decoration:underline" onclick="jumpToNode('${c.from}')" title="עבור אל המוקד בתכנית">${esc(endNameTxt(c.from, c.fromUnit))}</a>${c.fromUnit ? ' <span style="opacity:.6">(' + esc(byId(c.from)?.name || '') + ')</span>' : ''}${c.pOut ? ' · <b>' + esc(c.pOut) + '</b>' : c.fromHole ? ' · חור ' + c.fromHole : ''}<br>
          <b>אל:</b> <a style="cursor:pointer;text-decoration:underline" onclick="jumpToNode('${c.to}')" title="עבור אל המוקד בתכנית">${esc(endNameTxt(c.to, c.toUnit))}</a>${c.toUnit ? ' <span style="opacity:.6">(' + esc(byId(c.to)?.name || '') + ')</span>' : ''}${c.pIn ? ' · <b>' + esc(c.pIn) + '</b>' : c.toHole ? ' · חור ' + c.toHole : ''}</p>
        <form onsubmit="event.preventDefault();updCable('${c.id}',this)">${cableForm(c)}
          <button class="primary" style="width:100%;margin-bottom:6px">שמור שינויים</button>
        </form>
        <div class="row2">
          <div><button style="width:100%" onclick="swapCable('${c.id}')">↔ החלף כיוון</button></div>
          <div><button style="width:100%" onclick="dupCable('${c.id}')">שכפל קו</button></div>
        </div>
        <button style="width:100%;margin-top:6px" onclick="delete cById('${c.id}').bend;render()">↺ אפס עיקול קו</button>
        <button style="width:100%;margin-top:6px;background:#f3d9d2;color:#8c2f16" onclick="delCable('${c.id}')">מחק כבל</button>
        <button style="width:100%;margin-top:6px" onclick="selCable=null;wireMode={from:null};render()">+ כבל חדש במקום</button>`;
    } else {
      html += `<h3 class="sec">כבל חדש</h3>
        <form onsubmit="event.preventDefault();addCable(this)">${cableForm(null)}
          <button class="primary" style="width:100%">הוסף כבל</button>
        </form>`;
    }
    html += `<h3 class="sec">כל הכבלים (${P.cables.length}) — לחץ לעריכה</h3>` +
      P.cables.map((cb, i) => {
        const col = CTYPES[cb.type].c;
        return `<div class="crow ${cb.id === selCable ? 'selc' : ''}" onclick="pickCable('${cb.id}')">
          <span class="badge" style="background:${col}">${i + 1}</span>
          <span class="txt">${endName(cb.from, cb.fromUnit)} ← ${endName(cb.to, cb.toUnit)} · ${CTYPES[cb.type].n}${cb.qty !== '1' ? ' ×' + esc(cb.qty) : ''}</span>
        </div>`;
      }).join('');
    p.innerHTML = html;
    return;
  }
  if (selZone) {
    const z = (P.zones || []).find(z => z.id === selZone);
    if (z) {
      const dims = P.scale ? `${(z.w * P.scale).toFixed(1)} × ${(z.h * P.scale).toFixed(1)} מ׳ (~${(z.w * z.h * P.scale * P.scale).toFixed(0)} מ"ר)` : 'כייל קנה מידה כדי לראות מידות אמיתיות';
      p.innerHTML = `<h3 class="sec" data-zoneid="${z.id}">🗺 עריכת אזור סאונד</h3>
        <div class="fld"><label>שם האזור</label><input value="${esc(z.name)}" onchange="(P.zones.find(x=>x.id==='${z.id}')).name=this.value;render()"></div>
        <div class="row2">
          <div class="fld"><label>גובה תקרה באזור (מ׳)</label><input type="number" step="0.1" value="${z.ceil ?? (P.room?.ceil ?? '')}" placeholder="${P.room?.ceil ?? ''}" onchange="(P.zones.find(x=>x.id==='${z.id}')).ceil=+this.value;save()"></div>
          <div class="fld"><label>ספיגה אקוסטית 0-10</label><input type="number" min="0" max="10" value="${z.absorb ?? (P.room?.absorb ?? '')}" placeholder="${P.room?.absorb ?? ''}" onchange="(P.zones.find(x=>x.id==='${z.id}')).absorb=+this.value;save()"></div>
        </div>
        <h3 class="sec">🧱 קירות האזור — פתוח/סגור וחומר</h3>
        <p class="muted" style="margin:-2px 0 4px;font-size:10px">משפיע על החזרות (קיר קשה=החזרה) ועל דעיכה (פתוח=בריחת סאונד).</p>
        ${wallRows(z)}
        <p class="muted">📐 ${dims}</p>
        <button style="width:100%;margin-top:8px;${z._sysOpen ? 'background:#0f6e56;color:#fff;font-weight:700' : ''}" onclick="(P.zones.find(x=>x.id==='${z.id}'))._sysOpen=${z._sysOpen ? 'false' : 'true'};render()">🔧 בנה מערכת אוטומטית לאזור ${z._sysOpen ? '▲' : '▼'}</button>
        ${z._sysOpen ? zoneSystemBuilder(z) : ''}
        ${zoneItemsList(z)}
        <p class="muted" style="margin-top:8px">גרירת התווית מזיזה את האזור · הריבוע בפינה משנה גודל</p>
        <button style="width:100%;margin-top:6px" onclick="selZone=null;render()">✔ סגור</button>
        <button style="width:100%;margin-top:6px;background:#f3d9d2;color:#8c2f16" onclick="delZone('${z.id}')">מחק אזור</button>`;
      return;
    }
    selZone = null;
  }
  if (panelEdit) {
    const pn = byId(panelEdit.nid);
    const u = pn && pn.units[panelEdit.ui];
    if (u && u.panel) {
      if (u.panel.mode === 'matrix' && u.panel.rows !== u.u) {
        const cpr = pCols(u.panel);
        u.panel.rows = u.u;
        sizeTo(u.panel, u.u * cpr);
      }
      const fh = ((u.panel.rows || 1) * 42 + 22) * 0.7;
      p.innerHTML = `<h3 class="sec">🧩 פאנל 19″: ${esc(u.name)} — ${esc(pn.name)}</h3>
        <div class="fld"><label>גובה בארון (U) — קובע את מספר השורות</label><input type="number" min="1" max="12" value="${u.u}" onchange="syncUnitPanel('${pn.id}',${panelEdit.ui},this.value)"></div>` +
        panelEditor(u.panel, pn.id, panelEdit.ui) +
        `<h3 class="sec">תצוגת הפאנל (רוחב 19″ קבוע) — לחץ על חור</h3>
        <div style="height:${fh}px;overflow:hidden"><div style="transform:scale(.7);transform-origin:top right">${faceHTML(u.panel, pn.id, panelEdit.ui)}</div></div>
        <button style="width:100%;margin-top:10px" onclick="panelEdit=null;render()">✔ סגור עריכת פאנל</button>
        <button style="width:100%;margin-top:6px;background:#f3d9d2;color:#8c2f16" onclick="delete byId('${pn.id}').units[${panelEdit.ui}].panel;panelEdit=null;render()">הסר את הגדרת הפאנל מהיחידה</button>`;
      return;
    }
    panelEdit = null;
  }
  const n = sel && byId(sel);
  if (!n) {
    /* מסך "הגדרות תכנית" — רקע, כיול, פרטי חלל, אזורים, סגנון (נגיש גם מהתפריט הראשי) */
    let bgTop = '';
    if (P.bg) {
      bgTop = `<h3 class="sec">🗺 תכנית רקע</h3>
        <div class="fld"><label>גודל רקע (רוחב: ${P.bgW || 1400}px)</label>
          <input type="range" min="400" max="2200" step="20" value="${P.bgW || 1400}" oninput="P.bgW=+this.value;renderBg();renderWires()" onchange="save()"></div>
        <div class="fld"><label>שקיפות</label>
          <input type="range" min="0.1" max="1" step="0.05" value="${P.bgOp ?? 0.5}" oninput="P.bgOp=+this.value;renderBg()" onchange="save()"></div>
        <button style="width:100%;margin-bottom:8px" onclick="rotateBg()">↻ סובב תכנית 90° · כרגע: ${P.bgRot || 0}°</button>
        <div style="border:2px solid ${P.scale ? '#0f6e56' : '#c9502e'};border-radius:10px;padding:10px;margin:0 0 8px;background:${P.scale ? '#eef7f1' : '#fdeee8'}">
          <div style="font-weight:800;color:${P.scale ? '#0f6e56' : '#c9502e'};margin-bottom:4px">${P.scale ? '✓ קנה מידה מכויל' : '⚠ התכנית עדיין לא מכוילת'}</div>
          <p class="muted" style="margin:0 0 8px">${P.scale ? `1 מ׳ = ${(1 / P.scale).toFixed(1)}px · מרחקי כבלים נמדדים אוטומטית מהתכנית` : 'בלי כיול מרחקי הכבלים לא יחושבו נכון. כייל פעם אחת לפי מידה ידועה בתכנית.'}</p>
          <button class="primary" style="width:100%;${calMode ? 'background:#ff8a50;color:#1a1e28' : ''}" onclick="calMode={pts:[]};render()">📏 ${calMode ? 'לחץ על 2 נקודות שהמרחק ביניהן ידוע…' : (P.scale ? 'כייל מחדש' : 'כייל עכשיו')}</button>
        </div>
        <button style="width:100%;margin-bottom:6px" title="הוספת קירות ואובייקטים משורטטים מעל תכנית הרקע" onclick="sketchStart()">🖊 ${P.sketch && ((P.sketch.walls || []).length || (P.sketch.objs || []).length) ? 'ערוך את השרטוט' : 'שרטט מעל התכנית — קירות ואובייקטים'}</button>
        <button style="width:100%;margin-bottom:6px;background:#f3d9d2;color:#8c2f16" onclick="removeBg()">הסר רקע</button>`;
    } else {
      bgTop = `<h3 class="sec">🗺 תכנית רקע</h3>
        <p class="muted" style="margin-bottom:8px">העלה שרטוט/תכנית (תמונה) כרקע לקנבס ומקם את המוקדים לפיה — או שרטט תכנית בעצמך.</p>
        <button class="primary" style="width:100%" onclick="$('#bgIn').click()">🖼 העלה תכנית כרקע</button>
        <button style="width:100%;margin-top:6px" title="ציור קירות והצבת בר/ספה/שולחנות בקנה מידה — במקום העלאת תמונה" onclick="sketchStart()">🖊 ${P.sketch && (P.sketch.walls || []).length ? 'ערוך את השרטוט' : 'או: שרטט תכנית — קירות ואובייקטים בקנה מידה'}</button>`;
    }
    /* פרטי החלל — הועלו למעלה */
    const roomSec = `<h3 class="sec">🏠 פרטי החלל (ברירת מחדל כללית)</h3>
      <div class="row2">
        <div class="fld"><label>גובה תקרה (מ׳)</label><input type="number" step="0.1" min="1" value="${P.room?.ceil ?? ''}" onchange="P.room=P.room||{};P.room.ceil=+this.value;save()"></div>
        <div class="fld"><label>ספיגה אקוסטית 0-10</label><input type="number" min="0" max="10" value="${P.room?.absorb ?? ''}" onchange="P.room=P.room||{};P.room.absorb=+this.value;save()"></div>
      </div>
      <div class="fld"><label>אופי שימוש כללי (כשאין אזורים)</label><select onchange="P.room=P.room||{};P.room.usage=this.value;save()">
        ${['— בחר —', 'מוזיקת רקע', 'מוזיקה לבר', 'הופעות חיות', 'מוזיקת ריקודים', 'מועדון על מלא'].map(u => `<option value="${u}" ${P.room?.usage === u ? 'selected' : ''}>${u}${typeof USAGE_SPL!=='undefined'&&USAGE_SPL[u]?' · '+USAGE_SPL[u]+'dB':''}</option>`).join('')}
      </select></div>
      `;
    let bgc = `<h3 class="sec">🗺 אזורי סאונד — תכלית שונה לכל אזור</h3>
      <div class="fld"><label>שם האזור הבא</label><input value="${esc(zoneNameNext)}" placeholder="למשל: חדר פרטי / רחבה / חוץ" oninput="zoneNameNext=this.value"></div>
      <button style="width:100%;margin-bottom:6px;${zoneMode ? 'background:#ff8a50;color:#1a1e28;font-weight:700' : ''}" onclick="zoneMode={poly:[]};render()">${zoneMode ? 'נקר נקודות סביב האזור · לחיצה על הנקודה הראשונה סוגרת (Esc לביטול)' : '➕ סמן אזור — ניקור נקודות'}</button>
      <button style="width:100%;margin-bottom:6px" onclick="autoZones()">🤖 סמן לי אזורים אוטומטית</button>` +
      (P.zones || []).map(z => `<div class="crow" onclick="selZone='${z.id}';render()">
        <span style="width:12px;height:12px;border-radius:3px;background:${zColor(z)};flex:none"></span>
        <span class="txt">${esc(z.name)} · ${esc(z.usage || 'ללא תכלית')}${P.scale ? ' · ' + (z.w * P.scale).toFixed(0) + '×' + (z.h * P.scale).toFixed(0) + ' מ׳' : ''}</span>
      </div>`).join('') +
      `<h3 class="sec">🔊 פיזור רמקולים (SPL)</h3>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;margin-bottom:6px"><input type="checkbox" style="width:auto" ${P.showCoverage ? 'checked' : ''} onchange="P.showCoverage=this.checked;render();save()"> הצג קונוסי כיסוי וד"ב לפי מרחק</label>
      ${P.showCoverage ? `<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;margin-bottom:4px"><input type="checkbox" style="width:auto" ${P.covRefl !== false ? 'checked' : ''} onchange="P.covRefl=this.checked;render();save()"> הצג החזרות מקירות (לפי חומר הקיר וספיגת החלל)</label>
      <button style="width:100%;margin-bottom:6px" onclick="window.__micPlace=true;render()">🎙 מקם מיקרופון מדידה — לחץ ואז על התכנית</button>
      <div class="fld"><label>סקאלת צבעים לפי תכלית (מקרא בצד המסך)</label><select onchange="P.covUsage=this.value;render();save()">
        <option value="" ${!P.covUsage ? 'selected' : ''}>אוטומטי (לפי האזורים)</option>
        ${USAGES.map(u => `<option value="${u}" ${P.covUsage === u ? 'selected' : ''}>${u} · יעד ${USAGE_SPL[u]}dB (סקאלה ${USAGE_SPL[u] - 18}–${USAGE_SPL[u]})</option>`).join('')}
      </select></div>
      <p class="muted" style="font-size:10px">המקרא האנכי מופיע בצד שמאל של המסך ומשתנה לפי התכלית: רקע 70–90 · בר 74–98 · הופעות 80–108 · מועדון 90–120.${P.scale ? '' : ' ⚠ כייל תכנית.'}</p>
      <div style="display:flex;gap:12px;margin-bottom:6px">
        <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:12px"><input type="checkbox" style="width:auto" ${P.covSpk !== false ? 'checked' : ''} onchange="P.covSpk=this.checked;render();save()"> 🔊 רמקולים</label>
        <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:12px"><input type="checkbox" style="width:auto" ${P.covSub !== false ? 'checked' : ''} onchange="P.covSub=this.checked;render();save()"> 🔈 סאבים</label>
      </div>
      <button style="width:100%;margin-bottom:4px" onclick="$('#spkDataIn').click()">📥 ייבוא נתוני רמקולים (CSV/JSON · מ-EASE/GLL)</button>
      <p class="muted" style="font-size:10px">CSV עם עמודות: model,H,V,sens,max · או JSON [{model,h,v,sens,max}]. ${(store.spkLib && Object.keys(store.spkLib).length) ? Object.keys(store.spkLib).length + ' דגמים בספרייה.' : ''}</p>` : ''}
      <h3 class="sec">〰 סגנון קווים</h3>
      <div class="fld"><select onchange="P.route=this.value;render()">
        <option value="curve" ${P.route !== 'ortho' ? 'selected' : ''}>מעוגל (ברירת מחדל)</option>
        <option value="ortho" ${P.route === 'ortho' ? 'selected' : ''}>ישר — כמו מעגל חשמלי</option>
      </select></div>`;
    ensureStock(P);
    const S = P.stock;
    let stc = '';
    if (S.cables.length || S.reels.length || S.conns.length) {
      const row = (txt, del) => `<li style="list-style:none;display:flex;gap:6px;align-items:center;font-size:12px;padding:3px 6px;border:1px solid #eee;border-radius:6px;margin-bottom:3px"><span style="flex:1">${txt}</span><button style="padding:1px 7px" onclick="${del};render()">✕</button></li>`;
      stc = `<h3 class="sec">📦 מלאי מההצעות</h3>` +
        S.cables.map((s, i) => row(`🔌 ${esc(s.name.slice(0, 34))} · ${s.used || 0}/${s.qty} בשימוש`, `P.stock.cables.splice(${i},1)`)).join('') +
        S.reels.map((s, i) => row(`🛞 ${esc(s.name.slice(0, 34))} · ${s.used || 0}/${s.total} מ׳`, `P.stock.reels.splice(${i},1)`)).join('') +
        S.conns.map((s, i) => row(`⭕ ${esc(s.name.slice(0, 34))} · ${s.used || 0}/${s.qty}`, `P.stock.conns.splice(${i},1)`)).join('') +
        `<p class="muted">המלאי זמין בטופס "כבל חדש" — בחר מקור כבל מהמלאי במקום להגדיר ידנית.</p>`;
    }
    p.innerHTML = bgTop + roomSec + bgc + stc + '<p class="muted" style="margin-top:8px">בחר מוקד בקנבס, או צור חדש מהכפתורים למעלה. גרירת מוקד — מהכותרת שלו.</p>';
    return;
  }
  const linkedIt = n.srcIid ? impItems.find(x => x.iid === n.srcIid) : null;
  let html = `<h3 class="sec">עריכת מוקד</h3>
    ${linkedIt ? `<div class="fld"><label>שם המוצר (מהצעת המחיר)</label><textarea rows="2" style="width:100%;resize:vertical;font-family:inherit;font-size:13px;line-height:1.3" onchange="const it=impItems.find(x=>x.iid==='${n.srcIid}');if(it){it.name=this.value;save();render();}">${esc(linkedIt.name)}</textarea></div>` : ''}
    <div class="fld"><label>שם</label><textarea rows="2" style="width:100%;resize:vertical;font-family:inherit;font-size:13px;line-height:1.3" onchange="byId('${n.id}').name=this.value;render()">${esc(n.name)}</textarea></div>
    <div class="fld"><label>תיאור</label><input value="${esc(n.sub || '')}" onchange="byId('${n.id}').sub=this.value;render()"></div>`;
  if (n.kind === 'point') {
    const isMini = n.mini || (n.srcIid && !n.full);
    const MOUNTS = ['קיר בלוק', 'קיר בטון', 'תקרה', 'תקרת גבס', 'תקרה מוט הברגה', 'רצפה', 'אחר'];
    /* סוג המוקד — לא בהכרח רמקול */
    const PTYPES = [['speaker', '🔊 רמקול'], ['sub', '🔈 סאב'], ['amp', '🎚 מגבר'], ['proc', '🎛 פרוססור / DSP / מטריצה'], ['player', '💿 נגן / סטרימר / מחשב מוזיקה'], ['mic', '🎤 מיקרופון'], ['screen', '📺 מסך/מקרן'], ['light', '💡 גוף תאורה'], ['camera', '📷 מצלמה'], ['ap', '📶 נקודת רשת/AP'], ['device', '📦 מכשיר אחר'], ['other', '📍 נקודת קצה']];
    const dbT = dbSpkType(n.name);
    const autoT = dbT === 'סאב' ? 'sub' : /מגבר|amplifier/i.test(n.name) ? 'amp' : /פרוססור|processor|קרוסאובר|xover|מטריצ|\bDSP\b/i.test(n.name) ? 'proc' : /נגן|סטרימר|streamer|player|מחשב מוזיקה/i.test(n.name) ? 'player' : /סאב|\bsub\b/i.test(n.name) ? 'sub' : /רמקול|speaker|קולונה/i.test(n.name) ? 'speaker' : /מסך|מקרן|screen|projector|led/i.test(n.name) ? 'screen' : /תאורה|light|par|לד/i.test(n.name) ? 'light' : /מצלמה|camera/i.test(n.name) ? 'camera' : /מיקרופון|mic/i.test(n.name) ? 'mic' : null;
    const pt = n.ptype || autoT || 'speaker';
    const isSpk = pt === 'speaker' || pt === 'sub';
    const isSub = pt === 'sub';
    const curM = n.mount || (isSub ? 'רצפה' : /שקוע|ceiling/i.test(n.name || '') ? 'תקרת גבס' : 'קיר בלוק');
    html += `<div class="fld"><label>סוג המוקד</label><select onchange="byId('${n.id}').ptype=this.value;render();save()">
      ${PTYPES.map(([v, l]) => `<option value="${v}" ${pt === v ? 'selected' : ''}>${l}</option>`).join('')}
    </select></div>
    <div class="fld"><label style="display:flex;align-items:center;gap:6px;cursor:pointer">
      <input type="checkbox" style="width:auto" ${isMini ? 'checked' : ''} onchange="toggleMini('${n.id}',this.checked)"> סמן ממוזער על התכנית (אייקון + מספר)</label></div>
    <div class="row2">
      <div class="fld"><label>גובה (מ׳)</label><input type="number" step="0.1" min="0" value="${n.hgt ?? (isSub ? 0 : 2.6)}" onchange="byId('${n.id}').hgt=+this.value;save()"></div>
      <div class="fld"><label>התקנה על גבי</label><select onchange="byId('${n.id}').mount=this.value;save()">${MOUNTS.map(m => `<option value="${m}" ${curM === m ? 'selected' : ''}>${m}</option>`).join('')}</select></div>
    </div>
    ${!isSpk ? `<p class="muted" style="font-size:11px">מוקד מסוג ${PTYPES.find(x => x[0] === pt)[1]} — ללא כיסוי אקוסטי.</p>
    <button style="width:100%;margin:4px 0 6px;background:#0f6e56;color:#fff;font-weight:700" onclick="wireMode={from:{nid:'${n.id}'}};wireStock=null;pinMode=null;connPin=null;render()">🔌 חבר כבל מכאן — ואז לחץ על מוצר היעד בתכנית</button>` : `
    <h3 class="sec">🔊 נתונים אקוסטיים (EASE/GLL) וכיסוי</h3>`}
    ${isSpk ? `
    ${(() => {
      const sd = spkData(n.name);
      const manual = n.disp != null || n.vdisp != null;
      const vfd = manual || (sd && sd.ok);
      const st = vfd ? 'border:2px solid #0f8a5f;background:#eef7f1' : 'border:2px solid #c1121f;background:#fdeeee';
      return `<div class="row2">
      <div class="fld"><label>זווית H° ${vfd ? '<span style="color:#0f8a5f;font-size:10px">✓ ' + (manual ? 'ידני' : 'מאומת יצרן') + '</span>' : '<span style="color:#c1121f;font-size:10px">⚠ לא מאומת</span>'}</label><input type="number" min="10" max="360" style="${st}" value="${n.disp ?? guessDisp(n.name)}" onchange="byId('${n.id}').disp=+this.value;render();save()"></div>
      <div class="fld"><label>זווית V°</label><input type="number" min="10" max="360" style="${st}" value="${n.vdisp ?? guessVdisp(n.name)}" onchange="byId('${n.id}').vdisp=+this.value;save();render()"></div>
    </div>`;
    })()}
    <div class="row2">
      <div class="fld"><label>רגישות <select style="width:auto;font-size:10px;padding:1px 3px" onchange="byId('${n.id}').sensRef=this.value;render();save()"><option value="w" ${(n.sensRef || 'w') === 'w' ? 'selected' : ''}>dB@1W/1m</option><option value="v" ${n.sensRef === 'v' ? 'selected' : ''}>dB@2.83V/1m</option></select>${n.sensRef === 'v' && spkOhm(n) !== 8 ? ` <span class="muted" style="font-size:9px">(=${((n.sens ?? guessSens(n.name) ?? 0) - 10 * Math.log10(8 / spkOhm(n))).toFixed(1)}dB@1W)</span>` : ''}</label><input type="number" min="80" max="115" value="${n.sens ?? guessSens(n.name) ?? ''}" placeholder="—" onchange="byId('${n.id}').sens=this.value?+this.value:undefined;render();save()"></div>
      <div class="fld"><label>הספק מגבר (W)</label><input type="number" min="1" value="${n.pow ?? ''}" placeholder="—" onchange="byId('${n.id}').pow=this.value?+this.value:undefined;render();save()"></div>
    </div>
    <div class="fld"><label>אימפדנס (Ω)</label><input type="number" min="1" max="32" value="${n.ohm ?? (spkData(n.name)?.o ?? '')}" placeholder="8" onchange="byId('${n.id}').ohm=this.value?+this.value:undefined;save()"></div>
    <button style="width:100%;margin:4px 0 6px;background:#0f6e56;color:#fff;font-weight:700" onclick="wireMode={from:{nid:'${n.id}'}};wireStock=null;pinMode=null;connPin=null;render()">🔌 חבר כבל מכאן — ואז לחץ על מוצר היעד בתכנית</button>
    <button style="width:100%;margin:0 0 4px;background:#0f6e56;color:#fff;font-weight:700" onclick="autoChainFrom('${n.id}')">🔗 שרשר אוטומטית לפי קרבה — כל הרמקולים הקרובים בשרשרת אחת</button>
    <button style="width:100%;margin:0 0 6px;background:#e65100;color:#fff;font-weight:700" onclick="wireMode={from:{nid:'${n.id}'},chain:true};wireStock=null;pinMode=null;connPin=null;render()">🔗 או ידני — לחץ על הרמקול הבא</button>
    <div class="fld"><label>SPL מקס @1מ׳ (דריסה ידנית)</label><input type="number" min="90" max="150" value="${n.spl ?? ''}" placeholder="${effSpl(n).toFixed(0)} (מחושב)" onchange="byId('${n.id}').spl=this.value?+this.value:undefined;render();save()"></div>
    <p class="muted" style="font-size:10px;margin:-2px 0 4px">SPL אפקטיבי בשימוש: <b>${effSpl(n).toFixed(0)} dB</b> ${(n.sens ?? guessSens(n.name)) != null && n.pow ? '(רגישות + 10·log₁₀·הספק)' : '(Max SPL)'}</p>
    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;margin-bottom:4px"><input type="checkbox" style="width:auto" ${!n.noCov ? 'checked' : ''} onchange="byId('${n.id}').noCov=!this.checked;render();save()"> הצג פיזור לרמקול זה</label>
    <div class="fld"><label>כיוון הרמקול (${n.aim ?? 0}° · 0=ימין, 90=מטה)</label>
      <input type="range" min="0" max="359" value="${n.aim ?? 0}" oninput="byId('${n.id}').aim=+this.value;renderCoverage()" onchange="save();render()"></div>
    <p class="muted" style="font-size:10px">🎯 לסיבוב: גרור את הידית הכתומה שמופיעה ליד הרמקול על התכנית. הצג קונוסים ב"הגדרות תכנית → פיזור רמקולים".</p>` : ''}`;
  }
  if (n.kind === 'rack' || n.kind === 'panel') {
    /* סינון חיבורים בתוך המוקד עצמו — בארון עמוס זה מה שמאפשר לראות קו בודד */
    const mine = (P.cables || []).filter(c => c.from === n.id || c.to === n.id);
    if (mine.length > 0) {
      n.cabVis = n.cabVis || {};
      const cats = [['audio', '🔊 סאונד'], ['light', '💡 תאורה'], ['video', '📺 וידאו'], ['data', '🌐 רשת/אופטי'], ['power', '⚡ חשמל']];
      const rows = cats.map(([k, lbl]) => {
        const cnt = mine.filter(c => (CAB_GROUP[c.type] || 'audio') === k).length;
        if (!cnt) return '';
        const on = n.cabVis[k] !== false;
        return `<label style="display:flex;gap:6px;align-items:center;font-size:11px;padding:1px 4px;cursor:pointer">
          <input type="checkbox" style="width:auto" ${on ? 'checked' : ''} onchange="const nn=byId('${n.id}');nn.cabVis=nn.cabVis||{};nn.cabVis['${k}']=this.checked;render();save()">
          <span style="flex:1">${lbl}</span><span class="muted">${cnt}</span></label>`;
      }).join('');
      if (rows) html += `<div style="background:#f4f2ec;border-radius:8px;padding:7px;margin-bottom:6px">
        <div style="font-size:11px;font-weight:700;margin-bottom:3px">🔎 הצג חיבורים במוקד זה (${mine.length})</div>${rows}
        <label style="display:flex;gap:6px;align-items:center;font-size:11px;padding:3px 4px 0;cursor:pointer;border-top:1px solid #e5e0d6;margin-top:4px">
          <input type="checkbox" style="width:auto" ${!n.hideInt ? 'checked' : ''} onchange="byId('${n.id}').hideInt=!this.checked;render();save()">
          <span>הצג מסלולים פנימיים בתוך המוקד (ליבות מולטי, חיבורים פנימיים)</span></label></div>`;
    }
  }
  if (n.kind === 'rack') {
    /* לחיצה על מוצר (בגב או 🔌 ברשימה) מציגה את פנל החיבורים והניתוב שלו */
    if (rearPick && rearPick.nodeId === n.id) {
      const rp = n.units.find(u => u.id === rearPick.unitId);
      if (rp) html += `<h3 class="sec">🔌 פנל חיבורים — ${esc(rp.name.slice(0, 34))}</h3>`
        + ioPanelHTML(rp.name, n.id, rp.id)
        + ioRoutingHTML(rp.name, n.id, rp.id);
    }
    const sorted = n.units.map((u, i) => ({ u, i })).sort((a, b) => a.u.pos - b.u.pos);
    html += `<div class="fld"><label>גובה ארון (U)</label><input type="number" min="1" max="48" value="${n.ru}" onchange="byId('${n.id}').ru=+this.value;render()"></div>
      <h3 class="sec">יחידות בארון — ▲▼ להזזה, או הקלד מיקום U</h3><ul class="ulist">` +
      sorted.map(({ u, i }) => `<li>
        <span class="sw" style="background:${CATS[u.cat].c}"></span><b>${esc(u.name)}</b>
        <input class="posin" type="number" min="1" max="${n.ru}" value="${u.pos + 1}" title="מיקום U מלמעלה" onchange="setPos('${n.id}',${i},this.value)">
        <span>${u.u}U</span>
        <button onclick="mvU('${n.id}',${i},-1)" title="למעלה">▲</button>
        <button onclick="mvU('${n.id}',${i},1)" title="למטה">▼</button>
        <button onclick="rearPick={nodeId:'${n.id}',unitId:'${u.id}'};render()" title="פנל חיבורים וניתוב פורטים">🔌</button>
        <button onclick="openPanelEd('${n.id}',${i})" title="עיצוב פאנל מחברים ליחידה">🧩</button>
        <button onclick="delUnit('${n.id}',${i})">✕</button></li>`).join('') +
      `</ul>
      <form onsubmit="event.preventDefault();addU('${n.id}',this)">
        <div class="fld"><label>שם יחידה</label><input name="nm" required placeholder="למשל K&F IPX 15:4"></div>
        <div class="row2">
          <div class="fld"><label>גובה U</label><input name="u" type="number" value="1" min="1" max="12"></div>
          <div class="fld"><label>קטגוריה</label><select name="cat">${Object.entries(CATS).map(([k, v]) => `<option value="${k}">${v.n}</option>`).join('')}</select></div>
        </div>
        <div class="fld"><label style="display:flex;align-items:center;gap:6px;cursor:pointer"><input type="checkbox" name="isp" style="width:auto"> 🧩 זהו פאנל מחברים (ייפתח עורך החורים)</label></div>
        <button class="primary" style="width:100%">הוסף יחידה</button>
      </form>`;
  } else if (n.kind === 'panel') {
    const cnt = P.cables.filter(c => c.from === n.id || c.to === n.id).length;
    html += `<div class="fld"><label>מותקן על</label><select onchange="byId('${n.id}').mount=this.value;render();save()">
      ${['', 'קיר', 'עמדה', 'ארון', 'במה', 'רצפה', 'תקרה'].map(m => `<option value="${m}" ${(n.mount || '') === m ? 'selected' : ''}>${m || '— בחר —'}</option>`).join('')}
    </select></div>
    <p class="muted" style="font-size:11px">🔌 ${n.panel.holes.length} חורים · ${cnt} חיבורים · <a href="#" onclick="event.preventDefault();multiView('${n.id}')">תצוגת ניתוב מלאה ⤢</a></p>
    <h3 class="sec">עיצוב הפאנל</h3>` + panelEditor(n.panel, n.id, -1) +
      `<p class="muted" style="margin-top:6px">לחיצה על חור בקנבס מחילה את המברשת. במצב חופשי — גרור חורים למיקום הרצוי.</p>`;
  }
  html += `<h3 class="sec"></h3><button style="width:100%;background:#f3d9d2;color:#8c2f16" onclick="delNode('${n.id}')">מחק מוקד</button>`;
  p.innerHTML = html;
}

function renderLegend() {
  $('#legend').innerHTML = `<h3>KO Projects · מפתח כבלים — ${esc(P.name)}</h3>
    <table class="cablelist"><tr><th>#</th><th>מ־</th><th>אל</th><th>סוג</th><th>כמות</th><th>עובי / מפרט</th><th>מרחק · ירידת מתח</th><th>סטטוס</th><th>הערה</th></tr>` +
    P.cables.map((c, i) => `<tr>
      <td><span class="badge" style="background:${CTYPES[c.type].c}">${cableLabels()[c.id]}</span></td>
      <td>${endName(c.from, c.fromUnit)}${c.pOut ? ' <small style="color:#888">· ' + esc(c.pOut) + '</small>' : ''}</td><td>${endName(c.to, c.toUnit)}${c.pIn ? ' <small style="color:#888">· ' + esc(c.pIn) + '</small>' : ''}</td>
      <td>${CTYPES[c.type].n}${c.cores?' · '+c.cores+'× XLR':''}${c.fiber?' · '+c.fiber:''}${c.conn && CONNS[c.conn] ? ' · ' + CONNS[c.conn].n + (c.conn2 && CONNS[c.conn2] && c.conn2 !== c.conn ? ' ← ' + CONNS[c.conn2].n : '') : ''}</td><td>${esc(c.qty)}</td><td>${esc(c.spec)}</td><td>${vdCell(c)}</td><td>${c.inst === 'exist' ? '♻️ קיים' : c.inst === 'pull' ? '🚚 להעברה' : '➕ חדש'}</td><td>${esc(c.note)}</td></tr>`).join('') +
    '</table>' +
    ((P.zones || []).length ? `<h3 style="margin-top:12px">אזורי סאונד</h3>
      <table class="cablelist"><tr><th></th><th>שם האזור</th><th>תכלית</th><th>שטח</th><th></th></tr>` +
      P.zones.map((z, i) => `<tr>
        <td><span onclick="openZonePanel('${z.id}')" title="פתח את הגדרות האזור" style="display:inline-block;width:16px;height:16px;border-radius:4px;background:${zColor(z)};cursor:pointer;box-shadow:0 0 0 2px rgba(0,0,0,.08)"></span></td>
        <td><input style="width:150px;padding:2px 5px;border:1px solid #ccc;border-radius:5px" value="${esc(z.name)}" onchange="P.zones[${i}].name=this.value;render()"></td>
        <td><select style="padding:2px 5px;border:1px solid #ccc;border-radius:5px" onchange="P.zones[${i}].usage=this.value==='— ללא —'?'':this.value;render()">
          ${['— ללא —', ...USAGES].map(u => `<option value="${u === '— ללא —' ? '' : u}" ${(z.usage || '— ללא —') === u ? 'selected' : ''}>${u}${typeof USAGE_SPL !== 'undefined' && USAGE_SPL[u] ? ' · ' + USAGE_SPL[u] + 'dB' : ''}</option>`).join('')}
        </select></td>
        <td>${P.scale ? (zoneArea(z) * P.scale * P.scale).toFixed(0) + ' מ"ר' : '—'}</td>
        <td><button style="padding:1px 8px" onclick="delZone('${z.id}')">✕</button></td></tr>`).join('') + '</table>' : '');
}
function vdCell(c) {
  const r = vdCalc(c.mm, c.len, c.imp);
  if (!r) return '—';
  const col = r.st === 'ok' ? '#085041' : r.st === 'warn' ? '#8a5a00' : '#a32222';
  const lbl = r.st === 'ok' ? '✔ תקין' : r.st === 'warn' ? '⚠ גבולי' : '✖ לא תקין';
  return `<span style="color:${col};font-weight:600">${c.len} מ׳ · ${c.mm} ממ״ר · ${r.loss.toFixed(2)}dB · ${lbl}</span>`;
}

/* drag nodes + cable badge bend + endpoint re-connect */
let dragC = null, dragE = null, modalCb = null;
/* ===== 🖊 שרטוט תכנית — קירות ואובייקטים בקנה מידה, תחליף להעלאת תמונה ===== */
let sketchMode = null, sketchSel = null;
const SK_OBJS = {
  bar: { n: 'בר', w: 3, h: 0.7, c: '#8b5a2b' },
  counter: { n: 'דלפק', w: 2, h: 0.6, c: '#8b5a2b' },
  sofa: { n: 'ספה', w: 2.2, h: 0.9, c: '#7a4ab7' },
  table: { n: 'שולחן', w: 1.6, h: 0.8, c: '#4a6ab7' },
  tableR: { n: 'שולחן עגול', w: 1.2, h: 1.2, c: '#4a6ab7', round: 1 },
  stage: { n: 'במה', w: 4, h: 3, c: '#c9502e' },
  dance: { n: 'רחבה', w: 4, h: 4, c: '#b7761f', dash: 1 },
  door: { n: 'דלת', w: 0.9, h: 0.18, c: '#666' },
  plant: { n: 'צמח', w: 0.6, h: 0.6, c: '#2e7d32', round: 1 }
};
async function sketchStart() {
  if (!P.scale) {
    const m = parseFloat(await uiPrompt('רוחב השטח שתשרטט במטרים (קובע את קנה המידה):', '20'));
    if (!(m > 1)) return;
    P.bgW = P.bgW || 1400;
    P.scale = m / P.bgW;
    recalcCableLengths();
  }
  P.sketch = P.sketch || { walls: [], objs: [] };
  sketchMode = { tool: 'rect', cur: [] };
  sketchSel = null;
  sketchBar(); render(); save();
  uiToast('🖊 מצב שרטוט · ⬜ חדר: 2 לחיצות פינות · 📏 קיר: נקודות + דאבל-קליק · אובייקטים מהסרגל בגודל אמיתי');
}
function sketchBar() {
  const old2 = document.getElementById('sketchBar'); if (old2) old2.remove();
  if (!sketchMode) return;
  const bar = document.createElement('div');
  bar.id = 'sketchBar';
  bar.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:82;background:#1a1e28;color:#fff;border-radius:12px;padding:7px 10px;display:flex;gap:4px;align-items:center;flex-wrap:wrap;max-width:96vw;box-shadow:0 8px 30px rgba(0,0,0,.4);direction:rtl';
  const bs = on => `padding:5px 8px;border-radius:8px;border:none;cursor:pointer;font-size:12px;background:${on ? '#c9502e' : '#2d3444'};color:#fff`;
  const tb = (id, label, title) => `<button data-t="${id}" title="${title}" style="${bs(sketchMode.tool === id)}">${label}</button>`;
  const o = sketchSel != null ? (P.sketch.objs || [])[sketchSel] : null;
  bar.innerHTML = `<b style="font-size:12px;margin-left:2px">🖊</b>` +
    tb('select', '✋', 'בחירה והזזת אובייקטים') +
    tb('rect', '⬜ חדר', 'מלבן קירות — שתי לחיצות על פינות נגדיות') +
    tb('wall', '📏 קיר', 'קו קירות — לחץ נקודות, דאבל-קליק מסיים, Esc מבטל') +
    tb('erase', '🧽', 'מחיקת קיר — לחיצה על קיר מוחקת אותו') +
    `<span style="opacity:.35">|</span>` +
    Object.entries(SK_OBJS).map(([k, d]) => tb(k, d.n, 'הצבת ' + d.n + ' (' + d.w + '×' + d.h + ' מ׳) — לחיצה על התכנית')).join('') +
    (o ? `<span style="opacity:.35">|</span>
      <button title="סיבוב 45°" style="${bs(false)}" onclick="const o2=P.sketch.objs[sketchSel];o2.r=((o2.r||0)+45)%360;save();renderWires()">⟳</button>
      <button title="הגדלה" style="${bs(false)}" onclick="const o2=P.sketch.objs[sketchSel];o2.w*=1.15;o2.h*=1.15;save();renderWires()">＋</button>
      <button title="הקטנה" style="${bs(false)}" onclick="const o2=P.sketch.objs[sketchSel];o2.w/=1.15;o2.h/=1.15;save();renderWires()">－</button>
      <button title="מחיקת האובייקט המסומן" style="${bs(false)}" onclick="P.sketch.objs.splice(sketchSel,1);sketchSel=null;save();sketchBar();renderWires()">🗑</button>` : '') +
    `<button title="סיום — השרטוט נשאר על התכנית" style="padding:5px 10px;border-radius:8px;border:none;cursor:pointer;font-size:12px;background:#0f6e56;color:#fff;font-weight:700" onclick="sketchEnd()">✓ סיום</button>`;
  bar.querySelectorAll('[data-t]').forEach(b => { b.onclick = () => { sketchMode.tool = b.dataset.t; sketchMode.cur = []; sketchBar(); renderWires(); }; });
  document.body.appendChild(bar);
}
function sketchEnd() {
  sketchMode = null; sketchSel = null;
  const b = document.getElementById('sketchBar'); if (b) b.remove();
  renderWires();
  uiToast('✓ השרטוט נשמר — "🖊 ערוך שרטוט" בפאנל ההגדרות מחזיר את הכלים');
}
/* גרירת אובייקט שרטוט + בחירה */
document.addEventListener('pointerdown', e => {
  if (!sketchMode) return;
  const el = e.target.closest('[data-skobj]');
  if (!el) return;
  sketchSel = +el.dataset.skobj; sketchBar();
  const o = (P.sketch.objs || [])[sketchSel]; if (!o) return;
  const st = canvasPt(e), ox = o.x, oy = o.y;
  const mv = ev => { const p2 = canvasPt(ev); o.x = ox + p2.x - st.x; o.y = oy + p2.y - st.y; renderWires(); };
  const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); save(); };
  document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
  e.stopPropagation(); e.preventDefault();
}, true);
/* דאבל-קליק מסיים קיר */
document.addEventListener('dblclick', e => {
  if (!sketchMode || sketchMode.tool !== 'wall' || !e.target.closest('#canvasWrap')) return;
  const c = sketchMode.cur;
  if (c.length > 2) { const l = c[c.length - 1], p2 = c[c.length - 2]; if (Math.hypot(l.x - p2.x, l.y - p2.y) < 5) c.pop(); }
  if (c.length >= 2) { P.sketch.walls.push(c.slice()); save(); }
  sketchMode.cur = [];
  renderWires();
});
function canvasPt(e) {
  const r = $('#canvas').getBoundingClientRect();
  const Z = getZ();
  return { x: (e.clientX - r.left) / Z, y: (e.clientY - r.top) / Z };
}
document.addEventListener('click', e => {
  if (!e.target.closest('.dd')) document.querySelectorAll('.dd.open').forEach(d => d.classList.remove('open'));
});
let dragK = null, dragH = null, pendingU = null, dragU = null, uGhost = null;
/* ===== דיאלוגים בתוך הדף =====
   חלונות מערכת (alert/confirm/prompt) חסומים בשקט בדפדפנים משובצים —
   confirm מחזיר false, prompt מחזיר null, alert נבלע. כאן תחליפים מלאים. */
/* טולטיפ אוטומטי לכל אייקון בלי title — כך שריחוף תמיד מסביר מה הכפתור עושה */
const ICON_TIPS = { '✎': 'עריכה', '✕': 'סגירה / מחיקה', '×': 'סגירה', '🔄': 'החלפה / רענון', '↩': 'בטל (Undo)', '↪': 'בצע שוב (Redo)', '⤢': 'הרחב למסך מלא', '⤡': 'חזרה מהמסך המלא', '◀': 'צמצם הצידה', '▶': 'הרחב', '📌': 'נעיצה על התכנית', '🗑': 'מחיקה', '➕': 'הוספה', '＋': 'הגדלה', '－': 'הקטנה', '+': 'הגדלת תצוגה', '−': 'הקטנת תצוגה', '-': 'הקטנת תצוגה', '⟳': 'סיבוב', '🔓': 'שחרור נעילה', '🔒': 'נעול', '⚙': 'הגדרות', '📏': 'מדידה / כיול', '🔗': 'קישור לדף המוצר', '📄': 'מפרט PDF', '📘': 'מדריך משתמש', '⠿': 'גרירת החלון', '↺': 'איפוס', '💾': 'שמירה', '📥': 'ייבוא', '🔍': 'חיפוש' };
document.addEventListener('mouseover', e => {
  const b = e.target.closest('button, a');
  if (!b || b.title || b.getAttribute('aria-label')) return;
  const t = (b.textContent || '').trim();
  if (ICON_TIPS[t]) b.title = ICON_TIPS[t];
}, true);
function uiToast(msg) {
  let host = document.getElementById('toastHost');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toastHost';
    host.style.cssText = 'position:fixed;bottom:14px;right:14px;z-index:140;display:flex;flex-direction:column;gap:8px;max-width:min(440px,92vw)';
    document.body.appendChild(host);
  }
  const t = document.createElement('div');
  t.style.cssText = 'background:#1a1e28;color:#fff;padding:10px 14px;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.45);font-size:13px;line-height:1.5;white-space:pre-line;cursor:pointer';
  t.textContent = String(msg ?? '');
  t.onclick = () => t.remove();
  host.appendChild(t);
  setTimeout(() => { if (t.isConnected) t.remove(); }, 7000);
}
window.alert = uiToast; /* כל 48 קריאות alert() באפליקציה עוברות לטוסט */

/* ===================================================================================
   🪟 חלונות צפים — כל דיאלוג באפליקציה ניתן להזזה, כולל חלונות שייווצרו בעתיד.
   מנגנון גלובלי: MutationObserver מזהה כל שכבת-על חדשה שנוספת ל-body והופך את
   הקופסה שבתוכה לגרירה (ידית ⠿ + גרירה מכל אזור שאינו שדה/כפתור). המיקום נשמר
   לכל חלון לפי מפתח, ודאבל-קליק על הידית מחזיר למרכז. */
const FLOAT_SKIP = new Set(['patchOv', 'wiz', 'sketchBar', 'toastHost', 'marqBox', 'multiBar', 'instOvSkip']);
const FLOAT_OVS = new Set();
let FLOAT_Z = 140;
/* כשיותר מחלון אחד פתוח — הרקעים מפסיקים לחסום ולסגור, וכל חלון עומד בפני עצמו.
   כך אפשר לעבוד בשני חלונות במקביל (למשל קיט + טבלת תמחור) בלי שאחד יבלע את השני. */
function floatSync() {
  const live = [...FLOAT_OVS].filter(o => o.isConnected);
  FLOAT_OVS.clear(); live.forEach(o => FLOAT_OVS.add(o));
  const multi = live.length > 1;
  live.forEach(o => {
    if (multi && o.dataset.fbg == null) o.dataset.fbg = o.style.background || '';
    o.style.pointerEvents = multi ? 'none' : '';
    o.style.background = multi ? 'transparent' : (o.dataset.fbg != null ? o.dataset.fbg : o.style.background);
    const box = o.firstElementChild;
    if (box && box.nodeType === 1) box.style.pointerEvents = 'auto';
    if (!multi) delete o.dataset.fbg;
  });
}
function floatKey(box) {
  const ov = box.parentElement;
  const b = box.querySelector('b, h3, h4');
  return (ov && ov.id) || (b && b.textContent.trim().slice(0, 28)) || 'dlg';
}
function floatDialog(box, key) {
  if (!box || box.__float) return;
  box.__float = 1;
  const k = key || floatKey(box);
  store.floatPos = store.floatPos || {};
  const pos = { ...(store.floatPos[k] || { dx: 0, dy: 0 }) };
  const apply = () => {
    box.style.transform = 'translate(' + pos.dx + 'px,' + pos.dy + 'px)';
    /* לא נותנים לחלון לברוח מהמסך — לפחות 120px ממנו נשארים גלויים */
    const r = box.getBoundingClientRect();
    let fix = false;
    if (r.right < 120) { pos.dx += 120 - r.right; fix = true; }
    if (r.left > window.innerWidth - 120) { pos.dx -= r.left - (window.innerWidth - 120); fix = true; }
    if (r.bottom < 60) { pos.dy += 60 - r.bottom; fix = true; }
    if (r.top > window.innerHeight - 60) { pos.dy -= r.top - (window.innerHeight - 60); fix = true; }
    if (fix) box.style.transform = 'translate(' + pos.dx + 'px,' + pos.dy + 'px)';
  };
  if (getComputedStyle(box).position === 'static') box.style.position = 'relative';
  const ovEl = box.parentElement;
  if (ovEl) {
    FLOAT_OVS.add(ovEl);
    /* לחיצה על חלון מביאה אותו לחזית */
    box.addEventListener('pointerdown', () => { ovEl.style.zIndex = ++FLOAT_Z; }, true);
    floatSync();
  }
  const grip = document.createElement('div');
  grip.textContent = '⠿';
  grip.title = 'גרור להזזת החלון · דאבל-קליק מחזיר למרכז';
  grip.style.cssText = 'position:absolute;top:3px;left:6px;font-size:14px;color:#c2bbad;cursor:move;user-select:none;z-index:9;padding:2px 5px;line-height:1;border-radius:5px';
  grip.onmouseenter = () => grip.style.background = '#f0ede8';
  grip.onmouseleave = () => grip.style.background = '';
  grip.ondblclick = e => { e.stopPropagation(); pos.dx = pos.dy = 0; delete store.floatPos[k]; save(); apply(); };
  box.appendChild(grip);
  box.addEventListener('pointerdown', e => {
    if (e.button) return;
    if (e.target !== grip && e.target.closest('input,textarea,select,button,a,option,[contenteditable],[data-chip],[data-slot],[data-skobj]')) return;
    const sx = e.clientX, sy = e.clientY, ox = pos.dx, oy = pos.dy;
    let moved = false;
    const mv = ev => {
      pos.dx = ox + ev.clientX - sx; pos.dy = oy + ev.clientY - sy;
      if (!moved && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 3) { moved = true; box.style.cursor = 'grabbing'; }
      if (moved) apply();
    };
    const up = () => {
      document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up);
      box.style.cursor = '';
      if (moved) { store.floatPos[k] = { dx: pos.dx, dy: pos.dy }; save(); window.__floatDragT = Date.now(); }
    };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
  });
  if (pos.dx || pos.dy) apply();
}
/* לחיצה שמסיימת גרירה לא תיחשב כלחיצה על הרקע (שסוגרת את החלון) */
document.addEventListener('click', e => {
  if (window.__floatDragT && Date.now() - window.__floatDragT < 300) { e.stopPropagation(); window.__floatDragT = 0; }
}, true);
/* זיהוי אוטומטי של כל חלון קופץ חדש — גם כאלה שייכתבו בהמשך */
function floatScan(el) {
  if (!el || el.nodeType !== 1) return;
  if (FLOAT_SKIP.has(el.id)) return;
  const st = el.style.cssText || '';
  const isOv = el.classList.contains('uiDlgOv') || (/position\s*:\s*fixed/.test(st) && /inset\s*:\s*0/.test(st) && el.children.length === 1);
  if (isOv) { const box = el.firstElementChild; if (box && box.nodeType === 1) floatDialog(box); }
}
new MutationObserver(ms => {
  ms.forEach(m => m.addedNodes.forEach(floatScan));
  if (ms.some(m => m.removedNodes.length)) floatSync();
}).observe(document.body, { childList: true });
document.querySelectorAll('body > div').forEach(floatScan);
function uiModal(inner) { /* בסיס משותף: מחזיר {ov, box} */
  const ov = document.createElement('div');
  ov.className = 'uiDlgOv';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(20,24,32,.45);z-index:135;display:flex;align-items:center;justify-content:center';
  ov.innerHTML = `<div style="background:#fff;border-radius:12px;padding:16px;max-width:380px;width:92%;box-shadow:0 12px 40px rgba(0,0,0,.4)">${inner}</div>`;
  document.body.appendChild(ov);
  return ov;
}
function uiConfirm(msg, opts = {}) {
  return new Promise(res => {
    const ov = uiModal(`
      <p style="font-size:13.5px;margin:0 0 12px;line-height:1.55;white-space:pre-line">${esc(msg)}</p>
      <div style="display:flex;gap:6px">
        <button class="primary" data-ok style="flex:1">${esc(opts.okText || 'אישור')}</button>
        <button data-cancel style="flex:1">${esc(opts.cancelText || 'ביטול')}</button>
      </div>`);
    const done = v => { ov.remove(); res(v); };
    ov.querySelector('[data-ok]').onclick = () => done(true);
    ov.querySelector('[data-cancel]').onclick = () => done(false);
    ov.addEventListener('click', e => { if (e.target === ov) done(false); });
  });
}
function uiPrompt(msg, def = '', opts = {}) {
  return new Promise(res => {
    const ov = uiModal(`
      <p style="font-size:13.5px;margin:0 0 10px;line-height:1.55;white-space:pre-line">${esc(msg)}</p>
      <input data-in style="width:100%;font-size:16px;padding:8px;box-sizing:border-box" type="${opts.type || 'text'}">
      <div style="display:flex;gap:6px;margin-top:10px">
        <button class="primary" data-ok style="flex:1">אישור</button>
        <button data-cancel style="flex:1">ביטול</button>
      </div>`);
    const inp = ov.querySelector('[data-in]');
    inp.value = def ?? '';
    const done = v => { ov.remove(); res(v); };
    ov.querySelector('[data-ok]').onclick = () => done(inp.value);
    ov.querySelector('[data-cancel]').onclick = () => done(null);
    ov.addEventListener('click', e => { if (e.target === ov) done(null); });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') done(inp.value); if (e.key === 'Escape') done(null); });
    setTimeout(() => inp.focus(), 50);
  });
}
/* דיאלוג הזנת המרחק לכיול — שדה בתוך הדף במקום prompt() (חסום בדפדפנים משובצים) */
function showCalDialog(px, p1, p2) {
  const old = document.getElementById('calOv');
  if (old) old.remove();
  const ov = document.createElement('div');
  ov.id = 'calOv';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(20,24,32,.45);z-index:120;display:flex;align-items:center;justify-content:center';
  ov.addEventListener('click', e => { if (e.target === ov) { ov.remove(); render(); } });
  ov.innerHTML = `<div style="background:#fff;border-radius:12px;padding:16px;max-width:360px;width:92%;box-shadow:0 12px 40px rgba(0,0,0,.4)">
    <b style="font-size:15px">📏 כיול קנה מידה</b>
    <p style="font-size:12.5px;margin:8px 0;line-height:1.5">נמדדו <b>${Math.round(px)}px</b> בין שתי הנקודות.<br>מה המרחק האמיתי? מטרים (למשל 16) או ישר מהמידה בתכנית במ״מ (16000) — אזהה לבד.</p>
    <input id="calMIn" type="number" step="any" min="0" inputmode="decimal" placeholder="מרחק" style="width:100%;font-size:17px;padding:8px;box-sizing:border-box" value="${P.scale ? (px * P.scale).toFixed(1) : ''}">
    <div style="display:flex;gap:6px;margin-top:10px">
      <button class="primary" id="calOkBtn" style="flex:1">✓ קבע קנה מידה</button>
      <button style="flex:1" onclick="document.getElementById('calOv').remove()">ביטול</button>
    </div>
  </div>`;
  document.body.appendChild(ov);
  const inp = ov.querySelector('#calMIn');
  const ok = () => {
    let m = parseFloat(inp.value);
    ov.remove();
    if (m > 0 && px > 2) {
      /* תכניות בנייה בד"כ במ״מ: 16000 = 16 מ׳; 100-999 = ס״מ */
      if (m >= 1000) m = m / 1000;
      else if (m >= 100) m = m / 100;
      P.scale = m / px;
      P.calLine = { p1, p2 }; /* קו הכיול נשאר על התכנית */
      recalcCableLengths();
      save();
    }
    render();
  };
  ov.querySelector('#calOkBtn').onclick = ok;
  inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') ok(); if (ev.key === 'Escape') { ov.remove(); render(); } });
  setTimeout(() => inp.focus(), 50);
}
document.addEventListener('pointerdown', e => {
  /* גרירת/שינוי גודל אזור סאונד */
  const zd = e.target.closest('[data-zdrag]');
  if (zd) {
    const z = (P.zones || []).find(z => z.id === zd.dataset.zdrag);
    if (z) { selZone = z.id; dragZ = { z, sx: e.clientX, sy: e.clientY, ox: z.x, oy: z.y, opoly: z.poly ? z.poly.map(p => ({ ...p })) : null }; e.preventDefault(); return; }
  }
  const zs = e.target.closest('[data-zsize]');
  if (zs) {
    const z = (P.zones || []).find(z => z.id === zs.dataset.zsize);
    if (z) { sizeZ = { z, sx: e.clientX, sy: e.clientY, ow: z.w, oh: z.h }; e.preventDefault(); return; }
  }
  /* ציור אזור סאונד — ניקור נקודות עד סגירת הצורה */
  if (sketchMode && e.target.closest('#canvasWrap') && !e.target.closest('#sketchBar') && !e.target.closest('[data-skobj]')) {
    const p2 = canvasPt(e);
    if (sketchMode.tool === 'wall') {
      const c = sketchMode.cur, TH = 10 / (getZ() || 1);
      /* לחיצה על נקודה קיימת מסיימת — הראשונה סוגרת מסלול, האחרונה משחררת */
      if (c.length) {
        const hit = c.findIndex(pt => Math.hypot(pt.x - p2.x, pt.y - p2.y) < TH);
        if (hit === 0 && c.length > 2) { P.sketch.walls.push(c.concat([{ x: c[0].x, y: c[0].y }])); sketchMode.cur = []; sketchMode.cur2 = null; save(); renderWires(); uiToast('✓ מסלול נסגר'); return; }
        if (hit >= 0) { if (c.length >= 2) { P.sketch.walls.push(c.slice()); save(); } sketchMode.cur = []; sketchMode.cur2 = null; renderWires(); uiToast('✓ הקיר הסתיים — אפשר להתחיל קיר חדש'); return; }
      }
      c.push(p2); renderWires(); return;
    }
    if (sketchMode.tool === 'rect') {
      sketchMode.cur.push(p2);
      if (sketchMode.cur.length === 2) {
        const [a2, b2] = sketchMode.cur;
        P.sketch.walls.push([{ x: a2.x, y: a2.y }, { x: b2.x, y: a2.y }, { x: b2.x, y: b2.y }, { x: a2.x, y: b2.y }, { x: a2.x, y: a2.y }]);
        sketchMode.cur = []; sketchMode.cur2 = null; save();
      }
      renderWires(); return;
    }
    if (SK_OBJS[sketchMode.tool]) {
      const d2 = SK_OBJS[sketchMode.tool];
      const pxm = 1 / (P.scale || 0.02);
      P.sketch.objs.push({ t: sketchMode.tool, x: p2.x, y: p2.y, w: d2.w * pxm, h: d2.h * pxm, r: 0 });
      sketchSel = P.sketch.objs.length - 1;
      sketchMode.tool = 'select'; sketchBar(); save(); renderWires(); return;
    }
    if (sketchMode.tool === 'select') { sketchSel = null; sketchBar(); renderWires(); }
    return;
  }
  if (zoneMode && e.target.closest('#canvasWrap')) {
    const pt = canvasPt(e);
    zoneMode.poly = zoneMode.poly || [];
    if (zoneMode.poly.length > 2 && Math.hypot(pt.x - zoneMode.poly[0].x, pt.y - zoneMode.poly[0].y) < 15 / getZ()) {
      closeZonePoly();
    } else {
      zoneMode.poly.push(pt);
      renderWires();
    }
    e.preventDefault();
    return;
  }
  /* כיול קנה מידה — שתי לחיצות על נקודות שהמרחק ביניהן ידוע */
  if (calMode && e.target.closest('#canvasWrap')) {
    calMode.pts.push(canvasPt(e));
    if (calMode.pts.length === 2) {
      const [p1, p2] = calMode.pts;
      const px = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      calMode = null;
      showCalDialog(px, p1, p2); /* דיאלוג בתוך הדף — prompt() חסום בדפדפנים משובצים */
      render();
    }
    e.preventDefault();
    return;
  }
  /* נעיצת מחבר על קצה כבל קרוב */
  if (connPin && e.target.closest('#canvasWrap')) {
    const it = impItems.find(x => x.iid === connPin.iid);
    if (it) {
      const pt = canvasPt(e);
      let best = null;
      for (const c of P.cables) {
        const w = WIREPTS[c.id]; if (!w) continue;
        for (const [end, p] of [['from', w.a], ['to', w.b]]) {
          const d2 = (p.x - pt.x) ** 2 + (p.y - pt.y) ** 2;
          if (d2 < 50 * 50 && (!best || d2 < best.d2)) best = { c, end, d2 };
        }
      }
      if (best) {
        const s = ensureStockItem(it);
        s.used = (s.used || 0) + 1;
        const kind = s.kind || connKindOf(it.name) || 'xlrf';
        s.kind = kind;
        if (best.end === 'from') best.c.conn = kind; else best.c.conn2 = kind;
        bumpPlaced(it); /* הכמות בתכנית עולה עם כל נעיצת מחבר */
        if (s.used > s.qty) s.qty = s.used;
        render();
      }
    }
    e.preventDefault();
    return;
  }
  /* מצב נעיצה — כל לחיצה על הקנבס נועצת עותק נוסף */
  /* מיקום מיקרופון מדידה */
  if (window.__micPlace && e.target.closest('#canvasWrap')) {
    const pt = canvasPt(e);
    window.__micPlace = null;
    P.nodes.push({ id: uid('n'), kind: 'point', ptype: 'mic', name: 'מיקרופון מדידה', sub: 'נק׳ מדידה', x: 2200 - pt.x - 20, y: pt.y - 24, mini: true, noCov: true });
    render(); save();
    const pw = document.getElementById('patchBox');
    if (pw) { pw.style.opacity = ''; if (typeof patchRender === 'function' && PATCH) patchRender(); uiToast('🎙 נקודת הייחוס הוצבה — הדיליי חושב מחדש ממנה'); }
    e.preventDefault();
    return;
  }
  /* מיקום עמדת נגינה — קליק על התכנית */
  if (window.__djPlace && e.target.closest('#canvasWrap')) {
    const pt = canvasPt(e);
    const z = (P.zones || []).find(x => x.id === window.__djPlace.zid);
    window.__djPlace = null;
    if (z) {
      let dj = z._djNodeId && byId(z._djNodeId);
      if (dj) { dj.x = 2200 - pt.x - 20; dj.y = pt.y - 24; }
      else { dj = { id: uid('n'), kind: 'panel', name: 'עמדת נגינה (DJ) · ' + z.name, sub: 'פאנל מולטי בעמדה', x: 2200 - pt.x - 24, y: pt.y - 24, pmin: true, mount: 'עמדה', panel: { mode: 'matrix', holes: Array.from({ length: 8 }, (_, i) => ({ conn: i < 6 ? 'xlrf' : 'rj45' })) } }; P.nodes.push(dj); z._djNodeId = dj.id; }
      sel = dj.id; render(); save();
    }
    e.preventDefault();
    return;
  }
  /* מיקום ריכוז מגברים לאזור — קליק על התכנית */
  if (window.__rackPlace && e.target.closest('#canvasWrap')) {
    const pt = canvasPt(e);
    const z = (P.zones || []).find(x => x.id === window.__rackPlace.zid);
    window.__rackPlace = null;
    if (z) {
      let rk = z._rackNodeId && byId(z._rackNodeId);
      if (rk) { rk.x = 2200 - pt.x - 24; rk.y = pt.y - 24; }
      else { rk = { id: uid('n'), kind: 'rack', name: 'ריכוז מגברים · ' + z.name, sub: '', x: 2200 - pt.x - 24, y: pt.y - 24, ru: 12, units: [], min: true }; P.nodes.push(rk); z._rackNodeId = rk.id; }
      sel = rk.id; render(); save();
    }
    e.preventDefault();
    return;
  }
  if (pinMode && e.target.closest('#canvasWrap')) {
    const it = impItems.find(x => x.iid === pinMode.iid);
    const nel = e.target.closest('.node');
    /* לחיצה על מוקד שכבר ננקר מאותו פריט → עריכה שלו (מצב הנעיצה נשאר פעיל; קליק על התכנית ימשיך לנקר) */
    if (nel) { const tn = byId(nel.id.slice(3)); if (tn && tn.kind === 'point' && tn.srcIid === pinMode.iid) { sel = tn.id; ui.tab = 'node'; e.preventDefault(); render(); return; } }
    if (it) {
      dropImported(it, canvasPt(e), nel, e.clientY);
      /* מגבר/פרוססור/ציוד ראק — נעיצה בודדת: שחרור אוטומטי אחרי לחיצה אחת */
      if (it.dest === 'unit' || it.dest === 'panelUnit') { pinMode = null; render(); }
    }
    e.preventDefault();
    return;
  }
  const h = e.target.closest('[data-dragi]');
  if (!h) return;
  const it = impItems[+h.dataset.dragi];
  if (!it) return;
  dragI = { it, moved: false };
  uGhost = document.createElement('div');
  uGhost.id = 'ughost';
  uGhost.textContent = '📦 ' + it.name.slice(0, 40);
  uGhost.style.left = (e.clientX + 12) + 'px';
  uGhost.style.top = (e.clientY + 12) + 'px';
  document.body.appendChild(uGhost);
  e.preventDefault();
});
document.addEventListener('pointermove', e => {
  if (!dragI) return;
  dragI.moved = true;
  uGhost.style.left = (e.clientX + 12) + 'px';
  uGhost.style.top = (e.clientY + 12) + 'px';
  document.querySelectorAll('.node.droptgt').forEach(el => el.classList.remove('droptgt'));
  const hit = document.elementFromPoint(e.clientX, e.clientY);
  const nel = hit && hit.closest('.node');
  if (nel && (dragI.it.dest === 'unit' || dragI.it.dest === 'panelUnit')) {
    const tn = byId(nel.id.slice(3));
    if (tn && tn.kind === 'rack') nel.classList.add('droptgt');
  }
});
document.addEventListener('pointerup', e => {
  if (!dragI) return;
  const di = dragI; dragI = null;
  if (uGhost) { uGhost.remove(); uGhost = null; }
  document.querySelectorAll('.node.droptgt').forEach(el => el.classList.remove('droptgt'));
  if (!di.moved) return;
  const overCanvas = document.elementFromPoint(e.clientX, e.clientY)?.closest('#canvasWrap');
  if (!overCanvas) return;
  const hit = document.elementFromPoint(e.clientX, e.clientY);
  const nel = hit && hit.closest('.node');
  dropImported(di.it, canvasPt(e), nel, e.clientY);
});
function moveUnit(srcId, unitId, dstId, slot) {
  const src = byId(srcId), dst = byId(dstId);
  const idx = src.units.findIndex(u => u.id === unitId);
  if (idx < 0) return;
  const u = src.units[idx];
  const skip = src === dst ? idx : -1;
  let pos = null;
  for (let d = 0; d < dst.ru && pos === null; d++)
    for (const cand of [slot - d, slot + d]) {
      if (cand < 0 || cand + u.u > dst.ru) continue;
      if (fits(dst, cand, u.u, skip)) { pos = cand; break; }
    }
  if (pos === null) { alert('אין מקום פנוי בארון "' + dst.name + '" — הגדל את גובהו'); render(); return; }
  if (dst !== src) {
    src.units.splice(idx, 1);
    u.pos = pos;
    dst.units.push(u);
    /* התשתיות עוברות עם המוצר — עדכון כל הכבלים שמחוברים אליו */
    let moved = 0;
    P.cables.forEach(c => {
      if (c.fromUnit === u.id && c.from !== dst.id) { c.from = dst.id; moved++; }
      if (c.toUnit === u.id && c.to !== dst.id) { c.to = dst.id; moved++; }
    });
    render();
    if (moved) alert('"' + u.name + '" עבר לארון "' + dst.name + '" · ' + moved + ' חיבורים עודכנו ועברו איתו');
  } else {
    u.pos = pos;
    render();
  }
}
document.addEventListener('pointerdown', e => {
  const hl = e.target.closest('[data-hole]');
  if (hl) {
    const [nid, uiS, idxS] = hl.dataset.hole.split('|');
    const p = panelOf(nid, +uiS);
    const h = p && p.holes[+idxS];
    if (!h) return;
    if (labelMode) {
      uiPrompt('שם לחור ' + (+idxS + 1) + ' (למשל Main L):', h.label || '').then(v => {
        if (v !== null) h.label = v.trim() || undefined;
        render();
      });
      return;
    }
    if (p.mode === 'free') {
      dragH = { h, nid, ui: +uiS, idx: +idxS, el: hl.closest('.hcell') || hl, sx: e.clientX, sy: e.clientY, ox: h.x || 0, oy: h.y || 0, moved: false };
      e.preventDefault();
    } else {
      holeTap(nid, +uiS, +idxS, h);
    }
    return;
  }
  const ck = e.target.closest('[data-corner]');
  if (ck) {
    const [cid, end] = ck.dataset.corner.split('|');
    const c = cById(cid);
    dragK = { c, end, sx: e.clientX, sy: e.clientY, odx: c.bend?.dx || 0, oa: c.aoff?.[end] || 0 };
    e.preventDefault();
    return;
  }
  const ce = e.target.closest('[data-cend]');
  if (ce) {
    const [cid, end] = ce.dataset.cend.split('|');
    dragE = { c: cById(cid), end, cur: null, moved: false };
    e.preventDefault();
    return;
  }
  const cb = e.target.closest('[data-cbadge]');
  if (cb) {
    const c = cById(cb.dataset.cbadge);
    dragC = { c, sx: e.clientX, sy: e.clientY, odx: c.bend?.dx || 0, ody: c.bend?.dy || 0, moved: false };
    e.preventDefault();
    return;
  }
  const h = e.target.closest('[data-drag]');
  if (!h) {
    /* גרירה על שטח ריק בקנבס = בחירת ריבוע (marquee) */
    if (e.target.closest('#canvasWrap') && !e.target.closest('.node') && !e.target.closest('[data-zdrag]') && !e.target.closest('[data-zsize]') && !pinMode && !wireMode && !calMode && !zoneMode && !connPin) {
      const pt = canvasPt(e);
      marq = { x0: pt.x, y0: pt.y, x1: pt.x, y1: pt.y, moved: false };
      selMulti.clear();
      e.preventDefault();
    }
    return;
  }
  const n = byId(h.dataset.drag);
  sel = n.id; ui.tab = 'node';
  drag = { n, sx: e.clientX, sy: e.clientY, ox: n.x, oy: n.y };
  e.preventDefault();
});
document.addEventListener('pointermove', e => {
  const Z = getZ();
  if (dragZ) {
    const dx = (e.clientX - dragZ.sx) / Z, dy = (e.clientY - dragZ.sy) / Z;
    dragZ.z.x = Math.max(0, dragZ.ox - dx);
    dragZ.z.y = Math.max(0, dragZ.oy + dy);
    if (dragZ.opoly) dragZ.z.poly = dragZ.opoly.map(p => ({ x: p.x + dx, y: p.y + dy }));
    renderZones();
    return;
  }
  if (sizeZ) {
    sizeZ.z.w = Math.max(80, sizeZ.ow - (e.clientX - sizeZ.sx) / Z);
    sizeZ.z.h = Math.max(50, sizeZ.oh + (e.clientY - sizeZ.sy) / Z);
    renderZones();
    return;
  }
  if (marq) {
    const pt = canvasPt(e);
    marq.x1 = pt.x; marq.y1 = pt.y; marq.moved = true;
    const x0 = Math.min(marq.x0, marq.x1), x1 = Math.max(marq.x0, marq.x1);
    const y0 = Math.min(marq.y0, marq.y1), y1 = Math.max(marq.y0, marq.y1);
    selMulti.clear();
    for (const n of P.nodes) {
      if (n.kind !== 'point') continue;
      const nx = 2200 - n.x - 20, ny = n.y + 24; /* מרכז משוער */
      if (nx >= x0 && nx <= x1 && ny >= y0 && ny <= y1) selMulti.add(n.id);
    }
    let m = document.getElementById('marqBox');
    if (!m) { m = document.createElement('div'); m.id = 'marqBox'; m.style.cssText = 'position:absolute;border:1.5px dashed #c9502e;background:rgba(201,80,46,.12);z-index:40;pointer-events:none'; $('#canvas').appendChild(m); }
    m.style.left = x0 + 'px'; m.style.top = y0 + 'px'; m.style.width = (x1 - x0) + 'px'; m.style.height = (y1 - y0) + 'px';
    document.querySelectorAll('.node').forEach(el => { const id = el.id.slice(3); el.style.outline = selMulti.has(id) ? '2.5px solid #c9502e' : ''; });
    return;
  }
  if (sketchMode && (sketchMode.tool === 'wall' || sketchMode.tool === 'rect') && sketchMode.cur.length) {
    sketchMode.cur2 = canvasPt(e);
    renderWires();
    return;
  }
  if (zoneMode && zoneMode.poly && zoneMode.poly.length) {
    zoneMode.cur = canvasPt(e);
    renderWires();
    return;
  }
  if (calMode && calMode.pts.length === 1) {
    calMode.cur = canvasPt(e);
    renderWires();
    return;
  }
  if (pendingU && !dragU && Math.abs(e.clientX - pendingU.sx) + Math.abs(e.clientY - pendingU.sy) > 6) {
    dragU = pendingU; pendingU = null;
    uGhost = document.createElement('div');
    uGhost.id = 'ughost';
    uGhost.textContent = '🗄 ' + dragU.name;
    document.body.appendChild(uGhost);
  }
  if (dragU) {
    uGhost.style.left = (e.clientX + 12) + 'px';
    uGhost.style.top = (e.clientY + 12) + 'px';
    document.querySelectorAll('.node.droptgt').forEach(el => el.classList.remove('droptgt'));
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    const nel = hit && hit.closest('.node');
    if (nel) {
      const tn = byId(nel.id.slice(3));
      if (tn && tn.kind === 'rack' && !tn.rear) nel.classList.add('droptgt');
    }
    return;
  }
  if (dragH) {
    dragH.h.x = Math.max(0, dragH.ox + (e.clientX - dragH.sx) / Z);
    dragH.h.y = Math.max(0, dragH.oy + (e.clientY - dragH.sy) / Z);
    dragH.el.style.left = dragH.h.x + 'px';
    dragH.el.style.top = dragH.h.y + 'px';
    dragH.moved = true;
    return;
  }
  if (dragK) {
    dragK.c.bend = { dx: dragK.odx + (e.clientX - dragK.sx) / Z, dy: dragK.c.bend?.dy || 0 };
    dragK.c.aoff = { ...dragK.c.aoff, [dragK.end]: dragK.oa + (e.clientY - dragK.sy) / Z };
    renderWires();
    return;
  }
  if (dragE) {
    dragE.cur = canvasPt(e);
    dragE.moved = true;
    renderWires();
    return;
  }
  if (dragC) {
    const dx = (e.clientX - dragC.sx) / Z, dy = (e.clientY - dragC.sy) / Z;
    if (Math.abs(dx) + Math.abs(dy) > 3) dragC.moved = true;
    dragC.c.bend = { dx: dragC.odx + dx, dy: dragC.ody + dy };
    renderWires();
    return;
  }
  if (!drag) return;
  drag.n.x = Math.max(0, drag.ox - (e.clientX - drag.sx) / Z);
  drag.n.y = Math.max(0, drag.oy + (e.clientY - drag.sy) / Z);
  /* קווי יישור: כשהמוקד הנגרר מתיישר עם רמקול/סאב אחר — קו מנחה + הצמדה */
  window.__alignG = null;
  if (drag.n.kind === 'point') {
    const TH = 8 / Z;
    let gx = null, gy = null;
    for (const nn of P.nodes) {
      if (nn === drag.n || nn.kind !== 'point') continue;
      if (gx == null && Math.abs(nn.x - drag.n.x) < TH) gx = nn.x;
      if (gy == null && Math.abs(nn.y - drag.n.y) < TH) gy = nn.y;
    }
    if (gx != null) drag.n.x = gx;
    if (gy != null) drag.n.y = gy;
    if (gx != null || gy != null) window.__alignG = { x: gx, y: gy };
  }
  const el = document.getElementById('nd_' + drag.n.id);
  el.style.right = drag.n.x + 'px';
  el.style.top = drag.n.y + 'px';
  renderWires();
  /* עורך החיווט פתוח? הדיליי והעומסים מתעדכנים חי תוך כדי גרירה */
  if (PATCH && document.getElementById('patchBody') && !window.__pchT) {
    window.__pchT = requestAnimationFrame(() => { window.__pchT = null; if (PATCH) patchRender(); });
  }
});
document.addEventListener('pointerup', e => {
  if (marq) {
    const m = document.getElementById('marqBox'); if (m) m.remove();
    const had = marq.moved && selMulti.size;
    marq = null;
    if (had) { sel = null; selCable = null; render(); showMultiBar(); }
    return;
  }
  if (dragZ || sizeZ) { dragZ = sizeZ = null; render(); return; }
  if (dragU) {
    const du = dragU; dragU = null;
    if (uGhost) { uGhost.remove(); uGhost = null; }
    document.querySelectorAll('.node.droptgt').forEach(el => el.classList.remove('droptgt'));
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    const nel = hit && hit.closest('.node');
    if (nel) {
      const dst = byId(nel.id.slice(3));
      if (dst && dst.kind === 'rack' && !dst.rear) {
        const rails = nel.querySelector('.rails');
        const rr = rails.getBoundingClientRect();
        const slot = Math.max(0, Math.min(dst.ru - 1, Math.floor((e.clientY - rr.top) / (rr.height / dst.ru))));
        moveUnit(du.nid, du.uid, dst.id, slot);
        return;
      }
    }
    render();
    return;
  }
  pendingU = null;
  if (dragH) {
    if (!dragH.moved) { holeTap(dragH.nid, dragH.ui, dragH.idx, dragH.h); dragH = null; return; }
    dragH = null; render();
    return;
  }
  if (window.__alignG) { window.__alignG = null; renderWires(); }
  if (dragK) { dragK = null; render(); return; }
  if (dragE) {
    const de = dragE; dragE = null;
    if (!de.moved) { selCable = de.c.id; ui.tab = 'cable'; render(); return; }
    const svg = $('#wires');
    svg.style.display = 'none';
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    svg.style.display = '';
    const nel = hit && hit.closest('.node');
    if (!nel) { render(); return; }
    const node = byId(nel.id.slice(3));
    let unitId, portName;
    /* רמת החיבור נקבעת ממה שנחת עליו: מחבר > מכשיר > ארון.
       כך אפשר לגרור קצה כבל מהארון אל מכשיר, ומשם אל מחבר ספציפי — ובחזרה. */
    const cportEl = hit && hit.closest('[data-cport]');
    if (cportEl) {
      const [uid2, prt] = cportEl.dataset.cport.split('|');
      unitId = uid2; portName = prt;
    } else {
      const holeEl = hit && hit.closest('[data-hole]');
      if (holeEl && node.kind === 'panel') {
        const parts = holeEl.dataset.hole.split('|');
        portName = 'חור ' + (+parts[2] + 1);
      } else {
        const uEl = hit && hit.closest('[data-uid],[data-runit]');
        if (uEl) unitId = uEl.dataset.uid || uEl.dataset.runit;
        else if (node.kind === 'rack' && !node.rear) {
          const rails = nel.querySelector('.rails');
          if (rails) {
            const rr = rails.getBoundingClientRect();
            if (e.clientY >= rr.top && e.clientY <= rr.bottom) {
              const slot = Math.floor((e.clientY - rr.top) / (rr.height / node.ru));
              unitId = node.units.find(u => slot >= u.pos && slot < u.pos + u.u)?.id;
            }
          }
        }
      }
    }
    const same = de.c[de.end] === node.id && (de.c[de.end + 'Unit'] || undefined) === unitId
      && (de.c[de.end === 'from' ? 'pOut' : 'pIn'] || undefined) === portName;
    if (same) { render(); return; }
    const uObj = unitId && (node.units || []).find(u => u.id === unitId);
    const lvlTxt = portName ? '🔌 מחבר' : unitId ? '📦 מכשיר' : '🗄 ארון';
    const tgtName = node.name + (uObj ? ' · ' + uObj.name : '') + (portName ? ' · ' + portName : '') + '  [' + lvlTxt + ']';
    $('#mtxt').textContent = 'חיבור אל: ' + tgtName;
    $('#modal').style.display = 'flex';
    modalCb = act => {
      const pKey = de.end === 'from' ? 'pOut' : 'pIn';
      if (act === 'move') {
        de.c[de.end] = node.id;
        de.c[de.end + 'Unit'] = unitId;
        de.c[pKey] = portName;                 /* undefined מנקה — כך חוזרים לרמת ארון */
        if (de.end === 'from') de.c.fromHole = undefined; else de.c.toHole = undefined;
        if (P.scale) { const na = byId(de.c.from), nb = byId(de.c.to); if (na && nb && na !== nb && !de.c.lenManual) de.c.len = +(Math.hypot(na.x - nb.x, na.y - nb.y) * P.scale).toFixed(1); }
      } else if (act === 'chain') {
        const oldNode = de.c[de.end], oldUnit = de.c[de.end + 'Unit'];
        P.cables.push({ id: uid('c'), from: oldNode, fromUnit: oldUnit, to: node.id, toUnit: unitId,
          pIn: portName, type: de.c.type, qty: '1', spec: de.c.spec, note: 'שרשור', dir: de.c.dir });
      }
      render(); save();
    };
    return;
  }
  if (dragC) {
    if (!dragC.moved) { selCable = dragC.c.id; ui.tab = 'cable'; }
    dragC = null; render();
    return;
  }
  if (drag) { const moved = drag; drag = null; recalcCableLengths(); render(); save(); }
});
/* מחשב מחדש אורכי כבלים לפי מיקומי המוקדים הנוכחיים (אחרי הזזה) + מעדכן ניצול גלילים */
function recalcCableLengths() {
  if (!P.scale) return;
  (P.cables || []).forEach(c => {
    if (c.lenManual) return; /* אורך שהוזן ידנית — לא נדרס */
    const a = byId(c.from), b = byId(c.to);
    if (a && b && a !== b) c.len = +(Math.hypot(a.x - b.x, a.y - b.y) * P.scale).toFixed(1);
  });
  /* ניצול גלילים מחדש מאפס לפי אורכי הכבלים המעודכנים */
  if (P.stock && P.stock.reels) {
    P.stock.reels.forEach(r => r.used = 0);
    (P.cables || []).forEach(c => {
      if (c.stockRef && c.stockRef.startsWith('reel|')) {
        const r = P.stock.reels.find(s => s.id === c.stockRef.split('|')[1]);
        if (r) r.used = (r.used || 0) + (+c.len || 0);
      }
    });
  }
}
function modalPick(act) {
  $('#modal').style.display = 'none';
  const cb = modalCb; modalCb = null;
  if (cb) cb(act);
}

/* io */
function exportJSON() {
  const blob = new Blob([JSON.stringify(P, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (P.name || 'project') + '.json';
  a.click();
}
function importJSON() {
  const f = $('#fileIn');
  f.onchange = () => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const p = JSON.parse(r.result);
        p.id = uid('p');
        store.projects.push(p);
        P = p; sel = selCable = null; normalizeAll(); impItems = P.impSaved || []; render();
      } catch { alert('קובץ לא תקין'); }
    };
    r.readAsText(f.files[0]);
    f.value = '';
  };
  f.click();
}
/* ---- גיבוי/שחזור מלא — כל ה-store (פרויקטים + ספריות) בקובץ אחד, למעבר בין דפדפנים/דומיינים ---- */
function exportBackup() {
  const payload = { app: 'ko-projects', kind: 'full-backup', v: 1, savedAt: new Date().toISOString(), store };
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ko-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
}
function importBackup() {
  const f = $('#fileIn');
  f.onchange = () => {
    const r = new FileReader();
    r.onload = async () => {
      try {
        const b = JSON.parse(r.result);
        const s = b && b.kind === 'full-backup' ? b.store : b; // גם store גולמי מה-console מתקבל
        if (!s || !Array.isArray(s.projects) || !s.projects.length) { alert('קובץ לא תקין — לא נמצאו פרויקטים'); return; }
        const replace = await uiConfirm('שחזור מגיבוי (' + s.projects.length + ' פרויקטים) — איך לשחזר?', { okText: 'החלף את הכל', cancelText: 'הוסף לצד הקיימים' });
        if (replace) store = s;
        else {
          for (const p of s.projects) { p.id = uid('p'); store.projects.push(p); }
          if (s.spkLib && !store.spkLib) store.spkLib = s.spkLib;
        }
        P = store.projects.find(p => p.id === store.cur) || store.projects[0];
        sel = null; selCable = null; selMulti.clear(); normalizeAll(); impItems = P.impSaved || [];
        render(); save();
        alert('✓ שוחזרו ' + s.projects.length + ' פרויקטים');
      } catch { alert('קובץ לא תקין'); }
    };
    r.readAsText(f.files[0]);
    f.value = '';
  };
  f.click();
}
function esc(s) { return String(s ?? '').replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }

/* ---- ייבוא מפרט / הצעת מחיר ---- */
let impItems = [];
const SPEC_DICT = [
  { re: /(פרוססור|פרוסֵסור|processor|מעבד\s?אות|DSP|DIGISYNTHETIC|DPA\s?\d|DS\s?4\d\d|418E?|קרוסאובר|crossover|matrix\s?processor)/i, dest: 'unit', cat: 'audio', u: 1 },
  { re: /(IPX|IX\s?\d0|PLM|D\s?series|מגבר|amplif)/i, dest: 'unit', cat: 'amp', u: 2 },
  { re: /(SPECTRA|GRAVIS|NOMOS|CA\s?-?106|PASSIO|SEQUENZA|רמקול|סאב|סב-?וופר|subwoofer|\bsub\b|speaker|מוניטור|line\s?array|קולונ|column)/i, dest: 'point' },
  { re: /(מולטי|stage\s?box|stagebox|פא?נל\s?קיר|wall\s?plate)/i, dest: 'panelNode' },
  { re: /(פא?נל|panel|patch|ניתוב)/i, dest: 'panelUnit', cat: 'patch', u: 1 },
  { re: /(ראוטר|router|switch|סוויץ|aruba|access\s?point|רשת)/i, dest: 'unit', cat: 'net', u: 1 },
  { re: /(ספליטר|splitter|node|תאורה|dimmer)/i, dest: 'unit', cat: 'light', u: 1 },
  { re: /(מקרן|projector|מסך|screen)/i, dest: 'point' },
  { re: /(מיקסר|console|mixer|רק\s?יחידת)/i, dest: 'unit', cat: 'audio', u: 4 },
  { re: /(DSP|processor|מעבד|הנגשת|bettear|מקלט|receiver|אלחוטי|wireless|אינטרקום|clear-?com)/i, dest: 'unit', cat: 'audio', u: 1 },
  { re: /(ניתוב\s?וידאו|matrix|SDI\s?router|סקיילר|scaler|שרת|server|media)/i, dest: 'unit', cat: 'video', u: 2 },
  { re: /(כבל|cable|NL4\b|Cat\s?6|XLR\b|קונקטור|connector|מחבר|תעלה|צנרת|התקנה|עבודה|שירות|אחריות|הובלה)/i, dest: 'ignore' },
];
/* זיהוי כבלים מוכנים, גלילים, מחברים וארונות מסד בהצעות */
function cabTypeOf(s) {
  if (/רשת|CAT\s?[56]/i.test(s)) return 'cat';
  if (/DMX/i.test(s)) return 'dmx';
  if (/HDMI|SDI|וידאו|BNC/i.test(s)) return 'sdi';
  if (/רמקול|ספיקון|speakon|[24]\s?[xX×]\s?(2\.5|4)/i.test(s)) return 'nl4';
  if (/מולטי/i.test(s)) return 'multi';
  if (/חשמל|מאריך|פאוור/i.test(s)) return 'pwr';
  if (/אופטי|fiber/i.test(s)) return 'fiber';
  return 'multi';
}
function connKindOf(s) {
  if (/ספיקון|speakon/i.test(s)) return 'speakon';
  if (/XLR/i.test(s)) return /זכר|male/i.test(s) ? 'xlrm' : 'xlrf';
  if (/RJ ?45|רשת/i.test(s)) return 'rj45';
  if (/BNC|RCA/i.test(s)) return 'bnc';
  if (/HDMI/i.test(s)) return 'hdmi';
  if (/פאוור|חשמל/i.test(s)) return 'pwr';
  return 'xlrf';
}
/* חילוץ כמות חורים וסוג מחבר משם פריט — "קופסת מולטי 8 XLR" */
function holesFromName(name) {
  const kws = 'XLR|ספיקון|speakon|BNC|RJ\\s?45|HDMI|אופטי';
  let m = name.match(new RegExp('(\\d{1,2})\\s*(?:חורים|מעברים?)?\\s*[x×]?\\s*(' + kws + ')', 'i'));
  let num, kw;
  if (m) { num = +m[1]; kw = m[2]; }
  else {
    m = name.match(new RegExp('(' + kws + ')\\s*[x×]?\\s*(\\d{1,2})', 'i'));
    if (m) { num = +m[2]; kw = m[1]; }
  }
  if (!num || num < 1) return null;
  return { holes: num, connKind: connKindOf(kw) };
}
function panelFromItem(it, rows) {
  const h = holesFromName(it.name);
  if (h) return { mode: 'matrix', rows: rows || (h.holes > 12 ? 2 : 1), holes: Array.from({ length: h.holes }, () => ({ conn: h.connKind })) };
  return defPanel(it.dest === 'panelUnit' ? 8 : 16, rows || (it.dest === 'panelUnit' ? 1 : 2));
}
/* פריט אביזר (מתקן/יוק/סוגר/כננת) — משויך למוצר, לא מוצב בתכנית */
const ACCESSORY_RE = /מתקן|יוק|\byoke\b|סוגר|תושבת|כננת|מתלה|ברקט|bracket|תלייה|תליה|adapter|מתאם|רגל|stand|clamp|אומגה|flybar|רייל|פלייבר/i;
function isAccessory(name) { return ACCESSORY_RE.test(name || '') && !/רמקול|סאב|מגבר|פרוססור/i.test((name || '').replace(ACCESSORY_RE, '')); }
/* פריט רמקול/סאב אמיתי — לא כבל, לא מחבר, לא אביזר */
function isSpeakerItem(name) {
  const n = name || '';
  if (/כבל|מחבר|קונקטור|cable|מתקן|יוק|\byoke\b|סוגר|ברקט|תושבת|כננת|מתלה/i.test(n)) return false;
  /* מגבר/פרוססור אינם רמקול — גם אם בשם מוזכר "קרוס בין סאבים" וכד' */
  if (/מגבר|\bamp(lifier)?\b|פרוססור|processor|קרוסאובר|crossover|מטריצ|matrix|\bDSP\b/i.test(n)) return false;
  return /רמקול|סאב|קולונה|speaker|sub|woofer|monitor/i.test(n);
}
function classifyStock(name) {
  const mLen = name.match(/(\d{1,3})\s*(?:מ'|מ׳|מטר|m\b)/i);
  const mU = name.match(/(\d{1,2})\s*U\b/i);
  const mG = name.match(/(\d)\s*[xX×]\s*(\d+(?:\.\d+)?)/);
  const mm = mG ? +mG[2] : undefined;
  if (/ארון/.test(name) && (mU || /מסד|תקשורת|19["״ ]|ראק|rack/i.test(name)))
    return { dest: 'rack', ru: mU ? +mU[1] : 12 };
  if (/גליל|תוף|drum/i.test(name) && /כבל|רשת|סאונד|רמקול|מולטי/.test(name))
    return { dest: 'reel', len: mLen ? +mLen[1] : 100, mm, type: cabTypeOf(name) };
  if (/מחבר|קונקטור/.test(name) || (/ספיקון|XLR/i.test(name) && /להלחמה|נקבה|זכר/.test(name) && !/כבל/.test(name)))
    return { dest: 'conn', kind: connKindOf(name) };
  if (/כבל/.test(name) && mLen && !/גליל/.test(name))
    return { dest: 'cable', len: +mLen[1], mm, type: cabTypeOf(name),
      conn: /XLR|ספיקון|speakon|BNC|RJ|HDMI|פאוור/i.test(name) ? connKindOf(name) : undefined };
  return null;
}
function loadScript(u) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = u; s.onload = res;
    s.onerror = () => rej(new Error('טעינת ספרייה נכשלה — נדרש חיבור אינטרנט'));
    document.head.appendChild(s);
  });
}
async function extractText(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (['xlsx', 'xls', 'csv'].includes(ext)) {
    if (!window.XLSX) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
    const wb = XLSX.read(await file.arrayBuffer());
    return wb.SheetNames.map(n => XLSX.utils.sheet_to_csv(wb.Sheets[n], { FS: ' ' })).join('\n');
  }
  if (ext === 'docx') {
    if (!window.mammoth) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js');
    return (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value;
  }
  if (ext === 'pdf') {
    if (!window.pdfjsLib) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    const doc = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    let t = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const tc = await (await doc.getPage(i)).getTextContent();
      const rows = {};
      tc.items.forEach(it => { const y = Math.round(it.transform[5]); (rows[y] = rows[y] || []).push(it.str); });
      t += Object.keys(rows).sort((a, b) => b - a).map(y => rows[y].join(' ')).join('\n') + '\n';
    }
    return t;
  }
  if (['jpg', 'jpeg', 'png'].includes(ext)) {
    if (!window.Tesseract) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.0.5/tesseract.min.js');
    return (await Tesseract.recognize(file, 'heb+eng')).data.text;
  }
  throw new Error('פורמט לא נתמך: ' + ext);
}
function parseSpecText(text, src) {
  const out = [];
  for (const raw of text.split(/\r?\n/)) {
    const s = raw.trim().replace(/\s{2,}/g, ' ');
    if (s.length < 3 || s.length > 140 || !/[א-תA-Za-z]/.test(s)) continue;
    let qty = 1;
    const m = s.match(/(?:^|\s|x|×)(\d{1,2})(?:\s*(?:יח'?|יחידות|pcs|units?))?(?=\s|$)/i);
    if (m) qty = Math.max(1, Math.min(24, +m[1]));
    const st = classifyStock(s);
    if (st) {
      out.push({ on: true, qty, name: s.slice(0, 70), src, cat: 'other', u: 1, ...st });
      continue;
    }
    const d = SPEC_DICT.find(d => d.re.test(s));
    if (!d) continue;
    const it = { on: d.dest !== 'ignore', qty, name: s.slice(0, 70), dest: d.dest, cat: d.cat || 'other', u: d.u || 1, src };
    it.rack = guessRackFor(it);
    out.push(it);
  }
  return out;
}
/* 🧰 קיטים מוכנים מה-ERP */
let kitQ = '', kitCat = '', kitShow = 60;
function showKits() { $('#impOv').style.display = 'flex'; renderKits(); }
/* כל הקיטים: ERP + קיטים שנוצרו ע"י המשתמש */
/* קיט שנערך גובר על קיט ה-ERP עם אותו שם — העריכה נשמרת לתמיד ואין כפילות ברשימה */
function allKits() {
  const mine = store.userKits || [];
  const over = new Set(mine.map(k => (k.name || '').trim()));
  const base = (typeof ERP_KITS !== 'undefined' ? ERP_KITS : []).filter(k => !over.has((k.name || '').trim()));
  return base.concat(mine);
}
/* תצוגה מקדימה של קיט — לפני הוספה לרשימה */
function kitPrev(gi) {
  const k = allKits()[gi]; if (!k) return;
  const isUser = (store.userKits || []).includes(k);
  let total = 0;
  const rows = k.items.map(x => {
    const pr = x.key && typeof ERP_PRICES !== 'undefined' && ERP_PRICES[x.key] != null ? ERP_PRICES[x.key] : null;
    if (pr != null) total += pr * (x.qty || 1);
    return `<div style="display:flex;gap:8px;padding:4px 8px;border-bottom:1px solid #eee;font-size:12px">
      <b style="width:28px;text-align:center">${x.qty || 1}×</b><span style="flex:1">${esc(x.name)}</span>
      <span class="muted">${pr != null ? '₪' + (pr * (x.qty || 1)).toLocaleString() : '—'}</span></div>`;
  }).join('');
  $('#impList').innerHTML = `
    <button onclick="renderKits()">← חזרה לרשימת הקיטים</button>
    <h3 style="margin:10px 0 4px">🧰 ${esc(k.name)} <span class="muted" style="font-size:11px">${k.items.length} פריטים${isUser ? ' · קיט שלי' : ''}</span></h3>
    ${rows}
    <p style="text-align:left;font-weight:700;margin:6px 8px">סה"כ משוער: ₪${total.toLocaleString()}</p>
    <button class="primary" style="width:100%" onclick="pickKit(${gi})">➕ הוסף את הקיט לרשימת הפריטים</button>
    <button style="width:100%;margin-top:6px;background:#eef7f1;color:#0f6e56;font-weight:700" onclick="kitEdit(${gi})">✎ ערוך את הקיט — השינוי נשמר לתמיד${isUser ? '' : ' (מחליף את קיט ה-ERP)'}</button>
    ${isUser ? `<button style="width:100%;margin-top:6px;background:#f3d9d2" onclick="kitDelete(${gi})">🗑 ${(typeof ERP_KITS !== 'undefined' ? ERP_KITS : []).some(e => (e.name || '').trim() === (k.name || '').trim()) ? 'בטל את העריכה — חזרה לקיט ה-ERP המקורי' : 'מחק קיט'}</button>` : ''}`;
}
function saveKitDraft() {
  if (!nkDraft.name.trim()) { alert('תן שם לקיט'); return; }
  store.userKits = store.userKits || [];
  const rec = { name: nkDraft.name.trim(), cat: nkDraft.cat || 'audio', sys: nkDraft.sys || 'קיט שלי', items: nkDraft.items };
  if (nkDraft.editIdx != null && store.userKits[nkDraft.editIdx]) store.userKits[nkDraft.editIdx] = rec;
  else store.userKits.push(rec);
  const wasErp = nkDraft.fromErp;
  save(); nkDraft = null; renderKits();
  uiToast(wasErp ? '✎ הקיט נערך ונשמר לתמיד — הגרסה שלך מחליפה את קיט ה-ERP בכל האפליקציה' : '✓ הקיט נשמר');
}
/* עריכת קיט קיים — טוען לתוך בונה הקיט (דגם מובנה → עותק מותאם) */
function kitEdit(gi) {
  const k = allKits()[gi]; if (!k) return;
  const mine = store.userKits || [];
  const ui2 = mine.indexOf(k);
  /* קיט ERP נערך תחת אותו שם — הגרסה הערוכה מחליפה אותו בכל האפליקציה */
  nkDraft = { name: k.name, items: JSON.parse(JSON.stringify(k.items)), q: '', editIdx: ui2 >= 0 ? ui2 : null, cat: k.cat, sys: k.sys, fromErp: ui2 < 0 };
  renderKitNew();
}
/* מחיקת קיט שלי — אם הוא היה עריכה של קיט ERP, המקורי חוזר לרשימה */
async function kitDelete(gi) {
  const k = allKits()[gi]; if (!k) return;
  const i = (store.userKits || []).indexOf(k); if (i < 0) return;
  const isOverride = (typeof ERP_KITS !== 'undefined' ? ERP_KITS : []).some(e => (e.name || '').trim() === (k.name || '').trim());
  if (!(await uiConfirm(isOverride ? 'לבטל את העריכה ולחזור לקיט ה-ERP המקורי?' : 'למחוק את הקיט "' + k.name.slice(0, 30) + '"?'))) return;
  store.userKits.splice(i, 1); save(); renderKits();
  uiToast(isOverride ? '↩ העריכה בוטלה — קיט ה-ERP המקורי חזר' : '🗑 הקיט נמחק');
}
/* בניית קיט חדש מאפס — שם, חיפוש בקטלוג, כמויות */
let nkDraft = null;
function kitNew() { nkDraft = { name: '', items: [], q: '' }; renderKitNew(); }
function renderKitNew() {
  const d = nkDraft;
  const hits = d.q.trim().length >= 2 && typeof ERP_ITEMS !== 'undefined'
    ? ERP_ITEMS.filter(([k, n2]) => n2.includes(d.q.trim())).slice(0, 8) : [];
  $('#impList').innerHTML = `
    <button onclick="nkDraft=null;renderKits()">← ביטול וחזרה</button>
    <h3 style="margin:10px 0 4px">➕ קיט חדש</h3>
    <div class="fld"><label>שם הקיט</label><input id="nkName" value="${esc(d.name)}" oninput="nkDraft.name=this.value"></div>
    <div class="fld"><label>חיפוש פריט בקטלוג</label><input id="nkQ" value="${esc(d.q)}" oninput="nkDraft.q=this.value;renderKitNew();const e2=document.getElementById('nkQ');e2.focus();e2.setSelectionRange(e2.value.length,e2.value.length)"></div>
    ${hits.map(([k, n2]) => `<button style="display:block;width:100%;text-align:right;font-size:11px;margin-bottom:3px" onclick="nkDraft.items.push({name:'${esc(n2).replace(/'/g, '&#39;')}',key:'${k}',qty:1});nkDraft.q='';renderKitNew()">➕ ${esc(n2.slice(0, 52))}</button>`).join('')}
    ${d.items.length ? '<h3 class="sec">פריטים בקיט (' + d.items.length + ')</h3>' : ''}
    ${d.items.map((x, i) => `<div style="display:flex;gap:6px;align-items:center;font-size:12px;padding:3px 6px;border:1px solid #eee;border-radius:6px;margin-bottom:3px">
      <input type="number" min="1" value="${x.qty}" style="width:44px" onchange="nkDraft.items[${i}].qty=+this.value||1">
      <span style="flex:1">${esc(x.name.slice(0, 44))}</span>
      <button style="padding:0 6px" onclick="nkDraft.items.splice(${i},1);renderKitNew()">✕</button></div>`).join('')}
    ${d.items.length ? `<button class="primary" style="width:100%;margin-top:8px" onclick="saveKitDraft()">💾 שמור קיט</button>` : ''}`;
}
/* יצירת קיט חדש מהשורות המסומנות ✓ בהצעת המחיר */
async function kitFromOffer() {
  const marked = impItems.filter(it => it.on);
  if (!marked.length) { alert('סמן ✓ שורות בהצעת המחיר שיהיו הקיט'); return; }
  const nm = await uiPrompt('שם הקיט החדש (' + marked.length + ' פריטים):'); if (!nm) return;
  store.userKits = store.userKits || [];
  store.userKits.push({ name: nm.trim(), cat: 'audio', sys: 'קיט שלי', items: marked.map(it => ({ name: it.name, qty: it.qty || 1, key: it.key || undefined })) });
  save();
  alert('הקיט "' + nm + '" נוצר ונוסף לרשימת הקיטים (מסומן "קיט שלי").');
  renderKits();
}
function renderKits() {
  const q = kitQ.trim();
  const CATS_K = [['', 'הכל'], ['audio', '🔊 סאונד'], ['lighting', '💡 תאורה'], ['video', '📺 וידאו']];
  const toks = q.toLowerCase().split(/\s+/).filter(Boolean);
  const hay = k => (k.name + ' ' + (k.cat || '') + ' ' + (k.sys || '') + ' ' + (k.items || []).map(x => x.name).join(' ')).toLowerCase();
  const list = allKits()
    .filter(k => !kitCat || (k.cat || '') === kitCat)
    .filter(k => !toks.length || toks.every(t => hay(k).includes(t)));
  const chips = CATS_K.map(([v, l]) => `<button onclick="kitCat='${v}';kitShow=60;renderKits()" style="padding:3px 12px;border-radius:16px;font-size:12px;border:1px solid ${kitCat === v ? '#c9502e' : '#ccc'};background:${kitCat === v ? '#c9502e' : '#fff'};color:${kitCat === v ? '#fff' : '#333'}">${l}</button>`).join(' ');
  $('#impList').innerHTML = `
    <div class="fld"><input placeholder="חיפוש קיט… (F1, EVO, לד, נאון)" value="${esc(kitQ)}" oninput="kitQ=this.value;kitShow=60;renderKits()" style="width:100%"></div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">${chips}</div>
    <div style="display:flex;gap:6px;margin-bottom:8px">
      <button style="flex:1" onclick="kitNew()">➕ צור קיט חדש</button>
      <button style="flex:1" onclick="kitFromOffer()">🧰 צור קיט מהצעת המחיר (✓)</button>
    </div>
    <p class="muted" style="margin-bottom:8px">${list.length} קיטים · מוצגים ${Math.min(list.length, kitShow)} · לחיצה פותחת תצוגה מקדימה:</p>` +
    list.slice(0, kitShow).map(k => {
      const gi = allKits().indexOf(k);
      const isUser = (store.userKits || []).includes(k);
      const isOver = isUser && (typeof ERP_KITS !== 'undefined' ? ERP_KITS : []).some(e => (e.name || '').trim() === (k.name || '').trim());
      return `<div class="crow" onclick="kitPrev(${gi})">
        <span class="badge" style="background:${isUser ? '#0f6e56' : '#534ab7'}">${k.items.length}</span>
        <span class="txt"><b>${esc(k.name)}</b>${isOver ? ' <span style="font-size:9.5px;color:#0f6e56">✎ נערך</span>' : isUser ? ' <span style="font-size:9.5px;color:#0f6e56">קיט שלי</span>' : ''}<br><span class="muted" style="font-size:10px">${esc(k.cat || '')} · ${esc(k.sys || '')}</span></span>
      </div>`;
    }).join('') +
    (list.length > kitShow ? `<button style="width:100%;margin-top:8px" onclick="kitShow+=60;renderKits()">▼ הצג עוד ${Math.min(60, list.length - kitShow)} מתוך ${list.length - kitShow} שנותרו</button>` : '') +
    (kitShow > 60 ? `<button style="width:100%;margin-top:5px" onclick="kitShow=60;renderKits()">▲ צמצם</button>` : '');
}
function pickKit(i) {
  const k = allKits()[i];
  const src = 'קיט: ' + k.name.slice(0, 30);
  for (const x of k.items) {
    const st = classifyStock(x.name);
    const it = st
      ? { on: true, qty: x.qty, name: x.name, src, cat: 'other', u: 1, key: x.key, ...st }
      : (() => {
          const d = SPEC_DICT.find(d => d.re.test(x.name));
          return { on: !d || d.dest !== 'ignore', qty: x.qty, name: x.name, src, key: x.key,
            dest: d ? d.dest : 'unit', cat: d?.cat || 'other', u: d?.u || 1 };
        })();
    it.rack = guessRackFor(it);
    impItems.push(it);
  }
  $('#impOv').style.display = 'none';
  renderImp();
}

/* 🧾 כתב כמויות והצעת מחיר מהתכנית */
function bomBuild() {
  const agg = {};
  const add = (name, qty, unit, key) => {
    const base = name.replace(/\s*\(\d+\)\s*$/, '').trim();
    const k = base + '|' + (unit || 'יח׳');
    if (!agg[k]) agg[k] = { name: base, qty: 0, unit: unit || 'יח׳', key };
    agg[k].qty += qty;
    if (key && !agg[k].key) agg[k].key = key;
  };
  for (const n of P.nodes) {
    if (n.kind === 'rack') {
      add(n.name, 1, 'יח׳', n.key);
      for (const u of n.units) add(u.name, 1, 'יח׳', u.key);
    } else if (n.kind === 'point' || n.kind === 'panel') add(n.name, 1, 'יח׳', n.key);
  }
  for (const c of P.cables) {
    const nm = (CTYPES[c.type] ? 'כבל ' + CTYPES[c.type].n : 'כבל') + (c.spec ? ' — ' + c.spec : '');
    if (c.len) add(nm, c.len, 'מ׳');
    else add(nm, +c.qty || 1, 'יח׳');
  }
  ensureStock(P);
  for (const s of P.stock.conns) if (s.used) add(s.name, s.used, 'יח׳', s.key);
  /* השלמת מחיר, מק"ט ואזורים מרשימת הפריטים */
  const out = Object.values(agg);
  for (const b of out) {
    const it = impItems.find(x => x.name.replace(/\s*\(\d+\)\s*$/, '').trim() === b.name);
    if (it) {
      if (it.price) b.price = it.price;
      if (it.key && !b.key) b.key = it.key;
      if (it.zones) b.zones = Object.entries(it.zones).map(([z, n]) => z + (n > 1 ? ' ×' + n : '')).join(', ');
    }
  }
  return out;
}
function showBom() {
  const bom = bomBuild();
  $('#impOv').style.display = 'flex';
  $('#impList').innerHTML = `<h3 style="margin-bottom:8px">🧾 כתב כמויות — ${esc(P.name)}</h3>
    <table class="cablelist"><tr><th>מק"ט</th><th>פריט</th><th>כמות</th><th>יח׳</th><th>אזור</th><th>מחיר ₪</th><th>סה"כ ₪</th></tr>` +
    bom.map(b => `<tr><td>${esc(b.key || '—')}</td><td>${esc(b.name)}</td><td>${b.qty}</td><td>${b.unit}</td><td style="font-size:11px">${esc(b.zones || '—')}</td><td>${b.price || '—'}</td><td>${b.price ? (b.price * b.qty).toLocaleString() : '—'}</td></tr>`).join('') +
    `</table>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="primary" style="flex:1" onclick="bomDownload()">⬇ הורד JSON להצעת מחיר (ERP)</button>
      <button style="flex:1" onclick="bomCopyCsv()">📋 העתק CSV</button>
    </div>
    <p class="muted" style="margin-top:8px">את קובץ ה-JSON שלח ל-Claude עם "צור מזה הצעת מחיר ב-ERP" — הפריטים יותאמו למק"טים בטבלת הפריטים וההצעה תיווצר במערכת (offers).</p>`;
}
function bomDownload() {
  const data = { project_name: P.name, source: 'KO Projects', room: P.room || {}, zones: (P.zones || []).map(z => ({ name: z.name, usage: z.usage })),
    items: bomBuild().map(b => ({ item_key: b.key || null, item_name: b.name, quantity: b.qty, unit: b.unit, unit_price: b.price || null, zone: b.zones || null })) };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
  a.download = 'offer-' + P.name.replace(/[^\w֐-׿]+/g, '-') + '.json';
  a.click();
}
function bomCopyCsv() {
  const csv = 'מק"ט,פריט,כמות,יחידה\n' + bomBuild().map(b => `"${b.key || ''}","${b.name.replace(/"/g, '""')}",${b.qty},${b.unit}`).join('\n');
  try { navigator.clipboard.writeText(csv); alert('📋 הועתק — הדבק באקסל'); } catch (e) {}
}

/* קטלוג פרויקטים מאושרים מה-ERP (מוטמע — רענון דרך Claude) */
let erpQ = '';
function showErp() {
  $('#impOv').style.display = 'flex';
  renderErpList();
}
function renderErpList() {
  const q = erpQ.trim();
  const list = ERP_CATALOG.filter(p => !q || (p.name + ' ' + p.account).includes(q));
  $('#impList').innerHTML = `
    <div class="fld"><input placeholder="חיפוש פרויקט או לקוח…" value="${esc(erpQ)}" oninput="erpQ=this.value;renderErpList()" style="width:100%"></div>
    <p class="muted" style="margin-bottom:8px">פרויקטים עם הזמנות שאושרו ב-2026 (${list.length}) — לחץ כדי לטעון את הפריטים:</p>` +
    list.map(p => {
      const gi = ERP_CATALOG.indexOf(p);
      const n = p.items.filter(i => i.dest !== 'ignore').length;
      return `<div class="crow" onclick="pickErp(${gi})">
        <span class="badge" style="background:${p.partial ? '#999' : '#0f6e56'}">${p.partial ? '?' : n}</span>
        <span class="txt"><b>${esc(p.name)}</b> · ${esc(p.account)}<br>
          <span class="muted">${p.date} · ${p.orders.join(', ')}${p.partial ? ' · הפריטים טרם נטענו — בקש מ-Claude להשלים' : ' · ' + n + ' פריטי ציוד'}</span></span>
      </div>`;
    }).join('');
}
function pickErp(i) {
  const p = ERP_CATALOG[i];
  if (p.partial) { alert('לפרויקט הזה הפריטים עדיין לא נטענו לקטלוג — בקש מ-Claude לרענן את הקטלוג עם הפרויקט הזה.'); return; }
  const src = 'ERP · ' + p.name;
  for (const x of p.items) {
    const st = classifyStock(x.name);
    const it = st
      ? { on: true, qty: x.qty, name: x.name, src, cat: 'other', u: 1, ...st }
      : { on: x.dest !== 'ignore', qty: x.qty, name: x.name, dest: x.dest, cat: x.cat, u: x.u, src };
    it.rack = guessRackFor(it);
    impItems.push(it);
  }
  $('#impOv').style.display = 'none';
  renderImp();
}
function importItemsJSON(inp) {
  const files = [...inp.files];
  inp.value = '';
  if (!files.length) return;
  let done = 0;
  for (const f of files) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const j = JSON.parse(r.result);
        /* ייבוא אזורי סאונד (מזיהוי של Claude) */
        if (j.zones && Array.isArray(j.zones)) applyZonesJson(j.zones);
        const arr = Array.isArray(j) ? j : (j.items || []);
        const src = j.source || f.name;
        for (const x of arr) {
          let { name = '', qty = 1, dest, cat, u } = x;
          const st = classifyStock(String(name));
          if (st && (!dest || dest === 'ignore')) {
            const it = { on: true, qty: +qty || 1, name: String(name).slice(0, 70), src, cat: 'other', u: 1, ...st };
            it.rack = guessRackFor(it);
            impItems.push(it);
            continue;
          }
          if (!dest) {
            const d = SPEC_DICT.find(d => d.re.test(name));
            dest = d ? d.dest : 'unit';
            cat = cat || d?.cat || 'other';
            u = u || d?.u || 1;
          }
          const it = { on: dest !== 'ignore', qty: +qty || 1, name: String(name).slice(0, 70), dest, cat: cat || 'other', u: u || 1, src };
          it.rack = guessRackFor(it);
          impItems.push(it);
        }
      } catch { alert(f.name + ': קובץ JSON לא תקין'); }
      if (++done === files.length) renderImp();
    };
    r.readAsText(f);
  }
}
function guessRackFor(it) {
  const racks = P.nodes.filter(n => n.kind === 'rack');
  const by = kw => racks.find(r => (r.name + ' ' + (r.sub || '')).includes(kw));
  let r = null;
  if (it.cat === 'amp' || it.cat === 'audio') r = by('מגבר') || by('הגברה') || by('סאונד');
  else if (it.cat === 'video') r = by('קונטרול') || by('וידאו');
  else if (it.cat === 'light') r = by('קונטרול') || by('תאורה');
  else if (it.cat === 'net' || it.cat === 'patch') r = by('מסד') || by('מגבר');
  return (r || racks[0])?.id;
}
async function importSpec(inp) {
  const files = [...inp.files];
  inp.value = '';
  if (!files.length) return;
  dockOpen = true;
  $('#dock').style.display = 'block';
  $('#dock').innerHTML = '<p>מחלץ מידע מ-' + files.length + ' קבצים… (OCR לתמונות עשוי לקחת דקה)</p>';
  const items = [];
  for (const f of files) {
    try { items.push(...parseSpecText(await extractText(f), f.name)); }
    catch (e) { alert(f.name + ': ' + e.message); }
  }
  impItems = impItems.concat(items); /* אפשר לייבא כמה קבצים ברצף לאותו פרויקט */
  renderImp();
}
let dockOpen = true, dockQ = '', dockMin = false, dockWide = false, connPin = null, replFor = null, WIREPTS = {}, PANELPORT = {};
function openPlanSettings() {
  sel = null; selCable = null; selZone = null; panelEdit = null; ui.tab = 'node';
  document.body.classList.remove('smin');
  render();
}
function toggleSide() {
  document.body.classList.toggle('smin');
  document.getElementById('sideMinBtn').textContent = document.body.classList.contains('smin') ? '⮜' : '⮞';
}
function toggleMini(id, on) { const n = byId(id); if (!n) return; n.mini = on; n.full = !on; render(); }
/* פתיחת אייקון ממוזער בדאבל-קליק: render() באמצע לחיצה מחליף את האלמנט והורג את אירועי
   click/dblclick, לכן מזהים ידנית שני טאפים עוקבים (עד 450ms, בלי תזוזה) לפי מזהה המוקד. */
let __lastTap = { key: null, t: 0 };
function miniOpenOnTap(e, open, key) {
  const sx = e.clientX, sy = e.clientY;
  document.addEventListener('pointerup', ev => {
    if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) >= 6) { __lastTap = { key: null, t: 0 }; return; }
    const now = Date.now();
    if (__lastTap.key === key && now - __lastTap.t < 450) { __lastTap = { key: null, t: 0 }; open(); }
    else __lastTap = { key, t: now };
  }, { once: true });
}
/* גודל תצוגת הארון — מוגדל/מוקטן לפי הצורך; נשמר לכל ארון בנפרד */
function rackZoom(id, dir) {
  const n = byId(id); if (!n) return;
  const steps = [0.7, 0.85, 1, 1.25, 1.5, 2, 2.5];
  let i = steps.indexOf(n.uz || 1);
  if (i < 0) i = 2;
  i = Math.max(0, Math.min(steps.length - 1, i + dir));
  n.uz = steps[i];
  render(); save();
}
function toggleRackMin(id) { const n = byId(id); if (!n) return; n.min = !n.min; render(); }
/* פריסת כבל מפריט ברשימה — מפעיל חיבור בלחיצה עם כל פרטי הכבל */
function wireFromItem(iid) {
  const it = impItems.find(x => x.iid === iid);
  if (!it) return;
  const s = ensureStockItem(it);
  const ref = (it.dest === 'reel' ? 'reel|' : 'cable|') + s.id;
  if (wireMode && wireStock === ref) { wireMode = null; wireStock = null; }
  else { wireStock = ref; wireMode = { from: null }; ui.tab = 'cable'; }
  pinMode = null; connPin = null; /* מצב אחד בלבד בכל רגע */
  render();
}
/* מילוי מחיר אוטומטי מהמחירון (ERP) לפי מק"ט */
/* מידע חי מהקטלוג — מחיר ומלאי לפי מק"ט (ERP_ITEMS: [key, name, price, qty]) */
let ERP_INFO = null;
/* דירוג תוצאות חיפוש: קודם מלאי גבוה, ואז פריטים על 0 לפי הנמכרים לאחרונה
   (ERP_SOLD = [תאריך מכירה אחרון, מס׳ שורות, כמות מצטברת] לכל מק"ט) */
function soldInfo(key) { return (key && typeof ERP_SOLD !== 'undefined' && ERP_SOLD[key]) || null; }
function stockRank(key) {
  const inf = key ? erpInfo(key) : null;
  const qty = inf ? +inf.qty || 0 : 0;
  if (qty > 0) return { tier: 0, a: qty, b: 0 };
  const sd = soldInfo(key);
  /* על 0 — קודם מי שנמכר לאחרונה, ואז לפי תדירות מכירה */
  return { tier: 1, a: sd ? Date.parse(sd[0] + 'T00:00:00') || 0 : 0, b: sd ? sd[1] : 0 };
}
function byStockThenSold(ka, kb) {
  const A = stockRank(ka), B = stockRank(kb);
  if (A.tier !== B.tier) return A.tier - B.tier;
  if (B.a !== A.a) return B.a - A.a;
  return B.b - A.b;
}
/* תג מלאי אחיד לכל רשימת חיפוש באפליקציה */
function stockTag(key) {
  const inf = key ? erpInfo(key) : null;
  if (!inf) return '<span class="muted" style="font-size:10px">—</span>';
  const sd = soldInfo(key);
  return `<span style="font-size:10px;white-space:nowrap;color:${inf.qty > 0 ? '#0a7a4b' : '#a32222'};font-weight:700" title="מלאי ERP${sd ? ' · נמכר לאחרונה ' + sd[0] + ' (' + sd[1] + ' שורות)' : ' · אין מכירות אחרונות'}">מלאי ${inf.qty}${inf.qty <= 0 && sd ? ' · נמכר ' + sd[0].slice(2) : ''}</span>`;
}
function erpInfo(key) {
  if (!ERP_INFO) {
    ERP_INFO = new Map();
    if (typeof ERP_ITEMS !== 'undefined') for (const it of ERP_ITEMS) ERP_INFO.set(it[0], { price: +it[2] || 0, qty: +it[3] || 0 });
  }
  return key ? ERP_INFO.get(key) : null;
}
/* תמונת מוצר מהחנות (store.kot.co.il) לפי מק"ט — נקצר ע"י scripts/harvest-store-images.js */
function erpImg(key) { return (key && typeof ERP_IMAGES !== 'undefined' && ERP_IMAGES[key]) || ''; }
function imgCell(key, size) {
  const u = erpImg(key);
  return u ? `<img src="${esc(u)}" loading="lazy" style="width:${size}px;height:${size}px;object-fit:contain;border-radius:5px;background:#fff;flex:none" onerror="this.remove()">` : '';
}
function stockBadge(key) {
  const inf = erpInfo(key);
  if (!inf) return '';
  const st = inf.qty > 0 ? `<span style="color:#0a7a4b">מלאי: ${inf.qty}</span>` : '<span style="color:#a32222">אין מלאי</span>';
  return `<span style="font-size:10.5px;white-space:nowrap">${st}${inf.price ? ' · ₪' + inf.price.toLocaleString() : ''}</span>`;
}
function autoPrice(it) {
  if ((it.price == null || it.price === '') && it.key && typeof ERP_PRICES !== 'undefined' && ERP_PRICES[it.key] != null)
    it.price = ERP_PRICES[it.key];
  if ((it.price == null || it.price === '') && it.key) { const inf = erpInfo(it.key); if (inf && inf.price) it.price = inf.price; }
}
/* חיפוש מאוחד: קיטים + פריטי ERP — הוספה ונעיצה בקליק */
function dockSearchResults(q) {
  /* חיפוש לא תלוי-רישיות ומפוצל למילים — "funktion f81" מוצא "רמקול FUNKTION ONE F81".
     בלי זה, שם מוצר באנגלית גדולה לא נמצא בהקלדה קטנה, וזה נראה כאילו הפריט לא קיים. */
  const toks = String(q || '').toLowerCase().split(/\s+/).filter(Boolean);
  if (!toks.length) return [];
  const hit = t => { const l = String(t).toLowerCase(); return toks.every(k => l.includes(k)); };
  const res = [], seen = new Set();
  const CAP = 40;
  const K = typeof ERP_KITS !== 'undefined' ? ERP_KITS : [];
  const userK = (store.userKits || []);
  /* קיטים קודם — הם התשובה הכי "גדולה" לחיפוש */
  [...K, ...userK].forEach((k, i) => {
    if (res.length >= CAP || !hit(k.name)) return;
    res.push({ type: 'kit', i, name: k.name, n: (k.items || []).length });
  });
  const addItem = (name, key) => {
    if (res.length >= CAP || seen.has(name) || !hit(name)) return;
    seen.add(name); res.push({ type: 'item', name, key });
  };
  for (const k of [...K, ...userK]) for (const x of (k.items || [])) addItem(x.name, x.key);
  if (typeof ERP_CATALOG !== 'undefined')
    for (const p of ERP_CATALOG) for (const x of (p.items || [])) addItem(x.name, x.key);
  if (typeof ERP_ITEMS !== 'undefined')
    for (const [k, n] of ERP_ITEMS) addItem(n, k);
  /* קיטים נשארים בראש; המוצרים ממוינים לפי מלאי ואז לפי מכירה אחרונה */
  const kits2 = res.filter(r => r.type === 'kit');
  const items2 = res.filter(r => r.type !== 'kit').sort((a, b) => byStockThenSold(a.key, b.key));
  return [...kits2, ...items2];
}
function pickSearchItem(name, key) {
  /* מצב החלפה — התוצאה מחליפה את הפריט המסומן במקום להוסיף חדש */
  if (replFor) {
    const t = impItems.find(x => x.iid === replFor);
    if (t) { t.name = name; if (key) t.key = key; t.price = undefined; autoPrice(t); }
    replFor = null; dockQ = '';
    render(); save();
    return;
  }
  let it = impItems.find(x => x.name === name);
  if (!it) {
    const st = classifyStock(name);
    const d = st ? null : SPEC_DICT.find(d => d.re.test(name));
    it = st
      ? { on: true, qty: 1, name, src: 'חיפוש', cat: 'other', u: 1, key, ...st }
      : { on: true, qty: 1, name, src: 'חיפוש', key, dest: d && d.dest !== 'ignore' ? d.dest : 'point', cat: d?.cat || 'other', u: d?.u || 1 };
    it.iid = uid('i');
    it.rack = guessRackFor(it);
    impItems.push(it);
  }
  dockQ = '';
  if (['unit', 'panelUnit', 'point', 'panelNode', 'rack'].includes(it.dest)) { pinMode = { iid: it.iid }; wireMode = null; wireStock = null; connPin = null; }
  else if (it.dest === 'cable' || it.dest === 'reel') { wireFromItem(it.iid); return; }
  else if (it.dest === 'conn') { connPinFromItem(it.iid); return; }
  render();
}
function pickKitInline(i) {
  const k = ERP_KITS[i];
  const src = 'קיט: ' + k.name.slice(0, 30);
  for (const x of k.items) {
    const st = classifyStock(x.name);
    const d = st ? null : SPEC_DICT.find(d => d.re.test(x.name));
    const it = st
      ? { on: true, qty: x.qty, name: x.name, src, cat: 'other', u: 1, key: x.key, ...st }
      : { on: !d || d.dest !== 'ignore', qty: x.qty, name: x.name, src, key: x.key, dest: d ? d.dest : 'unit', cat: d?.cat || 'other', u: d?.u || 1 };
    it.iid = uid('i');
    it.rack = guessRackFor(it);
    impItems.push(it);
  }
  dockQ = '';
  render();
}
/* בחירת קיט לאזור מסוים — הרכיבים נכנסים להצעה עם שיוך לאזור */
function pickKitForZone(zoneName, i) {
  const k = allKits()[i];
  const src = 'קיט: ' + k.name.slice(0, 30) + ' · ' + zoneName;
  for (const x of k.items) {
    if (!x.name) continue;
    const st = classifyStock(x.name);
    const d = st ? null : SPEC_DICT.find(d => d.re.test(x.name));
    const it = st
      ? { on: true, qty: x.qty, name: x.name, src, cat: 'other', u: 1, key: x.key, ...st }
      : { on: !d || d.dest !== 'ignore', qty: x.qty, name: x.name, src, key: x.key, dest: d ? d.dest : 'unit', cat: d?.cat || 'other', u: d?.u || 1 };
    it.iid = uid('i');
    it.rack = guessRackFor(it);
    it.zones = { [zoneName]: x.qty }; /* משויך לאזור */
    autoPrice(it);
    impItems.push(it);
  }
  const z = (P.zones || []).find(z => z.name === zoneName);
  if (z) { z.kits = z.kits || []; if (!z.kits.includes(k.name.slice(0, 30))) z.kits.push(k.name.slice(0, 30)); }
  dockOpen = true; dockMin = false;
  render();
}
/* מחיקת כל השורות המסומנות ✓ בהצעת המחיר */
async function deleteMarked() {
  const marked = impItems.filter(it => it.on);
  if (!marked.length) { alert('סמן שורות ✓ למחיקה'); return; }
  if (!(await uiConfirm(`למחוק ${marked.length} שורות מסומנות מהצעת המחיר?\n(מוקדים שהוצבו מהן בתכנית לא יימחקו)`))) return;
  impItems = impItems.filter(it => !it.on);
  render(); save();
}
/* ===== שליחת הצעה ל-ERP =====
   הדפדפן לא יכול לקרוא ל-ERP ישירות. הכפתור בונה מטען מוכן (JSON),
   מעתיק ללוח ומוריד כקובץ — ואז מדביקים ל-Claude שיוצר את ההצעה בפועל. */
function sendOffer() {
  const rows = impItems.filter(it => it.on !== false && (+it.qty || 0) > 0 && it.dest !== 'ignore');
  if (!rows.length) { alert('אין פריטים בהצעה.'); return; }
  const withKey = rows.filter(it => it.key);
  const noKey = rows.filter(it => !it.key);
  const total = rows.reduce((s2, it) => s2 + (+it.price || 0) * (+it.qty || 0), 0);

  const ov = document.createElement('div');
  ov.id = 'offerOv';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(20,24,32,.55);z-index:99;display:flex;align-items:center;justify-content:center';
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  ov.innerHTML = `<div style="background:#fff;border-radius:12px;padding:18px;max-width:560px;width:95%;max-height:90vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,.4)">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><b style="flex:1;font-size:17px">📤 יצירת הצעת פרויקט ב-ERP</b><button onclick="document.getElementById('offerOv').remove()">✕</button></div>
    <p style="margin:0 0 10px;font-size:13px">${withKey.length} שורות עם מק"ט · סה"כ <b>₪${Math.round(total).toLocaleString()}</b> (ללא מע"מ · 18% נחתם באישור)</p>
    ${noKey.length ? `<div style="background:#fdeeee;border:1px solid #c1121f;border-radius:8px;padding:8px;margin-bottom:10px;font-size:12px">
      <b style="color:#c1121f">⚠ ${noKey.length} שורות ללא מק"ט — לא יישלחו:</b>
      <div style="margin-top:4px">${noKey.map(it => '• ' + esc(it.name.slice(0, 50))).join('<br>')}</div></div>` : ''}
    <div class="fld"><label>שם הפרויקט ב-ERP (לאיתור אוטומטי)</label><input id="ofPrj" value="${esc(P.name || '')}"></div>
    <div class="fld"><label>לקוח (חשבון ERP) — חובה כשאין פרויקט, מומלץ תמיד</label>
      <input id="ofAcc" list="ofAccList" placeholder="🔍 הקלד 2+ תווים לחיפוש לקוח…" oninput="ofAccSearch(this)">
      <datalist id="ofAccList"></datalist>
      <div id="ofAccSt" class="muted" style="font-size:10px;margin-top:2px"></div></div>
    <div class="fld"><label>שם ההצעה — חובה בהצעת פרויקט (מבדיל בין הצעות באותו פרויקט)</label><input id="ofName" value="${esc((P.name || 'הצעה') + ' — סאונד וחיווט')}"></div>
    <div class="fld"><label>אופן העברת התשתית — חובה</label><select id="ofInfra">
      <option value="technician_install_site">🔧 טכנאי מביא לאתר ההתקנה</option>
      <option value="one_time_delivery">🚚 משלוח חד-פעמי לאתר</option>
      <option value="customer_pickup">🏭 הלקוח אוסף מהמחסן</option>
      <option value="none">— ללא העברת תשתית —</option>
    </select></div>
    <div class="fld"><label>אופן משלוח הפריטים</label><select id="ofShip" onchange="document.getElementById('ofAddrW').style.display=this.value==='warehouse_delivery'?'':'none'">
      <option value="">🔧 קריאת שירות — הטכנאי מביא (ללא משלוח)</option>
      <option value="warehouse_delivery">🚚 משלוח מהמחסן לכתובת</option>
      <option value="warehouse_pickup">🏭 איסוף מהמחסן בהמשך</option>
      <option value="pickup_now">🤝 איסוף מיידי</option>
    </select></div>
    <div class="fld" id="ofAddrW" style="display:none"><label>כתובת למשלוח</label><input id="ofAddr" value="${esc(P.customer || '')}" placeholder="רחוב, עיר"></div>
    <div id="ofSrvW" style="margin-top:8px">
      <button class="primary" style="width:100%;background:#2e7d32" onclick="ofCreateSrv(this)">🚀 צור הצעה ופתח את הפרויקט ב-ERP</button>
      <div id="ofSrvOut" style="font-size:12px;line-height:1.6;margin-top:6px"></div>
    </div>
    <div id="ofNoSrvW" style="display:none;margin-top:8px;font-size:12px">
      אין חיבור ERP משרת האפליקציה. <button onclick="ofCopy(null,true)">💾 הורד JSON</button> ושלח ל-Claude ליצירה ידנית.
    </div>
  </div>`;
  document.body.appendChild(ov);

  /* יצירה ישירה דרך השרת; אם אין חיבור (פריסה סטטית) — נשאר מסלול קובץ ידני */
  fetch('/api/erp/status').then(r => r.json()).then(s => {
    if (!s || !s.ok) { document.getElementById('ofSrvW').style.display = 'none'; document.getElementById('ofNoSrvW').style.display = ''; }
  }).catch(() => { document.getElementById('ofSrvW').style.display = 'none'; document.getElementById('ofNoSrvW').style.display = ''; });
  /* חיפוש לקוח חי מול ה-ERP תוך כדי הקלדה (debounce) */
  window.ofAccSearch = inp => {
    const a = (window.__ofAccs || []).find(x => x.name === inp.value);
    inp.dataset.key = a ? a.key : '';
    const st = document.getElementById('ofAccSt');
    if (st) st.textContent = a ? '✓ לקוח ' + a.key : '';
    clearTimeout(window.__ofAccT);
    const q = inp.value.trim();
    if (a || q.length < 2) return;
    window.__ofAccT = setTimeout(async () => {
      try {
        const j = await fetch('/api/erp/accounts?q=' + encodeURIComponent(q)).then(r => r.json());
        if (!j.ok) return;
        window.__ofAccs = j.accounts;
        const dl = document.getElementById('ofAccList');
        if (dl) dl.innerHTML = j.accounts.map(x => `<option value="${esc(x.name)}">${esc(x.key)}</option>`).join('');
        const m = j.accounts.find(x => x.name === inp.value);
        if (m) { inp.dataset.key = m.key; if (st) st.textContent = '✓ לקוח ' + m.key; }
      } catch (e) {}
    }, 350);
  };

  window.ofPayload = () => {
    const payload = {
      action: 'create_project_offer_via_erp_mcp',
      instructions: 'אתר את הפרויקט לפי project_name (list_projects), קרא get_offer_options עם project_id, וצור הצעה עם create_offer. החזר קוד הזמנה וקישור אישור.',
      project_name: document.getElementById('ofPrj').value.trim(),
      account_key: document.getElementById('ofAcc')?.dataset.key || undefined,
      account_name: document.getElementById('ofAcc')?.value.trim() || undefined,
      offer_name: document.getElementById('ofName').value.trim(),
      infrastructure_transfer_method: document.getElementById('ofInfra').value,
      shipment_method: document.getElementById('ofShip').value || null,
      shipping_address: document.getElementById('ofShip').value === 'warehouse_delivery' ? document.getElementById('ofAddr').value.trim() : undefined,
      currency_code: 'ILS',
      items: impItems.filter(it => it.on !== false && (+it.qty || 0) > 0 && it.dest !== 'ignore' && it.key).map(it => ({
        item_key: it.key,
        item_name: it.name.slice(0, 80),
        quantity: Math.max(1, Math.round(+it.qty || 1)),
        unit_price: +it.price || undefined,
        notes: [it.zones && Object.keys(it.zones).join(', '), it.note].filter(Boolean).join(' · ') || undefined
      })),
      items_without_key: impItems.filter(it => it.on !== false && (+it.qty || 0) > 0 && it.dest !== 'ignore' && !it.key).map(it => ({ name: it.name, qty: +it.qty || 1 })),
      estimated_total_ex_vat: Math.round(impItems.filter(it => it.on !== false && it.key).reduce((s2, it) => s2 + (+it.price || 0) * (+it.qty || 0), 0))
    };
    return payload;
  };

  /* יצירה ישירה דרך שרת האפליקציה → MCP של ה-ERP */
  window.ofCreateSrv = async (btn) => {
    const payload = ofPayload();
    if (!payload.offer_name) { alert('שם ההצעה חובה בהצעת פרויקט.'); return; }
    const out = document.getElementById('ofSrvOut');
    btn.disabled = true; btn.textContent = '⏳ יוצר הצעה ב-ERP…';
    try {
      const r = await fetch('/api/erp/offer', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await r.json();
      if (j.ok) {
        const res = j.result || {};
        const code = res.order_code || res.code || res.order?.code || '';
        const confirmUrl = res.confirmation_url || res.customer_confirmation_url || res.order?.confirmation_url || '';
        const projUrl = j.project_web_url || '';
        out.innerHTML = '✅ ההצעה נוצרה ב-ERP' + (code ? ' — הזמנה <b>' + esc(code) + '</b>' : '') +
          (projUrl ? '<br><a href="' + esc(projUrl) + '" target="_blank" rel="noopener">📂 פתח את הפרויקט ב-ERP</a>' : '') +
          (confirmUrl ? '<br><a href="' + esc(confirmUrl) + '" target="_blank" rel="noopener">🔗 קישור אישור ללקוח</a>' : '') +
          (j.skipped_without_key && j.skipped_without_key.length ? '<br>⚠️ ' + j.skipped_without_key.length + ' פריטים ללא מק"ט לא נכללו' : '');
        btn.textContent = '✓ נוצרה — נפתח ב-ERP';
        /* סימון הפרויקט: נשלחה הצעה + שיוך הלקוח (מוצג במנהל הפרויקטים) */
        P.offerSent = true;
        if (payload.account_name) { P.accountName = payload.account_name; P.accountKey = payload.account_key; }
        save();
        if (projUrl) window.open(projUrl, '_blank', 'noopener'); /* ניווט אוטומטי אל הפרויקט */
      } else {
        out.innerHTML = '❌ ' + (j.errors || ['שגיאה לא ידועה']).map(esc).join('<br>');
        btn.disabled = false; btn.textContent = '🚀 צור הצעה ופתח את הפרויקט ב-ERP';
      }
    } catch (e) {
      out.textContent = '❌ ' + e.message;
      btn.disabled = false; btn.textContent = '🚀 צור הצעה ופתח את הפרויקט ב-ERP';
    }
  };

  window.ofCopy = (btn, dl) => {
    const payload = ofPayload();
    if (!payload.offer_name) { alert('שם ההצעה חובה בהצעת פרויקט.'); return; }
    const txt = JSON.stringify(payload, null, 1);
    if (dl) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([txt], { type: 'application/json' }));
      a.download = 'offer-' + (payload.project_name || 'x').replace(/[^\w\u0590-\u05FF-]/g, '_') + '.json';
      a.click();
      return;
    }
    navigator.clipboard.writeText(txt).then(() => { if (btn) btn.textContent = '✓ הועתק — הדבק לצ׳אט'; }, () => alert('ההעתקה נכשלה — הורד כקובץ במקום'));
  };
}

function quoteTotal() {
  let t = 0;
  for (const it of impItems) if (it.price) t += it.price * (it.placed || it.qty || 0);
  return t;
}
/* הצעת ארון מסד — לפי סך ה-U שדורשים המוצרים; קודם מלאי, אחר-כך מהקטלוג */
function suggestRack() {
  const autoRacks = P.nodes.filter(n => n.kind === 'rack' && /אינו בהצעה/.test(n.name));
  let needU = 0;
  autoRacks.forEach(r => needU += (r.units || []).reduce((s, u) => s + u.u, 0));
  if (!needU) needU = impItems.filter(it => (it.dest === 'unit' || it.dest === 'panelUnit') && !it.added).reduce((s, it) => s + (it.u || 1) * (it.qty || 1), 0);
  needU = Math.max(needU, 1);
  const recU = Math.ceil((needU + 2) / 2) * 2; /* מרווח נשימה + זוגי */
  const stockRacks = impItems.filter(it => it.dest === 'rack');
  const cands = [], seen = new Set();
  const scan = (name, key) => { if (!name) return; const st = classifyStock(name); if (st && st.dest === 'rack' && !seen.has(name)) { seen.add(name); cands.push({ name, key, u: st.ru || 12 }); } };
  (typeof ERP_KITS !== 'undefined' ? ERP_KITS : []).forEach(k => k.items.forEach(x => scan(x.name, x.key)));
  (typeof ERP_CATALOG !== 'undefined' ? ERP_CATALOG : []).forEach(p => (p.items || []).forEach(x => scan(x.name, x.key)));
  let fit = cands.filter(c => c.u >= needU).sort((a, b) => a.u - b.u);
  if (!fit.length) fit = cands.sort((a, b) => b.u - a.u);
  const old = document.getElementById('rackSugOv'); if (old) old.remove();
  const ov = document.createElement('div');
  ov.id = 'rackSugOv';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(20,24,32,.5);z-index:99;display:flex;align-items:center;justify-content:center';
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  const opt = c => `<button style="display:block;width:100%;text-align:right;margin-bottom:5px" onclick="addRackToOffer('${esc(c.name).replace(/'/g, '&#39;')}','${c.key || ''}',${c.u})">🗄 ${esc(c.name.slice(0, 46))} · ${c.u}U</button>`;
  ov.innerHTML = `<div style="background:#fff;border-radius:12px;padding:16px;max-width:480px;width:94%;max-height:80vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,.35)">
    <b style="display:block;margin-bottom:2px">🗄 הצעת ארון מסד</b>
    <p class="muted" style="margin:0 0 10px">המוצרים דורשים <b>${needU}U</b> בשימוש. מומלץ ארון של לפחות <b>${recU}U</b> (עם מרווח).</p>
    ${stockRacks.length ? `<div style="font-weight:700;font-size:12px;margin-bottom:4px">📦 כבר בהצעה/מלאי:</div>${stockRacks.map(it => `<button style="display:block;width:100%;text-align:right;margin-bottom:5px;background:#eef7f1" onclick="document.getElementById('rackSugOv').remove()">✓ ${esc(it.name.slice(0, 44))}</button>`).join('')}<div style="border-top:1px solid #eee;margin:8px 0"></div>` : ''}
    <div style="font-weight:700;font-size:12px;margin-bottom:4px">מהקטלוג (ERP) — מתאימים ל-${needU}U:</div>
    ${fit.length ? fit.slice(0, 10).map(opt).join('') : '<p class="muted">לא נמצא ארון בקטלוג. הוסף ידנית או חפש בפאנל.</p>'}
    <button style="display:block;width:100%;margin-top:8px" onclick="addRackToOffer('ארון מסד ${recU}U','',${recU})">➕ ארון מסד גנרי ${recU}U</button>
    <button style="display:block;width:100%;margin-top:6px;background:#f3d9d2" onclick="document.getElementById('rackSugOv').remove()">סגור</button>
  </div>`;
  document.body.appendChild(ov);
}
function addRackToOffer(name, key, u) {
  const it = { on: true, qty: 1, name, src: 'הצעת ארון', key, dest: 'rack', cat: 'other', ru: u, u: 1, iid: uid('i') };
  autoPrice(it); impItems.push(it);
  const ov = document.getElementById('rackSugOv'); if (ov) ov.remove();
  dockOpen = true; dockMin = false; render();
}
function renderImp() {
  dockOpen = true;
  const dk = $('#dock');
  dk.style.display = 'block';
  if (dockMin) {
    dk.style.width = '42px';
    dk.innerHTML = `<button onclick="dockMin=false;renderImp()" title="הרחב הצעת מחיר" style="writing-mode:vertical-rl;height:150px;padding:8px 4px;font-weight:700">🧾 הצעת מחיר ⮟</button>`;
    return;
  }
  dk.style.width = dockWide ? 'calc(100vw - 60px)' : '480px';
  impItems.forEach(autoPrice);
  const racks = P.nodes.filter(n => n.kind === 'rack');
  const destOpts = it => ['unit|יחידה בארון', 'panelUnit|פאנל בארון', 'point|מוקד/רמקול', 'panelNode|קופסאת מולטי', 'rack|ארון מסד חדש', 'cable|כבל מוכן (מלאי)', 'reel|גליל כבל (מלאי)', 'conn|מחבר (מלאי)', 'ignore|התעלם']
    .map(o => { const [v, l] = o.split('|'); return `<option value="${v}" ${it.dest === v ? 'selected' : ''}>${l}</option>`; }).join('');
  const rowHTML = (it, i, ov) => {
    const acc = isAccessory(it.name);
    const canDrag = !acc && ((it.dest === 'cable' || it.dest === 'reel') || !it.added);
    const canPin = !acc && ['unit', 'panelUnit', 'point', 'panelNode', 'rack'].includes(it.dest);
    const canWire = it.dest === 'cable' || it.dest === 'reel';
    const wireOn = canWire && wireMode && it.stockId && wireStock === (it.dest === 'reel' ? 'reel|' : 'cable|') + it.stockId;
    const canConn = it.dest === 'conn';
    const connOn = connPin && connPin.iid === it.iid;
    const pinOn = pinMode && pinMode.iid === it.iid;
    const replOn = replFor === it.iid;
    const zs = itemZones(it);
    const zoneCell = ov ? `<b style="font-size:11px">${esc(ov.zone)}</b>`
      : `<select style="max-width:88px;font-size:10px" onchange="setItemZone(${i},this.value)"><option value="">—</option>${(P.zones || []).map(z => `<option value="${esc(z.name)}" ${zs.length === 1 && zs[0][0] === z.name ? 'selected' : ''}>${esc(z.name)}</option>`).join('')}</select>` +
        (zs.length > 1 ? `<div style="font-size:9px">${zs.map(([z, n]) => esc(z) + (n > 1 ? ' ×' + n : '')).join('<br>')}</div>` : '');
    const cnt = ov ? ov.cnt : null;
    return `<tr style="${replOn ? 'background:#e8f0ff' : pinOn || wireOn || connOn ? 'background:#fff3e8' : it.added ? 'background:#f2faf4' : ''}">
        <td style="white-space:nowrap">${acc ? `<span title="אביזר — משויך למוצר, לא מוצב בתכנית" style="font-size:13px">🔩</span>` : ''}${canDrag ? `<span data-dragi="${i}" title="גרור אל התכנית" style="cursor:grab;user-select:none;font-size:14px;color:#c96f4a">⠿</span>` : ''}${canPin ? `<button onclick="togglePin('${it.iid}')" title="מצב נעיצה — לחץ על התכנית שוב ושוב" style="padding:0 5px;font-size:12px;${pinOn ? 'background:#ff8a50' : 'background:transparent'}">📌</button>` : ''}${canWire ? `<button onclick="wireFromItem('${it.iid}')" title="פרוס כבל זה — לחץ על שני מוצרים בתכנית (Esc לסיום)" style="padding:0 5px;font-size:12px;${wireOn ? 'background:#ff8a50' : 'background:transparent'}">🔌</button>` : ''}${canConn ? `<button onclick="connPinFromItem('${it.iid}')" title="נקור מחבר על קצה כבל — לחץ ליד קצה של כבל בתכנית" style="padding:0 5px;font-size:12px;${connOn ? 'background:#ff8a50' : 'background:transparent'}">📌</button>` : ''}</td>
        <td>${it.added ? '✓' : `<input type="checkbox" ${it.on ? 'checked' : ''} onchange="impItems[${i}].on=this.checked">`}</td>
        <td><input style="width:42px" type="number" min="0" value="${it.qty}" title="כמות — ניתנת לעריכה בכל שלב עד אישור הלקוח" onchange="setItemQty(${i},this.value)">${(() => {
          const inf = it.key ? erpInfo(it.key) : null;
          if (!inf) return '';
          return `<div style="font-size:9px;line-height:1.5;margin-top:2px;white-space:nowrap">
            <span title="כמות במלאי (ERP)" style="color:${inf.qty > 0 ? '#0a7a4b' : '#a32222'};font-weight:700">מלאי ${inf.qty}</span><br>
            <span title="כמות עתידית — פירוט הזמנות פתוחות ותאריכים" onclick="futureQty('${it.key}','${esc(it.name.slice(0, 40)).replace(/'/g, '&#39;')}')" style="color:#185fa5;cursor:pointer;text-decoration:underline">עתידי</span></div>`;
        })()}</td>
        <td style="text-align:center;font-weight:700;color:${(it.placed || 0) >= it.qty ? '#0f6e56' : '#c96f4a'}">${cnt != null ? cnt : ['unit', 'panelUnit', 'point', 'panelNode', 'rack', 'conn'].includes(it.dest) ? (it.placed || 0) : (it.dest === 'cable' || it.dest === 'reel') ? planMeters(it) : '—'}</td>
        <td style="font-size:10px;max-width:95px">${zoneCell}</td>
        <td style="min-width:190px"><textarea rows="2" style="width:190px;resize:vertical;font-family:inherit;font-size:12px;line-height:1.25;vertical-align:middle" ${it.added ? 'disabled' : `onchange="impItems[${i}].name=this.value"`}>${esc(it.name)}</textarea><button onclick="startReplace('${it.iid}')" title="החלף מוצר — הקלד בחיפוש ובחר" style="padding:0 4px;font-size:11px;${replOn ? 'background:#7aa2ff' : 'background:transparent'}">🔄</button>${acc ? `<div style="margin-top:2px"><span style="font-size:10px;color:#8a6a00">🔩 משויך ל:</span> <select style="font-size:10px;max-width:150px" onchange="impItems[${i}].parentIid=this.value||undefined;save()">
          <option value="">— בחר מוצר —</option>
          ${impItems.filter(x => x.iid !== it.iid && isSpeakerItem(x.name)).map(x => `<option value="${x.iid}" ${it.parentIid === x.iid ? 'selected' : ''}>${esc(x.name.slice(0, 30))}</option>`).join('')}
        </select></div>` : ''}</td>
        <td style="white-space:nowrap"><input style="width:76px;font-size:11px;${it.key ? '' : 'border-color:#c1121f'}" value="${esc(it.key || '')}" placeholder="ללא מק״ט" title="${it.key ? 'מק״ט ERP — ניתן לתיקון' : 'אין מק״ט — השורה לא תיקלט בהצעה ב-ERP'}" onchange="impItems[${i}].key=this.value.trim()||undefined;autoPrice(impItems[${i}]);renderImp();save()"></td>
        <td><input style="width:58px" type="number" min="0" value="${it.price ?? ''}" onchange="impItems[${i}].price=+this.value;renderImp();save()"></td>
        <td style="white-space:nowrap;font-weight:600">${it.price ? '₪' + (it.price * (cnt != null ? cnt : (it.placed || it.qty))).toLocaleString() : '—'}</td>
        <td><input style="width:78px" value="${esc(it.note || '')}" placeholder="הערה" onchange="impItems[${i}].note=this.value;save()"></td>
        <td><select ${it.added ? 'disabled' : `onchange="impItems[${i}].dest=this.value"`}>${destOpts(it)}</select></td>
        <td><select ${it.added ? 'disabled' : `onchange="impItems[${i}].rack=this.value"`}>${racks.map(r => `<option value="${r.id}" ${it.rack === r.id ? 'selected' : ''}>${esc(r.name)}</option>`).join('')}</select></td>
        <td style="font-size:11px;white-space:nowrap">${it.added ? (stockUsage(it) || 'בתכנית') : (it.placed ? it.placed + '/' + it.qty : '—')}</td>
        <td style="font-size:10px;max-width:70px;overflow:hidden">${esc(it.src)}</td>
        <td><button style="padding:1px 7px" onclick="impItems.splice(${i},1);renderImp();save()">✕</button></td></tr>`;
  };
  let rowsHtml = '';
  if (dockWide) {
    /* תצוגה מורחבת — הטבלה מחולקת לפי אזורים; מוצר בשני אזורים מופיע בנפרד בכל אזור */
    const groups = {};
    impItems.forEach((it, i) => {
      it.iid = it.iid || uid('i');
      const zs = itemZones(it);
      if (zs.length) zs.forEach(([z, n]) => { (groups[z] = groups[z] || []).push({ it, i, ov: zs.length > 1 ? { zone: z, cnt: n } : null }); });
      else (groups['ללא אזור'] = groups['ללא אזור'] || []).push({ it, i, ov: null });
    });
    const order = [...(P.zones || []).map(z => z.name).filter(z => groups[z]), ...Object.keys(groups).filter(z => !(P.zones || []).some(p => p.name === z))];
    for (const z of order) {
      rowsHtml += `<tr><td colspan="14" style="background:#e9ecf7;font-weight:800;padding:5px 8px">🗺 ${esc(z)} · ${groups[z].length} פריטים</td></tr>` +
        groups[z].map(g => rowHTML(g.it, g.i, g.ov)).join('');
    }
  } else {
    rowsHtml = impItems.map((it, i) => { it.iid = it.iid || uid('i'); return rowHTML(it, i, null); }).join('');
  }
  const body = impItems.length
    ? `<p class="muted" style="margin-bottom:8px">✓ = בתכנית (עם ניצול מלאי) · <b>גרור ⠿ ישר לתכנית</b> — מוצר למיקום/לארון, כבל מפעיל חיבור בלחיצה עם הפרטים שלו.</p>
      <div style="overflow-x:auto"><table class="cablelist"><tr><th></th><th></th><th>כמות</th><th>בתכנית</th><th>אזור</th><th>שם פריט</th><th>מק"ט</th><th>מחיר ₪</th><th>סה"כ</th><th>הערה</th><th>יעד בתכנית</th><th>ארון</th><th>סטטוס</th><th>מקור</th><th></th></tr>` +
      rowsHtml + '</table></div>' +
      `<div style="display:flex;align-items:center;gap:10px;margin-top:8px;padding:8px;background:#f4f2ec;border-radius:8px">
        <b style="flex:1">סה"כ הצעת מחיר:</b><b style="font-size:16px;color:#c96f4a">₪${quoteTotal().toLocaleString()}</b>
      </div>
      <button class="primary" style="width:100%;margin-top:8px" onclick="addImported()">הוסף את המסומנים לתכנית</button>
      <button style="width:100%;margin-top:6px;background:#f3d9d2;color:#8c2f16" onclick="deleteMarked()">🗑 מחק את השורות המסומנות (✓)</button>
      <button style="width:100%;margin-top:6px" onclick="suggestRack()">🗄 הצע ארון מסד לפי ה-U הנדרש</button>
      <button style="width:100%;margin-top:6px" onclick="showBom()">🧾 כתב כמויות מהתכנית</button>
      <button style="width:100%;margin-top:8px;background:#0f6e56;color:#fff;font-weight:800;padding:10px" onclick="sendOffer()">📤 שלח הצעה ל-ERP</button>`
    : '<p class="muted">חפש למעלה מוצר או קיט, לחץ עליו — ונקר אותו על התכנית. כל נעיצה נרשמת כאן עם האזור והמחיר.</p>';
  const q = dockQ.trim();
  const results = q ? dockSearchResults(q) : [];
  dk.innerHTML = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;border-bottom:1px solid #eee;padding-bottom:6px">
      <h3 style="font-size:14px;flex:1;margin:0">🧾 הצעת מחיר · פריטים (${impItems.length})</h3>
      ${pinMode ? '<span style="background:#ff8a50;color:#1a1e28;font-size:11px;font-weight:700;padding:2px 8px;border-radius:5px">📌 נקר על התכנית (Esc לסיום)</span>' : ''}
      ${connPin ? '<span style="background:#ff8a50;color:#1a1e28;font-size:11px;font-weight:700;padding:2px 8px;border-radius:5px">📌 לחץ ליד קצה כבל (Esc לסיום)</span>' : ''}
      ${replFor ? '<span style="background:#7aa2ff;color:#1a1e28;font-size:11px;font-weight:700;padding:2px 8px;border-radius:5px">🔄 חפש ובחר מוצר להחלפה (Esc לביטול)</span>' : ''}
      <button onclick="showKits()" title="קיטים מוכנים (ERP)" style="white-space:nowrap">🧰 קיטים</button>
      <button onclick="showErp()" title="משיכה מפרויקטים מאושרים והצעות קיימות (ERP)" style="white-space:nowrap">🗂 פרויקטים</button>
      <button onclick="dockWide=!dockWide;renderImp()" title="${dockWide ? 'חזרה מהמסך המלא' : 'הרחב על כל המסך'}" style="${dockWide ? 'background:#ff8a50' : ''}">${dockWide ? '⤡' : '⤢'}</button>
      <button onclick="dockMin=true;renderImp()" title="צמצם הצידה">◀</button>
    </div>
    <div class="fld"><input id="dockQin" placeholder="🔍 חפש מוצר או קיט… לחיצה = הוספה ונעיצה" value="${esc(dockQ)}" oninput="dockQupd(this.value)" style="width:100%"></div>` +
    (results.length ? results.map(r => r.type === 'kit'
      ? `<div class="crow" onclick="pickKitInline(${r.i})"><span class="badge" style="background:#534ab7">${r.n}</span><span class="txt"><b>🧰 ${esc(r.name)}</b> · קיט מלא</span></div>`
      : `<div class="crow" onclick="pickSearchItem('${esc(r.name).replace(/'/g, '&#39;')}','${r.key || ''}')"><span class="badge" style="background:#0f6e56">📌</span>${imgCell(r.key, 28)}<span class="txt">${esc(r.name)}</span>${stockBadge(r.key)}</div>`
    ).join('') + '<div style="border-bottom:1px solid #eee;margin:8px 0"></div>' : '') +
    body;
}
function openImported() { dockOpen = true; dockMin = false; renderImp(); }
function itemZones(it) { return it.zones ? Object.entries(it.zones).filter(([z, n]) => n > 0) : []; }
/* שינוי כמות בכל שלב — כולל אחרי הצבה: עודף מוקדים על התכנית מוסר, וחוסר נפתח להצבה */
function setItemQty(i, val) {
  const it = impItems[i]; if (!it) return;
  const q = Math.max(0, +val || 0);
  const placed = +it.placed || 0;
  it.qty = q;
  if (q < placed) {
    /* מסירים את המוקדים האחרונים שנוצרו מהפריט הזה */
    const mine = P.nodes.filter(n => n.srcIid === it.iid);
    const drop = mine.slice(Math.max(0, mine.length - (placed - q))).map(n => n.id);
    const ds = new Set(drop);
    P.nodes = P.nodes.filter(n => !ds.has(n.id));
    P.cables = P.cables.filter(c => !ds.has(c.from) && !ds.has(c.to));
    it.placed = q;
    if (it.zones) Object.keys(it.zones).forEach(k => { it.zones[k] = Math.min(it.zones[k], q); });
  }
  it.added = q > 0 && (it.placed || 0) >= q;
  render(); save();
  if (q < placed) uiToast('הכמות ירדה ל-' + q + ' — הוסרו ' + (placed - q) + ' מוקדים מהתכנית');
}
function setItemZone(i, v) {
  const it = impItems[i];
  if (!v) delete it.zones; else it.zones = { [v]: it.placed || it.qty || 1 };
  renderImp(); save();
}
function startReplace(iid) {
  replFor = replFor === iid ? null : iid;
  renderImp();
  const qi = document.getElementById('dockQin');
  if (qi && replFor) qi.focus();
}
function dockQupd(v) {
  dockQ = v;
  renderImp();
  const qi = document.getElementById('dockQin');
  if (qi) { qi.focus(); const L = qi.value.length; qi.setSelectionRange(L, L); }
}
function autoRack(x, y, uu) {
  let r = P.nodes.find(n => n.kind === 'rack');
  if (!r) {
    /* הארון נפתח בגודל המוצר הראשון וגדל אוטומטית עם כל תוספת */
    r = { id: uid('n'), kind: 'rack', name: 'ארון — אינו בהצעה', sub: 'נוצר אוטומטית, שנה שם', x: x ?? 150, y: y ?? 150, ru: uu || 2, units: [] };
    P.nodes.push(r);
  }
  return r;
}
function bumpPlaced(it) {
  it.placed = (it.placed || 0) + 1;
  if (it.placed > it.qty) it.qty = it.placed; /* נעיצה מעבר לכמות מגדילה אותה */
  if (it.placed >= it.qty) it.added = true;
}
/* באיזה אזור סאונד נמצאת נקודה על הקנבס */
function zoneAt(pt) {
  for (const z of (P.zones || [])) {
    if (z.poly) {
      let inside = false;
      const p = z.poly;
      for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
        if ((p[i].y > pt.y) !== (p[j].y > pt.y) &&
            pt.x < (p[j].x - p[i].x) * (pt.y - p[i].y) / (p[j].y - p[i].y) + p[i].x) inside = !inside;
      }
      if (inside) return z;
    } else {
      const left = 2200 - z.x - z.w;
      if (pt.x >= left && pt.x <= left + z.w && pt.y >= z.y && pt.y <= z.y + z.h) return z;
    }
  }
  return null;
}
function unplace(iid) {
  const it = impItems.find(x => x.iid === iid);
  if (!it) return;
  it.placed = Math.max(0, (it.placed || 0) - 1);
  if (it.placed < it.qty) it.added = false;
}
let pinMode = null, calMode = null, zoneMode = null, selZone = null, dragZ = null, sizeZ = null, zoneNameNext = '';
const ZUSE = { 'מוזיקת רקע': '#1D9E75', 'מוזיקה לבר': '#378ADD', 'הופעות חיות': '#7F77DD', 'מוזיקת ריקודים': '#EF9F27', 'מועדון על מלא': '#E24B4A' };
const zColor = z => ZUSE[z.usage] || '#888780';
function zoneArea(z) {
  if (!z.poly) return z.w * z.h;
  let a = 0;
  const p = z.poly;
  for (let i = 0; i < p.length; i++) {
    const j = (i + 1) % p.length;
    a += p[i].x * p[j].y - p[j].x * p[i].y;
  }
  return Math.abs(a / 2);
}
function renderZones() {
  const host = $('#zonesc');
  host.innerHTML = '';
  const zs = P.zones || [];
  /* פוליגונים — שכבת SVG אחת */
  let svgp = '';
  zs.forEach(z => {
    if (!z.poly) return;
    const c = zColor(z);
    svgp += `<polygon points="${z.poly.map(p => p.x + ',' + p.y).join(' ')}" fill="${c}22" stroke="${c}" stroke-width="2.5" stroke-dasharray="8 5" ${selZone === z.id ? `style="filter:drop-shadow(0 0 4px ${c})"` : ''}/>`;
  });
  /* קירות: סגור-קשה=קו עבה כהה, סגור-רך=חום בינוני, פתוח=מקווקו אפור. ממוספרים לפוליגון. */
  const wallLine = (x1, y1, x2, y2, w, num) => {
    let s = '';
    if (w.open) s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#9aa3b5" stroke-width="2" stroke-dasharray="4 6"/>`;
    else { const hard = wallHard(w.mat); s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${hard ? '#2d3444' : '#8a6d3b'}" stroke-width="${hard ? 6 : 4}"/>`; }
    if (num != null) { const mx = (x1 + x2) / 2, my = (y1 + y2) / 2; s += `<circle cx="${mx}" cy="${my}" r="8" fill="#fff" stroke="#666" stroke-width="1"/><text x="${mx}" y="${my + 3}" text-anchor="middle" font-size="9" font-weight="700" fill="#444">${num}</text>`; }
    return s;
  };
  zs.forEach(z => {
    if (!z.walls) return;
    if (z.poly) {
      z.poly.forEach((p, i) => {
        const w = z.walls['e' + i]; if (!w) return;
        const q = z.poly[(i + 1) % z.poly.length];
        svgp += wallLine(p.x, p.y, q.x, q.y, w, i + 1);
      });
    } else {
      const L = 2200 - z.x - z.w, R = 2200 - z.x, T = z.y, B = z.y + z.h;
      const seg = { top: [L, T, R, T], right: [R, T, R, B], bottom: [L, B, R, B], left: [L, T, L, B] };
      for (const [s] of WALL_SIDES) { const w = z.walls[s]; if (w) svgp += wallLine(...seg[s], w, null); }
    }
  });
  if (svgp) host.innerHTML = `<svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible">${svgp}</svg>`;
  zs.forEach(z => {
    const c = zColor(z);
    const dims = P.scale ? ` · ${(zoneArea(z) * P.scale * P.scale).toFixed(0)} מ"ר` : '';
    if (z.poly) {
      const lbl = document.createElement('span');
      lbl.className = 'zlbl';
      lbl.dataset.zdrag = z.id;
      const topPt = z.poly.reduce((m, p) => p.y < m.y ? p : m, z.poly[0]);
      lbl.style.cssText = `position:absolute;left:${topPt.x}px;top:${Math.max(0, topPt.y - 26)}px;background:${c};z-index:1`;
      lbl.textContent = `🗺 ${z.name}${z.usage ? ' · ' + z.usage : ''}${dims}`;
      lbl.addEventListener('pointerdown', e => { if (zoneMode) return; });
      host.appendChild(lbl);
      return;
    }
    const d = document.createElement('div');
    d.className = 'zone';
    d.style.cssText = `right:${z.x}px;top:${z.y}px;width:${z.w}px;height:${z.h}px;border-color:${c};background:${c}1f;${selZone === z.id ? 'box-shadow:0 0 0 3px ' + c + '66;' : ''}`;
    d.innerHTML = `<span class="zlbl" data-zdrag="${z.id}" style="background:${c}">🗺 ${esc(z.name)}${z.usage ? ' · ' + esc(z.usage) : ''}${dims}</span>
      <span data-zdrag="${z.id}" title="גרור להזזת האזור" style="position:absolute;left:-9px;top:-9px;width:20px;height:20px;border-radius:50%;background:${c};color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;cursor:grab;box-shadow:0 1px 3px rgba(0,0,0,.35);z-index:2">✥</span>
      <span class="zsz" data-zsize="${z.id}" style="background:${c}"></span>`;
    d.addEventListener('pointerdown', e => {
      if (e.target.closest('[data-zdrag],[data-zsize]')) return;
      if (zoneMode || pinMode || calMode || wireMode) return;
      selZone = z.id; sel = null; ui.tab = 'node'; render();
    });
    host.appendChild(d);
  });
}
function closeZonePoly() {
  const pts = zoneMode.poly;
  zoneMode = null;
  if (!pts || pts.length < 3) { render(); return; }
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const left = Math.min(...xs), top = Math.min(...ys);
  const w = Math.max(...xs) - left, h = Math.max(...ys) - top;
  P.zones = P.zones || [];
  const z = { id: uid('z'), name: zoneNameNext.trim() || 'אזור ' + (P.zones.length + 1), usage: '', poly: pts, x: Math.max(0, 2200 - left - w), y: top, w, h };
  zoneNameNext = '';
  P.zones.push(z);
  selZone = z.id; sel = null; ui.tab = 'node';
  render();
}
document.addEventListener('dblclick', e => {
  if (zoneMode && zoneMode.poly && zoneMode.poly.length > 2) closeZonePoly();
});
function applyZonesJson(zs) {
  if (!zs || !zs.length) return 0;
  const W = P.bgW || 1400, H = $('#bgimg').offsetHeight || Math.round(W * 0.7);
  P.zones = P.zones || [];
  for (const zz of zs) {
    const w = Math.max(80, (zz.rw || 0.2) * W), h = Math.max(50, (zz.rh || 0.2) * H);
    const left = (zz.rx || 0) * W, top = (zz.ry || 0) * H;
    P.zones.push({ id: uid('z'), name: zz.name || 'אזור', usage: zz.usage || '', x: Math.max(0, 2200 - left - w), y: Math.max(0, top), w, h });
  }
  render();
  return zs.length;
}
/* זיהוי אזורים אוטומטי — קריאה ישירה ל-Claude API (מפתח נשמר מקומית בלבד) */
async function autoZones() {
  if (!P.bg) { alert('העלה קודם תכנית רקע'); return; }
  let key = '';
  try { key = localStorage.getItem('koflow_apikey') || ''; } catch (e) {}
  if (!key) {
    key = await uiPrompt('חד-פעמי: הדבק מפתח API של Claude (נשמר רק בדפדפן שלך, נשלח רק ל-Anthropic).\nמשיגים ב: console.anthropic.com → API Keys\n\nביטול = מסלול ידני דרך הצ׳אט.');
    if (!key) { autoZonesHint(); return; }
    key = key.trim();
    try { localStorage.setItem('koflow_apikey', key); } catch (e) {}
  }
  const btnMsg = 'מזהה אזורים… (~15 שניות)';
  render();
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1500,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: P.bg.split(',')[1] } },
          { type: 'text', text: 'זו תכנית אדריכלית של חלל אירוח/מסחרי. זהה אזורי סאונד לוגיים (רחבת ריקודים, במה, בר, אזור ישיבה/מסעדה, חוץ/מרפסת, כניסה). דלג על מטבחים, שירותים ומחסנים. החזר JSON בלבד ללא שום טקסט נוסף: {"zones":[{"name":"שם בעברית","usage":"מוזיקת רקע|מוזיקה לבר|הופעות חיות|מוזיקת ריקודים|מועדון על מלא","rx":0.1,"ry":0.2,"rw":0.3,"rh":0.25}]} — rx,ry מיקום יחסי (0-1) של הפינה השמאלית-העליונה של האזור בתמונה, rw,rh רוחב וגובה יחסיים. עד 8 אזורים.' }
        ] }]
      })
    });
    const j = await res.json();
    if (j.error) throw new Error(j.error.message || 'שגיאת API');
    let txt = (j.content && j.content[0] && j.content[0].text || '').replace(/```json|```/g, '').trim();
    txt = txt.slice(txt.indexOf('{'));
    const n = applyZonesJson(JSON.parse(txt).zones);
    alert('✓ זוהו ' + n + ' אזורים — ערוך שמות ותכליות בטבלה למטה או בלחיצה על אזור');
  } catch (err) {
    if (String(err.message).includes('401') || /invalid|authentication/i.test(err.message)) { try { localStorage.removeItem('koflow_apikey'); } catch (e) {} }
    alert('הזיהוי האוטומטי נכשל: ' + err.message + '\nעובר למסלול הידני דרך הצ׳אט.');
    autoZonesHint();
  }
}
function autoZonesHint() {
  const txt = `זהה אזורי סאונד בתכנית שמצורפת בצילום, והחזר קובץ JSON בפורמט הבא לייבוא ל-KO Projects:
{"zones":[{"name":"שם האזור","usage":"מוזיקת רקע|מוזיקה לבר|הופעות חיות|מוזיקת ריקודים|מועדון על מלא","rx":0.1,"ry":0.2,"rw":0.3,"rh":0.25}]}
כאשר rx,ry = מיקום יחסי (0-1) של הפינה השמאלית-עליונה של האזור בתוך תמונת התכנית, ו-rw,rh = רוחב וגובה יחסיים.
זהה אזורים לפי ההקשר: במה, רחבת ריקודים, בר, ישיבה, מרפסת/חוץ, מטבח (התעלם), שירותים (רקע).`;
  try { navigator.clipboard.writeText(txt); } catch (e) {}
  alert('📋 הבקשה הועתקה ללוח!\n\n1. צלם את התכנית (צילום מסך של הקנבס)\n2. שלח ל-Claude את הצילום + הדבק את הבקשה\n3. את קובץ ה-JSON שיחזור ייבא דרך ייבוא ▾ ← 📦 ייבוא פריטים מ-ERP (JSON)\n\nהאזורים ייכנסו ישר לתכנית.');
}
/* עוצמת נגינה יעד (dB) לפי תכלית */
const USAGE_SPL = { 'מוזיקת רקע': 72, 'בית קפה': 85, 'מסעדה': 90, 'מוזיקה לבר': 95, 'הופעות חיות': 100, 'מוזיקת ריקודים': 110, 'מועדון על מלא': 115 };
const USAGES = ['מוזיקת רקע', 'בית קפה', 'מסעדה', 'מוזיקה לבר', 'הופעות חיות', 'מוזיקת ריקודים', 'מועדון על מלא'];
const BRANDS = ['— ללא העדפה —', 'KT Audio', 'Kling & Freitag', 'Funktion-One', 'Lambda Labs'];
function zoneAreaM(z) { return P.scale ? zoneArea(z) * P.scale * P.scale : 0; }
/* רמקולים לפי מותג — מבסיס הידע + אינדקס ה-ERP */
const BRAND_KW = { 'KT Audio': /KT |UNICORN|PAGAZ|TILL|EUPHORIA|NIKO|WR ?600|CA\/KT/i, 'Kling & Freitag': /SPECTRA|GRAVIS|NOMOS|CA\s?-?106|SEQUENZA|PASSIO|K&F|KLING/i, 'Funktion-One': /FUNKTION|F81|F55|F101|F5\b|RES\d|EVO|BR1|F12\d/i, 'Lambda Labs': /LAMBDA|CX-?\d|TX-?\d|QX|MF-?\d/i };
function brandSpeakers(brand) {
  if (!brand || !BRAND_KW[brand] || typeof ERP_ITEMS === 'undefined') return [];
  const re = BRAND_KW[brand], spk = /רמקול|סאב|וופר|קולונ|מוניטור|speaker|sub|monitor|SPECTRA|GRAVIS|NOMOS|F81|F55|EVO|RES\d|UNICORN|PAGAZ|TILL|EUPHORIA|NIKO|CX-?\d/i;
  const out = [], seen = new Set();
  for (const [k, n] of ERP_ITEMS) { if (out.length >= 40) break; if (re.test(n) && spk.test(n) && !seen.has(n)) { seen.add(n); out.push(n); } }
  return out;
}
function zoneSystemBuilder(z) {
  const zid = z.id;
  const tgt = z.usage ? USAGE_SPL[z.usage] : '';
  const q = (z._sq || '').trim();
  const res = q ? dockSearchResults(q).filter(r => r.type === 'item') : [];
  return `<div style="background:#f4f2ec;border-radius:8px;padding:10px;margin-top:6px">
    <div class="fld"><label>🏷 תבנית מקום — ממלא אוטומטית את כל ההגדרות</label>
      <div style="display:flex;gap:4px;flex-wrap:wrap">
        ${[['live', '🎤 הופעה חיה'], ['club', '🪩 מועדון'], ['bar', '🍸 בר'], ['rest', '🍽 מסעדה'], ['cafe', '☕ בית קפה'], ['shop', '👕 חנות בגדים']].map(([v, l]) => `<button onclick="applyVenuePreset('${zid}','${v}')" style="padding:3px 10px;font-size:11px;${z._preset === v ? 'background:#c9502e;color:#fff;font-weight:700' : ''}">${l}</button>`).join('')}
      </div></div>
    <div class="fld"><label>עוצמת נגינה / תכלית</label><select onchange="setZoneField('${zid}','usage',this.value)">
      <option value="" ${!z.usage ? 'selected' : ''}>— בחר —</option>
      ${USAGES.map(u => `<option value="${u}" ${z.usage === u ? 'selected' : ''}>${u} · ${USAGE_SPL[u]}dB</option>`).join('')}
    </select>${tgt ? `<span class="muted" style="font-size:11px"> SPL יעד: ${tgt} dB</span>` : ''}</div>

    <div class="fld"><label>סוג התקנה</label><select onchange="setZoneField('${zid}','_place',this.value)">
      <option value="corners" ${z._place === 'corners' ? 'selected' : ''}>4 פינות — פורגראונד/רחבה (Funktion-One)</option>
      <option value="ceiling" ${z._place === 'ceiling' ? 'selected' : ''}>תקרה — פריסה מבוזרת</option>
      <option value="live" ${z._place === 'live' ? 'selected' : ''}>🎤 במה — מיינים L/R + סאבים + דיליי</option>
      <option value="ring" ${(z._place || 'ring') === 'ring' ? 'selected' : ''}>🔄 היקפי — כל הקירות, מרווח קבוע (ברירת מחדל)</option>
    </select></div>
    ${['wall', 'live'].includes(z._place) ? `<div class="fld"><label>${z._place === 'live' ? 'קיר הבמה' : 'מאילו קירות להקרין'} — ניתן לבחור כמה (ריחוף מאיר בתכנית)</label>
      <div style="display:flex;gap:4px;flex-wrap:wrap">
        <button onmouseenter="wallHint('${zid}','')" onmouseleave="wallHint(null)" onclick="setZoneWall('${zid}','')" style="padding:3px 10px;font-size:11px;${!(z._walls && z._walls.length) && !z._wall ? 'background:#c9502e;color:#fff;font-weight:700' : ''}">הארוך (מומלץ)</button>
        ${zoneWallList(z).map(([s, l]) => { const on = (z._walls || []).includes(s) || z._wall === s; return `<button onmouseenter="wallHint('${zid}','${s}')" onmouseleave="wallHint(null)" onclick="setZoneWall('${zid}','${s}')" style="padding:3px 10px;font-size:11px;${on ? 'background:#c9502e;color:#fff;font-weight:700' : ''}">${on ? '✓ ' : ''}${l}</button>`; }).join('')}
      </div></div>` : ''}
    ${['corners','live'].includes(z._place) ? '' : `<div class="fld"><label>${['wall','ring'].includes(z._place || 'ring') ? 'צפיפות לאורך הקיר' : 'צפיפות פריסה (לפי תקן distributed)'}</label><select onchange="setZoneField('${zid}','_dens',this.value)">
      ${(z._place || 'wall') === 'wall' ? `
        <option value="sparse" ${z._dens === 'sparse' ? 'selected' : ''}>רקע רופף — רמקול כל 10 מ׳</option>
        <option value="edge" ${(z._dens || 'edge') === 'edge' ? 'selected' : ''}>מעט — רמקול כל 7 מ׳ (ברירת מחדל)</option>
        <option value="min" ${z._dens === 'min' ? 'selected' : ''}>חפיפה מינימלית — כל 5 מ׳</option>
        <option value="full" ${z._dens === 'full' ? 'selected' : ''}>חפיפה מלאה — כל 3 מ׳ (דיבור/הופעות)</option>` : `
        <option value="sparse" ${z._dens === 'sparse' ? 'selected' : ''}>רקע רופף — רמקול כל ~10 מ׳</option>
        <option value="edge" ${(z._dens || 'edge') === 'edge' ? 'selected' : ''}>Edge-to-Edge — רמקול כל ~7 מ׳ (ברירת מחדל)</option>
        <option value="min" ${z._dens === 'min' ? 'selected' : ''}>חפיפה מינימלית — רמקול כל ~5 מ׳</option>
        <option value="full" ${z._dens === 'full' ? 'selected' : ''}>חפיפה מלאה — רמקול כל ~3 מ׳ (דיבור/הופעות)</option>`}
    </select></div>`}

    <button style="width:100%;margin-bottom:2px;${(z._djInRack || (z._djNodeId && byId(z._djNodeId))) ? 'background:#eef7f1;color:#0f6e56' : ''}" onclick="window.__djPlace={zid:'${zid}'};const z2=(P.zones||[]).find(x=>x.id==='${zid}');if(z2)z2._djInRack=false;render();">1️⃣ 🎧 ${z._djInRack ? '✓ מחשב מוזיקה בריכוז — לחץ למיקום עמדה נפרדת' : z._djNodeId && byId(z._djNodeId) ? '✓ עמדת נגינה ממוקמת — לחץ למיקום מחדש' : 'מקם עמדת נגינה (DJ) — לחץ ואז על התכנית'}</button>
    <button style="width:100%;margin-bottom:6px;font-size:11px;${z._djInRack ? 'background:#eef7f1;color:#0f6e56' : ''}" onclick="const z2=(P.zones||[]).find(x=>x.id==='${zid}');if(z2){z2._djInRack=!z2._djInRack;render();save();}">🖥 ${z._djInRack ? '✓ ' : ''}המוזיקה ממחשב בתוך ריכוז המגברים (בלי עמדה בתכנית)</button>
    <button style="width:100%;margin-bottom:6px;${z._rackNodeId && byId(z._rackNodeId) ? 'background:#eef7f1;color:#0f6e56' : ''}" onclick="window.__rackPlace={zid:'${zid}'};render();">2️⃣ 🎚 ${z._rackNodeId && byId(z._rackNodeId) ? '✓ ריכוז מגברים ממוקם — לחץ למיקום מחדש' : 'מקם ריכוז ארון מגברים — לחץ ואז על התכנית'}</button>
    ${(() => {
      /* קיטים למעלה: קטגוריות + חיפוש, יחד עם מוצרים */
      const kcat = z._kcat || '';
      const chips = [['', 'הכל'], ['audio', '🔊 סאונד'], ['lighting', '💡 תאורה'], ['video', '📺 וידאו']].map(([v, l]) => `<button onclick="setZoneField('${zid}','_kcat','${v}')" style="padding:2px 10px;border-radius:14px;font-size:11px;border:1px solid ${kcat === v ? '#c9502e' : '#ccc'};background:${kcat === v ? '#c9502e' : '#fff'};color:${kcat === v ? '#fff' : '#333'}">${l}</button>`).join(' ');
      const kq = (z._sq || '').trim();
      /* קיט מומלץ לפי תבנית המקום: club→4 פינות, live→במה, bar→בר */
      const recWords = { club: /מועדון|רחבה|dance|club|dj/i, live: /הופע|live|stage|במה|line ?array|ריגינג/i, bar: /בר|bar|lounge|רקע/i, rest: /רקע|תקרה|ceiling|background/i, cafe: /קפה|cafe|רקע|תקרה/i, shop: /חנות|רקע|תקרה|ceiling|retail/i };
      const recRe = recWords[z._preset];
      const isRec = k => recRe && (recRe.test(k.name) || recRe.test(k.sys || ''));
      const kits = allKits().map((k, i) => ({ k, i, rec: isRec(k) }))
        .filter(x => !kcat || (x.k.cat || '') === kcat)
        .filter(x => !kq || x.k.name.includes(kq))
        .sort((a, b) => (b.rec ? 1 : 0) - (a.rec ? 1 : 0));
      return `<div class="fld"><label>3️⃣ חיפוש מוצר או קיט (ERP)</label>
        <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:5px">${chips}</div>
        <input id="zsq" value="${esc(z._sq || '')}" placeholder="למשל UNICORN / F81 / קיט בר" oninput="setZoneField('${zid}','_sq',this.value)"></div>
      ${kq && kits.length ? `<div style="max-height:160px;overflow-y:auto;margin-bottom:4px">${kits.slice(0, 40).map(x => `<button style="display:block;width:100%;text-align:right;margin-bottom:3px;font-size:11px;background:#efe9fa" onclick="zoneKitConfirm('${esc(z.name).replace(/'/g, '&#39;')}',${x.i})">🧰 קיט: ${esc(x.k.name.slice(0, 42))}</button>`).join('')}</div>` : ''}
      ${!kq ? `<div class="fld"><label style="font-size:10px">כל הקיטים (${kits.length})</label><select onchange="if(this.value!==''){zoneKitConfirm('${esc(z.name).replace(/'/g, '&#39;')}',+this.value);this.value='';}">
        <option value="">— או בחר קיט מהרשימה (${kits.length}) —</option>
        ${kits.map(x => `<option value="${x.i}">${x.rec ? '⭐ ' : ''}${esc(x.k.name.slice(0, 44))}</option>`).join('')}
      </select></div>` : ''}`;
    })()}
    ${res.length ? `<div style="max-height:120px;overflow-y:auto;margin-bottom:6px">${res.map(r => { const isSub = /סאב|sub|NOMOS|TILL\s?18|SB-?18|וופר/i.test(r.name); return `<button style="display:flex;gap:6px;align-items:center;width:100%;text-align:right;margin-bottom:3px;font-size:11px" onclick="pickZoneSpk('${zid}','${esc(r.name).replace(/'/g, '&#39;')}','${r.key || ''}',${isSub})"><span style="flex:1;text-align:right">${isSub ? '🔈 סאב' : '🔊 רמקול'}: ${esc(r.name.slice(0, 36))}</span>${stockTag(r.key)}</button>`; }).join('')}</div>` : ''}
    <div class="fld"><label>רמקול נבחר</label><div style="font-size:12px">${z._spk ? '🔊 ' + esc(z._spk) : '— (בחר מהחיפוש) —'}</div></div>
    <div class="fld"><label>סאב נבחר</label><div style="font-size:12px">${z._sub ? '🔈 ' + esc(z._sub) + ' <button style="padding:0 6px" onclick="setZoneField(\'' + zid + '\',\'_sub\',\'\')">✕</button>' : '— (אופציונלי) —'}</div></div>

    ${(() => {
      const isSubN = nm => /סאב|\bsub\b/i.test(nm);
      const ziq = impItems.filter(it => it.zones && it.zones[z.name] && isSpeakerItem(it.name) && ((+it.qty || 1) - (it.placed || 0) > 0));
      const remQ = it => Math.max(0, (+it.qty || 1) - (it.placed || 0));
      const tS = ziq.filter(it => !isSubN(it.name)).reduce((s, it) => s + remQ(it), 0);
      const tSub = ziq.filter(it => isSubN(it.name)).reduce((s, it) => s + remQ(it), 0);
      const tRack = impItems.filter(it => it.zones && it.zones[z.name] && /מגבר|פרוססור|amplifier|processor|קרוסאובר|מטריצ|matrix|DSP/i.test(it.name) && ((+it.qty || 1) - (it.placed || 0) > 0)).reduce((s2, it) => s2 + Math.max(0, (+it.qty || 1) - (it.placed || 0)), 0);
      const bs = z._built ? 'background:#eef7f1;color:#0f6e56;font-weight:400' : '';
      const bp = z._built ? '✓ ' : '';
      return (ziq.length || tRack)
        ? `<button class="${z._built ? '' : 'primary'}" style="width:100%;${bs}" onclick="buildZoneFromItems('${zid}')">4️⃣ 📋 ${bp}הצב את פריטי האזור מההצעה (${tS} רמקולים${tSub ? ' + ' + tSub + ' סאבים' : ''}${tRack ? ' + ' + tRack + ' לארון' : ''})</button>
           <button style="width:100%;margin-top:5px;${bs}" onclick="buildZoneSystem('${zid}')">4️⃣ ⚙ ${bp}או: בנה מערכת אוטומטית (מחשב כמות)</button>`
        : z._built ? `<button style="width:100%;${bs}" onclick="buildZoneSystem('${zid}')">4️⃣ ⚙ ${bp}המערכת נבנתה — לחץ לבנייה מחדש</button>`
          : `<p class="muted" style="font-size:11px;margin:4px 0;background:#faf8f4;border-radius:8px;padding:6px 8px">4️⃣ בחר קיט או רמקול בשלב 3 — הבנייה וההצבה נעשות משם</p>`;
    })()}
    <button style="width:100%;margin-top:6px;${z._built ? 'background:#eef7f1;color:#0f6e56' : 'background:#534ab7;color:#fff;font-weight:700'}" onclick="autoLayoutAI('${zid}')">🤖 ${z._built ? '✓ ' : ''}פריסה חכמה מהתכנית (AI) — מתחשבת בריהוט ובקירות</button>
    ${(() => {
      const fed2 = new Set(P.cables.map(c => c.to));
      const zs = P.nodes.filter(n => n.kind === 'point' && (!n.ptype || n.ptype === 'speaker' || n.ptype === 'sub') && (n.sub || '').includes(z.name) && !/עמדת נגינה|מגבר|פרוססור/i.test(n.name));
      const wd = zs.length > 0 && zs.every(n => fed2.has(n.id));
      return `<button style="width:100%;margin-top:6px;${wd ? 'background:#eef7f1;color:#0f6e56' : 'background:#0f6e56;color:#fff;font-weight:700'}" onclick="smartWire('${zid}')">5️⃣ 🔌 ${wd ? '✓ מחווט — לחץ לעריכת הניתוב' : 'חיווט חכם למגבר — פרימיום/סאב קו בודד · רקע בשרשור'}</button>`;
    })()}
    <div style="display:flex;gap:5px;margin-top:6px">
      <button style="flex:1;${P.splMode === 'max' ? 'background:#0f6e56;color:#fff;font-weight:700' : ''}" title="הערכים על התכנית יוחלפו ל-SPL מקסימלי של כל רמקול" onclick="zoneSplMode('${zid}','max')">🔊 ${P.splMode === 'max' ? '✓ ' : ''}הצג מקס SPL לרמקולי האזור</button>
      <button style="flex:1;${P.splMode === 'design' ? 'background:#0f6e56;color:#fff;font-weight:700' : ''}" title="הערכים על התכנית יוחלפו לרמת תכנון — מקס פחות 20dB (headroom)" onclick="zoneSplMode('${zid}','design')">🔉 ${P.splMode === 'design' ? '✓ ' : ''}רמת תכנון (מקס−20)</button>
    </div>
    <button style="width:100%;margin-top:6px;${P._instKit ? 'background:#eef7f1;color:#0f6e56' : 'background:#7a4ab7;color:#fff;font-weight:700'}" onclick="patchOfferKits('${zid}')">6️⃣ 🧰 ${P._instKit ? '✓ נבחר קיט התקנה — לחץ לבחירה נוספת' : 'קיט התקנה לפרויקט — עמדה/ארון/סטנדרט'}</button>
    <button style="width:100%;margin-top:6px;${P._gapOk ? 'background:#eef7f1;color:#0f6e56' : 'background:#b7761f;color:#fff;font-weight:700'}" onclick="projGapCheck()">7️⃣ 🤔 ${P._gapOk ? '✓ הבדיקה הורצה — לחץ לבדיקה חוזרת' : 'האם שכחתי משהו? — בדיקת שלמות והצעת חוסרים'}</button>

    <p class="muted" style="font-size:10px;margin-top:4px">פריסה מדורגת לפי מתודולוגיית distributed (מרווח = 2×(תקרה−1.2)×tan(פיזור/2) × צפיפות). שטח ${zoneAreaM(z).toFixed(0)} מ"ר.${P.scale ? '' : ' ⚠ כייל תכנית.'}</p>
  </div>`;
}
function zoneItemsList(z) {
  const items = impItems.filter(it => it.zones && it.zones[z.name]);
  if (!items.length) return '';
  return `<h3 class="sec">📋 פריטים משויכים לאזור (${items.length})</h3>
    <div style="max-height:160px;overflow-y:auto">${items.map(it => `<div style="display:flex;gap:6px;align-items:center;font-size:12px;padding:3px 6px;border:1px solid #eee;border-radius:6px;margin-bottom:3px">
      <span style="flex:1">${esc(it.name.slice(0, 34))} ×${it.zones[z.name]}</span>${it.price ? '<span class="muted">₪' + (it.price * it.zones[z.name]).toLocaleString() + '</span>' : ''}</div>`).join('')}</div>`;
}
/* בחירת קירות מרובים — לחיצה מוסיפה/מסירה; ריק = איפוס לקיר הארוך */
/* לחיצה על צבע האזור בדוח — בוחרת את האזור ופותחת את ההגדרות שלו בצד */
function openZonePanel(zid) {
  const z = (P.zones || []).find(x => x.id === zid); if (!z) return;
  selZone = zid; sel = null; selCable = null;
  z._sysOpen = true;
  dockOpen = true; dockMin = false;
  render();
  setTimeout(() => {
    const el = document.querySelector(`[data-zoneid="${zid}"]`) || document.getElementById('side');
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 60);
}
function setZoneWall(zid, s) {
  const z = (P.zones || []).find(x => x.id === zid); if (!z) return;
  if (s === '') { z._walls = []; z._wall = undefined; }
  else {
    z._walls = z._walls || (z._wall ? [z._wall] : []);
    z._wall = undefined;
    const i = z._walls.indexOf(s);
    if (i >= 0) z._walls.splice(i, 1); else z._walls.push(s);
  }
  render(); save();
}
function setZoneField(zid, key, val) {
  const z = (P.zones || []).find(x => x.id === zid); if (!z) return;
  z[key] = val; render(); save();
  /* שדה החיפוש נבנה מחדש — מחזירים פוקוס וסמן לסוף כדי שאפשר להקליד ברצף */
  if (key === '_sq') { const el = document.getElementById('zsq'); if (el) { el.focus(); const L = el.value.length; el.setSelectionRange(L, L); } }
}
function pickZoneSpk(zid, name, key, isSub) { const z = (P.zones || []).find(x => x.id === zid); if (!z) return; if (isSub) { z._sub = name; z._subKey = key; } else { z._spk = name; z._spkKey = key; } z._sq = ''; render(); save(); }
function inZone(z, pt) {
  if (z.poly) { let inside = false, p = z.poly; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i].y > pt.y) !== (p[j].y > pt.y) && pt.x < (p[j].x - p[i].x) * (pt.y - p[i].y) / (p[j].y - p[i].y) + p[i].x) inside = !inside; return inside; }
  const L = 2200 - z.x - z.w; return pt.x >= L && pt.x <= L + z.w && pt.y >= z.y && pt.y <= z.y + z.h;
}
function zoneBounds(z) {
  if (z.poly) { const xs = z.poly.map(p => p.x), ys = z.poly.map(p => p.y); return { L: Math.min(...xs), T: Math.min(...ys), W: Math.max(...xs) - Math.min(...xs), H: Math.max(...ys) - Math.min(...ys) }; }
  return { L: 2200 - z.x - z.w, T: z.y, W: z.w, H: z.h };
}
/* פיזור רמקולים מדורג (staggered rows) — לפי מתודולוגיית distributed systems, לא גריד */
function placeZoneSpeakers(z, name, spacingPx, iid, extra) {
  const b = zoneBounds(z);
  const rowH = spacingPx * 0.87; /* שורות מדורגות — צפיפות אריחי משושה */
  const pts = [];
  let j = 0;
  for (let cy = b.T + rowH / 2; cy <= b.T + b.H - rowH * 0.15; cy += rowH) {
    const off = (j % 2) ? spacingPx / 2 : 0;
    for (let cx = b.L + spacingPx / 2 - off; cx <= b.L + b.W - spacingPx * 0.1; cx += spacingPx)
      if (inZone(z, { x: cx, y: cy })) pts.push({ cx, cy });
    j++;
  }
  if (!pts.length) pts.push({ cx: b.L + b.W / 2, cy: b.T + b.H / 2 });
  pts.forEach((p, k) => {
    P.nodes.push({ id: uid('n'), kind: 'point', name: name + (pts.length > 1 ? ` (${k + 1})` : ''), sub: 'מערכת אוטו · ' + z.name, x: 2200 - p.cx - 20, y: p.cy - 24, srcIid: iid, mini: true, ...extra });
  });
  return pts.length;
}
/* קטע הקיר שממנו מקרינים — ברירת מחדל הקיר הארוך; מחזיר קצוות, נורמל פנימה, זווית וטווח */
function zoneWallSeg(z) {
  if (z.poly && z.poly.length >= 2) {
    const cxz = z.poly.reduce((s, p) => s + p.x, 0) / z.poly.length, cyz = z.poly.reduce((s, p) => s + p.y, 0) / z.poly.length;
    let best = null;
    z.poly.forEach((p, i) => {
      const q = z.poly[(i + 1) % z.poly.length], len = Math.hypot(q.x - p.x, q.y - p.y);
      const pick = z._wall ? (z._wall === 'e' + i) : (!best || len > best.len);
      if (pick && (!best || z._wall || len > best.len)) {
        const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
        let nx = cxz - mx, ny = cyz - my; const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
        best = { x1: p.x, y1: p.y, x2: q.x, y2: q.y, len, nx, ny, aim: Math.atan2(ny, nx) * 180 / Math.PI, throwPx: zoneBounds(z).W * 0.5 + zoneBounds(z).H * 0.5 };
      }
    });
    return best;
  }
  const L = 2200 - z.x - z.w, R = 2200 - z.x, T = z.y, B = z.y + z.h;
  const sides = {
    top: { x1: L, y1: T, x2: R, y2: T, len: z.w, nx: 0, ny: 1, aim: 90, throwPx: z.h },
    right: { x1: R, y1: T, x2: R, y2: B, len: z.h, nx: -1, ny: 0, aim: 180, throwPx: z.w },
    bottom: { x1: L, y1: B, x2: R, y2: B, len: z.w, nx: 0, ny: -1, aim: 270, throwPx: z.h },
    left: { x1: L, y1: T, x2: L, y2: B, len: z.h, nx: 1, ny: 0, aim: 0, throwPx: z.w }
  };
  if (z._wall && sides[z._wall]) return sides[z._wall];
  return Object.values(sides).reduce((a, b) => b.len > a.len ? b : a);
}
/* פריסת קיר — רמקולים לאורך הקיר, כולם מכוונים לאותו כיוון אל תוך החלל (MONACOR) */
function placeZoneWall(z, name, spacingPx, iid, extra) {
  /* תומך בכמה קירות שנבחרו (z._walls) — אחרת הקיר היחיד/הארוך */
  const walls = (z._walls && z._walls.length) ? z._walls : [z._wall];
  const insetPx = (P.scale ? 0.4 / P.scale : 16);
  const pts = [];
  for (const w of walls) {
    const seg = zoneWallSeg({ ...z, _wall: w, _walls: undefined }); if (!seg) continue;
    const ux = (seg.x2 - seg.x1) / seg.len, uy = (seg.y2 - seg.y1) / seg.len;
    const n = Math.max(1, Math.round(seg.len / spacingPx));
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) * seg.len / n;
      pts.push({ cx: seg.x1 + ux * t + seg.nx * insetPx, cy: seg.y1 + uy * t + seg.ny * insetPx, aim: Math.round(seg.aim) });
    }
  }
  pts.forEach((p, k) => {
    P.nodes.push({ id: uid('n'), kind: 'point', name: name + (pts.length > 1 ? ` (${k + 1})` : ''), sub: 'קיר · ' + z.name, x: 2200 - p.cx - 20, y: p.cy - 24, srcIid: iid, mini: true, mount: 'קיר בלוק', aim: p.aim, ...extra });
  });
  return pts.length;
}
/* נקודות סביב כל הקירות הסגורים — לפי מרווח (spacingPx) או לפי מספר (count) */
/* פיזור אחיד סביב מרכז האזור: N קרניים בזוויות שוות מהמרכז אל קירות האזור.
   מבין 36 היסטי-זווית אפשריים נבחר זה שבו מרחקי הרמקולים מהמרכז אחידים ביותר —
   כך הכיסוי אחיד וגם תיקוני הדיליי (למיקרופון במרכז) מינימליים. */
function evenRingPts(z, count) {
  const b = zoneBounds(z);
  const poly = (z.poly && z.poly.length > 2) ? z.poly : [{ x: b.L, y: b.T }, { x: b.L + b.W, y: b.T }, { x: b.L + b.W, y: b.T + b.H }, { x: b.L, y: b.T + b.H }];
  const cx = poly.reduce((s2, p) => s2 + p.x, 0) / poly.length, cy = poly.reduce((s2, p) => s2 + p.y, 0) / poly.length;
  const inset = P.scale ? 0.4 / P.scale : 16;
  /* חיתוך קרן מהמרכז עם מצולע האזור */
  const cast = ang => {
    const dx = Math.cos(ang), dy = Math.sin(ang);
    let best = null;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], c = poly[(i + 1) % poly.length];
      const ex = c.x - a.x, ey = c.y - a.y;
      const den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-9) continue;
      const t = ((a.x - cx) * ey - (a.y - cy) * ex) / den;
      const u = (dx * (a.y - cy) - dy * (a.x - cx)) / -den;
      if (t > 0 && u >= 0 && u <= 1 && (!best || t < best.t)) {
        const len = Math.hypot(ex, ey) || 1;
        best = { t, x: cx + dx * t, y: cy + dy * t, nx: -ey / len, ny: ex / len };
      }
    }
    if (!best) return null;
    /* נורמל פנימה — הרמקול יושב מעט בתוך האזור, מכוון למרכז */
    const sgn = ((cx - best.x) * best.nx + (cy - best.y) * best.ny) > 0 ? 1 : -1;
    return { cx: best.x + best.nx * inset * sgn, cy: best.y + best.ny * inset * sgn, r: best.t,
      aim: Math.round((Math.atan2(cy - best.y, cx - best.x) * 180 / Math.PI + 360) % 360) };
  };
  let bestSet = null;
  for (let o = 0; o < 36; o++) {
    const off = (o / 36) * (Math.PI * 2 / count);
    const set = [];
    for (let i = 0; i < count; i++) { const p = cast(off + i * Math.PI * 2 / count); if (p) set.push(p); }
    if (set.length < count) continue;
    const rs = set.map(p => p.r), m = rs.reduce((a2, c2) => a2 + c2, 0) / rs.length;
    const sd = Math.sqrt(rs.reduce((a2, c2) => a2 + (c2 - m) ** 2, 0) / rs.length);
    if (!bestSet || sd < bestSet.sd) bestSet = { sd, set, mean: m };
  }
  return bestSet ? bestSet.set : [];
}
function ringPts(z, spacingPx, count) {
  const segs = [];
  let totalLen = 0;
  for (const [s] of zoneWallList(z)) {
    const wcfg = (z.walls || {})[s]; if (wcfg && wcfg.open) continue;
    const seg = zoneWallSeg({ ...z, _wall: s }); if (!seg) continue;
    segs.push(seg); totalLen += seg.len;
  }
  if (!segs.length) return [];
  const insetPx = (P.scale ? 0.4 / P.scale : 16);
  const pts = [];
  if (count) { /* פיזור שווה לפי כמות לאורך כל ההיקף */
    const step = totalLen / count;
    let target = step / 2, walked = 0, si = 0;
    for (let i = 0; i < count; i++) {
      while (si < segs.length && walked + segs[si].len < target) { walked += segs[si].len; si++; }
      const seg = segs[Math.min(si, segs.length - 1)];
      const t = Math.min(seg.len, Math.max(0, target - walked));
      const ux = (seg.x2 - seg.x1) / seg.len, uy = (seg.y2 - seg.y1) / seg.len;
      pts.push({ cx: seg.x1 + ux * t + seg.nx * insetPx, cy: seg.y1 + uy * t + seg.ny * insetPx, aim: Math.round(seg.aim) });
      target += step;
    }
  } else {
    for (const seg of segs) {
      const ux = (seg.x2 - seg.x1) / seg.len, uy = (seg.y2 - seg.y1) / seg.len;
      const n = Math.max(1, Math.round(seg.len / spacingPx));
      const end = Math.min(insetPx * 1.2, seg.len * 0.08); /* צמוד לקצוות הקיר */
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? seg.len / 2 : end + i * (seg.len - 2 * end) / (n - 1);
        pts.push({ cx: seg.x1 + ux * t + seg.nx * insetPx, cy: seg.y1 + uy * t + seg.ny * insetPx, aim: Math.round(seg.aim) });
      }
    }
  }
  return pts;
}
/* הצבת הפריטים שכבר משויכים לאזור בהצעת המחיר — לפי הכמויות שלהם, סביב ההיקף */
/* פס אישור לא-חוסם לבניית מערכת — confirm() חסום בדפדפנים משובצים ומחזיר false,
   מה שגרם למחיקה מיידית של כל מה שנבנה. ברירת המחדל עכשיו: המערכת נשארת. */
function zoneBuildBar(msg, onUndo) {
  const old = document.getElementById('zbBar'); if (old) old.remove();
  const bar = document.createElement('div');
  bar.id = 'zbBar';
  bar.style.cssText = 'position:fixed;bottom:14px;left:50%;transform:translateX(-50%);background:#1a1e28;color:#fff;padding:10px 14px;border-radius:12px;z-index:130;box-shadow:0 8px 30px rgba(0,0,0,.45);display:flex;gap:10px;align-items:center;max-width:92vw;font-size:13px';
  const txt = document.createElement('span');
  txt.style.cssText = 'white-space:pre-line;line-height:1.45';
  txt.textContent = msg;
  const okB = document.createElement('button');
  okB.textContent = '✓ אישור';
  okB.style.cssText = 'background:#2e7d32;color:#fff;border:none;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:13px';
  okB.onclick = () => bar.remove();
  const unB = document.createElement('button');
  unB.textContent = '↩ בטל והסר';
  unB.style.cssText = 'background:#f3d9d2;color:#8c2f16;border:none;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:13px';
  unB.onclick = () => { bar.remove(); onUndo(); };
  bar.append(txt, okB, unB);
  document.body.appendChild(bar);
  setTimeout(() => { if (bar.isConnected) bar.remove(); }, 25000);
}
function buildZoneFromItems(zid) {
  const z = (P.zones || []).find(x => x.id === zid); if (!z) return;
  const isSub = nm => /סאב|\bsub\b|NOMOS|TILL\s?1[58]P?\s?SUB|SB-?\d|F118|BR\s?118/i.test(nm);
  const zi = impItems.filter(it => it.zones && it.zones[z.name] && isSpeakerItem(it.name) && ((+it.qty || 1) - (it.placed || 0) > 0));
  const remQ = it => Math.max(0, (+it.qty || 1) - (it.placed || 0));
  if (!zi.length) { buildZoneSystem(zid); return; }
  const created = [];
  let nS = 0, nSub = 0;
  const spkItems = zi.filter(it => !isSub(it.name)), subItems = zi.filter(it => isSub(it.name));
  const totalS = spkItems.reduce((s, it) => s + remQ(it), 0);
  /* פיזור אחיד סביב המרכז (נופל לפיזור לאורך הקירות אם האזור לא סגור) */
  const nWanted = Math.max(1, totalS);
  const pts = evenRingPts(z, nWanted).length === nWanted ? evenRingPts(z, nWanted) : ringPts(z, 0, nWanted);
  let pi = 0;
  for (const it of spkItems) {
    const q = remQ(it);
    for (let k = 0; k < q && pi < pts.length; k++, pi++) {
      const p = pts[pi];
      const nd = { id: uid('n'), kind: 'point', name: it.name.slice(0, 40) + ' (' + (k + 1) + ')', sub: 'היקפי · ' + z.name, x: 2200 - p.cx - 20, y: p.cy - 24, srcIid: it.iid, mini: true, mount: 'קיר בלוק', hgt: 2.6, aim: p.aim, disp: guessDisp(it.name), spl: (guessSpl(it.name) || 120) - 20 };
      P.nodes.push(nd); created.push(nd.id); nS++;
    }
    it.placed = (it.placed || 0) + q; it.zones[z.name] = (it.zones[z.name] || 0) + q; it.added = true;
  }
  /* סאבים — בפינות (צימוד פינה מגביר בס) */
  const b = zoneBounds(z), inM = P.scale ? 0.8 / P.scale : 30;
  const cpts = [[b.L + inM, b.T + inM], [b.L + b.W - inM, b.T + inM], [b.L + b.W - inM, b.T + b.H - inM], [b.L + inM, b.T + b.H - inM]];
  let ci = 0;
  for (const it of subItems) {
    const q = remQ(it);
    for (let k = 0; k < q; k++, ci++) {
      const c2 = cpts[ci % 4];
      const nd = { id: uid('n'), kind: 'point', name: it.name.slice(0, 40) + ' (' + (k + 1) + ')', sub: 'סאב פינה · ' + z.name, x: 2200 - c2[0] - 20, y: c2[1] - 24, srcIid: it.iid, mini: true, mount: 'רצפה', hgt: 0, disp: 360, spl: (guessSpl(it.name) || 120) - 20 };
      P.nodes.push(nd); created.push(nd.id); nSub++;
    }
    it.placed = (it.placed || 0) + q; it.added = true;
  }
  /* ציוד ראק מהאזור — מגברים/פרוססורים נכנסים לריכוז המגברים, לא לתכנית */
  let nRack = 0;
  const rackItems = impItems.filter(it => it.zones && it.zones[z.name] && /מגבר|פרוססור|amplifier|processor|קרוסאובר|מטריצ|matrix|DSP/i.test(it.name) && ((+it.qty || 1) - (it.placed || 0) > 0));
  if (rackItems.length) {
    let rk = z._rackNodeId && byId(z._rackNodeId);
    if (!rk) {
      const b2 = zoneBounds(z);
      rk = { id: uid('n'), kind: 'rack', name: 'ריכוז מגברים · ' + z.name, sub: '', x: 2200 - (b2.L + b2.W + 90) - 24, y: b2.T, ru: 12, units: [], min: true };
      P.nodes.push(rk); z._rackNodeId = rk.id; created.push(rk.id);
    }
    for (const it of rackItems) {
      const q = Math.max(0, (+it.qty || 1) - (it.placed || 0));
      for (let k = 0; k < q; k++) {
        const uH = it.u || 2;
        const pos = (rk.units || []).reduce((m, x) => Math.max(m, x.pos + x.u), 0);
        if (pos + uH > rk.ru) rk.ru = pos + uH; /* מרחיב את הארון במקום לדחוס */
        rk.units.push({ id: uid('u'), name: it.name.slice(0, 40), u: uH, cat: /פרוססור|processor|מטריצ|matrix|DSP/i.test(it.name) ? 'audio' : 'amp', pos });
        nRack++;
      }
      it.placed = (it.placed || 0) + q; it.added = true;
    }
  }
  P.showCoverage = true;
  z._built = Date.now(); render(); save();
  zoneBuildBar(`📋 הוצבו פריטי האזור "${z.name}" לפי הכמויות בהצעה: ${nS}× רמקולים סביב ההיקף${nSub ? ' · ' + nSub + '× סאבים בפינות' : ''}${nRack ? ' · ' + nRack + '× ציוד ראק' : ''}`, () => {
    P.nodes = P.nodes.filter(n2 => !created.includes(n2.id));
    P.cables = P.cables.filter(c2 => byId(c2.from) && byId(c2.to));
    zi.forEach(it => { it.placed = Math.max(0, (it.placed || 0) - (it.zones[z.name] || 0)); });
    render(); save();
  });
}
/* מצב SPL לכל רמקולי האזור: max = מקס מלא, design = מקס−20 */
function zoneSplMode(zid, mode) {
  const z = (P.zones || []).find(x => x.id === zid); if (!z) return;
  let n2 = 0;
  P.nodes.forEach(n => {
    if (n.kind !== 'point' || !(n.sub || '').includes(z.name)) return;
    if (n.ptype && n.ptype !== 'speaker' && n.ptype !== 'sub') return;
    const mx = guessSpl(n.name) || 120;
    n.spl = mode === 'max' ? undefined : mx - 20;
    n2++;
  });
  if (!n2) { uiToast('אין רמקולים משויכים לאזור "' + z.name + '" — בנה מערכת קודם'); return; }
  P.showCoverage = true;
  P.splMode = mode; /* בלי כיסוי מוצג אין מה לראות */
  render(); save();
  /* בלי גלילה — הערכים מתחלפים במקום, התצוגה נשארת איפה שהיא */
  uiToast((mode === 'max' ? '🔊 מקס SPL' : '🔉 רמת תכנון (מקס−20)') + ' — עודכנו ' + n2 + ' רמקולים על התכנית');
}
/* ===================================================================================
   🔧 תמחור התקנה — טבלת תעריפים נערכת + חישוב אוטומטי מהפרויקט.
   כויל לפי 390 שורות "התקנה" מהזמנות אמת ב-ERP (2026-08): חציון ₪2,000 לפרויקט
   (p25 ₪800 · p75 ₪5,000) · שעת צוות ₪650 · יום טכנאי ₪1,500 · חומרי התקנה ₪300.
   הכלל המסחרי נערך בטבלה עצמה — כל שורה, זמן ומחיר ניתנים לשינוי ונשמרים. */
const INSTALL_DEFAULTS = [
  { k: 'arrive', label: 'הגעה, פריקה והתארגנות באתר', unit: 'ביקור', min: 45, price: 350, auto: 'fixed' },
  { k: 'spk', label: 'התקנת רמקול — קיר / תקרה מוט', unit: 'יח׳', min: 30, price: 160, auto: 'spk' },
  { k: 'ceil', label: 'רמקול שקוע בתקרת גבס (כולל פתיחה)', unit: 'יח׳', min: 25, price: 130, auto: 'ceil' },
  { k: 'sub', label: 'הצבת סאב, חיבור וכיוון', unit: 'יח׳', min: 15, price: 90, auto: 'sub' },
  { k: 'rack', label: 'הרכבת יחידת ראק (מגבר/עיבוד) וחיווט פנימי', unit: 'יח׳', min: 30, price: 200, auto: 'rack' },
  { k: 'panel', label: 'התקנת פאנל מחברים כולל הלחמות', unit: 'יח׳', min: 45, price: 320, auto: 'panel' },
  { k: 'ends', label: 'קצוות ומחברים לקו (ללא השחלה)', unit: 'קו', min: 10, price: 45, auto: 'cable' },
  { k: 'pull', label: 'השחלת/העברת כבל — רק אם הוזמן (~10% מהפרויקטים)', unit: 'מטר', min: 1.5, price: 8, auto: 'meters', off: 1 },
  { k: 'tune', label: 'כיוונון מערכת, בדיקות ומסירה', unit: 'אזור', min: 45, price: 400, auto: 'zone' }
];
function installRates() {
  if (!store.installRates || !store.installRates.length) store.installRates = JSON.parse(JSON.stringify(INSTALL_DEFAULTS));
  return store.installRates;
}
/* כמויות מהפרויקט הנוכחי — לפי מה שבאמת הוצב ותוכנן */
function installCounts() {
  const pts = P.nodes.filter(n => n.kind === 'point');
  const isCeil = n => /שקוע|ceiling/i.test(n.name || '') || /תקרת גבס/.test(n.mount || '');
  const isSubN = n => patchKind(n) === 'sub';
  const spk = pts.filter(n => (!n.ptype || n.ptype === 'speaker') && !isCeil(n) && !isSubN(n)).length;
  const ceil = pts.filter(n => (!n.ptype || n.ptype === 'speaker') && isCeil(n)).length;
  const sub = pts.filter(n => n.ptype === 'sub' || isSubN(n)).length;
  const rack = P.nodes.filter(n => n.kind === 'rack').reduce((s2, r) => s2 + (r.units || []).length, 0);
  const panel = P.nodes.filter(n => n.kind === 'panel').length;
  const cable = P.cables.filter(c => c.inst !== 'exist').length;
  const meters = Math.ceil(P.cables.filter(c => c.inst !== 'exist').reduce((s2, c) => s2 + (+c.len || 0), 0));
  const zone = Math.max(1, (P.zones || []).length);
  return { fixed: 1, spk, ceil, sub, rack, panel, cable, meters, zone };
}
/* מה נחשב "סעיף התקנה/עבודה" בקיט — קובע גם את הצגת כפתור התמחור וגם את השורות */
const INSTALL_ITEM_RE = /התקנה|עבודה|טכנאי|הובלה|כיוונון|תכנות|הדרכה/i;
/* סעיפי התקנה שמגיעים מהקיט הנבחר — נכנסים לטבלה כשורות נערכות ומסומנות 🧰 */
function installKitRows(ctx) {
  if (!ctx || !ctx.items) return 0;
  const rates = installRates();
  let n = 0;
  ctx.items.forEach(x => {
    if (!INSTALL_ITEM_RE.test(x.name || '')) return;
    const key = 'kit_' + rearKey(x.name).slice(0, 24);
    const ex = rates.find(r => r.k === key);
    const price = (x.key && typeof ERP_PRICES !== 'undefined' && ERP_PRICES[x.key] != null) ? +ERP_PRICES[x.key] : 0;
    if (ex) { ex.qty = x.qty; ex.off = undefined; }
    else { rates.push({ k: key, label: x.name.slice(0, 48), unit: 'יח׳', min: 60, price: Math.round(price) || 350, auto: 'manual', qty: x.qty, kit: ctx.name.slice(0, 26) }); n++; }
  });
  if (n) save();
  return n;
}
function installManager(kitCtx) {
  const old = document.getElementById('instOv'); if (old) old.remove();
  window.__instKit = kitCtx || null;
  const addedFromKit = installKitRows(kitCtx);
  const rates = installRates();
  const ov = document.createElement('div');
  ov.id = 'instOv';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(20,24,32,.5);z-index:98;display:flex;align-items:center;justify-content:center';
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  ov.innerHTML = `<div style="background:#fff;border-radius:12px;padding:16px;max-width:760px;width:96%;max-height:90vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,.35)">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><b style="flex:1;font-size:16px">🔧 התקנה ותמחור — ${esc(P.name.slice(0, 24))}</b>
      <button onclick="document.getElementById('instOv').remove()">✕</button></div>
    <p class="muted" style="font-size:11px;margin:0 0 8px">תעריפים נערכים ונשמרים · כמות = אוטומטית מהתכנית וניתנת לדריסה · כויל לפי 390 שורות התקנה מהזמנות אמת (חציון ₪2,000 לפרויקט · שעת צוות ₪650 · יום טכנאי ₪1,500)</p>
    ${kitCtx ? `<p style="font-size:11.5px;margin:0 0 8px;background:#eef7f1;color:#0f6e56;border-radius:8px;padding:6px 9px">🧰 מוצג לפי הקיט <b>${esc(kitCtx.name.slice(0, 30))}</b>${addedFromKit ? ' · נוספו ' + addedFromKit + ' סעיפי עבודה מהקיט' : ' · סעיפי העבודה מהקיט כבר בטבלה'} — ערוך ולחץ "הוסף שורת התקנה להצעה"</p>` : ''}
    <div id="instTbl"></div>
    <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
      <button style="flex:1" onclick="installRates().push({k:'row'+Date.now()%1e5,label:'סעיף חדש',unit:'יח׳',min:15,price:100,auto:'manual',qty:1});save();installTbl()">➕ שורה</button>
      <button style="flex:1" onclick="store.installRates=null;save();installManager()">↺ אפס לברירות מחדל</button>
      <button style="flex:2;background:#0f6e56;color:#fff;font-weight:700" onclick="installAddToOffer()">${kitCtx ? '🔧 עדכן את סעיף ההתקנה בקיט' : '🧾 ' + (impItems.some(it => it.iid === P._instIid) ? 'עדכן את שורת ההתקנה בהצעה' : 'הוסף שורת התקנה להצעת המחיר')}</button>
    </div></div>`;
  document.body.appendChild(ov);
  installTbl();
}
function installTbl() {
  const el = document.getElementById('instTbl'); if (!el) return;
  const rates = installRates(), cnt = installCounts();
  let tMin = 0, tPrice = 0;
  const rows = rates.map((r, i) => {
    const qty = r.qty != null ? r.qty : (cnt[r.auto] ?? 0);
    const on = !r.off;
    const line = on ? qty * (+r.price || 0) : 0, lm = on ? qty * (+r.min || 0) : 0;
    tMin += lm; tPrice += line;
    return `<tr style="${on ? '' : 'opacity:.45'}">
      <td><input type="checkbox" style="width:auto" ${on ? 'checked' : ''} onchange="installRates()[${i}].off=this.checked?undefined:1;save();installTbl()"></td>
      <td><input style="width:100%;font-size:11.5px;border:none;background:transparent" value="${esc(r.label)}" title="${r.kit ? 'סעיף מהקיט: ' + esc(r.kit) : 'סעיף קבוע'}" onchange="installRates()[${i}].label=this.value;save()">${r.kit ? '<span style="font-size:9.5px;color:#0f6e56">🧰 ' + esc(r.kit) + '</span>' : ''}</td>
      <td style="text-align:center;font-size:10.5px">${esc(r.unit)}</td>
      <td><input type="number" style="width:52px" value="${qty}" onchange="installRates()[${i}].qty=+this.value;save();installTbl()" title="כמות (אוטומטי מהתכנית — עריכה דורסת)"></td>
      <td><input type="number" style="width:52px" value="${r.min}" onchange="installRates()[${i}].min=+this.value;save();installTbl()"></td>
      <td><input type="number" style="width:64px" value="${r.price}" onchange="installRates()[${i}].price=+this.value;save();installTbl()"></td>
      <td style="text-align:left;white-space:nowrap;font-weight:600">${on ? '₪' + Math.round(line).toLocaleString() : '—'}</td>
      <td><button style="padding:0 6px" onclick="installRates().splice(${i},1);save();installTbl()">✕</button></td></tr>`;
  }).join('');
  const hours = tMin / 60;
  /* המודל המסחרי: טכנאי ליום — ימים שלמים בלבד, אין חצאי ימים (עיגול מעלה) */
  const dayRate = +(store.installDayRate ?? 1500);
  const days = tMin > 0 ? Math.max(1, Math.ceil(hours / 8)) : 0;
  const dayMode = store.installDayMode !== false;
  const dayTotal = days * dayRate;
  el.innerHTML = `<table class="cablelist" style="font-size:11.5px"><tr><th></th><th>סעיף</th><th>יח׳</th><th>כמות</th><th>דק׳/יח׳</th><th>₪/יח׳</th><th>סה"כ</th><th></th></tr>${rows}</table>
    <label style="display:flex;gap:6px;align-items:center;font-size:11.5px;margin-top:8px;background:#faf8f4;border-radius:8px;padding:6px 8px">
      <input type="checkbox" style="width:auto" ${dayMode ? 'checked' : ''} onchange="store.installDayMode=this.checked;save();installTbl()">
      תמחור לפי ימי טכנאי שלמים · <input type="number" value="${dayRate}" style="width:64px;font-size:11.5px" onchange="store.installDayRate=+this.value||1500;save();installTbl()"> ₪ ליום · אין חצאי ימים — עיגול מעלה
    </label>
    <div style="display:flex;gap:6px;margin-top:6px">
      <div onclick="store.installDayMode=true;save();installTbl()" title="לחץ לבחירת תמחור לפי ימי טכנאי" style="cursor:pointer;flex:1;background:${dayMode ? '#eef7f1' : '#f7f5f0'};border-radius:9px;padding:8px;text-align:center;${dayMode ? 'outline:2px solid #0f6e56' : 'opacity:.75'}"><b style="font-size:17px">${dayMode ? '✓ ' : ''}₪${dayTotal.toLocaleString()}</b><br><small class="muted">${days} ימי טכנאי × ₪${dayRate.toLocaleString()}</small></div>
      <div style="flex:1;background:#f7f5f0;border-radius:9px;padding:8px;text-align:center"><b style="font-size:17px">${hours.toFixed(1)} שע׳</b><br><small class="muted">זמן מחושב → ${days} ימים (שלמים)</small></div>
      <div onclick="store.installDayMode=false;save();installTbl()" title="לחץ לבחירת תמחור לפי פירוט הסעיפים" style="cursor:pointer;flex:1;background:${dayMode ? '#f7f5f0' : '#eef7f1'};border-radius:9px;padding:8px;text-align:center;${dayMode ? 'opacity:.75' : 'outline:2px solid #0f6e56'}"><b style="font-size:17px">${dayMode ? '' : '✓ '}₪${Math.round(tPrice).toLocaleString()}</b><br><small class="muted">לפי פירוט סעיפים</small></div>
    </div>
    <p class="muted" style="font-size:10.5px;margin:4px 0 0">לחיצה על כרטיס בוחרת את בסיס המחיר — הוא שייכנס לשורת ההתקנה בהצעה.</p>`;
}
function installAddToOffer() {
  const rates = installRates(), cnt = installCounts();
  let total = 0, tMin = 0; const det = [];
  rates.forEach(r => {
    if (r.off) return;
    const qty = r.qty != null ? r.qty : (cnt[r.auto] ?? 0);
    if (!qty) return;
    total += qty * (+r.price || 0);
    tMin += qty * (+r.min || 0);
    det.push(qty + '× ' + r.label.slice(0, 30));
  });
  if (!total && !tMin) { uiToast('אין סעיפי התקנה פעילים'); return; }
  /* המודל המסחרי: ימי טכנאי שלמים × התעריף היומי (ברירת מחדל) */
  if (store.installDayMode !== false) {
    const dayRate = +(store.installDayRate ?? 1500);
    const days = Math.max(1, Math.ceil(tMin / 60 / 8));
    total = days * dayRate;
    det.unshift(days + ' ימי טכנאי × ₪' + dayRate.toLocaleString());
  }
  const sum = Math.round(total), note = det.slice(0, 4).join(' · ');
  /* נפתח מתוך קיט? מעדכנים רק את סעיף העבודה של הקיט — כדי שלא תיווצר שורה כפולה.
     השורה עצמה תיכנס להצעה בלחיצה על "הוסף את הקיט". */
  if (window.__instKit) {
    window.__kitInstall = { total: sum, det: note };
    const kd = [...document.querySelectorAll('.uiDlgOv')].find(o2 => o2.querySelector('[data-asis]'));
    if (kd) {
      const b = kd.querySelector('[data-inst]');
      if (b) b.innerHTML = '🔧 סעיף ההתקנה בקיט: ₪' + sum.toLocaleString() + ' (לחץ לעריכה)';
    }
    /* אם כבר נוספה שורת התקנה עצמאית קודם — מסונכרנת ולא מוכפלת */
    const ex0 = impItems.find(it => it.iid === P._instIid);
    if (ex0) { ex0.price = sum; ex0.note = note; }
    save();
    const o0 = document.getElementById('instOv'); if (o0) o0.remove();
    window.__instKit = null;
    uiToast('🔧 סעיף ההתקנה בקיט עודכן ל-₪' + sum.toLocaleString() + ' — לחץ "הוסף את הקיט להצעה" כדי להכניס אותו');
    return;
  }
  const hit = (typeof ERP_ITEMS !== 'undefined') && ERP_ITEMS.find(([k, n]) => n && /התקנה.*הצעת מחיר/i.test(n));
  const ex = impItems.find(it => it.iid === P._instIid);
  if (ex) { ex.price = sum; ex.note = note; }
  else {
    const it = { on: true, qty: 1, name: hit ? hit[1] : 'התקנה — עבודה לפי פירוט', key: hit ? hit[0] : undefined, src: 'תמחור התקנה', dest: 'work', cat: 'other', u: 1, iid: uid('i'), price: sum, note };
    impItems.push(it); P._instIid = it.iid;
  }
  render(); save();
  const o = document.getElementById('instOv'); if (o) o.remove();
  uiToast((ex ? '🧾 שורת ההתקנה בהצעה עודכנה: ₪' : '🧾 שורת התקנה נוספה להצעה: ₪') + sum.toLocaleString());
}
/* תבניות מקום — ממלאות את כל ההגדרות לפי כללי התכנון המקובלים */
function applyVenuePreset(zid, v) {
  const z = (P.zones || []).find(x => x.id === zid); if (!z) return;
  z._preset = v;
  if (v === 'live') { z.usage = 'הופעות חיות'; z._place = 'live'; z._spread = 'directional'; }
  else if (v === 'club') { z.usage = 'מוזיקת ריקודים'; z._place = 'corners'; z._spread = 'surround'; }
  else if (v === 'bar') { z.usage = 'מוזיקה לבר'; z._place = 'ring'; z._dens = 'min'; z._spread = 'surround'; }
  else if (v === 'cafe') { z.usage = 'בית קפה'; z._place = 'ring'; z._dens = 'edge'; z._spread = 'surround'; }
  else if (v === 'shop') { z.usage = 'מוזיקת רקע'; z._place = 'ceiling'; z._dens = 'min'; z._spread = 'surround'; }
  else { z.usage = 'מסעדה'; z._place = 'ring'; z._dens = 'edge'; z._spread = 'surround'; }
  render(); save();
}
/* פריטי ראק של האזור שטרם הוצבו — נכנסים ישר לארון הריכוז שמוקם בשלב 2 */
function placeZoneRackItems(z) {
  const rk = z._rackNodeId && byId(z._rackNodeId);
  if (!rk || rk.kind !== 'rack') return 0;
  let n2 = 0;
  for (const it of impItems) {
    if (!it.zones || !it.zones[z.name]) continue;
    if (it.dest !== 'unit' && it.dest !== 'panelUnit') continue;
    const rem = Math.max(0, (+it.qty || 1) - (it.placed || 0));
    for (let k2 = 0; k2 < rem; k2++) {
      const uH = it.u || 1;
      const pos = (rk.units || []).reduce((m, x) => Math.max(m, x.pos + x.u), 0);
      if (pos + uH > rk.ru) rk.ru = pos + uH;
      rk.units.push({ id: uid('u'), name: it.name.slice(0, 40), u: uH, cat: /פרוססור|processor|מטריצ|matrix|DSP/i.test(it.name) ? 'audio' : 'amp', pos });
      n2++;
    }
    if (rem) { it.placed = (it.placed || 0) + rem; it.added = true; }
  }
  if (n2) { render(); save(); }
  return n2;
}
/* בחירת קיט לאזור — לפני ההוספה להצעה: כמויות כמו בקיט, או חישוב אוטומטי לפי האזור */
function zoneKitConfirm(zname, idx) {
  const k = allKits()[idx];
  if (!k) return;
  const z = (P.zones || []).find(x => x.name === zname);
  /* כמויות ומק"טים עריכים בפופאפ — 🔄 מחליף פריט מהקטלוג לפני שהקיט נכנס להצעה */
  const cur = k.items.map(x => ({ ...x, qty: +x.qty || 1 }));
  const ov = uiModal(`
    <b style="font-size:14px">🧰 ${esc(k.name)} — ${k.items.length} פריטים</b>
    <p class="muted" style="font-size:10.5px;margin:4px 0">ערוך כמויות · 0 = דלג · 🔄 מחליף פריט מהקטלוג במידת הצורך</p>
    <div data-kitrows style="max-height:44vh;overflow-y:auto;margin:6px 0"></div>
    ${INSTALL_ITEM_RE.test(k.items.map(x => x.name || '').join(' ')) ? `<button data-inst style="width:100%;margin-bottom:6px;background:#eef7f1;color:#0f6e56;border:1px solid #bfe0cd;font-weight:700">🔧 טבלת התקנה ותמחור — לפי הקיט הזה</button>` : ''}
    <button class="primary" data-asis style="width:100%;margin-bottom:6px;font-weight:700">➕ הוסף את הקיט להצעה והצב על התכנית</button>
    <button data-auto style="width:100%;margin-bottom:6px" ${z ? '' : 'disabled title="דרוש אזור מסומן"'}>⚙ בנה מערכת אוטומטית — מחשב כמות רמקולים לפי שטח האזור</button>
    <button data-cancel style="width:100%">ביטול</button>`);
  const done = () => ov.remove();
  const rowsEl = ov.querySelector('[data-kitrows]');
  let swapIdx = null, swapQ = '';
  const renderRows = () => {
    rowsEl.innerHTML = cur.map((x, i) => `<div style="border-bottom:1px solid #f0ede8;padding:3px 0">
      <div style="display:flex;gap:6px;align-items:center">
        <input data-kq="${i}" type="number" min="0" value="${x.qty}" style="width:48px;font-size:12px;padding:2px 4px;flex:none">
        <span style="flex:1;font-size:11.5px;text-align:right">${esc((x.name || '').slice(0, 46))}</span>
        ${x.key ? `<span style="background:#f0ede8;border-radius:5px;padding:1px 6px;font-size:10px;white-space:nowrap" title="מק&quot;ט ERP">${esc(String(x.key))}</span>` : '<span style="color:#c1121f;font-size:10px;white-space:nowrap">ללא מק"ט</span>'}
        <button data-swap="${i}" title="החלף פריט מהקטלוג" style="padding:1px 6px;font-size:11px;flex:none">🔄</button>
      </div>
      ${swapIdx === i ? `<div style="margin:4px 0 2px">
        <input data-swapq placeholder="🔍 חפש פריט חלופי בקטלוג…" value="${esc(swapQ)}" style="width:100%;font-size:12px;padding:3px 6px">
        <div>${swapQ.trim() ? (dockSearchResults(swapQ).filter(r => r.type === 'item').slice(0, 6).map((r, ri2) => `<button data-pick="${ri2}" style="display:flex;gap:6px;align-items:center;width:100%;text-align:right;font-size:11px;padding:3px 6px;margin-top:2px;border:1px solid #eee;border-radius:6px;background:#faf8f4;cursor:pointer"><span style="flex:1;text-align:right">${esc(r.name.slice(0, 46))}${r.key ? ' · ' + esc(String(r.key)) : ''}</span>${stockTag(r.key)}</button>`).join('') || '<small class="muted">אין תוצאות</small>') : ''}
      </div>` : ''}
    </div>`).join('');
    rowsEl.querySelectorAll('[data-kq]').forEach(inp => { inp.onchange = () => { cur[+inp.dataset.kq].qty = Math.max(0, +inp.value || 0); }; });
    rowsEl.querySelectorAll('[data-swap]').forEach(b => { b.onclick = () => { swapIdx = swapIdx === +b.dataset.swap ? null : +b.dataset.swap; swapQ = ''; renderRows(); }; });
    const sq = rowsEl.querySelector('[data-swapq]');
    if (sq) sq.oninput = () => { swapQ = sq.value; renderRows(); const s3 = rowsEl.querySelector('[data-swapq]'); if (s3) { s3.focus(); s3.setSelectionRange(s3.value.length, s3.value.length); } };
    rowsEl.querySelectorAll('[data-pick]').forEach(b => {
      b.onclick = () => {
        const r = dockSearchResults(swapQ).filter(x2 => x2.type === 'item')[+b.dataset.pick];
        if (r && swapIdx != null) { cur[swapIdx].name = r.name; cur[swapIdx].key = r.key || undefined; }
        swapIdx = null; swapQ = ''; renderRows();
      };
    });
  };
  renderRows();
  const edited = () => cur.filter(x => x.qty > 0 && x.name);
  const addItems = (items, skipSpeakers) => {
    const src = 'קיט: ' + k.name.slice(0, 30) + ' · ' + zname;
    for (const x of items) {
      if (skipSpeakers && isSpeakerItem(x.name)) continue;
      const st = classifyStock(x.name);
      const d = st ? null : SPEC_DICT.find(d2 => d2.re.test(x.name));
      const it = st ? { on: true, qty: x.qty, name: x.name, src, cat: 'other', u: 1, key: x.key, ...st }
        : { on: !d || d.dest !== 'ignore', qty: x.qty, name: x.name, src, key: x.key, dest: d ? d.dest : 'unit', cat: d?.cat || 'other', u: d?.u || 1 };
      it.iid = uid('i'); it.rack = guessRackFor(it); it.zones = { [zname]: x.qty };
      autoPrice(it);
      /* סעיף העבודה מקבל את המחיר שחושב בטבלת ההתקנה */
      if (window.__kitInstall && INSTALL_ITEM_RE.test(x.name || '')) {
        it.qty = 1; it.price = window.__kitInstall.total; it.dest = 'work';
        it.note = window.__kitInstall.det; it.zones = { [zname]: 1 };
      }
      impItems.push(it);
    }
  };
  ov.querySelector('[data-asis]').onclick = () => {
    /* הוספה עמידה: גם אם שלב ההצבה נכשל, הפריטים כבר נכנסו להצעה והמשתמש מקבל דיווח */
    let items = [], placed = 0, err = null;
    try {
      items = edited(); done();
      addItems(items, false);
      const hasSpk = items.some(x => isSpeakerItem(x.name));
      const nBefore = P.nodes.length;
      /* אזור לפי שם, ואם השם השתנה — האזור הנבחר או הראשון */
      const zz = z || (P.zones || []).find(x => x.id === selZone) || (P.zones || [])[0];
      if (zz && hasSpk) { buildZoneFromItems(zz.id); placeZoneRackItems(zz); }
      else if (zz) { placeZoneRackItems(zz); }
      placed = P.nodes.length - nBefore;
    } catch (e) { err = e; }
    render(); save();
    if (err) uiToast('🧰 נוספו ' + items.length + ' פריטים להצעה · ⚠ ההצבה על התכנית נכשלה: ' + (err.message || err));
    else uiToast('🧰 נוספו ' + items.length + ' פריטים מהקיט "' + k.name.slice(0, 26) + '" להצעה' + (placed > 0 ? ' · הוצבו ' + placed + ' על התכנית' : ' · פתח את ההצעה בצד לראות אותם'));
  };
  ov.querySelector('[data-auto]').onclick = () => {
    const items = edited(); done();
    if (!z) return;
    /* הרמקול/סאב מהקיט נבחרים לאזור והכמות מחושבת; מגברים/עיבוד נכנסים להצעה ולארון הריכוז */
    const isSubN = nm => /סאב|\bsub\b/i.test(nm || '');
    const spkIt = items.find(x => isSpeakerItem(x.name) && !isSubN(x.name));
    const subIt = items.find(x => isSpeakerItem(x.name) && isSubN(x.name));
    if (spkIt) { z._spk = spkIt.name; z._spkKey = spkIt.key || ''; }
    if (subIt) { z._sub = subIt.name; z._subKey = subIt.key || ''; }
    addItems(items, true);
    buildZoneSystem(z.id);
    placeZoneRackItems(z);
  };
  const instBtn = ov.querySelector('[data-inst]');
  if (instBtn) instBtn.onclick = () => installManager({ name: k.name, items: edited() });
  ov.querySelector('[data-cancel]').onclick = done;
  ov.addEventListener('click', e => { if (e.target === ov) done(); });
}
/* בחירת רמקול אמיתי מהקטלוג לבניית מערכת — במקום "רמקול התקנה" גנרי.
   מציג רק מוצרי ERP שמזוהים בבסיס הנתונים האקוסטי (פיזור/SPL ידועים). */
function zoneSpkPicker(zid) {
  const z = (P.zones || []).find(x => x.id === zid); if (!z) return;
  const db = (typeof SPEAKER_DATA !== 'undefined' ? SPEAKER_DATA : []);
  const items = (typeof ERP_ITEMS !== 'undefined' ? ERP_ITEMS : []);
  const seen = new Set(); const rows = [];
  for (const it of items) {
    const key = it[0], name = it[1];
    if (!name || seen.has(name)) continue;
    const d = db.find(x => x.re && x.re.test(name));
    if (!d) continue;
    seen.add(name);
    rows.push({ key, name, d, sub: /סאב|\bsub\b/i.test(name) });
  }
  /* מלאי קודם — פריטים על 0 בסוף לפי הנמכרים לאחרונה; מאומתים לפני משוערים באותו דירוג */
  rows.sort((a, b) => byStockThenSold(a.key, b.key) || (b.d.ok === true) - (a.d.ok === true) || a.name.localeCompare(b.name, 'he'));
  if (!rows.length) { alert('לא נמצאו רמקולים מוכרים בקטלוג — בחר רמקול דרך החיפוש בפאנל האזור.'); return; }
  const ov = uiModal(`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><b style="flex:1">🔊 בחר רמקול לאזור "${esc(z.name)}"</b><button data-x>✕</button></div>
    <p class="muted" style="font-size:11px;margin:0 0 8px">מוצרים מהקטלוג עם נתונים אקוסטיים. ✓ = מאומת · המחיר נכנס להצעה אוטומטית · לחיצה על סאב מוסיפה אותו כסאב האזור.</p>
    <input data-q placeholder="🔍 סינון…" style="width:100%;padding:6px;font-size:14px;box-sizing:border-box;margin-bottom:8px">
    <div data-list style="max-height:46vh;overflow-y:auto"></div>`);
  const listEl = ov.querySelector('[data-list]');
  const paint = q => {
    const f = rows.filter(r => !q || r.name.toLowerCase().includes(q.toLowerCase()));
    listEl.innerHTML = f.slice(0, 80).map(r => `
      <div data-i="${rows.indexOf(r)}" style="display:flex;gap:8px;align-items:center;padding:6px 8px;border:1px solid #eee;border-radius:8px;margin-bottom:4px;cursor:pointer">
        ${imgCell(r.key, 32)}<b style="flex:1;font-size:12.5px">${esc(r.name.slice(0, 60))}</b>
        ${stockBadge(r.key)}
        <span class="muted" style="font-size:10.5px;white-space:nowrap">${r.sub ? 'סאב' : r.d.h + '°×' + r.d.v + '°'} · ${r.d.max}dB ${r.d.ok ? '<span style="color:#0a7a4b">✓</span>' : '<span style="color:#a32222">לא מאומת</span>'}</span>
      </div>`).join('') || '<p class="muted" style="font-size:12px">אין תוצאות</p>';
    listEl.querySelectorAll('[data-i]').forEach(el => el.onclick = () => {
      const r = rows[+el.dataset.i];
      pickZoneSpk(zid, r.name, r.key, r.sub);
      if (!r.sub) { ov.remove(); buildZoneSystem(zid); } /* רמקול ראשי נבחר — ממשיכים לבנייה */
      else { uiToast('✓ ' + r.name.slice(0, 40) + ' נקבע כסאב האזור'); paint(ov.querySelector('[data-q]').value); }
    });
  };
  paint('');
  ov.querySelector('[data-q]').oninput = e => paint(e.target.value);
  ov.querySelector('[data-x]').onclick = () => ov.remove();
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
}
function buildZoneSystem(zid) {
  const z = (P.zones || []).find(x => x.id === zid); if (!z) return;
  const area = zoneAreaM(z);
  if (!area) { alert('כייל את התכנית כדי לחשב לפי שטח.'); return; }
  if (!z._spk) { zoneSpkPicker(zid); return; } /* בלי רמקול נבחר — בוחרים מוצר אמיתי, לא ממציאים */
  const mPerPx = P.scale, pxPerM = 1 / mPerPx;
  const spk = z._spk || 'רמקול התקנה', disp = guessDisp(spk), spl = (guessSpl(spk) || 120) - 20 /* רמת תכנון התחלתית: מקס−20dB */;
  const ceil = z.ceil ?? P.room?.ceil ?? 3, ear = 1.2;
  const mode = z._place || 'ring';
  const wall = mode === 'wall';
  const factor = { edge: 1.0, min: 0.7, full: 0.5, sparse: 1.35 }[z._dens || 'edge'] || 1.0;
  if (mode === 'corners') {
    /* 4 פינות מכוונות למרכז — פורגראונד/רחבה (Funktion-One F1201) */
    const b = zoneBounds(z), inM = P.scale ? 1.0 / P.scale : 40;
    const cx0 = b.L + b.W / 2, cy0 = b.T + b.H / 2;
    const corners = [[b.L + inM, b.T + inM], [b.L + b.W - inM, b.T + inM], [b.L + b.W - inM, b.T + b.H - inM], [b.L + inM, b.T + b.H - inM]];
    const it = { on: true, qty: 1, name: spk, src: 'מערכת אוטו · ' + z.name, key: z._spkKey || '', dest: 'point', cat: 'other', u: 1, iid: uid('i') };
    autoPrice(it); impItems.push(it);
    corners.forEach((c, k) => P.nodes.push({ id: uid('n'), kind: 'point', name: spk + ` (${k + 1})`, sub: 'פינה · ' + z.name, x: 2200 - c[0] - 20, y: c[1] - 24, srcIid: it.iid, mini: true, mount: 'קיר בלוק', disp, spl, aim: Math.round(Math.atan2(cy0 - c[1], cx0 - c[0]) * 180 / Math.PI) }));
    it.qty = 4; it.placed = 4; it.zones = { [z.name]: 4 }; it.added = true;
    let subC = '';
    if (z._sub) { const sit = { on: true, qty: 2, name: z._sub, src: 'מערכת אוטו · ' + z.name, key: z._subKey || '', dest: 'point', cat: 'other', u: 1, iid: uid('i'), zones: { [z.name]: 2 }, added: true, placed: 2 }; autoPrice(sit); impItems.push(sit); P.nodes.push({ id: uid('n'), kind: 'point', name: z._sub + ' (1)', sub: 'סאב · ' + z.name, x: 2200 - (cx0 - inM) - 20, y: cy0 - 24, srcIid: sit.iid, mini: true, disp: 360, spl: guessSpl(z._sub) }, { id: uid('n'), kind: 'point', name: z._sub + ' (2)', sub: 'סאב · ' + z.name, x: 2200 - (cx0 + inM) - 20, y: cy0 - 24, srcIid: sit.iid, mini: true, disp: 360, spl: guessSpl(z._sub) }); subC = ' + 2 סאבים במרכז'; }
    P.showCoverage = true;
  z._built = Date.now(); dockOpen = true; dockMin = false; render(); save();
    zoneBuildBar(`נבנתה מערכת ל"${z.name}" (4 פינות · Funktion-One): 4× ${spk}${subC}`, () => undoZoneBuild(z));
    return;
  }
  if (mode === 'live') {
    /* הופעה חיה — מיינים L/R בקצוות קיר הבמה, סאבים במרכז חזית הבמה (צימוד רצפה/קיר), דיליי בעומק >18מ׳ */
    const seg = zoneWallSeg(z); if (!seg) { alert('בחר את קיר הבמה (מאיזה קיר להקרין)'); return; }
    const inset = P.scale ? 0.8 / P.scale : 30;
    const ux = (seg.x2 - seg.x1) / seg.len, uy = (seg.y2 - seg.y1) / seg.len;
    const A = Math.round(seg.aim);
    const it = { on: true, qty: 2, name: spk, src: 'מערכת אוטו · ' + z.name, key: z._spkKey || '', dest: 'point', cat: 'other', u: 1, iid: uid('i'), zones: { [z.name]: 2 }, placed: 2, added: true };
    autoPrice(it); impItems.push(it);
    const LR = [{ t: inset, lbl: 'L' }, { t: seg.len - inset, lbl: 'R' }];
    LR.forEach(pt => {
      const cx = seg.x1 + ux * pt.t + seg.nx * inset, cy = seg.y1 + uy * pt.t + seg.ny * inset;
      P.nodes.push({ id: uid('n'), kind: 'point', name: spk + ' (' + pt.lbl + ')', sub: 'מיין במה · ' + z.name, x: 2200 - cx - 20, y: cy - 24, srcIid: it.iid, mini: true, mount: 'טראס/הנפה', hgt: 3.5, aim: A });
    });
    let subMsg2 = '';
    if (z._sub) {
      const nSub = area > 120 ? 4 : 2;
      const sit = { on: true, qty: nSub, name: z._sub, src: 'מערכת אוטו · ' + z.name, key: z._subKey || '', dest: 'point', cat: 'other', u: 1, iid: uid('i'), zones: { [z.name]: nSub }, placed: nSub, added: true };
      autoPrice(sit); impItems.push(sit);
      /* סאבים צמודים במרכז חזית הבמה — מערך מרכזי מונע ביטולי פאזה של L/R מפוצלים */
      for (let s = 0; s < nSub; s++) {
        const off = (s - (nSub - 1) / 2) * (P.scale ? 0.7 / P.scale : 25);
        const cx = seg.x1 + ux * (seg.len / 2 + off) + seg.nx * inset * 0.6, cy = seg.y1 + uy * (seg.len / 2 + off) + seg.ny * inset * 0.6;
        P.nodes.push({ id: uid('n'), kind: 'point', name: z._sub + ' (' + (s + 1) + ')', sub: 'מערך סאבים מרכזי · ' + z.name, x: 2200 - cx - 20, y: cy - 24, srcIid: sit.iid, mini: true, mount: 'רצפה', hgt: 0, aim: A, disp: 360 });
      }
      subMsg2 = '\n' + nSub + '× ' + z._sub + ' (מערך מרכזי בחזית הבמה)';
    }
    /* דיליי — אם עומק החלל מעל ~18מ׳ מהבמה */
    let dlyMsg = '';
    const depthM = P.scale ? seg.throwPx * P.scale : 0;
    if (depthM > 18) {
      const dit = { on: true, qty: 2, name: spk + ' (דיליי)', src: 'מערכת אוטו · ' + z.name, key: z._spkKey || '', dest: 'point', cat: 'other', u: 1, iid: uid('i'), zones: { [z.name]: 2 }, placed: 2, added: true };
      autoPrice(dit); impItems.push(dit);
      [0.3, 0.7].forEach((f, k) => {
        const cx = seg.x1 + ux * seg.len * f + seg.nx * seg.throwPx * 0.55, cy = seg.y1 + uy * seg.len * f + seg.ny * seg.throwPx * 0.55;
        P.nodes.push({ id: uid('n'), kind: 'point', name: spk + ' דיליי (' + (k + 1) + ')', sub: 'קו דיליי · ' + z.name, x: 2200 - cx - 20, y: cy - 24, srcIid: dit.iid, mini: true, mount: 'עמוד/טראס', hgt: 3.2, aim: A });
      });
      dlyMsg = '\n2× דיליי (עומק ' + depthM.toFixed(0) + ' מ׳ > 18 מ׳)';
    }
    P.showCoverage = true;
  z._built = Date.now(); dockOpen = true; dockMin = false; render(); save();
    zoneBuildBar(`נבנתה מערכת הופעה חיה ל"${z.name}": 2× ${spk} (מיינים L/R)${subMsg2}${dlyMsg}`, () => undoZoneBuild(z));
    return;
  }
  if (mode === 'ring') {
    /* היקפי — רמקולים סביב כל הקירות הסגורים במרווח קבוע, מכוונים פנימה */
    const spacingM = ({ sparse: 10, edge: 7, min: 5, full: 3 })[z._dens || 'edge'] || 7;
    const pts = ringPts(z, spacingM * pxPerM);
    if (!pts.length) { alert('אין קירות סגורים לאזור (בדוק הגדרות קירות).'); return; }
    const it = { on: true, qty: pts.length, name: spk, src: 'מערכת אוטו · ' + z.name, key: z._spkKey || '', dest: 'point', cat: 'other', u: 1, iid: uid('i'), zones: { [z.name]: pts.length }, placed: pts.length, added: true };
    autoPrice(it); impItems.push(it);
    pts.forEach((p, k) => P.nodes.push({ id: uid('n'), kind: 'point', name: spk + ' (' + (k + 1) + ')', sub: 'היקפי · ' + z.name, x: 2200 - p.cx - 20, y: p.cy - 24, srcIid: it.iid, mini: true, mount: 'קיר בלוק', hgt: 2.6, aim: p.aim, disp, spl }));
    let subMsg3 = '';
    if (z._sub) {
      const nSub = Math.max(1, Math.round(area / 80));
      const sit = { on: true, qty: nSub, name: z._sub, src: 'מערכת אוטו · ' + z.name, key: z._subKey || '', dest: 'point', cat: 'other', u: 1, iid: uid('i'), zones: { [z.name]: nSub }, placed: nSub, added: true };
      autoPrice(sit); impItems.push(sit);
      const b2 = zoneBounds(z), inM2 = P.scale ? 0.8 / P.scale : 30;
      const cp2 = [[b2.L + inM2, b2.T + inM2], [b2.L + b2.W - inM2, b2.T + b2.H - inM2], [b2.L + b2.W - inM2, b2.T + inM2], [b2.L + inM2, b2.T + b2.H - inM2]];
      for (let s2 = 0; s2 < nSub; s2++) { const c3 = cp2[s2 % 4]; P.nodes.push({ id: uid('n'), kind: 'point', name: z._sub + ' (' + (s2 + 1) + ')', sub: 'סאב פינה · ' + z.name, x: 2200 - c3[0] - 20, y: c3[1] - 24, srcIid: sit.iid, mini: true, mount: 'רצפה', hgt: 0, disp: 360 }); }
      subMsg3 = '\n' + nSub + '× ' + z._sub + ' (פינות — צימוד)';
    }
    P.showCoverage = true;
  z._built = Date.now(); dockOpen = true; dockMin = false; render(); save();
    zoneBuildBar(`נבנתה מערכת היקפית ל"${z.name}": ${pts.length}× ${spk} סביב הקירות (מרווח ~${spacingM.toFixed(1)} מ׳)${subMsg3}`, () => undoZoneBuild(z));
    return;
  }
  let spacingM, place;
  if (wall) {
    /* קיר: מרווח לאורך הקיר = כיסוי אופקי במרחק ההשלכה = 2×throw×tan(פיזור/2) */
    const seg = zoneWallSeg(z); const throwM = (seg ? seg.throwPx : 300) * mPerPx;
    spacingM = ({ sparse: 10, edge: 7, min: 5, full: 3 })[z._dens || 'edge'] || 7;
    place = (nm, iid, ex) => placeZoneWall(z, nm, spacingM * pxPerM, iid, ex);
  } else {
    const Heff = Math.max(0.6, ceil - ear), covR = Heff * Math.tan(Math.min(disp, 150) / 2 * Math.PI / 180);
    spacingM = ({ sparse: 10, edge: 7, min: 5, full: 3 })[z._dens || 'edge'] || 7;
    place = (nm, iid, ex) => placeZoneSpeakers(z, nm, spacingM * pxPerM, iid, ex);
  }
  const it = { on: true, qty: 1, name: spk, src: 'מערכת אוטו · ' + z.name, key: z._spkKey || '', dest: 'point', cat: 'other', u: 1, iid: uid('i') };
  autoPrice(it); impItems.push(it);
  const nSpk = place(spk, it.iid, { disp, spl });
  it.qty = nSpk; it.placed = nSpk; it.zones = { [z.name]: nSpk }; it.added = true;
  let subMsg = '';
  if (z._sub) {
    const sit = { on: true, qty: 1, name: z._sub, src: 'מערכת אוטו · ' + z.name, key: z._subKey || '', dest: 'point', cat: 'other', u: 1, iid: uid('i') };
    autoPrice(sit); impItems.push(sit);
    const nSub = wall ? placeZoneWall(z, z._sub, spacingM * 2 * pxPerM, sit.iid, { disp: 360, spl: guessSpl(z._sub) })
      : placeZoneSpeakers(z, z._sub, Math.max(8, spacingM * 2.6) * pxPerM, sit.iid, { disp: 360, spl: guessSpl(z._sub), aim: 0 });
    sit.qty = nSub; sit.placed = nSub; sit.zones = { [z.name]: nSub }; sit.added = true; subMsg = ` + ${nSub} סאבים`;
  }
  const densName = { edge: 'edge-to-edge', min: 'חפיפה מינימלית', full: 'חפיפה מלאה', sparse: 'רופף' }[z._dens || 'edge'];
  P.showCoverage = true;
  z._built = Date.now(); dockOpen = true; dockMin = false; render(); save();
  zoneBuildBar(`נבנתה מערכת ל"${z.name}" (${wall ? 'קיר — מכוונים לחלל' : 'תקרה'}): ${nSpk}× ${spk}${subMsg} · שטח ${area.toFixed(0)} מ"ר · מרווח ~${spacingM.toFixed(1)} מ׳ · ${densName}`, () => undoZoneBuild(z));
}
/* הסרת מערכת אוטומטית שנבנתה לאזור — מוקדים + פריטי הצעה */
/* הארת קיר בתכנית בעת ריחוף על הכפתור */
function wallHint(zid, side) {
  const old = document.getElementById('wallHintEl'); if (old) old.remove();
  if (!zid) return;
  const z = (P.zones || []).find(x => x.id === zid); if (!z) return;
  let seg;
  if (side === '' || side == null) seg = zoneWallSeg({ ...z, _wall: undefined });
  else if (z.poly) { const i = +side.slice(1); const p = z.poly[i], q = z.poly[(i + 1) % z.poly.length]; seg = p && q && { x1: p.x, y1: p.y, x2: q.x, y2: q.y }; }
  else { const L = 2200 - z.x - z.w, R = 2200 - z.x, T = z.y, B = z.y + z.h; seg = { top: { x1: L, y1: T, x2: R, y2: T }, right: { x1: R, y1: T, x2: R, y2: B }, bottom: { x1: L, y1: B, x2: R, y2: B }, left: { x1: L, y1: T, x2: L, y2: B } }[side]; }
  if (!seg) return;
  const host = $('#zonesc');
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  el.id = 'wallHintEl';
  el.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:5';
  el.innerHTML = `<line x1="${seg.x1}" y1="${seg.y1}" x2="${seg.x2}" y2="${seg.y2}" stroke="#ff3b30" stroke-width="8" opacity="0.85" stroke-linecap="round"/>`;
  host.appendChild(el);
}
/* פריסה חכמה — Claude מנתח את תמונת התכנית (ריהוט, קירות, ישיבה) ומציע מיקומי רמקולים */
async function autoLayoutAI(zid) {
  const z = (P.zones || []).find(x => x.id === zid); if (!z) return;
  if (!P.bg) { alert('העלה קודם תכנית רקע'); return; }
  if (!P.scale) { alert('כייל את התכנית קודם — הפריסה תלויה במרחקים אמיתיים.'); return; }
  let key = '';
  try { key = localStorage.getItem('koflow_apikey') || ''; } catch (e) {}
  if (!key) {
    key = await uiPrompt('חד-פעמי: הדבק מפתח API של Claude (נשמר רק בדפדפן שלך).');
    if (!key) return;
    key = key.trim();
    try { localStorage.setItem('koflow_apikey', key); } catch (e) {}
  }
  const img = $('#bgimg');
  const imgW = img.offsetWidth || P.bgW || 1400, imgH = img.offsetHeight || 900;
  const imgLeft = 2200 - imgW;
  const b = zoneBounds(z);
  const rz = { rx: +((b.L - imgLeft) / imgW).toFixed(3), ry: +(b.T / imgH).toFixed(3), rw: +(b.W / imgW).toFixed(3), rh: +(b.H / imgH).toFixed(3) };
  const spk = z._spk || 'רמקול התקנה', disp = guessDisp(spk);
  const areaM = zoneAreaM(z).toFixed(0), ceil = z.ceil ?? P.room?.ceil ?? 3;
  const spread = z._spread || 'surround';
  const tgt = z.usage ? USAGE_SPL[z.usage] : 88;
  alert('שולח את התכנית לניתוח… (~20 שניות). לחץ OK והמתן.');
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({
        model: 'claude-sonnet-5', max_tokens: 2000,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: P.bg.split(',')[1] } },
          { type: 'text', text: 'אתה מתכנן סאונד. בתמונה תכנית אדריכלית. תכנן פריסת רמקולים לאזור שגבולותיו היחסיים בתמונה: x=' + rz.rx + ', y=' + rz.ry + ', w=' + rz.rw + ', h=' + rz.rh + ' (0-1).\nנתונים: שטח ' + areaM + ' מ"ר · תקרה ' + ceil + ' מ׳ · תכלית "' + (z.usage || 'מוזיקה לבר') + '" (יעד ' + tgt + 'dB) · רמקול: ' + spk + ' (פיזור ' + disp + '°) · סגנון: ' + (spread === 'surround' ? 'היקפי — רמקולים סביב ההיקף/קירות מכוונים פנימה, כיסוי אחיד מכל הכיוונים' : 'כיווני — כל הרמקולים מצד אחד (במה) מכוונים אל הקהל') + '.\nהסתכל על התכנית בפועל: זהה קירות, עמודים, אזורי ישיבה (שולחנות/כסאות), בר, דלתות. מקם רמקולים על קירות/עמודים אמיתיים בלבד, כוון אותם אל אזורי הישיבה, אל תמקם מעל מטבח/שירותים, שמור מרווח ~' + Math.max(3, 2 * (ceil - 1.2) * Math.tan(Math.min(disp, 150) / 2 * Math.PI / 180)).toFixed(0) + ' מ׳ בין רמקולים.\nהחזר JSON בלבד: {"speakers":[{"rx":0.42,"ry":0.31,"aim":180,"type":"spk","why":"קיר צפוני מעל הבר"}]} — rx,ry יחסי לכל התמונה (0-1), aim במעלות (0=ימין,90=מטה,180=שמאל,270=מעלה), type: spk או sub (1-2 סאבים אם מתאים). עד 16 רמקולים.' }
        ] }]
      })
    });
    const j = await res.json();
    if (j.error) throw new Error(j.error.message || 'שגיאת API');
    let txt = (j.content && j.content[0] && j.content[0].text || '').replace(/```json|```/g, '').trim();
    txt = txt.slice(txt.indexOf('{'));
    const sp = JSON.parse(txt).speakers || [];
    if (!sp.length) throw new Error('לא הוחזרו מיקומים');
    const spl = (guessSpl(spk) || 120) - 20;
    const it = { on: true, qty: 0, name: spk, src: 'מערכת אוטו · ' + z.name, key: z._spkKey || '', dest: 'point', cat: 'other', u: 1, iid: uid('i') };
    autoPrice(it); impItems.push(it);
    let nS = 0, nSub = 0, sit = null;
    if (z._sub) { sit = { on: true, qty: 0, name: z._sub, src: 'מערכת אוטו · ' + z.name, key: z._subKey || '', dest: 'point', cat: 'other', u: 1, iid: uid('i') }; autoPrice(sit); impItems.push(sit); }
    sp.forEach(s => {
      const xL = imgLeft + s.rx * imgW, y = s.ry * imgH;
      const isSub = s.type === 'sub';
      const base = isSub && sit ? sit : it;
      const nm = isSub && z._sub ? z._sub : spk;
      if (isSub && sit) nSub++; else nS++;
      P.nodes.push({ id: uid('n'), kind: 'point', name: nm + ' (' + (isSub ? nSub : nS) + ')', sub: (s.why || 'AI') + ' · ' + z.name, x: 2200 - xL - 20, y: y - 24, srcIid: base.iid, mini: true, disp: isSub ? 360 : disp, spl: isSub ? guessSpl(nm) : spl, aim: +s.aim || 0, hgt: isSub ? 0 : 2.6, mount: isSub ? 'רצפה' : 'קיר בלוק' });
    });
    it.qty = it.placed = nS; it.zones = { [z.name]: nS }; it.added = true;
    if (sit) { sit.qty = sit.placed = nSub; sit.zones = { [z.name]: nSub }; sit.added = nSub > 0; }
    P.showCoverage = true;
  z._built = Date.now(); dockOpen = true; dockMin = false; render(); save();
    zoneBuildBar('🤖 הפריסה החכמה מיקמה ' + nS + ' רמקולים' + (nSub ? ' + ' + nSub + ' סאבים' : '') + ' לפי ניתוח התכנית (' + (spread === 'surround' ? 'היקפי' : 'כיווני') + '). ריחוף על רמקול מציג את הנימוק.', () => undoZoneBuild(z));
  } catch (err) {
    if (/401|invalid|authentication/i.test(String(err.message))) { try { localStorage.removeItem('koflow_apikey'); } catch (e) {} }
    alert('הפריסה החכמה נכשלה: ' + err.message);
  }
}
function undoZoneBuild(z) {
  const iids = impItems.filter(it => it.src === 'מערכת אוטו · ' + z.name).map(it => it.iid);
  P.nodes = P.nodes.filter(n => !(n.srcIid && iids.includes(n.srcIid)));
  P.cables = P.cables.filter(c => byId(c.from) && byId(c.to));
  impItems = impItems.filter(it => !iids.includes(it.iid));
  render(); save();
}
/* קירות אזור — חומר וסטטוס פתוח/סגור */
const WALL_MATS = ['בטון', 'בלוק', 'זכוכית', 'גבס', 'עץ', 'וילון', 'ספיגה אקוסטית'];
const WALL_SIDES = [['top', 'קיר עליון'], ['right', 'קיר ימין'], ['bottom', 'קיר תחתון'], ['left', 'קיר שמאל']];
function zoneWallList(z) {
  /* מלבן → 4 קירות · פוליגון → קיר לכל צלע, ממוספר */
  if (z.poly && z.poly.length >= 2) return z.poly.map((p, i) => ['e' + i, 'קיר ' + (i + 1)]);
  return WALL_SIDES;
}
function wallRows(z) {
  z.walls = z.walls || {};
  return zoneWallList(z).map(([s, lbl]) => {
    const w = z.walls[s] || { open: false, mat: 'בלוק' };
    return `<div style="display:flex;gap:6px;align-items:center;margin:3px 0">
      <span style="width:56px;font-size:11px">${lbl}</span>
      <label style="display:flex;align-items:center;gap:3px;font-size:11px;cursor:pointer"><input type="checkbox" style="width:auto" ${w.open ? 'checked' : ''} onchange="setWall('${z.id}','${s}','open',this.checked)"> פתוח</label>
      <select style="flex:1" ${w.open ? 'disabled' : ''} onchange="setWall('${z.id}','${s}','mat',this.value)">${WALL_MATS.map(m => `<option ${w.mat === m ? 'selected' : ''}>${m}</option>`).join('')}</select>
    </div>`;
  }).join('');
}
function setWall(zid, side, key, val) {
  const z = (P.zones || []).find(x => x.id === zid); if (!z) return;
  z.walls = z.walls || {}; z.walls[side] = z.walls[side] || { open: false, mat: 'בלוק' };
  z.walls[side][key] = val;
  render(); save();
}
function wallHard(mat) { return /בטון|בלוק|זכוכית/.test(mat || ''); }
function delZone(id) {
  P.zones = (P.zones || []).filter(z => z.id !== id);
  if (selZone === id) selZone = null;
  render();
}
function togglePin(iid) {
  pinMode = (pinMode && pinMode.iid === iid) ? null : { iid };
  wireMode = null; wireStock = null; connPin = null; /* מצב אחד בלבד בכל רגע */
  render();
}
function connPinFromItem(iid) {
  connPin = (connPin && connPin.iid === iid) ? null : { iid };
  pinMode = null; wireMode = null; wireStock = null;
  render();
}
function delUnit(nid, idx) {
  const u = byId(nid).units[idx];
  if (u && u.srcIid) unplace(u.srcIid);
  byId(nid).units.splice(idx, 1);
  render();
}
function ensureStockItem(it) {
  ensureStock(P);
  if (it.stockId) {
    const pool = it.dest === 'reel' ? P.stock.reels : it.dest === 'conn' ? P.stock.conns : P.stock.cables;
    const ex = pool.find(s => s.id === it.stockId);
    if (ex) return ex;
  }
  let s;
  if (it.dest === 'cable') { s = { id: uid('s'), name: it.name, type: it.type || 'multi', len: it.len, mm: it.mm, conn: it.conn, qty: it.qty, used: 0 }; P.stock.cables.push(s); }
  else if (it.dest === 'reel') { s = { id: uid('s'), name: it.name, type: it.type || 'nl4', mm: it.mm, total: (it.len || 100) * (it.qty || 1), used: 0 }; P.stock.reels.push(s); }
  else { s = { id: uid('s'), name: it.name, kind: it.kind || 'xlrf', qty: it.qty, used: 0 }; P.stock.conns.push(s); }
  it.stockId = s.id;
  it.added = true;
  return s;
}
/* גרירת פריט מהרשימה אל התכנית */
let dragI = null, wireStock = null;
function dropImported(it, pt, nel, clientY) {
  it.iid = it.iid || uid('i');
  /* רישום האזור שבו ננעץ המוצר */
  const zn = zoneAt(pt);
  if (zn && ['unit', 'panelUnit', 'point', 'panelNode', 'rack'].includes(it.dest)) {
    it.zones = it.zones || {};
    it.zones[zn.name] = (it.zones[zn.name] || 0) + 1;
  }
  const x = Math.max(0, 2200 - pt.x - 90), y = Math.max(0, pt.y - 20);
  /* סמן ממוזער — ממורכז בדיוק על נקודת הנקירה */
  const mx = Math.max(0, 2200 - pt.x - 20), my = Math.max(0, pt.y - 36);
  const from = 'מתוך: ' + (it.src || '');
  const num = it.qty > 1 ? ` (${(it.placed || 0) + 1})` : '';
  switch (it.dest) {
    case 'point':
      P.nodes.push({ id: uid('n'), kind: 'point', name: it.name + num, sub: from, x: mx, y: my, srcIid: it.iid });
      bumpPlaced(it);
      break;
    case 'panelNode':
      P.nodes.push({ id: uid('n'), kind: 'panel', name: it.name + num, sub: from, x, y, panel: panelFromItem(it), srcIid: it.iid });
      bumpPlaced(it);
      break;
    case 'rack':
      P.nodes.push({ id: uid('n'), kind: 'rack', name: it.name.slice(0, 40) + num, sub: from, x, y, ru: it.ru || 12, units: [], srcIid: it.iid });
      bumpPlaced(it);
      break;
    case 'unit': case 'panelUnit': {
      let r = null, slot = null;
      if (nel) {
        const tn = byId(nel.id.slice(3));
        if (tn && tn.kind === 'rack') {
          r = tn;
          const rails = nel.querySelector('.rails');
          if (rails && clientY != null) {
            const rr = rails.getBoundingClientRect();
            slot = Math.max(0, Math.min(r.ru - 1, Math.floor((clientY - rr.top) / (rr.height / r.ru))));
          }
        }
      }
      if (!r) r = byId(it.rack) && byId(it.rack).kind === 'rack' ? byId(it.rack) : autoRack(x, y, it.u || 1);
      const uu = it.u || 1;
      let pos = (slot != null && fits(r, slot, uu, -1)) ? slot : firstFree(r, uu);
      if (pos < 0) { r.ru += uu; pos = firstFree(r, uu); }
      const unit = { id: uid('u'), name: it.name + num, u: uu, cat: it.cat || 'other', pos, srcIid: it.iid, key: it.key };
      if (it.dest === 'panelUnit') unit.panel = panelFromItem(it, uu);
      r.units.push(unit);
      bumpPlaced(it);
      break;
    }
    case 'cable': case 'reel': {
      const s = ensureStockItem(it);
      wireStock = (it.dest === 'cable' ? 'cable|' : 'reel|') + s.id;
      wireMode = { from: null };
      ui.tab = 'cable';
      break;
    }
    case 'conn':
      ensureStockItem(it);
      break;
  }
  render();
}
/* כמה נפרס בפועל בתכנית מכבל/גליל — למשל 124 מ׳ */
function planMeters(it) {
  ensureStock(P);
  const pool = it.dest === 'reel' ? P.stock.reels : P.stock.cables;
  const s = (it.stockId && pool.find(x => x.id === it.stockId)) || pool.find(x => x.name === it.name);
  if (!s || !s.used) return '—';
  return it.dest === 'reel' ? (Math.round(s.used * 10) / 10) + ' מ׳' : s.used;
}
function stockUsage(it) {
  ensureStock(P);
  const pool = it.dest === 'cable' ? P.stock.cables : it.dest === 'reel' ? P.stock.reels : it.dest === 'conn' ? P.stock.conns : null;
  if (!pool) return '';
  const s = pool.find(s => s.name === it.name);
  if (!s) return '';
  return it.dest === 'reel' ? `${s.used || 0}/${s.total} מ׳` : `${s.used || 0}/${s.qty} בשימוש`;
}
function addImported() {
  let px = 150, py = 900, added = 0, lastNewRack = null;
  for (const it of impItems) {
    if (!it.on || it.added || it.dest === 'ignore') continue;
    it.iid = it.iid || uid('i');
    if (it.dest === 'unit' || it.dest === 'panelUnit') {
      /* עדיפות: הארון שנבחר בשורה → הארון שנוצר באותו ייבוא → ארון קיים/אוטומטי */
      const r = (byId(it.rack) && byId(it.rack).kind === 'rack') ? byId(it.rack) : (lastNewRack || autoRack(undefined, undefined, it.u || 1));
      for (let k = 0; k < it.qty; k++) {
        const uu = it.u || 1;
        let pos = firstFree(r, uu);
        if (pos < 0) { r.ru += uu; pos = firstFree(r, uu); }
        const unit = { id: uid('u'), name: it.name + (it.qty > 1 ? ` (${k + 1})` : ''), u: uu, cat: it.cat || 'other', pos, srcIid: it.iid, key: it.key };
        if (it.dest === 'panelUnit') unit.panel = panelFromItem(it, uu);
        r.units.push(unit);
        it.placed = (it.placed || 0) + 1;
      }
    } else if (it.dest === 'point') {
      /* אובייקט נפרד לכל יחידה — 4 רמקולים = 4 מוקדים */
      for (let k = 0; k < it.qty; k++) {
        P.nodes.push({ id: uid('n'), kind: 'point', name: it.name + (it.qty > 1 ? ` (${k + 1})` : ''), sub: 'מתוך: ' + it.src, x: px, y: py, srcIid: it.iid, key: it.key });
        px += 200; if (px > 1500) { px = 150; py += 110; }
        it.placed = (it.placed || 0) + 1;
      }
    } else if (it.dest === 'panelNode') {
      for (let k = 0; k < it.qty; k++) {
        P.nodes.push({ id: uid('n'), kind: 'panel', name: it.name + (it.qty > 1 ? ` (${k + 1})` : ''), sub: 'מתוך: ' + it.src, x: px, y: py, panel: panelFromItem(it), srcIid: it.iid });
        px += 270; if (px > 1500) { px = 150; py += 170; }
        it.placed = (it.placed || 0) + 1;
      }
    } else if (it.dest === 'rack') {
      for (let k = 0; k < it.qty; k++) {
        lastNewRack = { id: uid('n'), kind: 'rack', name: it.name.slice(0, 40), sub: 'מתוך: ' + it.src, x: px, y: py, ru: it.ru || 12, units: [], srcIid: it.iid };
        P.nodes.push(lastNewRack);
        px += 230; if (px > 1500) { px = 150; py += 260; }
        it.placed = (it.placed || 0) + 1;
      }
    } else if (it.dest === 'cable') {
      ensureStock(P);
      P.stock.cables.push({ id: uid('s'), name: it.name, type: it.type || 'multi', len: it.len, mm: it.mm, conn: it.conn, qty: it.qty, used: 0 });
    } else if (it.dest === 'reel') {
      ensureStock(P);
      P.stock.reels.push({ id: uid('s'), name: it.name, type: it.type || 'nl4', mm: it.mm, total: (it.len || 100) * (it.qty || 1), used: 0 });
    } else if (it.dest === 'conn') {
      ensureStock(P);
      P.stock.conns.push({ id: uid('s'), name: it.name, kind: it.kind || 'xlrf', qty: it.qty, used: 0 });
    }
    it.added = true;
    added++;
  }
  render();
}

/* ---- דוח PDF ---- */
function cableTableHTML() {
  return `<table class="cablelist"><tr><th>#</th><th>מ־</th><th>אל</th><th>סוג</th><th>כמות</th><th>עובי / מפרט</th><th>מרחק · ירידת מתח</th><th>סטטוס</th><th>הערה</th></tr>` +
    P.cables.map((c, i) => `<tr>
      <td><span class="badge" style="background:${CTYPES[c.type].c}">${cableLabels()[c.id]}</span></td>
      <td>${endName(c.from, c.fromUnit)}${c.pOut ? ' <small style="color:#888">· ' + esc(c.pOut) + '</small>' : ''}</td><td>${endName(c.to, c.toUnit)}${c.pIn ? ' <small style="color:#888">· ' + esc(c.pIn) + '</small>' : ''}</td>
      <td>${CTYPES[c.type].n}${c.cores?' · '+c.cores+'× XLR':''}${c.fiber?' · '+c.fiber:''}${c.conn && CONNS[c.conn] ? ' · ' + CONNS[c.conn].n + (c.conn2 && CONNS[c.conn2] && c.conn2 !== c.conn ? ' ← ' + CONNS[c.conn2].n : '') : ''}${c.dir === 'both' ? ' ↔' : ''}</td><td>${esc(c.qty)}</td><td>${esc(c.spec)}</td><td>${vdCell(c)}</td><td>${c.inst === 'exist' ? '♻️ קיים' : c.inst === 'pull' ? '🚚 להעברה' : '➕ חדש'}</td><td>${esc(c.note)}</td></tr>`).join('') + '</table>';
}
function rackSection(n) {
  let rows = '';
  for (const u of n.units)
    rows += `<div class="unit" style="top:${u.pos * UPX}px;height:${u.u * UPX}px;background:${CATS[u.cat].c}"><b>${esc(u.name)}</b><span>${u.u}U</span></div>`;
  const sorted = [...n.units].sort((a, b) => a.pos - b.pos);
  let ut = '';
  for (const u of sorted) ut += `<tr><td>U${u.pos + 1}</td><td>${esc(u.name)}</td><td>${u.u}U</td><td>${CATS[u.cat].n}</td></tr>`;
  const cbs = P.cables.map((c, i) => ({ c, i })).filter(({ c }) => c.from === n.id || c.to === n.id);
  let ct = '';
  for (const { c, i } of cbs) {
    const inner = c.from === n.id && c.to === n.id;
    const dirTxt = inner ? 'פנימי' : (c.from === n.id ? 'יוצא' : 'נכנס');
    const dev = c.from === n.id ? unitOf(n.id, c.fromUnit) : unitOf(n.id, c.toUnit);
    const other = inner
      ? `${esc(unitOf(n.id, c.fromUnit)?.name || '?')} ↔ ${esc(unitOf(n.id, c.toUnit)?.name || '?')}`
      : (c.from === n.id ? endName(c.to, c.toUnit) : endName(c.from, c.fromUnit));
    ct += `<tr><td><span class="badge" style="background:${CTYPES[c.type].c}">${i + 1}</span></td><td>${dirTxt}</td><td>${dev ? esc(dev.name) : '—'}</td><td>${other}</td><td>${CTYPES[c.type].n}</td><td>${esc(c.spec || '')}</td></tr>`;
  }
  const used = n.units.reduce((s, u) => s + u.u, 0);
  return `<div class="rp-sec"><h3>${esc(n.name)}${n.sub ? ' — ' + esc(n.sub) : ''} · ${n.ru}U (${used}U בשימוש)</h3>
    <div class="rp-flex">
      <div class="rp-rails"><div class="rails" style="height:${n.ru * UPX}px;position:relative">${rows}</div></div>
      <div style="flex:1"><table class="cablelist"><tr><th>מיקום</th><th>יחידה</th><th>גובה</th><th>קטגוריה</th></tr>${ut || '<tr><td colspan="4">ארון ריק</td></tr>'}</table></div>
    </div>
    ${ct ? `<h4 style="font-size:13px;margin:10px 0 4px">כבלים מחוברים לארון</h4><table class="cablelist"><tr><th>#</th><th>כיוון</th><th>מכשיר בארון</th><th>הצד השני</th><th>סוג</th><th>מפרט</th></tr>${ct}</table>` : ''}
  </div>`;
}
function exportPDF() {
  const racks = P.nodes.filter(n => n.kind === 'rack');
  const points = P.nodes.filter(n => n.kind === 'point');
  let h = `<div class="rp-cover"><div class="rp-logo">KO</div><div>
    <h1>KO Projects — דוח פרויקט</h1><h2>${esc(P.name)}</h2>
    <p>${new Date().toLocaleDateString('he-IL')} · ${racks.length} ארונות · ${points.length} מוקדי קצה · ${P.cables.length} כבלים${P.room && (P.room.ceil || P.room.usage) ? `<br>תקרה: ${P.room.ceil || '?'} מ׳ · ספיגה אקוסטית: ${P.room.absorb ?? '?'}/10 · שימוש: ${esc(P.room.usage || '—')}` : ''}${P.scale ? ' · קנה מידה מכויל ✓' : ''}${(P.zones || []).length ? '<br>אזורי סאונד: ' + P.zones.map(z => esc(z.name) + ' (' + esc(z.usage || '—') + ')').join(' · ') : ''}</p>
  </div></div>`;
  for (const n of racks) h += rackSection(n);
  /* פאנלים וקופסאות מולטי */
  const panels = [];
  P.nodes.forEach(n => {
    if (n.kind === 'panel' && n.panel) panels.push({ t: n.name + (n.sub ? ' — ' + n.sub : ''), p: n.panel });
    if (n.kind === 'rack') n.units.forEach(u => { if (u.panel) panels.push({ t: `${u.name} (${u.u}U, פאנל 19″) — בתוך ${n.name}`, p: u.panel, rack: true }); });
  });
  if (panels.length) {
    h += `<div class="rp-sec"><h3>פאנלים וקופסאות מולטי</h3>` + panels.map(({ t, p, rack }) => {
      const counts = {};
      p.holes.forEach(hh => counts[hh.conn] = (counts[hh.conn] || 0) + 1);
      const cs = Object.entries(counts).map(([k, v]) => `${v}× ${CONNS[k].n}`).join(' · ');
      const lbls = p.holes.map((hh, i) => hh.label ? `${i + 1}: ${esc(hh.label)}` : null).filter(Boolean).join(' · ');
      let body;
      if (rack) body = faceHTML(p, '', -1, true);
      else {
        const w = p.mode === 'matrix' ? pCols(p) * 29 + 24 : (p.w || 260);
        body = p.mode === 'free'
          ? `<div class="pnl" style="position:relative;height:${p.h || 140}px;width:${w}px;display:block;border:1px solid #ccc;border-radius:8px">${holesHTML(p, '', -1, true)}</div>`
          : `<div class="pnl" style="width:${w}px;display:flex;flex-direction:column;gap:5px;border:1px solid #ccc;border-radius:8px">${holesMatrixHTML(p, '', -1, true)}</div>`;
      }
      return `<div style="margin-bottom:16px;page-break-inside:avoid"><b style="font-size:13px">${esc(t)}</b>
        <div style="margin:6px 0">${body}</div>
        <span style="color:#666;font-size:12px">${cs}</span>
        ${lbls ? `<div style="color:#666;font-size:11px;margin-top:2px">שמות חורים: ${lbls}</div>` : ''}</div>`;
    }).join('') + '</div>';
  }
  if (points.length) {
    const LBLp = cableLabels();
    h += `<div class="rp-sec"><h3>מוקדי קצה — רמקולים, מקרנים ותאורה</h3><table class="cablelist"><tr><th>מוקד</th><th>תיאור</th><th>אזור</th><th>גובה (מ׳)</th><th>התקנה על</th><th>כבלים (#)</th></tr>` +
      points.map(n => {
        const cbs = P.cables.filter(c => c.from === n.id || c.to === n.id).map(c => LBLp[c.id]).join(', ');
        const zn = zoneAt({ x: 2200 - n.x - 20, y: n.y + 20 });
        return `<tr><td><b>${esc(n.name)}</b></td><td>${esc(n.sub || '')}</td><td>${zn ? esc(zn.name) : '—'}</td><td>${n.hgt ?? '—'}</td><td>${esc(n.mount || '—')}</td><td>${cbs || '—'}</td></tr>`;
      }).join('') + '</table></div>';
  }
  h += `<div class="rp-sec"><h3>מפתח כבלים מלא</h3>${cableTableHTML()}</div>`;
  h += `<p style="color:#999;font-size:11px;text-align:center">הופק ב-KO Projects · ${new Date().toLocaleString('he-IL')}</p>`;
  const r = $('#report');
  r.innerHTML = h;
  /* תמונת מצב של התכנית המלאה — מדידה אמיתית של גבולות התוכן (כולל רקע מסובב, אזורים וסמנים) */
  const cnv = $('#canvas'), crect = cnv.getBoundingClientRect(), Zc = getZ();
  let xmax = 500, ymax = 400;
  const consider = el => {
    if (!el) return;
    const rb = el.getBoundingClientRect();
    if (!rb.width && !rb.height) return;
    xmax = Math.max(xmax, (crect.right - rb.left) / Zc);
    ymax = Math.max(ymax, (rb.bottom - crect.top) / Zc);
  };
  const bgim = $('#bgimg');
  if (P.bg && bgim.style.display !== 'none') consider(bgim);
  document.querySelectorAll('#nodes > .node').forEach(consider);
  document.querySelectorAll('#zonesc > *').forEach(consider);
  const k = Math.min(1, 700 / (xmax + 30), 950 / (ymax + 30));
  /* צילום תכנית — פעם אחת מלא, ואז שרטוט נפרד לכל דיסציפלינת כבלים */
  const makeSnap = (title) => {
    const snap = document.createElement('div');
    snap.className = 'rp-sec';
    snap.innerHTML = '<h3>' + title + '</h3>';
    const holder = document.createElement('div');
    holder.style.cssText = `width:${Math.round((xmax + 30) * k)}px;height:${Math.round((ymax + 30) * k)}px;overflow:hidden;border:1px solid #ddd;border-radius:8px;position:relative;margin:0 auto;page-break-inside:avoid`;
    const clone = $('#canvas').cloneNode(true);
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    const f = Math.max(1, Math.min(2.6, 0.85 / k));
    clone.querySelectorAll('svg [stroke-width]').forEach(el => el.setAttribute('stroke-width', (parseFloat(el.getAttribute('stroke-width')) || 1) * f));
    clone.querySelectorAll('svg circle').forEach(c2 => c2.setAttribute('r', (parseFloat(c2.getAttribute('r')) || 3) * Math.min(f, 2)));
    clone.querySelectorAll('svg text').forEach(t => t.setAttribute('font-size', (parseFloat(t.getAttribute('font-size')) || 11) * Math.min(f, 1.8)));
    clone.querySelectorAll('.node.mini').forEach(m => { m.style.transform = `scale(${Math.min(f, 2)})`; m.style.transformOrigin = 'top center'; });
    clone.style.transform = `scale(${k})`;
    clone.style.transformOrigin = 'top right';
    clone.style.position = 'absolute';
    clone.style.top = '0';
    clone.style.right = '0';
    holder.appendChild(clone);
    snap.appendChild(holder);
    return snap;
  };
  const snaps = [];
  const savedVis = JSON.stringify(P.cabVis || {});
  snaps.push(makeSnap('תכנית כללית — פריסה וחיווט'));
  /* שרטוט לכל קטגוריה שיש בה כבלים: מדליקים רק אותה, מרנדרים, מצלמים */
  const CAT_TITLES = { audio: '🔊 שרטוט חיווט סאונד', light: '💡 שרטוט חיווט תאורה', video: '📺 שרטוט חיווט וידאו', data: '🌐 שרטוט רשת ואופטי', power: '⚡ שרטוט חשמל' };
  const present = [...new Set((P.cables || []).map(c => CAB_GROUP[c.type] || 'audio'))];
  if (present.length > 1) {
    for (const cat of ['audio', 'light', 'video', 'data', 'power']) {
      if (!present.includes(cat)) continue;
      P.cabVis = {}; ['audio', 'light', 'video', 'data', 'power'].forEach(k2 => P.cabVis[k2] = (k2 === cat));
      renderWires(); renderNodes();
      snaps.push(makeSnap(CAT_TITLES[cat] + ' (' + (P.cables || []).filter(c => (CAB_GROUP[c.type] || 'audio') === cat).length + ' כבלים)'));
    }
    P.cabVis = JSON.parse(savedVis);
    renderWires(); renderNodes();
  }
  for (let si = snaps.length - 1; si >= 0; si--) r.insertBefore(snaps[si], r.children[1]);
  document.body.classList.add('printing');
  setTimeout(() => window.print(), 80);
}
window.addEventListener('afterprint', () => document.body.classList.remove('printing'));

impItems = P.impSaved || [];
render();
/* מצב פתיחה נכנס להיסטוריה מיד, אחרת אין לאן לחזור בביטול הראשון */
HIST.past.push(snapProject());
renderHistBtns();
