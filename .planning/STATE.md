# Project State

## Current Status
v1.3 milestone created. Drop-in/Drop-out player connection lifecycle.

## Version
0.2.0.18

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-06)

**Core value:** The dice roll IS the product.
**Current focus:** v1.3 Drop-in/Drop-out — robust online player flow

## Current Position

Phase: 27 of 34 (Player Identity & Seat Model)
Plan: Not started
Status: Ready to plan
Last activity: 2026-03-06 — Milestone v1.3 created

Progress: ░░░░░░░░░░ 0%

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
(none)

### Roadmap Evolution
- v1.0 MVP: Phases 1-13 (shipped 2026-03-03)
- v1.1 Online Multiplayer: Phases 14-21 (shipped 2026-03-05)
- v1.2 Polish: Phases 22-26 (shipped 2026-03-06)
- Milestone v1.3 created: Drop-in/Drop-out player flow, 8 phases (Phase 27-34)

## Session Continuity

Last session: 2026-03-06
Stopped at: Milestone v1.3 initialization complete
Resume file: None

### Recent Changes (2026-03-06)
- **PRD #8 full spec written**: Drop-in/Drop-out expanded from 2-line placeholder to complete player connection lifecycle (timer-based handoff, seat states, AFK escalation, mid-game join, host migration, Play Again flow, room dissolution)
- **Dependency audit**: All 14 PRD §11 ideas mapped into parallel tiers with dependency links
- **v1.3 milestone created**: 8 phases (27-34) on feature/v1.3-drop-in-drop-out branch
- **Next**: /gsd:plan-phase 27 (Player Identity & Seat Model)
