# KO Projects — שרת הלגאסי (scripts/dev-server.js) כקונטיינר ל-Cloud Run.
# Node 24: נדרש ל-node:sqlite (מקומית) ול-ESM. הבנייה של dist נעשית פעם אחת כאן (PREBUILT=1).
FROM node:24-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY . .
RUN node scripts/build.js && node scripts/build-lite.js
ENV NODE_ENV=production PREBUILT=1 PORT=8080
EXPOSE 8080
CMD ["bash", "scripts/cloud-entrypoint.sh"]
