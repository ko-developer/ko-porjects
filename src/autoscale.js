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
function asFindRatio(lines) {
  const votes = {};
  const add = (n, w) => { if (AS_RATIOS.includes(n)) votes[n] = (votes[n] || 0) + w; };
  for (const t of lines) {
    const s = String(t);
    let m;
    /* 1:50 — ה-1 לא חלק ממספר אחר (למשל 11:50 או 1:50:00) */
    const rx = /(?:^|[^\d.,])1\s*[:∶：]\s*(\d{2,4})(?![\d.,:])/g;
    while ((m = rx.exec(s))) add(+m[1], /scale|קנ|מידה|מ\.ק|ק\.מ/i.test(s) ? 3 : 1);
    /* 1/50 — רק ליד המילה קנה מידה / scale */
    const rx2 = /(?:scale|קנ["'״]?מ|קנה\s*מידה)\s*[:\-–]?\s*1\s*\/\s*(\d{2,4})(?!\d)/gi;
    while ((m = rx2.exec(s))) add(+m[1], 3);
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
  if (dec) return null;                              /* מ״מ וס״מ נכתבים כמספר שלם */
  if (unit === 'mm') return v >= 100 && v <= 60000 ? v / 1000 : null;
  if (unit === 'cm') return v >= 10 && v <= 6000 ? v / 100 : null;
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
function asChainEstimate(lines, unit) {
  const ks = [], samples = [];
  for (const ln of lines) {
    const along = ln.items.length && (ln.items[0].frame === 'v' || ln.items[0].frame === 'w') ? 'y' : 'x';
    const nums = ln.items.map(tk => ({ tk, v: asParse(tk.t, unit) })).filter(o => o.v != null);
    for (let i = 0; i + 1 < nums.length; i++) {
      const a = nums[i], b = nums[i + 1];
      const d = Math.abs(b.tk[along] - a.tk[along]);
      const real = (a.v + b.v) / 2;
      if (d < Math.max(4, a.tk.h * 1.2) || real < 0.3 || real > 80) continue;
      const k = d / real;
      const vt = a.tk.frame !== 'h';   /* טקסט אנכי: הרוחב רץ לאורך y */
      ks.push(k); samples.push({ a: a.tk.t, b: b.tk.t, d, real, k, ax: a.tk.x, ay: a.tk.y, aw: vt ? a.tk.h : a.tk.w, ah: vt ? a.tk.w : a.tk.h, bx: b.tk.x, by: b.tk.y, bw: vt ? b.tk.h : b.tk.w, bh: vt ? b.tk.w : b.tk.h });
    }
  }
  if (ks.length < 2) return null;
  const med = asMedian(ks);
  const inl = samples.filter(s => Math.abs(s.k - med) / med <= 0.06);
  if (inl.length < 2) return null;
  const k2 = asMedian(inl.map(s => s.k));
  const mad = asMedian(inl.map(s => Math.abs(s.k - k2))) / k2;
  return { unit, k: k2, n: inl.length, total: ks.length, mad, samples: inl.slice(0, 6), marks: inl.slice(0, 60) };
}

/* --- החלטה: הצלבה של "1:N" עם שרשרות המידות ---
   tokens בקואורדינטות של מסגרת המקור (נקודות PDF או פיקסלים של תמונת ה-OCR);
   unitPerM_ratio = כמה יחידות-מקור למטר לפי הכיתוב (null אם אין גודל דף) */
function asDecide(tokens, ratio, unitPerM_ratio) {
  const lines = [...asLines(tokens, 'h'), ...asLines(tokens, 'v'), ...asLines(tokens, 'w')];
  const ests = ['mm', 'cm', 'm'].map(u => asChainEstimate(lines, u)).filter(Boolean);
  /* הפרשנות הנכונה: הכי הרבה זוגות עקביים; אם יש "1:N" — זו שמסכימה איתו */
  let chain = null;
  if (ests.length) {
    const agree = unitPerM_ratio ? ests.filter(e => Math.abs(e.k - unitPerM_ratio) / unitPerM_ratio <= 0.05) : [];
    const pool = agree.length ? agree : ests;
    chain = pool.sort((a, b) => b.n - a.n || a.mad - b.mad)[0];
  }
  const r = { ratio: ratio ? ratio.n : null, ratioVotes: ratio ? ratio.votes : 0, unitPerM_ratio: unitPerM_ratio || null,
    chain: chain ? { unit: chain.unit, n: chain.n, total: chain.total, mad: chain.mad, k: chain.k, samples: chain.samples.map(x => ({ a: x.a, b: x.b, real: x.real, k: x.k })), marks: chain.marks } : null,
    unitPerM: null, conf: 'none', method: '', note: '', dev: null };
  const strongChain = chain && chain.n >= 6 && chain.mad <= 0.02;
  if (chain && unitPerM_ratio) {
    r.dev = Math.abs(chain.k - unitPerM_ratio) / unitPerM_ratio;
    if (r.dev <= 0.03) { r.unitPerM = chain.k; r.conf = 'high'; r.method = 'ratio+dims'; r.note = 'הכיתוב 1:' + ratio.n + ' והמידות בשרטוט מסכימים'; }
    else if (chain.n >= 4) { r.unitPerM = chain.k; r.conf = strongChain ? 'high' : 'medium'; r.method = 'dims'; r.note = 'הכיתוב אומר 1:' + ratio.n + ' אבל המידות בשרטוט לא מסכימות (' + Math.round(r.dev * 100) + '%) — כנראה הודפס בהתאמה לדף. נלקחו המידות'; }
    else { r.unitPerM = unitPerM_ratio; r.conf = 'medium'; r.method = 'ratio'; r.note = 'לפי הכיתוב 1:' + ratio.n + ' וגודל הדף; מעט מידות בשרטוט לאימות (' + Math.round(r.dev * 100) + '% סטייה)'; }
  } else if (chain && chain.n >= 3) {
    r.unitPerM = chain.k; r.conf = strongChain ? 'high' : (chain.n >= 4 ? 'medium' : 'low'); r.method = 'dims';
    r.note = (ratio ? 'הכיתוב 1:' + ratio.n + ' נמצא אבל אין גודל דף להצלבה; ' : 'לא נמצא כיתוב 1:N; ') + 'לפי ' + chain.n + ' זוגות מידות בשרטוט';
  } else if (unitPerM_ratio) {
    r.unitPerM = unitPerM_ratio; r.conf = 'medium'; r.method = 'ratio'; r.note = 'לפי הכיתוב 1:' + ratio.n + ' וגודל הדף בלבד — לא נמצאו מידות לאימות. אם ההדפסה הותאמה לדף, כייל ידנית';
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
  return `<div style="border:1.5px solid ${col};border-radius:9px;padding:7px 9px;margin:0 0 8px;background:#fff;font-size:11.5px;line-height:1.5">
    <b style="color:${col}">🔍 זיהוי אוטומטי${over ? ' (נדרס בכיול ידני)' : ''}:</b> ${esc(asLabel(r))}<br>
    <span class="muted">${esc(r.note || '')}${r.pxPerM ? ' · 1 מ׳ = ' + r.pxPerM.toFixed(1) + 'px' : ''}</span>
    ${r.marks && r.marks.length ? `<button style="width:100%;margin-top:6px;${r.show === false ? '' : 'background:#eef7f1;border-color:#0f6e56;color:#0f6e56'}" onclick="P.autoScale.show=!(P.autoScale.show!==false);save();render()">👁 ${r.show === false ? 'הצג' : 'מוצג'} על התכנית: ${r.marks.length} זוגות המידות ששימשו לזיהוי</button>` : ''}
    ${r.chain && r.chain.samples && r.chain.samples.length ? `<details style="margin-top:3px"><summary class="muted" style="cursor:pointer">המידות ששימשו לאימות</summary>
      <div class="muted" style="font-size:10.5px">${r.chain.samples.map(s => esc(s.a) + ' ↔ ' + esc(s.b) + ' → ' + s.real.toFixed(2) + ' מ׳').join('<br>')}</div></details>` : ''}
    ${r.pxPerM && over ? `<button style="width:100%;margin-top:6px" onclick="P.calSrc='';asApply(P.autoScale,P.autoScale.pxPerM,P.autoScale.src,true);uiToast('✓ הוחל קנה המידה שזוהה — במקום הכיול הידני')">↺ השתמש בזיהוי (1 מ׳ = ${r.pxPerM.toFixed(1)}px) במקום הכיול הידני (${(1 / P.scale).toFixed(1)}px)</button>` : ''}
    ${!r.pxPerM || over ? '' : (P.calOk ? '' : `<button class="primary" style="width:100%;margin-top:6px;background:#0f6e56" onclick="P.calOk=1;save();render();if(typeof WIZ!=='undefined'&&WIZ)wizRender();uiToast('✓ קנה המידה האוטומטי אושר')">✓ הזיהוי נכון — אשר</button>`)}
    ${P.bg && r.src !== 'pdf' ? `<button style="width:100%;margin-top:6px" onclick="autoScaleFromBg()">🔍 זהה שוב (OCR על התמונה)</button>` : ''}
  </div>`;
}

/* ================= PDF: שכבת הטקסט ================= */
async function autoScalePdf(pg, bgW) {
  try {
    const tc = await pg.getTextContent();
    const vp = pg.getViewport({ scale: 1 });
    const pageW = vp.width; /* נקודות */
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
    const lines = [...asLines(tokens, 'h'), ...asLines(tokens, 'v')].map(l => l.text);
    const ratio = asFindRatio(lines);
    /* נקודות למטר לפי הכיתוב: דף בנקודות ↔ אמיתי = דף × N */
    const ptPerM_ratio = ratio ? (1000 * AS_PT_PER_MM) / ratio.n : null;
    const r = asDecide(tokens, ratio, ptPerM_ratio);
    const pxPerM = r.unitPerM ? r.unitPerM * (bgW / pageW) : null;
    asNormMarks(r, pageW, vp.height, true);
    r.tokens = tokens.length; r.pageMm = [Math.round(pageW / AS_PT_PER_MM), Math.round(vp.height / AS_PT_PER_MM)];
    asApply(r, pxPerM, 'pdf');
    uiToast(pxPerM ? '🔍 קנה מידה זוהה אוטומטית: ' + asLabel(r) : '🔍 לא זוהה קנה מידה אוטומטית — ' + r.note, 6000);
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
    const ratio = asFindRatio(lines);
    const r = asDecide(tokens, ratio, null);   /* בתמונה אין גודל דף — רק המידות */
    const pxPerM = r.unitPerM ? r.unitPerM * (bgW / cv.width) : null;
    asNormMarks(r, cv.width, cv.height, false);
    r.tokens = tokens.length;
    asApply(r, pxPerM, 'ocr');
    uiToast(pxPerM ? '🔍 קנה מידה זוהה מהתמונה: ' + asLabel(r) : '🔍 לא זוהה קנה מידה מהתמונה — ' + r.note, 6000);
    return r;
  } catch (e) { console.warn('autoScaleImage', e); uiToast('⚠ זיהוי אוטומטי נכשל: ' + (e.message || e)); return null; }
}
/* הרצה חוזרת על תכנית קיימת (תמונת הרקע השמורה) */
function autoScaleFromBg() {
  if (!P.bg) { uiToast('אין תכנית'); return; }
  const img = new Image();
  img.onload = () => autoScaleImage(img, P.bgW || 1400);
  img.src = P.bg;
}
window.autoScaleFromBg = autoScaleFromBg;

/* --- סימון על התכנית: איזה זוגות מידות שימשו — כדי שאפשר יהיה לוודא בעין --- */
function asNormMarks(r, srcW, srcH, yUp) {
  const mk = (r.chain && r.chain.marks) || [];
  r.marks = mk.map(m => ({ a: m.a, b: m.b, real: m.real,
    au: m.ax / srcW, av: yUp ? 1 - m.ay / srcH : m.ay / srcH, aw: m.aw / srcW, ah: m.ah / srcH,
    bu: m.bx / srcW, bv: yUp ? 1 - m.by / srcH : m.by / srcH, bw: m.bw / srcW, bh: m.bh / srcH }));
  if (r.chain) delete r.chain.marks;
  r.show = true;
}
function asMarksSVG() {
  const r = P.autoScale;
  if (!r || !r.marks || !r.marks.length || r.show === false || !P.bg || calMode) return '';
  const L = bgLeft(), T = bgTop(), W = P.bgW || 1400, H = bgHeightPx();
  const fz = Math.max(10, 12 / getZ());
  const esc2 = t => String(t).replace(/[<&]/g, c => c === '<' ? '&lt;' : '&amp;');
  let out = '';
  r.marks.forEach(m => {
    const x1 = L + m.au * W, y1 = T + m.av * H, x2 = L + m.bu * W, y2 = T + m.bv * H;
    const box = (cx, cy, w, h) => `<rect x="${cx - Math.max(w * W, 14) / 2}" y="${cy - Math.max(h * H, 8) / 2}" width="${Math.max(w * W, 14)}" height="${Math.max(h * H, 8)}" rx="2" fill="none" stroke="#0f6e56" stroke-width="1.6"/>`;
    out += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#0f6e56" stroke-width="1.6" stroke-dasharray="5 4" opacity="0.9"/>`;
    out += box(x1, y1, m.aw, m.ah) + box(x2, y2, m.bw, m.bh);
    const vert = Math.abs(x2 - x1) < Math.abs(y2 - y1);
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const txt = m.a + ' + ' + m.b + ' → ' + m.real.toFixed(2) + ' מ׳';
    const bw = txt.length * fz * 0.58 + 10;
    const tx = vert ? mx + fz * 1.2 + bw / 2 : mx, ty = vert ? my : my - fz * 1.1;
    out += `<rect x="${tx - bw / 2}" y="${ty - fz * 0.8}" width="${bw}" height="${fz * 1.3}" rx="3" fill="#0f6e56" opacity="0.9"/><text x="${tx}" y="${ty + fz * 0.25}" text-anchor="middle" direction="ltr" unicode-bidi="embed" font-size="${fz}" font-weight="700" fill="#fff">${esc2(txt)}</text>`;
  });
  return `<g pointer-events="none">${out}</g>`;
}
