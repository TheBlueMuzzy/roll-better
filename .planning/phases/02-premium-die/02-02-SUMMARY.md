---
phase: 02-premium-die
plan: 02
subsystem: rendering
tags: [r3f, MeshPhysicalMaterial, clearcoat, HDRI, player-colors, three.js]

# Dependency graph
requires:
  - phase: 02-premium-die plan 01
    provides: Die3D component with RoundedBox geometry and pip dots
provides:
  - Premium MeshPhysicalMaterial with clearcoat on die body and pips
  - Player color tinting via color prop
  - PLAYER_COLORS constant with 8 player colors
affects: [02-premium-die plan 03, 03-dice-rolling, 04-game-board-layout, 08-ai-opponents]

# Tech tracking
tech-stack:
  added: []
  patterns: [MeshPhysicalMaterial with clearcoat for premium plastic look, JSX material for prop-driven color updates]

key-files:
  created: []
  modified: [src/components/Die3D.tsx, src/components/Scene.tsx, src/App.css]

key-decisions:
  - "JSX meshPhysicalMaterial for die body (not module-level) — enables React-driven color prop updates"
  - "Pip material stays module-level MeshPhysicalMaterial constant — always near-black, never changes"
  - "Build version overlay: position:absolute instead of position:fixed — stays inside 9:16 game viewport"

patterns-established:
  - "JSX material for dynamic props: use inline <meshPhysicalMaterial> when color/props change per-instance"
  - "Module-level material for static props: use new THREE.MeshPhysicalMaterial() when material never changes"

issues-created: []

# Metrics
duration: 6min
completed: 2026-02-28
---

# Phase 2 Plan 2: Die Materials Summary

**MeshPhysicalMaterial with clearcoat 1.0, HDRI reflections from apartment environment, and 8-color player tinting via color prop**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-28T21:32:07Z
- **Completed:** 2026-02-28T21:38:10Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 3

## Accomplishments

- Die body upgraded to MeshPhysicalMaterial with full clearcoat (1.0), smooth gloss, and HDRI reflections
- Pip dots upgraded to MeshPhysicalMaterial with clearcoat (0.8) for subtle gloss
- Player color tinting via `color` prop on Die3D — defaults to cream, currently demo'd as red
- PLAYER_COLORS constants exported (red, blue, green, purple, orange, yellow, teal, pink)
- Build version overlay repositioned inside game viewport (fixed → absolute)

## Task Commits

Each task was committed atomically:

1. **Task 1: Apply MeshPhysicalMaterial with clearcoat to die body and pips** — `c58f9bd` (feat)
2. **Task 2: Add player color tinting prop** — `7dfb036` (feat)
3. **Checkpoint fix: Build version overlay positioning** — `9c8d73c` (fix)

## Files Created/Modified

- `src/components/Die3D.tsx` — MeshPhysicalMaterial on body (JSX) and pips (module-level), PLAYER_COLORS export, color prop
- `src/components/Scene.tsx` — Imports PLAYER_COLORS, passes red to Die3D for demo
- `src/App.css` — Changed build-version from position:fixed to position:absolute

## Decisions Made

- JSX `<meshPhysicalMaterial>` for die body so React handles color prop updates; module-level constant for pip material (never changes)
- Build version overlay uses `position: absolute` to stay inside the 9:16 game viewport instead of landing in black letterbox area

## Deviations from Plan

### Auto-applied Changes

**1. Pip color kept at #1a1a1a (near-black) instead of plan's #ffffff (white)**
- **Found during:** Task 1 (material upgrade)
- **Issue:** Plan specified white pips, but user explicitly changed pips to near-black during 02-01 checkpoint verification (recorded in STATE.md, 02-01-SUMMARY.md, MEMORY.md)
- **Fix:** Kept pip color at #1a1a1a, applied all other MeshPhysicalMaterial properties as specified
- **Verification:** Pips remain clearly visible on colored die surface
- **Committed in:** c58f9bd (Task 1 commit)

### Checkpoint-Directed Fix

**2. Build version overlay repositioned**
- **Found during:** Checkpoint verification — user reported overlay not visible
- **Issue:** `position: fixed` placed overlay at browser viewport corner, outside the 9:16 game area on wide screens
- **Fix:** Changed to `position: absolute` to anchor within `#root` container
- **Files modified:** src/App.css
- **Committed in:** 9c8d73c

---

**Total deviations:** 1 auto-applied (honoring prior user decision), 1 checkpoint-directed fix
**Impact on plan:** No scope creep. Pip color deviation honors explicit user preference from prior plan.

## Issues Encountered

None

## Next Phase Readiness

Die3D component ready for Plan 02-03 (scene lighting and shadows — warm spotlight, AccumulativeShadows, dark wood surface).

---
*Phase: 02-premium-die*
*Completed: 2026-02-28*
