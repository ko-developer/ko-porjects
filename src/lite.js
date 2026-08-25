/* ===================================================================================
   KO Studio — גרסת משתמשי קצה. אפליקציה עצמאית לחלוטין (לא נוגעת ב-app.js המקצועי).
   הרעיון: לשאול שאלות בשפה של בעל העסק, להבין מהתשובות מה העוצמה הנדרשת בכל אזור,
   ולהחזיר שלוש הצעות אמיתיות עם מלאי ומחירי יחידה מה-ERP + דוח ברור לאדריכל/חשמלאי. */
/*__DATA:LITE_CATALOG__*/
/*__DATA:ERP_ITEMS__*/
/*__DATA:ERP_PRICES__*/
/*__DATA:ERP_IMAGES__*/
/*__DATA:ERP_KITS__*/

const $ = s => document.querySelector(s);
const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ils = n => '₪' + Math.round(n).toLocaleString('he-IL');
const SND = 343;

/* ---------- מצב ---------- */
const LS = 'koStudio_v1';
let S = {
  step: 0, venue: null, uses: [], name: '',
  plan: null, planW: 1400, planH: 900, scale: null,   /* מטרים לפיקסל */
  roomW: null, roomL: null, ceil: 4,
  zones: [],            /* {id,name,purpose,x,y,w,h,spl} — במרחב התכנית */
  budget: null, tier: null, contact: {}
};
function save() { try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) {} }
function load() { try { const d = JSON.parse(localStorage.getItem(LS) || 'null'); if (d && d.step != null) S = { ...S, ...d }; } catch (e) {} }
function uid() { return 'z' + Math.random().toString(36).slice(2, 8); }

/* ---------- מנוע אקוסטי (גרסה קומפקטית ומדויקת של המנוע המקצועי) ---------- */
/* SPL של רמקול במרחק r: רגישות + 10log10(הספק) − 20log10(r) */
function splAt(spk, w, r) { return spk.sens + 10 * Math.log10(Math.max(1, w)) - 20 * Math.log10(Math.max(0.7, r)); }
/* מרווח מומלץ בין רמקולים בפריסה מבוזרת (תקרה→אוזן 1.2 מ׳) */
function spacing(spk, ceil, density) {
  const drop = Math.max(1.2, (ceil || 3) - 1.2);
  return Math.max(2, 2 * drop * Math.tan((spk.h * Math.PI / 180) / 2) * (density || 1));
}
/* כמה רמקולים דרושים לאזור, ומה ה-SPL הצפוי */
function planZone(zone, tier, ceil, scale) {
  const b = zoneBox(zone);
  const wM = b.w * scale, hM = b.h * scale, area = zoneAreaPx(zone) * scale * scale;
  const loud = zone.spl >= 95, mid = zone.spl >= 85;
  const spk = loud && tier.spkBig ? tier.spkBig : tier.spk;
  /* צפיפות: רחבה = כיסוי צמוד ואחיד · רקע = פחות נקודות, מרווח גדול יותר */
  const dens = loud ? 0.8 : mid ? 1.1 : 1.5;
  const sp = spacing(spk, ceil, dens);
  /* פריסה היקפית: מספר עמדות סביב האזור לפי ההיקף והמרווח */
  const perim = zonePerimPx(zone) * scale;
  let n = Math.max(2, Math.ceil(perim / sp));
  if (n % 2) n++;                                            /* זוגי — סימטרי ונוח לחיווט */
  n = Math.min(n, 24);
  /* הספק לרמקול: מוגבל להספק הרמקול ולמה שהמגבר נותן */
  const wPer = Math.min(spk.w, 250);
  /* SPL במרכז: כל הרמקולים תורמים, מרחק ממוצע ≈ חצי האלכסון */
  const rAvg = Math.max(2, Math.hypot(wM, hM) / 2);
  const one = splAt(spk, wPer, rAvg);
  const capability = one + 10 * Math.log10(n);               /* יכולת מקסימלית (חיבור לא-קוהרנטי) */
  /* ההספק שבאמת יידרש כדי להגיע לעוצמת היעד — ממנו נגזר המרווח (headroom) */
  const needW = Math.max(1, wPer / Math.pow(10, (capability - zone.spl) / 10));
  const subs = zone.spl >= 90 ? Math.max(1, Math.round(area / 90)) : 0;
  return { spk, n, subs, area, spacing: sp, splCenter: capability, capability, headroom: capability - zone.spl,
    needW, splTarget: zone.spl, ok: capability >= zone.spl + 3, wPer };
}
/* ---------- למידה מהקיטים: מה הולך עם מה ---------- */
/* הקיטים ב-ERP הם הידע המצטבר של החברה — מהם לומדים אילו מגבר/סאב משתלבים עם כל רמקול */
let KITPAIR = null;
function kitPairs() {
  if (KITPAIR) return KITPAIR;
  KITPAIR = { amp: {}, sub: {} };
  const SPK = /רמקול|סאב/i, AMP = /מגבר|amplifier/i, SUB = /סאב|\bsub\b/i;
  const NOT = /מתקן|תושבת|כבל|מחבר|ערכת|כרטיס|מדף|כיסוי/i;
  (typeof ERP_KITS !== 'undefined' ? ERP_KITS : []).forEach(k => {
    const its = (k.items || []).filter(i => i.name && i.key);
    const tops = its.filter(i => SPK.test(i.name) && !SUB.test(i.name) && !NOT.test(i.name));
    const amps = its.filter(i => AMP.test(i.name) && !NOT.test(i.name));
    const subs = its.filter(i => SUB.test(i.name) && !NOT.test(i.name));
    tops.forEach(t => {
      amps.forEach(a => { (KITPAIR.amp[t.key] = KITPAIR.amp[t.key] || {})[a.key] = (KITPAIR.amp[t.key][a.key] || 0) + 1; });
      subs.forEach(b => { (KITPAIR.sub[t.key] = KITPAIR.sub[t.key] || {})[b.key] = (KITPAIR.sub[t.key][b.key] || 0) + 1; });
    });
  });
  return KITPAIR;
}
/* האם הזיווג שבחרנו מגובה בקיטים של החברה */
function kitBacked(spkKey, otherKey, kind) {
  const m = kitPairs()[kind][spkKey];
  return !!(m && m[otherKey]);
}
/* כמה רמקולים אפשר לתלות על ערוץ אחד של המגבר — חוק אום + בדיקת הספק.
   זה מה שמבדיל הצעה יעילה מהצעה שמבזבזת מגברים: מגבר שיציב ב-2Ω יכול לשאת
   4 רמקולים של 8Ω על ערוץ, במקום 2. */
function ampPowerAt(amp, ohm) {
  const pw = amp.pw || {};
  const keys = Object.keys(pw).map(Number).sort((a, b) => b - a);
  if (!keys.length) return 0;
  let best = keys[0], bd = Infinity;
  keys.forEach(k => { const d = Math.abs(k - ohm); if (d < bd) { bd = d; best = k; } });
  return pw[best];
}
/* כלל ההספק: מגבר צריך לתת בערך פי 2 ממה שמחובר אליו.
   פי 2 מהספק ה-RMS של הרמקולים הוא הסטנדרט המקצועי — זה מה שנותן מרווח לפסגות
   המוזיקה בלי שהמגבר ייכנס לקליפ (שזה מה ששורף רמקולים). מתחת ל-×1.5 לא מאשרים. */
