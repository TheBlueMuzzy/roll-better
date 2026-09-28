---
phase: 38-menu-screens
plan: 01
subsystem: ui
tags: [css, responsive, menu, landscape, clamp]

# Dependency graph
requires:
  - phase: 35-layout-foundation
    provides: 16:9 viewport, vh-based CSS tokens
provides:
  - Wider responsive tokens (--overlay-max-w, --btn-max-w)
  - Responsive menu title and subtitle
  - Tighter menu gap for landscape
  - Responsive winners heading
affects: [38-02 modals, 39 cleanup]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Responsive headings via clamp(min, preferred, max) instead of fixed rem"

key-files:
  created: []
  modified:
    - src/App.css

key-decisions:
  - "Widened --overlay-max-w to 50vw/520px and --btn-max-w to 45vw/440px"
  - "Menu gap tightened from --sp-lg to --sp-md for landscape vertical space"

patterns-established: []
issues-created: []

# Metrics
duration: 10min
completed: 2026-03-25
---

# Phase 38 Plan 01: MainMenu for Landscape Summary

**Widened responsive tokens, responsive menu title/subtitle, tighter spacing for landscape 16:9**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-25
- **Completed:** 2026-03-25
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 1

## Accomplishments
- --overlay-max-w widened: 45vw/420px → 50vw/520px
- --btn-max-w widened: 40vw/360px → 45vw/440px
- Menu title: fixed 2.5rem → clamp(1.8rem, 6vh, 2.8rem)
- Menu subtitle: fixed 0.9rem → var(--fs-md)
- Menu backdrop gap: --sp-lg → --sp-md
- Winners heading: fixed 2rem → clamp(1.4rem, 5vh, 2.2rem)

## Task Commits

1. **Tasks 1-2: Tokens + menu CSS + winners heading** - `43e4834` (feat)

## Files Modified
- `src/App.css` - Token widths, menu title/subtitle, backdrop gap, winners heading

## Decisions Made
None — followed plan as specified.

## Deviations from Plan
None.

## Issues Encountered
None.

## Next Phase Readiness
- Token changes automatically benefit Settings, HTP, and Winners overlays
- Ready for 38-02: modal-specific adjustments

---
*Phase: 38-menu-screens*
*Completed: 2026-03-25*
