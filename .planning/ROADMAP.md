# Roadmap: Roll Better

## Overview

Build a premium browser-based multiplayer dice-matching game from scratch. Start with a single beautiful 3D die, layer on physics and game logic, add AI opponents, then polish with mobile-specific features and audio. v1.0 delivers local AI gameplay; v1.1 adds real-time online multiplayer via Partykit.

## Milestones

- ✅ [v1.0 MVP](milestones/v1.0-ROADMAP.md) (Phases 1-13) — SHIPPED 2026-03-03
- ✅ [v1.1 Online Multiplayer](milestones/v1.1-ROADMAP.md) (Phases 14-21) — SHIPPED 2026-03-05
- ✅ [v1.2 Polish](milestones/v1.2-ROADMAP.md) (Phases 22-26) — SHIPPED 2026-03-06
- 🚧 **v1.3 Drop-in/Drop-out** - Phases 27-34 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-13) — SHIPPED 2026-03-03</summary>

- [x] **Phase 1: Foundation** *(2026-02-28)* — Scaffold Vite + React + R3F + Rapier + Zustand, basic 3D scene
- [x] **Phase 2: Premium Die** *(2026-02-28)* — Single premium 3D die with materials, lighting, shadows
- [x] **Phase 3: Dice Rolling** *(2026-02-28)* — Multi-dice physics rolling, settling, face detection, collision sounds
- [x] **Phase 4: Game Board Layout** *(2026-03-01)* — Goal row, player row, dice pool, HUD, portrait responsive
- [x] **Phase 5: Core Game Logic** *(2026-03-01)* — Goal gen, match detection, auto-lock, scoring, handicap, session state
- [x] **Phase 6: Lerp & Animation** *(2026-03-01)* — Lock/unlock lerps, bonus spawn, score counting, round transitions
- [x] **Phase 7: Unlock Interaction** *(2026-03-02)* — Settings panel, How to Play carousel, Tips system
- [x] **Phase 8: AI Opponents** *(2026-03-02)* — Easy/Medium/Hard heuristics, multi-player with AI
- [x] **Phase 9: Multi-Player Display** *(2026-03-02)* — Multiple player rows, icons, Goal indicators
- [x] **Phase 10: Screens & Flow** *(2026-03-02)* — Main Menu, Settings, Winners Screen, transitions
- [x] **Phase 11: Mobile Polish** *(2026-03-02)* — Shake-to-roll, haptics, touch optimization, performance
- [x] **Phase 12: Responsive UI** *(2026-03-02)* — HUD, overlays, modals adapt to all phone sizes
- [x] **Phase 13: Audio & Juice** *(2026-03-03)* — Audio hooks wired, procedural sounds stripped to stubs pending art pass

</details>

<details>
<summary>v1.1 Online Multiplayer (Phases 14-21) — SHIPPED 2026-03-05</summary>

- [x] **Phase 14: Partykit Server Setup** *(2026-03-03)* — Cloudflare free tier WebSocket rooms, create/join/close lifecycle
- [x] **Phase 15: Lobby UI + Room Codes** *(2026-03-03)* — Jackbox-style 4-letter codes, player list, ready-up, AI fill
- [x] **Phase 16: State Sync Protocol** *(2026-03-03)* — Game state to Partykit room to all clients
- [x] **Phase 17: Dice Sync + Simultaneous Play** *(2026-03-04)* — Roll results, auto-lock, visual sync across clients
- [x] **Phase 18: Unlock + Scoring Sync** *(2026-03-04)* — Unlock decisions, scoring, round transitions + turn timers
- [x] **Phase 19: Connection Resilience** *(2026-03-05)* — Disconnect/reconnect, connection status UI
- [x] **Phase 20: GitHub Pages + PWA** *(2026-03-05)* — Deploy to public URL, installable, auto-updates
- [x] **Phase 21: Compliance + Integration Testing** *(2026-03-05)* — Privacy policy, IARC, compliance docs

</details>

<details>
<summary>v1.2 Polish (Phases 22-26) — SHIPPED 2026-03-06</summary>

