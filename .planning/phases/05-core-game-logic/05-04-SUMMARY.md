---
phase: 05-core-game-logic
plan: 04
subsystem: ui, game-logic
tags: [zustand, react, r3f, hud, unlock, shake-feedback]

# Dependency graph
requires:
  - phase: 05-03
    provides: scoring, handicap, round transitions
  - phase: 04-03
    provides: HUD, DicePool, PlayerRow, PlayerIcon components
provides:
  - Store-driven UI (all components read from Zustand)
  - Phase-aware HUD with roll guarding
  - Unlock flow with tap-to-select, confirm/skip
  - Must-unlock enforcement (0 pool = forced unlock)
  - 12-die cap enforcement with shake feedback
  - Complete single-player game loop (roll → lock → unlock → score → next round → session end)
affects: [06-lerp-animation, 07-unlock-interaction, 08-ai-opponents]

# Tech tracking
tech-stack:
  added: []
  patterns: [phase-aware-components, generation-key-remount, must-unlock-guard, shake-reject-feedback]

key-files:
  created: []
  modified:
    - src/components/Scene.tsx
    - src/components/HUD.tsx
    - src/components/DicePool.tsx
    - src/components/PlayerRow.tsx
    - src/store/gameStore.ts
    - src/types/game.ts
    - src/App.tsx
    - src/App.css

key-decisions:
  - "Phase flow: idle → rolling → locking → unlocking → idle (or scoring on win)"
  - "Must unlock 1+ when poolSize reaches 0 (prevents soft lock)"
  - "12-die cap: max unlocks = floor((12 - poolSize) / 2)"
  - "Shake feedback on rejected unlock selection (150ms, 90Hz)"
  - "Generation counter in DicePool keys forces correct remount after pool shrinks"
  - "remainingDiceValues tracks which values stay in pool after locking"

patterns-established:
  - "Generation-key remount: bump generation counter to force React remount with correct initial values"
  - "Must-unlock guard: prevent skip when poolSize === 0 and round not won"
  - "Shake-reject feedback: useFrame ref mutation for fast horizontal oscillation on rejected action"

issues-created: []

# Metrics
duration: multi-session (~12h elapsed, ~3h active across sessions)
completed: 2026-03-01
---

# Phase 5 Plan 4: UI Integration Summary

**Store-driven game loop with phase-aware HUD, unlock flow with must-unlock/12-die-cap guards, and shake feedback on rejected selections**

## Performance

- **Duration:** Multi-session (~3h active work across 3 sessions)
- **First task commit:** 2026-03-01T06:18:36Z
- **Completed:** 2026-03-01T18:30:00Z
- **Tasks:** 2 auto + 1 checkpoint (with extensive bug fix iterations)
- **Files modified:** 8

## Accomplishments
- All Scene components read from Zustand store — zero test data remains
- Phase-aware HUD: different text/behavior per game phase, roll guarding
- Unlock flow: white ring + pulse on locked dice, tap to select (shrink 25%), UNLOCK/SKIP button
- Must-unlock enforcement: can't skip when poolSize is 0
- 12-die cap: can't unlock more than floor((12 - poolSize) / 2) dice
- Shake feedback on rejected unlock taps (fast 150ms buzz)
- Fixed DicePool key bug (generation counter forces correct remount)
- Fixed double-fire settle detection guard
- Complete single-player game loop: roll → lock → unlock → score → handicap → next round → session end

## Task Commits

Each task was committed atomically (plus extensive bug fix iterations):

1. **Task 1: Connect Scene components to store** - `f52b078` (feat)
2. **Task 2: Phase-aware HUD and roll controls** - `fbd8616` (feat)
3. **Task 3: Checkpoint verification** — approved after fix iterations

