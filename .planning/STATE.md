# Project State

## Current Status
Phase 8 in progress. 08-01 complete (TDD AI decision engine). 08-02 ready for execution.

## Version
0.1.0.70

## Current Position

Phase: 8 of 12 (AI Opponents)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-03-02 — Completed 08-01-PLAN.md (TDD AI decision engine)

Progress: ██████████████████████░░░░░░░░░░░░░ 63%

## Last Session
2026-03-02 — Executed 08-01 (TDD):
- RED: 24 failing tests for AI unlock decision engine
- GREEN: Full implementation, all 24 tests passing, 31 total (no regressions)
- Match rate formula: (poolSize * uniqueRemaining/6) / remainingSlots

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
- DIE_SIZE = arena_width / 8.5 ≈ 0.659
- Results sorted ascending — required for future lerp-to-row feature
- Wall height 8 — prevents dice escaping at peak of roll arc
- ROLLING_Z_MIN = -1.7 — boundary between rolling zone and placement zone
- Placement zone floor #4a3020
- GoalRow Z = -4.67, PlayerRow Z = -3.77
- PlayerIcon at lower-left of rolling area
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
- 12-die cap: max unlocks = floor((12 - poolSize) / 2)
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
- Goal transition: 500ms exit + 500ms enter within 1500ms roundEnd window
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

## Known Issues
- **BUG-001 (P0 — partially mitigated):** getFaceUp may misread canted dice. Visual symptom fixed (generation keys), root cause (ISS-002 canting) deferred.
- ISS-001: Settle detection feels slow (number delay after die stops moving)
- ISS-002: Dice can cant against walls or other dice, blocking face detection
- ISS-003: After auto-lock shrinks pool, surviving dice may show locked values briefly (cosmetic)

## Session Continuity
Last session: 2026-03-02
Stopped at: Completed 08-01-PLAN.md (AI decision engine)
Resume file: .planning/phases/08-ai-opponents/08-02-PLAN.md
