# Roadmap: Roll Better

## Overview

Build a premium browser-based multiplayer dice-matching game from scratch. Start with a single beautiful 3D die, layer on physics and game logic, add AI opponents, then polish with mobile-specific features and audio. v1.0 delivers local AI gameplay; v1.1 adds real-time online multiplayer via Partykit.

## Milestones

- ✅ [v1.0 MVP](milestones/v1.0-ROADMAP.md) (Phases 1-13) — SHIPPED 2026-03-03
- ✅ [v1.1 Online Multiplayer](milestones/v1.1-ROADMAP.md) (Phases 14-21) — SHIPPED 2026-03-05
- 🚧 **v1.2 Polish** — Phases 22-26 (in progress)

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

### v1.2 Polish (In Progress)

**Milestone Goal:** Clean up UI/UX rough edges — simplify menus, fix control issues, rework multiplayer screen flow.

#### Phase 22: Main Menu Restructure

**Goal**: Simplify main menu — remove unused selectors, add Upgrades section, relocate How to Play
**Depends on**: Previous milestone complete
**Research**: Unlikely (internal UI patterns)
**Plans**: TBD

Plans:
- [x] 22-01: Simplify main menu (remove difficulty, add How to Play + Upgrades)

#### Phase 23: Settings & Controls Cleanup

**Goal**: Move settings to gear icon (bottom-right), fix audio slider, remove shake-to-roll, clean up Settings panel
**Depends on**: Phase 22
**Research**: Unlikely (internal UI patterns)
**Plans**: 2

Plans:
- [x] 23-01: Remove shake-to-roll and clean up Settings (remove H2P from settings)
- [x] 23-02: Settings gear icon on main menu + audio slider fix + verification

#### Phase 24: AI Difficulty Randomization

**Goal**: Remove manual difficulty selection, randomly assign Easy/Medium/Hard per AI at room fill time
**Depends on**: Phase 23
**Research**: Unlikely (internal logic)
**Plans**: TBD

Plans:
- [x] 24-01: Randomize AI difficulty assignment per bot

#### Phase 25: Multiplayer Screen Rework

**Goal**: Redesign Play > Multiplayer flow and screen layout
**Depends on**: Phase 24
**Research**: Unlikely (needs design discussion on what the rework looks like)
**Plans**: TBD

Plans:
- [x] 25-01: Merge LobbyScreen into MainMenu with inline Create/Join flows

#### Phase 26: How to Play Content Refresh

**Goal**: Update How to Play slides to reflect all v1.2 changes (removed features, new UI layout)
**Depends on**: Phase 25
**Research**: Unlikely (content update)
**Plans**: TBD

Plans:
- [ ] 26-01: TBD

## Progress

**v1.0 + v1.1 complete.** 21 phases, 63 plans shipped. v1.2 in progress.

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
| 26. How to Play Content Refresh | v1.2 | 0/? | Not started | - |
