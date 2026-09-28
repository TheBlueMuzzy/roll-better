---
phase: 05-core-game-logic
plan: 01
subsystem: game-state
tags: [zustand, typescript, state-machine, game-logic]

# Dependency graph
requires:
  - phase: 04-game-board-layout
    provides: Scene with GoalRow, PlayerRow, PlayerIcon, DicePool, HUD
  - phase: 03-dice-rolling
    provides: Physics rolling, face detection, sorted results
provides:
  - Full game type system (GamePhase, Player, LockedDie, RoundState, GameState)
  - Zustand store with 10 game actions (init, roll, lock, unlock, score, handicap)
  - Store-driven UI (App, Scene, HUD read from Zustand)
  - Roll cycle: idle → rolling → locking → idle
affects: [05-02, 05-03, 05-04, 06-lerp-animation, 07-unlock-interaction]

# Tech tracking
tech-stack:
  added: []
  patterns: [zustand-driven-game-state, store-replaces-local-state, useEffect-phase-transitions]

key-files:
  created: []
  modified: [src/types/game.ts, src/store/gameStore.ts, src/App.tsx, src/components/Scene.tsx, src/components/HUD.tsx, src/components/PlayerIcon.tsx]

key-decisions:
  - "initGame must reset currentRound to handle React StrictMode double-fire"
  - "Phase flow: idle (tap to roll) → rolling → locking → idle (auto-transition after 1.5s)"
  - "PLAYER_COLORS defined in store file to avoid circular dep with Die3D"
  - "PlayerIcon stat labels renamed from X/Y/Z to Pool/Locked/Start for clarity"

patterns-established:
  - "Store-driven UI: components read from useGameStore, not props or local state"
  - "Phase transitions via useEffect watching store phase changes"

issues-created: []

# Metrics
duration: 33min
completed: 2026-03-01
---

# Phase 5 Plan 1: Game State Machine Summary

**Full Zustand store with 10 game actions, expanded type system, and store-driven UI replacing all test data and local state**

## Performance

- **Duration:** 33 min
- **Started:** 2026-03-01T05:22:47Z
- **Completed:** 2026-03-01T05:56:12Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 7

## Accomplishments
- Expanded type system: added idle phase, LockedDie, RoundState, reshaped Player and GameState
- Built 10 store actions: initGame, initRound, setRollResults, lockDice, toggleUnlockSelection, confirmUnlock, skipUnlock, scoreRound, applyHandicap, checkWinner/checkSessionEnd
- Migrated App/Scene/HUD from local state and test constants to Zustand store
- Random goal generation on each round init (8 values, sorted ascending)

## Task Commits

Each task was committed atomically:

1. **Task 1: Expand types and Zustand store** - `eabcc1c` (feat)
2. **Task 2: Wire App, Scene, HUD to store** - `cfa2452` (feat)
3. **Fix: StrictMode round count** - `9d8f8e8` (fix)

## Files Created/Modified
- `src/types/game.ts` - Added idle phase, LockedDie, RoundState, expanded Player/GameState
- `src/store/gameStore.ts` - 10 new store actions, PLAYER_COLORS array, full game state
- `src/App.tsx` - Store-driven init, roll cycle, phase transitions
- `src/components/Scene.tsx` - Removed all TEST_ constants, reads from store
- `src/components/HUD.tsx` - Reads from store directly, phase-based status text
- `src/components/PlayerIcon.tsx` - Renamed handicap→startingDice, clearer stat labels

## Decisions Made
- PLAYER_COLORS duplicated in store to avoid circular dependency with Die3D
- Phase flow uses 'idle' as the waiting state (replaces 'unlocking' for tap-to-roll)
- Auto-transition from 'locking' to 'idle' after 1.5s delay (shows results briefly)
- initGame resets currentRound to 0 for React StrictMode safety

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] React StrictMode double-increments currentRound**
- **Found during:** Checkpoint verification
- **Issue:** initGame didn't reset currentRound, so StrictMode double-fire of useEffect made Round show as 2 on first load
- **Fix:** initGame now resets currentRound to 0 and roundState to initial
- **Files modified:** src/store/gameStore.ts
- **Verification:** Page loads showing Round 1
- **Committed in:** 9d8f8e8

**2. [Rule 3 - Blocking] PlayerIcon prop mismatch**
- **Found during:** Task 2 (wiring Scene to store)
- **Issue:** Scene passing startingDice but PlayerIcon expected handicap prop
- **Fix:** Updated PlayerIcon to accept startingDice, improved stat labels
- **Files modified:** src/components/PlayerIcon.tsx
- **Verification:** TypeScript compiles clean
- **Committed in:** cfa2452 (part of Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking), 0 deferred
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
None beyond the deviations above.

## Next Phase Readiness
- Store foundation complete — all subsequent Phase 5 plans can build on it
- Ready for 05-02-PLAN.md (goal generation + match detection)

---
*Phase: 05-core-game-logic*
*Completed: 2026-03-01*
