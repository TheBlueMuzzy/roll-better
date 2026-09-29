// Roll physics check for B007 (dice escaping the rolling area / 10 s settle hang) and
// B008 (hold-to-gather missing dice).
// Plays a solo game and does many real hold-to-gather rolls with the mouse, cycling through
// different gestures (quick tap, normal hold, full charge, swirling, dragging off the rolling
// area, holding against a wall). Every frame it checks every die against the rolling area
// (src/utils/rollBounds.ts — the same walls the game builds).
//   PASS = no die ever out of bounds, the safety net never had to put a die back (B009), the
//          10 s settle timeout never fires, and every gather log line says all dice were pulled
//          into the spin.
// Run: npm run e2e:physics [rolls]   (default 50; starts its own Vite on :5199, stops it after)
import { startServer, launchBrowser, store, run, log, GAME_URL, VITE_PORT, playLocal } from './lib.mjs';

const ROLLS = Number(process.argv[2] || 50);
const ONLY = process.argv[3]; // optional: only this gesture (debugging)
const MAX_MS = ROLLS * 20_000;

// Screen spots (1000×560 viewport): the rolling area is the right half
const CENTRE = [760, 330];

const GESTURES = [
  { name: 'tap', hold: 150 },
  { name: 'hold', hold: 900 },
  { name: 'full-charge', hold: 2900 },
  { name: 'swirl', hold: 1800, swirl: true },
  { name: 'drag-off-area', hold: 1500, moveTo: [150, 300] },
  { name: 'drag-to-wall', hold: 2000, moveTo: [990, 540] },
];

if (ONLY && !GESTURES.some((g) => g.name === ONLY)) {
  console.log(`unknown gesture "${ONLY}" — use one of: ${GESTURES.map((g) => g.name).join(', ')}`);
  process.exit(1);
}

