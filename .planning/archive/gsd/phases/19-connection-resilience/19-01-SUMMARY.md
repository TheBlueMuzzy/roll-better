---
phase: 19-connection-resilience
plan: 01
subsystem: infra
tags: [partykit, websocket, reconnection, session-storage]

# Dependency graph
requires:
  - phase: 18-unlock-scoring-sync
    provides: snapshot + delta hybrid sync, AFK timers, phase_sync recovery
provides:
  - Stable client ID via sessionStorage for PartySocket reconnection
  - Server rejoin detection in onConnect (offline player restoration)
  - RejoinStateMessage and PlayerReconnectedMessage protocol types
  - Intentional leave vs disconnect distinction
  - Room keepalive grace period (60s) for empty rooms during active games
affects: [19-02-client-reconnection-flow, 19-03-connection-status-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: [sessionStorage stable ID, server rejoin detection, keepalive timer]

key-files:
  created: []
  modified: [src/utils/partyClient.ts, src/types/protocol.ts, src/App.tsx, party/server.ts]

key-decisions:
  - "sessionStorage (not localStorage) for client ID — each tab gets unique ID per PartyKit requirements"
  - "intentionalLeave flag on ServerPlayerState — only intentional exits (leave message) prevent rejoin"
  - "60-second keepalive timer — empty room stays alive during active game for reconnection window"
  - "Server-internal 'waiting_for_rejoin' status — not exposed in protocol RoomStatus type"

patterns-established:
  - "Stable client ID: getStableClientId() from sessionStorage, passed to PartySocket constructor"
  - "Rejoin protocol: rejoin_state message carries full game snapshot (phase, round, goals, players)"

issues-created: []

# Metrics
duration: 4min
completed: 2026-03-05
---

# Phase 19 Plan 01: Stable Client ID + Server Rejoin Protocol Summary

**sessionStorage-based stable client ID for PartySocket reconnection, server rejoin detection with full state snapshot, intentional leave tracking, and 60s room keepalive grace period**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-05T06:06:22Z
- **Completed:** 2026-03-05T06:10:02Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Stable client ID via sessionStorage ensures PartySocket reconnects with same conn.id
- Server onConnect detects returning players and restores their game slot with full state snapshot
- Intentional leave (handleMenu sends "leave") prevents rejoin; network drops allow rejoin
- Empty rooms during active games survive 60s for player reconnection

## Task Commits

Each task was committed atomically:

1. **Task 1: Stable client ID + protocol types + intentional leave** - `de4ab29` (feat)
2. **Task 2: Server rejoin detection + keepalive grace period** - `f558470` (feat)

## Files Created/Modified
- `src/utils/partyClient.ts` - Added getStableClientId() using sessionStorage, passed id to PartySocket
- `src/types/protocol.ts` - Added RejoinStateMessage and PlayerReconnectedMessage to ServerMessage union
- `src/App.tsx` - handleMenu sends "leave" before socket.close()
- `party/server.ts` - Rejoin detection in onConnect, intentionalLeave flag, keepaliveTimer (60s), waiting_for_rejoin status

## Decisions Made
- sessionStorage for client ID (not localStorage) — each tab needs unique ID per PartyKit docs
- intentionalLeave flag prevents rejoin only for explicit exits, not network drops
- 60-second keepalive window balances reconnection opportunity vs resource cleanup
- Server-internal "waiting_for_rejoin" status not exposed in protocol RoomStatus type (cast as needed)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Rejoin protocol types defined and server handler implemented
- Ready for 19-02: Client reconnection flow (useRoom preserves game state, useOnlineGame handles rejoin_state)
- Ready for 19-03: Connection status UI (ConnectionBanner, toast notifications)

---
*Phase: 19-connection-resilience*
*Completed: 2026-03-05*
