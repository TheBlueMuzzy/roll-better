---
phase: 15-lobby-ui-room-codes
plan: 02
subsystem: ui
tags: [react-hook, websocket, partysocket, lobby, screen-routing, zustand]

# Dependency graph
requires:
  - phase: 14-partykit-server-setup
    provides: partyClient.ts thin factory + typed helpers, protocol types
  - phase: 15-lobby-ui-room-codes plan 01
    provides: ReadyMessage, StartGameMessage, GameStartingMessage protocol types
  - phase: 10-screens-flow
    provides: Screen state union pattern in Zustand, MainMenu component
provides:
  - useRoom hook for WebSocket lobby state management
  - 'lobby' screen state in game type union
  - Play Online button in MainMenu
  - gameStartData payload for lobby → game transition
affects: [15-03 lobby screen UI, 15-04 game start flow + AI fill]

# Tech tracking
tech-stack:
  added: []
  patterns: [useRef for socket + pendingJoin, useState for reactive room state, error auto-clear timer]

key-files:
  created: [src/hooks/useRoom.ts]
  modified: [src/types/game.ts, src/components/MainMenu.tsx, src/App.tsx]

key-decisions:
  - "Room codes: 4-letter uppercase from ABCDEFGHJKLMNPQRSTUVWXYZ (no I/O confusion)"
  - "useRoom hook isolated from gameStore — App.tsx bridges between them"
  - "pendingJoinRef pattern: store name+color, send join after 'connected' message received"

patterns-established:
  - "useRef for WebSocket + pendingJoin (non-reactive), useState for all UI-facing state"
  - "Error auto-clear: setTimeout 3s with cleanup ref"
  - "isHost derived from hostId === playerId (not separate state)"

issues-created: []

# Metrics
duration: 6min
completed: 2026-03-03
---

# Phase 15 Plan 2: useRoom Hook + Lobby Screen Routing Summary

**React hook wrapping PartySocket with full lobby state management, plus 'lobby' screen routing and Play Online button**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-03T16:07:25Z
- **Completed:** 2026-03-03T16:13:42Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- useRoom hook encapsulates entire WebSocket lifecycle: connect, join, ready, start, leave, cleanup
- Room code generation: 4-letter uppercase (I/O excluded) via Math.random()
- All 6 ServerMessage types handled: connected, room_state, player_joined, player_left, game_starting, error
- Screen state extended to 4 values: menu, lobby, game, winners
- MainMenu "Play Online" button wired through to lobby screen transition

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useRoom hook** - `3d2662a` (feat)
2. **Task 2: Add lobby screen state + Play Online button** - `a229dc3` (feat)

## Files Created/Modified
- `src/hooks/useRoom.ts` - New hook: room state, connection lifecycle, message dispatch, cleanup
- `src/types/game.ts` - Added 'lobby' to screen union type
- `src/components/MainMenu.tsx` - Replaced "Coming Soon" span with PLAY ONLINE button, added onPlayOnline prop
- `src/App.tsx` - handlePlayOnline callback, lobby placeholder rendering, onPlayOnline prop pass-through

## Decisions Made
- Hook uses useRef for socket (avoids re-renders on socket object changes) and useState for all reactive state
- isHost derived inline from hostId === playerId rather than separate state variable
- pendingJoinRef stores name+color to send join message after "connected" acknowledgment
- Error auto-clear uses setTimeout with ref-based cleanup (prevents stale timers)
- Hook has zero gameStore imports — App.tsx bridges room events to game state

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- useRoom hook ready for consumption by LobbyScreen component (15-03)
- gameStartData payload ready for lobby → game transition (15-04)
- Screen routing supports full flow: menu → lobby → game → winners
- Build passes clean, no regressions

---
*Phase: 15-lobby-ui-room-codes*
*Completed: 2026-03-03*
