/* פרוקסי ל-Claude API — המפתח יושב ב-.env בשרת ולעולם לא מגיע לדפדפן.
   GET  → האם מוגדר (הלקוח בודק פעם אחת ומחליט אם לבקש מפתח אישי)
   POST → { messages, max_tokens, model? } מועבר כמות שהוא ל-/v1/messages */
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const MODEL = env.ANTHROPIC_MODEL || 'claude-sonnet-5';
const MAX_TOKENS = 16000;        /* לתשובה עצמה */
const THINK_HEADROOM = 12000;   /* המודלים חושבים כברירת מחדל והחשיבה נספרת ב-max_tokens — בלי מרווח התשובה לא מגיעה (כמו ב-scripts/dev-server.js) */

export async function GET() {
  return json({ configured: !!env.ANTHROPIC_API_KEY, model: MODEL });
}

export async function POST({ request }) {
  const key = env.ANTHROPIC_API_KEY;
  if (!key) return json({ error: 'ANTHROPIC_API_KEY לא מוגדר ב-.env' }, { status: 503 });

  let p;
  try { p = await request.json(); } catch { return json({ error: 'גוף בקשה לא תקין' }, { status: 400 }); }
  if (!Array.isArray(p.messages) || !p.messages.length) return json({ error: 'חסרות הודעות' }, { status: 400 });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', ...(env.ANTHROPIC_WORKSPACE_ID ? { 'anthropic-workspace-id': env.ANTHROPIC_WORKSPACE_ID } : {}) },   /* מפתח ברמת משתמש דורש מזהה סביבת עבודה */
      body: JSON.stringify({
        model: p.model || MODEL,
        max_tokens: Math.min(Math.max(+p.max_tokens || 2000, 256), MAX_TOKENS) + THINK_HEADROOM,
        messages: p.messages,
        ...(['low', 'medium', 'high', 'xhigh', 'max'].includes(p.effort) ? { output_config: { effort: p.effort } } : {})
      })
    });
    const j = await r.json();
    if (!r.ok || j.error) {
      const msg = (j.error && j.error.message) || ('שגיאת API ' + r.status);
      return json({ error: msg }, { status: r.ok ? 502 : r.status });
    }
    if (j.stop_reason === 'refusal') return json({ error: 'ה-AI סירב לבקשה' }, { status: 502 });
    if (j.stop_reason === 'max_tokens' && !(j.content || []).some(b => b && b.type === 'text' && b.text)) return json({ error: 'תשובת ה-AI נקטעה לפני שהתחילה (נגמר מכסת הטוקנים על חשיבה) — נסה שוב' }, { status: 502 });
    return json(j);
  } catch (e) {
    return json({ error: 'הקריאה ל-Anthropic נכשלה: ' + String(e.message) }, { status: 502 });
  }
}
