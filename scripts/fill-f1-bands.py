#!/usr/bin/env python3
"""ממלא ב-SPEAKER_DATA (src/app.js) את נתוני הפסים של Funktion-One מטבלאות המפרט המלאות באתר (data/funktion-one-tables.json):
   bd: { tri: {low,mid,hi}, bi: {low,hi} } — לכל פס Ω / W / רגישות / תחום תדרים / דרייבר; וגם קישורי דף מפרט ומדריך. אידמפוטנטי; שום ערך לא מומצא."""
import json, re
APP = 'src/app.js'
prods = {p['url'].rstrip('/'): p for p in json.load(open('data/funktion-one-tables.json', encoding='utf-8'))['products']}
num = lambda t: (lambda m: (float(m.group(1)) if '.' in m.group(1) else int(m.group(1))) if m else None)(re.search(r'(\d+(?:\.\d+)?)', t or ''))
def start_hz(band):
    m = re.search(r'(\d+(?:\.\d+)?)\s*(k?)Hz', (band or '').split('-')[0].split('–')[0] + 'Hz' if 'Hz' not in (band or '').split('-')[0] else (band or '').split('-')[0], re.I)
    return (float(m.group(1)) * (1000 if m.group(2).lower() == 'k' else 1)) if m else 0
unit = lambda t, u: (lambda m: (float(m.group(1)) if '.' in m.group(1) else int(m.group(1))) if m else None)(re.search(r'(\d+(?:\.\d+)?)\s*' + u, t or ''))
def raw_of(r):   # "2 x 400W" / "2 x 16Ω (4Ω parallel)" — הערך לדרייבר נשמר כמספר, והניסוח המקורי נשמר כהערה
    t = [v for v in (r.get('power'), r.get('nominalImpedence')) if v and re.search(r'\dx|x\s*\d|\(', v)]
    return ' · '.join(t) or None
def row(r): return {k: v for k, v in (('o', unit(r.get('nominalImpedence'), 'Ω')), ('w', unit(r.get('power'), 'W')), ('raw', raw_of(r)), ('sens', unit(r.get('sensitivity'), 'dB')), ('f', (r.get('operatingBand') or '').strip() or None), ('drv', (r.get('driver') or '').strip() or None), ('sensAt', (re.search(r'at\s+(.+)$', r.get('sensitivity') or '') or [None, None])[1])) if v not in (None, '')}
def bands_of(tbl):
    rows = [r for r in tbl if not re.search(r'passive', r.get('driver') or '', re.I)]
    tri_only = [r for r in rows if re.search(r'tri-?amp', r.get('driver') or '', re.I)]; bi_only = [r for r in rows if re.search(r'bi-?amp', r.get('driver') or '', re.I)]
    common = [r for r in rows if r not in tri_only and r not in bi_only]
    out = {}
    def mk(rs):
        rs = sorted(rs, key=lambda r: start_hz(r.get('operatingBand')))
        if len(rs) == 3: return dict(zip(('low', 'mid', 'hi'), map(row, rs)))
        if len(rs) == 2: return dict(zip(('low', 'hi'), map(row, rs)))
        return None
    if tri_only or bi_only:
        if tri_only and mk(common + tri_only) and len(common + tri_only) == 3: out['tri'] = mk(common + tri_only)
        if bi_only and mk(common + bi_only) and len(common + bi_only) == 2: out['bi'] = mk(common + bi_only)
    else:
        b = mk(common)
        if b: out['tri' if len(b) == 3 else 'bi'] = b
    return out
def strip_bd(l):
    k = l.find('bd: {')
    if k < 0: return l
    j = l.index('{', k); depth = 0; e = j
    for e in range(j, len(l)):
        if l[e] == '{': depth += 1
        elif l[e] == '}':
            depth -= 1
            if depth == 0: break
    start = k
    while start > 0 and l[start - 1] in ' ,': start -= 1
    if l[start - 1] == '}' and l[:start - 1].rstrip()[-1:] != ',': start = start - 1; start -= len(l[:start]) - len(l[:start].rstrip())   # צורה פגומה: " }, bd:"
    return l[:start] + l[e + 1:]
def js(v):
    if isinstance(v, dict): return '{ ' + ', '.join(k + ': ' + js(x) for k, x in v.items()) + ' }'
    if isinstance(v, (int, float)): return str(v)
    return "'" + str(v).replace('\\', '\\\\').replace("'", "\\'") + "'"
s = open(APP, encoding='utf-8').read(); a = s.index('const SPEAKER_DATA = ['); b = s.index('\n];', a); lines = s[a:b].split('\n'); st = {'bd': 0, 'man': 0, 'pdf': 0}
for i, l in enumerate(lines):
    m = re.search(r"url: '([^']+)'", l)
    if not m or m.group(1).rstrip('/') not in prods: continue
    p = prods[m.group(1).rstrip('/')]
    l = strip_bd(l)   # bd קודם — נבנה מחדש (לפי ספירת סוגריים, לא regex)
    bd = bands_of(p['table'])
    def add(l, k, v):
        if not v or re.search(r'[{,]\s*' + k + r':', l): return l, 0
        j = l.rindex('}'); return l[:j].rstrip() + ', ' + k + ': ' + js(v) + ' ' + l[j:], 1
    if bd: l, n = add(l, 'bd', bd); st['bd'] += n
    dl = {(d.get('label') or '').lower(): d['url'] for d in p.get('downloads') or []}
    man = next((u for k, u in dl.items() if 'user guide' in k or 'manual' in k), None); pdf = next((u for k, u in dl.items() if 'specification' in k or 'spec sheet' in k or 'data sheet' in k), None)
    l, n = add(l, 'man', man); st['man'] += n; l, n = add(l, 'pdf', pdf); st['pdf'] += n
    lines[i] = l
open(APP, 'w', encoding='utf-8').write(s[:a] + '\n'.join(lines) + s[b:]); print(st)
