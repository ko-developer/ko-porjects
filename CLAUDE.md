# KO Projects — repo workflow

AV installation planner (Hebrew RTL). Now a SvelteKit app (strangler migration in progress); the legacy single-file build is still produced for Netlify drag-and-drop deploys.

## Layout
- `src/app.js` — legacy application JS (all logic), with `/*__DATA:NAME__*/` markers
- `src/index.template.html` — legacy HTML shell + CSS, with `/*__APP__*/` marker
- `src/routes/` — SvelteKit: `+page.svelte` wraps the legacy app (CSS+body from the template, `/app.js` injected on mount); `api/store/+server.js` = projects DB API; `app.js/+server.js` serves the assembled legacy JS
- `scripts/assemble.js` — shared assembly (app JS + data injection, template slicing) used by both builds
- `data/*.json` — ERP data (items/prices/kits/catalog). Authoritative for ERP data.
- `data/ko.sqlite` — ERP data as SQLite (committed; seed for the future DB)
- `data/projects.sqlite` — user planner projects (gitignored — user data). API: GET/POST `/api/store`. Seed/restore: `npm run import-backup [file]`
- `scripts/build.js` — assembles `dist/index.html` (single self-contained file, Netlify)
- `scripts/validate.js` — syntax-check assembled JS + data JSON. Run before every commit.

## V2 — flow wizard (side-by-side with V1 for comparison; delete nothing)
`/v2` is the streamlined version: same engine (app.js) + `src/wizard.js` overlay, clean fullscreen plan, guided steps תכנית→כיול→אזור→מערכת→הצעה→דוח. Auto-resumes at the right step per project state. "בנה הכל" auto-places the rack, builds the system, inserts rack gear and smart-wires (`window.__autoFlow` auto-accepts wireConfirm). `installerReport()` prints the installer/electrician report (rack build order, cable pull schedule, speaker mounting, full BOM). V1 keeps everything and gains a "⚡ אשף" header button.

## Commands
- `npm run dev` — SvelteKit dev server → http://localhost:4177 (loads/saves projects via SQLite)
- `npm run dev:legacy` — old per-request-rebuild server (same port, also serves `/api/store`)
- `npm run build` — legacy single-file `dist/index.html` (keep this working — Netlify deploy)
- `npm run build:kit` / `preview:kit` — SvelteKit production build (adapter-node)

## Rules for Claude sessions
1. Edit `src/` and `data/` — never `dist/`.
2. After every meaningful change: `npm run validate && npm run build`, then commit with a conventional message in the background. Do NOT ask the user about commits — just commit.
3. Git: single branch (`main`) only; always rebase, never merge commits (`pull.rebase=true` is set). When origin/main has new commits, offer the user to pull (rebase) and run the app.
4. Push to GitHub (`origin main`) after commits once credentials are available on this Mac.
5. The app runs client-side from globals in `app.js` — migration to Svelte components should be incremental (carve pieces into `src/lib/`), keeping the legacy build green at every step.
6. Storage model: with a server (dev/adapter-node) projects live in `data/projects.sqlite` via `/api/store`, mirrored to localStorage; on static deploys (Netlify) localStorage only, with 🗄 Full Backup / Restore in the ייצוא/ייבוא menus for moving data.

## Current product state (handoff from Cowork sessions, Aug 2026)
Single-page AV planner, Hebrew RTL. Core flows working: plan upload+calibration, sound zones
(venue presets, ring/corners/stage placement, SPL coverage with wall reflections), racks with
measured rear-panel wiring, multicore panels, ohm-law chaining across amp channels, offer
building from the plan, ERP offer payload (create_offer via MCP), undo/redo, per-category
cable filtering and print report with per-discipline drawings.

Verified equipment DB inside app.js: 38 amps / 12 processors (XTA, K&F IPX, KT, SAE PQM,
DigiSynthetic) with power-vs-impedance tables; ~45 speakers. Data policy: never invent specs —
unverified entries are flagged red in the UI.

Roadmap (docs/ + user's words): lighting module (fixtures, lux, DMX universes, breaker load),
video module (throw/resolution, signal chain), multi-discipline switch, real DB (sqlite committed
here is the seed), ERP write-back. Use .claude/skills/spec-harvester when adding manufacturer data.

## Next-step candidates for the web-app evolution
1. Vite first (module splitting of app.js, keep vanilla) — cheap, immediate maintainability.
2. Framework (SvelteKit) only when server needs appear (auth, shared projects, live DB).
