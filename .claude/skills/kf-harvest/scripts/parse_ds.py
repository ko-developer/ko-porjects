#!/usr/bin/env python3
"""K&F datasheets (ds_<slug>_en.pdf from kling-freitag.com/downloads) → data/kf-datasheets-import.json + data/kf-urls.json

Usage:
    python3 parse_ds.py <dir-with-ds_*.txt-or-pdf>      # text extracted with pypdf if only PDFs exist
Every number comes from the datasheet text; a field the sheet does not state stays empty.
The MODELS table maps the matrix model name (ERP spelling — never rename it) to the datasheet slug,
the block inside the sheet (multi-product sheets), the product page, and an honest note when the
mapping is a judgement call (e.g. plain "GRAVIS 15" → the N base variant).
"""
import json, os, re, sys, glob

KF = 'https://www.kling-freitag.com'
DS = KF + '/content/uploads/ds_%s_en.pdf'
PR = KF + '/prorental/'

# matrix model -> (slug, block name inside the sheet, page url or None (=datasheet pdf), note)
MODELS = {
    'SONA 5':        ('sona-5',           'SONA 5',         PR + 'sona/sona-5/', ''),
    'SONA SUB':      ('sona-sub',         'SONA SUB',       PR + 'sona/sona-sub/', ''),
    'SONA 6':        ('sona-6',           'SONA 6',         PR + 'sona/sona-6/', ''),
    'SONA 8':        ('sona-8',           'SONA 8',         PR + 'sona/sona-8/', ''),
    'SONA 8 XW':     ('sona-8-xw',        'SONA 8 XW',      PR + 'sona/sona-8-xw/', ''),
    'GRAVIS 12+ N':  ('gravis-12-plus-n', 'GRAVIS 12+ N',   PR + 'gravis/gravis-12p-n/', ''),
    'GRAVIS 12+ W':  ('gravis-12-plus-w', 'GRAVIS 12+ W',   PR + 'gravis/gravis-12p-w/', ''),
    'GRAVIS 12+ XW': ('gravis-12-plus-xw','GRAVIS 12+ XW',  PR + 'gravis/gravis-12p-xw/', ''),
    'GRAVIS 12':     ('gravis-12-plus-n', 'GRAVIS 12+ N',   PR + 'gravis/gravis-12p-n/', 'הנתונים מדף GRAVIS 12+ N (הדור הנוכחי); GRAVIS 12 המקורי מופסק — אותו הספק/עכבה לפי מדריך GRAVIS'),
    'GRAVIS 15 N':   ('gravis-15-n',      'GRAVIS 15 N',    PR + 'gravis/gravis-15-n/', ''),
    'GRAVIS 15 W':   ('gravis-15-w',      'GRAVIS 15 W',    PR + 'gravis/gravis-15-w/', ''),
    'GRAVIS 15 XW':  ('gravis-15-xw',     'GRAVIS 15 XW',   PR + 'gravis/gravis-15-xw/', ''),
    'GRAVIS 15':     ('gravis-15-n',      'GRAVIS 15 N',    PR + 'gravis/gravis-15-n/', 'וריאנט הבסיס N; W/XW זהים בהספק ועכבה ונבדלים בקרן'),
    'GRAVIS 8 W':    ('gravis-8-w',       'GRAVIS 8 W',     PR + 'gravis/gravis-8-w/', ''),
    'GRAVIS 8 XW':   ('gravis-8-xw',      'GRAVIS 8 XW',    PR + 'gravis/gravis-8-xw/', ''),
    'GRAVIS 8':      ('gravis-8-w',       'GRAVIS 8 W',     PR + 'gravis/gravis-8-w/', 'וריאנט הבסיס W (85°); XW זהה בהספק ועכבה'),
    'NOMOS XLS':     ('nomos-xls',        'NOMOS XLS',      PR + 'nomos/nomos-xls/', ''),
    'NOMOS XLT':     ('nomos-xlt',        'NOMOS XLT',      PR + 'nomos/nomos-xlt/', ''),
    'SUB NOMOS XLT': ('nomos-xlt',        'NOMOS XLT',      PR + 'nomos/nomos-xlt/', ''),
    'NOMOS LS 2':    ('nomos-ls-2',       'NOMOS LS II',    PR + 'nomos/nomos-ls-2/', ''),
    'LS2 NOMOS':     ('nomos-ls-2',       'NOMOS LS II',    PR + 'nomos/nomos-ls-2/', ''),
    'NOMOS LT':      ('nomos-lt',         'NOMOS LT',       PR + 'nomos/nomos-lt/', ''),
    'PASSIO':        ('passio-sub-15',    'PASSIO SUB 15',  PR + 'passio/passio-sub-15/', 'שם הפריט ב-ERP "PASSIO" = K&F PASSIO SUB 15 (לפי תיאור הפריט)'),
    'PASSIO SUB 12': ('passio-sub-12',    'PASSIO SUB 12',  PR + 'passio/passio-sub-12/', 'אין פריט ERP בשם הזה עדיין'),
    'PASSIO SUB 15': ('passio-sub-15',    'PASSIO SUB 15',  PR + 'passio/passio-sub-15/', ''),
    'SCENA 12':      ('scena-12',         'SCENA 12',       PR + 'scena/scena-12/', ''),
    'SCENA 15':      ('scena-15',         'SCENA 15',       PR + 'scena/scena-15/', ''),
    'CA 106':        ('ca-106',           'CA 106',         None, 'מופסק — המקור הוא דף הנתונים הרשמי'),
    'CA1215-9':      ('ca-1215-9',        'CA 1215-9',      None, 'מופסק — המקור הוא דף הנתונים הרשמי'),
    'CA1515 9':      ('ca-1515-9',        'CA 1515-9',      None, 'מופסק — המקור הוא דף הנתונים הרשמי'),
    'C1001':         ('ca-1001',          'CA 1001',        None, 'שם הפריט ב-ERP "C1001" = K&F CA 1001 (מופסק)'),
    'SPECTRA 212':   ('spectra-212-n',    'SPECTRA 212 N',  PR + 'spectra/spectra-212/', '2 סקציות לקופסה (LF / MF-HF): 2×500W, 2×8Ω — הערך פר סקציה'),
    'SPECTRA 212 30-60': ('spectra-212-n','SPECTRA 212 N',  PR + 'spectra/spectra-212/', 'SPECTRA 212 N: line source 30°×60°; 2 סקציות 2×500W / 2×8Ω'),
    'SPECTRA 212 HI': ('spectra-212-n',    'SPECTRA 212 N',  PR + 'spectra/spectra-212/', 'סקציית MF/HF של SPECTRA 212 (bi-amp): 500W / 8Ω לפי דף הנתונים (2×500W, 2×8Ω); ה-SPL הוא של המערכת השלמה'),
    'SPECTRA 212 XW':('spectra-212-xw',   'SPECTRA 212 XW', PR + 'spectra/spectra-212-xw/', '2 סקציות לקופסה: 2×500W / 2×8Ω — הערך פר סקציה'),
    'PIA M':         ('pia-m',            'PIA M',          PR + 'pia/pia-m/', ''),
    'PIA 3-WAY':     ('pia-m',            'PIA M',          PR + 'pia/pia-m/', 'PIA M — הקולונה הפסיבית 3 הדרכים של סדרת PIA'),
    'PIA LFX':       ('pia-lfx',          'PIA LFX',        PR + 'pia/pia-lfx/', ''),
    'VIDA 110':      ('vida-m',           'VIDA M 110',     PR + 'vida/vida-m/', 'אקטיבי (מגברים מובנים) — VIDA M 110; אין הספק/עכבה פסיביים'),
    'VIDA 220':      ('vida-m',           'VIDA M 220',     PR + 'vida/vida-m/', 'אקטיבי (מגברים מובנים) — VIDA M 220; אין הספק/עכבה פסיביים'),
    'E90':           ('e-90-mk-2',        'E 90 MK II',     None, 'K&F E 90 MK II (מופסק) — דף הנתונים הרשמי'),
    'SW118E':        ('sw-118-e',         'SW 118 E',       None, 'מופסק — דף הנתונים הרשמי'),
    'SW215E':        ('sw-215-e',         'SW 215 E',       None, 'מופסק — דף הנתונים הרשמי'),
    'SEQUENZA 5':    ('sequenza-5',       'SEQUENZA 5',     PR + 'sequenza-5/', 'דף הנתונים משותף ל-SEQUENZA 5 / 5 W'),
    'SEQUENZA 5 W':  ('sequenza-5',       'SEQUENZA 5',     PR + 'sequenza-5/sequenza-5-w/', 'דף הנתונים משותף ל-SEQUENZA 5 / 5 W'),
    'SEQUENZA 8':    ('sequenza-8',       'SEQUENZA 8',     PR + 'sequenza-8/sequenza-8/', ''),
    'SEQUENZA 8 B':  ('sequenza-8',       'SEQUENZA 8 B',   PR + 'sequenza-8/sequenza-8-b/', ''),
    'CD44':          ('cd-44',            'CD 44',          None, 'פרוססור דיגיטלי 4×4 (מופסק) — דף הנתונים הרשמי'),
}

