/**
 * `npm run extension`
 *
 * The extension is a THIN LAUNCHER — it loads the hosted dashboard URL, so
 * there is no build output to copy into it. This script simply validates the
 * configuration and reports what a new tab will open.
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cfg = readFileSync(join(root, 'extension/config.js'), 'utf8');

const dev = /DEVELOPMENT\s*=\s*(true|false)/.exec(cfg)?.[1];
const prodUrl = /PROD_URL\s*=\s*['"]([^'"]+)/.exec(cfg)?.[1];
const devUrl = /DEV_URL\s*=\s*['"]([^'"]+)/.exec(cfg)?.[1];
const iconsOk = ['48', '128', '256', '512'].every((s) =>
  existsSync(join(root, `extension/icons/icon-${s}.png`))
);

console.log('MyNewTab — thin launcher, no build copy required.\n');
console.log(`  Mode:   ${dev === 'true' ? 'DEVELOPMENT' : 'PRODUCTION'}`);
console.log(`  Target: ${dev === 'true' ? devUrl : prodUrl}`);
console.log(`  Icons:  ${iconsOk ? 'present' : 'MISSING — run `npm run icons`'}\n`);
console.log('Change the URL or toggle DEVELOPMENT in extension/config.js.');
