# Project State

## Current Status
v1.1 Online Multiplayer shipped. All 21 phases complete. Game publicly playable.

## Version
0.2.0.11

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-05)

**Core value:** The dice roll IS the product.
**Current focus:** Milestone complete — planning next milestone.

## Current Position

Phase: 21 of 21 (all complete)
Plan: All shipped
Status: v1.1 milestone complete
Last activity: 2026-03-05 — v1.1 milestone shipped

Progress: ██████████████████████████████████████████████████████████████████ 100%

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

## Session Continuity
Last session: 2026-03-05
Stopped at: v1.1 milestone complete
Resume file: None