const PWR_TARGET = 2.0, PWR_MIN = 1.5;
function spkPerChannel(amp, spk) {
  const minOhm = amp.minOhm || 4;
  const ohmLimit = Math.max(1, Math.floor((spk.ohm || 8) / minOhm + 1e-6));
  let best = 0, bestRatio = 0;
  for (let n = 1; n <= Math.min(8, ohmLimit); n++) {
    const load = (spk.ohm || 8) / n;
    const ratio = ampPowerAt(amp, load) / Math.max(1, n * (spk.w || 100));
    if (ratio >= PWR_MIN) { best = n; bestRatio = ratio; }   /* הכי הרבה רמקולים שעדיין עומדים בכלל */
  }
  if (!best) { /* אפילו רמקול אחד לא מקבל מספיק — מסמנים כגבולי */
    best = 1; bestRatio = ampPowerAt(amp, spk.ohm || 8) / Math.max(1, spk.w || 100);
  }
  return { n: best, ratio: +bestRatio.toFixed(2), ok: bestRatio >= PWR_MIN };
}
/* בחירת הסאב: חלל גדול או רחבה/DJ ⇒ סאב גדול (18"), אחרת הרגיל */
function pickSub(tier, zones, scale) {
  const area = zones.reduce((s2, z) => s2 + z.w * z.h * scale * scale, 0);
  const loud = zones.some(z => z.spl >= 95);
  const big = loud || area > 150;
  return { sub: big && tier.subBig ? tier.subBig : tier.sub, big };
}
/* בניית הצעה מלאה לשכבה */
function buildProposal(tier) {
  const scale = S.scale || 0.02, ceil = S.ceil || 4;
  const zones = S.zones.map(z => ({ z, p: planZone(z, tier, ceil, scale) }));
  const spkCount = {}, add = (k, n) => spkCount[k] = (spkCount[k] || 0) + n;
  let totalSpk = 0, totalSub = 0;
  zones.forEach(({ p }) => { add(p.spk.key, p.n); totalSpk += p.n; if (p.subs) totalSub += p.subs; });
  /* מגברים: ערוצים לפי מספר קווים (2 רמקולים לקו בממוצע) + קו לכל סאב */
  /* ניצול המגבר: בוחרים מבין המגברים של השכבה את זה שנותן הכי הרבה רמקולים לשקל,
     ומחשבים ערוצים לפי כמה רמקולים באמת אפשר לתלות על ערוץ (אום + הספק). */
  const mainSpk = Object.keys(spkCount)[0]
    ? [tier.spk, tier.spkBig, tier.spkSmall].find(x => x && x.key === Object.keys(spkCount)[0]) || tier.spk : tier.spk;
  const cands = [tier.ampSmall, tier.amp, tier.ampBig].filter(Boolean);
  let amp = tier.amp, ampN = 99, perCh = 1;
  let pwrRatio = 0, pwrOk = false;
  let bestCost = Infinity;
  cands.forEach(a => {
    const cap = spkPerChannel(a, mainSpk);
    const chNeeded = Math.ceil(totalSpk / cap.n) + totalSub;   /* סאב = ערוץ ייעודי */
    const n = Math.max(1, Math.ceil(chNeeded / (a.ch || 2)));
    /* ציון: עלות אמיתית · בונוס לזיווג מהקיטים · קנס ככל שמתרחקים מיחס ×2 */
    const kitBonus = kitBacked(mainSpk.key, a.key, 'amp') ? 0.9 : 1;
    const pwrPenalty = cap.ok ? 1 + Math.min(0.25, Math.abs(cap.ratio - PWR_TARGET) * 0.06) : 2.5;
    const cost = n * a.price * kitBonus * pwrPenalty;
    if (cost < bestCost) { bestCost = cost; amp = a; ampN = n; perCh = cap.n; pwrRatio = cap.ratio; pwrOk = cap.ok; }
  });
  const ampFromKit = kitBacked(mainSpk.key, amp.key, 'amp');
  const lines = Math.ceil(totalSpk / perCh) + totalSub;
  /* אורך כבל משוער: היקף כל האזורים ×1.3 + 12 מ׳ לארון */
  const meters = Math.ceil(zones.reduce((s, { z }) => s + 2 * (z.w * scale + z.h * scale), 0) * 1.3 + 12);
  const reels = Math.max(1, Math.ceil(meters / LITE_CATALOG.accessories.cableReel.meters));
  const rows = [];
  const push = (key, name, qty, price, note) => { if (qty > 0) rows.push({ key, name, qty, price, total: qty * price, note }); };
  Object.entries(spkCount).forEach(([k, n]) => {
    const t = [tier.spk, tier.spkBig, tier.spkSmall].find(x => x && x.key === k) || tier.spk;
    push(k, t.name, n, t.price, 'רמקולים');
    if (t.mount) { const m = erpItem(t.mount); if (m) push(t.mount, m.name, n, m.price, 'מתקני תלייה'); }
  });
  const { sub, big: bigSub } = pickSub(tier, S.zones, scale);
  if (totalSub) push(sub.key, sub.name, totalSub, sub.price, 'סאבים');
  push(amp.key, amp.name, ampN, amp.price, 'הגברה');
  if (tier.xover && totalSub) push(tier.xover.key, tier.xover.name, ampN, tier.xover.price, 'הגברה');
  const A = LITE_CATALOG.accessories;
  push(A.cableReel.key, A.cableReel.name, reels, A.cableReel.price, 'תשתית');
  push(A.speakon.key, A.speakon.name, (totalSpk + totalSub) * 2, A.speakon.price, 'תשתית');
  push(A.rack.key, A.rack.name, 1, A.rack.price, 'תשתית');
  /* מעבד/מטריצה — רק כשרוצים תוכן שונה בכל אזור */
  if (S.sameContent === false && S.zones.length > 1) {
    /* מטריצת רשת אמיתית מהמלאי — 4 יציאות, שולטת בתוכן ובעוצמה לכל אזור */
    const mx = erpItem('SDIG15KO') || erpItem('SDIG5KO');
    if (mx) push(mx.key, mx.name, 1, mx.price, 'ניתוב תוכן');
  }
  const equip = rows.reduce((s, r) => s + r.total, 0);
  /* התקנה מתומחרת לפי פריט — כל פעולה והמחיר שלה, כמו בהצעת מחיר מקצועית */
  const inst = [
    { k: 'arrive', label: 'הגעה, פריקה והתארגנות באתר', unit: 'ביקור', qty: 1, price: 350 },
    { k: 'spk',    label: 'התקנת רמקול על קיר/תקרה כולל מתקן וכיוון', unit: 'יח׳', qty: totalSpk, price: 160 },
    { k: 'sub',    label: 'הצבת סאב, חיבור וכיוון', unit: 'יח׳', qty: totalSub, price: 90 },
    { k: 'rack',   label: 'הרכבת מגבר/מעבד בארון וחיווט פנימי', unit: 'יח׳', qty: ampN, price: 200 },
    { k: 'ends',   label: 'קצוות ומחברים לכל קו רמקול', unit: 'קו', qty: lines, price: 45 },
    { k: 'tune',   label: 'כיוונון, בדיקות ומסירה', unit: 'אזור', qty: S.zones.length, price: 400 }
  ].filter(r => r.qty > 0).map(r => ({ ...r, total: r.qty * r.price }));
  const install = inst.reduce((s, r) => s + r.total, 0);
  const hours = (45 + totalSpk * 30 + totalSub * 15 + ampN * 30 + 45 * S.zones.length) / 60;
  const days = Math.max(1, Math.ceil(hours / 8));
  return { tier, zones, rows, inst, equip, install, days, hours, total: equip + install,
    totalSpk, totalSub, ampN, amp, perCh, pwrRatio, pwrOk, lines, meters, sub, bigSub, ampFromKit, mainSpk, util: Math.round(totalSpk / Math.max(1, ampN * (amp.ch || 2) * perCh) * 100) };
}
function erpItem(key) {
  const r = (typeof ERP_ITEMS !== 'undefined' ? ERP_ITEMS : []).find(x => x[0] === key);
  return r ? { key: r[0], name: r[1], price: +r[2] || 0, stock: +r[3] || 0 } : null;
}
function stockOf(key) { const r = erpItem(key); return r ? r.stock : null; }
function imgOf(key) { return (typeof ERP_IMAGES !== 'undefined' && ERP_IMAGES[key]) || ''; }

/* ---------- זיהוי תכנית (ראייה ממוחשבת בדפדפן) ---------- */
/* ממיר לגווני אפור, מזהה את גבולות השרטוט ואת החללים הריקים הגדולים = אזורים מועמדים */
function analysePlan(img) {
  const W = 300, H = Math.max(60, Math.round(W * img.naturalHeight / img.naturalWidth));
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, W, H);
  const d = g.getImageData(0, 0, W, H).data;
  const dark = new Uint8Array(W * H);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const lum = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    dark[p] = (d[i + 3] > 40 && lum < 150) ? 1 : 0;
  }
  /* גבולות השרטוט */
  let x0 = W, y0 = H, x1 = 0, y1 = 0, n = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (dark[y * W + x]) { n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (n < 60 || x1 - x0 < 20 || y1 - y0 < 20) return null;
  const bw = x1 - x0, bh = y1 - y0;
  /* קירות: עמודה/שורה שבה רצף כהה ארוך — היטל של פיקסלים כהים על כל ציר */
  const colSum = new Float32Array(W), rowSum = new Float32Array(H);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (dark[y * W + x]) { colSum[x]++; rowSum[y]++; }
  const peaks = (arr, from, to, span) => {
    const th = span * 0.55, out = [];
    for (let i = from; i <= to; i++) {
      if (arr[i] < th) continue;
      let j = i; while (j <= to && arr[j] >= th) j++;
      const mid = Math.round((i + j - 1) / 2);
      /* מתעלמים מקירות החוץ ומקירות צמודים זה לזה */
      if (mid - from > span * 0.12 && to - mid > span * 0.12 && (!out.length || mid - out[out.length - 1] > span * 0.12)) out.push(mid);
      i = j;
    }
    return out;
  };
  const vWalls = peaks(colSum, x0, x1, bh);   /* קירות אנכיים */
  const hWalls = peaks(rowSum, y0, y1, bw);   /* קירות אופקיים */
  /* חלוקה למלבנים לפי הקירות שנמצאו (עד 3×3) */
  const xs = [x0, ...vWalls.slice(0, 2), x1], ys = [y0, ...hWalls.slice(0, 2), y1];
  const rooms = [];
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) {
    const rx = xs[i], ry = ys[j], rw = xs[i + 1] - rx, rh = ys[j + 1] - ry;
    if (rw < bw * 0.14 || rh < bh * 0.14) continue;
    /* כמה "מלא" החדר — חדר אמיתי הוא בעיקר ריק עם ריהוט, לא גוש שחור */
    let cnt = 0, tot = 0;
    for (let y = ry; y < ry + rh; y += 2) for (let x = rx; x < rx + rw; x += 2) { tot++; cnt += dark[y * W + x]; }
    const density = tot ? cnt / tot : 1;
    if (density > 0.45) continue;
    rooms.push({ x: rx, y: ry, w: rw, h: rh, area: rw * rh, density });
  }
  rooms.sort((a, b) => b.area - a.area);
  const k = img.naturalWidth / W, sc = S.planW / img.naturalWidth, pad = 3;
  const map = r => ({ x: Math.round((r.x + pad) * k * sc), y: Math.round((r.y + pad) * k * sc),
    w: Math.round((r.w - pad * 2) * k * sc), h: Math.round((r.h - pad * 2) * k * sc) });
  return {
    bounds: map({ x: x0, y: y0, w: bw, h: bh }),
    rooms: (rooms.length ? rooms : [{ x: x0, y: y0, w: bw, h: bh }]).slice(0, 4).map(map),
    walls: { v: vWalls.length, h: hWalls.length }
  };
}

/* ---------- ממשק: שלבים ---------- */
const STEPS = ['מקום', 'שימוש', 'תכנית', 'אזורים', 'תקציב', 'הצעות', 'דוח'];
function go(i) { S.step = Math.max(0, Math.min(STEPS.length - 1, i)); save(); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }

function render() {
  $('#steps').innerHTML = STEPS.map((s, i) =>
    `<div class="st ${i === S.step ? 'on' : ''} ${i < S.step ? 'done' : ''}" onclick="go(${i})">${i < S.step ? '✓ ' : ''}${s}</div>`).join('');
  const v = [stepVenue, stepUse, stepPlan, stepZones, stepBudget, stepOffers, stepReport][S.step];
  $('#body').innerHTML = v();
  const after = [null, null, afterPlan, afterZones, null, null, afterReport][S.step];
  if (after) after();
  $('#nav').innerHTML = navHTML();
}
function navHTML() {
  const back = S.step > 0 ? `<button class="ghost" onclick="go(${S.step - 1})">▶ חזרה</button>` : '<span></span>';
  const okNext = [!!S.venue, S.uses.length > 0, !!S.scale, S.zones.length > 0 && S.zones.every(z => z.purpose), true, !!S.tier, true][S.step];
  const label = ['בואו נתחיל ◀', 'המשך ◀', 'המשך ◀', 'המשך לתקציב ◀', 'הצג לי הצעות ◀', 'צור דוח ◀', ''][S.step];
  return back + (label ? `<button class="go" ${okNext ? '' : 'disabled'} onclick="go(${S.step + 1})">${label}</button>` : '');
}

/* שלב 1 — סוג המקום */
function stepVenue() {
  return `<h2>איזה מקום אנחנו מגברים?</h2>
  <p class="sub">נתחיל מהדבר הכי חשוב — מה קורה במקום. לפי זה נדע איזו עוצמה נכונה לכל פינה.</p>
  <div class="cards">${LITE_CATALOG.venues.map(v => `
    <div class="card ${S.venue === v.id ? 'sel' : ''}" onclick="pickVenue('${v.id}')">
      <div class="ic">${v.icon}</div><b>${esc(v.name)}</b><small>${esc(v.desc)}</small></div>`).join('')}</div>
  <label class="fld"><span>איך נקרא לפרויקט?</span>
    <input value="${esc(S.name)}" placeholder="למשל: מסעדת השרון" oninput="S.name=this.value;save()"></label>`;
}
function pickVenue(id) {
  S.venue = id;
  const v = LITE_CATALOG.venues.find(x => x.id === id);
  if (v && !S.uses.length) S.uses = v.spl >= 95 ? ['dance'] : v.spl >= 85 ? ['bar'] : ['bg'];
  save(); render();
}

