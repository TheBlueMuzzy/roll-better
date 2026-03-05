# Roadmap: Roll Better

## Overview

Build a premium browser-based multiplayer dice-matching game from scratch. Start with a single beautiful 3D die, layer on physics and game logic, add AI opponents, then polish with mobile-specific features and audio. v1.0 delivers local AI gameplay; v1.1 adds real-time online multiplayer via Partykit.

## Domain Expertise

None (no expertise skill files available)

## Milestones

- 🚧 **v1.0 MVP** - Phases 1-13 (in progress)
- 📋 **v1.1 Online Multiplayer** - Phases 14-21 (planned)

## Phases

- [x] **Phase 1: Foundation** *(Complete — 2026-02-28)* — Scaffold Vite + React + R3F + Rapier + Zustand, basic 3D scene
- [x] **Phase 2: Premium Die** *(Complete — 2026-02-28)* — Single premium 3D die with materials, lighting, shadows
- [x] **Phase 3: Dice Rolling** *(Complete — 2026-02-28)* — Multi-dice physics rolling, settling, face detection, collision sounds
- [x] **Phase 4: Game Board Layout** *(Complete — 2026-03-01)* — Goal row, player row, dice pool, HUD, portrait responsive
- [x] **Phase 5: Core Game Logic** *(Complete — 2026-03-01)* — Goal gen, match detection, auto-lock, scoring, handicap, session state
- [x] **Phase 6: Lerp & Animation** *(Complete — 2026-03-01)* — Lock/unlock lerps, bonus spawn, score counting, round transitions
- [x] **Phase 7: Unlock Interaction** *(Complete — 2026-03-02)* — Settings panel, How to Play carousel, Tips system
- [x] **Phase 8: AI Opponents** *(Complete — 2026-03-02)* — Easy/Medium/Hard heuristics, multi-player with AI
- [x] **Phase 9: Multi-Player Display** *(Complete — 2026-03-02)* — Multiple player rows, icons, Goal indicators
- [x] **Phase 10: Screens & Flow** *(Complete — 2026-03-02)* — Main Menu, Settings, Winners Screen, transitions
- [x] **Phase 11: Mobile Polish** *(Complete — 2026-03-02)* — Shake-to-roll, haptics, touch optimization, performance
- [x] **Phase 12: Responsive UI** *(Complete — 2026-03-02)* — HUD, overlays, modals adapt to all phone sizes
- [x] **Phase 13: Audio & Juice** *(Complete — 2026-03-03)* — Audio hooks wired, procedural sounds stripped to stubs pending art pass
- [x] **Phase 14: Partykit Server Setup** *(Complete — 2026-03-03)* — Cloudflare free tier WebSocket rooms, create/join/close lifecycle
- [x] **Phase 15: Lobby UI + Room Codes** *(Complete — 2026-03-03)* — Jackbox-style 4-letter codes, player list, ready-up, AI fill
- [x] **Phase 16: State Sync Protocol** *(Complete — 2026-03-03)* — Game state → Partykit room → all clients
- [x] **Phase 17: Dice Sync + Simultaneous Play** *(Complete — 2026-03-04)* — Roll results, auto-lock, visual sync across clients
- [x] **Phase 18: Unlock + Scoring Sync** *(Complete — 2026-03-04)* — Unlock decisions, scoring, round transitions + turn timers
- [ ] **Phase 19: Connection Resilience** *(In progress — 1/3 plans done)* — Disconnect/reconnect, AI drop-in/drop-out replacement
- [ ] **Phase 20: GitHub Pages + PWA** — Deploy to public URL, installable, auto-updates
- [ ] **Phase 21: Compliance + Integration Testing** — Privacy policy, IARC, multi-device edge cases

## Phase Details

### Phase 1: Foundation
**Goal**: Working dev environment with R3F rendering a basic 3D scene, Zustand store skeleton, Rapier physics initialized
**Depends on**: Nothing (first phase)
**Research**: Unlikely (established stack, standard scaffold)
**Plans**: 2 plans

Plans:
- [x] 01-01: Scaffold Vite + React + TS + R3F + Rapier + Zustand + drei
- [x] 01-02: Basic 3D scene (camera, lighting, floor plane, test cube with physics)

### Phase 2: Premium Die
**Goal**: A single beautiful 3D die rendered with premium materials — beveled edges, clearcoat, HDRI reflections, grounding shadows
**Depends on**: Phase 1
**Research**: Likely (MeshPhysicalMaterial config, HDRI loading, dice geometry)
**Research topics**: R3F MeshPhysicalMaterial clearcoat examples, polyhaven HDRI in drei Environment, RoundedBoxGeometry vs Blender .glb for dice, pip/number rendering approach
**Plans**: 3 plans

