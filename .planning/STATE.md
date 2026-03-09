# Project State

## Current Status
v1.3 milestone in progress. Drop-in/Drop-out player connection lifecycle.

## Version
0.2.0.33

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-06)

**Core value:** The dice roll IS the product.
**Current focus:** v1.3 Drop-in/Drop-out — robust online player flow

## Current Position

Phase: 31 of 34 (Host Migration & Room Lifecycle)
Plan: 2 of 2 in current phase
Status: Phase complete
Last activity: 2026-03-09 — Completed 31-02-PLAN.md

Progress: █████████░ 88%

## Deploy Process
- **Frontend**: Auto-deploys via GitHub Actions on push to master. Workflow includes `VITE_PARTY_HOST` env var.
- **PartyKit server**: `npx partykit deploy` (manual, only when server code changes)
- **Live URL**: thebluemuzzy.github.io/roll-better/

## Key Architecture
- **Seat state model**: SeatState (human-active / human-afk / bot) + seatIndex on all players, server->protocol->client
- **Client-authoritative dice**: Each client rolls physics locally, reports values to server
- **Snapshot + Delta hybrid**: Every phase_change carries full PlayerSyncState[]
- **Stable client ID**: sessionStorage -> PartySocket `id` option -> same conn.id on reconnect
- **Rejoin protocol**: Server detects offline player with matching conn.id, sends rejoin_state with full game snapshot
- **Disconnect grace**: Per-player grace timer = remaining phase timer. Non-timed phases = immediate bot promotion. Empty room keepalive = 10s.
- **AFK timers**: 20s for both rolling and unlocking. Client-driven countdown, server-enforced timeout.
- **Pool cap**: Max 12 dice. Server enforces on manual unlock.
- **Host migration**: migrateHost() finds next human-active player with active connection. Called from promoteToBotFromAFK and removePlayer. No migrate-back.
- **Room dissolution**: dissolveRoom() broadcasts room_closed to all clients + mid-game joiners when all seats are bots. Existing 10s keepalive unchanged for tab-close.
- **Typed error codes**: Server error messages include optional `code` field (e.g. `room_full`). Client uses code for UI behavior (TRY AGAIN button).

## Dev Server Setup
- **Vite**: `http://localhost:5173` (Claude manages, `--host` for LAN)
- **PartyKit**: `localhost:1999` (Claude manages)
- `.env` must NOT set `VITE_PARTY_HOST` for local dev (defaults to localhost:1999)

## Accumulated Context

### Decisions
- v1.2 shipped: UI/UX polish complete. All decisions archived in milestones/v1.2-ROADMAP.md.
- 27-01: Dual identity model — conn.id (sessionStorage) for WebSocket session, persistentId (localStorage) for cross-session seat ownership
- 27-01: persistentIdToConnId map persists after disconnect for returning player detection
- 27-02: SeatState as string literal union (not enum), seatIndex sequential by array position, autopilotCounter server-only
- 28-01: AFK escalation threshold = 3 consecutive timeouts; resetAFKEscalation helper DRYs 3 manual handlers; promoteToBotFromAFK keeps player in array for reconnect
- 28-02: AFK threshold lowered to 2 (1 full AFK turn = bot takeover); client flags afk:true on auto-triggered messages; bot icon on avatars; return to menu on bot takeover
- 29-01: Grace window = remaining phase timer time; non-timed phases = immediate bot; empty room keepalive 10s; reconnect after grace expired sends room_closed
- 30-01: Mid-game joiners tracked in separate midGameJoiners map (not in players); first-claim-wins pendingSeatClaims; no room_state sent to joiners
- 31-01: migrateHost() helper iterates game players for human-active with active connection; dissolveRoom() broadcasts room_closed to all clients + mid-game joiners; no-migrate-back rule (inherent)
- 31-02: Typed error codes on ErrorMessage (code field); room_full error persists for TRY AGAIN; useOnlineGame handles room_closed independently for in-game cleanup

### Open Issues
(none)

### Roadmap Evolution
- v1.0 MVP: Phases 1-13 (shipped 2026-03-03)
- v1.1 Online Multiplayer: Phases 14-21 (shipped 2026-03-05)
- v1.2 Polish: Phases 22-26 (shipped 2026-03-06)
- Milestone v1.3 created: Drop-in/Drop-out player flow, 8 phases (Phase 27-34)

## Session Continuity

Last session: 2026-03-09
Stopped at: Completed 31-02-PLAN.md — Phase 31 complete
Resume file: None

### Recent Changes (2026-03-09)
- **31-02 delivered**: Room Full TRY AGAIN button + room dissolution handling across all client states
- **Key pattern**: Typed error codes (code field on ErrorMessage) for UI behavior switching; room_full error persists (no auto-clear)
- **Phase 31 complete**: Host migration, room dissolution, room full UX all done
- **Next up**: Phase 32 — Play Again Rework
