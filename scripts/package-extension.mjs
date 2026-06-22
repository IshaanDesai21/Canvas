/**
 * `npm run package`
 *
 * Zips the extension/ folder into dist/ ready for Safari, and prints the
 * `safari-web-extension-converter` command that turns it into an Xcode project.
 */
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const zip = join(dist, 'mynewtab-extension.zip');

mkdirSync(dist, { recursive: true });
rmSync(zip, { force: true });

// Bundle the extension, excluding the icon generator and dotfiles.
execSync(`cd "${join(root, 'extension')}" && zip -r "${zip}" . -x "icons/_generate.mjs" ".*"`, {
  stdio: 'inherit'
});

console.log(`\nPackaged → ${zip}\n`);
console.log('Convert to a Safari app extension (macOS, requires Xcode tools):');
console.log(
  '  xcrun safari-web-extension-converter extension \\\n' +
    '    --app-name "MyNewTab" --bundle-identifier com.ftcblueprint.mynewtab --no-prompt'
);
