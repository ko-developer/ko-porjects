#!/bin/bash
# Persist the repo to the user's machine: bundle (full history) + source snapshot + built app.
set -e
OUT=/sessions/adoring-blissful-hamilton/mnt/outputs
cd ~/ko-projects
git bundle create /tmp/ko.bundle --all 2>/dev/null
cat /tmp/ko.bundle > "$OUT/ko-projects.bundle"
mkdir -p "$OUT/ko-projects-src"
for f in $(git ls-files); do mkdir -p "$OUT/ko-projects-src/$(dirname $f)"; cat "$f" > "$OUT/ko-projects-src/$f"; done
node scripts/build.js -q >/dev/null 2>&1 || node scripts/build.js
cat dist/index.html > "$OUT/ko-flow.html"
cat dist/index.html > "$OUT/install-planner.html"
mkdir -p /tmp/koz && cp dist/index.html /tmp/koz/index.html && (cd /tmp/koz && rm -f ko.zip && zip -q ko.zip index.html) && cat /tmp/koz/ko.zip > "$OUT/ko-flow.zip"
echo "exported: bundle + src snapshot + ko-flow.html/zip"