Plans:
- [x] 02-01: Die geometry (RoundedBoxGeometry with bevel 0.07, face numbers/pips)
- [x] 02-02: Die materials (MeshPhysicalMaterial, clearcoat, HDRI environment, player color tinting)
- [x] 02-03: Scene lighting and shadows (warm spotlight, AccumulativeShadows, dark wood surface)

### Phase 3: Dice Rolling
**Goal**: Roll multiple dice with realistic physics, detect face-up results, basic collision audio
**Depends on**: Phase 2
**Research**: Likely (Rapier impulse API, face detection algorithm, collision events)
**Research topics**: @react-three/rapier RigidBody impulse/torque API, dice face-up detection via dot product of face normals, Rapier collision event callbacks for sound triggering, sleep/settle detection
**Plans**: 3 plans

Plans:
- [x] 03-01: Single die rolling physics (impulse at offset, random initial rotation, settle detection)
- [x] 03-02: Face-up detection (dot product algorithm, result reading, onResult callback)
- [x] 03-03: Boundary walls, DicePool, all-settled detection with sorted results

### Phase 4: Game Board Layout
**Goal**: Full game screen layout — Goal row at top, player row below, dice pool at bottom, score HUD, responsive portrait
**Depends on**: Phase 2 (needs Die3D component)
**Research**: Unlikely (internal layout, standard R3F + HTML overlay)
**Plans**: 3 plans

Plans:
- [x] 04-01: Goal row (8 white dice positioned horizontally, sorted display)
- [x] 04-02: Player row (8 slots aligned under Goal, player icon with score + X/Y/Z)
- [x] 04-03: Dice pool area + HUD (bottom rolling area, score display, X/Y/Z overlay, roll prompt)

### Phase 5: Core Game Logic
**Goal**: Complete rules engine — Goal generation, match detection, auto-lock logic, scoring formula, handicap, session state machine
**Depends on**: Phase 3 (needs dice results), Phase 4 (needs board layout)
**Research**: Unlikely (pure business logic, no external deps)
**Plans**: 4 plans

Plans:
- [x] 05-01: Game state machine (phase transitions: rolling → locking → winner-check → unlocking → scoring → round-end)
- [x] 05-02: Goal generation + match detection (roll 8, sort, identify which player dice match which Goal slots)
- [x] 05-03: Scoring + handicap (points formula, pool penalty, Z adjustment per round, session to 20)
- [x] 05-04: UI integration (store-driven components, phase-aware HUD, unlock flow, must-unlock/12-die-cap guards)

### Phase 6: Lerp & Animation
**Goal**: All dice movement animated with lerps — lock-in, unlock + bonus spawn, score counting, handicap pop, round transitions
**Depends on**: Phase 5 (needs game state driving animations)
**Research**: Unlikely (internal animation, standard R3F useFrame patterns)
**Plans**: 3 plans

Plans:
- [x] 06-01: Dice lock lerps (matched dice lerp from pool to player row slots, ease-in-out timing)
- [x] 06-02: Pool persistence + mitosis unlock (pool dice stay at physics positions, mitosis split animation)
- [x] 06-03: Score + round animations (point tokens lerp to score, Z scale-pop, Goal roll-in/roll-out transitions)

### Phase 7: Unlock Interaction
**Goal**: Settings panel (audio, performance, tips, quit), How to Play carousel with rules slides, contextual Tips system for new players
**Depends on**: Phase 6 (game loop complete, HUD patterns established)
**Research**: Unlikely (pure HTML/CSS UI components)
**Plans**: 3 plans

Plans:
- [x] 07-01: Settings panel + core settings (gear button, audio slider, performance toggle, tips toggle, quit game)
- [x] 07-02: How to Play carousel (swipeable slides with rules content, breadcrumb dots, placeholder visuals)
- [x] 07-03: Tips system (contextual tip banner, tip tracking, initial gameplay tips)

### Phase 8: AI Opponents
**Goal**: AI players that roll dice and make unlock decisions at Easy/Medium/Hard difficulty
**Depends on**: Phase 5 (needs game logic, unlock mechanic already implemented)
**Research**: Unlikely (internal heuristic logic)
**Plans**: 2 plans

Plans:
- [x] 08-01: AI decision engine (Easy: random, Medium: probability-weighted, Hard: optimal unlock strategy)
- [x] 08-02: AI integration (simultaneous play — AI rolls, locks, unlocks alongside human)

### Phase 9: Multi-Player Display
**Goal**: Render 2-8 player rows, other players' dice animations, Goal circle indicators
**Depends on**: Phase 8 (needs multiple players in game)
**Research**: Unlikely (extending existing layout)
**Plans**: 3 plans

