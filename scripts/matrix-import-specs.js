// מייבא מפרטים שנקצרו מאתרי יצרן (data/*-import.json) לתוך נתוני המטריצה (D.specs / D.src / D.size),
// עם התאמת שמות גמישה בין שם הדגם באתר ("Unicorn Till 18P SUB") לשם במטריצה ("TILL 18").
// לא ממציא: רק שדות שקיימים בקובץ הייבוא נכנסים; מקור = url של דף המוצר. הרצה: node scripts/matrix-import-specs.js
import { readFileSync, writeFileSync } from 'node:fs';
const PAGE = 'src/pages/matrix.html';
const src = readFileSync(PAGE, 'utf8');
const MRX = /(<script id="mdata" type="application\/json">)([\s\S]*?)(<\/script>)/;
const mm = src.match(MRX); if (!mm) throw new Error('mdata not found');
const D = JSON.parse(mm[2]); D.specs = D.specs || {}; D.size = D.size || {};
const norm = s => String(s || '').toUpperCase().replace(/UNICORN|\bKT\b|\bSUB\b|SUBWOOFER|BASS REFLEX|KLING|COMPACT RANGE|POINT SOURCE|\bMK ?[12]\b|\bII\b/g, '').replace(/(\d)P\b/g, '$1').replace(/[^A-Z0-9]/g, '');
/* uid של Funktion-One ("f5_mk1", "f101.2", "sb12-compact-range") → שם דגם */
const f1Name = uid => String(uid || '').replace(/[-_]?mk[12]$|\.2$|-1$|-compact-range$|-point-source$|-skeletal1?$|-dj$|-bass$|1$/g, '').replace(/-/g, ' ').toUpperCase();
/* "GRAVIS 12 / 12+ (N/W/XW)" → ["GRAVIS 12", "GRAVIS 12+"]; "PASSIO / PASSIO W" → שניהם */
const splitNames = n => { const base = String(n).replace(/\s*\(.*?\)\s*/g, ' ').trim(); const parts = base.split('/').map(x => x.trim()).filter(Boolean); if (parts.length < 2) return [base]; const head = parts[0].split(' ')[0]; return parts.map(x => /^[A-Z]/i.test(x) && x.split(' ').length > 1 ? x : head + ' ' + x); };
const models = [...new Set([...D.mx.sub.all, ...D.mx.amp.cols, ...D.mx.amp.rows, ...(D.mx.dsp ? D.mx.dsp.cols : [])])];
const byNorm = {}; models.forEach(m => { (byNorm[norm(m)] = byNorm[norm(m)] || []).push(m); });
const sizeOf = t => { const m = /(\d{1,2}(?:\.\d)?)\s*(?:”|"|″|inch|-inch)/i.exec(t || ''); return m ? Math.round(+m[1]) : null; };
let KF_URLS = {}; try { KF_URLS = JSON.parse(readFileSync('data/kf-urls.json', 'utf8')); } catch {}
const kfUrl = name => { const k = Object.keys(KF_URLS).find(m => norm(m) === norm(name)); return k ? KF_URLS[k] : ''; };
const kfMap = (x, defUrl) => ({ names: splitNames(x.model), w: x.power_w, o: x.impedance, spl: x.max_spl, sens: typeof x.sensitivity === 'number' ? x.sensitivity : undefined, cov: x.dispersion ? String(x.dispersion).replace('x', '°×') + '°' : '', note: x.notes, url: x.url || '', verified: x.verified !== false, size: sizeOf(x.notes) });
const SOURCES = [
  /* דפי הנתונים הרשמיים של K&F (kling-freitag.com/downloads) — .claude/skills/kf-harvest/scripts/parse_ds.py */
  { file: 'data/kf-datasheets-import.json', brand: 'K&F', override: true, map: x => ({ name: x.model, w: x.power_w, o: x.impedance, sens: x.sensitivity, spl: x.max_spl, cov: x.dispersion, freq: x.freq, wt: x.weight_kg, dim: x.dims, note: [x.notes, x.components].filter(Boolean).join(' · '), url: x.url, size: x.woofer_in, act: !!x.active, dsp: !x.power_w && !x.max_spl && !!x.design, design: x.design }) },
  { file: 'data/funktion-one-import.json', brand: 'Funktion-One', map: x => ({ name: f1Name(x.uid), w: x.w, o: x.ohm, sens: x.sens, spl: x.maxspl_calc, cov: x.h ? x.h + '°×' + (x.v || '?') + '°' : (x.dispersion_raw && x.dispersion_raw !== 'N/A' ? x.dispersion_raw : ''), freq: x.band, wt: x.weight, note: x.driver, url: x.url, size: sizeOf(x.driver) }) },
  { file: 'data/harvest-kf-catalog-2026-08.json', brand: 'K&F', map: kfMap, multi: true },
  { file: 'data/harvest-matrix-gapfill-import.json', brand: 'gapfill', map: kfMap, multi: true },
  { file: 'data/kt-audio-import.json', brand: 'KT / Unicorn', map: x => ({ name: x.model, w: x.power, o: x.ohm, sens: x.sens, spl: x.maxspl_pub, cov: x.coverage_raw, freq: x.freq, wt: x.weight, dim: x.dims, note: [x.driver, x.woofer].filter(Boolean).join(' · '), url: x.url, size: sizeOf(x.woofer || x.driver) }) },
  { file: 'data/speakers-import.json', brand: 'harvest', map: x => ({ name: x.model, w: x.w, o: x.o, sens: x.sens, spl: x.max, cov: x.h ? x.h + '°×' + (x.v || '?') + '°' : '', url: x.url, note: x.note, size: null }) },
];
let added = 0, updated = 0, unmatched = [];
for (const S of SOURCES) {
  let rows; try { rows = JSON.parse(readFileSync(S.file, 'utf8')); } catch { continue; }
  rows = Array.isArray(rows) ? rows : rows.models || [];
  for (const x of rows) {
    const r = S.map(x); if (r.verified === false) continue;
    const names = r.names || [r.name];
    if (!r.w && !r.sens && !r.spl && !r.dsp) continue;   /* בלי נתונים אין מה לייבא (עמודים, מגברים בלי טבלה) */
    let hits = []; for (const nm of names) hits = hits.concat(byNorm[norm(nm)] || []);
    if (!hits.length) { unmatched.push(names[0]); continue; }
    for (const m of hits) {
      if (!r.url && S.brand === 'K&F') r.url = kfUrl(m) || kfUrl(names[0]);
      if (!r.url && S.brand === 'gapfill') r.url = kfUrl(m);
      const cur = D.specs[m] || {}; const had = Object.keys(cur).length > 0;
      const next = { ...cur };
      for (const k of ['w', 'o', 'sens', 'spl', 'cov', 'freq', 'wt', 'dim', 'note', 'url', 'design']) if (r[k] != null && r[k] !== '' && (S.override || next[k] == null || next[k] === '')) next[k] = typeof r[k] === 'number' ? r[k] : String(r[k]).slice(0, k === 'note' ? 160 : 80);
      if (r.act) next.act = 1;   /* רמקול אקטיבי — אין הספק/עכבה פסיביים, ה-SPL הוא הנתון */
      D.specs[m] = next;
      if (r.size && (S.override || !D.size[m])) D.size[m] = r.size;
      had ? updated++ : added++;
    }
  }
}
writeFileSync(PAGE, src.slice(0, mm.index) + mm[1] + JSON.stringify(D) + mm[3] + src.slice(mm.index + mm[0].length));
console.log(`מפרטים: ${added} דגמים חדשים · ${updated} הושלמו · לא נמצאו במטריצה: ${unmatched.join(', ') || '—'}`);
