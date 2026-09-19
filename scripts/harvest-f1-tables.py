#!/usr/bin/env python3
"""קוצר את טבלאות המפרט המלאות (שורה לכל דרייבר/פס) של כל מוצרי Funktion-One מה-CMS הרשמי של האתר (Prismic) → data/funktion-one-tables.json"""
import json, urllib.request, urllib.parse
API = 'https://funktion-one.cdn.prismic.io/api/v2'
get = lambda u: json.load(urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'ko-projects-harvest'}), timeout=40))
ref = next(r['ref'] for r in get(API)['refs'] if r.get('isMasterRef'))
out, page = [], 1
while True:
    d = get(API + '/documents/search?' + urllib.parse.urlencode({'ref': ref, 'q': '[[at(document.type,"product")]]', 'pageSize': 100, 'page': page}))
    for r in d['results']:
        x = r['data']; txt = lambda v: v if isinstance(v, str) else (' '.join(t.get('text', '') for t in v) if isinstance(v, list) else None)
        out.append({'uid': r['uid'], 'url': 'https://funktion-one.com/product/' + r['uid'], 'title': txt(x.get('heading')) or txt(x.get('pageTitle')),
                    'table': x.get('technicalTable') or [], 'table2': x.get('secondaryTechnicalTable') or [],
                    'downloads': [{'label': txt(dl.get('downloadName')), 'url': (dl.get('downloadFile') or {}).get('url')} for dl in (x.get('downloads') or []) if isinstance(dl, dict) and (dl.get('downloadFile') or {}).get('url')]})
    if page >= d['total_pages']: break
    page += 1
json.dump({'source': API, 'harvested': __import__('datetime').date.today().isoformat(), 'products': out}, open('data/funktion-one-tables.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(out), 'products;', sum(1 for p in out if len(p['table']) > 1), 'with multi-row tables')
