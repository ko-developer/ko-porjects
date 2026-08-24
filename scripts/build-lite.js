// בונה קובץ יחיד עצמאי של KO Studio — dist/studio.html (לפריסה נפרדת ללקוחות)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { assembleLiteJs } from './assemble.js';

mkdirSync('dist', { recursive: true });
const tpl = readFileSync('src/lite.template.html', 'utf8');
const html = tpl.replace('/*__LITE__*/', () => assembleLiteJs());
writeFileSync('dist/studio.html', html);
console.log('build OK -> dist/studio.html (' + Math.round(html.length / 1024) + 'KB)');
