---
phase: 02-premium-die
plan: 01
subsystem: rendering
tags: [r3f, drei, RoundedBox, CircleGeometry, d6, pips, three.js]

# Dependency graph
requires:
  - phase: 01-foundation plan 02
    provides: 3D scene with physics, floor, locked camera, HDRI environment
provides:
  - Die3D reusable component with RoundedBox geometry and 3D pip dots
  - Standard Western d6 face layout (opposite faces sum to 7)
  - Shared geometry/material instances for pip rendering
affects: [02-premium-die plan 02, 02-premium-die plan 03, 03-dice-rolling, 04-game-board-layout]

# Tech tracking
tech-stack:
  added: []
  patterns: [shared Three.js geometry/material at module level for instanced rendering, pre-computed static mesh data outside React components]

key-files:
  created: [src/components/Die3D.tsx]
  modified: [src/components/Scene.tsx, src/App.tsx, src/App.css]

key-decisions:
  - "Pip color: near-black (#1a1a1a) instead of white — better visibility on cream die surface (user direction)"
  - "Die drops from height for visual physics demo rather than sitting static on floor"

patterns-established:
  - "Shared geometry/material: define Three.js primitives at module level, reuse across all mesh instances"
  - "Pre-computed pip data: static face/pip arrays computed once at module load, not per-render"

issues-created: []

# Metrics
duration: 7min
completed: 2026-02-28
---

# Phase 2 Plan 1: Die Geometry Summary

**Die3D component with RoundedBox bevel (0.07 radius), 21 near-black pip dots across 6 faces using shared CircleGeometry instances**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-28T15:23:08Z
- **Completed:** 2026-02-28T15:30:08Z
- **Tasks:** 3 (2 auto + 1 checkpoint) + 1 user-requested addition
- **Files modified:** 4

## Accomplishments

- Die3D component with RoundedBox geometry (1x1x1, 0.07 radius bevel, smoothness 4)
- All 6 faces with correct standard Western d6 pip layout (opposite faces sum to 7)
- 21 pip meshes using shared CircleGeometry and MeshStandardMaterial (performance-optimized)
- Near-black pips on cream surface for clear visual contrast
- Build version overlay (vX.Y.Z.B) in lower-left corner for checkpoint verification

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Die3D with RoundedBox geometry** — `10be9b1` (feat)
2. **Task 2: Add 3D pip dots to all 6 faces** — `97c8c6a` (feat)
3. **Checkpoint fix: Black pips + drop from height** — `b849efa` (fix)
4. **Build version overlay** — `0b25bdc` (feat)

## Files Created/Modified

- `src/components/Die3D.tsx` — Die3D component: RoundedBox body + 21 pip dot meshes, shared geometry/material, pre-computed face positions
- `src/components/Scene.tsx` — Replaced test cube with Die3D component inside RigidBody wrapper
- `src/App.tsx` — Added build version overlay reading from version.json
- `src/App.css` — Added `.build-version` style (fixed, lower-left, semi-transparent)

## Decisions Made

- Pip color changed from white (#ffffff) to near-black (#1a1a1a) — user direction at checkpoint for better visibility on cream surface
- Die drops from height [0, 5, 0] rather than sitting at [0, 0.5, 0] — more visually interesting physics demo

## Deviations from Plan

### User-Directed Changes at Checkpoint

**1. Pip color: white → near-black**
- **Found during:** Checkpoint verification
- **Issue:** White pips hard to see on cream die surface
- **Fix:** Changed pip material color to #1a1a1a
- **Files modified:** src/components/Die3D.tsx
- **Committed in:** b849efa

**2. Die position: sitting → dropping**
- **Found during:** Checkpoint verification — user wanted to see die in motion to check for z-fighting
- **Fix:** Changed RigidBody position from [0, 0.5, 0] to [0, 5, 0]
- **Files modified:** src/components/Scene.tsx
- **Committed in:** b849efa

---

**Total deviations:** 2 user-directed at checkpoint
**Impact on plan:** Minor visual tweaks at user's direction. No scope creep.

## Issues Encountered

None

## Next Phase Readiness

Die3D component ready for Plan 02-02 (materials upgrade to MeshPhysicalMaterial, clearcoat, HDRI reflections, player color tinting).

---
*Phase: 02-premium-die*
*Completed: 2026-02-28*
