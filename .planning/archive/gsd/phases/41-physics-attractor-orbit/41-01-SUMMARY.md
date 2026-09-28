---
phase: 41-physics-attractor-orbit
plan: 01
subsystem: physics
tags: [r3f, rapier, zustand, physics, attractor, useFrame]
requires:
  - phase: 40-touch-detection-goals
    provides: gathering state machine, pointer events, radial goal calculator
provides:
  - velocity-controlled attractor force system in PhysicsDie
  - orbital goal computation with count-dependent speed in DicePool
  - two-phase attraction (lift then pull) for reliable pickup
  - dice shrink/scale during gather for overlap prevention
  - snapFlat cascade for post-settle canting correction
  - unstick dice utility in settings
  - getFaceUpConfidence for dot product face detection
affects: [42-release-mechanics, 43-polish-uat]
tech-stack:
  added: []
  patterns: [velocity-controlled physics tracking, two-phase lift-then-pull, sensor toggle for gather, visual-only scale animation]
key-files:
  created: []
  modified: [src/components/PhysicsDie.tsx, src/components/DicePool.tsx, src/components/Scene.tsx, src/components/RollingArea.tsx, src/components/Settings.tsx, src/utils/gatherPoints.ts, src/utils/diceUtils.ts, src/App.tsx]
key-decisions:
  - "Velocity-controlled tracking (setLinvel) instead of spring forces — eliminates orbital lag"
  - "Two-phase attraction: rise straight up first, lateral pull only after airborne — prevents collider digging into floor"
  - "Dice shrink to 50% during gather, collider restores full on release, visual scales up over 0.3s — prevents overlap without lag"
  - "Sensor mode during attraction, solid on release — dice pass through walls/each other while gathering"
  - "SnapFlat cascade only runs on canted dice (dot < 0.95) — no unnecessary animation on flat dice"
  - "Floor restitution kept at 0.5, friction removed — high friction caused spawn physics issues"
  - "Center-clamped goal ring (inset by radius) — prevents edge oscillation when touching near walls"
patterns-established:
  - "Two-phase physics control: safety lift before lateral movement"
  - "Sensor toggle pattern: sensors on during controlled animation, solid for free physics"
  - "Visual-only scale animation (collider snaps, visual lerps) to avoid per-frame broadphase recalc"
  - "getFaceUpConfidence for conditional behavior based on face alignment quality"
issues-created: []
duration: 180min
completed: 2026-03-27
---

# Plan 41-01 Summary: Physics Attractor & Orbit

**Velocity-controlled attractor system with two-phase lift, orbital tracking, shrink/scale overlap prevention, and snapFlat canting correction**

## Performance

- **Duration:** ~3 hours (extensive tuning iteration with user)
- **Started:** 2026-03-26
- **Completed:** 2026-03-27
- **Tasks:** 2 auto + 1 checkpoint (with significant tuning)
- **Files modified:** 8

## Accomplishments

- Dice physically attracted to orbiting goal points during hold gesture
- Two-phase attraction: straight-up lift clears floor, then lateral pull begins
- Orbit speed count-dependent (2 dice fast, 12 dice slower) with 2.25s ramp
- Dice shrink to 50% during gathering, scale back up on release
- Sensor mode during attraction prevents wall/dice clumping
- SnapFlat cascade auto-corrects canted dice after settling
- Unstick Dice button in in-game settings for manual recovery
- getFaceUpConfidence utility for face detection with confidence scoring

## Task Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `8cc0dca` | Attractor force system in PhysicsDie |
| 2 | `f4b5a18` | DicePool orbital goal computation |
| tuning | `2bdb5eb` | Extensive checkpoint tuning — lift phases, shrink/scale, snapFlat, unstick |

## Files Created/Modified

- `src/components/PhysicsDie.tsx` — Attractor useFrame, setAttractTarget, snapFlat, unstick, two-phase lift, shrink/scale, getFaceUpConfidence import
- `src/components/DicePool.tsx` — Orbital goal computation useFrame, count-dependent speed, snapFlat cascade in fireResults, unstickAll
- `src/components/Scene.tsx` — Removed debug visualizations, exposed unstickAll via SceneHandle
- `src/components/RollingArea.tsx` — Floor restitution tuned (0.5), friction removed
- `src/components/Settings.tsx` — Unstick Dice button (in-game only)
- `src/utils/gatherPoints.ts` — Center-clamped ring, float height 1.5, linear radius interpolation (2d=1.0, 12d=2.0)
- `src/utils/diceUtils.ts` — New getFaceUpConfidence function
- `src/App.tsx` — Wired unstick prop to Settings

## Decisions Made

- Velocity control over spring forces: springs inherently lag behind moving targets, setLinvel gives zero-lag tracking
- Two-phase lift: floor friction + collider edges prevent diagonal extraction, so rise vertically first
- 50% shrink: prevents overlap on release without needing position snapping or rotation alignment
- SnapFlat threshold 0.95: only corrects genuinely canted dice, skips already-flat ones
- Floor friction removed: caused Rapier to generate strong lateral forces on simultaneous spawn

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Goal Y too low — dice didn't lift**
- **Found during:** Checkpoint testing
- **Issue:** Goal Y was DIE_SIZE/2 (resting height), zero upward force
- **Fix:** Raised to DIE_SIZE * 1.875 (~1.5 units)

**2. [Rule 3 - Blocking] Spring forces couldn't track orbiting goals**
- **Found during:** Checkpoint tuning
- **Issue:** applyImpulse always lags by one frame behind moving targets
- **Fix:** Switched to velocity-controlled (setLinvel) with ramping approach factor

**3. [Rule 1 - Bug] Dice collider digging into floor on pickup**
- **Found during:** Checkpoint testing
- **Issue:** Lateral pull while touching floor caused collider edge to wedge
- **Fix:** Two-phase attraction — rise straight up first, lateral only after airborne

**4. [Rule 1 - Bug] Dice overlapping on release causing physics explosions**
- **Found during:** Checkpoint testing with 12 dice
- **Issue:** Tumbling dice at ring positions overlap (diagonal > spacing)
- **Fix:** Shrink to 50% during gather, restore on release

---

**Total deviations:** 4 auto-fixed (all blocking), 0 deferred
**Impact on plan:** All fixes necessary for correct physics behavior. Significant tuning required but no scope creep.

## Issues Encountered

- Floor friction (1.2) caused Rapier to generate strong lateral contact forces on simultaneous spawn — reverted
- RoundCuboidCollider incompatible with runtime setHalfExtents — reverted to CuboidCollider
- Kinematic floor body caused circular import crash (RollingArea → useGameStore → GoalRow → DIE_SIZE) — reverted to fixed body

## Next Phase Readiness

Phase 42 (Release & Roll Mechanics) can now:
- The gather mechanic is fully functional
- Release currently drops dice with orbital momentum + gravity
- Phase 42 will add rotational impulse on release for tumble, AFK timer integration, and removal of tap-to-roll

---
*Phase: 41-physics-attractor-orbit*
*Completed: 2026-03-27*
