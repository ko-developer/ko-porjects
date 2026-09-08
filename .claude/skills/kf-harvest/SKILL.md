---
name: kf-harvest
description: Bring Kling & Freitag (K&F) product data into the KO Projects matrix from the official datasheets in kling-freitag.com/downloads — power, impedance, max SPL, coverage, woofer size, weight, and the product-page / datasheet link that turns a model green. Use when the user says "K&F", "Kling & Freitag", "kling-freitag", "הדגמים של K&F אדומים", or asks for a K&F manual/link. Builds on spec-harvester (never invent a number).
---

# K&F harvest → matrix

kling-freitag.com has one download page with an official datasheet for **every** model, including discontinued
ones (CA 1215-9, SW 118 E, E 90 MK II, TOPAS, CD 44…): `https://www.kling-freitag.com/downloads/` →
`/content/uploads/ds_<slug>_en.pdf` (manuals: `man_<slug>_en.pdf`). Product pages come from
`prorental-sitemap.xml` / `proinstall-sitemap.xml`. The discontinued-products page itself is empty — the
datasheet PDF is the source for those models.

## 1. Fetch the datasheets (scratch dir, not the repo)

```bash
S=/tmp/kfds; mkdir -p $S; cd $S
curl -sL https://www.kling-freitag.com/downloads/ | grep -o 'href="[^"]*ds_[^"]*\.pdf"' | sed 's/href=//;s/"//g' | sort -u   # the full list
for f in sona-5 sona-sub gravis-15-n ...; do curl -sL -o ds_$f.pdf "https://www.kling-freitag.com/content/uploads/ds_${f}_en.pdf"; done
pip3 install -q --target $S/pylib pypdf     # only if pypdf is missing
```

## 2. Parse → import files

```bash
PYTHONPATH=$S/pylib python3 .claude/skills/kf-harvest/scripts/parse_ds.py $S
```

`parse_ds.py` holds the **MODELS** table: matrix model name (ERP spelling — never rename it) → datasheet slug,
block name inside multi-product sheets (SEQUENZA 5 / 5 B, SEQUENZA 8 / 8 B, VIDA M 110 / 220), product page
(or the PDF itself for discontinued models) and an honest note when the mapping is a judgement call
(plain `GRAVIS 15` → the N base variant; `C1001` = CA 1001; `PIA 3-WAY` = PIA M; `SPECTRA 212 HI` = the MF/HF
section of a 2×500 W / 2×8 Ω bi-amp box). `PAGE_MODELS` covers models without a sheet (PASSIO W) with numbers
copied from the product-page spec table. Output: `data/kf-datasheets-import.json` + `data/kf-urls.json`.

New K&F model in the ERP → add one MODELS line, rerun. Sheet has no `K&F <name>` header (old SW sheets, CD 44)
→ the parser treats the whole text as one block; labels differ ("Power handling 700 W nominal",
"Impedance (nominal)", "Sensitivity 1 W / 1 m") and are already handled.

## 3. Into the matrix

```bash
node scripts/matrix-import-specs.js   # kf-datasheets-import.json runs first and OVERRIDES older harvest values
node scripts/matrix-sources.js        # D.src/D.srcKind; verified AMP_DATA power tables replace ERP-name numbers (D.pw)
node scripts/matrix-reco.js
npm run validate && npm run build
```

Amps (TOPAS, D 40:4, D 120:4 = ERP "LAB 120 KLING", IX15:4, IPX 5:4/10:4/10:8/20:4) live in `AMP_DATA` in
`src/app.js` with `ok: 1`, `pw` per impedance and `url`/`pdf` — matrix-sources copies `pw` into `D.pw`.
Active speakers (VIDA M) carry `act: 1` + `spl`; the matrix counts that as complete (no passive W/Ω exists).

Check in the browser: `/matrix` → K&F names green, item card "📄 מקור" → product page or `ds_*.pdf`.

## Known gaps (no source on the site)

- `IPX 2400` (old Lab.gruppen-based SystemAmp) — no datasheet on kling-freitag.com; stays red until a PDF is supplied.
- ERP names that are not a K&F model: `GRAVIS XW 110`, `SPECTRA 212 X60` (both hidden from the matrix today).

## Rules

- Never invent a number; a field the sheet does not state stays empty and the model stays red.
- Source link is part of "complete": a spec without a URL/PDF is still red.
- Do not rename matrix models; fix the mapping in `MODELS`.
- Commit after each successful import (`npm run validate && npm run build`, conventional Hebrew message, push).
