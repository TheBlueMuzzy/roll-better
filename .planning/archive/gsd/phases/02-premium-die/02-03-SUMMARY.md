---
phase: 02-premium-die
plan: 03
subsystem: rendering
tags: [r3f, drei, spotLight, AccumulativeShadows, RandomizedLight, lighting, shadows, three.js]

# Dependency graph
requires:
  - phase: 02-premium-die plan 02
    provides: MeshPhysicalMaterial with clearcoat, HDRI reflections, player color tinting
provides:
  - Warm atmospheric scene lighting (spotlight key + cool fill)
  - AccumulativeShadows for soft grounding shadow
  - Dark walnut floor surface material
  - Complete premium die visual atmosphere
affects: [03-dice-rolling, 04-game-board-layout, 12-audio-juice]

# Tech tracking
tech-stack:
  added: []
  patterns: [AccumulativeShadows + RandomizedLight for soft grounding shadows, warm/cool two-light setup for atmosphere]

key-files:
  created: []
  modified: [src/components/Scene.tsx]

key-decisions:
  - "Spotlight position [2, 10, -3] for 45-degree overhead feel — adjusted from plan's [2, 8, 2] per user feedback"
  - "AccumulativeShadows placed outside Physics component (visual-only, not a physics object)"
  - "Floor material: dark walnut #3d2517 as placeholder — user noted it will likely change or become customizable"

patterns-established:
  - "AccumulativeShadows outside Physics: shadow catchers are visual-only, never inside physics world"
  - "Two-light setup: warm key light + cool fill for premium atmosphere"

issues-created: []

# Metrics
duration: 12min
completed: 2026-02-28
---

# Phase 2 Plan 3: Scene Lighting & Shadows Summary

**Warm spotlight key light with cool fill, AccumulativeShadows for soft grounding, and dark walnut floor — completing the premium die atmosphere**

## Performance

- **Duration:** 12 min
- **Started:** 2026-02-28T22:02:20Z
- **Completed:** 2026-02-28T22:14:39Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 1

## Accomplishments

- Warm spotlight key light (#efdfd5) with 1024x1024 shadow maps
- Cool blue-ish fill light (#b4c7e0) for visual contrast
- Warm ambient fill (#ffeedd) replacing flat white ambient
- AccumulativeShadows with RandomizedLight for soft, realistic grounding shadow (opacity 0.25)
- Dark walnut floor (#3d2517, roughness 0.7)
- Phase 2 complete — premium die visual atmosphere achieved

## Task Commits

Each task was committed atomically:

1. **Task 1: Upgrade scene lighting** — `3c009da` (feat)
2. **Task 2: AccumulativeShadows + dark walnut floor** — `d6c42d7` (feat)
3. **Checkpoint fix: Adjust spotlight angle** — `49e41e5` (fix)

**Plan metadata:** (pending)

## Files Created/Modified

- `src/components/Scene.tsx` — Replaced flat lighting with warm spotlight + cool fill, added AccumulativeShadows/RandomizedLight, upgraded floor to dark walnut

## Decisions Made

- Spotlight repositioned from [2, 8, 2] to [2, 10, -3] — original position felt like light was coming from bottom of screen; new position gives natural 45-degree overhead feel
- RandomizedLight position matched to spotlight for consistent shadow direction
- Floor color #3d2517 is a placeholder — will likely become customizable (noted in VISION.md)

## Deviations from Plan

### Checkpoint-Directed Fix

**1. Spotlight angle adjustment**
- **Found during:** Checkpoint verification
- **Issue:** Light at [2, 8, 2] felt like it was coming from bottom of screen, only lighting the side of the die
- **Fix:** Repositioned to [2, 10, -3] for 45-degree overhead feel; updated RandomizedLight to match
- **Files modified:** src/components/Scene.tsx
- **Committed in:** 49e41e5

---

**Total deviations:** 1 checkpoint-directed fix
**Impact on plan:** Minor position tweak at user's direction. No scope creep.

## Issues Encountered

None

## Next Phase Readiness

Phase 2 complete. All 3 plans finished:
- 02-01: Die geometry (RoundedBox + pip dots)
- 02-02: Die materials (MeshPhysicalMaterial + clearcoat + player colors)
- 02-03: Scene lighting & shadows (warm atmosphere + AccumulativeShadows + dark wood)

Ready for Phase 3: Dice Rolling — multi-dice physics, settling, face detection.

---
*Phase: 02-premium-die*
*Completed: 2026-02-28*
