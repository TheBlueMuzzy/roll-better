---
phase: 30-mid-game-join-flow
plan: 03
subsystem: ui
tags: [websocket, react, mainmenu, seat-selection, mid-game-join]

# Dependency graph
requires:
  - phase: 30-01
    provides: seat_list and seat_claim_result protocol messages
  - phase: 30-02
    provides: phase-boundary takeover execution
provides:
  - Client-side seat selection UI for mid-game joins
  - useRoom hook mid-game join state (seatList, claimedSeat, claimSeat)
  - MainMenu 'claiming' mode with seat buttons
affects: [30-04, 33-connection-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [onlineMode state machine extension, mid-game join detection via seatList]

key-files:
  created: []
  modified:
    - src/hooks/useRoom.ts
    - src/components/MainMenu.tsx
    - src/App.css

key-decisions:
  - "seatList non-null as mid-game join signal (no separate flag needed)"
  - "Colored circle avatar without bot emoji — clean, matches existing style"

patterns-established:
  - "OnlineMode 'claiming' state for mid-game seat selection flow"

issues-created: []

# Metrics
duration: 5min
completed: 2026-03-08
---

# Phase 30 Plan 03: Client-Side Mid-Game Join UI Summary

**useRoom mid-game join state + MainMenu seat selection buttons with claim/waiting/error states**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-08T03:33:52Z
- **Completed:** 2026-03-08T03:38:59Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- useRoom hook handles seat_list and seat_claim_result messages, exposes mid-game state
- MainMenu shows seat selection UI when joining mid-game room
- Seat buttons display color avatar, player name, score, and lock count
- Claimed seat shows "Taking over next round..." waiting message
- Empty seat list and claim errors handled gracefully

## Task Commits

Each task was committed atomically:

1. **Task 1: useRoom handles seat_list + seat_claim_result messages** - `bcc0470` (feat)
2. **Task 2: MainMenu seat selection UI for mid-game joins** - `c43885f` (feat)

## Files Created/Modified
- `src/hooks/useRoom.ts` - SeatInfo interface, seatList/claimedSeat/seatClaimError state, claimSeat action, message handlers
- `src/components/MainMenu.tsx` - OnlineMode 'claiming', joining->claiming transition, seat selection buttons, waiting/error states
- `src/App.css` - Seat selection styles (menu-midgame-title, menu-seat-list, menu-seat-btn, menu-seat-avatar, etc.)

## Decisions Made
- seatList being non-null serves as the mid-game join indicator — no separate boolean flag needed
- Seat avatar renders as colored circle without bot emoji — cleaner look, consistent with existing style

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Client seat selection UI complete, ready for 30-04 (game transition after takeover)
- End-to-end flow: join room -> receive seat_list -> pick seat -> send seat_claim -> receive result -> show waiting state

---
*Phase: 30-mid-game-join-flow*
*Completed: 2026-03-08*
