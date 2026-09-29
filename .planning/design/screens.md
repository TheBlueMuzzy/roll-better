# Roll Better — Screens & input
> Detail for GDD §4 Controls / §6 — keep in step with GDD.md. Moved out of the GDD 2026-09-28 (word for word).

### 6.1 Screen Layout

**Landscape only (since v1.4).** Phones held sideways (either way round). Desktop uses the same landscape layout. The top-to-bottom breakdown below is from the portrait era — the pieces are the same (goal row, player rows with their chips, rolling area, HUD) but arranged for landscape: rows on the left half, rolling area on the right; exact layout lives in the code (`Scene.tsx`, `RowChips.tsx`).

#### Main Menu, online and help (game-ui kit, Cartoon — v1.7 sprint 02)
All front-door screens are kit screens on the Cartoon light-blue page (Muzzy's pick; colours in `content/ui/style.json`), inside the game's 16:9 box. Words: `content/text/en.json`.
- **Main menu** (`src/ui/MainMenuScreen.tsx`, kit `MainMenu`): title + subtitle, then Play (local, you + 3 bots), Play online, Settings, How to play, Upgrades (disabled, "Coming soon"). Version in the bottom-left corner.
- **Play online** (`src/ui/LobbyScreen.tsx`, kit `Lobby`; rules in `src/ui/OnlineRoom.tsx`): Create a room, or type a friend's 4-letter code and Join. Back / Esc / tapping the dim leaves.
- **Room** (kit `Lobby` with a code): "Room ABCD", players with colour avatars, Host badge, Copy code, Leave, Start game (host). Players are ready as soon as they join. Play Again after a game returns here.
- **Game in progress** (kit `SeatPicker`, kit 0.1.6): someone joining a running game picks a bot's seat (name, colour, score, locks) → "Seat claimed! Joining next round…" (Cancel) → in the game at the next round.
- **Reconnecting** (kit `Reconnecting` dialog, blocks taps) and "X reconnected" (kit toast).
- **How to Play** (kit `HowToPlay`): 6 pages with page dots, Back / Next / Got it — from the menu and in game.
- **Settings / Credits** (kit, since v1.6/v0.2.2).

#### In game (game-ui kit, Cartoon — v1.7 sprint 03)
The 3D table, dice and rows stay as they were; everything you READ on it is a kit piece. Words: `content/text/en.json` (`hud`, `chips`, `tips`, `roundIntro`, `winners`).
- **Row chips** (kit `PlayerChip`, `src/ui/RowChip.tsx`, pinned by `src/components/RowChips.tsx`): one per row, just left of its first slot — colour avatar with initials (bots read "B2"), "S2 | T5" (S = dice you start the round with, T = dice you have now), ★ score that counts up. Your chip has the highlight ring. The Goal row's chip is ★ + the points you'd score if you finished the Goal now. One line each: on a landscape phone rows are ~39 px apart. A chip fades while a die you're dragging is over it, so the die stays readable (B010).
- **Status banner** (kit `TurnBanner`, `src/ui/StatusBanner.tsx`, pinned by `src/components/StatusPin.tsx`) at the bottom of the rolling area: Hold to Roll / Rolling… / Locked 3! / No matches / Drag dice to unlock / 2 unlocked / Waiting for others… / Round complete! +6 pts / Next round…. Pops in on every change.
- **Timers** (kit `Bar` beside the banner): online 20 s roll AFK timer; 3 s unlock timer (accent colour) that restarts on every drag and ends the turn.
- **HUD** (kit `Hud`, `src/ui/GameHud.tsx`): "Round 2" badge top-right, Settings gear bottom-right. Empty space lets every tap through to the table.
- **"Round N" banner** (kit `RoundIntro`, `src/ui/RoundBanner.tsx`): 1.6 s at the start of every round (`content/tuning/ui.json` → `roundBannerSeconds`, 0 = off). Never blocks taps or delays play.
- **Tips and messages** (kit toasts, over the rolling area so they never cover the Goal row): one-time tips (tap to close, 4 s, one at a time, off in Settings); online seat messages ("Sam is on autopilot", "Bot took over for Sam", "Sam is back", "Sam joined the game") and "Sam reconnected".
- **Winners** (kit `Results`, `src/ui/WinnersScreen.tsx`): over a dimmed table — "You win!" / "Sam wins!" / "Tie!", rounds played, everyone best first in their colour (ties share a place), ★ on the winner(s), "You" badge, Play again + Menu. Same online and offline.
- Pinned pieces scale with the table (same size ON the table on a phone and a desktop) — `src/components/Pinned.tsx`.

#### Game Screen (Play Area) — top to bottom:

**A. Goal Row (top ~15% of screen)**
- 8 white dice in a horizontal row, sorted by number ascending
- Dice are 3D rendered, resting face-up showing their value
- Below each Goal die: a **colored wedge indicator** showing which players have dice locked in that column
  - 1 player: solid circle in their color
  - 2-way tie: circle split into 2 colors
  - N-way tie: N equal wedges
  - No one locked: gray/empty circle
- Far left: the Goal chip — ★ + the points you'd score if you finished the Goal now

**B. Player Rows (middle ~50% of screen)**
- **Your row** is always the topmost player row (closest to Goal)
- Other players' rows below yours
- Each row:
  - **Left side**: the player's chip (kit PlayerChip): colour avatar + initials, S (starting dice) | T (total dice), ★ score
  - **Right side**: 8 dice slots in a horizontal row, aligned with the Goal dice above
    - Empty slots: subtle shadow/outline
    - Locked dice: 3D dice in player's color, face-up showing value
    - During unlock phase: draggable dice show a ring; none show at the 12-die cap
    - When another player locks dice: dice fly FROM beside their chip INTO their row slots

**C. Dice Pool & Rolling Area (bottom ~35% of screen)**
- Your unlocked dice sit here between rolls
- This is where 3D dice physics rolling happens
- Invisible walls contain dice within the rolling area
- After rolling, dice settle and animate:
  - Matching dice → lerp up to your row slots (auto-lock, staggered)
  - Non-matching dice → scale-down exit, then respawn at pool positions
- **Status banner** pinned at the bottom, timer bar beside it (see "In game" above) — no action buttons since v1.6
- **Tips**: kit toasts at the top of the rolling area (e.g., "Hold the rolling area to gather your dice, then release to roll") — toggleable in settings

#### Winners Screen (kit Results since v1.7)
- "You win!" / "{name} wins!" / "Tie!" + rounds played
- Final rankings sorted by score (descending), ties share a place; each player with colour avatar, name, points
- ★ on the winner(s), "You" on you; rows arrive one after another
- **Play again** (offline: same settings; online: back to the room)
- **Menu** (returns to main menu)

### 6.3 Input

**All platforms (mobile-first, desktop-friendly):**
- **Roll**: Press and hold in the rolling area to gather, release to roll (v1.5)
- **Unlock**: Drag a locked die from your row into the rolling area; do nothing to skip (v1.6)
- **Settings**: Gear icon (bottom-right) opens settings modal

Note: Shake-to-roll was implemented in v1.0 and removed in v1.2 (too unreliable across devices).
