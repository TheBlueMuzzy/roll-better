# Roll Better — Product Requirements Document

> Living document. Updated each design phase.
> Current phase: **Discover** (with early Design capture from Muzzy's notes)
> Full rules reference: `.planning/research/core-rules.md`

---

## 1. Vision & Goals

- **Elevator pitch**: A browser-based multiplayer dice-matching game where you race to match a shared Goal by locking in rolls, with a push-your-luck pool mechanic — grow your dice pool to match faster, but every extra die tanks your score.
- **Target feeling**: "That roll was INSANE!" — thrilling, lucky, social spectacle. The dopamine of watching your dice land exactly where you need them.
- **Platform**: Web (React + TypeScript + Vite + Three.js/R3F)
- **Players**: 2–8 per session
- **Target audience**: Casual/mobile gamers who play Wordle, Yahtzee, and board games with friends — people who want quick, thrilling multiplayer rounds without downloading an app.

---

## 2. Audience & Player Personas

### Persona: "Lunch Break Lisa"
- **Age/background**: 38, marketing coordinator, busy mom of two
- **Motivation (Bartle type)**: Socializer / Achiever
- **Play habits**: 2-3 sessions/day, 5-15 min each, iPhone + work laptop browser
- **What she wants**: Quick rounds (<5 min), play with friends via room codes, screenshotable "look what I rolled!" moments, gentle progression, no studying required

### Persona: "Optimization Oscar"
- **Age/background**: 27, data analyst, Reddit/Discord active, evening gamer
- **Motivation (Bartle type)**: Achiever / Explorer
- **Play habits**: 1-2 sessions/day, 30-60+ min, desktop browser
- **What he wants**: Skill > luck over many games, strategic unlock timing, emergent decisions from Goal composition, deep enough to theorycraft pool management

### Persona: "Weekend Dad Wayne"
- **Age/background**: 45, high school teacher, plays board games with his kids
- **Motivation (Bartle type)**: Explorer / Socializer
- **Play habits**: 2-3x/week, 15-30 min, iPad + laptop browser
- **What he wants**: "Aha!" moment in first game, rules his 12-year-old gets in 2 min, no account wall (just share a room code link), satisfying 3D dice feel on screen

### Competitive Landscape

| Game | Core Loop | Art Style | What Works | What's Missing |
|------|-----------|-----------|------------|----------------|
| Dice Forge | Buy & snap dice faces, roll for resources, buy heroic feats | Vibrant mythological | Physical face-swapping is satisfying; everyone rolls every turn | Limited to 2-4 players; slow face-swap decisions |
| Balatro | Play poker hands, buy Jokers that modify scoring | Retro pixel/synthwave | "Modify your luck" fantasy; explosive number escalation | No multiplayer (most requested feature) |
| Slice & Dice | Roll hero dice, assign abilities vs enemies | Minimalist pixel | Dice faces ARE abilities; 100+ classes; incredible depth | No multiplayer; overwhelming for casuals |
| Yahtzee with Buddies | Classic Yahtzee, async PvP | Polished casual mobile | Async multiplayer works; universally known rules | Aggressive P2W monetization; no depth beyond Yahtzee |
| King of Tokyo | Yahtzee-style + territory control + power cards | Bold cartoony kaiju | Push-your-luck social drama; dice spectacle | Player elimination; limited strategy |
| Dice Throne | Asymmetric hero dice + combat cards | Animated fantasy/comic | Character identity; dice mitigation through cards | Physical only (digital coming 2026); fixed dice |
| Knucklebones | Place dice in grid, matching multiplies, destroys opponent's | Clean minimal (fan-made) | Learn in 30 sec; meaningful choices; spawned fan sites | No progression; no meta-game; unpolished |
| Random Dice | Merge dice-towers, defend lanes PvP | Clean mobile | Quick PvP matches; merge is satisfying | Gacha unlocking; P2W at high ranks |

### Genre Opportunity Map
- **Saturated**: MONOPOLY GO/Coin Master slot-machine-as-dice (~80% genre revenue), pure Yahtzee clones, single-player roguelike deckbuilders (post-Balatro flood)
- **Underserved**: Multiplayer dice-matching in browser (zero competitors), casual competitive non-puzzle browser games, push-your-luck pool management as multiplayer mechanic
- **Emerging**: Browser games resurgence ($9B by 2030), "Balatro effect" legitimizing luck manipulation, daily ritual cadence (Wordle model), cozy competitive tone

### Inspiration & References
- **Mechanical references**: Balatro (modify-your-luck fantasy), Dice Forge (dice as objects you invest in), King of Tokyo (social spectacle of shared rolls), Knucklebones (simple rules, fast rounds, browser-native), Wordle (daily ritual + shareable results)
- **Aesthetic references**: Warm tactile 3D dice + clean vector UI. Balatro's warmth meets Wordle's clarity. Bold readable dice at any screen size.
- **Anti-references**: MONOPOLY GO (predatory monetization), Yahtzee with Buddies (P2W destroys trust), overly complex dice games (max 2-3 choices per turn), games without social sharing hooks

---

## 3. Design Principles

1. **The dice are the star.** Everything serves the moment of the roll. 3D physics, satisfying animations, dramatic reveals. The roll IS the product.
2. **Simple rules, deep decisions.** Learn in 2 minutes, theorycraft for hours. The only decision each turn is what to unlock — but that decision has layers.
3. **Social by default.** Every roll is a performance. Other players see your results. The audience makes the dice thrilling.
4. **Fair forever.** No pay-to-win, no "rigged" dice. Monetize cosmetics if anything. Trust is the product.
5. **Catch-up is built in.** The handicap system means no one gets left behind. Losing makes you stronger next round.
6. **Zero friction.** No account required. Share a 4-letter room code. Click and play. Mobile-first, desktop-friendly.
7. **Juice everything.** Every interaction gets feedback — lerps, pops, spawns, sounds. The game should feel alive.

---

## 4. Core Gameplay

### 4.1 Session Structure
- A **session** = a series of **rounds** played until 1+ players reach **20 points**
- Players who cross 20 on the same round all win
- 2–8 players per session
- AI fills remaining slots when host starts early

### 4.2 Round Setup
1. **Goal Generation**: Roll 8 standard six-sided dice. Sort by number ascending.
   - Example Goal: [1, 1, 2, 3, 3, 3, 5, 6]
   - Goal dice are white and positioned horizontally at the top of the screen
   - Goal dice roll across the screen with 3D physics, then lerp to their sorted positions
2. **Pool Reset**: Each player's dice pool resets to their current **starting dice count** (Z value)
   - Default starting count: 2
   - Modified by handicap each round (see 4.6)
   - Range: 1–12

### 4.3 Turn Flow (simultaneous, all players)
Each turn has these phases, executed simultaneously for all players:

**Phase 1 — Roll**
- "Roll Better" prompt appears on screen
- Mobile: shake phone to roll
- PC: click roll button (mouse-based rolling planned for future)
- 3D dice roll with physics across the entire screen, except the Goal row area
- Dice tumble, bounce, and settle naturally

**Phase 2 — Auto-Lock**
- After dice settle, the game identifies which rolled dice match Goal numbers
- Matching dice are eligible to lock. Each matching die automatically lerps to its corresponding slot under the Goal die it matches
- **Lock-in limit**: Up to the Goal's count per number. If the Goal has three 3s, you can lock at most three 3s.
- **Optional skip**: Player may choose NOT to lock a matching die. It stays in the rolling pool. (Implementation: tap a locking die mid-lerp to cancel? Or a brief confirmation window? TBD — needs UX testing.)
- Non-matching dice lerp back to the dice pool at the bottom of the screen

**Phase 3 — Winner Check**
- After all players' dice have settled into locked/pool positions
- Check: does any player have exactly 8 locked dice that match the Goal?
- If YES → proceed to **Scoring** (4.5), then start a new round
- If NO → proceed to Phase 4

**Phase 4 — Unlock Phase**
- Message appears: "Drag dice to unlock" (or "Tap dice to unlock" if tap mode enabled)
- Player may drag any number of their locked dice down to the bottom area
- For each die unlocked:
  1. The locked die lerps from its slot back to the player's dice pool
  2. A **bonus die** (in the player's color) lerps FROM the Goal die it was under TO the player's dice pool
  3. Visual effect: looks like the Goal die is "spawning" a new die of your color
- If using tap mode: locked die lerps to pool, then bonus die lerps to pool sequentially
- Player's pool size increases by 1 for each die unlocked (returned die + 1 bonus = net +1 to pool)
- Player may also choose to unlock zero dice (keep all locked)

**Phase 5 — Next Turn**
- Return to Phase 1 with updated pool/locked state
- Repeat until a winner is found

### 4.4 Turn Timing
- All players roll simultaneously
- All players see each other's results after everyone's dice settle
- **Unlock phase timer**: Countdown timer on unlock decisions. When timer expires, AI makes the unlock decision for that player for that single action — player retains control next turn.
- The pace should feel brisk — no waiting for slow players

### 4.5 Scoring
When 1+ players lock all 8 dice matching the Goal:

**Points calculation:**
- Base: **8 points**
- Penalty: **-2 points per die in pool beyond 8**
- Formula: `points = max(0, 8 - 2 * (poolSize - 8))`

| Pool Size | Points |
|-----------|--------|
| 8         | 8 (perfect) |
| 9         | 6 |
| 10        | 4 |
| 11        | 2 |
| 12        | 0 |

- All players who complete the Goal on the same turn score
- Players who did NOT complete the Goal score 0 for that round

**Scoring animation:**
1. Winning player(s)' locked dice lerp from their slots back to the player's dice pool
2. Goal dice lerp "point tokens" toward the winning player(s)' score display
3. Score counter counts up: +1 per token, capped at the player's actual points for that round
4. Non-winning players see their locked dice simply return to pool (no points)

### 4.6 Handicap System (between rounds)
Applied after every round:

- **Won** this round (locked all 8) → starting dice count (Z) **decreases by 1** (minimum 1)
- **Failed** this round (didn't complete) → starting dice count (Z) **increases by 1** (maximum 12)
- Z value in HUD does a **scale pop animation** and increments/decrements
- Next round: pool resets to new Z value

### 4.7 Session End
- When 1+ players have **20 or more total points**, the session ends
- All players who crossed 20 on the final round are declared winners
- Transition to **Winners Screen**

### 4.8 Edge Cases
- **All Goal dice are the same number** (e.g., eight 3s): Rare but valid. Players only need to roll 3s. Still plays normally.
- **Player has pool of 1**: They roll 1 die. If it doesn't match anything unlocked, they have 0 locked and 1 in pool. If they unlock a locked die, pool grows to 2. Starting from 1 is hard but not impossible.
- **Player has pool of 12 and wins**: They score 0 points (8 - 2*(12-8) = 0). They still "won" the round, so their Z decreases by 1. A hollow victory.
- **Multiple players hit 20+ on same round**: All are winners. The Winners Screen shows all of them.
- **Player disconnects mid-round**: AI seamlessly takes over for disconnected player (game continues without pause). On reconnect, player takes back control from AI immediately. No data lost — Partykit maintains room state.

---

## 5. Game Systems

### 5.1 Multiplayer Architecture
- **Phase 1**: AI opponents only (local game logic, AI makes unlock decisions)
- **Phase 2**: Room-based online multiplayer via room codes

**Room Codes:**
- Format: 4-letter alphanumeric code (case-insensitive, e.g., `KFBR`)
- ~1.6M possible codes — more than enough for concurrent rooms
- Unique per active room, recycled when room closes
- Zero friction: no accounts, no downloads — just enter a code

**Room Flow (Jackbox-style):**
1. **Create**: Host taps "Create Room" → Partykit room created → 4-letter code displayed prominently
2. **Join**: Player enters code on main screen → taps "Join" → enters room lobby
3. **Lobby**: Player list with names/colors, "Ready" button per player, host sees "Start" button
4. **Start conditions**: Everyone clicks Ready OR host clicks "Start" (fills empty slots with AI)
5. **AI backfill**: Remaining slots filled with AI at configured difficulty (4-8 players total)

### 5.2 AI Opponents (Phase 1 — local)
- AI makes unlock decisions based on simple heuristics:
  - **Easy AI**: Randomly unlocks 0-2 dice per turn. No strategy.
  - **Medium AI**: Unlocks dice that are hardest to re-roll (faces with fewer Goal matches). Balances pool growth vs. progress.
  - **Hard AI**: Calculates optimal unlock strategy based on probability of completing the Goal from current state. Tries to minimize pool size.
- AI "rolls" use the same RNG as players — no cheating, no rigged dice.
- AI difficulty selectable in settings (default: Medium)

### 5.3 Networking (v1.1 — Partykit on Cloudflare)
- **Protocol**: WebSocket via Partykit (Cloudflare free tier — 100k requests/day)
- **Server**: Partykit room server (Cloudflare Workers edge runtime)
  - Host-authoritative game state validation (anti-cheat, Glyphtender pattern)
  - Server generates roll RESULTS (random numbers) — clients animate dice visually
  - Broadcasts state updates to all connected clients
  - Manages turn timing / unlock phase timer + AI takeover on timeout
  - Handles room lifecycle (create, join, close, cleanup)
- **Client**: Sends roll requests, unlock decisions. Receives authoritative state + roll results.
- **Reconnection**: Player can rejoin with same room code. AI surrenders control back to player on reconnect.
- **Latency tolerance**: Simultaneous turn-based action — latency up to 500ms is acceptable. Visual lerps mask network delay.
- **No accounts**: Anonymous play only. Persistent identity deferred to future milestone.

### 5.4 State Management
Core game state (managed in a global store — Zustand recommended for R3F):

```
GameState {
  phase: 'lobby' | 'rolling' | 'locking' | 'winner-check' | 'unlocking' | 'scoring' | 'round-end' | 'session-end'
  round: number
  goal: number[8]              // The 8 Goal dice values, sorted

  players: Player[] {
    id: string
    name: string
    color: string              // Hex color, randomly assigned
    isAI: boolean
    isHost: boolean
    pool: number[]             // Dice values currently in rolling pool
    locked: (number | null)[8] // 8 slots, null if empty, die value if locked
    poolSize: number           // Total dice available (pool + locked)
    startingDice: number       // Z value — starting count this round
    score: number              // Total points across all rounds this session
    isReady: boolean           // Lobby ready state
  }

  roomCode: string | null
  maxPlayers: number           // 2-8, default 8
  winThreshold: number         // Default 20
}
```

---

## 6. Art & Audio Direction

### 6.1 Screen Layout

**All screens are portrait-oriented (mobile-first).** Desktop uses centered portrait layout with background fill.

#### Game Screen (Play Area) — top to bottom:

**A. Goal Row (top ~15% of screen)**
- 8 white dice in a horizontal row, sorted by number ascending
- Dice are 3D rendered, resting face-up showing their value
- Below each Goal die: a **colored circle indicator** showing which player has the most dice locked in that column
  - 1 player leading: solid circle in their color
  - 2-way tie: circle split into 2 colors (half and half)
  - 3-way tie: 3 equal wedges (120° each)
  - N-way tie: N equal wedges
  - No one locked: gray/empty circle
- Goal dice have a subtle glow or pedestal to distinguish from player dice

**B. Player Rows (middle ~50% of screen)**
- **Your row** is always the topmost player row (closest to Goal)
- Other players' rows below yours, ordered by score (highest first) or join order (TBD)
- Each row:
  - **Left side**: Player icon (avatar/color swatch)
    - Center of icon: current **total score** (large, readable)
    - Bottom of icon: **X/Y/Z** in small text
      - X = current pool size
      - Y = max pool (12)
      - Z = starting dice count this round
  - **Right side**: 8 dice slots in a horizontal row, aligned with the Goal dice above
    - Empty slots: subtle outline or shadow
    - Locked dice: 3D dice in player's color, face-up showing value
    - When another player locks dice: dice lerp FROM their player icon INTO their row slots

**C. Dice Pool & Rolling Area (bottom ~35% of screen)**
- Your unlocked dice sit here
- This is also where 3D dice physics rolling happens
- Dice roll across the full screen except the Goal row, then settle and lerp to positions:
  - Matching dice → lerp up to your row slots (auto-lock)
  - Non-matching dice → lerp back down to pool area
- **HUD overlay (lower-left corner)**:
  - Score (your total points, large)
  - X / Y / Z display below score
- **Roll prompt**: "Roll Better" text appears center of rolling area when it's time to roll

### 6.2 Visual Style — Premium 3D Dice
> Full visual research: `.planning/research/dice-visuals.md`
> Target quality: Beat True Dice Roller (Steam, 96% positive) and Mighty Dice in a browser.

**Dice Geometry:**
- High-segment RoundedBoxGeometry OR Blender-modeled .glb export
- **Edge bevel radius: 0.07** relative to die size — essential for realism (sharp edges look CG)
- Pips/numbers: sculpted into geometry (cosine impulse function for pips) OR UV-mapped high-contrast textures
- Numbers must be readable at small screen sizes (mobile) — high contrast, clean font

**Dice Materials (MeshPhysicalMaterial):**
- Goal dice (white): metalness 0, roughness 0.35, clearcoat 1.0, clearcoatRoughness 0.1 — polished plastic look
- Player dice (colored): same material properties, tinted per player. Colors from a curated colorblind-friendly palette.
- Environment map is **mandatory** — reflections sell the material. Use HDRI via drei `<Environment preset="studio" />`
- Optional normal map for subtle surface texture (micro-scratches, slight grain)

**Lighting:**
- HDRI environment map for global illumination and reflections (polyhaven.com source)
- Primary warm spotlight (~0xefdfd5, intensity 0.7) for main shadows
- Ambient fill light
- Camera-attached point light for consistent specular highlights as dice move

**Shadows:**
- AccumulativeShadows + RandomizedLight from drei (soft, realistic, performant)
- Shadow opacity: 0.15-0.3 — subtle grounding, not dark blobs
- Shadows ground the dice to the surface and sell the 3D illusion

**Rolling Surface:**
- Dark wood table aesthetic (medium restitution, warm feel, shows shadows well)
- Subtle texture — not perfectly flat, but not distracting
- Slightly raised edges/bumpers to contain dice (like a physical dice tray)

**Player Colors:**
- Randomly assigned from a curated palette of 8 distinct, colorblind-friendly colors
- Goal dice: always white (clean, neutral, authoritative)
- Player dice should look like painted/colored versions of the same premium material

**Background:**
- Clean, dark, uncluttered. Subtle vignette at edges.
- The dice and the game board are the ONLY visual focus. No decorative elements.

**Typography:**
- Clean sans-serif (Inter, Manrope, or similar)
- Scores: large, high-contrast, readable at a glance
- X/Y/Z: small but legible
- "Roll Better" prompt: bold, centered, slightly animated (pulse or glow)

**Animations (all lerped):**
- Goal dice: roll across screen with 3D physics → lerp to sorted positions (ease-out)
- Player dice: roll with physics → settle → lerp to lock slots (ease-out, ~400ms) or pool (ease-in-out, ~300ms)
- Unlock: die lerps from slot → pool (ease-in-out, ~300ms). Bonus die spawns from Goal die with slight delay → lerps to pool (ease-out, ~400ms)
- Score: point tokens lerp from Goal → player score display (staggered, ~150ms apart), counter counts up with ascending tone
- Handicap: Z value scale-pops (1.0 → 1.3 → 1.0, ease-out-back, ~400ms) and changes
- Round transition: old Goal dice roll off-screen, brief pause, new Goal dice roll in from top
- Other players' locks: dice lerp from their player icon → their row slots (shows other players' progress live)

**The Anticipation-Resolution Arc (per roll):**
1. Intention (0ms): "Roll Better" prompt visible
2. Anticipation (0-300ms): Shake/click, gathering energy
3. Release (300ms): Dice launch with max energy
4. Chaos (300-2000ms): Bouncing, spinning, colliding — pure physics
5. Settling (2000-2500ms): Energy dissipating, faces becoming readable — tension builds
6. Resolution (2500-3000ms): Final faces visible, auto-lock lerps begin
7. Reaction (3000ms+): Lock animation, score update, unlock decision

### 6.3 Input

**Mobile (primary):**
- **Roll**: Shake phone. Device accelerometer detects shake gesture. "Roll Better" prompt pulses when ready.
- **Unlock**: Drag locked dice downward to the pool area. Release to confirm. OR tap (if tap mode enabled in Settings).
- **Skip lock**: TBD — possibly tap a locking die mid-animation to cancel, or a brief "skip" button appears during auto-lock phase.

**Desktop:**
- **Roll**: Click a "Roll" button in the rolling area. (Future: mouse-drag-and-release for physics throw — Muzzy has ideas to share later.)
- **Unlock**: Click locked dice to return them. Or drag.
- **Skip lock**: Same as mobile TBD.

### 6.4 Audio Direction
> Industry standard (True Dice Roller): hand-recorded sounds per material. Users notice and complain when sound doesn't match material.

**Dice Roll Sounds (multi-layered per roll):**
1. **Initial impact**: first hit on wood surface — sharp, satisfying clack
2. **Tumbling/rattling**: bouncing and spinning, hitting other dice — staccato clatter
3. **Scraping**: sliding as momentum dies — subtle friction sound
4. **Settling click**: final tip onto resting face — tiny, definitive snap

Trigger sounds on physics collision callbacks. Each bounce plays a progressively quieter impact. Pitch varies slightly per die to avoid repetition.

**UI Sounds:**
- Lock-in: satisfying click/snap (like a puzzle piece)
- Bonus die spawn: bright ascending chime
- Score counting: ascending tones per point (+1, +1, +1...)
- Win fanfare: triumphant but brief
- Round end (no win): softer resolution tone
- "Roll Better" prompt: subtle whoosh or pulse

**Haptic Feedback (mobile):**
- Per-bounce haptic pulses (10-30ms) via Vibration API — synced to physics collisions
- Decrease intensity as dice lose energy
- Final settle: one subtle pulse
- Lock-in: short firm buzz
- Bonus spawn: double-tap pattern
- Industry standard set by Mighty Dice app

**Sound Implementation:**
- Howler.js or Web Audio API
- Trigger on Rapier collision events
- Layer multiple simultaneous sounds for multi-dice rolls

---

## 7. Technical Architecture

### 7.1 Tech Stack
- **Framework**: React 18+ with TypeScript
- **Build**: Vite
- **3D Rendering**: Three.js via React Three Fiber (R3F)
- **3D Helpers**: @react-three/drei (Environment maps, AccumulativeShadows, RandomizedLight, camera controls)
- **Physics**: @react-three/rapier (Rust/WASM via Rapier — high performance)
- **Post-Processing**: @react-three/postprocessing (selective bloom for special effects)
- **Dice Materials**: MeshPhysicalMaterial with clearcoat, HDRI environment maps from polyhaven
- **State Management**: Zustand (works natively with R3F, avoids React re-renders for game state)
- **Audio**: Howler.js (collision-triggered layered sounds)
- **Networking (v1.1)**: Partykit WebSocket client (Cloudflare free tier)
- **Server (v1.1)**: Partykit room server on Cloudflare Workers (edge runtime, no Node.js server needed)
- **Deployment**: GitHub Pages (static hosting) + Vite PWA plugin (installable, offline-capable)

### 7.2 Project Structure
```
src/
├── main.tsx                    # App entry point
├── App.tsx                     # Router / screen management
├── stores/
│   └── gameStore.ts            # Zustand store — all game state
├── screens/
│   ├── MainMenu.tsx            # Title, Create/Join room, settings
│   ├── Lobby.tsx               # Room lobby — players, ready, start
│   ├── GameScreen.tsx          # The play area — 3D canvas + HUD
│   └── WinnersScreen.tsx       # End-of-session stats and results
├── components/
│   ├── game/
│   │   ├── GoalRow.tsx         # 8 Goal dice + colored indicators
│   │   ├── PlayerRow.tsx       # One player's 8 slots + icon
│   │   ├── DicePool.tsx        # Bottom area — pool dice + rolling
│   │   ├── Die3D.tsx           # Single 3D die component
│   │   ├── ScoreHUD.tsx        # X/Y/Z display + score
│   │   └── RollPrompt.tsx      # "Roll Better" prompt
│   ├── lobby/
│   │   ├── RoomCode.tsx        # Display / input room code
│   │   └── PlayerList.tsx      # Lobby player list + ready states
│   └── ui/
│       ├── Button.tsx
│       └── Settings.tsx        # Settings panel
├── systems/
│   ├── dicePhysics.ts          # Rapier physics setup for dice rolling
│   ├── gameLogic.ts            # Core rules engine (Goal gen, matching, scoring, handicap)
│   ├── aiPlayer.ts             # AI decision making (Easy/Medium/Hard)
│   └── animations.ts           # Lerp utilities, easing functions
├── hooks/
│   ├── useShakeToRoll.ts       # Mobile accelerometer detection
│   ├── useDiceLerp.ts          # Animated dice movement
│   └── useGamePhase.ts         # Phase state machine
├── utils/
│   ├── colors.ts               # Player color palette (colorblind-friendly)
│   ├── roomCode.ts             # Generate / validate ##X## codes
│   └── constants.ts            # Magic numbers — pool limits, scoring, thresholds
└── types/
    └── game.ts                 # TypeScript types for game state
```

### 7.3 Key Technical Decisions
- **R3F Golden Rule**: NEVER use React state for per-frame updates. Mutate refs in useFrame. All dice physics, lerps, and animations run in useFrame loops, not React re-renders.
- **Physics**: Rapier for realistic 3D dice tumbling. Dice are rigid bodies with correct mass/inertia for realistic rolls. Physics runs in the bottom rolling area; locked dice are kinematic (not affected by physics).
- **Dice values**: Read from physics simulation — the face pointing up after the die settles determines the rolled value. Use dot product of each face normal against the up vector to determine which face is up. No fake random numbers; the physics determines the outcome visually and mechanically.
- **Server-authoritative rolls (v1.1)**: Server generates actual roll results (random numbers). Clients receive results and animate dice physics visually to land on those numbers. No physics sync needed — avoids the impossible problem of syncing physics across clients while maintaining anti-cheat.
- **Animation system**: Central lerp manager handles all dice movement. Queue-based to sequence animations (e.g., lock dice → THEN check winner → THEN show unlock prompt). Use easing functions for polish (ease-out for locks, ease-in-out for spawns).
- **Initial roll force**: Apply impulse at an OFFSET point (not center of mass) to induce natural rotation. Add random initial angular velocity per die for variety.

**Physics starting values (tune during M1):**

| Parameter | Value | Notes |
|-----------|-------|-------|
| Gravity | [0, -50, 0] | Faster than real (real = -9.81). Adjust up/down for feel. |
| Mass | 1 | Standard for d6 |
| Restitution | 0.3 | Wood surface. Felt = 0.15, stone = 0.5 |
| Friction | 0.6 | Controls rolling vs sliding |
| Angular damping | 0.3 | How fast spin dies. Lower = longer spins. |
| Sleep threshold | 0.1s | Die must be below velocity for this long to "settle" |
| Edge bevel | 0.07 | Ratio to die size. Critical for visual quality. |

### 7.4 v1.0 vs v1.1 Boundary
**v1.0 MVP (local, AI opponents):**
- All game logic runs client-side in the browser
- AI opponents use same game logic
- No server, no networking
- Room code UI exists but is non-functional (placeholder)
- Goal: prove the core loop is fun

**v1.1 Online Multiplayer (Partykit):**
- Partykit room server on Cloudflare handles room creation, state sync, roll validation
- Host-authoritative: server validates moves before broadcasting
- Server generates roll results — clients animate physics visually
- Room codes become functional (4-letter Jackbox-style)
- AI backfill for incomplete rooms + AI drop-in/drop-out on disconnect
- Turn timers with AI takeover on timeout
- Reconnection with seamless AI handoff
- GitHub Pages deployment + PWA for "install to home screen"
- Privacy policy + IARC age rating (13+, no data collected)

---

## 8. Milestones

### M0: Project Setup
- React + Vite + TypeScript + R3F + Rapier scaffolded
- Basic 3D scene rendering
- Zustand store skeleton
- Dev server running

### M1: Core Dice
- 3D die model rendering (proper cube with face numbers)
- Dice physics — roll a die and read the result from the face-up side
- Single die: click to roll, watch it tumble, read the value
- Die lerp animation — smooth movement from A to B

### M2: Game Board Layout
- Goal row (8 dice, sorted, horizontal at top)
- Player row (8 slots aligned under Goal)
- Dice pool area at bottom
- Score HUD (X/Y/Z + points)
- Responsive portrait layout (mobile-first)

### M3: Core Game Loop (single player vs 1 AI)
- Goal generation (roll 8, sort)
- Roll your dice, auto-lock matching dice to slots
- Winner check after locking
- Unlock phase (drag dice to return + bonus die spawn)
- Scoring with pool penalty
- Handicap between rounds
- Session to 20 points
- Basic AI opponent (Medium difficulty)

### M4: Multi-Player (local, multiple AI)
- 2-8 players (1 human + AI)
- Multiple player rows rendered
- Other players' dice lerp from icon to slots
- Player icons with score + X/Y/Z
- Goal circle indicators (color wedges for leading player)
- AI difficulty setting

### M5: Polish & Juice
- Roll prompt ("Roll Better")
- Shake-to-roll on mobile
- All lerp animations tuned (easing, timing)
- Score counting animation
- Handicap Z animation (scale pop)
- Goal dice roll-in animation
- Round transition animation
- Basic sound effects (if time)

### M6: Screens & Flow
- Main Menu screen
- Settings screen (tap vs drag unlock, AI difficulty)
- Winners Screen (session results, stats)
- Screen transitions

### M7: Online Multiplayer (v1.1 — Partykit)
- Partykit room server on Cloudflare free tier
- Room creation / join with 4-letter Jackbox-style codes
- Lobby screen (player list with names/colors, ready-up, host start, AI fill)
- Host-authoritative state sync (server generates roll results, clients animate)
- Dice sync + simultaneous play across clients
- Turn timers with AI takeover on timeout
- AI drop-in/drop-out (disconnect → AI takes over, reconnect → player resumes)
- Connection resilience + reconnection handling

### M8: Deployment & Compliance
- GitHub Pages deployment (static hosting, auto-updates on push)
- PWA setup (installable, offline-capable, service worker caching)
- Privacy policy (no data collected)
- IARC age rating (13+, sidesteps COPPA)
- Multi-device integration testing

---

## 9. Testing Strategy

### Manual Testing (every milestone)
- Play a full session (to 20 points) against AI
- Verify: scoring math is correct at every pool size
- Verify: handicap adjusts correctly every round
- Verify: Goal generation produces valid sorted dice
- Verify: lock-in limits are enforced (can't lock more than Goal count)
- Verify: bonus dice spawn correctly on unlock
- Verify: session ends at 20 points, correct winners shown

### Automated Tests
- `gameLogic.ts`: Unit tests for Goal generation, match checking, scoring formula, handicap
- `roomCode.ts`: Unit tests for code generation/validation
- `aiPlayer.ts`: Unit tests for AI unlock decisions

### Device Testing
- Chrome desktop (primary dev)
- Safari iOS (iPhone) — shake-to-roll, touch interactions
- Chrome Android — shake-to-roll, touch interactions
- iPad Safari — larger touch targets, landscape consideration

---

## 10. Known Issues & Bugs
None yet.

---

## 11. Future Ideas
- Mouse-based dice rolling on PC (drag-and-release physics throw)
- Daily challenge mode (same Goal for all players globally, Wordle-style leaderboard)
- Shareable result cards for social media (Wordle-style grid showing round-by-round performance)
- Spectator mode
- Custom dice colors / skins (cosmetic unlocks, potential monetization)
- Sound design: full audio pass with spatial 3D audio for dice
- Tournament mode (bracket of sessions)
- Friends list / rematch
- Replay system (watch dramatic rolls again)
- Haptic feedback on mobile for rolls, locks, wins
- "Skip lock" UX: best way to let players choose not to auto-lock a match
- Async/turn-based mode for Lisa-type players who want play-by-play pacing
- Landscape support for tablets/desktop

---

## 12. Glossary
- **Goal**: The 8 white dice at the top of the screen that all players race to match
- **Lock / Lock-in**: Placing a matching die in its slot under the Goal die
- **Unlock / Return**: Dragging a locked die back to your pool, which spawns a +1 bonus die
- **Dice pool**: Your available dice at the bottom of the screen, ready to roll
- **Pool size**: Total dice you have (pool + locked). Determines scoring penalty.
- **Starting dice (Z)**: How many dice you begin each round with, modified by handicap
- **Handicap**: Win a round → -1 starting die. Lose → +1 starting die. Applied every round.
- **Session**: A series of rounds played until someone reaches 20 points
- **Round**: One Goal, rolled repeatedly until someone locks all 8
- **Turn**: One roll cycle within a round (roll → lock → check → unlock → repeat)
- **Room code**: 4-letter alphanumeric code (e.g., KFBR) used to join an online game — Jackbox-style, zero friction
- **AI takeover**: When a player disconnects or times out on unlock, AI seamlessly controls their dice until they reconnect
- **Partykit**: WebSocket room server running on Cloudflare's free tier edge network
- **PWA**: Progressive Web App — installable to home screen, works offline
- **AI backfill**: AI opponents that fill empty player slots when the host starts early
