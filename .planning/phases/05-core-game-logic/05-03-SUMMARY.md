---
phase: 05-core-game-logic
plan: 03
subsystem: game-logic
tags: [zustand, scoring, handicap, round-loop, match-detection, phase-transitions]

# Dependency graph
requires:
  - phase: 05-02
    provides: findAutoLocks match detection function
provides:
  - Complete round loop (roll → auto-lock → winner check → score → handicap → new round)
  - Scoring formula (8 - poolSize * 2, floor 0)
  - Handicap system (winner shrinks pool, loser grows pool)
  - Session end detection (score >= 20)
affects: [Phase 6 animations, Phase 7 unlock, Phase 8 AI opponents]

# Tech tracking
tech-stack:
  added: []
  patterns: [phase-transition-via-useEffect-timers, store-driven-game-loop]

key-files:
  created: []
  modified:
    - src/store/gameStore.ts
    - src/App.tsx
    - src/components/HUD.tsx
    - src/App.css

key-decisions:
  - "Scoring: max(0, 8 - poolSize * 2) where poolSize = remaining unlocked dice at win"
  - "Phase transitions via chained useEffect timers with 1500ms delays for visual feedback"
  - "scoreRound sets 'scoring', applyHandicap sets 'roundEnd', initRound sets 'idle'"

patterns-established:
  - "Phase transition chain: useEffect watches phase → setTimeout → next action → new phase"

issues-created: []

# Metrics
duration: 3min
completed: 2026-03-01
---

# Phase 5 Plan 3: Scoring + Round Loop Summary

**Complete round loop wired — auto-lock via findAutoLocks, scoring (8 - poolSize*2), handicap adjustment, session-to-20 with phase-transition timer chain in App.tsx**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-01T06:08:41Z
- **Completed:** 2026-03-01T06:12:26Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Wired findAutoLocks into setRollResults — rolling auto-locks matching dice and decrements pool
- Full round loop: roll → locking → winner check → scoring → handicap → roundEnd → new round
- Scoring formula: max(0, 8 - poolSize * 2) — 0 remaining = 8pts perfect, 4+ remaining = 0pts
- Handicap: winner startingDice -1 (min 1), loser startingDice +1 (max 12)
- Session ends at 20 points with "Game Over!" display
- HUD shows round count, score/target, pool stats, and phase-appropriate status text

## Task Commits

Each task was committed atomically:

1. **Task 1: Integrate match detection into game flow** - `4771c04` (feat)
2. **Task 2: Scoring, handicap, and round transitions** - `1551780` (feat)

## Files Created/Modified
- `src/store/gameStore.ts` — Imported findAutoLocks, wired into setRollResults, added scoreRound/applyHandicap/checkWinner/checkSessionEnd, updated initRound with goal generation
- `src/App.tsx` — Added useEffect chain for locking→scoring→roundEnd→idle phase transitions with 1500ms delays
- `src/components/HUD.tsx` — Added scoring/roundEnd/sessionEnd status text, pool stats display
- `src/App.css` — Added .hud-pool-stats styling
- `version.json` — Build bumped 44 → 46

## Decisions Made
- Scoring formula: `max(0, 8 - poolSize * 2)` where poolSize = remaining unlocked dice at win time (matches rules spec)
- Phase transitions use chained useEffect timers (1500ms each) for visual feedback between scoring → roundEnd → new round
- scoreRound sets phase to 'scoring', applyHandicap sets to 'roundEnd', initRound sets to 'idle' — clean separation of concerns

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed scoring formula alignment**
- **Found during:** Task 2 (scoreRound implementation)
- **Issue:** Existing scoreRound stub used `(poolSize - 8) * 2` which would always give 8 pts when poolSize <= 8
- **Fix:** Changed to `max(0, 8 - poolSize * 2)` per rules spec — poolSize = remaining unlocked dice
- **Files modified:** src/store/gameStore.ts
- **Verification:** Formula verified: 0 remaining = 8pts, 1 remaining = 6pts, 4+ remaining = 0pts
- **Committed in:** 1551780

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Bug fix necessary for correct scoring. No scope creep.

## Issues Encountered
None

## Next Phase Readiness
- Round loop fully functional — roll, auto-lock, score, handicap, next round
- Ready for 05-04-PLAN.md (auto-lock logic refinements)
- Phase 6 (lerp animations) can begin once Phase 5 completes

---
*Phase: 05-core-game-logic*
*Completed: 2026-03-01*
