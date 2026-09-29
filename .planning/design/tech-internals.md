# Roll Better — Dice physics, state shape and file map
> Detail for TDD §2b Physics, §4 Standards and the D17–D20 decisions — keep in step with TDD.md

(Moved from the TDD on 2026-09-28. Physics numbers re-checked against the code that day.)

## Physics numbers
Hardcoded today — candidates for `content/tuning/physics.json`.

| Parameter | Value | Where / notes |
|---|---|---|
| Gravity | [0, -50, 0] | `Scene.tsx` — faster than real, punchy |
| Mass | Rapier default (not set) | |
| Die restitution / friction | 0.35 / 0.5 | `PhysicsDie.tsx` |
| Floor / wall restitution | 0.5 / 0.3 | `RollingArea.tsx` |
| Angular / linear damping | 0.3 / 0.1 | 46-03 tried more damping, reverted |
| Die size / bevel | 0.8 (`DIE_SIZE`) / 0.07 radius on the unit box | bevel is critical for the premium look |
| Settled | active check: speed < 0.5 after 500 ms of rolling (46-03), else Rapier sleep; 50 ms fallback once every die has a face; 10 s absolute timeout (ISS-005) | `DicePool.tsx` |
| Reading results | `getFaceUp` dot-products face normals vs up; dot < 0.95 → `snapFlat` rotates the die flat; walls nudge out 0.2 u on settle (B001/B002 patches) | |
| Gather charge | 2.5 s ramp, then auto-release (roll) | `DicePool.tsx` / `GatherVisuals.tsx` |

## Build notes (from old GDD §7.3 — still true)
- Locked dice are visual only (not physics objects); physics runs only in the rolling area.
- Roll impulse is applied at an offset point (not the center of mass) plus random spin, so dice tumble naturally.
- `Die3D.tsx` makes pip geometry + material once at module level, shared by every die.
- DicePool keys are `${generation}-${i}`; the generation bumps when the pool shrinks so dice remount with the right faces.
- React StrictMode double-fires effects in dev: init logic must be idempotent; `hasFired` refs prevent duplicate callbacks.

## State shape
Moved from old GDD §5.4 — partly stale (`selectedForUnlock` belongs to the old tap-to-unlock). `src/types/game.ts` + `gameStore.ts` are the truth. Missing below — the drag-to-unlock state (F47/F48):
- `dragUnlockState { active, slotIndex, value, originPosition, currentPosition }` — the ONE die being dragged. `currentPosition` is the die's centre (x, z) at drag height (`content/tuning/drag.json` → `dragHeight`), where the finger's ray meets that height plus the grab offset. `startDragUnlock` returns false (refused) while another die is dragged, for a die not in the row, or once the turn is closed (`canStartDrag`, unlockTurn.ts).
- `committedUnlocks[] { slotIndex, value, position, dropPosition }` — dice dropped this turn, parked (glowing) in the rolling area until the split; cleared on leaving the unlock phase (`returnParkedDice`).
- `unlockTimerResetKey` — restarts the 3 s unlock timer on every commit; `-1` = the timer fired and the turn is closed.
- A drag ends in `completeDragUnlock` (release, lost finger, or timer) → commit or snap back by zone + 12-dice cap. The die's pointer handling (which finger, lost pointer) is in `PlayerRow.tsx`; the drop-zone glow is `DropZoneHighlight.tsx`.
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

## Project structure
Moved from old GDD §7.2 — partly stale: `LobbyScreen`, `GravityController`, `useAccelerometerGravity` were removed; `CommittedDie`, `GatherVisuals`, `gatherPoints.ts`, `dropZone.ts`, `unlockTurn.ts`, `src/ui/` (game-ui kit, `SettingsScreen.tsx`) are missing.
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
│   ├── StatusPin.tsx                # Status banner + AFK timers, pinned over the rolling area (v1.7)
│   ├── Pinned.tsx                   # Sticks kit UI to a 3D point, scaled to the table (v1.7)
│   ├── RowChips.tsx                 # Kit PlayerChip beside every row + Goal chip; fades under a dragged die (v1.7)
│   ├── Settings.tsx                 # Audio, performance, haptics, tips toggles
│   ├── HowToPlay.tsx                # In-game rules reference modal
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
│   │
│   ├── PlayerRow.tsx                # One player's 8 lock slots + icon
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
    ├── diceCap.ts                   # 12-dice unlock cap — shared by phone + server (tested)
    ├── partyClient.ts               # PartySocket wrapper
    ├── soundManager.ts              # Web Audio API sound effects
    └── haptics.ts                   # Vibration API wrapper
