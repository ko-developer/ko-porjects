// בעלים בלבד בראוטי SvelteKit. אין כאן משתמשים — כמו בשרת הלגאסי (scripts/auth.js isLocal): בקשה מהמחשב עצמו = הבעלים
import { json } from '@sveltejs/kit';

export function isOwner(request, getClientAddress) {
  if (request.headers.get('x-forwarded-for')) return false;
  const a = String(getClientAddress() || '');
  return a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1';
}
export const ownerOnly = () => json({ ok: false, errors: ['owner only'] }, { status: 403 });
