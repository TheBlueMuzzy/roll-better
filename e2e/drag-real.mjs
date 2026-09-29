// F48 real-pointer drag check — drags locked dice with REAL pointer events on the canvas (the mouse
// Playwright drives, so pointer capture works like a finger), at three screen sizes:
// phone landscape 844×390, phone portrait 390×844, desktop 1280×720.
//   a  normal drag into the rolling area → counts
//   b  let go just inside the drop zone's edge → counts; just outside → snaps back
//   c  drag to the screen edge / off the page and let go → the drag ends, nothing stuck
//   d  finger lost (pointercancel) over the rolling area → counts at once; over the rows → snaps back
//   e  a second finger while dragging → ignored (first drag carries on, the other die stays put)
//   f  at the 12-dice cap, pressing a locked die → no drag, one "Max 12 dice" toast (even when spammed)
// Each case sets up the same unlock turn through the store, so the checks don't depend on dice luck.
// Run: npm run e2e:drag   (starts its own Vite on :5199 — run it alone). Exit 0 = PASS.
// Optional: node e2e/drag-real.mjs <folder> saves a screenshot per size there.
import { startServer, launchBrowser, store, holdToRoll, run, log, GAME_URL, VITE_PORT, playLocal, text } from './lib.mjs';

const SHOTS = process.argv[2] || null;
const ROW_Z = -3.75;        // the local player's row (Scene.tsx)
const OTHER_ROW_Z = -1.25;  // an AI row further down — "over the rows", not the rolling area
const SIZES = [[844, 390, 'phone landscape'], [390, 844, 'phone portrait'], [1280, 720, 'desktop']];
const CAP_TOAST = text.toasts.maxDice.replace('{max}', '12');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// World point → page pixel, from the live R3F camera (plus the canvas's letterbox offset on the page)
const PROJECT = `
  const url = performance.getEntriesByType('resource').map((e) => e.name).find((n) => n.includes('@react-three_fiber.js'));
  const { _roots } = await import(url);
  const { camera, size } = [..._roots.values()][0].store.getState();
  const r = document.querySelector('canvas').getBoundingClientRect();
  return a.map(([x, y, z]) => { const v = camera.position.clone().set(x, y, z).project(camera);
    return [r.left + (v.x + 1) / 2 * size.width, r.top + (1 - v.y) / 2 * size.height]; });`;

// A second finger / a lost finger: synthetic pointer events on the canvas (a mouse only has pointer 1)
function fire(page, type, [x, y], pointerId) {
  return page.evaluate(([type, x, y, pointerId]) => {
    document.querySelector('canvas').dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, composed: true, pointerId, pointerType: 'touch', isPrimary: pointerId === 1,
      clientX: x, clientY: y, button: type === 'pointermove' ? -1 : 0, buttons: type === 'pointerup' || type === 'pointercancel' ? 0 : 1,
    }));
  }, [type, x, y, pointerId]);
}

// The game's own layout numbers, read from the page so this script never goes stale
async function layout(page) {
  return page.evaluate(async () => {
    const row = await import('/src/components/GoalRow.tsx');
    const area = await import('/src/components/RollingArea.tsx');
    const zone = await import('/src/utils/dropZone.ts');
    const { drag } = await import('/src/tuning/drag.ts');
    return {
      slotX: Array.from({ length: 8 }, (_, i) => row.getSlotX(i)),
      rollX: area.ROLLING_X_OFFSET,
      zone: zone.rollingZoneBounds(),
      dragY: area.DIE_SIZE * drag.dragHeight, // the height a dragged die floats at
    };
  });
}

const setTuning = (page, values) => page.evaluate(async (v) => Object.assign((await import('/src/tuning/drag.ts')).drag, v), values);

/** Same unlock turn every case: the given dice locked in slots 0.., nothing dragged yet, turn open. */
async function resetTurn(page, lockedCount, poolSize) {
  await store(page, `const g = s.getState(); const p = { ...g.players[0] };
    p.lockedDice = Array.from({ length: a[0] }, (_, i) => ({ goalSlotIndex: i, value: (i % 6) + 1 }));
    p.poolSize = a[1];
    s.setState({ players: [p, ...g.players.slice(1)], committedUnlocks: [], unlockTimerResetKey: 0, hasSubmittedUnlock: false,
      dragUnlockState: { active: false, slotIndex: null, value: null, originPosition: null, currentPosition: null } });`, [lockedCount, poolSize]);
  await sleep(700); // a few frames so the dice are drawn (and hit-testable) back in their slots
}

