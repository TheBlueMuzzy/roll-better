---
phase: 33-connection-polish-edge-cases
plan: 01
subsystem: server, ui
tags: [partykit, websocket, duplicate-detection, error-handling]

# Dependency graph
requires:
  - phase: 27-player-identity-seat-model
    provides: Dual identity model (conn.id + persistentId), persistentIdToConnId map
  - phase: 31-host-migration-room-lifecycle
    provides: Typed error codes on ErrorMessage, room_full/room_closed patterns
provides:
  - Server duplicate-persistentId detection and old connection eviction
  - Client connected_elsewhere error state and UI
affects: [34-integration-testing-uat]

# Tech tracking
tech-stack:
  added: []
  patterns: [duplicate-connection eviction via persistentId lookup, pre-close error message pattern]

key-files:
  created: []
  modified: [party/server.ts, src/types/protocol.ts, src/hooks/useRoom.ts, src/components/MainMenu.tsx]

key-decisions:
  - "Eviction sends error message BEFORE closing old connection so client can set flag"
  - "In-game eviction uses non-intentional disconnect to trigger standard grace timer / bot promotion path"
  - "No new CSS needed — reused existing .menu-error and .menu-online-btn styles from room_full pattern"

patterns-established:
  - "Pre-close error pattern: send typed error, then close connection — client flags on message, not on close event"

issues-created: []

# Metrics
duration: 4min
completed: 2026-03-10
---

# Phase 33 Plan 01: Duplicate Connection Rejection Summary

**Server detects duplicate persistentId across tabs, evicts old connection with `connected_elsewhere` typed error, client shows "connected in another tab" with BACK TO MENU**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-10T05:33:28Z
- **Completed:** 2026-03-10T05:38:22Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Server duplicate-persistentId detection in `handleJoin` — evicts old active connection with typed error before proceeding
- In-game eviction triggers standard disconnect path (grace timer → bot promotion) so no data loss
- Client `connectedElsewhere` state with clear "You're connected in another tab" message and BACK TO MENU button
- Reused existing error styling patterns — no CSS additions needed

## Task Commits

Each task was committed atomically:

1. **Task 1: Server duplicate-persistentId detection and old connection eviction** - `2bb9e50` (feat)
2. **Task 2: Client handles connected_elsewhere error gracefully** - `21b5ce2` (feat)

## Files Created/Modified
- `party/server.ts` - Added duplicate persistentId check in handleJoin; evicts old connection from lobby (players map) or triggers non-intentional disconnect for in-game players; cleans up midGameJoiners and pendingSeatClaims
- `src/types/protocol.ts` - Documented `connected_elsewhere` as known error code on ErrorMessage
- `src/hooks/useRoom.ts` - Added `connectedElsewhere` state + `clearConnectedElsewhere` callback; error handler marks close as intentional and closes socket without reconnect
- `src/components/MainMenu.tsx` - Shows "connected in another tab" message with BACK TO MENU button; hides all normal online UI while error is displayed

## Decisions Made
- Eviction sends error message BEFORE closing old connection so client can set the flag before onclose fires
- In-game eviction uses `intentional=false` removePlayer to trigger standard grace timer / bot promotion path (no special handling needed)
- No new CSS — existing `.menu-error` and `.menu-online-btn` classes match the room_full pattern perfectly

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Ready for 33-02-PLAN.md (connection status UI polish)
- All error code patterns established and working

---
*Phase: 33-connection-polish-edge-cases*
*Completed: 2026-03-10*
