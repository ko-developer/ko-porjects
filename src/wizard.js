/* ===================================================================================
   KO Projects V2 — אשף זרימה מהיר
   אותו מנוע בדיוק (app.js) בעטיפת UI מונחית-שלבים: תכנית → כיול → אזור → מערכת →
   הצעה מלאה → דוח מתקינים. נטען בכל הגרסאות; ב-/v2 נפתח אוטומטית במסך נקי.
   =================================================================================== */
let WIZ = null; /* { step } */

const WIZ_STEPS = [
  ['plan', '🖼 תכנית'], ['cal', '📏 כיול'], ['zone', '🗺 אזור'],
  ['sys', '🔊 מערכת'], ['wire', '🔌 חיווט'], ['kit', '🧰 קיט התקנה'],
  ['gap', '🤔 שכחתי משהו?'], ['offer', '🧾 הצעה'], ['report', '📑 דוח']
];
/* מצב חיווט של אזור: כמה רמקולים ניזונים מקו */
function wizWireStat(z) {
  const fed = new Set(); P.cables.forEach(c => { if (c.to) fed.add(c.to); });
  const spks = P.nodes.filter(n => n.kind === 'point' && (!n.ptype || n.ptype === 'speaker' || n.ptype === 'sub')
    && (n.sub || '').includes(z.name) && !/עמדת נגינה|מגבר|פרוססור|מיקרופון/i.test(n.name));
  return { tot: spks.length, fed: spks.filter(n => fed.has(n.id)).length };
}

function wizardStart() {
  WIZ = { step: wizAutoStep() };
  if (!document.getElementById('wizCss')) {
    const st = document.createElement('style');
    st.id = 'wizCss';
    st.textContent = `
      #wiz{position:fixed;top:12px;left:12px;width:340px;max-height:calc(100vh - 24px);z-index:90;background:#fff;border-radius:16px;box-shadow:0 14px 44px rgba(15,20,30,.28);display:flex;flex-direction:column;font-size:13.5px;overflow:hidden;border:1px solid #e7e2d8}
      #wiz .wzhead{background:linear-gradient(135deg,#1a1e28,#2d3444);color:#fff;padding:12px 14px;display:flex;align-items:center;gap:8px}
      #wiz .wzhead b{flex:1;font-size:15px}
      #wiz .wzsteps{display:flex;gap:2px;padding:8px 10px;background:#f7f5f0;border-bottom:1px solid #eee;flex-wrap:nowrap;overflow-x:auto}
      #wiz .wzstep{flex:1;text-align:center;font-size:10.5px;padding:5px 2px;border-radius:8px;cursor:pointer;white-space:nowrap;color:#777}
      #wiz .wzstep.on{background:#c9502e;color:#fff;font-weight:700}
      #wiz .wzstep.done{color:#0f6e56;font-weight:700}
      #wiz .wzbody{padding:12px 14px;overflow-y:auto}
      #wiz .wzbody h4{margin:0 0 6px;font-size:14px}
      #wiz .wzbody p.hint{font-size:11.5px;color:#8a8377;margin:0 0 10px;line-height:1.5}
      #wiz button.big{display:block;width:100%;padding:10px;border-radius:10px;border:none;background:#c9502e;color:#fff;font-weight:700;font-size:13.5px;cursor:pointer;margin-bottom:7px}
      #wiz button.sec{display:block;width:100%;padding:8px;border-radius:10px;border:1px solid #ddd;background:#faf8f4;font-size:12.5px;cursor:pointer;margin-bottom:7px}
      #wiz button.done{background:#eef7f1;color:#0f6e56;border:1px solid #bfe0cd}
      #wiz input,#wiz select{width:100%;padding:8px;border:1px solid #ddd;border-radius:9px;font-size:13.5px;box-sizing:border-box;margin-bottom:7px;font-family:inherit}
      #wiz .wzfoot{padding:8px 14px 12px;display:flex;gap:6px;border-top:1px solid #f0ede6}
      #wiz .wzfoot button{flex:1;padding:8px;border-radius:9px;border:1px solid #ddd;background:#fff;cursor:pointer;font-size:12.5px}
      #wiz .wzfoot button.nx{background:#0f6e56;color:#fff;border:none;font-weight:700}
      #wiz .kpi{display:flex;gap:6px;margin-bottom:8px}
      #wiz .kpi div{flex:1;background:#f7f5f0;border-radius:9px;padding:6px;text-align:center}
      #wiz .kpi b{display:block;font-size:16px}
      #wiz .kpi small{font-size:9.5px;color:#8a8377}
      body.v2 header, body.v2 #side, body.v2 #dock, body.v2 #legend, body.v2 #cablekey{display:none !important}
      body.v2 #canvasWrap{inset:0 !important;width:100vw !important}
      body.v2.wzdock #dock{display:block !important}`;
    document.head.appendChild(st);
  }
  wizRender();
  clearInterval(window.__wizT);
  window.__wizT = setInterval(() => { if (WIZ && document.getElementById('wiz')) wizRefreshBadges(); }, 1200);
}
function wizClose() { WIZ = null; clearInterval(window.__wizT); const w = document.getElementById('wiz'); if (w) w.remove(); document.body.classList.remove('wzdock'); }

/* השלב ההגיוני הבא לפי מצב הפרויקט — נכנסים ישר לאיפה שעצרת */
function wizAutoStep() {
  if (!P.bg) return 0;
  if (!P.scale) return 1;
  if (!(P.zones || []).length) return 2;
  if (!(P.zones || []).every(z => z._built)) return 3;
  if ((P.zones || []).some(z => { const w = wizWireStat(z); return w.tot && w.fed < w.tot; })) return 4;
  if (!P._instKit) return 5;
  if (!P._gapOk) return 6;
  return 7;
}
function wizZone() { return (P.zones || []).find(z => z.id === WIZ?.zid) || (P.zones || [])[0]; }
function wizDone(i) {
  const zs = P.zones || [];
  const allBuilt = zs.length > 0 && zs.every(z => z._built);
  const allWired = zs.length > 0 && zs.every(z => { const w = wizWireStat(z); return !w.tot || w.fed >= w.tot; }) && zs.some(z => wizWireStat(z).tot);
  return [!!P.bg, !!P.scale, !!zs.length, allBuilt, allWired, !!P._instKit, !!P._gapOk, impItems.length > 0, false][i];
}
function wizRefreshBadges() {
  document.querySelectorAll('#wiz .wzstep').forEach((el, i) => el.classList.toggle('done', wizDone(i) && i !== WIZ.step));
}

function wizRender() {
  const old = document.getElementById('wiz'); if (old) old.remove();
  if (!WIZ) return;
  const w = document.createElement('div');
  w.id = 'wiz';
  const steps = WIZ_STEPS.map(([k, l], i) =>
    `<div class="wzstep ${i === WIZ.step ? 'on' : ''} ${wizDone(i) && i !== WIZ.step ? 'done' : ''}" onclick="WIZ.step=${i};wizRender()">${wizDone(i) && i !== WIZ.step ? '✓ ' : ''}${l}</div>`).join('');
  w.innerHTML = `
    <div class="wzhead" style="cursor:move" title="גרור להזזת החלון"><span style="opacity:.55">⠿</span><b>⚡ KO V2 — אשף מהיר</b>
      <span style="font-size:11px;opacity:.75">${esc(P.name.slice(0, 18))}</span>
      <button onclick="wizClose()" style="background:transparent;border:none;color:#fff;font-size:15px;cursor:pointer" title="סגור אשף">✕</button></div>
    <div class="wzsteps">${steps}</div>
    <div class="wzbody" id="wizBody">${wizStepHTML(WIZ.step)}</div>
    <div class="wzfoot">
      <button onclick="WIZ.step=Math.max(0,WIZ.step-1);wizRender()" ${WIZ.step === 0 ? 'disabled' : ''}>▶ הקודם</button>
      <button class="nx" onclick="wizNext()" ${WIZ.step === WIZ_STEPS.length - 1 ? 'disabled' : ''}>הבא ◀</button>
    </div>`;
  document.body.appendChild(w);
  /* חלון צף — נגרר מהכותרת והמיקום נשמר */
  const pos = store.wizPos;
  if (pos) {
    w.style.left = Math.max(0, Math.min(pos.x, window.innerWidth - 140)) + 'px';
    w.style.top = Math.max(0, Math.min(pos.y, window.innerHeight - 80)) + 'px';
  }
  w.querySelector('.wzhead').addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    const r = w.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
    const mv = ev => {
      const x = Math.max(-r.width + 140, Math.min(window.innerWidth - 140, ev.clientX - dx));
      const y = Math.max(0, Math.min(window.innerHeight - 60, ev.clientY - dy));
      w.style.left = x + 'px'; w.style.top = y + 'px';
      store.wizPos = { x, y };
    };
    const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); save(); };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    e.preventDefault();
  });
}

