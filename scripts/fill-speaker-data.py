#!/usr/bin/env python3
"""ממלא את SPEAKER_DATA ב-src/app.js מהקצירים המקומיים (דפי היצרן שנקצרו): רק ערכים שקיימים בקבצים — שום ערך לא מומצא.
   Funktion-One: data/funktion-one-import.json · KT Audio: data/kt-audio-import.json · K&F: data/kf-datasheets-import.json"""
import json, re, sys
APP = 'src/app.js'
s = open(APP, encoding='utf-8').read()
a = s.index('const SPEAKER_DATA = ['); b = s.index('\n];', a)
lines = s[a:b].split('\n')
def q(v):
    t = re.sub(r'\s*[\r\n]+\s*', ' · ', str(v)); t = re.sub(r'\s+', ' ', t).strip()
    return "'" + t.replace('\\', '\\\\').replace("'", "\\'") + "'"
def has(line, k): return re.search(r'[{,]\s*' + k + r':', line) is not None
def add(line, k, v, raw=False):
    if v in (None, '', [], 'N/A') or has(line, k): return line
    i = line.rindex('}')
    return line[:i].rstrip() + ', ' + k + ': ' + (str(v) if raw else q(v)) + ' ' + line[i:]
num = lambda v: (int(v) if float(v) == int(float(v)) else float(v)) if v not in (None, '') else None
stats = {'f1': 0, 'kt': 0, 'kf': 0}

f1 = {x['url'].rstrip('/'): x for x in json.load(open('data/funktion-one-import.json', encoding='utf-8')) if x.get('url')}
kt = {x['url'].rstrip('/'): x for x in json.load(open('data/kt-audio-import.json', encoding='utf-8')) if x.get('url')}
for i, l in enumerate(lines):
    m = re.search(r"url: '([^']+)'", l)
    if not m: continue
    u = m.group(1).rstrip('/'); l0 = l
    if u in f1:
        x = f1[u]
        for k, v in (('h', x.get('h')), ('v', x.get('v')), ('sens', x.get('sens')), ('w', x.get('w')), ('o', x.get('ohm'))):
            if v is not None: l = add(l, k, num(v), raw=True)
        l = add(l, 'pdf', x.get('pdf_ds') or x.get('pdf_td')); l = add(l, 'man', x.get('pdf_manual'))
        l = add(l, 'f', x.get('band')); l = add(l, 'kg', x.get('weight')); l = add(l, 'conn', x.get('connectors')); l = add(l, 'drv', x.get('driver'))
        if l != l0: stats['f1'] += 1
    elif u in kt:
        x = kt[u]
        for k, v in (('h', x.get('h')), ('v', x.get('v')), ('sens', x.get('sens')), ('max', x.get('maxspl_pub')), ('w', x.get('power')), ('o', x.get('ohm'))):
            if v is not None: l = add(l, k, num(v), raw=True)
        pdfs = x.get('pdfs') or []
        l = add(l, 'pdf', pdfs[0] if pdfs else None); l = add(l, 'f', x.get('freq')); l = add(l, 'kg', x.get('weight')); l = add(l, 'dims', x.get('dims')); l = add(l, 'drv', x.get('driver') or x.get('woofer'))
        if l != l0: stats['kt'] += 1
    lines[i] = l

# K&F — כל הדגמים מדפי הנתונים; הרגישות (אין בדפי הנתונים) נשארת רק היכן שכבר אומתה בעבר
kf = json.load(open('data/kf-datasheets-import.json', encoding='utf-8'))
old_sens = {}
for l in lines:
    m = re.match(r"\s*\{ re: /(SPECTRA\\s\?212|GRAVIS\\s\?12|GRAVIS\\s\?15)/i,.*?sens: (\d+)", l)
    if m: old_sens[m.group(1).replace('\\s?', ' ')] = int(m.group(2))
lines = [l for l in lines if not re.match(r"\s*\{ re: /(SPECTRA\\s\?212|GRAVIS\\s\?12|GRAVIS\\s\?15)/i,", l)]
# אידמפוטנטי: בלוק K&F קודם מוסר ונבנה מחדש; הרגישויות שאומתו בעבר (דפי המוצר של K&F) נשמרות
lines = [l for l in lines if 'kling-freitag.com' not in l and 'Kling & Freitag — מדפי הנתונים' not in l]
for k0, v0 in (('SPECTRA 212', 107), ('GRAVIS 12', 103), ('GRAVIS 15', 105)): old_sens.setdefault(k0, v0)
def mkre(model):
    toks = re.split(r'[\s-]+', re.sub(r'(?<=[A-Za-z])(?=\d)', ' ', model.strip()))   # CA1215 = CA 1215
    return r'\s?-?'.join(re.escape(t).replace('\\+', r'\+') for t in toks) + r'(?![\w+])'
blk = ['  /* ===== Kling & Freitag — מדפי הנתונים הרשמיים (data/kf-datasheets-import.json); רגישות רק היכן שאומתה ===== */']
for x in sorted(kf, key=lambda y: -len(y['model'])):
    parts = ['re: /' + mkre(x['model']) + '/i']
    d = re.findall(r'(\d+)\s*°?\s*[x×]\s*(\d+)', x.get('dispersion') or '')
    if d: parts += ['h: ' + d[0][0], 'v: ' + d[0][1]]
    base = next((k for k in old_sens if x['model'].upper().startswith(k)), None)
    if base: parts.append('sens: ' + str(old_sens[base]))
    if x.get('max_spl'): parts.append('max: ' + str(num(x['max_spl'])))
    if x.get('power_w'): parts.append('w: ' + str(num(x['power_w'])))
    if x.get('impedance'): parts.append('o: ' + str(num(x['impedance'])))
    parts.append('ok: ' + ('1' if x.get('verified') else '0'))
    for k, v in (('url', x.get('url')), ('pdf', x.get('datasheet')), ('f', x.get('freq')), ('kg', (str(x['weight_kg']) + ' kg') if x.get('weight_kg') else None), ('dims', x.get('dims')), ('drv', (x.get('components') or '')[:120] or None), ('note', x.get('design'))):
        if v: parts.append(k + ': ' + q(v))
    if x.get('active'): parts.append("amp: 'active'")
    blk.append('  { ' + ', '.join(parts) + ' },'); stats['kf'] += 1
idx = next(i for i, l in enumerate(lines) if 'מותגים נוספים' in l)
lines[idx + 1:idx + 1] = blk
open(APP, 'w', encoding='utf-8').write(s[:a] + '\n'.join(lines) + s[b:])
print(stats)
