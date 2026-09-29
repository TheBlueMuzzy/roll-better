// B006 race sweep (F47) — drop a locked die at many moments around the instant the 3 s unlock timer
// fires, and check the rule every single time:
//   the die is either split in THIS turn's mitosis, or it is back in its slot.
//   Never parked-but-unsplit, never carried into the next unlock phase, never lost.
//
// Timing is done INSIDE the page so it is millisecond-exact: the unlock countdown's 100 ms tick is
// wrapped, so we know exactly which tick will end the turn and can drop the die
//   - at a time offset from that tick (-150 … +150 ms), or
//   - in the SAME task as that tick, just before / just after it runs (the tightest possible race).
// Pointer events are real DOM PointerEvents on the canvas, so they go through R3F's raycast,
// pointer capture and PlayerRow's handlers exactly like a mouse.
//
// Modes:
//   hold      — pick up early, hold over the rolling area, let go at <offset>
//   flick     — pointer down 60 ms before <offset>, drag across, let go at <offset>
//   lateDown  — pointer down at <offset>, let go 100 ms later
//   tickBefore / tickAfter — let go in the same task as the expiring tick, just before / after it
//   straddle  — pointer down + drag just before the expiring tick, let go just after it (same task)
//
// Run: node e2e/unlock-race-sweep.mjs [passes=2] [pages=3] [step=10]
//   (starts its own Vite on :5199 and stops it afterwards)
import { startServer, launchBrowser, store, holdToRoll, run, log, GAME_URL, VITE_PORT, playLocal } from './lib.mjs';

const PASSES = Number(process.argv[2] ?? 2);
const PAGES = Number(process.argv[3] ?? 3);
const STEP = Number(process.argv[4] ?? 10);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- page-side instrumentation: store changes (page timestamps) + a wrapped countdown tick ----
const INSTALL = `
  if (window.__rb) return true;
  const rb = window.__rb = { turns: [], cur: null, violations: [], drags: [], intervals: [], hooks: [] };
  // Synthetic pointers can't be captured by the browser; R3F keeps its own capture map, so just ignore it
  for (const fn of ['setPointerCapture', 'releasePointerCapture']) {
    const orig = Element.prototype[fn];
    Element.prototype[fn] = function (id) { try { return orig.call(this, id); } catch { /* synthetic pointer */ } };
  }
  // Wrap 100 ms intervals (the countdown tick) so a trial can act right before/after a given tick
  const origSetInterval = window.setInterval;
  window.setInterval = function (cb, ms, ...rest) {
    if (ms !== 100 || typeof cb !== 'function') return origSetInterval.call(window, cb, ms, ...rest);
    const rec = { createdAt: performance.now(), dateCreated: Date.now() };
    rb.intervals.push(rec);
    const wrapped = () => {
      const before = rb.hooks.splice(0).filter((h) => { if (h.when === 'before' && h.test(rec)) { h.fn(); return false; } return true; });
      rb.hooks.push(...before);
      cb();
      const after = rb.hooks.splice(0).filter((h) => { if (h.when === 'after' && h.test(rec)) { h.fn(); return false; } return true; });
      rb.hooks.push(...after);
    };
    return origSetInterval.call(window, wrapped, ms, ...rest);
  };
  s.subscribe((st, prev) => {
    const now = performance.now();
    if (prev.phase !== 'unlocking' && st.phase === 'unlocking') {
      if (st.committedUnlocks.length > 0) rb.violations.push({ kind: 'parked die carried into a new unlock phase', slots: st.committedUnlocks.map((c) => c.slotIndex) });
      rb.cur = { startAt: now, expiryAt: null, commits: [], anims: [], snapshotAt: null, forced: null };
    }
    const t = rb.cur;
    if (st.dragUnlockState.active && !prev.dragUnlockState.active) rb.drags.push({ at: now, slot: st.dragUnlockState.slotIndex });
    if (t && prev.unlockTimerResetKey >= 0 && st.unlockTimerResetKey === -1) t.expiryAt = now;
    if (st.committedUnlocks.length > prev.committedUnlocks.length) {
      for (const c of st.committedUnlocks.slice(prev.committedUnlocks.length)) {
        // must-unlock (empty pool): the game itself force-commits one die right after closing the turn
        const forced = prev.unlockTimerResetKey === -1 && prev.committedUnlocks.length === 0 && st.players[0].poolSize === 0 && t && t.snapshotAt === null;
        if (t) t.commits.push({ at: now, slot: c.slotIndex, keyBefore: prev.unlockTimerResetKey, forced });
        if (forced) t.forced = c.slotIndex;
        else if (prev.unlockTimerResetKey < 0 || st.phase !== 'unlocking') rb.violations.push({ kind: 'commit after the turn closed', slot: c.slotIndex, phase: st.phase });
        if (t && t.snapshotAt !== null) rb.violations.push({ kind: 'commit after the mitosis snapshot', slot: c.slotIndex });
      }
    }
    if (t && st.roundState.unlockAnimations !== prev.roundState.unlockAnimations && st.roundState.unlockAnimations.length > 0) {
      if (t.snapshotAt === null) t.snapshotAt = now;
      for (const a of st.roundState.unlockAnimations) if (!t.anims.includes(a.slotIndex)) t.anims.push(a.slotIndex);
    }
    if (prev.phase === 'unlocking' && st.phase !== 'unlocking') {
      if (prev.committedUnlocks.length > 0) rb.violations.push({ kind: 'parked die still there when the unlock phase ended', slots: prev.committedUnlocks.map((c) => c.slotIndex) });
      if (t) { t.exitAt = now; t.lockedAtExit = st.players[0].lockedDice.map((l) => l.goalSlotIndex); rb.turns.push(t); }
      rb.cur = null;
    }
  });
  return true;`;

