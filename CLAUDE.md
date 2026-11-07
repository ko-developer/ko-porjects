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
- `src/sysdesign.js` — תכנון אוטומטי ל"בנה מערכת" בלבד: מרווח טופים מכיסוי (פיזור × גובה/מרחק השלכה, מוגבל ב-SPL מול יעד התכלית), כמות סאבים ממאזן בס לפי SPL (+ מינימום סאב ל-80 מ״ר), מיקום סאבים לפי אחידות בס (פינות/אמצעי קירות/שורה/מרכזי); שורת "🔊 בס" בפאנל האזור היא תצוגה בלבד
- `src/plantext.js` — כיתובים בתכנית: PDF = שכבת הטקסט (מדויק, עברית הפוכה מתוקנת), תמונה = OCR מקומי (tesseract eng+heb, 3 סיבובים). סיווג במילון: אזורי קהל / תפעולי / שירותים-טכני / ריהוט / מפלסים / אחר → `P.planText` (u,v יחסיים לרקע). מוצג על התכנית (`ptMarksSVG`), פאנל בתכנית (`ptPanelHTML`), שורה בפאנל האזור (`ptZoneLineHTML`), יצירת אזורים מכיתובי קהל (`ptMakeZones`), רמזים ל-autoZones (`ptHintText`). `var` ולא `const` — app.js מרנדר לפני שהקובץ רץ
- **פריסות גב מוצרים — מקור האמת: `data/rear_layouts.json`** (מוזרק כ-`REAR_LAYOUTS`): רשומה לדגם `{name, re, items:[{t,label,port,x,y,w,side}], img, src:'editor'|'migrated', updated}`. נערך רק בעורך על התמונה (✎ גב → גרירה, לחיצה כפולה = מחבר חדש, 🔢 מספור מהיר, רוחב סמן, X/Y) ונשמר ב-`POST /api/rear-layout` (dev-server + ראוט SvelteKit). סדר העדיפות ב-`rearLayoutSrc`: `store.rearLib` רק אם נשמר אחרי גרסת השרת (`store.rearLibMeta`) → `REAR_LAYOUTS` → `REAR_KB` (גיבוי בקוד, לא למחוק) → ניחוש. `scripts/rear-migrate.js` בונה את הקובץ מ-REAR_KB + `pos` שבתמונות (`--force` דורס עריכות!).
- תמונות גב מוצרים: `data/rear_images.json` (regex לדגם → קובץ ב-`data/rear_images/`, `pos` = מיקום כל מחבר לפי תווית באחוזים, `w/h`) מוזרק כ-`REAR_IMAGES`; `rearImage(name)`/`rearImageHTML()` ב-app.js. מוצג בספריית הגבים, בעורך (גרירת סמנים, העלאה → `POST /api/rear-image`), בגב הארון בתכנית ובכרטיס היחידה. `GET /rear-img/<file>` בשרת הלגאסי וב-SvelteKit; ל-Netlify הבילד מעתיק את התמונות ל-`dist/rear-img/`
- `scripts/assemble.js` — shared assembly (app JS + data injection, template slicing) used by both builds
- `data/*.json` — ERP data (items/prices/kits/catalog). Authoritative for ERP data.
- `data/ko.sqlite` — ERP data as SQLite (committed; seed for the future DB)
- `data/projects.sqlite` — user planner projects (gitignored — user data). API: GET/POST `/api/store`. Seed/restore: `npm run import-backup [file]`
- `scripts/build.js` — assembles `dist/index.html` (single self-contained file, Netlify)
- `scripts/validate.js` — syntax-check assembled JS + data JSON. Run before every commit.

## V2 — flow wizard (side-by-side with V1 for comparison; delete nothing)
`/v2` is the streamlined version: same engine (app.js) + `src/wizard.js` overlay, clean fullscreen plan, guided steps תכנית→כיול→אזור→מערכת→הצעה→דוח. Auto-resumes at the right step per project state. "בנה הכל" auto-places the rack, builds the system, inserts rack gear and smart-wires (`window.__autoFlow` auto-accepts wireConfirm). `installerReport()` prints the installer/electrician report (rack build order, cable pull schedule, speaker mounting, full BOM). V1 keeps everything and gains a "⚡ אשף" header button.

## store "קל" (scripts/dev-server.js: liteStore / hydrateStore / GET /api/project/<id>?f=bg,bgPdf,vers)
- `GET /api/store` שולח את הפרויקטים בלי `bg` / `bgPdf` / `vers` (113 פרויקטים = 41MB, מתוכם 40MB תמונות) — רק הפרויקט הפתוח מקבל `bg`; השאר מסומנים `hasBg` / `hasPdf` / `versN` + `_lite`. `?full=1` = הכול (גיבוי).
- בדפדפן `liteWire` מגדיר getter ל-`p.bg` / `p.bgPdf`: הגישה הראשונה מביאה מהשרת ומציירת מחדש. `verManager` מביא את היסטוריית הגרסאות לפי דרישה.
- `POST /api/store` מקבל את ה-store הקל ו-`hydrateStore` משלים מהעותק השמור לפי הדגלים (מחיקת רקע חייבת למחוק גם `hasBg`/`hasPdf` — `removeBg` עושה זאת); סדר מפתחות נשמר כדי שפרויקט שלא השתנה לא ייכתב שוב לדלי.
- HTML ו-JSON גדולים נדחסים gzip (`sendText`): הדף 2.4MB → 0.64MB, ה-store 41MB → 0.43MB.

