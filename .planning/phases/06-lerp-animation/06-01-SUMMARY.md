---
phase: 06-lerp-animation
plan: 01
subsystem: animation
tags: [r3f, useFrame, lerp, ease-in-out, three.js, animation]

# Dependency graph
requires:
  - phase: 05-core-game-logic
    provides: auto-lock system, phase transitions, sorted roll results
  - phase: 03-dice-rolling
    provides: PhysicsDie settle detection, DicePool sorted results pipeline
provides:
  - AnimatingDie reusable component (ease-in-out cubic + parabolic arc)
  - Position capture pipeline (PhysicsDie reports world position on settle)
  - LockAnimation store state + clearLockAnimations action
  - animatingSlotIndices for visual overlap prevention
affects: [06-02-unlock-animation, 06-03-score-animations]

# Tech tracking
tech-stack:
  added: []
  patterns: [useFrame ref mutation for lerp animation, parallel array sorting for position tracking, ease-in-out cubic easing]

key-files:
  created: [src/components/AnimatingDie.tsx]
  modified: [src/components/PhysicsDie.tsx, src/components/DicePool.tsx, src/types/game.ts, src/store/gameStore.ts, src/components/Scene.tsx, src/components/PlayerRow.tsx]

key-decisions:
  - "Ease-in-out cubic easing (user feedback: much better feel than ease-out only)"
  - "Parabolic Y arc via sin(t*PI)*0.8 for lob feel during flight"
  - "AnimatingDie renders outside Physics group (visual-only, no physics body)"
  - "animatingSlotIndices hides PlayerRow dice during flight to prevent overlap"

patterns-established:
  - "AnimatingDie: reusable lerp component with fromPos/toPos/value/color/duration/onComplete"
  - "Position capture: PhysicsDie reads body.translation() on settle, passes with face value"
  - "Parallel sorting: positions array sorted alongside values to maintain index alignment"

issues-created: []

# Metrics
duration: 36min
completed: 2026-03-01
---

# Phase 6 Plan 1: Lock Lerp System Summary

**Matched dice fly from settled physics positions to player row slots with ease-in-out cubic lerp and parabolic Y arc using reusable AnimatingDie component**

## Performance

- **Duration:** 36 min
- **Started:** 2026-03-01T18:51:18Z
- **Completed:** 2026-03-01T19:28:05Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 7 (1 new, 6 modified)

## Accomplishments
- Position capture pipeline: PhysicsDie reports world position on settle, DicePool passes sorted positions alongside values
- LockAnimation data type and store state: computed in setRollResults when locks found, with from/to positions for each matched die
- AnimatingDie component: ease-in-out cubic easing, parabolic Y arc, correct face rotation, completion callback with double-fire guard
- Visual integration: Scene renders flying dice outside Physics, PlayerRow hides animating slots to prevent overlap
- Easing refined from ease-out to ease-in-out cubic based on checkpoint feedback

## Task Commits

Each task was committed atomically:

1. **Task 1: Position capture pipeline and animation data types** - `36226e6` (feat)
2. **Task 2: AnimatingDie component and visual integration** - `05934bb` (feat)
3. **Checkpoint: Easing fix to ease-in-out** - `7f3ac0e` (fix)

## Files Created/Modified
- `src/components/AnimatingDie.tsx` - NEW: Reusable lerp animation component with useFrame
- `src/types/game.ts` - Added LockAnimation interface, lockAnimations + animatingSlotIndices to RoundState
- `src/components/PhysicsDie.tsx` - Reports world position alongside face value on settle
- `src/components/DicePool.tsx` - Parallel positions array, sorted alongside values, passed to onAllSettled
- `src/store/gameStore.ts` - lockAnimations/animatingSlotIndices state, clearLockAnimations action, setRollResults computes animations
- `src/components/Scene.tsx` - Renders AnimatingDie instances outside Physics, tracks completion, passes animatingSlotIndices to PlayerRow
- `src/components/PlayerRow.tsx` - Accepts animatingSlotIndices prop, hides dice during flight animation

## Decisions Made
- Ease-in-out cubic chosen over ease-out only (user feedback: "MUCH better")
- Lock-to-position mapping reconstructed by grouping locks by value then consuming in sorted order (findAutoLocks returns {goalSlotIndex, value} not rolledIndex)
- 0.6s animation duration within existing 1s locking delay — no App.tsx timing changes needed

## Deviations from Plan

### Auto-fixed Issues

**1. [Checkpoint feedback] Changed easing from ease-out to ease-in-out cubic**
- **Found during:** Checkpoint verification
- **Issue:** Ease-out only felt wrong — die started moving at full speed
- **Fix:** Changed to ease-in-out cubic: `t < 0.5 ? 4*t*t*t : 1 - pow(-2*t+2, 3)/2`
- **Files modified:** src/components/AnimatingDie.tsx
- **Verification:** User approved: "fantastic. MUCH better"
- **Committed in:** 7f3ac0e

---

**Total deviations:** 1 (easing refinement from checkpoint feedback)
**Impact on plan:** Improved animation quality. No scope creep.

## Issues Encountered
None

## Next Phase Readiness
- AnimatingDie component ready for reuse in 06-02 (unlock lerp — reverse direction)
- Position capture pipeline established for any future die-tracking needs
- No blockers for 06-02

---
*Phase: 06-lerp-animation*
*Completed: 2026-03-01*
