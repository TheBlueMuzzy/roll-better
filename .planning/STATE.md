# Project State

## Current Status
v1.4 Landscape milestone started. Switching from portrait-first (9:16) to landscape-only (16:9).

## Version
0.2.0.37

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-06)

**Core value:** The dice roll IS the product.
**Current focus:** Landscape-only layout conversion

## Current Position

Phase: 38 of 39 (Menu & Screens) — COMPLETE
Plan: 2 of 2 — done
Status: Phase 38 complete. Ready for Phase 39 (Cleanup & UAT).
Last activity: 2026-03-26 — 38-02 executed and approved

Progress: ████████░░ 80%

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
- **Host migration**: migrateHost() finds next human-active player with active connection. Called from promoteToBotFromAFK and removePlayer. Lobby fallback iterates this.players when gameState is null. No migrate-back.
- **Room dissolution**: dissolveRoom() broadcasts room_closed to all clients + mid-game joiners when all seats are bots. Existing 10s keepalive unchanged for tab-close.
- **Typed error codes**: Server error messages include optional `code` field (e.g. `room_full`). Client uses code for UI behavior (TRY AGAIN button).
- **Play Again flow**: play_again message → sessionEnd to "waiting" lobby → host starts with ready players + bots. previousGamePersistentIds saved for auto-match. Client auto-detects lobby return via room state. Late returners auto-claim old seat with "Reclaiming your seat..." feedback.

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
- 32-01: play_again replaces restart_game; previousGamePersistentIds persists through game for auto-match (cleared on next sessionEnd); unready players removed from players map but stay connected for mid-game join
- 32-02: Late play_again routes through mid-game join; unreadyPlayers map preserves identity; tryAutoMatchSeat auto-claims old seat via persistentId; autoMatched field on SeatClaimResultMessage
- 32-03: Client Play Again sends play_again (restart_game removed); lobby return auto-detected via room state useEffect; claiming mode broadened to trigger from any onlineMode; autoMatched → "Reclaiming your seat..." UI
- 33-01: Duplicate persistentId detection — server evicts old connection with connected_elsewhere error; in-game eviction triggers standard disconnect path; client shows "connected in another tab" with BACK TO MENU
- 33-02: Seat takeover reason field (reclaim vs takeover) for context-aware notifications; cancelClaim() for mid-game join; reconnect toast verified already working

### Open Issues
(none)

### Roadmap Evolution
- v1.0 MVP: Phases 1-13 (shipped 2026-03-03)
- v1.1 Online Multiplayer: Phases 14-21 (shipped 2026-03-05)
- v1.2 Polish: Phases 22-26 (shipped 2026-03-06)
- Milestone v1.3 shipped: Drop-in/Drop-out player flow, 8 phases (Phase 27-34), shipped 2026-03-12
- Milestone v1.4 created: Landscape-only layout conversion, 5 phases (Phase 35-39)
- Phase 37.1 inserted after Phase 37: Convert HTML profile overlays to 3D elements (scaling fix)

## Session Continuity

Last session: 2026-03-25
Stopped at: Phase 37 complete. Ready for Phase 38.
Resume file: None

### Recent Changes (2026-03-25)
- **Phase 37 complete**: Game HUD Redesign
  - 37-01: Touch targets (vmin), round counter top-right, status text right-half, notifications CSS
  - 37-02: Tip banner over rolling area, unlock button at left: 75%
  - Commits: 18bae31, 4e0ee44, 3778d1f
  - **Known issue**: Profile icons (avatars/stars) overlap locked dice at wide browser viewports — 3D scene positioning, not HUD
- **Phase 36 closed**: left/right split layout confirmed
- Deleted empty Unity project folder (Documents/UnityProjects/Roll Better)

### Previous (2026-03-13)
- 36-02 tasks 1-2 complete: player rows + animation scaling for landscape
- Layout pivot: left/right split (ROW_X_OFFSET=-4, ROLLING_X_OFFSET=5)
- 3 commits: db0fd55, f5825b9, 32023da

### Previous (2026-03-12)
- 36-01 complete: arena widened (ARENA_HALF_X=3.8→4.5), goal row at Z=-5.0, full-viewport floors