## ענן — Cloud Run (GCP scripts-298706, me-west1) — פריסה אוטומטית מ-GitHub
- כל push ל-`main` → `.github/workflows/deploy.yml` → `scripts/deploy-gcp.sh deploy` (Cloud Build מהקוד, `Dockerfile`). אימות ב-Workload Identity Federation (בלי מפתחות). ידנית: `scripts/deploy-gcp.sh setup|seed|deploy|pull|owner`.
- **אחסון אחד לכולם — `scripts/storage.js`**: `DATA_BUCKET=<דלי>` → כל מה שהשרת כותב (פרויקטים כ-JSON לפרויקט `projects/p_<id>.json`, `users.json`, `bugs.json`+`bug_files/`, `rear_images/`+`rear_images.json`, `rear_layouts.json`, `page_state/`) נקרא ונכתב בדלי `gs://scripts-298706-ko-projects-data` דרך ה-JSON API (בלי ספריות; אימות: מטא-דאטה בענן / ADC / `gcloud auth print-access-token` במחשב). בלי DATA_BUCKET → `data/` מקומית + SQLite. **המחשב והענן עובדים על אותם נתונים** (`DATA_BUCKET` ב-.env). קבצים "מאוצרים" (תמונות/פריסות גב, מצב טבלאות) — קודם הדלי, אחרת הריפו; השרת מזריק את גרסת הדלי של REAR_LAYOUTS/REAR_IMAGES לדף בזמן הגשה (סמני `/*__END:NAME__*/` מ-assemble.js). users.json/bugs.json: הקובץ באחסון הוא האמת — לפני כל שינוי קוראים אותו מחדש (`authRefresh(true)`/`bugsRefresh`) וכותבים את כולו; קריאות מרעננות כל 10 שניות.
- מה רץ בענן: שרת הלגאסי `scripts/dev-server.js` עם `PREBUILT=1` (dist נבנה בתמונה), מופע אחד, CPU תמיד פעיל. `/health` מחזיר את מנוע האחסון.
- משתני סביבה/סודות: הסוד `CLOUD_ENV` ב-GitHub = תוכן .env. ה-workflow מסנכרן כל KEY=value ל-Secret Manager (label `app=ko-projects`) ו-deploy מצרף את כולם לשרת. הוספת משתנה: שורה ב-.env → `scripts/deploy-gcp.sh envpush` → push. הבעלים נכנס מבחוץ רק דרך קישור הבעלים (`deploy-gcp.sh owner`). עריכות בענן (פריסות גב, תמונות, מצב הטבלאות) חוזרות לריפו עם `pull`.

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


## ERP — הצעות וקיטים (שני ה-stacks: `scripts/erp-routes.js` = מה שרץ בענן, `src/routes/api/erp/*` = SvelteKit dev)
- **בשם מי** (`ctx.caller` → `erpCaller` ב-`scripts/dev-server.js`): קריאות ה-MCP נשלחות בטוקן של האדם שנכנס עם KO ERP (`accessTokenFor`), כך שהצעה ופרויקט נוצרים ב-ERP על שמו ועם התחילית שלו — לא `MCP-`. מרגע שהכניסה עם KO ERP פעילה, **יצירת הצעה רק בטוקן של האדם** (בלי נפילה ל-`ERP_MCP_TOKEN`); בלעדיו הכפתור מושבת עם הסיבה (`SENDER_REASON`, `/api/erp/status` → `sender`). חיפושים: הטוקן של האדם, ולבעלים בלי כניסה ל-ERP גם המשותף. ראוטי ה-ERP פתוחים לבעלים ולאדמין / מנהל פרויקטים שנכנס עם KO ERP; קיטים, חיבור ודוחות — בעלים בלבד.
- **הצעה** (`/api/erp/offer` → MCP `create_offer`, שרת ה-MCP של ה-ERP 1.3.0): פרויקט קיים (`project_id`), פרויקט חדש שנוצר עם ההצעה (`new_project`, על ה-`account_key` של ההצעה), או לקוח בלבד. שם פרויקט בלי id → פרויקט של אותו לקוח בשם זהה, אחרת `new_project` — אף פעם לא "הראשון ברשימה". פריט שה-Filter שלו INSTALL (`data/erp_filters.json`, נכתב גם ב-`scripts/refresh-erp.js`) מחייב פרויקט, ולכן "הצעה ללקוח בלבד" חסומה בדיאלוג. `shipment_method` נשלח תמיד (ברירת מחדל `warehouse_pickup`; אין "ללא משלוח").
- **פרסום הקיטים ל-ERP** — KO Projects הוא העורך היחיד של הקיטים. `POST /api/erp/kits-sync` (בעלים בלבד; `scripts/erp-kits.js`) מעביר ל-`PUT ${ERP_API_URL}/api/external/kits` עם `ERP_KITS_TOKEN` (טוקן שירות של ה-ERP במקור ko-projects, לא טוקן ה-MCP), `?dry_run=1` עובר כמו שהוא. הדפדפן (`kitSyncPayload` ב-app.js) שולח את הרשימה המלאה: `allKits(true)` עם `kitCatOf` ותיקון הגלילים, בלי המוסתרים; קיט ERP שלא ברשימה מושבת שם (לא נמחק). אוטומטי לגמרי, בלי כפתורי פרסום (החלטת אורי 2026-10-28): 3 שניות אחרי שמירה/מחיקה/הסתרה של קיט (`kitSyncSoon`), כשהבעלים פותח את מסך הקיטים, ו-6 שניות אחרי טעינת האפליקציה — רק אם הרשימה השתנתה מאז הפרסום האחרון (`store.kitSync.sig`). מודיעים רק על כישלון: טוסט (פעם אחת לכל מצב) והתיבה `#kitSyncBox` במסך הקיטים, שמוסתרת כשהכול תקין ומציגה רק "חיבור ל-ERP" (אין חיבור / בוטל), שגיאה + "נסה שוב", או "פרסום בכל זאת" כשה-ERP דורש אישור לכיבוי קיטים. פרסום נחסם כל עוד לקיט בסיס שנשלח אין id של ה-ERP; `handleErp` מקבל כתיבה רק כ-`application/json`, ורשימה ריקה לא נשלחת. ה-ERP מסרב (409 `would_deactivate_many`, גם בבדיקה) לפרסום שמכבה יותר מדי קיטים שבאו מכאן; התיבה מציגה "הפרסום יכבה N קיטים…" עם "פרסום בכל זאת" ובדיקה שמציגה את הרשימה — שתיהן שולחות `allow_deactivate=1`, שפרסום אוטומטי לא שולח אף פעם.
- **חיבור ל-ERP** (`scripts/erp-connect.js`; `/api/erp/connect/start|callback|disconnect`, בעלים בלבד, בשני ה-stacks): authorization code + PKCE. state ו-code_verifier בזיכרון השרת (10 דקות, שימוש אחד); ה-code מוחלף בטוקן שרת-לשרת (`POST ${ERP_BASE}/api/external/kits/connect`). הטוקן נשמר בצד השרת בלבד — `data/erp-connection.json` (gitignored), ובענן `secrets/erp-connection.json` בדלי (`scripts/storage.js`) — ולא ב-`/api/store`, בדפדפן, בלוג או בכתובת. סדר: `ERP_KITS_TOKEN` מה-env, אחרת החיבור השמור; `ERP_BASE` = `ERP_API_URL` או `https://erp.kot.co.il`. `redirect_uri` = הכתובת שבה הבעלים גולש + `/api/erp/connect/callback`, וה-ERP מקבל רק כתובת מהרשימה שלו (`KO_PROJECTS_CONNECT_REDIRECTS`). מזהי ה-ERP לקיטי הבסיס בזמן ריצה: `/api/erp/kit-ids` (שם → id מ-`GET /api/external/kits`, לכל היותר פעם בשעה) → `kitApplyErpIds` (שם זהה, אחרת כלל 60 התווים), ונשמרים ב-`store.kitErpIds`.
- **ref של קיט**: קיט בסיס = ה-uuid שלו ב-ERP (`id` ב-`data/erp_kits.json`; `node scripts/erp-kit-ids.js` מוסיף id-ים בלי להוסיף קיטים, ומחזיר את השם המלא ל-4 הקיטים שנשמרו קטועים ל-60 תווים; גרסה שלי / הסתרה שנשמרו בשם הקטוע ממשיכות לחול עליהם (`kitBaseByName`)); קיט שלי = `id` שנשמר עליו (`kitEnsureIds`, `kp-…`) ולא משתנה בעריכה או בשינוי שם; גרסה שלי שמחליפה קיט בסיס (אותו שם / `replaces`) יורשת את ה-ref שלו.

