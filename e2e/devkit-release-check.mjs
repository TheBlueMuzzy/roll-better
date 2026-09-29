// Dev Kit in release builds — the two-way check (F60). Run: npm run check:devkit   (/deliver runs it)
//
// content/devkit.json "inReleaseBuilds" decides whether the live build has the Dev Kit. This builds the
// game BOTH ways (with the DEVKIT_IN_RELEASE override — content/devkit.json itself is never touched),
// serves each build with `vite preview` on its own port, and checks in a headless browser:
//   false → dist/ has NO Dev Kit code, and ` does nothing
//   true  → dist/ has the Dev Kit, ` opens it, Save is replaced by Copy for Claude + the live-build note,
//           and the dev server's save endpoint doesn't exist (404)
// Both ways: the save endpoint is never in a build. The build matching content/devkit.json runs last,
// so dist/ is left as the real release build.
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { launchBrowser, log, startServer, stopServers } from './lib.mjs';

const ROOT = new URL('../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const DIST = join(ROOT, 'dist');
const PORT = 5198; // its own port — never Muzzy's :5173 or the other e2e checks' :5199
const GAME_URL = `http://localhost:${PORT}/roll-better/`;
const DEVKIT_WORDS = ['bmuz-devkit', 'mountDevKit']; // DevKit.tsx DEVKIT_MARKER + mount.tsx
const PRODUCTION = { NODE_ENV: 'production' }; // same as the GitHub build → base /roll-better/

const fromFile = JSON.parse(readFileSync(join(ROOT, 'content/devkit.json'), 'utf8')).inReleaseBuilds === true;
const failures = [];
const check = (ok, what) => {
  log(`${ok ? 'ok  ' : 'FAIL'} ${what}`);
  if (!ok) failures.push(what);
};

/** Every built text file's contents, keyed by path. */
function builtFiles() {
  const files = {};
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(js|css|html|json|webmanifest)$/.test(name)) files[p] = readFileSync(p, 'utf8');
    }
  };
  walk(DIST);
  return files;
}

async function checkBuild(devkitOn) {
  log(`--- build with inReleaseBuilds = ${devkitOn} ---`);
  execSync('npx vite build', { cwd: ROOT, stdio: 'ignore', env: { ...process.env, ...PRODUCTION, DEVKIT_IN_RELEASE: String(devkitOn) } });

  // 1. What's in dist/
  const files = builtFiles();
  const all = Object.values(files).join('\n');
  check(Object.keys(files).length > 0, 'dist/ has files');
  const found = DEVKIT_WORDS.filter((w) => all.includes(w));
  if (devkitOn) check(found.length === DEVKIT_WORDS.length, `Dev Kit code IS in dist/ (${found.join(', ')})`);
  else check(found.length === 0 && !all.includes('__devkit'), `NO Dev Kit code in dist/${found.length ? ' — found: ' + found.join(', ') : ''}`);

  // 2. The built game in a browser
  await startServer('vite preview', `npx vite preview --port ${PORT} --strictPort`, PORT, PRODUCTION);
  const browser = await launchBrowser();
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: `http://localhost:${PORT}` });
    const page = await context.newPage();
    const devkitFiles = [];
    page.on('request', (r) => { if (/\/mount-[^/]*\.js/.test(r.url())) devkitFiles.push(r.url()); });
    await page.goto(GAME_URL, { waitUntil: 'load' });
    await page.waitForTimeout(3000); // let the game (and the Dev Kit, if it's there) start
    await page.keyboard.press('Backquote');
    await page.waitForTimeout(500);
    const panel = page.locator('aside.devkit');

    if (devkitOn) {
      check(await panel.isVisible(), '` opens the Dev Kit');
      check(await page.locator('.devkit-live-note').isVisible(), 'panel shows the live-build note');
      check(await panel.getByRole('button', { name: 'Save', exact: true }).count() === 0, 'no Save button (release builds cannot write files)');
      const copy = panel.getByRole('button', { name: 'Copy for Claude' });
      check(await copy.isVisible(), 'Copy for Claude is there instead');
      await copy.click();
      await page.waitForTimeout(300);
      const status = await panel.locator('.devkit-status').textContent().catch(() => '');
      check(/Copied|blocked copying/.test(status ?? ''), `Copy for Claude answers ("${status}")`);
    } else {
      check(await panel.count() === 0, '` does nothing (no Dev Kit panel)');
      check(devkitFiles.length === 0, 'no Dev Kit file was loaded');
    }

    // The Save endpoint only lives in the dev server — never in a build
    const saveStatus = await page.evaluate(async () => {
      const res = await fetch('/roll-better/__devkit/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"path":"content/devkit.json","data":{}}' });
      return res.status;
    });
    check(saveStatus === 404, `save endpoint doesn't exist (POST → ${saveStatus})`);
    await context.close();
  } finally {
    await browser.close();
    await stopServers();
  }
}

try {
  await checkBuild(!fromFile); // the other setting first…
  await checkBuild(fromFile); // …then content/devkit.json's own, so dist/ ends up as the real release build
} catch (e) {
  failures.push(String(e));
  await stopServers();
}
console.log(failures.length ? `FAIL — ${failures.length} problem(s):\n- ${failures.join('\n- ')}` : `PASS — Dev Kit release check, both ways (content/devkit.json: inReleaseBuilds = ${fromFile})`);
process.exit(failures.length ? 1 : 0);