/* שלב 2 — מה קורה במקום (מכאן נגזרת העוצמה) */
const USES = [
  { id: 'bg',      icon: '🎵', name: 'מוזיקת רקע',        desc: 'שומעים, אבל מדברים בנוח',              spl: 76 },
  { id: 'bar',     icon: '🍸', name: 'אווירת בר',          desc: 'מוזיקה נוכחת, המקום שמח',              spl: 88 },
  { id: 'dj',      icon: '🎧', name: 'DJ בערבים',          desc: 'יש ערבים שהמקום הופך למסיבה',          spl: 100 },
  { id: 'live',    icon: '🎤', name: 'הופעות חיות',        desc: 'זמר, להקה או סט אקוסטי',               spl: 100 },
  { id: 'speech',  icon: '📢', name: 'הכרזות ודיבור',      desc: 'מיקרופון להכרזות — חייב מובנות',        spl: 80 },
  { id: 'tv',      icon: '📺', name: 'מסכים / שידורי ספורט', desc: 'קול מהטלוויזיות בכל המקום',          spl: 82 }
];
function stepUse() {
  const peak = usePeak();
  return `<h2>מה קורה אצלך במקום?</h2>
  <p class="sub">אפשר לסמן כמה דברים. אם יש DJ בערבים — נתכנן מערכת שיודעת גם רקע שקט וגם מסיבה.</p>
  <div class="cards">${USES.map(u => `
    <div class="card ${S.uses.includes(u.id) ? 'sel' : ''}" onclick="toggleUse('${u.id}')">
      <div class="ic">${u.icon}</div><b>${esc(u.name)}</b><small>${esc(u.desc)}</small>
      <span class="pill">${u.spl} dB</span></div>`).join('')}</div>
  ${S.uses.length ? `<div class="note ok"><b>הבנתי.</b> העוצמה המקסימלית שנתכנן היא <b>${peak} dB</b> —
    ${peak >= 98 ? 'רמת מועדון: צריך סאבים ורמקולים שעומדים בעוצמה לאורך זמן.'
      : peak >= 85 ? 'רמת בר: מוזיקה נוכחת בלי לצעוק, עם אפשרות להגביר בסופ״ש.'
      : 'רקע נעים: מערכת מבוזרת שנשמעת אחיד בכל פינה בלי נקודות חזקות.'}</div>` : ''}
  <label class="fld"><span>גובה התקרה (מטרים)</span>
    <input type="number" step="0.1" min="2" max="12" value="${S.ceil}" oninput="S.ceil=+this.value||4;save()"></label>`;
}
function toggleUse(id) { S.uses.includes(id) ? S.uses = S.uses.filter(x => x !== id) : S.uses.push(id); save(); render(); }
function usePeak() { return Math.max(70, ...S.uses.map(id => (USES.find(u => u.id === id) || {}).spl || 0)); }

