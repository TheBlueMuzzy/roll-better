// B010 repro: a locked die dragged to the far left (over the player's chip — kit PlayerChip pinned
// beside the row since F58) must stay readable: the chip fades while the die is over it.
// Screenshots the drag at a few distances left of slot 0. Run: node e2e/b010-drag-over-profile.mjs <screenshot-folder>
import { startServer, launchBrowser, store, holdToRoll, run, log, GAME_URL, VITE_PORT, playLocal } from './lib.mjs';

const OUT = process.argv[2] || '.';
const ROW_Z = -3.75; // human player row (Scene.tsx default)

run(async () => {
  await startServer('vite', `npx vite --port ${VITE_PORT} --strictPort`, VITE_PORT);
  const browser = await launchBrowser();
  const page = await (await browser.newContext({ viewport: { width: 1000, height: 560 } })).newPage();
  await page.goto(GAME_URL);
  await playLocal(page);
  await page.waitForTimeout(2000);
  await store(page, `s.setState({ settings: { ...s.getState().settings, tipsEnabled: false } });`);

  const deadline = Date.now() + 240_000;
  while (Date.now() < deadline) {
    const st = await store(page, `const g = s.getState(); return { phase: g.phase, key: g.unlockTimerResetKey,
      anim: g.roundState.unlockAnimations.length + g.roundState.lockAnimations.length + g.roundState.aiLockAnimations.length,
      locked: g.players[0].lockedDice.map((d) => d.goalSlotIndex) };`);
    if (st.phase === 'idle') { await holdToRoll(page); continue; }
    if (st.phase === 'unlocking' && st.key >= 0 && st.anim === 0 && st.locked.length > 0) {
      // Pause the 3 s timer's effect by holding the drag (the turn only closes when it fires)
      const slot = Math.min(...st.locked);
      const ok = await store(page, `const g = s.getState(); const d = g.players[0].lockedDice.find((l) => l.goalSlotIndex === a);
        g.startDragUnlock(d.goalSlotIndex, d.value, [0, 0.4, ${ROW_Z}]); return s.getState().dragUnlockState.active;`, slot);
      if (!ok) { await page.waitForTimeout(300); continue; }
      // Keep the turn open while shooting: headless screenshots can take seconds, longer than the
      // 3 s unlock timer. Restart it every half second (in the page, so slow screenshots can't stall it).
      await store(page, `window.__keepTurnOpen = setInterval(() => { const k = s.getState().unlockTimerResetKey;
        if (k >= 0) s.setState({ unlockTimerResetKey: k + 1 }); }, 500);`);
      const slotX = await page.evaluate(async () => (await import('/src/components/GoalRow.tsx')).getSlotX(0));
      for (const dx of [0, -0.7, -1.4]) {
        await store(page, `s.getState().updateDragPosition([a, 0.4, ${ROW_Z}]);`, slotX + dx);
        await page.waitForTimeout(700);
        const file = `${OUT}/b010-drag-dx${dx}.png`;
        await page.screenshot({ path: file, clip: { x: 0, y: 0, width: 420, height: 260 } });
        log('shot', file, 'slot', slot);
      }
      await browser.close();
      return true;
    }
    await page.waitForTimeout(300);
  }
  await browser.close();
  return false;
});
