---
phase: 23-settings-controls-cleanup
plan: 01
subsystem: ui
tags: [settings, shake-to-roll, cleanup, code-removal]

# Dependency graph
requires:
  - phase: 22-main-menu-restructure
    provides: How to Play accessible from main menu
provides:
  - Shake-to-roll code fully removed
  - Settings panel cleaned up (no redundant How to Play button)
  - Simplified idle status text ("Tap to Roll" always)
affects: [26-how-to-play-content-refresh]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified: [src/types/game.ts, src/store/gameStore.ts, src/components/Settings.tsx, src/components/HUD.tsx, src/App.tsx, src/components/Scene.tsx, src/App.css]

key-decisions:
  - "Shake-to-roll removed entirely per v1.2 scope"
  - "How to Play removed from Settings — main menu is sole access point"

patterns-established: []

issues-created: []

# Metrics
duration: 3min
completed: 2026-03-06
---

# Phase 23 Plan 01: Remove Shake-to-Roll and Clean Up Settings Summary

**Deleted all shake-to-roll infrastructure (3 files, 6 file edits) and removed redundant How to Play button from Settings panel**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-06T00:00:56Z
- **Completed:** 2026-03-06T00:03:50Z
- **Tasks:** 2
- **Files modified:** 6
- **Files deleted:** 3

## Accomplishments
- Removed all shake-to-roll code: useShakeToRoll hook, useAccelerometerGravity hook, GravityController component
- Cleaned shake-related settings from store, types, Settings panel, and HUD
- Simplified idle status text from conditional "Shake or Tap to Roll" to always "Tap to Roll"
- Removed redundant How to Play button from Settings panel (main menu is now sole access point)
- Removed associated CSS rules (.settings-h2p)

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove all shake-to-roll code** - `27dac8a` (chore)
2. **Task 2: Remove How to Play button from Settings** - `bd490af` (feat)

## Files Created/Modified
- `src/hooks/useShakeToRoll.ts` - DELETED
- `src/hooks/useAccelerometerGravity.ts` - DELETED
- `src/components/GravityController.tsx` - DELETED
- `src/types/game.ts` - Removed shakeToRollEnabled from Settings interface
- `src/store/gameStore.ts` - Removed shake setting default, interface member, implementation
- `src/components/Settings.tsx` - Removed shake toggle section, shakeSupported prop, How to Play button, onOpenHowToPlay prop
- `src/components/HUD.tsx` - Removed shake props, Enable Shake button, simplified idle text
- `src/App.tsx` - Removed shake imports, hooks, and related props passed to HUD/Settings
- `src/components/Scene.tsx` - Removed GravityController import and JSX
- `src/App.css` - Removed .settings-h2p CSS rules

## Decisions Made
- Shake-to-roll removed entirely per v1.2 scope decision
- How to Play removed from Settings — main menu button (Phase 22) is now the sole access point

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Settings panel is now cleaner: Audio, Performance, Tips, Confirmation, divider, Main Menu/Privacy
- Ready for 23-02: Settings gear icon on main menu + audio slider fix + verification

---
*Phase: 23-settings-controls-cleanup*
*Completed: 2026-03-06*