/* שלב 3 — תכנית: העלאה + זיהוי אוטומטי, או מידות בלבד */
function stepPlan() {
  /* שלב מונחה: שאלה אחת בכל רגע, ופעולה ראשית אחת ברורה */
  if (!S.plan && !S.scale) return `
    <h2>איך נראה החלל?</h2>
    <p class="sub">כדי לחשב כיסוי אמיתי אנחנו צריכים לדעת כמה גדול המקום. שתי דרכים — בחר את מה שיש לך:</p>
    <div class="two">
      <div class="opt hero">
        <div class="ic">🖼</div><b>יש לי תכנית</b>
        <small>צילום, סריקה או קובץ מהאדריכל — הכי מדויק</small>
        <input type="file" accept="image/*" id="planIn" style="display:none" onchange="uploadPlan(this)">
        <button class="go" style="width:100%" onclick="document.getElementById('planIn').click()">📤 העלה תכנית</button>
      </div>
      <div class="opt">
        <div class="ic">📐</div><b>אין לי תכנית</b>
        <small>נבנה חלל לפי מידות שתמדוד</small>
        <div class="row">
          <label class="fld"><span>רוחב (מ׳)</span><input type="number" step="0.1" value="${S.roomW || ''}" oninput="S.roomW=+this.value||null;save()"></label>
          <label class="fld"><span>אורך (מ׳)</span><input type="number" step="0.1" value="${S.roomL || ''}" oninput="S.roomL=+this.value||null;save()"></label>
        </div>
        <button class="ghost" style="width:100%" onclick="buildFromDims()">בנה חלל ◀</button>
      </div>
    </div>`;

  if (S.plan && !S.scale) return `
    <h2>מעולה — עכשיו נדע כמה גדול המקום</h2>
    <p class="sub">בלי זה כל החישוב לא שווה כלום. הדרך המדויקת: לסמן על התכנית מידה שאתה כבר מכיר.</p>
    <div class="guide">
      <div class="gstep ${CAL.pts.length === 0 ? 'now' : 'done'}"><b>1</b><span>לחץ על התכנית בקצה של מידה מוכרת — קיר, דלת, או מידה שכתובה בתכנית</span></div>
      <div class="gstep ${CAL.pts.length === 1 ? 'now' : CAL.pts.length > 1 ? 'done' : ''}"><b>2</b><span>לחץ על הקצה השני</span></div>
      <div class="gstep ${CAL.pts.length === 2 ? 'now' : ''}"><b>3</b><span>הקלד כמה מטרים זה — בחלון שייפתח על התכנית</span></div>
    </div>
    ${planBoxHTML()}
    <details class="fallback"><summary>אין לי מידה מדויקת — אעריך את רוחב התכנית</summary>
      <p class="sub" style="margin:8px 0">בחר את הרוחב הכולל של מה שרואים בתכנית:</p>
      <div class="chips">${[6, 8, 10, 12, 15, 20, 25, 30, 40].map(v => `<button class="chip" onclick="setWidth(${v})">${v} מ׳</button>`).join('')}</div>
      <label class="fld"><span>או מספר מדויק</span><input type="number" step="0.1" placeholder="למשל 23.7" oninput="setWidth(+this.value)"></label>
    </details>`;

  /* מכויל — אישור ברור ומעבר הלאה */
  const wM = (S.planW * S.scale).toFixed(1);
  return `
    <h2>מצוין, החלל מכויל ✓</h2>
    <p class="sub">מכאן נדע בדיוק כמה רמקולים צריך ואיפה. אפשר להמשיך — או לתקן אם המידה לא נראית לך נכונה.</p>
    <div class="okcard">
      <div><b>${wM} מ׳</b><small>רוחב התכנית</small></div>
      <div><b>${(1 / S.scale).toFixed(0)}px</b><small>= מטר אחד</small></div>
    </div>
    <div class="rulerbox">
      <div class="rulerlbl">כך נראים <b>5 מטרים</b> בתכנית שלך — השווה לשולחן או לדלת בתכנית:</div>
      <div class="ruler" style="width:${Math.min(96, (5 / S.scale) / S.planW * 100)}%"><span>5 מ׳</span></div>
      <div class="rulerlbl">שולחן <b>1.5 מ׳</b>:</div>
      <div class="ruler small" style="width:${Math.min(96, (1.5 / S.scale) / S.planW * 100)}%"></div>
    </div>
    ${planBoxHTML()}
    <button class="ghost wide" onclick="recalibrate()">↺ המידה לא נכונה — כייל מחדש</button>`;
}
function planBoxHTML() {
  if (!S.plan) return '';
  return `<div class="planbox"><div id="planWrap" class="planwrap"><img id="planImg" src="${S.plan}"><svg id="planSvg"></svg></div></div>`;
}
function recalibrate() { S.scale = null; CAL.mode = 'two'; CAL.pts = []; save(); render(); toast('סמן שוב 2 נקודות על התכנית'); }
const CAL = { mode: 'two', pts: [] };
const DRAW = { on: false, from: null, cur: null, pts: [] };
function calMode(m) { CAL.mode = m; CAL.pts = []; render(); }
function uploadPlan(inp) {
  const f = inp.files && inp.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    S.plan = r.result; S.zones = []; S.scale = null; S.suggest = null;
    CAL.mode = 'two'; CAL.pts = [];
    save(); render();
    toast('📐 עכשיו סמן על התכנית מידה שאתה מכיר');
  };
  r.readAsDataURL(f);
}
function buildFromDims() {
  if (!(S.roomW > 1 && S.roomL > 1)) { toast('הזן רוחב ואורך במטרים'); return; }
  S.plan = null;
  S.planW = 1200; S.planH = Math.round(1200 * S.roomL / S.roomW);
  S.scale = S.roomW / S.planW;
  S.zones = [{ id: uid(), name: 'כל החלל', purpose: null, spl: usePeak(), x: 40, y: 40, w: S.planW - 80, h: S.planH - 80 }];
  save(); go(3);
}
/* לחיצה על התכנית במצב 2 נקודות */
function planClick(e) {
  if (CAL.mode !== 'two' || S.scale || CAL.pts.length >= 2 || DRAW.on) return;
  const svg = $('#planSvg'), r = svg.getBoundingClientRect();
  CAL.pts.push({ x: (e.clientX - r.left) / r.width * S.planW, y: (e.clientY - r.top) / r.height * (S.planH || 900) });
  render();
}
function applyTwoPoint() {
  const inp = $('#calDist'); let m = parseFloat(inp && inp.value);
  if (!(m > 0)) { toast('הקלד את המרחק'); return; }
  if (m >= 1000) m = m / 1000; else if (m >= 100) m = m / 100;   /* מ״מ / ס״מ → מטרים */
  const px = Math.hypot(CAL.pts[0].x - CAL.pts[1].x, CAL.pts[0].y - CAL.pts[1].y);
  if (px < 5) { toast('הנקודות קרובות מדי — סמן מרחק גדול יותר'); return; }
  S.scale = m / px; save();
  toast('✓ כויל: ' + m.toFixed(2) + ' מ׳ בין הנקודות · רוחב התכנית ' + (S.planW * S.scale).toFixed(1) + ' מ׳');
  render();
}
function setWidth(m) {
  if (!(m > 0.5)) return;
  S.scale = m / S.planW; save();
  render();
}
/* חלון קטן צף על התכנית — נפתח בדיוק ליד הקו שסימנת */
function calPopup() {
  const wrap = $('#planWrap'); if (!wrap) return;
  const old = document.getElementById('calPop'); if (old) old.remove();
  if (S.scale || CAL.mode !== 'two' || CAL.pts.length !== 2) return;
  const svg = $('#planSvg'); if (!svg) return;
  const r = svg.getBoundingClientRect(), wr = wrap.getBoundingClientRect();
  const kx = r.width / S.planW, ky = r.height / (S.planH || 900);
  const mx = (CAL.pts[0].x + CAL.pts[1].x) / 2 * kx + (r.left - wr.left);
  const my = (CAL.pts[0].y + CAL.pts[1].y) / 2 * ky + (r.top - wr.top);
  const pop = document.createElement('div');
  pop.id = 'calPop';
  pop.style.cssText = `position:absolute;left:${Math.max(8, Math.min(Math.max(8, wr.width - 250), mx - 120))}px;top:${Math.max(8, my + 18)}px;z-index:12`;
  pop.innerHTML = `<div class="calpop">
    <button class="calx" onclick="CAL.pts=[];render()">✕</button>
    <b>כמה מטרים בין 2 הנקודות?</b>
    <div class="calrow">
      <input id="calDist" type="number" step="0.01" placeholder="5 או 5000" onkeydown="if(event.key==='Enter')applyTwoPoint()">
      <button class="go sm" onclick="applyTwoPoint()">✓</button>
    </div>
    <small>מטרים (5) · ס״מ (500) · מ״מ (5000) — נזהה לבד</small>
  </div>`;
  wrap.appendChild(pop);
  setTimeout(() => { const i = document.getElementById('calDist'); if (i) i.focus(); }, 30);
}
function startDrawZone(mode) {
  DRAW.on = mode || 'poly'; DRAW.from = null; DRAW.cur = null; DRAW.pts = [];
  render();
  toast(DRAW.on === 'poly' ? '✏️ לחץ על פינות האזור — לחיצה על הנקודה הראשונה סוגרת (או דאבל-קליק)'
    : '▭ גרור על התכנית מפינה לפינה');
}
function finishPoly() {
  if (DRAW.pts.length >= 3) {
    const poly = DRAW.pts.slice();
    const xs = poly.map(p => p.x), ys = poly.map(p => p.y);
    S.zones.push({ id: uid(), name: 'אזור ' + (S.zones.length + 1), purpose: null, spl: usePeak(),
      poly, x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) });
    save();
    toast('✓ האזור סומן — עכשיו בחר מה קורה בו');
  } else toast('צריך לפחות 3 פינות');
  DRAW.on = false; DRAW.pts = []; DRAW.cur = null;
  render();
}
/* ציור אזור: ניקור פינות (מדויק) או גרירת מלבן (מהיר) */
function bindDrawZone() {
  const svg = $('#planSvg'); if (!svg || !DRAW.on) return;
  svg.style.cursor = 'crosshair';
  const toPlan = e => { const r = svg.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * S.planW, y: (e.clientY - r.top) / r.height * (S.planH || 900) }; };
  if (DRAW.on === 'poly') {
    svg.onclick = e => {
      const p = toPlan(e);
      if (DRAW.pts.length >= 3 && Math.hypot(p.x - DRAW.pts[0].x, p.y - DRAW.pts[0].y) < 26) return finishPoly();
      DRAW.pts.push(p); drawPlan();
    };
    svg.ondblclick = () => finishPoly();
    svg.onpointermove = e => { DRAW.cur = toPlan(e); drawPlan(); };
    return;
  }
  svg.onpointerdown = e => {
    DRAW.from = toPlan(e); DRAW.cur = DRAW.from;
    const mv = ev => { DRAW.cur = toPlan(ev); drawPlan(); };
    const up = () => {
      document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up);
      const a = DRAW.from, b = DRAW.cur;
      DRAW.on = false; DRAW.from = DRAW.cur = null;
      if (a && b && Math.abs(b.x - a.x) > 30 && Math.abs(b.y - a.y) > 30) {
        S.zones.push({ id: uid(), name: 'אזור ' + (S.zones.length + 1), purpose: null, spl: usePeak(),
          x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) });
        save(); toast('✓ האזור סומן — עכשיו בחר מה קורה בו');
      } else toast('האזור קטן מדי — נסה שוב');
      render();
    };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    e.preventDefault();
  };
}
function afterPlan() {
  const img = $('#planImg');
  if (!img) return;
  const fit = () => {
    const nat = img.naturalWidth || 1400;
    S.planW = 1400; S.planH = Math.round(1400 * (img.naturalHeight || 900) / nat);
    drawPlan();
    if (!S.zones.length) autoDetect(img);
  };
  if (img.complete) fit(); else img.onload = fit;
}
function autoDetect(img) {
  try {
    const res = analysePlan(img);
    if (!res || !res.rooms.length) return;
    /* הצעות בלבד — המשתמש מחליט מה באמת אזור, ולא מקבל אזור שרירותי */
    S.suggest = res.rooms.slice(0, 4);
    save();
  } catch (e) {}
}
function addSuggested(i) {
  const r = (S.suggest || [])[i]; if (!r) return;
  S.zones.push({ id: uid(), name: 'אזור ' + (S.zones.length + 1), purpose: null, spl: usePeak(),
    x: r.x, y: r.y, w: r.w, h: r.h });
  S.active = S.zones.length - 1;
  save(); render();
  toast('✓ נוסף — עכשיו בחר מה קורה בו');
}
function defaultPurpose() {
  const peak = usePeak();
  return peak >= 95 ? 'dance' : peak >= 85 ? 'bar' : 'seating';
}
function drawPlan() {
  const svg = $('#planSvg'); if (!svg) return;
  const wrap = $('#planWrap'), img = $('#planImg');
  const w = S.planW, h = S.planH || 900;
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  if (img) { img.style.width = '100%'; }
  svg.style.cursor = (CAL.mode === 'two' && CAL.pts.length < 2) ? 'crosshair' : '';
  svg.onclick = planClick;
  let out = '';
  /* נקודות הכיול הידני */
  CAL.pts.forEach((p, i) => {
    out += `<circle cx="${p.x}" cy="${p.y}" r="14" fill="#fff" stroke="#7c5cff" stroke-width="5"/>
      <text x="${p.x}" y="${p.y + 8}" text-anchor="middle" font-size="20" font-weight="800" fill="#7c5cff">${i + 1}</text>`;
  });
  if (CAL.pts.length === 2) {
    const [a, b] = CAL.pts;
    out += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#7c5cff" stroke-width="4" stroke-dasharray="10 7"/>`;
  }
  if (S.scale && CAL.mode !== 'two') {
    const y = Math.round(h * 0.08), bar = 5 / S.scale, bx = w / 2 - bar / 2;
    out += `<line x1="6" y1="${y}" x2="${w - 6}" y2="${y}" stroke="#7c5cff" stroke-width="3" stroke-dasharray="10 7"/>
      <text x="${w / 2}" y="${y - 12}" text-anchor="middle" font-size="26" font-weight="800" fill="#7c5cff">${(w * S.scale).toFixed(1)} מ׳</text>
      <line x1="${bx}" y1="${y + 38}" x2="${bx + bar}" y2="${y + 38}" stroke="#ff6a3d" stroke-width="5"/>
      <text x="${w / 2}" y="${y + 70}" text-anchor="middle" font-size="22" font-weight="800" fill="#ff6a3d">5 מ׳</text>`;
  }
  S.zones.forEach((z, i) => {
    const p = purposeOf(z), b = zoneBox(z);
    out += `<g data-zone="${i}" style="cursor:move">
      <path d="${zonePath(z)}" fill="${p.color}22" stroke="${p.color}" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="${b.x + 30}" cy="${b.y + 30}" r="22" fill="${p.color}"/>
      <text x="${b.x + 30}" y="${b.y + 39}" text-anchor="middle" font-size="26" font-weight="900" fill="#fff">${i + 1}</text>
      <text x="${b.x + 62}" y="${b.y + 39}" font-size="26" font-weight="800" fill="${p.color}">${p.icon} ${esc(z.name)}</text>
      ${S.scale ? `<text x="${b.x + 62}" y="${b.y + 66}" font-size="20" fill="${p.color}">${Math.round(zoneAreaPx(z) * S.scale * S.scale)} מ"ר${z.poly ? ' · ' + z.poly.length + ' פינות' : ' · ' + (b.w * S.scale).toFixed(1) + '×' + (b.h * S.scale).toFixed(1) + ' מ׳'}</text>` : ''}
      </g>
      ${(z.poly || []).map((pt, pi) => `<circle data-pt="${i}|${pi}" cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="11" fill="#fff" stroke="${p.color}" stroke-width="4" style="cursor:grab"/>`).join('')}
      ${z.poly ? '' : `<rect data-rs="${i}" x="${b.x + b.w - 26}" y="${b.y + b.h - 26}" width="26" height="26" rx="6" fill="#fff" stroke="${p.color}" stroke-width="4" style="cursor:nwse-resize"/>`}`;
  });
  if (DRAW.on === 'poly' && DRAW.pts.length) {
    const pts = DRAW.pts;
    out += `<polyline points="${pts.map(p => p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ')}" fill="#7c5cff1a" stroke="#7c5cff" stroke-width="4" stroke-linejoin="round"/>`;
    if (DRAW.cur) out += `<line x1="${pts[pts.length - 1].x}" y1="${pts[pts.length - 1].y}" x2="${DRAW.cur.x}" y2="${DRAW.cur.y}" stroke="#7c5cff" stroke-width="3" stroke-dasharray="9 6" opacity="0.7"/>`;
    pts.forEach((p, i) => out += `<circle cx="${p.x}" cy="${p.y}" r="${i === 0 ? 14 : 9}" fill="${i === 0 ? '#fff' : '#7c5cff'}" stroke="#7c5cff" stroke-width="4"/>`);
    if (pts.length >= 3 && S.scale) {
      let a = 0;
      for (let i = 0; i < pts.length; i++) { const p1 = pts[i], p2 = pts[(i + 1) % pts.length]; a += p1.x * p2.y - p2.x * p1.y; }
      const c = { x: pts.reduce((s2, p) => s2 + p.x, 0) / pts.length, y: pts.reduce((s2, p) => s2 + p.y, 0) / pts.length };
      out += `<text x="${c.x}" y="${c.y}" text-anchor="middle" font-size="26" font-weight="800" fill="#7c5cff">${Math.round(Math.abs(a) / 2 * S.scale * S.scale)} מ"ר · סגור בנקודה הראשונה</text>`;
    }
  }
  if (DRAW.on === 'rect' && DRAW.from && DRAW.cur) {
    const a = DRAW.from, b = DRAW.cur;
    out += `<rect x="${Math.min(a.x, b.x)}" y="${Math.min(a.y, b.y)}" width="${Math.abs(b.x - a.x)}" height="${Math.abs(b.y - a.y)}"
      fill="#7c5cff22" stroke="#7c5cff" stroke-width="4" stroke-dasharray="10 7" rx="8"/>`;
    if (S.scale) out += `<text x="${(a.x + b.x) / 2}" y="${(a.y + b.y) / 2}" text-anchor="middle" font-size="26" font-weight="800" fill="#7c5cff">${(Math.abs(b.x - a.x) * S.scale).toFixed(1)}×${(Math.abs(b.y - a.y) * S.scale).toFixed(1)} מ׳</text>`;
  }
  svg.innerHTML = out;
  bindZoneDrag();
  bindDrawZone();
  calPopup();
}
/* גרירה ושינוי גודל של אזור ישירות על התכנית */
function bindZoneDrag() {
  const svg = $('#planSvg'); if (!svg) return;
  const toPlan = e => { const r = svg.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * S.planW, y: (e.clientY - r.top) / r.height * (S.planH || 900), k: S.planW / r.width }; };
  svg.querySelectorAll('[data-zone]').forEach(g => {
    g.addEventListener('pointerdown', e => {
      if (CAL.mode === 'two' || DRAW.on) return;
      const i = +g.dataset.zone, z = S.zones[i], st = toPlan(e);
      const ox = z.x, oy = z.y, op = (z.poly || []).map(p => ({ x: p.x, y: p.y }));
      e.stopPropagation();
      const mv = ev => {
        const p = toPlan(ev), dx = p.x - st.x, dy = p.y - st.y;
        z.x = Math.max(0, ox + dx); z.y = Math.max(0, oy + dy);
        if (z.poly) z.poly.forEach((pt, k) => { pt.x = op[k].x + dx; pt.y = op[k].y + dy; });
        drawPlan();
      };
      const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); save(); render(); };
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    });
  });
  /* גרירת פינה בודדת של פוליגון — התאמה מדויקת לצורת החדר */
  svg.querySelectorAll('[data-pt]').forEach(h => {
    h.addEventListener('pointerdown', e => {
      if (DRAW.on) return;
      const [zi, pi] = h.dataset.pt.split('|').map(Number);
      const z = S.zones[zi], pt = z.poly[pi], st = toPlan(e), ox = pt.x, oy = pt.y;
      e.stopPropagation();
      const mv = ev => {
        const p = toPlan(ev); pt.x = ox + p.x - st.x; pt.y = oy + p.y - st.y;
        const b = zoneBox(z); z.x = b.x; z.y = b.y; z.w = b.w; z.h = b.h;
        drawPlan();
      };
      const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); save(); render(); };
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    });
  });
  svg.querySelectorAll('[data-rs]').forEach(h => {
    h.addEventListener('pointerdown', e => {
      const i = +h.dataset.rs, z = S.zones[i], st = toPlan(e), ow = z.w, oh = z.h;
      e.stopPropagation();
      const mv = ev => { const p = toPlan(ev); z.w = Math.max(60, ow + p.x - st.x); z.h = Math.max(60, oh + p.y - st.y); drawPlan(); };
      const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); save(); render(); };
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    });
  });
}
function purposeOf(z) {
  const P2 = LITE_CATALOG.zonePurposes.find(p => p.id === z.purpose)
    || { id: 'new', name: 'טרם הוגדר', icon: '📍', spl: usePeak(), desc: '' };
  const colors = { seating: '#2e9e6b', bar: '#e0851b', dance: '#d33d6b', stage: '#7c5cff', entry: '#4a8fd6', outdoor: '#12a5a5', toilets: '#8a8377', new: '#7c5cff' };
  return { ...P2, color: colors[P2.id] || '#666' };
}

