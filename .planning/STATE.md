# Project State

## Current Status
Phase 5 in progress. Round loop fully wired — auto-lock, scoring (8 - poolSize*2), handicap, session-to-20. 3 of 4 plans complete.

## Version
0.1.0.46

## Current Position

Phase: 5 of 12 (Core Game Logic)
Plan: 3 of 4 in current phase
Status: In progress
Last activity: 2026-03-01 — Completed 05-03-PLAN.md

Progress: █████████████████████░░░░░░░░░░░░░░ 41%

## Last Session
2026-03-01 — Executed 05-03-PLAN.md (Scoring + Round Loop):
- Wired findAutoLocks into setRollResults for auto-locking
- Phase transition chain: locking → scoring → roundEnd → idle via useEffect timers
- Scoring: max(0, 8 - poolSize * 2), handicap ±1 startingDice
- HUD: round count, score/target, pool stats, phase status text
- Session ends at 20 points
- Commits: 4771c04, 1551780

## Research Files
- `.planning/research/competitors.md` — 10 competitor deep-dives
- `.planning/research/references.md` — personas, design theory, art direction
- `.planning/research/core-rules.md` — complete rules (v2)
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
- Phase flow: idle → rolling → locking → scoring → roundEnd → idle (chained useEffect timers, 1500ms each)
- PLAYER_COLORS in store file (avoids circular dep with Die3D)
- initGame must reset currentRound for StrictMode safety
- Vitest for testing (Vite-native, zero config)
- findAutoLocks: pure function, left-to-right slot filling, returns only new locks
- Phase transitions via chained useEffect timers with cleanup (StrictMode-safe)

## Known Issues
- ISS-001: Settle detection feels slow (number delay after die stops moving)
- ISS-002: Dice can cant against walls or other dice, blocking face detection

## Session Continuity
Last session: 2026-03-01
Stopped at: Completed 05-03-PLAN.md
Resume file: None

## Next Steps
- Execute 05-04-PLAN.md: Auto-lock logic refinements
