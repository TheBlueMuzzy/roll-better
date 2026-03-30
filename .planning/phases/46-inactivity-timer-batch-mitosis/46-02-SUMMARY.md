---
phase: 46-inactivity-timer-batch-mitosis
plan: 02
subsystem: ui
tags: [mitosis, animation, phase-transition, findClearSpot, quaternion]

requires:
  - phase: 46-inactivity-timer-batch-mitosis
    provides: unlockTimerResetKey, configurable RollingCountdown
provides:
  - handleUnlockTimerExpire (converts committedUnlocks → mitosis → idle)
  - buildAndRunMitosis (animation generation from committed positions)
  - finalizeBatchUnlock (poolSize update, pendingNewDice from animations)
  - forceCommitUnlock store action (for must-unlock auto-commit)
affects: [46-03-hud-cleanup, 47-online-integration]

tech-stack:
  added: []
  patterns: [batch-mitosis-from-committed-positions, force-commit-for-must-unlock]

key-files:
  created: []
  modified:
    - src/App.tsx
    - src/store/gameStore.ts
    - src/components/HUD.tsx

key-decisions:
  - "finalizeBatchUnlock uses useGameStore.setState() (runs in setTimeout, not store action)"
  - "buildAndRunMitosis with empty array short-circuits to startAIUnlockAnimations"
  - "Timer key reset in both mitosis setTimeout and skip path"
  - "forceCommitUnlock for must-unlock: removes from lockedDice + adds to committedUnlocks atomically"

patterns-established:
  - "Batch mitosis from committed positions: clearCommittedUnlocks → setUnlockAnimations → setTimeout → finalizeBatchUnlock"

issues-created: []

duration: ~8min
completed: 2026-03-29
---

# Phase 46 Plan 02: Batch Mitosis on Timer Expire Summary

**handleUnlockTimerExpire converts committedUnlocks → mitosis animations → poolSize update → AI unlocks → idle phase**

## Performance

- **Duration:** ~8 min
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- handleUnlockTimerExpire: reads committedUnlocks, routes to mitosis or skip
- buildAndRunMitosis: generates UnlockAnimation[] from committed positions using findClearSpot
- finalizeBatchUnlock: updates poolSize, sets pendingNewDice/positions/rotations
- forceCommitUnlock: auto-commits first locked die for must-unlock case
- Full flow: timer expire → mitosis → finalize → AI unlocks → idle
- Online flow preserved (old handler untouched)

## Task Commits

1. **Task 1: handleUnlockTimerExpire + batch mitosis + forceCommitUnlock** - `dae318e` (feat)
2. **Task 2: Wire as inactivity timer callback** - `1249630` (feat)

## Files Created/Modified
- `src/App.tsx` - Three new functions + imports + prop passing to HUD
- `src/store/gameStore.ts` - forceCommitUnlock action
- `src/components/HUD.tsx` - onUnlockTimerExpire prop wired to offline countdown

## Decisions Made
- finalizeBatchUnlock via useGameStore.setState() (setTimeout context)
- Empty committed array short-circuits to AI unlocks (no animations needed)
- Timer key reset in both mitosis and skip paths
- forceCommitUnlock mirrors completeDragUnlock pattern

## Deviations from Plan
None - plan executed as specified.

## Issues Encountered
None.

## Next Phase Readiness
- Batch mitosis working for offline play
- Old UNLOCK/SKIP button and tap-to-select code still present (dormant)
- Ready for 46-03: HUD cleanup + remove old code + full UAT

---
*Phase: 46-inactivity-timer-batch-mitosis*
*Completed: 2026-03-29*
