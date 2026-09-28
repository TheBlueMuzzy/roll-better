---
phase: 36-3d-scene-rework
plan: 02
subsystem: ui
tags: [r3f, rapier, three.js, landscape, animation, layout]

# Dependency graph
requires:
  - phase: 36-01
    provides: Wider arena (ARENA_HALF_X=4.5), goal row at Z=-5.0, full-viewport floors
provides:
  - Left/right split layout (rows left, rolling right)
  - Player rows repositioned for landscape with 0.55 Z-spacing
  - All animation arcs scaled with DIE_SIZE
  - clearSpot bounds updated for right-side rolling area
affects: [37 HUD redesign, 38 menu screens]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Left/right split: ROW_X_OFFSET=-4 (rows), ROLLING_X_OFFSET=5 (dice pool)"
    - "Animation arc heights scale with DIE_SIZE (spawn: 0.9x, lock/unlock: 1.2x)"
    - "getSlotX includes ROW_X_OFFSET so all row positions auto-shift left"

key-files:
  created: []
  modified:
    - src/components/Scene.tsx
    - src/components/PlayerRow.tsx
    - src/components/PlayerProfileGroup.tsx
    - src/components/RollingArea.tsx
    - src/components/GoalRow.tsx
    - src/components/DicePool.tsx
    - src/components/SpawningDie.tsx
    - src/components/AnimatingDie.tsx
    - src/components/MitosisDie.tsx
    - src/utils/clearSpot.ts

key-decisions:
  - "Left/right split layout instead of vertical stack — Muzzy's proposal during checkpoint review"
  - "ROW_X_OFFSET=-4 for all rows, ROLLING_X_OFFSET=5 for dice pool — asymmetric split with divider at X=0"
  - "DIE_SIZE hardcoded at 0.8 (decoupled from arena width) for consistent animation scaling"
  - "ARENA_HALF_X widened from 3.8 to 4.5 to fill right half of landscape viewport"

patterns-established:
  - "Split layout pattern: left half for display rows, right half for physics interaction"

issues-created: []

# Metrics
duration: multi-session (2026-03-12 to 2026-03-25)
completed: 2026-03-25
---

# Phase 36 Plan 02: Player Rows, Animations & Left/Right Split

**Left/right split layout with rows on left (ROW_X_OFFSET=-4) and rolling area on right (ROLLING_X_OFFSET=5). All animation arcs scaled with DIE_SIZE.**

## Performance

- **Started:** 2026-03-12
- **Completed:** 2026-03-25
- **Tasks:** 3 (2 auto + 1 verify checkpoint)
- **Files modified:** 10

## Accomplishments
- Player rows repositioned for landscape Z-spacing (0.55 unit gaps vs 0.9 in portrait)
- Profile icons repositioned with ROW_X_OFFSET alignment
- Spawn/lock/unlock/mitosis animation arcs scaled proportionally with DIE_SIZE
- **Layout pivot:** Switched from vertical stack to left/right split (Muzzy's proposal)
  - Left half (X ~ -4): Goal row + all player rows, full viewport height
  - Right half (X ~ 5): Rolling area with symmetric Z bounds [-5, 5]
  - Subtle vertical divider at X=0
- getSlotX updated to include ROW_X_OFFSET so all slots auto-shift left
- clearSpot bounds updated for right-side rolling area (X: 2.0-8.0, Z: -3.5 to 3.5)
- ARENA_HALF_X widened from 3.8 to 4.5 for the right-half rolling area

## Task Commits

1. **Task 1: Reposition player rows and profile icons** - `db0fd55` (refactor)
2. **Task 1b: Scale animation arcs with DIE_SIZE** - `f5825b9` (refactor)
3. **Task 2: Left/right split layout** - `32023da` (feat)
4. **Task 3: Visual verification checkpoint** - verified via Playwright (2026-03-25)

## Files Modified
- `src/components/RollingArea.tsx` - ROLLING_X_OFFSET=5, ARENA_HALF_X=4.5, symmetric Z bounds
- `src/components/GoalRow.tsx` - ROW_X_OFFSET=-4, getSlotX includes offset, PROFILE_X_OFFSET=0.10
- `src/components/Scene.tsx` - Player row Z positions, profile group positions, floor/divider layout
- `src/components/PlayerRow.tsx` - Uses updated getSlotX for left-half positioning
- `src/components/PlayerProfileGroup.tsx` - Scale uses short axis for landscape
- `src/components/DicePool.tsx` - Spawn grid uses ROLLING_X_OFFSET for right-half positioning
- `src/components/SpawningDie.tsx` - Arc height: sin(t*pi) * DIE_SIZE * 0.9
- `src/components/AnimatingDie.tsx` - Arc height: sin(t*pi) * DIE_SIZE * 1.2
- `src/components/MitosisDie.tsx` - Arc height: sin(t*pi) * DIE_SIZE * 1.2, shake amplitude scaled
- `src/utils/clearSpot.ts` - Bounds updated for right-side rolling area

## Decisions Made
- Left/right split replaces vertical stack — gives each half dedicated screen real estate
- DIE_SIZE hardcoded at 0.8, decoupled from arena width — simpler, more predictable
- Divider line at X=0 provides subtle visual separation between halves

## Deviations from Plan

### Layout Pivot (Muzzy-directed)
- **Original plan:** Vertical stack with compressed Z-spacing (rows above rolling area)
- **Actual:** Left/right split with rows on left half, rolling on right half
- **Reason:** Muzzy proposed during checkpoint review — better use of landscape width
- **Impact:** Additional constants (ROW_X_OFFSET, ROLLING_X_OFFSET), wider arena, but cleaner separation of concerns

## Visual Verification (2026-03-25)

Checkpoint verified via Playwright at 844x390 (landscape phone viewport):
- Goal row renders at top-left with white locked dice filling slots
- Player rows stack below with correct colored dice
- Profile icons aligned on left edge
- Rolling area contained in right half — dice spawn, settle, and stay within walls
- Lock animations fly dice from rolling area to correct goal row slots
- AI unlock/re-roll cycles working (mitosis animations confirmed)
- No visual overlap between rows and rolling area

**Known non-blockers (Phase 37+ scope):**
- "Round" label clipped behind star icon (HUD positioning)
- HUD elements still portrait-centered (Phase 37)

## Next Phase Readiness
- Phase 36 complete — full 3D scene renders correctly in landscape
- Ready for Phase 37: Game HUD Redesign (buttons, status, notifications for landscape)

---
*Phase: 36-3d-scene-rework*
*Completed: 2026-03-25*
