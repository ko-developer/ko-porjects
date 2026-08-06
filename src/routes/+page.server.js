// מגיש את חלקי ה-template הישן לעטיפת SvelteKit — מקור אחיד עם build הקובץ-הבודד
import { templateParts } from '../../scripts/assemble.js';

export function load() {
  return templateParts();
}
