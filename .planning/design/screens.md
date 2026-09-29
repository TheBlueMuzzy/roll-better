# Roll Better — Screens & input
> Detail for GDD §4 Controls / §6 — keep in step with GDD.md. Moved out of the GDD 2026-09-28 (word for word).

### 6.1 Screen Layout

**Landscape only (since v1.4).** Phones held sideways (either way round). Desktop uses the same landscape layout. The top-to-bottom breakdown below is from the portrait era — the pieces are the same (goal row, player rows with 3D profile groups, rolling area, HUD) but arranged for landscape; exact layout lives in the code (`Scene.tsx`).

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
    - During unlock phase: draggable dice show a ring; none show at the 12-die cap
    - When another player locks dice (online): dice lerp FROM their player icon INTO their row slots

**C. Dice Pool & Rolling Area (bottom ~35% of screen)**
- Your unlocked dice sit here between rolls
- This is where 3D dice physics rolling happens
- Invisible walls contain dice within the rolling area
- After rolling, dice settle and animate:
  - Matching dice → lerp up to your row slots (auto-lock, staggered)
  - Non-matching dice → scale-down exit, then respawn at pool positions
- **HUD overlay**: Status text (phase-dependent), countdown bars (20 s roll AFK, 3 s unlock inactivity) — no action buttons since v1.6
- **Contextual tip banner**: Shows tutorial hints (e.g., "Hold the rolling area to gather your dice, then release to roll") — toggleable in settings

#### Winners Screen
- Final rankings sorted by score (descending)
- Each player shown with color, name, final score
- Winner(s) highlighted
- **PLAY AGAIN** button (restarts with same settings)
- **MENU** button (returns to main menu)

### 6.3 Input

**All platforms (mobile-first, desktop-friendly):**
- **Roll**: Press and hold in the rolling area to gather, release to roll (v1.5)
- **Unlock**: Drag a locked die from your row into the rolling area; do nothing to skip (v1.6)
- **Settings**: Gear icon (bottom-right) opens settings modal

Note: Shake-to-roll was implemented in v1.0 and removed in v1.2 (too unreliable across devices).
