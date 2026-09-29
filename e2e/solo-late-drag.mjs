// Solo check for F47 / B006 — how a drag ends when the 3 s unlock timer fires.
//   A) drag held over the LOCKED zone when the timer fires → snaps back; a drag tried right after
//      the timer fired is refused; nothing is left parked in the rolling area.
//   B) drag held over the ROLLING zone when the timer fires → counts this turn (parked at a clear
//      spot, split into 2 pool dice).
// Run: npm run e2e:solo   (starts its own Vite on :5199 and stops it afterwards)
import { startServer, launchBrowser, store, holdToRoll, run, log, GAME_URL, VITE_PORT } from './lib.mjs';

const MAX_MS = 240_000;

run(async () => {
  await startServer('vite', `npx vite --port ${VITE_PORT} --strictPort`, VITE_PORT);
  const browser = await launchBrowser();
  const page = await (await browser.newContext({ viewport: { width: 1000, height: 560 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto(GAME_URL);
  await page.getByRole('button', { name: 'PLAY LOCAL' }).click();
  await page.waitForTimeout(2000);
  await store(page, `s.setState({ settings: { ...s.getState().settings, tipsEnabled: false } });`);

  let resultA = null; // snap-back + late drag refused
  let resultB = null; // in-progress drag over the rolling zone counts
  const deadline = Date.now() + MAX_MS;

  while (Date.now() < deadline && (!resultA || !resultB)) {
    const st = await store(page, `const g = s.getState(); return {
      phase: g.phase, key: g.unlockTimerResetKey, locked: g.players[0].lockedDice.length,
      anim: g.roundState.unlockAnimations.length + g.roundState.aiUnlockAnimations.length,
      lockAnim: g.roundState.lockAnimations.length + g.roundState.aiLockAnimations.length };`);

    if (st.phase === 'idle') { await holdToRoll(page); continue; }

    const readyToDrag = st.phase === 'unlocking' && st.key >= 0 && st.anim === 0 && st.lockAnim === 0 && st.locked > 0;
    if (readyToDrag && !resultA) {
      const r = await store(page, SCENARIO_A);
      if (!r.inconclusive) log('A:', JSON.stringify(r));
      if (r.inconclusive) await page.waitForTimeout(500); // e.g. empty pool this turn — retry later
      else resultA = r;
      continue;
    }
    if (readyToDrag && resultA && !resultB) {
      const r = await store(page, SCENARIO_B);
      if (!r.inconclusive) log('B:', JSON.stringify(r));
      if (r.inconclusive) await page.waitForTimeout(500); // e.g. empty pool this turn — retry later
      else resultB = r;
      continue;
    }
    await page.waitForTimeout(300);
  }
  await browser.close();

  const checks = [];
  const check = (name, pass) => { checks.push(pass); log(pass ? '  ok  ' : '  FAIL', name); };
  if (!resultA || !resultB) { log('never finished both scenarios', { resultA, resultB }); return false; }
  check('A: drag over the locked zone at timer end snaps back to its slot', resultA.snappedBack);
  check('A: a drag started after the timer fired is refused', !resultA.lateDragStarted && !resultA.lateCommitted && resultA.stillLocked);
  check('A: the late drop does not restart the timer (key stays -1)', resultA.keyAfterLate === -1);
  check('A: nothing left parked after the unlock phase', resultA.parkedAfter === 0);
  check('A: the die is still locked next phase', resultA.lockedAfter);
  check('B: drag over the rolling zone at timer end counts this turn', resultB.committedAtExpiry && !resultB.lockedAtExpiry);
  check('B: it landed clear of the other dice', resultB.clearance >= resultB.minClearance);
  check('B: it split into 2 pool dice (pool +2)', resultB.poolAfter === resultB.poolBefore + 2);
  check('B: nothing left parked after the unlock phase', resultB.parkedAfter === 0);
  check('no page errors', errors.length === 0);
  if (errors.length) log('page errors:', errors);
  return checks.every(Boolean);
});

// Runs in the page. Waits for the phase to leave 'unlocking', then reports leftovers.
const WAIT_FOR_PHASE_EXIT = `
  const waitExit = () => new Promise((res) => {
    const t0 = Date.now();
    const tick = () => (s.getState().phase !== 'unlocking' || Date.now() - t0 > 10000) ? res() : setTimeout(tick, 50);
    tick();
  });`;

const SCENARIO_A = `${WAIT_FOR_PHASE_EXIT}
  const g = s.getState();
  const d = g.players[0].lockedDice[0];
  // Timer already gone (we were too slow) → try again next turn
  if (g.phase !== 'unlocking' || g.unlockTimerResetKey < 0 || !d) return { inconclusive: true };
  // Empty pool = must-unlock: the game would auto-unlock a die itself, so this turn can't test snap-back
  if (g.players[0].poolSize === 0) return { inconclusive: true };
  const r = {};
  await new Promise((resolve) => {
    const unsub = s.subscribe((st, prev) => {
      if (!(prev.unlockTimerResetKey >= 0 && st.unlockTimerResetKey === -1)) return;
      unsub();
      r.snappedBack = st.players[0].lockedDice.some((l) => l.goalSlotIndex === d.goalSlotIndex);
      // Just after the timer handler finished (the B006 window): try a brand-new drag into the rolling area
      setTimeout(() => {
        const now = s.getState();
        if (now.phase !== 'unlocking') { r.inconclusive = true; resolve(); return; }
        now.startDragUnlock(d.goalSlotIndex, d.value, [-5, 0.3, -3.75]);
        r.lateDragStarted = s.getState().dragUnlockState.active;
        s.getState().updateDragPosition([5, 0.3, 0]);
        s.getState().completeDragUnlock();
        const after = s.getState();
        r.lateCommitted = after.committedUnlocks.some((c) => c.slotIndex === d.goalSlotIndex);
        r.stillLocked = after.players[0].lockedDice.some((l) => l.goalSlotIndex === d.goalSlotIndex);
        r.keyAfterLate = after.unlockTimerResetKey;
        resolve();
      }, 0);
    });
    // Drag in progress, held over the locked-dice zone (left side), never released
    g.startDragUnlock(d.goalSlotIndex, d.value, [-5, 0.3, -3.75]);
    if (!s.getState().dragUnlockState.active) { unsub(); r.inconclusive = true; resolve(); return; }
    s.getState().updateDragPosition([-5, 0.3, -3.75]);
    setTimeout(() => { unsub(); r.timeout = true; resolve(); }, 8000);
  });
  if (r.timeout) r.inconclusive = true;
  if (r.inconclusive) return r;
  await waitExit();
  const end = s.getState();
  r.parkedAfter = end.committedUnlocks.length;
  r.lockedAfter = end.players[0].lockedDice.some((l) => l.goalSlotIndex === d.goalSlotIndex);
  return r;`;

const SCENARIO_B = `${WAIT_FOR_PHASE_EXIT}
  const g = s.getState();
  const d = g.players[0].lockedDice[0];
  // Timer already gone (we were too slow) → try again next turn
  if (g.phase !== 'unlocking' || g.unlockTimerResetKey < 0 || !d) return { inconclusive: true };
  const r = { poolBefore: g.players[0].poolSize, minClearance: 0.589 };
  await new Promise((resolve) => {
    const unsub = s.subscribe((st, prev) => {
      if (!(prev.unlockTimerResetKey >= 0 && st.unlockTimerResetKey === -1)) return;
      unsub();
      const c = st.committedUnlocks.find((cu) => cu.slotIndex === d.goalSlotIndex);
      r.committedAtExpiry = !!c;
      r.lockedAtExpiry = st.players[0].lockedDice.some((l) => l.goalSlotIndex === d.goalSlotIndex);
      if (c) {
        const others = st.roundState.remainingDicePositions;
        r.clearance = others.length === 0 ? 99 : Math.min(...others.map((o) => Math.hypot(o[0] - c.position[0], o[2] - c.position[2])));
      }
      resolve();
    });
    // Drag in progress, held over the middle of the rolling area, never released
    g.startDragUnlock(d.goalSlotIndex, d.value, [-5, 0.3, -3.75]);
    if (!s.getState().dragUnlockState.active) { unsub(); r.inconclusive = true; resolve(); return; }
    s.getState().updateDragPosition([5, 0.3, 0]);
    setTimeout(() => { unsub(); r.timeout = true; resolve(); }, 8000);
  });
  await waitExit();
  const end = s.getState();
  r.poolAfter = end.players[0].poolSize;
  r.parkedAfter = end.committedUnlocks.length;
  return r;`;
