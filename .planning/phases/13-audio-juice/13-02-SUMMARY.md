---
phase: 13-audio-juice
plan: 02
subsystem: audio
tags: [web-audio-api, procedural-audio, animation-sounds, whoosh, snap, rumble, pop]

# Dependency graph
requires:
  - phase: 13-01
    provides: SoundManager utility, initAudio, masterGain, noiseBuffer, playNoiseBurst helper
  - phase: 06-lerp-animation
    provides: AnimatingDie, MitosisDie, SpawningDie, ExitingDie components
provides:
  - playWhoosh() — filtered noise sweep for movement
  - playLockSnap() — sine click for lock landing
  - playMitosisRumble() — low rumble for shake phase
  - playMitosisPop() — bright pop for split
  - playSpawnPop() — tiny pop for pool spawn
  - playExitPop() — inverse pop for pool exit
  - All animation events produce audio feedback
affects: [13-03 UI audio, 13-04 final polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [Phase-boundary sound triggers via refs in useFrame, one-shot sound guard pattern]

key-files:
  created: []
  modified: [src/utils/soundManager.ts, src/components/AnimatingDie.tsx, src/components/MitosisDie.tsx, src/components/SpawningDie.tsx, src/components/DicePool.tsx]

key-decisions:
  - "Reuse playWhoosh() for both lock flight and mitosis flight — same movement sound"
  - "Sound trigger refs (hasStartedRef, soundsRef) prevent re-triggering in useFrame loop"

patterns-established:
  - "One-shot sound guard: boolean ref checked before play, set true after — prevents useFrame re-triggers"
  - "Phase-boundary audio: check elapsed against timing constants, fire sound once per boundary crossing"

issues-created: []

# Metrics
duration: 4min
completed: 2026-03-03
---

# Phase 13 Plan 02: Lock, Unlock & Pool Animation Sounds Summary

**Whoosh+snap on locks, rumble+pop on mitosis splits, and pop sounds on pool spawn/exit — all dice movements now have audio feedback**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-03T06:37:21Z
- **Completed:** 2026-03-03T06:42:03Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Lock animations produce whoosh on flight start + snap on landing (human and AI locks, staggered)
- Mitosis unlock has 3-phase audio: whoosh (flight) → rumble (shake) → pop (split)
- Pool spawn/exit dice produce individual pop sounds
- All 6 new sounds route through masterGain for volume slider control

## Task Commits

Each task was committed atomically:

1. **Task 1: Add lock animation sounds** — `0ad9742` (feat)
2. **Task 2: Add mitosis, spawn, and exit sounds** — `b753539` (feat)

## Files Created/Modified
- `src/utils/soundManager.ts` — Added 6 new procedural sound generators (playLockSnap, playWhoosh, playMitosisRumble, playMitosisPop, playSpawnPop, playExitPop)
- `src/components/AnimatingDie.tsx` — hasStartedRef triggers whoosh on flight start, playLockSnap on landing
- `src/components/MitosisDie.tsx` — soundsRef with 3 boolean flags triggers sounds at phase boundaries
- `src/components/SpawningDie.tsx` — hasStartedRef triggers playSpawnPop when spawn flight begins
- `src/components/DicePool.tsx` — ExitingDie hasStartedRef triggers playExitPop on exit start

## Decisions Made
- Reused playWhoosh() for both lock and mitosis flight sounds — same movement gesture, same audio cue
- Used ref-based one-shot guards (not state) to prevent useFrame from re-triggering sounds every frame

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- All game animation events now have audio feedback
- Ready for 13-03 (UI & score audio: counting ticks, win fanfare, selection tones)

---
*Phase: 13-audio-juice*
*Completed: 2026-03-03*
