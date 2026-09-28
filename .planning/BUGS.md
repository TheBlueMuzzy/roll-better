# Roll Better — Bugs
Open: 4 (P0 0 · P1 2 · P2 1 · P3 1) · watching: 2

## Open
### B006 · P1 · open · found 2026-09-28 in F46 · v0.2.1.0 · solo vs AI · desktop
A die dragged just after the unlock timer ends gets stuck in the rolling area, then splits a few rolls later
Steps: 1. Reach the unlock phase  2. Let the 3 s timer run out  3. Drag a locked die into the rolling area right as it ends
Expected: either the drag is refused (die snaps back to its slot) or it counts for this turn · Actual: the die sits in the rolling area uncounted, then registers and splits a few rolls later · How often: seen once (timing-dependent)
Likely area: happens OFFLINE, so it's the F46 inactivity-timer flow itself (not the online fix) — a drag isn't blocked once the timer has ended/mitosis started, and a late-committed die (`committedUnlocks`) waits for the next unlock phase. Same family as the F47 leftover "stale committed dice"
Evidence: Muzzy playtest on live v0.2.1

### B007 · P1 · open · found 2026-09-28 · v0.2.1.0 · solo vs AI · desktop
Some dice fly out of the rolling area and the game hangs as if a die is still rolling, then recovers on its own
Steps: 1. Roll (hold-to-gather-roll)  2. Some dice leave the rolling area
Expected: walls keep every die inside; the roll ends when all dice settle · Actual: dice escape, the roll never finishes for a while, then resolves (unclear how — probably a safety timeout) · How often: sometimes
Possible return of ISS-005 "dice get stuck and never settle" (fixed Mar 2026, see archive/gsd/ISSUES.md) — check the walls and the settle safety timeout
Evidence: Muzzy playtest on live v0.2.1

### B008 · P2 · open · found 2026-09-28 · v0.2.1.0 · solo vs AI · desktop · existed before v1.6
Gather-to-roll misses some dice — they flicker and scale as if grabbed, then get released and aren't swept into the spin
Steps: 1. Have several dice in the rolling area  2. Press and hold to gather them for a roll
Expected: every die in the rolling area is swept into the spin · Actual: some flicker/scale, then drop back and stay out of the spin · How often: sometimes
Evidence: Muzzy playtest on live v0.2.1 (also seen before drag-to-unlock)

### B005 · P3 · open · found 2026-09-28 in F46 · v0.2.1.0
First-unlock tip still says "Tap locked dice to select, then press UNLOCK" — the buttons are gone (you drag now)
Steps: 1. Start a new session with tips on  2. Reach the first turn where you must unlock
Expected: tip explains dragging a locked die into the rolling area · Actual: old tap/UNLOCK text · How often: every first must-unlock
Evidence: `src/App.tsx` → `tryShowTip('first-unlock', …)`

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
### B003 · P0 · fixed 2026-09-28 · fixed in d535e6d · released v0.2.1 · Guarded by: src/utils/unlockTurn.test.ts
Online: dragging dice to unlock never reached the server — the other players never saw your unlock, and the old 20 s AFK countdown then unlocked other dice for you and flagged you AFK (2nd time → bot took your seat). Live since the v1.6 drag work (phase 46).
Cause: online, the drag inactivity timer was switched off (HUD gated it on `!isOnlineGame`) and the timer-end handler never sent the drags to the server.
Fix: same 3 s timer online + ONE batched `unlock_request` (or `skip_unlock`) when it ends (TDD D15); old 20 s online unlock countdown removed; server 25 s backstop unchanged.
Verified by: two-browser Playwright run vs local PartyKit (before: P1 sent nothing, P2 heard nothing; after: P1 sent `unlock_request` afk:false, P2 got `unlock_result`). Waiting for Muzzy's two-phone check → then `verified`.

### B004 · P2 · fixed 2026-09-28 · fixed in be1b92e · Guarded by: `npm run build` (tsc)
`npm run build` failed its type check since 46-03 (`processAIUnlocks(true)` not in the store type; 2 unused vars in Scene.tsx). Live deploys never noticed — the deploy workflow runs `npx vite build`, which skips `tsc` (follow-up: ROADMAP F49).

Older fixes (BUG-002 reveal buffering, ISS-003 goal sync, ISS-004 roll sync, ISS-005 stuck dice, ISS-001 slow settle) are in archive/gsd/ISSUES.md; their must-not rules are in STATE Key facts → Don't re-break.
