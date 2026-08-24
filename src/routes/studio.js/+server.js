// מגיש את ה-JS של KO Studio (עם נתוני ה-ERP מוזרקים) — נפרד לגמרי מ-/app.js המקצועי
import { assembleLiteJs } from '../../../scripts/assemble.js';

export function GET() {
  return new Response(assembleLiteJs(), {
    headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'no-store' }
  });
}
