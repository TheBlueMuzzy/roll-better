---
phase: 32-play-again-rework
plan: 02
subsystem: api
tags: [partykit, websocket, mid-game-join, auto-match, play-again]

# Dependency graph
requires:
  - phase: 32-play-again-rework/01
    provides: handlePlayAgain, previousGamePersistentIds, unready player removal
  - phase: 30-mid-game-join-flow
    provides: midGameJoiners, pendingSeatClaims, sendSeatList, executePendingSeatClaims
provides:
  - Late play_again routes through mid-game join flow
  - tryAutoMatchSeat() auto-claims old bot-held seats for returning players
  - autoMatched field on SeatClaimResultMessage for client feedback
affects: [32-play-again-rework, 33-connection-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [unreadyPlayers identity preservation, persistentId-based seat auto-match]

key-files:
  created: []
  modified: [src/types/protocol.ts, party/server.ts]

key-decisions:
  - "Option B chosen: save unready player identity in separate map before removing from players (avoids interference with game state building)"
  - "tryAutoMatchSeat called after sendSeatList in both play_again and handleJoin paths"
  - "Auto-match sends seat_claim_result with autoMatched: true so client can show appropriate feedback"

patterns-established:
  - "Identity preservation: unreadyPlayers map bridges game-start removal to later play_again"
  - "Auto-match pattern: previousGamePersistentIds lookup → bot check → pendingSeatClaims"

issues-created: []

# Metrics
duration: ~5min
completed: 2026-03-09
---

# Phase 32 Plan 02: Late Play Again + Auto-Match Summary

**Route late play_again to mid-game join, auto-match returning players to old bot-held seats via persistentId**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-09
- **Completed:** 2026-03-09
- **Tasks:** 2
- **Files modified:** 2 (party/server.ts, src/types/protocol.ts)

## Accomplishments
- Late play_again (game in progress) correctly routes player into mid-game join flow with identity preserved
- tryAutoMatchSeat() checks previousGamePersistentIds for returning player's old seat
- Auto-claims old seat if bot-held and unclaimed, graceful fallback to manual selection otherwise
- Works for both late play_again senders and fresh room-code joins (handleJoin mid-game branch)
- Added autoMatched field to SeatClaimResultMessage for client-side feedback

## Task Commits

1. **Task 1: Route late play_again to mid-game join** - `1b3492e` (feat)
2. **Task 2: Auto-match persistentId to old bot-held seat** - `1a0ce0a` (feat)

## Files Created/Modified
- `party/server.ts` - Added unreadyPlayers map, updated handlePlayAgain Case 3, added tryAutoMatchSeat() helper, wired auto-match into both join paths
- `src/types/protocol.ts` - Added optional autoMatched field to SeatClaimResultMessage

## Decisions Made
- Used Option B (save unready player info in separate map) rather than Option A (keep in players map) — cleaner separation, avoids interference with game state building in handleStartGame
- tryAutoMatchSeat is called after sendSeatList so the client always receives the full seat list first, then gets the auto-claim result on top
- unreadyPlayers map cleared on lobby transition (sessionEnd → waiting) to avoid stale data

## Deviations from Plan
None.

## Issues Encountered
None.

## Next Phase Readiness
- Server-side play again + auto-match complete
- Client needs to handle autoMatched field on seat_claim_result for UI feedback
- Ready for client-side play again UI work

---
*Phase: 32-play-again-rework*
*Completed: 2026-03-09*
