# Roll Better — Bugs
Open: 2 (P0 0 · P1 0 · P2 0 · P3 2) · watching: 2

## Open
### B010 · P3 · open · found 2026-09-29 in sprint 01 feel check · dev build (dev/v1-6-drag-to-unlock) · desktop
Dragged die renders behind the player icon / profile UI on the far left; the pips are see-through holes
Steps: 1. Get a die locked in the leftmost Goal slot  2. Unlock turn: press on it to pick it up (it lifts)
Expected: pips stay black · Actual: pips look white/see-through while lifted over that slot; back to normal as soon as it's dragged away · Only the leftmost slot does it · How often: whenever tried (Muzzy)
Update (Muzzy, same day): dragging a die all the way left, it draws BEHIND the 3D profile UI (player icon etc.), and the pips are see-through — the UI shows through the pip holes. So it's draw order / depth, not reflection: the profile group likely renders on top (renderOrder / depthTest off / transparent), and the pip discs don't sort the same way as the die body. The leftmost slot is simply the only place a lifted die overlaps the profile group.
Fix direction: the die being dragged (and its pips) should draw above the profile UI — check renderOrder/depthTest/transparent on the profile group + pip materials (`PlayerProfileGroup.tsx`, `PlayerIcon.tsx`, `Die3D.tsx`).
Evidence: Muzzy report

### B009 · P3 · open · found 2026-09-29 in B007 fix · dev build · e2e
A released die sometimes ends up pushed into the left wall and is put back by the safety net (a small visible jump)
Steps: 1. Hold-to-gather near the left wall  2. Release  · Expected: dice bounce off the wall · Actual: 1–3 per 50 rolls get pushed into the wall, then teleport back inside · How often: occasional (e2e)
Likely: a fast die's collider grows back to full size while it's touching the wall. Safety net keeps the game correct — cosmetic only.
Evidence: `npm run e2e:physics` put-back counts (1–3 per run), dev log `[PhysicsDie] out of bounds`

### B001 · P2 · watching · found 2026-03-01 · v0.1.0.51 · (old BUG-001)
Dice that match the Goal sometimes don't lock — some matches silently dropped
Steps: 1. Roll  2. Several dice show a Goal value (e.g. two 1s, Goal has three 1s)
Expected: every matching die locks · Actual: only one locks · How often: rare (3 reports, none since v1.5)
Cause (likely): a canted die is misread by `getFaceUp`. Patched reactively in v1.5 (snapFlat cascade + wall nudge), not prevented. Close as fixed if it never recurs. Diagnostic logs still in DicePool / setRollResults / getFaceUp.
Evidence: archive/gsd/ISSUES.md → BUG-001 (full investigation + hypotheses)

### B002 · P3 · watching · found 2026-02-28 · (old ISS-002)
Dice can lean (cant) against the walls and fail to settle flat
Expected: dice always land flat · Actual: occasionally leans on a wall or another die · How often: rare, none reported since v1.5
Patched v1.5 (wall nudge 0.2 u + snapFlat when face dot < 0.95). Preventative fix (kick-out colliders at wall bases) still possible if it returns.
Evidence: archive/gsd/ISSUES.md → ISS-002

## Fixed (newest first)
### B005 · P3 · fixed 2026-09-29 · Guarded by: src/utils/playerText.test.ts · found 2026-09-28 in F46 · v0.2.1.0
First-unlock tip still says "Tap locked dice to select, then press UNLOCK" — the buttons are gone (you drag now)
Steps: 1. Start a new session with tips on  2. Reach the first turn where you must unlock
Expected: tip explains dragging a locked die into the rolling area · Actual: old tap/UNLOCK text · How often: every first must-unlock
Evidence: `src/App.tsx` → `tryShowTip('first-unlock', …)`
Fix: tip + How to Play page 3 now say to drag locked dice into the rolling area (each splits in two). How to Play had the same stale text.