- **כניסה עם KO ERP — משתמשים אחד לשתי המערכות** (`scripts/erp-login.js` + `erpSignIn` ב-`scripts/auth.js`; `/api/auth/erp/start|callback`, שרת הלגאסי בלבד): ה-ERP הוא הזהות, KO Projects מחליט מי נכנס ובאיזה תפקיד. authorization code + PKCE מול `/oauth/authorize` של ה-ERP כלקוח `ko-projects` (בלי מסך אישור); החלפת הקוד ורענון ב-`/oauth/token` נשלחים **עם טוקן השירות** ("חיבור ל-ERP" / `ERP_KITS_TOKEN`) — בלעדיו ה-ERP מסרב, כך שקוד שדלף לא שווה כלום. עוגיית `ko_erp_bind` קושרת את החזרה לדפדפן שהתחיל. רדום עד שה-ERP מפרסם `userinfo_endpoint` **וגם** יש טוקן שירות (`erpLoginAvailable`; `/api/auth/me` → `erpLogin`).
  - ההחלטה (`erpSignIn`): `erpId` → משתמש הסיסמה הלא-מקושר שכבר מחובר בדפדפן כשהכניסה מתחילה (`linkUid` בזיכרון הזרימה, נבדק שוב ב-callback) → אימוץ משתמש לא-מקושר באותו מייל **רק כשהמייל מאומת** (`email_verified` מ-`/oauth/userinfo`; ERP ישן בלי השדה = `kind === 'staff'`) → הזמנה בתוקף (`?join=` מ-`/join/<token>`) → אחרת **בקשת גישה** (`pending`) שמאושרת ב-`/admin` עם תפקיד. חשבון חיצוני (מייל לא מאומת) תמיד מקבל רשומה חדשה (מסומנת "מייל לא מאומת" ב-`/admin`) — לעולם לא רשומה קיימת. חסום = אין כניסה. מייל מאומת ב-`OWNER_EMAIL` (פסיקים) או `config.ownerEmails` (נקבע ב-`/admin`) = **הבעלים** (סשן `uid:'owner'` עם `erp` משלו; `config.ownerErp[sub]`); קישור הבעלים וגישת localhost נשארים לחירום.
  - ה-refresh token של כל אדם נשמר בצד השרת בלבד: `data/erp-user-tokens.json` (gitignored) / `secrets/erp-user-tokens.json` בדלי — לשליחת הצעות בשם האדם (`accessTokenFor`), לפי המשתמש, ולבעלים `owner:<erp sub>` (`erpTokenKey`). לא ב-users.json, בדפדפן או בלוג; נמחק כשנסגר הסשן האחרון שלו. קריאה שנכשלה (לא "קובץ חסר") זורקת ולא נכתבת עליה — כך גם `report-links.json`.
  - סנכרון בטוקן השירות: כל 10 דקות `GET /api/external/ko-projects/users?ids=` — חשבון ERP שהושבת/נמחק מנתק את הסשנים שלו כאן; אחרי כל שינוי ברשימה (3 שניות) `PUT /api/external/ko-projects/members` — ה-ERP מציג את התפקיד כאן לקריאה בלבד ב-Admin → Users. `/admin` → "הוסף מה-ERP" מחפש בספרייה של ה-ERP. החוזה: `docs/external-api.md` §14.3 בריפו של ה-ERP.
  - **מוזמן בלי חשבון KO** (`/join/<token>` → "צור חשבון KO" → `POST /api/auth/erp/signup` → `requestSignupLink`): ה-ERP מנפיק קישור חד-פעמי (`/public/ko-projects-signup/<token>` שם; שם + סיסמה, בלי Google), יוצר חשבון ERP מוגבל ל-KO Projects (אפליקציית `planner`) ומחזיר ל-`/api/auth/erp/start?join=` — ההרשאות שבקישור חלות. כבר יש למייל חשבון ERP → ישר לכניסה. מייל שכבר שייך לרשומה כאן מסורב (`signupEmailCheck`) — חוץ ממי שכבר מחובר כאותה רשומה: דף ההזמנה אחרי כניסה בסיסמה מציג "מחובר כ…" ומקשר משם. מרגע שהכניסה עם KO ERP פעילה `/api/auth/register` (חשבון סיסמה של KO Projects) מסורב.
  - רדום באמת: "הוסף מה-ERP" ומיילי הבעלים ב-`/admin` מוצגים, ורשימת המשתמשים נשלחת ל-ERP, רק כש-`erpLoginAvailable` (ושליחה רק כשיש משתמש מקושר). כל POST ב-`handleAuth` מחייב `application/json`.
  - כניסה עם סיסמה נשארת בינתיים למי שלא מקושר; חשבון שנוצר דרך ה-ERP (בלי סיסמה) מופנה ל"כניסה עם KO ERP".

