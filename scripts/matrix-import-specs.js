// מייבא מפרטים שנקצרו מאתרי יצרן (data/*-import.json) לתוך נתוני המטריצה (D.specs / D.src / D.size),
// עם התאמת שמות גמישה בין שם הדגם באתר ("Unicorn Till 18P SUB") לשם במטריצה ("TILL 18").
// לא ממציא: רק שדות שקיימים בקובץ הייבוא נכנסים; מקור = url של דף המוצר. הרצה: node scripts/matrix-import-specs.js
import { readFileSync, writeFileSync } from 'node:fs';
const PAGE = 'src/pages/matrix.html';
const src = readFileSync(PAGE, 'utf8');
const MRX = /(<script id="mdata" type="application\/json">)([\s\S]*?)(<\/script>)/;
const mm = src.match(MRX); if (!mm) throw new Error('mdata not found');
const D = JSON.parse(mm[2]); D.specs = D.specs || {}; D.size = D.size || {};
const norm = s => String(s || '').toUpperCase().replace(/UNICORN|\bKT\b|\bSUB\b|SUBWOOFER/g, '').replace(/(\d)P\b/g, '$1').replace(/[^A-Z0-9]/g, '');
const models = [...new Set([...D.mx.sub.all, ...D.mx.amp.cols, ...D.mx.amp.rows, ...(D.mx.dsp ? D.mx.dsp.cols : [])])];
const byNorm = {}; models.forEach(m => { (byNorm[norm(m)] = byNorm[norm(m)] || []).push(m); });
const sizeOf = t => { const m = /(\d{1,2}(?:\.\d)?)\s*(?:”|"|″|inch|-inch)/i.exec(t || ''); return m ? Math.round(+m[1]) : null; };
const SOURCES = [
  { file: 'data/kt-audio-import.json', brand: 'KT / Unicorn', map: x => ({ name: x.model, w: x.power, o: x.ohm, sens: x.sens, spl: x.maxspl_pub, cov: x.coverage_raw, freq: x.freq, wt: x.weight, dim: x.dims, note: [x.driver, x.woofer].filter(Boolean).join(' · '), url: x.url, size: sizeOf(x.woofer || x.driver) }) },
  { file: 'data/speakers-import.json', brand: 'harvest', map: x => ({ name: x.model, w: x.w, o: x.o, sens: x.sens, spl: x.max, cov: x.h ? x.h + '°×' + (x.v || '?') + '°' : '', url: x.url, note: x.note, size: null }) },
];
let added = 0, updated = 0, unmatched = [];
for (const S of SOURCES) {
  let rows; try { rows = JSON.parse(readFileSync(S.file, 'utf8')); } catch { continue; }
  rows = Array.isArray(rows) ? rows : rows.models || [];
  for (const x of rows) {
    const r = S.map(x); if (!r.name || (!r.w && !r.sens && !r.spl)) continue;   /* בלי נתונים אין מה לייבא (עמודים, מגברים בלי טבלה) */
    const hits = byNorm[norm(r.name)] || [];
    if (!hits.length) { unmatched.push(r.name); continue; }
    for (const m of hits) {
      const cur = D.specs[m] || {}; const had = Object.keys(cur).length > 0;
      const next = { ...cur };
      for (const k of ['w', 'o', 'sens', 'spl', 'cov', 'freq', 'wt', 'dim', 'note', 'url']) if (r[k] != null && r[k] !== '' && (next[k] == null || next[k] === '')) next[k] = typeof r[k] === 'number' ? r[k] : String(r[k]).slice(0, 80);
      D.specs[m] = next;
      if (r.size && !D.size[m]) D.size[m] = r.size;
      had ? updated++ : added++;
    }
  }
}
writeFileSync(PAGE, src.slice(0, mm.index) + mm[1] + JSON.stringify(D) + mm[3] + src.slice(mm.index + mm[0].length));
console.log(`מפרטים: ${added} דגמים חדשים · ${updated} הושלמו · לא נמצאו במטריצה: ${unmatched.join(', ') || '—'}`);
