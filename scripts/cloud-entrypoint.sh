#!/bin/bash
# כניסה לקונטיינר ב-Cloud Run. הנתונים בדלי (DATA_BUCKET) דרך scripts/storage.js — אין הרכבת דיסק,
# אין קישורים סימבוליים: אותו קוד ואותם נתונים כמו בהרצה מקומית עם DATA_BUCKET ב-.env.
set -e
exec node scripts/dev-server.js
