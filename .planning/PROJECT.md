# Roll Better

## What This Is

A browser-based multiplayer dice-matching game where 2-8 players race to match a shared Goal by locking in rolls. Play online with friends via room codes or locally against AI. The push-your-luck pool mechanic — grow your dice pool to match faster, but every extra die tanks your score — creates core tension between speed and efficiency. Premium 3D dice with physics rolling in a mobile-first PWA, deployed at thebluemuzzy.github.io/roll-better/.

## Core Value

The dice roll IS the product. Every design decision serves the moment of the roll — 3D physics, satisfying animations, dramatic reveals, and social spectacle. "That roll was INSANE!" is the target feeling.

## Requirements

### Validated

- 3D die rendering with premium materials (MeshPhysicalMaterial, clearcoat, HDRI reflections, beveled edges) — v1.0
- Rapier physics for realistic dice tumbling with face-up result detection — v1.0
- Goal generation (roll 8, sort ascending, display at top) — v1.0
- Auto-lock matching dice to Goal slots with lerp animations — v1.0
- Unlock phase: tap locked dice to return them + bonus die spawn — v1.0
- Winner check after each lock phase — v1.0
- Scoring: 8 pts max, -2 per die in pool beyond 8 — v1.0
- Handicap system: win -1 die, lose +1 die (every round, floor 1, ceiling 12) — v1.0
- Session to 20 points, multi-winner support — v1.0
- Game board layout: Goal row, player rows, dice pool area (portrait, mobile-first) — v1.0
- AI opponents (Easy/Medium/Hard heuristics, same RNG as players) — v1.0
- Main Menu, Settings, Winners Screen with transitions — v1.0
- Dark wood rolling surface with bumpers — v1.0
- AccumulativeShadows + warm lighting + HDRI environment — v1.0
- Online multiplayer via PartyKit WebSockets — v1.1
- Jackbox-style 4-letter room codes with lobby and ready-up — v1.1
- Client-authoritative dice with server validation — v1.1
- Disconnect/reconnect with AI takeover and state recovery — v1.1
- GitHub Pages deployment with PWA (installable, auto-updates) — v1.1
- Privacy policy (zero data collection) — v1.1
- Simplified main menu with grouped secondary actions — v1.2
- Settings gear icon with audio slider visible fill — v1.2
- Randomized AI difficulty per bot (no manual selection) — v1.2
- Inline Create/Join online flow (merged lobby into main menu) — v1.2

### Active

(None — all current requirements shipped. Next milestone TBD.)

### Out of Scope

- Shake-to-roll (removed in v1.2 — unreliable, not core to experience)
- Mouse-based dice rolling on PC (future)
- Drag-to-unlock interaction (future)
- Hold-to-gather-roll (future)
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

**Current state:** v1.2 shipped (2026-03-06). 9,134 LOC TypeScript/CSS (net reduction from code cleanup). Publicly playable at thebluemuzzy.github.io/roll-better/. PWA installable. Online multiplayer working on free Cloudflare tier.

**Tech stack:** React 18 / TypeScript / Vite / R3F / @react-three/rapier / @react-three/drei / Zustand / Web Audio API / PartyKit / vite-plugin-pwa

**Target audience:** Casual/mobile gamers — Wordle, Yahtzee, board game players. Quick sessions, zero friction (no account, just a room code).

**Player personas:** "Lunch Break Lisa" (socializer, 5-min sessions), "Optimization Oscar" (achiever, theorycrafts pool management), "Weekend Dad Wayne" (explorer, plays with kids on iPad).

**Design principles:** Dice are the star. Simple rules, deep decisions. Social by default. Fair forever. Catch-up built in. Zero friction. Juice everything.

**Known technical debt:**
- Procedural audio stubs (hooks wired, sounds stripped pending art pass)
- PWA icons are placeholders
- randomDifficulty() duplicated between client and server (PartyKit bundle limitation)

## Constraints

- **Tech Stack**: React 18+ / TypeScript / Vite / R3F / @react-three/rapier / @react-three/drei / Zustand / PartyKit
- **Platform**: Web browser (mobile-first portrait, desktop centered portrait), PWA
- **R3F Rule**: Never use React state for per-frame updates — mutate refs in useFrame
- **Physics**: Pure physics determines dice results (dot product face detection, no fake RNG)
- **Rendering**: MeshPhysicalMaterial + clearcoat + HDRI mandatory for premium dice quality
- **Performance**: Must run smoothly on mobile Safari (iPhone) and Chrome Android
- **Cost**: Free tier only (Cloudflare/PartyKit 100k req/day)
- **Privacy**: Zero data collection, no accounts, no tracking

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Auto-lock then choose to unlock | Cleaner UX — matches snap to slots, player decides what to return | Good |
| -2 per die beyond 8 (not -1) | Sharper penalty makes pool growth costly, creates real tension | Good |
| Handicap every round (not per session) | Keeps games competitive throughout, prevents runaway leaders | Good |
| Rapier over Cannon.js | Rust/WASM performance, modern API, better suited for R3F | Good |
| MeshPhysicalMaterial over MeshStandardMaterial | Premium visual quality (clearcoat, transmission) worth the per-pixel cost | Good |
| Portrait mobile-first layout | Target audience plays on phones during breaks | Good |
| Zustand over Context/Redux | Native R3F integration, avoids re-render overhead for game state | Good |
| Client-authoritative dice | Each client rolls physics locally, reports values — preserves dice feel | Good |
| Per-player relay (no batching) | Results arrive as each player finishes — no waiting for slowest | Good |
| Buffered reveals | Other players' results hidden until you've acted — maintains drama | Good |
| sessionStorage for client ID | Unique per tab (PartyKit requirement), auto-clears on close | Good |
| 60s keepalive grace period | Balances reconnection window vs server resource cleanup | Good |
| Snapshot sync on phase changes | Full state on every transition — self-healing, no desync accumulation | Good |
| Static HTML privacy page | Crawlable, no JS required — better for compliance | Good |
| Remove shake-to-roll | Unreliable on many devices, not core to experience | Good |
| Randomize AI difficulty per bot | Removes unnecessary player choice, more varied games | Good |
| Merge lobby into main menu | Single screen reduces navigation, inline flow feels smoother | Good |
| 4-state machine for online flow | Clean state management: idle/creating/joining/joined | Good |
| HTP covers mechanics only | Mode selection isn't gameplay instruction | Good |

---
*Last updated: 2026-03-06 after v1.2 milestone*
