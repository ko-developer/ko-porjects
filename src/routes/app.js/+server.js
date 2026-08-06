// /app.js — ה-JS המורכב של האפליקציה (קוד + נתוני ERP), כמו בקובץ הבודד
import { assembleAppJs } from '../../../scripts/assemble.js';

export function GET() {
  return new Response(assembleAppJs(), {
    headers: { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' }
  });
}
