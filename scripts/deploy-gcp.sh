#!/bin/bash
# ===================================================================================
# פריסת KO Projects ל-Cloud Run (פרויקט GCP scripts-298706, אזור me-west1 = תל אביב).
#   scripts/deploy-gcp.sh setup    — דלי לנתונים, הרשאות, סודות מ-.env (פעם אחת)
#   scripts/deploy-gcp.sh seed     — זריעת הפרויקטים מה-SQLite המקומי לדלי (בלי לדרוס קיימים)
#   scripts/deploy-gcp.sh deploy   — בנייה בענן מהקוד ופריסה; מדפיס כתובת + קישור בעלים
#   scripts/deploy-gcp.sh pull     — משיכת מה שנערך בענן (פריסות גב, תמונות, מצב הטבלאות) חזרה לריפו
#   scripts/deploy-gcp.sh owner    — מדפיס את קישור הבעלים (מהדלי)
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
  echo "== secrets (from .env, only the ones that are set)"
  for k in ANTHROPIC_API_KEY ERP_MCP_URL ERP_MCP_TOKEN; do
    v=$(envval "$k"); [ -z "$v" ] && { echo "   $k: not in .env — skipped"; continue; }
    if gcloud secrets describe "$k" --project "$PROJECT" >/dev/null 2>&1; then printf '%s' "$v" | gcloud secrets versions add "$k" --project "$PROJECT" --data-file=- >/dev/null
    else printf '%s' "$v" | gcloud secrets create "$k" --project "$PROJECT" --replication-policy automatic --data-file=- >/dev/null; fi
    gcloud secrets add-iam-policy-binding "$k" --project "$PROJECT" --member "serviceAccount:$SA" --role roles/secretmanager.secretAccessor >/dev/null
    echo "   $k: ok"
  done
}
seed() {
  local tmp; tmp=$(mktemp -d)
  node scripts/store-export.js "$tmp"
  gcloud storage cp --no-clobber -r "$tmp"/* "gs://$BUCKET/projects/" 2>&1 | tail -1
  rm -rf "$tmp"
  echo "== projects seeded to gs://$BUCKET/projects/ (existing files kept)"
}
deploy() {
  local secrets="" ; for k in ANTHROPIC_API_KEY ERP_MCP_URL ERP_MCP_TOKEN; do gcloud secrets describe "$k" --project "$PROJECT" >/dev/null 2>&1 && secrets="$secrets,$k=$k:latest"; done
  secrets="${secrets#,}"
  echo "== deploying $SERVICE to $REGION (secrets: ${secrets:-none})"
  gcloud run deploy "$SERVICE" --project "$PROJECT" --region "$REGION" --source . \
    --allow-unauthenticated --execution-environment gen2 --min-instances 0 --max-instances 1 --concurrency 40 \
    --memory 1Gi --cpu 1 --timeout 300 --service-account "$SA" \
    --add-volume "name=data,type=cloud-storage,bucket=$BUCKET" --add-volume-mount "volume=data,mount-path=/mnt/data" \
    --set-env-vars "DATA_DIR=/mnt/data,STORE_JSON_DIR=/mnt/data/projects,PREBUILT=1" \
    ${secrets:+--set-secrets "$secrets"} --quiet
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
  setup) setup ;; seed) seed ;; deploy) deploy ;; pull) pull ;; owner) owner ;;
  all) setup; seed; deploy ;;
  *) echo "usage: $0 setup|seed|deploy|pull|owner|all"; exit 1 ;;
esac
