---
phase: 07-unlock-interaction
plan: 03
subsystem: ui
tags: [tips, contextual-hints, css-transitions, zustand]

# Dependency graph
requires:
  - phase: 07-unlock-interaction (07-01)
    provides: tipsEnabled setting in store, settings panel UI
  - phase: 07-unlock-interaction (07-02)
    provides: How to Play carousel (complementary learning aid)
provides:
  - TipBanner component with slide-in/fade-out animation
  - Tip tracking infrastructure (shownTips array, shouldShowTip helper)
  - 4 contextual gameplay tips (first-roll, first-lock, first-unlock, must-unlock)
affects: [10-screens-flow, 08-ai-opponents]

# Tech tracking
tech-stack:
  added: []
  patterns: [CSS transition toggle via class add/remove, session-scoped tracking array]

key-files:
  created: [src/components/TipBanner.tsx]
  modified: [src/App.tsx, src/App.css, src/store/gameStore.ts, src/types/game.ts]

key-decisions:
  - "Pure CSS transitions over animation libraries — sufficient for simple slide/fade"
  - "Session-scoped tip tracking (reset on initGame, not initRound) — tips persist within a game"
  - "One tip at a time, first-come-first-served — prevents visual clutter"
  - "Tips hidden when settings panel open — avoids z-index conflicts and distraction"

patterns-established:
  - "Contextual tip pattern: useEffect watches phase, tryShowTip guards against duplicates"
  - "CSS transition toggle: mount with base class, rAF to add .tip-visible, remove to trigger exit"

issues-created: []

# Metrics
duration: 4min
completed: 2026-03-02
---

# Phase 7 Plan 3: Tips System Summary

**Contextual tip banner with slide-in/fade-out animation, 4s auto-dismiss, per-session tracking, and 4 gameplay hints triggered at key phase transitions**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-02T00:25:39Z
- **Completed:** 2026-03-02T00:29:40Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- TipBanner component with CSS slide-in + fade-out animation, 4s auto-dismiss, tap-to-dismiss
- Tip tracking in Zustand store (shownTips array, showTip action, shouldShowTip helper)
- Tips reset on game restart (initGame), persist within a game session (not reset on initRound)
- 4 contextual tips wired to phase transitions: first-roll, first-lock, first-unlock, must-unlock
- Must-unlock tip only shows after first-unlock tip (progressive disclosure)

## Task Commits

Each task was committed atomically:

1. **Task 1: Tips infrastructure — TipBanner component + tracking** - `b52cc92` (feat)
2. **Task 2: Wire up 4 contextual gameplay tips** - `da8c204` (feat)

## Files Created/Modified
- `src/components/TipBanner.tsx` - New: floating tip banner with CSS transitions, auto-dismiss timer
- `src/store/gameStore.ts` - Added shownTips state, showTip action, shouldShowTip export
- `src/types/game.ts` - Added shownTips: string[] to GameState
- `src/App.tsx` - Added activeTip state, tryShowTip helper, phase-watching useEffect for 4 tips, TipBanner render
- `src/App.css` - Added .tip-banner, .tip-banner.tip-visible, .tip-banner .tip-close styles

## Decisions Made
- Pure CSS transitions (no framer-motion/react-transition-group) — plan specified, and sufficient for simple slide/fade
- Tips hidden when settings panel open — prevents visual layering conflicts
- shouldShowTip exported as standalone function (not a hook) — called from callback, reads store directly

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness

Phase 7 complete — Settings panel, How to Play carousel, and Tips system all shipped. Ready for Phase 8: AI Opponents.

---
*Phase: 07-unlock-interaction*
*Completed: 2026-03-02*
