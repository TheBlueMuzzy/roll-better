---
phase: 17-dice-sync-simultaneous-play
plan: 01
subsystem: networking
tags: [partykit, partysocket, zustand, websocket, hooks]

# Dependency graph
requires:
  - phase: 16-state-sync-protocol
    provides: Server game engine (roll handler, unlock/scoring handlers, protocol types)
  - phase: 14-partykit-server-setup
    provides: partyClient.ts thin wrapper, createPartyConnection
  - phase: 15-lobby-ui-room-codes
    provides: useRoom hook, LobbyScreen visible-prop pattern, socket lifecycle
provides:
  - Module-level game socket access (setGameSocket/getGameSocket)
  - Online mode detection (isOnlineGame, onlinePlayerId)
  - useOnlineGame hook with message routing and action senders
  - Pending server results storage (pendingServerResults, pendingUnlockResult)
affects: [17-02 dice roll sync, 17-03 phase/unlock sync, 18 scoring sync]

# Tech tracking
tech-stack:
  added: []
  patterns: [addEventListener coexistence with onmessage, module-level socket singleton, pending-result store pattern]

key-files:
  created: [src/hooks/useOnlineGame.ts]
  modified: [src/utils/partyClient.ts, src/store/gameStore.ts, src/hooks/useRoom.ts, src/App.tsx, src/types/game.ts]

key-decisions:
  - "addEventListener('message') instead of onmessage to coexist with useRoom's handler"
  - "Module-level socket singleton (not React ref) for cross-hook access"
  - "Pending server results stored in zustand for consumption by future plans"

patterns-established:
  - "Module-level singleton: setGameSocket/getGameSocket persists socket outside React lifecycle"
  - "addEventListener coexistence: multiple handlers on same socket without conflict"
  - "No-op early return: useOnlineGame returns no-ops when offline, zero overhead"

issues-created: []

# Metrics
duration: 5min
completed: 2026-03-03
---

# Phase 17 Plan 01: Online Game Infrastructure Summary

**Module-level game socket singleton, online mode store flags, and useOnlineGame hook with message routing + action senders for roll/unlock/skip requests**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-03T19:47:14Z
- **Completed:** 2026-03-03T19:52:52Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Module-level game socket reference (setGameSocket/getGameSocket) persists socket outside React lifecycle for cross-hook access
- Online mode flags in store (isOnlineGame, onlinePlayerId) with setOnlineMode/clearOnlineMode actions
- useOnlineGame hook with addEventListener-based message routing (coexists with useRoom's onmessage)
- Three action senders: sendRollRequest, sendUnlockRequest, sendSkipUnlock — guarded against null socket
- Pending server results storage: pendingServerResults and pendingUnlockResult in zustand store

## Task Commits

Each task was committed atomically:

1. **Task 1: Module-level game socket + online mode store flags** - `82cd3a5` (feat)
2. **Task 2: useOnlineGame hook with message routing and action senders** - `75428f2` (feat)

## Files Created/Modified
- `src/hooks/useOnlineGame.ts` - New hook: message listener + action senders for online game communication
- `src/utils/partyClient.ts` - Added setGameSocket/getGameSocket module-level singleton
- `src/store/gameStore.ts` - Added isOnlineGame, onlinePlayerId, pendingServerResults, pendingUnlockResult + setters
- `src/types/game.ts` - Added isOnlineGame and onlinePlayerId to GameState interface
- `src/hooks/useRoom.ts` - Calls setGameSocket on game_starting
- `src/App.tsx` - Wires setOnlineMode on game start, clearOnlineMode + setGameSocket(null) on menu, calls useOnlineGame

## Decisions Made
- Used addEventListener('message') instead of socket.onmessage to avoid conflicting with useRoom's existing handler — both fire independently
- Module-level singleton for socket (not React ref) so it's accessible from any hook without prop drilling
- Pending server results stored in zustand store rather than local state — enables consumption by future plans (17-02, 17-03)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Online infrastructure fully wired — socket accessible, store has online flags, hook listens for messages
- Ready for 17-02 (dice roll sync) to wire sendRollRequest into handleRoll and consume pendingServerResults
- Ready for 17-03 (phase/unlock sync) to wire sendUnlockRequest/sendSkipUnlock

---
*Phase: 17-dice-sync-simultaneous-play*
*Completed: 2026-03-03*
