# Roadmap: Roll Better

## Overview

Build a premium browser-based multiplayer dice-matching game from scratch. Start with a single beautiful 3D die, layer on physics and game logic, add AI opponents, then polish with mobile-specific features and audio. Phase 1 delivers local AI gameplay; online multiplayer is a future milestone.

## Domain Expertise

None (no expertise skill files available)

## Phases

- [x] **Phase 1: Foundation** *(Complete — 2026-02-28)* — Scaffold Vite + React + R3F + Rapier + Zustand, basic 3D scene
- [x] **Phase 2: Premium Die** *(Complete — 2026-02-28)* — Single premium 3D die with materials, lighting, shadows
- [x] **Phase 3: Dice Rolling** *(Complete — 2026-02-28)* — Multi-dice physics rolling, settling, face detection, collision sounds
- [x] **Phase 4: Game Board Layout** *(Complete — 2026-03-01)* — Goal row, player row, dice pool, HUD, portrait responsive
- [x] **Phase 5: Core Game Logic** *(Complete — 2026-03-01)* — Goal gen, match detection, auto-lock, scoring, handicap, session state
- [x] **Phase 6: Lerp & Animation** *(Complete — 2026-03-01)* — Lock/unlock lerps, bonus spawn, score counting, round transitions
- [x] **Phase 7: Unlock Interaction** *(Complete — 2026-03-02)* — Settings panel, How to Play carousel, Tips system
- [x] **Phase 8: AI Opponents** *(Complete — 2026-03-02)* — Easy/Medium/Hard heuristics, multi-player with AI
- [ ] **Phase 9: Multi-Player Display** *(In progress)* — Multiple player rows, icons, Goal indicators
- [ ] **Phase 10: Screens & Flow** — Main Menu, Settings, Winners Screen, transitions
- [ ] **Phase 11: Mobile Polish** — Shake-to-roll, haptics, touch optimization, performance
- [ ] **Phase 12: Audio & Juice** — Layered dice sounds, UI audio, final animation polish

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
- [ ] 09-02: Other players' dice animations (dice lerp from player icon to their row slots)
- [ ] 09-03: Goal circle indicators (colored circles under Goal dice showing who leads, wedge splits for ties)

### Phase 10: Screens & Flow
**Goal**: Main Menu, Settings, Winners Screen, screen transitions — complete app flow
**Depends on**: Phase 9 (game screen complete)
**Research**: Unlikely (standard React screens)
**Plans**: 3 plans

Plans:
- [ ] 10-01: Main Menu (title, Create/Join room UI placeholder, settings button, play vs AI button)
- [ ] 10-02: Winners Screen (session results, player scores, round-by-round breakdown, play again)
- [ ] 10-03: Settings screen (tap vs drag unlock, AI difficulty, player count) + screen transitions

### Phase 11: Mobile Polish
**Goal**: Shake-to-roll, per-bounce haptics, touch optimization, mobile Safari performance
**Depends on**: Phase 10 (full app flow exists)
**Research**: Likely (DeviceMotion API, Vibration API, mobile Safari quirks)
**Research topics**: DeviceMotion API permission requirements (iOS 13+ requires user gesture), Vibration API browser compatibility, mobile Safari WebGL/R3F performance optimizations, touch event handling on iOS
**Plans**: 3 plans

Plans:
- [ ] 11-01: Shake-to-roll (DeviceMotion API, permission flow, shake threshold tuning)
- [ ] 11-02: Haptic feedback (Vibration API per-bounce pulses, intensity decay, lock/spawn patterns)
- [ ] 11-03: Mobile performance (Safari WebGL optimization, touch responsiveness, viewport/scaling)

### Phase 12: Audio & Juice
**Goal**: Multi-layered dice sounds, UI audio, final animation polish pass
**Depends on**: Phase 3 (needs physics collision events), Phase 10 (all UI exists)
**Research**: Likely (Howler.js + Rapier integration, audio layering)
**Research topics**: Howler.js setup in React, triggering sounds from Rapier collision callbacks, audio sprite layering for multi-dice rolls, Web Audio API spatial audio basics
**Plans**: 3 plans

Plans:
- [ ] 12-01: Dice roll sounds (Howler.js setup, collision-triggered impacts, tumble/scrape/settle layers)
- [ ] 12-02: UI sounds (lock click, bonus chime, score counting tones, win fanfare, round-end tone)
- [ ] 12-03: Final juice pass (animation timing polish, roll prompt glow, visual effects tuning)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 1. Foundation | 2/2 | Complete | 2026-02-28 |
| 2. Premium Die | 3/3 | Complete | 2026-02-28 |
| 3. Dice Rolling | 3/3 | Complete | 2026-02-28 |
| 4. Game Board Layout | 3/3 | Complete | 2026-03-01 |
| 5. Core Game Logic | 4/4 | Complete | 2026-03-01 |
| 6. Lerp & Animation | 3/3 | Complete | 2026-03-01 |
| 7. Unlock Interaction | 3/3 | Complete | 2026-03-02 |
| 8. AI Opponents | 2/2 | Complete | 2026-03-02 |
| 9. Multi-Player Display | 1/6 | In progress | - |
| 10. Screens & Flow | 0/3 | Not started | - |
| 11. Mobile Polish | 0/3 | Not started | - |
| 12. Audio & Juice | 0/3 | Not started | - |
