---
phase: 06-lerp-animation
plan: 03
subsystem: animation
tags: [r3f, useFrame, requestAnimationFrame, lerp, ease-out, goal-transition, score-animation, html-overlay]

# Dependency graph
requires:
  - phase: 06-lerp-animation
    provides: AnimatingDie component, position capture pipeline, lock lerp system, mitosis unlock
  - phase: 05-core-game-logic
    provides: scoreRound, applyHandicap, phase transitions, roundEnd timing
provides:
  - Score counting animation in HUD (requestAnimationFrame-based)
  - Handicap Z scale-pop on PlayerIcon (useFrame-based)
  - Goal row exit/enter staggered roll animations
  - goalTransition state field + setGoalTransition action
  - initRound skipPhase parameter for staged round transitions
affects: [07-unlock-interaction, 10-screens-flow, 12-audio-juice]

# Tech tracking
tech-stack:
  added: []
  patterns: [requestAnimationFrame for HTML animation, staged setTimeout sequences for multi-phase transitions, staggered per-element animation via single useFrame]

key-files:
  created: []
  modified: [src/components/HUD.tsx, src/components/GoalRow.tsx, src/components/PlayerIcon.tsx, src/components/Scene.tsx, src/store/gameStore.ts, src/types/game.ts, src/App.tsx]

key-decisions:
  - "Score counting uses requestAnimationFrame (HTML) not useFrame (R3F) — HUD is outside Canvas"
  - "initRound({ skipPhase: true }) prevents phase reset during staged roundEnd sequence"
  - "Goal transition: 500ms exit + 500ms enter within existing 1500ms roundEnd window"

issues-created: []

# Metrics
duration: 19 min
completed: 2026-03-01
---

# Phase 6 Plan 3: Score + Round Transition Summary

**Score counting animation via RAF in HUD, handicap Z scale-pop via useFrame on PlayerIcon, staggered goal dice roll-off/roll-in transitions during round end**

## Performance

- **Duration:** 19 min
- **Started:** 2026-03-01T22:32:19Z
- **Completed:** 2026-03-01T22:51:33Z
- **Tasks:** 2 auto + 1 checkpoint
- **Files modified:** 7

## Accomplishments
- Score display counts up from old value to new during scoring phase (1.5s cubic ease-out, scale pulse at end)
- Handicap "Start:N" badge pulses 1.0→1.4→1.0 over 0.4s when startingDice changes (sine curve)
- Old goal dice stagger-roll off to the right during roundEnd (30ms spacing, accelerating easeIn)
- New goal dice stagger-roll in from the left (30ms spacing, decelerating easeOut)
- Added `roundScore` to roundState for clean score delta access
- Added `goalTransition` state with `setGoalTransition` action
- Added `skipPhase` option to `initRound` for staged round transitions
- Zero-point rounds handled gracefully (no counting animation when roundScore=0)

## Task Commits

Each task was committed atomically:

1. **Task 1: Score counting animation and handicap pop** — `dafd042` (feat)
2. **Task 2: Goal row transition animation** — `820ddb6` (feat)

## Files Created/Modified
- `src/types/game.ts` — Added `roundScore` and `goalTransition` to RoundState
- `src/store/gameStore.ts` — roundScore storage in scoreRound(), goalTransition state/action, initRound skipPhase param
- `src/components/HUD.tsx` — requestAnimationFrame score counting loop with cubic ease-out + scale pulse
- `src/components/PlayerIcon.tsx` — useFrame Z badge scale-pop animation (sin curve, 0.4s)
- `src/components/GoalRow.tsx` — Per-die staggered exit/enter animations via single useFrame loop
- `src/components/Scene.tsx` — Passes goalTransition from store to GoalRow
- `src/App.tsx` — Staged roundEnd sequence (exit 500ms → initRound + enter → idle at 1500ms)

## Decisions Made
- Score counting uses `requestAnimationFrame` rather than React state updates — HUD is HTML outside Canvas, RAF gives smooth 60fps counting without re-renders
- `initRound({ skipPhase: true })` added to prevent the staged roundEnd sequence from being interrupted by a premature phase change to 'idle'
- Goal transition timing: 500ms exit + 500ms enter fits within existing 1500ms roundEnd delay, no overall timing change needed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — Missing Critical] initRound skipPhase parameter**
- **Found during:** Task 2 (Goal row transition)
- **Issue:** Calling `initRound()` during the staged roundEnd sequence would set phase to 'idle', cancelling the remaining timeouts and breaking the enter animation
- **Fix:** Added optional `{ skipPhase?: boolean }` parameter — when true, omits phase change from the set() call
- **Files modified:** src/store/gameStore.ts
- **Verification:** Staged sequence completes correctly: exit → new goals → enter → idle

---

**Total deviations:** 1 auto-fixed (missing critical)
**Impact on plan:** Minimal — skipPhase is the smallest possible change to support staged transitions. No scope creep.

## Issues Encountered
None

## Next Phase Readiness
- Phase 6 complete — all animation systems in place: lock lerp, pool persistence, mitosis unlock, score counting, handicap pop, goal transitions
- Full game loop is now visually polished with smooth transitions at every state change
- Ready for Phase 7: Unlock Interaction (drag-to-unlock, tap mode)

---
*Phase: 06-lerp-animation*
*Completed: 2026-03-01*
