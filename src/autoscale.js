/* ===================================================================================
   KO Projects — זיהוי קנה מידה אוטומטי. בלי AI, בלי טוקנים.

   שני מקורות ראיה, שמוצלבים זה עם זה:
   א. הכיתוב בשרטוט: "1:50", "1:100", "קנ"מ 1:75"… × גודל הדף האמיתי של ה-PDF
      (נקודות PDF = 1/72 אינץ׳) → כמה פיקסלים למטר, בלי לנחש.
   ב. המידות שכבר כתובות בשרטוט (3650, 245, 3.65…): תווית מידה יושבת באמצע הקטע
      שלה, ולכן המרחק בין שתי תוויות סמוכות באותה שרשרת = (מידה א + מידה ב) / 2.
      מדיאן על כל הזוגות בשרטוט → אומדן חסין לרעש, ואפשר לבדוק אם היחידות הן
      מ״מ / ס״מ / מטר לפי איזו פרשנות נותנת תוצאה עקבית.

   PDF: שכבת הטקסט של הקובץ (pdf.js, כבר נטען להצגה) — מדויק, ללא OCR.
   תמונה/צילום: OCR מקומי בדפדפן (tesseract.js) — רק על ספרות, פחות מדויק, ובלי גודל
   דף ידוע אין הצלבה עם "1:N" — ולכן דורש יותר זוגות מידות כדי להיחשב בטוח.

   תוצאה: P.autoScale (מה נמצא, כמה זוגות, סטייה) + P.scale + P.calOk רק כשבטוח.
   הכיול הידני נשאר תמיד — ודורס.
   =================================================================================== */
const AS_RATIOS = [10, 20, 25, 30, 40, 50, 75, 100, 125, 150, 200, 250, 300, 400, 500, 1000];
const AS_PT_PER_MM = 72 / 25.4;

