# Project State

## Current Status
Phase 2 in progress. Die3D component with geometry and pips complete (Plan 1 of 3).

## Version
0.1.0.0

## Current Position

Phase: 2 of 12 (Premium Die)
Plan: 1 of 3 in current phase
Status: In progress
Last activity: 2026-02-28 — Completed 02-01-PLAN.md

Progress: ███░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 9%

## Last Session
2026-02-28 — Executed 02-01-PLAN.md (Die Geometry):
- Die3D component with RoundedBox (0.07 bevel, cream color)
- 21 pip dots across 6 faces, standard Western d6 layout
- Near-black pips (#1a1a1a) for visibility on cream surface
- Build version overlay (vX.Y.Z.B) in lower-left corner
- Shared geometry/material at module level for performance

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
- Physics: Rapier, gravity -50, restitution 0.5, face-up detection via dot product
- Pure physics determines roll results (no fake RNG)
- Vite v7 scaffold (latest stable)
- Zustand store minimal skeleton — game logic deferred to Phase 5
- Camera locked top-down perspective (game viewed from above like a table)
- Explicit CuboidColliders over auto-colliders for reliable high-gravity physics
- CCD on dynamic bodies to prevent tunneling
- Viewport: 9:16 portrait aspect ratio (mobile-first)
- Pip color: near-black (#1a1a1a) on cream — user direction for visibility
- Build version overlay: non-negotiable for all development checkpoints

## Known Issues
None yet.

## Session Continuity
Last session: 2026-02-28
Stopped at: Completed 02-01-PLAN.md — Plan 1 of 3 in Phase 2
Resume file: None

## Next Steps
- `/gsd:execute-plan .planning/phases/02-premium-die/02-02-PLAN.md` — Plan 02-02: Die materials (MeshPhysicalMaterial, clearcoat, HDRI, player color tinting)
