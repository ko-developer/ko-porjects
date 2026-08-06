# Per-manufacturer notes

Accumulated quirks. Read the relevant entry before starting a brand; **add what you learn** when you finish one. This file is what makes the second harvest faster than the first.

---

## XTA / MC² — `xta.co.uk`

Series pages carry a full HTML power matrix for every model in the range — the best-structured source encountered so far. One fetch of `/portfolio/delta-dpa-dna-legacy/` yields the complete table for DPA 40/80/100 and DNA 20/40/80/100/120.

XTA `DPA/DNA` and MC² `Delta` are the **same amplifiers** with cosmetic differences (front panel, display, chassis length). Record both names — `DPA 80` and `Delta 80` should resolve to one spec set.

Datasheets live in a linked Google Drive folder rather than direct PDF URLs, so the HTML table is usually the practical source.

Naming: `DSP40` = `DPA40`, `20ND` = `DNA20`. The `ND` suffix denotes the non-DSP variant.

---

## Kling & Freitag — `kling-freitag.com`

Structure: `/proinstall/` for amplifiers, `/prorental/` for loudspeakers. Each series page links individual model pages; the model page has the full spec table.

The **manual PDF** (`man_ipx-dsp_en.pdf`) has better tables than the product pages — it includes Bridge / Parallel / Parallel-Bridge / Direct Drive rows the HTML omits. Text layer extracts cleanly with pypdf. Worth fetching for any IPX work.

IPX naming encodes the spec: `IPX10:4` = 10 kW total, 4 channels. Confirm anyway.

Note: IPX20:4 has **no bridge mode** (the manual says `n.a.`) while the other IPX models do. Easy to get wrong by pattern-matching across the series.

German site (`.de`) mirrors the English one; `.com` is fine.

---

## KT Audio — `kt-audio.com`

Shopify. `/products.json?limit=250` works but is too large to read in one go — use `scripts/shopify_products.py`.

Specs are in a "Key Features" bullet list, and **it is not in `body_html`** — `products.json` returns only three paragraphs of marketing prose per product. The bullets live in a separate page section (metafield), so `shopify_products.py --specs` finds nothing for this store. Use `products.json` to *enumerate* the handles, then fetch each `/products/<handle>` HTML page for the specs. Same page also carries the Downloads block with the manual PDF URL.

Amplifier bullets are reliable for power at 8Ω/4Ω, bridge at 8Ω, sensitivity, damping, dimensions, weight. **They never state minimum load impedance, and there is no 2Ω row anywhere** — for KT amps that field is always an inference off the lowest published load. Say so.

Amp collections as of 2026-08: `/collections/amplifiers` (4 products) = `/collections/dynamiq-series` (Dynamiq 450, 750) + `/collections/mx3-series` (MX3-200, MX3-700). All 2-channel.

The two amp manuals behave differently:
- `Dynamiq.pdf` — text layer extracts cleanly, including the full section 6 spec matrix for all **9** models in the OEM series (KT sells 2). Note the extracted table is column-scrambled; regroup as (8Ω stereo, 4Ω stereo, output RMS voltage, 8Ω bridge) per model and check against the product page. Section 3.3 wiring diagram is the best evidence for rated loads: `8Ω/4Ω` stereo, `8Ω` bridge. Damping factor here (>500) contradicts the product pages (>1000).
- `MX3_Series_Manual.pdf` — the spec matrix is **image/vector**, no text layer. Only the model header row (MX3-200/300/500/700/800/1000/1200), two stray `N/A` cells and the input-sensitivity row extract. Must be rendered and read visually. MX3 also supports a PARALLEL mode with no published figures.

Speaker pages give power/impedance/sensitivity/coverage but the **series PDF is image-based** — the per-model table inside is not text-extractable. Render to images and read visually when you need the models the page doesn't cover.

Collections: `/collections/amplifiers`, `/collections/till-series`, `/collections/pagaz-series`, etc.

---

## SAE Audio — `saeaudio.com`

The site frequently returns empty to fetches. Prefer the datasheet PDF if the user has it.

The PQM datasheet is **image-only** — no text layer. Render at ~170 DPI and read the images; the full table (8Ω/4Ω/2Ω stereo + 8Ω/4Ω bridge for PQM8 and PQM13 side by side) is legible that way.

Measurement conditions differ between the starred rows: `*` = 40 ms burst, `**` = 20 ms burst, both 1 kHz / 1% THD. Worth noting since it makes their numbers optimistic relative to continuous ratings.

---

## Funktion-One — `funktion-one.com`

Individual product pages, clean specs. An older `archive.funktion-one.com` holds discontinued models — useful for installed base.

Some current-range specs are easier to find on the distributor site `s1.audio` when the main page is sparse.

Naming is inconsistent across generations (`F101` vs `F101.2`) — the `.2` revisions have different dispersion. Check which one you're recording.

---

## Shopify stores generally

Many AV brands run Shopify. Tells: `/collections/` and `/products/` URL patterns, `cdn.shopify.com` assets.

- `/products.json?limit=250&page=N` — all products as JSON
- `/collections/<name>/products.json` — one collection
- Product descriptions carry the specs as HTML bullets in `body_html`

---

## When a site is client-rendered

If a fetch returns nav and boilerplate but no spec content, JavaScript is building the page. Don't retry — go to the PDF, or note the model as needing manual entry. Say so plainly in the report rather than leaving a silent gap.
