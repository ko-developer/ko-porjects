/* ===== 🌐 שפת הממשק: עברית / English =====
   שכבת תרגום בזמן ריצה: המילון I18N_EN (data/i18n_en.json, נבנה ב-scripts/i18n-build.js מהמקור) ממפה מקטעי טקסט בעברית
   לאנגלית. כל צומת טקסט / title / placeholder מפוצל במפרידים (· — | : ( ) שורה), מספרים → #, ומתורגם מקטע-מקטע; מה שלא
   במילון נשאר בעברית (שמות פריטים מה-ERP, שמות פרויקטים ואזורים של המשתמש). MutationObserver מתרגם כל רינדור חדש.
   הבחירה נשמרת ב-localStorage (ko_lang); החלפה טוענת את הדף מחדש. באנגלית הדף LTR. */
const I18N = { lang: 'he', dict: null, obs: null, last: new WeakMap(), pending: new Set(), raf: 0 };
const I18N_HEB = /[֐-׿]/;
const I18N_SEP = /(\s[·—|•]\s|\s[-–]\s|\n|:\s|\(|\)|\[|\]|\s\/\s|\.\s|\?\s|!\s|…)/;
const I18N_EDGE = '[\\s#%₪$:,.;!?…\\-–—()\\[\\]{}"\'«»×*•·|/+=&~\\d]*';
const I18N_PIECE_RX = new RegExp('^(' + I18N_EDGE + ')([\\s\\S]*?)(' + I18N_EDGE + ')$');
function i18nLang() {
  /* קישור דוח (/r/<token>) בתוך ה-ERP: השפה של ה-ERP (?lang=), בלי לשמור */
  try { if (location.pathname.indexOf('/r/') === 0) { const q = new URLSearchParams(location.search).get('lang'); if (q === 'en' || q === 'he') return q; } } catch {}
  try { return localStorage.getItem('ko_lang') || 'he'; } catch { return 'he'; }
}
function i18nDict() { if (I18N.dict) return I18N.dict; I18N.dict = typeof I18N_EN !== 'undefined' && I18N_EN ? I18N_EN : {}; return I18N.dict; }
/* מקטע אחד: קצוות (מספרים, סימנים) נשמרים, הליבה מתורגמת, # מוחלף חזרה במספרים לפי הסדר */
function i18nPiece(p) {
  if (!I18N_HEB.test(p)) return p;
  const m = I18N_PIECE_RX.exec(p); if (!m) return p;
  const lead = m[1], core = m[2], trail = m[3];
  const nums = []; const key = core.replace(/\s+/g, ' ').replace(/\d+([.,]\d+)?/g, x => { nums.push(x); return '#'; }).trim();
  const D = i18nDict();
  let tr = D[key] || D[key.replace(/״/g, '"').replace(/׳/g, "'")] || D[key.replace(/"/g, '״').replace(/'/g, '׳')];
  let pre = '';
  if (!tr) {   /* אימוג׳י/סימן בתחילת המקטע ("🖊 ערוך את השרטוט") — מחפשים את הטקסט בלעדיו */
    const m2 = /^([^\p{L}\p{N}#]+\s*)([\s\S]+)$/u.exec(key);
    if (m2 && D[m2[2]]) { pre = m2[1]; tr = D[m2[2]]; }
  }
  if (!tr && nums.length && /#/.test(key)) {   /* "לומד מ-# דוגמאות שלך": המקור חולק ב-${} סביב המספר — מתרגמים כל חלק בנפרד */
    let ok = false;
    const segs = key.split('#').map(sg => { const m3 = /^([^\p{L}\p{N}]*)([\s\S]*?)([^\p{L}\p{N}]*)$/u.exec(sg); const k2 = (m3 ? m3[2] : sg).trim(); const t2 = k2 ? D[k2] : ''; if (t2) ok = true; return k2 ? (m3[1] + (t2 || k2) + m3[3]) : sg; });
    if (ok) { let j = 0; return lead + segs.join('#').replace(/#/g, () => (j < nums.length ? nums[j++] : '#')) + trail; }
  }
  if (!tr) return p;
  let i = 0;
  return lead + pre + tr.replace(/#/g, () => (i < nums.length ? nums[i++] : '#')) + trail;
}
function i18nText(s) {
  if (!s || !I18N_HEB.test(s)) return s;
  const parts = String(s).split(I18N_SEP);
  return parts.map((p, i) => (i % 2 ? p : i18nPiece(p))).join('');
}
const I18N_SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, CODE: 1, PRE: 1, NOSCRIPT: 1 };
const I18N_ATTRS = ['title', 'placeholder', 'aria-label', 'alt', 'data-tip'];
function i18nNode(n) {
  if (n.nodeType === 3) {
    const p = n.parentNode; if (!p || I18N_SKIP[p.nodeName] || (p.isContentEditable && p.nodeName !== 'BODY')) return;
    const cur = n.nodeValue; if (!I18N_HEB.test(cur) || I18N.last.get(n) === cur) return;
    const out = i18nText(cur); if (out !== cur) { n.nodeValue = out; I18N.last.set(n, out); }
    return;
  }
  if (n.nodeType !== 1) return;
  if (I18N_SKIP[n.nodeName]) return;
  for (const a of I18N_ATTRS) { const v = n.getAttribute && n.getAttribute(a); if (v && I18N_HEB.test(v)) { const out = i18nText(v); if (out !== v) n.setAttribute(a, out); } }
  if ((n.nodeName === 'INPUT') && /^(button|submit|reset)$/i.test(n.type || '') && I18N_HEB.test(n.value)) n.value = i18nText(n.value);
  const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  const els = [], txt = [];
  let c; while ((c = w.nextNode())) { if (c.nodeType === 3) txt.push(c); else if (!I18N_SKIP[c.nodeName]) els.push(c); }
  for (const e of els) { for (const a of I18N_ATTRS) { const v = e.getAttribute(a); if (v && I18N_HEB.test(v)) { const out = i18nText(v); if (out !== v) e.setAttribute(a, out); } } if (e.nodeName === 'INPUT' && /^(button|submit|reset)$/i.test(e.type || '') && I18N_HEB.test(e.value)) e.value = i18nText(e.value); }
  for (const t of txt) i18nNode(t);
}
function i18nFlush() {
  I18N.raf = 0;
  const list = [...I18N.pending]; I18N.pending.clear();
  for (const n of list) { if (n.isConnected) i18nNode(n); }
  if (document.title && I18N_HEB.test(document.title)) { const t = i18nText(document.title); if (t !== document.title) document.title = t; }
}
function i18nQueue(n) { I18N.pending.add(n); if (!I18N.raf) I18N.raf = requestAnimationFrame(i18nFlush); }
function i18nStart() {
  I18N.lang = i18nLang();
  const b = document.getElementById('langBtn'); if (b) { b.textContent = I18N.lang === 'en' ? 'עב' : 'EN'; b.title = I18N.lang === 'en' ? 'עברית' : 'English'; }
  if (I18N.lang !== 'en') return;
  document.documentElement.lang = 'en'; document.documentElement.dir = 'ltr'; document.documentElement.classList.add('lang-en');
  const cw = document.getElementById('canvasWrap'); if (cw) cw.style.direction = 'rtl';   /* הקנבס: scrollLeft שלילי = גלילה שמאלה, המקור בפינה הימנית — כמו בעברית */
  i18nNode(document.body);
  if (document.title) document.title = i18nText(document.title);
  I18N.obs = new MutationObserver(muts => {
    for (const m of muts) {
      if (m.type === 'childList') m.addedNodes.forEach(n => i18nQueue(n));
      else if (m.type === 'characterData') i18nQueue(m.target);
      else if (m.type === 'attributes') i18nQueue(m.target);
    }
  });
  I18N.obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: I18N_ATTRS });
}
function i18nToggle() {
  const next = i18nLang() === 'en' ? 'he' : 'en';
  try { localStorage.setItem('ko_lang', next); } catch {}
  location.reload();
}
/* מסמך נפרד (דוח ההתקנה ב-iframe srcdoc, wizard.js): ה-MutationObserver לא רואה אותו — מתרגמים פעם אחת כשנטען */
function i18nDoc(doc) {
  if (I18N.lang !== 'en' || !doc || !doc.body) return;
  doc.documentElement.lang = 'en'; doc.documentElement.dir = 'ltr';
  const w = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let c;
  while ((c = w.nextNode())) {
    if (c.nodeType === 3) { const p = c.parentNode; if (p && !I18N_SKIP[p.nodeName] && I18N_HEB.test(c.nodeValue)) { const out = i18nText(c.nodeValue); if (out !== c.nodeValue) c.nodeValue = out; } }
    else for (const a of I18N_ATTRS) { const v = c.getAttribute(a); if (v && I18N_HEB.test(v)) c.setAttribute(a, i18nText(v)); }
  }
  if (doc.title && I18N_HEB.test(doc.title)) doc.title = i18nText(doc.title);
}
window.i18nToggle = i18nToggle; window.i18nText = i18nText; window.i18nDoc = i18nDoc;
/* מתחילים אחרי שה-DOM מוכן; render() הראשון של האפליקציה נתפס ע"י ה-observer */
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', i18nStart); else i18nStart();
