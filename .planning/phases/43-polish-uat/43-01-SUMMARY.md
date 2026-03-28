---
phase: 43-polish-uat
plan: 01
subsystem: physics, input, scoring
tags: [r3f, rapier, zustand, physics, gather-release, collision-groups]
requires:
  - phase: 42-release-roll-mechanics
    provides: gather-release roll pipeline, AFK integration, dual roll paths
  - phase: 41-physics-attractor-orbit
    provides: velocity-controlled attractor, orbital tracking, sensor toggle
  - phase: 40-touch-detection-goals
    provides: gathering state machine, pointer events, radial goal calculator
provides:
  - complete hold-to-gather-roll system with smooth release physics
  - collision group isolation during scale-up (no physics explosions)
  - tangential release velocity from orbital momentum
  - hockey stick speed curve for power-ramp feel
  - auto-release at 2.5s full charge
  - 10s absolute settle timeout
  - wall nudge for canted dice recovery
  - simplified scoring (8-poolSize*2)
affects: []
tech-stack:
  added: []
  patterns: [collision group toggling for phase-specific physics isolation, tangential velocity from orbital parameters, kinematic wall nudge]
key-files:
  created: []
  modified: [src/components/PhysicsDie.tsx, src/components/DicePool.tsx, src/components/RollingArea.tsx, src/components/Scene.tsx, src/utils/gatherPoints.ts, src/store/gameStore.ts, party/server.ts]
key-decisions:
  - "Goal height 3.0 — matches initial lift impulse, eliminates forced lift phase"
  - "Collision groups during scale-up: dice in group 1 filter out group 1, still collide with floor/walls in default group"
  - "Tangential velocity on release computed from orbital speed × radius + 30% radial outward push"
  - "Hockey stick speed curve (t³ ease-in) — flat start, rapid acceleration for power feel"
  - "Scoring simplified: 8 - poolSize * 2, clamped to 0"
  - "Wall nudge via kinematic bodies — breathe out 0.2 on settle, slow return over 0.4s"
patterns-established:
  - "Collision group toggling: isolate dice-dice during transitions, restore after"
  - "Tangential velocity from orbit: speed × radius, perpendicular to radius vector"
  - "Kinematic wall animation: setNextKinematicTranslation in useFrame for physics-aware movement"
issues-created: []
duration: 180min
completed: 2026-03-27
---

# Plan 43-01 Summary: Polish & UAT

**Collision-group release physics, hockey stick gather curve, tangential fling, wall nudge canting fix, and simplified scoring — v1.5 milestone complete**

## Performance

- **Duration:** ~3 hours (extensive tuning iteration with user)
- **Started:** 2026-03-27
- **Completed:** 2026-03-27
- **Tasks:** 1 auto + 1 checkpoint (with significant tuning)
- **Files modified:** 8

## Accomplishments

- Hold-to-gather-roll feels smooth end-to-end across all die counts
- Dice fling outward with tangential orbital momentum on release
- No physics explosions during scale-up (collision group isolation)
- Hockey stick speed curve (t³) creates satisfying power-ramp feel
- Auto-release at 2.5s full charge with final radius squeeze
- Stuck dice teleport to goals after 0.5s of no movement
- Walls nudge outward on settle to free canted dice
- 10s absolute timeout prevents infinite settle loops
- Scoring simplified: 8/6/4/2/0 for 8-12 dice pools

## Task Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `e7e28ce` | Settle timeout + gather state cleanup |
| 1 | `905e9ba` | Fix snapFlat → lock lerp jump |
| 2 (tuning) | `50f2814` | Full polish pass — gather feel, release physics, scoring |

## Files Modified

- `src/components/PhysicsDie.tsx` — Collision groups on release, tangential velocity, stuck detection, scale-up from captured start, snapFlat body.sleep(), setAttractScale API
- `src/components/DicePool.tsx` — Hockey stick speed (t³), dice shrink 1→0.25, radius shrink, auto-release at 2.5s, tangential velocity computation, wall nudge callback, 10s settle timeout
- `src/components/RollingArea.tsx` — Kinematic walls with nudge animation (forwardRef + useImperativeHandle), fast out / slow ease-in return
- `src/components/Scene.tsx` — RollingArea ref + nudge wiring, auto-release callback
- `src/utils/gatherPoints.ts` — Goal height raised to 3.0
- `src/store/gameStore.ts` — Scoring: 8 - poolSize * 2
- `party/server.ts` — Server-side scoring: 8 - poolSize * 2
- `version.json` — Build 89

## Decisions Made

- **Collision groups over sensor toggle**: Sensors would let dice fall through floor. Collision groups let dice ignore each other while still interacting with walls/floor. Clean, no timing hacks.
- **Goal height 3.0**: Matches the initial y=3 impulse, so dice naturally reach orbit height without a forced lift phase. Eliminated the Phase 1/Phase 2 split.
- **Hockey stick curve (t³)**: Linear ramp felt mechanical. Cubic ease-in creates a "charging up" feel — slow start, dramatic acceleration.
- **Tangential velocity from orbit**: Previous approach zeroed velocity when dice reached goals (dist < 0.02). Now DicePool computes tangential vector from orbital parameters and passes it on release.
- **Scoring 8-poolSize*2**: Steeper penalty than previous system. Every extra die costs 2 points (was variable: 1,0,1,1).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] snapFlat → lock lerp jump**
- **Found during:** Checkpoint testing
- **Issue:** Lock lerp started from pre-snapFlat pose, causing visible jump
- **Fix:** Re-read positions/rotations after snapFlat cascade; body.sleep() at snap end

**2. [Rule 3 - Blocking] Dice not collecting during gather**
- **Found during:** Checkpoint testing
- **Issue:** Forced lift phase + low goal height (1.5) prevented some dice from reaching goals
- **Fix:** Raised goal height to 3.0, removed lift phase, added stuck detection with 0.5s teleport

**3. [Rule 3 - Blocking] Collider snap causing action-at-distance**
- **Found during:** Checkpoint testing
- **Issue:** Colliders restored to full size instantly while visual still small — invisible overlaps
- **Fix:** Collider scales alongside visual; collision groups isolate dice during scale-up

**4. [Rule 3 - Blocking] Zero release velocity**
- **Found during:** Checkpoint testing
- **Issue:** Velocity tracking zeroed velocity when die reached goal (dist<0.02), so release had no momentum
- **Fix:** DicePool computes tangential velocity from orbital parameters and passes to setAttractTarget

---

**Total deviations:** 4 auto-fixed (all blocking), 0 deferred
**Impact on plan:** All fixes necessary for correct gather-release feel. Significant tuning required but no scope creep.

## Issues Encountered

- Floor friction removal (Phase 41) still means dice slide more on landing — acceptable tradeoff
- Wall nudge effect is subtle — walls only move 0.2 units — but keeps the mechanism for edge cases

## Next Phase Readiness

v1.5 Hold-to-Gather-Roll milestone is complete:
- Full hold → orbit → release → tumble → settle → lock pipeline
- AFK auto-roll works in both idle and mid-gather states
- Online multiplayer sync verified
- All edge cases addressed (stuck dice, canting, settle timeout)

---
*Phase: 43-polish-uat*
*Completed: 2026-03-27*
