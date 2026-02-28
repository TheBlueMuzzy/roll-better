# Project State

## Current Status
Phase 2 complete. Premium die with warm lighting, soft shadows, and dark wood surface. Ready for Phase 3.

## Version
0.1.0.0

## Current Position

Phase: 2 of 12 (Premium Die)
Plan: 3 of 3 in current phase
Status: Phase complete
Last activity: 2026-02-28 — Completed 02-03-PLAN.md

Progress: █████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 15%

## Last Session
2026-02-28 — Executed 02-03-PLAN.md (Scene Lighting & Shadows):
- Warm spotlight key light (#efdfd5) + cool blue fill (#b4c7e0)
- AccumulativeShadows with RandomizedLight for soft grounding
- Dark walnut floor (#3d2517) with roughness 0.7
- Spotlight repositioned to [2, 10, -3] for 45-degree overhead feel (user feedback)

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
- Spotlight at [2, 10, -3] for 45-degree overhead feel (not from bottom of screen)
- AccumulativeShadows outside Physics component (visual-only, not physics)

## Known Issues
None yet.

## Session Continuity
Last session: 2026-02-28
Stopped at: Completed 02-03-PLAN.md — Phase 2 complete
Resume file: None

## Next Steps
- `/gsd:plan-phase 3` — Phase 3: Dice Rolling (multi-dice physics, settling, face detection)
