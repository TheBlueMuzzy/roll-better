---
phase: 27-player-identity-seat-model
plan: 01
subsystem: auth
tags: [localStorage, persistent-id, seat-mapping, partykit, websocket]

# Dependency graph
requires:
  - phase: 19-connection-resilience
    provides: sessionStorage-based conn.id reconnection
provides:
  - persistent player ID (localStorage rb-player-id)
  - server-side persistentIdToConnId seat mapping
  - protocol fields for persistent identity
affects: [28-afk-autopilot, 29-disconnect-handoff, 30-mid-game-join, 32-play-again-rework]

# Tech tracking
tech-stack:
  added: []
  patterns: [dual-identity (session conn.id + persistent player ID)]

key-files:
  modified:
    - src/utils/partyClient.ts
    - src/types/protocol.ts
    - src/hooks/useRoom.ts
    - party/server.ts
    - version.json

key-decisions:
  - "localStorage for persistent ID, sessionStorage for conn.id — dual identity model"
  - "persistentIdToConnId map persists after disconnect for returning player detection"
  - "Bot persistentId = bot-N for consistent identity"
  - "ConnectedMessage sends empty persistentId placeholder — real ID confirmed via join flow"

patterns-established:
  - "Dual identity: conn.id for WebSocket session, persistentId for cross-session seat ownership"

issues-created: []

# Metrics
duration: 7min
completed: 2026-03-07
---

# Phase 27 Plan 01: Persistent Player ID & Protocol Summary

**localStorage-based persistent player ID with server seat mapping via persistentIdToConnId Map**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-07T04:47:25Z
- **Completed:** 2026-03-07T04:54:12Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Added `getPersistentPlayerId()` using localStorage key `rb-player-id` — survives browser close/reopen
- Extended protocol with `persistentId` field on JoinMessage, ConnectedMessage, and RoomPlayer
- Server stores persistent ID per player and maintains `persistentIdToConnId` Map for seat ownership
- Join flow sends persistent ID from client; server logs it on join
- Bot players get stable `persistentId = "bot-N"` identities

## Task Commits

Each task was committed atomically:

1. **Task 1: Client-side persistent player ID + protocol update** - `f17bce8` (feat)
2. **Task 2: Server persistent ID storage and seat mapping** - `c8cde69` (feat)

## Files Created/Modified
- `src/utils/partyClient.ts` — added `getPersistentPlayerId()` with localStorage persistence
- `src/types/protocol.ts` — added `persistentId: string` to JoinMessage, ConnectedMessage, RoomPlayer
- `src/hooks/useRoom.ts` — join message now includes `persistentId: getPersistentPlayerId()`
- `party/server.ts` — ServerPlayerState.persistentId, persistentIdToConnId map, handleJoin stores mapping, handleStartGame/handleRestartGame copy persistentId, bots get "bot-N" IDs
- `version.json` — build 18 -> 19

## Decisions Made
- Dual identity model: conn.id (sessionStorage) for WebSocket reconnection, persistentId (localStorage) for cross-session seat ownership
- persistentIdToConnId map intentionally NOT cleared on disconnect — enables returning player detection
- ConnectedMessage sends empty persistentId placeholder since persistent ID arrives in join message, not onConnect
- Bot persistentId = "bot-N" for consistent identity across sessions

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed unused parameter warning in handleJoin**
- **Found during:** Task 2 (server persistent ID storage)
- **Issue:** `color` parameter in `handleJoin` was already unused (server assigns colors by join order), causing TS6133 warning that blocked compilation
- **Fix:** Renamed to `_color` to suppress warning
- **Files modified:** party/server.ts
- **Verification:** `npx tsc --noEmit -p tsconfig.server.json` passes
- **Committed in:** c8cde69 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Pre-existing issue, not introduced by this phase. No scope creep.

## Issues Encountered
None

## Next Phase Readiness
- Persistent identity foundation complete — all downstream phases (28-34) can reference persistentId
- Ready for 27-02-PLAN.md

---
*Phase: 27-player-identity-seat-model*
*Completed: 2026-03-07*
