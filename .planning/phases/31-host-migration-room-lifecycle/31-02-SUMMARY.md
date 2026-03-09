---
phase: 31-host-migration-room-lifecycle
plan: 02
subsystem: ui, api
tags: [room-full, try-again, room-closed, dissolution, error-handling]

# Dependency graph
requires:
  - phase: 31-01
    provides: dissolveRoom() broadcasting room_closed with reason
  - phase: 29-01
    provides: room_closed handling for reconnect-after-grace
provides:
  - Room Full TRY AGAIN button for capacity errors
  - Graceful room dissolution handling across all client states
affects: [32-play-again-rework, 33-connection-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [error-code-typed-errors, persistent-error-no-autoclear]

key-files:
  modified:
    - party/server.ts
    - src/types/protocol.ts
    - src/hooks/useRoom.ts
    - src/components/MainMenu.tsx
    - src/App.css
    - src/hooks/useOnlineGame.ts

key-decisions:
  - "Error code field on ErrorMessage for typed error handling (vs string matching)"
  - "Room full error does not auto-clear — user needs time to tap TRY AGAIN"
  - "useOnlineGame handles room_closed independently from useRoom for in-game state cleanup"

patterns-established:
  - "Typed error codes: server sends code field, client switches on code for UI behavior"

issues-created: []

# Metrics
duration: 3min
completed: 2026-03-09
---

# Phase 31 Plan 02: Room Full TRY AGAIN + Room Dissolution Summary

**Room Full shows TRY AGAIN button with typed error codes; room dissolution gracefully returns all client states to menu**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-09T21:20:27Z
- **Completed:** 2026-03-09T21:24:12Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Room Full error now shows a TRY AGAIN button that retries join with same room code
- Server sends typed `code: "room_full"` field for robust error handling (no string matching)
- Room dissolution handled in all client states: in-game, mid-game join, and lobby
- useOnlineGame cleans up animations and deferred phase polling on room_closed

## Task Commits

Each task was committed atomically:

1. **Task 1: Room Full error with TRY AGAIN button** - `937e5be` (feat)
2. **Task 2: Room dissolved — in-game clients return to menu** - `03f0ee2` (feat)

**Plan metadata:** (this commit) (docs: complete plan)

## Files Created/Modified
- `party/server.ts` - Added `code: "room_full"` to capacity rejection errors
- `src/types/protocol.ts` - Added optional `code` field to ErrorMessage interface
- `src/hooks/useRoom.ts` - Added errorCode state, typed error handling, persistent room_full error
- `src/components/MainMenu.tsx` - TRY AGAIN button conditional on room_full errorCode
- `src/App.css` - Added .menu-try-again styling
- `src/hooks/useOnlineGame.ts` - Added room_closed handler for in-game clients

## Decisions Made
- Used error code field instead of string matching for room_full detection — more robust, extensible
- Room full error persists (no 3s auto-clear) so user has time to tap TRY AGAIN
- useRoom room_closed handler uses server `reason` field instead of hardcoded string

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness
- Phase 31 complete — host migration and room lifecycle fully implemented
- Ready for Phase 32: Play Again Rework

---
*Phase: 31-host-migration-room-lifecycle*
*Completed: 2026-03-09*
