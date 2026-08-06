// Syntax-checks the assembled app before any build is considered good.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let app = readFileSync('src/app.js', 'utf8');
for (const name of ['ERP_ITEMS', 'ERP_PRICES', 'ERP_KITS', 'ERP_CATALOG']) {
  const json = readFileSync(`data/${name.toLowerCase()}.json`, 'utf8');
  app = app.replace(`/*__DATA:${name}__*/`, `const ${name} = ${json};`);
}
const tmp = join(tmpdir(), 'ko-validate.js');
writeFileSync(tmp, app);
execFileSync(process.execPath, ['--check', tmp], { stdio: 'inherit' });
JSON.parse(readFileSync('data/erp_items.json', 'utf8'));
console.log('validate OK — JS syntax + data JSON');
