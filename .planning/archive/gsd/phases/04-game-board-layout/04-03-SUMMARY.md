---
phase: 04-game-board-layout
plan: 03
subsystem: ui
tags: [react, html-overlay, hud, layout, forwardRef]

# Dependency graph
requires:
  - phase: 04-game-board-layout (plan 01)
    provides: GoalRow, layout constants, rolling zone bounds
  - phase: 04-game-board-layout (plan 02)
    provides: PlayerRow, PlayerIcon
  - phase: 03-dice-rolling
    provides: DicePool with rollAll, settle detection, results
provides:
  - HUD overlay with score, round, and roll status text
  - Scene forwardRef exposing rollAll for external triggering
  - Lifted isRolling/diceResults state to App for cross-component access
  - Visual zone divider between player row and rolling area
  - Organized test data constants for Phase 5 handoff
affects: [core-game-logic, lerp-animation, screens-and-flow]

# Tech tracking
tech-stack:
  added: []
  patterns: [forwardRef/useImperativeHandle for cross-component actions, HTML overlay sibling to Canvas]

key-files:
  created: [src/components/HUD.tsx]
  modified: [src/components/Scene.tsx, src/App.tsx, src/App.css]

key-decisions:
  - "HUD as HTML sibling to Canvas (not inside R3F) — simpler, better text rendering"
  - "forwardRef on Scene to expose rollAll — explicit over store coupling"
  - "Tap-text instead of button — 'Tap To Roll' → 'Rolling' → results"
  - "Subtle zone divider at ROLLING_Z_MIN boundary (opacity 0.12)"

patterns-established:
  - "Scene exposes imperative API via forwardRef + useImperativeHandle"
  - "App lifts state (isRolling, diceResults) for HTML/Canvas coordination"
  - "Test data organized as labeled constants at top of Scene.tsx"

issues-created: []

# Metrics
duration: 15min
completed: 2026-03-01
---

# Phase 4 Plan 3: HUD + Final Layout Summary

**HUD overlay with tap-to-roll text, score/round display, Scene forwardRef, and final layout tuning with zone divider**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-01T00:22:17Z
- **Completed:** 2026-03-01T04:58:08Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 4

## Accomplishments
- HUD component (HTML overlay) with three-state roll text: "Tap To Roll" → "Rolling" → comma-separated results
- Score display (0/20) and round indicator at top of screen
- Scene wrapped in forwardRef exposing rollAll for external triggering
- isRolling and diceResults state lifted to App for HUD access
- Subtle white divider line between player row and rolling area
- Test data organized into labeled constants for Phase 5 handoff

## Task Commits

Each task was committed atomically:

1. **Task 1: Create HUD overlay with roll button** — `8b6c756` (feat)
2. **Task 2: Layout spacing and test data organization** — `da1426d` (refactor)
3. **Checkpoint fix: Simplify HUD to tap-text** — `c4f83e7` (fix)

## Files Created/Modified
- `src/components/HUD.tsx` — New: HTML overlay with score, round, tap-to-roll status text
- `src/components/Scene.tsx` — forwardRef + useImperativeHandle, onRollStart/onResults callbacks, test data constants, zone divider mesh
- `src/App.tsx` — sceneRef, lifted isRolling/diceResults state, HUD rendered as Canvas sibling
- `src/App.css` — HUD styles (.hud, .hud-top, .hud-bottom, .hud-status)

## Decisions Made
- HUD as HTML sibling to Canvas (not inside R3F) — simpler, standard DOM text rendering
- forwardRef on Scene to expose rollAll — explicit and avoids Zustand store coupling
- Simplified to tap-text per user direction — no button needed, just functional text states
- Zone divider at ROLLING_Z_MIN with opacity 0.12 — subtle visual separation

## Deviations from Plan

### Checkpoint Adjustments

**1. [User Direction] Simplified HUD from button to tap-text**
- **Found during:** Checkpoint verification
- **Direction:** User requested "Tap To Roll" text instead of styled button
- **Change:** Replaced `<button>` with clickable `<span>`, three text states instead of button states
- **Files modified:** src/components/HUD.tsx, src/App.css
- **Committed in:** c4f83e7

---

**Total deviations:** 1 user-directed simplification
**Impact on plan:** Reduced complexity per user preference. No scope creep.

## Issues Encountered
None

## Next Phase Readiness
- Phase 4 complete — full game board layout established
- All visual zones present: Goal row → Player row → Rolling area → HUD
- Test data in Scene.tsx organized as labeled constants, ready for Phase 5 replacement
- Scene exposes rollAll via ref, App manages isRolling/diceResults — ready for game state integration
- Ready for Phase 5: Core Game Logic — game state machine, goal generation, match detection, scoring

---
*Phase: 04-game-board-layout*
*Completed: 2026-03-01*
