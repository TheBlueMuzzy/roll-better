# Roll Better — Online play in detail
> Detail for TDD §2b Multiplayer — keep in step with TDD.md

(Moved from the TDD's §2b on 2026-09-28; the TDD keeps the summary and the Timers table.)

## Who's in charge
Each phone rolls its own physics and reports values (client-authoritative dice); the server runs `findAutoLocks` itself (server-authoritative locking), validates unlocks, advances phases when everyone has acted, runs AFK backstops and bots, owns rooms/seats.

## Turn flow
- **Rolling:** roll → your locks animate locally at once → `roll_result` to server → server relays `player_lock_result` to everyone else → others buffer it until they've locked themselves, then reveal with the profile-emerge animation → when all have rolled, `phase_change: unlocking`.
- **Unlocking (since v0.2.1, D15):** you drag dice; your own 3 s inactivity timer ends your turn → your mitosis plays locally → ONE `unlock_request` (all dragged slots) or `skip_unlock` → server validates, applies, relays `unlock_result` to others (buffered until they've submitted) → when all responded, `phase_change: idle`. Each committed drag also sends `unlock_activity` so the backstop never AFKs an active player (D16).
- **Turn end (F47/B006):** when the 3 s timer fires, a drag in progress resolves by zone (rolling zone → counts, parked at a clear spot; locked zone → snaps back), then the turn is closed — no new drags until the next unlock phase (`isUnlockTurnOpen` / `resolveDragRelease` in `unlockTurn.ts`). Leaving the unlock phase and `initRound` clear parked dice (`committedUnlocks`). A server AFK unlock for you goes through the same path: its slots become parked dice → the same batch mitosis.
- **12-dice cap:** pool + still-locked + 2 per unlocked die ≤ 12 — one shared helper (`src/utils/diceCap.ts`, `maxUnlocksAllowed`) used by the phone and the server.

## Staying in sync
- **Deferred snapshot:** a `phase_change` that arrives mid-animation is held, polled every 100 ms, applied when animations clear (5 s force-apply).
- **Watchdog:** 1 s heartbeat; stuck >5 s in `locking`/`scoring`/`roundEnd` → `phase_sync_request`; 3 stalls in a row → force `idle`.

## Messages
Client → server: `join`, `leave`, `start_game`, `roll_result`, `unlock_request`, `skip_unlock`, `unlock_activity` (D16), `rolling_timeout`, `play_again`, `phase_sync_request`, `seat_claim`.

Server → client: `connected`, `room_state`, `player_joined`, `player_left`, `error` (with `code`, e.g. `room_full`), `game_starting` (server-made goal values), `roll_results`, `player_lock_result`, `phase_change`, `round_start`, `unlock_result`, `scoring`, `session_end`, `phase_sync`, `rejoin_state`, `player_reconnected`, `seat_state_changed`, `seat_list`, `seat_claim_result`, `seat_takeover`, `play_again_ack`, `room_closed`.

Types live in `src/types/protocol.ts`.

## Identity + seats
`conn.id` (sessionStorage, per tab) for the socket; `persistentId` (localStorage) owns the seat. Seat states: `human-active` / `human-afk` / `bot`. Rejoin with the same id → `rejoin_state` full snapshot. Duplicate `persistentId` → old tab evicted (`connected_elsewhere`). Mid-game joiners claim bot seats at phase boundaries (first claim wins). Host migrates to the next active human; all-bot room → `room_closed`. Max 8 players per room.

**AFK:** 2 consecutive auto-actions → bot takes the seat.

## What each deploy contains
Push to `master` → GitHub Actions runs `npm test` + `npm run build` (with `VITE_PARTY_HOST`) → Pages. Server changes need `npx partykit deploy` (or `npm run party:deploy`) by hand — a front-end release does NOT update the server.