- [x] **Phase 22: Main Menu Restructure** *(2026-03-05)* — Simplified menu, removed difficulty selector, added How to Play + Upgrades
- [x] **Phase 23: Settings & Controls Cleanup** *(2026-03-06)* — Removed shake-to-roll, gear icon, audio slider fix
- [x] **Phase 24: AI Difficulty Randomization** *(2026-03-06)* — Random Easy/Medium/Hard per bot
- [x] **Phase 25: Multiplayer Screen Rework** *(2026-03-06)* — Merged LobbyScreen into MainMenu with inline Create/Join
- [x] **Phase 26: How to Play Content Refresh** *(2026-03-06)* — Verified HTP accuracy, no changes needed

</details>

### 🚧 v1.3 Drop-in/Drop-out (In Progress)

**Milestone Goal:** Make online player flow robust and predictable — joining, leaving, reconnecting, and handoff all follow one simple rule set. Based on the full spec in PRD §11 #8.

#### Phase 27: Player Identity & Seat Model

**Goal**: Persistent client ID in localStorage, server seat state machine (Human-Active / Human-AFK / Bot), seat-to-playerID mapping per room
**Depends on**: Previous milestone complete
**Research**: Unlikely (internal patterns)
**Plans**: TBD

Plans:
- [x] 27-01: Persistent player ID + protocol + server seat mapping
- [x] 27-02: Seat state machine data model (SeatState + seatIndex + autopilotCounter)

#### Phase 28: AFK Autopilot & Escalation

**Goal**: Rework AFK system — 1-beat autopilot for connected timeout, consecutive autopilot counter, 3 strikes → full bot promotion
**Depends on**: Phase 27 (seat state machine)
**Research**: Unlikely (extends existing AFK system)
**Plans**: 2

Plans:
- [x] 28-01: Server AFK escalation engine (autopilot counter + seat state transitions + protocol)
- [x] 28-02: Client seat state sync + UI feedback notifications

#### Phase 29: Disconnect Handoff

**Goal**: Replace 60s keepalive with timer-based grace window. Disconnect + phase timer expires = full bot takeover. Reconnect within timer = seamless resume.
**Depends on**: Phase 27 (seat states), Phase 28 (bot promotion path)
**Research**: Unlikely (reworking existing reconnect logic)
**Plans**: TBD

Plans:
- [x] 29-01: Replace 60s keepalive with phase-timer-based disconnect grace window

#### Phase 30: Mid-Game Join Flow

**Goal**: Enter room code mid-game → see available bot seats → tap avatar to claim → server-authoritative seat assignment (first claim wins) → queued takeover at next phase boundary
**Depends on**: Phase 29 (bot seats must exist from handoff)
**Research**: Likely (new UI state for seat selection + new server protocol messages for claim/queue/takeover)
**Research topics**: New WebSocket message types for seat_claim/seat_assigned/seat_taken, UI state for mid-game lobby overlay, phase-boundary takeover trigger
**Plans**: TBD

Plans:
- [x] 30-01: Server protocol types + mid-game join acceptance + seat claim validation
- [x] 30-02: Phase-boundary takeover execution + edge case cleanup
- [x] 30-03: Client-side mid-game join UI (seat selection + claim interaction)
- [x] 30-04: Client takeover transition + host-side visual sync + UAT verified

#### Phase 31: Host Migration & Room Lifecycle

**Goal**: Auto-migrate host to next connected human when host's seat becomes Bot (no migrate-back). No connected humans = room dissolves immediately. Room Full message + TRY AGAIN button for full rooms.
**Depends on**: Phase 29 (disconnect triggers migration), Phase 28 (AFK triggers migration)
**Research**: Unlikely (server logic)
**Plans**: TBD

Plans:
- [x] 31-01: Extract migrateHost() helper + all-bots room dissolution

#### Phase 32: Play Again Rework

**Goal**: Winners screen → return to lobby with same room code. Host can Start early (bots fill empty seats). Late Play Again after game started → mid-game join flow. Server recognizes returning player ID and auto-matches to their old bot-held seat.
**Depends on**: Phase 30 (mid-game join flow for late returners)
**Research**: Unlikely (extends existing Play Again + lobby flow)
**Plans**: TBD

Plans:
- [ ] 32-01: TBD

#### Phase 33: Connection Polish & Edge Cases