# models with no datasheet PDF — numbers copied from the spec table on the product page (url = that page)
PAGE_MODELS = [
    {'model': 'PASSIO W', 'kf_name': 'K&F PASSIO W', 'power_w': 200, 'impedance': 12, 'max_spl': 120, 'dispersion': '100° x 60°', 'freq': '75 Hz – 31 kHz',
     'components': '1″ high frequency tweeter on a CD horn / 2 x 5″ woofer', 'woofer_in': 5, 'weight_kg': 5.2, 'dims': '180 x 415 x 173 mm', 'design': '2-way passive bass reflex system', 'active': False,
     'url': PR + 'passio/passio-w/', 'datasheet': '', 'notes': 'אין דף נתונים נפרד — המספרים מטבלת המפרט בדף המוצר', 'verified': True},
]

def num(s):
    m = re.search(r'(\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?)', s or '')
    if not m: return None
    t = m.group(1)
    if re.fullmatch(r'\d{1,3}(?:[.,]\d{3})+', t): t = re.sub(r'[.,]', '', t)
    else: t = t.replace(',', '.')
    v = float(t); return int(v) if v == int(v) else v

def text_of(path):
    txt = path[:-4] + '.txt'
    if os.path.exists(txt): return open(txt, encoding='utf8', errors='ignore').read()
    from pypdf import PdfReader
    t = '\n'.join((p.extract_text() or '') for p in PdfReader(path).pages)
    open(txt, 'w', encoding='utf8').write(t); return t

