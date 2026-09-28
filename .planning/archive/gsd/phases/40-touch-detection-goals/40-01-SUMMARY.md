---
phase: 40-touch-detection-goals
plan: 01
subsystem: input
tags: [r3f, pointer-events, zustand, three.js]
requires:
  - phase: 39-cleanup-uat
    provides: landscape layout complete
provides:
  - gathering state machine in game store
  - pointer event handlers on rolling floor
  - radial goal point calculator utility
affects: [41-physics-attractor, 42-release-mechanics]
tech-stack:
  added: []
  patterns: [pointer event extraction, radial position math]
key-files:
  created: [src/utils/gatherPoints.ts]
  modified: [src/types/game.ts, src/store/gameStore.ts, src/components/RollingArea.tsx, src/components/Scene.tsx]
key-decisions:
  - "Pointer events coexist with onClick — gathering phase blocks tap-to-roll via phase guard, not event prevention"
  - "GatherState lives at top level of GameState (not nested in roundState) since it's interaction state, not round data"
patterns-established:
  - "Extract event.point as [x,y,z] tuple at the R3F boundary, pass plain arrays through props and store"
  - "stopPropagation on pointerDown to prevent OrbitControls interference"
  - "Arena bounds clamping with 0.5 inset for wall clearance"
issues-created: []
duration: 5min
completed: 2026-03-26
---

# Plan 40-01 Summary: Touch Detection & Goal System

## Performance
Both tasks completed cleanly with zero build errors. No deviations from plan.

## Accomplishments

### Task 1: Gathering Phase + Pointer Events
- Added `'gathering'` to `GamePhase` union type
- Created `GatherState` interface with `active`, `touchPosition`, and `dieCount` fields
- Added `gatherState` to `GameState` and initialized in store
- Implemented three store actions: `startGathering`, `updateGatherPosition`, `stopGathering`
- Extended `RollingArea` props with `onFloorPointerDown`, `onFloorPointerMove`, `onFloorPointerUp`
- Floor mesh now extracts `event.point` as `[x,y,z]` tuples and calls prop handlers
- `stopPropagation()` on pointerDown prevents OrbitControls from consuming the event
- Scene.tsx wired with handlers that manage gather lifecycle
- Tap-to-roll preserved: pointerDown sets phase='gathering', pointerUp resets to 'idle', click fires after and sees 'idle'

### Task 2: Radial Goal Point Calculator
- Created `src/utils/gatherPoints.ts` — pure utility, no React dependencies
- `getGatherPoints(center, count, radius?, rotationOffset?)` returns evenly-spaced positions in a circle
- `getGatherRadius(count)` scales radius from 1.0 to 3.0 based on die count
- Y coordinate fixed at `DIE_SIZE / 2` (half die height, resting on floor)
- All positions clamped within arena bounds with 0.5 wall inset

## Task Commits
| Task | Commit | Description |
|------|--------|-------------|
| 1 | `dce687b` | Gathering phase + gather state + pointer events |
| 2 | `6c32e36` | Radial goal point calculator utility |

## Files Changed
- `src/types/game.ts` — Added GatherState interface, 'gathering' phase, gatherState to GameState
- `src/store/gameStore.ts` — GatherState import, initialGatherState, 3 gather actions
- `src/components/RollingArea.tsx` — Pointer event props + handlers on floor mesh
- `src/components/Scene.tsx` — Gather handlers, store subscriptions, RollingArea prop wiring
- `src/utils/gatherPoints.ts` — NEW: radial position calculator

## Decisions
- GatherState at top level of GameState (not in roundState) — gathering is transient interaction state
- Pointer event extraction happens at the R3F mesh boundary; downstream code works with plain tuples
- Arena clamping uses 0.5 inset from walls so dice don't clip boundary colliders

## Deviations
None. Plan executed as specified.

## Issues
None.

## Next Phase Readiness
Phase 41 (Physics Attractor Orbit) can now:
- Read `gatherState.touchPosition` and `gatherState.active` from the store
- Use `getGatherPoints()` to compute target positions for dice attraction
- Listen for `phase === 'gathering'` to activate attractor forces
