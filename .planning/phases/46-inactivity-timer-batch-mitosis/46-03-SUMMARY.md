---
phase: 46-inactivity-timer-batch-mitosis
plan: 03
subsystem: ui
tags: [hud, cleanup, mitosis, timer, cap, settle, animation]

requires:
  - phase: 46-inactivity-timer-batch-mitosis
    provides: inactivity timer, batch mitosis, handleUnlockTimerExpire
provides:
  - UNLOCK/SKIP button removed
  - Old tap-to-select code cleaned up
  - In-place mitosis with clear split targets
  - Drop snap to nearest clear position with arc-lerp
  - Auto-commit mid-drag on timer expire
  - Active velocity settle detection
  - 12-die cap fix for committed unlocks
  - AI unlock flash fix (atomic state update)
affects: [47-online-integration, 48-polish]

tech-stack:
  added: []
  patterns: [active-velocity-settle, atomic-ai-unlock-clear, in-place-mitosis, drop-snap-arc-lerp]

key-files:
  modified:
    - src/components/HUD.tsx
    - src/components/PlayerRow.tsx
    - src/components/Scene.tsx
    - src/components/MitosisDie.tsx
    - src/components/PhysicsDie.tsx
    - src/components/DicePool.tsx
    - src/components/CommittedDie.tsx
    - src/store/gameStore.ts
    - src/utils/dropZone.ts
    - src/App.tsx
    - src/types/game.ts

key-decisions:
  - "In-place mitosis: skip LERP+SHAKE, straight to split (0.4s)"
  - "Drop clearance 2.0x die size for mitosis room + wall padding 1.2"
  - "Split targets checked against occupied + bounds before choosing angle"
  - "Active velocity check (speed < 0.5 after 500ms) bypasses slow Rapier onSleep"
  - "processAIUnlocks(true) combines state + animation clear atomically"
  - "12-die cap: poolSize + lockedDice + committedUnlocks*2 + 1 <= 12"

patterns-established:
  - "getSpeed() on PhysicsDie for active settle detection"
  - "processAIUnlocks(andClearAnimations) for atomic cleanup"

issues-created: []

duration: ~60min
completed: 2026-03-29
---

# Phase 46 Plan 03: HUD Cleanup + Full UAT Summary

**Removed UNLOCK/SKIP button, cleaned tap-to-select code, extensive UAT-driven polish: in-place mitosis, drop snap, cap fix, settle speed, AI flash fix**

## Performance

- **Duration:** ~60 min (extensive UAT iteration)
- **Tasks:** 2 auto + 1 checkpoint + 12 UAT fix iterations
- **Files modified:** 11

## Accomplishments
- UNLOCK/SKIP button removed, status text updated for drag unlock
- Old tap-to-select dead code removed (onToggle, handleToggleUnlock, shakingSlot)
- In-place mitosis: skip LERP+SHAKE, straight to 0.4s split
- Drop position snaps to nearest clear spot with arc-lerp hop animation
- Split targets use angle-checked clearance against occupied dice + wall bounds
- Auto-commit mid-drag die when timer expires
- Active velocity settle detection (getSpeed < 0.5 after 500ms)
- 12-die cap correctly accounts for committed unlocks producing 2 dice each
- AI unlock flash eliminated via atomic processAIUnlocks(true)
- AI unlock dice show correct face rotation during animation

## Task Commits

1. **Task 1: Remove UNLOCK/SKIP + update status** - `3ac0c53` (refactor)
2. **Task 2: Clean old tap-to-select code** - `cd3cb92` (refactor)
3. **Fix: 3s timer + timer flash** - `c0e003d`
4. **Fix: in-place mitosis, release momentum, drag height, drop snap** - `6c1e03c`
5. **Fix: auto-commit mid-drag, text flash, raise drag, snap clear** - `15043f1`
6. **Fix: arc-lerp + mitosis split overlap** - `6559d80`
7. **Fix: findClearSpot for splits** - `4ef5a8c`
8. **Fix: drop clearance + local offsets** - `96e9fdd`
9. **Fix: angle-checked split clearance** - `d5fbcae`
10. **Fix: skip shake for in-place** - `30efbf6`
11. **Fix: wall bounds for splits + drops** - `0c15a40`
12. **Fix: T# count + damping revert + settle speed** - `83f56a3`
13. **Fix: 12-die cap** - `5842c12`
14. **Fix: active velocity settle** - `a9d0889`, `7a9eb6a`
15. **Fix: AI unlock flash** - `bf42ef0`, `3645985`
16. **Fix: AI unlock face rotation** - `9e8b6b1`

## Next Phase Readiness
- Phase 46 complete: full offline drag-to-unlock flow working
- Online play still uses old tap-to-select flow (Phase 47)
- Ready for Phase 47: Online Play Integration

---
*Phase: 46-inactivity-timer-batch-mitosis*
*Completed: 2026-03-29*