**Goal**: Double-connection rejection (stale tab), UI feedback for all state transitions (taking over next phase, seat taken, waiting for phase boundary), clear status text for every connection scenario
**Depends on**: Phases 27-32 (all systems built)
**Research**: Unlikely (polish pass)
**Plans**: TBD

Plans:
- [ ] 33-01: TBD

#### Phase 34: Integration Testing & UAT

**Goal**: Full scenario testing of all 7 player flow scenarios from PRD spec: late friend joins, phone call disconnect, accidental tab close, run it back, rage quit, host leaves, room full
**Depends on**: Phase 33 (all features polished)
**Research**: Unlikely (testing)
**Plans**: TBD

Plans:
- [ ] 34-01: TBD

## Progress

**v1.0 + v1.1 + v1.2 complete.** 26 phases, 69 plans shipped.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|---------------|--------|-----------|
| 1. Foundation | v1.0 | 2/2 | Complete | 2026-02-28 |
| 2. Premium Die | v1.0 | 3/3 | Complete | 2026-02-28 |
| 3. Dice Rolling | v1.0 | 3/3 | Complete | 2026-02-28 |
| 4. Game Board Layout | v1.0 | 3/3 | Complete | 2026-03-01 |
| 5. Core Game Logic | v1.0 | 4/4 | Complete | 2026-03-01 |
| 6. Lerp & Animation | v1.0 | 3/3 | Complete | 2026-03-01 |
| 7. Unlock Interaction | v1.0 | 3/3 | Complete | 2026-03-02 |
| 8. AI Opponents | v1.0 | 2/2 | Complete | 2026-03-02 |
| 9. Multi-Player Display | v1.0 | 6/6 | Complete | 2026-03-02 |
| 10. Screens & Flow | v1.0 | 3/3 | Complete | 2026-03-02 |
| 11. Mobile Polish | v1.0 | 3/3 | Complete | 2026-03-02 |
| 12. Responsive UI | v1.0 | 4/4 | Complete | 2026-03-02 |
| 13. Audio & Juice | v1.0 | 4/4 | Complete | 2026-03-03 |
| 14. Partykit Server Setup | v1.1 | 3/3 | Complete | 2026-03-03 |
| 15. Lobby UI + Room Codes | v1.1 | 4/4 | Complete | 2026-03-03 |
| 16. State Sync Protocol | v1.1 | 2/2 | Complete | 2026-03-03 |
| 17. Dice Sync + Simultaneous Play | v1.1 | 4/4 | Complete | 2026-03-04 |
| 18. Unlock + Scoring Sync | v1.1 | 3/3 | Complete | 2026-03-04 |
| 19. Connection Resilience | v1.1 | 3/3 | Complete | 2026-03-05 |
| 20. GitHub Pages + PWA | v1.1 | 1/1 | Complete | 2026-03-05 |
| 21. Compliance + Integration Testing | v1.1 | 1/1 | Complete | 2026-03-05 |
| 22. Main Menu Restructure | v1.2 | 1/1 | Complete | 2026-03-05 |
| 23. Settings & Controls Cleanup | v1.2 | 2/2 | Complete | 2026-03-06 |
| 24. AI Difficulty Randomization | v1.2 | 1/1 | Complete | 2026-03-06 |
| 25. Multiplayer Screen Rework | v1.2 | 1/1 | Complete | 2026-03-06 |
| 26. How to Play Content Refresh | v1.2 | 1/1 | Complete | 2026-03-06 |
| 27. Player Identity & Seat Model | v1.3 | 2/2 | Complete | 2026-03-07 |
| 28. AFK Autopilot & Escalation | v1.3 | 2/2 | Complete | 2026-03-07 |
| 29. Disconnect Handoff | v1.3 | 1/1 | Complete | 2026-03-08 |
| 30. Mid-Game Join Flow | v1.3 | 4/4 | Complete | 2026-03-09 |
| 31. Host Migration & Room Lifecycle | v1.3 | 1/2 | In progress | - |
| 32. Play Again Rework | v1.3 | 0/? | Not started | - |
| 33. Connection Polish & Edge Cases | v1.3 | 0/? | Not started | - |
| 34. Integration Testing & UAT | v1.3 | 0/? | Not started | - |