Plans:
- [x] 09-01: Layout restructure + profile groups (scaled dice, shifted rows, avatar + star-score + stats)
- [x] 09-02: Goal dice transitions rework (fast rightward exit, star-origin emergence enter)
- [x] 09-03: AI lock animations (dice emerge from profile at scale 0, fly to row slots scaling up)
- [x] 09-04: AI unlock animations (dice scale down 1→0, fly arc back to profile group)
- [x] 09-05: Pool dice spawn & exit animations (pop+shrink exit, fly-from-avatar spawn)
- [x] 09-06: Goal column indicators (colored dots per locked player, split wedges for ties)

### Phase 10: Screens & Flow
**Goal**: Main Menu, Settings, Winners Screen, screen transitions — complete app flow
**Depends on**: Phase 9 (game screen complete)
**Research**: Unlikely (standard React screens)
**Plans**: 3 plans

Plans:
- [x] 10-01: Main Menu (title, Create/Join room UI placeholder, settings button, play vs AI button)
- [x] 10-02: Winners Screen (session results, player scores, round-by-round breakdown, play again)
- [x] 10-03: Screen transitions (CSS fades) + game preferences persistence + flow polish

### Phase 11: Mobile Polish
**Goal**: Shake-to-roll, per-bounce haptics, touch optimization, mobile Safari performance
**Depends on**: Phase 10 (full app flow exists)
**Research**: Likely (DeviceMotion API, Vibration API, mobile Safari quirks)
**Research topics**: DeviceMotion API permission requirements (iOS 13+ requires user gesture), Vibration API browser compatibility, mobile Safari WebGL/R3F performance optimizations, touch event handling on iOS
**Plans**: 3 plans

Plans:
- [x] 11-01: Shake-to-roll (DeviceMotion API, permission flow, shake threshold tuning)
- [x] 11-02: Haptic feedback (Vibration API per-bounce pulses, intensity decay, lock/spawn patterns)
- [x] 11-03: Mobile performance (Safari WebGL optimization, touch responsiveness, viewport/scaling)

### Phase 12: Responsive UI
**Goal**: Full responsive layout pass — HUD, overlays, modals, and floating UI adapt to all phone sizes (tested on Pixel 6, iPhone SE, large tablets). Nothing cut off, nothing misplaced.
**Depends on**: Phase 11 (mobile polish baseline established)
**Research**: Likely (safe area insets, viewport units, device-specific quirks)
**Research topics**: CSS safe-area-inset env() variables, dvh/svh viewport units, Pixel 6 / iPhone SE / notch device testing, R3F canvas scaling vs HTML overlay alignment
**Plans**: 4 plans

Plans:
- [x] 12-01: CSS custom properties foundation + HUD responsive pass
- [x] 12-02: Settings panel + How to Play carousel responsive
- [x] 12-03: Main Menu + Winners Screen responsive
- [x] 12-04: Player profile components responsive + multi-device verification checkpoint

### Phase 13: Audio & Juice
**Goal**: Multi-layered dice sounds, UI audio, final animation polish pass
**Depends on**: Phase 3 (needs physics collision events), Phase 10 (all UI exists)
**Research**: Likely (Howler.js + Rapier integration, audio layering)
**Research topics**: Howler.js setup in React, triggering sounds from Rapier collision callbacks, audio sprite layering for multi-dice rolls, Web Audio API spatial audio basics
**Plans**: 4 plans

Plans:
- [x] 13-01: Sound system foundation + dice collision sounds (Web Audio API SoundManager, onContactForce impacts, settle/chime)
- [x] 13-02: Lock & unlock animation sounds (whoosh+snap locks, mitosis rumble+pop, spawn/exit pops)
- [x] 13-03: UI & score audio (score tick counting, win fanfare, selection tones, phase transitions)
- [x] 13-04: Final juice pass + verification (procedural sounds rejected, stripped to stubs, hooks retained)

### 🚧 v1.1 Online Multiplayer (Planned)

**Milestone Goal:** Take Roll Better from local AI play to real-time online multiplayer with friends, deployed and publicly playable.

