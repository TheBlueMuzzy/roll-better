# Plan 15-03 Summary: Lobby Screen UI

## Result: COMPLETE

**Execution time:** ~90 minutes
**Strategy:** Pattern B (segmented) — Tasks 1-2 via subagent, Task 3 checkpoint in main context

## Tasks Completed

### Task 1: Build LobbyScreen component with create/join and lobby views
- **Commit:** `332794a` — feat(15-03): build LobbyScreen component
- Created `src/components/LobbyScreen.tsx` with two views:
  - **CreateJoinView:** Name input, CREATE ROOM button, 4-char room code input with auto-advance/backspace/paste, JOIN button, BACK button, error display
  - **LobbyView:** Room code display with tap-to-copy, player list with color dots/ready indicators, ready toggle (non-host), host START GAME button, LEAVE button
- Wired into App.tsx replacing the placeholder lobby div

### Task 2: CSS styling for lobby screen
- **Commit:** `f297dcb` — feat(15-03): CSS styling for lobby
- Full lobby CSS following established patterns (z-70, rAF fade transition, responsive tokens)
- Styled: backdrop, name input, code inputs, divider, room code display, player list, ready/start buttons

### Task 3: Human verification checkpoint
- Three rounds of testing and iteration with user feedback

## Deviations & Bug Fixes

### Round 1 fixes (commit `1a68813`)
- Ready button UX: changed from "READY"/"NOT READY" to "READY ✕" (grey) / "READY ✓" (green)
- Host exempt from ready button (host controls start)
- Removed player count and AI difficulty selectors — auto-fill to 4 with AI, always hard
- Random silly names from SILLY_NAMES array when name field empty
- CREATE ROOM disabled when code chars entered (mutual exclusivity)
- JOIN shakes on error, clears code, re-disables
- Room-not-found detection: intent tracking in useRoom (Partykit auto-creates rooms)
- "Connection lost" no longer overwrites recent server errors (lastErrorTimeRef)
- Server-assigned player colors by join order (not client-specified)
- "Total Players: X (N AI)" display

### Round 2 fixes (commit `e5b0e8f`)
- JOIN button matches CREATE ROOM styling (red bg, white text when enabled)
- Name placeholder changed to "Enter Name"
- Removed scrollbar from player list (extends naturally)
- Server generates goalValues in game_starting message — all clients share same goals
- Protocol updated: GameStartingMessage now includes goalValues field
- initRound accepts optional goalValues parameter

### Round 3 fix (commit `0614c08`)
- Local player uses server-assigned name and color in-game (not always red)
- initGame accepts optional onlineInfo with localPlayer color/name
- AI players draw from remaining palette (skip local player's color)

## Files Modified

| File | Change |
|------|--------|
| `src/components/LobbyScreen.tsx` | Created — full lobby component |
| `src/App.tsx` | Wired LobbyScreen, handleOnlineGameStart with localPlayer |
| `src/App.css` | Lobby styles, shake animation, ready button states |
| `src/store/gameStore.ts` | Exported PLAYER_COLORS, initGame accepts onlineInfo, initRound accepts goalValues |
| `src/hooks/useRoom.ts` | Intent tracking, intentional close, room-not-found detection, goalValues in GameStartData |
| `src/types/protocol.ts` | Added goalValues to GameStartingMessage |
| `party/server.ts` | Server-assigned PLAYER_COLORS by join order, server-generated goalValues |

## Issues Logged

- **ISS-003** (CLOSED): Goal dice desync — fixed by server-generated goalValues
- **ISS-004** (OPEN): Online game rolls not synced — each client rolls independently. Core Phase 16 scope.

## Key Decisions

- Server-authoritative color assignment (join order index, not client-specified)
- Server-generated goalValues broadcast in game_starting (shared initial conditions)
- Mutual exclusivity: CREATE ROOM disabled when code chars entered, and vice versa
- Random silly names for empty name field (max 8 chars from 24-name pool)
- Auto-fill: if < 4 online players, fill to 4 with AI; if >= 4, no AI. Always hard difficulty.
- Room-not-found detection via intent tracking (Partykit auto-creates rooms on connect)
