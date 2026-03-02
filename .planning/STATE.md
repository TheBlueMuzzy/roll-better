# Project State

## Current Status
Phase 9 in progress. Plan 09-05 complete (pool dice spawn & exit animations). 1 plan remaining in phase.

## Version
0.1.0.83

## Current Position

Phase: 9 of 12 (Multi-Player Display)
Plan: 5 of 6 in current phase
Status: In progress
Last activity: 2026-03-02 — Completed 09-05-PLAN.md (pool dice spawn & exit animations)

Progress: █████████████████████████████░░░░░░ 83%

## Last Session
2026-03-02 — Executed 09-05 (pool dice spawn & exit animations):
- ExitingDie: pop (scale 1→1.3) + shrink (1.3→0) on round end, 0.45s total
- SpawningDie: fly from avatar, scale 0→1.15→1 overshoot, tumble rotation during flight
- Pre-computed poolSpawnPositions shared between SpawningDie and DicePool (no teleport)
- Extended roundEnd→idle window from 1500ms to 2000ms for larger pools
- Fixed 12-die cap formula: was floor((12-pool)/2), now 12-pool-locked (prevented 16+ dice)
- Dynamic unlock indicators: rings/pulse only on selectable dice
- UI polish: white score text in star, 2.5x gold goal star, white circle background

## Research Files
- `.planning/research/competitors.md` — 10 competitor deep-dives
- `.planning/research/references.md` — personas, design theory, art direction
- `.planning/research/core-rules.md` — complete rules (v2, unlock flow updated)
- `.planning/research/dice-visuals.md` — 3D dice rendering research

