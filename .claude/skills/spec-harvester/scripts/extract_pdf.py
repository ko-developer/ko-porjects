#!/usr/bin/env python3
"""Pull spec-shaped content out of a datasheet or manual.

Datasheets come in two flavours: ones with a real text layer, and scans/exports
that are just images. This handles both — text extraction first, and if the PDF
turns out to have no usable text, it renders the pages to images so they can be
read visually instead. Image-only datasheets are common (Chinese-manufactured
gear especially) and they're often where the complete spec table lives, so
falling back rather than giving up matters.

Usage:
    python extract_pdf.py file.pdf
    python extract_pdf.py file.pdf --find "impedance|Ω|Watt|dispersion"
    python extract_pdf.py file.pdf --pages 18-25
    python extract_pdf.py file.pdf --render-to ./pages   # force image render
"""
import argparse
import os
import re
import subprocess
import sys

SPEC_PATTERN = (
    r"Ω|ohm|Watt|\bW\b|dB|impedance|power|dispersion|sensitivity|SPL|"
    r"bridge|parallel|channel|DMX|lumen|lux|beam|frequency|THD|weight"
)


def ensure(pkg, imp=None):
    try:
        __import__(imp or pkg)
    except ImportError:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", pkg, "-q", "--break-system-packages"],
            check=False,
        )


def parse_pages(spec, total):
    if not spec:
        return list(range(total))
    out = []
    for part in spec.split(","):
        if "-" in part:
            a, b = part.split("-")
            out += list(range(int(a) - 1, min(int(b), total)))
        else:
            out.append(int(part) - 1)
    return [p for p in out if 0 <= p < total]


def render(path, pages, outdir, dpi=170):
    """Rasterise pages so they can be read visually.

    Tall datasheet pages get sliced into strips — a full page scaled down to fit
    a screen is usually too small to read the numbers, which defeats the point.
    """
    ensure("pdf2image")
    ensure("pillow", "PIL")
    from pdf2image import convert_from_path
    from PIL import Image

    Image.MAX_IMAGE_PIXELS = None
    os.makedirs(outdir, exist_ok=True)
    written = []
    for pno in pages:
        imgs = convert_from_path(path, dpi=dpi, first_page=pno + 1, last_page=pno + 1)
        for im in imgs:
            w, h = im.size
            slices = max(1, min(6, round(h / w / 0.7)))  # keep strips near-legible
            for i in range(slices):
                strip = im.crop((0, int(h * i / slices), w, int(h * (i + 1) / slices)))
                strip.thumbnail((1600, 1600))
                fp = os.path.join(outdir, f"p{pno+1}_{i+1}.png")
                strip.save(fp)
                written.append(fp)
    return written


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf")
    ap.add_argument("--find", default=SPEC_PATTERN, help="regex to filter lines")
    ap.add_argument("--pages", help="e.g. 3 or 18-25 or 1,4,9")
    ap.add_argument("--render-to", help="force image render into this dir")
    ap.add_argument("--all", action="store_true", help="print every line, unfiltered")
    a = ap.parse_args()

    ensure("pypdf")
    from pypdf import PdfReader

    reader = PdfReader(a.pdf)
    total = len(reader.pages)
    pages = parse_pages(a.pages, total)
    print(f"{os.path.basename(a.pdf)} — {total} pages, reading {len(pages)}")

    if a.render_to:
        for f in render(a.pdf, pages, a.render_to):
            print("  rendered:", f)
        print("\nRead these images directly — the specs are in them.")
        return

    rx = re.compile(a.find, re.I)
    found = 0
    for pno in pages:
        text = reader.pages[pno].extract_text() or ""
        if not text.strip():
            continue
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        keep = lines if a.all else [l for l in lines if rx.search(l)]
        if keep:
            found += len(keep)
            print(f"\n--- page {pno+1} ---")
            for l in keep:
                print("  ", l[:200])

    if found == 0:
        outdir = os.path.splitext(a.pdf)[0] + "_pages"
        print("\nNo text layer — this is a scanned/image PDF. Rendering to images…")
        for f in render(a.pdf, pages[:12], outdir):
            print("  rendered:", f)
        print("\nRead these images directly; the table is in them.")
    else:
        print(f"\n{found} spec-shaped lines found.")


if __name__ == "__main__":
    main()
