---
phase: 30-mid-game-join-flow
plan: 01
subsystem: api
tags: [partykit, websocket, protocol, mid-game-join, seat-claim]

# Dependency graph
requires:
  - phase: 27-player-identity-seat-model
    provides: dual identity model (conn.id + persistentId), SeatState machine
  - phase: 29-disconnect-handoff
    provides: bot-promoted players persist in gameState.players array
provides:
  - seat_claim / seat_list / seat_claim_result / seat_takeover protocol messages
  - server mid-game join acceptance (midGameJoiners map)
  - server seat claim validation with first-claim-wins logic (pendingSeatClaims map)
affects: [30-02 phase-boundary takeover execution, 30-client seat selection UI]

# Tech tracking
tech-stack:
  added: []
  patterns: [mid-game joiner tracked separately from players map, pending claims queued for phase boundary]

key-files:
  created: []
  modified:
    - src/types/protocol.ts
    - party/server.ts

key-decisions:
  - "Mid-game joiners NOT added to this.players Map — tracked in separate midGameJoiners map until takeover"
  - "First-claim-wins: pendingSeatClaims stores seatIndex->connId, rejects duplicate claims"
  - "Joiner can only claim one seat at a time — previous claim cancelled on new claim"

patterns-established:
  - "Mid-game joiner pattern: connect -> handleJoin -> sendSeatList (no room_state)"
  - "Pending claim cleanup on joiner disconnect in onClose"

issues-created: []

# Metrics
duration: 22 min
completed: 2026-03-08
---

# Phase 30 Plan 01: Mid-Game Join Protocol & Server Acceptance Summary

**Server protocol and logic for mid-game seat claiming — 4 new message types, joiner tracking map, first-claim-wins validation**

## Performance

- **Duration:** 22 min
- **Started:** 2026-03-08T02:39:53Z
- **Completed:** 2026-03-08T03:01:41Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added 4 new protocol message types: SeatClaimMessage (client), SeatListMessage, SeatClaimResultMessage, SeatTakeoverMessage (server)
- Server accepts mid-game connections during "playing" status, sends available bot seat list
- Seat claim validation: must be joiner, seat must exist, must be bot, first-claim-wins
- Pending claims stored in pendingSeatClaims map for phase-boundary execution (30-02)
- Mid-game joiner disconnect cleanup in onClose

## Task Commits

Each task was committed atomically:

1. **Task 1: Protocol types + server mid-game join acceptance** - `22d31c1` (feat)
2. **Task 2: Seat claim validation and pending takeover logic** - `e0c9179` (feat)

## Files Created/Modified
- `src/types/protocol.ts` - Added SeatClaimMessage, SeatListMessage, SeatClaimResultMessage, SeatTakeoverMessage interfaces and union members
- `party/server.ts` - Added midGameJoiners/pendingSeatClaims maps, mid-game branch in handleJoin, sendSeatList helper, handleSeatClaim with full validation, seat_claim in onMessage switch, joiner cleanup in onClose

## Decisions Made
- Mid-game joiners tracked in separate `midGameJoiners` map, NOT added to `this.players` — avoids confusing existing room_state/useRoom logic
- First-claim-wins with single-claim-per-joiner constraint — previous claim auto-cancelled on new claim
- No room_state sent to mid-game joiners — they only see seat_list until takeover

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Moved `pid` declaration earlier in handleJoin**
- **Found during:** Task 1 (mid-game branch insertion)
- **Issue:** Plan's mid-game block referenced `pid` variable, but `const pid = persistentId ?? ""` was declared later in handleJoin (after the insertion point)
- **Fix:** Moved `pid` declaration before the mid-game branch
- **Files modified:** party/server.ts
- **Verification:** TypeScript compiles cleanly
- **Committed in:** 22d31c1 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (blocking), 0 deferred
**Impact on plan:** Minor variable ordering fix, no scope creep.

## Issues Encountered
None

## Next Phase Readiness
- Protocol types ready for client-side seat selection UI (30-02 or later plan)
- pendingSeatClaims map ready for phase-boundary takeover execution (30-02)
- No blockers

---
*Phase: 30-mid-game-join-flow*
*Completed: 2026-03-08*