run(async () => {
  await startServer('vite', `npx vite --port ${VITE_PORT} --strictPort`, VITE_PORT);
  const browser = await launchBrowser();
  const page = await (await browser.newContext({ viewport: { width: 1000, height: 560 } })).newPage();
  const errors = [];
  const timeouts = [];
  const rescues = [];
  const gatherLines = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const recent = []; // last console lines, printed if a roll gets stuck
  page.on('console', (m) => {
    const t = m.text();
    recent.push(t.slice(0, 300)); if (recent.length > 40) recent.shift();
    if (t.includes('Absolute 10s settle timeout')) timeouts.push(t);
    if (t.includes('[PhysicsDie] out of bounds')) { rescues.push(t); log('   ', t); }
    if (t.startsWith('[Gather]')) { gatherLines.push(t); if (t.includes('MISSED') || process.env.VERBOSE) log('   ', t); }
  });

  async function startGame() {
    await page.goto(GAME_URL);
    await playLocal(page);
    await page.waitForTimeout(2000);
    await store(page, `s.setState({ settings: { ...s.getState().settings, tipsEnabled: false } });`);
    // Every frame: is any die out of bounds? (uses the game's own helper)
    await page.evaluate(async () => {
      const { isOutOfRollBounds } = await import('/src/utils/rollBounds.ts');
      const url = performance.getEntriesByType('resource').map((e) => e.name)
        .find((n) => n.includes('/src/store/gameStore.ts')) || '/src/store/gameStore.ts';
      const { useGameStore } = await import(url);
      const w = window;
      w.__rbEscapes = [];
      const tick = () => {
        const dice = w.__rbDice ? w.__rbDice() : [];
        dice.forEach((d, i) => {
          if (d.position && isOutOfRollBounds(d.position)) {
            const g = useGameStore.getState();
            w.__rbEscapes.push({ die: i, pos: d.position.map((v) => +v.toFixed(2)), speed: +d.speed.toFixed(1), phase: g.phase, gathering: g.gatherState.active, t: Date.now() });
          }
        });
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  async function doRoll(g) {
    await page.mouse.move(...CENTRE);
    await page.mouse.down();
    const t0 = Date.now();
    if (g.swirl) {
      let a = 0;
      while (Date.now() - t0 < g.hold) {
        a += 0.5;
        await page.mouse.move(CENTRE[0] + Math.cos(a) * 120, CENTRE[1] + Math.sin(a) * 120);
        await page.waitForTimeout(16);
      }
    } else if (g.moveTo) {
      await page.waitForTimeout(g.hold / 2);
      await page.mouse.move(...g.moveTo, { steps: 10 });
      await page.waitForTimeout(Math.max(0, g.hold / 2 - (Date.now() - t0)));
    } else {
      await page.waitForTimeout(g.hold);
    }
    await page.mouse.up();
  }

  await startGame();
  const deadline = Date.now() + MAX_MS;
  let rolls = 0;
  const rollLog = [];
  let idleSince = Date.now();

  while (Date.now() < deadline && rolls < ROLLS) {
    const st = await store(page, `const g = s.getState(); return { screen: g.screen, phase: g.phase, pool: g.players[0]?.poolSize ?? 0 };`);
    if (st.screen !== 'game' || st.phase === 'sessionEnd' || Date.now() - idleSince > 60_000) {
      log('new game (was', st.screen, st.phase + ')');
      const esc = await page.evaluate(() => window.__rbEscapes);
      if (esc.length) rollLog.push({ carried: esc });
      await startGame();
      idleSince = Date.now();
      continue;
    }
    if (st.phase === 'idle' && st.pool > 0) {
      const pool = ONLY ? GESTURES.filter((x) => x.name === ONLY) : GESTURES;
      const g = pool[rolls % pool.length];
      const before = await page.evaluate(() => window.__rbEscapes.length);
      await doRoll(g);
      // Wait for the roll to finish (leave rolling), max 12 s
      const t0 = Date.now();
      let phase = 'rolling';
      while (Date.now() - t0 < 12_000) {
        phase = await store(page, `return s.getState().phase;`);
        if (phase !== 'rolling' && phase !== 'gathering') break;
        await page.waitForTimeout(100);
      }
      const settleMs = Date.now() - t0;
      if (settleMs >= 12_000) {
        const dump = await store(page, `const g = s.getState(); return { phase: g.phase, gather: g.gatherState, pool: g.players[0].poolSize, dice: window.__rbDice ? window.__rbDice() : null };`);
        log(`  STUCK after 12 s (${g.name}):`, JSON.stringify(dump));
        recent.forEach((l) => log('     |', l));
      }
      const esc = await page.evaluate((n) => window.__rbEscapes.slice(n), before);
      rolls++;
      idleSince = Date.now();
      const line = `roll ${rolls} ${g.name} pool=${st.pool} settle=${settleMs}ms escapes=${esc.length}`;
      log(line + (esc.length ? ' first=' + JSON.stringify(esc[0]) : ''));
      rollLog.push({ roll: rolls, gesture: g.name, settleMs, escapes: esc.length, first: esc[0] });
      continue;
    }
    await page.waitForTimeout(300);
  }
  await browser.close();

  const escapedRolls = rollLog.filter((r) => r.escapes > 0);
  const checks = [];
  const check = (name, pass) => { checks.push(pass); log(pass ? '  ok  ' : '  FAIL', name); };
  log(`rolls: ${rolls}, rolls with a die out of bounds: ${escapedRolls.length}, 10 s timeouts: ${timeouts.length}, put-backs: ${rescues.length}`);
  const partial = gatherLines.filter((l) => l.includes('MISSED'));
  const judged = gatherLines.filter((l) => l.includes('release after'));
  const tooShort = gatherLines.filter((l) => l.includes('quick tap') || l.includes('before the first pull frame'));
  // A "quick tap" is judged by physics time, not the clock: in this headless browser a frame can
  // take 0.3–0.8 s, so a 150 ms tap can end before a single physics step has pulled anything.
  log(`gathers: ${gatherLines.length} (judged ${judged.length}, too short to judge ${tooShort.length}), with missed dice: ${partial.length}`);
  if (partial.length) partial.slice(0, 5).forEach((l) => log('   ', l));
  check(`did ${ROLLS} rolls`, rolls >= ROLLS);
  check('no die out of bounds (after put-back safety net)', escapedRolls.length === 0);
  // B009: the safety net is the last resort — it should never have to fire. (Dev build only:
  // the put-back line is logged in dev, which is what this script runs.)
  check('the out-of-bounds safety net never had to put a die back (B009)', rescues.length === 0);
  check('the 10 s settle timeout never fired', timeouts.length === 0);
  check('every gather held for 0.6 s+ of physics pull swept every die into the spin', judged.length > 0 && partial.length === 0);
  check('no page errors', errors.length === 0);
  if (errors.length) log('page errors:', errors.slice(0, 5));
  return checks.every(Boolean);
});
