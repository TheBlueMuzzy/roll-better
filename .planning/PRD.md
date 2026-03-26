# Roll Better — Product Requirements Document

> Living document. Updated each design phase.
> Current status: **v1.2 — Three milestones shipped (MVP + Online Multiplayer + Polish)**
> Full rules reference: `.planning/research/core-rules.md`

---

## 1. Vision & Goals

- **Elevator pitch**: A browser-based multiplayer dice-matching game where you race to match a shared Goal by locking in rolls, with a push-your-luck pool mechanic — grow your dice pool to match faster, but every extra die tanks your score.
- **Target feeling**: "That roll was INSANE!" — thrilling, lucky, social spectacle. The dopamine of watching your dice land exactly where you need them.
- **Platform**: Web (React + TypeScript + Vite + Three.js/R3F)
- **Players**: 2–4 per session (offline), 2–8 per session (online, AI backfill)
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
- **Offline**: 2–4 players (1 human + AI), selectable from main menu
- **Online**: 2–8 players (humans + AI backfill when host starts)
- AI fills remaining slots when host starts early

### 4.2 Round Setup
1. **Goal Generation**: Roll 8 standard six-sided dice. Sort by number ascending.
   - Example Goal: [1, 1, 2, 3, 3, 3, 5, 6]
   - Goal dice are white and positioned horizontally at the top of the screen
   - Goal dice emerge from the star icon with a scale-up + tumble animation, then lerp to their sorted positions
2. **Pool Reset**: Each player's dice pool resets to their current **starting dice count** (Z value)
   - Default starting count: 2
   - Modified by handicap each round (see 4.6)
   - Range: 1–12

### 4.3 Turn Flow (simultaneous, all players)
Each turn has these phases, executed simultaneously for all players:

**Phase 1 — Roll (`idle` → `rolling`)**
- "ROLL BETTER" status text appears in the HUD
- Tap/click the ROLL button in the HUD (or tap the status text area)
- 3D dice roll with physics in the rolling area (bottom portion of screen)
- Dice tumble, bounce off invisible walls, and settle naturally
- **AFK timer**: 20-second countdown appears if the player hasn't rolled. When it expires, the game auto-rolls for them.

**Phase 2 — Auto-Lock (`rolling` → `locking`)**
- After all dice settle, the game runs `findAutoLocks()` to identify which rolled dice match unfilled Goal slots
- Matching dice automatically lerp from their settled positions to the corresponding Goal slots (staggered ~100ms apart, ~400ms each)
- **Lock-in limit**: Up to the Goal's count per number. If the Goal has three 3s, you can lock at most three 3s.
- Auto-locking is fully automatic — there is no way to skip or cancel a lock
- Non-matching dice remain in the pool (a scale-down exit animation plays, then they respawn at pool positions for the next roll)

**Phase 3 — Winner Check (during `locking`)**
- After lock animations complete, check: does any player have all 8 slots locked?
- If YES → proceed to **Scoring** (4.5), then start a new round
- If NO → proceed to Phase 4

**Phase 4 — Unlock Phase (`unlocking`)**
- Status text shows "TAP DICE TO UNLOCK"
- Player taps locked dice in their row to toggle selection (selected dice show a pulsing ring)
- HUD shows "UNLOCK X" button (where X = number selected) or "SKIP" button
- For each die unlocked, a **mitosis animation** plays:
  1. The locked die in its slot splits into 2 dice (the original + a bonus die)
  2. Both dice arc-lerp from the slot position down to the pool area (~1.7s total)
  3. Net effect: locked -= 1, pool += 2 (net +1 total dice)
