#!/bin/bash
# ===================================================================================
# פריסת KO Projects ל-Cloud Run (פרויקט GCP scripts-298706, אזור me-west1 = תל אביב).
#   scripts/deploy-gcp.sh setup    — דלי לנתונים, הרשאות, סודות מ-.env (פעם אחת)
#   scripts/deploy-gcp.sh seed     — זריעת הפרויקטים מה-SQLite המקומי לדלי (בלי לדרוס קיימים)
#   scripts/deploy-gcp.sh deploy   — בנייה בענן מהקוד ופריסה; מדפיס כתובת + קישור בעלים
#   scripts/deploy-gcp.sh pull     — משיכת מה שנערך בענן (פריסות גב, תמונות, מצב הטבלאות) חזרה לריפו
#   scripts/deploy-gcp.sh envsync [file] — כל KEY=value בקובץ (ברירת מחדל .env) → Secret Manager (יצירה/גרסה חדשה רק אם השתנה)
#   scripts/deploy-gcp.sh envpush  — מעלה את .env המקומי לסוד CLOUD_ENV ב-GitHub → הפריסה האוטומטית מסנכרנת אותו לשרת
#   scripts/deploy-gcp.sh owner    — מדפיס את קישור הבעלים (מהדלי)
# משתני סביבה: מוסיפים שורה ל-.env → `scripts/deploy-gcp.sh envpush` → מה-push הבא הם על השרת (כל המפתחות שבסוד).
#   scripts/deploy-gcp.sh all      — setup + seed + deploy
# פריסה אוטומטית: כל push ל-main מריץ .github/workflows/deploy.yml → deploy (WIF, בלי מפתחות)
# הבעלים נכנס דרך קישור הבעלים (/owner/<key>) — מבחוץ אין "localhost".
# ===================================================================================
set -euo pipefail
cd "$(dirname "$0")/.."
# במק (התקנה מקומית ב-~/.local) — ב-GitHub Actions gcloud כבר ב-PATH
[ -x "$HOME/.local/python/python/bin/python3" ] && export CLOUDSDK_PYTHON="${CLOUDSDK_PYTHON:-$HOME/.local/python/python/bin/python3}"
[ -d "$HOME/.local/google-cloud-sdk/bin" ] && export PATH="$HOME/.local/google-cloud-sdk/bin:$PATH"
PROJECT="${GCP_PROJECT:-scripts-298706}"
REGION="${GCP_REGION:-me-west1}"
SERVICE="${GCP_SERVICE:-ko-projects}"
BUCKET="${GCP_BUCKET:-$PROJECT-ko-projects-data}"
PN=$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')
SA="$PN-compute@developer.gserviceaccount.com"
envval() { grep -E "^$1=." .env 2>/dev/null | head -1 | cut -d= -f2- | tr -d '\r'; }

