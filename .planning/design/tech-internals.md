# Roll Better — Dice physics, state shape and file map
> Detail for TDD §2b Physics and §4 Standards — keep in step with TDD.md

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
Moved from old GDD §5.4 — partly stale: e.g. `selectedForUnlock` belongs to the old tap-to-unlock, and drag state `dragUnlockState` / `committedUnlocks` / `unlockTimerResetKey` is missing. `src/types/game.ts` + `gameStore.ts` are the truth.
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
    ├── diceCap.ts                   # 12-dice unlock cap — shared by phone + server (tested)
    ├── partyClient.ts               # PartySocket wrapper
    ├── soundManager.ts              # Web Audio API sound effects
    └── haptics.ts                   # Vibration API wrapper
```

## E2E scripts (detail for TDD §4 Tests)
Real game in headless Chromium (`playwright-core`, Playwright's own bundled Chromium — never the installed Chrome; install once with `npx playwright-core install chromium`), drags driven through the real store actions. Each script starts its own servers and kills them when done (Vite `:5199`, PartyKit `:2999` — not 1999, so a normal `npm run party:dev` can keep running; the scripts refuse to start if a port is taken). Exit code 0 = PASS.
- `npm run e2e:solo` → `e2e/solo-late-drag.mjs` (~1 min): B006 — drag over the locked zone at timer end snaps back, a drag right after the timer is refused, nothing left parked; drag over the rolling zone at timer end counts (pool +2, clear spot).
- `npm run e2e:online` → `e2e/online-unlock.mjs` (~1 min): two players, one room — a held drag counts at timer end (ONE `unlock_request`, not AFK, plus `unlock_activity`), no new drag after the turn closes, the other player hears it and both agree on the dice.
- `npm run e2e` runs both. Not in CI.
- `e2e/unlock-race-sweep.mjs` (run with `node`): drops a locked die at many moments around the 3 s timer and checks it is either split this turn or back in its slot — never lost.
