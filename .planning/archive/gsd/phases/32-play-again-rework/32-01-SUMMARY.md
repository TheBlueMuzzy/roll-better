---
phase: 32-play-again-rework
plan: 01
subsystem: api
tags: [partykit, websocket, protocol, lobby, play-again]

# Dependency graph
requires:
  - phase: 31-host-migration-room-lifecycle
    provides: migrateHost(), dissolveRoom(), typed error codes
  - phase: 30-mid-game-join-flow
    provides: mid-game join protocol for late returners
provides:
  - play_again message type and handlePlayAgain server handler
  - sessionEnd → waiting lobby transition with room code reuse
  - previousGamePersistentIds map for auto-match (Plan 32-02)
  - handleStartGame support for ready/unready player mix
  - migrateHost lobby fallback (null gameState)
affects: [32-play-again-rework, 33-connection-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [play_again → lobby transition, unready players become bots]

key-files:
  created: []
  modified: [src/types/protocol.ts, party/server.ts]

key-decisions:
  - "previousGamePersistentIds persists through game for auto-match, cleared only on next sessionEnd → lobby transition"
  - "Unready players removed from players map but WebSocket stays open for later mid-game join"
  - "Replaced restart_game flow entirely with play_again → lobby → start_game"

patterns-established:
  - "Play Again lobby reuse: same room code, sessionEnd → waiting transition"
  - "Bot fill from unready: host starts early, unready seats become bots"

issues-created: []

# Metrics
duration: 6min
completed: 2026-03-09
---

# Phase 32 Plan 01: Protocol Types + handlePlayAgain Summary

**Server play_again protocol replacing restart_game, with sessionEnd → lobby transition, previous game ID preservation, and ready/unready player handling at start**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-09T21:45:59Z
- **Completed:** 2026-03-09T21:51:35Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Replaced restart_game with play_again → lobby → start_game flow
- Server transitions sessionEnd → waiting lobby, preserving previous game persistentIds for auto-match
- handleStartGame supports mixed ready/unready players (unready become bot seats)
- migrateHost works in both game and lobby contexts (null gameState fallback)

## Task Commits

Each task was committed atomically:

1. **Task 1: Protocol types + handlePlayAgain lobby transition** - `acb1cf1` (feat)
2. **Task 2: handleStartGame post-game lobby + lobby host migration** - `e2fc5ed` (feat)

**Plan metadata:** (this commit) (docs: complete plan)

## Files Created/Modified
- `src/types/protocol.ts` - Replaced RestartGameMessage with PlayAgainMessage, added PlayAgainAckMessage
- `party/server.ts` - Added handlePlayAgain, modified handleStartGame, fixed migrateHost for lobby, removed handleRestartGame

## Decisions Made
- previousGamePersistentIds persists through the game (not cleared at start) — Plan 32-02 needs it for late joiner auto-match during gameplay. Cleared only on next sessionEnd → lobby transition.
- Unready players' WebSocket connections stay open when removed from players map — they can later send play_again to trigger mid-game join (Plan 32-02).
- Replaced restart_game flow entirely — no backward compatibility shim.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Non-host last player leaving lobby left room in limbo**
- **Found during:** Task 2 (handleStartGame + edge cases)
- **Issue:** When the last non-host player left during "waiting" status with no gameState, removePlayer didn't clean up — room stayed in status="waiting" with 0 players and no host
- **Fix:** Added explicit cleanup branch in removePlayer: when no players remain and status is "waiting", set status to "closed"
- **Files modified:** party/server.ts
- **Verification:** Logic path verified via code analysis
- **Committed in:** e2fc5ed (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug), 0 deferred
**Impact on plan:** Bug fix necessary for correctness. No scope creep.

## Issues Encountered
None

## Next Phase Readiness
- Server-side play again protocol complete, ready for client UI (Plan 32-02)
- previousGamePersistentIds available for auto-match logic (Plan 32-02)
- Mid-game join ack path stubbed for Plan 32-02 implementation

---
*Phase: 32-play-again-rework*
*Completed: 2026-03-09*
