---
phase: 22-main-menu-restructure
plan: 01
subsystem: ui
tags: [react, css, main-menu, how-to-play]

# Dependency graph
requires:
  - phase: 10-screens-flow
    provides: MainMenu component, screen routing
provides:
  - Simplified MainMenu without difficulty selector
  - How to Play accessible from main menu
  - Upgrades placeholder button
affects: [23-settings-controls, 24-ai-difficulty, 26-how-to-play-refresh]

# Tech tracking
tech-stack:
  added: []
  patterns: [menu-links wrapper for grouped bottom links, menu-link-btn class]

key-files:
  modified: [src/components/MainMenu.tsx, src/App.tsx, src/App.css]

key-decisions:
  - "Default to 'medium' AI difficulty when difficulty selector removed"
  - "Group How to Play + Upgrades + Settings in .menu-links flex wrapper"

patterns-established:
  - "menu-link-btn: text-style button for secondary menu actions"
  - "menu-coming-soon-label: small uppercase badge for disabled features"

issues-created: []

# Metrics
duration: 18min
completed: 2026-03-05
---

# Phase 22 Plan 01: Simplify Main Menu Summary

**Removed difficulty selector, added How to Play and Upgrades buttons with grouped link layout at bottom of main menu**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-05T23:32:49Z
- **Completed:** 2026-03-05T23:50:45Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 3

## Accomplishments
- Removed DIFFICULTIES constant, difficulty state, and difficulty selector UI from MainMenu
- Changed onPlay signature to (playerCount: number), defaulting to 'medium' in App.tsx
- Added How to Play button on main menu that opens the existing carousel modal
- Added disabled Upgrades button with "Coming Soon" label
- Grouped How to Play, Upgrades, and Settings in a .menu-links wrapper

## Task Commits

Each task was committed atomically:

1. **Task 1: Restructure MainMenu and wire How to Play** - `6dd1fad` (feat)
2. **Task 2: Update CSS for menu layout** - `8355d6b` (style)
3. **Version bump** - `5b34c68` (chore)

**Plan metadata:** (this commit) (docs: complete plan)

## Files Created/Modified
- `src/components/MainMenu.tsx` - Removed difficulty selector, added onOpenHowToPlay prop, How to Play + Upgrades buttons
- `src/App.tsx` - Updated handlePlay to single arg with 'medium' default, passed onOpenHowToPlay to MainMenu
- `src/App.css` - Added .menu-links, .menu-link-btn, .menu-upgrades-btn, .menu-coming-soon-label styles

## Decisions Made
- Default to 'medium' AI difficulty — Phase 24 will randomize per-AI, so hardcoded default is temporary
- Grouped link buttons in .menu-links wrapper for consistent spacing and layout

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Menu restructure complete, ready for Phase 22 plan 02 (if any) or Phase 23
- Settings link remains in MainMenu (Phase 23 will rework it to gear icon)
- How to Play still accessible from Settings too (Phase 23 will clean up)

---
*Phase: 22-main-menu-restructure*
*Completed: 2026-03-05*
