---
phase: 46-inactivity-timer-batch-mitosis
plan: 01
subsystem: ui
tags: [timer, countdown, zustand, inactivity]

requires:
  - phase: 45-drop-commit-highlight-state
    provides: committedUnlocks, completeDragUnlock
provides:
  - unlockTimerResetKey in store (incremented per drag commit)
  - RollingCountdown with configurable duration + resetKey props
  - Separate offline inactivity timer (4s/3s) and online countdown (20s)
affects: [46-02-batch-mitosis, 46-03-hud-cleanup, 47-online-integration]

tech-stack:
  added: []
  patterns: [resetKey-driven-timer-restart, split-offline-online-countdown]

key-files:
  created: []
  modified:
    - src/types/game.ts
    - src/store/gameStore.ts
    - src/components/RollingCountdown.tsx
    - src/components/HUD.tsx

key-decisions:
  - "unlockTimerResetKey=0 → 4s initial, >0 → 3s (duration computed from key)"
  - "Split countdowns: showUnlockInactivityTimer (offline) vs showOnlineUnlockCountdown"
  - "resetKey useEffect restarts timer mid-countdown without toggling active"

patterns-established:
  - "Configurable RollingCountdown: duration + resetKey props for flexible timer control"

issues-created: []

duration: ~6min
completed: 2026-03-29
---

# Phase 46 Plan 01: Inactivity Timer System Summary

**unlockTimerResetKey in store + configurable RollingCountdown with 4s initial / 3s reset for drag-based unlock**

## Performance

- **Duration:** ~6 min
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- unlockTimerResetKey incremented on each completeDragUnlock, reset action available
- RollingCountdown accepts optional duration + resetKey props (backward compatible)
- Offline inactivity timer: 4s initial, 3s after each drag, fires onTimeout
- Online countdown preserved as separate 20s timer

## Task Commits

1. **Task 1: unlockTimerResetKey in store** - `1384275` (feat)
2. **Task 2: Configurable RollingCountdown + HUD split** - `c2bcaf0` (feat)

## Files Created/Modified
- `src/types/game.ts` - Added unlockTimerResetKey to GameState
- `src/store/gameStore.ts` - Initialize, increment in completeDragUnlock, resetUnlockTimerKey action
- `src/components/RollingCountdown.tsx` - duration + resetKey optional props
- `src/components/HUD.tsx` - Split into offline inactivity timer + online countdown

## Decisions Made
- Duration logic: resetKey=0 → 4000ms, resetKey>0 → 3000ms
- Split offline/online countdowns to avoid interference
- resetKey useEffect for mid-countdown restart without active toggle

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## Next Phase Readiness
- Timer fires onTimeout when expired — but handler still calls old handleUnlockTimeout
- Ready for 46-02: Wire new handleUnlockTimerExpire that converts committedUnlocks → mitosis

---
*Phase: 46-inactivity-timer-batch-mitosis*
*Completed: 2026-03-29*
