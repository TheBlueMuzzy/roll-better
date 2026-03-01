# Project State

## Current Status
Phase 5 in progress. Executing 05-04-PLAN.md (UI Integration). P0 BUG-001 open: dice matching goals don't all lock (likely getFaceUp misread on tilted dice). Diagnostic logging in place. Fix pending.

## Version
0.1.0.51

## Current Position

Phase: 5 of 12 (Core Game Logic)
Plan: 4 of 4 in current phase
Status: In progress — checkpoint 3 (human-verify) iteration
Last activity: 2026-03-01 — Fixed DicePool stable keys + unlock dice faces

Progress: █████████████████████░░░░░░░░░░░░░░ 41%

## Last Session
2026-03-01 — Executing 05-04-PLAN.md (UI Integration):
- Connected Scene components to store (f52b078)
- Phase-aware HUD with roll guarding (fbd8616)
- Added unlock phase — pulled from Phase 7 (d81d6a3, c5fd416)
- Guard setRollResults against double-fire (fc95761)
- Fixed DicePool key bug: stable keys + unlock dice show correct face (24f6e38)
- Added diagnostic logging for settle + lock pipeline (b5439c9)
- Investigated P0 locking bug — findAutoLocks verified correct, getFaceUp suspected
- Created BUG-001 P0 in ISSUES.md with full investigation data

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
- Settle detection: per-die boolean array with onUnsettled callback (replaces simple counter)
- Pure physics determines roll results (no fake RNG)
- Vite v7 scaffold (latest stable)
- Camera locked top-down at [0, 12, 0.01], fov 50
- Explicit CuboidColliders over auto-colliders for reliable high-gravity physics
- CCD on dynamic bodies to prevent tunneling
- Viewport: 9:16 portrait aspect ratio (mobile-first)
- Pip color: near-black (#1a1a1a) on cream — user direction for visibility
- Build version overlay: non-negotiable, position:absolute inside game viewport
- DIE_SIZE = arena_width / 8.5 ≈ 0.659 — sized for 8.5 across viewport (user direction)
- Results sorted ascending — required for future lerp-to-row feature
- Wall height 8 — prevents dice escaping at peak of roll arc
- ROLLING_Z_MIN = -1.7 — boundary between rolling zone and placement zone
- Placement zone floor #4a3020 — distinct color for non-rolling area
- GoalRow Z = -4.67, PlayerRow Z = -3.77 — top of viewport with half-die margin
- PlayerIcon at lower-left of rolling area (not over black border)
- HUD as HTML sibling to Canvas — forwardRef on Scene to expose rollAll
- Tap-text instead of button — "Tap To Roll" → "Rolling" → results (user direction)
- Phase flow: idle → rolling → locking → unlocking → idle (loop), locking → scoring → roundEnd (on win)
- PLAYER_COLORS in store file (avoids circular dep with Die3D)
- initGame must reset currentRound for StrictMode safety
- Vitest for testing (Vite-native, zero config)
- findAutoLocks: pure function, left-to-right slot filling, returns only new locks
- Phase transitions via chained useEffect timers with cleanup (StrictMode-safe)
- Unlock flow: all locked dice show white ring + pulse, tap to select (shrinks 25%), UNLOCK button confirms
- Unlock returns die + bonus die, both showing the unlocked value (pendingNewDice in RoundState)
- DicePool uses stable key={i} — dice survive count changes without remounting

## Known Issues
- **BUG-001 (P0):** Dice matching goal slots don't all lock — some matches silently dropped. Likely getFaceUp misread on canted dice. Full investigation in ISSUES.md. Diagnostic logging active.
- ISS-001: Settle detection feels slow (number delay after die stops moving)
- ISS-002: Dice can cant against walls or other dice, blocking face detection (related to BUG-001)
- ISS-003: After auto-lock shrinks pool, surviving dice may show locked values briefly (cosmetic, clears on next roll)

## Session Continuity
Last session: 2026-03-01
Stopped at: 05-04 checkpoint 3 — iterating on bug fixes after user testing
Resume file: None

## Next Steps
- Fix BUG-001 (P0): dice not locking — see ISSUES.md for full investigation + fix approaches
- After fix: re-test checkpoint 3 for user verification
- After approval: create 05-04-SUMMARY.md, update ROADMAP, commit metadata
