/* ===================================================================================
   תכנון מערכת אוטומטי — פועל רק כשמבקשים "בנה מערכת" לאזור (או "בנה הכל" באשף).
   1. כמות טופים מגיאומטריית הכיסוי: מרווח = 2 × רדיוס כיסוי × מקדם חפיפה, כשהרדיוס
      נגזר מזווית הפיזור ומגובה ההתקנה מעל האוזן (תקרה/היקפי) או ממרחק ההשלכה (קיר),
      ומוגבל במרחק שבו ה-SPL של הרמקול עוד מגיע ליעד התכלית (שיאים = יעד + 10 dB).
   2. כמות סאבים ממאזן בס: כל טופ צורך 10^((SPL+רווח)/10) × כמות, סאב מספק 10^(SPL/10);
      הכמות = המקסימום בין הדרוש לאיזון לבין "סאב לכל 80 מ״ר" (הכלל הקיים לכיסוי).
   3. מיקום סאבים לאחידות: כמה תבניות מועמדות (פינות, אמצעי קירות, שורה לאורך הקיר
      הארוך, מערך מרכזי) נבדקות במפת בס פשוטה (מקור כל-כיווני, +3 dB ליד קיר, +6 בפינה)
      על דגימות בתוך האזור; נבחרת התבנית עם הפער הקטן ביותר בין הנקודה החזקה לחלשה.
   מה שלא ידוע נאמר: SPL שאין לו מקור מאומת מסומן "משוער" בהודעת הבנייה.
   =================================================================================== */
