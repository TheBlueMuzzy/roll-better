# Project State

## Current Status
Phase 25 planning complete. Multiplayer Screen Rework plan created — merge LobbyScreen into MainMenu with inline Create/Join flows.

## Version
0.2.0.15

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-05)

**Core value:** The dice roll IS the product.
**Current focus:** v1.2 Polish — UI/UX cleanup, menu simplification, multiplayer screen rework.

## Current Position

Phase: 25 of 26 (Multiplayer Screen Rework)
Plan: 1 of 1 in current phase
Status: Plan created, ready for execution
Last activity: 2026-03-06 — Created 25-01-PLAN.md

Progress: ████████░░ 60%

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
- Shake-to-roll: removed entirely (Phase 23-01).
- Confirmation toggle: wiring to actual behavior (may be structurally tied to drag — evaluate during Phase 23).
- How to Play: removed from Settings panel, main menu is sole access point (Phase 23-01).
- menu-backdrop: position:absolute (not fixed) to stay within #root 9:16 bounds (Phase 23-02).
- Slider fill: CSS --fill variable on track pseudo-elements for proper thumb centering (Phase 23-02).
- randomDifficulty() duplicated in server.ts (PartyKit bundles separately from src/) (Phase 24-01).

### Roadmap Evolution
- Milestone v1.2 created: UI/UX polish, 5 phases (Phase 22-26)

## Session Continuity

Last session: 2026-03-06
Stopped at: Phase 25 plan created, awaiting execution
Resume file: .planning/phases/25-multiplayer-screen-rework/25-01-PLAN.md
