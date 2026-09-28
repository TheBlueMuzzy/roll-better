---
phase: 03-dice-rolling
plan: 03
subsystem: physics, ui
tags: [rapier, r3f, dice-pool, boundary-walls, settle-detection]

# Dependency graph
requires:
  - phase: 03-dice-rolling/03-01
    provides: PhysicsDie with roll() and settle detection
  - phase: 03-dice-rolling/03-02
    provides: getFaceUp utility, onResult callback
provides:
  - RollingArea with invisible boundary walls
  - DicePool with multi-dice spawning and rollAll()
  - Per-die settle tracking with onAllSettled
  - DIE_SIZE constant (8.5 dice fit across arena)
  - Sorted results (ascending order)
affects: [game-board-layout, lerp-animation, core-game-logic]

# Tech tracking
tech-stack:
  added: []
  patterns: [per-die-boolean-settle-tracking, arena-bounds-constants, scaled-die-physics]

key-files:
  created: [src/components/RollingArea.tsx, src/components/DicePool.tsx]
  modified: [src/components/PhysicsDie.tsx, src/components/Scene.tsx]

key-decisions:
  - "DIE_SIZE = arena_width / 8.5 — sized so 8.5 dice fit across viewport for future row layout"
  - "Results sorted ascending — required for future lerp-to-row feature"
  - "Per-die boolean settle tracking over simple counter — handles dice bumping each other"
  - "Wall height 8 units — prevents dice escaping over walls at peak of roll arc"

patterns-established:
  - "DIE_SIZE exported from RollingArea for consistent sizing across components"
  - "onUnsettled callback pattern for robust multi-body physics tracking"

issues-created: []

# Metrics
duration: 28min
completed: 2026-02-28
---

# Phase 3 Plan 3: Boundary Walls, DicePool & All-Settled Detection Summary

**Invisible arena walls, 5-dice pool with grid spawning, robust all-settled detection with sorted results, die scaled for 8.5-across layout**

## Performance

- **Duration:** 28 min
- **Started:** 2026-02-28T22:45:05Z
- **Completed:** 2026-02-28T23:13:05Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 4 modified, 2 created

## Accomplishments
- Invisible boundary walls (4 CuboidColliders) prevent dice from leaving viewport
- DicePool component manages N dice with grid spawn positions and rollAll()
- Robust per-die settle tracking fires onAllSettled only when ALL dice are simultaneously settled
- Die scaled to DIE_SIZE ≈ 0.659 (8.5 fit across arena width) for future row layout
- Results sorted ascending for future lerp-to-row feature
- Phase 3: Dice Rolling is complete

## Task Commits

Each task was committed atomically:

1. **Task 1: Add invisible boundary walls** — `488b473` (feat)
2. **Task 2: Create DicePool with multi-dice spawning** — `ea8cb57` (feat)
3. **Bugfix: Remove invalid ThreeEvent import** — `857ed4d` (fix)
4. **Checkpoint feedback: Scale dice, sort results, fix settle** — `0d67674` (feat)

## Files Created/Modified
- `src/components/RollingArea.tsx` — Floor + 4 invisible wall colliders, ARENA_HALF_X/Z, DIE_SIZE constants
- `src/components/DicePool.tsx` — Multi-dice manager with rollAll(), grid spawn positions, per-die settle tracking
- `src/components/PhysicsDie.tsx` — Scaled collider/visual, onUnsettled callback, tuned impulse for smaller mass
- `src/components/Scene.tsx` — Uses RollingArea + DicePool, sorted results display

## Decisions Made
- DIE_SIZE = arena_width / 8.5 — user direction for future row layout where 8.5 dice fit across
- Results sorted ascending — user specified for future lerp-to-row feature
- Per-die boolean settle tracking — counter-based approach had race condition with multi-dice bumping
- Wall height 8 — dice at smaller mass fly higher than expected, need tall invisible walls

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ThreeEvent import crash**
- **Found during:** Task 1 (checkpoint verification)
- **Issue:** Subagent used `ThreeEvent` from `@react-three/fiber` which doesn't exist, causing white screen
- **Fix:** Removed import, simplified onFloorClick prop type to `() => void`
- **Files modified:** src/components/RollingArea.tsx
- **Verification:** App loads without errors
- **Committed in:** 857ed4d

**2. [Rule 1 - Bug] Dice escaping over walls**
- **Found during:** Checkpoint verification
- **Issue:** Smaller dice mass meant same impulse launched them 12-31 units high, over 6-unit walls
- **Fix:** Increased wall height to 8 (extends 0-16), tuned impulse to Y 6-9 for ~1s air time
- **Files modified:** src/components/RollingArea.tsx, src/components/PhysicsDie.tsx
- **Verification:** All 5 dice stay within bounds across multiple rolls
- **Committed in:** 0d67674

**3. [Rule 1 - Bug] Settle detection race condition**
- **Found during:** Checkpoint verification
- **Issue:** Simple counter allowed one die to double-settle (bump + re-settle), reaching count=5 before all dice finished
- **Fix:** Replaced counter with per-die boolean array + onUnsettled callback, hasFired guard
- **Files modified:** src/components/DicePool.tsx, src/components/PhysicsDie.tsx
- **Verification:** onAllSettled fires reliably with all 5 results
- **Committed in:** 0d67674

---

**Total deviations:** 3 auto-fixed (3 bugs), 0 deferred
**Impact on plan:** All fixes necessary for correct operation. No scope creep.

## Issues Encountered
None beyond the deviations documented above.

## Next Phase Readiness
- Phase 3: Dice Rolling is complete — all 3 plans executed
- Ready for Phase 4: Game Board Layout
- Die sizing and sorted results are prepared for the row layout in Phase 4/6

---
*Phase: 03-dice-rolling*
*Completed: 2026-02-28*
