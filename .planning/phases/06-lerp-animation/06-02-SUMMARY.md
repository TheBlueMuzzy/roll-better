---
phase: 06-lerp-animation
plan: 02
subsystem: animation
tags: [r3f, useFrame, lerp, mitosis, shake, animation, physics-persistence]

# Dependency graph
requires:
  - phase: 06-lerp-animation
    provides: AnimatingDie component, position capture pipeline, lock lerp system
  - phase: 05-core-game-logic
    provides: unlock flow, confirmUnlock action, selectedForUnlock state
provides:
  - Pool dice position persistence after locking
  - MitosisDie component (lerp → shake → split animation)
  - Clear-spot algorithm for finding unoccupied pool positions
  - Lift-to-select visual for unlock phase
affects: [06-03-score-animations, 07-unlock-interaction]

# Tech tracking
tech-stack:
  added: []
  patterns: [multi-phase animation in single useFrame, pseudo-random shake via golden-ratio hash, center-preferring spatial placement]

key-files:
  created: [src/components/MitosisDie.tsx, src/utils/clearSpot.ts]
  modified: [src/types/game.ts, src/store/gameStore.ts, src/components/DicePool.tsx, src/components/Scene.tsx, src/components/PlayerRow.tsx, src/App.tsx]

key-decisions:
  - "Mitosis split over departure+spawn — communicates '1 die becomes 2' intuitively"
  - "Pool dice persist at physical positions — generation key still bumps (BUG-001) but uses saved positions"
  - "Lift-to-select instead of shrink — feels like picking the die up"
  - "Center-preferring clear-spot — picks closest to center with enough clearance"
  - "3-axis random shake with ramping direction change rate (15→60/sec)"

patterns-established:
  - "MitosisDie: 3-phase animation (lerp → shake → split) via single useFrame"
  - "findClearSpot: center-preferring spatial placement with minimum clearance"
  - "remainingDicePositions: position persistence across pool shrinks"

issues-created: []

# Metrics
duration: 19min
completed: 2026-03-01
---

# Phase 6 Plan 2: Pool Persistence + Mitosis Unlock Animation Summary

**Pool dice stay where they land after locking, selected unlock dice lift then fly to pool with 3-axis shake and mitosis split into two dice**

## Performance

- **Duration:** 19 min
- **Started:** 2026-03-01T19:51:53Z
- **Completed:** 2026-03-01T20:10:56Z
- **Tasks:** 4 (3 auto + 1 checkpoint)
- **Files modified:** 8 (2 new, 6 modified)

## Accomplishments
- Pool dice persist at their physical resting positions after locking — no more snap to centered grid
- Selected unlock dice translate UP (lifted off) instead of shrinking — feels like being picked up
- MitosisDie component: 3-phase animation (0.5s lerp → 0.8s 3-axis shake → 0.4s split)
- Clear-spot algorithm prefers center of rolling area, moves outward only if occupied
- Shake uses random 3-axis direction changes ramping from 15/sec to 60/sec

## Task Commits

Each task was committed atomically:

1. **Task 1: Pool dice position persistence** - `c96b9fb` (feat)
2. **Task 2: Unlock selection lift** - `b280b73` (feat)
3. **Task 3: Mitosis unlock animation** - `972542a` (feat)
4. **Checkpoint tuning: shake + clear-spot** - `e55ff5f` (fix)

## Files Created/Modified
- `src/components/MitosisDie.tsx` - NEW: 3-phase mitosis animation (lerp → shake → split)
- `src/utils/clearSpot.ts` - NEW: Center-preferring clear-spot finder with minimum clearance
- `src/types/game.ts` - Added UnlockAnimation interface, remainingDicePositions + unlockAnimations to RoundState
- `src/store/gameStore.ts` - Computes remainingDicePositions in setRollResults, setUnlockAnimations/clearUnlockAnimations actions
- `src/components/DicePool.tsx` - Uses remainingDicePositions for spawn positions on pool shrink
- `src/components/Scene.tsx` - Renders MitosisDie outside Physics, passes remainingDicePositions to DicePool
- `src/components/PlayerRow.tsx` - Lift-to-select visual, hides slots during mitosis animation
- `src/App.tsx` - handleConfirmUnlock builds animation data with clear-spot, 1.8s timeout, double-tap guard

## Decisions Made
- Mitosis split chosen over departure+spawn — user feedback: original felt disconnected, mitosis communicates "1→2" intuitively
- Pool position persistence via remainingDicePositions — generation key BUG-001 fix preserved, but spawn positions come from actual physics positions
- Lift instead of shrink for selection — user vision: "looks like they're being picked up"
- Center-preferring placement — user feedback: unlocked dice should land near center, not far edges
- 3-axis random shake with ramping rate — user feedback: should shake in all directions, speed should build

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Double-tap guard on UNLOCK button**
- **Found during:** Task 3 (mitosis animation)
- **Issue:** Tapping UNLOCK twice during animation window would trigger duplicate animations and double state mutation
- **Fix:** Added guard: `if (state.roundState.unlockAnimations.length > 0) return`
- **Files modified:** src/App.tsx
- **Verification:** Double-tapping UNLOCK during animation does nothing
- **Committed in:** 972542a (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (double-tap guard)
**Impact on plan:** Essential for correctness. No scope creep.

## Issues Encountered
- Original 06-02 plan (departure+spawn) was rejected at checkpoint — user provided new mitosis vision. Plan was reverted and re-written. All original commits reverted cleanly.

## Next Phase Readiness
- MitosisDie and clearSpot ready for reuse if needed
- Pool position persistence benefits all future pool interactions
- Ready for 06-03 (score + round animations)

---
*Phase: 06-lerp-animation*
*Completed: 2026-03-01*
