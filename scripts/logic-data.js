/* נתוני "תכלית ← קיטים" (src/pages/logic.html) — חיים, לא מוקלטים:
   הקיטים = קיטי ה-ERP (data/erp_kits.json) עם הגרסאות שלי מה-store (אותו מיזוג כמו allKits באפליקציה: שם זהה / replaces / שם שנחתך ל-60),
   בלי המוסתרים; היכולת (spl) = הרמקול החלש ביותר בקיט לפי המפרטים המאומתים של מטריצת ההתאמות (max SPL, או רגישות+הספק).
   ההחלטה לכל תכלית מחושבת בדף מול יעד ה-dB (גם אחרי דריסה ידנית של היעד). */
import { readFileSync } from 'node:fs';

const SUB_RX = /סאב|\bsub\b|subwoofer|\bSB\s?\d|\bBR\s?1\d\d|\bF1\d\d\b|\bF2\d\d\b|TILL\s?1[58]|NOMOS|ARRAY\s?SUB|PAGAZ\s?115|MF-?15|LFX|\bLS2\b/i;
const SPK_RX = /רמקול|speaker|קולונ|column|מוניטור|monitor|\bTOP\b|טופ/i;
const POWERED_RX = /מוגבר|מוגברת|אקטיבי|active|powered|\bTX-2A\b|\bCX-1\b/i;
const NOT_SPK_RX = /כבל|מתקן|תושבת|מחבר|קייס|ארון|פאנל|פנל|קיפד|התקנה|תכנות|עבודת|כרטיס|מדף|סטנד|חצובה|ספק|כיסוי|גלגל|מגבר|פרוססור|מיקסר|processor|amplifier|mixer/i;

let specsCache = null;
function matrixSpecs() {
  if (specsCache) return specsCache;
  try {
    const html = readFileSync('src/pages/matrix.html', 'utf8');
    const m = /<script id="mdata" type="application\/json">([\s\S]*?)<\/script>/.exec(html);
    const d = m ? JSON.parse(m[1]) : {};
    specsCache = Object.entries(d.specs || {}).map(([k, v]) => ({ k: k.toUpperCase().replace(/\s+/g, ' '), v })).sort((a, b) => b.k.length - a.k.length);
  } catch { specsCache = []; }
  return specsCache;
}
/* מפרט לפריט לפי שם: המפתח הארוך ביותר של המטריצה שמופיע בשם הפריט (TILL 8, EUPHORIA 8, SB8…) */
let specRxCache = null;
function specOf(name) {
  /* המפתח כביטוי שמרשה רווחים/מקפים בין התווים ("F 55" = "F55", "WR 600" = "WR600") על השם המקורי; גבולות: לפני לא אות/ספרה, אחרי לא ספרה (F5 לא תופס F55) */
  if (!specRxCache) specRxCache = matrixSpecs().map(({ k, v }) => ({ v, rx: new RegExp('(?<![A-Z0-9])' + k.replace(/[\s\-_]+/g, '').split('').map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s\\-_]*') + '(?![0-9])', 'i') }));
  const n = String(name || '').toUpperCase().replace(/\s+/g, ' ');
  for (const { rx, v } of specRxCache) if (rx.test(n)) return v;
  return null;
}
/* יכולת בפועל: SPL מקסימלי ב-1 מ׳ (או רגישות+הספק) פחות 10 dB — מרחק האזנה נומינלי ~3 מ׳; כך רמקול 5" (118 dB) לא נראה מתאים לרחבת ריקודים */
const LISTEN_LOSS = 10;
function capOf(spec) { if (!spec) return null; const at1m = spec.spl > 0 ? +spec.spl : (spec.sens > 0 && spec.w > 0 ? spec.sens + 10 * Math.log10(spec.w) : null); return at1m == null ? null : +(at1m - LISTEN_LOSS).toFixed(1); }
function trim60(s) { return String(s || '').trim(); }
/* הקיט שאותו הגרסה שלי מחליפה: שם זהה, replaces, או שם שנחתך ל-60 תווים */
function baseOf(u, bases) {
  const n = trim60(u.name), r = trim60(u.replaces);
  return bases.find(b => { const bn = trim60(b.name); return bn === n || (r && bn === r) || (bn.length === 60 && (n.startsWith(bn) || (r && r.startsWith(bn)))); }) || null;
}
export function liveKits(store) {
  let bases = [];
  try { bases = JSON.parse(readFileSync('data/erp_kits.json', 'utf8')); } catch {}
  const mine = Array.isArray(store && store.userKits) ? store.userKits : [], hidden = (store && store.kitHidden) || {};
  const overridden = new Set();
  mine.forEach(u => { const b = baseOf(u, bases); if (b) overridden.add(b); });
  const list = bases.filter(b => !overridden.has(b)).concat(mine)
    .filter(k => k && trim60(k.name) && !/^\(unnamed kit\)$/i.test(trim60(k.name)) && !hidden[trim60(k.name)]);
  return list.map(k => {
    const items = Array.isArray(k.items) ? k.items : [];
    const tops = items.filter(it => { const nm = it.name || ''; return SPK_RX.test(nm) && !SUB_RX.test(nm) && !NOT_SPK_RX.test(nm.replace(/לרמקול|רמקולים?\b/g, '')); });
    const caps = tops.map(it => ({ nm: it.name, cap: capOf(specOf(it.name)) })).filter(x => x.cap != null);
    const weakest = caps.length ? caps.reduce((a, b) => b.cap < a.cap ? b : a) : null;
    const powered = items.some(it => SPK_RX.test(it.name || '') && POWERED_RX.test(it.name || ''));
    return { name: trim60(k.name), spk: tops.length > 0, powered, spl: weakest ? Math.round(weakest.cap) : null, weakest: weakest ? weakest.nm : null, n: items.length, mine: mine.includes(k) };
  });
}
/* מזריק לתוך mdata של הדף: הקיטים החיים; auto נבנה בדף מול היעד */
export function injectLogicData(page, store) {
  return page.replace(/(<script id="mdata" type="application\/json">)([\s\S]*?)(<\/script>)/, (m, a, json, b) => {
    let d = {}; try { d = JSON.parse(json); } catch {}
    d.kits = liveKits(store); d.auto = {}; d.live = new Date().toISOString();
    return a + JSON.stringify(d) + b;
  });
}