/* שלב 4 — אזורים ומה עושים בכל אחד */
function stepZones() {
  const zs = S.zones;
  /* ריק — מסביר מה זה אזור, ומציע פעולה ראשית אחת */
  if (!zs.length) return `
    <h2>איפה צריך מוזיקה?</h2>
    <p class="sub">נסמן את השטח שבו אנשים ישמעו מוזיקה. אם יש כמה חלקים עם אופי שונה — נסמן כל אחד בנפרד,
    וכל אחד יקבל עוצמה משלו (ישיבה שקטה, רחבה חזקה).</p>
    ${planBoxHTML()}
    <div class="emptyzone">
      <div class="ic">📍</div>
      <b>נתחיל מהאזור הראשון</b>
      <small>לחץ, ואז נקר על התכנית את פינות השטח שבו צריך מוזיקה</small>
      <button class="go wide" onclick="startDrawZone('poly')">✏️ סמן אזור על התכנית</button>
      <div class="row" style="margin-top:8px">
        <button class="ghost" style="flex:1" onclick="startDrawZone('rect')">▭ מלבן מהיר</button>
        <button class="ghost" style="flex:1" onclick="addZone()">➕ כל החלל</button>
      </div>
      ${(S.suggest || []).length ? `<div class="sugg"><b>🤖 זיהינו ${S.suggest.length} חללים בתכנית:</b>
        ${S.suggest.map((r, i) => `<button class="chip" onclick="addSuggested(${i})">חלל ${i + 1}${S.scale ? ' · ' + Math.round(r.w * r.h * S.scale * S.scale) + ' מ"ר' : ''}</button>`).join('')}
        <small>לא חייבים — אפשר לסמן ידנית וזה יהיה מדויק יותר</small></div>` : ''}
    </div>
    ${DRAW.on ? drawHint() : ''}`;

  /* יש אזור שעדיין לא ענו עליו — שואלים את השאלה האחת החשובה, גדול וברור */
  const pending = zs.findIndex(z => !z.purpose);
  if (pending >= 0) {
    const z = zs[pending];
    return `
    <h2>מה קורה ב"${esc(z.name)}"?</h2>
    <p class="sub">זה קובע כמה חזק המקום הזה ינגן — וכמה רמקולים צריך בו.</p>
    ${planBoxHTML()}
    <div class="cards">${LITE_CATALOG.zonePurposes.map(q => `
      <div class="card" onclick="setPurpose(${pending},'${q.id}')">
        <div class="ic">${q.icon}</div><b>${esc(q.name)}</b><small>${esc(q.desc)}</small>
        <span class="pill">${q.spl} dB</span></div>`).join('')}</div>
    <button class="ghost wide" onclick="delZone(${pending})">✕ מחק את האזור הזה</button>`;
  }

  /* כל האזורים מוגדרים — סיכום ברור + שאלה אחת: עוד אזור או ממשיכים */
  return `
  <h2>${zs.length === 1 ? 'האזור מוגדר ✓' : zs.length + ' אזורים מוגדרים ✓'}</h2>
  <p class="sub">אפשר לגרור אזור על התכנית או לגרור פינה כדי לדייק. כל אזור מקבל שליטת עוצמה נפרדת.</p>
  ${planBoxHTML()}
  ${DRAW.on ? drawHint() : ''}
  <div class="zlist">${zs.map((z, i) => {
    const p = purposeOf(z), pl = S.scale ? planZone(z, LITE_CATALOG.tiers[1], S.ceil, S.scale) : null;
    return `<div class="zcard" style="border-right:6px solid ${p.color}">
      <div class="zhead"><span class="znum" style="background:${p.color}">${i + 1}</span>
        <input value="${esc(z.name)}" oninput="S.zones[${i}].name=this.value;save();drawPlan()">
        <button class="ghost sm" onclick="delZone(${i})">✕</button></div>
      <div class="zsum">
        <span class="ztag" style="background:${p.color}1a;color:${p.color}">${p.icon} ${esc(p.name)} · ${z.spl} dB</span>
        ${S.scale ? `<span>${Math.round(zoneAreaPx(z) * S.scale * S.scale)} מ"ר</span>` : ''}
        ${pl ? `<span>🔈 ${pl.n} רמקולים${pl.subs ? ' + ' + pl.subs + ' סאב' : ''}</span>` : ''}
      </div>
      <button class="ghost sm" onclick="S.zones[${i}].purpose=null;save();render()">↺ שנה מה קורה כאן</button>
    </div>`;
  }).join('')}</div>
  <div class="content-q">
    <b>🎚 מה מתנגן בכל אזור?</b>
    <div class="chips">
      <button class="chip ${S.sameContent !== false ? 'on' : ''}" onclick="S.sameContent=true;save();render()">אותה מוזיקה בכל המקום</button>
      <button class="chip ${S.sameContent === false ? 'on' : ''}" onclick="S.sameContent=false;save();render()">תוכן שונה בכל אזור</button>
    </div>
    <small>${S.sameContent === false
      ? 'נוסיף מעבד שמנתב מקורות שונים לכל אזור — שליטה מלאה, עלות נוספת.'
      : 'מקור אחד לכל המקום, עם ויסות עוצמה נפרד לכל אזור — הפתרון הנפוץ והחסכוני.'}</small>
  </div>
  <div class="row">
    <button class="ghost" style="flex:2" onclick="startDrawZone('poly')">➕ יש עוד אזור עם אופי אחר</button>
    <button class="ghost" style="flex:1" onclick="S._why=!S._why;save();render()">${S._why ? '▲' : '❓'} למה לחלק</button>
  </div>
  ${S._why ? `<div class="note"><b>כי אנשים לא רוצים את אותה עוצמה בכל מקום.</b><br>
    • באזור ישיבה מוזיקה חזקה מדי גורמת לאנשים לצעוק — ולעזוב מוקדם.<br>
    • ברחבה מוזיקה חלשה מדי הורגת את האנרגיה.<br>
    • חלוקה מאפשרת להנמיך בישיבה בלי לגעת ברחבה.</div>` : ''}`;
}
function drawHint() {
  return DRAW.on === 'poly'
    ? `<div class="note">✏️ <b>נקר את פינות האזור</b> — לחיצה על כל פינה, ולסיום לחיצה על הנקודה הראשונה (או דאבל-קליק).
        ${DRAW.pts.length ? '<b>' + DRAW.pts.length + ' פינות סומנו.</b> ' : ''}Esc לביטול.</div>`
    : '<div class="note">▭ גרור על התכנית מפינה לפינה. Esc לביטול.</div>';
}
function afterZones() {
  const img = $('#planImg');
  if (img) { img.complete ? drawPlan() : img.onload = () => drawPlan(); } else drawPlan();
}
function setPurpose(i, pid) {
  const p = LITE_CATALOG.zonePurposes.find(x => x.id === pid);
  S.zones[i].purpose = pid;
  S.layout = {};   /* הפריסה תחושב מחדש לפי האופי החדש */
  /* העוצמה נגזרת מהשימוש — אבל לא פחות ממה שהמקום דורש בשיא */
  S.zones[i].spl = pid === 'dance' || pid === 'stage' ? Math.max(p.spl, usePeak()) : p.spl;
  save(); render();
}
function setZoneM(i, k, m) { if (m > 0.5 && S.scale) { S.zones[i][k] = m / S.scale; save(); drawPlan(); } }
function addZone() {
  const n = S.zones.length;
  S.zones.push({ id: uid(), name: n ? 'אזור ' + (n + 1) : 'כל החלל', purpose: null, spl: usePeak(),
    x: 60 + n * 40, y: 120 + n * 40, w: Math.round((S.planW || 1200) * 0.35), h: Math.round((S.planH || 800) * 0.35) });
  save(); render();
}
function delZone(i) { S.zones.splice(i, 1); save(); render(); }