- **קישור דוח לקריאה בלבד — הדוח בתוך ה-ERP** (`scripts/report-links.js`; `/r/<token>`, שרת הלגאסי): הדוח עצמו (ללקוח / לחשמלאי / למתקין, כולל השרטוטים) בלי האפליקציה סביבו ובלי עריכה — `reportViewerStart` ב-app.js פותח את `reportPreview` ומסיר סדר הדוח / ביטול / שתף / הדפס. ה-ERP מטמיע אותו (`?embed=1&lang=he|en&parent=<מקור ה-ERP>`) בכרטיס הפרויקט, בדף הפרויקט, בהזמנה ובקישור להצעות קבלנים (באג 724708e1 ב-ERP; החוזה: `docs/external-api.md` §14.4 שם).
  - הטוקן הוא ההרשאה (24 בתים, נוצר בשרת; `data/report-links.json` gitignored / `secrets/report-links.json` בדלי; לא בפרויקט, שהדפדפן יכול לשנות). `POST /api/report-link {projectId, regenerate?}` — למי שיכול לערוך את הפרויקט; regenerate מבטל את הקודם.
  - זהות הצופה בלי עוגיות (בתוך iframe אין עוגיות צד שלישי): הדף לפי הנתיב, fetch לפי `x-ko-report` (`REPORT_SHIM` מוסיף אותו, ושמירת store לא יוצאת), תמונות לפי Referer מאותו מקור. הצופה רואה פרויקט אחד בצפייה בלבד ולא נוגע בשום ראוט אחר — הבדיקה רצה לפני כל ראוט, גם לפני הבעלים המקומי. `save()` ו-localStorage לא נוגעים בעותק המקומי בדף הזה.
  - מה הצופה לא מקבל (`viewerPage` / `viewerProject` ב-dev-server): בלי `storage` ב-`__AUTH` ובלי `x-ko-store`, בלי `vers` (גם לא ב-`/api/project/<id>?f=vers`), בלי מחירי שורות ההצעה; ERP_PRICES / ERP_KITS / ERP_CATALOG / ERP_FILTERS / KIT_META ריקים, מחירי LIGHT_FIXTURES מוסרים, ו-ERP_ITEMS / ERP_SOLD נשארים רק עם שמות ודירוג (בלי מחיר, כמות, תאריכים) — טבלת אביזרי התלייה בוחרת לפי "קודם במלאי, אחר כך נמכר לאחרונה". `sharedWatch` לא רץ בצופה.
  - כותרות: `frame-ancestors` לפי `ERP_FRAME_ORIGINS` (ברירת מחדל `https://erp.kot.co.il`, ומקומית — בלי `K_SERVICE` — גם `http://localhost:5890`), `noindex`, `Referrer-Policy: same-origin`, `no-store`. הגובה נשלח ל-ERP ב-`postMessage({type:'ko-projects:height'})` רק ל-`parent` מהרשימה. `?lang=` גובר על `ko_lang` רק בדפי `/r/`.
  - שליחת הצעה: `ofPayload` שולח `plan_id`/`plan_name`, והשרת (`ctx.reportLink` ב-erp-routes) מצרף `source_plan` עם הקישורים — רק כש-`get_offer_options.supports_source_plan`. בהצעת פרויקט ה-ERP פותח את כרטיס הפרויקט כבר עכשיו.

## שיתוף ומשתמשים (scripts/auth.js — רק בשרת הלגאסי `npm run dev:legacy`)
- הבעלים (אורי) לא נרשם אף פעם: בקשה מ-localhost = בעלים אוטומטית. מבחוץ (או מאחורי פרוקסי עם
  x-forwarded-for) חייבים סשן של מוזמן, אחרת `/login`.
- `🔗 שתף` בכותרת → `POST /api/share` → קישור חד-פעמי `/join/<token>` (14 יום) לפרויקטים נבחרים,
  הרשאת עריכה/צפייה. המוזמן נרשם עם מייל+סיסמה (scrypt) ורואה רק את הפרויקטים שלו
  (`filterStore`/`mergeStore`). `/admin` (בעלים): חסימה/ביטול/מחיקה, שינוי הרשאות, ביטול קישורים.
