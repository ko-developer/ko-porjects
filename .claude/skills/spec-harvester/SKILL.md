---
name: spec-harvester
description: Harvest technical product data from AV manufacturer websites into a structured spec library — amplifiers, speakers, processors, lighting fixtures. Use this whenever the user points at a manufacturer URL, product series, or brand and wants the specs pulled in ("get me all the XTA amps", "scan the Gravis series", "pull the specs for these fixtures", "add these models to my data table", "I need the power ratings for all of them"). Also use when they upload a datasheet or manual PDF and want the numbers extracted, or when they ask to fill in missing/unverified data for models they already have. Produces a verified JSON import file plus an organized folder of datasheets. Do NOT use for general web research with no product specs involved.
---

# Spec Harvester

Pull real technical data out of manufacturer sites and datasheets, and turn it into a clean, importable spec library.

The reason this skill exists: AV product data is scattered across HTML tables, image-based PDFs, and marketing bullet lists, and it's tedious to collect by hand. But it's also **data people will make purchasing and engineering decisions from** — a wrong impedance or power figure means a blown amp or an under-powered room. So the goal isn't just "collect a lot", it's "collect what's actually verifiable and be honest about the rest."

## The one rule that matters

**Never invent a number, and never mark unverified data as verified.**

If a spec isn't on the page or in the PDF, leave the field empty and set `verified: false`. A model with three real fields is more useful than one with ten plausible-looking guesses, because the user can see at a glance what still needs a datasheet. Guessed numbers that look confident are worse than no numbers at all — they get trusted and then they cause failures in the field.

When you infer something (e.g. a series shares a chassis so channel count is probably the same), say so in the `notes` field and keep `verified: false`.

## Workflow

### 1. Establish scope

Figure out what you're harvesting before you start fetching. Usually the user gives you a series or collection URL. Ask only if genuinely ambiguous — otherwise infer and state your assumption.

Confirm: which brand, which series/models, and whether they want the PDFs downloaded too (default: yes, they're the source of truth).

### 2. Enumerate the product pages

You need a list of individual product URLs. Strategies, in order of reliability:

- **Series/collection page** — fetch it and pull the product links. This is the normal path.
- **Shopify stores** (very common for AV brands): `/products.json?limit=250` returns everything as JSON. It's usually too large to read directly — fetch it, save the response, and run `scripts/shopify_products.py --file <saved.json> --specs` to get a compact list with the spec bullets already separated from the marketing copy.
- **Sitemap** — `/sitemap.xml` when there's no clean collection page.

Note on environments: in a sandbox, only the web-fetch tool reaches the network — `curl` and direct Python requests are blocked. Fetch with the tool, then hand the saved file to the script.

If a fetch returns a page shell with no content, the site is client-rendered. Note it and fall back to the PDF datasheet, or tell the user that model needs manual entry.

### 3. Extract specs per model

Fetch each product page. What you're looking for depends on the product class — see `references/field-guide.md` for the field definitions and what "good" looks like per class.

**The highest-value thing on an amplifier page is the power-vs-impedance table.** A single "2000W" number is nearly useless for system design; `{8: 500, 4: 1000, 2: 1200}` tells you what the amp actually does under a real load. Same for bridge mode and 70/100V direct-drive rows. Capture the whole table when it exists.

Watch for the **minimum load impedance** — it's the constraint that decides how many speakers can share a channel. It's often stated indirectly (the lowest column in the power table, or in the protection section). Getting this wrong in either direction is expensive.

### 4. Go to the PDF when the page is thin

Manufacturer HTML often has a marketing summary while the datasheet has the real table. Download the datasheet and manual, then:

```bash
python scripts/extract_pdf.py <file.pdf> --find "impedance|Ω|Watt|dispersion|sensitivity"
```

This extracts text and greps for spec-shaped lines. If it reports the PDF has no text layer, it's a scanned/image PDF — the script renders it to readable page images instead. Read those images directly; you can see them. This is normal for Chinese-manufactured gear and older datasheets, and it's often where the complete table lives.

### 5. Organize the files

Save downloads in a structure that stays navigable as it grows:

```
<output-root>/
└── <Brand>/
    └── <Series>/
        ├── _series-summary.md      ← table of all models, at a glance
        ├── <Model>/
        │   ├── datasheet.pdf
        │   ├── manual.pdf
        │   └── specs.json
```

If a Google Drive connector is available and the user wants it there, create the same structure in Drive. Otherwise write locally and tell them where it is.

### 6. Emit the import file

Produce one `<brand>-import.json` covering everything harvested, in the shape defined in `references/output-format.md`. This is the artifact that actually gets used — the folder of PDFs is the audit trail behind it.

### 7. Audit yourself before reporting

This step catches real errors and it's fast, so don't skip it:

```bash
python scripts/audit.py <import-file.json>
```

It flags: missing required fields, verified-but-empty entries, and **physically implausible values** — power that drops as impedance drops, sensitivity outside 80–115 dB, dispersion outside 10–360°. When something trips, go back to the source rather than "fixing" the number to look reasonable.

Then report honestly: how many models, how many fully verified, and **name the ones that are incomplete and why**. The user needs to know where the holes are — that's what tells them which datasheet to go find.

## Working with what the user already has

Often the request is "fill in what's missing" rather than "start fresh". In that case, ask for (or read) their existing data first, harvest only the gaps, and return an import file containing just the additions and corrections. Flag any case where the manufacturer contradicts what they had — don't silently overwrite, since their value may come from a newer revision or from the local distributor.

## Notes on specific sources

`references/source-notes.md` has accumulated quirks per manufacturer — which sites are Shopify, which have image-only PDFs, where the power tables hide. Read it when starting on a brand, and add to it when you learn something new. That file is the compounding asset here: each harvest should make the next one faster.
