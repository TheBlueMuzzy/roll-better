# Project State

## Current Status
v1.2 Polish milestone created. 5 phases (22-26) planned. Ready to plan Phase 22.

## Version
0.2.0.11

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-05)

**Core value:** The dice roll IS the product.
**Current focus:** v1.2 Polish — UI/UX cleanup, menu simplification, multiplayer screen rework.

## Current Position

Phase: 22 of 26 (Main Menu Restructure)
Plan: Not started
Status: Ready to plan
Last activity: 2026-03-05 — Milestone v1.2 created

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
- v1.2 scope: UI/UX polish only. Drag-to-unlock and hold-to-gather-roll deferred to v1.3.
- AI difficulty: removing manual selection, randomizing per AI at fill time.
- Shake-to-roll: being removed entirely.
- Confirmation toggle: wiring to actual behavior (may be structurally tied to drag — evaluate during Phase 23).

### Roadmap Evolution
- Milestone v1.2 created: UI/UX polish, 5 phases (Phase 22-26)

## Session Continuity

Last session: 2026-03-05
Stopped at: Milestone v1.2 initialization
Resume file: None
