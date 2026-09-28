// Shared helpers for the e2e check scripts (see TDD §4 "E2E checks").
// Starts the local servers, opens headless Chrome (system Chrome, via playwright-core),
// and gives scripts a way to call the real Zustand store inside the page.
import { spawn, execSync } from 'node:child_process';
import net from 'node:net';
import { chromium } from 'playwright-core';

export const VITE_PORT = 5199;
// Own PartyKit port (not the usual 1999) so a normal `npm run party:dev` can keep running
export const PARTY_PORT = 2999;
export const GAME_URL = `http://localhost:${VITE_PORT}/`;

export const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const started = []; // child processes we must kill on exit

function portInUse(port) {
  return new Promise((resolve) => {
    const sock = net.connect({ port, host: '127.0.0.1' });
    sock.once('connect', () => { sock.destroy(); resolve(true); });
    sock.once('error', () => resolve(false));
  });
}

async function waitForPort(port, timeoutMs) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    if (await portInUse(port)) return;
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`port ${port} never opened`);
}

/** Start a dev server command and wait for its port. Refuses if the port is already taken. */
export async function startServer(name, command, port, env = {}) {
  if (await portInUse(port)) {
    throw new Error(`${name}: port ${port} is already in use — stop whatever is running there first`);
  }
  const child = spawn(command, { shell: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, ...env } });
  const out = [];
  child.stdout.on('data', (d) => out.push(String(d)));
  child.stderr.on('data', (d) => out.push(String(d)));
  started.push({ name, child, port });
  try {
    await waitForPort(port, 60000);
  } catch (e) {
    console.log(out.join('').slice(-2000));
    throw e;
  }
  log(`${name} up on :${port}`);
}

/** Kill every server this script started (whole process tree on Windows). */
export async function stopServers() {
  for (const { name, child } of started.splice(0)) {
    try {
      if (process.platform === 'win32') execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: 'ignore' });
      else process.kill(-child.pid, 'SIGKILL');
    } catch { /* already gone */ }
    log(`${name} stopped`);
  }
}

export async function launchBrowser() {
  return chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
}

/**
 * Run `src` (a function body) against the page's real store. `s` = useGameStore, `a` = arg.
 * Same actions PlayerRow's pointer handlers call, so drags go through the real game code.
 */
export function store(page, src, arg) {
  return page.evaluate(async ([body, a]) => {
    const url = performance.getEntriesByType('resource').map((e) => e.name)
      .find((n) => n.includes('/src/store/gameStore.ts')) || '/src/store/gameStore.ts';
    const { useGameStore } = await import(url);
    // eslint-disable-next-line no-new-func
    return await new Function('s', 'a', `return (async () => { ${body} })()`)(useGameStore, a);
  }, [src, arg]);
}

/** A real hold-to-gather roll on the rolling area (right side of the screen). */
export async function holdToRoll(page) {
  await page.mouse.move(760, 330);
  await page.mouse.down();
  await page.waitForTimeout(900);
  await page.mouse.up();
}

/** Wrap a check script: always stop servers, exit 0 on PASS / 1 on FAIL. */
export async function run(main) {
  let ok = false;
  try {
    ok = await main();
  } catch (e) {
    log('ERROR', e?.stack || e);
  } finally {
    await stopServers();
  }
  log(ok ? 'PASS' : 'FAIL');
  process.exit(ok ? 0 : 1);
}

process.on('SIGINT', async () => { await stopServers(); process.exit(130); });