- אחסון: `users.json` בשכבת האחסון (`scripts/storage.js`: דלי הענן כש-DATA_BUCKET מוגדר, אחרת `data/`; gitignored). הטבלאות הפנימיות (`/matrix`, `/logic`) — בעלים בלבד.
- מוזמנים מגיעים דרך השרת בענן (Cloud Run, ראה סעיף הענן); קישורי השיתוף נבנים מ-`PUBLIC_URL` (גם כשיוצרים אותם מהמחשב). Netlify הסטטי לא יודע לאמת. הראוטים של SvelteKit (`src/routes/api/store`) עדיין בלי אימות.
- **מעקב באגים** (`scripts/bugs.js`, דף `/bugs` לבעלים): כפתור 🐞 בכותרת לכל משתמש מחובר — כותרת, תיאור,
  הקלטת סרטון מסך בדפדפן (getDisplayMedia→webm), קבצים/הדבקת צילום מסך; `POST /api/bugs`. הבעלים: סטטוסים
  (חדש/בטיפול/תוקן/סגור/לא יתוקן), תגובות, מחיקה; המדווח רואה תגובות תחת 🐞 → "הבאגים שלי". אחסון
  `data/bugs.json` + `data/bug_files/` (gitignored).
  **התראה למדווח** (7.11): `/api/bugs/count` מחזיר למדווח `n` + `latest` — תגובה של הבעלים או שינוי סטטוס (`bug.statusAt`) שאחרי `seenBy[me]`; הדפדפן (`bugBadge` כל דקה) מציג כרטיס `#bugNotif` עם "פתח את הבאגים שלי" פעם אחת לכל אירוע (`localStorage.koBugNotifAt`) והתראת דפדפן אם כבר אושרה; פתיחת "הבאגים שלי" מסמנת seen. אין שליחת מייל (אין תשתית דואר).

## Rules for Claude sessions
1. Edit `src/` and `data/` — never `dist/`.
2. After every meaningful change: `npm run validate && npm run build`, then commit with a conventional message in the background. Do NOT ask the user about commits — just commit.
3. Git: single branch (`main`) only; always rebase, never merge commits (`pull.rebase=true` is set). When origin/main has new commits, offer the user to pull (rebase) and run the app.
4. Push to GitHub (`origin main`) after commits once credentials are available on this Mac.
5. The app runs client-side from globals in `app.js` — migration to Svelte components should be incremental (carve pieces into `src/lib/`), keeping the legacy build green at every step.
6. Storage model: with a server (dev/adapter-node) projects live in `data/projects.sqlite` via `/api/store`, mirrored to localStorage; on static deploys (Netlify) localStorage only, with 🗄 Full Backup / Restore in the ייצוא/ייבוא menus for moving data.
7. מפתח AI: אם ב-.env אין `ANTHROPIC_API_KEY` — בקש מפתח מהמשתמש (הקישור והכפתורים בבאנר בראש הקובץ), כתוב אותו ל-.env והפעל מחדש את השרת בעצמך. אסור לקמט או להדפיס מפתח.
8. 🌐 English: every new Hebrew UI text gets its English entry in the same commit — `npm run validate` fails without it (see the 🌐 section: `npm run i18n`, `data/i18n_en.json`, ignore markers for non-UI Hebrew). Never read UI text back from the DOM to decide anything; use ids / `data-*`.

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

### חלוקת אזורים בתכנית צבועה (plantext.js — `ptFilledRegions` / `ptPartitionFilled`)
- `ptPartition` מפצל: תכנית קווית (שחור-לבן) → המסלול הישן (רכיבי חלל בין קירות מעובים); תכנית צבועה/מרונדרת (`B.filled || B.rendered`) → מסלול חדש שדורש כיול (`P.scale`).
- המסלול החדש: קיר = ריצה ישרה ≥ 1 מ׳ ובעובי ≥ 3px + כל מה שמחובר אליה; דלת = פער ≤ 1.5 מ׳ לאורך הקיר; "חוץ" = לבן-נייר רחב (פתיחה ~1 מ׳) שמגיע לשוליים; קצה קיר חופשי מוארך עד 3 מ׳ לקיר הבא; רצפה מקובצת לפי צבע (חציון 5×5, סובלנות 70) כשריהוט כהה שקוף; מילוי חורים + סגירה 0.6 מ׳ שלא חוצה קירות.
- כיתוב ENTRANCE / VESTIBULE / CORRIDOR / כניסה / מסדרון = קטגוריית `passage`: החלל לא הופך לאזור (גם אם ≥ 5 מ״ר) אבל לא מרעיל שכנים כמו מטבח; אזור קהל עם כיתוב אבל < 4 מ״ר נזרק (רצועה ליד דלת).
- אין gap-fill עיוור בין פיקסלי קיר (רשת אריחים שנוגעת בקיר הופכת לגוש) — דלתות נסגרות רק ע״י הארכת קצות קיר. OCR ממוקד לכל חלל (`ptRoomWords`: חיתוך, הגדלה, סף יחסי לרצפה) → מטבח/מקרר/מחסן מושמטים, שירותים = אזור אחד לתאים סמוכים; חדר קטן (<5 מ״ר) בלי כיתוב: בודד = לא אזור, שניים צמודים = שירותים.
- כיתוב תפעולי מרעיל כל חלל עד 1 מ׳ ממנו (הליכה בלי לחצות קירות); חלל בלי כיתוב שיושב בתוך תיבת חלל תפעולי = מטבח; חלל צר (<1.2 מ׳) בלי כיתוב קהל = לא אזור; שם האזור = כיתוב שמרכזו בתוך החלל.
- בנצ׳מרק מול הסימונים הידניים (IoU/כיסוי): פטיו 0.80/0.92 (2 אזורים בדיוק כמו המשתמש), מסעדה מרונדרת 0.56/0.66, בית קפה 0.42 (מסלול ישן), אולם 0.62/0.84 (מסלול ישן). הרצה: `window.__evalRun` (הארנס נבנה ad-hoc בדפדפן על פרויקט זמני).