const turnState = (page) => store(page, `const g = s.getState(); return {
  active: g.dragUnlockState.active, dragSlot: g.dragUnlockState.slotIndex, pos: g.dragUnlockState.currentPosition,
  locked: g.players[0].lockedDice.map((d) => d.goalSlotIndex).sort(), committed: g.committedUnlocks.map((c) => c.slotIndex) };`);

run(async () => {
  await startServer('vite', `npx vite --port ${VITE_PORT} --strictPort`, VITE_PORT);
  const browser = await launchBrowser();
  const page = await (await browser.newContext({ viewport: { width: 844, height: 390 } })).newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  await page.goto(GAME_URL);
  await playLocal(page);
  await page.waitForTimeout(2000);
  await store(page, `s.setState({ settings: { ...s.getState().settings, tipsEnabled: false }, sessionTargetScore: 99999 });`);

  // Play until a real unlock phase, then hold it open (the 3 s timer keeps restarting) for all the cases
  const deadline = Date.now() + 180_000;
  for (;;) {
    if (Date.now() > deadline) { log('never reached an unlock phase'); await browser.close(); return false; }
    const st = await store(page, `const g = s.getState(); return { phase: g.phase, key: g.unlockTimerResetKey,
      anim: g.roundState.unlockAnimations.length + g.roundState.lockAnimations.length + g.roundState.aiLockAnimations.length + g.roundState.aiUnlockAnimations.length };`);
    if (st.phase === 'idle') { await holdToRoll(page); continue; }
    if (st.phase === 'unlocking' && st.key >= 0 && st.anim === 0) break;
    await sleep(200);
  }
  await store(page, `window.__keepTurnOpen = setInterval(() => { const k = s.getState().unlockTimerResetKey;
    if (k >= 0) s.setState({ unlockTimerResetKey: k + 1 }); }, 300);`);
  log('unlock phase reached — running the cases');

  const results = []; // { size, name, ok, why }
  const check = (size, name, ok, why) => { results.push({ size, name, ok, why }); log(`${ok ? '  ok  ' : '  FAIL'} [${size}] ${name}${ok ? '' : ' — ' + why}`); };

  for (const [w, h, size] of SIZES) {
    await page.setViewportSize({ width: w, height: h });
    await sleep(1000);
    const L = await layout(page);
    const [[rollX, rollY]] = await store(page, PROJECT, [[L.rollX, L.dragY, 0]]); // middle of the rolling area, at drag height
    const dieAt = async (slot) => (await store(page, PROJECT, [[L.slotX[slot], 0.8, ROW_Z]]))[0]; // top face of a locked die
    const pickUp = async (slot) => { const [x, y] = await dieAt(slot); await page.mouse.move(x, y); await page.mouse.down(); };
    const pool = 2;

    // a — normal drag into the rolling area
    await resetTurn(page, 4, pool);
    await pickUp(0);
    const picked = (await turnState(page)).active;
    await page.mouse.move(rollX, rollY, { steps: 8 });
    await page.mouse.up();
    let t = await turnState(page);
    check(size, 'a  normal drag into the rolling area counts', picked && !t.active && t.committed.includes(0) && !t.locked.includes(0),
      picked ? `die 0 didn't count (committed ${JSON.stringify(t.committed)}, locked ${JSON.stringify(t.locked)})` : 'the die could not be picked up');
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/drag-real-${size.replace(' ', '-')}.png` });

    // b — edge of the drop zone (the left edge, next to the rows). Grab offset off, so the die's
    // position is exactly where the pointer ray meets the drag height.
    await setTuning(page, { keepGrabOffset: 0 });
    for (const [label, dx, expectCommit] of [['just inside', 0.3, true], ['just outside', -0.3, false]]) {
      await resetTurn(page, 4, pool);
      await pickUp(1);
      const [[ex, ey]] = await store(page, PROJECT, [[L.zone.minX + dx, L.dragY, 0]]);
      await page.mouse.move(ex, ey, { steps: 8 });
      const held = await turnState(page);
      await page.mouse.up();
      t = await turnState(page);
      const counted = t.committed.includes(1);
      check(size, `b  let go ${label} the drop zone edge → ${expectCommit ? 'counts' : 'snaps back'}`,
        held.active && !t.active && counted === expectCommit && t.locked.includes(1) !== expectCommit,
        `held at x=${held.pos?.[0]?.toFixed(2)} (edge ${L.zone.minX}), ${counted ? 'counted' : 'snapped back'}`);
    }
    await setTuning(page, { keepGrabOffset: 1 });

    // c — to the screen edge and beyond, then let go: the drag must end (counted or back, never stuck/lost)
    for (const [label, px, py] of [['the left screen edge', 1, h / 2], ['the bottom-right corner', w - 1, h - 1], ['off the page', w + 60, h / 2]]) {
      await resetTurn(page, 4, pool);
      await pickUp(2);
      await page.mouse.move(px, py, { steps: 10 });
      const held = (await turnState(page)).active;
      await page.mouse.up();
      t = await turnState(page);
      const resolved = held && !t.active && (t.committed.includes(2) !== t.locked.includes(2));
      check(size, `c  let go at ${label} → the drag ends`, resolved,
        held ? `drag still active: ${t.active}, committed ${JSON.stringify(t.committed)}, locked ${JSON.stringify(t.locked)}` : 'the die could not be picked up');
    }

    // d — finger lost mid-drag (the phone cancels the touch)
    for (const [label, target, expectCommit] of [['over the rolling area', [rollX, rollY], true], ['over the rows', null, false]]) {
      await resetTurn(page, 4, pool);
      await pickUp(0);
      const to = target ?? (await store(page, PROJECT, [[L.slotX[3], L.dragY, OTHER_ROW_Z]]))[0];
      await page.mouse.move(to[0], to[1], { steps: 8 });
      await fire(page, 'pointercancel', to, 1);
      await sleep(50);
      t = await turnState(page);
      await page.mouse.up(); // the "real" release that may follow must change nothing
      const after = await turnState(page);
      check(size, `d  finger lost ${label} → ${expectCommit ? 'counts at once' : 'snaps back'}`,
        !t.active && t.committed.includes(0) === expectCommit && JSON.stringify(after.committed) === JSON.stringify(t.committed),
        `drag active after the cancel: ${t.active}, committed ${JSON.stringify(t.committed)}`);
    }

    // e — second finger while dragging: grabs another die, drags it into the rolling area, lets go
    await resetTurn(page, 4, pool);
    await pickUp(0);
    await page.mouse.move(rollX, rollY, { steps: 6 });
    const second = await dieAt(1);
    await fire(page, 'pointerdown', second, 2);
    for (let i = 1; i <= 6; i++) await fire(page, 'pointermove', [second[0] + (rollX - second[0]) * i / 6, second[1] + (rollY + 30 - second[1]) * i / 6], 2);
    const during = await turnState(page);
    await fire(page, 'pointerup', [rollX, rollY + 30], 2);
    const afterSecond = await turnState(page);
    await page.mouse.up();
    t = await turnState(page);
    check(size, 'e  a second finger is ignored while dragging', during.active && during.dragSlot === 0 && afterSecond.active
      && t.committed.length === 1 && t.committed[0] === 0 && t.locked.includes(1),
      `while held: dragging die ${during.dragSlot}, after 2nd finger let go still dragging: ${afterSecond.active}; end: committed ${JSON.stringify(t.committed)}, locked ${JSON.stringify(t.locked)}`);

    // f — 12-dice cap: 4 locked + 8 in the pool = 12
    await resetTurn(page, 4, 8);
    await sleep(500);
    const [cx, cy] = await dieAt(0);
    await page.mouse.click(cx, cy);
    await sleep(200);
    const capDrag = (await turnState(page)).active;
    const toast = page.locator('.kit-toast', { hasText: CAP_TOAST });
    const shown = await toast.count();
    for (let i = 0; i < 4; i++) await page.mouse.click(cx, cy); // spam
    await sleep(200);
    const afterSpam = await toast.count();
    t = await turnState(page);
    check(size, 'f  at the 12-dice cap: no drag, one "Max 12 dice" toast', !capDrag && !t.active && shown === 1 && afterSpam === 1 && t.locked.length === 4,
      `drag started: ${capDrag}, toasts shown ${shown} then ${afterSpam} after spamming`);
    await sleep(3200); // let the toast go before the next size
  }

  await browser.close();
  const fails = results.filter((r) => !r.ok);
  if (pageErrors.length) log('page errors:', pageErrors.slice(0, 5));
  log(`${results.length - fails.length}/${results.length} checks passed across ${SIZES.length} screen sizes`);
  for (const f of fails) log(`FAILED [${f.size}] ${f.name}: ${f.why}`);
  return fails.length === 0 && pageErrors.length === 0;
});
