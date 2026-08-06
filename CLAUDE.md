# KO Projects — repo workflow

AV installation planner (Hebrew RTL, single-page app). Deployed by dragging `dist/index.html` (or a zip of it) to Netlify.

## Layout
- `src/index.template.html` — HTML shell + CSS, with `/*__APP__*/` marker
- `src/app.js` — all application JS, with `/*__DATA:NAME__*/` markers
- `data/*.json` — flat data files (ERP items/prices/kits/catalog). Authoritative for data.
- `data/ko.sqlite` — same data as SQLite (committed; becomes a real DB later)
- `scripts/build.js` — assembles `dist/index.html` (single self-contained file)
- `scripts/validate.js` — syntax-check assembled JS + data JSON. Run before every commit.
- `scripts/dev-server.js` — `npm run dev` → http://localhost:4177, rebuilds per request

## Rules for Claude sessions
1. Edit `src/` and `data/` — never `dist/`.
2. After every meaningful change: `npm run validate && npm run build`, then commit with a conventional message. Do NOT ask the user about commits — just commit.
3. After every commit run `bash scripts/export.sh` — it syncs a git bundle + snapshot to the user's persistent folder (the sandbox home is wiped between sessions).
4. Session restore (start of a new session):
   `git clone "/sessions/<session>/mnt/outputs/ko-projects.bundle" ~/ko-projects && cd ~/ko-projects && git remote set-url origin https://github.com/ko-developer/ko-porjects.git`
5. The mounted outputs folder cannot host `.git` (no unlink permitted) — the live repo must stay in `~`.
6. Pushing to GitHub happens from the user's Mac (sandbox has no GitHub access):
   `cd <outputs>/ko-projects-src && git clone ko-projects.bundle ko && cd ko && git push origin main`

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
