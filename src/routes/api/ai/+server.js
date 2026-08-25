/* פרוקסי ל-Claude API — המפתח יושב ב-.env בשרת ולעולם לא מגיע לדפדפן.
   GET  → האם מוגדר (הלקוח בודק פעם אחת ומחליט אם לבקש מפתח אישי)
   POST → { messages, max_tokens, model? } מועבר כמות שהוא ל-/v1/messages */
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const MODEL = env.ANTHROPIC_MODEL || 'claude-sonnet-5';
const MAX_TOKENS = 8000;

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
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: p.model || MODEL,
        max_tokens: Math.min(Math.max(+p.max_tokens || 2000, 256), MAX_TOKENS),
        messages: p.messages
      })
    });
    const j = await r.json();
    if (!r.ok || j.error) {
      const msg = (j.error && j.error.message) || ('שגיאת API ' + r.status);
      return json({ error: msg }, { status: r.ok ? 502 : r.status });
    }
    return json(j);
  } catch (e) {
    return json({ error: 'הקריאה ל-Anthropic נכשלה: ' + String(e.message) }, { status: 502 });
  }
}
