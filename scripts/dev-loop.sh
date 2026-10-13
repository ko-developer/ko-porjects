#!/bin/sh
# השרת המקומי בלולאה: אם הוא יוצא בגלל תקלה (למשל שומר-הסף זיהה שהוא תקוע) — עולה מחדש אחרי שנייה. יציאה נקייה (0) מסיימת.
cd "$(dirname "$0")/.." || exit 1
while :; do
  node scripts/dev-server.js
  c=$?
  [ "$c" -eq 0 ] && break
  echo "[restart] השרת יצא ($c) — מופעל מחדש"
  sleep 1
done
