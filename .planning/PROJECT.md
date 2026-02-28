# Roll Better

## What This Is

A browser-based multiplayer dice-matching game where 2-8 players race to match a shared Goal by locking in rolls. The push-your-luck pool mechanic — grow your dice pool to match faster, but every extra die tanks your score — creates a core tension between speed and efficiency. Premium 3D dice with physics rolling in a mobile-first web app.

## Core Value

The dice roll IS the product. Every design decision serves the moment of the roll — 3D physics, satisfying animations, dramatic reveals, and social spectacle. "That roll was INSANE!" is the target feeling.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] 3D die rendering with premium materials (MeshPhysicalMaterial, clearcoat, HDRI reflections, beveled edges)
- [ ] Rapier physics for realistic dice tumbling with face-up result detection
- [ ] Goal generation (roll 8, sort ascending, display at top)
- [ ] Auto-lock matching dice to Goal slots with lerp animations
- [ ] Optional lock skip (player can choose not to lock a match)
- [ ] Unlock phase: drag/tap locked dice to return them + bonus die spawn from Goal
- [ ] Winner check after each lock phase
- [ ] Scoring: 8 pts max, -2 per die in pool beyond 8
- [ ] Handicap system: win → -1 starting die, lose → +1 (every round, floor 1, ceiling 12)
- [ ] Session to 20 points, multi-winner support
- [ ] Game board layout: Goal row, player rows, dice pool area (portrait, mobile-first)
- [ ] Player icons with score + X/Y/Z display
- [ ] Goal dice colored circle indicators (who's leading per column)
- [ ] Other players' dice lerp from icon to slots
- [ ] AI opponents (Easy/Medium/Hard heuristics, same RNG as players)
- [ ] Shake-to-roll on mobile (accelerometer), click-to-roll on desktop
- [ ] Scoring animation (locked dice → pool, Goal → point tokens → score display)
- [ ] Handicap Z animation (scale pop)
- [ ] Round transitions (old Goal rolls away, new Goal rolls in)
- [ ] "Roll Better" prompt animation
- [ ] Main Menu screen
- [ ] Settings screen (tap vs drag, AI difficulty)
- [ ] Winners Screen (session results, stats)
- [ ] Dark wood rolling surface with bumpers
- [ ] AccumulativeShadows + warm lighting + HDRI environment
- [ ] Multi-layered dice audio (impact, tumble, scrape, settle)
- [ ] Per-bounce haptic feedback on mobile

### Out of Scope

- Online multiplayer (Phase 2 — after core loop is proven fun with AI)
- Room codes / lobby system (Phase 2)
- WebSocket server / state sync (Phase 2)
- Mouse-based dice rolling on PC (future)
- Daily challenge mode (future)
- Shareable result cards / social media (future)
- Spectator mode (future)
- Custom dice skins / cosmetics (future)
- Tournament mode (future)
- Friends list / rematch (future)
- Replay system (future)
- Landscape support (future)
- Monetization of any kind (fair forever principle)

## Context

**Target audience:** Casual/mobile gamers — Wordle, Yahtzee, board game players. Quick sessions, zero friction (no account, just a room code).

**Player personas:** "Lunch Break Lisa" (socializer, 5-min sessions), "Optimization Oscar" (achiever, theorycrafts pool management), "Weekend Dad Wayne" (explorer, plays with kids on iPad).

**Design principles:** Dice are the star. Simple rules, deep decisions. Social by default. Fair forever. Catch-up built in. Zero friction. Juice everything.

**Competitive gap:** No existing game combines dice-matching + online multiplayer + browser-native + premium 3D. Balatro proved "modify your luck" is mainstream but has no multiplayer. Dice Throne Digital (2026) is closest competitor but requires downloads and has fixed dice.

**Dice visual target:** Beat True Dice Roller (Steam, 96% positive) and Mighty Dice in a browser. MeshPhysicalMaterial with clearcoat, edge bevel 0.07, HDRI environment reflections, AccumulativeShadows, collision-triggered layered audio, per-bounce haptics.

**Source:** Auto-generated from `.planning/PRD.md` (Double Diamond complete)

## Constraints

- **Tech Stack**: React 18+ / TypeScript / Vite / R3F / @react-three/rapier / @react-three/drei / Zustand / Howler.js
- **Platform**: Web browser (mobile-first portrait, desktop centered portrait)
- **R3F Rule**: Never use React state for per-frame updates — mutate refs in useFrame
- **Physics**: Pure physics determines dice results (dot product face detection, no fake RNG)
- **Rendering**: MeshPhysicalMaterial + clearcoat + HDRI mandatory for premium dice quality
- **Performance**: Must run smoothly on mobile Safari (iPhone) and Chrome Android

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Auto-lock then choose to unlock | Cleaner UX — matches snap to slots, player decides what to return | — Pending |
| -2 per die beyond 8 (not -1) | Sharper penalty makes pool growth costly, creates real tension | — Pending |
| Handicap every round (not per session) | Keeps games competitive throughout, prevents runaway leaders | — Pending |
| Rapier over Cannon.js | Rust/WASM performance, modern API, better suited for R3F | — Pending |
| MeshPhysicalMaterial over MeshStandardMaterial | Premium visual quality (clearcoat, transmission) worth the per-pixel cost | — Pending |
| Phase 1 local AI, Phase 2 online | Prove the core loop is fun before adding networking complexity | — Pending |
| Portrait mobile-first layout | Target audience plays on phones during breaks | — Pending |
| Zustand over Context/Redux | Native R3F integration, avoids re-render overhead for game state | — Pending |

---
*Last updated: 2026-02-28 after PRD bridge (auto-generated from Double Diamond)*