- **Must-unlock rule**: If pool size is 0 and locked < 8, the player MUST unlock at least 1 die (can't roll with 0 dice)
- **Pool cap**: Total dice (pool + locked) cannot exceed 12. Unlock buttons show "MAX 12 DICE" when at cap.
- Player may also skip (unlock zero dice) if they have dice in their pool
- **AFK timer**: 20-second countdown on unlock decisions. When it expires, AI makes the decision automatically for that turn only.

**Phase 5 — Next Turn (`idle`)**
- Return to Phase 1 with updated pool/locked state
- Repeat until a winner is found

### 4.4 Turn Timing
- All players roll simultaneously — each taps on their own screen when ready
- Each player sees their OWN results immediately. Other players' results are hidden until you've rolled and locked in, then revealed with animation (see §5.3.1 for full data flow)
- Same pattern for unlocking: your choice applies immediately, others' choices revealed only after you've acted
- **Rolling AFK timer**: 20-second countdown. When it expires, auto-roll triggers. Client-driven with server-side fallback.
- **Unlock phase timer**: 20-second countdown. When it expires, AI makes the unlock decision for that player for that single action — player retains control next turn.
- The pace should feel brisk — no waiting for slow players

### 4.5 Scoring
When 1+ players lock all 8 dice matching the Goal:

**Points calculation:**
- Base: **8 points**
- Penalty: per-die penalties for remaining pool dice: `[1, 0, 1, 1]`
- Formula: `points = max(0, 8 - sum(penalties[0..remainingPool-1]))`
- Remaining pool = dice NOT locked (total dice - 8 locked). Max remaining pool is 4 (since total cap is 12).

| Remaining Pool | Cumulative Penalty | Points |
|----------------|-------------------|--------|
| 0              | 0                 | 8 (perfect) |
| 1              | 1                 | 7 |
| 2              | 1                 | 7 |
| 3              | 2                 | 6 |
| 4              | 3                 | 5 |

**Strategic note:** Winning with 5 points while opponents get 0 is still a strong play. Early rounds favor aiming for 8 (perfect locks). As the session progresses, players who are behind benefit from aggressive unlocking — more dice means faster wins even at lower scores. The core tension: a fast sloppy win (5 pts) beats a slow perfect attempt that never completes (0 pts).

- All players who complete the Goal on the same turn score
- Players who did NOT complete the Goal score 0 for that round

**Scoring animation:**
1. Score counter in HUD counts up from old score to new score with cubic ease-out (1500ms)
2. Each tick plays an ascending tone; completion plays a fanfare
3. Score display does a scale-pop (1→1.15→1) on completion

### 4.6 Handicap System (between rounds)
Applied after every round:

- **Won** this round (locked all 8) → starting dice count (Z) **decreases by 1** (minimum 1)
- **Failed** this round (didn't complete) → starting dice count (Z) **increases by 1** (maximum 12)
- Next round: pool resets to new Z value

### 4.7 Session End
- When 1+ players have **20 or more total points**, the session ends
- All players who crossed 20 on the final round are declared winners
- Transition to **Winners Screen** showing final rankings (sorted by score descending)
- **Play Again**: Returns to game with same player count + difficulty (offline) or restarts with bots filling empty slots (online)
- **Back to Menu**: Returns to main menu

### 4.8 Edge Cases
- **All Goal dice are the same number** (e.g., eight 3s): Rare but valid. Players only need to roll 3s. Still plays normally.
- **Player has pool of 1**: They roll 1 die. If it doesn't match anything unlocked, they have 0 locked and 1 in pool. If they unlock a locked die, pool grows to 2. Starting from 1 is hard but not impossible.
- **Player has 0 pool dice and < 8 locked**: Must-unlock rule forces at least 1 unlock before next roll.
- **Player at 12 total dice and wins**: They score 5 points (8 - 3 penalty for 4 remaining pool). Their Z still decreases by 1. Functional but low-scoring.
- **Multiple players hit 20+ on same round**: All are winners. The Winners Screen shows all of them.
- **Player disconnects mid-round (online)**: AI seamlessly takes over for disconnected player (game continues without pause). On reconnect, player takes back control from AI immediately. No data lost — PartyKit maintains room state.
- **Host exits to menu, remaining player hits Play Again (online)**: Game restarts with bots filling all empty slots. Works correctly.

---

## 5. Game Systems

### 5.1 Multiplayer Architecture
Both modes are fully implemented:
- **Offline**: AI opponents only (local game logic, AI makes unlock decisions). Selectable from main menu with player count (2–4). AI difficulty is randomized per bot.
- **Online**: Room-based multiplayer via PartyKit WebSocket server with room codes. Create/Join flow is inline on the main menu (no separate lobby screen).

**Room Codes:**
- Format: 4-letter alphabetic code (excludes I and O for readability, e.g., `QRPD`)
- Case-insensitive
- Unique per active room, recycled when room closes
- Zero friction: no accounts, no downloads — just enter a code

**Room Flow (Jackbox-style):**
1. **Create**: Host taps "CREATE ROOM" → PartyKit room created → 4-letter code displayed prominently
2. **Join**: Player enters code on lobby screen → taps "JOIN" → enters room lobby
3. **Lobby**: Player list with names/colors, "READY" toggle per player, host sees "START GAME" button
4. **Start conditions**: Host clicks "START GAME" (host can configure target player count and AI difficulty)
5. **AI backfill**: Remaining slots filled with AI at configured difficulty

### 5.2 AI Opponents
AI makes unlock decisions based on difficulty-specific strategies. AI "rolls" use the same physics RNG as players — no cheating, no rigged dice.

- **Easy AI**: 40% chance to skip unlock entirely (unless must-unlock rule applies). When unlocking, picks 1 random locked die.
- **Medium AI**: Skips if pool size ≥ half of remaining slots needed (unless must-unlock). Scores each locked die by how frequently its value appears in remaining Goal slots. Unlocks 1–2 of the worst candidates (least useful to keep). Respects 12-die cap.
- **Hard AI**: Never unlocks if ≤2 remaining slots (unless must-unlock). Calculates expected match rate: `poolSize × (uniqueRemainingValues / 6) / remainingSlots`. Only unlocks if match rate < 0.5 (pool is inefficient). Unlocks by ascending frequency (sacrifices dice least likely to re-match), simulating one-at-a-time until match rate ≥ 0.5.

AI difficulty is randomly assigned per bot (Easy, Medium, or Hard). There is no user-facing difficulty selector.

### 5.3 Networking (PartyKit on Cloudflare)
- **Protocol**: WebSocket via PartyKit (Cloudflare free tier)
- **Server**: PartyKit room server (Cloudflare Workers edge runtime)
  - Validates moves and computes locks (runs `findAutoLocks` on reported values)
  - Relays each player's results to other players as they arrive (no batching)
  - Manages phase transitions (advances phase when all players have acted)
  - Manages AFK timers + AI takeover on timeout (both rolling and unlock phases)
  - Handles room lifecycle (create, join, close, cleanup)
- **Client**: Rolls physics dice locally, sends settled values to server. Receives other players' results from server. Applies own results locally without waiting for server response.
- **Reconnection**: Player can rejoin with same room code. AI surrenders control back to player on reconnect.
- **Latency tolerance**: Simultaneous turn-based action — latency up to 500ms is acceptable. Visual lerps mask network delay.
- **No accounts**: Anonymous play only. Persistent identity deferred to future milestone.

#### 5.3.1 Online Data Flow — Rolling Phase
The online experience must feel identical to local play. The server is invisible plumbing — same animations, same timing, same player agency. Each player controls their own game.

**Per-player flow (no batching, no waiting for others):**
1. Player taps to roll → physics dice tumble and settle on their screen (identical to offline)
2. Client reads face values from physics → applies own locks locally and immediately (same code path as offline — player sees their locks animate without any server round-trip)
3. Client sends settled values to server in parallel: `{type: "roll_result", values: [3, 1]}`
4. Server receives values → runs `findAutoLocks` → sends that player's lock result to all OTHER clients (not back to sender — sender already applied locally)
5. Other clients receive the lock result:
   - If the receiving player has NOT yet rolled → **buffer the result silently**. Show nothing. The player is still looking at "Tap to Roll."
   - If the receiving player HAS already rolled and locked in → **reveal immediately with animation** (profile-emerge pattern: dice scale from 0→1 and fly from profile icon to row slots)
6. When all players have rolled and locked → server sends `phase_change: "unlocking"`

**Reveal timing (client-side buffering):**
- You never see another player's locks until your own lock animation has completed
- After your locks finish animating, all buffered results from players who rolled before you are revealed at once (each animated)
- Players who roll after you — their results appear immediately as they arrive (each animated)
- Last player to roll sees everyone else's locks reveal in a burst after their own locks animate

#### 5.3.2 Online Data Flow — Unlocking Phase
Same pattern as rolling — each player's choice flows independently through the server.

1. Player selects locked dice and taps UNLOCK (or taps SKIP) → client applies own unlock locally and immediately (same code path as offline)
2. Client sends choice to server: `{type: "unlock_request", slotIndices: [2]}` or `{type: "skip_unlock"}`
3. Server validates → sends result to all OTHER clients
4. Other clients receive the result:
   - If the receiving player has NOT yet chosen → **buffer silently**
   - If the receiving player HAS already chosen → **reveal immediately with animation**
5. When all players have responded → server sends `phase_change: "idle"` → next roll cycle

#### 5.3.3 Deferred Snapshot Application
When the server sends a `phase_change` while animations are still playing on the client:
- The client **captures** the player snapshot from the message
- **Defers** applying the phase transition and snapshot until all animations complete
- Polls every 100ms: when animations clear, applies the snapshot + phase change
- Safety timeout: force-applies after 5 seconds to prevent permanent stalls
- **Why**: Applying a snapshot mid-animation can change pool sizes, causing extra dice to spawn or disappear

#### 5.3.4 Watchdog & Phase Sync
A heartbeat runs every 1 second to detect stalls:
- If the game has been in a transient phase (`locking`, `scoring`, `roundEnd`) for >5 seconds, the client requests a `phase_sync_request` from the server
- Server responds with `phase_sync: { phase, players, goalValues }` — authoritative state
- If client phase ≠ server phase: force-sync, clear all animations
- After 3 consecutive stalls: force to `idle` (self-healing)

#### 5.3.5 Design Principles for Online Play
- **The local experience is the source of truth.** Online is an invisible layer on top. If you turned off the network, each player's own experience would look identical to offline.
- **No player waits for any other player to act.** You tap, your dice roll, your locks animate. You never see a loading spinner or "waiting for other players" during your own actions.
- **Information is private until you've acted.** You don't see what others rolled/locked/unlocked until you've done the same. This prevents influence and preserves the feeling of playing your own game.
- **Every reveal is animated.** "Immediately" means "with the standard animation" (profile-emerge for locks, appropriate animation for unlocks). Nothing pops into position.

### 5.4 State Management
Core game state managed in Zustand (`src/store/gameStore.ts`):

```
GameState {
  // Navigation
  screen: 'menu' | 'lobby' | 'game' | 'winners'
  phase: 'lobby' | 'rolling' | 'locking' | 'unlocking' | 'idle' | 'scoring' | 'roundEnd' | 'sessionEnd'

  // Game
  players: Player[]
  currentRound: number
  sessionTargetScore: number         // Default 20

  // Round state
  roundState: {
    goalValues: number[8]            // Sorted ascending
    rollResults: number[] | null
    rollNumber: number
    lastLockCount: number
    roundScore: number
    lockAnimations: LockAnimation[]
    unlockAnimations: UnlockAnimation[]
    aiLockAnimations: LockAnimation[]
    aiUnlockAnimations: AIUnlockAnimation[]
    poolExiting: boolean
    poolSpawning: boolean
    goalTransition: 'none' | 'exiting' | 'entering'
  }

  // Player shape
  Player {
    id: string
    name: string
    color: string                    // Hex color from curated palette
    isAI: boolean
    isHost: boolean
    poolSize: number                 // Dice in rolling pool
    lockedDice: (number | null)[8]   // 8 slots, null if empty
    startingDice: number             // Z value
    score: number                    // Total session points
    selectedForUnlock: boolean[8]    // Toggle state during unlock phase
    isReady: boolean                 // Lobby ready state
  }

  // Settings
  settings: {
    audioVolume: number              // 0–100
    performanceMode: 'advanced' | 'simple'
    hapticsEnabled: boolean
    tipsEnabled: boolean
    confirmationEnabled: boolean
  }

  // Online
  isOnlineGame: boolean
  isOnlineHost: boolean
  onlinePlayerId: string | null
  onlinePlayerIds: string[]          // Maps server IDs to local player indices
  pendingLockReveals: PlayerLockResultData[]
  pendingUnlockReveals: UnlockRevealData[]
  hasSubmittedUnlock: boolean
}
```

---

## 6. Art & Audio Direction

### 6.1 Screen Layout

**All screens are portrait-oriented (mobile-first).** Desktop uses centered portrait layout with background fill.

#### Main Menu
- Game title "Roll Better"
- **Offline**: Player count selector (2, 3, 4) + PLAY button. AI difficulty is randomized per bot (no selector).
- **Online**: Inline CREATE / JOIN flow on the main menu (no separate lobby screen). CREATE shows room code + player list inline. JOIN shows code entry field inline. Host sees START GAME button when players are ready.
- How to Play button → rules modal
- Upgrades button (placeholder for future cosmetics)
- Settings gear icon (bottom-right) → opens settings modal
- Build version overlay in lower-left corner (`vX.Y.Z.B`)

#### Game Screen (Play Area) — top to bottom:

**A. Goal Row (top ~15% of screen)**
- 8 white dice in a horizontal row, sorted by number ascending
- Dice are 3D rendered, resting face-up showing their value
- Below each Goal die: a **colored wedge indicator** showing which players have dice locked in that column
  - 1 player: solid circle in their color
  - 2-way tie: circle split into 2 colors
  - N-way tie: N equal wedges
  - No one locked: gray/empty circle
- Far left: star icon (Goal profile) with score display

**B. Player Rows (middle ~50% of screen)**
- **Your row** is always the topmost player row (closest to Goal)
- Other players' rows below yours
- Each row:
  - **Left side**: Player icon (color swatch)
    - Center of icon: current **total score** (large, readable)
    - Below icon: **X/Y/Z** in small text (pool / max / starting)
  - **Right side**: 8 dice slots in a horizontal row, aligned with the Goal dice above
    - Empty slots: subtle shadow/outline
    - Locked dice: 3D dice in player's color, face-up showing value
    - During unlock phase: selected dice show pulsing ring, unselectable dice (at pool cap) show no ring
    - When another player locks dice (online): dice lerp FROM their player icon INTO their row slots

**C. Dice Pool & Rolling Area (bottom ~35% of screen)**
- Your unlocked dice sit here between rolls
- This is where 3D dice physics rolling happens
- Invisible walls contain dice within the rolling area
- After rolling, dice settle and animate:
  - Matching dice → lerp up to your row slots (auto-lock, staggered)
  - Non-matching dice → scale-down exit, then respawn at pool positions
- **HUD overlay**: Status text (phase-dependent), action buttons (ROLL / UNLOCK X / SKIP), AFK countdown bar
- **Contextual tip banner**: Shows tutorial hints (e.g., "Tap locked dice to unlock them") — toggleable in settings

#### Winners Screen
- Final rankings sorted by score (descending)
- Each player shown with color, name, final score
- Winner(s) highlighted
- **PLAY AGAIN** button (restarts with same settings)
- **MENU** button (returns to main menu)

### 6.2 Visual Style — Premium 3D Dice
> Full visual research: `.planning/research/dice-visuals.md`
> Target quality: Beat True Dice Roller (Steam, 96% positive) and Mighty Dice in a browser.

**Dice Geometry:**
- drei `RoundedBox` with args `[1, 1, 1]`, smoothness 4
- **Edge bevel radius: 0.07** — essential for realism (sharp edges look CG)
- Pips: flat circle geometry (radius 0.08, 16 segments) positioned on each face with standard pip layouts
- Pip color: near-black (`#1a1a1a`) for high contrast on cream/colored surfaces

**Dice Materials (meshPhysicalMaterial):**
- Goal dice (white/cream `#e8e0d4`): metalness 0, roughness 0.35, clearcoat 1.0, clearcoatRoughness 0.1 — polished plastic look
- Player dice (colored): same material properties, tinted per player color
- Pip material: MeshPhysicalMaterial with clearcoat 0.8, clearcoatRoughness 0.15
- Environment map intensity 1.0 for reflections

**Player Colors (curated palette):**
```
red: #c0392b, blue: #2980b9, green: #27ae60, purple: #8e44ad,
orange: #d35400, yellow: #f39c12, teal: #16a085, pink: #e84393
```
- Goal dice: always cream/white
- Player dice look like painted versions of the same premium material

**Lighting & Shadows:**
- Performance mode toggle: "Advanced" (shadows enabled) vs "Simple" (no shadows)
- Environment map for global illumination and reflections
- Directional lighting for primary shadows
- Shadows ground the dice to the surface

**Rolling Surface:**
- Physics floor at y=0 with restitution 0.5
- Invisible boundary walls (restitution 0.3) containing dice in the rolling area
- Asymmetric rolling zone (dice can roll into player row area but walls prevent escape)

**Background:**
- Clean, dark, uncluttered
- The dice and the game board are the ONLY visual focus

**Typography:**
- Clean sans-serif
- Scores: large, high-contrast, readable at a glance
- X/Y/Z: small but legible
- Status text: bold, centered in HUD area

**Animations:**
- **Goal entry**: Each die emerges from star icon (scale 0→1), lerps to sorted position with tumble rotation, staggered ~40ms apart, ~500ms each
- **Goal exit**: Each die slides right (8 units) over 350ms, staggered ~15ms apart
- **Lock (pool → slot)**: Linear lerp with quaternion slerp, ~400ms, staggered ~100ms. Sound: click
- **Unlock (mitosis)**: Die splits into 2, both arc-lerp from slot to pool positions. Phase 1: 1.2s (scale 0→1 + arc). Phase 2: 0.5s (settle). Total ~1.7s. Sound: pop
- **Pool exit**: Scale 1→1.3→0 over 0.45s. Sound: pop
- **Pool spawn**: Arc from player icon to pool position, scale 0→1, tumble rotation, ~600ms. Sound: spawn pop
- **Score counting**: Cubic ease-out over 1500ms, tick sound every 100ms, scale-pop on completion
- **Other players' locks (online)**: Dice lerp from their player icon → their row slots (profile-emerge pattern)

**The Anticipation-Resolution Arc (per roll):**
1. Intention (0ms): Status text visible, ROLL button ready
2. Anticipation (0-300ms): Tap, gathering energy
3. Release (300ms): Dice launch with impulse at offset point (induces natural rotation)
4. Chaos (300-2000ms): Bouncing, spinning, colliding — pure physics
5. Settling (2000-2500ms): Energy dissipating, faces becoming readable — tension builds
6. Resolution (2500-3000ms): Final faces visible, auto-lock lerps begin
7. Reaction (3000ms+): Lock animation, unlock decision

### 6.3 Input

**All platforms (mobile-first, desktop-friendly):**
- **Roll**: Tap/click ROLL button in HUD (or tap the status text area)
- **Unlock**: Tap/click locked dice in your row to toggle selection → tap UNLOCK button to confirm, or SKIP to keep all locked
- **Settings**: Gear icon (bottom-right) opens settings modal

Note: Shake-to-roll was implemented in v1.0 and removed in v1.2 (too unreliable across devices).

### 6.4 Audio Direction
> Current status: **Basic sound effects implemented** via Web Audio API (`soundManager.ts`). Full multi-layered sound design is a future milestone.

**Implemented sounds:**
- Die selection click
- Mitosis/unlock pop
- Pool exit pop
- Pool spawn pop
- Score tick (ascending tones per point)
- Score complete fanfare
- Round start fanfare

**Future (not yet implemented):**
- Multi-layered dice roll sounds (impact, tumble, scrape, settle)
- Physics collision-triggered audio
- Spatial 3D audio
- Full haptic feedback suite (currently basic Vibration API via `haptics.ts`)

---

## 7. Technical Architecture

### 7.1 Tech Stack
- **Framework**: React 18+ with TypeScript
- **Build**: Vite
- **3D Rendering**: Three.js via React Three Fiber (R3F)
- **3D Helpers**: @react-three/drei (RoundedBox, Environment maps)
- **Physics**: @react-three/rapier (Rust/WASM via Rapier — high performance)
- **Dice Materials**: meshPhysicalMaterial with clearcoat
- **State Management**: Zustand (works natively with R3F, avoids React re-renders for game state)
- **Audio**: Web Audio API via custom `soundManager.ts`
- **Haptics**: Vibration API via custom `haptics.ts`
- **Networking**: PartyKit WebSocket client + server (Cloudflare Workers edge)
- **Deployment**: GitHub Pages (auto-deploy via GitHub Actions on push to master) + PWA (installable, auto-updates)

### 7.2 Project Structure
```
src/
├── main.tsx                         # App entry point
├── App.tsx                          # Screen router, phase effects, game event handlers
├── App.css                          # All styles
├── index.css                        # Base styles
│
├── store/
│   └── gameStore.ts                 # Zustand store — all game state + actions
│
├── types/
│   ├── game.ts                      # GamePhase, Player, RoundState, LockAnimation, etc.
│   └── protocol.ts                  # WebSocket message types (client ↔ server)
│
├── components/
│   ├── MainMenu.tsx                 # Offline setup: player count, difficulty, play button
│   ├── LobbyScreen.tsx              # Online: room code, player list, ready, start (merged into MainMenu inline flow)
│   ├── WinnersScreen.tsx            # Final rankings, play again, menu
│   ├── HUD.tsx                      # Status text, roll/unlock/skip buttons, AFK countdown
│   ├── Settings.tsx                 # Audio, performance, haptics, tips toggles
│   ├── HowToPlay.tsx                # In-game rules reference modal
│   ├── TipBanner.tsx                # Contextual tutorial hints
│   ├── RollingCountdown.tsx         # AFK countdown bar (rolling + unlock phases)
│   ├── TouchIndicator.tsx           # Visual touch feedback
│   │
│   ├── Scene.tsx                    # Main R3F canvas — orchestrates all 3D components
│   ├── RollingArea.tsx              # Physics arena: floor + 4 walls
│   ├── DicePool.tsx                 # Pool management, physics dice, settle detection
│   ├── PhysicsDie.tsx               # Single physics die: rigid body + settle events
│   ├── Die3D.tsx                    # 3D die visual: RoundedBox + pip dots
│   │
│   ├── GoalRow.tsx                  # 8 Goal dice with entry/exit animations
│   ├── GoalIndicators.tsx           # Colored wedges under Goal showing player locks
│   ├── GoalProfileGroup.tsx         # Star icon + score display (far left of Goal)
│   │
│   ├── PlayerRow.tsx                # One player's 8 lock slots + icon
│   ├── PlayerIcon.tsx               # Color swatch + score + X/Y/Z
│   ├── PlayerProfileGroup.tsx       # AI/other player icon (scaled, positioned)
│   │
│   ├── AnimatingDie.tsx             # Lock animation: pool → slot lerp
│   ├── MitosisDie.tsx               # Unlock animation: slot → 2 dice arc to pool
│   ├── SpawningDie.tsx              # Pool spawn animation: icon → pool position
│   └── GravityController.tsx        # Accelerometer-based gravity tilt
│
├── hooks/
│   ├── useOnlineGame.ts             # Server message listener, phase sync, watchdog, buffering
│   ├── useRoom.ts                   # Lobby: room creation/joining, game start detection
│   └── useAccelerometerGravity.ts   # Tilt-based gravity for rolling dice
│
└── utils/
    ├── matchDetection.ts            # findAutoLocks() — pure logic (7 unit tests)
    ├── matchDetection.test.ts       # Unit tests for match detection
    ├── aiDecision.ts                # AI unlock strategies (Easy/Medium/Hard)
    ├── aiDecision.test.ts           # Unit tests for AI decisions
    ├── diceUtils.ts                 # getFaceUp(), getFaceUpRotation()
    ├── clearSpot.ts                 # Find empty pool positions for unlocking
    ├── partyClient.ts               # PartySocket wrapper
    ├── soundManager.ts              # Web Audio API sound effects
    └── haptics.ts                   # Vibration API wrapper
```

### 7.3 Key Technical Decisions
- **R3F Golden Rule**: NEVER use React state for per-frame updates. Mutate refs in useFrame. All dice physics, lerps, and animations run in useFrame loops, not React re-renders.
- **Physics**: Rapier for realistic 3D dice tumbling. Dice are rigid bodies with correct mass/inertia. Physics runs in the rolling area; locked dice are visual-only (not physics objects).
- **Dice values**: Read from physics simulation — `getFaceUp(quaternion)` dot-products each face normal against the up vector to determine which face is up. No fake random numbers; the physics determines the outcome. This is true for BOTH offline and online play.
- **Client-authoritative values, server-authoritative locking**: Each client rolls physics dice locally and reports settled values to the server. Server computes locks via `findAutoLocks` and relays results to other players. The physics the player sees ARE the values that get used — no mismatch.
- **Shared geometry/materials**: `Die3D.tsx` creates pip geometry and material at module level (once), shared by all die instances for performance.
- **DicePool generation keys**: `key={`${generation}-${i}`}` — generation counter bumps when pool shrinks to force remount with correct initial face values (fixes BUG-001 where wrong die stayed in pool after locking).
- **Initial roll force**: Apply impulse at an OFFSET point (not center of mass) to induce natural rotation. Add random initial angular velocity per die for variety.
- **Settle detection**: Per-die: velocity + angular velocity both < 0.1 for 0.5s. DicePool orchestrates: waits for ALL dice settled or 500ms fallback timer after first settle.
- **React StrictMode**: Dev mode double-fires effects. All init logic must be idempotent or reset state before re-running. Animation refs (`hasFired`) prevent duplicates.

**Physics parameters (tuned for feel):**

| Parameter | Value | Notes |
|-----------|-------|-------|
| Gravity | [0, -50, 0] | Faster than real (real = -9.81). Punchy feel. |
| Mass | 1 | Standard for d6 |
| Floor restitution | 0.5 | Bouncy wood surface |
| Wall restitution | 0.3 | Walls absorb more energy |
| Friction | 0.6 | Controls rolling vs sliding |
| Angular damping | 0.3 | How fast spin dies. Lower = longer spins. |
| Die size | 0.589 | Relative to arena, fits 8 across with spacing |
| Edge bevel | 0.07 | Ratio to die size. Critical for visual quality. |

---

## 8. Milestones

All milestones shipped. Full phase-by-phase history in `.planning/ROADMAP.md` and `.planning/MILESTONES.md`.

### v1.0 MVP (Phases 1–13, shipped 2026-03-03)
Complete local dice-matching game: 3D physics dice, AI opponents (Easy/Medium/Hard), auto-lock matching, unlock with mitosis animation, scoring with handicap system, sessions to 20 points, sound effects, HUD, settings, How to Play, mobile-first responsive UI.

### v1.1 Online Multiplayer (Phases 14–21, shipped 2026-03-05)
Real-time online multiplayer via PartyKit WebSockets, Jackbox-style 4-letter room codes, client-authoritative dice with server-authoritative locking, disconnect/reconnect resilience with 60s keepalive, AFK timers (20s), AI backfill and takeover, GitHub Pages deployment with PWA, privacy policy + IARC compliance.

### v1.2 Polish (Phases 22–26, shipped 2026-03-06)
Simplified main menu (removed difficulty selector, added How to Play + Upgrades buttons), removed shake-to-roll, settings gear icon (bottom-right) with audio slider fix, AI difficulty randomized per bot, merged lobby into main menu with inline Create/Join flow, verified How to Play accuracy.

---

## 9. Testing Strategy

### Manual Testing (every milestone)
- Play a full session (to 20 points) against AI
- Verify: scoring math is correct at every pool size
- Verify: handicap adjusts correctly every round
- Verify: Goal generation produces valid sorted dice
- Verify: lock-in limits are enforced (can't lock more than Goal count)
- Verify: bonus dice spawn correctly on unlock (mitosis animation)
- Verify: session ends at 20 points, correct winners shown
- Verify: must-unlock rule triggers when pool is 0
- Verify: 12-die cap prevents further unlocking

### Automated Tests
- `matchDetection.test.ts`: 7 unit tests for `findAutoLocks()` — Goal matching, slot limits, edge cases
- `aiDecision.test.ts`: Unit tests for AI unlock strategies at all difficulty levels

### Online Testing
- 2-player online: verified full session
- 2 humans + 2 bots: verified full session including host exit + Play Again
- Phase sync, deferred animations, scoring, session end: all verified
- **Needs testing**: 5-player game with multiple remaining humans hitting Play Again

### Device Testing
- Chrome desktop (primary dev)
- Safari iOS (iPhone) — touch interactions
- Chrome Android — touch interactions

---

## 10. Known Issues & Limitations

- **Audio**: Sound effects are basic procedural stubs. No collision-triggered sounds, no spatial audio, no multi-layered roll sounds yet. Full audio pass is a future milestone.
- **Haptics**: Basic Vibration API only. No per-bounce pulses or nuanced patterns yet.
- **No skip-lock**: Players cannot opt out of auto-locking a matching die. This is a deliberate simplification but may need revisiting.
- **No drag-to-unlock**: Unlock uses tap-to-toggle + confirm button only. Drag interaction deferred (see §11, #2).
- **Unlock highlight**: Uses a white floor ring under dice — placeholder for proper dice outlines (see §11, #1).

---

## 11. Future Ideas

Numbered master list. New ideas captured in `.planning/VISION.md` during sessions, then merged here. This is the single source of truth.

### Shipped (removed from active list)
- ~~#8 — Drop-in/Drop-out~~ → SHIPPED v1.3
- ~~#13 — Landscape-Only Layout~~ → SHIPPED v1.4
- ~~#14 — Collapsible Goal Area~~ → REMOVED (landscape solved the space problem)
- ~~#15 — Auto-Ready on Join~~ → SHIPPED v1.3

### Polish

**#1 — Unlock Dice Outline Style**
Replace floor-ring highlight with outlines ON the die (drei Edges or wireframe mesh). Defer until art pass — visual style TBD. Current white ring on the floor under selectable dice is a placeholder.

**#2 — Visual Language: Emergence/Return**
Dice emerge FROM owner's icon and return TO it. Emergence done (SpawningDie scales 0→1 from icon position). Missing: return-to-icon — when dice exit the pool or get locked, they currently scale to 0 in place instead of arcing back toward the player icon. Half the visual grammar is incomplete.

### Interaction

**#3 — Drag-to-Unlock (Input System Overhaul)**
Full drag input system. Swipe gesture replaces tap-to-toggle entirely (not dual-mode). Drop zone detection, visual feedback during drag, snap-back on invalid drop. This is a major system change — #4 and #5 are sub-features that depend on this being solved first.

**#4 — Hold-to-Gather-Roll**
Hold/long-press to gather dice and roll. Part of the drag input system (#3) — depends on the interaction model being redesigned first. Can't be built in isolation.

**#5 — Mouse-Based Dice Rolling (PC)**
Drag-and-release physics throw for desktop. Part of the drag input system (#3) — same interaction paradigm, different input device. Depends on #3's architecture.

### Tutorial

**#6 — Tutorial System Rework**
Current tip system is loose but functional (TipBanner with one-time-per-session tips). Needs a full design pass. Includes: "you should unlock" recurring tip until 8+ dice, and likely other tutorial improvements for onboarding. The unlock tip is one specific note within a bigger tutorial task.

### Audio

**#7 — Full Audio Pass**
Multi-layered dice sounds (impact, tumble, scrape, settle), collision-triggered audio, spatial 3D. Current sounds are procedural stubs. Defer until visual look is figured out — audio should match the aesthetic.

### System

**#9 — Upgrades System (Spots + Special Dice)**
Major progression system accessed from the Upgrades menu button (already on main menu as placeholder). Two unlockable types:
- **Spots**: Special rules for lock-in slots. When a die locks into a spot, the player gets a bonus (effects TBD — needs design pass).
- **Special Dice**: Dice with special rules that can be "bought" mid-game. If you roll doubles of anything, you can trade both dice in for a special die from your personal market.
- **Market**: Each player has 6 side-screen market slots. Not all must be filled. One of each maximum. Filled with spots and dice from unlocked options.
- **Upgrades Menu**: 6 loadout slots with drag/drop from an unlocked grid of options. Pre-game customization.
- Scale comparable to #3 (drag system). Needs full game design pass before implementation.

### Cosmetics

**#10 — Custom Dice Colors / Skins**
Cosmetic unlocks. Requires light shader work — tinting/swapping materials on the existing meshPhysicalMaterial setup.

**#11 — Customizable Tabletop Texture**
Player-selectable surfaces (wood types, felt, etc.). Current dark walnut is placeholder. Same shader/material category as #10.

**#12 — Player Profile Art**
Pre-set (possibly unlockable/earnable) avatar images replacing placeholder circle avatars. Muzzy to design in Illustrator. Layout is structurally correct — just needs assets swapped in.

---

## 12. Glossary
- **Goal**: The 8 white dice at the top of the screen that all players race to match
- **Lock / Lock-in**: Automatically placing a matching die in its slot under the Goal die
- **Unlock / Mitosis**: Tapping a locked die to return it to your pool — the die splits into 2 (original + bonus), giving you a net +1 total dice
- **Dice pool**: Your available dice at the bottom of the screen, ready to roll
- **Pool size**: Number of unlocked dice in your rolling pool
- **Total dice**: Pool + locked. Capped at 12.
- **Starting dice (Z)**: How many dice you begin each round with, modified by handicap
- **Handicap**: Win a round → -1 starting die. Lose → +1 starting die. Applied every round.
- **Must-unlock**: If pool = 0 and locked < 8, you must unlock at least 1 die before rolling
- **Session**: A series of rounds played until someone reaches 20 points
- **Round**: One Goal, rolled repeatedly until someone locks all 8
- **Turn**: One roll cycle within a round (roll → lock → check → unlock → repeat)
- **Room code**: 4-letter alphabetic code (excludes I, O) used to join an online game — Jackbox-style, zero friction
- **AFK timer**: 20-second countdown on both rolling and unlock phases. When expired, AI acts for the player that turn only.
- **AI takeover**: When a player disconnects or times out, AI seamlessly controls their dice until they reconnect
- **AI backfill**: AI opponents that fill empty player slots when the host starts the game
- **PartyKit**: WebSocket room server running on Cloudflare's edge network
- **Deferred snapshot**: Pattern where server state is buffered until client animations finish, preventing visual glitches
- **Watchdog**: Heartbeat that detects phase stalls and requests state sync from server
- **Profile-emerge**: Animation pattern where other players' dice scale from 0→1 and fly from their profile icon to their row slots
