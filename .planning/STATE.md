# Project State

## Current Status
Phase 4 in progress. GoalRow component created, scene restructured into vertical zones (goal/placement/rolling). First plan complete, 2 more plans remain.

## Version
0.1.0.35

## Current Position

Phase: 4 of 12 (Game Board Layout)
Plan: 1 of 3 in current phase
Status: In progress
Last activity: 2026-02-28 — Completed 04-01-PLAN.md

Progress: ██████████░░░░░░░░░░░░░░░░░░░░░░░░ 29%

## Last Session
2026-02-28 — Executed 04-01-PLAN.md (Goal Row + Vertical Zones):
- Created GoalRow with 8 static dice, face rotation utility, slot layout constants
- Restructured scene: goal zone (top), placement zone (middle), rolling zone (bottom)
- Asymmetric rolling bounds: ROLLING_Z_MIN = -1.7, ROLLING_Z_MAX = 4.5
- Placement zone floor with distinct color (#4a3020)
- Fixed face rotations, test values, floor width during checkpoint
- Commits: 498d2dc, a2933d9, 0e40656, 65fbc0d, 6f6f458

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
- ROLLING_Z_MIN = -1.7 — 3 rows below Goal row, leaves room for player rows
- Placement zone floor #4a3020 — distinct color for non-rolling area
- Goal test values sorted ascending [1,1,2,2,3,4,5,6]

## Known Issues
- ISS-001: Settle detection feels slow (number delay after die stops moving)
- ISS-002: Dice can cant against walls or other dice, blocking face detection

## Session Continuity
Last session: 2026-02-28
Stopped at: Completed 04-01-PLAN.md
Resume file: None

## Next Steps
- Execute Plan 04-02: Player row (8 slots aligned under Goal)
