---
phase: 13-audio-juice
plan: 01
subsystem: audio
tags: [web-audio-api, procedural-audio, rapier, onContactForce, dice-sounds]

# Dependency graph
requires:
  - phase: 03-dice-rolling
    provides: Physics collision events, settle detection
  - phase: 07-unlock-interaction
    provides: Settings panel with audioVolume slider
provides:
  - SoundManager utility (initAudio, setVolume, playDiceImpact, playDiceSettle, playAllSettled)
  - Force-proportional dice impact sounds via Rapier onContactForce
  - Volume control wired to Zustand audioVolume
affects: [13-02 lock sounds, 13-03 UI audio, 13-04 final polish]

# Tech tracking
tech-stack:
  added: [Web Audio API (native, no library)]
  patterns: [Module-level audio state, lazy AudioContext init, procedural sound generation, noise buffer reuse]

key-files:
  created: [src/utils/soundManager.ts]
  modified: [src/components/PhysicsDie.tsx, src/components/DicePool.tsx, src/App.tsx]

key-decisions:
  - "Pure Web Audio API over Howler.js — no dependency needed for procedural sounds"
  - "Module-level state pattern (no class) — matches project conventions"
  - "totalForceMagnitude (scalar) over totalForce (Vector3) for Rapier contact force"

patterns-established:
  - "Procedural audio: noise buffer + bandpass filter + gain envelope for impact sounds"
  - "Audio init on first user gesture (autoplay policy compliance)"
  - "Throttle concurrent sounds via simple counter (max 8 impacts)"

issues-created: []

# Metrics
duration: 6min
completed: 2026-03-03
---

# Phase 13 Plan 01: Sound System Foundation + Dice Collision Sounds Summary

**Procedural Web Audio API SoundManager with force-proportional dice impact sounds wired to Rapier onContactForce**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-03T06:25:37Z
- **Completed:** 2026-03-03T06:31:42Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- SoundManager utility with lazy AudioContext init and autoplay policy compliance
- Procedural dice impact sounds (noise burst + bandpass filter, volume scaled by collision force)
- Settle thud and all-settled chime generators
- Force-proportional audio wired to Rapier `onContactForce` on PhysicsDie
- Volume control synced to existing Zustand audioVolume store via useEffect

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SoundManager with procedural dice sounds** — `64483ad` (feat)
2. **Task 2: Wire dice collision sounds to PhysicsDie + DicePool** — `1903687` (feat)

## Files Created/Modified
- `src/utils/soundManager.ts` — Procedural sound module (135 lines): initAudio, setVolume, playDiceImpact, playDiceSettle, playAllSettled
- `src/components/PhysicsDie.tsx` — Added onContactForce handler + playDiceSettle in onSleep
- `src/components/DicePool.tsx` — Added playAllSettled in fireResults
- `src/App.tsx` — initAudio on first roll tap, useEffect syncing audioVolume to setVolume

## Decisions Made
- Used `totalForceMagnitude` (scalar) instead of `totalForce` (Vector3) — Rapier's ContactForcePayload provides the scalar magnitude directly, which is what we need for volume scaling
- Kept module-level state pattern (no class) — consistent with project conventions, simpler imports

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Used totalForceMagnitude instead of totalForce**
- **Found during:** Task 2 (wiring PhysicsDie onContactForce)
- **Issue:** Plan specified `payload.totalForce / 500` but Rapier's ContactForcePayload exposes `totalForceMagnitude` (number), not `totalForce` (which is a Vector3)
- **Fix:** Used `payload.totalForceMagnitude / 500` for the scalar force normalization
- **Files modified:** src/components/PhysicsDie.tsx
- **Verification:** TypeScript compiles clean
- **Committed in:** `1903687` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (API name mismatch), 0 deferred
**Impact on plan:** Minimal — correct API field used, no scope change.

## Issues Encountered
None

## Next Phase Readiness
- SoundManager foundation in place — ready for lock/unlock sounds (13-02), UI audio (13-03), and final polish (13-04)
- All future audio plans import from `src/utils/soundManager.ts` and add new `play*()` functions

---
*Phase: 13-audio-juice*
*Completed: 2026-03-03*
