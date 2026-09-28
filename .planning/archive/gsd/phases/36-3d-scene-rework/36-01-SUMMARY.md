---
phase: 36-3d-scene-rework
plan: 01
subsystem: ui
tags: [r3f, rapier, three.js, landscape, physics]

# Dependency graph
requires:
  - phase: 35-layout-foundation
    provides: 16:9 viewport, vh-based CSS tokens, fixed 55° camera FOV
provides:
  - Wider landscape arena (ARENA_HALF_X=3.8, total 7.6 units)
  - Repositioned goal row at Z=-3.2 with DIE_SIZE-derived spacing
  - Full-viewport visual floor coverage (24x16 rolling, 24-wide placement)
  - Physics walls at new landscape boundaries
affects: [36-02 player rows, 37 HUD redesign]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - DIE_SIZE derived from ARENA_HALF_X (auto-scales downstream)
    - SLOT_SPACING derived from DIE_SIZE * 1.05 (auto-scales with arena)
    - Visual floors sized to fill camera visible range (~22x12.5 units)

key-files:
  created: []
  modified:
    - src/components/RollingArea.tsx
    - src/components/Scene.tsx
    - src/components/GoalRow.tsx
    - src/components/GoalIndicators.tsx

key-decisions:
  - "Visual floors extend to 24 units wide to fill full landscape viewport, independent of physics arena width"
  - "getSlotX simplified to (index - 3.5) * SLOT_SPACING — removed portrait-era manual nudge constants"
  - "EXIT_DISTANCE increased to 12 for wider arena off-screen exits"

patterns-established:
  - "Visual floor size decoupled from physics arena — floors fill viewport, walls define gameplay bounds"

issues-created: []

# Metrics
duration: 59min
completed: 2026-03-12
---

# Phase 36 Plan 01: Arena & Goal Row Summary

**Landscape arena with 3.8 half-width, repositioned goal row at Z=-3.2, DIE_SIZE-derived spacing, full-viewport floor coverage**

## Performance

- **Duration:** 59 min
- **Started:** 2026-03-12T19:34:10Z
- **Completed:** 2026-03-12T20:34:07Z
- **Tasks:** 3 (2 auto + 1 verify checkpoint)
- **Files modified:** 4

## Accomplishments
- Arena widened from ARENA_HALF_X=2.8 to 3.8 (total 7.6 units), DIE_SIZE auto-derived to ~0.8
- Rolling zone compressed: Z_MIN=-0.5, Z_MAX=3.5 (was -1.7 to 4.5)
- Goal row repositioned to Z=-3.2 with SLOT_SPACING = DIE_SIZE * 1.05
- getSlotX simplified to clean `(index - 3.5) * SLOT_SPACING` formula
- Visual floors extended to 24-unit width filling entire landscape viewport
- Placement zone floor repositioned for new goal row location

## Task Commits

Each task was committed atomically:

1. **Task 1: Widen arena dimensions and update physics walls** - `b067cba` (feat)
2. **Task 2: Update scene layout and reposition goal row** - `ae2d58c` (feat)
3. **Task 3: Visual verification checkpoint** - self-verified via Playwright screenshot

**Checkpoint fix:** `59beb25` (fix) — floor meshes too small, extended to fill viewport

## Files Created/Modified
- `src/components/RollingArea.tsx` - ARENA_HALF_X=3.8, Z bounds compressed, floor mesh 24x16
- `src/components/Scene.tsx` - Placement zone floor 24-wide, goal row Z=-3.2, divider at new Z_MIN
- `src/components/GoalRow.tsx` - SLOT_SPACING=DIE_SIZE*1.05, getSlotX simplified, EXIT_DISTANCE=12
- `src/components/GoalIndicators.tsx` - Default Z updated to -3.2

## Decisions Made
- Visual floor planes sized independently of physics arena (24 units fills ~22-unit visible range with margin)
- Removed portrait-era getSlotX nudge constants — clean centering formula instead
- EXIT_DISTANCE bumped from 8 to 12 for wider arena

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Floor meshes too narrow for landscape viewport**
- **Found during:** Task 3 (visual verification via Playwright)
- **Issue:** RollingArea floor was hardcoded 10x10, placement zone was ARENA_HALF_X*2+2 (9.6). Both left large empty areas in the ~22-unit visible range.
- **Fix:** Extended rolling floor to 24x16, placement zone to 24 width
- **Files modified:** src/components/RollingArea.tsx, src/components/Scene.tsx
- **Verification:** Playwright screenshot confirms full viewport coverage
- **Commit:** 59beb25

### Deferred Enhancements

None.

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential for visual correctness — floor must fill viewport. No scope creep.

## Issues Encountered
None

## Next Phase Readiness
- Arena dimensions and goal row complete for landscape
- Ready for 36-02: Player rows, dice pool & animation positions
- Player rows currently at portrait-era Z positions (stacked vertically) — Plan 02 fixes this

---
*Phase: 36-3d-scene-rework*
*Completed: 2026-03-12*
