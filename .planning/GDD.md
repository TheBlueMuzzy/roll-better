# Roll Better — Game Design Document (GDD)

> Living document — /discover and /define write it, /gdd shows it. (Was `PRD.md` until the BMUZ-2 conversion, 2026-09-28.)
> Shipped: v1.0–v1.5; v1.6 Drag-to-Unlock in progress — live build v0.2.1. Milestones and features: `ROADMAP.md`.
> How it's built (tech stack, netcode, state, physics numbers): `TDD.md`.
> Full rules reference: `.planning/research/core-rules.md`
> ⚠ Some sections predate shipped work (hold-to-gather roll, drag-to-unlock, landscape, scoring) — see STATE Key facts → "GDD out of date".

---

## 1. Vision & Goals

- **Elevator pitch**: A browser-based multiplayer dice-matching game where you race to match a shared Goal by locking in rolls, with a push-your-luck pool mechanic — grow your dice pool to match faster, but every extra die tanks your score.
- **Target feeling**: "That roll was INSANE!" — thrilling, lucky, social spectacle. The dopamine of watching your dice land exactly where you need them.
- **Platform**: Web (React + TypeScript + Vite + Three.js/R3F)
- **Players**: 2–4 per session (offline), 2–8 per session (online, AI backfill)
- **Target audience**: Casual/mobile gamers who play Wordle, Yahtzee, and board games with friends — people who want quick, thrilling multiplayer rounds without downloading an app.
- **Core value**: The dice roll IS the product. Every design decision serves the moment of the roll — 3D physics, satisfying animations, dramatic reveals, social spectacle.
- **Constraints** (from the old PROJECT.md, still in force): free hosting tiers only (GitHub Pages + PartyKit/Cloudflare free tier); zero data collection — no accounts, no tracking; must run smoothly on mobile Safari (iPhone) and Chrome Android; physics decides every die (no fake RNG); premium dice look (clearcoat + HDRI) is mandatory; no monetization of any kind (fair forever).

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

## 3b. Scope
Draft made at the BMUZ-2 conversion from the roadmap and the old future-ideas list — **Muzzy to confirm**. The release stages (alpha / beta / 1.0) haven't been picked yet, so musts are for "the next release".

| Must — next release | Should | Could | Won't (this game) |
|---|---|---|---|
| Drag-to-unlock offline (F44–F46 ✅) | Tutorial system rework (VISION #6) | Unlock/commit dice outline style (#1) | Monetization of any kind — fair forever |
| Drag-to-unlock online (F47) | Full audio pass (#7) | Return-to-icon animations (#2) | Shake-to-roll — removed v1.2, unreliable on phones |
| Drag polish + UAT (F48) | | Mouse throw rolling on PC (#5) | Accounts / data collection — zero-friction, zero-data promise |
| CI builds like local (F49) | | Upgrades: spots + special dice (#9) | Portrait layout — landscape-only since v1.4 |
| | | Dice skins, table textures, profile art (#10–#12) | |
| | | Daily challenge, shareable result cards, spectator, tournament, friends/rematch, replays (old PROJECT.md "future" list) | |

Releases for this game: prototype → alpha → beta → 1.0 (rename or drop stages if Muzzy wants). **Done** for a release = every Must for it is done.

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
- Each player sees their OWN results immediately. Other players' results are hidden until you've rolled and locked in, then revealed with animation (full data flow: `TDD.md` §2b Multiplayer)
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

### 5.3 Online Play
How the netcode works (who owns what, message flow, deferred snapshots, watchdog, timers) moved to `TDD.md` §2b Multiplayer. The player-facing rules:

#### Design Principles for Online Play
- **The local experience is the source of truth.** Online is an invisible layer on top. If you turned off the network, each player's own experience would look identical to offline.
- **No player waits for any other player to act.** You tap, your dice roll, your locks animate. You never see a loading spinner or "waiting for other players" during your own actions.
- **Information is private until you've acted.** You don't see what others rolled/locked/unlocked until you've done the same. This prevents influence and preserves the feeling of playing your own game.
- **Every reveal is animated.** "Immediately" means "with the standard animation" (profile-emerge for locks, appropriate animation for unlocks). Nothing pops into position.

(Old §5.4 State Management moved to `TDD.md` §2b.)

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
Moved to `TDD.md` (stack §1, systems §2, physics numbers + build notes §2b, project structure §4).

---

## 8. Milestones
Moved to `ROADMAP.md` (shipped milestones v1.0–v1.5, current v1.6 features, Later).

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
- **No drag-to-unlock**: Unlock uses tap-to-toggle + confirm button only. Drag interaction deferred (see VISION.md #2).
- **Unlock highlight**: Uses a white floor ring under dice — placeholder for proper dice outlines (see VISION.md #1).

---

## 11. Future Ideas
Moved to `VISION.md` (same numbers, #1–#12). Ideas sorted into Should/Could are in §3b Scope and ROADMAP → Later.

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
