---
phase: 17-dice-sync-simultaneous-play
plan: 02
subsystem: networking
tags: [dice-sync, server-authoritative, physics-merge, lock-animations, timing-barrier]

# Dependency graph
requires:
  - phase: 17-dice-sync-simultaneous-play
    plan: 01
    provides: useOnlineGame hook, pendingServerResults store, sendRollRequest
  - phase: 16-state-sync-protocol
    provides: Server roll handler, PlayerRollResult type, LockedDieSync type
provides:
  - applyOnlineRollResults store action (server values + physics positions merge)
  - physicsSettledData field + setter for timing barrier
  - tryApplyOnlineResults barrier (either-arrives-first pattern)
  - Online handleRoll flow (sendRollRequest + physics animation)
  - Online handleAllSettled routing (physics-only storage)
  - Lock animations for all players from server results
affects: [17-03 phase/unlock sync, 18 scoring sync]

# Tech tracking
tech-stack:
  added: []
  patterns: [timing-barrier pattern, server-values-override-physics, profile-emerge animations for remote players]

key-files:
  created: []
  modified: [src/store/gameStore.ts, src/App.tsx, src/components/Scene.tsx]

key-decisions:
  - Timing barrier (tryApplyOnlineResults) handles either-arrives-first: server results or physics settle
  - Server dice values always override physics-detected values for online games
  - Physics positions still used for lock animation source positions (visual fidelity)
  - Other players use profile-emerge animation pattern (same as existing AI lock animations)
  - Offline setRollResults path completely untouched
  - LockedDieSync assigned directly as LockedDie (compatible shapes, no casting needed)

metrics:
  duration_seconds: 351
  duration_human: ~6 minutes
  tasks: 2
  files_modified: 3
  lines_added: ~238
  lines_removed: ~7
---

# Plan 17-02 Summary: Wire server-authoritative dice rolling

## Accomplishments

1. **Store action `applyOnlineRollResults`** - Merges server-provided dice values with physics-settled positions. For the local human player: uses server's `rolled[]` as dice values, server's `newLocks[]` as lock results, and physics positions for lock animation source positions. For other players: creates profile-emerge lock animations using the same pattern as existing AI animations.

2. **Timing barrier (`tryApplyOnlineResults`)** - Handles the race condition between server results arriving via WebSocket and physics dice settling in the 3D scene. Either can arrive first; the barrier checks both `pendingServerResults` and `physicsSettledData` and triggers merge when both are ready.

3. **Online `handleRoll` flow** - When `isOnlineGame` is true, `handleRoll` calls `sendRollRequest()` to tell the server to generate dice, then starts the same visual physics animation as offline.

4. **Online `handleAllSettled` routing** - When online, `handleAllSettled` stores physics positions via `setPhysicsSettledData` instead of calling `setRollResults`. The store's setter auto-checks the timing barrier.

## Task Commits

| Task | Commit | Hash |
|------|--------|------|
| 1. Store action for online roll results | `feat(17-02): store action for applying online roll results` | `6885c06` |
| 2. Wire online roll flow through App + Scene | `feat(17-02): wire online roll flow through App + Scene` | `bd77190` |

## Files Modified

- `src/store/gameStore.ts` — Added `applyOnlineRollResults`, `physicsSettledData`, `setPhysicsSettledData`, `tryApplyOnlineResults`, `applyOnlineRollResultsImpl`
- `src/App.tsx` — Modified `handleRoll` to send `roll_request` when online
- `src/components/Scene.tsx` — Modified `handleAllSettled` to route online to `setPhysicsSettledData`

## Deviations

None. Plan executed as specified.

## Decisions Made

- **Timing barrier over sequential wait**: Instead of forcing a specific order (server first, then physics), the barrier pattern lets either arrive first. This is more robust for varying network latencies.
- **Direct assignment of LockedDieSync as LockedDie**: Both types have identical shapes (`{ goalSlotIndex: number, value: number }`), so no type casting or conversion is needed.

## Next Phase Readiness

Plan 17-03 (Phase + unlock sync) can proceed. The roll cycle is now wired: client sends `roll_request`, server generates results, client merges server values with physics positions, and all players see lock animations simultaneously.
