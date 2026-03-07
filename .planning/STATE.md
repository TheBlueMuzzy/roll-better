# Project State

## Current Status
v1.3 milestone in progress. Drop-in/Drop-out player connection lifecycle.

## Version
0.2.0.22

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-06)

**Core value:** The dice roll IS the product.
**Current focus:** v1.3 Drop-in/Drop-out — robust online player flow

## Current Position

Phase: 28 of 34 (AFK Autopilot & Escalation)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-03-07 — Completed 28-01-PLAN.md

Progress: ███░░░░░░░ 15%

## Deploy Process
- **Frontend**: Auto-deploys via GitHub Actions on push to master. Workflow includes `VITE_PARTY_HOST` env var.
- **PartyKit server**: `npx partykit deploy` (manual, only when server code changes)
- **Live URL**: thebluemuzzy.github.io/roll-better/

## Key Architecture
- **Seat state model**: SeatState (human-active / human-afk / bot) + seatIndex on all players, server→protocol→client
- **Client-authoritative dice**: Each client rolls physics locally, reports values to server
- **Snapshot + Delta hybrid**: Every phase_change carries full PlayerSyncState[]
- **Stable client ID**: sessionStorage -> PartySocket `id` option -> same conn.id on reconnect
- **Rejoin protocol**: Server detects offline player with matching conn.id, sends rejoin_state with full game snapshot
- **Keepalive**: Empty room during active game survives 60s for reconnection
- **AFK timers**: 20s for both rolling and unlocking. Client-driven countdown, server-enforced timeout.
- **Pool cap**: Max 12 dice. Server enforces on manual unlock.

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

### Open Issues
(none)

### Roadmap Evolution
- v1.0 MVP: Phases 1-13 (shipped 2026-03-03)
- v1.1 Online Multiplayer: Phases 14-21 (shipped 2026-03-05)
- v1.2 Polish: Phases 22-26 (shipped 2026-03-06)
- Milestone v1.3 created: Drop-in/Drop-out player flow, 8 phases (Phase 27-34)

## Session Continuity

Last session: 2026-03-07
Stopped at: Completed 28-01-PLAN.md
Resume file: None

### Recent Changes (2026-03-07)
- **27-01 complete**: Persistent player ID (localStorage `rb-player-id`) + server persistentIdToConnId seat mapping
- **27-02 complete**: SeatState enum + seatIndex + autopilotCounter flowing server→protocol→client
- **Phase 27 complete**: Player Identity & Seat Model foundation ready for Phase 28
- **28-01 complete**: Server AFK escalation engine — counter tracking, seat transitions, SeatStateChangedMessage protocol
- **Next**: 28-02 — Client seat state sync + UI feedback
