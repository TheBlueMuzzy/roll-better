---
phase: 08-ai-opponents
plan: 02
subsystem: game-logic
tags: [zustand, ai, multiplayer, simultaneous-play]

# Dependency graph
requires:
  - phase: 08-ai-opponents/01
    provides: AI unlock decision engine (getAIUnlockDecision)
  - phase: 05-core-game-logic
    provides: Phase flow, scoring, handicap, unlock mechanics
  - phase: 06-lerp-animation
    provides: Lock lerps, mitosis unlock, round transitions
provides:
  - Simultaneous multi-player game loop (all players roll/lock/unlock together)
  - AI player rows visible below human row
  - processAIUnlocks store action
  - AIDifficulty type on Player interface
affects: [09-multi-player-display, 10-screens-and-flow]

# Tech tracking
tech-stack:
  added: []
  patterns: [simultaneous-play-model, ai-rolls-in-setRollResults]

key-files:
  created: []
  modified: [src/types/game.ts, src/store/gameStore.ts, src/utils/aiDecision.ts, src/App.tsx, src/components/Scene.tsx]

key-decisions:
  - "Simultaneous play, not turn-based — all players roll/lock/unlock in same phases"
  - "Round ends immediately when ANY player completes the goal"
  - "AI rolls computed as random numbers inside setRollResults (same atomic state update as human)"
  - "AI unlock decisions processed when human confirms/skips unlock"

patterns-established:
  - "Simultaneous model: AI state updates piggyback on human-triggered actions"
  - "AI player rows rendered as additional PlayerRow components with offset Z positions"

issues-created: []

# Metrics
duration: 55min
completed: 2026-03-02
---

# Phase 8 Plan 2: Turn System + AI Integration Summary

**Simultaneous multi-player loop where AI rolls, locks, and unlocks alongside the human in every phase, with AI locked dice visible in rows below the player's row**

## Performance

- **Duration:** 55 min
- **Started:** 2026-03-02T03:10:45Z
- **Completed:** 2026-03-02T04:06:12Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 5

## Accomplishments
- All players roll simultaneously — AI results computed as random numbers when human dice settle
- Auto-lock applies to all players in the same state update
- AI unlock decisions computed and applied when human confirms/skips unlock
- AI player rows visible below human's locked dice row (blue dice appear as AI locks matches)
- Round ends when ANY player completes all 8 goal slots

## Task Commits

Each task was committed atomically:

1. **Task 1: Simultaneous play store logic** - `b761ecf` (feat)
2. **Task 2: AI integration and player row display** - `4e8b694` (feat)

**Revert commit:** `a659300` (reverted incorrect turn-based implementation, then re-implemented correctly)

**Plan metadata:** [pending]

## Files Created/Modified
- `src/types/game.ts` — Added AIDifficulty type, difficulty field on Player
- `src/store/gameStore.ts` — AI rolls in setRollResults, processAIUnlocks action, initGame with difficulty
- `src/utils/aiDecision.ts` — Re-exports AIDifficulty from game.ts (avoids duplicate type)
- `src/App.tsx` — initGame(2, 'medium'), processAIUnlocks on confirm/skip
- `src/components/Scene.tsx` — AI player rows rendered below human row, aiLockedValues memo

## Decisions Made
- **Simultaneous over turn-based:** Original plan assumed turn-based play. User clarified all players perform each phase simultaneously. Reverted and re-implemented.
- **Round ends immediately:** When any player completes the goal, round ends. Incomplete players don't score.
- **AI rolls are random numbers:** No physics simulation for AI — just Math.random() for each pool die, then findAutoLocks.
- **AI unlocks piggyback on human action:** AI decisions processed in same moment human confirms/skips. No separate AI timing needed.

## Deviations from Plan

### Major Design Correction

**1. [Rule 4 - Architectural] Simultaneous play instead of turn-based**
- **Found during:** Checkpoint verification (Task 3)
- **Issue:** Plan was designed with turn-based assumptions (currentPlayerIndex, advanceTurn, startPlayerTurn). User clarified the game uses simultaneous play — all players roll/lock/unlock together in the same phases.
- **Fix:** Reverted turn-based implementation (commit a659300), re-implemented with simultaneous model
- **Files modified:** All 5 listed above
- **Verification:** User confirmed "MUCH better" — simultaneous logic works correctly
- **Impact:** Fundamental architecture change. The simultaneous model is simpler (no turn management) and matches the actual game design.

### Deferred Enhancements

Design feedback captured for Phase 9 planning:
- Player avatar groups with profile info (points, starting dice)
- AI dice lock/unlock animations (scale 0→1 from avatar, reverse on unlock)
- Pool dice spawn/despawn animations between rounds
- Goal dice star icon and reworked enter/exit animation direction
- Full details in .planning/phases/09-multi-player-display/CONTEXT.md

---

**Total deviations:** 1 architectural (with user correction), 0 auto-fixed
**Impact on plan:** Design correction was essential — turn-based was wrong. Final implementation is simpler and correct.

## Issues Encountered
- Initial turn-based implementation had to be reverted after user clarified simultaneous play design. Not a bug — the plan itself had the wrong model. Caught at checkpoint.

## Next Phase Readiness
- Phase 8 complete — AI opponents roll, lock, unlock simultaneously with human
- Phase 9 ready with detailed design context (CONTEXT.md) for multi-player display polish
- AI decision engine (08-01) + simultaneous integration (08-02) form complete AI foundation

---
*Phase: 08-ai-opponents*
*Completed: 2026-03-02*
