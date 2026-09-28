---
phase: 03-dice-rolling
plan: 01
subsystem: physics
tags: [rapier, react-three-rapier, rigidbody, impulse, forwardRef, useImperativeHandle]

# Dependency graph
requires:
  - phase: 02-premium-die
    provides: Die3D visual component (RoundedBox + pips)
  - phase: 01-foundation
    provides: R3F + Rapier physics setup, Scene component
provides:
  - PhysicsDie component with roll() API
  - Settle detection via onSleep/onWake
  - PhysicsDieHandle ref interface
affects: [03-dice-rolling, 05-core-game-logic, 11-mobile-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [forwardRef + useImperativeHandle for physics API, ref-based rolling state, onSleep/onWake settle detection]

key-files:
  created: [src/components/PhysicsDie.tsx]
  modified: [src/components/Scene.tsx]

key-decisions:
  - "forwardRef + useImperativeHandle exposes roll() to parent via ref"
  - "Settle detection uses refs (not React state) to avoid re-renders during physics"
  - "onWake re-marks as rolling to prevent false settle signals"
  - "Euler→Quaternion for random initial rotation"

patterns-established:
  - "PhysicsDie ref pattern: useImperativeHandle for imperative physics API"
  - "Settle detection: onSleep/onWake with ref-based isRolling flag"
  - "randRange() helper for physics randomization"

issues-created: []

# Metrics
duration: 5min
completed: 2026-02-28
---

# Phase 3 Plan 1: PhysicsDie with Roll API Summary

**PhysicsDie component wrapping Die3D with Rapier RigidBody, roll() impulse+torque API, and onSleep/onWake settle detection**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-28T22:25:37Z
- **Completed:** 2026-02-28T22:30:57Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- PhysicsDie component with forwardRef + useImperativeHandle exposing roll() and isSettled
- roll() resets position, applies random rotation (Euler→Quaternion), upward impulse with horizontal offset, and random torque
- Settle detection via Rapier onSleep/onWake with ref-based isRolling flag (no React state re-renders)
- Scene.tsx updated: click floor to roll, replaced drop-from-height demo

## Task Commits

Each task was committed atomically:

1. **Task 1: Create PhysicsDie component with roll API** - `49fa043` (feat)
2. **Task 2: Add settle detection via sleep events** - `856e8b5` (feat)

## Files Created/Modified
- `src/components/PhysicsDie.tsx` - PhysicsDie component with roll API, settle detection, PhysicsDieHandle interface
- `src/components/Scene.tsx` - Replaced inline RigidBody+Die3D with PhysicsDie, added click-to-roll on floor

## Decisions Made
- forwardRef + useImperativeHandle for exposing roll() to parent via ref
- Ref-based isRolling tracking (not React state) to avoid re-renders during physics simulation
- onWake handler re-marks as rolling to prevent false settle signals if die gets bumped
- Euler→Quaternion conversion for random initial rotation (rather than Quaternion.random())

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Minor TypeScript issues resolved during execution:
- `onResult` aliased to `_onResult` (placeholder prop, used in Plan 2)
- `PhysicsDieHandle` import needed `type` keyword due to `verbatimModuleSyntax` in tsconfig

## Next Phase Readiness
- PhysicsDie component ready for multi-dice extension (Plan 2)
- Settle detection ready for face-up reading integration (Plan 3)
- No blockers

---
*Phase: 03-dice-rolling*
*Completed: 2026-02-28*
