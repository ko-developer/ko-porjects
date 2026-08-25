/* ===================================================================================
   KO Studio — גרסת משתמשי קצה. אפליקציה עצמאית לחלוטין (לא נוגעת ב-app.js המקצועי).
   הרעיון: לשאול שאלות בשפה של בעל העסק, להבין מהתשובות מה העוצמה הנדרשת בכל אזור,
   ולהחזיר שלוש הצעות אמיתיות עם מלאי ומחירי יחידה מה-ERP + דוח ברור לאדריכל/חשמלאי. */
/*__DATA:LITE_CATALOG__*/
/*__DATA:ERP_ITEMS__*/
/*__DATA:ERP_PRICES__*/
/*__DATA:ERP_IMAGES__*/
/*__DATA:FINISHES__*/

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
/* עוצמה במרחק נתון. ההספק יכול להיות שברי — בחלל קטן מנגנים בשברי וואט */
function splAt(spk, w, r) { return spk.sens + 10 * Math.log10(Math.max(0.001, w)) - 20 * Math.log10(Math.max(0.7, r)); }
/* מרווח מומלץ בין רמקולים בפריסה מבוזרת (תקרה→אוזן 1.2 מ׳) */
function spacing(spk, ceil, density) {
  const drop = Math.max(1.2, (ceil || 3) - 1.2);
  return Math.max(2, 2 * drop * Math.tan((spk.h * Math.PI / 180) / 2) * (density || 1));
}
/* כמה רמקולים דרושים לאזור, ומה ה-SPL הצפוי */
function planZone(zone, tier, ceil, scale) {
  const b = zoneBox(zone);
  const cut = tier.cut || 0;                                  /* דרגת קיצוץ להתאמה לתקציב */
  const wM = b.w * scale, hM = b.h * scale, area = zoneAreaPx(zone) * scale * scale;
  const loud = zone.spl >= 95, mid = zone.spl >= 85;
  const onCeil = zone.mount === 'ceil' && !!tier.spkCeil;      /* שקוע בתקרת גבס */
  /* חלל קטן ומוזיקת רקע → רמקול קטן מהסדרה (פחות מקום, פחות כסף, מספיק עוצמה).
     חלל גדול או עוצמה גבוהה → הרמקול הגדול */
  const small = !loud && !mid && area <= 30 && !!tier.spkSmall;
  const spk = onCeil ? tier.spkCeil
    : (loud && tier.spkBig && !cut) ? tier.spkBig
    : small ? tier.spkSmall : tier.spk;
  /* צפיפות: רחבה = כיסוי צמוד ואחיד · רקע = פחות נקודות, מרווח גדול יותר */
  const dens = (loud ? 0.8 : mid ? 1.1 : 1.5) * (1 + cut * 0.4);
  /* תכנון מבוזר בתקרה: קוטר הכיסוי D = 2·נפילה·tan(θ/2), והמרווח נגזר ממנו —
     רקע = חפיפה מינימלית (0.71D) · מוזיקה נוכחת = חפיפה (0.5D) · כיסוי צמוד (0.35D) */
  const dropSp = Math.max(1.2, (ceil || 3) - 1.2);
  const covD = 2 * dropSp * Math.tan(Math.min(spk.h || 90, 100) * Math.PI / 360);
  const sp = onCeil
    ? Math.max(1.5, Math.min(8, covD * (loud ? 0.35 : mid ? 0.5 : 0.71) * (1 + cut * 0.25)))
    : spacing(spk, ceil, dens);
  /* פריסה היקפית: מספר עמדות סביב האזור לפי ההיקף והמרווח.
     בתקרה שקועה הפריסה היא רשת על פני השטח — לא סביב ההיקף */
  const perim = zonePerimPx(zone) * scale;
  /* בקיצוץ עמוק אזור קטן מסתפק בנקודה אחת — פחות מזה כבר אין מה לספק */
  const minN = (cut >= 2 && area < 12) || onCeil ? 1 : 2;
  /* רשת אמיתית על המלבן החוסם — כמו שמתכננים תקרה בפועל */
  const gcols = Math.max(1, Math.ceil(wM / sp)), grows = Math.max(1, Math.ceil(hM / sp));
  let n = onCeil ? gcols * grows : Math.max(minN, Math.ceil(perim / sp));
  if (!onCeil && n > 2 && n % 2) n++;                        /* זוגי — סימטרי ונוח לחיווט */
  n = Math.min(n, cut >= 2 ? (onCeil ? 6 : 4) : 24);         /* בקיצוץ עמוק — מינימום נקודות */
  /* הספק לרמקול: מוגבל להספק הרמקול ולמה שהמגבר נותן */
  const wPer = Math.min(spk.w, 250);
  /* SPL במרכז: כל הרמקולים תורמים, מרחק ממוצע ≈ חצי האלכסון */
  const rAvg = Math.max(2, Math.hypot(wM, hM) / 2);
  /* בתקרה שקועה המאזין נמצא ישירות מתחת לרמקול — מרחק = גובה התקרה פחות אוזן,
     ורק השכנים הקרובים מוסיפים (≈3 dB), לא כל הרמקולים */
  const drop = Math.max(1.2, (ceil || 3) - 1.2);
  const one = splAt(spk, wPer, onCeil ? drop : rAvg);
  const capability = onCeil ? one + 3 : one + 10 * Math.log10(n);
  /* ההספק שבאמת יידרש כדי להגיע ליעד — יכול להיות שברי וואט בחלל קטן עם רמקול רגיש */
  const needW = Math.max(0.02, wPer / Math.pow(10, (capability - zone.spl) / 10));
  let subs = zone.spl >= 90 ? Math.max(1, Math.round(area / 90)) : 0;
  if (cut === 1) subs = zone.spl >= 90 ? 1 : 0;               /* בקיצוץ — סאב רק איפה שחייבים */
  if (cut >= 2) subs = 0;                                     /* בלי סאבים בכלל */
  return { spk, n, subs, area, spacing: sp, splCenter: capability, capability, headroom: capability - zone.spl,
    needW, splTarget: zone.spl, ok: capability >= zone.spl + 3, wPer, onCeil,
    dz: onCeil ? Math.max(1.2, (ceil || 3) - 1.2) : Math.max(0.6, (ceil || 3) - 0.4 - 1.2),
    grid: onCeil ? { cols: gcols, rows: grows } : null };
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
  const mid = zones.some(z => z.spl >= 88);
  const big = loud || area > 150;
  /* חלל קטן ושקט — סאב פלסטיק קומפקטי מהסדרה, לא ארון 15" */
  if (!big && !mid && area <= 60 && tier.subSmall) return { sub: tier.subSmall, big: false, small: true };
  return { sub: big && tier.subBig ? tier.subBig : tier.sub, big };
}
/* קבוצות תוכן: אילו אזורים מקבלים את אותו מקור. ברירת מחדל — כל אזור לעצמו,
   והמשתמש מאחד אזורים שמנגנים אותו דבר (לרוב הפיצול נעשה בגלל עוצמה, לא תוכן) */
function srcOf(z, i) { return z.src == null ? i : z.src; }
function srcList() {
  const ids = [];
  S.zones.forEach((z, i) => { const g = srcOf(z, i); if (!ids.includes(g)) ids.push(g); });
  return ids.sort((a, b) => a - b);
}
function srcCount() { return S.sameContent === false ? srcList().length : 1; }
function srcIndex(z, i) { return srcList().indexOf(srcOf(z, i)) + 1; }
function setSrc(i, g) { S.zones[i].src = g; save(); render(); }
/* סוג ההתקנה משנה את הרמקול עצמו, את הפריסה ואת מחיר ההתקנה */
function setMount(i, m) {
  S.zones[i].mount = m; S.layout = null; save(); render();
  toast(m === 'ceil' ? '⬤ רמקולים שקועים בתקרה — פריסת רשת כלפי מטה' : '🔊 רמקולים על הקיר, מכוונים פנימה');
}
function addSrc(i) {
  const max = Math.max(-1, ...S.zones.map((z, k) => srcOf(z, k)));
  S.zones[i].src = max + 1; save(); render();
}

/* בקיצוץ עמוק — אזורים באותה עוצמה חולקים ערוץ (ויסות משותף, פחות מגברים) */
function chanGroups(zones, cut) {
  if (cut >= 3) return [zones];                               /* ויסות אחד לכל המקום */
  const by = {};
  zones.forEach(x => { const k = cut >= 2 ? Math.round(x.z.spl / 10) : x.z.spl; (by[k] = by[k] || []).push(x); });
  return Object.values(by);
}