```

## UI files (v1.7)
(Moved from the TDD §2 on 2026-09-29.)
- **In-game UI** — kit pieces: `src/ui/GameHud.tsx` (round badge + gear), `src/ui/RoundBanner.tsx`, `src/ui/WinnersScreen.tsx`, tips/messages as kit toasts. Pinned to the table with `src/components/Pinned.tsx` (drei Html, scaled to a world-size box): `RowChips.tsx` (a PlayerChip per row; fades under a dragged die) and `StatusPin.tsx` (status banner + the two AFK timers, via `src/hooks/useCountdown.ts`).
- **UI kit screens** — `src/ui/`: `<ScreenStack overlay>` in App.tsx draws kit screens over the whole window; Settings rows come from `content/ui/settings.json`. Old page-wide CSS sits in `@layer game-base` so it can't reach kit parts.

## E2E scripts (detail for TDD §4 Tests)
Real game in headless Chromium (`playwright-core`, Playwright's own bundled Chromium — never the installed Chrome; install once with `npx playwright-core install chromium`), drags driven through the real store actions (or real pointer events: `e2e:drag`, the race sweep). Each script starts its own servers and kills them when done (Vite `:5199`, PartyKit `:2999` — not 1999, so a normal `npm run party:dev` can keep running; the scripts refuse to start if a port is taken). Exit code 0 = PASS.
- `npm run e2e:solo` → `e2e/solo-late-drag.mjs` (~1 min): B006 — drag over the locked zone at timer end snaps back, a drag right after the timer is refused, nothing left parked; drag over the rolling zone at timer end counts (pool +2, clear spot).
- `npm run e2e:online` → `e2e/online-unlock.mjs` (~1 min): two players, one room — a held drag counts at timer end (ONE `unlock_request`, not AFK, plus `unlock_activity`), no new drag after the turn closes, the other player hears it and both agree on the dice.
- `npm run e2e` runs both. Not in CI.
- `e2e/unlock-race-sweep.mjs` (run with `node`): drops a locked die at many moments around the 3 s timer and checks it is either split this turn or back in its slot — never lost.
- `npm run e2e:drag` → `e2e/drag-real.mjs` (~1.5 min): REAL pointer drags (Playwright's mouse, so pointer capture works like a finger; synthetic events only for a 2nd finger and pointercancel) at phone landscape 844×390, phone portrait 390×844 and desktop 1280×720 — normal drop counts, just inside / just outside the drop-zone edge, letting go at the screen edge or off the page, lost finger over the rolling area / the rows, a second finger ignored, the 12-dice cap (no drag + one "Max 12 dice" toast). Screen positions come from the live camera PLUS the canvas's letterbox offset on the page. Pass a folder to save a screenshot per size.
- Driving drags through the real pointer path catches things store-driven scripts can't: page elements sitting over the dice (the pinned chips' layout boxes must never catch taps — `Pinned.tsx` sets `pointer-events: none` through drei Html's `style`, since its `pointerEvents` prop only works in transform mode).

## Decisions — full text (D17–D20)
(Moved word for word from the TDD §8 Decisions log on 2026-09-29; the TDD keeps one line per decision.)
```
D20 · 2026-09-29 · Dev Kit (F60/F59): its own React root outside #root, loaded only in dev; saves through a dev-server-only Vite plugin
  Options: Leva/tweakpane panel / our own panel / edit JSON by hand   Chose: our own small panel (`src/devkit/`) — plain styling, not the game's
  kit, so restyling the game never restyles the tool. Dynamic import behind import.meta.env.DEV → zero bytes in the live build (checked by
  npm run check:devkit). Save = POST /__devkit/save (apply: 'serve'; only content/**.json; keeps _help; skips the hot-reload for files it just
  wrote so the game isn't reset). 3D table colours go through a tiny subscribe store (`tableColors`) that repaints materials — no React re-render.
  Stop-gap: RollingArea.tsx (physics helper's file during B009) still reads table.json itself, so Scene finds that felt material by colour;
  once B009 lands, RollingArea should read `tableColors` and `findRollingFelt` in Scene.tsx can go.
  Addendum 2026-09-29 · Proposed by: Muzzy — the Dev Kit ships in release builds before 1.0, so friends testing the live link can use it.
  content/devkit.json "inReleaseBuilds" (true through beta; /deliver sets false at 1.0) → vite.config.ts `define` bakes it into
  __DEVKIT_IN_RELEASE__ (env DEVKIT_IN_RELEASE=true|false overrides for one build); main.tsx loads the Dev Kit when DEV || that flag, so
  false = dead code = zero Dev Kit bytes. Release builds have no dev server, so no Save: CAN_SAVE (saveContent.ts) = DEV; the Color tool
  shows Copy for Claude as the main button + a "changes last until you refresh" note; nothing persists (no localStorage). The save
  plugin stays apply: 'serve'. npm run check:devkit builds both ways and checks each in a browser (off: nothing in dist, ` inert;
  on: ` opens, no Save, save endpoint 404). Rule for future tools: anything that can affect play (force dice, level loader, cheats)
  must be offline-only and disabled in online games.

D19 · 2026-09-29 · UI rollout: every screen on the game-ui kit; player badges become HTML pinned to 3D
  Proposed by: Muzzy (Cartoon over the dark table; rebuild badges as kit UI)   Options: restyle 3D badges in place / kit UI pinned to 3D / leave them
  Chose: kit UI pinned to 3D (drei Html anchored to each row) — standard nameplate pattern. HTML always draws above the canvas,
  so a badge fades while a dragged die passes over it. New kit pieces (pinned label, seat-claim list) are built in this game
  in dev/framework/ui-kit first (the game-ui rule: never edit the game's kit copy), then installed with install-kit. Every player-facing word goes to content/text/en.json as screens move.

D18 · 2026-09-28 · Scoring is a list in content/tuning/scoring.json: points for 0–4 leftover dice = 8, 6, 4, 2, 1
  Proposed by: Muzzy (new numbers — a 4-leftover win used to score 0)   Options: keep 8 − 2×leftover in code / a list in content
  Chose: one list, read by `src/utils/scoring.ts` on the phone, the star preview and the server — was copy-pasted in 3 places

D17 · 2026-09-28 · UI: game-ui kit, style Cartoon — Muzzy 2026-09-28; fits 'social by default' + 'juice everything'
  First screen: Settings (F07 try-out of the framework's game-ui skill). Kit screens go through <ScreenStack overlay>
  (the game isn't built from kit Screens and #root is a letterboxed 16:9 box, so the overlay covers the whole window).
```
