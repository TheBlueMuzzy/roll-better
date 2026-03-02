---
phase: 08-ai-opponents
plan: 01
subsystem: ai
tags: [vitest, tdd, heuristics, pure-function, typescript]

# Dependency graph
requires:
  - phase: 05-core-game-logic
    provides: findAutoLocks, scoring formula, must-unlock rule, 12-die cap
provides:
  - getAIUnlockDecision() pure function with Easy/Medium/Hard strategies
  - AIDifficulty and AIDecisionInput exported types
affects: [08-02 AI integration, 10-03 AI difficulty settings]

# Tech tracking
tech-stack:
  added: []
  patterns: [difficulty-stratified AI heuristics, expected-match-rate calculation]

key-files:
  created: [src/utils/aiDecision.ts, src/utils/aiDecision.test.ts]
  modified: []

key-decisions:
  - "Easy uses 40% random unlock, max 1 die — feels indecisive"
  - "Medium uses poolSize < remainingSlots/2 heuristic with frequency-based picks"
  - "Hard uses expectedMatchRate threshold (0.5) with least-frequent sacrifice strategy"
  - "Match rate = (poolSize * uniqueRemaining/6) / remainingSlots — efficiency metric"

patterns-established:
  - "AI strategy pattern: shared constraint checks (cap, must-unlock) → difficulty-specific strategy function"

issues-created: []

# Metrics
duration: 6min
completed: 2026-03-02
---

# Phase 8 Plan 1: AI Unlock Decision Engine Summary

**Pure-function AI unlock heuristics (Easy/Medium/Hard) with 24 Vitest tests covering constraints, strategies, and edge cases**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-02T02:58:45Z
- **Completed:** 2026-03-02T03:05:37Z
- **Tasks:** 2 (RED + GREEN)
- **Files modified:** 2

## Accomplishments
- 24-test suite covering all three difficulty strategies + constraint enforcement
- Pure function with no side effects or store dependencies — ready for integration
- Constraint-first architecture: must-unlock and 12-die cap checked before any strategy runs
- Easy/Medium/Hard produce meaningfully different decisions for the same game state

## Task Commits

Each TDD phase was committed atomically:

1. **RED: Failing tests** - `749dc4d` (test)
2. **GREEN: Implementation** - `d5dd636` (feat)
3. **REFACTOR:** Not needed — code was clean

## Files Created/Modified
- `src/utils/aiDecision.ts` - 211 lines: AI unlock decision engine with Easy/Medium/Hard strategies
- `src/utils/aiDecision.test.ts` - 383 lines: 24 tests across 4 describe blocks

## Decisions Made
- Match rate formula: `(poolSize * uniqueRemainingValues/6) / remainingSlots` — measures fill efficiency, not raw expected matches
- Hard strategy simulates unlocking one-at-a-time to find minimum unlocks needed
- Easy caps at 1 unlock max (feels like an AI that barely engages with the unlock mechanic)
- Medium picks most-frequent values (maximizes re-match probability); Hard picks least-frequent (sacrifices low-value locks)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Adjusted match rate calculation for Hard strategy**
- **Found during:** GREEN phase
- **Issue:** Spec said "< 0.5 matches per roll" which would be raw expected count. For Hard to correctly unlock when poolSize=2 with 6 remaining slots, the rate needs to be match efficiency (divided by remaining slots)
- **Fix:** Used `expectedMatches / remainingSlots` instead of raw `expectedMatches`
- **Verification:** Hard strategy correctly triggers unlock at poolSize=2 with 6 remaining
- **Committed in:** d5dd636 (GREEN commit)

### Deferred Enhancements

None.

---

**Total deviations:** 1 auto-fixed (match rate formula interpretation)
**Impact on plan:** Necessary for correct Hard strategy behavior. No scope creep.

## Issues Encountered
None

## Next Phase Readiness
- AI decision engine ready for integration in 08-02
- Types exported for import by turn system
- No blockers

---
*Phase: 08-ai-opponents*
*Completed: 2026-03-02*
