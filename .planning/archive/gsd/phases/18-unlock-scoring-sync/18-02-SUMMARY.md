---
phase: 18-unlock-scoring-sync
plan: 02
subsystem: sync
tags: [round-transitions, online, animations, bugfix]

# Dependency graph
requires:
  - phase: 18-unlock-scoring-sync/01
    provides: applyOnlineScoring, applyOnlineSessionEnd, scoring phase sync
provides:
  - Online roundEnd exit animations (pool shrink, goal fly-out)
  - Full round_start handler (server player sync, goal enter, pool spawn)
  - applyServerPlayerSync store action (handicap data before initRound)
  - BUG-002 diagnosed and fixed
affects: [18-unlock-scoring-sync, 19-connection-resilience]

# Tech tracking
tech-stack:
  added: []
  patterns: [deferred phase transition with safety timeout, server player sync before initRound]

key-files:
  created: []
  modified: [src/hooks/useOnlineGame.ts, src/store/gameStore.ts]

key-decisions:
  - "roundEnd triggers exit animations immediately — not deferred by lingering animations"
  - "applyServerPlayerSync maps server handicap data to local players before initRound"
  - "Deferred phase_change polling gets 5s safety timeout to prevent infinite loops"
  - "setRollResults must NOT clear pending reveal buffers — reveals arriving during physics settle were being lost"

patterns-established:
  - "Safety timeout on deferred animations: 5s fallback prevents infinite polling when stale animation state blocks transitions"

issues-created: []

# Metrics
duration: ~30min (includes UAT bugfixes)
completed: 2026-03-04
---

# Phase 18 Plan 02: Round Transitions Summary

**Online round-to-round cycle: roundEnd exit animations → round_start enter transitions → next round idle**

## Performance

- **Duration:** ~30 min (including UAT and bugfixes)
- **Started:** 2026-03-04
- **Completed:** 2026-03-04
- **Tasks:** 2 (auto + checkpoint)
- **Files modified:** 2

## Accomplishments
- roundEnd phase_change triggers pool exit (shrink) + goal exit (fly-out) animations
- round_start handler applies server handicap data via applyServerPlayerSync, calls initRound with server goals, triggers goal enter + pool spawn animations
- Full round cycle matches local play: scoring → roundEnd exit → round_start enter → idle

## Task Commits

1. **Task 1: Round transitions** — `d66365e` (feat)
2. **Bugfix: Online sync bugs** — `45316e2` (fix)
   - setRollResults no longer clears pendingLockReveals/pendingUnlockReveals (reveals during physics settle were lost)
   - applyOtherPlayerUnlockReveal falls back to goalValues[slotIndex] instead of hardcoded 1
   - Deferred phase_change polling gets 5s safety timeout
3. **BUG-002 documented** — `b7d6ef5` (docs)

## Files Created/Modified
- `src/hooks/useOnlineGame.ts` — roundEnd exit triggers, full round_start handler, deferred phase safety timeout
- `src/store/gameStore.ts` — applyServerPlayerSync action, buffered reveal preservation in setRollResults

## Decisions Made
- Exit animations fire immediately on roundEnd (not deferred)
- Server handicap data applied before initRound so pool sizes are correct
- 5s safety timeout on deferred phase transitions prevents infinite polling

## Deviations from Plan
- Three sync bugs found during UAT required a fix commit (45316e2)
- BUG-002 found and fixed during testing

## Issues Encountered
- BUG-002: Buffered reveals lost during physics settling — fixed by not clearing pending buffers in setRollResults
- Unlock reveal showed value 1 instead of correct goal value — fixed fallback logic

## Next Phase Readiness
- Round transitions complete
- Ready for 18-03-PLAN.md (rolling AFK timer) — not yet executed
- Restart game flow added in separate commit (a4078b6, outside plan scope)

---
*Phase: 18-unlock-scoring-sync*
*Completed: 2026-03-04*
