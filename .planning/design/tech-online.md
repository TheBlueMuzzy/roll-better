# Roll Better — Online play in detail
> Detail for TDD §2b Multiplayer + Timers and the D15–D16 decisions — keep in step with TDD.md

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

## Timers — full notes
(Moved from the TDD §2b Timers table on 2026-09-29; the table there keeps one short line per timer.)
- **Unlock inactivity (3 s, client):** restarts on every committed drag; owned by `StatusPin` → `useCountdown`, offline + online (was the HUD until v1.7); starts in `unlocking` once animations are done. On expiry: a mid-drag die resolves by zone (commit / snap back), the turn is closed → mitosis; online: send one `unlock_request`/`skip_unlock` (D15). All synchronous in the tick's task — a drop is either in the snapshot or refused; leaving `unlocking` returns any parked die to its slot. Race sweep: `e2e/unlock-race-sweep.mjs`.
- **Unlock backstop (server):** 25 s (`UNLOCK_BACKSTOP_MS`); each `unlock_activity` tops it up to ≥ 10 s left (`UNLOCK_ACTIVITY_GRACE_MS`, D16), never past 45 s from the phase start (`UNLOCK_MAX_PHASE_MS`, hard limit). On expiry `autoSkipUnresponsivePlayers` → the client gets an AFK unlock, played through the drag path (still counts toward AFK escalation).
- **Roll backstop (server):** 25 s = the client's 20 s + 5 s margin; starts when the first `roll_result` arrives (idle → rolling); auto-rolls non-responders.

## Decisions — full text (D15–D16)
(Moved word for word from the TDD §8 Decisions log on 2026-09-29; the TDD keeps one line per decision.)
```
D16 · 2026-09-28 · Unlock backstop vs the 3 s drag timer: each committed drag pings the server (unlock_activity)
  Proposed by: Claude (F47 task 4)
  Options: longer fixed backstop (turn can be ~7 windows × 3 s + lead-in ≈ 26 s, so 35 s+) /
  per-player deadline worked out from the cap / activity ping that tops the backstop up
  Chose: activity ping — on unlock_activity the server makes sure ≥ 10 s remain on the (room-wide) backstop.
  Why: an actively dragging player can never be AFK'd however many dice they drag, real AFK is still
  caught at 25 s, and it's one tiny message per drag (≤ 7 per turn). Cost: an active dragger can delay
  AFK detection of someone else by a few seconds. Revisit if the backstop becomes per-player.
  2026-09-29 (pre-release review): the top-ups had no limit, so a client pinging every 9 s could hold the whole room in the unlock phase → added a 45 s hard limit per phase (a real turn is ≈ 26 s at most).
D15 · 2026-09-28 · Online drag-to-unlock: each phone sends ONE batched unlock_request when its own inactivity timer ends
  Proposed by: Claude (hotfix B003); Muzzy suggested the alternative
  Options: server decides every player's unlocks itself at timer end / each phone owns its timer and sends one batch
  Chose: per-phone batch — Muzzy's decision (he approved it over his own server-decides idea). Why: your own dice never wait
  on a server round-trip and a drag near the deadline can't be lost; the server's 25 s backstop still catches real AFK.
  Revisit if we ever go server-authoritative for anti-cheat.
```
