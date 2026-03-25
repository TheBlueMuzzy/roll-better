---
phase: 37-game-hud-redesign
plan: 01
subsystem: ui
tags: [css, hud, responsive, touch-target, landscape]

# Dependency graph
requires:
  - phase: 36-3d-scene-rework
    provides: Left/right split layout (ROW_X_OFFSET=-4, ROLLING_X_OFFSET=5)
  - phase: 35-layout-foundation
    provides: vh-based CSS tokens, 16:9 viewport
provides:
  - Touch targets sized for landscape (vmin-based)
  - Round counter at top-right (not clipped by star icon)
  - Status text anchored over rolling area (right half)
  - CSS-based notification positioning (replaced inline styles)
affects: [37-02 tip/unlock button, 38 menu screens]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "vmin for touch targets — picks smaller viewport dimension, works in both orientations"
    - "HUD bottom anchored to left: 50% for right-half alignment with split layout"
    - "CSS classes for notifications instead of inline styles"

key-files:
  created: []
  modified:
    - src/App.css
    - src/components/HUD.tsx

key-decisions:
  - "Touch target uses vmin instead of vh — vmin picks shorter dimension in any orientation"
  - "Round counter pushed right via flex-end (score display was already removed)"
  - "Notifications use CSS class .hud-notifications positioned bottom-right above gear"

patterns-established:
  - "HUD elements over rolling area use left: 50% to anchor to right half of split layout"

issues-created: []

# Metrics
duration: 15min
completed: 2026-03-25
---

# Phase 37 Plan 01: HUD Layout & Touch Targets Summary

**Touch targets fixed with vmin scaling, round counter moved to top-right, status text anchored over rolling area, notifications CSS-ified**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-25
- **Completed:** 2026-03-25
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 2

## Accomplishments
- Fixed --touch-target from `clamp(40px, 10vh, 56px)` to `clamp(36px, 10vmin, 52px)` — stays finger-tappable in landscape
- Round counter moved to top-right via `justify-content: flex-end` — no longer clipped behind 3D star icon
- Status text ("Tap to Roll", "Rolling...", etc.) anchored to right half with `left: 50%`
- Seat notifications converted from inline styles to `.hud-notifications` / `.hud-notification-item` CSS classes, positioned bottom-right

## Task Commits

1. **Task 1: Fix touch target sizing** - `18bae31` (fix)
2. **Task 2: Reposition HUD elements** - `4e0ee44` (feat)
3. **Task 3: Visual verification** - approved by Muzzy

## Files Modified
- `src/App.css` - Touch target token, HUD positioning, notification CSS classes
- `src/components/HUD.tsx` - Replaced inline notification styles with CSS classes

## Decisions Made
- Used `vmin` over `vh` for touch targets — shorter dimension in any orientation, more robust
- Notifications aligned right (flex-end) instead of centered — matches landscape right-side focus

## Deviations from Plan
None — plan executed as written.

## Issues Encountered
None.

## Next Phase Readiness
- Ready for 37-02: Tip banner and unlock button repositioning
- SKIP button currently at `left: 50%` (on divider) — 37-02 moves it to `left: 75%`

---
*Phase: 37-game-hud-redesign*
*Completed: 2026-03-25*
