# Project State

## Current Status
Phase 3 in progress. PhysicsDie component created with roll API and settle detection. Click floor to roll.

## Version
0.1.0.0

## Current Position

Phase: 3 of 12 (Dice Rolling)
Plan: 1 of 3 in current phase
Status: In progress
Last activity: 2026-02-28 — Completed 03-01-PLAN.md

Progress: ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 18%

## Last Session
2026-02-28 — Executed 03-01-PLAN.md (PhysicsDie Component with Roll API):
- Created PhysicsDie component wrapping Die3D with RigidBody + CuboidCollider
- roll() method: reset position, random rotation, impulse + torque for natural tumble
- Settle detection via onSleep/onWake with ref-based isRolling state
- Scene.tsx updated: click floor to roll, replaced drop-from-height demo
- PhysicsDieHandle interface: roll() + isSettled getter

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

## Known Issues
None yet.

## Session Continuity
Last session: 2026-02-28
Stopped at: Completed 03-01-PLAN.md — PhysicsDie with roll API + settle detection
Resume file: None

## Next Steps
- Next plan in Phase 3 (face-up detection, multi-dice, etc.)
