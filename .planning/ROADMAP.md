# Roadmap: Roll Better

## Overview

Build a premium browser-based multiplayer dice-matching game from scratch. Start with a single beautiful 3D die, layer on physics and game logic, add AI opponents, then polish with mobile-specific features and audio. v1.0 delivers local AI gameplay; v1.1 adds real-time online multiplayer via Partykit.

## Milestones

- ✅ [v1.0 MVP](milestones/v1.0-ROADMAP.md) (Phases 1-13) — SHIPPED 2026-03-03
- ✅ [v1.1 Online Multiplayer](milestones/v1.1-ROADMAP.md) (Phases 14-21) — SHIPPED 2026-03-05
- ✅ [v1.2 Polish](milestones/v1.2-ROADMAP.md) (Phases 22-26) — SHIPPED 2026-03-06
- ✅ [v1.3 Drop-in/Drop-out](milestones/v1.3-ROADMAP.md) (Phases 27-34) — SHIPPED 2026-03-12
- ✅ **v1.4 Landscape** — Phases 35-39 + 37.1 (SHIPPED 2026-03-26)
- 🚧 **v1.5 Hold-to-Gather-Roll** — Phases 40-43 (in progress)

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

<details>
<summary>v1.3 Drop-in/Drop-out (Phases 27-34) — SHIPPED 2026-03-12</summary>

- [x] **Phase 27: Player Identity & Seat Model** *(2026-03-07)* — Persistent client ID, server seat state machine, seat-to-playerID mapping
- [x] **Phase 28: AFK Autopilot & Escalation** *(2026-03-07)* — 1-beat autopilot, consecutive counter, 2 strikes → bot promotion
- [x] **Phase 29: Disconnect Handoff** *(2026-03-08)* — Timer-based grace window replaces 60s keepalive
- [x] **Phase 30: Mid-Game Join Flow** *(2026-03-09)* — Bot seat claiming, phase-boundary takeover, first-claim-wins
- [x] **Phase 31: Host Migration & Room Lifecycle** *(2026-03-09)* — Auto host migration, room dissolution, Room Full TRY AGAIN
- [x] **Phase 32: Play Again Rework** *(2026-03-10)* — Lobby return with same room code, late auto-claim via mid-game join
- [x] **Phase 33: Connection Polish & Edge Cases** *(2026-03-10)* — Duplicate connection rejection, status UI polish
- [x] **Phase 34: Integration Testing & UAT** *(2026-03-12)* — All 7 PRD player flow scenarios verified

</details>

### ✅ v1.4 Landscape — SHIPPED 2026-03-26

**Milestone Goal:** Switch from portrait-first (9:16) to landscape-only (16:9). Every screen, the 3D scene, and all UI redesigned for phones held sideways. No portrait mode remains.

#### Phase 35: Layout Foundation

**Goal**: Flip viewport to 16:9, update PWA manifest to landscape, rework CSS design tokens and container sizing, new camera FOV for landscape aspect ratio, landscape safe-area insets setup. Canvas renders correctly in landscape.
**Depends on**: Previous milestone complete
**Research**: Unlikely (CSS + R3F camera work, internal patterns)
**Plans**: TBD

Plans:
- [x] 35-01: Flip viewport, CSS tokens, camera FOV to landscape

#### Phase 36: 3D Scene Rework

**Goal**: Redesign full 3D arena for landscape — goal row, all 8 player rows, profile icons, dice pool, spawn grid, physics walls. New coordinate system optimized for wide-not-tall layout.
**Depends on**: Phase 35 (viewport and camera must be landscape first)
**Research**: Unlikely (repositioning existing R3F components)
**Plans**: TBD

Plans:
- [x] 36-01: Arena dimensions, physics walls, scene layout & goal row
- [x] 36-02: Player rows, dice pool & animation positions (left/right split layout)

#### Phase 37: Game HUD Redesign

**Goal**: Rework all HUD elements for landscape — round counter, status text, roll/unlock buttons, settings gear, seat notifications, touch targets for sideways grip.
**Depends on**: Phase 36 (3D scene positioned, HUD overlays on top)
**Research**: Unlikely (CSS repositioning)
**Plans**: TBD

Plans:
- [x] 37-01: HUD layout & touch targets for landscape
- [x] 37-02: Tip banner & unlock button repositioning

#### Phase 37.1: 3D Profile Elements (INSERTED)

**Goal**: Convert HTML profile overlays (avatars, stars, scores, stats) to 3D scene elements using drei/Text + meshes. Eliminates viewport-dependent scaling issues where HTML overlays don't scale with the 3D camera.
**Depends on**: Phase 37 (HUD positioned for landscape), Phase 36 (left/right split layout)
**Research**: Unlikely (drei/Text + basic geometry, established patterns)
**Plans**: TBD

