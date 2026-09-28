---
phase: 09-multi-player-display
plan: 01
subsystem: ui
tags: [drei, html-overlay, profile, layout, dice-scaling]

# Dependency graph
requires:
  - phase: 04-game-board-layout
    provides: GoalRow, PlayerRow, getSlotX, DIE_SIZE layout system
  - phase: 06-lerp-animation
    provides: AnimatingDie, lock/unlock lerp system
  - phase: 08-ai-opponents
    provides: Multi-player state, AI player rows
provides:
  - PlayerProfileGroup component (avatar + star-score + dice stats)
  - GoalProfileGroup component (star icon for goal row)
  - Scaled-down dice with breathing room in rows
  - Left-side avatar space via shifted row origin
affects: [09-multi-player-display, 10-screens-flow]

# Tech tracking
tech-stack:
  added: []
  patterns: [two-column profile layout, drei Html profile overlays]

key-files:
  created: [src/components/PlayerProfileGroup.tsx, src/components/GoalProfileGroup.tsx]
  modified: [src/components/GoalRow.tsx, src/components/RollingArea.tsx, src/components/Scene.tsx, src/App.tsx]

key-decisions:
  - "Avatar circles 57px (30% larger than initial 44px) to match die visual weight"
  - "Two-column profile layout: avatar | star+score / SX|TX"
  - "Score inside gold star (52px) with score text matching avatar letter size (20px)"
  - "SLOT_SPACING 0.7 → 0.62, DIE_SIZE divisor 8.5 → 9.5 for breathing room"
  - "Row shift via centering formula (i - 3.5) → (i - 3.0) for left-side avatar space"

patterns-established:
  - "Profile group pattern: drei Html overlay with two-column layout for player identity"
  - "Total dice display (pool + locked) for player decision-making context"

issues-created: []

# Metrics
duration: 29min
completed: 2026-03-02
---

# Phase 9 Plan 1: Layout Restructure + Profile Groups Summary

**Scaled dice with breathing room, shifted rows for avatar space, two-column profile groups (avatar + star-score + SX|TX) for all players and goal row**

## Performance

- **Duration:** 29 min
- **Started:** 2026-03-02T04:42:33Z
- **Completed:** 2026-03-02T05:12:26Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 6

## Accomplishments
- Dice scaled down (divisor 8.5 → 9.5) with tighter slot spacing (0.7 → 0.62) for row breathing room
- Rows shifted right via centering formula change, freeing left-side space for profile groups
- PlayerProfileGroup: two-column layout with 57px avatar circle + gold star containing score + SX|TX dice stats
- GoalProfileGroup: 57px gold circle with white star icon, matching player avatar size
- All profile groups wired into Scene for human + AI players + goal row

## Task Commits

Each task was committed atomically:

1. **Task 1: Scale dice and shift rows** - `8d11564` (feat)
2. **Task 2: Create profile group components** - `6b808d2` (feat)
3. **Checkpoint feedback: Redesign profile layout** - `6560e36` (feat)
4. **Checkpoint feedback: Two-column layout with larger circles** - `13b6cba` (feat)

## Files Created/Modified
- `src/components/PlayerProfileGroup.tsx` - NEW: Two-column profile (avatar + star-score + dice stats)
- `src/components/GoalProfileGroup.tsx` - NEW: Gold circle with star for goal row
- `src/components/GoalRow.tsx` - SLOT_SPACING 0.7 → 0.62, getSlotX offset (i-3.5) → (i-3.0)
- `src/components/RollingArea.tsx` - DIE_SIZE divisor 8.5 → 9.5
- `src/components/Scene.tsx` - Wired profile groups, replaced PlayerIcon, passes totalDice prop
- `src/App.tsx` - Removed unused processAIUnlocks binding (pre-existing dead code)

## Decisions Made
- Avatar circles sized at 57px to visually match dice weight in the layout
- Score displayed inside a gold star (52px) rather than plain text — star = points visual language
- Two-column profile: avatar | (star+score / SX|TX) — keeps it compact while showing all info
- Total dice count (T = pool + locked) shown to help players assess relative position
- SLOT_SPACING and DIE_SIZE reduced proportionally to maintain row alignment

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed unused processAIUnlocks binding in App.tsx**
- **Found during:** Task 1 (build verification)
- **Issue:** TS noUnusedLocals flagged dead `processAIUnlocks` variable extracted from store selector
- **Fix:** Removed the unused binding (actual calls use `useGameStore.getState().processAIUnlocks()`)
- **Files modified:** src/App.tsx
- **Verification:** Build passes cleanly
- **Committed in:** 8d11564 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking), 0 deferred
**Impact on plan:** Minimal — removed dead code to unblock build. No scope creep.

## Issues Encountered
None

## Next Phase Readiness
- Profile group layout complete, ready for dice animation from/to profile groups (09-02)
- PlayerIcon.tsx still exists but is no longer imported — can be deleted in cleanup
- UI art for avatars noted in VISION.md for future Illustrator work

---
*Phase: 09-multi-player-display*
*Completed: 2026-03-02*
