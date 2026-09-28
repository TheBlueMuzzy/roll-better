---
phase: 16-state-sync-protocol
plan: 01
subsystem: api
tags: [partykit, websocket, protocol, server-authoritative, findAutoLocks]

# Dependency graph
requires:
  - phase: 15-lobby-ui-room-codes
    provides: Room server with lobby lifecycle, protocol types, useRoom hook
  - phase: 05-core-game-logic
    provides: findAutoLocks pure function for match detection
provides:
  - Game action protocol types (roll, unlock, phase change, round start, scoring, session end)
  - Server-side game state tracking (ServerGameState, ServerPlayerState)
  - Server roll handler with auto-lock computation
  - LockedDieSync and PlayerSyncState shared sync types
affects: [17-dice-sync, 18-unlock-scoring-sync, 19-connection-resilience]

# Tech tracking
tech-stack:
  added: []
  patterns: [server-authoritative game state, protocol-local sync types, shared pure functions between client/server]

key-files:
  created: []
  modified: [src/types/protocol.ts, party/server.ts]

key-decisions:
  - "LockedDieSync defined locally in protocol.ts (not imported from game.ts) to keep protocol import-free"
  - "ServerGameState/ServerPlayerState are file-local interfaces in server.ts (not exported)"
  - "First round reuses goalValues from game_starting message to avoid double generation"
  - "findAutoLocks imported from client utils — pure function works in any JS runtime"
  - "Duplicate roll guard: silently ignore roll_request during rolling/locking phases"

patterns-established:
  - "Server-authoritative roll generation: server generates dice values, computes auto-locks, broadcasts results"
  - "Protocol sync types pattern: define *Sync versions of game types in protocol.ts to avoid cross-imports"
  - "Phase transition with timeout: broadcast results → setTimeout → advance phase"

issues-created: []

# Metrics
duration: 8min
completed: 2026-03-03
---

# Phase 16 Plan 1: Protocol Types + Server Game State + Roll Handler Summary

**Server-authoritative game engine foundation: protocol types for all game actions, server state tracking with round initialization, and roll handler that generates dice + computes auto-locks via shared findAutoLocks**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-03T18:19:23Z
- **Completed:** 2026-03-03T18:28:20Z
- **Tasks:** 3
- **Files modified:** 2 (+ version.json)

## Accomplishments
- Full game action protocol: roll request/results, unlock request/result, phase change, round start, scoring, session end
- Server tracks complete game state (players, round, goals, phase, roll/unlock responses)
- Server generates roll results for all players (online + bots) and computes auto-locks using shared findAutoLocks
- Phase transition flow: idle → rolling → locking → unlocking (with 1s timeout)

## Task Commits

Each task was committed atomically:

1. **Task 1: Game action protocol types** - `5114309` (feat)
2. **Task 2: Server game state tracking + initialization** - `73e3d79` (feat)
3. **Task 3: Server roll handler** - `a3ab02e` (feat)

## Files Created/Modified
- `src/types/protocol.ts` - Added ~95 lines: LockedDieSync, PlayerSyncState, PlayerRollResult, all client→server and server→client game action messages
- `party/server.ts` - Added ~230 lines: ServerGameState/ServerPlayerState interfaces, gameState property, serverInitRound(), handleRollRequest() with findAutoLocks integration

## Decisions Made
- LockedDieSync defined locally in protocol.ts (same shape as game.ts LockedDie but protocol-safe)
- Server interfaces kept file-local (not exported) — internal implementation detail
- First round reuses goalValues from game_starting to avoid double generation
- findAutoLocks shared between client and server via direct import (pure function, no React deps)
- Duplicate roll guard silently ignores concurrent requests

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Protocol types ready for client-side consumption (Phase 17)
- Server roll handler ready — clients need to send roll_request and handle roll_results
- Unlock/scoring handlers still needed (16-02) before full game loop works
- Ready for 16-02: Server unlock/scoring handlers + verification

---
*Phase: 16-state-sync-protocol*
*Completed: 2026-03-03*