/* --- "1:50" מתוך שורות טקסט --- */
function asFindRatio(lines, tokens) {
  const votes = {};
  /* קנה מידה מקובל — תמיד; קנה מידה לא שגרתי (1:35, 1:60…) — רק כשהוא ליד "קנ״מ"/scale או עומד לבדו בתא של החותמת */
  const add = (n, w, strong) => { if (AS_RATIOS.includes(n) || (strong && n >= 10 && n <= 2000)) votes[n] = (votes[n] || 0) + w; };
  const KW = /scale|קנ\s*["'״׳]?\s*מ|קנה\s*מידה|מ\.ק|ק\.מ/i;
  /* חותמת בטבלה: "קנ״מ" בתא אחד ו-"1:35" בתא שלידו (אותה שורה) או מתחתיו */
  if (tokens && tokens.length) {
    const kws = tokens.filter(t => KW.test(t.t || ''));
    for (const t of tokens) { const m = /^\s*1\s*[:∶：]\s*(\d{2,4})\s*$/.exec(t.t || ''); if (!m) continue;
      const h = t.h || 10, near = kws.some(k => k !== t && ((Math.abs(k.y - t.y) <= h * 1.6 && Math.abs(k.x - t.x) <= h * 40) || (Math.abs(k.x - t.x) <= h * 8 && Math.abs(k.y - t.y) <= h * 5)));
      if (near) add(+m[1], 5, true); }
  }
  for (const t of lines) {
    const s = String(t);
    let m;
    /* 1:50 — ה-1 לא חלק ממספר אחר (למשל 11:50 או 1:50:00) */
    const rx = /(?:^|[^\d.,])1\s*[:∶：]\s*(\d{2,4})(?![\d.,:])/g;
    while ((m = rx.exec(s))) { const kw = KW.test(s) || /מידה/.test(s), alone = /^\s*1\s*[:∶：]\s*\d{2,4}\s*$/.test(s) && +m[1] % 5 === 0; add(+m[1], kw ? 3 : 1, kw || alone); }
    /* 1/50 — רק ליד המילה קנה מידה / scale */
    const rx2 = /(?:scale|קנ["'״]?מ|קנה\s*מידה)\s*[:\-–]?\s*1\s*\/\s*(\d{2,4})(?!\d)/gi;
    while ((m = rx2.exec(s))) add(+m[1], 3, true);
  }
  const best = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
  return best ? { n: +best[0], votes: best[1], all: votes } : null;
}

/* --- פרשנות מספר כמידה, לפי היפותזת יחידות --- */
function asParse(t, unit) {
  const s = String(t).replace(/\s+/g, '').replace(/,/g, '.');
  if (!/^\d+(\.\d+)?$/.test(s) || /^0\d/.test(s)) return null;   /* "0061" = קריאה הפוכה, לא מידה */
  const v = parseFloat(s);
  if (!(v > 0)) return null;
  const dec = s.includes('.');
  if (unit === 'm') { if (dec ? v <= 60 : v >= 1 && v <= 60) return v; return null; }
  if (unit === 'mm') return !dec && v >= 100 && v <= 60000 ? v / 1000 : null;   /* מ״מ = מספר שלם */
  if (unit === 'cm') return v >= 10 && v <= 6000 ? v / 100 : null;               /* ס״מ — גם עם עשרוני (482.5) */
  return null;
}
const asMedian = a => { const s = [...a].sort((x, y) => x - y); const n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : 0; };

/* --- טוקנים → שורות (קיבוץ לפי ציר, מיזוג "3 650" לטוקן אחד) ---
   token: { t, x, y, h, frame }  x/y = מרכז; frame 'h' = הטקסט רץ לאורך x, 'v' = לאורך y */
function asLines(tokens, frame) {
  const vert = frame === 'v' || frame === 'w';
  const along = vert ? 'y' : 'x', cross = vert ? 'x' : 'y';
  let ts = tokens.filter(tk => tk.frame === frame).sort((a, b) => a[cross] - b[cross] || a[along] - b[along]);
  /* אותו מקום נקרא פעמיים (שני סיבובי OCR, אחד מהם הפוך — "0061" מול "1900"): נשאר הבטוח יותר */
  const kept = [];
  for (const tk of ts) {
    const dup = kept.findIndex(k => Math.abs(k.x - tk.x) < tk.h * 0.6 && Math.abs(k.y - tk.y) < tk.h * 0.6);
    if (dup < 0) kept.push(tk); else if ((tk.c || 0) > (kept[dup].c || 0)) kept[dup] = tk;
  }
  ts = kept;
  const lines = [];
  for (const tk of ts) {
    const ln = lines.find(l => Math.abs(l.c - tk[cross]) < Math.max(2, tk.h * 0.7));
    if (ln) { ln.items.push(tk); ln.c = (ln.c * (ln.items.length - 1) + tk[cross]) / ln.items.length; }
    else lines.push({ c: tk[cross], items: [tk] });
  }
  /* מיזוג טוקנים צמודים שהם חלקי מספר אחד ("3" + "650") */
  for (const ln of lines) {
    ln.items.sort((a, b) => a[along] - b[along]);
    const out = [];
    for (const tk of ln.items) {
      const prev = out[out.length - 1];
      if (prev && /^[\d.,]+$/.test(prev.t) && /^[\d.,]+$/.test(tk.t)) {
        const gap = (tk[along] - tk.w / 2) - (prev[along] + prev.w / 2);
        if (gap > -tk.h * 0.15 && gap < Math.max(1.5, tk.h * 0.35)) {
          const nt = { ...prev, t: prev.t + tk.t, w: prev.w + gap + tk.w };
          nt[along] = (prev[along] - prev.w / 2 + tk[along] + tk.w / 2) / 2;
          out[out.length - 1] = nt; continue;
        }
      }
      out.push(tk);
    }
    ln.items = out;
    ln.text = out.map(tk => tk.t).join(' ');
  }
  return lines;
}

/* --- שרשרות מידות → אומדן "יחידות-שרטוט לכל מטר" לכל היפותזת יחידות --- */
function asChainEstimate(lines, unit, refK) {
  const ks = [], samples = [];
  for (const ln of lines) {
    const along = ln.items.length && (ln.items[0].frame === 'v' || ln.items[0].frame === 'w') ? 'y' : 'x';
    const nums = ln.items.map(tk => ({ tk, v: asParse(tk.t, unit) })).filter(o => o.v != null);
    for (let i = 0; i + 1 < nums.length; i++) {
      const a = nums[i], b = nums[i + 1];
      const d = Math.abs(b.tk[along] - a.tk[along]);
      const real = (a.v + b.v) / 2;
      if (d < Math.max(4, a.tk.h * 1.2) || real < 0.3 || real > 80) continue;
      if (!/^\d{3,}|\d\.\d/.test(a.tk.t) || !/^\d{3,}|\d\.\d/.test(b.tk.t)) continue;   /* "2" / "3" הם מספרי חדרים/מפלסים, לא מידות */
      const k = d / real;
      const vt = a.tk.frame !== 'h';   /* טקסט אנכי: הרוחב רץ לאורך y */
      ks.push(k); samples.push({ a: a.tk.t, b: b.tk.t, va: a.v, vb: b.v, vert: vt, d, real, k, ax: a.tk.x, ay: a.tk.y, aw: vt ? a.tk.h : a.tk.w, ah: vt ? a.tk.w : a.tk.h, bx: b.tk.x, by: b.tk.y, bw: vt ? b.tk.h : b.tk.w, bh: vt ? b.tk.w : b.tk.h });
    }
  }
  if (!ks.length) return null;
  /* כשיש כיתוב 1:N: זוגות שמסכימים איתו (עד 8%) הם האימות — לא החציון של כל הזוגות, כי OCR מדלג על מספרים באמצע שרשרת */
  const med = refK || asMedian(ks);
  const inl = samples.filter(s => Math.abs(s.k - med) / med <= (refK ? 0.08 : 0.06));
  if (!inl.length) return null;
  const k2 = asMedian(inl.map(s => s.k));
  const mad = asMedian(inl.map(s => Math.abs(s.k - k2))) / k2;
  return { unit, k: k2, n: inl.length, total: ks.length, mad, samples: inl.slice(0, 6), marks: inl.slice(0, 60) };
}

/* --- החלטה: הצלבה של "1:N" עם שרשרות המידות ---
   tokens בקואורדינטות של מסגרת המקור (נקודות PDF או פיקסלים של תמונת ה-OCR);
   unitPerM_ratio = כמה יחידות-מקור למטר לפי הכיתוב (null אם אין גודל דף) */
function asDecide(tokens, ratio, unitPerM_ratio, tol) {
  tol = tol || 0.03;   /* סובלנות ההצלבה; באימות ליד נקודה (זוג אחד שהמשתמש הצביע עליו) 5% */
  const lines = [...asLines(tokens, 'h'), ...asLines(tokens, 'v'), ...asLines(tokens, 'w')];
  const ests = ['mm', 'cm', 'm'].map(u => asChainEstimate(lines, u)).filter(Boolean);
  /* הפרשנות הנכונה: הכי הרבה זוגות עקביים; אם יש "1:N" — זוגות שמסכימים איתו */
  let chain = null;
  if (unitPerM_ratio) { const agree = ['mm', 'cm', 'm'].map(u => asChainEstimate(lines, u, unitPerM_ratio)).filter(Boolean).sort((a, b) => b.n - a.n || a.mad - b.mad); if (agree.length) chain = agree[0]; }
  if (!chain && ests.length) chain = ests.sort((a, b) => b.n - a.n || a.mad - b.mad)[0];
  const r = { ratio: ratio ? ratio.n : null, ratioVotes: ratio ? ratio.votes : 0, unitPerM_ratio: unitPerM_ratio || null,
    chain: chain ? { unit: chain.unit, n: chain.n, total: chain.total, mad: chain.mad, k: chain.k, samples: chain.samples.map(x => ({ a: x.a, b: x.b, real: x.real, k: x.k })), marks: chain.marks } : null,
    unitPerM: null, conf: 'none', method: '', note: '', dev: null };
  const strongChain = chain && chain.n >= 6 && chain.mad <= 0.02;
  if (chain && unitPerM_ratio) {
    r.dev = Math.abs(chain.k - unitPerM_ratio) / unitPerM_ratio;
    /* מסכימים: הכיתוב מדויק יותר מזוג-שניים שנמדדו ב-OCR; רק שרשרת ארוכה גוברת עליו */
    if (r.dev <= tol) { r.unitPerM = chain.n >= 3 ? chain.k : unitPerM_ratio; r.conf = 'high'; r.method = 'ratio+dims'; r.note = 'הכיתוב 1:' + ratio.n + ' והמידות בשרטוט מסכימים'; }
    else if (chain.n >= 4) { r.unitPerM = chain.k; r.conf = strongChain ? 'high' : 'medium'; r.method = 'dims'; r.note = 'הכיתוב אומר 1:' + ratio.n + ' אבל המידות בשרטוט לא מסכימות (' + Math.round(r.dev * 100) + '%) — כנראה הודפס בהתאמה לדף. נלקחו המידות'; }
    else { r.unitPerM = unitPerM_ratio; r.conf = 'medium'; r.method = 'ratio';
      if ((chain.n >= 2 || tol > 0.03) && r.dev <= 0.5) r.note = 'לפי הכיתוב 1:' + ratio.n + ' וגודל הדף; ' + (chain.n === 1 ? 'זוג המידות שנמצא לא מסכים' : chain.n + ' זוגות מידות שנמצאו לא מסכימים') + ' (' + Math.round(r.dev * 100) + '% סטייה) — השווה את הסימון האדום למידה בעין, או לחץ ליד מידה אחרת';
      else { r.chain = null; r.dev = null; r.note = 'לפי הכיתוב 1:' + ratio.n + ' וגודל הדף — לא נמצאו מידות תואמות לאימות. אם ההדפסה הותאמה לדף, כייל ידנית'; } }
  } else if (chain && chain.n >= 1) {
    r.unitPerM = chain.k; r.conf = strongChain ? 'high' : (chain.n >= 4 ? 'medium' : 'low'); r.method = 'dims';
    r.note = (ratio ? 'הכיתוב 1:' + ratio.n + ' נמצא אבל אין גודל דף להצלבה; ' : 'לא נמצא כיתוב 1:N; ') + 'לפי ' + chain.n + (chain.n === 1 ? ' זוג מידות אחד בשרטוט — בדוק בעין' : ' זוגות מידות בשרטוט');
  } else if (unitPerM_ratio) {
    r.unitPerM = unitPerM_ratio; r.conf = 'medium'; r.method = 'ratio'; r.note = 'לפי הכיתוב 1:' + ratio.n + ' וגודל הדף — לא נמצאו מידות בשרטוט לאימות. אם ההדפסה הותאמה לדף, כייל ידנית';
  } else {
    r.note = ratio ? 'נמצא 1:' + ratio.n + ' אבל בלי גודל דף ובלי מידות — כייל ידנית' : 'לא נמצאו כיתוב קנה מידה או מידות קריאות — כייל ידנית';
  }
  return r;
}

/* --- החלה על הפרויקט --- */
function asApply(r, pxPerM, src, force) {
  P.autoScale = { ...r, pxPerM: pxPerM || null, src, at: Date.now() };
  if (!(pxPerM > 0)) { render(); if (typeof WIZ !== 'undefined' && WIZ) wizRender(); return false; }
  /* כיול ידני קיים לא נדרס בשקט — התוצאה נשמרת ומוצעת בכפתור */
  /* פרויקט ותיק בלי calSrc = כויל ידנית לפני שהיה זיהוי אוטומטי; העלאה חדשה מאפסת ל-'' */
  if (P.scale && (P.calSrc === 'manual' || P.calSrc === undefined) && !force) { save(); render(); if (typeof WIZ !== 'undefined' && WIZ) wizRender(); return false; }
  P.scale = 1 / pxPerM;
  P.calSrc = 'auto';
  P.calOk = r.conf === 'high' ? 1 : 0;
  if (typeof recalcCableLengths === 'function') recalcCableLengths();
  save(); render();
  if (typeof WIZ !== 'undefined' && WIZ) wizRender();
  return true;
}
function asLabel(r) {
  if (!r) return '';
  const c = r.conf === 'high' ? '🟢 בטוח' : r.conf === 'medium' ? '🟡 סביר — אשר' : r.conf === 'low' ? '🟠 חלש — בדוק' : '🔴 לא זוהה';
  const parts = [];
  if (r.ratio) parts.push('כיתוב 1:' + r.ratio);
  if (r.chain) parts.push(r.chain.n + ' זוגות מידות ב' + ({ mm: 'מ״מ', cm: 'ס״מ', m: 'מטר' }[r.chain.unit] || r.chain.unit) + ' (פיזור ' + (r.chain.mad * 100).toFixed(1) + '%)');
  if (r.dev != null) parts.push('הצלבה: סטייה ' + (r.dev * 100).toFixed(1) + '%');
  return c + ' · ' + parts.join(' · ');
}
/* תיבת סיכום ל-UI (פאנל צד + אשף) */
function asSummaryHTML() {
  const r = P.autoScale; if (!r) return '';
  const col = r.conf === 'high' ? '#0f6e56' : r.conf === 'medium' ? '#b7791f' : '#c9502e';
  const over = P.scale && (P.calSrc === 'manual' || P.calSrc === undefined);
  const pend = r.step === 1 && r.unitPerM && r.conf !== 'high' ? '<div style="font-size:11.5px;color:#b7791f;margin:2px 0 4px">🟡 שלב 1 הושלם — הכיתוב הוחל. שלב 2: לחץ "אמת ליד מידה" ואז על מספר מידה בתכנית</div>' : '';
  /* שדה קנה המידה: מה שנמצא בכיתוב (ניתן לעריכה) ואימות מול המידות שנמדדו */
  let ratioRow = '';
  if (P.scale) {
    const cur = 1 / P.scale;
    let verify = '';
    if (r.ratio && r.pageMm) {
      const pxR = (P.bgW || 1400) / (r.pageMm[0] * r.ratio / 1000);
      const d = Math.abs(pxR - cur) / cur;
      verify = d <= 0.03 ? `<span style="color:#0f6e56;font-weight:700">✓ תואם למידות שנמדדו (סטייה ${(d * 100).toFixed(1)}%)</span>` : `<span style="color:#c9502e;font-weight:700">✗ לא תואם למידות (סטייה ${(d * 100).toFixed(0)}%) — כנראה הודפס בהתאמה לדף</span>`;
    } else if (r.ratio && !r.pageMm) verify = '<span class="muted">בתמונה אין גודל דף — הכיתוב לא ניתן לאימות מספרי</span>';
    else if (!r.ratio) verify = '<span class="muted">לא נמצא כיתוב 1:N בשכבת הטקסט — הקלד אם כתוב בשרטוט</span>';
    ratioRow = `<div style="display:flex;align-items:center;gap:6px;margin:4px 0"><span>קנה מידה בשרטוט:</span>
      <span style="direction:ltr;display:inline-flex;align-items:center;gap:3px;font-weight:700">1 : <input type="number" min="1" max="5000" value="${r.ratio || ''}" placeholder="50" style="width:64px;padding:3px 5px;margin:0;font-size:12px" onchange="asSetRatio(this.value)"></span></div><div>${verify}</div>`;
  }
  return pend + `<div style="border:1.5px solid ${col};border-radius:9px;padding:7px 9px;margin:0 0 8px;background:#fff;font-size:11.5px;line-height:1.5">
    <b style="color:${col}">🔍 זיהוי אוטומטי${over ? ' (נדרס בכיול ידני)' : ''}:</b> ${esc(asLabel(r))}<br>${ratioRow}
    <span class="muted">${esc(r.note || '')}${r.pxPerM ? ' · 1 מ׳ = ' + r.pxPerM.toFixed(1) + 'px' : ''}</span>
    ${r.marks && r.marks.length ? `<div style="display:flex;gap:4px;margin-top:6px"><button style="flex:1;${r.show === false ? '' : 'background:#eef7f1;border-color:#0f6e56;color:#0f6e56'}" onclick="P.autoScale.show=!(P.autoScale.show!==false);save();render()">👁 ${r.show === false ? 'הצג סימון אימות' : 'סימון אימות מוצג'}</button><button style="flex:1;${r.showAll ? 'background:#eef7f1;border-color:#0f6e56;color:#0f6e56' : ''}" onclick="P.autoScale.showAll=!P.autoScale.showAll;save();render()">${r.showAll ? 'רק אחד' : 'הצג את כל ' + r.marks.length}</button></div>` : ''}
    ${r.chain && r.chain.samples && r.chain.samples.length ? `<details style="margin-top:3px"><summary class="muted" style="cursor:pointer">המידות ששימשו לאימות</summary>
      <div class="muted" style="font-size:10.5px">${r.chain.samples.map(s => esc(s.a) + ' ↔ ' + esc(s.b) + ' → ' + s.real.toFixed(2) + ' מ׳').join('<br>')}</div></details>` : ''}
    ${r.pxPerM && over ? `<button style="width:100%;margin-top:6px" onclick="P.calSrc='';asApply(P.autoScale,P.autoScale.pxPerM,P.autoScale.src,true);uiToast('✓ הוחל קנה המידה שזוהה — במקום הכיול הידני')">↺ השתמש בזיהוי (1 מ׳ = ${r.pxPerM.toFixed(1)}px) במקום הכיול הידני (${(1 / P.scale).toFixed(1)}px)</button>` : ''}
    ${!r.pxPerM || over ? '' : (P.calOk ? '' : `<button class="primary" style="width:100%;margin-top:6px;background:#0f6e56" onclick="P.calOk=1;save();render();if(typeof WIZ!=='undefined'&&WIZ)wizRender();uiToast('✓ קנה המידה האוטומטי אושר')">✓ הזיהוי נכון — אשר</button>`)}
    ${typeof asStepButtonsHTML === 'function' ? asStepButtonsHTML() : ''}
  </div>`;
}

/* ================= PDF: שכבת הטקסט ================= */
/* טוקנים משכבת הטקסט של ה-PDF (נקודות PDF, y מלמטה) */
function asPdfTextTokens(tc) {
  const tokens = [];
  for (const it of tc.items) {
    const t = (it.str || '').trim(); if (!t) continue;
    const [a, b, c, d, e, f] = it.transform;
    const rot = Math.atan2(b, a);
    const h = Math.hypot(c, d) || 8, w = it.width || h * 0.6 * t.length;
    const vert = Math.abs(Math.abs(rot) - Math.PI / 2) < 0.3;
    const horiz = Math.abs(rot) < 0.3 || Math.abs(Math.abs(rot) - Math.PI) < 0.3;
    if (!vert && !horiz) continue;
    const cx = e + Math.cos(rot) * w / 2 - Math.sin(rot) * h / 2;
    const cy = f + Math.sin(rot) * w / 2 + Math.cos(rot) * h / 2;
    tokens.push({ t, x: cx, y: cy, w, h, frame: vert ? 'v' : 'h' });
  }
  return tokens;
}
function asFinishPdf(r, tokens, pg, bgW) {
  const vp = pg.getViewport({ scale: 1 }), pageW = vp.width;
  const lines = [...asLines(tokens, 'h'), ...asLines(tokens, 'v'), ...asLines(tokens, 'w')].map(l => l.text);
  r.textSample = lines.filter(t => /[:\/]/.test(t)).slice(0, 25);
  const pxPerM = r.unitPerM ? r.unitPerM * (bgW / pageW) : null;
  asNormMarks(r, pageW, vp.height, true);
  r.tokens = tokens.length; r.pageMm = [Math.round(pageW / AS_PT_PER_MM), Math.round(vp.height / AS_PT_PER_MM)];
  asApply(r, pxPerM, 'pdf');
  return pxPerM;
}
/* ===== שלב 1 — זיהוי קנה המידה: הכיתוב "1:N" בחותמת השרטוט =====
   שכבת הטקסט של ה-PDF, ואם אין — OCR של פינת החותמת בלבד (שניות בודדות). התוצאה מוחלת מיד (🟡);
   האימות מול מידות בשרטוט הוא שלב 2 (asVerifyAt) — לחיצה ליד מידה כתובה. */
async function autoScalePdf(pg, bgW) {
  try {
    const tc = await pg.getTextContent();
    const tokens = asPdfTextTokens(tc);
    window.__asTextToks = tokens;
    let ratio = asFindRatio([...asLines(tokens, 'h'), ...asLines(tokens, 'v'), ...asLines(tokens, 'w')].map(l => l.text).concat(tokens.map(t => t.t)), tokens);
    if (!ratio) {
      uiToast('🔍 קורא את חותמת השרטוט…', 4000);
      const toks = await asOcrZoomPdf(pg, { sc: 6, stampOnly: true });
      toks.forEach(tk => tokens.push(tk));
      ratio = toks.__ratio || null;
    }
    const ptPerM_ratio = ratio ? (1000 * AS_PT_PER_MM) / ratio.n : null;
    const r = asDecide(tokens, ratio, ptPerM_ratio);
    r.step = 1;
    const pxPerM = asFinishPdf(r, tokens, pg, bgW);
    uiToast(pxPerM ? '🔍 שלב 1: נקרא קנה מידה 1:' + ratio.n + ' והוחל · שלב 2: לחץ ליד מידה בתכנית לאימות' : '🔍 לא נמצא כיתוב 1:N בחותמת — הקלד את קנה המידה, או לחץ ליד מידה כתובה בתכנית (שלב 2)', 7000);
    return r;
  } catch (e) { console.warn('autoScalePdf', e); return null; }
}

/* ================= תמונה: OCR מקומי ================= */
async function asOcrTokens(cv) {
  if (!window.Tesseract) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js');
  const worker = await Tesseract.createWorker('eng');
  /* טקסט מפוזר (PSM 11): מספרי מידות פזורים על שרטוט, לא פסקאות */
  await worker.setParameters({ tessedit_char_whitelist: '0123456789.,:/', preserve_interword_spaces: '1', tessedit_pageseg_mode: '11' });
  const pass = async (canvas, frame, map) => {
    const res = await worker.recognize(canvas);
    const out = [];
    for (const w of (res.data.words || [])) {
      const t = (w.text || '').trim(); if (!t || w.confidence < 55) continue;
      const bb = w.bbox; const cx = (bb.x0 + bb.x1) / 2, cy = (bb.y0 + bb.y1) / 2;
      const p = map(cx, cy);
      out.push({ t, x: p.x, y: p.y, w: bb.x1 - bb.x0, h: bb.y1 - bb.y0, frame, c: w.confidence });
    }
    return out;
  };
  const tokens = await pass(cv, 'h', (x, y) => ({ x, y }));
  /* טקסט אנכי (מידות לאורך קירות): מסובבים ב-90° לכל כיוון וקוראים שוב; המרחקים נשמרים */
  const rot = ang => { const rc = document.createElement('canvas'); rc.width = cv.height; rc.height = cv.width;
    const g = rc.getContext('2d'); g.translate(rc.width / 2, rc.height / 2); g.rotate(ang); g.drawImage(cv, -cv.width / 2, -cv.height / 2); return rc; };
  /* סיבוב עם כיוון השעון: (x,y) → (H−y, x) ולכן חזרה: x = y′, y = H − x′ */
  tokens.push(...await pass(rot(Math.PI / 2), 'v', (x, y) => ({ x: y, y: cv.height - x })));
  /* נגד כיוון השעון: (x,y) → (y, W−x) ולכן חזרה: x = W − y′, y = x′ */
  tokens.push(...await pass(rot(-Math.PI / 2), 'w', (x, y) => ({ x: cv.width - y, y: x })));
  await worker.terminate();
  return tokens;
}
/* OCR באריחים על קנבס גדול (מידות בשרטוט אדריכלי קטנות — מפוזרות על דף ענק): אריחי ~1600px עם חפיפה, שלושה כיוונים לכל אריח */
async function asOcrTiles(cv) {
  if (!window.Tesseract) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js');
  const worker = await Tesseract.createWorker('eng');
  await worker.setParameters({ tessedit_char_whitelist: '0123456789.,:/', preserve_interword_spaces: '1', tessedit_pageseg_mode: '11' });
  const T = 1600, OV = 120, out = [], seen = new Set();
  const rot = (src, ang) => { const rc = document.createElement('canvas'); rc.width = src.height; rc.height = src.width; const g = rc.getContext('2d'); g.translate(rc.width / 2, rc.height / 2); g.rotate(ang); g.drawImage(src, -src.width / 2, -src.height / 2); return rc; };
  for (let ty = 0; ty < cv.height; ty += T - OV) for (let tx = 0; tx < cv.width; tx += T - OV) {
    const w = Math.min(T, cv.width - tx), h = Math.min(T, cv.height - ty); if (w < 60 || h < 60) continue;
    const tile = document.createElement('canvas'); tile.width = w; tile.height = h; tile.getContext('2d').drawImage(cv, tx, ty, w, h, 0, 0, w, h);
    /* אריח לבן לגמרי — דילוג */
    const d = tile.getContext('2d').getImageData(0, 0, w, h).data; let dark = 0; for (let i = 0; i < d.length; i += 64) if (d[i] < 128) dark++; if (dark < 20) continue;
    const passes = [[tile, 'h', (x, y) => ({ x, y })], [rot(tile, Math.PI / 2), 'v', (x, y) => ({ x: y, y: h - x })], [rot(tile, -Math.PI / 2), 'w', (x, y) => ({ x: w - y, y: x })]];
    for (const [c2, frame, map] of passes) {
      const res = await worker.recognize(c2);
      for (const wd of (res.data.words || [])) { const t = (wd.text || '').trim(); if (!t || wd.confidence < 55 || !/\d/.test(t)) continue;
        const bb = wd.bbox, p = map((bb.x0 + bb.x1) / 2, (bb.y0 + bb.y1) / 2), X = p.x + tx, Y = p.y + ty;
        const key = frame + '|' + t + '|' + Math.round(X / 8) + '|' + Math.round(Y / 8); if (seen.has(key)) continue; seen.add(key);
        out.push({ t, x: X, y: Y, w: bb.x1 - bb.x0, h: bb.y1 - bb.y0, frame, c: wd.confidence }); }
    }
  }
  await worker.terminate();
  return out;
}
/* ===== סריקת זום: אריחים מרונדרים ישירות מה-PDF ברזולוציה גבוהה =====
   הקנבס הענק (7200px) נתן ~16px לספרה — קטן מדי ל-OCR. כאן כל אריח מרונדר בנפרד בהגדלה (ברירת מחדל ×6),
   כך שספרת מידה יוצאת ~30-40px. סדר הסריקה: טבעת האריחים החיצונית קודם (שם רצות שרשרות המידות),
   ואחרי כל אריח נבדק אם כבר יש שרשרת מידות עקבית — ואז עוצרים. */
/* ניקוי אריח לפני OCR: משאירים רק רכיבים מחוברים קטנים (ספרות ואותיות) ומוחקים קירות, קווי מידה ארוכים,
   מסגרות טבלה והצללות — הם אלה שמאטים את Tesseract פי 10 באריחים צפופים, ובלעדיהם הספרות נקראות נקי יותר.
   px = RGBA בינארי (0 / 255). מחזיר כמה פיקסלים כהים נשארו */
function asKeepSmall(px, W, H, maxSide) {
  const N = W * H, lab = new Int32Array(N), st = new Int32Array(N);
  let kept = 0, comp = 0;
  for (let i = 0; i < N; i++) {
    if (px[i * 4] !== 0 || lab[i]) continue;
    comp++;
    let sp = 0, minx = W, maxx = 0, miny = H, maxy = 0, cnt = 0; st[sp++] = i; lab[i] = comp;
    const pix = [];
    while (sp) {
      const p = st[--sp]; pix.push(p); cnt++;
      const y = (p / W) | 0, x = p - y * W;
      if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y;
      if (x > 0 && px[(p - 1) * 4] === 0 && !lab[p - 1]) { lab[p - 1] = comp; st[sp++] = p - 1; }
      if (x < W - 1 && px[(p + 1) * 4] === 0 && !lab[p + 1]) { lab[p + 1] = comp; st[sp++] = p + 1; }
      if (y > 0 && px[(p - W) * 4] === 0 && !lab[p - W]) { lab[p - W] = comp; st[sp++] = p - W; }
      if (y < H - 1 && px[(p + W) * 4] === 0 && !lab[p + W]) { lab[p + W] = comp; st[sp++] = p + W; }
    }
    const w = maxx - minx + 1, h = maxy - miny + 1;
    /* גדול מדי לספרה, או דק וארוך (קו), או נקודת רעש */
    if (w > maxSide || h > maxSide || cnt < 6) { for (const p of pix) { px[p * 4] = px[p * 4 + 1] = px[p * 4 + 2] = 255; } }
    else kept += cnt;
  }
  return kept;
}
/* OCR של קנבס בינארי אחד (אחרי חידוד וניקוי): 1 או 3 סיבובים. מחזיר טוקנים ביחידות המקור (x0,y0 + פיקסל/SC), y מלמעלה */
async function asOcrBin(worker, cv, SC, x0, y0, hOnly) {
  const rot = (src, ang) => { const rc = document.createElement('canvas'); rc.width = src.height; rc.height = src.width; const g = rc.getContext('2d'); g.translate(rc.width / 2, rc.height / 2); g.rotate(ang); g.drawImage(src, -src.width / 2, -src.height / 2); return rc; };
  const passes = [[cv, 'h', (x, y) => ({ x, y })]];
  if (!hOnly) passes.push([rot(cv, Math.PI / 2), 'v', (x, y) => ({ x: y, y: cv.height - x })], [rot(cv, -Math.PI / 2), 'w', (x, y) => ({ x: cv.width - y, y: x })]);
  const out = [];
  for (const [c2, frame, map] of passes) {
    const res = await worker.recognize(c2);
    for (const wd of (res.data.words || [])) {
      const txt = (wd.text || '').trim();
      if (!txt || wd.confidence < 55 || !/^\d+([.,]\d+)?$|1\s*[:\/]\s*\d{2,4}/.test(txt)) continue;
      const bb = wd.bbox, p = map((bb.x0 + bb.x1) / 2, (bb.y0 + bb.y1) / 2);
      out.push({ t: txt, x: x0 + p.x / SC, y: y0 + p.y / SC, w: (bb.x1 - bb.x0) / SC, h: (bb.y1 - bb.y0) / SC, frame, c: wd.confidence });
    }
  }
  return out;
}
/* חידוד לשחור-לבן + ניקוי רכיבים גדולים. מחזיר כמה פיקסלי-גליף נשארו (0 = אין מה לקרוא) */
function asPrepBin(g, W, H, SC) {
  const id = g.getImageData(0, 0, W, H), px = id.data;
  let dark = 0; for (let i = 0; i < px.length; i += 256) if (px[i] < 140) dark++;
  if (dark < 12) return 0;
  for (let i = 0; i < px.length; i += 4) { const l = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2], v = l < 190 ? 0 : 255; px[i] = px[i + 1] = px[i + 2] = v; }
  const kept = asKeepSmall(px, W, H, Math.round(16 * SC));   /* ספרה עד ~16 נק׳ (5.6 מ״מ) */
  if (kept < 40) return 0;
  g.putImageData(id, 0, 0);
  return kept;
}
async function asWorker() {
  if (!window.Tesseract) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js');
  const worker = await Tesseract.createWorker('eng');
  await worker.setParameters({ tessedit_char_whitelist: '0123456789.,:/', preserve_interword_spaces: '1', tessedit_pageseg_mode: '11' });
  return worker;
}
/* סריקת PDF בזום באריחים. מצבים:
   stampOnly — רק פינת החותמת (טקסט אופקי) עד שנקרא "1:N"      → שלב 1
   at:{x,y}  — אריח אחד סביב נקודה (נקודות PDF, y מלמעלה)        → שלב 2, אימות ליד מידה
   אחרת      — סריקה מלאה: חותמת ואז המידות (טבעת חיצונית קודם) */
async function asOcrZoomPdf(pg, opt = {}) {
  const vp1 = pg.getViewport({ scale: 1 }), SC = opt.sc || 6, TILE = opt.tile || 1700, OV = 0.08;
  const tw = TILE / SC, stepPt = tw * (1 - OV), cols = Math.max(1, Math.ceil(vp1.width / stepPt)), rows = Math.max(1, Math.ceil(vp1.height / stepPt));
  const worker = await asWorker();
  const tokens = [], seen = new Set();
  const maxTiles = opt.maxTiles || 70, tStop = Date.now() + (opt.maxMs || 240000);
  let ratio = opt.ratio || null, ratioAt = -1;
  const ptPerM = n => (1000 * AS_PT_PER_MM) / n;
  let done = 0, scanned = 0;
  const lines = () => [...asLines(tokens, 'h'), ...asLines(tokens, 'v'), ...asLines(tokens, 'w')];
  const log = []; window.__asLog = log;
  const scanTile = async (x0, y0, hOnly) => {
    const T0 = Date.now(), n0 = tokens.length;
    x0 = Math.max(0, x0); y0 = Math.max(0, y0);
    const wPt = Math.min(tw, vp1.width - x0), hPt = Math.min(tw, vp1.height - y0);
    if (wPt < 40 || hPt < 40) return false;
    const cv = document.createElement('canvas');
    cv.width = Math.round(wPt * SC); cv.height = Math.round(hPt * SC);
    const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
    await pg.render({ canvasContext: g, viewport: pg.getViewport({ scale: SC, offsetX: -x0 * SC, offsetY: -y0 * SC }) }).promise;
    scanned++;
    const kept = asPrepBin(g, cv.width, cv.height, SC);
    if (!kept) { log.push({ x: Math.round(x0), y: Math.round(y0), skip: 'no glyphs', ms: Date.now() - T0 }); return false; }
    done++;
    for (const tk of await asOcrBin(worker, cv, SC, x0, y0, hOnly)) {
      const key = tk.frame + '|' + tk.t + '|' + Math.round(tk.x / 3) + '|' + Math.round(tk.y / 3);
      if (seen.has(key)) continue; seen.add(key);
      tk.y = vp1.height - tk.y;   /* נקודות PDF — y מלמטה */
      tokens.push(tk);
    }
    if (!ratio) { ratio = asFindRatio(lines().map(l => l.text).concat(tokens.map(t => t.t)), tokens); if (ratio) { ratioAt = done; if (opt.onRatio) opt.onRatio(ratio); } }
    if (opt.onTile) opt.onTile(done, Math.min(rows * cols, maxTiles), tokens.length, ratio);
    log.push({ x: Math.round(x0), y: Math.round(y0), hOnly: !!hOnly, ms: Date.now() - T0, kept, toks: tokens.length - n0, ratio: ratio && ratio.n });
    return true;
  };
  const fin = () => { tokens.__tiles = done; tokens.__scanned = scanned; tokens.__ratioAt = ratioAt; tokens.__ratio = ratio; return tokens; };
  /* אימות ליד נקודה: אריח אחד סביבה, כל הסיבובים */
  if (opt.at) {
    await scanTile(opt.at.x - tw / 2, opt.at.y - tw / 2, false);
    await worker.terminate(); return fin();
  }
  /* שלב א — החותמת: אריחים מעוגנים לפינה הימנית-תחתונה (ואם אין שם — לשמאלית-תחתונה), טקסט אופקי בלבד. שם כתוב "קנה מידה 1:N" */
  if (!ratio) {
    const W = vp1.width, H = vp1.height, s2 = tw * 0.92;
    const stamp = [[W - tw, H - tw], [W - tw - s2, H - tw], [W - tw, H - tw - s2], [W - tw - s2, H - tw - s2], [0, H - tw], [s2, H - tw],
      [0, 0], [0, s2], [W - tw, 0], [W - tw, s2], [0, H - tw - s2], [s2, 0]];   /* חותמת בעמודה בצד שמאל/ימין או למעלה */
    for (const [x, y] of stamp) { if (ratio || Date.now() > tStop) break; await scanTile(x, y, true); }
  }
  if (opt.stampOnly) { await worker.terminate(); return fin(); }
  /* שלב ב — מפת צפיפות זולה (רינדור אחד ברזולוציה נמוכה) ואז רשת אריחים: טבעת חיצונית קודם, בתוכה דלילים לפני צפופים, ריקים בסוף */
  let LC = null;
  try {
    const k = 1200 / vp1.width, lc = document.createElement('canvas'); lc.width = Math.round(vp1.width * k); lc.height = Math.round(vp1.height * k);
    const lg = lc.getContext('2d'); lg.fillStyle = '#fff'; lg.fillRect(0, 0, lc.width, lc.height);
    await pg.render({ canvasContext: lg, viewport: pg.getViewport({ scale: k }) }).promise;
    LC = { k, w: lc.width, h: lc.height, d: lg.getImageData(0, 0, lc.width, lc.height).data };
  } catch (e) { console.warn('density map', e); }
  const D = (x0, y0, w, h) => {
    if (!LC) return 0.5;
    const X0 = Math.round(x0 * LC.k), Y0 = Math.round(y0 * LC.k), X1 = Math.min(LC.w, Math.round((x0 + w) * LC.k)), Y1 = Math.min(LC.h, Math.round((y0 + h) * LC.k));
    let dark = 0, n = 0; for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++) { n++; if (LC.d[(y * LC.w + x) * 4] < 200) dark++; }
    return n ? dark / n : 0;
  };
  const order = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x0 = c * stepPt, y0 = r * stepPt; if (vp1.width - x0 < 40 || vp1.height - y0 < 40) continue;
    order.push({ x0, y0, ring: Math.min(r, c, rows - 1 - r, cols - 1 - c), d: D(x0, y0, tw, tw) });
  }
  order.sort((a, b) => (a.d < 0.0004) - (b.d < 0.0004) || a.ring - b.ring || a.d - b.d);
  let tConf = ratio ? Date.now() + (opt.confirmMs || 15000) : 0;
  for (const t of order) {
    if (done >= maxTiles || Date.now() > tStop) break;
    if (ratio && Date.now() > tConf) break;
    if (!(await scanTile(t.x0, t.y0, false))) continue;
    const ln = lines();
    if (ratio) {
      if (!tConf) tConf = Date.now() + (opt.confirmMs || 15000);
      const agree = ['mm', 'cm', 'm'].map(u => asChainEstimate(ln, u, ptPerM(ratio.n))).filter(Boolean).sort((a, b) => b.n - a.n)[0];
      if (agree && agree.n >= 2) break;
      continue;
    }
    if (done % 3 === 0 && tokens.length >= 6) {
      const best = ['mm', 'cm', 'm'].map(u => asChainEstimate(ln, u)).filter(Boolean).sort((a, b) => b.n - a.n || a.mad - b.mad)[0];
      if (best && best.n >= (opt.enough || 8) && best.mad <= 0.02) break;
    }
  }
  await worker.terminate();
  return fin();
}
async function autoScaleImage(img, bgW) {
  try {
    uiToast('🔍 מזהה קנה מידה מהתמונה (OCR מקומי, בלי AI) — ממשיכים בינתיים…', 5000);
    /* ספרות בשרטוט קטנות — מגדילים עד פי 4 (צלע עד ~3600px) והופכים לשחור-לבן חד */
    const k = Math.max(1, Math.min(4, 3600 / Math.max(img.width, img.height)));
    const cv = document.createElement('canvas');
    cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
    const g = cv.getContext('2d'); g.imageSmoothingQuality = 'high';
    g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(img, 0, 0, cv.width, cv.height);
    const id = g.getImageData(0, 0, cv.width, cv.height), px = id.data;
    for (let i = 0; i < px.length; i += 4) { const l = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]; const v = l < 150 ? 0 : 255; px[i] = px[i + 1] = px[i + 2] = v; }
    g.putImageData(id, 0, 0);
    const tokens = await asOcrTokens(cv);
    window.__asTokens = tokens; /* לניפוי: מה ה-OCR קרא */
    const lines = [...asLines(tokens, 'h'), ...asLines(tokens, 'v'), ...asLines(tokens, 'w')].map(l => l.text);
    const ratio = asFindRatio(lines.concat(tokens.map(t => t.t)), tokens);
    /* בתמונה אין גודל דף — אבל אם בחותמת כתוב פורמט הגיליון (A3, A1…), ובהנחה שהתמונה היא הגיליון המלא, אפשר לחשב ממנו */
    let sheetK = null, sheet = '';
    if (ratio) { const SH = { A0: 1189, A1: 841, A2: 594, A3: 420, A4: 297 }; const st = tokens.map(t => /^\s*(A[0-4])\s*$/i.exec(t.t || '')).filter(Boolean)[0] || /(?:גיליון|גליון|פורמט|format|sheet)\s*[:\-]?\s*(A[0-4])\b/i.exec(lines.join(' \n ')) || /\b(A[0-4])\s*(?:גיליון|גליון)/i.exec(lines.join(' \n '));
      if (st) { sheet = st[1].toUpperCase(); sheetK = Math.max(cv.width, cv.height) / (SH[sheet] / 1000 * ratio.n); } }
    const r = asDecide(tokens, ratio, sheetK);
    if (sheet) { r.sheet = sheet; r.note = (r.note || '') + ' · גודל הדף לפי הכיתוב "גיליון ' + sheet + '" (בהנחה שהתמונה היא הגיליון המלא)'; }
    const pxPerM = r.unitPerM ? r.unitPerM * (bgW / cv.width) : null;
    asNormMarks(r, cv.width, cv.height, false);
    r.tokens = tokens.length;
    asApply(r, pxPerM, 'ocr');
    uiToast(pxPerM ? '🔍 קנה מידה זוהה מהתמונה: ' + asLabel(r) : '🔍 לא זוהה קנה מידה מהתמונה — ' + r.note, 6000);
    return r;
  } catch (e) { console.warn('autoScaleImage', e); uiToast('⚠ זיהוי אוטומטי נכשל: ' + (e.message || e)); return null; }
}
/* הרצה חוזרת על תכנית קיימת (תמונת הרקע השמורה) */
/* עמוד ה-PDF של הגיליון הנוכחי (נטען מהשרת לפי דרישה; נשמר בזיכרון לשלב 2) */
async function asPdfPage() {
  if (!P.bgPdf && P.hasPdf && typeof sheetFetchBg === 'function') { uiToast('⏳ מביא את ה-PDF המקורי מהשרת…', 4000); await sheetFetchBg(P, curSheet(P), true); }
  if (!P.bgPdf) return null;
  const key = P.id + '|' + (P.curSheet || '') + '|' + (P.bgPdfPage || 1) + '|' + P.bgPdf.length;
  if (window.__asPg && window.__asPg.key === key) return window.__asPg.pg;
  if (!window.pdfjsLib) { await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'); pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; }
  const bytes = typeof bgPdfBytes === 'function' ? bgPdfBytes() : Uint8Array.from(atob(P.bgPdf.replace(/^data:[^,]*,/, '')), ch => ch.charCodeAt(0));
  const doc = await pdfjsLib.getDocument({ data: bytes }).promise, pg = await doc.getPage(P.bgPdfPage || 1);
  window.__asPg = { key, pg };
  return pg;
}
/* שלב 1 — זיהוי קנה המידה מהכיתוב */
async function autoScaleFromBg() {
  if (!P.bg) { uiToast('אין תכנית'); return; }
  try {
    const pg = await asPdfPage();
    if (pg) return autoScalePdf(pg, P.bgW || 1400);
  } catch (e) { console.warn('autoScaleFromBg pdf', e); }
  const img = new Image();
  img.onload = () => autoScaleImage(img, P.bgW || 1400);
  img.src = P.bg;
}
/* ===== שלב 2 — אימות ליד נקודה מסומנת =====
   המשתמש לוחץ על התכנית ליד מספר מידה; קוראים בזום רק את האזור הזה, מחפשים זוג מידות סמוכות
   שמסכים עם הכיתוב (או קובע קנה מידה כשאין כיתוב), ומסמנים אותו באדום על התכנית. כל לחיצה נוספת מוסיפה זוגות. */
function asVerifyMode() {
  if (!P.bg) { uiToast('אין תכנית'); return; }
  window.__asPick = window.__asPick ? null : { at: Date.now() };
  render();
  if (window.__asPick) uiToast('📐 לחץ על התכנית ליד מספר מידה (שרשרת מידות) — Esc לביטול', 6000);
}
async function asVerifyAt(pt) {
  try {
    if (P.bgRot) { uiToast('לאימות ליד נקודה סובב את התכנית חזרה ל-0°'); return; }
    const W = P.bgW || 1400, H = bgHeightPx();
    const u = (pt.x - bgLeft()) / W, v = (pt.y - bgTop()) / H;
    if (u < 0 || u > 1 || v < 0 || v > 1) { uiToast('לחץ בתוך התכנית'); return; }
    uiToast('🔍 קורא את המידות ליד הנקודה…', 5000);
    const pg = await asPdfPage();
    const prev = P.autoScale || {};
    const ratio = prev.ratio ? { n: prev.ratio, votes: 1 } : null;
    const key = P.id + '|' + (P.curSheet || '');
    if (!window.__asVer || window.__asVer.key !== key) window.__asVer = { key, toks: [] };
    let r, pxPerM;
    if (pg) {
      const vp = pg.getViewport({ scale: 1 });
      /* אריח אחד בזום גבוה (×9, ספרות של 1.5 מ״מ יוצאות ~40px) — 35 ס״מ נייר סביב הנקודה */
      const toks = await asOcrZoomPdf(pg, { sc: 9, tile: 3200, at: { x: u * vp.width, y: v * vp.height } });
      if (!toks.length) { uiToast('לא נקראו מספרים ליד הנקודה — לחץ קרוב יותר למספר מידה, או נסה נקודה אחרת', 6000); return; }
      window.__asVer.toks.push(...toks);
      const tokens = [...(window.__asTextToks || []), ...window.__asVer.toks];
      r = asDecide(tokens, ratio, ratio ? (1000 * AS_PT_PER_MM) / ratio.n : null, 0.05);
      r.step = 2; r.verified = (prev.verified || 0) + 1; r.showAll = true;
      pxPerM = asFinishPdf(r, tokens, pg, W);
    } else {
      /* תמונה: חיתוך סביב הנקודה, הגדלה, ניקוי ו-OCR */
      const img = await new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = P.bg; });
      const side = Math.round(Math.max(img.width, img.height) * 0.14), SC = Math.max(1, Math.min(6, 1700 / side));
      const x0 = Math.max(0, Math.round(u * img.width - side / 2)), y0 = Math.max(0, Math.round(v * img.height - side / 2));
      const cv = document.createElement('canvas'); cv.width = cv.height = Math.round(side * SC);
      const g = cv.getContext('2d'); g.imageSmoothingQuality = 'high'; g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
      g.drawImage(img, x0, y0, side, side, 0, 0, cv.width, cv.height);
      if (!asPrepBin(g, cv.width, cv.height, SC)) { uiToast('לא נקראו מספרים ליד הנקודה — נסה נקודה אחרת', 6000); return; }
      const worker = await asWorker();
      const toks = await asOcrBin(worker, cv, SC, x0, y0, false);
      await worker.terminate();
      if (!toks.length) { uiToast('לא נקראו מספרים ליד הנקודה — לחץ קרוב יותר למספר מידה, או נסה נקודה אחרת', 6000); return; }
      window.__asVer.toks.push(...toks);
      const tokens = window.__asVer.toks;
      r = asDecide(tokens, ratio, null, 0.05);
      r.step = 2; r.verified = (prev.verified || 0) + 1; r.tokens = tokens.length; r.pageMm = prev.pageMm;
      pxPerM = r.unitPerM ? r.unitPerM * (W / img.width) : null;
      asNormMarks(r, img.width, img.height, false);
      asApply(r, pxPerM, 'image');
    }
    if (!r.chain) uiToast('נקראו ' + window.__asVer.toks.length + ' מספרים אבל לא זוג מידות סמוכות — לחץ ליד שרשרת מידות (שני מספרים על אותו קו)', 7000);
    else uiToast((r.conf === 'high' ? '✓ אומת: ' : '📐 ') + asLabel(r), 6000);
  } catch (e) { console.warn('asVerifyAt', e); uiToast('האימות נכשל: ' + (e.message || e)); }
}
window.asVerifyMode = asVerifyMode; window.asVerifyAt = asVerifyAt;
window.autoScaleFromBg = autoScaleFromBg;

