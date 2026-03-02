---
phase: 09-multi-player-display
plan: 06
subsystem: ui
tags: [three.js, CircleGeometry, RingGeometry, goal-indicators, dice-settle]

# Dependency graph
requires:
  - phase: 09-multi-player-display
    provides: multi-player rows, lock animations, goal transitions
  - phase: 04-game-board-layout
    provides: GoalRow positioning, getSlotX, SLOT_COUNT
provides:
  - Goal column lock indicators (colored dots per player)
  - Tie rendering (split wedge circles)
  - Stacked dice soft-lock fix
affects: [screens-flow, audio-juice]

# Tech tracking
tech-stack:
  added: []
  patterns: [CircleGeometry theta params for pie-wedge rendering, fallback settle timer for stacked dice]

key-files:
  created: [src/components/GoalIndicators.tsx]
  modified: [src/components/Scene.tsx, src/components/GoalProfileGroup.tsx, src/components/HUD.tsx, src/components/DicePool.tsx]

key-decisions:
  - "3D CircleGeometry meshes over HTML overlays for indicator dots"
  - "Indicators positioned above goal row (Z offset -0.73) for visibility"
  - "500ms fallback settle timer for stacked dice instead of position-based checks"

patterns-established:
  - "CircleGeometry thetaStart/thetaLength for multi-player wedge indicators"
  - "Fallback timer pattern for physics edge cases (stacked bodies)"

issues-created: []

# Metrics
duration: 21min
completed: 2026-03-02
---

# Phase 9 Plan 6: Goal Column Indicators Summary

**Colored circle indicators under goal dice showing lock ownership per player, with split wedges for ties and a stacked-dice settle fix**

## Performance

- **Duration:** 21 min
- **Started:** 2026-03-02T07:06:24Z
- **Completed:** 2026-03-02T07:28:18Z
- **Tasks:** 2 auto + 1 checkpoint
- **Files modified:** 6

## Accomplishments
- GoalIndicators component renders colored 3D circles under each goal die for locked players
- Ties show split wedge circles (CircleGeometry theta params) with dark outline rings
- Repositioned indicators above goal row so they aren't hidden by dice
- Tuned gold star position/scale in GoalProfileGroup for visual centering
- Fixed stacked dice soft-lock with 500ms fallback settle timer

## Task Commits

Each task was committed atomically:

1. **Task 1: GoalIndicators component** - `ff3357a` (feat)
2. **Task 2: Tie handling with wedges** - `788a1df` (feat)
3. **Checkpoint polish: indicator repositioning + star tuning** - `85efc48` (fix)
4. **Stacked dice soft-lock fix** - `d6368ce` (fix)

**Version bump:** `e484815` (chore: 0.1.0.86)

## Files Created/Modified
- `src/components/GoalIndicators.tsx` - New component: colored dots/wedges under goal dice per locked player
- `src/components/Scene.tsx` - Wired GoalIndicators as sibling to GoalRow
- `src/components/GoalProfileGroup.tsx` - Star position (-7px) and scale (0.90) tuning
- `src/components/HUD.tsx` - Removed score display from top-right
- `src/components/DicePool.tsx` - Fallback settle timer for stacked dice

## Decisions Made
- 3D CircleGeometry meshes (not HTML overlays) for natural alignment with dice
- Indicators above goal row at Z offset -0.73 to avoid occlusion by goal dice
- RingGeometry dark outline (opacity 0.5) for visibility on wood surface
- Fallback timer approach (500ms) for stacked dice rather than position checks

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed stacked dice soft-lock**
- **Found during:** Checkpoint verification
- **Issue:** Die landing on another die caused continuous sleep/wake cycling, preventing onAllSettled from ever firing
- **Fix:** Added 500ms fallback timer — once all dice have reported face values, fires results even if some keep cycling
- **Files modified:** src/components/DicePool.tsx
- **Verification:** Build passes, normal rolls unaffected
- **Commit:** d6368ce

**2. [Rule 1 - Bug] Indicator positioning and star alignment**
- **Found during:** Checkpoint verification (user feedback)
- **Issue:** Indicators hidden under goal dice, star misaligned with indicator row
- **Fix:** Moved indicators above goal row (Z -0.73), tuned star offset (-7px) and scale (0.90)
- **Files modified:** GoalIndicators.tsx, GoalProfileGroup.tsx
- **Commit:** 85efc48

---

**Total deviations:** 2 auto-fixed (2 bugs from user feedback), 0 deferred
**Impact on plan:** Both fixes necessary for visual correctness and gameplay reliability. No scope creep.

## Issues Encountered
None beyond the deviations documented above.

## Next Phase Readiness
- Phase 9: Multi-Player Display is now COMPLETE (6/6 plans)
- All player rows, animations, and indicators implemented
- Ready for Phase 10: Screens & Flow

---
*Phase: 09-multi-player-display*
*Completed: 2026-03-02*