// One trial, run inside the page. a = { mode, offset, slot, die: [x,y], roll: [x,y] } (canvas pixels)
const TRIAL = `
  const rb = window.__rb;
  const { mode, offset, die, roll } = a;
  const canvas = document.querySelector('canvas');
  const rect = canvas.getBoundingClientRect();
  const fire = (type, [x, y]) => canvas.dispatchEvent(new PointerEvent(type, {
    bubbles: true, cancelable: true, composed: true, pointerId: 1, pointerType: 'mouse', isPrimary: true,
    clientX: rect.left + x, clientY: rect.top + y, button: type === 'pointermove' ? -1 : 0, buttons: type === 'pointerup' ? 0 : 1,
  }));
  const log = { downAt: null, upAt: null };
  const down = () => { fire('pointermove', die); fire('pointerdown', die); log.downAt = performance.now(); };
  const drag = (n) => { for (let i = 1; i <= n; i++) fire('pointermove', [die[0] + (roll[0] - die[0]) * i / n, die[1] + (roll[1] - die[1]) * i / n]); };
  const up = () => { fire('pointerup', roll); log.upAt = performance.now(); };
  const rec = rb.intervals[rb.intervals.length - 1];
  if (!rec) return { inconclusive: 'no countdown interval' };
  // The tick that ends the turn: first tick with Date.now() − start ≥ 3000 (start ≈ interval creation)
  const willExpire = (r) => r === rec && Date.now() - rec.dateCreated >= 3000;
  const nearEnd = (ms) => (r) => r === rec && Date.now() - rec.dateCreated >= 3000 - ms;
  const hook = (when, test, fn) => rb.hooks.push({ when, test, fn });
  const at = (t, fn) => setTimeout(fn, Math.max(0, t - performance.now()));

  if (mode === 'hold') { down(); drag(8); }
  await new Promise((resolve) => {
    if (mode === 'tickBefore') { down(); drag(8); hook('before', willExpire, () => { up(); resolve(); }); return; }
    if (mode === 'tickAfter') { down(); drag(8); hook('after', willExpire, () => { up(); resolve(); }); return; }
    if (mode === 'straddle') { hook('before', willExpire, () => { down(); drag(3); }); hook('after', willExpire, () => { up(); resolve(); }); return; }
    // Offset modes: ~300 ms before the end, work out exactly when the ending tick will run
    hook('after', nearEnd(300), () => {
      const elapsed = Date.now() - rec.dateCreated;
      const ticksLeft = Math.ceil((3000 - elapsed) / 100);
      const T = performance.now() + ticksLeft * 100; // the expiring tick
      const upT = T + offset;
      if (mode === 'hold') at(upT, () => { up(); resolve(); });
      if (mode === 'flick') { at(upT - 60, () => { down(); drag(2); }); at(upT - 30, () => drag(4)); at(upT, () => { up(); resolve(); }); }
      if (mode === 'lateDown') { at(upT, () => { down(); drag(4); }); at(upT + 100, () => { up(); resolve(); }); }
    });
  });
  // Wait for the unlock phase to end, then report
  const t0 = Date.now();
  while (s.getState().phase === 'unlocking' && Date.now() - t0 < 12000) await new Promise((r) => setTimeout(r, 50));
  rb.hooks.length = 0;
  const turn = rb.turns[rb.turns.length - 1];
  const drag0 = rb.drags.filter((d) => d.slot === a.slot).pop();
  return { turn, ...log, dragAt: drag0 ? drag0.at : null, violations: rb.violations.splice(0) };`;