setup() {
  echo "== bucket gs://$BUCKET"
  gcloud storage buckets describe "gs://$BUCKET" --project "$PROJECT" >/dev/null 2>&1 || gcloud storage buckets create "gs://$BUCKET" --project "$PROJECT" --location "$REGION" --uniform-bucket-level-access
  gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" --member "serviceAccount:$SA" --role roles/storage.objectAdmin >/dev/null
  envsync .env
}
# סנכרון קובץ env → Secret Manager. כל סוד מסומן label app=ko-projects, וכך deploy מצרף את כולם אוטומטית.
envsync() {
  local f="${1:-.env}"; [ -f "$f" ] || { echo "envsync: no file $f"; return 0; }
  local n=0
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%$'\r'}"
    [[ "$line" =~ ^[A-Z][A-Z0-9_]*= ]] || continue
    local k="${line%%=*}" v="${line#*=}"; [ -z "$v" ] && continue
    if gcloud secrets describe "$k" --project "$PROJECT" >/dev/null 2>&1; then
      local cur; cur=$(gcloud secrets versions access latest --secret "$k" --project "$PROJECT" 2>/dev/null || true)
      if [ "$cur" != "$v" ]; then printf '%s' "$v" | gcloud secrets versions add "$k" --project "$PROJECT" --data-file=- >/dev/null; echo "   $k: updated"; else echo "   $k: unchanged"; fi
      gcloud secrets update "$k" --project "$PROJECT" --update-labels app=ko-projects >/dev/null 2>&1 || true
    else
      printf '%s' "$v" | gcloud secrets create "$k" --project "$PROJECT" --replication-policy automatic --labels app=ko-projects --data-file=- >/dev/null; echo "   $k: created"
    fi
    gcloud secrets add-iam-policy-binding "$k" --project "$PROJECT" --member "serviceAccount:$SA" --role roles/secretmanager.secretAccessor >/dev/null 2>&1
    n=$((n+1))
  done < "$f"
  echo "== envsync: $n secrets in Secret Manager (label app=ko-projects)"
}
envpush() {
  [ -f .env ] || { echo "no .env"; return 1; }
  gh secret set CLOUD_ENV --repo ko-developer/ko-porjects --body-file .env && echo "== .env uploaded to GitHub secret CLOUD_ENV — the next push to main puts it on the server (or run: gh workflow run deploy.yml)"
}
seed() {
  local tmp; tmp=$(mktemp -d)
  node scripts/store-export.js "$tmp"
  gcloud storage cp --no-clobber -r "$tmp"/* "gs://$BUCKET/projects/" 2>&1 | tail -1
  rm -rf "$tmp"
  echo "== projects seeded to gs://$BUCKET/projects/ (existing files kept)"
}
deploy() {
  local secrets="" ; for k in $(gcloud secrets list --project "$PROJECT" --filter "labels.app=ko-projects" --format "value(name)"); do secrets="$secrets,$k=$k:latest"; done
  secrets="${secrets#,}"
  echo "== deploying $SERVICE to $REGION (secrets: ${secrets:-none})"
  gcloud run deploy "$SERVICE" --project "$PROJECT" --region "$REGION" --source . \
    --allow-unauthenticated --execution-environment gen2 --min-instances 0 --max-instances 1 --concurrency 40 \
    --memory 1Gi --cpu 1 --timeout 300 --service-account "$SA" --no-cpu-throttling --cpu-boost \
    --clear-volumes --clear-volume-mounts --remove-env-vars DATA_DIR,STORE_JSON_DIR \
    --update-env-vars "DATA_BUCKET=$BUCKET,PREBUILT=1" \
    ${secrets:+--update-secrets "$secrets"} --quiet          # update-* ולא set-*: לא מוחק PUBLIC_URL וסודות קיימים
  local url; url=$(gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" --format 'value(status.url)')
  local cur; cur=$(gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" --format 'value(spec.template.spec.containers[0].env)' | tr ',' '\n' | grep -o "PUBLIC_URL[^}]*" || true)
  if [[ "$cur" != *"$url"* ]]; then gcloud run services update "$SERVICE" --project "$PROJECT" --region "$REGION" --update-env-vars "PUBLIC_URL=$url" --quiet >/dev/null; fi
  curl -s -o /dev/null "$url/login" || true           # הפעלה ראשונה יוצרת users.json עם מפתח הבעלים
  echo; echo "✅ URL: $url"
  if [ -z "${CI:-}" ]; then                            # קישור הבעלים לא מודפס ביומני CI
    sleep 2
    local key; key=$(gcloud storage cat "gs://$BUCKET/users.json" 2>/dev/null | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{console.log(JSON.parse(s).config.ownerKey)}catch{console.log('')}})")
    echo "🔑 owner link: $url/owner/$key"; echo "   (the owner link sets a cookie for a year — keep it private; external users get invite links from 🔗 שתף)"
  fi
}
owner() {
  local url; url=$(gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" --format 'value(status.url)')
  local key; key=$(gcloud storage cat "gs://$BUCKET/users.json" 2>/dev/null | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{console.log(JSON.parse(s).config.ownerKey)}catch{console.log('')}})")
  echo "✅ URL: $url"; echo "🔑 owner link: $url/owner/$key"
}
pull() {
  gcloud storage cp "gs://$BUCKET/rear_layouts.json" "gs://$BUCKET/rear_images.json" data/ 2>&1 | tail -1
  gcloud storage cp --no-clobber "gs://$BUCKET/rear_images/*" data/rear_images/ 2>&1 | tail -1
  gcloud storage cp "gs://$BUCKET/page_state/*" data/page_state/ 2>&1 | tail -1
  echo "== pulled cloud edits into data/ — review with git diff, then commit"
}
case "${1:-}" in
  setup) setup ;; seed) seed ;; deploy) deploy ;; pull) pull ;; owner) owner ;; envsync) envsync "${2:-.env}" ;; envpush) envpush ;;
  all) setup; seed; deploy ;;
  *) echo "usage: $0 setup|seed|deploy|pull|owner|envsync [file]|envpush|all"; exit 1 ;;
esac
