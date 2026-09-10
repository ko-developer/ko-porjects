#!/bin/bash
# כניסה לקונטיינר ב-Cloud Run: הדלי (Cloud Storage) מורכב ב-$DATA_DIR ומחזיק את כל מה שהשרת כותב.
# בהפעלה ראשונה הדלי נזרע מקבצי הריפו; מכאן והלאה גרסת הדלי גוברת (היא מה שנערך באפליקציה).
# קבצים חדשים בריפו (למשל תמונות גב שנוספו בקומיט) מועתקים לדלי אם עדיין אינם שם.
set -e
D="${DATA_DIR:-}"
if [ -n "$D" ]; then
  mkdir -p "$D/projects" "$D/bug_files" "$D/rear_images" "$D/page_state"
  for f in users.json bugs.json rear_images.json rear_layouts.json; do
    if [ ! -e "$D/$f" ] && [ -e "data/$f" ]; then cp "data/$f" "$D/$f"; fi
  done
  cp -n data/rear_images/* "$D/rear_images/" 2>/dev/null || true
  cp -n data/page_state/* "$D/page_state/" 2>/dev/null || true
  for p in users.json bugs.json rear_images.json rear_layouts.json bug_files rear_images page_state; do
    rm -rf "data/$p"; ln -s "$D/$p" "data/$p"
  done
  echo "data -> $D (bucket)"
fi
exec node scripts/dev-server.js
