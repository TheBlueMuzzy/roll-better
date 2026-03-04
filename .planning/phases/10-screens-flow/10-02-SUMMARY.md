---
phase: 10-screens-flow
plan: 02
subsystem: ui
tags: [react, zustand, css-animation, screen-flow, winners]

# Dependency graph
requires:
  - phase: 10-screens-flow/01
    provides: Screen state system ('menu' | 'game' | 'winners'), MainMenu pattern
  - phase: 05-core-game-logic
    provides: checkSessionEnd(), scoreRound(), sessionTargetScore
provides:
  - WinnersScreen overlay with ranked results, winner highlight, stagger animation
  - Play Again flow (re-init same settings)
  - Menu return from winners screen
  - Complete session end → winners transition
affects: [12-responsive-ui, 13-audio-juice]

# Tech tracking
tech-stack:
  added: []
  patterns: [single-timeout session transition, drei Html zIndexRange layering]

key-files:
  created: [src/components/WinnersScreen.tsx]
  modified: [src/App.tsx, src/App.css, src/components/HUD.tsx, src/components/PlayerProfileGroup.tsx]

key-decisions:
  - "Combined setPhase + setScreen in single timeout to avoid React effect cleanup race"
  - "Capped PlayerProfileGroup Html zIndexRange to [40,0] so all overlays cover them"

patterns-established:
  - "Single timeout for multi-state transitions in React effects to prevent cleanup races"

issues-created: []

# Metrics
duration: 53min
completed: 2026-03-02
---

# Phase 10 Plan 02: Winners Screen Summary

**Winners Screen overlay with ranked results, stagger animation, play-again/menu navigation, and session end transition fix**

## Performance

- **Duration:** 53 min
- **Started:** 2026-03-02T16:22:50Z
- **Completed:** 2026-03-02T17:16:32Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 5

## Accomplishments
- WinnersScreen component with ranked player list, trophy for 1st, colored avatars, gold winner highlight
- Stagger-in CSS animation on player rows (100ms delay each)
- Session end flow: roundEnd → sessionEnd + winners screen in single timeout
- Play Again replays with same player count and AI difficulty
- Menu button returns to main menu
- HUD no longer shows conflicting "Game Over" text during sessionEnd

## Task Commits

Each task was committed atomically:

1. **Task 1: Create WinnersScreen component** - `4883668` (feat)
2. **Task 2: Wire winners screen into session end flow** - `53b2b55` (feat)
3. **Bug fix: Session end timeout race + profile z-index** - `34285af` (fix)

## Files Created/Modified
- `src/components/WinnersScreen.tsx` - Full-screen overlay: ranked players, winner announcement, tie handling, Play Again + Menu buttons
- `src/App.css` - Winners screen styles: backdrop, heading, ranked rows with stagger animation, gold winner highlight, buttons
- `src/App.tsx` - Session end flow, WinnersScreen rendering, handlePlayAgain/handleMenu callbacks
- `src/components/HUD.tsx` - Removed "Game Over! Score: X" text for sessionEnd phase
- `src/components/PlayerProfileGroup.tsx` - Capped Html zIndexRange to [40,0]

## Decisions Made
- Combined setPhase('sessionEnd') + setScreen('winners') into a single setTimeout to prevent React effect cleanup from cancelling the screen transition
- Capped drei Html zIndexRange on PlayerProfileGroup to [40,0] so it stays below all overlay z-indexes (settings z-50, H2P z-60, menu/winners z-70)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Session end timeout race condition**
- **Found during:** Checkpoint verification (Task 3)
- **Issue:** Two separate timeouts (500ms for phase, 1000ms for screen) — when the first fired and changed `phase`, React re-ran the effect and cleanup cancelled the second timeout. Screen never transitioned to 'winners', soft-locking the game.
- **Fix:** Combined both state changes into a single 500ms timeout
- **Files modified:** src/App.tsx
- **Verification:** Winners screen now appears reliably after session end
- **Committed in:** 34285af

**2. [Rule 1 - Bug] PlayerProfileGroup Html z-index above overlays**
- **Found during:** Checkpoint verification (Task 3)
- **Issue:** drei's `<Html>` defaults to zIndexRange [16777271, 0], rendering profile groups above the winners overlay (z-70)
- **Fix:** Set `zIndexRange={[40, 0]}` on PlayerProfileGroup's Html component
- **Files modified:** src/components/PlayerProfileGroup.tsx
- **Verification:** Profile groups now dim behind winners overlay correctly
- **Committed in:** 34285af

---

**Total deviations:** 2 auto-fixed (2 bugs), 0 deferred
**Impact on plan:** Both fixes necessary for correct winners screen display. No scope creep.

## Issues Encountered
None beyond the deviations above.

## Next Phase Readiness
- Winners screen complete and verified
- Ready for 10-03-PLAN.md (Settings screen + screen transitions)

---
*Phase: 10-screens-flow*
*Completed: 2026-03-02*
