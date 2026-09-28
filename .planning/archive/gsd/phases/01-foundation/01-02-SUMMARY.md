---
phase: 01-foundation
plan: 02
subsystem: rendering
tags: [r3f, rapier, three.js, physics, drei, orbit-controls]

# Dependency graph
requires:
  - phase: 01-foundation plan 01
    provides: Vite + R3F scaffold, Canvas, project structure
provides:
  - 3D scene with lighting, shadows, HDRI environment
  - Rapier physics world with gravity -50
  - Floor plane with collision
  - Locked top-down perspective camera
affects: [02-premium-die, 03-dice-rolling, 04-game-board-layout]

# Tech tracking
tech-stack:
  added: []
  patterns: [OrbitControls locked for fixed camera, explicit CuboidColliders for reliable collision, CCD for fast-moving bodies, 9:16 portrait viewport constraint]

key-files:
  created: []
  modified: [src/components/Scene.tsx, src/App.tsx, src/App.css]

key-decisions:
  - "Camera locked top-down perspective (not free orbit) — game is viewed from above like a table"
  - "Explicit CuboidColliders over auto-colliders for reliable physics at high gravity"
  - "CCD enabled on dynamic bodies to prevent tunneling at gravity -50"
  - "Restitution bumped to 0.5 (from planned 0.3) for visible bounce at high gravity"
  - "Viewport constrained to 9:16 portrait aspect ratio — mobile-first design"

patterns-established:
  - "Explicit CuboidColliders: always use explicit colliders for floor and dynamic bodies, don't rely on auto-colliders"
  - "CCD on fast bodies: enable continuous collision detection on any RigidBody moving at high speed"

issues-created: []

# Metrics
duration: 8min
completed: 2026-02-28
---

# Phase 1 Plan 2: Basic 3D Scene Summary

**R3F + Rapier 3D scene with top-down locked camera, HDRI environment, directional shadows, floor plane, and physics test cube bouncing under gravity -50**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-28T14:55:28Z
- **Completed:** 2026-02-28T15:04:03Z
- **Tasks:** 3 (2 auto + 1 checkpoint) + 2 post-checkpoint fixes
- **Files modified:** 3

## Accomplishments

- 3D scene with ambient + directional lighting, shadow mapping, and HDRI apartment environment
- Floor plane (10x10) with explicit CuboidCollider for reliable physics collision
- Red test cube drops under gravity -50, bounces with restitution 0.5, and settles on floor
- Camera locked to top-down perspective view — no user orbit/zoom/pan
- CCD enabled on dynamic bodies to prevent tunneling at high gravity speeds
- Viewport constrained to 9:16 portrait aspect ratio with centered black bars on wider screens

## Task Commits

Each task was committed atomically:

1. **Task 1: Set up 3D scene with camera, lighting, and floor** — `bc75d45` (feat)
2. **Task 2: Add Rapier physics with test cube** — `70675cb` (feat)
3. **Task 3: Checkpoint fix — bounce and camera lock** — `02c694b` (fix)
4. **Task 4: 9:16 portrait viewport** — `234fd64` (feat)

## Files Created/Modified

- `src/components/Scene.tsx` — Full scene: OrbitControls (locked), lighting, Environment, Physics world, floor RigidBody, test cube RigidBody
- `src/App.tsx` — Canvas with shadows, antialias, top-down camera position [0, 12, 0.01]
- `src/App.css` — 9:16 portrait aspect ratio constraint with CSS min(), centered with black bars

## Decisions Made

- Camera locked top-down perspective instead of free orbit — game is viewed from above like a table (user direction at checkpoint)
- Explicit CuboidColliders instead of auto-colliders — auto-colliders unreliable with thin plane geometry
- CCD enabled on dynamic bodies — prevents tunneling at gravity -50
- Restitution increased to 0.5 from planned 0.3 — needed for visible bounce at high gravity

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Cube squashing instead of bouncing**
- **Found during:** Checkpoint verification
- **Issue:** At gravity -50, cube penetrated floor before collision response kicked in — looked like squash instead of bounce
- **Fix:** Added explicit CuboidCollider on cube with restitution 0.5, enabled CCD, thickened floor collider
- **Files modified:** src/components/Scene.tsx
- **Verification:** Cube now visibly bounces and settles
- **Committed in:** 02c694b

**2. [User Direction] Camera locked top-down**
- **Found during:** Checkpoint verification — user specified camera should be locked top-down perspective
- **Change:** Disabled OrbitControls interactions, moved camera to [0, 12, 0.01] for overhead view
- **Files modified:** src/components/Scene.tsx, src/App.tsx
- **Committed in:** 02c694b

---

**Total deviations:** 1 auto-fixed (bug), 1 user-directed change
**Impact on plan:** Bug fix essential for correct physics feel. Camera change is user preference, no scope creep.

## Issues Encountered

None

## Next Phase Readiness

Phase 1 Foundation complete. Ready for Phase 2: Premium Die — single die with MeshPhysicalMaterial, clearcoat, HDRI, AccumulativeShadows.

---
*Phase: 01-foundation*
*Completed: 2026-02-28*
