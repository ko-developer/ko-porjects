#!/usr/bin/env python3
"""וידוא מלא של SPEAKER_DATA מול קבצי המקור שנקצרו מאתרי היצרנים. לכל שורה משווים כל שדה שפורסם במקור;
   שורה שכל השדות שלה זהים למקור מקבלת vf: '<תאריך>' (סימן ✔ בטבלה). אי-התאמות מתוקנות לערך המקור ומדווחות. הרצה: python3 scripts/verify-speaker-data.py [--fix]"""
import json, re, sys, datetime
FIX = '--fix' in sys.argv; TODAY = datetime.date.today().isoformat(); APP = 'src/app.js'
unit = lambda t, u: (lambda m: (float(m.group(1)) if '.' in m.group(1) else int(m.group(1))) if m else None)(re.search(r'(\d+(?:\.\d+)?)\s*' + u, t or ''))
src = {}
for p in json.load(open('data/funktion-one-tables.json', encoding='utf-8'))['products']:
    hz = lambda r: (lambda m: float(m.group(1)) * (1000 if m.group(2).lower() == 'k' else 1) if m else 0)(re.search(r'(\d+(?:\.\d+)?)\s*(k?)Hz', ((r.get('operatingBand') or '').replace('–', '-').split('-')[0] + 'Hz').replace('HzHz', 'Hz'), re.I))
    rows = [r for r in p['table'] if not re.search(r'passive', r.get('driver') or '', re.I)]
    t = sorted(rows, key=hz)[0] if rows else {}; t2 = p['table2'][0] if p['table2'] else {}   # שורת הכותרת = הפס הנמוך (הדרייבר הראשי)
    multi = ' · '.join(v for v in (t.get('power'), t.get('nominalImpedence')) if v and re.search(r'\d\s*x\s*\d', v)) or None
    d = re.search(r'(\d+)\s*°\s*Horizontal\s*x\s*(\d+)\s*°\s*Vertical', t2.get('dispersion') or '')
    src[p['url'].rstrip('/')] = {'brand': 'Funktion-One', 'sens': unit(t.get('sensitivity'), 'dB'), 'w': unit(t.get('power'), 'W'), 'o': unit(t.get('nominalImpedence'), 'Ω'), 'h': int(d.group(1)) if d else None, 'v': int(d.group(2)) if d else None, 'kg': (t2.get('weight') or '').strip() or None, 'conn': re.sub(r'\s+', ' ', re.sub(r'\s*[\r\n]+\s*', ' · ', t2.get('connectors') or '')).strip() or None, 'perDrv': multi}
for x in json.load(open('data/kf-datasheets-import.json', encoding='utf-8')):
    d = re.findall(r'(\d+)\s*°?\s*[x×]\s*(\d+)', x.get('dispersion') or '')
    if x.get('url'): src.setdefault(x['url'].rstrip('/') + '#' + x['model'], {'brand': 'K&F', 'model': x['model'], 'w': x.get('power_w'), 'o': x.get('impedance'), 'max': x.get('max_spl'), 'h': int(d[0][0]) if d else None, 'v': int(d[0][1]) if d else None, 'f': x.get('freq'), 'ok_src': bool(x.get('verified'))})
for x in json.load(open('data/kt-audio-import.json', encoding='utf-8')):
    if x.get('url'): src[x['url'].rstrip('/')] = {'brand': 'KT Audio', 'sens': x.get('sens'), 'w': x.get('power'), 'o': x.get('ohm'), 'h': x.get('h'), 'v': x.get('v'), 'f': x.get('freq'), 'kg': x.get('weight')}
s = open(APP, encoding='utf-8').read(); a = s.index('const SPEAKER_DATA = ['); b = s.index('\n];', a); lines = s[a:b].split('\n')
def getv(l, k):
    m = re.search(r'[{,]\s*' + k + r": (?:'((?:[^'\\]|\\.)*)'|(-?\d+(?:\.\d+)?))", l)
    if not m: return None
    return m.group(1).replace("\\'", "'") if m.group(1) is not None else (float(m.group(2)) if '.' in m.group(2) else int(m.group(2)))
norm = lambda v: re.sub(r'\s+', ' ', str(v)).strip() if isinstance(v, str) else (float(v) if v is not None else None)
rep = {'verified': 0, 'fixed_fields': [], 'no_source': [], 'by_brand': {}}
for i, l in enumerate(lines):
    m = re.search(r"url: '([^']+)'", l); mre = re.match(r"\s*\{ re: /(.+?)/i?,", l)
    if not mre: continue
    u = m.group(1).rstrip('/') if m else None
    S = src.get(u) if u else None
    if S is None and u:   # K&F: כמה דגמים חולקים דף — מזהים לפי ה-regex של השורה
        for k, v in src.items():
            if k.startswith(u + '#'):
                try:
                    if re.search(mre.group(1), v['model'], re.I) and not any(re.search(re.match(r"\s*\{ re: /(.+?)/i?,", l2).group(1), v['model'], re.I) for l2 in lines[:i] if re.match(r"\s*\{ re: /(.+?)/i?,", l2) and 'kling-freitag' in l2): S = v; break
                except re.error: pass
    name = mre.group(1)
    if S is None: rep['no_source'].append(name); l = re.sub(r",\s*vf: '[^']*'", '', l); lines[i] = l; continue
    ok = True; n = 0
    for k, sv in S.items():
        if k in ('brand', 'model', 'ok_src') or sv in (None, ''): continue
        av = getv(l, k); n += 1
        if norm(av) == norm(sv): continue
        if FIX:
            lit = ("'" + str(sv).replace('\\', '\\\\').replace("'", "\\'") + "'") if isinstance(sv, str) else str(int(sv) if float(sv) == int(sv) else sv)
            if av is None: j = l.rindex('}'); l = l[:j].rstrip() + ', ' + k + ': ' + lit + ' ' + l[j:]
            else: l = re.sub(r'([{,]\s*' + k + r": )(?:'(?:[^'\\]|\\.)*'|-?\d+(?:\.\d+)?)", lambda mm: mm.group(1) + lit, l, count=1)
            rep['fixed_fields'].append(f"{S['brand']} {name}: {k} {av!r} → {sv!r}")
        else: ok = False; rep['fixed_fields'].append(f"MISMATCH {S['brand']} {name}: {k} app={av!r} source={sv!r}")
    l = re.sub(r",\s*vf: '[^']*'", '', l)
    if ok and n >= 3 and S.get('ok_src', True):
        j = l.rindex('}'); l = l[:j].rstrip() + ", vf: '" + TODAY + "' " + l[j:]; rep['verified'] += 1; rep['by_brand'][S['brand']] = rep['by_brand'].get(S['brand'], 0) + 1
    lines[i] = l
if FIX or True: open(APP, 'w', encoding='utf-8').write(s[:a] + '\n'.join(lines) + s[b:])
print(json.dumps({k: (v if not isinstance(v, list) else {'n': len(v), 'items': v[:60]}) for k, v in rep.items()}, ensure_ascii=False, indent=1))
