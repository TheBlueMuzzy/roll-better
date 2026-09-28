---
phase: 42-release-roll-mechanics
plan: 01
subsystem: physics, input
tags: [r3f, rapier, zustand, physics, gather-release, afk]
requires:
  - phase: 41-physics-attractor-orbit
    provides: velocity-controlled attractor, orbital tracking, sensor toggle, shrink/scale
  - phase: 40-touch-detection-goals
    provides: gathering state machine, pointer events, radial goal calculator
provides:
  - gather-release triggers roll pipeline with orbital momentum + tumble
  - AFK auto-roll works in both idle and mid-gather states
  - force-release imperative API on SceneHandle and DicePool
  - tap-to-roll completely removed
affects: [43-polish-uat]
tech-stack:
  added: []
  patterns: [gather-release as roll trigger, dual AFK paths (rollAll vs forceRelease)]
key-files:
  created: []
  modified: [src/components/PhysicsDie.tsx, src/components/DicePool.tsx, src/components/Scene.tsx, src/components/HUD.tsx, src/components/RollingArea.tsx, src/components/HowToPlay.tsx, src/App.tsx, src/App.css]
key-decisions:
  - "Gather-release IS the roll — dice keep orbital momentum from velocity tracking, no rollAll needed"
  - "handleRollStart (phase-only) for gather-release, handleRoll (phase + rollAll) for AFK idle"
  - "DicePool resets settle tracking on gather start (not on release) to catch edge cases"
  - "Settings button already isolated — HTML overlay above Canvas consumes pointer events before R3F raycaster"
  - "Status text changed from 'Tap to Roll' to 'Hold to Roll'"
patterns-established:
  - "Dual roll paths: gather-release (momentum-based) vs programmatic (rollAll with lift+impulse)"
  - "forceRelease imperative API: stop gathering + release dice + transition phase"
issues-created: []
duration: 15min
completed: 2026-03-27
---

# Plan 42-01 Summary: Release & Roll Mechanics

**Wired gather-release into the roll pipeline with tumble physics, AFK timer for both idle and mid-gather states, and complete removal of tap-to-roll**

## Performance

- **Duration:** ~15 minutes
- **Tasks:** 3 auto
- **Files modified:** 8
- **Build:** Clean, zero TypeScript errors

## Accomplishments

- Release from gather triggers 'rolling' phase via `handleRollStart` (phase-only, no rollAll)
- Dice keep orbital momentum from velocity-controlled tracking + random torque impulse for tumble
- DicePool resets settle tracking when gathering starts (parallel to rollAll's reset)
- AFK idle timeout uses `rollAll` path (lift + random impulse) for natural auto-roll
- AFK mid-gather timeout calls `forceRelease` (stopGathering + releaseAll + onRollStart)
- `__rbAfkRoll` flag set correctly in both AFK paths for online mode
- Tap-to-roll completely removed: no onClick on floor, no handleFloorClick, no onRoll prop on Scene
- Status text updated to "Hold to Roll", tip text describes gather-release gesture
- HowToPlay slide updated to match new interaction
- tap-pulse CSS animation removed (dead code)
- Settings gear confirmed already isolated (HTML overlay above Canvas)

## Task Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `9502f84` | Wire gather-release to roll pipeline with tumble impulse |
| 2 | `c86e787` | AFK timer integration with mid-gather force-release |
| 3 | `f1a6ced` | Remove tap-to-roll, update UI text, clean up dead code |

## Files Modified

- `src/components/PhysicsDie.tsx` — Added applyTorqueImpulse on release (tumble feel)
- `src/components/DicePool.tsx` — Added releaseAll(), settle tracking reset on gather start
- `src/components/Scene.tsx` — handleFloorPointerUp calls onRollStart, forceRelease on SceneHandle, removed onRoll prop and handleFloorClick
- `src/components/HUD.tsx` — Added onForceRelease prop, handleIdleTimeout checks mid-gather state
- `src/components/RollingArea.tsx` — Removed onFloorClick prop and onClick on floor mesh
- `src/components/HowToPlay.tsx` — Updated roll instruction text
- `src/App.tsx` — handleRollStart with audio init + phase guard, handleForceRelease, updated tip text, removed onRoll from Scene
- `src/App.css` — Removed tap-pulse keyframes and class

## Decisions Made

- Gather-release IS the roll: dice have momentum from orbital tracking, adding rollAll would fight that momentum
- Two separate roll paths coexist: gather-release (momentum) and rollAll (programmatic, for AFK idle)
- handleRollStart gets same audio init as handleRoll (first interaction autoplay policy)
- Settings button needs no fix — HTML overlay inherently blocks R3F raycaster

## Deviations from Plan

### Auto-fixed

**1. [Rule 1 - Bug] DicePool settle tracking not reset for gather-release rolls**
- **Found during:** Code analysis before implementation
- **Issue:** rollAll resets hasFired/settled/results, but gather-release skips rollAll
- **Fix:** Added settle tracking reset when gatherActive transitions to true in DicePool useFrame

## Issues Encountered

None.

## Next Phase Readiness

Phase 43 (Polish & UAT) can now:
- Full hold-gather-release-tumble-settle-lock pipeline works end-to-end
- AFK timer works in both idle and mid-gather states
- Online mode roll_result messages fire correctly via existing handleAllSettled path
- Edge cases for Phase 43: wall containment, attractor tuning, canting correction
