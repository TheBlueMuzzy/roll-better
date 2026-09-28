# Phase 19-02 Summary: Client-Side Reconnection Handling

## What Was Built

Client-side reconnection flow so the game recovers gracefully when a player's connection drops and PartySocket auto-reconnects.

### useRoom.ts Changes
- **gameActiveRef**: Tracks whether we're in an active game (set true on `game_starting`, cleared on `leave()` and intentional close)
- **onclose during game**: Does NOT reset state or show "Connection lost" — just marks `isConnected = false` so UI can show "Reconnecting..."
- **onclose during lobby/menu**: Resets as before (existing behavior preserved)
- **onopen handler**: Restores `isConnected = true` when PartySocket reconnects during a game
- **rejoin_state case**: Sets `isConnected = true` (game state sync handled by useOnlineGame)
- **player_reconnected case**: Pass-through for useOnlineGame

### useOnlineGame.ts Changes
- **rejoin_state handler**: Full state restoration from server snapshot:
  - Syncs goal values, all player states (scores, poolSize, lockedDice, startingDice)
  - Clears all stale animation state (lock, AI lock, unlock, AI unlock)
  - Clears deferred phase polling timers
  - Resets buffering flags (localPlayerLocked, hasSubmittedUnlock)
  - Forces phase to match server
  - Syncs round number via `setCurrentRound`
  - Resets watchdog state (lastPhase, phaseEnteredAt, watchdogFireCount) to prevent stale self-heal
- **player_reconnected handler**: Logs reconnection (toast UI deferred to 19-03)

### gameStore.ts Changes
- **setCurrentRound action**: New action to sync `currentRound` from server on rejoin (used by HUD "Round X", WinnersScreen "Rounds played", tutorial tips)

## Key Design Decisions
- **PartySocket auto-reconnect**: We rely on PartySocket's built-in reconnection. No custom retry logic needed.
- **PartySocket message buffering**: While disconnected, queued messages (watchdog phase_sync_request, skip_unlock) are buffered by PartySocket and sent on reconnect. Server handles gracefully.
- **No reactive gameActive state**: `gameActiveRef` is sufficient for internal onclose logic — no external consumers need it reactively (YAGNI).
- **Animation clearing on rejoin**: All animations cleared since we missed them while disconnected. Clean visual state on resume.

## Files Changed
- `src/hooks/useRoom.ts` — gameActiveRef, onclose/onopen handlers, rejoin_state/player_reconnected cases
- `src/hooks/useOnlineGame.ts` — rejoin_state and player_reconnected message handlers
- `src/store/gameStore.ts` — setCurrentRound action (interface + implementation)
