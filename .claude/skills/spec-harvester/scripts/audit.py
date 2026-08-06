#!/usr/bin/env python3
"""Check a harvest before it gets trusted.

Two kinds of problem this catches. First, bookkeeping: entries marked verified
that have nothing in them, missing required fields. Second and more useful,
physically implausible values — an amp whose power drops as impedance drops, a
speaker with 130 dB sensitivity. Those are almost always a misread column or a
units mixup, and they're much cheaper to catch here than after someone specs a
system from them.

The script deliberately reports rather than repairs. A number that looks wrong
should send you back to the datasheet, not to a plausible-looking substitute.

Usage:
    python audit.py import-file.json
    python audit.py import-file.json --strict   # exit 1 if anything found
"""
import argparse
import json
import sys

REQUIRED = {
    "amp": ["model", "channels"],
    "speaker": ["model"],
    "proc": ["model"],
    "fixture": ["model"],
}


def audit(models):
    errors, warnings = [], []

    for m in models:
        name = m.get("model", "<unnamed>")
        cls = m.get("class", "amp")

        for f in REQUIRED.get(cls, ["model"]):
            if not m.get(f):
                errors.append(f"{name}: missing required field '{f}'")

        populated = [
            k for k, v in m.items()
            if k not in ("model", "class", "verified", "notes", "url", "pdf")
            and v not in (None, "", {}, [])
        ]
        if m.get("verified") and not populated:
            errors.append(f"{name}: marked verified but has no spec data")
        if not m.get("verified") and not m.get("notes"):
            warnings.append(f"{name}: unverified with no note saying what's missing")

        pw = m.get("power") or {}
        if pw:
            try:
                pairs = sorted(((float(k), float(v)) for k, v in pw.items()), reverse=True)
                for (hi_z, hi_w), (lo_z, lo_w) in zip(pairs, pairs[1:]):
                    if lo_w < hi_w * 0.9:
                        warnings.append(
                            f"{name}: {lo_z}Ω gives {lo_w}W but {hi_z}Ω gives {hi_w}W — "
                            "power normally rises as impedance falls; check the column"
                        )
            except (TypeError, ValueError):
                errors.append(f"{name}: power table has non-numeric entries")

            mo = m.get("min_ohm")
            if mo:
                below = [k for k in pw if float(k) < float(mo)]
                if below:
                    warnings.append(
                        f"{name}: power quoted at {below} but min_ohm is {mo} — "
                        "one of the two is wrong"
                    )

        s = m.get("sensitivity_db")
        if s is not None and not 80 <= float(s) <= 115:
            warnings.append(f"{name}: sensitivity {s} dB is outside the plausible 80–115 range")
        if s is not None and not m.get("sensitivity_ref"):
            warnings.append(
                f"{name}: sensitivity given without a reference (1W or 2.83V) — "
                "these differ by 3 dB at 4Ω"
            )

        for f in ("dispersion_h", "dispersion_v"):
            d = m.get(f)
            if d is not None and not 10 <= float(d) <= 360:
                warnings.append(f"{name}: {f} = {d}° is outside 10–360")

        mx = m.get("max_spl")
        if mx is not None and not 90 <= float(mx) <= 150:
            warnings.append(f"{name}: max_spl {mx} dB is outside the plausible 90–150 range")

        if cls == "fixture" and m.get("lumens") and m.get("lux_at_5m"):
            pass  # both is fine and useful

    return errors, warnings


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("file")
    ap.add_argument("--strict", action="store_true")
    a = ap.parse_args()

    data = json.load(open(a.file, encoding="utf-8"))
    models = data.get("models", data if isinstance(data, list) else [])

    errors, warnings = audit(models)
    verified = sum(1 for m in models if m.get("verified"))

    print(f"{len(models)} models — {verified} verified, {len(models)-verified} incomplete\n")

    if errors:
        print(f"ERRORS ({len(errors)}):")
        for e in errors:
            print("  ✗", e)
        print()
    if warnings:
        print(f"CHECK ({len(warnings)}):")
        for w in warnings:
            print("  ?", w)
        print()
    if not errors and not warnings:
        print("Nothing flagged.")

    incomplete = [m for m in models if not m.get("verified")]
    if incomplete:
        print("Needs a datasheet:")
        for m in incomplete:
            print(f"  - {m.get('model')}: {m.get('notes') or 'no note given'}")

    if a.strict and (errors or warnings):
        sys.exit(1)


if __name__ == "__main__":
    main()
