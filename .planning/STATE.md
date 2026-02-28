# Project State

## Current Status
Phase 2 in progress. Die materials with clearcoat and player color tinting complete (Plan 2 of 3).

## Version
0.1.0.0

## Current Position

Phase: 2 of 12 (Premium Die)
Plan: 2 of 3 in current phase
Status: In progress
Last activity: 2026-02-28 — Completed 02-02-PLAN.md

Progress: ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 12%

## Last Session
2026-02-28 — Executed 02-02-PLAN.md (Die Materials):
- MeshPhysicalMaterial with clearcoat 1.0 on die body, 0.8 on pips
- HDRI reflections from apartment environment preset
- Player color tinting via color prop (8 colors exported)
- JSX material for body (prop-driven), module-level for pips (static)
- Build version overlay repositioned inside game viewport

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
- JSX meshPhysicalMaterial for die body (prop-driven color), module-level constant for pip material (static)
- Build version overlay: position:absolute (inside game viewport), not position:fixed

## Known Issues
None yet.

## Session Continuity
Last session: 2026-02-28
Stopped at: Completed 02-02-PLAN.md — Plan 2 of 3 in Phase 2
Resume file: None

## Next Steps
- `/gsd:execute-plan .planning/phases/02-premium-die/02-03-PLAN.md` — Plan 02-03: Scene lighting and shadows (warm spotlight, AccumulativeShadows, dark wood surface)
