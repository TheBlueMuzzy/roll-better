---
phase: 27-player-identity-seat-model
plan: 02
subsystem: game-state
tags: [seat-state, seat-index, autopilot, partykit, zustand]

# Dependency graph
requires:
  - phase: 27-player-identity-seat-model (plan 01)
    provides: persistent player ID, persistentIdToConnId map, protocol identity fields
provides:
  - SeatState enum (human-active / human-afk / bot)
  - seatIndex on all players (server, protocol, client)
  - autopilotCounter on server player state
  - Full-stack seat state flow: server init → protocol → client store
affects: [28-afk-autopilot, 29-disconnect-handoff, 30-mid-game-join, 31-host-migration]

# Tech tracking
tech-stack:
  added: []
  patterns: [seat-state-machine-data-model]

key-files:
  modified:
    - src/types/protocol.ts
    - src/types/game.ts
    - party/server.ts
    - src/store/gameStore.ts
    - version.json

key-decisions:
  - "SeatState as string literal union type, not enum — matches existing protocol pattern"
  - "seatIndex assigned sequentially at join time (lobby) and game start (gamePlayers array position)"
  - "autopilotCounter tracked server-side only — client doesn't need it yet"

patterns-established:
  - "Seat state flows: server init → buildPlayerSnapshot → PlayerSyncState → client syncAllPlayerState"

issues-created: []

# Metrics
duration: 10min
completed: 2026-03-07
---

# Phase 27 Plan 02: Seat State Machine Data Model Summary

**SeatState enum (human-active/human-afk/bot) + seatIndex flowing through full stack: server → protocol → client store**

## Performance

- **Duration:** ~10 min (execution), checkpoint verification separate
- **Started:** 2026-03-07T05:07:18Z
- **Completed:** 2026-03-07T08:05:41Z
- **Tasks:** 2 auto + 1 checkpoint
- **Files modified:** 5

## Accomplishments
- Added `SeatState` type (`'human-active' | 'human-afk' | 'bot'`) to protocol and propagated through full stack
- Added `seatIndex` (stable seat position) to PlayerSyncState, RoomPlayer, ServerPlayerState, and client Player
- Added `autopilotCounter` to ServerPlayerState for future AFK escalation (Phase 28)
- Server initializes seats correctly: online humans = `'human-active'`, bots = `'bot'`, sequential seatIndex
- Client game store reads and syncs seat state from all server messages (game_starting, round_start, phase_change)
- Offline/local games also populate seatState and seatIndex for type completeness
- Verified: no behavioral changes — game plays identically to before

## Task Commits

Each task was committed atomically:

1. **Task 1: Seat state types + server data model** - `bf328ec` (feat)
2. **Task 2: Client types + game store integration** - `8640076` (feat)

**Version bump:** `c3f9613` (chore: build 20)

## Files Created/Modified
- `src/types/protocol.ts` — Added SeatState type, seatState + seatIndex on PlayerSyncState and RoomPlayer
- `party/server.ts` — Added seatState, seatIndex, autopilotCounter to ServerPlayerState; initialized in handleStartGame/handleRestartGame/handleJoin; included in buildPlayerSnapshot and all inline snapshots
- `src/types/game.ts` — Added seatState + seatIndex to Player interface
- `src/store/gameStore.ts` — Updated initGame, syncAllPlayerState, applyServerPlayerSync to handle seat fields
- `version.json` — Build 19 → 20

## Decisions Made
- SeatState as string literal union (not enum) — consistent with existing protocol patterns
- seatIndex assigned at lobby join time and game start, sequential by array position
- autopilotCounter is server-only for now — client doesn't need it until Phase 28

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Phase 27 complete — Player Identity & Seat Model fully established
- SeatState data model ready for Phase 28 (AFK Autopilot & Escalation)
- All downstream phases (28-34) can use seatState, seatIndex, and autopilotCounter

---
*Phase: 27-player-identity-seat-model*
*Completed: 2026-03-07*
