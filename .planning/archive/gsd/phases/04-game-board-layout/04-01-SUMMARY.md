---
phase: 04-game-board-layout
plan: 01
subsystem: ui
tags: [r3f, three, layout, dice, goal-row]

# Dependency graph
requires:
  - phase: 02-premium-die
    provides: Die3D component for static rendering
  - phase: 03-dice-rolling
    provides: RollingArea walls, DicePool spawning, DIE_SIZE
provides:
  - GoalRow component with 8 static dice and face rotation utility
  - Vertical zone layout (goal top, rolling bottom)
  - Placement zone visual with distinct floor color
  - Exported layout constants (SLOT_SPACING, SLOT_COUNT, getSlotX, getRotationForFace)
  - Asymmetric rolling bounds (ROLLING_Z_MIN, ROLLING_Z_MAX)
affects: [04-02-player-row, 04-03-hud, 05-core-game-logic, 06-lerp-animation]

# Tech tracking
tech-stack:
  added: []
  patterns: [vertical zone layout, face rotation via Euler angles, placement zone overlay]

key-files:
  created: [src/components/GoalRow.tsx]
  modified: [src/components/Scene.tsx, src/components/RollingArea.tsx, src/components/DicePool.tsx]

key-decisions:
  - "ROLLING_Z_MIN = -1.7 (3 rows below Goal at Z=-3.8) — leaves room for player rows"
  - "Placement zone floor color #4a3020 (lighter wood) distinguishes non-rolling area"
  - "Goal test values [1,1,2,2,3,4,5,6] — sorted ascending per game rules"

patterns-established:
  - "getRotationForFace(value) utility for orienting static dice to show specific face"
  - "getSlotX(index) + SLOT_SPACING for consistent 8-slot horizontal positioning"
  - "Placement zone overlay mesh at y=0.001 to distinguish floor regions"

issues-created: [ISS-002]

# Metrics
duration: 20min
completed: 2026-02-28
---

# Phase 4 Plan 1: Goal Row + Vertical Zones Summary

**GoalRow component with 8 static dice, face rotation utility, and scene restructured into goal/placement/rolling vertical zones**

## Performance

- **Duration:** 20 min
- **Started:** 2026-02-28T23:36:06Z
- **Completed:** 2026-02-28T23:57:03Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 5

## Accomplishments
- GoalRow component rendering 8 static dice with correct face-up orientation
- Scene divided into 3 vertical zones: goal (top), placement (middle), rolling (bottom)
- Rolling area walls adjusted to asymmetric bounds (Z=-1.7 to Z=4.5)
- DicePool spawn repositioned to center of new rolling zone
- Exported layout constants for PlayerRow reuse (SLOT_SPACING, SLOT_COUNT, getSlotX)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create GoalRow component** — `498d2dc` (feat)
2. **Task 2: Restructure Scene into vertical zones** — `a2933d9` (feat)
3. **Task 3: Checkpoint verification** — fixes applied:
   - `0e40656` (fix: correct face rotations, adjust wall to Z=-1.7, add placement zone)
   - `65fbc0d` (fix: update test values to sorted order)
   - `6f6f458` (fix: stretch placement floor edge-to-edge, log ISS-002)

## Files Created/Modified
- `src/components/GoalRow.tsx` — New: 8-slot horizontal row with face rotation utility
- `src/components/Scene.tsx` — Added GoalRow + placement zone floor, removed Html result display
- `src/components/RollingArea.tsx` — Asymmetric rolling bounds (ROLLING_Z_MIN/MAX), adjusted walls
- `src/components/DicePool.tsx` — Spawn grid offset to rolling zone center

## Decisions Made
- ROLLING_Z_MIN = -1.7 (3 rows below Goal) — user direction for spacing
- Placement zone floor color #4a3020 — user direction to visually distinguish zones
- Goal test values [1,1,2,2,3,4,5,6] — user correction for sorted display

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Face rotation angles had swapped signs**
- **Found during:** Checkpoint verification
- **Issue:** getRotationForFace had Z-axis signs swapped for faces 2/5 and X-axis signs swapped for faces 3/4, showing wrong face values
- **Fix:** Swapped rotation signs for cases 2, 3, 4, 5
- **Files modified:** src/components/GoalRow.tsx
- **Verification:** Visual check confirmed correct face display
- **Committed in:** 0e40656

**2. [Rule 1 - Bug] Test values didn't match expected sorted order**
- **Found during:** Checkpoint verification (user feedback)
- **Issue:** Plan specified [1,2,3,4,5,6,1,2] but user expected sorted [1,1,2,2,3,4,5,6]
- **Fix:** Updated test values in Scene.tsx
- **Committed in:** 65fbc0d

**3. [Rule 1 - Bug] Placement zone floor too narrow**
- **Found during:** Checkpoint verification (user feedback)
- **Issue:** Floor used ARENA_HALF_X*2 (5.6) width, not reaching screen edges
- **Fix:** Changed to 10 units wide (matches main floor)
- **Committed in:** 6f6f458

### Deferred Enhancements

Logged to .planning/ISSUES.md for future consideration:
- ISS-002: Dice can cant against walls or each other, blocking face detection (discovered during checkpoint)

---

**Total deviations:** 3 auto-fixed (3 bugs from checkpoint feedback), 1 deferred
**Impact on plan:** All fixes were corrections caught during human verification. No scope creep.

## Issues Encountered
None beyond the checkpoint fixes documented above.

## Next Phase Readiness
- GoalRow and layout constants ready for PlayerRow (Plan 04-02)
- Rolling zone properly confined, placement zone visually distinct
- ISS-002 (dice canting) is a physics edge case — does not block layout work

---
*Phase: 04-game-board-layout*
*Completed: 2026-02-28*