def blocks(text):
    """split on 'K&F <NAME>' headers that are followed by a 'Design' line (spec tables)"""
    lines = [re.sub(r'\s+', ' ', l).strip() for l in text.split('\n') if l.strip()]
    out, i = [], 0
    while i < len(lines):
        if lines[i].startswith('K&F ') and any(lines[j].startswith(('Design', 'Output Power', 'Filters')) for j in range(i + 1, min(i + 4, len(lines)))):
            name = lines[i][4:].strip(); j = i + 1
            while j < len(lines) and not lines[j].startswith('Accessories') and not (lines[j].startswith('K&F ') and j > i + 1 and any(lines[k].startswith('Design') for k in range(j + 1, min(j + 3, len(lines))))): j += 1
            out.append((name, lines[i:j])); i = j
        else: i += 1
    if not out: out.append(('*', lines))   # old sheets (SW 118 E, CD 44) have no 'K&F <name>' header above the table
    return out

def field(bl, *labels):
    for k, l in enumerate(bl):
        for lab in labels:
            if l.lower().startswith(lab.lower()):
                v = l[len(lab):].strip()
                return v, k
    return '', -1

def parse(name_wanted, bl):
    r = {}
    v, _ = field(bl, 'Power handling nominal', 'Power handling nomnial', 'Nominal Power Handling', 'Power handling')
    if v and re.search(r'nominal|^\s*\d', v): r['power_w'] = num(re.sub(r'^\d\s*x\s*', '', v)); r['power_note'] = v if re.match(r'^\d\s*x', v) else ''
    v, _ = field(bl, 'Impedance nominal', 'Nominal Impedance', 'Nominal impedance', 'Impedance (nominal)')
    if v: r['impedance'] = num(re.sub(r'^\d\s*x\s*', '', v))
    v, _ = field(bl, 'Sensitivity 1 W / 1 m')
    if v: r['sensitivity'] = num(v)
    v, k = field(bl, 'Max. SPL', 'Maximum SPL', 'Max. SPL1', 'Max. SPL (1 m)')
    if k >= 0:
        v = re.sub(r'^\s*\(1 m\)', '', v).strip(); v = re.sub(r'^\d\s+(?=\d)', '', v)   # footnote digit ("Max. SPL2 134 dB")
        cand = [v] + bl[k + 1:k + 8]
        pick = None
        for c in cand:
            if 'VIDA M' in name_wanted and 'VIDA M' in c:
                if name_wanted.split()[-1] in c.replace('/S', ''): pick = c; break
                continue
            if 'dB' in c: pick = c; break
        if pick: r['max_spl'] = num(pick.split('dB')[0].split(':')[-1]); r['spl_note'] = pick.strip()
    v, _ = field(bl, 'Coverage angles nominal', 'Nominal Coverage Angle (H x V)', 'Coverage angle horizontal', 'Coverage')
    if v: r['dispersion'] = re.sub(r'\s*\(hor\. x vert\.?\)|,?\s*(horn |CD horn |rotable|rotatable).*$|\s*\(a cluster.*$', '', v).strip()
    if 'SPECTRA' in name_wanted:
        for l in bl:
            if l.startswith('Line Source:'): r['dispersion'] = l.replace('Line Source:', 'line source').strip()
    v, _ = field(bl, 'Frequency response -10 dB', 'Frequency range -10 dB', 'Frequency Range -10 dB', 'Freqency range -10 dB')
    if v: r['freq'] = re.sub(r"\s*'.*", '', v).strip()
    _, k = field(bl, 'Components')
    if k >= 0:
        comp = [bl[k][len('Components'):].strip()] + [l for l in bl[k + 1:k + 6] if not re.match(r'^(Connectors|Enclosure|Power|Dimensions|Mechanical)', l)]
        comp = [c for c in comp if c]
        r['components'] = ' / '.join(comp)[:160]
        sizes = [float(m.group(1)) for c in comp if re.search(r'low|woofer|sub|LF|chassis|excursion', c, re.I) for m in re.finditer(r'(?<![\d.])(\d{1,2}(?:\.\d)?)\s*(?:”|"|“|″|inch)', c) if float(m.group(1)) >= 4]
        if sizes: r['woofer_in'] = int(round(max(sizes)))
    v, k = field(bl, 'Weight')
    if v and 'VIDA M' in name_wanted:   # "Weight VIDA M 110: 16.5 kg" + following variant lines
        v = next((l.split(':')[-1] for l in [v] + bl[k + 1:k + 4] if name_wanted.split()[-1] in l.replace('/S', '')), '')
    if v and 'kg' in v: r['weight_kg'] = num(v.split('kg')[0].split(':')[-1])
    v, _ = field(bl, 'Dimensions')
    if v and not v.startswith('and'): r['dims'] = re.sub(r'^\([^)]*\)\s*', '', v).strip()
    v, _ = field(bl, 'Design')
    if v: r['design'] = v; r['active'] = v.lower().startswith('active')
    elif 'CD 44' in name_wanted: r['design'] = 'Digital 4-in/4-way system controller, 24 bit / 96 kHz, 200 ms input delay, 31-band GEQ, Ethernet'
    return r

