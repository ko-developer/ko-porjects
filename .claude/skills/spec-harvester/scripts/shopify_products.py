#!/usr/bin/env python3
"""List products from a Shopify store without drowning in JSON.

Many AV brands run Shopify. `/products.json` returns everything, but a single
product carries dozens of image records and variant objects, so a 4-product
collection can be 70k characters — unreadable in one go. This strips it down to
what a harvest actually needs: name, URL, price, and the spec bullets from the
description.

Two ways in. If the sandbox has network, it fetches directly. If it doesn't
(common — many agent sandboxes allow only the web-fetch tool), fetch
`/products.json?limit=250` with your web tool, save the response to a file, and
point this at the file with `--file`. Same output either way.

Usage:
    python shopify_products.py https://www.kt-audio.com
    python shopify_products.py https://www.kt-audio.com --collection amplifiers --specs
    python shopify_products.py --file saved-products.json --specs
"""
import argparse
import json
import re
import subprocess
import sys
import urllib.request


def ensure(pkg, imp=None):
    try:
        __import__(imp or pkg)
    except ImportError:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", pkg, "-q", "--break-system-packages"],
            check=False,
        )


def strip_html(s):
    import html as _html

    s = re.sub(r"<br\s*/?>|</p>|</li>|</h\d>", "\n", s or "")
    s = re.sub(r"<[^>]+>", "", s)
    s = _html.unescape(s)
    return re.sub(r"\n{3,}", "\n\n", s).strip()


# A spec line carries a number attached to a unit. Prose can contain colons and
# unit words too ("perfect for 4 ohm systems"), so requiring the number-unit
# pairing is what actually separates the bullet list from the sales copy.
UNIT_NEAR_NUMBER = re.compile(
    r"\d\s*(Ω|ohm|W\b|watt|dB|Hz|kHz|KHz|mm|cm|kg|lbs|V\b|A\b|°|%|U\b|:\d)",
    re.I,
)
LABELLED_SPEC = re.compile(
    r"^\s*[\w /()+.-]{3,40}\s*[:：]\s*.*\d",  # "Damping Factor: >200"
)


def spec_lines(body):
    """Keep the description lines that carry actual numbers.

    Shopify AV stores put real specs in a bullet list, usually under a 'Key
    Features' heading, surrounded by marketing prose. Long sentences are prose
    even when they mention units, so length is a useful second filter.
    """
    out = []
    for line in strip_html(body).split("\n"):
        line = line.strip(" •-\t*")
        if not line or len(line) > 120:
            continue
        if UNIT_NEAR_NUMBER.search(line) or LABELLED_SPEC.match(line):
            out.append(line)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("base", nargs="?", help="store root, e.g. https://www.kt-audio.com")
    ap.add_argument("--file", help="parse an already-downloaded products.json instead")
    ap.add_argument("--collection", help="collection handle to limit to")
    ap.add_argument("--specs", action="store_true", help="include spec bullets")
    ap.add_argument("--limit", type=int, default=250)
    a = ap.parse_args()

    if a.file:
        data = json.load(open(a.file, encoding="utf-8"))
        base = a.base.rstrip("/") if a.base else ""
        url = a.file
    else:
        if not a.base:
            ap.error("give a store URL, or --file with a saved products.json")
        base = a.base.rstrip("/")
        url = (
            f"{base}/collections/{a.collection}/products.json?limit={a.limit}"
            if a.collection
            else f"{base}/products.json?limit={a.limit}"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        try:
            data = json.load(urllib.request.urlopen(req, timeout=30))
        except Exception as e:
            print(f"Could not fetch {url}: {e}\n")
            print("If this is a sandbox with no direct network, fetch the URL above")
            print("with your web tool, save the JSON, and rerun with --file <path>.")
            return

    products = data.get("products", data if isinstance(data, list) else [])
    print(f"{len(products)} products — {url}\n")

    for p in products:
        price = (p.get("variants") or [{}])[0].get("price", "?")
        print(f"• {p['title']}")
        print(f"    {base}/products/{p['handle']}   ${price}")
        if a.specs:
            for line in spec_lines(p.get("body_html", ""))[:20]:
                print(f"      {line}")
        print()


if __name__ == "__main__":
    main()