function sdGain(z) { const t = USAGE_SPL[z.usage] || 90; return t <= 85 ? 0 : t <= 95 ? 3 : t <= 100 ? 6 : t <= 110 ? 8 : 10; }
function sdSpl(name) { const d = spkData(name); return d && d.max ? { spl: d.max, known: true } : { spl: guessSpl(name), known: false }; }
/* מרווח בין טופים לפי כיסוי. mode: 'ring' | 'wall' | 'ceiling' */
function sdSpacing(z, spk, mode) {
  const ceil = z.ceil ?? P.room?.ceil ?? 3, ear = 1.2;
  const disp = Math.min(guessDisp(spk), 150);
  const factor = { edge: 1.0, min: 0.7, full: 0.5, sparse: 1.35 }[z._dens || 'edge'] || 1.0;
  const target = USAGE_SPL[z.usage] || 90, top = sdSpl(spk);
  /* המרחק המרבי שבו שיאי המוזיקה (יעד+10 dB) עוד נשמרים; +3 dB החזר חדר — אותו חשבון כמו בניתוח שבמטריצה */
  const reach = Math.pow(10, (top.spl + 3 - (target + 10)) / 20);
  let mount, covR, why, splLimited = false;
  if (mode === 'ceiling') {
    mount = Math.max(2.2, ceil - 0.4);
    const Heff = Math.max(0.6, mount - ear);
    covR = Heff * Math.tan(disp / 2 * Math.PI / 180);
    const floorReach = Math.sqrt(Math.max(0, reach * reach - Heff * Heff));
    if (floorReach < covR) { covR = Math.max(0.8, floorReach); splLimited = true; }
    why = `פיזור ${disp}° מגובה ${mount.toFixed(1)} מ׳ (${Heff.toFixed(1)} מ׳ מעל האוזן) → רדיוס ${covR.toFixed(1)} מ׳`;
  } else {
    mount = 2.6;
    const b = zoneBounds(z);
    const seg = mode === 'wall' ? zoneWallSeg(z) : null;
    const throwM = seg ? seg.throwPx * P.scale : Math.min(b.W, b.H) * P.scale / 2;
    let d = Math.max(1.5, throwM);
    if (reach < d) { d = Math.max(1.5, reach); splLimited = true; }
    covR = d * Math.tan(disp / 2 * Math.PI / 180);
    why = `פיזור אופקי ${disp}° במרחק השלכה ${d.toFixed(1)} מ׳ → רוחב כיסוי ${(2 * covR).toFixed(1)} מ׳`;
  }
  const spacingM = Math.max(2, Math.min(12, 2 * covR * factor));
  const warn = splLimited ? `⚠ ${spk.slice(0, 24)} מגיע לשיאי ${target + 10} dB עד ${reach.toFixed(1)} מ׳ בלבד${top.known ? '' : ' (SPL משוער)'} — המרווח צומצם בהתאם; שקול דגם חזק יותר ליעד ${target} dB` : '';
  return { spacingM, covR, mount, disp, why, reach, top, target, splLimited, warn };
}
/* כמות סאבים: מאזן בס מול הטופים שהוצבו + מינימום כיסוי לפי שטח */
function sdSubCount(z, tops, subName, areaM2) {
  const gain = sdGain(z);
  let demand = 0, unknown = false;
  tops.forEach(t => { const s = sdSpl(t.name); if (!s.known) unknown = true; demand += t.qty * Math.pow(10, (s.spl + gain) / 10); });
  const ss = sdSpl(subName); if (!ss.known) unknown = true;
  const supply1 = Math.pow(10, ss.spl / 10);
  const nBass = demand > 0 ? Math.max(1, Math.ceil(demand / supply1)) : 1;
  const nArea = Math.max(1, Math.round(areaM2 / 80));
  const n = Math.max(nBass, nArea);
  const margin = demand > 0 ? 10 * Math.log10(n * supply1 / demand) : null;
  const eq = demand / supply1;
  return { n, nBass, nArea, gain, margin, unknown, subSpl: ss.spl, eq,
    why: `דרישת בס ${eq.toFixed(2)} סאבים (רווח +${gain} dB${unknown ? ', SPL משוער' : ''})${nArea > nBass ? ' · לפי שטח ' + nArea : ''} → ${n}` };
}
/* רווח גבול לסאב: קרוב לקיר אחד +3, לפינה +6 */
function sdBoundaryGain(z, p, m) {
  const b = zoneBounds(z), near = 1.2 * m;
  let walls = 0;
  if (p.cx - b.L < near || b.L + b.W - p.cx < near) walls++;
  if (p.cy - b.T < near || b.T + b.H - p.cy < near) walls++;
  return walls >= 2 ? 6 : walls === 1 ? 3 : 0;
}
/* בחירת תבנית מיקום לסאבים לפי אחידות הבס באזור */
function sdSubLayout(z, n, subName, forced) {
  const m = 1 / P.scale, b = zoneBounds(z), inset = 0.8 * m, subSpl = sdSpl(subName).spl;
  const take = (arr, k) => { const out = []; for (let i = 0; i < k; i++) out.push(arr[i % arr.length]); return out; };
  const cx0 = b.L + b.W / 2, cy0 = b.T + b.H / 2;
  const corners = [[b.L + inset, b.T + inset], [b.L + b.W - inset, b.T + b.H - inset], [b.L + b.W - inset, b.T + inset], [b.L + inset, b.T + b.H - inset]];
  const mids = [[cx0, b.T + inset], [cx0, b.T + b.H - inset], [b.L + inset, cy0], [b.L + b.W - inset, cy0]];
  const longRow = []; for (let i = 0; i < n; i++) longRow.push(b.W >= b.H ? [b.L + b.W * (i + 0.5) / n, b.T + inset] : [b.L + inset, b.T + b.H * (i + 0.5) / n]);
  const center = []; for (let i = 0; i < n; i++) { const a = i * 2 * Math.PI / Math.max(1, n); center.push([cx0 + Math.cos(a) * 0.7 * m * (n > 1 ? 1 : 0), cy0 + Math.sin(a) * 0.7 * m * (n > 1 ? 1 : 0)]); }
  const cands = [
    { key: 'corners', name: 'פינות (צימוד פינה)', pts: take(corners, n) },
    { key: 'mids', name: 'אמצעי הקירות', pts: take(mids, n) },
    { key: 'row', name: 'שורה לאורך הקיר הארוך', pts: longRow },
    { key: 'center', name: 'מערך מרכזי', pts: center },
  ].map(c => ({ ...c, pts: c.pts.map(p => ({ cx: p[0], cy: p[1] })).filter(p => inZone(z, { x: p.cx, y: p.cy })) })).filter(c => c.pts.length === n);
  if (!cands.length) return { best: { key: 'grid', name: 'פיזור אחיד', pts: zoneGridPts(z, Math.sqrt(zoneAreaM(z) / n) * m).slice(0, n), spread: null }, cands: [] };
  const samples = zoneGridPts(z, 1.5 * m);
  cands.forEach(c => {
    let mx = -1e9, mn = 1e9, sum = 0, cnt = 0;
    samples.forEach(s => {
      let e = 0, tooClose = false;
      c.pts.forEach(p => { const d = Math.hypot(s.cx - p.cx, s.cy - p.cy) * P.scale; if (d < 1) tooClose = true; e += Math.pow(10, (subSpl + sdBoundaryGain(z, p, m) - 20 * Math.log10(Math.max(1, d))) / 10); });
      if (tooClose || !e) return;
      const L = 10 * Math.log10(e); mx = Math.max(mx, L); mn = Math.min(mn, L); sum += L; cnt++;
    });
    c.spread = cnt ? mx - mn : 99; c.mean = cnt ? sum / cnt : 0;
  });
  cands.sort((a, b2) => a.spread - b2.spread);
  let best = cands[0];
  if (forced) best = cands.find(c => c.key === forced) || best;
  else { const corn = cands.find(c => c.key === 'corners'); if (corn && corn.spread - best.spread < 1) best = corn; } /* שוויון ~1 dB — פינות עדיפות בגלל הצימוד */
  return { best, cands };
}
/* הצבת הסאבים בתכנית לפי התבנית שנבחרה; מחזיר טקסט הסבר להודעת הבנייה */
function sdPlaceSubs(z, subName, cnt, sit, forced) {
  const lay = sdSubLayout(z, cnt.n, subName, forced);
  lay.best.pts.forEach((p, k) => P.nodes.push({ id: uid('n'), kind: 'point', name: subName + ' (' + (k + 1) + ')', sub: 'סאב · ' + lay.best.name + ' · ' + z.name, x: 2200 - p.cx - 20, y: p.cy - 24, srcIid: sit.iid, mini: true, mount: 'רצפה', hgt: 0, disp: 360, spl: sdSpl(subName).spl, aim: 0 }));
  sit.qty = cnt.n; sit.placed = cnt.n; sit.zones = { [z.name]: cnt.n }; sit.added = true;
  z._design = { ...(z._design || {}), sub: { n: cnt.n, nBass: cnt.nBass, nArea: cnt.nArea, gain: cnt.gain, margin: cnt.margin, layout: lay.best.name, spread: lay.best.spread, alts: lay.cands.map(c => c.name + ' ±' + (c.spread / 2).toFixed(1)) } };
  const alt = lay.cands.filter(c => c !== lay.best).slice(0, 2).map(c => c.name + ' ±' + (c.spread / 2).toFixed(1) + ' dB').join(', ');
  return `\n${cnt.n}× ${subName} — ${cnt.why}${cnt.margin != null ? ' · מאזן ' + (cnt.margin >= 0 ? '+' : '') + cnt.margin.toFixed(1) + ' dB' : ''}\nמיקום: ${lay.best.name}${lay.best.spread != null ? ' · אחידות בס ±' + (lay.best.spread / 2).toFixed(1) + ' dB' + (alt ? ' (לעומת ' + alt + ')' : '') : ''}`;
}
/* שורת מידע בפאנל האזור — מאזן הבס על מה שהונח בפועל (תצוגה בלבד, לא משנה כלום) */
function sdBassLineHTML(z) {
  const inZ = (P.nodes || []).filter(n => n.kind === 'point' && inZone(z, { x: 2200 - n.x - 20, y: n.y + 24 }));
  const tops = {}, subs = {};
  inZ.forEach(n => { const d = n.disp ?? guessDisp(n.name); const nm = (n.name || '').replace(/\s*\(.*\)\s*$/, ''); const t = d >= 300 ? subs : tops; t[nm] = (t[nm] || 0) + 1; });
  const tl = Object.entries(tops), sl = Object.entries(subs);
  if (!tl.length || !sl.length) return '';
  const gain = sdGain(z);
  let demand = 0, supply = 0, unknown = false;
  tl.forEach(([nm, q]) => { const s = sdSpl(nm); if (!s.known) unknown = true; demand += q * Math.pow(10, (s.spl + gain) / 10); });
  sl.forEach(([nm, q]) => { const s = sdSpl(nm); if (!s.known) unknown = true; supply += q * Math.pow(10, s.spl / 10); });
  const ref = Math.pow(10, sdSpl(sl[0][0]).spl / 10), need = demand / ref, have = sl.reduce((a, [, q]) => a + q, 0);
  const margin = 10 * Math.log10(supply / demand);
  const col = margin >= 0 ? '#0f6e56' : margin >= -3 ? '#8a5a12' : '#c9502e';
  return `<div style="font-size:11px;background:#f7f5f0;border-radius:8px;padding:5px 8px;margin:4px 0" title="כל טופ צורך בס לפי ה-SPL שלו + רווח התכלית (${gain} dB); הסאבים מספקים לפי ה-SPL שלהם. תצוגה בלבד.">
    🔊 בס: <b style="color:${col}">${need.toFixed(1)} מתוך ${have}</b> סאבים (${sl[0][0].slice(0, 18)}) · מאזן ${margin >= 0 ? '+' : ''}${margin.toFixed(1)} dB${unknown ? ' · <span style="color:#8a8377">SPL משוער לחלק מהדגמים</span>' : ''}</div>`;
}
