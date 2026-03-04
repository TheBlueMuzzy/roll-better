# Summary: Phase 18 Plan 03 — Rolling AFK Countdown Timer

## What Was Built
Client-driven rolling AFK countdown timer with visible UI. Replaces reliance on server-side `setTimeout(20_000)` which didn't fire reliably in PartyKit's workerd runtime.

## Approach
- Host client runs a visible 20-second countdown bar during online rolling phase
- When the bar hits zero, the host sends a `rolling_timeout` message to the server
- Server validates (must be host, must be rolling phase), clears its fallback timer, and auto-rolls AFK players
- Server-side `setTimeout(20_000)` stays as silent fallback if host disconnects

## Files Changed
- `src/types/protocol.ts` — Added `RollingTimeoutMessage` to `ClientMessage` union
- `src/types/game.ts` — Added `isOnlineHost: boolean` to `GameState`
- `src/store/gameStore.ts` — Wired `isOnlineHost` in `setOnlineMode` / `clearOnlineMode`
- `src/App.tsx` — Pass host status to `setOnlineMode` on game start
- `src/hooks/useOnlineGame.ts` — Pass host status on restart
- `src/components/RollingCountdown.tsx` — **NEW** countdown bar component
- `src/components/HUD.tsx` — Renders `<RollingCountdown />` in bottom area
- `party/server.ts` — Added `rolling_timeout` message handler + `handleRollingTimeout` method
- `src/App.css` — Countdown bar styles

## Files Created
- `src/components/RollingCountdown.tsx`

## Key Decisions
- **Client-driven timer**: Moved authority from server `setTimeout` (unreliable in workerd) to host client with visible countdown
- **Server fallback stays**: The server's 20s timer remains as a backup — if host disconnects, it still fires
- **Double-trigger safe**: `autoRollUnresponsivePlayers` checks `phase === "rolling"` — can't fire twice
- **Host-only validation**: Server rejects `rolling_timeout` from non-host connections

## UAT Results
All 5 tests passed (2026-03-04):
1. Pre-flight — servers start clean
2. Countdown bar appears and shrinks over 20s
3. AFK player auto-rolled when bar hits zero
4. Bar disappears when both players roll early
5. Normal gameplay unaffected

## Version
v0.2.0.2
