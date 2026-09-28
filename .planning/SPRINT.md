# Sprint 01 — Rolling and unlocking are solid, solo and online
Started 2026-09-28 · Milestone v1.6 · Features: F47 (+B006), roll physics bugs (B007, B008), F49 (in this order)
Branch: dev/v1-6-drag-to-unlock (live stays on v0.2.1 until /deliver)

## F47 🎮 Online play integration + B006 late drag
Done when: solo and online, the unlock turn behaves the same — a drag in progress when the timer ends resolves by zone (over the rolling zone → counts and lands at a safe spot; over the locked zone → snaps back), after that locked dice can't be picked up until the next unlock turn, and nothing is ever left glowing/parked. Online, both players see every unlock, and the server's rules match the phone's.
- [ ] 🤖 1. Failing test first (B006): a drag can still start/finish after the timer fires — pure helpers in `src/utils/unlockTurn.ts` + `unlockTurn.test.ts`
- [ ] 🤖 2. Close the turn when the timer fires: block new drags (`startDragUnlock` / `completeDragUnlock` in `src/store/gameStore.ts`, `canUnlock` in `src/components/Scene.tsx`, `PlayerRow.tsx` handlers); an in-progress drag resolves by zone (rolling zone → commit at a clear spot; locked zone → snap back) in `handleUnlockTimerExpire` (`src/App.tsx`); don't reset `unlockTimerResetKey` from -1
- [ ] 🤖 3. Clear parked dice when the unlock phase ends (`setPhase`, `initRound` in `gameStore.ts`); server AFK unlocks run through the drag path + batch mitosis instead of the old `handleConfirmUnlock` (`App.tsx` ~753, `applyOnlineUnlockResult` in `gameStore.ts`)
- [ ] 🤖 4. Server matches the phone: 12-die cap uses pool + locked + 2 per unlock (shared pure helper + test; `party/server.ts` ~964); unlock backstop fits the 3 s drag timer; fix stale "20 s" comments (`server.ts` ~1180, ~1566)
- [ ] 🤖 5. Keep checks as scripts: `e2e/online-unlock.mjs` (two browsers, from the B003 repro) + a solo late-drag check
- [ ] 🙋 6. Two-phone online game (verifies B003) + try a late drag solo on desktop
Check: tests + build pass; e2e script passes; Muzzy's two-phone game and solo late drag behave as above.
Ask Muzzy: (answered) late drag → resolve by zone, then the turn is closed.
Notes: Server code changes → `npx partykit deploy` needed at /deliver.

## Roll physics bugs — B007 dice escape + hang · B008 gather misses dice
Done when: no die can leave the rolling area (or it's instantly put back), rolls never hang waiting for a lost die, and gather sweeps every die in the rolling area.
- [ ] 🤖 7. Failing test first (B007): pure helper that says whether a die is outside the rolling area — `src/utils/` + test
- [ ] 🤖 8. Safety net: a die outside bounds is put back inside and settles (`src/components/PhysicsDie.tsx`, `DicePool.tsx`); fix the dead release fling — `stopGathering` clears the touch point before release reads it (`gameStore.ts` ~1013, `DicePool.tsx` ~372); cap release speed
- [ ] 🤖 9. B008: log gather per die (dev only), reproduce, fix the cause — may already be solved by task 8 (escaped dice coming back from far below) (`DicePool.tsx`, `PhysicsDie.tsx`)
Check: a scripted 50-roll run with no die out of bounds and no 10 s timeout firing; gather logs show every die attracted and spun.

## F49 🐞 Deploy builds the same way as local
Done when: the GitHub deploy fails if the type check or tests fail.
- [ ] 🤖 10. `.github/workflows/deploy.yml`: `npm run build` (type check included) + `npm test` instead of `npx vite build`
Check: workflow run on the branch/merge shows both steps.
