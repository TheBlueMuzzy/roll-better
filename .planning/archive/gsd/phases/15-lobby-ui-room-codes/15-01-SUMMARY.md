---
phase: 15-lobby-ui-room-codes
plan: 01
subsystem: api
tags: [partykit, websocket, protocol, ready-up, game-start]

# Dependency graph
requires:
  - phase: 14-partykit-server-setup
    provides: Room server with player tracking, host assignment, message protocol
provides:
  - ReadyMessage and StartGameMessage client→server messages
  - GameStartingMessage server→client broadcast
  - Server-side ready toggle and host-only game start validation
affects: [15-02 useRoom hook, 15-03 lobby UI, 15-04 game start flow]

# Tech tracking
tech-stack:
  added: []
  patterns: [guard-early-return handler methods, host-authoritative validation]

key-files:
  created: []
  modified: [src/types/protocol.ts, party/server.ts]

key-decisions:
  - "aiDifficulty as string in protocol (not AIDifficulty type) to avoid game.ts import"
  - "Host exempt from ready check (host controls start button)"
  - "handleReady and handleStartGame as private methods following established handler pattern"

patterns-established:
  - "Host-only validation: conn.id !== this.hostId guard pattern"
  - "Ready-state broadcasting: toggle + broadcastRoomState for instant UI sync"

issues-created: []

# Metrics
duration: 3min
completed: 2026-03-03
---

# Phase 15 Plan 1: Protocol Extensions + Server Lobby Logic Summary

**Ready toggle, host-only game start validation, and game_starting broadcast added to Partykit protocol and server**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-03T15:58:38Z
- **Completed:** 2026-03-03T16:02:13Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Extended protocol with ReadyMessage, StartGameMessage (client→server) and GameStartingMessage (server→client)
- Server handles ready toggle (flip isReady + broadcast room_state)
- Server validates host-only game start with three guards: host check, player count, all-ready check
- Status transitions to "playing" on successful game start, preventing new joins

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend protocol types** - `c25f0fd` (feat)
2. **Task 2: Update server handlers** - `70b4e6b` (feat)

## Files Created/Modified
- `src/types/protocol.ts` - Added ReadyMessage, StartGameMessage, GameStartingMessage interfaces + updated union types
- `party/server.ts` - Added handleReady, handleStartGame methods + switch cases + GameStartingMessage import

## Decisions Made
- Used `string` for aiDifficulty in protocol (not the game.ts AIDifficulty enum) to keep protocol.ts free of game imports
- Host is exempt from the ready check — they control the start button
- Followed established private method pattern (handleReady, handleStartGame) matching handleJoin

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Protocol types ready for client consumption (15-02: useRoom hook)
- Server lobby lifecycle complete: join → ready → start_game → game_starting
- All type checks pass (client + server), build succeeds

---
*Phase: 15-lobby-ui-room-codes*
*Completed: 2026-03-03*