/* --- סימון על התכנית: איזה זוגות מידות שימשו — כדי שאפשר יהיה לוודא בעין --- */
function asNormMarks(r, srcW, srcH, yUp) {
  const mk = (r.chain && r.chain.marks) || [];
  r.marks = mk.map(m => ({ a: m.a, b: m.b, va: m.va, vb: m.vb, vert: !!m.vert, real: m.real,
    au: m.ax / srcW, av: yUp ? 1 - m.ay / srcH : m.ay / srcH, aw: m.aw / srcW, ah: m.ah / srcH,
    bu: m.bx / srcW, bv: yUp ? 1 - m.by / srcH : m.by / srcH, bw: m.bw / srcW, bh: m.bh / srcH }));
  if (r.chain) delete r.chain.marks;
  r.show = true;
}
function asMarksSVG() {
  /* לכל מידה ששימשה: קו אדום עם קצוות באורך המידה לפי קנה המידה הנוכחי — הקצוות
     חייבים לנחות בדיוק על סימוני המידה שבשרטוט. הערך כתוב באדום ליד המספר המקורי. */
  const r = P.autoScale;
  if (!r || !r.marks || !r.marks.length || r.show === false || !P.bg || !P.scale || calMode) return '';
  const L = bgLeft(), T = bgTop(), W = P.bgW || 1400, H = bgHeightPx(), k = 1 / P.scale;
  const sw = Math.max(0.6, 1.2 / getZ());   /* קו דק — כדי לראות מתחתיו את קווי המידה של השרטוט */
  const seen = new Set();
  let out = '';
  const one = (u, v, w, h, txt, val, vert) => {
    if (!(val > 0) || !(u >= 0) || !(v >= 0)) return;   /* סימונים מגרסה ישנה בלי ערך — מדלגים */
    const key = Math.round(u * 1000) + '|' + Math.round(v * 1000); if (seen.has(key)) return; seen.add(key);
    const x = L + u * W, y = T + v * H, len = val * k, half = len / 2;
    const lw = Math.max(w * W, 12), lh = Math.max(h * H, 7);
    /* הכיתוב קטן מהמספר שבשרטוט (70% מגובהו) ויושב מתחת לקו — לא מכסה את המספר המקורי, כך שאפשר להשוות */
    const fz = Math.max(7 / getZ(), Math.min(lh * 0.7, 11 / getZ())), tick = Math.max(lh * 0.35, 2);
    if (!vert) {
      const ly = y + lh * 0.9;
      out += `<line x1="${x - half}" y1="${ly}" x2="${x + half}" y2="${ly}" stroke="#e02020" stroke-width="${sw}"/>`;
      out += `<line x1="${x - half}" y1="${ly - tick}" x2="${x - half}" y2="${ly + tick}" stroke="#e02020" stroke-width="${sw}"/><line x1="${x + half}" y1="${ly - tick}" x2="${x + half}" y2="${ly + tick}" stroke="#e02020" stroke-width="${sw}"/>`;
      out += `<text x="${x}" y="${ly + tick + fz * 1.05}" text-anchor="middle" font-size="${fz}" font-weight="700" fill="#e02020" direction="ltr" unicode-bidi="embed" opacity="0.9">= ${val.toFixed(2)}m</text>`;
    } else {
      const lx = x - lh * 0.9;
      out += `<line x1="${lx}" y1="${y - half}" x2="${lx}" y2="${y + half}" stroke="#e02020" stroke-width="${sw}"/>`;
      out += `<line x1="${lx - tick}" y1="${y - half}" x2="${lx + tick}" y2="${y - half}" stroke="#e02020" stroke-width="${sw}"/><line x1="${lx - tick}" y1="${y + half}" x2="${lx + tick}" y2="${y + half}" stroke="#e02020" stroke-width="${sw}"/>`;
      out += `<text x="${lx - tick - fz * 0.3}" y="${y + fz * 0.35}" text-anchor="end" font-size="${fz}" font-weight="700" fill="#e02020" direction="ltr" unicode-bidi="embed" opacity="0.9">= ${val.toFixed(2)}m</text>`;
    }
  };
  /* ברירת מחדל: סימון אחד בלבד — המידה הארוכה ביותר (הכי קל לוודא בעין); "הצג את כולם" מציג הכל */
  if (r.showAll) r.marks.forEach(m => { one(m.au, m.av, m.aw, m.ah, m.a, m.va, m.vert); one(m.bu, m.bv, m.bw, m.bh, m.b, m.vb, m.vert); });
  else {
    let best = null;
    r.marks.forEach(m => { [[m.au, m.av, m.aw, m.ah, m.a, m.va], [m.bu, m.bv, m.bw, m.bh, m.b, m.vb]].forEach(c => { if (c[5] > 0 && (!best || c[5] > best[5])) best = c.concat([m.vert]); }); });
    if (best) one(...best);
  }
  return `<g pointer-events="none">${out}</g>`;
}

