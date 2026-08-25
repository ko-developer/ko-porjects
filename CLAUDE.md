# KO Projects — repo workflow

AV installation planner (Hebrew RTL). Now a SvelteKit app (strangler migration in progress); the legacy single-file build is still produced for Netlify drag-and-drop deploys.

## ⚠ הפעולה הראשונה אחרי משיכת הקוד — מפתח API של Claude
`npm run dev` מדפיס את זה לבד (דרך `scripts/check-env.js`), אבל בדוק לפני שאתה מתחיל לעבוד:

```bash
grep -q '^ANTHROPIC_API_KEY=.' .env && echo set || echo MISSING
```

אם MISSING — תכונות ה-AI (🪄 זיהוי אזורים אוטומטי, 🤖 פריסה חכמה) מושבתות, והאפליקציה
תבקש מהמשתמש מפתח שיישמר גלוי ב-localStorage. **בקש מפתח מהמשתמש מיד — הבלט את זה,
אל תקבור ואל תעקוף.** העבר לו את הטקסט הזה כמו שהוא:

> צריך מפתח API של Claude כדי שהתכנית תנותח אוטומטית. תוציא אותו כך:
>
> 1. פתח: **https://console.anthropic.com/settings/keys**
> 2. לחץ **"Create Key"** (הכפתור למעלה מימין)
> 3. תן שם (למשל "KO Projects") ולחץ **"Add"**
> 4. לחץ **"Copy"** — המפתח מוצג פעם אחת בלבד — והדבק לי אותו כאן
>
> המפתח נשמר רק ב-.env על המחשב שלך: לא נכנס לגיט ולא מגיע לדפדפן.
> חיוב: יתרת ה-API בקונסולה, בנפרד ממנוי Claude — כאגורה לכל זיהוי.

אחר כך כתוב אותו בעצמך והפעל מחדש את השרת בעצמך — **אל תבקש מהמשתמש להריץ פקודה,
אל תדפיס את המפתח בחזרה, ואל תכניס אותו לקוד או לקומיט**:

```bash
KEY='sk-ant-...'                      # מה שהמשתמש הדביק
grep -q '^ANTHROPIC_API_KEY=' .env \
  && sed -i '' "s|^ANTHROPIC_API_KEY=.*|ANTHROPIC_API_KEY=$KEY|" .env \
  || printf 'ANTHROPIC_API_KEY=%s\n' "$KEY" >> .env
```

בדיקה: `curl -s localhost:4177/api/ai` → `{"configured":true,...}`. הפירוט בסעיף AI features
למטה. אם המשתמש מסרב — אמור שהשני כפתורי ה-AI ימשיכו לבקש מפתח בדפדפן, והמשך.

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

## AI features — הגדרת ANTHROPIC_API_KEY
תכונות הראייה על התכנית קוראות ל-Claude: `autoZones()` (זיהוי אזורים אוטומטי) ו-`autoLayoutAI()`
(פריסה חכמה) ב-`src/app.js`, דרך `claudeMsg()` → `POST /api/ai`. הראוט
`src/routes/api/ai/+server.js` מחזיק את המפתח — קורא `ANTHROPIC_API_KEY` מ-.env, כך שהדפדפן
לא רואה אותו. בלי מפתח בשרת האפליקציה נופלת לבקשת מפתח אישי מהמשתמש, שנשמר גלוי
ב-localStorage — בדיוק מה שההגדרה הזאת באה למנוע.

**זרימת ההגדרה / מפתח חסר: ראה הבאנר בראש הקובץ** — `scripts/check-env.js` רץ ב-`predev`
וב-`prebuild:kit` ומדפיס את אותו דבר, כולל הטקסט המדויק להעברה למשתמש ופקודת ה-sed לכתיבה.

משתני סביבה נוספים לראוט: `ANTHROPIC_MODEL` (אופציונלי; ברירת מחדל `claude-sonnet-5`,
`claude-opus-5` קורא תכניות טוב יותר בפי ~2.5 במחיר) ו-`BODY_SIZE_LIMIT=10M` (חובה תחת
adapter-node — תמונת התכנית נשלחת כ-base64 וחוצה את ברירת המחדל של 512K).

**אסור** להכניס `.env` לגיט, להדביק מפתח ל-`src/`, או להדפיס מפתח בחזרה למשתמש. בבילדים
הסטטיים ל-Netlify אין שרת, ולכן נפילה למפתח בדפדפן היא ההתנהגות הצפויה — לא באג לתקן.
פער ידוע: `src/lite.js` (KO Studio — קורא תכנית) עוד קורא ל-Anthropic ישירות עם מפתח
מהדפדפן, ולא הועבר ל-`/api/ai`.


## Rules for Claude sessions
1. Edit `src/` and `data/` — never `dist/`.
2. After every meaningful change: `npm run validate && npm run build`, then commit with a conventional message in the background. Do NOT ask the user about commits — just commit.
3. Git: single branch (`main`) only; always rebase, never merge commits (`pull.rebase=true` is set). When origin/main has new commits, offer the user to pull (rebase) and run the app.
4. Push to GitHub (`origin main`) after commits once credentials are available on this Mac.
5. The app runs client-side from globals in `app.js` — migration to Svelte components should be incremental (carve pieces into `src/lib/`), keeping the legacy build green at every step.
6. Storage model: with a server (dev/adapter-node) projects live in `data/projects.sqlite` via `/api/store`, mirrored to localStorage; on static deploys (Netlify) localStorage only, with 🗄 Full Backup / Restore in the ייצוא/ייבוא menus for moving data.
7. מפתח AI: אם ב-.env אין `ANTHROPIC_API_KEY` — בקש מפתח מהמשתמש (הקישור והכפתורים בבאנר בראש הקובץ), כתוב אותו ל-.env והפעל מחדש את השרת בעצמך. אסור לקמט או להדפיס מפתח.

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