/* שלב 5 — תקציב */
function stepBudget() {
  const props = LITE_CATALOG.tiers.map(buildProposal);
  const lo = Math.min(...props.map(p => p.total)), hi = Math.max(...props.map(p => p.total));
  if (S.budget == null) S.budget = Math.round(props[1].total / 1000) * 1000;
  return `<h2>מה התקציב שלך?</h2>
  <p class="sub">נראה לך מה אפשר לקבל בכל טווח. המחירים לפני מע"מ וכוללים ציוד, כבילה והתקנה.</p>
  <div class="budget">
    <div class="bignum">${ils(S.budget)}</div>
    <input type="range" min="${Math.floor(lo * 0.6 / 1000) * 1000}" max="${Math.ceil(hi * 1.4 / 1000) * 1000}" step="1000" value="${S.budget}" oninput="S.budget=+this.value;save();render()">
    <div class="brange"><span>${ils(lo * 0.6)}</span><span>${ils(hi * 1.4)}</span></div>
  </div>
  <div class="fit">${props.map(p => {
    const fits = p.total <= S.budget * 1.05;
    return `<div class="fitrow ${fits ? 'ok' : 'over'}">
      <b>${esc(p.tier.name)}</b><span>${esc(p.tier.brand)}</span>
      <span class="amt">${ils(p.total)}</span>
      <span class="badge">${fits ? '✓ בתקציב' : 'מעל התקציב ב-' + ils(p.total - S.budget)}</span></div>`;
  }).join('')}</div>
  <div class="note">💡 אפשר להמשיך גם אם משהו מעל התקציב — בשלב הבא נראה בדיוק מה ההבדל בין האפשרויות.</div>`;
}

/* שלב 6 — שלוש ההצעות */
function stepOffers() {
  const props = LITE_CATALOG.tiers.map(buildProposal);
  return `<h2>שלוש דרכים לעשות את זה</h2>
  <p class="sub">אותה תכנית, אותו כיסוי — שלוש רמות ציוד. כל המחירים הם מחירי יחידה מהמלאי שלנו, לפני מע"מ.</p>
  <div class="offers">${props.map((p, i) => {
    const fits = S.budget ? p.total <= S.budget * 1.05 : true;
    const spl = p.zones.length ? Math.round(p.zones.reduce((s, z) => s + z.p.splCenter, 0) / p.zones.length) : 0;
    return `<div class="offer ${S.tier === p.tier.id ? 'sel' : ''} ${i === 1 ? 'reco' : ''}">
      ${i === 1 ? '<div class="ribbon">הכי נבחר</div>' : ''}
      <div class="oh"><b>${esc(p.tier.name)}</b><small>${esc(p.tier.brand)}</small></div>
      <div class="price">${ils(p.total)}<small>כולל ציוד + התקנה, לפני מע"מ</small></div>
      <p class="why">${esc(p.tier.why)}</p>
      <div class="specs">
        <div><b>${p.totalSpk}</b><small>רמקולים</small></div>
        <div><b>${p.totalSub ? p.totalSub + '×' + p.sub.inch + '"' : '—'}</b><small>סאבים</small></div>
        <div><b>${spl}</b><small>dB יכולת</small></div>
      </div>
      <div class="ampline">🎚 ${p.ampN}× ${esc(p.amp.name.slice(0, 26))} · ${p.perCh} רמקולים לערוץ · ניצול ${p.util}%
        <br><b style="color:${p.pwrOk ? '#0f6e56' : '#c1121f'}">×${p.pwrRatio} הספק מגבר מול הרמקולים</b> — היעד ×2, מרווח לפסגות בלי קליפ
        ${p.ampFromKit ? '<br>✓ שילוב מוכח — מופיע יחד בקיטים שלנו' : ''}</div>
      <div class="prods">${prodCards(p)}</div>
      <div class="badges">${fits ? '<span class="b ok">✓ בתקציב</span>' : '<span class="b over">מעל התקציב</span>'}
        <span class="b">${p.days} ימי התקנה</span>
        <span class="b">${stockNote(p)}</span></div>
      <button class="go wide" onclick="pickTier('${p.tier.id}')">${S.tier === p.tier.id ? '✓ נבחר' : 'בחר את זה'}</button>
    </div>`;
  }).join('')}</div>`;
}
function prodCards(p) {
  const main = p.rows.filter(r => r.note === 'רמקולים' || r.note === 'סאבים' || r.note === 'הגברה').slice(0, 4);
  return main.map(r => {
    const im = imgOf(r.key);
    return `<div class="prod">
      ${im ? `<img src="${esc(im)}" alt="">` : '<div class="noimg">🔊</div>'}
      <div><b>${esc(r.name)}</b><small>${r.qty} יח׳ × ${ils(r.price)}</small></div></div>`;
  }).join('');
}
function stockNote(p) {
  const short = p.rows.filter(r => { const st = stockOf(r.key); return st != null && st < r.qty; });
  return short.length ? '⏳ ' + short.length + ' פריטים בהזמנה' : '📦 הכל במלאי';
}
function pickTier(id) { S.tier = id; save(); render(); go(6); }