## דוחות KO (`/reports` — src/pages/reports.html, בעלים בלבד, שרת הלגאסי)
- דף דוחות עסקיים **חי מה-ERP**: KPI (מאושר / הצעות פתוחות / המרה / ממוצע / לקוחות / פרויקטים), טאבים לפי חודש (גרף עמודות מאושר מול פתוח), לקוח, פריטים מובילים, קטגוריה (לפי קידומת המק"ט: S סאונד · L/ARC/LA תאורה · V וידאו · CA/C כבלים · G במה · ספרות שירותים · R/RENT השכרה), הצעות פתוחות (ימים), פרויקטים, סטטוסים, כל ההזמנות. תקופות מוכנות + טווח ידני, "רק מאושרות", חיפוש, מיון בלחיצה על כותרת, CSV, הדפסה. מצב אחרון ב-localStorage (`koRep`). קישור בתפריט "📚 נתונים".
- `GET /api/erp/report?from&to[&fresh=1]` (scripts/erp-routes.js → `scripts/erp-report.js`): list_orders ו-list_projects מדפדפים אחורה לפי `created_before` (ל-MCP אין עימוד, 500 לשורה); שורות הפריטים — משיכה אחת של 1,000 האחרונות, וההשלמה לפי `order_id` (10 במקביל, עד 1,500 הזמנות) **רצה ברקע** על אובייקט המטמון: התשובה חוזרת מיד עם `pending` והדף שואל שוב כל 2.5 שניות עד 0 (שומר-הסף של השרת מגביל בקשה ל-40 שניות). מעבר לתקרה — `itemsPartial` והדף מסמן שדוחות הפריטים חלקיים. "מאושר" = `customer_confirmed` או סטטוס confirmed/completed/delivered/closed; מבוטלות מחוץ לסכומים. dist/reports.html נבנה אבל בלי שרת מציג הודעה ברורה.

## KO Studio (src/lite.js, data/lite_catalog.json — `npm run build:studio` → dist/studio.html, נתיב /studio)
- **חמישה מותגים (אורי, 2026-11-01)**: premium=Funktion-One (F81/F101/F55, BR115/BR118/SB8, XTA DNA 20/40 + D20), lambda=Lambda Labs (TX-2A טופ 12″ **מוגבר** active:true, MF-15 סאב פסיבי 1600W — מגבר XTA DNA 120 לסאב בלבד; מפרט מ-lambda-labs.com), kf=Kling & Freitag (PASSIO W, GRAVIS 12+ W, SONA 5; PASSIO SUB 15 / SONA SUB; IPX 2400 / IX15:4), mid=Unicorn (Euphoria 8/5, TILL 12; Euphoria 12 / TILL 18 / TILL 15; MX3-700/200, DYNAMIQ 4600 — "הכי נבחר"), budget=KT (INTERPID 800 V2, WR600, שקוע KT; ARRAY SUB 1000; DYNAMIQ 450/750/4600). DAP לא נכנס. שקוע תקרה לכל המותגים בלי דגם משלהם = Yamaha NS-IC800. sensFrom:max = רגישות נגזרת מ-SPL מקס׳ והספק (sensOf). רמקול מוגבר: בלי ערוצי מגבר (activeN), שורת התקנה "חשמל + XLR", ספיקון רק לקווים פסיביים. planZone מצמצם כמות כשיש ≥10 dB מרווח (מרווח עד ×1.6). validate דורש ≥3 שכבות עם spk/sub/amp.
- **מסך ההצעות**: צ׳יפים "🏷 מותג" (`S.brandPick`) מסננים את השכבות; לכל שכבה שמעל התקציב גרסה מקוצצת משלה (`fitInfo(budget, tier)` — עד שתיים, הקרובות לתקציב, `tier.baseId`); "המינימום הטכני" רק כשגם הזולה לא נכנסת.
- **פריסה וחיווט בדוח**: מלבן → רמקולים על שני הקירות הארוכים בזיגזג, מכוונים פנימה (`speakerPts`); ארון ברירת מחדל באזור שירות (שירותים/כניסה) אם יש (`rackPoint`); לוח החיווט (`cableSchedule`) = קו לכל ערוץ מגבר: שרשור לפי קרבה (`perCh`, עד 12 מ׳ בין רמקולים), סאב בקו נפרד, מסלול בזוויות ישרות לאורך הקיר (`routePts`, הזרוע הארוכה לאורך קיר הרמקול) +15% +3 מ׳; בתכנית הקווים מצוירים כפוליליין ממוספר, LINK בקו דק.
- **העלאת תכנית (uploadPlan)**: כל קובץ — תמונה (כל פורמט שהדפדפן מציג), PDF (הדף הראשון מרונדר ב-pdf.js; "1:N" משכבת הטקסט × רוחב הדף → S.scale אוטומטי), DXF (dxfParse/planFromDxf: LINE/LWPOLYLINE/POLYLINE/CIRCLE/ARC משורטטים; קנה מידה מ-$INSUNITS, בלי יחידות — ניחוש לפי גודל); DWG → הודעה לשמור DXF/PDF. S.planAuto שומר את ההסבר; S.scale = רוחב אמיתי ÷ 1400.
- **קנה מידה מטבלת הכותרת (Studio)**: אחרי העלאת תמונה/PDF בלי קנה מידה, liteScaleScan (OCR על שולי הגיליון, כמו ptScaleScan) מוצא "1:N" → S.planAuto={ratio,sheetMm:420,from:'ocr'} ו-applySheetRatio: S.scale = גיליון×N÷1400÷S.cropK (גורם החיתוך המצטבר מ-applyCropBox). כרטיס sheetRatioCard עם בחירת גיליון (A4–A0) בשלב הכיול ובמצב המכויל. שלב האזורים: כרטיס האזור → מקורות → "אל תשכח אזור"; תיבת הסבר הגרירה הוסרה.
- **עוד אפשרויות לכל מותג (Studio)**: בכל כרטיס הצעה כפתור "⚙ עוד אפשרויות מ-<מותג>" (optionsHTML) — צ׳יפים לרמקול/סאב/מגבר מתוך דגמי השכבה (tierVariants) עם הפרש מחיר; הבחירה נשמרת ב-S.pick[tierId] ומוחלת ב-tierWithPick בתחילת buildProposal (גם לגרסת fit דרך baseId). "↺ אוטומטי" מבטל.
- **לוגואים של המותגים (Studio)**: data/brand_logos.json → BRAND_LOGOS (מוזרק דרך LITE_DATA ב-assemble.js). Funktion-One ו-Lambda Labs = SVG מוטמע (data URI) מאתרי היצרנים; K&F ו-KT = כתובת הלוגו באתר היצרן (hotlink); Unicorn = סימן מילולי (אין לוגו רשמי זמין). brandLogo(brand, h) מצייר img בגובה h עם onerror → brandWord (תג צבעוני). מופיע בכרטיסי ההצעה, בצ׳יפי המותג, בכותרת פאנל האפשרויות ובדוח.
- **תכלית ← קיטים (/logic)**: הנתונים חיים (scripts/logic-data.js, מוזרק ב-dev-server בהגשת הדף): הקיטים = ERP + הגרסאות שלי מה-store (מיזוג כמו allKits, בלי מוסתרים), היכולת = הרמקול החלש ביותר בקיט לפי מפרטי המטריצה (max SPL או רגישות+הספק; התאמת שם סובלנית לרווחים/מקפים); ההחלטה (✓ ≥ יעד+6 · ? ≥ יעד · ✕ חלש/מוגבר · · בלי מפרט) מחושבת בדף מול היעד, כולל דריסה ידנית של היעד. dist/logic.html הסטטי נשאר עם הנתונים המוקלטים.
- **החלפת פריט בכל הקיטים** (kitSwapOpen במסך הקיטים): פריט שמופיע בקיטים → פריט מהקטלוג, בקיטים שנבחרו; קיט ERP הופך לגרסה שלי (replaces), קיט שלי משתנה במקום; שם הקיט מתעדכן כשהדגם הישן כתוב בו (kitSwapNewName, סובלני לרווחים/מקפים); שורות כפולות מאוחדות; kitEnsureIds + kitSyncSoon → מתפרסם ל-ERP.
- **🪄 הכן לי קיט** (בונה הקיטים, nkAutoKit): לפי הטופ בטיוטה משלים סאב (kitLearnFor: יחס/סאב/מגבר/פרוססור — store.kitLearn[finishStem(top)] שנרשם ב-kitLearnRecord אחרי שמירה של קיט שהושלם כך, גובר על kitLearnStats = חציון/שכיח מקיטים עם אותו רמקול ואז מהמותג), מגברים דרך kitProposals({build}) (אותו מנוע ×1.5 / DYNAMIQ / DPA-DNA), פרוססור וכבלים דרך nkMissing. "בלי סאב" נלמד (ratio 0); רמקולי תקרה בלי סאב. kitLearnHintHTML מציג מה נלמד מתחת לכפתור.
- **מותגי KT ו-Unicorn נפרדים** ב-KIT_BRANDS (Unicorn נבדק קודם: UNICORN/יוניקורן/PAGAZ/EUPHORIA/ALPHA 15/HAYA/PSS; KT: KT/DYNAMIQ/WR/1000S/INTERPID/ARRAY/BESET/NIKO; "KT UNICORN TILL" → Unicorn). brandIsKT(b) = שניהם (אותם מגברי DYNAMIQ בהצעות); ZONE_BRANDS כולל את שניהם, וערך ישן 'KT / Unicorn' שנשמר באזור תואם לשניהם (zoneBrandMatch).
- **רשימת הקיטים מקובצת לפי הרמקול הראשי** (kitGroupBy='spk' ברירת מחדל, צ׳יפ "📂 קבוצות לפי רמקול ראשי" מכבה): kitSpkGroups(k) = דגמים לפי קבוצה (בסיס גם ל-kitStdCore), kitMainSpk = הדגם עם הכמות הגדולה (סאב רק בלי רמקולים), kitGroupKey = מותג · דגם · אינץ׳ (kitSpkInch: drv מטבלת הנתונים → "N אינץ" בשם; kitSpkSize: אינץ׳ → פרוקסי מידות → לא ידוע בסוף) — הקבוצות מסודרות מרמקול קטן לגדול; קיט בלי רמקולים — לפי קטגוריה, בסוף; כותרת דביקה עם תמונת הרמקול הראשי (kitMainSpkItem + imgCell) ומספר הקיטים. כפתור ▾ בשורה (kitRowToggle/kitRowsInlineHTML, kitRowsOpen) מרחיב את שורות הקיט בתוך הרשימה עם תצוגה מלאה / עריכה / הוספה להצעה. במצב כפולים אין קיבוץ.
- **כללי קיטים** (kitRulesOpen, כפתור "⚙ כללי קיטים" והבאנר האדום במסך הקיטים): KIT_RULES = כבל רמקול (גליל) / ספיקונים ×2 לכל רמקול-סאב פסיבי רק עם מגבר מקצועי (kitFuncClass≠rcv; KIT_CAB.spkon=CASEE5KO) / XLR לכל ערוץ / גליל XLR למוגברים — דרך kitCableNeeds. כבל חשמל לא מוצע בכלל (הכלל הוסר 2026-11-01). "קיט-קיט…" (kitCabAll) מציג את כל הקיטים מלאים כברירת מחדל (kitCabClosed = מי שנסגר) (כלל כבוי ב-store.kitRulesOff לא מוצע). המסך מציג את כל הקיטים שחסר בהם משהו עם התוספת והמחיר, בחירה פרטנית, "החל על N" (kitCabApplyRows: קיט ERP → גרסה שלי עם replaces, cabOk=true) ושמירה + פרסום. "קיט-קיט…" = kitCabAll הישן.

## 🌐 אנגלית (ממשק דו-לשוני)
- כפתור "EN"/"עב" בכותרת (`#langBtn`, `i18nToggle()`): הבחירה ב-localStorage `ko_lang`, החלפה = טעינה מחדש. באנגלית `<html lang=en dir=ltr>` + class `lang-en`.
- `src/i18n.js` (מצורף ל-bundle ב-assemble): שכבת תרגום בזמן ריצה — כל צומת טקסט / title / placeholder / aria-label / alt מפוצל במפרידים (· — | : ( ) שורה), מספרים → `#`, קצוות (מספרים/סימנים) נשמרים, והליבה מתורגמת לפי המילון `I18N_EN` (`data/i18n_en.json`, מוזרק כ-DATA). MutationObserver מתרגם כל רינדור. לא מתורגם: TEXTAREA/CODE/PRE/contenteditable, ערכי input, ומה שלא במילון (שמות פריטי ERP, שמות פרויקטים/אזורים).
- **המילון נבנה מהמקור**: `scripts/i18n-extract.js` מחלץ מקטעי עברית מכל קובצי src (אותה נורמליזציה ופיצול כמו בזמן ריצה) ; `npm run i18n` (`scripts/i18n-build.js`) מתרגם את מה שחסר דרך שרת הפיתוח הרץ (`/api/ai`, המפתח נשאר בשרת) ושומר. **אחרי הוספת טקסטים חדשים בעברית — להריץ `npm run i18n`** (רק החסרים מתורגמים; `npm run i18n:check` מראה כמה חסרים). תיקון תרגום ידני: לערוך את הערך ב-`data/i18n_en.json`.
- KO Studio ודפי /logic /matrix — עדיין עברית בלבד.
- **כל בילד חייב לכלול את האנגלית — `npm run validate` נכשל בלעדיה** (`scripts/i18n-check.js`, רץ גם בזרימת הפריסה ב-GitHub, כך שזה חל על כל מי שדוחף):
  - **טקסט ממשק חדש בעברית** (כפתור, תווית, הודעה, tooltip, placeholder, הודעת שרת שמוצגת באפליקציה) — באותו קומיט: `npm run i18n` (שרת הפיתוח רץ עם `ANTHROPIC_API_KEY`) או ערך ידני ב-`data/i18n_en.json`. הבדיקה מכירה מפתח כמו שכבת התרגום: גרש/גרשיים, אימוג'י בתחילה, חלקים סביב מספר.
  - **עברית שאינה ממשק** — פרומפט ל-AI, אוצר מילים של OCR, regex שנכתב כמחרוזת, ערך שנשמר או שמשווים אליו — בין `/* i18n-ignore */` … `/* i18n-ignore-end */` במקור, או ב-`data/i18n_ignore.json`. ביטויים רגולריים (`/…/`) והערות לא נספרים בכלל (החילוץ מנתח את ה-JS עם acorn).
  - **אסור לקרוא טקסט ממשק בחזרה מה-DOM** (`textContent`/`innerText` מול עברית) ולהחליט לפיו: באנגלית הוא כבר מתורגם. מזהים לפי `id` / `data-*` (כמו `data-guest-hide` ב-`applySharedMode`). ערכים שנשמרים (שימוש האזור, סוג ההתקנה, חומרי קירות…) נשארים בעברית בנתונים — רק התצוגה מתורגמת.
  - **מסמך נפרד** (iframe srcdoc, חלון חדש) לא נראה ל-MutationObserver — לקרוא ל-`i18nDoc(doc)` כשהוא נטען (כמו דוח ההתקנה ב-wizard.js).
  - מטען ל-ERP, אוצר מילים של OCR ופרומפטים ל-AI — לא מתרגמים.
  - חירום בלבד: `I18N_ALLOW_MISSING=1 npm run validate` מדפיס את הרשימה ולא נכשל. `npm run i18n:check` מראה מה חסר.

## 🧰 הגנה על הקיטים שלי ועל ה-store מעותק ישן (2026-11-05, אחרי אובדן 44 קיטים ב-2.11)
- **מה קרה**: השרת הגיש בהפעלה קרה "עותק דיסק" ישן (`data/.cache-gcs`) כשהדלי היה איטי; לשונית שנטענה ממנו שמרה (`allKits` → `kitEnsureIds` → `save()`), והחליפה את `userKits` בדלי ברשימה הישנה. השחזור: גרסאות האובייקט `projects/meta.json` בדלי (versioning פעיל) — נבחרה הגרסה 2026-11-02T06:31 (48 קיטים) ומוזגה עם הנוכחית דרך `POST /api/store`.
- **מיזוג לכל קיט בשרת** (`POST /api/store` ב-`scripts/dev-server.js`): קיט שלי שחסר ברשימה שנשלחה ולא ב-`_delKits` נשאר; קיט שקיים בשניהם — החדש לפי `upd`. בדפדפן `kitStamp()` (ב-`save()`) נותן `upd` לכל קיט שהשתנה ורושם מחיקות ב-`store._delKits` עד שהשרת אישר; הבסיס להשוואה נקבע אחרי הטעינה מהשרת.
- **עותק זמני = קריאה בלבד**: `db.stale` ('disk'/'mem') ב-`scripts/db.js` כשהוגש עותק שאינו מהדלי → כותרת `x-ko-stale` ב-`GET /api/store` ו-`GET /api/store/state`; הדפדפן (`srvStaleCopy`) מציג באנר, חוסם `pushSrvNow`, בודק כל 8 שניות וטוען מחדש כשהענן חזר (אם אין שינויים שלא נשמרו).
- **בדיקות בלשונית**: תמיד לעקר `save`/`pushSrv`/`pushSrvNow`/`kitSyncSoon` לפני כל פעולה — גם טעינה "נקייה" של הדף שומרת (kitEnsureIds), ולכן גם `location.reload()` בלשונית בדיקה חייב להיות אחרי העיקור בטעינה הבאה.
