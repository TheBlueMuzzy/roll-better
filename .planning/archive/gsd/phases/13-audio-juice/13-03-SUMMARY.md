---
phase: 13-audio-juice
plan: 03
subsystem: audio
tags: [web-audio-api, procedural-sound, scoring, ui-feedback]

# Dependency graph
requires:
  - phase: 13-01
    provides: SoundManager foundation with Web Audio API, volume control, AudioContext resume
  - phase: 13-02
    provides: Animation sound patterns (one-shot guards, phase-boundary triggers)
provides:
  - Score counting tick + completion chime sounds
  - Win fanfare arpeggio
  - UI interaction sounds (click, select, deselect)
  - Phase transition sounds (round start, no match)
affects: [13-04-final-juice]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RAF-integrated audio: playScoreTick throttled inside animateScore requestAnimationFrame loop"
    - "Multi-oscillator scheduling: playScoreComplete/playWinFanfare use audioCtx.currentTime offsets for precise note sequencing"
    - "Noise-burst UI click: BufferSource with random noise + BiquadFilter bandpass"

key-files:
  created: []
  modified:
    - src/utils/soundManager.ts
    - src/components/HUD.tsx
    - src/App.tsx
    - src/components/Scene.tsx
    - src/components/Settings.tsx
    - src/components/HowToPlay.tsx
    - src/components/MainMenu.tsx

key-decisions:
  - "Score tick throttled to ~10/sec (100ms intervals) to prevent audio spam on large score counts"
  - "UIClick uses noise burst + bandpass filter rather than oscillator for organic feel"
  - "All UI sounds wired at interaction callsite (not centralized event bus)"

patterns-established:
  - "Throttled RAF audio: track lastTickTime inside animation loops, gate on 100ms intervals"
  - "Noise-burst pattern: createBuffer → fill random → createBufferSource → connect through bandpass filter"

issues-created: []

# Metrics
duration: 8min
completed: 2026-03-03
---

# Phase 13 Plan 03: UI & Score Audio Summary

**8 procedural sounds for scoring, UI interactions, and phase transitions — score tick counting, win fanfare, die select/deselect tones, round start sweep, no-match feedback, and UI click**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-03T06:55:19Z
- **Completed:** 2026-03-03T07:03:32Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Score counting produces per-point ticks (1400Hz sine, throttled ~10/sec) with three-tone ascending chime on completion (C5→E5→G5)
- Win fanfare plays ascending arpeggio (C5→E5→G5→C6) when session winner declared
- Die selection/deselection has distinct tones (900Hz select, 600Hz deselect)
- Phase transitions have audio cues: rising sweep on round start, flat two-tone on no-match
- All UI buttons (settings, H2P, menu) produce micro-click noise burst
- Sound hierarchy maintained: dice impacts > game events > UI clicks

## Task Commits

Each task was committed atomically:

1. **Task 1: Score counting and win sounds** - `695622e` (feat)
2. **Task 2: UI interaction and phase transition sounds** - `5d9e7c3` (feat)

## Files Created/Modified
- `src/utils/soundManager.ts` - Added 8 procedural sound functions (scoreTick, scoreComplete, winFanfare, uiClick, selectDie, deselectDie, roundStart, noMatch)
- `src/components/HUD.tsx` - Score tick integration in animateScore RAF loop + scoreComplete at end + gear button click
- `src/App.tsx` - Win fanfare on sessionEnd, round start on idle transition, no-match on locking with 0 new locks
- `src/components/Scene.tsx` - Select/deselect die tones in handleToggleUnlock
- `src/components/Settings.tsx` - UI click on close and H2P button
- `src/components/HowToPlay.tsx` - UI click on close button
- `src/components/MainMenu.tsx` - UI click on settings link button

## Decisions Made
- Score ticks throttled to ~10/sec (every 100ms) to prevent audio spam for large scores
- UIClick uses noise burst (random buffer + bandpass 3000Hz) rather than oscillator for organic micro-click feel
- Sounds wired at interaction callsites rather than centralized event system — keeps it simple and traceable

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- All game events and UI interactions now have audio feedback
- Sound hierarchy: dice collision impacts (loudest) > scoring/game events > UI clicks (quietest)
- Ready for 13-04 final juice pass and full playtest verification

---
*Phase: 13-audio-juice*
*Completed: 2026-03-03*