## Key Decisions
- Auto-lock then choose to unlock
- Scoring: max(0, 8 - poolSize * 2) where poolSize = remaining unlocked dice at win
- Handicap every round (floor 1, ceiling 12)
- 2-8 players, 20-point sessions
- Phase 1: local AI, Phase 2: WebSocket rooms (##X## codes)
- Premium 3D dice: MeshPhysicalMaterial + clearcoat + HDRI + AccumulativeShadows
- Physics: Rapier, gravity -50, restitution 0.35 (die), face-up detection via dot product
- PhysicsDie: forwardRef + useImperativeHandle for roll API, settle detection via sleep events
- Settle detection: per-die boolean array with onUnsettled callback
- Pure physics determines roll results (no fake RNG)
- Vite v7 scaffold (latest stable)
- Camera locked top-down at [0, 12, 0.01], fov 50
- Explicit CuboidColliders over auto-colliders for reliable high-gravity physics
- CCD on dynamic bodies to prevent tunneling
- Viewport: 9:16 portrait aspect ratio (mobile-first)
- Pip color: near-black (#1a1a1a) on cream — user direction for visibility
- Build version overlay: non-negotiable, position:absolute inside game viewport
- DIE_SIZE = arena_width / 9.5 ≈ 0.589 (scaled down from 8.5 for breathing room)
- Results sorted ascending — required for future lerp-to-row feature
- Wall height 8 — prevents dice escaping at peak of roll arc
- ROLLING_Z_MIN = -1.7 — boundary between rolling zone and placement zone
- Placement zone floor #4a3020
- GoalRow Z = -4.67, PlayerRow Z = -3.77
- SLOT_SPACING = 0.62 (reduced from 0.7), getSlotX centering (i - 3.0) for avatar space
- PlayerProfileGroup: two-column layout, 57px avatar + star-score + SX|TX stats
- HUD as HTML sibling to Canvas — forwardRef on Scene to expose rollAll
- Tap-text instead of button — "Tap To Roll" → "Rolling" → results
- Phase flow: idle → rolling → locking → unlocking → idle (loop), locking → scoring → roundEnd (on win)
- PLAYER_COLORS in store file (avoids circular dep with Die3D)
- initGame must reset currentRound for StrictMode safety
- Vitest for testing (Vite-native, zero config)
- findAutoLocks: pure function, left-to-right slot filling, returns only new locks
- Phase transitions via chained useEffect timers with cleanup (StrictMode-safe)
- Unlock flow: white ring + pulse, tap to select (lifts up 0.3), UNLOCK button confirms
- Unlock returns die + bonus die via mitosis split animation
- DicePool uses generation-counter keys + remainingDicePositions for position persistence
- Must unlock 1+ when poolSize reaches 0 (soft lock prevention)
- 12-die cap: maxUnlocks = 12 - poolSize - lockedCount (net +1 die per unlock)
- Shake feedback (150ms, 90Hz) on rejected unlock selections
- Ease-in-out cubic easing for lock lerp (user feedback: much better than ease-out only)
- AnimatingDie renders outside Physics group (visual-only, no physics body)
- animatingSlotIndices hides PlayerRow dice during flight to prevent overlap
- Mitosis split over departure+spawn — communicates "1 die → 2 dice" intuitively
- Pool dice persist at physical positions — generation key still bumps but uses saved positions
- Lift-to-select instead of shrink — feels like picking the die up
- Center-preferring clear-spot placement with minimum clearance
- 3-axis random shake with ramping direction change rate (15→60/sec)
- Score counting via RAF in HTML overlay (not useFrame — HUD is outside Canvas)
- initRound({ skipPhase: true }) for staged round transitions
- Goal transition: 500ms exit + 500ms enter within 2000ms roundEnd window
- Settings panel: HTML overlay z-index 50, gear button in HUD bottom-right
- Settings persist in Zustand (not reset by initGame/initRound)
- Performance mode as single toggle, not segmented control
- Confirmation setting: on/off toggle, will affect unlock-to-roll flow when hooked up
- H2P carousel: z-index 60 (above settings), touch swipe via refs, breadcrumb dots
- Layered modal pattern: settings (z-50) < H2P (z-60) — modals stack
- Tips: CSS transition toggle pattern (mount → rAF → add class), one-at-a-time guard
- Tips: session-scoped (reset initGame, not initRound), hidden when settings open
- AI strategy pattern: shared constraint checks (cap, must-unlock) → difficulty-specific function
- AI match rate = (poolSize * uniqueRemaining/6) / remainingSlots — efficiency metric
- AI Easy: 40% unlock chance, max 1 die; Medium: poolSize < remaining/2 heuristic; Hard: matchRate < 0.5 threshold
- SIMULTANEOUS PLAY — all players roll/lock/unlock in same phases together (NOT turn-based)
- Round ends immediately when ANY player completes the goal
- AI rolls: random numbers computed in setRollResults alongside human dice physics
- AI unlocks: decisions processed when human confirms/skips (processAIUnlocks action)
- Inner-wrapper animation: useFrame drives position/rotation/scale on inner group, outer group holds static face rotation + DIE_SIZE
- Star-origin emergence: STAR_WORLD_X = getSlotX(0) - 0.9, local offset = (starX - slotX) / DIE_SIZE
- Unified unlock/skip button centered at 55% vertical in pool area
- Tips positioned at top: 36% (just below divider line)
- AI lock animations: separate aiLockAnimations array with playerId, fromScale=0 toScale=1
- AnimatingDie scale interpolation: (fromScale + (toScale - fromScale) * eased) * DIE_SIZE
- AI unlock animations: animate-then-apply pattern, scale 1→0 arc back to profile group
- Combined animatingSlotIndices for AI rows (lock-in + unlock-out in single prop)
- Pool exit: ExitingDie pop (1→1.3 ease-out) + shrink (1.3→0 ease-in), 0.45s total
- Pool spawn: SpawningDie from avatar pos, scale overshoot 0→1.15→1, tumble during flight
- poolSpawnPositions pre-computed and shared with DicePool (no teleport on swap)
- Unlock ring/pulse only on selectable dice (dynamic based on remaining cap)

## Known Issues
- **BUG-001 (P0 — partially mitigated):** getFaceUp may misread canted dice. Visual symptom fixed (generation keys), root cause (ISS-002 canting) deferred.
- ISS-001: Settle detection feels slow (number delay after die stops moving)
- ISS-002: Dice can cant against walls or other dice, blocking face detection
- ISS-003: After auto-lock shrinks pool, surviving dice may show locked values briefly (cosmetic)

## Session Continuity
Last session: 2026-03-02
Stopped at: Completed 09-05-PLAN.md (pool dice spawn & exit animations)
Resume file: None — ready for 09-06-PLAN.md
