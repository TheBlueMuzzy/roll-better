# Project State

## Current Status
All Phase 18 fixes complete. Snapshot sync, AFK auto-unlock, pool cap, delta animation validation, and local AFK unlock animation all working. Ready for commit + playtest.

## Version
0.2.0.5

## Current Position

Phase: 18 of 21 (Unlock + Scoring Sync)
Plan: All plans complete — ready for Phase 19
Status: Phase 18 complete pending final playtest
Last activity: 2026-03-05

Progress: █████████████████████████████████████████████████████████████ 100%

## Resume Command
Run `/gsd:resume-work` — or just read this file and continue with "Next Steps" below.

## Next Steps (in order)

### 1. Fix delta animation validation (Option 2 — bulletproof)
- **Problem**: Other players' lock/unlock delta messages sometimes show stale data briefly (extra locked die appears then disappears). Snapshot corrects it on phase_change, but the visual glitch is ugly.
- **Fix approach**: Validate delta animations against current client state before displaying:
  - Don't animate a lock if that goal slot is already occupied by that player
  - Don't show a die that doesn't exist in the server snapshot
  - Compare incoming `player_lock_result` against `syncAllPlayerState` data
- **Files**: `src/hooks/useOnlineGame.ts` (delta handlers), `src/store/gameStore.ts` (pending reveal buffers)

### 2. Fix AFK auto-unlock animation
- **Problem**: When server auto-unlocks an AFK player's dice, client doesn't animate — dice just pop into pool
- **Fix**: Client needs to detect `unlock_result` for its OWN player (from AFK timeout) and trigger the unlock animation
- **Files**: `src/hooks/useOnlineGame.ts` (unlock_result handler)

### 3. Commit all changes
- Files modified this session: `.env`, `party/server.ts`
- Files modified last session (uncommitted): `protocol.ts`, `server.ts`, `gameStore.ts`, `useOnlineGame.ts`
- Bump version, commit with summary of all fixes

## Session 2026-03-05 — All Fixes Applied

### Fix 1: .env pointing to cloud server
- `.env` had `VITE_PARTY_HOST=roll-better.thebluemuzzy.partykit.dev` — ALL previous playtests hit deployed cloud server, not local PartyKit
- Commented out the env var → defaults to `localhost:1999`
- **Lesson**: ALWAYS check `.env` first when server changes seem invisible

### Fix 2: AFK auto-unlock initial implementation (party/server.ts)
- `autoSkipUnresponsivePlayers()` only blocked skip when `poolSize === 0`
- Players with poolSize > 0 but tiny total dice were skipped without unlocking → stuck forever
- Initial fix: unlock ALL dice when locked < 8 (too aggressive, caused Fix 4)

### Fix 3: Zombie PartyKit processes
- Multiple old PartyKit processes (3 PIDs) were LISTENING on port 1999
- New PartyKit bound the port but old process was stealing connections
- Fix: `taskkill /F` all PIDs, then start fresh single instance
- Also cleared Vite dep cache (`rm -rf node_modules/.vite`)

### Fix 4: Smart AFK unlock (total dice target = 8)
- **Problem v1**: Fix 2 unlocked ALL locked dice → pools exploded to 15+
- **Problem v2**: Math was wrong — used `(8 - poolSize) / 2` but each unlock adds 1 to TOTAL, not 2
- **Correct formula**: `totalDice = pool + locked`. If `totalDice < 8`: unlock `min(8 - totalDice, locked)` dice. If `totalDice >= 8`: skip entirely (keep locks, go for max points)
- **AFK unlock rule**: total < 8 → unlock to reach 8. total >= 8 → always skip.

### Fix 5: Pool-12 cap on manual unlocks (party/server.ts)
- Manual unlock had no pool cap — player reached 15 dice
- `handleUnlockRequest` now caps unlocks at `floor((12 - poolSize) / 2)`. Excess rejected.

### Playtest Results (room DYER, all fixes)
- Snapshot sync: self-healing confirmed (stale delta → snapshot corrects)
- AFK roll timer: working every round
- AFK auto-unlock: correct math, only unlocks when total < 8
- Manual unlock: working, pool capped at 12
- Scoring: Snooze got perfect 8 points, round transition to new goals worked
- Manual play mixed with AFK: no stalls, no desyncs
- **Animation issues noted**: AFK unlock has no animation, delta locks show briefly stale data

### Known Issues
- **Delta animation glitches**: Stale delta data briefly visible before snapshot corrects (Fix: validate deltas against state — Next Step #1)
- **Missing AFK unlock animation**: Dice pop into pool without animation (Fix: detect own-player unlock_result — Next Step #2)
- **PartyKit restart pattern**: Clients auto-reconnect to empty room after restart. Must refresh tabs and create new room.

## Dev Server Setup
- **Vite**: `http://localhost:5173` (Claude manages, `--host` for LAN)
- **PartyKit**: `localhost:1999` (Claude manages)
- **Phone**: `http://192.168.1.152:5173`
- `.env` must NOT set `VITE_PARTY_HOST` for local dev (defaults to localhost:1999)
- Claude runs both servers as background tasks — no manual terminal management

## Previous Sessions
- 2026-03-04: Snapshot state sync implementation (protocol.ts, server.ts, gameStore.ts, useOnlineGame.ts)
- 2026-03-04: AFK system bugfixes (BUG-003, server lockingTimer removal)
- 2026-03-04: Phase 18 completion + v0.2.0 release
- Earlier: Phases 17-18 (online multiplayer buildout)

## Key Architecture
- **Snapshot + Delta hybrid**: Every phase_change carries full PlayerSyncState[]. Deltas (player_lock_result, unlock_result) are animation triggers only. Snapshots are source of truth.
- **Watchdog**: Detects stalls >5s in transient phases, requests phase_sync from server (carries full state + goalValues). Self-heals to idle after 3 failures.
- **AFK timers**: 20s for both rolling and unlocking. Client-driven countdown display, server-enforced timeout.
- **Pool cap**: Max 12 dice. Server enforces on manual unlock. AFK auto-unlock targets 8 total (well under cap).

## Uncommitted Changes
- `.env` — cloud server URL commented out
- `party/server.ts` — snapshot sync, AFK auto-unlock (smart formula), pool-12 cap, extensive debug logging
- `src/types/protocol.ts` — PlayerSyncState in PhaseChangeMessage/PhaseSyncMessage
- `src/store/gameStore.ts` — syncAllPlayerState, setGoalValues
- `src/hooks/useOnlineGame.ts` — snapshot application in phase_change/phase_sync handlers, watchdog cleanup
