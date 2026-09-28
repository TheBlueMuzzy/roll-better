// Online check for F47 (+ B003 guard) — two players in one room on a local PartyKit server.
// P1 holds a drag over the rolling area until their own 3 s timer ends the turn. Checks:
//   - the held die counts: P1 sends ONE unlock_request with it (not flagged AFK) + unlock_activity (D16)
//   - after the turn closed, P1 can't start a new drag
//   - P2 hears P1's unlock (unlock_result), and once both are back to idle, P2's view of P1's dice
//     matches P1's own (server and phone agree); nothing left parked on P1
// Run: npm run e2e:online   (starts its own PartyKit :2999 + Vite :5199 and stops them afterwards)
import { startServer, launchBrowser, store, holdToRoll, run, log, GAME_URL, VITE_PORT, PARTY_PORT } from './lib.mjs';

const MAX_MS = 240_000;

run(async () => {
  await startServer('partykit', `npx partykit dev --port ${PARTY_PORT}`, PARTY_PORT);
  await startServer('vite', `npx vite --port ${VITE_PORT} --strictPort`, VITE_PORT, { VITE_PARTY_HOST: `localhost:${PARTY_PORT}` });

  const browser = await launchBrowser();
  const p1 = await (await browser.newContext({ viewport: { width: 1000, height: 560 } })).newPage();
  const p2 = await (await browser.newContext({ viewport: { width: 1000, height: 560 } })).newPage();

  const errors = [];
  const p2Logs = [];
  const p1Sent = [];
  for (const [name, p] of [['P1', p1], ['P2', p2]]) p.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
  p2.on('console', (m) => p2Logs.push({ t: Date.now(), text: m.text() }));
  p1.on('websocket', (ws) => ws.on('framesent', (f) => {
    try { p1Sent.push({ t: Date.now(), m: JSON.parse(f.payload) }); } catch { /* not JSON */ }
  }));

  // --- Create + join a room ---
  await p1.goto(GAME_URL);
  await p2.goto(GAME_URL);
  await p1.getByRole('button', { name: 'CREATE' }).click();
  const codeEl = p1.locator('.menu-room-code');
  await codeEl.waitFor({ timeout: 15000 });
  const code = (await codeEl.innerText()).slice(0, 4);
  log('room code', code);
  await p2.getByRole('button', { name: 'JOIN' }).click();
  const inputs = p2.locator('.menu-code-char');
  for (let i = 0; i < 4; i++) await inputs.nth(i).fill(code[i]);
  await p2.locator('.menu-online-row button', { hasText: 'START' }).click();
  await p1.waitForTimeout(1500);
  await p1.locator('.menu-online-row button', { hasText: 'START' }).click();
  log('game started');
  await p1.waitForTimeout(4000);
  for (const p of [p1, p2]) await store(p, `s.setState({ settings: { ...s.getState().settings, tipsEnabled: false } });`);

  // --- Play until P1 can drag, then hold a drag over the rolling area until the timer fires ---
  let dragged = null;
  const deadline = Date.now() + MAX_MS;
  while (Date.now() < deadline && !dragged) {
    const st = await store(p1, `const g = s.getState(); return { phase: g.phase, key: g.unlockTimerResetKey,
      locked: g.players[0]?.lockedDice, pool: g.players[0]?.poolSize, sub: g.hasSubmittedUnlock, ids: g.onlinePlayerIds,
      anim: g.roundState.unlockAnimations.length + g.roundState.aiUnlockAnimations.length + g.roundState.lockAnimations.length + g.roundState.aiLockAnimations.length }`);
    if (st.phase === 'unlocking' && st.key >= 0 && !st.sub && st.anim === 0 && st.locked?.length > 0) {
      const d = st.locked[0];
      const at = Date.now();
      const r = await store(p1, `
        const g = s.getState();
        g.startDragUnlock(a.slot, a.value, [-5, 0.3, -3.75]);
        if (!s.getState().dragUnlockState.active) return { inconclusive: true };
        s.getState().updateDragPosition([5, 0.3, 0]); // held over the rolling area, never released
        const t0 = Date.now();
        while (!s.getState().hasSubmittedUnlock && Date.now() - t0 < 6000) await new Promise((r) => setTimeout(r, 25));
        const after = s.getState();
        const r = { submitted: after.hasSubmittedUnlock, key: after.unlockTimerResetKey };
        // Turn is closed now — a new drag must be refused
        const other = after.players[0].lockedDice[0];
        if (other) {
          after.startDragUnlock(other.goalSlotIndex, other.value, [-5, 0.3, -3.75]);
          r.lateDragStarted = s.getState().dragUnlockState.active;
          s.getState().cancelDragUnlock();
        } else {
          r.lateDragStarted = false;
        }
        return r;`, { slot: d.goalSlotIndex, value: d.value });
      if (r.inconclusive) continue;
      dragged = { slot: d.goalSlotIndex, at, p1Id: st.ids[0], ...r };
      log('P1 held a drag on slot', d.goalSlotIndex, JSON.stringify(r));
      break;
    }
    for (const p of [p1, p2]) {
      if ((await store(p, `return s.getState().phase`)) === 'idle') await holdToRoll(p);
    }
    await p1.waitForTimeout(300);
  }
  if (!dragged) { log('never reached an unlock turn with locked dice'); await browser.close(); return false; }

  // --- Wait for P2 to hear it and for both to leave the unlock phase ---
  const until = Date.now() + 15000;
  let p1End = null;
  let p2ViewOfP1 = null;
  while (Date.now() < until) {
    const [ph1, ph2] = [await store(p1, `return s.getState().phase`), await store(p2, `return s.getState().phase`)];
    if (ph1 !== 'unlocking' && ph2 !== 'unlocking' && ph1 !== 'lobby' && ph2 !== 'lobby') {
      await p1.waitForTimeout(1500); // let deferred snapshots land
      p1End = await store(p1, `const g = s.getState(); return { phase: g.phase, pool: g.players[0].poolSize,
        locked: g.players[0].lockedDice.map((l) => l.goalSlotIndex).sort(), parked: g.committedUnlocks.length }`);
      p2ViewOfP1 = await store(p2, `const g = s.getState(); const i = g.onlinePlayerIds.indexOf(a);
        const p = g.players[i]; return { pool: p.poolSize, locked: p.lockedDice.map((l) => l.goalSlotIndex).sort() }`, dragged.p1Id);
      break;
    }
    await p1.waitForTimeout(300);
  }
  await browser.close();

  const sent = p1Sent.filter((x) => x.t >= dragged.at);
  const requests = sent.filter((x) => x.m.type === 'unlock_request' || x.m.type === 'skip_unlock');
  const p2Heard = p2Logs.filter((x) => x.t >= dragged.at && x.text.includes('unlock_result received') && x.text.includes(dragged.p1Id));
  log('P1 sent:', JSON.stringify(sent.map((x) => x.m)));
  log('P1 end:', JSON.stringify(p1End), ' P2 sees P1:', JSON.stringify(p2ViewOfP1));

  const checks = [];
  const check = (name, pass) => { checks.push(pass); log(pass ? '  ok  ' : '  FAIL', name); };
  check('timer ended P1\'s turn while the drag was held', dragged.submitted && dragged.key === -1);
  check('held die counted: ONE unlock_request with that slot, not AFK', requests.length === 1
    && requests[0].m.type === 'unlock_request' && requests[0].m.slotIndices.includes(dragged.slot) && !requests[0].m.afk);
  check('P1 told the server it was active (unlock_activity, D16)', sent.some((x) => x.m.type === 'unlock_activity'));
  check('after the turn closed, a new drag is refused', dragged.lateDragStarted === false);
  check('P2 heard P1\'s unlock (unlock_result)', p2Heard.length > 0);
  check('both left the unlock phase', !!p1End);
  check('nothing left parked on P1', p1End?.parked === 0);
  check('P2\'s view of P1\'s dice matches P1\'s own', !!p1End && !!p2ViewOfP1
    && p1End.pool === p2ViewOfP1.pool && JSON.stringify(p1End.locked) === JSON.stringify(p2ViewOfP1.locked));
  check('no page errors', errors.length === 0);
  if (errors.length) log('page errors:', errors);
  return checks.every(Boolean);
});
