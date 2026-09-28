---
phase: 09-multi-player-display
plan: 04
subsystem: animation
tags: [r3f, useFrame, AnimatingDie, scale-interpolation, ai-unlock, zustand]

# Dependency graph
requires:
  - phase: 09-03
    provides: AnimatingDie with fromScale/toScale, AI lock animation pattern
  - phase: 08-02
    provides: AI unlock decisions (getAIUnlockDecision), processAIUnlocks
provides:
  - AI unlock animations (scale 1→0 arc back to profile group)
  - Two-step animate-then-apply pattern for AI unlocks
  - Combined lock-in + unlock-out slot hiding
affects: [09-05, 09-06]

# Tech tracking
tech-stack:
  added: []
  patterns: [animate-then-apply for state changes, combined animatingSlotIndices]

key-files:
  created: []
  modified: [src/types/game.ts, src/store/gameStore.ts, src/App.tsx, src/components/Scene.tsx]

key-decisions:
  - "Two-step flow: compute animations → store → wait → apply state → clear"
  - "Combined lock-in + unlock-out animatingSlotIndices for AI PlayerRows"
  - "0.5s duration (faster than human mitosis) for clean simple departure"
  - "No onComplete callbacks on AnimatingDie — App.tsx handles timing via setTimeout"

patterns-established:
  - "Animate-then-apply: visual animation plays first, state changes after completion"

issues-created: []

# Metrics
duration: 7min
completed: 2026-03-02
---

# Phase 9 Plan 4: AI Unlock Animations Summary

**AI dice scale down 1→0 and fly arc back to profile group, two-step animate-then-apply flow with staggered timing**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-02T05:59:41Z
- **Completed:** 2026-03-02T06:06:39Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 4

## Accomplishments
- AIUnlockAnimation type and store actions (setAIUnlockAnimations, clearAIUnlockAnimations)
- Two-step flow: animations play first, then processAIUnlocks applies state changes
- AnimatingDie instances render with fromScale=1 toScale=0 for shrink-to-nothing effect
- Combined lock-in + unlock-out slot hiding prevents overlap during either animation

## Task Commits

Each task was committed atomically:

1. **Task 1: AI unlock animation data and store actions** - `028e0f1` (feat)
2. **Task 2: Render AI unlock animations in Scene** - `dba3e9c` (feat)
3. **Task 3: Human verification** - checkpoint approved

## Files Created/Modified
- `src/types/game.ts` - Added AIUnlockAnimation interface, aiUnlockAnimations field on RoundState
- `src/store/gameStore.ts` - Added setAIUnlockAnimations/clearAIUnlockAnimations actions, initialized in initRound
- `src/App.tsx` - Created startAIUnlockAnimations helper, refactored unlock flow to animate-then-apply
- `src/components/Scene.tsx` - Reads aiUnlockAnimations, renders AnimatingDie with scale 1→0, computes combined animatingSlotIndices

## Decisions Made
- Two-step flow (animate → apply state) instead of instant state change — visual feedback before data update
- Combined animatingSlotIndices (lock-in + unlock-out) passed to AI PlayerRows — single prop handles both animation types
- 0.5s duration for AI unlock (faster than human mitosis) — AI actions should feel quick and decisive
- No onComplete callbacks on AnimatingDie — App.tsx uses setTimeout based on last delay + duration for simpler coordination

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- AI unlock animations working — reverse of lock animation (scale down instead of up)
- Ready for 09-05-PLAN.md (pool dice spawn/exit animations)

---
*Phase: 09-multi-player-display*
*Completed: 2026-03-02*
