---
phase: 07-unlock-interaction
plan: 02
subsystem: ui
tags: [carousel, swipe, touch, modal, how-to-play, rules]

requires:
  - phase: 07-unlock-interaction
    provides: Settings panel with gear button and HTML overlay pattern
provides:
  - How to Play carousel modal with 6 rules slides
  - Swipeable touch carousel component (reusable)
  - Settings → H2P navigation flow
affects: [10-screens-flow]

tech-stack:
  added: []
  patterns: [touch-swipe-via-refs, z-index-layered-modals]

key-files:
  created: [src/components/HowToPlay.tsx]
  modified: [src/App.css, src/components/Settings.tsx, src/App.tsx]

key-decisions:
  - "Touch coords tracked in refs (not state) to avoid re-renders during drag"
  - "Z-index 60 for H2P (above settings at 50) — settings stays open behind"

patterns-established:
  - "Layered modal pattern: z-index 50 (settings) < 60 (H2P) — modals can stack"
  - "Touch swipe: refs for tracking, setState only for final slide index"

issues-created: []

duration: 3min
completed: 2026-03-02
---

# Phase 7 Plan 2: How to Play Carousel Summary

**Swipeable 6-slide rules carousel with touch/keyboard nav, breadcrumb dots, accessible from settings panel**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-02T00:06:54Z
- **Completed:** 2026-03-02T00:10:23Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Full carousel component with touch swipe (50px threshold), live drag preview, edge resistance
- Arrow key + Escape keyboard support for desktop
- Breadcrumb dots with click-to-jump and active scaling (1.3x)
- 6 rules slides covering full game flow: Roll, Match, Unlock, Score, Handicap, Win
- Settings integration — "How to Play" button opens carousel above settings panel

## Task Commits

Each task was committed atomically:

1. **Task 1: Carousel component with swipe + breadcrumb dots** - `f705d34` (feat)
2. **Task 2: Rules slides content + settings integration** - `86d11dd` (feat)

## Files Created/Modified
- `src/components/HowToPlay.tsx` - New carousel modal component with 6 rules slides
- `src/App.css` - Added `.settings-h2p` button + all `.h2p-*` carousel styles
- `src/components/Settings.tsx` - Added `onOpenHowToPlay` prop + H2P button
- `src/App.tsx` - Added `howToPlayOpen` state, HowToPlay import + conditional render
- `version.json` - Build bumped 66 → 68

## Decisions Made
- Touch coordinates tracked in refs to avoid re-renders during drag — only setState for final slide index
- Z-index 60 for H2P modal (above settings z-index 50) — settings stays open behind carousel
- Emoji placeholders for slide visuals (noted for future replacement with screenshots/illustrations)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- How to Play carousel complete, ready for 07-03 (Tips system)
- Carousel component is reusable if needed for other modal slide content

---
*Phase: 07-unlock-interaction*
*Completed: 2026-03-02*
