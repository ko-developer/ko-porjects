#!/usr/bin/env python3
"""ממזג תוצאות מחקר מאומתות (data/spec-research-found.json — כל ערך עם קישור למקור באתר היצרן) אל SPEAKER_DATA / AMP_DATA ב-src/app.js.
   ממלא רק שדות חסרים; לא דורס ערכים קיימים. שימוש: python3 scripts/merge-found-specs.py [found_*.json ...] — קבצים חדשים נצברים לקובץ הנתונים."""
import json, re, sys, os
APP, STORE = 'src/app.js', 'data/spec-research-found.json'
store = json.load(open(STORE, encoding='utf-8')) if os.path.exists(STORE) else {'speakers': [], 'amps': []}
for f in sys.argv[1:]:
    d = json.load(open(f, encoding='utf-8'))
    for k in ('speakers', 'amps'):
        for x in d.get(k, []):
            if not x.get('found'): continue
            cur = next((y for y in store[k] if y.get('url') == x.get('url') and y.get('model') == x.get('model')), None)
            if cur: cur['found'].update(x['found']); cur.setdefault('sources', {}).update(x.get('sources') or {})
            else: store[k].append({'model': x.get('model'), 'url': x.get('url'), 'found': x['found'], 'sources': x.get('sources') or {}})
json.dump(store, open(STORE, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

s = open(APP, encoding='utf-8').read()
def q(v):
    t = re.sub(r'\s+', ' ', str(v)).strip(); return "'" + t.replace('\\', '\\\\').replace("'", "\\'") + "'"
def lit(v):
    if isinstance(v, bool): return 'true' if v else 'false'
    if isinstance(v, (int, float)): return str(int(v) if float(v) == int(v) else v)
    if isinstance(v, dict): return '{ ' + ', '.join(str(k) + ': ' + lit(x) for k, x in v.items() if x is not None) + ' }'
    return q(v)
NUM = {'h', 'v', 'sens', 'max', 'w', 'o', 'ch'}
def patch(block_name, items):
    global s
    a = s.index('const ' + block_name + ' = ['); b = s.index('\n];', a); lines = s[a:b].split('\n'); n = 0
    for it in items:
        url = (it.get('url') or '').rstrip('/'); model = it.get('model') or ''
        idx = [i for i, l in enumerate(lines) if url and re.search(r"url: '" + re.escape(url) + r"/?'", l)]
        if not idx:   # לפי ה-regex של השורה
            for i, l in enumerate(lines):
                m = re.match(r"\s*\{ re: /(.+?)/(i?),", l)
                try:
                    if m and re.search(m.group(1).replace('(?![\\w+])', r'(?![\w+])'), model, re.I): idx = [i]; break
                except re.error: pass
        for i in idx:
            l = lines[i]
            for k, v in it['found'].items():
                if v in (None, '', {}) or re.search(r'[{,]\s*' + re.escape(k) + r':', l): continue
                if k in NUM and not isinstance(v, (int, float)): continue
                j = l.rindex('}'); l = l[:j].rstrip() + ', ' + k + ': ' + lit(v) + ' ' + l[j:]; n += 1
            lines[i] = l
    s = s[:a] + '\n'.join(lines) + s[b:]; return n
print({'speaker fields': patch('SPEAKER_DATA', store['speakers']), 'amp fields': patch('AMP_DATA', store['amps'])})
open(APP, 'w', encoding='utf-8').write(s)
