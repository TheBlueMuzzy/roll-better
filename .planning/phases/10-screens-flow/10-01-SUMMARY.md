---
phase: 10-screens-flow
plan: 01
subsystem: ui
tags: [react, zustand, css, menu, screen-management]

# Dependency graph
requires:
  - phase: 09-multi-player-display
    provides: complete game screen with all player rows and animations
  - phase: 05-core-game-logic
    provides: initGame(playerCount, difficulty) and initRound() API
provides:
  - MainMenu screen component with player count and difficulty selection
  - Screen state management (menu | game | winners) in Zustand store
  - Menu ↔ game screen transitions
affects: [10-02-winners-screen, 10-03-settings-transitions]

# Tech tracking
tech-stack:
  added: []
  patterns: [screen-state-routing, menu-overlay-z70]

key-files:
  created: [src/components/MainMenu.tsx]
  modified: [src/types/game.ts, src/store/gameStore.ts, src/App.tsx, src/components/Settings.tsx, src/App.css]

key-decisions:
  - "Screen state as simple string union in Zustand (not React Router)"
  - "Menu at z-index 70 (above settings z-50 and H2P z-60)"
  - "Canvas/HUD don't render on menu screen (saves GPU)"
  - "Settings quit renamed to 'Main Menu', navigates via setScreen"

patterns-established:
  - "Screen routing: conditional render based on store.screen value"
  - "Menu overlay: full-screen HTML with z-index 70, dark background"

issues-created: []

# Metrics
duration: 64min
completed: 2026-03-02
---

# Phase 10 Plan 01: Main Menu Summary

**Main Menu with title branding, player count (2/3/4) and difficulty (Easy/Medium/Hard) selectors, Play button, and screen state routing via Zustand**

## Performance

- **Duration:** 64 min
- **Started:** 2026-03-02T14:32:04Z
- **Completed:** 2026-03-02T15:36:40Z
- **Tasks:** 2 auto + 1 checkpoint
- **Files modified:** 6

## Accomplishments
- MainMenu.tsx component: title, subtitle, player count selector, difficulty selector, Play button, Coming Soon placeholder, settings gear
- Screen state (`'menu' | 'game' | 'winners'`) added to Zustand store with setScreen action
- App starts at menu instead of auto-starting gameplay — Canvas/HUD only mount when screen === 'game'
- Settings "Quit Game" replaced with "Main Menu" button that returns to menu via setScreen

## Task Commits

Each task was committed atomically:

1. **Task 1: Add screen state and MainMenu component** - `e8b174e` (feat)
2. **Task 2: Wire menu into App.tsx** - `e803619` (feat)

## Files Created/Modified
- `src/components/MainMenu.tsx` - New: full-screen menu overlay with selectors and Play button
- `src/types/game.ts` - Added screen field to GameState type
- `src/store/gameStore.ts` - Added screen initial state and setScreen action
- `src/App.tsx` - Removed auto-start, added handlePlay callback and conditional rendering
- `src/components/Settings.tsx` - Quit → Main Menu, uses setScreen instead of initGame
- `src/App.css` - Added all menu-* CSS classes (backdrop, title, selectors, play button)

## Decisions Made
- Screen state as simple string union in Zustand — no need for React Router in a single-page game
- Menu at z-index 70 (above settings z-50 and H2P z-60) — consistent layering
- Canvas and HUD don't render while on menu screen — saves GPU resources
- Settings "Quit Game" renamed to "Main Menu" for clarity

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Screen state foundation ready for 10-02 (Winners Screen — will use screen='winners')
- Menu → game → menu cycles work cleanly
- Settings overlay works on both menu and game screens

---
*Phase: 10-screens-flow*
*Completed: 2026-03-02*
