---
phase: 37-game-hud-redesign
plan: 02
subsystem: ui
tags: [css, hud, tip-banner, unlock-button, landscape]

# Dependency graph
requires:
  - phase: 37-01
    provides: Touch targets (vmin), HUD layout anchored to right half
provides:
  - Tip banner positioned over rolling area (right half, near top)
  - Unlock/skip button centered in rolling area (left: 75%)
affects: [38 menu screens]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Interactive HUD elements positioned at left: 52-75% to target rolling area in split layout"

key-files:
  created: []
  modified:
    - src/App.css

key-decisions:
  - "Tip banner at left: 52% (just past divider) with top: var(--sp-lg)"
  - "Unlock button at left: 75% (center of right half)"

patterns-established: []
issues-created: []

# Metrics
duration: 10min
completed: 2026-03-25
---

# Phase 37 Plan 02: Tip Banner & Unlock Button Summary

**Tip banner and unlock/skip button repositioned over rolling area for landscape split layout**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-25
- **Completed:** 2026-03-25
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 1

## Accomplishments
- Tip banner moved from `top: 36%` to `top: var(--sp-lg)`, `left: 52%` — appears over rolling area near top
- Unlock/skip button moved from `left: 50%` to `left: 75%` — centered in rolling area, not on divider

## Task Commits

1. **Tasks 1-2: Reposition tip banner and unlock button** - `3778d1f` (feat)
2. **Task 3: Visual verification** - approved by Muzzy

## Files Modified
- `src/App.css` - Tip banner positioning, unlock button positioning

## Decisions Made
- Combined tasks 1 and 2 into single commit (both CSS-only changes to same file)

## Deviations from Plan
None — plan executed as written.

## Issues Encountered
- Muzzy flagged avatar/star overlap with locked dice at wide browser viewports — this is a 3D scene positioning issue (not HUD), will be addressed separately

## Next Phase Readiness
- Phase 37 complete — all HUD elements positioned for landscape
- Known issue: profile icons overlap locked dice at wide viewports (needs 3D scene fix)
- Ready for Phase 38 (Menu & Screens)

---
*Phase: 37-game-hud-redesign*
*Completed: 2026-03-25*
