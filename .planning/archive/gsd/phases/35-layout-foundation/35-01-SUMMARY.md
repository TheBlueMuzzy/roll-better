---
phase: 35-layout-foundation
plan: 01
subsystem: ui
tags: [css, pwa, r3f, camera, viewport, landscape]

# Dependency graph
requires:
  - phase: 34-integration-testing
    provides: stable v1.3 baseline for layout conversion
provides:
  - 16:9 landscape viewport container
  - vh-based CSS design tokens for landscape
  - simplified 55° camera FOV (no portrait branching)
  - landscape PWA manifest
affects: [36-3d-scene-rework, 37-game-hud-redesign, 38-menu-screens, 39-cleanup-uat]

# Tech tracking
tech-stack:
  added: []
  patterns: [vh-based scaling for short axis in landscape, vw for width-based layout tokens]

key-files:
  created: []
  modified: [vite.config.ts, src/App.css, src/App.tsx, src/components/MainMenu.tsx]

key-decisions:
  - "Font/spacing tokens use vh (short axis) not vw in landscape"
  - "Overlay/button max widths reduced from 85/75vw to 45/40vw for landscape proportions"
  - "Camera FOV simplified to fixed 55° — portrait branching removed entirely"
  - "Safe-area insets confirmed browser-rotated — no CSS changes needed"

patterns-established:
  - "vh-based scaling: use vh for anything that should scale with the short axis (text, spacing, touch targets)"
  - "vw for width: only use vw for layout widths (overlays, buttons) where long-axis scaling is appropriate"

issues-created: []

# Metrics
duration: 5min
completed: 2026-03-12
---

# Phase 35 Plan 01: Layout Foundation Summary

**Flipped app from portrait 9:16 to landscape-only 16:9 — PWA manifest, viewport container, vh-based CSS tokens, simplified camera FOV**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-12T19:00:38Z
- **Completed:** 2026-03-12T19:06:14Z
- **Tasks:** 4 (3 auto + 1 checkpoint)
- **Files modified:** 4

## Accomplishments
- Flipped PWA manifest and #root container from 9:16 portrait to 16:9 landscape letterbox
- Converted all CSS design tokens from vw to vh for short-axis scaling in landscape
- Simplified camera FOV to fixed 55° — removed portrait branching logic
- Verified safe-area insets auto-rotate with device orientation (no CSS changes needed)

## Task Commits

Each task was committed atomically:

1. **Task 1: Flip viewport container and PWA manifest** - `c2d85ac` (feat)
2. **Task 2: Rework CSS design tokens** - `74a69ca` (feat)
3. **Task 3: Simplify camera FOV and safe-area insets** - `2e284a0` (feat)
4. **Task 4: Visual verification checkpoint** - (human-verify, approved)

## Files Created/Modified
- `vite.config.ts` - PWA manifest orientation: portrait → landscape
- `src/App.css` - 16:9 container, portrait media query removed, vh-based tokens
- `src/App.tsx` - Camera FOV simplified to fixed 55°
- `src/components/MainMenu.tsx` - Removed unused variables blocking build

## Decisions Made
- Font/spacing/touch tokens use `vh` (short axis in landscape), layout widths use `vw`
- Overlay max-width reduced from 85vw to 45vw, button max-width from 75vw to 40vw
- Camera FOV: fixed 55° with no aspect-ratio branching — landscape 16:9 is the reference
- Safe-area insets: browser auto-rotates env() values, existing CSS works as-is
- Sizes approved as "good enough" — will be revisited when art assets arrive

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed unused variables in MainMenu.tsx**
- **Found during:** Task 1 (build verification)
- **Issue:** `myPlayer` and `amReady` variables declared but never used — `tsc` strict mode failed build
- **Fix:** Removed both dead declarations
- **Files modified:** src/components/MainMenu.tsx
- **Verification:** `npm run build` succeeds
- **Committed in:** c2d85ac (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Pre-existing dead code, not caused by landscape changes. No scope creep.

## Issues Encountered
None

## Next Phase Readiness
- Landscape viewport foundation complete — all subsequent phases build on this
- Phase 36 (3D Scene Rework) can proceed: camera and container are landscape, tokens scaled correctly
- UI element positions are wrong (expected) — phases 36-38 handle repositioning

---
*Phase: 35-layout-foundation*
*Completed: 2026-03-12*
