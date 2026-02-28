# Project State

## Current Status
Phase 3 complete. All dice rolling features implemented — boundary walls, multi-dice pool, face detection, sorted results. Ready for Phase 4.

## Version
0.1.0.35

## Current Position

Phase: 3 of 12 (Dice Rolling)
Plan: 3 of 3 in current phase
Status: Phase complete
Last activity: 2026-02-28 — Completed 03-03-PLAN.md

Progress: █████████░░░░░░░░░░░░░░░░░░░░░░░░░ 26%

## Last Session
2026-02-28 — Executed 03-03-PLAN.md (Boundary Walls + DicePool + Settle Detection):
- Created RollingArea with 4 invisible wall colliders (height 8)
- Created DicePool with grid spawning, rollAll(), per-die settle tracking
- Fixed ThreeEvent import crash, dice escaping walls, settle race condition
- Die scaled to DIE_SIZE ≈ 0.659 (8.5 fit across arena) per user direction
- Results sorted ascending for future lerp-to-row feature
- Commits: 488b473, ea8cb57, 857ed4d, 0d67674

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

## Known Issues
- ISS-001: Settle detection feels slow (number delay after die stops moving)

## Session Continuity
Last session: 2026-02-28
Stopped at: Completed 03-03-PLAN.md — Phase 3 complete
Resume file: None

## Next Steps
- Plan Phase 4: Game Board Layout
