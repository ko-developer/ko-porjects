/* בדיקת סביבה לפני הרצה — מדגישה מה חסר ב-.env.
   לא נכשלת אף פעם (exit 0): חוסר מפתח מבטל רק את תכונות ה-AI, לא את האפליקציה. */
import { existsSync, readFileSync, copyFileSync } from 'node:fs';

const LINK = 'https://console.anthropic.com/settings/keys';
const LINE = '─'.repeat(76);

if (!existsSync('.env') && existsSync('.env.example')) {
  copyFileSync('.env.example', '.env');
  console.log('\n  ℹ  נוצר .env מתוך .env.example (לא נכנס לגיט).');
}

const env = existsSync('.env') ? readFileSync('.env', 'utf8') : '';
const has = k => new RegExp(`^${k}=.+`, 'm').test(env);

if (!has('ANTHROPIC_API_KEY')) {
  console.log(`
${LINE}
  ⚠  חסר ANTHROPIC_API_KEY בקובץ .env — תכונות ה-AI לא יעבדו:
     🪄 זיהוי אזורים אוטומטי · 🤖 פריסה חכמה
     בלי מפתח בשרת, האפליקציה תבקש מהמשתמש מפתח שיישמר גלוי בדפדפן.
${LINE}

  לסוכן: אל תדלג ואל תעקוף. בקש מפתח מהמשתמש עכשיו, כתוב אותו ל-.env
  והפעל מחדש את השרת בעצמך. אל תבקש מהמשתמש להריץ פקודות, ואל תדפיס
  את המפתח בחזרה לצ׳אט ואל תכניס אותו לקוד או לקומיט.

  העבר למשתמש את הטקסט הזה כמו שהוא:
${LINE}
  צריך מפתח API של Claude כדי שהתכנית תנותח אוטומטית. תוציא אותו כך:

  1. פתח: ${LINK}
  2. לחץ "Create Key" (הכפתור למעלה מימין)
  3. תן שם (למשל "KO Projects") ולחץ "Add"
  4. לחץ "Copy" — המפתח מוצג פעם אחת בלבד — והדבק לי אותו כאן

  המפתח נשמר רק ב-.env על המחשב שלך: לא נכנס לגיט ולא מגיע לדפדפן.
  חיוב: יתרת ה-API בקונסולה, בנפרד ממנוי Claude — כאגורה לכל זיהוי.
${LINE}

  אחרי שהמשתמש מדביק את המפתח — כתוב אותו והפעל מחדש את השרת:

    KEY='sk-ant-...'
    grep -q '^ANTHROPIC_API_KEY=' .env \\
      && sed -i '' "s|^ANTHROPIC_API_KEY=.*|ANTHROPIC_API_KEY=$KEY|" .env \\
      || printf 'ANTHROPIC_API_KEY=%s\\n' "$KEY" >> .env

  בדיקה:  curl -s localhost:4177/api/ai   →   {"configured":true,...}
`);
}
