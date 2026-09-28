---
phase: 44-drag-detection-drop-zone
plan: 01
subsystem: ui
tags: [r3f, pointer-events, drag, zustand, three.js]

requires:
  - phase: 43-polish-uat
    provides: v1.5 gather-roll shipped, pointer event patterns established
provides:
  - DragUnlockState in store with start/update/cancel/complete actions
  - Drag pointer events on UnlockableDie (onPointerDown/Move/Up)
  - Die follows pointer in world coordinates during drag
  - World-to-local Z conversion pattern for dragged dice
affects: [44-02-drop-zone, 45-drop-commit, 46-inactivity-timer]

tech-stack:
  added: []
  patterns: [ray-plane-intersection-for-drag, pointer-capture-on-3d-mesh, world-to-local-z-offset]

key-files:
  created: []
  modified:
    - src/types/game.ts
    - src/store/gameStore.ts
    - src/components/PlayerRow.tsx

key-decisions:
  - "World coordinates in store, convert to local in useFrame via rowZ subtraction"
  - "Static Plane at Y=0 for drag intersection (table level, not ORBIT_HEIGHT)"
  - "Pointer capture on mesh element for reliable Move/Up events"

patterns-established:
  - "DragUnlockState pattern: active + metadata + position tracking (mirrors GatherState)"
  - "World-to-local conversion: subtract rowZ from world Z in useFrame"

issues-created: []

duration: ~8min
completed: 2026-03-29
---

# Phase 44 Plan 01: Drag Handler on Locked Dice Summary

**DragUnlockState in store + pointer drag events on UnlockableDie replacing onClick — die follows finger in 3D during unlock phase**

## Performance

- **Duration:** ~8 min
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- DragUnlockState interface and 4 store actions (start, update, cancel, complete) with phase guards
- UnlockableDie onClick replaced with onPointerDown/Move/Up drag handlers
- Die follows pointer in world coordinates during drag, converted to local in useFrame
- Pointer capture ensures reliable tracking even when pointer leaves mesh

## Task Commits

1. **Task 1: Add drag state to gameStore** - `c050d20` (feat)
2. **Task 2: Replace UnlockableDie onClick with drag pointer events** - `74dd862` (feat)

## Files Created/Modified
- `src/types/game.ts` - Added DragUnlockState interface, added to GameState
- `src/store/gameStore.ts` - Added initialDragUnlockState, 4 actions with phase guard
- `src/components/PlayerRow.tsx` - Replaced onClick with pointer drag, added rowZ prop, useFrame drag override

## Decisions Made
- World coordinates stored in dragUnlockState, converted to local Z via `- rowZ` in useFrame (X needs no conversion since PlayerRow group is at X=0)
- Static Plane at Y=0 for ray intersection (table level drag, not ORBIT_HEIGHT)
- Added rowZ prop to UnlockableDie for world-to-local conversion
- Position.z reset to 0 when not dragging to avoid stale offsets

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## Next Phase Readiness
- Drag handler working, die follows pointer, releases snap back (cancelDragUnlock)
- Ready for 44-02: drop zone detection + snap-back animation
- onPointerUp currently calls cancelDragUnlock() — 44-02 will add isInRollingZone() check before deciding cancel vs complete

---
*Phase: 44-drag-detection-drop-zone*
*Completed: 2026-03-29*
