---
name: kt-harvest
description: Bring KT Audio / Unicorn product data (kt-audio.com) into the KO Projects matrix and mark the models green — specs, woofer size, source link — and fill the gaps for discontinued KT models from datasheet PDFs the user supplies. Use when the user says "KT", "Unicorn", "kt-audio", "תביא את המידע מ-KT", "הדגמים של KT אדומים", or uploads a KT/Unicorn datasheet. Builds on spec-harvester (never invent a number).
---

# KT / Unicorn harvest → matrix

kt-audio.com is a Shopify store, so the whole catalog is one JSON call. Everything on the site is
already in `data/kt-audio-import.json` (25 products). The work that turns a red model green is
**importing that data into the matrix** and **getting datasheets for the models the site no longer lists**.

## 1. Refresh from the site (2 minutes)

```bash
S=/tmp/kt; mkdir -p $S
curl -sL -o $S/kt_products.json "https://www.kt-audio.com/products.json?limit=250"
python3 .claude/skills/spec-harvester/scripts/shopify_products.py --file $S/kt_products.json --specs
```

Compare the product list with `data/kt-audio-import.json`. New products → add them to that file in the
same shape (`model, handle, power, ohm, sens, h, v, coverage_raw, freq, driver, maxspl_pub, weight, dims, url`).
Only copy numbers that appear on the page (`specKeys` shows which spec rows exist). Amps (MX3, Dynamiq)
usually have no power-vs-impedance table on the site — leave `power` empty rather than guessing.

## 2. Import into the matrix

```bash
node scripts/matrix-import-specs.js   # kt-audio-import.json + speakers-import.json → D.specs / D.size
node scripts/matrix-sources.js        # D.src: product-page URLs (spec url wins over AMP_DATA)
node scripts/matrix-reco.js           # size rule (sub smaller than top = ✗) uses D.size
npm run validate && npm run build
```

Name matching is fuzzy (`Unicorn Till 18P SUB` ↔ `TILL 18`): the importer prints the names it could
not match. If a matrix model is spelled differently, add it to the `map` in the importer, never rename the
matrix model (its key is used by the app's kits and cells).

A model turns **green** in the matrix when it has `w`, `o`, `sens` or `spl`, **and** a source URL that is not
a generic series page. Check in the browser: `/matrix` → the model name color, and the item card's
"📄 מקור" line.

## 3. Models the site does not have (the real gap)

Not on kt-audio.com any more, so the site cannot make them green:
`MINIRAY 300, BESET, CM15, INTERPID 400/500/600, MK10C, NIKO15, Q8, QS600, TS10/12/15, E118B, E218B,
MS12/15/18/218, DAP 500.2, DAP 800.2, DYNAMIQ 4600, XLI 2500, XLI 3500`.

Ask אורי for the datasheets or manuals (PDF or photo). Then:

```bash
python3 .claude/skills/spec-harvester/scripts/extract_pdf.py <file.pdf> --find "impedance|Ω|W|dispersion|sensitivity|SPL"
```

Put the numbers into `data/kt-audio-import.json` (speakers) or into `AMP_DATA` in `src/app.js` (amps:
`pw` per impedance, `mo` minimum load, `url` = where the PDF came from, `ok: 1` only when read from the
document). Save the PDF under `docs/datasheets/kt/` and reference it in `notes`. Then run step 2.

## Rules

- Never invent a number; a field you did not see stays empty and the model stays red — that is the point of the color.
- Source link is part of "complete": a spec without a URL or PDF is still red.
- Do not rename matrix models; fix matching in the importer.
- Commit after each successful import (`npm run validate && npm run build`, conventional message, push).