/* ---------- שלב 7 — הדוח ---------- */
/* מיקומי הרמקולים בפועל: פריסה שווה סביב היקף האזור, מכוונים פנימה */
/* ---------- גאומטריית אזור: מלבן או פוליגון חופשי (כמו באפליקציה המקצועית) ---------- */
function zoneBox(z) {
  if (!z.poly || z.poly.length < 3) return { x: z.x, y: z.y, w: z.w, h: z.h };
  const xs = z.poly.map(p => p.x), ys = z.poly.map(p => p.y);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(1, Math.max(...xs) - x), h: Math.max(1, Math.max(...ys) - y) };
}
/* שטח אמיתי — נוסחת השרוכים לפוליגון, מלבן פשוט אחרת */
function zoneAreaPx(z) {
  if (!z.poly || z.poly.length < 3) return z.w * z.h;
  let a = 0;
  for (let i = 0; i < z.poly.length; i++) {
    const p1 = z.poly[i], p2 = z.poly[(i + 1) % z.poly.length];
    a += p1.x * p2.y - p2.x * p1.y;
  }
  return Math.abs(a) / 2;
}
function zonePerimPx(z) {
  if (!z.poly || z.poly.length < 3) return 2 * (z.w + z.h);
  let l = 0;
  for (let i = 0; i < z.poly.length; i++) {
    const p1 = z.poly[i], p2 = z.poly[(i + 1) % z.poly.length];
    l += Math.hypot(p2.x - p1.x, p2.y - p1.y);
  }
  return l;
}
function zoneCenter(z) {
  if (!z.poly || z.poly.length < 3) { return { x: z.x + z.w / 2, y: z.y + z.h / 2 }; }
  return { x: z.poly.reduce((s2, p) => s2 + p.x, 0) / z.poly.length, y: z.poly.reduce((s2, p) => s2 + p.y, 0) / z.poly.length };
}
function zonePath(z) {
  if (!z.poly || z.poly.length < 3) return `M${z.x} ${z.y} H${z.x + z.w} V${z.y + z.h} H${z.x} Z`;
  return 'M' + z.poly.map(p => p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' L') + ' Z';
}
/* מיקומי הרמקולים נשמרים ברגע שההצעה נבחרת — ומאותו רגע ניתנים לגרירה ידנית */
function layoutKey(z, n, subs) { return z.id + '|' + n + '|' + subs; }
function ensureLayout(prop) {
  S.layout = S.layout || {};
  prop.zones.forEach(({ z, p }) => {
    const k = layoutKey(z, p.n, p.subs);
    if (!S.layout[z.id] || S.layout[z.id].key !== k) {
      S.layout[z.id] = { key: k, spk: speakerPts(z, p.n), subs: subPts(z, p.subs) };
    }
  });
  Object.keys(S.layout).forEach(id => { if (!prop.zones.some(x => x.z.id === id)) delete S.layout[id]; });
  save();
  return S.layout;
}
function subPts(z, n) {
  const b = zoneBox(z), out = [];
  for (let i = 0; i < n; i++) out.push({ x: b.x + b.w * (i + 1) / (n + 1), y: b.y + b.h - 26 });
  return out;
}
function resetLayout() { S.layout = {}; save(); render(); toast('↺ המיקומים חזרו לפריסה האוטומטית'); }
function speakerPts(z, n) {
  const c = zoneCenter(z), pts = [];
  if (z.poly && z.poly.length >= 3) {
    /* פריסה שווה לאורך היקף הפוליגון, כל רמקול מוסט מעט פנימה אל המרכז */
    const per = zonePerimPx(z), step = per / n;
    let target = step / 2, walked = 0, i = 0;
    for (let k = 0; k < n; k++) {
      while (i < z.poly.length) {
        const p1 = z.poly[i], p2 = z.poly[(i + 1) % z.poly.length];
        const seg = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        if (walked + seg >= target || i === z.poly.length - 1) {
          const t = Math.max(0, Math.min(1, (target - walked) / (seg || 1)));
          const x = p1.x + (p2.x - p1.x) * t, y = p1.y + (p2.y - p1.y) * t;
          const dx = c.x - x, dy = c.y - y, d = Math.hypot(dx, dy) || 1;
          pts.push({ x: x + dx / d * Math.min(18, d * 0.06), y: y + dy / d * Math.min(18, d * 0.06),
            aim: Math.round((Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360) });
          break;
        }
        walked += seg; i++;
      }
      target += step;
    }
    while (pts.length < n) pts.push({ x: c.x, y: c.y, aim: 0 });
    return pts;
  }
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2 + Math.PI / n;
    const dx = Math.cos(a), dy = Math.sin(a);
    const t = Math.min(Math.abs((z.w / 2) / (dx || 1e-6)), Math.abs((z.h / 2) / (dy || 1e-6)));
    pts.push({ x: c.x + dx * t * 0.94, y: c.y + dy * t * 0.94, aim: Math.round((Math.atan2(-dy, -dx) * 180 / Math.PI + 360) % 360) });
  }
  return pts;
}
/* מפת כיסוי: רשת נקודות עם סכימת אנרגיה מכל הרמקולים */
function coverageSVG(prop, w, h) {
  const step = Math.max(18, Math.round(w / 46));
  let out = '', min = 999, max = 0;
  const spk = [];
  const L = S.layout || {};
  prop.zones.forEach(({ z, p }) => ((L[z.id] && L[z.id].spk) || speakerPts(z, p.n)).forEach(pt => spk.push({ pt, p })));
  if (!spk.length || !S.scale) return { svg: '', min: 0, max: 0 };
  const cells = [];
  for (let y = step / 2; y < h; y += step) for (let x = step / 2; x < w; x += step) {
    let e = 0;
    for (const { pt, p } of spk) {
      const r = Math.hypot(x - pt.x, y - pt.y) * S.scale;
      e += Math.pow(10, splAt(p.spk, p.wPer, Math.max(1, r)) / 10);
    }
    const db = 10 * Math.log10(Math.max(1e-9, e));
    cells.push({ x, y, db });
    if (db < min) min = db; if (db > max) max = db;
  }
  const lo = Math.max(55, min), hi = Math.max(lo + 6, max);
  cells.forEach(c => {
    const t = Math.max(0, Math.min(1, (c.db - lo) / (hi - lo)));
    const col = t < .5 ? `rgb(${Math.round(60 + t * 2 * 60)},${Math.round(130 + t * 2 * 90)},235)` : `rgb(${Math.round(240)},${Math.round(220 - (t - .5) * 2 * 150)},${Math.round(90 - (t - .5) * 2 * 80)})`;
    out += `<rect x="${(c.x - step / 2).toFixed(1)}" y="${(c.y - step / 2).toFixed(1)}" width="${step}" height="${step}" fill="${col}" opacity="0.5"/>`;
  });
  return { svg: out, min: Math.round(lo), max: Math.round(hi) };
}
function stepReport() {
  const tier = LITE_CATALOG.tiers.find(t => t.id === S.tier) || LITE_CATALOG.tiers[1];
  const p = buildProposal(tier);
  const w = S.planW, h = S.planH || 900;
  const cov = coverageSVG(p, w, h);
  const L = ensureLayout(p);
  const rk = rackPoint();
  const sched = cableSchedule(p);
  let marks = '';
  /* קווי החיווט בפועל — מהארון אל כל רמקול, ממוספרים בדיוק כמו בטבלה */
  let li = 0;
  p.zones.forEach(({ z }) => {
    const col = purposeOf(z).color;
    [...(L[z.id].spk || []), ...(L[z.id].subs || [])].forEach(pt => {
      const row = sched[li++]; if (!row) return;
      const mx = (rk.x + pt.x) / 2, my = (rk.y + pt.y) / 2;
      marks += `<line x1="${rk.x.toFixed(0)}" y1="${rk.y.toFixed(0)}" x2="${pt.x.toFixed(0)}" y2="${pt.y.toFixed(0)}"
          stroke="${col}" stroke-width="2.5" opacity="0.55" stroke-dasharray="7 5"/>
        <g><circle cx="${mx.toFixed(0)}" cy="${my.toFixed(0)}" r="13" fill="#fff" stroke="${col}" stroke-width="2.5" opacity="0.95"/>
          <text x="${mx.toFixed(0)}" y="${(my + 5).toFixed(0)}" text-anchor="middle" font-size="15" font-weight="800" fill="${col}">${row.id}</text></g>`;
    });
  });
  /* ארון הציוד */
  marks += `<g><rect x="${(rk.x - 26).toFixed(0)}" y="${(rk.y - 22).toFixed(0)}" width="52" height="44" rx="8" fill="#141821" stroke="#fff" stroke-width="3"/>
    <text x="${rk.x.toFixed(0)}" y="${(rk.y + 7).toFixed(0)}" text-anchor="middle" font-size="17" font-weight="800" fill="#fff">ארון</text></g>`;
  p.zones.forEach(({ z, p: pz }) => {
    const col = purposeOf(z).color;
    const zb = zoneBox(z);
    marks += `<path d="${zonePath(z)}" fill="none" stroke="${col}" stroke-width="3" stroke-dasharray="9 6" stroke-linejoin="round"/>
      <text x="${zb.x + 12}" y="${zb.y + 32}" font-size="24" font-weight="800" fill="${col}">${purposeOf(z).icon} ${esc(z.name)} · ${pz.n} רמקולים</text>`;
    (L[z.id].spk || []).forEach((pt, i) => {
      marks += `<g data-sp="${z.id}|${i}" style="cursor:grab"><circle cx="${pt.x.toFixed(0)}" cy="${pt.y.toFixed(0)}" r="17" fill="#fff" stroke="${col}" stroke-width="4"/>
        <text x="${pt.x.toFixed(0)}" y="${(pt.y + 7).toFixed(0)}" text-anchor="middle" font-size="18" font-weight="800" fill="${col}">${i + 1}</text></g>`;
    });
    (L[z.id].subs || []).forEach((pt, i) => {
      marks += `<g data-sub="${z.id}|${i}" style="cursor:grab"><rect x="${(pt.x - 20).toFixed(0)}" y="${(pt.y - 16).toFixed(0)}" width="40" height="32" rx="6" fill="#fff" stroke="${col}" stroke-width="4"/>
        <text x="${pt.x.toFixed(0)}" y="${(pt.y + 7).toFixed(0)}" text-anchor="middle" font-size="17" font-weight="800" fill="${col}">SUB</text></g>`;
    });
  });
  const groups = {};
  p.rows.forEach(r => (groups[r.note] = groups[r.note] || []).push(r));
  return `<div id="report">
  <div class="rhead">
    <div><h1>${esc(S.name || 'הפרויקט שלי')}</h1>
      <p>${esc((LITE_CATALOG.venues.find(v => v.id === S.venue) || {}).name || '')} · ${S.zones.length} אזורים ·
      ${Math.round(S.zones.reduce((s, z) => s + z.w * z.h * (S.scale || 0) ** 2, 0))} מ"ר · תקרה ${S.ceil} מ׳</p></div>
    <div class="rlogo">KO</div>
  </div>
  <div class="rsec"><h3>📍 פריסת הרמקולים והכיסוי בחלל <span class="editable">✎ אפשר לגרור כל רמקול</span></h3>
    <div class="planbox report"><div class="planwrap">
      ${S.plan ? `<img src="${S.plan}" style="width:100%">` : ''}
      <svg viewBox="0 0 ${w} ${h}" style="${S.plan ? '' : 'position:relative;background:#f7f5f0;border-radius:10px;display:block;width:100%;height:auto;aspect-ratio:' + (w / h).toFixed(3)}">${cov.svg}${marks}</svg>
    </div></div>
    <div class="legend"><span class="lg cold"></span>${cov.min} dB<span class="lg warm"></span>${cov.max} dB
      <span class="lgnote">עיגול ממוספר = רמקול · הריבוע השחור = ארון הציוד · הקו המקווקו = מסלול הכבל,
      והמספר עליו הוא מספר הקו בטבלת החיווט למטה.</span></div>
  </div>
  <div class="rsec"><h3>🔊 מה מקבלים בכל אזור</h3>
    <table class="rt"><tr><th>אזור</th><th>שימוש</th><th>שטח</th><th>רמקולים</th><th>עוצמת יעד</th><th>יכולת המערכת</th><th>מרווח</th></tr>
    ${p.zones.map(({ z, p: pz }) => `<tr><td><b>${esc(z.name)}</b></td><td>${purposeOf(z).icon} ${esc(purposeOf(z).name)}</td>
      <td>${Math.round(pz.area)} מ"ר</td><td>${pz.n}${pz.subs ? ' + ' + pz.subs + ' סאב' : ''}</td>
      <td>${z.spl} dB</td><td class="${pz.ok ? 'good' : 'warn'}">${Math.round(pz.capability)} dB ${pz.ok ? '✓' : '⚠'}</td>
      <td>${pz.headroom > 0 ? '+' + Math.round(pz.headroom) + ' dB' : '—'}</td></tr>`).join('')}</table>
    <p class="sub" style="margin-top:6px">"מרווח" = כמה עוד יש למערכת מעבר לעוצמה שביקשת. מרווח בריא (10 dB ומעלה) אומר
    שהמערכת מנגנת רגוע, בלי עיוות ובלי להתאמץ — וזה מה שמאריך את חיי הציוד ושומר על צליל נקי.</p>
  </div>
  <div class="rsec"><h3>🧾 הציוד — ${esc(tier.name)} (${esc(tier.brand)})</h3>
    ${Object.entries(groups).map(([g, rows]) => `<h4>${esc(g)}</h4>
      <table class="rt"><tr><th>פריט</th><th>מק"ט</th><th>כמות</th><th>מחיר יחידה</th><th>סה"כ</th></tr>
      ${rows.map(r => `<tr><td>${esc(r.name)}</td><td class="sku">${esc(r.key)}</td><td>${r.qty}</td><td>${ils(r.price)}</td><td><b>${ils(r.total)}</b></td></tr>`).join('')}</table>`).join('')}
    <h4>התקנה — מתומחר לפי פריט</h4>
    <table class="rt"><tr><th>פעולה</th><th>יח׳</th><th>כמות</th><th>מחיר ליח׳</th><th>סה"כ</th></tr>
      ${p.inst.map(r => `<tr><td>${esc(r.label)}</td><td>${esc(r.unit)}</td><td>${r.qty}</td><td>${ils(r.price)}</td><td><b>${ils(r.total)}</b></td></tr>`).join('')}</table>
    <table class="rt sum"><tr><td>ציוד</td><td>${ils(p.equip)}</td></tr>
      <tr><td>התקנה (${p.inst.reduce((s2, r) => s2 + r.qty, 0)} פעולות · כ-${p.days} ימי עבודה)</td><td>${ils(p.install)}</td></tr>
      <tr class="tot"><td>סה"כ לפני מע"מ</td><td>${ils(p.total)}</td></tr>
      <tr><td>כולל מע"מ 18%</td><td>${ils(p.total * 1.18)}</td></tr></table>
  </div>
  ${wiringSection(p)}
  <div class="rsec"><h3>⚡ מה צריך להכין — לחשמלאי ולאדריכל</h3>
    <ul class="todo">
      <li><b>נקודת חשמל</b> בארון הציוד: שקע 16A ייעודי ליד ${esc(S.zones[0] ? S.zones[0].name : 'האזור הראשי')}.</li>
      <li><b>ארון ציוד ${LITE_CATALOG.accessories.rack.name.replace('ארון תקשורת ', '')}</b> במקום מאוורר ונגיש — עומק 60 ס"מ.</li>
      <li><b>צנרת/שרוול 25 מ"מ</b> מהארון לכל עמדת רמקול — סה"כ כ-${p.meters} מ׳ כבל רמקול.</li>
      <li><b>גובה התקנה</b> ${(S.ceil - 0.4).toFixed(1)} מ׳ (או צמוד לתקרה), הרמקול מכוון פנימה ומטה.</li>
      <li><b>${p.totalSpk} נקודות תלייה</b> על קיר/תקרה — מתקנים כלולים בהצעה.</li>
      ${p.totalSub ? `<li><b>${p.totalSub} סאבים</b> על הרצפה בפינות — לא לחסום בריהוט.</li>` : ''}
    </ul>
  </div>
  <div class="ract">
    <button class="go" onclick="window.print()">🖨 הדפס / שמור PDF</button>
    <button class="ghost" onclick="shareReport()">📲 שתף</button>
    <button class="ghost" onclick="resetLayout()">↺ אפס פריסה</button>
    <button class="ghost" onclick="go(5)">▶ חזרה להצעות</button>
  </div></div>`;
}
/* ---------- דוח חיווט מלא — ההמשך הטכני של הצעת המחיר ---------- */
/* מיקום הארון: בפינה של האזור הראשון, מקום נגיש ומאוורר */
function rackPoint() {
  const z = S.zones[0];
  if (!z) return { x: 60, y: 60 };
  const b = zoneBox(z);
  return { x: b.x + 24, y: b.y + b.h - 24 };
}
/* לוח משיכת כבלים: קו לכל רמקול/סאב עם אורך אמיתי + רזרבה */
function cableSchedule(p) {
  const rk = rackPoint(), sc = S.scale || 0.02, rows = [];
  const L = ensureLayout(p);
  S.wireEdits = S.wireEdits || {};
  let n = 1;
  const mk = (z, key, dest, pt, note) => {
    const run = Math.hypot(pt.x - rk.x, pt.y - rk.y) * sc;
    const auto = Math.ceil(run * 1.25 + 3);            /* +25% מסלול אמיתי + 3 מ׳ שירות */
    const e = S.wireEdits[key] || {};
    rows.push({ id: n++, key, zone: z.name, dest: e.dest || dest,
      type: e.type || 'כבל רמקול 2×2.5 מ"מ', conn: e.conn || 'ספיקון NL4 ↔ ספיקון NL4',
      len: e.len != null ? e.len : auto, auto, edited: e.len != null && e.len !== auto, note: e.note || note });
  };
  p.zones.forEach(({ z, p: pz }) => {
    (L[z.id].spk || []).forEach((pt, i) => mk(z, z.id + '|s' + i, 'רמקול ' + (i + 1), pt, 'מהארון אל הרמקול'));
    (L[z.id].subs || []).forEach((pt, i) => mk(z, z.id + '|b' + i, 'סאב ' + (i + 1), pt, 'קו נפרד — לא בשרשור'));
  });
  return rows;
}
function editWire(key, field, val) {
  S.wireEdits = S.wireEdits || {};
  const e = S.wireEdits[key] = S.wireEdits[key] || {};
  if (field === 'len') e.len = Math.max(1, +val || 0); else e[field] = val;
  save(); render();
}
function resetWires() { S.wireEdits = {}; save(); render(); toast('↺ אורכי הכבלים חזרו לחישוב האוטומטי'); }
function wiringSection(p) {
  const rows = cableSchedule(p);
  const totalM = rows.reduce((s2, r) => s2 + r.len, 0);
  const reels = Math.ceil(totalM / 100);
  const ampW = p.ampN * 900;                    /* צריכת שיא משוערת למגבר */
  const amps16 = Math.max(1, Math.ceil(ampW / 2300));
  const rackU = Math.max(6, p.ampN * 2 + 4);
  return `<div class="rsec"><h3>🔌 דוח חיווט — כל מה שהחשמלאי צריך</h3>
    <div class="wsec"><h5>לפני הכול — מה זה בכלל</h5>
      <p><b>קו רמקול</b> = כבל דו-גידי שמחבר מגבר לרמקול (לא כבל חשמל!). <b>ספיקון (Speakon)</b> = המחבר התקני,
      ננעל בסיבוב ולא נשלף בטעות. <b>ארון הציוד</b> = הארון שבו יושבים המגברים והמעבד.
      <b>שרוול/צנרת</b> = הצינור שבתוכו עוברים הכבלים בקיר או בתקרה.</p></div>
    <div class="wsec"><h5>נקודת המוצא — ארון הציוד</h5>
      <p>ארון <b>${rackU}U</b> (${rackU * 4.5} ס"מ גובה), עומק 60 ס"מ, במקום מאוורר ונגיש לשירות.
      כל הכבלים יוצאים ממנו. מומלץ במחסן/חדר שירות ולא באזור הקהל.</p></div>
    <div class="wsec"><h5>חשמל</h5>
      <p>• <b>${amps16}× מעגל 16A ייעודי</b> לארון (לא משותף עם תאורה או מטבח — רעש חשמלי פוגע בצליל).<br>
      • צריכת שיא מוערכת: <b>${ampW}W</b> · פס שקעים בארון.<br>
      • הארקה תקנית לארון — חובה.<br>
      • רצוי מפסק ייעודי מסומן "מערכת סאונד".</p></div>
    <div class="wsec"><h5>תשתית לצנרת</h5>
      <p>• שרוול <b>25 מ"מ</b> מהארון לכל עמדת רמקול (או תעלה משותפת + הסתעפויות).<br>
      • להימנע ממקבילות צמודות לכבלי חשמל — לפחות 30 ס"מ הפרדה או חצייה ב-90°.<br>
      • סה"כ כבל רמקול: <b>${totalM} מ׳</b> (${reels} גלילים של 100 מ׳) — כולל רזרבה של 25%.<br>
      • נקודת רמקול בגובה <b>${(S.ceil - 0.4).toFixed(1)} מ׳</b>, קופסה שקועה או יציאת כבל מהקיר.</p></div>
    <h4>לוח משיכת כבלים — קו אחר קו <span class="editable">✎ ניתן לעריכה</span></h4>
    <table class="rt wt"><tr><th>#</th><th>אזור</th><th>אל</th><th>סוג כבל</th><th>מחברים</th><th>אורך</th></tr>
      ${rows.map(r => `<tr><td><b>${r.id}</b></td><td>${esc(r.zone)}</td>
        <td><input value="${esc(r.dest)}" onchange="editWire('${r.key}','dest',this.value)"></td>
        <td><input value="${esc(r.type)}" onchange="editWire('${r.key}','type',this.value)"></td>
        <td><input value="${esc(r.conn)}" onchange="editWire('${r.key}','conn',this.value)"></td>
        <td class="lencell"><input type="number" min="1" value="${r.len}" onchange="editWire('${r.key}','len',this.value)">
          <small>${r.edited ? 'ידני · אוטו ' + r.auto : 'אוטו'}</small></td></tr>`).join('')}
      <tr class="tot"><td colspan="5">סה"כ ${rows.length} קווים</td><td><b>${totalM} מ׳</b></td></tr></table>
    <div class="wact"><button class="ghost sm" onclick="resetWires()">↺ אפס אורכים לחישוב אוטומטי</button>
      <span class="hintline">האורכים מחושבים מהמרחק בתכנית +25% מסלול +3 מ׳ שירות. אפשר לתקן ידנית לפי המסלול בפועל.</span></div>
    <div class="wsec" style="margin-top:12px"><h5>בדיקות מסירה</h5>
      <p>1. כל קו נבדק בבודק רציפות לפני חיבור המגבר.<br>
      2. פולריות אחידה בכל הרמקולים (+ ל-+) — אחרת הבס נעלם.<br>
      3. מדידת עכבה בכל קו לפני הפעלה — ${p.tier.amp.minOhm}Ω מינימום למגבר שנבחר.<br>
      4. הפעלה הדרגתית וכיוונון עוצמה לכל אזור.</p></div>
    <div class="wsec"><h5>למה זה חשוב</h5>
      <p>כבל דק מדי או קו ארוך מדי = ירידת מתח, פחות עוצמה וצליל דחוס. חיבור לא תקין = רעש או שריפת מגבר.
      הצנרת חייבת להיות מוכנה <b>לפני</b> הגבס והצבע — אחרת פותחים קירות.</p></div>
  </div>`;
}
function afterReport() {
  save();
  /* גרירת רמקולים וסאבים ישירות על התכנית בדוח */
  const svg = document.querySelector('#report svg'); if (!svg) return;
  const toPlan = e => { const r = svg.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * S.planW, y: (e.clientY - r.top) / r.height * (S.planH || 900) }; };
  const bind = (sel, arr) => svg.querySelectorAll(sel).forEach(g => {
    g.addEventListener('pointerdown', e => {
      const [zid, idx] = g.dataset[arr === 'spk' ? 'sp' : 'sub'].split('|');
      const pt = S.layout[zid][arr][+idx]; if (!pt) return;
      const st = toPlan(e), ox = pt.x, oy = pt.y;
      g.style.cursor = 'grabbing'; e.preventDefault();
      const mv = ev => { const p2 = toPlan(ev); pt.x = ox + p2.x - st.x; pt.y = oy + p2.y - st.y;
        g.setAttribute('transform', `translate(${pt.x - ox} ${pt.y - oy})`); };
      const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); save(); render(); };
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    });
  });
  bind('[data-sp]', 'spk'); bind('[data-sub]', 'subs');
}
function shareReport() {
  const tier = LITE_CATALOG.tiers.find(t => t.id === S.tier) || LITE_CATALOG.tiers[1];
  const p = buildProposal(tier);
  const txt = `תכנון סאונד — ${S.name || 'הפרויקט שלי'}\n${S.zones.length} אזורים · ${p.totalSpk} רמקולים${p.totalSub ? ' + ' + p.totalSub + ' סאבים' : ''}\nרמת ציוד: ${tier.name} (${tier.brand})\nסה"כ: ${ils(p.total)} לפני מע"מ`;
  if (navigator.share) { navigator.share({ title: 'KO Studio', text: txt }).catch(() => {}); return; }
  window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank', 'noopener');
}
/* דיאלוג אישור פנימי — דיאלוג מערכת חסום בדפדפנים משובצים */
function ask(msg, okLabel, danger) {
  return new Promise(res => {
    const ov = document.createElement('div');
    ov.className = 'askov';
    ov.innerHTML = `<div class="askbox">
      <p>${esc(msg)}</p>
      <div class="askbtns">
        <button class="go ${danger ? 'danger' : ''}" data-ok>${esc(okLabel || 'אישור')}</button>
        <button class="ghost" data-no>ביטול</button>
      </div></div>`;
    document.body.appendChild(ov);
    const done = v => { ov.remove(); res(v); };
    ov.querySelector('[data-ok]').onclick = () => done(true);
    ov.querySelector('[data-no]').onclick = () => done(false);
    ov.addEventListener('click', e => { if (e.target === ov) done(false); });
  });
}
/* התחלה מחדש — מנקה הכול וחוזר לשלב הראשון */
async function resetAll() {
  const has = S.venue || S.zones.length || S.plan;
  if (has && !(await ask('להתחיל מחדש? כל מה שמילאת — המקום, התכנית, האזורים וההצעות — יימחק ולא ניתן יהיה לשחזר.', '↺ כן, התחל מחדש', true))) return;
  try { localStorage.removeItem(LS); } catch (e) {}
  S = { step: 0, venue: null, uses: [], name: '', plan: null, planW: 1400, planH: 900, scale: null,
    roomW: null, roomL: null, ceil: 4, zones: [], budget: null, tier: null, contact: {},
    sameContent: true, layout: {}, wireEdits: {} };
  CAL.mode = 'width'; CAL.pts = [];
  DRAW.on = false; DRAW.from = DRAW.cur = null;
  save(); render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  toast('↺ התחלנו מחדש — בהצלחה!');
}
function toast(m) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = m;
  $('#toasts').appendChild(t); setTimeout(() => t.remove(), 4500);
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && DRAW.on) { DRAW.on = false; DRAW.from = DRAW.cur = null; DRAW.pts = []; render(); } });
load(); render();
