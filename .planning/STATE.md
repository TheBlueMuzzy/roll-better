# Project State

## Current Status
Phase 4 complete. Full game board layout established — Goal row, Player row, rolling area, HUD with tap-to-roll. Ready for Phase 5: Core Game Logic.

## Version
0.1.0.39

## Current Position

Phase: 4 of 12 (Game Board Layout)
Plan: 3 of 3 in current phase
Status: Phase complete
Last activity: 2026-03-01 — Completed 04-03-PLAN.md

Progress: ████████████████░░░░░░░░░░░░░░░░░░░ 35%

## Last Session
2026-03-01 — Executed 04-03-PLAN.md (HUD + Final Layout):
- Created HUD overlay (HTML sibling to Canvas) with tap-to-roll text, score, round
- Scene wrapped in forwardRef exposing rollAll for external triggering
- Lifted isRolling/diceResults state to App
- Added zone divider at ROLLING_Z_MIN boundary
- Organized test data as labeled constants for Phase 5
- Simplified HUD from button to tap-text per user direction
- Commits: 8b6c756, da1426d, c4f83e7

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
- Zustand store minimal skeleton — game logic deferred to Phase 5
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
- Goal test values sorted ascending [1,1,2,2,3,4,5,6]
- GoalRow Z = -4.67, PlayerRow Z = -3.77 — top of viewport with half-die margin
- PlayerIcon at lower-left of rolling area (not over black border)
- HUD as HTML sibling to Canvas — forwardRef on Scene to expose rollAll
- Tap-text instead of button — "Tap To Roll" → "Rolling" → results (user direction)

## Known Issues
- ISS-001: Settle detection feels slow (number delay after die stops moving)
- ISS-002: Dice can cant against walls or other dice, blocking face detection

## Session Continuity
Last session: 2026-03-01
Stopped at: Completed 04-03-PLAN.md — Phase 4 complete
Resume file: None

## Next Steps
- Plan Phase 5: Core Game Logic — game state machine, goal generation, match detection, scoring