// World → canvas pixels, using the live R3F camera
const PROJECT = `
  const url = performance.getEntriesByType('resource').map((e) => e.name).find((n) => n.includes('@react-three_fiber.js'));
  const { _roots } = await import(url);
  const root = [..._roots.values()][0];
  const { camera, size } = root.store.getState();
  return a.map(([x, y, z]) => {
    const v = camera.position.clone().set(x, y, z).project(camera);
    return [Math.round((v.x + 1) / 2 * size.width), Math.round((1 - v.y) / 2 * size.height)];
  });`;

async function newGame(page) {
  await page.goto(GAME_URL);
  await playLocal(page);
  await page.waitForTimeout(2000);
  await store(page, `s.setState({ settings: { ...s.getState().settings, tipsEnabled: false }, sessionTargetScore: 99999 });`);
  await store(page, INSTALL);
}

async function worker(id, browser, jobs, results) {
  const page = await (await browser.newContext({ viewport: { width: 1000, height: 560 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await newGame(page);
  let lastProgress = Date.now();

  while (jobs.length) {
    const st = await store(page, `const g = s.getState(); return {
      screen: g.screen, phase: g.phase, key: g.unlockTimerResetKey, locked: g.players[0].lockedDice.map((l) => l.goalSlotIndex),
      cap: g.players[0].poolSize + g.players[0].lockedDice.length,
      anim: g.roundState.unlockAnimations.length + g.roundState.aiUnlockAnimations.length,
      lockAnim: g.roundState.lockAnimations.length + g.roundState.aiLockAnimations.length,
      bar: !!document.querySelector('.kit-pinned [role="progressbar"]'), intervals: window.__rb.intervals.length };`);
    if (st.phase === 'sessionEnd' || st.screen === 'winners') { await newGame(page); continue; }
    if (st.phase === 'idle') { await holdToRoll(page); lastProgress = Date.now(); continue; }
    const ready = st.phase === 'unlocking' && st.key === 0 && st.anim === 0 && st.lockAnim === 0 && st.locked.length > 0 && st.bar;
    if (!ready) {
      // Headless physics occasionally never settles a roll — start a fresh game rather than hang
      if (Date.now() - lastProgress > 30000) { log(`p${id} stuck, new game`, JSON.stringify(st)); await newGame(page); lastProgress = Date.now(); }
      await sleep(40); continue;
    }
    if (st.cap >= 12) { await sleep(300); continue; } // at the 12-dice cap nothing can be unlocked — skip turn

    const job = jobs.shift();
    const slot = st.locked[0];
    // The die's slot and a spot in the rolling area, from the game's own layout numbers
    const [slotX, rollX] = await page.evaluate(async (i) => [
      (await import('/src/components/GoalRow.tsx')).getSlotX(i),
      (await import('/src/components/RollingArea.tsx')).ROLLING_X_OFFSET,
    ], slot);
    const [dieXY, rollXY] = await store(page, PROJECT, [[slotX, 0.4, -3.75], [rollX, 0.4, 1.5]]);
    const r = await store(page, TRIAL, { ...job, slot, die: dieXY, roll: rollXY });
    lastProgress = Date.now();
    const t = r.turn;
    if (r.inconclusive || !t || t.expiryAt === null) { jobs.push(job); log(`p${id} inconclusive`, r.inconclusive || 'no expiry'); continue; }
    const commit = t.commits.find((c) => c.slot === slot && !c.forced);
    const committedEarly = !!commit && commit.keyBefore >= 0 && commit.at < t.expiryAt - 50; // in-time drop restarts the timer (a held drag the timer itself commits lands ~0 ms before)
    const res = {
      page: id, mode: job.mode, planned: job.offset, slot,
      // offsets vs the tick that ended the turn (for early commits the turn end moved 3 s later — reported as such)
      upOff: r.upAt === null ? null : +(r.upAt - t.expiryAt).toFixed(1),
      downOff: r.downAt === null ? null : +(r.downAt - t.expiryAt).toFixed(1),
      dragStarted: r.dragAt !== null && r.downAt !== null && r.dragAt >= r.downAt - 1,
      committed: !!commit, committedEarly, forced: t.forced === slot,
      split: t.anims.includes(slot), lockedAfter: t.lockedAtExit.includes(slot),
      violations: r.violations,
    };
    // THE RULE: split this turn XOR back in its slot; a commit always means split this turn
    res.ok = (res.split !== res.lockedAfter) && (!res.committed || res.split) && r.violations.length === 0;
    results.push(res);
    const what = res.committed ? (committedEarly ? 'early' : 'at-end') : res.forced ? 'forced' : 'no';
    log(`p${id} ${res.ok ? 'ok  ' : 'FAIL'} ${job.mode.padEnd(10)} planned ${String(job.offset ?? '').padStart(4)} → up ${String(res.upOff).padStart(7)} down ${String(res.downOff).padStart(7)} | drag ${res.dragStarted ? 'Y' : 'n'} commit ${what.padEnd(6)} split ${res.split ? 'Y' : 'n'} inSlot ${res.lockedAfter ? 'Y' : 'n'}${r.violations.length ? ' ' + JSON.stringify(r.violations) : ''}  (${jobs.length} left)`);
  }
  if (errors.length) log(`p${id} page errors:`, errors.slice(0, 5));
  return errors;
}

run(async () => {
  await startServer('vite', `npx vite --port ${VITE_PORT} --strictPort`, VITE_PORT);
  const browser = await launchBrowser();
  const jobs = [];
  for (let p = 0; p < PASSES; p++) {
    for (const mode of ['hold', 'flick', 'lateDown']) for (let o = -150; o <= 150; o += STEP) jobs.push({ mode, offset: o });
    for (const mode of ['tickBefore', 'tickAfter', 'straddle']) for (let i = 0; i < 3; i++) jobs.push({ mode, offset: null });
  }
  for (let i = jobs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [jobs[i], jobs[j]] = [jobs[j], jobs[i]]; }
  log(`${jobs.length} drops across ${PAGES} pages`);
  const results = [];
  const errs = await Promise.all(Array.from({ length: PAGES }, (_, i) => worker(i, browser, jobs, results)));
  await browser.close();

  const fails = results.filter((r) => !r.ok);
  log(`drops: ${results.length}, FAIL: ${fails.length}`);
  const buckets = {};
  for (const r of results) {
    const b = r.planned === null ? r.mode : `${r.mode}:${r.planned}`;
    buckets[b] = buckets[b] || { n: 0, fail: 0, split: 0, back: 0 };
    buckets[b].n++; if (!r.ok) buckets[b].fail++; if (r.split) buckets[b].split++; if (r.lockedAfter) buckets[b].back++;
  }
  for (const k of Object.keys(buckets).sort((x, y) => x.localeCompare(y, undefined, { numeric: true }))) log('  ', k.padEnd(16), JSON.stringify(buckets[k]));
  for (const f of fails) log('FAIL', JSON.stringify(f));
  const pageErrors = errs.flat();
  if (pageErrors.length) log('page errors:', pageErrors.slice(0, 5));
  return fails.length === 0 && pageErrors.length === 0 && results.length > 0;
});
