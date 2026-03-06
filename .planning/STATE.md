# Project State

## Current Status
v1.2 milestone complete and archived. All 26 phases shipped across 3 milestones.

## Version
0.2.0.18

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-06)

**Core value:** The dice roll IS the product.
**Current focus:** Planning next milestone

## Current Position

Phase: 26 of 26 (all phases complete)
Plan: N/A
Status: Ready to plan next milestone
Last activity: 2026-03-06 — v1.2 milestone archived

Progress: 26/26 phases complete

## Deploy Process
- **Frontend**: Auto-deploys via GitHub Actions on push to master. Workflow includes `VITE_PARTY_HOST` env var.
- **PartyKit server**: `npx partykit deploy` (manual, only when server code changes)
- **Live URL**: thebluemuzzy.github.io/roll-better/

## Key Architecture
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

### Open Issues
- UAT-001: Room timeout issue (logged, not blocking)

### Roadmap Evolution
- v1.0 MVP: Phases 1-13 (shipped 2026-03-03)
- v1.1 Online Multiplayer: Phases 14-21 (shipped 2026-03-05)
- v1.2 Polish: Phases 22-26 (shipped 2026-03-06)

## Session Continuity

Last session: 2026-03-06
Stopped at: v1.2 milestone archived. Next milestone TBD.
Resume file: None