Plans:
- [x] 37.1-01: Convert GoalProfileGroup to 3D meshes + Text
- [x] 37.1-02: Convert PlayerProfileGroup to 3D meshes + Text

#### Phase 38: Menu & Screens

**Goal**: Redesign MainMenu, Settings, HowToPlay carousel, and WinnersScreen for landscape proportions. All overlays and modals work in 16:9.
**Depends on**: Phase 35 (viewport foundation)
**Research**: Unlikely (CSS layout work)
**Plans**: TBD

Plans:
- [x] 38-01: MainMenu layout for landscape
- [x] 38-02: Settings, HowToPlay, WinnersScreen modals for landscape

#### Phase 39: Cleanup & UAT

**Goal**: Strip all portrait-specific code (9:16 container, portrait media queries, FOV branching). No portrait fallbacks remain. Full UAT — every screen, every online flow, landscape-only.
**Depends on**: Phases 35-38 (all landscape layouts complete)
**Research**: Unlikely (code removal + testing)
**Plans**: TBD

Plans:
- [x] 39-01: Final cleanup & UAT

### 🚧 v1.5 Hold-to-Gather-Roll — In Progress

**Milestone Goal:** Replace tap-to-roll with a hold-to-gather-roll gesture. Touch in rolling area generates orbiting goal points that attract dice via physics forces. Release drops dice with momentum for a natural, tactile roll feel.

#### Phase 40: Touch Detection & Goal System

**Goal**: Detect touch/hold in rolling area (excluding UI buttons), generate radial goal points around touch position, implement vacuum VFX (outline circle scaling to touch point). Goal points follow finger movement.
**Depends on**: v1.4 complete (landscape layout)
**Research**: Unlikely (R3F pointer events + Three.js geometry, established patterns)
**Plans**: TBD

Plans:
- [ ] 40-01: TBD

#### Phase 41: Physics Attractor & Orbit

**Goal**: Apply per-frame Rapier impulse forces attracting dice toward their assigned goal points. Goals orbit the touch point with rotation speed ramping over 3 seconds. Dice lift off table and follow goals with physics lag.
**Depends on**: Phase 40 (touch + goals exist)
**Research**: Unlikely (Rapier impulse API already used for dice)
**Plans**: TBD

Plans:
- [x] 41-01: Attractor force system + orbital tracking + tuning

#### Phase 42: Release & Roll Mechanics

**Goal**: On release, remove attractor forces and let dice keep momentum. Add rotational impulse for tumble. Handle AFK timer integration (forced release on timeout, fake touch for auto-roll). Exclude settings button from touch area.
**Depends on**: Phase 41 (attractor system working)
**Research**: Unlikely (internal physics patterns)
**Plans**: TBD

Plans:
- [ ] 42-01: TBD

#### Phase 43: Polish & UAT

**Goal**: Edge cases (wall containment when dragging to lock area, dice against boundaries), feel tuning (attractor strength, orbit speed curve, release force), full integration testing across viewports.
**Depends on**: Phases 40-42 (all mechanics complete)
**Research**: Unlikely (tuning + testing)
**Plans**: TBD

Plans:
- [ ] 43-01: TBD

## Progress

**v1.0 + v1.1 + v1.2 + v1.3 + v1.4 complete.** 40 phases (incl. 37.1), 100+ plans shipped.

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
| 31. Host Migration & Room Lifecycle | v1.3 | 2/2 | Complete | 2026-03-09 |
| 32. Play Again Rework | v1.3 | 3/3 | Complete | 2026-03-10 |
| 33. Connection Polish & Edge Cases | v1.3 | 2/2 | Complete | 2026-03-10 |
| 34. Integration Testing & UAT | v1.3 | 5/5 | Complete | 2026-03-12 |
| 35. Layout Foundation | v1.4 | 1/1 | Complete | 2026-03-12 |
| 36. 3D Scene Rework | v1.4 | 2/2 | Complete | 2026-03-25 |
| 37. Game HUD Redesign | v1.4 | 2/2 | Complete | 2026-03-25 |
| 38. Menu & Screens | v1.4 | 2/2 | Complete | 2026-03-26 |
| 39. Cleanup & UAT | v1.4 | 1/1 | Complete | 2026-03-26 |
| 40. Touch Detection & Goals | v1.5 | 1/1 | Complete | 2026-03-26 |
| 41. Physics Attractor & Orbit | v1.5 | 1/1 | Complete | 2026-03-27 |
| 42. Release & Roll Mechanics | v1.5 | 0/? | Not started | - |
| 43. Polish & UAT | v1.5 | 0/? | Not started | - |

