# Project State

## Current Status
Phase 21 (Compliance + Integration Testing) complete. Privacy policy page, Settings link, IARC assessment all done. All 21 phases complete.

## Version
0.2.0.7

## Current Position

Phase: 21 of 21 (Compliance + Integration Testing)
Plan: 1 of 1 complete
Status: Phase complete
Last activity: 2026-03-05 - Completed 21-01-PLAN.md (Privacy & Compliance)

Progress: ██████████████████████████████████████████████████████████████████ 100%

## Resume Command
All phases complete. Run `/gsd:complete-milestone` to archive v1.1.

## What Was Built (21-01)
- **public/privacy.html**: Standalone dark-themed privacy policy page — zero data collection statement
- **Settings privacy link**: "Privacy Policy" link at bottom of Settings panel, opens in new tab
- **IARC-ASSESSMENT.md**: All content categories evaluated, recommended rating 3+ (ESRB Everyone, PEGI 3)

## What Was Built (20-01)
- **vite-plugin-pwa**: registerType autoUpdate, workbox precaching, PartyKit NetworkOnly exclusion
- **Manifest**: standalone display, portrait orientation, dark theme (#1a1a2e)
- **Icons**: favicon.svg (dice face showing 5), pwa-192x192.png, pwa-512x512.png (placeholders)
- **index.html**: theme-color, apple-touch-icon, description meta tags
- **Deviation**: Added maximumFileSizeToCacheInBytes 5MB (Three.js bundle ~3.5MB exceeds default 2MB)

## Decisions Made
- **sessionStorage for client ID**: Each tab gets unique ID (PartyKit requirement: unique per connection, not per user)
- **intentionalLeave flag**: Only explicit exits prevent rejoin; network drops allow reconnection
- **60s keepalive**: Balances reconnection window vs resource cleanup
- **Zustand for disconnect state**: useRoom needs getState() outside React render
- **CustomEvent for toast**: Decouples useOnlineGame from App.tsx
- **Static HTML for privacy**: Crawlable, no JS required — better for compliance
- **IARC 3+**: Content warrants lower than initially conservative 13+

## Deploy Process
- **Frontend**: Auto-deploys via GitHub Actions on push to master. Workflow includes `VITE_PARTY_HOST` env var.
- **PartyKit server**: `npx partykit deploy` (manual, only when server code changes)

## Key Architecture
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
Stopped at: Completed 21-01-PLAN.md (Phase 21 complete — all phases done)
Resume file: None

## Previous Sessions
- 2026-03-05: Phase 21-01 (privacy policy, IARC assessment)
- 2026-03-05: Phase 20-01 (PWA setup — manifest, service worker, icons)
- 2026-03-05: Phase 19-03 (connection status UI)
- 2026-03-05: Phase 19-01/19-02 (stable client ID, reconnection handling)
- 2026-03-05: Phase 18 playtest hotfixes (deferred snapshot, unlock guards, AFK auto-unlock)
- 2026-03-04: Phases 17-18 (online multiplayer buildout)
