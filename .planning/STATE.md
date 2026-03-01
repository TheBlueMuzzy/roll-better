# Project State

## Current Status
Phase 6 in progress. Plan 1 of 3 complete (Lock Lerp). Matched dice now fly from pool to player row with ease-in-out cubic lerp. AnimatingDie component ready for reuse in 06-02 (unlock lerp).

## Version
0.1.0.58

## Current Position

Phase: 6 of 12 (Lerp & Animation)
Plan: 1 of 3 in current phase
Status: In progress
Last activity: 2026-03-01 — Completed 06-01-PLAN.md (Lock Lerp)

Progress: ████████████████░░░░░░░░░░░░░░░░░░░ 47%

## Last Session
2026-03-01 — Completed 06-01-PLAN.md (Lock Lerp):
- Position capture pipeline: PhysicsDie reports world position on settle
- LockAnimation type + store state computed in setRollResults
- AnimatingDie component: ease-in-out cubic + parabolic Y arc
- Scene renders flying dice outside Physics, PlayerRow hides animating slots
- Easing refined from ease-out to ease-in-out per user feedback

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
- Unlock flow: white ring + pulse, tap to select (shrinks 25%), UNLOCK button confirms
- Unlock returns die + bonus die, both showing unlocked value (pendingNewDice)
- DicePool uses generation-counter keys — forces remount with correct initialFace on pool shrink
- Must unlock 1+ when poolSize reaches 0 (soft lock prevention)
- 12-die cap: max unlocks = floor((12 - poolSize) / 2)
- Shake feedback (150ms, 90Hz) on rejected unlock selections
- Ease-in-out cubic easing for lock lerp (user feedback: much better than ease-out only)
- AnimatingDie renders outside Physics group (visual-only, no physics body)
- animatingSlotIndices hides PlayerRow dice during flight to prevent overlap
- 0.6s animation within existing 1s locking delay — no timing changes needed

## Known Issues
- **BUG-001 (P0 — partially mitigated):** getFaceUp may misread canted dice. Visual symptom fixed (generation keys), root cause (ISS-002 canting) deferred.
- ISS-001: Settle detection feels slow (number delay after die stops moving)
- ISS-002: Dice can cant against walls or other dice, blocking face detection
- ISS-003: After auto-lock shrinks pool, surviving dice may show locked values briefly (cosmetic)

## Session Continuity
Last session: 2026-03-01
Stopped at: Completed 06-01-PLAN.md — ready for 06-02
Resume file: None