/* בניית הצעה מלאה לשכבה */
function buildProposal(tier) {
  const scale = S.scale || 0.02, ceil = S.ceil || 4;
  const zones = S.zones.map(z => ({ z, p: planZone(z, tier, ceil, scale) }));
  const spkCount = {}, add = (k, n) => spkCount[k] = (spkCount[k] || 0) + n;
  let totalSpk = 0, totalSub = 0;
  zones.forEach(({ p }) => { add(p.spk.key, p.n); totalSpk += p.n; if (p.subs) totalSub += p.subs; });
  /* סאב תמיד בתמונה: גם ברקע שקט הוא מה שהופך את הצליל ממקרטע למלא.
     אם אף אזור לא דרש סאב — מוסיפים אחד לאזור המרכזי (לא לשירותים/מסדרון) */
  if (!totalSub && !tier.cut && zones.length) {
    const host = zones.filter(x => x.z.purpose !== 'toilets')
      .sort((a, b) => b.p.area - a.p.area)[0] || zones[0];
    host.p.subs = 1; totalSub = 1;
  }
  /* מגברים: ערוצים לפי מספר קווים (2 רמקולים לקו בממוצע) + קו לכל סאב */
  /* ניצול המגבר: בוחרים מבין המגברים של השכבה את זה שנותן הכי הרבה רמקולים לשקל,
     ומחשבים ערוצים לפי כמה רמקולים באמת אפשר לתלות על ערוץ (אום + הספק). */
  /* המגבר נבחר לפי הרמקול הדומיננטי בכמות — לא לפי הראשון שנכנס לרשימה */
  const domKey = Object.entries(spkCount).sort((a, b) => b[1] - a[1])[0];
  const mainSpk = domKey
    ? [tier.spk, tier.spkBig, tier.spkSmall, tier.spkCeil].find(x => x && x.key === domKey[0]) || tier.spk : tier.spk;
  const cands = [tier.ampSmall, tier.amp, tier.ampBig].filter(Boolean);
  let amp = tier.amp, ampN = 99, perCh = 1;
  let pwrRatio = 0, pwrOk = false;
  let bestCost = Infinity;
  cands.forEach(a => {
    const cap = spkPerChannel(a, mainSpk);
    /* ערוץ לא יכול לשרת שני אזורים — לכל אזור עוצמה משלו (ולפעמים גם תוכן משלו).
       בקיצוץ עמוק אזורים בעלי אותה עוצמה מתאחדים לערוץ משותף (ויסות משותף) */
    const chNeeded = (tier.cut >= 2 ? chanGroups(zones, tier.cut) : zones.map(x => [x]))
      .reduce((n2, grp) => n2 + Math.ceil(grp.reduce((k, { p }) => k + p.n, 0) / cap.n)
        + grp.reduce((k, { p }) => k + p.subs, 0), 0);
    const n = Math.max(1, Math.ceil(chNeeded / (a.ch || 2)));
    /* ציון: עלות אמיתית · בונוס לזיווג מהקיטים · קנס ככל שמתרחקים מיחס ×2 */
    const pwrPenalty = cap.ok ? 1 + Math.min(0.25, Math.abs(cap.ratio - PWR_TARGET) * 0.06) : 2.5;
    const cost = n * a.price * pwrPenalty;
    if (cost < bestCost) { bestCost = cost; amp = a; ampN = n; perCh = cap.n; pwrRatio = cap.ratio; pwrOk = cap.ok; }
  });
  const lines = (tier.cut >= 2 ? chanGroups(zones, tier.cut) : zones.map(x => [x]))
    .reduce((n2, grp) => n2 + Math.ceil(grp.reduce((k, { p }) => k + p.n, 0) / perCh)
      + grp.reduce((k, { p }) => k + p.subs, 0), 0);
  /* אורך כבל משוער: היקף כל האזורים ×1.3 + 12 מ׳ לארון */
  const meters = Math.ceil(zones.reduce((s, { z }) => s + 2 * (z.w * scale + z.h * scale), 0) * 1.3 + 12);
  const reels = Math.max(1, Math.ceil(meters / LITE_CATALOG.accessories.cableReel.meters));
  const rows = [];
  const push = (key, name, qty, price, note) => { if (qty > 0) rows.push({ key, name, qty, price, total: qty * price, note }); };
  Object.entries(spkCount).forEach(([k, n]) => {
    const t0 = [tier.spk, tier.spkBig, tier.spkSmall, tier.spkCeil].find(x => x && x.key === k) || tier.spk;
    const t = withFinish(t0);
    push(t.key, t.name, n, t.price, 'רמקולים');
    if (t.mount && !t.ceil) { const m = erpItem(t.mount); if (m) push(t.mount, m.name, n, m.price, 'מתקני תלייה'); }
  });
  const picked = pickSub(tier, S.zones, scale);
  const sub = withFinish(picked.sub), bigSub = picked.big;
  if (totalSub) push(sub.key, sub.name, totalSub, sub.price, 'סאבים');
  push(amp.key, amp.name, ampN, amp.price, 'הגברה');
  if (tier.xover && totalSub) push(tier.xover.key, tier.xover.name, ampN, tier.xover.price, 'הגברה');
  const A = LITE_CATALOG.accessories;
  push(A.cableReel.key, A.cableReel.name, reels, A.cableReel.price, 'תשתית');
  push(A.speakon.key, A.speakon.name, (totalSpk + totalSub) * 2, A.speakon.price, 'תשתית');
  if (!(tier.cut >= 3)) push(A.rack.key, A.rack.name, 1, A.rack.price, 'תשתית');
  /* מעבד/מטריצה — רק כשבאמת יש יותר ממקור תוכן אחד */
  if (S.sameContent === false && S.zones.length > 1 && srcCount() > 1 && !tier.cut) {
    /* מטריצת רשת אמיתית מהמלאי — 4 יציאות, שולטת בתוכן ובעוצמה לכל אזור */
    const mx = erpItem('SDIG15KO') || erpItem('SDIG5KO');
    if (mx) push(mx.key, mx.name, 1, mx.price, 'ניתוב תוכן');
  }
  const equip = rows.reduce((s, r) => s + r.total, 0);
  /* התקנה מתומחרת לפי פריט — כל פעולה והמחיר שלה, כמו בהצעת מחיר מקצועית */
  const ceilSpk = zones.reduce((n2, { z, p }) => n2 + (p.onCeil ? p.n : 0), 0);
  const wallSpk = totalSpk - ceilSpk;
  const inst = [
    { k: 'arrive', label: 'הגעה, פריקה והתארגנות באתר', unit: 'ביקור', qty: 1, price: 350 },
    { k: 'spk',    label: 'התקנת רמקול על קיר כולל מתקן וכיוון', unit: 'יח׳', qty: wallSpk, price: 160 },
    { k: 'spkc',   label: 'ניסור תקרת גבס, התקנת רמקול שקוע וסגירה', unit: 'יח׳', qty: ceilSpk, price: 210 },
    { k: 'sub',    label: 'הצבת סאב, חיבור וכיוון', unit: 'יח׳', qty: totalSub, price: 90 },
    { k: 'rack',   label: 'הרכבת מגבר/מעבד בארון וחיווט פנימי', unit: 'יח׳', qty: ampN, price: 200 },
    { k: 'ends',   label: 'קצוות ומחברים לכל קו רמקול', unit: 'קו', qty: lines, price: 45 },
    { k: 'tune',   label: 'כיוונון, בדיקות ומסירה', unit: 'אזור', qty: S.zones.length, price: 400 }
  ].filter(r => r.qty > 0).map(r => {
    const ov = (S.instPrice || {})[r.k];
    const price = ov == null ? r.price : ov;
    return { ...r, price, total: r.qty * price, edited: ov != null && ov !== r.price };
  });
  const install = inst.reduce((s, r) => s + r.total, 0);
  const hours = (45 + totalSpk * 30 + totalSub * 15 + ampN * 30 + 45 * S.zones.length) / 60;
  const days = Math.max(1, Math.ceil(hours / 8));
  return { tier, zones, rows, inst, equip, install, days, hours, total: equip + install,
    totalSpk, totalSub, ampN, amp, perCh, pwrRatio, pwrOk, lines, meters, sub, bigSub, mainSpk, util: Math.round(totalSpk / Math.max(1, ampN * (amp.ch || 2) * perCh) * 100) };
}
/* ---------- גימור: אותו דגם, מראה אחר ---------- */
/* לקוח שרוצה רמקול עץ או במבוק מקבל את אותו רמקול בדיוק — רק בגימור אחר,
   עם הפרש המחיר האמיתי מהמלאי. האקוסטיקה לא משתנה */
