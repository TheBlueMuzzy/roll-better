# Project State

## Current Status
Phase 5 in progress. Zustand store expanded with full game types and 10 actions. App/Scene/HUD wired to store, replacing all test data. Roll cycle working: idle → rolling → locking → idle.

## Version
0.1.0.42

## Current Position

Phase: 5 of 12 (Core Game Logic)
Plan: 1 of 4 in current phase
Status: In progress
Last activity: 2026-03-01 — Completed 05-01-PLAN.md

Progress: ████████████████░░░░░░░░░░░░░░░░░░░ 35%

## Last Session
2026-03-01 — Executed 05-01-PLAN.md (Game State Machine):
- Expanded types: idle phase, LockedDie, RoundState, reshaped Player/GameState
- 10 store actions: initGame, initRound, setRollResults, lockDice, unlock, score, handicap
- App/Scene/HUD migrated from local state to Zustand store
- Random goal generation, store-driven roll cycle
- Fixed StrictMode double-fire bug on currentRound
- Commits: eabcc1c, cfa2452, 9d8f8e8

## Research Files
- `.planning/research/competitors.md` — 10 competitor deep-dives
- `.planning/research/references.md` — personas, design theory, art direction
- `.planning/research/core-rules.md` — complete rules (v2)
- `.planning/research/dice-visuals.md` — 3D dice rendering research

## Key Decisions
- Auto-lock then choose to unlock
- Scoring: -2 per die beyond 8
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
- Phase flow: idle → rolling → locking → idle (auto-transition after 1.5s)
- PLAYER_COLORS in store file (avoids circular dep with Die3D)
- initGame must reset currentRound for StrictMode safety

## Known Issues
- ISS-001: Settle detection feels slow (number delay after die stops moving)
- ISS-002: Dice can cant against walls or other dice, blocking face detection

## Session Continuity
Last session: 2026-03-01
Stopped at: Completed 05-01-PLAN.md
Resume file: None

## Next Steps
- Execute 05-02-PLAN.md: Goal generation + match detection
