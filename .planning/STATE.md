# Project State

## Current Status
Deployed with hotfixes for double-dice unlock bug. Three layers of protection:
1. Deferred snapshot: phase_change snapshot waits for animations to finish before applying
2. Guard in confirmUnlock: checks if lockedDice slots still exist before modifying poolSize
3. Guard in syncAllPlayerState: skips local player's poolSize/lockedDice while unlock animation is active

Playtest in progress — Muzzy testing with friends on deployed build.

## Version
0.2.0.6

## Current Position

Phase: 18 of 21 (Unlock + Scoring Sync)
Status: Deployed, playtesting with friends
Last activity: 2026-03-05

Progress: █████████████████████████████████████████████████████████████ 100%

## Resume Command
Run `/gsd:resume-work` — or just read this file and continue with "Next Steps" below.

## Next Steps (in order)

### 1. Gather playtest feedback from friends
- Deployed to: `https://thebluemuzzy.github.io/roll-better/`
- PartyKit server: `https://roll-better.thebluemuzzy.partykit.dev`
- Watch for connection issues, desync, stalls, or confusing UX

### 2. Commit hotfixes
- Files changed: `useOnlineGame.ts` (deferred snapshot), `gameStore.ts` (confirmUnlock guard, syncAllPlayerState guard, AFK auto-unlock, delta validation), `App.tsx` (AFK unlock effect)

### 3. Begin Phase 19: Connection Resilience
- Disconnect/reconnect handling
- AI drop-in/drop-out replacement

## Decisions Made This Session
- **Snapshot deferral**: phase_change snapshot application now deferred alongside the phase transition when animations are playing, preventing poolSize from changing mid-animation
- **Local player ownership during unlock**: syncAllPlayerState skips local player's poolSize/lockedDice while hasSubmittedUnlock is true and unlock animations are active — confirmUnlock owns those fields
- **Delta validation**: lock/unlock deltas filtered against client state (only add new locks, only unlock existing slots) to prevent stale visual glitches
- **AFK auto-unlock**: sets selectedForUnlock + triggers handleConfirmUnlock for full mitosis animation (same path as manual unlock)

## Deploy Process
1. Uncomment `VITE_PARTY_HOST` in `.env`
2. `npm run build`
3. `npx partykit deploy` (if server changed)
4. `npx gh-pages -d dist`
5. Re-comment `VITE_PARTY_HOST` in `.env`

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