function wizStepHTML(s) {
  const z = wizZone();
  if (s === 0) return `
    <h4>העלאת תכנית</h4>
    <p class="hint">גרור/בחר צילום או PDF-תמונה של התכנית. אפשר גם להמשיך עם התכנית הקיימת.</p>
    ${P.bg ? `<button class="sec done">✓ יש תכנית בפרויקט — אפשר להמשיך</button>` : ''}
    <input type="file" accept="image/*,application/pdf,.pdf,.dxf,.dwg" onchange="wizUploadBg(this)">
    <button class="sec" onclick="wizNewProject()">🗂 התחל פרויקט חדש נקי</button>`;
  if (s === 1) {
    const curW = P.scale ? P.bgW * P.scale : 0;
    const odd = curW && (curW < 4 || curW > 200);
    return `
    <h4>כיול קנה מידה</h4>
    <button class="sec" onclick="cropStart()">✂️ חתוך את התכנית — סמן את החלק הרלוונטי</button>
    ${P.scale ? `<div class="kpi" style="margin-bottom:7px"><div style="background:${P.calOk ? '#eef7f1' : '#fdf3e6'};outline:2px solid ${P.calOk ? '#0f6e56' : '#c96a13'}">
        <b style="color:${P.calOk ? '#0f6e56' : '#c96a13'}">${P.calOk ? '✓ מכויל ומאושר' : '⏳ כיול לא מאושר'}</b><small>1 מ׳ = ${(1 / P.scale).toFixed(1)}px · רוחב התכנית ${curW.toFixed(1)} מ׳${P.calLine ? ' · 📏 קו ייחוס על התכנית' : ''}</small></div></div>
      ${odd ? `<p class="hint" style="color:#c1121f;font-weight:700">⚠ רוחב תכנית של ${curW.toFixed(1)} מ׳ אינו סביר — כייל מחדש לפני שממשיכים.</p>` : ''}
      ${!P.calOk ? `<p class="hint">📏 קו הייחוס הסגול מוצג על התכנית ברוחב המלא + סרגל 5 מ׳. השווה מול שולחן (~0.8 מ׳), דלת (~0.9 מ׳) או מידה מודפסת — ורק אז אשר.</p>
        <button class="big" style="background:#0f6e56" onclick="wizCalConfirm()">✓ הכיול נכון — אשר והמשך</button>` : ''}`
      : `<p class="hint">כייל בשתי לחיצות על מידה ידועה בתכנית — קיר, פתח או מידה מודפסת (מידות בתכנית בנייה בד"כ במ״מ: 23700 = 23.7 מ׳).</p>`}
    <button class="big" onclick="calMode={pts:[]};render()">📏 כיול מדויק — לחץ על 2 נקודות שהמרחק ביניהן ידוע</button>`;
  }
  if (s === 2) {
    const usages2 = typeof USAGES !== 'undefined' ? USAGES : [];
    return `
    <h4>סימון אזור סאונד</h4>
    ${(P.zones || []).map(zz => `<button class="sec ${zz.id === (WIZ.zid || (P.zones[0] || {}).id) ? 'done' : ''}" onclick="WIZ.zid='${zz.id}';selZone='${zz.id}';render();wizRender()">🗺 ${esc(zz.name)} · ${zoneAreaM(zz).toFixed(0)} מ"ר${zz.usage ? ' · ' + esc(zz.usage) : ''}</button>`).join('')}
    <input id="wizZName" placeholder="שם האזור (למשל: מסעדה / רחבה)">
    ${z ? `<label style="font-size:12px;font-weight:700;display:block;margin:6px 0 2px">🎯 מה עושים ב"${esc(z.name)}"? <span style="color:#c1121f">(חובה)</span></label>
    <select id="wizUse" style="${z.usage ? '' : 'border:1.5px solid #c1121f'}" onchange="setZoneField('${z.id}','usage',this.value);wizRender()">
      <option value="">— תכלית / עוצמה —</option>
      ${usages2.map(u => `<option ${z.usage === u ? 'selected' : ''} value="${u}">${u}${typeof USAGE_SPL !== 'undefined' && USAGE_SPL[u] ? ' · יעד ' + USAGE_SPL[u] + 'dB' : ''}</option>`).join('')}
    </select>` : ''}
    ${z ? `<label style="font-size:12px;font-weight:700;display:block;margin:8px 0 3px">🎚 מה מנגן באזור? <span style="color:#c1121f">(חובה)</span> — קובע מיקסר / כרטיס קול / פרוססור</label>
    ${(() => { const others = wizSrcZones(z); if (!others.length) return ''; wizSyncSources(z); const from = wizSharedFrom(z); const lbl = k => (SOURCES.find(s => s[0] === k) || [k, k])[1].replace(/^\S+\s/, '');
      return `<div style="display:flex;flex-direction:column;gap:4px;margin-bottom:6px">
        ${others.map(o => `<button class="sec" style="margin:0;text-align:right;${from === o ? 'background:#efecfd;border-color:#6c5ce7;color:#4b3fb8;font-weight:700' : ''}" onclick="wizSrcShare('${z.id}','${o.id}')">${from === o ? '◉' : '○'} 🔗 אותם מקורות כמו "${esc(o.name)}" — ${esc((o.sources || []).map(lbl).join(', '))}</button>`).join('')}
        <button class="sec" style="margin:0;text-align:right;${!from ? 'background:#eef7f1;border-color:#0f6e56;color:#0f6e56;font-weight:700' : ''}" onclick="wizSrcShare('${z.id}','')">${!from ? '◉' : '○'} 🎛 מקורות משלו לאזור הזה</button>
        ${from ? `<p class="hint" style="margin:0 0 2px">המשותפים מסומנים 🔗 ולא ניתנים לשינוי מכאן · צ׳יפ נוסף = מקור <b>מקומי</b> של "${esc(z.name)}" — רק לו תוצב עמדה/פאנל</p>` : ''}
      </div>`; })()}
    <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px">
      ${(() => { const from = wizSharedFrom(z), sh = from ? (from.sources || []) : []; return SOURCES.map(([k, l]) => { const on = (z.sources || []).includes(k), shared = sh.includes(k); return `<button class="sec" style="width:auto;flex:0 0 auto;margin:0;padding:5px 9px;font-size:11.5px;${shared ? 'background:#efecfd;border-color:#c9c0f5;color:#4b3fb8;font-weight:700;cursor:default' : on ? 'background:#eef7f1;border-color:#0f6e56;color:#0f6e56;font-weight:700' : ''}" onclick="wizSrcToggle('${z.id}','${k}')">${shared ? '🔗 ' : on ? '✓ ' : ''}${l}</button>`; }).join(''); })()}
    </div>
    ${(() => { const nd = sourceNeeds(z); return nd.length ? `<p class="hint" style="margin:-2px 0 8px;color:#0f6e56">נדרש בארון: ${esc(nd.join(' · '))}</p>` : ''; })()}` : ''}
    <button class="big" onclick="wizDrawZone()">➕ ${(P.zones || []).length ? 'צייר אזור נוסף' : 'צייר אזור'} — ניקור נקודות על התכנית</button>
    <button class="sec" onclick="autoZones()">🤖 זיהוי אזורים אוטומטי (AI)</button>`;
  }
  if (s === 3) {
    if (!z) return '<p class="hint">קודם סמן אזור בשלב הקודם.</p>';
    const usages = typeof USAGES !== 'undefined' ? USAGES : [];
    return `
    <h4>מערכת לאזור "${esc(z.name)}"</h4>
    ${(P.zones || []).length > 1 ? (P.zones || []).map(zz => `<button class="sec ${zz.id === z.id ? 'done' : ''}" style="${zz.id === z.id ? 'font-weight:800' : ''}" onclick="WIZ.zid='${zz.id}';selZone='${zz.id}';render();wizRender()">${zz._built ? '✓' : '○'} ${esc(zz.name)}${zz.usage ? ' · ' + esc(zz.usage) : ''}${zz._built ? ' — נבנה' : ''}</button>`).join('') : ''}
    <select onchange="setZoneField('${z.id}','usage',this.value)">
      <option value="">— תכלית / עוצמה —</option>
      ${usages.map(u => `<option ${z.usage === u ? 'selected' : ''}>${u}</option>`).join('')}
    </select>
    <button class="big" style="background:#534ab7" onclick="zoneSpkPicker('${z.id}')">🎛 בחר מערכת — 3 הצעות · קיטים · מוצרים</button>
    <input id="wizKitQ" placeholder="🔍 או חפש ישר קיט / רמקול…" oninput="wizKitSearch(this.value)">
    <div id="wizKitRes" style="max-height:150px;overflow-y:auto"></div>
    <p class="hint" style="margin-top:4px">${z._spk ? '🔊 ' + esc(z._spk.slice(0, 42)) : 'לא נבחר רמקול — "בנה הכל" יפתח את הבורר'}</p>
    <button class="big" onclick="wizBuildAll()">${z._built ? '🔌 המשך — טבלת החיווט (המערכת כבר בנויה)' : '🚀 בנה הכל — מערכת + ארון + עמדה/קופסת במה + חיווט'}</button>
    ${z._built ? `<button class="sec" onclick="wizBuildAll(true)">🔄 בנה מחדש מאפס — מחליף את המערכת הקיימת</button>` : ''}
    ${z._built ? wizPlacementsHTML(z) : ''}`;
  }
  if (s === 4) {
    const zs = (P.zones || []).filter(zz => zz._built || wizWireStat(zz).tot);
    const allOk = zs.length && zs.every(zz => { const w2 = wizWireStat(zz); return !w2.tot || w2.fed >= w2.tot; });
    return `
    <h4>חיווט — אישור הניתוב לכל אזור</h4>
    <p class="hint">לכל אזור: טבלת הניתוב מציגה ערוצים, אום, יחס הספק, דיליי ו-Bridge. אשר "חבר" בכל אזור — ורק אז ממשיכים לקיט ההתקנה.</p>
    ${zs.map(zz => { const w2 = wizWireStat(zz); const ok = w2.tot && w2.fed >= w2.tot;
      return `<button class="sec ${ok ? 'done' : ''}" onclick="wizEnsureMic('${zz.id}');window.__patchDone=wizWireStepDone;smartWire('${zz.id}')">${ok ? '✓' : '🔌'} ${esc(zz.name)} — ${w2.fed}/${w2.tot} רמקולים מחווטים${ok ? '' : ' · פתח לאישור'}</button>`; }).join('') || '<p class="hint">אין עדיין אזורים בנויים — חזור לשלב המערכת.</p>'}
    ${allOk ? '<button class="big" style="background:#0f6e56" onclick="WIZ.step=5;wizRender()">✓ הכל מחווט — המשך לקיט ההתקנה</button>' : ''}`;
  }
  if (s === 5) {
    const kits = installKitList();
    return `
    <h4>קיט התקנה לפרויקט</h4>
    <p class="hint">קיטי התשתית שסוגרים את הפרויקט — עמדה, ארון, מולטי, פנלים ומחברים. הכמויות ניתנות לעריכה לפני ההוספה.</p>
    ${kits.map(x => `<button class="sec" onclick="P._instKit=1;save();zoneKitConfirm('${esc((z || {}).name || '').replace(/'/g, '&#39;')}',${x.i});wizRender()">🧰 ${esc(x.k.name.slice(0, 44))} · ${(x.k.items || []).length} פריטים</button>`).join('') || '<p class="hint">אין קיטי התקנה בקטלוג</p>'}
    ${P._instKit ? '<button class="sec done">✓ נבחר קיט התקנה</button>' : `<button class="sec" onclick="P._instKit=1;save();WIZ.step=6;wizRender()">דלג — בלי קיט</button>`}
    <button class="big" onclick="installManager()">🔧 טבלת התקנה ותמחור (זמנים ומחירים)</button>`;
  }
  if (s === 6) return `
    <h4>האם שכחתי משהו?</h4>
    <p class="hint">סריקה אוטומטית של התכנית מול ההצעה: חיווט, גלילי כבל, מחברים, תושבות, פס שקעים, שורת התקנה ומק"טים. כל ממצא — או שמתקנים אותו בלחיצה, או מסמנים ✓ "לקחתי בחשבון" וממשיכים.</p>
    <button class="big" onclick="projGapCheck();setTimeout(wizRender,300)">🤔 הרץ בדיקת שלמות</button>
    ${P._gapOk ? '<button class="sec done">✓ אין ממצאים פתוחים — אפשר להמשיך להצעה</button>' : ''}`;
  if (s === 7) {
    const rows = impItems.filter(it => it.on !== false);
    const total = rows.reduce((s2, it) => s2 + (+it.price || 0) * (+it.qty || 0), 0);
    const noKey = rows.filter(it => !it.key).length;
    const cablesNoRef = P.cables.filter(c => !c.stockRef && c.inst !== 'exist' && +c.len > 0).length;
    return `
    <h4>הצעת מחיר מלאה</h4>
    <div class="kpi"><div><b>${rows.length}</b><small>שורות</small></div><div><b>₪${Math.round(total).toLocaleString()}</b><small>לפני מע"מ</small></div><div><b>${P.cables.length}</b><small>כבלים</small></div></div>
    ${cablesNoRef ? `<button class="big" onclick="wizFillCables()">🧵 השלם פריטי כבלים (${cablesNoRef} קווים ללא מוצר)</button>` : '<button class="sec done">✓ כל הכבלים משויכים למוצרים</button>'}
    ${noKey ? `<button class="sec" style="border-color:#c1121f;color:#c1121f" onclick="dockOpen=true;dockMin=false;document.body.classList.add('wzdock');renderImp()">⚠ ${noKey} שורות בלי מק"ט — לא ייכנסו להצעה, לחץ להשלמה</button>` : ''}
    <div style="background:#f7f5f0;border-radius:9px;padding:7px 9px;font-size:11.5px;margin-bottom:7px">
      ${P.accountKey ? '👤 לקוח: <b>' + esc(P.accountName || '') + '</b> · ' + esc(P.accountKey) : '👤 טרם נבחר לקוח'}<br>
      ${P.erpProjId ? '📂 פרויקט ERP: <b>' + esc(P.erpProjName || '') + '</b>' : '📂 בלי פרויקט ERP — ההצעה תישלח ללקוח (ה-ERP לא מאפשר ליצור פרויקט מכאן)'}
      ${P.erpOfferCode ? '<br>✅ נשלחה כבר: <b>' + esc(P.erpOfferCode) + '</b>' : ''}
    </div>
    <button class="sec" onclick="document.body.classList.toggle('wzdock');dockOpen=true;dockMin=false;renderImp()">🧾 הצג/הסתר את ההצעה המלאה</button>
    <button class="sec" style="background:#f3ede2;border-color:#e0cfae;color:#8a5a12;font-weight:700" onclick="installerReport()">🔧 דוח הכנות, תשתיות ותכנית פרויקט — לחשמלאים ולמתקינים</button>
    <button class="big" style="background:#0f6e56" onclick="sendOffer()">📤 ${P.erpOfferCode ? 'שלח הצעה נוספת ל-ERP' : 'שלח הצעה ל-ERP'}</button>`;
  }
  return `
    <h4>דוחות</h4>
    <p class="hint">דוח המתקינים כולל: לוח ארונות, לוח משיכת כבלים (מ→אל, סוג, אורך, מחברים), לוח תליית רמקולים (גובה/תושבת/כיוון) ורשימת ציוד.</p>
    <button class="big" onclick="installerReport()">🔧 דוח מתקינים / חשמלאים</button>
    <button class="sec" onclick="window.print()">🖨 הדפסת התכנית והמפתח (הקיים)</button>`;
}

/* ---- פעולות האשף ---- */
/* מקורות משותפים בין אזורים: אזור יכול לשאוב את המקורות של אזור אחר (_srcShare)
   ולהוסיף מקורות מקומיים משלו (_srcLocal). z.sources נשאר הרשימה האפקטיבית —
   כך שכל שאר האפליקציה (תכלית, פרוססור, בדיקות) ממשיכה לעבוד בלי לדעת על השיתוף. */
function wizSrcZones(z) { return (P.zones || []).filter(x => x !== z && (x.sources || []).length && !x._srcShare); }
function wizSharedFrom(z) { return z && z._srcShare ? (P.zones || []).find(x => x.id === z._srcShare) : null; }
function wizOwnSources(z) { return z._srcShare ? (z._srcLocal || []) : (z.sources || []); }
function wizSyncSources(z) {
  const from = wizSharedFrom(z);
  if (!from) { if (z._srcShare) { z._srcShare = undefined; } return; }
  z.sources = [...new Set([...(from.sources || []), ...(z._srcLocal || [])])];
}
function wizSrcShare(zid, fromZid) {
  const z = (P.zones || []).find(x => x.id === zid); if (!z) return;
  if (fromZid) {
    const from = (P.zones || []).find(x => x.id === fromZid);
    if (!from || !(from.sources || []).length) { uiToast('לאזור המקור אין מקורות מוגדרים'); return; }
    z._srcShare = fromZid; z._srcLocal = (z._srcLocal || []).filter(k => !(from.sources || []).includes(k));
    wizSyncSources(z);
  } else {
    /* מקורות משלו — מתחילים ממה שהיה אפקטיבי, כדי לא להתחיל מאפס */
    z.sources = (z.sources || []).slice(); z._srcShare = undefined; z._srcLocal = undefined;
  }
  save(); wizRender();
}
function wizSrcToggle(zid, k) {
  const z = (P.zones || []).find(x => x.id === zid); if (!z) return;
  const from = wizSharedFrom(z);
  if (from) {
    if ((from.sources || []).includes(k)) { uiToast('🔗 מקור משותף מ"' + from.name + '" — כדי לשנות אותו ערוך את "' + from.name + '" או עבור ל"מקורות משלו"'); return; }
    z._srcLocal = z._srcLocal || [];
    const j = z._srcLocal.indexOf(k);
    if (j >= 0) z._srcLocal.splice(j, 1); else z._srcLocal.push(k);
    wizSyncSources(z); save(); wizRender(); return;
  }
  z.sources = z.sources || [];
  const i = z.sources.indexOf(k);
  if (i >= 0) z.sources.splice(i, 1); else z.sources.push(k);
  /* אזורים שמשתפים מהאזור הזה מתעדכנים איתו */
  (P.zones || []).forEach(x => { if (x._srcShare === z.id) wizSyncSources(x); });
  save(); wizRender();
}
function wizCalConfirm() {
  if (!P.scale) { uiToast('כייל קודם'); return; }
  P.calOk = 1; save();
  WIZ.step = 2; wizRender();
  uiToast('✓ הכיול אושר — עכשיו סימון אזור');
}
/* ✂️ חיתוך התכנית — סימון מלבן על הרקע וחיתוך בפועל */
function cropStart() {
  if (!P.bg) { uiToast('אין תכנית לחתוך'); return; }
  const wrap = document.getElementById('canvasWrap'); if (!wrap) return;
  const old = document.getElementById('cropOv'); if (old) old.remove();
  const ov = document.createElement('div');
  ov.id = 'cropOv';
  ov.style.cssText = 'position:fixed;inset:0;z-index:95;cursor:crosshair;background:rgba(20,24,32,.25)';
  ov.innerHTML = `<div id="cropBox" style="position:fixed;border:2px dashed #c9502e;background:rgba(201,80,46,.12);display:none"></div>
    <div style="position:fixed;top:14px;left:50%;transform:translateX(-50%);background:#1a1e28;color:#fff;padding:8px 16px;border-radius:10px;font-size:13px">
      ✂️ גרור מלבן סביב החלק הרלוונטי בתכנית · <button id="cropCancel" style="background:#c9502e;border:none;color:#fff;border-radius:7px;padding:3px 10px;cursor:pointer;font-size:12px">ביטול</button></div>`;
  document.body.appendChild(ov);
  const box = ov.querySelector('#cropBox');
  ov.querySelector('#cropCancel').onclick = () => ov.remove();
  let st = null;
  ov.addEventListener('pointerdown', e => {
    if (e.target.id === 'cropCancel') return;
    st = { x: e.clientX, y: e.clientY };
    box.style.display = 'block';
    box.style.left = st.x + 'px'; box.style.top = st.y + 'px'; box.style.width = '0px'; box.style.height = '0px';
  });
  ov.addEventListener('pointermove', e => {
    if (!st) return;
    box.style.left = Math.min(st.x, e.clientX) + 'px';
    box.style.top = Math.min(st.y, e.clientY) + 'px';
    box.style.width = Math.abs(e.clientX - st.x) + 'px';
    box.style.height = Math.abs(e.clientY - st.y) + 'px';
  });
  ov.addEventListener('pointerup', e => {
    if (!st) return;
    const r = box.getBoundingClientRect();
    st = null;
    if (r.width < 20 || r.height < 20) { ov.remove(); uiToast('החיתוך קטן מדי — נסה שוב'); return; }
    const im = document.getElementById('bgimg');
    const ir = im.getBoundingClientRect();
    const fx = (r.left - ir.left) / ir.width, fy = (r.top - ir.top) / ir.height;
    const fw = r.width / ir.width, fh = r.height / ir.height;
    ov.remove();
    if (fw <= 0.02 || fh <= 0.02) { uiToast('החיתוך מחוץ לתכנית'); return; }
    const img = new Image();
    img.onload = () => {
      const sx = Math.max(0, fx * img.naturalWidth), sy = Math.max(0, fy * img.naturalHeight);
      const sw = Math.min(img.naturalWidth - sx, fw * img.naturalWidth), sh = Math.min(img.naturalHeight - sy, fh * img.naturalHeight);
      const cv = document.createElement('canvas'); cv.width = Math.round(sw); cv.height = Math.round(sh);
      cv.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, cv.width, cv.height);
      P.bg = cv.toDataURL('image/jpeg', 0.85);
      /* קנה המידה נשמר — הרוחב החדש פרופורציונלי לחלק שנחתך */
      const oldW = P.bgW || 1400;
      const oldH = oldW * img.naturalHeight / img.naturalWidth;
      const newW = Math.round(oldW * fw);
      /* הרקע מוצמד לימין הקנבס, לכן ההיסט האופקי לקואורדינטת ה-right של מוקד: */
      const dxR = newW + fx * oldW - oldW;
      const dyT = fy * oldH;
      P.bgW = newW;
      P.calLine = null; P.calOk = 0;
      (P.nodes || []).forEach(n => { n.x += dxR; n.y -= dyT; });
      (P.zones || []).forEach(z2 => {
        if (z2.poly) z2.poly.forEach(pt => { pt.x -= dxR; pt.y -= dyT; });
        else { z2.x += dxR; z2.y -= dyT; }
      });
      render(); save(); wizRender();
      uiToast('✂️ התכנית נחתכה — ודא את הכיול ואשר');
    };
    img.src = P.bg;
  });
}
function wizNext() {
  if (WIZ.step === 1 && P.scale && !P.calOk) { uiToast('📏 אשר את הכיול לפני שממשיכים — השווה מול שולחן או דלת'); return; }
  /* שאלת חובה: אי אפשר להתקדם מהאזור בלי תכלית — היא קובעת את המערכת */
  if (WIZ.step === 2) {
    const z = wizZone();
    if (z && !z.usage) {
      uiToast('🎯 חובה לבחור מה עושים באזור — זה קובע את העוצמה ואת ההצעות');
      const sel = document.getElementById('wizUse');
      if (sel) { sel.style.outline = '2px solid #c1121f'; sel.focus(); }
      return;
    }
    if (z && !(z.sources || []).length) {
      uiToast('🎚 חובה לבחור מה מנגן באזור — זה קובע מיקסר / כרטיס קול / פרוססור');
      return;
    }
  }
  if (WIZ.step === 3) {
    const z3 = wizZone(), s3 = z3 ? wizOwnSources(z3) : [];
    if (z3 && z3._built) {
      if (s3.includes('dj') && !(z3._djNodeId && byId(z3._djNodeId))) { uiToast('🎧 נבחר DJ באזור — מקם את עמדת הנגינה על התכנית לפני החיווט'); return; }
      if (s3.includes('inst') && !(z3._stageBoxId && byId(z3._stageBoxId))) { uiToast('🎸 נבחרה במה — מקם את קופסת הבמה על התכנית לפני החיווט'); return; }
    }
  }
  WIZ.step = Math.min(WIZ_STEPS.length - 1, WIZ.step + 1);
  wizRender();
}
function wizUploadBg(inp) {
  if (!(inp.files && inp.files[0])) return;
  /* אותו נתיב של האפליקציה: PDF→תמונה, הקטנה, ורוחב רקע לפי יחס הצדדים */
  uploadBg(inp, () => {
    save(); WIZ.step = 1; wizRender();
    uiToast('✓ התכנית נטענה — עכשיו כיול');
  });
}
function wizNewProject() { newProj(); WIZ.step = 0; wizRender(); }
function wizDrawZone() {
  const nm = document.getElementById('wizZName').value.trim();
  zoneNameNext = nm || 'אזור ' + ((P.zones || []).length + 1);
  zoneMode = { poly: [] }; render();
  uiToast('נקר נקודות סביב האזור על התכנית · לחיצה על הנקודה הראשונה סוגרת');
}
function wizKitSearch(q) {
  const el = document.getElementById('wizKitRes'); if (!el) return;
  const z = wizZone(); if (!z) return;
  const toks = String(q || '').toLowerCase().split(/\s+/).filter(Boolean);
  if (!toks.length) { el.innerHTML = ''; return; }
  const kits = allKits().map((k, i) => ({ k, i })).filter(x => toks.every(t => x.k.name.toLowerCase().includes(t))).slice(0, 6);
  const spks = dockSearchResults(q).filter(r => r.type !== 'kit' && r.key && isSpeakerItem(r.name)).slice(0, 6);
  el.innerHTML =
    kits.map(x => `<button class="sec" onclick="zoneKitConfirm('${esc(z.name).replace(/'/g, '&#39;')}',${x.i})">🧰 ${esc(x.k.name.slice(0, 40))}</button>`).join('') +
    spks.map(r => `<button class="sec" onclick="pickZoneSpk('${z.id}','${esc(r.name).replace(/'/g, '&#39;')}','${r.key}',${/סאב|\bsub\b/i.test(r.name)});wizRender()">🔊 ${esc(r.name.slice(0, 40))} ${erpInfo(r.key) ? '· מלאי ' + erpInfo(r.key).qty : ''}</button>`).join('') ||
    '<p class="hint">אין תוצאות</p>';
}
/* 🎙 מיקרופון מדידה במרכז האזור — נקודת הייחוס לדיליי; נוצר אוטומטית לפני כל פתיחת חיווט */
function wizEnsureMic(zid) {
  const z = (P.zones || []).find(x => x.id === zid); if (!z) return;
  if (P.nodes.some(n => n.ptype === 'mic' && (n.sub || '').includes(z.name))) return;
  const bm = zoneBounds(z);
  P.nodes.push({ id: uid('n'), kind: 'point', ptype: 'mic', name: 'מיקרופון מדידה', sub: 'נק׳ מדידה · ' + z.name, x: 2200 - (bm.L + bm.W / 2) - 20, y: (bm.T + bm.H / 2) - 24, mini: true, noCov: true });
  render(); save();
}
/* אישור "חבר" בשלב החיווט: אם כל האזורים מחווטים — מתקדמים אוטומטית לקיט ההתקנה */
function wizWireStepDone() {
  if (!WIZ) return;
  const allOk = (P.zones || []).every(zz => { const w = wizWireStat(zz); return !w.tot || w.fed >= w.tot; });
  if (allOk) { WIZ.step = 5; wizRender(); uiToast('✓ כל האזורים מחווטים — עוברים לקיט ההתקנה'); }
  else wizRender();
}
/* המשך אחרי אישור חיווט של אזור: האזור הבא אם יש, אחרת שלב החיווט המרוכז */
function wizAfterWire(z) {
  return () => {
    if (!WIZ) return;
    const nxt = (P.zones || []).find(zz => !zz._built);
    if (nxt) { WIZ.zid = nxt.id; selZone = nxt.id; WIZ.step = 3; render(); wizRender(); uiToast('✓ "' + z.name + '" מחווט — עוברים לאזור "' + nxt.name + '"'); }
    else { WIZ.step = 4; wizRender(); uiToast('✓ החיווט אושר — ודא שכל האזורים ירוקים והמשך לקיט ההתקנה'); }
  };
}
/* הצבת נקודות החיבור של המקורות לפי התשובה מהאזור ("מה מנגן"):
   🎧 DJ → פאנל עמדת נגינה · 🎸 במה → קופסת במה · 🎤 מיקרופון בלבד → פאנל חיבורים XLR ·
   רק סטרימר/מחשב/טלפון → המוזיקה מהמחשב שבארון, אין עמדה. הארון עצמו מוצב ב-zoneRack. */
function wizPlaceSources(z) {
  wizSyncSources(z);
  const src = wizOwnSources(z);          /* משותף מאזור אחר — העמדה שלו כבר קיימת שם */
  const hasDj = src.includes('dj'), hasStage = src.includes('inst'), hasMic = src.includes('mic');
  z._djInRack = !(z.sources || []).includes('dj');
  const b = zoneBounds(z), m = P.scale ? 1 / P.scale : 40;          /* פיקסלים למטר */
  const seg = (typeof zoneWallSeg === 'function') ? zoneWallSeg(z) : null;
  /* נקודה על קיר הבמה (או הקיר הארוך) במרחק t לאורכו, נסוגה מטר פנימה */
  const onWall = (t, inset) => {
    if (!seg) return null;
    const ux = (seg.x2 - seg.x1) / seg.len, uy = (seg.y2 - seg.y1) / seg.len;
    return { x: seg.x1 + ux * seg.len * t + seg.nx * inset, y: seg.y1 + uy * seg.len * t + seg.ny * inset };
  };
  const mk = (idField, name, sub, holes, pt, mount) => {
    let n = z[idField] && byId(z[idField]);
    if (n) return n;                                                  /* כבר מוצב — לא מזיזים */
    n = { id: uid('n'), kind: 'panel', name: name + ' · ' + z.name, sub, x: 2200 - pt.x - 24, y: pt.y - 24, pmin: true, mount,
      panel: { mode: 'matrix', holes } };
    P.nodes.push(n); z[idField] = n.id; return n;
  };
  const rk = zoneRack(z);
  if (hasDj) {
    /* עמדת DJ: על קיר הבמה אם הוגדר, אחרת בפינה שמאלית-עליונה (הארון בימנית) */
    const pt = onWall(0.5, m) || { x: b.L + 46, y: b.T + 34 };
    mk('_djNodeId', 'עמדת נגינה (DJ)', 'פאנל מולטי בעמדה',
      Array.from({ length: 8 }, (_, i) => ({ conn: i < 6 ? 'xlrf' : 'rj45' })), pt, 'עמדה');
  }
  if (hasStage) {
    /* קופסת במה: בחזית הבמה, ואם יש גם DJ — מוסטת 2 מ׳ לצד */
    const pt = onWall(hasDj ? 0.5 + Math.min(0.25, 2 * m / (seg ? seg.len : 1)) : 0.5, m * 0.8) || { x: b.L + b.W / 2, y: b.T + 34 };
    mk('_stageBoxId', 'קופסת במה', 'קופסת במה — כניסות XLR + חזרות',
      Array.from({ length: 12 }, (_, i) => ({ conn: i < 8 ? 'xlrf' : 'xlrm' })), pt, 'רצפת במה');
  }
  if (hasMic && !hasDj && !hasStage) {
    /* מיקרופון בלבד: פאנל חיבורים קטן ליד הארון */
    const pt = rk ? { x: 2200 - rk.x - 20 - 2 * m, y: rk.y + 24 } : { x: b.L + b.W / 2, y: b.T + 34 };
    mk('_micPanelId', 'פאנל חיבורים', 'פאנל XLR בקיר',
      Array.from({ length: 4 }, () => ({ conn: 'xlrf' })), pt, 'קיר');
  }
}
/* שורות המיקומים בשלב המערכת — מה הוצב ואיפה, עם מיקום מחדש בלחיצה על התכנית */
function wizPlacementsHTML(z) {
  const src = wizOwnSources(z), from = wizSharedFrom(z);
  const row = (ic, lbl, node, onPlace) => `<button class="sec ${node ? 'done' : ''}" style="text-align:right" onclick="${onPlace}">${ic} ${lbl} — ${node ? '✓ ממוקם · לחץ למיקום מחדש על התכנית' : '⚠ לא ממוקם · לחץ ואז על התכנית'}</button>`;
  const rk = zoneRack(z);
  let h = `<p class="hint" style="margin:8px 0 3px;font-weight:700">📍 מיקומים על התכנית</p>`;
  if (from) { const lbl = k => (SOURCES.find(s => s[0] === k) || [k, k])[1]; h += `<p class="hint" style="margin:2px 0 4px;color:#4b3fb8">🔗 ${esc((from.sources || []).map(lbl).join(' · '))} — משותפים מ"${esc(from.name)}", העמדה שלהם שם · הפרוססור צריך יציאת‑אזור נפרדת ל"${esc(z.name)}"</p>`; }
  h += row('🗄', 'ריכוז מגברים', rk, `window.__rackPlace={zid:'${z.id}'};uiToast('לחץ על התכנית במקום הארון');render()`);
  if (src.includes('dj')) h += row('🎧', 'עמדת נגינה (DJ)', z._djNodeId && byId(z._djNodeId), `window.__djPlace={zid:'${z.id}'};uiToast('לחץ על התכנית במקום עמדת ה-DJ');render()`);
  if (src.includes('inst')) h += row('🎸', 'קופסת במה', z._stageBoxId && byId(z._stageBoxId), `window.__nodePlace={id:'${z._stageBoxId || ''}',zid:'${z.id}',field:'_stageBoxId'};uiToast('לחץ על התכנית במקום קופסת הבמה');render()`);
  if (src.includes('mic') && !src.includes('dj') && !src.includes('inst')) h += row('🎤', 'פאנל חיבורים (XLR)', z._micPanelId && byId(z._micPanelId), `window.__nodePlace={id:'${z._micPanelId || ''}',zid:'${z.id}',field:'_micPanelId'};uiToast('לחץ על התכנית במקום הפאנל');render()`);
  if (!from && !src.includes('dj') && !src.includes('inst')) h += `<p class="hint" style="margin:2px 0 6px">🖥 המוזיקה מהמחשב/סטרימר שבארון — אין עמדת נגינה (שינוי: שלב האזור, "מה מנגן")</p>`;
  return h;
}
function wizBuildAll(force) {
  const z = wizZone(); if (!z) return;
  if (!z.usage) { uiToast('🎯 חובה לבחור תכלית לאזור לפני הבנייה — חזור שלב אחד'); WIZ.step = 2; wizRender(); return; }
  /* מערכת כבר נבחרה ונבנתה — לא בונים שוב: ישר לטבלת החיווט */
  if (!force && z._built && wizWireStat(z).tot) {
    wizEnsureMic(z.id);
    window.__autoFlow = false;
    window.__patchDone = wizAfterWire(z);
    smartWire(z.id);
    return;
  }
  /* אין רמקול נבחר — פותחים את הבורר בלבד; החיווט יגיע אחרי הבנייה, לא במקביל */
  if (!z._spk) { zoneSpkPicker(z.id); return; }
  if (z._djInRack === undefined) z._djInRack = true;
  /* ארון ריכוז אוטומטי בפינת האזור אם אין */
  /* ארון משותף לכל האזורים — נוצר חדש רק אם אין ארון בפרויקט */
  zoneRack(z, () => {
    const b = zoneBounds(z);
    /* בתוך האזור — בפינה הימנית-עליונה, מרווח קטן מהקיר */
    const px = b.L + b.W - 46, py = b.T + 34;
    return { id: uid('n'), kind: 'rack', name: 'ריכוז ' + z.name, sub: z.name, x: 2200 - px - 20, y: py - 24, ru: 12, units: [], min: true };
  });
  wizEnsureMic(z.id);
  wizPlaceSources(z);           /* עמדת DJ / קופסת במה / פאנל — לפי "מה מנגן" */
  window.__autoFlow = true;   /* הבנייה וההצבה אוטומטיות */
  try {
    buildZoneSystem(z.id);
    placeZoneRackItems(z);
    /* החיווט לא אוטומטי: עורך הניתוב נפתח לאישור — ורק אחרי "חבר" ממשיכים להתקנה */
    setTimeout(() => {
      window.__autoFlow = false;
      window.__patchDone = wizAfterWire(z);
      smartWire(z.id);
      wizRender();
    }, 700);
  } catch (e) { window.__autoFlow = false; uiToast('⚠ ' + e.message); }
  setTimeout(() => wizRender(), 900);
}
/* השלמת כבלים: כל קו בלי מוצר מקבל שורת "גליל" מהקטלוג לפי סוג, עם המטרים */
function wizFillCables() {
  const need = {};
  P.cables.forEach(c => { if (!c.stockRef && c.inst !== 'exist' && +c.len > 0) need[c.type] = (need[c.type] || 0) + Math.ceil(+c.len * 1.15); /* +15% רזרבה */ });
  let added = 0;
  for (const [t, meters] of Object.entries(need)) {
    const kw = { dmx: 'DMX', cat: 'רשת', nl4: 'רמקול', multi: 'מולטי', xlr: 'XLR', fiber: 'אופטי', sdi: 'BNC', hdmi: 'HDMI', pwr: 'חשמל' }[t] || t;
    const hit = (typeof ERP_ITEMS !== 'undefined') && ERP_ITEMS.find(([k, n]) => n && /גליל|לפי מטר|כבל/i.test(n) && n.toLowerCase().includes(kw.toLowerCase()));
    const it = { on: true, qty: meters, name: hit ? hit[1] : 'כבל ' + (CTYPES[t]?.n || t) + ' (לפי מטר)', key: hit ? hit[0] : undefined, src: 'אשף V2 — השלמת כבלים', dest: 'reel', type: t, cat: 'cable', u: 1, iid: uid('i'), note: meters + ' מ׳ כולל 15% רזרבה' };
    autoPrice(it); impItems.push(it); added++;
  }
  render(); save(); wizRender();
  uiToast('✓ נוספו ' + added + ' שורות כבלים לפי סוג (עם 15% רזרבה)');
}

/* ---- דוח מתקינים — כל מה שצוות ההתקנה צריך, מוכן להדפסה ---- */
/* צילום התכנית עם החיווט — רקע, אזורים, קווים ממוספרים ומוקדים */
function repPlanSnapshot(LBL) {
  return new Promise(res => {
    if (!P.bg) return res('');
    const img = new Image();
    img.onload = () => {
      const W = P.bgW || 1400, H = Math.round(W * img.naturalHeight / img.naturalWidth);
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const g = cv.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      g.globalAlpha = 0.8; g.drawImage(img, 0, 0, W, H); g.globalAlpha = 1;
      /* הרקע יושב בצד ימין של קנבס העבודה (right:0, רוחב 2200) — מזיזים הכל למערכת הצירים של התמונה */
      const offX = 2200 - W;
      const cx = n => 2200 - n.x - 20 - offX, cy = n => n.y + 24;
      (P.zones || []).forEach(z => {
        g.strokeStyle = '#378ADD'; g.setLineDash([8, 5]); g.lineWidth = 2.5;
        if (z.poly) { g.beginPath(); z.poly.forEach((pt, i) => i ? g.lineTo(pt.x - offX, pt.y) : g.moveTo(pt.x - offX, pt.y)); g.closePath(); g.stroke(); }
        else { const b = zoneBounds(z); g.strokeRect(b.L - offX, b.T, b.W, b.H); }
        g.setLineDash([]);
      });
      g.font = 'bold 12px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
      P.cables.forEach(c => {
        const a = byId(c.from), b = byId(c.to); if (!a || !b) return;
        g.strokeStyle = c.type === 'xlr' ? '#7F77DD' : '#E2571B'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(cx(a), cy(a)); g.lineTo(cx(b), cy(b)); g.stroke();
        const lb = LBL[c.id]; if (!lb) return;
        const mx = (cx(a) + cx(b)) / 2, my = (cy(a) + cy(b)) / 2;
        g.fillStyle = '#fff'; g.fillRect(mx - 11, my - 9, 22, 17);
        g.strokeStyle = '#E2571B'; g.lineWidth = 1; g.strokeRect(mx - 11, my - 9, 22, 17);
        g.fillStyle = '#E2571B'; g.fillText(String(lb), mx, my);
      });
      P.nodes.filter(n => n.kind === 'point' || n.kind === 'rack').forEach(n => {
        const x = cx(n), y = cy(n), isR = n.kind === 'rack';
        g.fillStyle = isR ? '#1a1e28' : n.ptype === 'mic' ? '#0f6e56' : /סאב|\bsub\b/i.test(n.name) ? '#6c5ce7' : '#c9502e';
        g.beginPath(); g.arc(x, y, isR ? 14 : 11, 0, 7); g.fill();
        g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
        g.fillStyle = '#fff';
        const m = (n.name || '').match(/\((\d+)\)/);
        g.fillText(isR ? 'R' : n.ptype === 'mic' ? 'M' : (m ? m[1] : '•'), x, y);
      });
      res('<h2>תכנית החיווט</h2><img src="' + cv.toDataURL('image/jpeg', 0.85) + '" style="width:100%;border:1px solid #ccc;border-radius:8px"><p class="meta">R = ריכוז מגברים · M = נקודת מדידה · מספר על קו = מספר הכבל בלוח המשיכה</p>');
    };
    img.onerror = () => res('');
    img.src = P.bg;
  });
}
/* תכנית הכיסוי: כל רמקול עם אלומת הפיזור שלו וכיוון — למתקין ברור לאן לכוון */
function repCoverSnapshot() {
  return new Promise(res => {
    if (!P.bg) return res('');
    const img = new Image();
    img.onload = () => {
      const W = P.bgW || 1400, H = Math.round(W * img.naturalHeight / img.naturalWidth);
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const g = cv.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      g.globalAlpha = 0.65; g.drawImage(img, 0, 0, W, H); g.globalAlpha = 1;
      const offX = 2200 - W;
      const cx = n => 2200 - n.x - 20 - offX, cy = n => n.y + 24;
      (P.zones || []).forEach(z => {
        g.strokeStyle = '#378ADD'; g.setLineDash([8, 5]); g.lineWidth = 2;
        if (z.poly) { g.beginPath(); z.poly.forEach((pt, i) => i ? g.lineTo(pt.x - offX, pt.y) : g.moveTo(pt.x - offX, pt.y)); g.closePath(); g.stroke(); }
        else { const b = zoneBounds(z); g.strokeRect(b.L - offX, b.T, b.W, b.H); }
        g.setLineDash([]);
      });
      const R = P.scale ? Math.max(45, Math.min(240, 3.5 / P.scale)) : 90;   /* ~3.5 מ׳ אלומה */
      const spks = P.nodes.filter(n => n.kind === 'point' && (!n.ptype || n.ptype === 'speaker' || n.ptype === 'sub'));
      g.font = 'bold 12px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
      spks.forEach(n => {
        const x = cx(n), y = cy(n);
        const isSub = /סאב|\bsub\b/i.test(n.name);
        const disp = isSub ? 360 : (n.disp ?? guessDisp(n.name) ?? 90);
        const aim = ((n.aim ?? 0) * Math.PI) / 180;
        g.fillStyle = isSub ? 'rgba(108,92,231,.16)' : 'rgba(201,80,46,.18)';
        g.strokeStyle = isSub ? 'rgba(108,92,231,.55)' : 'rgba(201,80,46,.6)';
        g.lineWidth = 1.5;
        if (disp >= 300) { g.beginPath(); g.arc(x, y, R * 0.7, 0, 7); g.fill(); g.stroke(); }
        else {
          const half = (Math.min(disp, 175) * Math.PI) / 360;
          g.beginPath(); g.moveTo(x, y); g.arc(x, y, R, aim - half, aim + half); g.closePath(); g.fill(); g.stroke();
          /* חץ כיוון במרכז האלומה */
          const ax = x + Math.cos(aim) * R * 0.85, ay = y + Math.sin(aim) * R * 0.85;
          g.strokeStyle = '#c9502e'; g.lineWidth = 2.5;
          g.beginPath(); g.moveTo(x, y); g.lineTo(ax, ay); g.stroke();
          g.beginPath();
          g.moveTo(ax, ay);
          g.lineTo(ax - 9 * Math.cos(aim - 0.4), ay - 9 * Math.sin(aim - 0.4));
          g.lineTo(ax - 9 * Math.cos(aim + 0.4), ay - 9 * Math.sin(aim + 0.4));
          g.closePath(); g.fillStyle = '#c9502e'; g.fill();
        }
      });
      /* סמני הרמקולים מעל האלומות + תווית כיוון ופיזור */
      spks.forEach(n => {
        const x = cx(n), y = cy(n);
        const isSub = /סאב|\bsub\b/i.test(n.name);
        const disp = isSub ? 360 : (n.disp ?? guessDisp(n.name) ?? 90);
        g.fillStyle = isSub ? '#6c5ce7' : '#c9502e';
        g.beginPath(); g.arc(x, y, 11, 0, 7); g.fill();
        g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
        g.fillStyle = '#fff';
        const m = (n.name || '').match(/\((\d+)\)/);
        g.fillText(m ? m[1] : '•', x, y);
        if (!isSub) {
          const lbl = (n.aim ?? 0) + '° · ' + disp + '°';
          g.font = 'bold 10px Arial';
          const tw = g.measureText(lbl).width + 8;
          g.fillStyle = '#fff'; g.fillRect(x - tw / 2, y + 14, tw, 14);
          g.strokeStyle = '#c9502e'; g.lineWidth = 1; g.strokeRect(x - tw / 2, y + 14, tw, 14);
          g.fillStyle = '#c9502e'; g.fillText(lbl, x, y + 21);
          g.font = 'bold 12px Arial';
        }
      });
      res('<h2>תכנית כיסוי — כיוון ופיזור לכל רמקול</h2><img src="' + cv.toDataURL('image/jpeg', 0.85) + '" style="width:100%;border:1px solid #ccc;border-radius:8px"><p class="meta">החץ = כיוון הרמקול · האלומה = זווית הפיזור · תווית: כיוון° · פיזור° (0°=ימין, 90°=מטה) · סגול = סאב (היקפי)</p>');
    };
    img.onerror = () => res('');
    img.src = P.bg;
  });
}
async function installerReport() {
  const LBL = cableLabels();
  const planImg = await repPlanSnapshot(LBL);
  const coverImg = await repCoverSnapshot();
  const zsum = (P.zones || []).map(z => `<tr><td>${esc(z.name)}</td><td>${esc(z.usage || '—')}</td><td>${zoneAreaM(z).toFixed(0)} מ"ר</td><td>${z.ceil ?? P.room?.ceil ?? '—'} מ׳</td></tr>`).join('');
  /* מספר סידורי לכל מגבר בארון — לפי מיקום ה-U */
  const ampNo = {};
  P.nodes.filter(n => n.kind === 'rack').forEach(rk => {
    (rk.units || []).filter(u => /מגבר|amp|DNA|DPA|DYNAMIQ|PLM|MX3|PQM|IPD/i.test(u.name))
      .sort((a, b) => a.pos - b.pos)
      .forEach((u, i) => { ampNo[u.id] = { n: i + 1, pos: u.pos }; });
  });
  const racks = P.nodes.filter(n => n.kind === 'rack').map(rk => `
    <h3>🗄 ${esc(rk.name)} · ${rk.ru}U</h3>
    <table><tr><th>מיקום U</th><th>יחידה</th><th>גובה</th></tr>
      ${(rk.units || []).slice().sort((a, b) => a.pos - b.pos).map(u => `<tr><td>${u.pos + 1}–${u.pos + u.u}</td><td>${ampNo[u.id] ? '<b>מגבר ' + ampNo[u.id].n + '</b> · ' : ''}${esc(u.name)}</td><td>${u.u}U</td></tr>`).join('') || '<tr><td colspan="3">ריק</td></tr>'}
    </table>`).join('');
  const spk = P.nodes.filter(n => n.kind === 'point' && (!n.ptype || n.ptype === 'speaker' || n.ptype === 'sub')).map(n => `
    <tr><td>${esc(n.name.slice(0, 40))}</td><td>${esc((n.sub || '').slice(0, 24))}</td><td>${n.hgt ?? '—'} מ׳</td><td>${esc(n.mount || '—')}</td><td>${n.aim != null ? n.aim + '°' : '—'}</td></tr>`).join('');
  const spkNumOf = id => { const n0 = byId(id); const m0 = n0 && (n0.name || '').match(/\((\d+)\)/); return m0 ? m0[1] : ''; };
  const cbl = P.cables.map(c => {
    const conns = (c.conn ? (CONNS[c.conn]?.n || c.conn) : '') + (c.conn2 && c.conn2 !== c.conn ? ' ← ' + (CONNS[c.conn2]?.n || c.conn2) : '');
    return `<tr><td><b>${LBL[c.id]}</b></td><td style="text-align:center"><b>${spkNumOf(c.to) || '—'}</b></td><td>${esc(endNameTxt(c.from, c.fromUnit))}${c.pOut ? ' · ' + esc(c.pOut) : c.fromHole ? ' · חור ' + c.fromHole : ''}</td>
      <td>${esc(endNameTxt(c.to, c.toUnit))}${c.pIn ? ' · ' + esc(c.pIn) : c.toHole ? ' · חור ' + c.toHole : ''}</td>
      <td>${CTYPES[c.type]?.n || c.type}${c.cores ? ' ×' + c.cores : ''}</td><td>${c.len ? c.len + ' מ׳' : '—'}</td><td>${esc(conns)}</td>
      <td>${c.inst === 'exist' ? 'קיים' : c.inst === 'pull' ? 'העברה' : 'חדש'}</td><td>${esc(c.note || '')}</td></tr>`;
  }).join('');
  const items = impItems.filter(it => it.on !== false).map(it => {
    const u = (typeof erpImg === 'function' && erpImg(it.key)) || (typeof modelImg === 'function' && modelImg(it.name)) || '';
    return `<tr><td style="width:46px;text-align:center">${u ? `<img src="${esc(u)}" style="width:42px;height:42px;object-fit:contain">` : ''}</td><td>${esc(it.name.slice(0, 55))}</td><td>${esc(it.key || '—')}</td><td>${it.qty}</td><td>${it.zones ? esc(Object.keys(it.zones).join(', ')) : '—'}</td></tr>`;
  }).join('');
  const rackConn = (() => {
    const heads = P.cables.filter(c => c.pOut && c.fromUnit);
    if (!heads.length) return '';
    const by = {};
    heads.forEach(c => {
      const rk = byId(c.from); const u = rk && (rk.units || []).find(x => x.id === c.fromUnit);
      const a = u && ampNo[u.id];
      const lbl = u ? `מגבר ${a ? a.n : '?'} · ${shortModel(u.name)}${a ? ` · U${a.pos + 1}` : ''}` : 'מגבר';
      const k = (u ? u.id : 'x') + '|' + c.pOut + '|' + lbl;
      (by[k] = by[k] || []).push(c);
    });
    const spN = id => { const n0 = byId(id); const m0 = n0 && (n0.name || '').match(/\((\d+)\)/); return m0 ? m0[1] : '—'; };
    const trs = Object.entries(by).sort((a, b) => a[0].localeCompare(b[0])).map(([k, cs]) => {
      const parts = k.split('|'); const out = parts[1], amp = parts[2];
      return cs.map((c, i) => { const tn = byId(c.to);
        return `<tr>${i === 0 ? `<td rowspan="${cs.length}" style="font-weight:800">${esc(amp)}</td><td rowspan="${cs.length}" style="font-weight:700">${esc(out)}</td>` : ''}<td style="text-align:center"><b>${LBL[c.id] || ''}</b></td><td style="text-align:center"><b>${spN(c.to)}</b></td><td>${esc(tn ? tn.name.slice(0, 40) : '')}</td></tr>`; }).join('');
    }).join('');
    return `<h2>חיבורי קווים לארון — איזה רמקול, דרך איזה קו, לאיזה מגבר</h2>
      <p class="meta">כל שורה = קו אחד: מהמגבר והיציאה שבצד ימין, דרך הקו הממוספר, אל הרמקול הממוספר בתכנית.</p>
      <table><tr><th>מגבר</th><th>יציאה</th><th>קו מס׳</th><th>רמקול מס׳</th><th>רמקול</th></tr>${trs}</table>`;
  })();
  const spkCnt = P.nodes.filter(n => n.kind === 'point' && (!n.ptype || n.ptype === 'speaker' || n.ptype === 'sub')).length;
  const rackN = P.nodes.find(n => n.kind === 'rack');
  const ampCnt = P.nodes.filter(n => n.kind === 'rack').reduce((s2, rk) => s2 + (rk.units || []).filter(u => /מגבר|amp|DNA|DPA|DYNAMIQ|PLM|MX3|PQM|IPD/i.test(u.name)).length, 0);
  const prPull = (store.installRates || []).find(r => r.k === 'pull');
  const pullCharged = !!(prPull && !prPull.off);
  const repHtml = `<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8"><title>דוח הכנות, תשתיות ותכנית פרויקט — ${esc(P.name)}</title>
    <style>body{font-family:-apple-system,'Segoe UI',Arial;margin:24px;color:#1a1e28;font-size:12.5px}
    h1{font-size:20px;border-bottom:3px solid #c9502e;padding-bottom:6px}h2{font-size:16px;margin:22px 0 6px;background:#f4f2ec;padding:5px 10px;border-radius:7px}h3{font-size:13.5px;margin:12px 0 4px}
    table{border-collapse:collapse;width:100%;margin-bottom:8px}th,td{border:1px solid #ccc;padding:4px 7px;text-align:right;font-size:11.5px}th{background:#f4f2ec}
    .meta{color:#777;font-size:11px}@media print{h2{break-after:avoid}}</style></head><body>
    <h1>🔧 דוח הכנות, תשתיות ותכנית פרויקט — ${esc(P.name)}</h1>
    <p class="meta">הופק ${new Date().toLocaleString('he-IL')} · KO Projects V2</p>

    <h2>על הפרויקט</h2>
    <p style="font-size:13px;line-height:1.7">
      ${(P.zones || []).length} אזורי סאונד · <b>${spkCnt}</b> רמקולים וסאבים · ארון "${esc((rackN || {}).name || '—')}" עם <b>${ampCnt}</b> מגברים · <b>${P.cables.length}</b> קווים בתכנית.</p>
    <table><tr><th>אזור</th><th>תכלית</th><th>שטח</th><th>תקרה</th></tr>${zsum || '<tr><td colspan="4">—</td></tr>'}</table>

    <h2>⚡ הכנות חשמל ותשתית — דרישות מחייבות (ביצוע ע"י חשמלאי מוסמך, לפני יום ההתקנה)</h2>
    <h3>הזנת חשמל</h3>
    <ul style="margin:4px 0;padding-right:18px;line-height:1.75">
      <li><b>שדה חשמל נפרד למערכת הסאונד — דרישת מינימום:</b> בלוח החשמל יוקצה שדה ייעודי לסאונד בלבד — מאמ"ת ראשי לסאונד בלבד ומפסק פחת לסאונד בלבד. אין לשתף את השדה עם אף צרכן אחר.</li>
      <li><b>כל צרכני הסאונד מאותו שדה:</b> שקעי ארון המגברים וכן עמדת הנגינה / עמדת ה-DJ יוזנו כולם מאותו שדה הסאונד. הזנה מעורבת גורמת להפרשי הארקה, זמזומים ותקלות.</li>
    </ul>
    <h3>הכנת קווי הרמקולים${pullCharged ? '' : ' — ההעברות אינן כלולות בהצעה ומבוצעות באחריות הלקוח'}</h3>
    <ul style="margin:4px 0;padding-right:18px;line-height:1.75">
      <li><b>א · תוואי מסודר:</b> הקווים יושחלו בצינור מגן, בצינור שרשורי או בתעלת תקשורת — לא בצמוד לקווי חשמל (הצלבה ב-90° בלבד).</li>
      <li><b>ב · נקודת רמקול / סאב:</b> הקו יגיע לנקודה המסומנת בגובה המבוקש ותושאר בו יתרה של כ-1 מ׳ לפחות מנקודת הציון. לדוגמה: גובה 260 — הקו יוצא ב-260 עם רזרבה של ≥1 מ׳.</li>
      <li><b>ג · נקודת ארון המגברים:</b> כל הקווים המגיעים לארון ירדו עד הרצפה שמתחת לארון, ותושאר בהם יתרה של כ-2 מ׳ לפחות לכל קו.</li>
      <li><b>ד · סימון:</b> כל קו יסומן בשני קצותיו לפי המספור המופיע בתכנית החיווט ובלוח המשיכה שבדוח זה.</li>
      <li><b>ה · שלמות הקו:</b> לא יבוצעו הארכות או חיבורי ביניים על הדרך בשום צורה — קו רציף מקצה לקצה.</li>
    </ul>


    ${planImg}
    <h2>לוח משיכת כבלים</h2><table><tr><th>קו מס׳</th><th>רמקול מס׳</th><th>מ־</th><th>אל</th><th>סוג</th><th>אורך</th><th>מחברים</th><th>סטטוס</th><th>הערה</th></tr>${cbl || '<tr><td colspan="9">—</td></tr>'}</table>

    ${coverImg}
    <h2>רמקולים — תלייה וכיוון</h2><table><tr><th>רמקול</th><th>מיקום</th><th>גובה</th><th>תושבת</th><th>כיוון</th></tr>${spk || '<tr><td colspan="5">—</td></tr>'}</table>
    ${rackConn}
    <h2>ארונות — סדר הרכבה</h2>${racks || '<p>אין ארונות</p>'}
    <h2>כתב כמויות</h2><table><tr><th></th><th>פריט</th><th>מק"ט</th><th>כמות</th><th>אזור</th></tr>${items || '<tr><td colspan="5">—</td></tr>'}</table>

    </body></html>`;
  /* חלון קופץ נחסם בדפדפנים משובצים — הדוח נפתח בשכבה בתוך הדף עם הדפסה מ-iframe */
  const old2 = document.getElementById('repOv'); if (old2) old2.remove();
  const ov = document.createElement('div');
  ov.id = 'repOv';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(20,24,32,.55);z-index:130;display:flex;align-items:center;justify-content:center';
  ov.innerHTML = `<div style="background:#fff;border-radius:14px;width:min(960px,96vw);height:92vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,.4)">
    <div style="display:flex;gap:8px;align-items:center;padding:10px 14px;background:#1a1e28;color:#fff">
      <b style="flex:1">🔧 דוח הכנות, תשתיות ותכנית פרויקט — ${esc(P.name.slice(0, 22))}</b>
      <button id="repPrint" style="background:#c9502e;color:#fff;border:none;border-radius:8px;padding:6px 16px;font-weight:700;cursor:pointer">🖨 הדפסה / PDF</button>
      <button id="repClose" style="background:transparent;border:none;color:#fff;font-size:17px;cursor:pointer">✕</button></div>
    <iframe id="repIfr" style="flex:1;border:none;width:100%"></iframe></div>`;
  document.body.appendChild(ov);
  const ifr = ov.querySelector('#repIfr');
  ifr.srcdoc = repHtml;
  ov.querySelector('#repPrint').onclick = () => { try { ifr.contentWindow.focus(); ifr.contentWindow.print(); } catch (e) { window.print(); } };
  ov.querySelector('#repClose').onclick = () => ov.remove();
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
}