### B007 · P1 · verified 2026-09-29 (Muzzy: "physics stuff looks good!") · fixed in 2c1846d · Guarded by: src/utils/rollBounds.test.ts + `npm run e2e:physics` · found 2026-09-28 · v0.2.1.0 · solo vs AI · desktop
Some dice fly out of the rolling area and the game hangs as if a die is still rolling, then recovers on its own
Steps: 1. Roll (hold-to-gather-roll)  2. Some dice leave the rolling area
Expected: walls keep every die inside; the roll ends when all dice settle · Actual: dice escape, the roll never finishes for a while, then resolves (unclear how — probably a safety timeout) · How often: sometimes
Possible return of ISS-005 "dice get stuck and never settle" (fixed Mar 2026, see archive/gsd/ISSUES.md) — check the walls and the settle safety timeout
Evidence: Muzzy playtest on live v0.2.1
Cause: dice could "settle" mid-gather (results ignored → stuck in rolling; the 10 s timeout couldn't rescue it), and a sub-frame tap did the same; the gather pull ran once per drawn frame, so after a slow frame it overshot and flung dice (sensors while gathering) through the walls. Fix: no settling while gathering, release called directly, pull runs every physics step, live fling capped (`content/tuning/physics.json` maxReleaseSpeed 20), out-of-bounds safety net. 4 × 50 rolls: 0 hangs, 0 timeouts. Waiting for Muzzy's device check → verified.

### B008 · P2 · verified 2026-09-29 (Muzzy) · fixed in 68447e0 (+ 5fea4b8) · Guarded by: `npm run e2e:physics` (every gather with 0.6 s+ of pull sweeps every die) · found 2026-09-28 · v0.2.1.0 · solo vs AI · desktop · existed before v1.6
Gather-to-roll misses some dice — they flicker and scale as if grabbed, then get released and aren't swept into the spin
Steps: 1. Have several dice in the rolling area  2. Press and hold to gather them for a roll
Expected: every die in the rolling area is swept into the spin · Actual: some flicker/scale, then drop back and stay out of the spin · How often: sometimes
Evidence: Muzzy playtest on live v0.2.1 (also seen before drag-to-unlock)
Cause: each die had 23 colliders, not 1 — Rapier auto-built them from the die + 21 pip meshes, and the gather shrink/grow blew the pip ones up to full size; lumpy dice sank through the floor while being pulled. Fix: `colliders={false}` + one cube (density 2, same mass). Waiting for Muzzy's device check → verified. May also help B001/B002 — watch.

### B006 · P1 · verified 2026-09-28 (Muzzy: "it's all working") · fixed in 58a54a6 (+ e5fa134) · not released · Guarded by: src/utils/unlockTurn.test.ts (B006 tests) + `npm run e2e:solo`
A die dragged just after the unlock timer ended got stuck in the rolling area uncounted, then split a few rolls later.
Cause: after the 3 s timer fired the phase stays `unlocking` while the split animations play, and nothing stopped a new drag from starting or committing; the late die sat in `committedUnlocks` (never cleared) until the next unlock turn's mitosis. The late commit also bumped the timer key from -1 back to 0.
Fix (Muzzy's rule, F47): a drag in progress when the timer fires resolves by zone (rolling zone → counts at a clear spot; locked zone → snaps back), then the turn is closed — no new drags until the next unlock phase (`isUnlockTurnOpen` / `resolveDragRelease` / `nextUnlockTimerKey` in `unlockTurn.ts`). Leaving the unlock phase and `initRound` clear parked dice.
Verified by: e2e solo script — before (6cd34d5): late drag accepted, die left parked, next turn pool +4; after: refused, nothing parked, pool +2. Waiting for Muzzy's desktop late-drag try (sprint task 6) → then `verified`.
Reopened 2026-09-28 (Muzzy, desktop solo: one die dropped at almost exactly the moment the timer ended stayed in the rolling area, unsplit, and split next unlock phase). Follow-up: every ordering of pointerdown / pointerup vs the timer tick vs the mitosis snapshot vs the phase change was traced — all of them are synchronous store updates in one JS task, so a drop is decided atomically (commit before the snapshot, or refused). New `npm`-less sweep `node e2e/unlock-race-sweep.mjs` drops a die at −150…+150 ms around the expiring tick AND inside the same task just before/after it (real PointerEvents through R3F): ~90 drops across 3 runs, **0 reproduced** (every die either split that turn or went back to its slot; no commit after the turn closed, nothing parked at phase exit). Couldn't reproduce on this build — Muzzy's case may have been on a build without 58a54a6/e5fa134. Defensive fix anyway: leaving the unlock phase now puts any still-parked die back in its slot (`returnParkedDice`) — before, it was silently deleted (already off the locked row, never split). Guarded by: `returnParkedDice` tests + the sweep. Still waiting for Muzzy's desktop retry.
