---
phase: 11-mobile-polish
plan: 03
subsystem: ui, infra
tags: [viewport, touch, safari, mobile, dpr, shadows, performance]

# Dependency graph
requires:
  - phase: 11-mobile-polish
    provides: shake-to-roll, haptic feedback
  - phase: 02-premium-die
    provides: AccumulativeShadows, MeshPhysicalMaterial dice
provides:
  - Mobile-hardened viewport (no zoom, no pull-to-refresh, no rubber-band)
  - Safe area inset support for notch devices
  - performanceMode wired to actual rendering (dpr + shadows)
affects: [12-responsive-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: [viewport-fit cover, dvh cascade fallback, conditional R3F shadows, dpr gating]

key-files:
  created: []
  modified: [index.html, src/App.css, src/App.tsx, src/components/Scene.tsx, src/components/Settings.tsx]

key-decisions:
  - "touch-action: manipulation (not none) — preserves pan/tap while killing zoom"
  - "position: fixed on body for iOS rubber-band prevention"
  - "dpr=1 in simple mode (biggest single perf win on high-DPI phones)"
  - "Shadows fully disabled in simple mode (AccumulativeShadows not rendered)"
  - "Dice materials untouched in simple mode — premium look is non-negotiable"

patterns-established:
  - "Cascade fallback: height: 100vh; height: 100dvh"
  - "Safe area inset padding on edge-touching UI elements"
  - "Performance mode gating pattern: conditional render + prop switching"

issues-created: []

# Metrics
duration: 5min
completed: 2026-03-02
---

# Phase 11 Plan 3: Mobile Performance Summary

**Viewport + touch hardened for native mobile feel; performanceMode wired to dpr scaling and shadow toggle**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-02T18:22:08Z
- **Completed:** 2026-03-02T18:27:50Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Viewport meta hardened: maximum-scale=1.0, user-scalable=no, viewport-fit=cover, Apple mobile web app meta tags
- Body/root CSS locked down: position fixed, overscroll-behavior none, touch-action manipulation, no tap highlight, no text selection, no callout
- Safe area inset padding on #root, hud-top, hud-bottom, settings-gear
- 100dvh height with 100vh fallback for dynamic mobile browser chrome
- performanceMode 'simple' forces dpr=1 and disables all shadows (Canvas shadows prop + conditional AccumulativeShadows render)
- performanceMode 'advanced' unchanged from before (dpr [1,2], shadows on)
- Settings hints updated: "Best visuals" / "Better battery"

## Task Commits

Each task was committed atomically:

1. **Task 1: Viewport + touch + Safari hardening** - `3d02cba` (feat)
2. **Task 2: Wire performanceMode to Canvas rendering** - `7adc794` (feat)

## Files Created/Modified
- `index.html` - Viewport meta hardened, Apple mobile web app meta tags
- `src/App.css` - Body position fixed, overscroll/touch/selection lockdown, safe area insets, dvh height
- `src/App.tsx` - Canvas dpr and shadows gated by performanceMode
- `src/components/Scene.tsx` - AccumulativeShadows conditionally rendered (advanced only)
- `src/components/Settings.tsx` - Hint text: "Best visuals" / "Better battery"

## Decisions Made
- Used `touch-action: manipulation` instead of `none` — preserves pan/tap while killing zoom gestures
- `position: fixed` on body (most reliable iOS rubber-band prevention)
- dpr=1 forced in simple mode (single biggest GPU load reduction on high-DPI phones)
- AccumulativeShadows completely unmounted in simple mode (not just hidden)
- Dice MeshPhysicalMaterial untouched in both modes — premium die look is core to the product

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Phase 11: Mobile Polish is now 100% complete (3/3 plans done)
- All mobile features delivered: shake-to-roll, haptics, viewport hardening, performance mode
- Ready for Phase 12: Responsive UI

---
*Phase: 11-mobile-polish*
*Completed: 2026-03-02*
