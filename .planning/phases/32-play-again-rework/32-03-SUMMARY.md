---
phase: 32-play-again-rework
plan: 03
subsystem: ui, networking
tags: [react, partykit, play-again, lobby, auto-claim, websocket]

# Dependency graph
requires:
  - phase: 32-play-again-rework (plans 01-02)
    provides: Server play_again protocol, play_again_ack, tryAutoMatchSeat, autoMatched field
  - phase: 30-mid-game-join-flow
    provides: Claiming mode UI, seat_list handler, seatList state
provides:
  - Client-side Play Again → lobby transition
  - Late Play Again → auto-claim with "Reclaiming your seat..." UI
  - Cleaned up restart_game protocol (fully removed)
  - Claiming mode detection from any onlineMode state
affects: [33-connection-polish, 34-integration-testing]

# Tech tracking
tech-stack:
  added: []
  patterns: [lobby-return-detection useEffect, autoMatched state propagation]

key-files:
  created: []
  modified: [src/App.tsx, src/hooks/useRoom.ts, src/hooks/useOnlineGame.ts, src/components/MainMenu.tsx]

key-decisions:
  - "No protocol.ts changes needed — all types already present from 32-01/32-02"
  - "Lobby return detected via useEffect on room connection state (connected + waiting + players + idle)"
  - "Claiming mode transition broadened to trigger from idle/creating/joined, not just joining"

patterns-established:
  - "Lobby return detection: useEffect watching room state to auto-set onlineMode on reconnect"

issues-created: []

# Metrics
duration: 7h 12m (includes UAT wait time)
completed: 2026-03-10
---

# Phase 32 Plan 03: Client Play Again UI Summary

**Client Play Again sends play_again message, auto-detects lobby return via room state, late returners see "Reclaiming your seat..." with autoMatched feedback, restart_game fully removed**

## Performance

- **Duration:** 7h 12m (includes UAT wait time)
- **Started:** 2026-03-09T22:08:09Z
- **Completed:** 2026-03-10T05:20:07Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 4

## Accomplishments
- Play Again on winners screen sends `play_again` message, client transitions to lobby with same room code
- Lobby return auto-detected via useEffect — sets onlineMode to creating/joined based on host status
- Late Play Again auto-claim shows "Reclaiming your seat..." for autoMatched players
- Claiming mode now activates from any onlineMode state (idle, creating, joined) when seatList arrives
- Removed all `restart_game` references — clean protocol migration complete
- Offline Play Again unchanged (no regression)

## Task Commits

Each task was committed atomically:

1. **Task 1: Client sends play_again + lobby transition** - `d268067` (feat)
2. **Task 2: Late Play Again auto-claim UI + offline Play Again** - `4902ecf` (feat)
3. **Task 3: Human verification** - UAT approved

## Files Created/Modified
- `src/App.tsx` - handlePlayAgain sends play_again instead of restart_game, sets screen to menu
- `src/hooks/useRoom.ts` - play_again_ack handler, autoMatched state from seat_claim_result
- `src/hooks/useOnlineGame.ts` - Removed restart-specific game_starting handler, cleaned unused import
- `src/components/MainMenu.tsx` - Lobby return detection useEffect, claiming mode from any state, "Reclaiming your seat..." UI

## Decisions Made
- No protocol.ts changes needed — PlayAgainMessage, PlayAgainAckMessage, and autoMatched on SeatClaimResultMessage all present from 32-01/32-02
- Lobby return detected via room state (connected + waiting + has players + idle) rather than explicit flag
- Claiming mode transition broadened to work from idle/creating/joined states

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Phase 32 (Play Again Rework) complete — all 3 plans finished
- Ready for Phase 33: Connection Polish & Edge Cases
- All Play Again scenarios work: normal lobby, host early start, late join auto-claim, menu exit, offline

---
*Phase: 32-play-again-rework*
*Completed: 2026-03-10*