**Bug fix commits during checkpoint iteration:**
- `d81d6a3` feat: add unlock phase with tap-to-unlock
- `c5fd416` fix: unlock flow matches design spec
- `fc95761` fix: guard setRollResults against double-fire
- `24f6e38` fix: stable dice keys + unlock dice show correct face
- `b5439c9` chore: diagnostic logging for settle + lock pipeline
- `b1b9e09` chore: BUG-001 investigation — runtime validation trap
- `94d850b` fix: wrong die stayed in pool after locking (generation key remount)
- `bb220d1` fix: prevent soft lock when all dice lock — must unlock 1+
- `3375fce` fix: cap total dice at 12 — prevent over-unlocking
- `689c7d2` fix: remove redundant pool stats line from HUD
- `14a6a7e` feat: shake feedback on rejected unlock selection
- `2fd48ad` fix: 3x faster shake (150ms, 90Hz)

## Files Created/Modified
- `src/components/Scene.tsx` — Store-driven rendering, shakingSlot state, unlock cap detection
- `src/components/HUD.tsx` — Phase-aware status text, must-unlock/cap messaging
- `src/components/DicePool.tsx` — Generation counter keys, remainingDiceValues initial faces
- `src/components/PlayerRow.tsx` — UnlockableDie with shake animation, pulse, shrink
- `src/store/gameStore.ts` — setRollResults with validation, 12-die cap in toggleUnlockSelection
- `src/types/game.ts` — remainingDiceValues field in RoundState
- `src/App.tsx` — Phase transition effects, must-unlock guard in handleConfirmUnlock
- `src/App.css` — Removed redundant pool stats, added disabled button style

## Decisions Made
- Phase flow: idle → rolling → locking → unlocking → idle (loop), locking → scoring → roundEnd (on win)
- Must-unlock when poolSize hits 0 (soft lock prevention)
- 12-die total cap enforced at unlock selection time
- Shake feedback (150ms, 90Hz) for rejected unlock taps — fast buzz, not slow wobble
- Generation-counter key pattern for DicePool (forces correct remount after pool shrinks)
- Removed redundant pool stats from HUD bottom (PlayerIcon badge is single source)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] DicePool key bug — wrong die stayed after locking**
- **Found during:** Checkpoint 3 testing
- **Issue:** `key={i}` caused React to keep wrong physical die when pool shrank
- **Fix:** Generation counter in keys forces remount; remainingDiceValues sets correct initialFace
- **Files modified:** src/components/DicePool.tsx, src/store/gameStore.ts, src/types/game.ts
- **Committed in:** 94d850b

**2. [Rule 1 - Bug] Double-fire settle detection**
- **Found during:** Checkpoint 3 testing
- **Issue:** setRollResults could fire twice from settle detection in StrictMode
- **Fix:** Guard: ignore if phase !== 'rolling'
- **Committed in:** fc95761

**3. [Rule 2 - Missing Critical] Must-unlock when poolSize is 0**
- **Found during:** Checkpoint 3 user feedback
- **Issue:** Player could skip unlock with 0 dice, causing soft lock
- **Fix:** Guard in handleConfirmUnlock + disabled SKIP button + "MUST UNLOCK" text
- **Committed in:** bb220d1

**4. [Rule 2 - Missing Critical] 12-die cap on unlocks**
- **Found during:** Checkpoint 3 user feedback
- **Issue:** Player could unlock unlimited dice, exceeding 12 total
- **Fix:** Cap check in toggleUnlockSelection + HUD "(max 12 dice)" message
- **Committed in:** 3375fce

---

**Total deviations:** 4 auto-fixed (2 bugs, 2 missing critical), 0 deferred
**Impact on plan:** All fixes necessary for correct gameplay. No scope creep.

## Issues Encountered
- BUG-001 investigation consumed significant time — face detection (getFaceUp) suspected but not conclusively fixed. Diagnostic logging remains in place. The generation-key fix resolved the visual symptom (wrong die staying in pool). Root cause (canted dice + face misread) deferred to ISS-002.

## Next Phase Readiness
Phase 5 complete. Ready for Phase 6: Lerp & Animation.
- Game state machine drives all state transitions
- Lock/unlock state modeled in store
- Scoring and handicap functional
- Goal transition animation needed (Phase 6) — old dice slide right, new fall from sky
- Unlock interaction polish needed (Phase 7) — currently tap-based, drag option later

---
*Phase: 05-core-game-logic*
*Completed: 2026-03-01*
