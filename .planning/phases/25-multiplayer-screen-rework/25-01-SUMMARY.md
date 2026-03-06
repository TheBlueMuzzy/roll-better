---
phase: 25-multiplayer-screen-rework
plan: 01
subsystem: ui
tags: [react, useRoom, lobby, mainmenu, state-machine]

# Dependency graph
requires:
  - phase: 22-main-menu-restructure
    provides: menu-backdrop pattern, menu-links, menu-gear
  - phase: 23-settings-controls-cleanup
    provides: menu-gear positioning, slider CSS
provides:
  - Unified MainMenu with inline Create/Join/Joined online flow
  - LobbyScreen removed, lobby screen state removed
affects: [26-how-to-play-content-refresh]

# Tech tracking
tech-stack:
  added: []
  patterns: [inline-online-flow-state-machine]

key-files:
  created: []
  modified: [src/components/MainMenu.tsx, src/App.tsx, src/App.css, src/types/game.ts]

key-decisions:
  - "4-state machine (idle/creating/joining/joined) for online flow"
  - "Hardcoded 4 players for Play Local (removed player count selector)"
  - "? icon button bottom-left for How to Play (mirrors gear icon)"

patterns-established:
  - "Inline online flow: useRoom hook in MainMenu with state-machine driven UI"

issues-created: []

# Metrics
duration: 27 min
completed: 2026-03-06
---

# Phase 25 Plan 01: Multiplayer Screen Rework Summary

**Merged LobbyScreen into MainMenu with inline Create/Join flows, 4-state machine, and ? help button**

## Performance

- **Duration:** 27 min
- **Started:** 2026-03-06T03:00:06Z
- **Completed:** 2026-03-06T03:27:15Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 4 (+ 1 deleted)

## Accomplishments
- Rewrote MainMenu with useRoom hook and 4-state online flow (idle/creating/joining/joined)
- Side-by-side Create/Join buttons with contextual state changes (START, inactive, disabled)
- Inline room code display, code input boxes, player list, and ready toggle
- Removed LobbyScreen component entirely and all lobby-* CSS (~345 lines)
- Added ? icon button (bottom-left) for How to Play access
- Removed player count selector, name input, and Play Online button

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite MainMenu with inline online flow** - `51570a5` (feat)
2. **Task 2: Update App.tsx, remove LobbyScreen, update CSS** - `f4c0fff` (feat)
3. **Task 3: Checkpoint verification** - approved by user

**Version bump:** `d71d0c1` (chore: bump to build 16)

## Files Created/Modified
- `src/components/MainMenu.tsx` - Complete rewrite with useRoom hook, state machine, inline online UI
- `src/types/game.ts` - Removed 'lobby' from screen union type
- `src/App.tsx` - Removed LobbyScreen import/JSX, wired onGameStart to MainMenu
- `src/App.css` - Removed all lobby-* classes, added menu-online-* classes, menu-help
- `src/components/LobbyScreen.tsx` - **Deleted**

## Decisions Made
- 4-state machine (idle/creating/joining/joined) instead of 3 — added 'joined' state for non-host players who successfully connected
- Hardcoded 4 players for Play Local (no selector needed)
- ? icon button bottom-left mirrors gear icon pattern for How to Play access

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed unused variable build error**
- **Found during:** Task 1 (MainMenu rewrite)
- **Issue:** `gamePrefs` import from old code caused TS6133 unused variable error
- **Fix:** Removed unused import
- **Verification:** `npx tsc --noEmit` passes clean

---

**Total deviations:** 1 auto-fixed (blocking)
**Impact on plan:** Minimal — just cleanup of removed feature's import.

## Issues Encountered
None

## Next Phase Readiness
- Phase 25 complete — unified MainMenu replaces separate LobbyScreen
- Ready for Phase 26: How to Play Content Refresh

---
*Phase: 25-multiplayer-screen-rework*
*Completed: 2026-03-06*
