---
phase: 16-state-sync-protocol
plan: 02
subsystem: api
tags: [partykit, websocket, server-authoritative, scoring, handicap, unlock, AFK-timeout]

# Dependency graph
requires:
  - phase: 16-state-sync-protocol/01
    provides: Protocol types, server game state, roll handler
  - phase: 08-ai-opponents
    provides: getAIUnlockDecision pure function for bot unlock choices
provides:
  - Server unlock/skip collection with wait-for-all pattern
  - Server scoring with penalty formula, handicap adjustment
  - Server round transitions and session end detection
  - Multi-winner support (simultaneous goal completion)
  - AFK timeout (20s auto-skip for unresponsive players)
  - Disconnect-safe unlock phase (marks players offline, re-checks)
affects: [17-dice-sync, 18-unlock-scoring-sync, 19-connection-resilience]

# Tech tracking
tech-stack:
  added: []
  patterns: [wait-for-all response collection, AFK timeout auto-skip, disconnect-safe phase advancement]

key-files:
  created: []
  modified: [party/server.ts, src/types/protocol.ts]

key-decisions:
  - "Multi-winner scoring: all players with 8 locked dice score independently on same roll"
  - "ScoringMessage uses winners[] array instead of single winnerId"
  - "Session end: highest score wins, ties are ties (client determines from player states)"
  - "Starting dice = 2 (matches PRD and client initGame)"
  - "20-second AFK timeout auto-skips unresponsive players during unlock phase"
  - "Disconnect during unlock: marks isOnline=false, re-checks responses to unblock game"

patterns-established:
  - "Wait-for-all collection: store responses per player, check completion after each response"
  - "AFK timeout pattern: start timer on phase entry, clear on all-responded, auto-action on expiry"
  - "Disconnect-safe game state: removePlayer updates both room players and gameState players"

issues-created: []

# Metrics
duration: 33min
completed: 2026-03-03
---

# Phase 16 Plan 2: Server Unlock/Scoring Handlers Summary

**Complete server game engine: unlock/skip collection with wait-for-all, multi-winner scoring, handicap, round transitions, session end, AFK timeout, and disconnect-safe unlock phase**

## Performance

- **Duration:** 33 min
- **Started:** 2026-03-03T18:40:54Z
- **Completed:** 2026-03-03T19:13:56Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 2 (+ version.json)

## Accomplishments
- Server collects unlock/skip from all online players (wait-for-all pattern)
- Server processes AI bot unlock decisions via shared getAIUnlockDecision
- Multi-winner support: all players who complete 8 locks on same roll get scored
- Scoring formula matches client exactly: penalties [1,0,1,1], max(0, 8 - penalty)
- Handicap: winners -1 dice (min 1), others +1 (max 12)
- Session end at score >= 20, broadcasts final player states
- 20-second AFK timeout auto-skips unresponsive players
- Disconnect during unlock marks player offline and re-checks to prevent game stall
- Timer cleanup prevents callbacks after room close

## Task Commits

1. **Tasks 1-2: Unlock/skip handlers + scoring/round transitions** - `b0947af` (feat)
2. **Audit fixes: disconnect stall, starting dice, multi-winner, AFK timeout** - `f48ba0b` (fix)

**Plan metadata:** (this commit)

_Note: Tasks 1 and 2 committed together because unlock handlers and scoring are deeply intertwined in server.ts (locking timer → checkWinnerOrUnlock → unlock phase all depend on each other)_

## Files Created/Modified
- `party/server.ts` - Added ~350 lines: handleUnlockRequest, handleSkipUnlock, processAllUnlocks, checkWinnerOrUnlock, handleScoring (multi-winner), handleHandicapAndNextRound, autoSkipUnresponsivePlayers, cleanupTimers, disconnect-safe removePlayer
- `src/types/protocol.ts` - Changed ScoringMessage: winnerId → winners[] array

## Decisions Made
- Multi-winner scoring: ScoringMessage.winners is an array of {playerId, roundScore}, not a single winnerId
- Starting dice = 2 (aligned with PRD and client, was incorrectly 5)
- 20-second AFK timeout chosen as reasonable balance (not too aggressive, not too slow)
- Session end winner determination left to client (server sends all player states)
- Must-unlock guard: server rejects skip_unlock when poolSize=0 and lockedDice < 8

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Starting dice mismatch: server had 5, PRD/client has 2**
- **Found during:** Audit review after Task 2
- **Issue:** Server initialized players with startingDice: 5, but PRD and client both use 2
- **Fix:** Changed to startingDice: 2 and poolSize: 2 (both online and bot players)
- **Files modified:** party/server.ts
- **Committed in:** f48ba0b

**2. [Rule 2 - Missing Critical] Disconnect during unlock phase caused permanent game stall**
- **Found during:** Audit review after Task 2
- **Issue:** removePlayer only removed from room players map, not from gameState — disconnected player's isOnline stayed true, unlock collection waited forever
- **Fix:** removePlayer now sets isOnline=false in gameState and re-checks unlock responses
- **Files modified:** party/server.ts
- **Committed in:** f48ba0b

**3. [Rule 2 - Missing Critical] No AFK timeout on unlock phase**
- **Found during:** Audit review after Task 2
- **Issue:** Connected-but-unresponsive players could stall the game indefinitely
- **Fix:** 20-second unlockTimeoutTimer auto-skips unresponsive players
- **Files modified:** party/server.ts
- **Committed in:** f48ba0b

**4. [Rule 1 - Bug] Single-winner assumption when multiple players can complete simultaneously**
- **Found during:** Audit review after Task 2
- **Issue:** checkWinnerOrUnlock used Array.find (first match only), but simultaneous play means multiple players can hit 8 locks on the same roll
- **Fix:** Changed to Array.filter, handleScoring/handleHandicapAndNextRound accept winnerIds[] array, ScoringMessage uses winners[] array
- **Files modified:** party/server.ts, src/types/protocol.ts
- **Committed in:** f48ba0b

---

**Total deviations:** 4 auto-fixed (2 bugs, 2 missing critical), 0 deferred
**Impact on plan:** All fixes necessary for correctness. No scope creep.

## Issues Encountered
None

## Next Phase Readiness
- Server game engine complete: handles full lifecycle from roll to session end
- Protocol types finalized for client consumption
- Ready for Phase 17: wire clients to consume server messages (roll_results, unlock_result, scoring, round_start, session_end)
- Phase 16 complete — all 2 plans finished

---
*Phase: 16-state-sync-protocol*
*Completed: 2026-03-03*