/* קנה מידה שהוקלד ידנית ("1 : 50") — מאומת מול המידות, ואם אין מידות מוחל לפי גודל הדף */
function asSetRatio(v) {
  const n = +v; const r = P.autoScale || (P.autoScale = { conf: 'none', marks: [], src: 'manual' });
  if (!(n > 0)) { r.ratio = null; save(); render(); return; }
  r.ratio = n; r.ratioSrc = 'user';
  if (r.pageMm) {
    const pxR = (P.bgW || 1400) / (r.pageMm[0] * n / 1000);
    if (P.scale) { r.dev = Math.abs(pxR - 1 / P.scale) / (1 / P.scale); }
    if (!P.scale || (!r.chain && P.calSrc !== 'manual')) { P.scale = 1 / pxR; P.calSrc = 'auto'; P.calOk = 0; r.pxPerM = pxR; r.conf = 'medium'; r.method = 'ratio'; r.note = 'לפי 1:' + n + ' שהוקלד וגודל הדף — אשר או כייל ידנית'; if (typeof recalcCableLengths === 'function') recalcCableLengths(); }
    uiToast(r.dev != null ? '1:' + n + ' מול המידות: סטייה ' + (r.dev * 100).toFixed(1) + '%' : '1:' + n + ' הוחל לפי גודל הדף');
  } else uiToast('1:' + n + ' נשמר — בתמונה אין גודל דף לאימות');
  save(); render(); if (typeof WIZ !== 'undefined' && WIZ) wizRender();
}
window.asSetRatio = asSetRatio;

/* שני כפתורי הזיהוי — שלב 1 (כיתוב) ושלב 2 (אימות ליד נקודה) */
function asStepButtonsHTML() {
  if (!P.bg) return '';
  const pick = !!window.__asPick, r = P.autoScale;
  return '<div style="display:flex;gap:4px;margin-top:6px">' +
    '<button style="flex:1" onclick="autoScaleFromBg()" title="קורא את הכיתוב 1:N בחותמת השרטוט (שכבת טקסט או OCR) ומחיל אותו">🔍 ' + (r ? 'שלב 1 — זהה שוב' : 'שלב 1 — זהה קנה מידה') + '</button>' +
    '<button style="flex:1;' + (pick ? 'background:#ff8a50;color:#1a1e28;font-weight:700' : '') + '" onclick="asVerifyMode()" title="לחיצה ליד מספר מידה בתכנית: קורא את המידות שם ומאמת (או קובע) את קנה המידה, עם סימון אדום להשוואה בעין">📐 ' + (pick ? 'לחץ ליד מידה… (Esc)' : 'שלב 2 — אמת ליד מידה') + '</button></div>';
}
window.asStepButtonsHTML = asStepButtonsHTML;
