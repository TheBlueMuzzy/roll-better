# Project State

## Current Status
Phase 3 in progress. Face-up detection complete — die reads result on settle, displays above die. Settle speed logged as ISS-001.

## Version
0.1.0.33

## Current Position

Phase: 3 of 12 (Dice Rolling)
Plan: 2 of 3 in current phase
Status: In progress
Last activity: 2026-02-28 — Completed 03-02-PLAN.md

Progress: ███████░░░░░░░░░░░░░░░░░░░░░░░░░░░ 21%

## Last Session
2026-02-28 — Executed 03-02-PLAN.md (Face-Up Detection):
- Created getFaceUp utility (dot product algorithm, zero-allocation)
- PhysicsDie reads face on settle via onResult callback
- Html overlay shows result number above die
- Checkpoint verified: results match visible top face
- ISS-001 logged: settle detection feels slow

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
- Settle detection: ref-based isRolling (not React state), onSleep/onWake handlers
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
- Face-up detection: dot product of rotated face normals vs world up, highest wins
- getFaceUp uses pre-allocated scratch Vector3 (no per-call GC)
- Result display: Html overlay from drei at [0, 3, 0], white 48px bold text

## Known Issues
- ISS-001: Settle detection feels slow (number delay after die stops moving)

## Session Continuity
Last session: 2026-02-28
Stopped at: Completed 03-02-PLAN.md — face-up detection + result display
Resume file: None

## Next Steps
- Execute 03-03-PLAN.md (next plan in Phase 3)