const FIN_ANY = 'any';
const FIN_COL = { 'שחור': '#1c1c1c', 'לבן': '#f2f2ee', 'עץ': '#b1793f', 'במבוק': '#d8b478', 'אפור': '#8d918c', 'כסף': '#c9ccd1' };
function finishOpts(key) {
  return (typeof FINISHES !== 'undefined' && FINISHES.byKey && FINISHES.byKey[key]) || null;
}
/* כל הגימורים שאפשר להציע לפרויקט הנוכחי, לפי מה שבאמת בקטלוג ובמלאי */
function finishChoices() {
  const seen = {};
  LITE_CATALOG.tiers.forEach(t => ['spk', 'spkBig', 'spkSmall', 'spkCeil', 'sub', 'subBig', 'subSmall'].forEach(k => {
    const e = t[k]; if (!e) return;
    (finishOpts(e.key) || []).forEach(v => { if (v.stock > 0) seen[v.finish] = (seen[v.finish] || 0) + 1; });
  }));
  /* "רגיל" הוא פריט בלי צבע בשם — לא אפשרות שמציגים ללקוח */
  const order = ['שחור', 'לבן', 'עץ', 'במבוק', 'אפור', 'כסף'];
  return order.filter(f => seen[f]);
}
/* הפריט בפועל אחרי בחירת הגימור — אם אין מלאי או אין וריאנט, נשארים במקורי */
function withFinish(entry) {
  const want = S.finish;
  if (!want || want === FIN_ANY || !entry) return entry;
  const opts = finishOpts(entry.key);
  if (!opts) return entry;
  const hit = opts.find(v => v.finish === want && v.stock > 0);
  if (!hit || hit.key === entry.key) return entry;
  return Object.assign({}, entry, { key: hit.key, name: entry.name + ' · ' + want, price: hit.price, finish: want });
}
function setFinish(f) { S.finish = f; save(); render(); toast(f === FIN_ANY ? 'נבחר: מה שמתאים ביותר' : '🎨 ' + f + ' — ההצעות מתעדכנות'); }

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
  /* מה חסר כדי להתקדם — תמיד מול העיניים, בלי לגלול לחפש */
  const need = ['בחר סוג מקום', 'בחר מה קורה במקום', S.plan ? 'סמן על התכנית מידה מוכרת' : 'העלה תכנית או הזן מידות',
    S.zones.length ? 'ענה מה קורה בכל אזור' : 'סמן אזור אחד לפחות', '', 'בחר אחת מההצעות', ''][S.step];
  const hint = !okNext && need ? `<div class="navhint">👆 ${need}</div>` : '';
  return hint + back + (label ? `<button class="go" ${okNext ? '' : 'disabled'} onclick="go(${S.step + 1})">${label}</button>` : '');
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
    ` + wb(`
    <div class="guide">
      <div class="gstep ${CAL.pts.length === 0 ? 'now' : 'done'}"><b>1</b><span>לחץ על התכנית בקצה של מידה מוכרת — קיר, דלת, או מידה שכתובה בתכנית</span></div>
      <div class="gstep ${CAL.pts.length === 1 ? 'now' : CAL.pts.length > 1 ? 'done' : ''}"><b>2</b><span>לחץ על הקצה השני</span></div>
      <div class="gstep ${CAL.pts.length === 2 ? 'now' : ''}"><b>3</b><span>הקלד כמה מטרים זה — בחלון שייפתח על התכנית</span></div>
    </div>
    <div class="planops">
      <button class="ghost" onclick="cropPlan()">✂️ הסר שוליים אוטומטית</button>
      <button class="ghost ${CROP.on ? 'on' : ''}" onclick="${CROP.on ? 'cancelCrop()' : 'startCrop()'}">${CROP.on ? '✕ בטל גזירה' : '⬚ גזור בעצמי — סמן מסגרת'}</button>
      <input type="file" accept="image/*" id="planIn3" style="display:none" onchange="uploadPlan(this)">
      <button class="ghost" onclick="document.getElementById('planIn3').click()">🔄 החלף תכנית</button>
    </div>
    <details class="fallback"><summary>אין לי מידה מדויקת — אעריך את רוחב התכנית</summary>
      <p class="sub" style="margin:8px 0">בחר את הרוחב הכולל של מה שרואים בתכנית:</p>
      <div class="chips">${[6, 8, 10, 12, 15, 20, 25, 30, 40].map(v => `<button class="chip" onclick="setWidth(${v})">${v} מ׳</button>`).join('')}</div>
      <label class="fld"><span>או מספר מדויק</span><input type="number" step="0.1" placeholder="למשל 23.7" oninput="setWidth(+this.value)"></label>
    </details>`);

  /* מכויל — אישור ברור ומעבר הלאה */
  const wM = (S.planW * S.scale).toFixed(1);
  return `
    <h2>מצוין, החלל מכויל ✓</h2>
    <p class="sub">מכאן נדע בדיוק כמה רמקולים צריך ואיפה. אפשר להמשיך — או לתקן אם המידה לא נראית לך נכונה.</p>
    ` + wb(`
    <div class="okcard">
      <div><b>${wM} מ׳</b><small>רוחב התכנית</small></div>
      <div><b>${(1 / S.scale).toFixed(0)}px</b><small>= מטר אחד</small></div>
    </div>
    <label class="fld"><span>גובה התקרה (מטרים) — קובע כמה רמקולים צריך</span>
      <input type="number" step="0.1" min="2" max="12" value="${S.ceil}" oninput="S.ceil=+this.value||4;save()"></label>
    ${(S.suggest || []).length ? `<div class="note ok">🤖 זיהינו <b>${S.suggest.length} חללים</b> בתכנית —
      נציע אותם כאזורים בשלב הבא, ותוכל לתקן כל צורה.</div>` : ''}
    <div class="planops">
      <b>כלים לתכנית</b>
      <button class="ghost" onclick="cropPlan()">✂️ הסר שוליים אוטומטית</button>
      <button class="ghost ${CROP.on ? 'on' : ''}" onclick="${CROP.on ? 'cancelCrop()' : 'startCrop()'}">${CROP.on ? '✕ בטל גזירה' : '⬚ גזור בעצמי — סמן מסגרת'}</button>
      <button class="ghost" onclick="recalibrate()">↺ המידה לא נכונה — כייל מחדש</button>
      <input type="file" accept="image/*" id="planIn2" style="display:none" onchange="uploadPlan(this)">
      <button class="ghost" onclick="document.getElementById('planIn2').click()">🔄 החלף תכנית</button>
    </div>
    <div class="note">הצעד הבא: לסמן איפה צריך מוזיקה. אפשר צורה חופשית — כולל קשתות.</div>`,
    `<div class="rulerbox">
      <div class="rulerlbl">כך נראים <b>5 מטרים</b> בתכנית שלך — השווה לשולחן או לדלת בתכנית:</div>
      <div class="ruler" data-m="5"><span>5 מ׳</span></div>
      <div class="rulerlbl">שולחן <b>1.5 מ׳</b>:</div>
      <div class="ruler small" data-m="1.5"></div>
    </div>`);
}
/* שולחן עבודה: התכנית נשארת נעוצה במסך וההסברים והכפתורים לצידה —
   כך אין צורך לגלול הלוך ושוב בין ההוראה לבין מה שעושים בפועל */
function wb(side, under) {
  return `<div class="wb"><div class="wbplan">${planBoxHTML()}${under || ''}</div><div class="wbside">${side}</div></div>`;
}
function planBoxHTML() {
  if (!S.plan) return '';
  return `<div class="planbox"><div id="planWrap" class="planwrap"><img id="planImg" src="${S.plan}"><svg id="planSvg"></svg></div></div>`;
}
function recalibrate() { S.scale = null; CAL.mode = 'two'; CAL.pts = []; save(); render(); toast('סמן שוב 2 נקודות על התכנית'); }
const CAL = { mode: 'two', pts: [] };
const DRAW = { on: false, from: null, cur: null, pts: [], purpose: null };
function calMode(m) { CAL.mode = m; CAL.pts = []; render(); }
function uploadPlan(inp) {
  const f = inp.files && inp.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    S.plan = r.result; S.zones = []; S.scale = null; S.suggest = null; S.cropDone = false;
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
function startDrawZone(mode, purpose) {
  DRAW.on = mode || 'poly'; DRAW.from = null; DRAW.cur = null; DRAW.pts = [];
  DRAW.purpose = purpose || null;                      /* ייעוד שנבחר מראש */
  render();
  const q = purpose && LITE_CATALOG.zonePurposes.find(x => x.id === purpose);
  toast(q ? `${q.icon} סמן על התכנית איפה ${q.name} — הייעוד כבר מוגדר`
    : DRAW.on === 'poly' ? '✏️ לחץ על פינות האזור — לחיצה על הנקודה הראשונה סוגרת (או דאבל-קליק)'
    : '▭ גרור על התכנית מפינה לפינה');
}
/* אזור חדש: אם נבחר ייעוד מראש — מחילים אותו מיד ומדלגים על השאלה */
function newZone(z) {
  const pid = DRAW.purpose;
  if (pid) {
    const q = LITE_CATALOG.zonePurposes.find(x => x.id === pid);
    z.purpose = pid;
    z.name = q ? q.name : z.name;
    z.spl = q ? (pid === 'dance' || pid === 'stage' ? Math.max(q.spl, usePeak()) : q.spl) : z.spl;
    z.mount = (pid === 'toilets' || pid === 'entry') ? 'ceil' : 'wall';
  }
  S.zones.push(z);
  S.layout = null;
  DRAW.purpose = null;
  save();
  toast(pid ? '✓ האזור נוסף ומוגדר' : '✓ האזור סומן — עכשיו בחר מה קורה בו');
}
function finishPoly() {
  if (DRAW.pts.length >= 3) {
    const poly = DRAW.pts.slice();
    const xs = poly.map(p => p.x), ys = poly.map(p => p.y);
    newZone({ id: uid(), name: 'אזור ' + (S.zones.length + 1), purpose: null, spl: usePeak(),
      poly, x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) });
  } else toast('צריך לפחות 3 פינות');
  DRAW.on = false; DRAW.pts = []; DRAW.cur = null;
  render();
}
/* ציור אזור: ניקור פינות (מדויק) או גרירת מלבן (מהיר) */
function bindDrawZone() {
  const svg = $('#planSvg'); if (!svg || !DRAW.on) return;
  svg.style.cursor = 'crosshair';
  const toPlan = e => { const r = svg.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * S.planW, y: (e.clientY - r.top) / r.height * (S.planH || 900) }; };
  if (CROP.on) {
    svg.style.cursor = 'crosshair';
    svg.onclick = null;
    svg.onpointerdown = e => {
      e.preventDefault();
      CROP.a = toPlan(e); CROP.b = null;
      const mv = ev => { CROP.b = toPlan(ev); drawPlan(); };
      const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); finishCrop(); };
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    };
    return;
  }
  svg.onpointerdown = null;
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
        newZone({ id: uid(), name: 'אזור ' + (S.zones.length + 1), purpose: null, spl: usePeak(),
          x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) });
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
    /* חיתוך אוטומטי פעם אחת — לפני שיש כיול או אזורים */
    if (!S.cropDone && !S.scale && !S.zones.length) { S.cropDone = true; if (cropPlan(true)) return; }
    drawPlan();
    sizeRulers();
    if (!S.zones.length) autoDetect(img);
  };
  addEventListener('resize', sizeRulers);
  if (img.complete) fit(); else img.onload = fit;
}
/* ---------- חיתוך שוליים: משאיר רק את התכנית עצמה ---------- */
/* מזהים "תוכן" לפי כמות המעברים בהירות בשורה/בעמודה — כך שגם פס שחור אחיד
   (סרגל של צילום מסך) וגם שוליים לבנים נחתכים, אבל קווי שרטוט נשמרים */
function contentBox(img) {
  const W = img.naturalWidth, H = img.naturalHeight;
  if (!W || !H) return null;
  const m = Math.min(1, 900 / Math.max(W, H));
  const w = Math.max(8, Math.round(W * m)), h = Math.max(8, Math.round(H * m));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const cx = c.getContext('2d', { willReadFrequently: true });
  cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h);
  cx.drawImage(img, 0, 0, w, h);
  let d;
  try { d = cx.getImageData(0, 0, w, h).data; } catch (e) { return null; }
  const lum = new Float32Array(w * h);
  for (let i = 0, n = w * h; i < n; i++) lum[i] = d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114;
  /* מחלקים את הציר לקבוצות של "דיו" עם רווחים לבנים ביניהן, ולוקחים את הגוש
     המשמעותי — כך פסי ממשק (שעה, שם קובץ, סרגל שיתוף) ושוליים ריקים יוצאים החוצה */
  const band = (ink, n) => {
    const gap = Math.max(4, Math.round(n * 0.02)), gs = [];
    let cur = null, miss = 0;
    for (let i = 0; i < n; i++) {
      if (ink[i] > 0) { if (!cur) { cur = { a: i, b: i, ink: 0 }; gs.push(cur); } cur.b = i; cur.ink += ink[i]; miss = 0; }
      else if (cur) { miss++; if (miss > gap) cur = null; }
    }
    if (!gs.length) return null;
    const best = gs.reduce((p, g) => g.ink > p.ink ? g : p, gs[0]);
    /* גושים נוספים בגודל משמעותי (חותמת שרטוט, מקרא) נשארים בפנים —
       אבל פס דק של ממשק (שורת שעה או שם קובץ) לא */
    const bestLen = best.b - best.a + 1;
    const keep = gs.filter(g => g.ink >= best.ink * 0.2 && (g.b - g.a + 1) >= bestLen * 0.15);
    return { a: Math.min.apply(null, keep.map(g => g.a)), b: Math.max.apply(null, keep.map(g => g.b)) };
  };
  /* "דיו" = מעברי בהירות, לא פיקסלים כהים — כך פס אחיד (שחור או צבעוני) שוקל אפס,
     בעוד קווי שרטוט דקים נספרים במלואם */
  const rowMin = Math.max(2, w * 0.004);
  const rowInk = new Float64Array(h);
  for (let y = 0; y < h; y++) {
    let k = 0;
    for (let x = 1; x < w; x++) if (Math.abs(lum[y * w + x] - lum[y * w + x - 1]) > 38) k++;
    rowInk[y] = k >= rowMin ? k : 0;
  }
  const rb = band(rowInk, h);
  if (!rb || rb.b - rb.a < h * 0.12) return null;
  const bandH = rb.b - rb.a + 1, colMin = Math.max(2, bandH * 0.004);
  const colInk = new Float64Array(w);
  for (let x = 0; x < w; x++) {
    let k = 0;
    for (let y = rb.a + 1; y <= rb.b; y++) if (Math.abs(lum[y * w + x] - lum[(y - 1) * w + x]) > 38) k++;
    colInk[x] = k >= colMin ? k : 0;
  }
  const cb = band(colInk, w);
  if (!cb || cb.b - cb.a < w * 0.12) return null;
  const pad = Math.round(Math.max(w, h) * 0.008);
  const x0 = Math.max(0, cb.a - pad), y0 = Math.max(0, rb.a - pad);
  const x1 = Math.min(w - 1, cb.b + pad), y1 = Math.min(h - 1, rb.b + pad);
  const box = { x: x0 / m, y: y0 / m, w: (x1 - x0 + 1) / m, h: (y1 - y0 + 1) / m };
  /* אם כמעט ולא נחתך משהו — לא נוגעים בתמונה */
  if (box.w * box.h > W * H * 0.95) return null;
  return box;
}
const CROP = { on: false, a: null, b: null };
function startCrop() {
  if (!S.plan) return;
  CROP.on = true; CROP.a = CROP.b = null; DRAW.on = false;
  render();
  toast('✂️ גרור מסגרת סביב מה שרוצים להשאיר');
}
function cancelCrop() { CROP.on = false; CROP.a = CROP.b = null; render(); }
/* גזירה ידנית — המסגרת שסומנה על התכנית הופכת לתמונה החדשה */
function finishCrop() {
  const a = CROP.a, b = CROP.b;
  CROP.on = false; CROP.a = CROP.b = null;
  const img = $('#planImg');
  if (!a || !b || !img) { render(); return; }
  const x0 = Math.max(0, Math.min(a.x, b.x)), y0 = Math.max(0, Math.min(a.y, b.y));
  const x1 = Math.min(S.planW, Math.max(a.x, b.x)), y1 = Math.min(S.planH || 900, Math.max(a.y, b.y));
  if (x1 - x0 < 40 || y1 - y0 < 40) { toast('המסגרת קטנה מדי'); render(); return; }
  const f = img.naturalWidth / 1400;   /* מיחידות התכנית לפיקסלים של התמונה */
  applyCropBox({ x: x0 * f, y: y0 * f, w: (x1 - x0) * f, h: (y1 - y0) * f }, false, 'הגזירה בוצעה');
}
function cropPlan(silent) {
  const img = $('#planImg');
  if (!img || !img.complete) return false;
  const box = contentBox(img);
  if (!box) { if (!silent) toast('התכנית כבר תופסת את כל התמונה'); return false; }
  return applyCropBox(box, silent, 'השוליים הוסרו — התכנית גדולה יותר');
}
function applyCropBox(box, silent, msg) {
  const img = $('#planImg');
  if (!img) return false;
  const c = document.createElement('canvas');
  c.width = Math.round(box.w); c.height = Math.round(box.h);
  const cx = c.getContext('2d');
  cx.fillStyle = '#fff'; cx.fillRect(0, 0, c.width, c.height);
  cx.drawImage(img, -box.x, -box.y);
  const png = (S.plan || '').startsWith('data:image/png');
  let out;
  try { out = c.toDataURL(png ? 'image/png' : 'image/jpeg', 0.92); } catch (e) { return false; }
  /* המרת כל הקואורדינטות למערכת החדשה */
  const W = img.naturalWidth, k = W / box.w, offX = box.x * 1400 / W, offY = box.y * 1400 / W;
  const map = pt => { pt.x = (pt.x - offX) * k; pt.y = (pt.y - offY) * k; };
  S.zones.forEach(z => {
    (z.poly || []).forEach(map);
    map(z); z.w *= k; z.h *= k;
  });
  (S.suggest || []).forEach(r => { map(r); r.w *= k; r.h *= k; });
  if (S.scale) S.scale = S.scale / k;
  S.layout = null; S.wireEdits = null;
  S.plan = out; S.planH = Math.round(1400 * box.h / box.w); S.cropDone = true;
  CAL.pts = [];
  save(); render();
  if (!silent) toast('✂️ ' + msg);
  return true;
}

/* הסרגלים נמדדים מול רוחב התכנית כפי שהיא מוצגת בפועל */
function sizeRulers() {
  const img = $('#planImg'); if (!img || !S.scale) return;
  const w = img.getBoundingClientRect().width; if (!w) return;
  document.querySelectorAll('.ruler[data-m]').forEach(el => {
    const m = +el.dataset.m;
    el.style.width = Math.min(w, (m / S.scale) / S.planW * w) + 'px';
  });
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
      ${(z.poly || []).map((pt, pi) => {
        const nx = z.poly[(pi + 1) % z.poly.length], c = segCtrl(pt, nx, pt.b || 0);
        const hx = pt.b ? (pt.x + 2 * c.x + nx.x) / 4 : (pt.x + nx.x) / 2;
        const hy = pt.b ? (pt.y + 2 * c.y + nx.y) / 4 : (pt.y + nx.y) / 2;
        return `<circle data-pt="${i}|${pi}" cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="11" fill="#fff" stroke="${p.color}" stroke-width="4" style="cursor:grab"><title>גרור להזזה · דאבל-קליק למחיקת הפינה</title></circle>
          <circle data-mid="${i}|${pi}" cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="8" fill="${pt.b ? p.color : '#fff'}" stroke="${p.color}" stroke-width="3" opacity="0.85" style="cursor:ns-resize"><title>גרור כדי לעגל את הצלע · דאבל-קליק להוספת פינה</title></circle>`;
      }).join('')}
      ${z.poly ? '' : `<rect data-rs="${i}" x="${b.x + b.w - 26}" y="${b.y + b.h - 26}" width="26" height="26" rx="6" fill="#fff" stroke="${p.color}" stroke-width="4" style="cursor:nwse-resize"/>`}`;
  });
  if (DRAW.on === 'poly' && DRAW.pts.length) {
    const pts = DRAW.pts;
    out += `<polyline points="${pts.map(p => p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ')}" fill="#7c5cff1a" stroke="#7c5cff" stroke-width="4" stroke-linejoin="round"/>`;
    if (DRAW.cur) {
      const lp = pts[pts.length - 1];
      out += `<line x1="${lp.x}" y1="${lp.y}" x2="${DRAW.cur.x}" y2="${DRAW.cur.y}" stroke="#7c5cff" stroke-width="3" stroke-dasharray="9 6" opacity="0.7"/>`;
      if (S.scale) {
        const d = Math.hypot(DRAW.cur.x - lp.x, DRAW.cur.y - lp.y) * S.scale;
        out += `<text x="${(lp.x + DRAW.cur.x) / 2}" y="${(lp.y + DRAW.cur.y) / 2 - 12}" text-anchor="middle" font-size="22" font-weight="800" fill="#7c5cff">${d.toFixed(1)} מ׳</text>`;
      }
    }
    pts.forEach((p, i) => out += `<circle cx="${p.x}" cy="${p.y}" r="${i === 0 ? 14 : 9}" fill="${i === 0 ? '#fff' : '#7c5cff'}" stroke="#7c5cff" stroke-width="4"/>`);
    if (pts.length >= 3 && S.scale) {
      let a = 0;
      for (let i = 0; i < pts.length; i++) { const p1 = pts[i], p2 = pts[(i + 1) % pts.length]; a += p1.x * p2.y - p2.x * p1.y; }
      const c = { x: pts.reduce((s2, p) => s2 + p.x, 0) / pts.length, y: pts.reduce((s2, p) => s2 + p.y, 0) / pts.length };
      out += `<text x="${c.x}" y="${c.y}" text-anchor="middle" font-size="26" font-weight="800" fill="#7c5cff">${Math.round(Math.abs(a) / 2 * S.scale * S.scale)} מ"ר · סגור בנקודה הראשונה</text>`;
    }
  }
  if (CROP.on) {
    const a = CROP.a, b = CROP.b;
    if (a && b) {
      const x0 = Math.min(a.x, b.x), y0 = Math.min(a.y, b.y), cw = Math.abs(b.x - a.x), ch = Math.abs(b.y - a.y);
      out += `<path d="M0 0H${w}V${h}H0Z M${x0} ${y0}H${x0 + cw}V${y0 + ch}H${x0}Z" fill="#0b0b0bcc" fill-rule="evenodd"/>
        <rect x="${x0}" y="${y0}" width="${cw}" height="${ch}" fill="none" stroke="#ff6a3d" stroke-width="5"/>
        ${S.scale ? `<text x="${x0 + cw / 2}" y="${y0 - 14}" text-anchor="middle" font-size="26" font-weight="800" fill="#ff6a3d">${(cw * S.scale).toFixed(1)}×${(ch * S.scale).toFixed(1)} מ׳</text>` : ''}`;
    } else {
      out += `<rect x="0" y="0" width="${w}" height="${h}" fill="#0b0b0b55"/>
        <text x="${w / 2}" y="${h / 2}" text-anchor="middle" font-size="34" font-weight="800" fill="#fff">גרור מסגרת סביב מה שרוצים להשאיר</text>`;
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
  /* ידית אמצע צלע: גרירה = עיגול הצלע · דאבל-קליק = הוספת פינה */
  svg.querySelectorAll('[data-mid]').forEach(h => {
    const [zi, pi] = h.dataset.mid.split('|').map(Number);
    h.addEventListener('dblclick', e => {
      e.stopPropagation();
      const z = S.zones[zi], p1 = z.poly[pi], p2 = z.poly[(pi + 1) % z.poly.length];
      z.poly.splice(pi + 1, 0, { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });
      p1.b = 0;
      save(); render(); toast('➕ נוספה פינה — גרור אותה למקום');
    });
    h.addEventListener('pointerdown', e => {
      if (DRAW.on) return;
      e.stopPropagation(); e.preventDefault();
      const z = S.zones[zi], p1 = z.poly[pi], p2 = z.poly[(pi + 1) % z.poly.length];
      const st = toPlan(e), ob = p1.b || 0;
      const dx = p2.x - p1.x, dy = p2.y - p1.y, len = Math.hypot(dx, dy) || 1;
      const mv = ev => {
        const pp = toPlan(ev);
        /* המרחק בניצב לצלע קובע את גובה הקשת */
        const perp = ((pp.x - st.x) * -dy + (pp.y - st.y) * dx) / len;
        p1.b = Math.max(-0.6, Math.min(0.6, ob + perp / len / 2));
        const b2 = zoneBox(z); z.x = b2.x; z.y = b2.y; z.w = b2.w; z.h = b2.h;
        drawPlan();
      };
      const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); save(); render(); };
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    });
  });
  /* גרירת פינה בודדת של פוליגון — התאמה מדויקת לצורת החדר */
  svg.querySelectorAll('[data-pt]').forEach(h => {
    h.addEventListener('dblclick', e => {
      e.stopPropagation();
      const [zi, pi] = h.dataset.pt.split('|').map(Number);
      const z = S.zones[zi];
      if (z.poly.length <= 3) { toast('צריך לפחות 3 פינות'); return; }
      z.poly.splice(pi, 1);
      const b2 = zoneBox(z); z.x = b2.x; z.y = b2.y; z.w = b2.w; z.h = b2.h;
      save(); render(); toast('✕ הפינה נמחקה');
    });
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
    ` + wb(`
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
    ${DRAW.on ? drawHint() : ''}`);

  /* יש אזור שעדיין לא ענו עליו — שואלים את השאלה האחת החשובה, גדול וברור */
  const pending = zs.findIndex(z => !z.purpose);
  if (pending >= 0) {
    const z = zs[pending];
    return `
    <h2>מה קורה ב"${esc(z.name)}"?</h2>
    <p class="sub">זה קובע כמה חזק המקום הזה ינגן — וכמה רמקולים צריך בו.</p>
    ` + wb(`
    <div class="cards zpurp">${LITE_CATALOG.zonePurposes.map(q => `
      <div class="card" onclick="setPurpose(${pending},'${q.id}')">
        <div class="ic">${q.icon}</div><b>${esc(q.name)}</b><small>${esc(q.desc)}</small>
        <span class="pill">${q.spl} dB</span></div>`).join('')}</div>
    <button class="ghost wide" onclick="delZone(${pending})">✕ מחק את האזור הזה</button>`);
  }

  /* כל האזורים מוגדרים — סיכום ברור + שאלה אחת: עוד אזור או ממשיכים */
  return `
  <h2>${zs.length === 1 ? 'האזור מוגדר ✓' : zs.length + ' אזורים מוגדרים ✓'}</h2>
  <p class="sub">כל אזור מקבל שליטת עוצמה נפרדת. אפשר לדייק את הצורה ישירות על התכנית:</p>
  ` + wb(`
  <div class="shapehelp">
    <span>⬤ <b>פינה</b> — גרור להזזה · דאבל-קליק למחיקה</span>
    <span>◗ <b>אמצע צלע</b> — גרור לעיגול הקשת · דאבל-קליק להוספת פינה</span>
    <span>✥ <b>גוף האזור</b> — גרור להזזת הצורה כולה</span>
  </div>
  ${DRAW.on ? drawHint() : ''}
  ${forgotHTML()}
  <div class="zlist">${zs.map((z, i) => {
    const p = purposeOf(z), pl = S.scale ? planZone(z, LITE_CATALOG.tiers[1], S.ceil, S.scale) : null;
    return `<div class="zcard" style="border-right:6px solid ${p.color}">
      <div class="zhead"><span class="znum" style="background:${p.color}">${i + 1}</span>
        <input value="${esc(z.name)}" oninput="S.zones[${i}].name=this.value;save();drawPlan()">
        <button class="ghost sm" onclick="delZone(${i})">✕</button></div>
      <div class="zsum">
        <span class="ztag" style="background:${p.color}1a;color:${p.color}">${p.icon} ${esc(p.name)} · ${z.spl} dB</span>
        ${S.scale ? `<span>${Math.round(zoneAreaPx(z) * S.scale * S.scale)} מ"ר</span>` : ''}
        ${z.poly ? `<span>${z.poly.length} פינות${z.poly.some(pt => pt.b) ? ' · ' + z.poly.filter(pt => pt.b).length + ' קשתות' : ''}</span>` : ''}
        ${pl ? `<span>🔈 ${pl.n} רמקולים${pl.subs ? ' + ' + pl.subs + ' סאב' : ''}</span>` : ''}
        ${S.sameContent === false && zs.length > 1 && srcCount() > 1 ? `<span>🎚 מקור ${srcIndex(z, i)}</span>` : ''}
      </div>
      <div class="mountrow">
        <span>התקנה:</span>
        <button class="chip xs ${z.mount !== 'ceil' ? 'on' : ''}" onclick="setMount(${i},'wall')">🔊 על הקיר</button>
        <button class="chip xs ${z.mount === 'ceil' ? 'on' : ''}" ${z.spl >= 95 ? 'disabled title="בעוצמה כזאת רמקול שקוע לא יעמוד — צריך רמקול על קיר"' : ''} onclick="setMount(${i},'ceil')">⬤ שקוע בתקרה</button>
      </div>
      <button class="ghost sm" onclick="S.zones[${i}].purpose=null;save();render()">↺ שנה מה קורה כאן</button>
    </div>`;
  }).join('')}</div>
  ${zs.length > 1 ? `<div class="content-q">
    <b>🎚 מה מתנגן בכל אזור?</b>
    <div class="chips">
      <button class="chip ${S.sameContent !== false ? 'on' : ''}" onclick="S.sameContent=true;save();render()">אותה מוזיקה בכל המקום</button>
      <button class="chip ${S.sameContent === false ? 'on' : ''}" onclick="S.sameContent=false;save();render()">תוכן שונה</button>
    </div>
    ${S.sameContent === false ? `
      <small>סמן לכל אזור מאיזה מקור הוא מנגן. אזורים שחולקים מקור מקבלים את אותה מוזיקה
      — אבל עדיין עוצמה נפרדת לכל אחד.</small>
      <div class="srcgrid">${zs.map((z, i) => {
        const p = purposeOf(z), mine = srcOf(z, i);
        return `<div class="srcrow">
          <span class="znum sm" style="background:${p.color}">${i + 1}</span>
          <b>${esc(z.name)}</b>
          <div class="chips">
            ${srcList().map((g, gi) => `<button class="chip xs ${mine === g ? 'on' : ''}" onclick="setSrc(${i},${g})">מקור ${gi + 1}</button>`).join('')}
            <button class="chip xs ghosty" onclick="addSrc(${i})" title="מקור חדש רק לאזור הזה">＋</button>
          </div>
        </div>`;
      }).join('')}</div>
      <small class="srcsum">${srcCount() === 1
        ? 'כרגע כל האזורים על אותו מקור — זהה ל"אותה מוזיקה בכל המקום", בלי עלות מעבד.'
        : `<b>${srcCount()} מקורות</b> — נוסיף מעבד ניתוב שמזין כל קבוצה בנפרד.`}</small>` : `
      <small>מקור אחד לכל המקום, עם ויסות עוצמה נפרד לכל אזור — הפתרון הנפוץ והחסכוני.</small>`}
  </div>` : ''}
  <div class="row">
    <button class="ghost" style="flex:2" onclick="startDrawZone('poly')">➕ יש עוד אזור עם אופי אחר</button>
    <button class="ghost" style="flex:1" onclick="S._why=!S._why;save();render()">${S._why ? '▲' : '❓'} למה לחלק</button>
  </div>
  ${S._why ? `<div class="note"><b>כי אנשים לא רוצים את אותה עוצמה בכל מקום.</b><br>
    • באזור ישיבה מוזיקה חזקה מדי גורמת לאנשים לצעוק — ולעזוב מוקדם.<br>
    • ברחבה מוזיקה חלשה מדי הורגת את האנרגיה.<br>
    • חלוקה מאפשרת להנמיך בישיבה בלי לגעת ברחבה.</div>` : ''}`);
}
/* אזורים שקל לשכוח — שירותים, חוץ, כניסה. מוצעים לפי סוג המקום, ורק אם עוד לא סומנו */
const FORGOT = {
  toilets: 'כמעט תמיד רוצים שם מוזיקה — ובלעדיה השירותים מרגישים נטושים',
  outdoor: 'מרפסת או חצר צריכות רמקול מוגן מים משלהן',
  entry:   'הכניסה היא הרושם הראשון — ושם המוזיקה חלשה יותר',
  bar:     'הבר תמיד רוצה קצת יותר עוצמה מהישיבה'
};
function forgotHTML() {
  const used = new Set(S.zones.map(z => z.purpose).filter(Boolean));
  const v = LITE_CATALOG.venues.find(x => x.id === S.venue) || {};
  const list = Object.keys(FORGOT).filter(id => !used.has(id))
    .filter(id => id !== 'outdoor' || !/office|store/.test(v.id || ''));
  if (!list.length || !S.zones.length) return '';
  return `<div class="forgot">
    <b>💡 אל תשכח אזור</b>
    <div class="fgrid">${list.map(id => {
      const q = LITE_CATALOG.zonePurposes.find(x => x.id === id) || {};
      return `<button class="fbtn" onclick="startDrawZone('poly','${id}')">
        <span class="fic">${q.icon || '＋'}</span>
        <span><b>${esc(q.name || id)}</b><small>${esc(FORGOT[id])}</small></span>
        <span class="fdb">${q.spl} dB</span></button>`;
    }).join('')}</div>
    <small class="fnote">לחיצה פותחת סימון על התכנית — הייעוד כבר מוגדר, רק לסמן איפה.</small>
  </div>`;
}
function drawHint() {
  return DRAW.on === 'poly'
    ? `<div class="note">✏️ <b>נקר את פינות האזור</b> — לחיצה על כל פינה, ולסיום לחיצה על הנקודה הראשונה (או דאבל-קליק).
        ${DRAW.pts.length ? '<b>' + DRAW.pts.length + ' פינות סומנו.</b> ' : ''}⌫ מבטל פינה · Esc לביטול.<br>
        <small>אחרי הסיום אפשר לעגל צלעות ולהוסיף פינות — לכל צורה, גם עגולה.</small></div>`
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
  /* ברירת מחדל להתקנה לפי אופי המקום: שירותים ומסדרון הם כמעט תמיד תקרת גבס
     עם רמקול שקוע · רחבה ובמה תמיד על הקיר, בגלל העוצמה */
  if (S.zones[i].mount == null) S.zones[i].mount = (pid === 'toilets' || pid === 'entry') ? 'ceil' : 'wall';
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
/* כשהתקציב נמוך מכל שלוש האפשרויות — בונים אפשרות מקוצצת, שלב אחרי שלב,
   עד שנכנסים לתקציב או עד שמגיעים למינימום הטכני שאי אפשר לרדת מתחתיו */
function fitTier(cut) {
  const base = LITE_CATALOG.tiers[LITE_CATALOG.tiers.length - 1];
  return Object.assign({}, base, { id: 'fit', name: 'מותאם לתקציב', cut });
}
function fitInfo(budget) {
  if (!budget) return null;
  const base = buildProposal(LITE_CATALOG.tiers[LITE_CATALOG.tiers.length - 1]);
  for (let cut = 1; cut <= 3; cut++) {
    const p = buildProposal(fitTier(cut));
    if (p.total <= budget * 1.05) return { p, cut, base, floor: false };
    if (cut === 3) return { p, cut, base, floor: true, gap: p.total - budget };
  }
  return null;
}
function cutSummary(base, p) {
  const out = [];
  if (p.totalSpk !== base.totalSpk) out.push(`רמקולים ${base.totalSpk} → <b>${p.totalSpk}</b>`);
  if (p.totalSub !== base.totalSub) out.push(p.totalSub ? `סאבים ${base.totalSub} → <b>${p.totalSub}</b>` : 'בלי סאב');
  if (p.ampN !== base.ampN) out.push(`מגברים ${base.ampN} → <b>${p.ampN}</b>`);
  if (p.lines !== base.lines) out.push(`קווי רמקול ${base.lines} → <b>${p.lines}</b>`);
  if (p.tier.cut === 2 && S.zones.length > 1) out.push('אזורים בעוצמה דומה על ויסות משותף');
  if (p.tier.cut >= 3 && S.zones.length > 1) out.push('ויסות אחד לכל המקום');
  if (p.tier.cut >= 3) out.push('בלי ארון — המגבר על מדף');
  if (S.sameContent === false && srcCount() > 1) out.push('בלי מעבד ניתוב תוכן');
  return out;
}

function stepBudget() {
  const props = LITE_CATALOG.tiers.map(buildProposal);
  const lo = Math.min(...props.map(p => p.total)), hi = Math.max(...props.map(p => p.total));
  if (S.budget == null) S.budget = Math.round(props[1].total / 1000) * 1000;
  const belowAll = S.budget && props.every(p => p.total > S.budget * 1.05);
  const fit = belowAll ? fitInfo(S.budget) : null;
  return `<h2>מה התקציב שלך?</h2>
  <p class="sub">נראה לך מה אפשר לקבל בכל טווח. המחירים לפני מע"מ וכוללים ציוד, כבילה והתקנה.</p>
  <div class="budget">
    <div class="bignum">${ils(S.budget)}</div>
    <input type="range" min="${Math.floor(lo * 0.6 / 1000) * 1000}" max="${Math.ceil(hi * 1.4 / 1000) * 1000}" step="1000" value="${S.budget}" oninput="S.budget=+this.value;save();render()">
    <div class="brange"><span>${ils(lo * 0.6)}</span><span>${ils(hi * 1.4)}</span></div>
  </div>
  <div class="fit">${props.map(p => {
    const fits = p.total <= S.budget * 1.05;
    return `<div class="fitcard2 ${fits ? 'ok' : 'over'}">
      <div class="f2head">
        <div><b>${esc(p.tier.name)}</b> <span class="brand">${esc(p.tier.brand)}</span></div>
        <div class="f2amt">${ils(p.total)}<small>${fits ? '✓ בתקציב' : 'מעל התקציב ב-' + ils(p.total - S.budget)}</small></div>
      </div>
      <div class="f2body">
        <ul>${mainLines(p).map(l => `<li><b>${l.qty}×</b> ${esc(l.name)}<span>${ils(l.total)}</span></li>`).join('')}</ul>
        <ul class="f2side">
          <li>תשתית וכבילה<span>${ils(p.rows.filter(r => r.note === 'תשתית').reduce((s2, r) => s2 + r.total, 0))}</span></li>
          <li>התקנה וכיוונון<span>${ils(p.install)}</span></li>
          <li class="f2sum">סה"כ<span>${ils(p.total)}</span></li>
        </ul>
      </div>
      <div class="f2foot">${p.totalSpk} רמקולים · ${p.totalSub ? p.totalSub + '× סאב ' + p.sub.inch + '"' : 'בלי סאב'} ·
        ${p.ampN}× ${esc(p.amp.name.slice(0, 22))} · ${Math.round(p.zones.reduce((s2, z) => s2 + z.p.capability, 0) / Math.max(1, p.zones.length))} dB יכולת</div>
    </div>`;
  }).join('')}</div>
  ${belowAll ? fitRowHTML(fit) : ''}
  ${finishHTML(props)}
  <div class="note">💡 אפשר להמשיך גם אם משהו מעל התקציב — בשלב הבא נראה בדיוק מה ההבדל בין האפשרויות.</div>`;
}
/* שורות הציוד העיקריות — רמקולים, סאבים והגברה, מקובצות לפי פריט */
function mainLines(p) {
  return p.rows.filter(r => ['רמקולים', 'סאבים', 'הגברה'].includes(r.note));
}
/* איך זה צריך להיראות — שאלה מסחרית כמו התקציב, ולכן היא יושבת לידו */
function finishHTML(props) {
  const list = finishChoices();
  if (!list.length) return '';
  const cur = S.finish || FIN_ANY;
  /* מחשבים את ההפרש בפועל על השכבה המומלצת */
  const before = S.finish; 
  const delta = f => {
    S.finish = f; const p = buildProposal(LITE_CATALOG.tiers[1]); S.finish = before;
    return p.total;
  };
  const baseTotal = delta(FIN_ANY);
  return `<div class="finish">
    <b>🎨 איך זה צריך להיראות?</b>
    <small>אותו רמקול בדיוק, גימור אחר. ההפרש מחושב על האפשרות האמצעית ומתעדכן בכל ההצעות.</small>
    <div class="fchips">
      <button class="chip ${cur === FIN_ANY ? 'on' : ''}" onclick="setFinish('${FIN_ANY}')">מה שמתאים ביותר</button>
      ${list.map(f => {
        const t = delta(f), d = t - baseTotal;
        return `<button class="chip ${cur === f ? 'on' : ''}" onclick="setFinish('${f}')"><span class="sw" style="background:${FIN_COL[f] || '#ccc'}"></span>${f}
          <span class="fd ${d > 0 ? 'up' : d < 0 ? 'down' : ''}">${d === 0 ? 'ללא תוספת' : (d > 0 ? '+' : '−') + ils(Math.abs(d)).replace('₪', '₪')}</span></button>`;
      }).join('')}
    </div>
    ${cur !== FIN_ANY ? `<small class="fnote">אם דגם מסוים לא קיים ב${cur} — הוא יישאר בגימור הרגיל שלו, ולא נחליף אותו לדגם אחר.</small>` : ''}
  </div>`;
}
function fitRowHTML(fit) {
  if (!fit) return '';
  const cuts = cutSummary(fit.base, fit.p);
  return `<div class="fitcard ${fit.floor ? 'floor' : ''}">
    <div class="fchead">
      <b>${fit.floor ? '⛔ זה המינימום הטכני' : '✂️ אפשרות מותאמת לתקציב שלך'}</b>
      <span class="amt">${ils(fit.p.total)}</span>
    </div>
    <p>${fit.floor
      ? `גם אחרי כל הקיצוצים אי אפשר לרדת מתחת ל-<b>${ils(fit.p.total)}</b> — חסרים ${ils(fit.gap)}.
         מתחת לזה כבר לא נשארת מערכת שעובדת: אין מספיק נקודות כדי לכסות את השטח,
         והמגבר לא יחזיק את הרמקולים. אפשר להקטין את האזורים או להעלות את התקציב.`
      : `כדי להיכנס ל-${ils(S.budget)} ויתרנו על חלק מהדברים. זה עדיין פתרון עובד — אבל עם פחות עתודה.`}</p>
    ${cuts.length ? `<div class="cutlist">${cuts.map(c => `<span>${c}</span>`).join('')}</div>` : ''}
    ${fit.floor ? '' : `<button class="ghost wide" onclick="pickTier('budget',${fit.cut})">בחר את האפשרות המותאמת ◀</button>`}
  </div>`;
}

/* שלב 6 — שלוש ההצעות */
function selTier() {
  const t = LITE_CATALOG.tiers.find(x => x.id === S.tier) || LITE_CATALOG.tiers[1];
  return S.cut ? Object.assign({}, t, { cut: S.cut, name: t.name + ' · מותאם לתקציב' }) : t;
}
function stepOffers() {
  const props = LITE_CATALOG.tiers.map(buildProposal);
  const belowAll = S.budget && props.every(p => p.total > S.budget * 1.05);
  const fit = belowAll ? fitInfo(S.budget) : null;
  const list = fit && !fit.floor ? props.concat([fit.p]) : props;
  return `<h2>${list.length > 3 ? 'ארבע דרכים לעשות את זה' : 'שלוש דרכים לעשות את זה'}</h2>
  <p class="sub">אותה תכנית, אותו כיסוי — רמות ציוד שונות. כל המחירים הם מחירי יחידה מהמלאי שלנו, לפני מע"מ.</p>
  ${fit && fit.floor ? fitRowHTML(fit) : ''}
  <div class="offers">${list.map((p, i) => {
    const isFit = p.tier.id === 'fit';
    const fits = S.budget ? p.total <= S.budget * 1.05 : true;
    const spl = p.zones.length ? Math.round(p.zones.reduce((s, z) => s + z.p.splCenter, 0) / p.zones.length) : 0;
    return `<div class="offer ${(isFit ? S.cut > 0 : S.tier === p.tier.id && !S.cut) ? 'sel' : ''} ${i === 1 ? 'reco' : ''} ${isFit ? 'fitoffer' : ''}">
      ${i === 1 ? '<div class="ribbon">הכי נבחר</div>' : ''}
      ${isFit ? '<div class="ribbon fitrib">בתקציב שלך</div>' : ''}
      <div class="oh"><b>${esc(p.tier.name)}</b><small>${isFit ? 'מקוצץ כדי להיכנס ל-' + ils(S.budget) : esc(p.tier.brand)}</small></div>
      <div class="price">${ils(p.total)}<small>כולל ציוד + התקנה, לפני מע"מ</small></div>
      <p class="why">${isFit ? 'הכי הרבה שאפשר לקבל בתקציב הזה — ' + cutSummary(fit.base, p).join(' · ').replace(/<\/?b>/g, '') : esc(p.tier.why)}</p>
      <div class="specs">
        <div><b>${p.totalSpk}</b><small>רמקולים</small></div>
        <div><b>${p.totalSub ? p.totalSub + '×' + p.sub.inch + '"' : '—'}</b><small>סאבים</small></div>
        <div><b>${spl}</b><small>dB יכולת</small></div>
      </div>
      <div class="ampline">🎚 ${p.ampN}× ${esc(p.amp.name.slice(0, 26))} · ${p.perCh} רמקולים לערוץ · ניצול ${p.util}%
        <br><b style="color:${p.pwrOk ? '#0f6e56' : '#c1121f'}">×${p.pwrRatio} הספק מגבר מול הרמקולים</b> — היעד ×2, מרווח לפסגות בלי קליפ
</div>
      ${S.finish && S.finish !== FIN_ANY ? `<div class="finline">🎨 גימור ${esc(S.finish)}${p.rows.some(r => (r.name || '').endsWith('· ' + S.finish)) ? '' : ' — לדגם הזה אין גימור כזה, נשאר במקורי'}</div>` : ''}
      <div class="prods">${prodCards(p)}</div>
      <details class="incl"><summary>מה כלול בדיוק — ${p.rows.length} פריטי ציוד + ${p.inst.length} שורות התקנה</summary>
        <table class="inclt"><tr><th>ציוד</th><th>כמות</th><th>סה"כ</th></tr>
          ${p.rows.map(r => `<tr><td>${esc(r.name)}</td><td>${r.qty}</td><td>${ils(r.total)}</td></tr>`).join('')}
          <tr class="sub2"><td>סה"כ ציוד</td><td></td><td>${ils(p.equip)}</td></tr>
        </table>
        <table class="inclt"><tr><th>התקנה ותשתית</th><th>כמות</th><th>מחיר</th><th>סה"כ</th></tr>
          ${p.inst.map(r => `<tr><td>${esc(r.label)}</td><td>${r.qty} ${esc(r.unit)}</td>
            <td>${editableInst(p.tier.id, r)}</td><td>${ils(r.total)}</td></tr>`).join('')}
          <tr class="sub2"><td>סה"כ התקנה</td><td></td><td></td><td>${ils(p.install)}</td></tr>
        </table>
        <div class="wact"><button class="ghost sm" onclick="resetInst()">↺ אפס מחירי התקנה</button>
          <span class="hintline">אפשר לשנות כל מחיר התקנה — הסכומים והדוח מתעדכנים מיד.</span></div>
      </details>
      <div class="badges">${fits ? '<span class="b ok">✓ בתקציב</span>' : '<span class="b over">מעל התקציב</span>'}
        <span class="b">${p.days} ימי התקנה</span>
        <span class="b">${stockNote(p)}</span></div>
      <button class="go wide" onclick="pickTier('${isFit ? LITE_CATALOG.tiers[LITE_CATALOG.tiers.length - 1].id : p.tier.id}'${isFit ? ',' + fit.cut : ''})">${(isFit ? S.cut > 0 : S.tier === p.tier.id && !S.cut) ? '✓ נבחר' : 'בחר את זה'}</button>
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
/* מחירי ההתקנה ניתנים לעריכה — נשמרים לכל שכבה בנפרד */
function editableInst(tierId, r) {
  return `<input class="instin" type="number" min="0" step="5" value="${r.price}"
    onchange="setInstPrice('${r.k}',this.value)">`;
}
function setInstPrice(k, v) {
  S.instPrice = S.instPrice || {};
  S.instPrice[k] = Math.max(0, +v || 0);
  save(); render(); toast('מחיר ההתקנה עודכן');
}
function resetInst() { S.instPrice = {}; save(); render(); toast('↺ מחירי ההתקנה חזרו לברירת המחדל'); }
function pickTier(id, cut) { S.tier = id; S.cut = cut || 0; save(); render(); go(6); }

/* ---------- שלב 7 — הדוח ---------- */
/* מיקומי הרמקולים בפועל: פריסה שווה סביב היקף האזור, מכוונים פנימה */
/* ---------- גאומטריית אזור: מלבן או פוליגון חופשי (כמו באפליקציה המקצועית) ---------- */
/* צלע יכולה להיות ישרה או מעוגלת: b = גובה הקשת ביחס לאורך הצלע (0 = ישר).
   כל החישובים עובדים על קו המתאר המדגם — כך שעיגולים נספרים באמת. */
function segCtrl(p1, p2, b) {
  const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
  if (!b) return { x: mx, y: my };
  const dx = p2.x - p1.x, dy = p2.y - p1.y, len = Math.hypot(dx, dy) || 1;
  /* נקודת הבקרה מוסטת בניצב — ×2 כי בבזייה ריבועית הקשת מגיעה לחצי מהמרחק */
  return { x: mx - dy / len * b * len * 2, y: my + dx / len * b * len * 2 };
}
function zoneOutline(z, steps) {
  if (!z.poly || z.poly.length < 3) {
    return [{ x: z.x, y: z.y }, { x: z.x + z.w, y: z.y }, { x: z.x + z.w, y: z.y + z.h }, { x: z.x, y: z.y + z.h }];
  }
  const n = steps || 14, out = [];
  for (let i = 0; i < z.poly.length; i++) {
    const p1 = z.poly[i], p2 = z.poly[(i + 1) % z.poly.length];
    if (!p1.b) { out.push({ x: p1.x, y: p1.y }); continue; }
    const c = segCtrl(p1, p2, p1.b);
    for (let t = 0; t < 1; t += 1 / n) {
      const u = 1 - t;
      out.push({ x: u * u * p1.x + 2 * u * t * c.x + t * t * p2.x, y: u * u * p1.y + 2 * u * t * c.y + t * t * p2.y });
    }
  }
  return out;
}
function zoneBox(z) {
  if (!z.poly || z.poly.length < 3) return { x: z.x, y: z.y, w: z.w, h: z.h };
  const o = zoneOutline(z);
  const xs = o.map(p => p.x), ys = o.map(p => p.y);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(1, Math.max(...xs) - x), h: Math.max(1, Math.max(...ys) - y) };
}
/* שטח אמיתי — נוסחת השרוכים לפוליגון, מלבן פשוט אחרת */
function zoneAreaPx(z) {
  if (!z.poly || z.poly.length < 3) return z.w * z.h;
  const o = zoneOutline(z);
  let a = 0;
  for (let i = 0; i < o.length; i++) { const p1 = o[i], p2 = o[(i + 1) % o.length]; a += p1.x * p2.y - p2.x * p1.y; }
  return Math.abs(a) / 2;
}
function zonePerimPx(z) {
  if (!z.poly || z.poly.length < 3) return 2 * (z.w + z.h);
  const o = zoneOutline(z);
  let l = 0;
  for (let i = 0; i < o.length; i++) { const p1 = o[i], p2 = o[(i + 1) % o.length]; l += Math.hypot(p2.x - p1.x, p2.y - p1.y); }
  return l;
}
function zoneCenter(z) {
  if (!z.poly || z.poly.length < 3) return { x: z.x + z.w / 2, y: z.y + z.h / 2 };
  const o = zoneOutline(z);
  return { x: o.reduce((s2, p) => s2 + p.x, 0) / o.length, y: o.reduce((s2, p) => s2 + p.y, 0) / o.length };
}
function zonePath(z) {
  if (!z.poly || z.poly.length < 3) return `M${z.x} ${z.y} H${z.x + z.w} V${z.y + z.h} H${z.x} Z`;
  let d = `M${z.poly[0].x.toFixed(1)} ${z.poly[0].y.toFixed(1)}`;
  for (let i = 0; i < z.poly.length; i++) {
    const p1 = z.poly[i], p2 = z.poly[(i + 1) % z.poly.length];
    if (p1.b) { const c = segCtrl(p1, p2, p1.b); d += ` Q${c.x.toFixed(1)} ${c.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`; }
    else d += ` L${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d + ' Z';
}
/* מיקומי הרמקולים נשמרים ברגע שההצעה נבחרת — ומאותו רגע ניתנים לגרירה ידנית */
function layoutKey(z, n, subs) { return z.id + '|' + n + '|' + subs + '|' + (z.mount || 'wall'); }
function ensureLayout(prop) {
  S.layout = S.layout || {};
  /* ניקוי זוויות פגומות משמירות ישנות */
  Object.values(S.layout).forEach(l => (l && l.spk || []).forEach(pt => {
    if (pt.aim != null && !isFinite(pt.aim)) delete pt.aim;
  }));
  prop.zones.forEach(({ z, p }) => {
    const k = layoutKey(z, p.n, p.subs);
    if (!S.layout[z.id] || S.layout[z.id].key !== k) {
      S.layout[z.id] = { key: k, spk: speakerPts(z, p.n, p), subs: subPts(z, p.subs) };
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
function speakerPts(z, n, plan) {
  const c = zoneCenter(z), pts = [];
  /* שקוע בתקרה — רשת אחידה על פני האזור, פנים כלפי מטה */
  if (z.mount === 'ceil') {
    const b = zoneBox(z);
    const cols = (plan && plan.grid && plan.grid.cols) || Math.max(1, Math.round(Math.sqrt(n * b.w / Math.max(1, b.h))));
    const rows = (plan && plan.grid && plan.grid.rows) || Math.max(1, Math.ceil(n / cols));
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
      if (pts.length >= n) break;
      pts.push({ x: b.x + b.w * (k + 0.5) / cols, y: b.y + b.h * (r + 0.5) / rows, aim: -1 });
    }
    return pts;
  }
  if (z.poly && z.poly.length >= 3) {
    /* פריסה שווה לאורך קו המתאר (כולל קשתות), כל רמקול מוסט מעט פנימה אל המרכז */
    const out = zoneOutline(z);
    const per = zonePerimPx(z), step = per / n;
    let target = step / 2, walked = 0, i = 0;
    for (let k = 0; k < n; k++) {
      while (i < out.length) {
        const p1 = out[i], p2 = out[(i + 1) % out.length];
        const seg = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        if (walked + seg >= target || i === out.length - 1) {
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
/* סולם קבוע: כחול = חלש · ירוק = מאוזן · כתום/אדום = חזק */
const BANDCOL = ['#2f6fed', '#22a6c3', '#2fbf71', '#c8d32a', '#f2a33c', '#ef6b3a', '#d7263d'];
function coverageSVG(prop, w, h) {
  calibrateLevels(prop);
  const step = Math.max(18, Math.round(w / 46));
  let out = '', min = 999, max = 0;
  const spk = [];
  const L = S.layout || {};
  prop.zones.forEach(({ z, p }) => ((L[z.id] && L[z.id].spk) || speakerPts(z, p.n)).forEach(pt => spk.push({ pt, p })));
  if (!spk.length || !S.scale) return { svg: '', min: 0, max: 0 };
  const cells = [];
  for (let y = step / 2; y < h; y += step) for (let x = step / 2; x < w; x += step) {
    let e = 0;
    for (const { pt, p } of spk) e += Math.pow(10, splAt(p.spk, p.needW || p.wPer, ear({ x, y }, pt, p.dz)) / 10);
    const db = 10 * Math.log10(Math.max(1e-9, e));
    cells.push({ x, y, db });
    if (db < min) min = db; if (db > max) max = db;
  }
  const lo = Math.max(45, min), hi = Math.max(lo + 6, max);
  /* מדרגות של 3 dB עם צבעים נבדלים — קל לראות איפה חזק ואיפה נופל */
  const bandDb = 3, bands = Math.min(7, Math.max(3, Math.ceil((hi - lo) / bandDb)));
  const stepDb = (hi - lo) / bands;
  const band = c => Math.max(0, Math.min(bands - 1, Math.floor((c.db - lo) / stepDb)));
  const byXY = {};
  cells.forEach(c => { byXY[c.x + '|' + c.y] = band(c); });
  let lines = '';
  cells.forEach(c => {
    const bi = band(c), x0 = c.x - step / 2, y0 = c.y - step / 2;
    out += `<rect x="${x0.toFixed(1)}" y="${y0.toFixed(1)}" width="${step}" height="${step}" fill="${BANDCOL[bi]}" opacity="0.5"/>`;
    /* קו מתאר בין מדרגות עוצמה — ההבדל בין 3 dB נראה לעין */
    const left = byXY[(c.x - step) + '|' + c.y], up = byXY[c.x + '|' + (c.y - step)];
    if (left != null && left !== bi) lines += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x0.toFixed(1)}" y2="${(y0 + step).toFixed(1)}" stroke="#ffffff" stroke-width="2.5" opacity="0.75"/>`;
    if (up != null && up !== bi) lines += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${(x0 + step).toFixed(1)}" y2="${y0.toFixed(1)}" stroke="#ffffff" stroke-width="2.5" opacity="0.75"/>`;
  });
  out += lines;
  const legend = [];
  for (let i = 0; i < bands; i++) legend.push({ col: BANDCOL[i], from: Math.round(lo + i * stepDb), to: Math.round(lo + (i + 1) * stepDb) });
  return { svg: out, min: Math.round(lo), max: Math.round(hi), legend };
}
/* אייקונים ברורים: רמקול קיר עם כיוון הפנייה, רמקול שקוע, סאב וארון */
function coneSVG(pt, aim, ang, col, len) {
  if (aim == null || aim < 0) return `<circle cx="${pt.x.toFixed(0)}" cy="${pt.y.toFixed(0)}" r="${len.toFixed(0)}" fill="${col}" opacity="0.10"/>`;
  const a0 = (aim - ang / 2) * Math.PI / 180, a1 = (aim + ang / 2) * Math.PI / 180;
  const x0 = pt.x + Math.cos(a0) * len, y0 = pt.y + Math.sin(a0) * len;
  const x1 = pt.x + Math.cos(a1) * len, y1 = pt.y + Math.sin(a1) * len;
  return `<path d="M${pt.x.toFixed(0)} ${pt.y.toFixed(0)} L${x0.toFixed(0)} ${y0.toFixed(0)} A${len.toFixed(0)} ${len.toFixed(0)} 0 ${ang > 180 ? 1 : 0} 1 ${x1.toFixed(0)} ${y1.toFixed(0)} Z" fill="${col}" opacity="0.13"/>`;
}
function spkIcon(pt, col, label, aim, onCeil) {
  const x = pt.x, y = pt.y;
  if (onCeil) {
    /* שקוע בתקרה — עיגול עם גריל */
    return `<g><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="19" fill="#fff" stroke="${col}" stroke-width="4"/>
      <circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="11" fill="none" stroke="${col}" stroke-width="2.5" opacity="0.65"/>
      <circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="4" fill="${col}"/>
      <text x="${(x + 26).toFixed(0)}" y="${(y + 7).toFixed(0)}" font-size="18" font-weight="800" fill="${col}">${label}</text></g>`;
  }
  /* רמקול על קיר — תיבה מסובבת לכיוון הכיסוי, עם ווּפר וטוויטר */
  const rot = aim == null || aim < 0 ? 0 : aim;
  return `<g transform="translate(${x.toFixed(0)},${y.toFixed(0)}) rotate(${rot})">
    <rect x="-13" y="-17" width="30" height="34" rx="5" fill="#fff" stroke="${col}" stroke-width="4"/>
    <circle cx="0" cy="4" r="8" fill="none" stroke="${col}" stroke-width="3"/>
    <circle cx="0" cy="4" r="3" fill="${col}"/>
    <circle cx="0" cy="-10" r="3.6" fill="none" stroke="${col}" stroke-width="2.5"/>
    <path d="M17 -9 L26 -15 L26 15 L17 9 Z" fill="${col}" opacity="0.5"/>
    <g transform="rotate(${-rot})"><text x="0" y="-24" text-anchor="middle" font-size="18" font-weight="800" fill="${col}">${label}</text></g></g>`;
}
function subIcon(pt, col, label) {
  const x = pt.x, y = pt.y;
  return `<g><rect x="${(x - 24).toFixed(0)}" y="${(y - 24).toFixed(0)}" width="48" height="48" rx="7" fill="#fff" stroke="${col}" stroke-width="4"/>
    <circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="15" fill="none" stroke="${col}" stroke-width="3"/>
    <circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="6" fill="${col}"/>
    <text x="${x.toFixed(0)}" y="${(y + 40).toFixed(0)}" text-anchor="middle" font-size="16" font-weight="800" fill="${col}">SUB ${label}</text></g>`;
}
function rackIcon(pt) {
  const x = pt.x, y = pt.y;
  return `<g><rect x="${(x - 30).toFixed(0)}" y="${(y - 34).toFixed(0)}" width="60" height="68" rx="7" fill="#141821" stroke="#fff" stroke-width="3"/>
    ${[0, 1, 2].map(i => `<rect x="${(x - 22).toFixed(0)}" y="${(y - 25 + i * 17).toFixed(0)}" width="44" height="12" rx="2.5" fill="none" stroke="#8ea0b5" stroke-width="2.5"/>`).join('')}
    <text x="${x.toFixed(0)}" y="${(y + 50).toFixed(0)}" text-anchor="middle" font-size="17" font-weight="800" fill="#141821">ארון ציוד</text></g>`;
}

/* מרחק אמיתי מהאוזן: מרחק בתכנית + הפרש הגובה בין הרמקול לאוזן */
function ear(pt, sp, dz) {
  const d = Math.hypot(pt.x - sp.x, pt.y - sp.y) * (S.scale || 0.02);
  return Math.max(0.8, Math.hypot(d, dz || 1.4));
}
/* בדיקה אם נקודה בתוך מתאר האזור (ray casting) */
function inZone(z, pt) {
  const out = zoneOutline(z);
  let inside = false;
  for (let i = 0, j = out.length - 1; i < out.length; j = i++) {
    const a = out[i], b = out[j];
    if ((a.y > pt.y) !== (b.y > pt.y) && pt.x < (b.x - a.x) * (pt.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
/* דגימת נקודות בתוך האזור — עליהן מכיילים את העוצמה */
function zoneSamples(z, n) {
  const b = zoneBox(z), out = [], k = Math.max(3, Math.round(Math.sqrt(n || 25)));
  for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) {
    const pt = { x: b.x + b.w * (i + 0.5) / k, y: b.y + b.h * (j + 0.5) / k };
    if (inZone(z, pt)) out.push(pt);
  }
  return out.length ? out : [zoneCenter(z)];
}
/* כיול עוצמה אמיתי: לכל אזור נקבע ההספק שבו ה*ממוצע* בשטח שווה ליעד —
   ולא חישוב תיאורטי לפי מרחק ממוצע. מכאן מפת החום והמיקרופון מדויקים */
function calibrateLevels(prop) {
  const L = S.layout || {};
  prop.zones.forEach(({ z, p }) => {
    const spk = (L[z.id] && L[z.id].spk) || [];
    if (!spk.length || !S.scale) return;
    const pts = zoneSamples(z, 25);
    let sum = 0;
    pts.forEach(pt => {
      let e = 0;
      spk.forEach(sp => { e += Math.pow(10, splAt(p.spk, 1, ear(pt, sp, p.dz)) / 10); });   /* ייחוס: 1W */
      sum += e;
    });
    const avg1W = 10 * Math.log10(Math.max(1e-9, sum / pts.length));
    const need = Math.pow(10, (z.spl - avg1W) / 10);
    p.needW = Math.max(0.02, Math.min(p.wPer, need));
    p.avgAt1W = avg1W;
    p.clipped = need > p.wPer;                                /* אין מספיק הספק להגיע ליעד */
  });
}

/* העוצמה בנקודה מסוימת בתכנית — סכום אנרגטי של כל הרמקולים */
function splAtPoint(prop, pt) {
  const L = S.layout || {};
  let e = 0;
  prop.zones.forEach(({ z, p }) => ((L[z.id] && L[z.id].spk) || []).forEach(sp => {
    e += Math.pow(10, splAt(p.spk, p.needW || p.wPer, ear(pt, sp, p.dz)) / 10);
  }));
  return e > 0 ? 10 * Math.log10(e) : 0;
}
function stepReport() {
  const tier = selTier();
  const p = buildProposal(tier);
  const w = S.planW, h = S.planH || 900;
  const cov = coverageSVG(p, w, h);
  const L = ensureLayout(p);
  calibrateLevels(p);
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
  marks += rackIcon(rk);
  p.zones.forEach(({ z, p: pz }) => {
    const col = purposeOf(z).color;
    const zb = zoneBox(z);
    marks += `<path d="${zonePath(z)}" fill="none" stroke="${col}" stroke-width="3" stroke-dasharray="9 6" stroke-linejoin="round"/>
      <text x="${zb.x + 12}" y="${zb.y + 32}" font-size="24" font-weight="800" fill="${col}">${purposeOf(z).icon} ${esc(z.name)} · ${pz.n} רמקולים</text>`;
    /* חרוט הכיסוי מצויר לפי זווית הפתיחה של הרמקול ומרחק ההגעה */
    const reach = pz.spacing / (S.scale || 0.02) * (pz.onCeil ? 0.75 : 1.6);
    (L[z.id].spk || []).forEach((pt, i) => {
      marks += coneSVG(pt, pz.onCeil ? -1 : pt.aim, pz.spk.h || 90, col, reach);
    });
    (L[z.id].spk || []).forEach((pt, i) => {
      marks += `<g data-sp="${z.id}|${i}" style="cursor:grab">${spkIcon(pt, col, i + 1, pt.aim, pz.onCeil)}</g>`;
      /* ידית סיבוב — גוררים אותה כדי לכוון את הרמקול בדיוק לאן שצריך */
      if (!pz.onCeil) {
        const a = (pt.aim == null || pt.aim < 0 ? 0 : pt.aim) * Math.PI / 180, rr = 52;
        const hx = pt.x + Math.cos(a) * rr, hy = pt.y + Math.sin(a) * rr;
        marks += `<g data-rot="${z.id}|${i}" style="cursor:alias">
          <line x1="${pt.x.toFixed(0)}" y1="${pt.y.toFixed(0)}" x2="${hx.toFixed(0)}" y2="${hy.toFixed(0)}" stroke="${col}" stroke-width="3" opacity="0.6"/>
          <circle cx="${hx.toFixed(0)}" cy="${hy.toFixed(0)}" r="12" fill="${col}" stroke="#fff" stroke-width="3"/>
          <path d="M${(hx - 5).toFixed(0)} ${(hy - 1).toFixed(0)} a5 5 0 1 1 2 4" fill="none" stroke="#fff" stroke-width="2.2"/>
          <title>גרור כדי לסובב את הרמקול</title></g>`;
      }
    });
    (L[z.id].subs || []).forEach((pt, i) => {
      marks += `<g data-sub="${z.id}|${i}" style="cursor:grab">${subIcon(pt, col, i + 1)}</g>`;
    });
  });
  /* מיקרופון מדידה אוטומטי במרכז כל אזור — מראה את העוצמה שתתקבל שם */
  p.zones.forEach(({ z, p: pz }) => {
    const c = zoneCenter(z), col = purposeOf(z).color;
    const db = splAtPoint(p, c);
    const okc = db >= z.spl ? '#0f6e56' : '#c1121f';
    marks += `<g class="micmark">
      <line x1="${c.x.toFixed(0)}" y1="${(c.y + 4).toFixed(0)}" x2="${c.x.toFixed(0)}" y2="${(c.y + 30).toFixed(0)}" stroke="#141821" stroke-width="4"/>
      <line x1="${(c.x - 12).toFixed(0)}" y1="${(c.y + 30).toFixed(0)}" x2="${(c.x + 12).toFixed(0)}" y2="${(c.y + 30).toFixed(0)}" stroke="#141821" stroke-width="4"/>
      <rect x="${(c.x - 8).toFixed(0)}" y="${(c.y - 22).toFixed(0)}" width="16" height="30" rx="8" fill="#141821"/>
      <rect x="${(c.x - 6).toFixed(0)}" y="${(c.y - 19).toFixed(0)}" width="12" height="14" rx="6" fill="none" stroke="#8ea0b5" stroke-width="2"/>
      <rect x="${(c.x + 14).toFixed(0)}" y="${(c.y - 24).toFixed(0)}" width="96" height="34" rx="8" fill="#fff" stroke="${okc}" stroke-width="3"/>
      <text x="${(c.x + 62).toFixed(0)}" y="${(c.y - 1).toFixed(0)}" text-anchor="middle" font-size="22" font-weight="900" fill="${okc}">${Math.round(db)} dB</text>
      <text x="${(c.x + 62).toFixed(0)}" y="${(c.y + 26).toFixed(0)}" text-anchor="middle" font-size="16" font-weight="700" fill="${col}">יעד ${z.spl}</text>
    </g>`;
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
      <svg viewBox="0 0 ${w} ${h}" style="${S.plan ? '' : 'position:relative;background:#f7f5f0;border-radius:10px;display:block;width:100%;height:auto;aspect-ratio:' + (w / h).toFixed(3)}">
        <defs><clipPath id="zclip">${S.zones.map(z => `<path d="${zonePath(z)}"/>`).join('')}</clipPath></defs>
        <g clip-path="url(#zclip)">${cov.svg}</g>${marks}</svg>
    </div></div>
    <div class="legend">
      <div class="scale">${(cov.legend || []).map(b => `<span class="sb" style="background:${b.col}">${b.from}–${b.to}</span>`).join('')}<b>dB</b></div>
      <span class="lgnote">🔊 תיבה עם ווּפר = רמקול על קיר, מסובבת לכיוון שהיא מכסה · ⬤ עיגול עם גריל = רמקול שקוע בתקרה ·
      הצללית סביבו = זווית הכיסוי בפועל · 🎙 המיקרופון במרכז כל אזור מראה את העוצמה שתתקבל שם מול היעד ·
      הארון השחור = ארון הציוד · הקו המקווקו = מסלול הכבל, והמספר עליו הוא מספר הקו בטבלת החיווט.</span></div>
  </div>
  <div class="rsec"><h3>🔊 מה מקבלים בכל אזור</h3>
    <table class="rt"><tr><th>אזור</th><th>שימוש</th><th>שטח</th><th>רמקולים</th><th>התקנה</th><th>עוצמת יעד</th><th>יכולת המערכת</th><th>מרווח</th></tr>
    ${p.zones.map(({ z, p: pz }) => `<tr><td><b>${esc(z.name)}</b></td><td>${purposeOf(z).icon} ${esc(purposeOf(z).name)}</td>
      <td>${Math.round(pz.area)} מ"ר</td><td>${pz.n}${pz.subs ? ' + ' + pz.subs + ' סאב' : ''}</td>
      <td>${pz.onCeil ? '⬤ שקוע בתקרת גבס · ' + (S.ceil).toFixed(1) + ' מ׳' : '🔊 על הקיר · ' + (S.ceil - 0.4).toFixed(1) + ' מ׳'}</td>
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
    <div class="wsec"><h5>ניתוב אות — מה מנגן איפה, וכמה ערוצי מגבר</h5>
      <table class="rt"><tr><th>אזור</th><th>מקור</th><th>רמקולים</th><th>ערוצי מגבר</th><th>עוצמת תכנון</th></tr>
        ${p.zones.map(({ z, p: pz }, i) => {
          const ch = Math.ceil(pz.n / p.perCh) + pz.subs;
          return `<tr><td>${esc(z.name)}</td>
            <td>${srcCount() > 1 ? 'מקור ' + srcIndex(z, i) : 'מקור יחיד'}</td>
            <td>${pz.n}${pz.subs ? ' + ' + pz.subs + ' סאב' : ''}</td>
            <td>${ch}</td><td>${z.spl} dB</td></tr>`;
        }).join('')}
        <tr class="tot"><td>סה"כ</td><td>${srcCount()} מקור${srcCount() > 1 ? 'ות' : ''}</td>
          <td>${p.totalSpk}${p.totalSub ? ' + ' + p.totalSub : ''}</td><td>${p.lines}</td><td></td></tr></table>
      <p>לכל אזור ערוץ (או ערוצים) משלו — כך אפשר להנמיך אזור אחד בלי לגעת באחרים.
      ${srcCount() > 1 ? 'המעבד מזין כל קבוצת מקור בנפרד, והמגבר מפצל לערוצים לפי אזור.' : 'מקור אחד מוזן לכל הערוצים, והעוצמה נשלטת בנפרד לכל אזור.'}</p></div>
    <div class="wsec"><h5>חשמל</h5>
      <p>• <b>${amps16}× מעגל 16A ייעודי</b> לארון (לא משותף עם תאורה או מטבח — רעש חשמלי פוגע בצליל).<br>
      • צריכת שיא מוערכת: <b>${ampW}W</b> · פס שקעים בארון.<br>
      • הארקה תקנית לארון — חובה.<br>
      • רצוי מפסק ייעודי מסומן "מערכת סאונד".</p></div>
    <div class="wsec"><h5>תשתית לצנרת</h5>
      <p>• שרוול <b>25 מ"מ</b> מהארון לכל עמדת רמקול (או תעלה משותפת + הסתעפויות).<br>
      • להימנע ממקבילות צמודות לכבלי חשמל — לפחות 30 ס"מ הפרדה או חצייה ב-90°.<br>
      • סה"כ כבל רמקול: <b>${totalM} מ׳</b> (${reels} גלילים של 100 מ׳) — כולל רזרבה של 25%.<br>
      • נקודת רמקול על קיר בגובה <b>${(S.ceil - 0.4).toFixed(1)} מ׳</b>, קופסה שקועה או יציאת כבל מהקיר.<br>
      ${p.zones.some(x => x.p.onCeil) ? `• באזורים עם רמקול שקוע: קצה כבל חופשי <b>50 ס"מ</b> מעל התקרה בכל נקודה,
        לפני סגירת הגבס. קוטר ניסור לפי היצרן — לוודא שאין מעליו תשתית מיזוג או ספרינקלר.<br>` : ''}
      • גובה התקנה למתקן על קיר: הרמקול מכוון פנימה ומטה אל אזור האוזניים.</p></div>
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
  const toPlan = e => {
    const el = document.querySelector('#report svg') || svg;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return { x: NaN, y: NaN };
    return { x: (e.clientX - r.left) / r.width * S.planW, y: (e.clientY - r.top) / r.height * (S.planH || 900) };
  };
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
  /* סיבוב רמקול: הזווית נקבעת מהכיוון של הגרירה סביב הרמקול */
  svg.querySelectorAll('[data-rot]').forEach(g => {
    g.addEventListener('pointerdown', e => {
      const [zid, idx] = g.dataset.rot.split('|');
      const pt = S.layout[zid] && S.layout[zid].spk[+idx]; if (!pt) return;
      e.preventDefault(); e.stopPropagation();
      const icon = svg.querySelector(`[data-sp="${zid}|${idx}"] > g`);
      const line = g.querySelector('line'), knob = g.querySelector('circle');
      const mv = ev => {
        const p2 = toPlan(ev);
        const ang = Math.round((Math.atan2(p2.y - pt.y, p2.x - pt.x) * 180 / Math.PI + 360) % 360);
        if (!isFinite(ang)) return;                 /* מגן מפני מדידה על אלמנט שהוחלף */
        pt.aim = ang;
        /* עדכון מיידי בלי ציור מחדש של כל הדוח — הסיבוב מרגיש חלק */
        const a = pt.aim * Math.PI / 180, hx = pt.x + Math.cos(a) * 52, hy = pt.y + Math.sin(a) * 52;
        if (icon) icon.setAttribute('transform', `translate(${pt.x.toFixed(0)},${pt.y.toFixed(0)}) rotate(${pt.aim})`);
        if (line) { line.setAttribute('x2', hx.toFixed(0)); line.setAttribute('y2', hy.toFixed(0)); }
        if (knob) { knob.setAttribute('cx', hx.toFixed(0)); knob.setAttribute('cy', hy.toFixed(0)); }
      };
      const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); save(); render(); };
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    });
  });
}
function shareReport() {
  const tier = selTier();
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
    sameContent: true, cut: 0, finish: 'any', layout: {}, wireEdits: {}, instPrice: {} };
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
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && CROP.on) { cancelCrop(); return; }
  if (e.key === 'Escape' && DRAW.on) { DRAW.on = false; DRAW.from = DRAW.cur = null; DRAW.pts = []; render(); }
  /* ⌫ בזמן ציור — מבטל את הפינה האחרונה */
  if ((e.key === 'Backspace' || e.key === 'Delete') && DRAW.on === 'poly' && DRAW.pts.length
      && !/INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || '')) {
    e.preventDefault(); DRAW.pts.pop(); drawPlan();
    toast(DRAW.pts.length ? '↩ פינה בוטלה' : '↩ מתחילים מחדש');
  }
});
load(); render();
