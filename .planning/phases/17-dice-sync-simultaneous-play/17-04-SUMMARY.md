# Plan 17-04 Summary: Online Roll Pipeline Rework

## Objective
Rework the online roll pipeline to use client-authoritative dice values, per-player relay (no batching), and client-side buffered reveals. Replace the broken server-authoritative-random approach from 17-02/17-03.

## Tasks Completed

### Task 1: Server per-player roll processing (commit 95b8185)
- Replaced `handleRollRequest`/`executeRoll` with `handleRollResult` — accepts client physics values, computes locks via `findAutoLocks`, relays to OTHER clients via `broadcastExcept`
- Added `checkAllRolled` — waits for all online players, rolls bots, broadcasts bot results to ALL
- Updated protocol types: `RollResultMessage` replaces `RollRequestMessage`, added `PlayerLockResultMessage`

### Task 2: Client sends physics values, applies own locks locally (commit 96def5a)
- `handleAllSettled` in Scene.tsx calls `setRollResults` for both online and offline, then sends `roll_result` to server for online
- Removed batch infrastructure: `pendingServerResults`, `physicsSettledData`, `tryApplyOnlineResults`, `applyOnlineRollResultsImpl`, `deferredPhase`
- Skipped local AI rolls for online games (server handles bots)

### Task 3: Buffered reveal of other players' locks (commit 829a75f)
- Added `pendingLockReveals`, `addPendingLockReveal`, `flushPendingLockReveals`
- Added `hasLocalPlayerLocked` flag — flush triggers when local lock animation completes
- Profile-emerge animations for other players' locks (scale 0→1, fly from profile to slot)

### Task 4: Human verification checkpoint — APPROVED
Bugs found and fixed during testing:

**Fix: Online unlock animations + UI lockout (commit d3db664)**
- Online unlock path now runs same mitosis animation as offline
- Added `hasSubmittedUnlock` flag — HUD shows "Waiting for others..." and hides button
- `toggleUnlockSelection` guards against re-selection after submitting

**Fix: Per-player unlock relay with buffered reveals (commit 563d9ed)**
- Server `handleUnlockRequest` now relays each player's unlock result immediately via `broadcastExcept` (matching rolling pattern)
- Client `addPendingUnlockReveal`/`flushPendingUnlockReveals` — same buffer/flush pattern as lock reveals
- `setHasSubmittedUnlock(true)` flushes pending unlock reveals
- AI-unlock-style shrink animation for other players' unlock reveals
- AFK timeout guards must-unlock players (can't auto-skip if poolSize=0)

**Fix: Defer phase transition until animations complete (commit b99fa32)**
- `phase_change` handler in `useOnlineGame.ts` defers transition if animations are in progress
- Polls every 100ms until animations clear, then applies phase
- Prevents server's immediate `phase_change: idle` from cutting off AI unlock animations

## Commits
| Hash | Type | Description |
|------|------|-------------|
| 95b8185 | refactor | Server per-player roll processing |
| 96def5a | refactor | Client sends physics values, applies own locks locally |
| 829a75f | feat | Buffered reveal of other players' locks |
| d3db664 | fix | Online unlock animations, UI lockout, other-player reveal |
| 563d9ed | feat | Per-player unlock relay with buffered reveals |
| b99fa32 | fix | Defer phase transition until animations complete |

## Architecture Established
- **Client-authoritative dice**: Physics determines values, sent to server for relay
- **Per-player relay**: Server processes each player individually, broadcasts via `broadcastExcept` — applies to BOTH rolling AND unlocking
- **Client-side buffered reveals**: Results hidden until local player acts, then flushed with animation — applies to BOTH lock AND unlock reveals
- **Same animations online/offline**: Mitosis for self, profile-emerge for locks, AI-unlock-style shrink for unlocks
- **Deferred phase transitions**: Client waits for animations to finish before applying server phase changes

## Known Limitation
Round-end flow (scoring → roundEnd → next round) is not yet implemented for online games. The `scoring`, `round_start`, and `session_end` message handlers are stubbed. This is Phase 18 scope.

## Issues Discovered
- **ISS-005**: Dice can intersect and get permanently stuck (rare physics edge case). Logged in ISSUES.md.
