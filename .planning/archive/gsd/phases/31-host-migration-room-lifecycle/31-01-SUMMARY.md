---
phase: 31-host-migration-room-lifecycle
plan: 01
subsystem: server
tags: [partykit, host-migration, room-lifecycle, websocket]

# Dependency graph
requires:
  - phase: 28-afk-autopilot-escalation
    provides: promoteToBotFromAFK bot promotion path
  - phase: 29-disconnect-handoff
    provides: removePlayer host migration logic, grace timer expiry
  - phase: 30-mid-game-join-flow
    provides: midGameJoiners map, pendingSeatClaims
provides:
  - migrateHost() reusable helper for host auto-migration
  - dissolveRoom() for all-bots room shutdown
  - room_closed typed message in ServerMessage union
affects: [32-play-again-rework, 33-connection-polish, 34-integration-testing]

# Tech tracking
tech-stack:
  added: []
  patterns: [migrateHost extraction, dissolveRoom lifecycle method]

key-files:
  created: []
  modified: [party/server.ts, src/types/protocol.ts, src/hooks/useRoom.ts]

key-decisions:
  - "migrateHost iterates game players for human-active with active connection"
  - "dissolveRoom broadcasts room_closed to all clients AND mid-game joiners before closing"
  - "No-migrate-back: once host migrates, original host never gets it back"

patterns-established:
  - "migrateHost() pattern: extract reusable helpers for cross-cutting server operations"

issues-created: []

# Metrics
duration: 5min
completed: 2026-03-09
---

# Phase 31 Plan 01: migrateHost & dissolveRoom Summary

**Extracted reusable migrateHost() helper wired into all 3 bot-promotion paths; dissolveRoom() broadcasts room_closed and shuts down when all seats are bots**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-09T21:05:11Z
- **Completed:** 2026-03-09T21:10:12Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Extracted `migrateHost()` method that finds next human-active player with active connection and transfers host role
- Wired migrateHost into `promoteToBotFromAFK()` (AFK escalation) and `removePlayer()` (disconnect), closing the gap where AFK-promoted hosts left a bot as host
- Extracted `dissolveRoom(reason)` method that broadcasts `room_closed` to all connected clients AND mid-game joiners, clears game state, and closes all connections
- Added typed `RoomClosedMessage` to `ServerMessage` union in protocol.ts (removed `as any` cast from existing usage)
- Added client-side `room_closed` handler in useRoom.ts — closes socket, resets state, returns to menu

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract migrateHost() helper** - `ffca2d8` (feat)
2. **Task 2: All-bots room dissolution** - `137361c` (feat)

## Files Created/Modified
- `party/server.ts` - Added migrateHost() and dissolveRoom() methods, wired into promoteToBotFromAFK and removePlayer
- `src/types/protocol.ts` - Added RoomClosedMessage interface to ServerMessage union
- `src/hooks/useRoom.ts` - Added room_closed message handler for client-side dissolution

## Decisions Made
- migrateHost() iterates game `this.players` (not connections) for `seatState === 'human-active'` with active connection — matches the pattern removePlayer already used
- dissolveRoom() sends room_closed to mid-game joiners separately before clearing the map
- No-migrate-back rule enforced inherently — no code restores hostId to returning players

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added typed RoomClosedMessage to replace `as any` cast**
- **Found during:** Task 2 (room_closed protocol check)
- **Issue:** Existing room_closed usage in server.ts used `as any` cast — no typed message existed
- **Fix:** Added `RoomClosedMessage` interface to protocol.ts, updated ServerMessage union, removed `as any`
- **Files modified:** src/types/protocol.ts
- **Verification:** `npx tsc --noEmit` passes with typed message

**2. [Rule 2 - Missing Critical] Added client-side room_closed handler in useRoom.ts**
- **Found during:** Task 2 (verifying client handles dissolution)
- **Issue:** Client had no explicit handler for room_closed in useRoom.ts message switch
- **Fix:** Added handler that closes socket, resets room state, navigates to menu with error message
- **Files modified:** src/hooks/useRoom.ts
- **Verification:** TypeScript compiles, handler covers dissolution case

---

**Total deviations:** 2 auto-fixed (both missing critical)
**Impact on plan:** Both fixes necessary for type safety and client-side dissolution handling. No scope creep.

## Issues Encountered
None

## Next Phase Readiness
- migrateHost() and dissolveRoom() ready for use by future phases
- Room Full message + TRY AGAIN button still needed (31-02-PLAN.md)
- Play Again rework (Phase 32) can build on dissolution pattern

---
*Phase: 31-host-migration-room-lifecycle*
*Completed: 2026-03-09*
