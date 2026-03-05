# Project State

## Current Status
Phase 19 (Connection Resilience) in progress. Plan 19-01 complete — stable client ID, server rejoin detection, keepalive grace period. Ready for 19-02 (client reconnection flow).

## Version
0.2.0.6

## Current Position

Phase: 19 of 21 (Connection Resilience)
Plan: 1 of 3 in current phase
Status: In progress
Last activity: 2026-03-05 - Completed 19-01-PLAN.md

Progress: █████████████████████████████████████████████████████████████ 100%

## Resume Command
Run `/gsd:execute-plan .planning/phases/19-connection-resilience/19-02-PLAN.md`

## What Was Built (19-01)
- **Stable client ID**: sessionStorage-based ID passed to PartySocket constructor via `getStableClientId()`
- **Protocol types**: RejoinStateMessage (full game snapshot) and PlayerReconnectedMessage
- **Intentional leave**: handleMenu sends "leave" before socket.close(); server tracks intentionalLeave flag
- **Server rejoin**: onConnect detects returning players (same conn.id, offline, not intentionalLeave), restores slot, sends rejoin_state
- **Keepalive**: Empty room stays alive 60s during active game for reconnection

## Decisions Made
- **sessionStorage for client ID**: Each tab gets unique ID (PartyKit requirement: unique per connection, not per user)
- **intentionalLeave flag**: Only explicit exits prevent rejoin; network drops allow reconnection
- **60s keepalive**: Balances reconnection window vs resource cleanup
- **Server-internal status**: "waiting_for_rejoin" not exposed in protocol RoomStatus type

## Deploy Process
- **Frontend**: Auto-deploys via GitHub Actions on push to master. Workflow includes `VITE_PARTY_HOST` env var.
- **PartyKit server**: `npx partykit deploy` (manual, only when server code changes)

## Key Architecture
- **Snapshot + Delta hybrid**: Every phase_change carries full PlayerSyncState[]
- **Stable client ID**: sessionStorage → PartySocket `id` option → same conn.id on reconnect
- **Rejoin protocol**: Server detects offline player with matching conn.id, sends rejoin_state with full game snapshot
- **Keepalive**: Empty room during active game survives 60s for reconnection
- **AFK timers**: 20s for both rolling and unlocking. Client-driven countdown, server-enforced timeout.
- **Pool cap**: Max 12 dice. Server enforces on manual unlock.

## Dev Server Setup
- **Vite**: `http://localhost:5173` (Claude manages, `--host` for LAN)
- **PartyKit**: `localhost:1999` (Claude manages)
- `.env` must NOT set `VITE_PARTY_HOST` for local dev (defaults to localhost:1999)

## Session Continuity
Last session: 2026-03-05
Stopped at: Completed 19-01-PLAN.md
Resume file: None

## Previous Sessions
- 2026-03-05: Phase 19-01 (stable client ID, server rejoin, keepalive)
- 2026-03-05: Phase 18 playtest hotfixes (deferred snapshot, unlock guards, AFK auto-unlock)
- 2026-03-04: Phases 17-18 (online multiplayer buildout)
