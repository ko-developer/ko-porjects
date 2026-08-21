#!/usr/bin/env python3
"""חילוץ טקסט מ-PDF עם פונטים מקוצרים — מפענח ToUnicode CMap לכל פונט."""
import re, sys, zlib

def objects(raw):
    objs = {}
    for m in re.finditer(rb'(\d+)\s+\d+\s+obj\b(.*?)\bendobj', raw, re.S):
        objs[int(m.group(1))] = m.group(2)
    return objs

def stream_of(body):
    m = re.search(rb'stream\r?\n(.*?)\r?\nendstream', body, re.S)
    if not m: return b''
    s = m.group(1)
    try: return zlib.decompress(s)
    except Exception: return s

def cmap_of(data):
    """CMap → {קוד: תו}"""
    cm = {}
    for blk in re.findall(rb'beginbfchar(.*?)endbfchar', data, re.S):
        for src, dst in re.findall(rb'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>', blk):
            try: cm[int(src, 16)] = bytes.fromhex(dst.decode()).decode('utf-16-be', 'replace')
            except Exception: pass
    for blk in re.findall(rb'beginbfrange(.*?)endbfrange', data, re.S):
        for lo, hi, dst in re.findall(rb'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>', blk):
            try:
                l, h = int(lo, 16), int(hi, 16); base = int(dst, 16)
                for i in range(min(h - l + 1, 512)): cm[l + i] = chr(base + i)
            except Exception: pass
    return cm

def pdf_text(path):
    raw = open(path, 'rb').read()
    objs = objects(raw)
    # פונט → CMap, לפי מספר האובייקט של הפונט
    fmaps = {}
    for num, body in objs.items():
        m = re.search(rb'/ToUnicode\s+(\d+)\s+\d+\s+R', body)
        if m and int(m.group(1)) in objs:
            cm = cmap_of(stream_of(objs[int(m.group(1))]))
            if cm: fmaps[num] = cm
    # שם משאב (/F1) → CMap, מתוך מילוני Resources
    res = {}
    for body in objs.values():
        for fm in re.finditer(rb'/Font\s*<<(.*?)>>', body, re.S):
            for nm, on in re.findall(rb'/([A-Za-z0-9]+)\s+(\d+)\s+\d+\s+R', fm.group(1)):
                if int(on) in fmaps: res.setdefault(nm.decode(), fmaps[int(on)])
    out = []
    for body in objs.values():
        data = stream_of(body)
        if not re.search(rb'\bT[jJ]\b', data): continue
        cur = None
        for tok in re.finditer(rb'/([A-Za-z0-9]+)\s+[\d.]+\s+Tf|\((?:\\.|[^\\()])*\)|<([0-9A-Fa-f]+)>', data):
            if tok.group(1):
                cur = res.get(tok.group(1).decode()); continue
            g = tok.group(0)
            if g.startswith(b'<'):
                hx = tok.group(2).decode(); codes = [int(hx[i:i+4] or '0', 16) for i in range(0, len(hx), 4)]
            else:
                s = re.sub(rb'\\([()\\])', rb'\1', g[1:-1]); codes = list(s)
            if cur: out.append(''.join(cur.get(c, '') for c in codes))
            else: out.append(bytes(codes).decode('latin-1'))
        out.append(' ')
    return re.sub(r'[ \t]+', ' ', ''.join(out))

if __name__ == '__main__':
    t = pdf_text(sys.argv[1])
    print(f'[{len(t)} chars]')
    if len(sys.argv) > 2:
        for m in re.finditer(sys.argv[2], t, re.I): print(' •', re.sub(r'\s+', ' ', t[max(0, m.start()-90):m.start()+120]))
    else: print(t[:1500])
