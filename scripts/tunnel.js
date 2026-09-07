// מנהרה זמנית לשרת המקומי (cloudflared quick tunnel) — כתובת https ציבורית בלי חשבון,
// והגדרתה אוטומטית ככתובת החיצונית של השרת (קישורי השיתוף ייבנו ממנה).
// הרצה: npm run tunnel   (השרת חייב לרוץ על 4177; הכתובת מתחלפת בכל הרצה)
// דורש cloudflared: brew install cloudflared, או הורדה מ-github.com/cloudflare/cloudflared/releases
import { spawn } from 'node:child_process';
const PORT = process.env.PORT || 4177;
const bin = process.env.CLOUDFLARED || 'cloudflared';
const p = spawn(bin, ['tunnel', '--url', `http://localhost:${PORT}`], { stdio: ['ignore', 'pipe', 'pipe'] });
let set = false;
const onLine = async chunk => {
  const s = chunk.toString();
  process.stderr.write(s);
  const m = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i.exec(s);
  if (m && !set) {
    set = true;
    try {
      const r = await fetch(`http://localhost:${PORT}/api/admin/config`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ publicUrl: m[0] }) });
      const j = await r.json();
      console.log(`\n✅ כתובת חיצונית: ${m[0]}\n   קישורי שיתוף ייבנו ממנה. הקישור שלך לגישה מבחוץ: ${j.ownerLink}\n`);
    } catch (e) { console.log(`\n✅ כתובת חיצונית: ${m[0]} (לא הצלחתי להגדיר אוטומטית — הדבק ב-/admin): ${e.message}\n`); }
  }
};
p.stdout.on('data', onLine); p.stderr.on('data', onLine);
p.on('error', e => { console.error(`❌ cloudflared לא נמצא (${e.message}). התקן: brew install cloudflared, או הורד מ-https://github.com/cloudflare/cloudflared/releases והצב ב-PATH / CLOUDFLARED=/path/to/cloudflared`); process.exit(1); });
p.on('exit', c => { console.log('המנהרה נסגרה (' + c + ') — הכתובת החיצונית כבר לא פעילה; הרץ שוב npm run tunnel'); });
