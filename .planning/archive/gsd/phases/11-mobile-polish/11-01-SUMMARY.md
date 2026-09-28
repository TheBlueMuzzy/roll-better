---
phase: 11-mobile-polish
plan: 01
subsystem: input
tags: [devicemotion, shake, ios-permission, mobile, zustand]

# Dependency graph
requires:
  - phase: 10-screens-flow
    provides: full app flow with game/menu/winners screens
provides:
  - useShakeToRoll hook with iOS permission flow
  - shakeToRollEnabled setting with store toggle
  - HUD shake-to-roll prompt and iOS enable button
affects: [11-mobile-polish, 12-responsive-ui]

# Tech tracking
tech-stack:
  added: [DeviceMotion API]
  patterns: [iOS permission-gated sensor hook, ref-based high-frequency event tracking]

key-files:
  created: [src/hooks/useShakeToRoll.ts]
  modified: [src/types/game.ts, src/store/gameStore.ts, src/App.tsx, src/components/HUD.tsx, src/components/Settings.tsx]

key-decisions:
  - "SHAKE_THRESHOLD = 15, SHAKE_COOLDOWN = 1000ms — tunable constants for shake sensitivity"
  - "Refs for acceleration tracking — no useState for high-frequency devicemotion events"
  - "Hook placed after handleRoll definition in App.tsx to avoid reference-before-init"

patterns-established:
  - "iOS permission-gated sensor pattern: detect → requestPermission → track state → conditionally listen"
  - "Mobile feature toggle: Settings toggle + isSupported guard for graceful desktop fallback"

issues-created: []

# Metrics
duration: 6min
completed: 2026-03-02
---

# Phase 11 Plan 01: Shake-to-Roll Summary

**DeviceMotion shake detection with iOS permission flow, Settings toggle, and HUD integration — desktop gracefully unsupported**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-02T17:58:18Z
- **Completed:** 2026-03-02T18:04:20Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- useShakeToRoll hook with magnitude-based shake detection (threshold 15, 1s cooldown)
- iOS DeviceMotionEvent.requestPermission() flow with prompt/granted/denied/not-needed states
- Settings toggle for shake-to-roll (visible only on supported devices)
- HUD shows "Shake to Roll" when enabled, "Enable Shake" button for iOS permission prompt
- Tap-to-roll preserved — both inputs work simultaneously

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useShakeToRoll hook** - `fb794ff` (feat)
2. **Task 2: Integrate shake with game flow + Settings toggle** - `d81acb1` (feat)

## Files Created/Modified
- `src/hooks/useShakeToRoll.ts` - Custom hook: feature detection, iOS permission, shake algorithm, cleanup
- `src/types/game.ts` - Added shakeToRollEnabled to Settings interface
- `src/store/gameStore.ts` - Added shakeToRollEnabled default + setShakeToRollEnabled action
- `src/App.tsx` - Wired useShakeToRoll hook, passes shake props to HUD and Settings
- `src/components/HUD.tsx` - Shake-to-roll status text + iOS enable button
- `src/components/Settings.tsx` - Shake to Roll toggle (conditionally visible)

## Decisions Made
- SHAKE_THRESHOLD = 15 and SHAKE_COOLDOWN = 1000ms as tunable constants
- useRef for acceleration tracking instead of useState (high-frequency events)
- Hook placed after handleRoll useCallback in App.tsx (avoids reference-before-init)

## Deviations from Plan

### Minor Adjustments

**1. [Ordering] Hook placement in App.tsx**
- **Found during:** Task 2 (App.tsx integration)
- **Issue:** Plan implied hook near top with store reads, but handleRoll (the onShake callback) is defined via useCallback further down
- **Fix:** Placed hook call immediately after handleRoll definition — hooks still run in consistent order
- **Impact:** None — purely organizational, no functional difference

No other deviations. No issues logged.

## Issues Encountered
None

## Next Phase Readiness
- Shake-to-roll ready for mobile testing on real devices
- iOS permission flow needs testing on actual iOS Safari (13+)
- Settings toggle and HUD integration complete
- Ready for 11-02 (Haptic Feedback)

---
*Phase: 11-mobile-polish*
*Completed: 2026-03-02*
