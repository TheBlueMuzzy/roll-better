---
phase: 28-afk-autopilot-escalation
plan: 01
subsystem: server
tags: [partykit, afk, seat-state, escalation, autopilot]

# Dependency graph
requires:
  - phase: 27-player-identity-seat-model
    provides: SeatState type, seatIndex, autopilotCounter on ServerPlayerState
provides:
  - Server AFK escalation state machine (counter tracking + seat transitions)
  - promoteToBotFromAFK method for bot promotion
  - SeatStateChangedMessage protocol message
  - broadcastSeatStateChanged for real-time seat state notifications
affects: [28-02 client sync, 29 disconnect handoff, 30 mid-game join, 31 host migration]

# Tech tracking
tech-stack:
  added: []
  patterns: [AFK escalation state machine, resetAFKEscalation helper]

key-files:
  created: []
  modified: [party/server.ts, src/types/protocol.ts]

key-decisions:
  - "Extracted resetAFKEscalation helper to DRY the 3 manual action handlers"
  - "promoteToBotFromAFK removes from rollRequestedBy but keeps player in gameState.players for reconnect"
  - "Counter increment happens before the auto-action so the current timeout's auto-action still uses 1-beat logic"

patterns-established:
  - "AFK escalation: counter++ on auto-action, reset on manual action, promote at threshold 3"

issues-created: []

# Metrics
duration: 4min
completed: 2026-03-07
---

# Phase 28 Plan 01: Server AFK Escalation Engine Summary

**Autopilot counter tracking, seat state transitions (human-active -> human-afk -> bot), and seat_state_changed protocol message**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-07T15:14:47Z
- **Completed:** 2026-03-07T15:19:09Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Server tracks consecutive autopilot fires per player (autopilotCounter)
- Seat state transitions: human-active -> human-afk on first timeout, -> bot on 3rd consecutive
- Bot-promoted players get random difficulty, isOnline=false, removed from rollRequestedBy
- Counter resets to 0 on any manual action (roll, unlock, skip)
- New SeatStateChangedMessage protocol type broadcast on every transition

## Task Commits

Each task was committed atomically:

1. **Task 1: Server autopilot counter + seat state machine** - `9f7306f` (feat)
2. **Task 2: Seat state change protocol message + broadcast** - `c1ec3e4` (feat)

## Files Created/Modified
- `party/server.ts` - Added promoteToBotFromAFK, broadcastSeatStateChanged, resetAFKEscalation methods; wired counter logic into autoRoll/autoSkip/handleRollResult/handleUnlockRequest/handleSkipUnlock
- `src/types/protocol.ts` - Added SeatStateChangedMessage interface and included in ServerMessage union

## Decisions Made
- Extracted `resetAFKEscalation(player)` helper to DRY the reset logic across 3 manual action handlers
- `promoteToBotFromAFK` keeps player in `gameState.players` array (doesn't disconnect or remove) — Phase 29 handles reconnection to bot-promoted seats
- Counter increments before the auto-action fires, so the current timeout still uses 1-beat autopilot; bot difficulty kicks in starting from the next phase

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness
- Server AFK escalation fully wired — ready for 28-02 (client-side seat state sync + UI feedback)
- Protocol extended — clients will receive seat_state_changed but don't handle it yet (28-02)

---
*Phase: 28-afk-autopilot-escalation*
*Completed: 2026-03-07*
