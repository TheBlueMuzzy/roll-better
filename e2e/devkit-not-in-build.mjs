// Live-build check for the Dev Kit (F60): after `npm run build`, dist/ must contain no Dev Kit code.
// Looks for the Dev Kit's marker string (src/devkit/DevKit.tsx DEVKIT_MARKER) and its save URL.
// Run: npm run build && npm run check:devkit      (/deliver runs this before releasing)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const FORBIDDEN = ['bmuz-devkit', '__devkit', 'mountDevKit'];

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(js|css|html|json|webmanifest)$/.test(name)) files.push(p);
  }
};
walk(DIST);

const hits = [];
for (const f of files) {
  const text = readFileSync(f, 'utf8');
  for (const word of FORBIDDEN) if (text.includes(word)) hits.push(`${f}: "${word}"`);
}
if (files.length === 0) { console.log('FAIL — dist/ is empty; run npm run build first'); process.exit(1); }
if (hits.length) { console.log('FAIL — Dev Kit code found in the live build:\n' + hits.join('\n')); process.exit(1); }
console.log(`PASS — no Dev Kit code in ${files.length} built files`);
