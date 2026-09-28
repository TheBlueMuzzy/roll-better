---
phase: 09-multi-player-display
plan: 05
subsystem: ui
tags: [animation, useFrame, dice-pool, round-transition, spawn, exit]

# Dependency graph
requires:
  - phase: 06-lerp-animation
    provides: AnimatingDie pattern, goal transition timing
  - phase: 09-multi-player-display/03
    provides: AnimatingDie fromScale/toScale support
provides:
  - Pool dice exit animation (pop+shrink on round end)
  - Pool dice spawn animation (fly from avatar with bounce+tumble)
  - Clean visual round transition bookends
affects: [screens-flow, audio-juice]

# Tech tracking
tech-stack:
  added: []
  patterns: [ExitingDie visual-only component, SpawningDie pre-physics animation, poolExiting/poolSpawning state flags]

key-files:
  created: [src/components/SpawningDie.tsx]
  modified: [src/components/DicePool.tsx, src/components/Scene.tsx, src/store/gameStore.ts, src/types/game.ts, src/App.tsx, src/components/HUD.tsx, src/components/PlayerRow.tsx, src/components/PlayerProfileGroup.tsx, src/components/GoalProfileGroup.tsx, src/utils/aiDecision.ts]

key-decisions:
  - "SpawningDie component for spawn animation (aligns with AnimatingDie pattern)"
  - "Extended roundEnd-to-idle window from 1500ms to 2000ms for larger pool sizes"
  - "ExitingDie renders inside DicePool when poolExiting=true (no separate component)"

patterns-established:
  - "poolExiting/poolSpawning boolean flags for transition state"
  - "Pre-computed poolSpawnPositions shared between SpawningDie and DicePool"

issues-created: []

# Metrics
duration: 48min
completed: 2026-03-02
---

# Phase 9 Plan 5: Pool Dice Spawn & Exit Animations Summary

**Pool dice pop+shrink exit on round end, fly-from-avatar spawn with bounce+tumble on round start, plus 12-die cap formula fix and unlock indicator polish**

## Performance

- **Duration:** 48 min
- **Started:** 2026-03-02T06:11:53Z
- **Completed:** 2026-03-02T07:00:11Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 11

## Accomplishments
- Pool dice pop+shrink exit animation during round end (0.45s, fits in 500ms window)
- Pool dice spawn from avatar with scale overshoot (0→1.15→1) and tumble rotation
- Pre-computed spawn positions shared between SpawningDie and PhysicsDie (no teleport)
- First round also gets spawn animation (not just subsequent rounds)
- Fixed 12-die cap formula across entire codebase (was allowing 16+ dice)
- Dynamic unlock indicators: rings/pulse only on selectable dice

## Task Commits

Each task was committed atomically:

1. **Task 1: Pool dice exit animation** - `754d6ee` (feat)
2. **Task 2: Pool dice spawn animation** - `d41e432` (feat)
3. **Checkpoint fix: Unlock button persistence** - `46e47da` (fix)
4. **Checkpoint fix: UI polish** - `3e6f2f5` (fix)
5. **Checkpoint fix: 12-die cap + indicators** - `91f9fbc` (fix)

**Plan metadata:** (pending)

## Files Created/Modified
- `src/components/SpawningDie.tsx` - New component: fly-from-avatar with scale bounce + tumble
- `src/components/DicePool.tsx` - ExitingDie sub-component, poolExiting/poolSpawning conditional rendering
- `src/components/Scene.tsx` - SpawningDie rendering, canUnlock/maxUnlocks props
- `src/store/gameStore.ts` - poolExiting/poolSpawning state, corrected 12-die cap formula
- `src/types/game.ts` - poolExiting, poolSpawning, poolSpawnPositions fields
- `src/App.tsx` - Round transition timing (exit+spawn), first-round spawn, extended idle window
- `src/components/HUD.tsx` - Hide button during animations, corrected maxUnlocks formula
- `src/components/PlayerRow.tsx` - canUnlock/maxUnlocks/selectable props, dynamic ring/pulse
- `src/components/PlayerProfileGroup.tsx` - White score text, lowered 3px into star body
- `src/components/GoalProfileGroup.tsx` - 2.5x gold star, white circle background
- `src/utils/aiDecision.ts` - Corrected maxUnlocksForCap to include lockedCount
- `version.json` - Build 78 → 83

## Decisions Made
- SpawningDie as separate component (aligns with AnimatingDie/MitosisDie pattern)
- Extended roundEnd→idle from 1500ms to 2000ms (accommodates 12-die spawn stagger)
- ExitingDie inline in DicePool (simpler than separate file for a small component)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Unlock/skip button persisting during animations**
- **Found during:** Checkpoint verification
- **Issue:** After clicking UNLOCK, button stayed visible and label reverted to SKIP during animation
- **Fix:** Hide button when unlockAnimations or aiUnlockAnimations are in progress
- **Files modified:** src/components/HUD.tsx
- **Verification:** Button disappears immediately on click, reappears next unlock phase
- **Committed in:** 46e47da

**2. [Rule 1 - Bug] Score text dark on star, goal star too small**
- **Found during:** Checkpoint verification (user feedback)
- **Issue:** Score text was #1a1a1a (dark), hard to read. Goal row star same size as circle.
- **Fix:** Score text white with shadow, lowered 3px. Goal star 2.5x (75px), white circle, gold star.
- **Files modified:** src/components/PlayerProfileGroup.tsx, src/components/GoalProfileGroup.tsx
- **Verification:** Score visible on star, goal star prominently gold over white circle
- **Committed in:** 3e6f2f5

**3. [Rule 1 - Bug] 12-die cap formula incorrect — allowed 16+ total dice**
- **Found during:** Checkpoint verification (user reached 16 dice)
- **Issue:** Cap formula `floor((12-poolSize)/2)` ignored locked dice. Each unlock adds 1 net die (pool+2, locked-1), so correct cap is `12 - pool - locked`.
- **Fix:** Updated formula everywhere: store, Scene, HUD, PlayerRow, AI decision logic
- **Files modified:** src/store/gameStore.ts, src/components/Scene.tsx, src/components/HUD.tsx, src/utils/aiDecision.ts
- **Verification:** Total dice correctly capped at 12
- **Committed in:** 91f9fbc

**4. [Rule 1 - Bug] Unlock rings/pulse showing on unselectable dice**
- **Found during:** Checkpoint verification (user feedback)
- **Issue:** White rings and pulse animation showed on all locked dice during unlock phase, even when selecting them would exceed cap
- **Fix:** Added selectable prop to UnlockableDie; ring/pulse only shown when die can be toggled
- **Files modified:** src/components/PlayerRow.tsx, src/components/Scene.tsx
- **Verification:** Rings dynamically appear/disappear as selections approach cap
- **Committed in:** 91f9fbc

---

**Total deviations:** 4 auto-fixed (4 bugs), 0 deferred
**Impact on plan:** All fixes necessary for correctness and usability. No scope creep.

## Issues Encountered
None beyond checkpoint-reported bugs (all resolved).

## Next Phase Readiness
- Round transitions fully animated (exit + spawn bookends)
- 12-die cap correctly enforced everywhere
- Ready for 09-06 (goal column indicators)

---
*Phase: 09-multi-player-display*
*Completed: 2026-03-02*
