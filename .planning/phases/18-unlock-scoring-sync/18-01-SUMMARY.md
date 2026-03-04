---
phase: 18-unlock-scoring-sync
plan: 01
subsystem: sync
tags: [scoring, session-end, winners-screen, online, zustand]

# Dependency graph
requires:
  - phase: 17-dice-sync-simultaneous-play
    provides: per-player relay pattern, buffered reveals, onlinePlayerIds mapping, useOnlineGame hook
provides:
  - applyOnlineScoring store action (server scores → local state + scoring phase)
  - applyOnlineSessionEnd store action (final scores → winners screen)
  - Online scoring phase with counting animation
  - Online session end with winners screen
affects: [18-unlock-scoring-sync, 19-connection-resilience]

# Tech tracking
tech-stack:
  added: []
  patterns: [server-authoritative scoring sync, onlinePlayerIds mapping for score distribution]

key-files:
  created: []
  modified: [src/store/gameStore.ts, src/hooks/useOnlineGame.ts]

key-decisions:
  - "Server-authoritative scores: client trusts server player scores, only extracts local roundScore from winners array"
  - "Same HUD animation path: online scoring sets phase='scoring' + roundScore, reusing existing counting animation"

patterns-established:
  - "applyOnline* pattern: store actions that map server PlayerSyncState[] to local players via onlinePlayerIds"

issues-created: []

# Metrics
duration: 5min
completed: 2026-03-04
---

# Phase 18 Plan 01: Scoring + Session End Sync Summary

**Server-authoritative scoring sync and session end → winners screen via applyOnlineScoring/applyOnlineSessionEnd store actions**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-04T04:36:57Z
- **Completed:** 2026-03-04T04:42:01Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Online scoring message handler updates all player scores from server data and triggers scoring phase with correct local roundScore
- Online session_end handler syncs final scores and transitions to winners screen
- Both use onlinePlayerIds mapping to distribute server player data to local player indices

## Task Commits

Each task was committed atomically:

1. **Task 1: Handle scoring message** - `d80a5ad` (feat)
2. **Task 2: Handle session_end message** - `3d98fb1` (feat)

## Files Created/Modified
- `src/store/gameStore.ts` - Added applyOnlineScoring and applyOnlineSessionEnd store actions
- `src/hooks/useOnlineGame.ts` - Replaced stubbed scoring and session_end handlers with real implementations

## Decisions Made
- Server-authoritative scores: client trusts server's player scores array, only extracts local roundScore from winners array for HUD animation
- Reuses existing scoring phase and winners screen — no online-specific UI needed

## Deviations from Plan

applyOnlineSessionEnd was added in the Task 1 commit alongside applyOnlineScoring since both were additions to the same interface/file. Minor commit grouping difference — end result identical to plan.

## Issues Encountered
None

## Next Phase Readiness
- Scoring and session end sync complete
- Ready for 18-02-PLAN.md (round transitions)
- round_start handler still stubbed (Phase 18 scope) — addressed in 18-02

---
*Phase: 18-unlock-scoring-sync*
*Completed: 2026-03-04*