**Key architectural decision:** Client-authoritative dice — each client rolls physics locally and reports settled values to server. Server computes locks via findAutoLocks and relays results to other clients. Per-player relay (no batching). Client-side buffered reveals (results hidden until you've acted, then animated).

**Constraints:** Free tier only (Partykit/Cloudflare 100k req/day). No accounts. 4-8 players. Host-authoritative validation.

#### Phase 14: Partykit Server Setup
**Goal**: Cloudflare free tier WebSocket rooms — server project, room create/join/close lifecycle, basic message protocol
**Depends on**: v1.0 complete (Phase 13)
**Research**: Likely (new technology — Partykit/Cloudflare Workers)
**Research topics**: Partykit setup and deployment, Cloudflare Workers free tier limits, room lifecycle API, message serialization
**Plans**: 3 plans

Plans:
- [x] 14-01: Partykit project scaffold + message protocol types
- [x] 14-02: Room server implementation (player tracking, host assignment, lifecycle)
- [x] 14-03: Client connection utility + integration verification

#### Phase 15: Lobby UI + Room Codes
**Goal**: Jackbox-style 4-letter room codes, lobby screen with player list, ready-up, host start fills empty slots with AI
**Depends on**: Phase 14
**Research**: Unlikely (internal UI patterns, extends existing Main Menu)
**Plans**: 4 plans

Plans:
- [x] 15-01: Protocol extensions + server lobby logic (ready toggle, host-only game start)
- [x] 15-02: useRoom React hook + screen state integration (lobby screen routing)
- [x] 15-03: Lobby screen UI (create/join, player list, room code, ready, host controls)
- [x] 15-04: Game start flow + AI fill (initOnlineGame, lobby → game transition)

#### Phase 16: State Sync Protocol
**Goal**: Game state → Partykit room → all clients. Server-authoritative game engine. Server generates roll results, computes auto-locks, manages unlock/scoring/round lifecycle.
**Depends on**: Phase 15
**Research**: No (architecture decided — server-authoritative, shared pure functions)
**Plans**: 2 plans

Plans:
- [x] 16-01: Protocol types + server game state + roll handler
- [x] 16-02: Server unlock/scoring handlers + verification

#### Phase 17: Dice Sync + Simultaneous Play
**Goal**: Client-authoritative dice values, per-player relay (no batching), buffered reveals with animation, simultaneous play across all clients
**Depends on**: Phase 16
**Research**: Likely (client-authoritative vs server-authoritative, per-player relay, buffered reveal pattern)
**Plans**: 4 plans

Plans:
- [x] 17-01: Online infrastructure (module-level socket, online mode flags, useOnlineGame hook)
- [x] 17-02: Dice roll sync (server roll results + physics positions merge, lock animations)
- [x] 17-03: Phase + unlock sync (server-driven phases, unlock/skip to server) — superseded by 17-04
- [x] 17-04: Online roll pipeline rework (client-authoritative values, per-player relay, buffered reveals)

#### Phase 18: Unlock + Scoring Sync
**Goal**: Unlock decisions, scoring, round transitions synced across clients. Turn timers with AI takeover on timeout.
**Depends on**: Phase 17
**Research**: Unlikely (extends Phase 16-17 sync patterns)
**Plans**: 3 plans

Plans:
- [x] 18-01: Scoring + session end sync (applyOnlineScoring, applyOnlineSessionEnd)
- [x] 18-02: Round transitions (exit/enter animations, new round data, 3 bugfixes)
- [x] 18-03: Rolling AFK timer + disconnect-safe rolling phase

#### Phase 19: Connection Resilience
**Goal**: Disconnect/reconnect handling. AI seamlessly takes over for disconnected players. Player takes back control on reconnect.
**Depends on**: Phase 18
**Research**: Likely (WebSocket reconnection strategies, stateful session recovery)
**Research topics**: WebSocket reconnection patterns, Partykit connection lifecycle events, state recovery on rejoin, AI handoff protocol
**Plans**: 3 plans

Plans:
- [x] 19-01: Stable client ID + server rejoin protocol (stable sessionStorage ID, server auto-rejoin in onConnect, room keepalive grace period)
- [ ] 19-02: Client reconnection flow (useRoom preserves game state on disconnect, useOnlineGame handles rejoin_state sync)
- [ ] 19-03: Connection status UI (ConnectionBanner "Reconnecting...", disconnect/reconnect toast notifications)

#### Phase 20: GitHub Pages + PWA
**Goal**: Deploy to GitHub Pages with public URL. PWA setup for "install to home screen". Auto-updates on push.
**Depends on**: Phase 19 (full multiplayer working)
**Research**: Likely (first deployment + PWA setup)
**Research topics**: GitHub Pages SPA routing (hash vs history), Vite PWA plugin setup, service worker caching strategy, GitHub Actions CI/CD
**Plans**: TBD

Plans:
- [ ] 20-01: TBD

#### Phase 21: Compliance + Integration Testing
**Goal**: Privacy policy (no data collected), IARC age rating (13+), multi-device integration testing, edge case verification
**Depends on**: Phase 20
**Research**: Unlikely (documentation + manual testing)
**Plans**: TBD

Plans:
- [ ] 21-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → ... → 13 → 14 → ... → 21

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
| 19. Connection Resilience | v1.1 | 1/3 | In progress | - |
| 20. GitHub Pages + PWA | v1.1 | 0/? | Not started | - |
| 21. Compliance + Integration Testing | v1.1 | 0/? | Not started | - |
