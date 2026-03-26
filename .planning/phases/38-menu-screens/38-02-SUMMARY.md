---
phase: 38-menu-screens
plan: 02
subsystem: ui
tags: [css, responsive, modals, settings, howtoplay, winners, landscape]

# Dependency graph
requires:
  - phase: 38-01
    provides: Wider --overlay-max-w and --btn-max-w tokens
provides:
  - All overlay screens responsive for landscape 16:9
affects: [39 cleanup]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - src/App.css

key-decisions:
  - "HTP visual height scaled with vh (short axis) instead of vw for landscape"
  - "Winners gap and announcement use responsive tokens"

patterns-established: []
issues-created: []

# Metrics
duration: 10min
completed: 2026-03-26
---

# Phase 38 Plan 02: Modals & WinnersScreen Summary

**Settings, HowToPlay, and WinnersScreen modals adjusted for landscape with responsive sizing**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-25
- **Completed:** 2026-03-26
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 1

## Accomplishments
- Settings panel: max-height 80vh → 85vh, header margin responsive
- HTP slide visual: height scales with vh instead of vw (better for landscape)
- Winners backdrop gap: fixed 16px → var(--sp-sm)
- Winners announcement: fixed 1.4rem → clamp(1rem, 3.5vh, 1.6rem)

## Task Commits

1. **Tasks 1-2: Modal + winners CSS** - `d007f53` (feat)

## Files Modified
- `src/App.css` - Settings, HTP, Winners responsive adjustments

## Decisions Made
None — followed plan as specified.

## Deviations from Plan
None.

## Issues Encountered
None.

## Next Phase Readiness
- Phase 38 complete — all screens work in landscape
- Ready for Phase 39 (Cleanup & UAT)

---
*Phase: 38-menu-screens*
*Completed: 2026-03-26*
