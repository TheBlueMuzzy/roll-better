# Online Sync Audit — Root Cause Analysis & Bulletproof Architecture

## Date: 2026-03-04
## Status: Proposal — awaiting approval before any code changes

---

## What's Actually Wrong

The game architecture is sound: server-authoritative state, per-player relay, buffered reveals, deferred phase transitions. **The problem is that WebSocket messages silently disappear**, and the system has no way to recover.

### Evidence from playtesting:
1. **Host unlocks dice → P2 never sees it** — `unlock_result` message lost
2. **Host locks dice → P2 never sees it** — `player_lock_result` message lost
3. **Client stuck in "Locked X!" forever** — `phase_change: unlocking` message lost
4. **Watchdog sends phase_sync_request, no response** — server response also lost
5. **Same bugs happen in both directions** — not a code bug, it's transport

### Why messages get lost:
PartySocket (the WebSocket library) has auto-reconnect. If the underlying connection drops for even 100ms — common on WiFi, mobile, browser tab throttling — any messages sent during that gap vanish. Neither client nor server knows they were lost.

---

## Current Architecture (Delta-Based)

```
Server sends individual events:
  player_lock_result  → "Player X locked slot 3"
  unlock_result       → "Player X unlocked slot 5"
  phase_change        → "Phase is now unlocking"
  scoring             → "Player X scored 6 points"

Client accumulates these deltas to build state.
If ANY delta is lost, state diverges permanently until round_start.
```

**This is like sending text messages one word at a time. If one gets lost, the sentence is broken.**

---

## Proposed Architecture (Snapshot + Delta)

```
Server sends FULL state snapshot with every phase transition.
Deltas (player_lock_result, unlock_result) remain for animations.
But the snapshot in phase_change is the source of truth.
```

**This is like sending the full sentence every time, plus individual words for real-time feedback.**

### The Key Change: `phase_change` carries full game state

Currently:
```json
{ "type": "phase_change", "phase": "unlocking" }
```

Proposed:
```json
{
  "type": "phase_change",
  "phase": "unlocking",
  "players": [
    { "id": "abc", "poolSize": 3, "lockedDice": [...], "score": 5, "startingDice": 2 },
    { "id": "def", "poolSize": 1, "lockedDice": [...], "score": 8, "startingDice": 3 }
  ]
}
```

### What this fixes:
- **Lost `player_lock_result`?** → Next `phase_change` carries correct state. Max 2-3s of stale display.
- **Lost `unlock_result`?** → Next `phase_change` carries correct state.
- **Lost `phase_change` itself?** → Watchdog requests full state sync (already exists, just needs the snapshot).
- **Lost `round_start`?** → Watchdog detects idle phase with no goals, requests sync.

### What stays the same:
- `player_lock_result` and `unlock_result` still sent for **real-time animation triggers**
- Client still buffers and defers animations
- Server still authoritative for all state
- AFK timers unchanged

---

## Implementation Plan

### Phase A: Server-side snapshot broadcasting (3 changes)

**A1. Enrich `phase_change` with player state snapshot**

Every time the server broadcasts `phase_change`, include full `players[]` array:
```typescript
// server.ts — new helper
private broadcastPhaseChange(phase: string) {
  this.gameState.phase = phase;
  const players = this.gameState.players.map(p => ({
    id: p.id, poolSize: p.poolSize,
    lockedDice: p.lockedDice, score: p.score,
    startingDice: p.startingDice
  }));
  this.room.broadcast(JSON.stringify({
    type: "phase_change", phase, players
  }));
}
```

Replace all `phase_change` broadcasts with this helper:
- `checkWinnerOrUnlock()` → phase "unlocking"
- `processAllUnlocks()` → phase "idle"
- `handleHandicapAndNextRound()` → phase "roundEnd"

**A2. Enrich `phase_sync` response with player state**

When watchdog requests phase sync, respond with full state:
```typescript
case "phase_sync_request":
  if (this.gameState) {
    const players = this.gameState.players.map(p => ({
      id: p.id, poolSize: p.poolSize,
      lockedDice: p.lockedDice, score: p.score,
      startingDice: p.startingDice
    }));
    this.sendToConnection(sender, {
      type: "phase_sync", phase: this.gameState.phase, players
    });
  }
  break;
```

**A3. Update protocol types**

Add optional `players` field to `PhaseChangeMessage` and `PhaseSyncMessage`.

### Phase B: Client-side snapshot application (2 changes)

**B1. Apply snapshot in `phase_change` handler**

When `phase_change` arrives with `players[]`, sync ALL player state before applying the phase:
```typescript
case "phase_change": {
  // If snapshot included, sync all player state first
  if (msg.players) {
    useGameStore.getState().syncAllPlayerState(msg.players);
  }
  // Then apply phase (existing deferred logic)
  ...
}
```

**B2. Apply snapshot in `phase_sync` handler**

Same pattern — sync state before forcing phase.

**B3. New store action: `syncAllPlayerState`**

Maps server player IDs to local player indices and overwrites `poolSize`, `lockedDice`, `score`, `startingDice` for ALL players (not just local). This is the "full state sync" that heals any divergence.

### Phase C: Watchdog cleanup (1 change)

**C1. Simplify watchdog**

Remove the escalation logic (fire count, self-heal to idle). With snapshot-enriched phase_change, the watchdog only needs to:
1. Detect stall (>5s in transient phase)
2. Clear animations
3. Send `phase_sync_request`
4. Server responds with full state → client syncs and moves on

The self-heal-to-idle hack becomes unnecessary because phase_sync now carries full state.

### Phase D: Remove patched code (cleanup)

- Remove `applyServerAutoRoll` (superseded by `syncAllPlayerState`)
- Remove the `player_lock_result` own-ID detection (snapshot handles it)
- Revert server rolling timeout to 25s (was changed to 45s as a band-aid)
- Remove watchdog fire counting / self-heal logic

---

## What This Does NOT Change

- Client-authoritative dice physics (client rolls, reports values)
- Per-player relay pattern (player_lock_result, unlock_result still sent for animations)
- Buffered reveal system (still defers animations until own action completes)
- AFK countdown timers (20s idle, 20s unlock — client-driven)
- Deferred phase transition system (still polls for animation completion)

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Snapshot messages are larger (~500 bytes vs ~50 bytes) | Negligible on modern connections. 4 players × ~120 bytes each. |
| Double-applying state (delta + snapshot) | Snapshot is idempotent — applying correct state over correct state is a no-op |
| Animation triggers lost (player_lock_result dropped) | Acceptable — player's profile just shows updated locks without animation. Functional > pretty. |
| Round_start message lost | Still a critical gap. Add round_start to watchdog detection (idle phase with stale round number). |

---

## Testing Checklist

After implementation:
1. Full AFK game (both players idle) — should complete without stalls
2. One player active, one AFK — active player sees correct state for AFK player
3. Manual play with both players — locks/unlocks visible to both sides
4. Tab backgrounding mid-game — should recover on foregrounding
5. Rapid unlock/lock cycles — no state divergence
6. Session end reached — both players see winners screen

---

## Summary

**Stop patching individual symptoms. Add full state snapshots to phase transitions.** This turns every phase_change into a checkpoint that heals any accumulated message loss. The delta messages (lock/unlock results) become optional animation triggers rather than critical state updates.

Estimated scope: ~100 lines changed across 4 files. No new files needed.