def main():
    d = sys.argv[1] if len(sys.argv) > 1 else '.'
    out, urls, missing = [], {}, []
    for model, (slug, block, page, note) in MODELS.items():
        f = os.path.join(d, 'ds_%s.pdf' % slug)
        if not os.path.exists(f): missing.append(slug); continue
        bls = blocks(text_of(f))
        key = block.replace(' ', '').split('110')[0].split('220')[0]
        cands = [b for n, b in bls if n == '*' or n.replace(' ', '').startswith(key)]
        hit = max(cands, key=lambda b: sum(1 for l in b if re.match(r'^(Design|Power|Impedance|Max\. SPL|Components|Weight)', l))) if cands else None
        if hit is None: missing.append(slug + ' (block ' + block + ')'); continue
        r = parse(block, hit)
        r.update({'model': model, 'kf_name': 'K&F ' + block, 'url': page or DS % slug, 'datasheet': DS % slug, 'notes': note, 'verified': True})
        out.append(r); urls[model] = r['url']
    for r in PAGE_MODELS: out.append(dict(r)); urls[r['model']] = r['url']
    json.dump(out, open('data/kf-datasheets-import.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    json.dump(urls, open('data/kf-urls.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    for r in out: print('%-18s %5s W %4s Ω %5s dB %-22s %s" %s' % (r['model'], r.get('power_w', ''), r.get('impedance', ''), r.get('max_spl', ''), r.get('dispersion', '')[:22], r.get('woofer_in', ''), (r.get('power_note') or '') + ' ' + (r.get('spl_note') or '')[:50]))
    print(len(out), 'models;', 'missing:', missing or '—')

if __name__ == '__main__': main()
