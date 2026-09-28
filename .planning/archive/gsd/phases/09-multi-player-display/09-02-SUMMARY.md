---
phase: 09-multi-player-display
plan: 02
subsystem: ui
tags: [animation, r3f, useFrame, goal-row, transitions]

# Dependency graph
requires:
  - phase: 06-lerp-animation
    provides: Goal row transition system (goalTransition state, staggered animation pattern)
  - phase: 09-multi-player-display/01
    provides: GoalProfileGroup star icon positioning, layout constants
provides:
  - Directional goal dice exit (fast rightward slide)
  - Star-origin goal dice enter (scale-up + tumble from star icon)
  - Centered unlock/skip button in pool area
affects: [09-multi-player-display, 10-screens-flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inner-group animation override: useFrame drives position/rotation/scale on inner wrapper while outer group holds static face rotation and die scale"
    - "Star-relative local offset: (STAR_WORLD_X - getSlotX(i)) / DIE_SIZE converts world coords to inner-group local space"

key-files:
  created: []
  modified:
    - src/components/GoalRow.tsx
    - src/components/HUD.tsx
    - src/App.css
    - src/App.tsx

key-decisions:
  - "Inner wrapper animation (approach b): all animation applied to inner group ref, outer group retains static position/rotation/scale"
  - "Unified unlock/skip button: single centered button replaces separate bottom-positioned buttons"
  - "3 players default: bumped from 2 to 3 (1 human + 2 AI)"

patterns-established:
  - "Star-origin emergence: compute star position as getSlotX(0) - 0.9, convert to local space per-die"

issues-created: []

# Metrics
duration: 23min
completed: 2026-03-02
---

# Phase 9 Plan 02: Goal Transitions Summary

**Directional goal dice transitions — fast rightward exit, star-origin emergence enter with tumble — plus centered unlock/skip button and 2nd AI player**

## Performance

- **Duration:** 23 min
- **Started:** 2026-03-02T05:18:23Z
- **Completed:** 2026-03-02T05:42:03Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 4

## Accomplishments
- Goal exit reworked: fast rightward slide with 15ms stagger, no rotation, easeIn acceleration
- Goal enter reworked: dice emerge from star icon at scale 0, tumble during flight, scale up to full, snap to correct face on arrival
- Unified unlock/skip button centered in pool area (55% vertical)
- Tips repositioned below the goal/pool divider line
- Added 2nd AI player (3 total)

## Task Commits

Each task was committed atomically:

1. **Task 1: Rework goal exit** - `0dd8091` (feat)
2. **Task 2: Rework goal enter** - `4669c30` (feat)
3. **Checkpoint feedback: UI tweaks** - `1057665` (feat) + `135cbb8` (feat)

## Files Created/Modified
- `src/components/GoalRow.tsx` - Reworked exit (rightward slide) and enter (star-origin emergence with scale + tumble) animations
- `src/components/HUD.tsx` - Unified unlock/skip button rendering, centered in pool area
- `src/App.css` - Tip banner repositioned to 36%, new hud-skip-btn styles, removed old hud-unlock-btn
- `src/App.tsx` - Player count 2 → 3

## Decisions Made
- Used inner-wrapper animation approach: all animation (position, rotation, scale) applied to inner group ref via useFrame, outer group retains static getRotationForFace and DIE_SIZE scale
- Star X position computed as `getSlotX(0) - 0.9` matching GoalProfileGroup placement in Scene.tsx
- Unified SKIP and UNLOCK into single centered button (user feedback during checkpoint)

## Deviations from Plan

### Checkpoint Feedback Additions

**1. Tip banner repositioned**
- **Found during:** Checkpoint verification
- **Issue:** Tips at top of screen felt disconnected from gameplay
- **Fix:** Moved from `top: 44px` to `top: 36%` (just below divider line)
- **Committed in:** `1057665`

**2. Skip/Unlock button unified and centered**
- **Found during:** Checkpoint verification
- **Issue:** Skip button at bottom felt too far from action; unlock should match
- **Fix:** Both buttons now render centered at 55% vertical in pool area
- **Committed in:** `1057665`, `135cbb8`

**3. Added 2nd AI player**
- **Found during:** Checkpoint verification
- **Issue:** User wanted more players visible for testing
- **Fix:** Changed `initGame(2)` → `initGame(3)`
- **Committed in:** `1057665`

---

**Total deviations:** 3 (all from checkpoint feedback, user-directed)
**Impact on plan:** No scope creep — all changes were user-requested UI adjustments during verification.

## Issues Encountered
None

## Next Phase Readiness
- Goal transitions complete with new visual language (star-origin emergence)
- Ready for 09-03 (goal circle indicators)

---
*Phase: 09-multi-player-display*
*Completed: 2026-03-02*
