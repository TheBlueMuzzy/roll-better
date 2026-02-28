# Project Issues Log

Enhancements discovered during execution. Not critical - address in future phases.

## Open Enhancements

### ISS-001: Settle detection feels slow — number takes too long to appear

- **Discovered:** Phase 3 Task 3 checkpoint (2026-02-28)
- **Type:** UX
- **Description:** After the die stops visually moving, there's a noticeable delay before the result number appears. This is because Rapier's sleep detection uses conservative velocity thresholds — the die looks settled but hasn't triggered onSleep yet. Could tune `linearSleepThreshold` / `angularSleepThreshold` on the RigidBody, or implement a useFrame velocity check that fires earlier.
- **Impact:** Low (works correctly, just feels sluggish)
- **Effort:** Quick
- **Suggested phase:** Phase 3 (03-03 or patch)

### ISS-002: Dice can lean (cant) against boundary walls and fail to settle

- **Discovered:** Phase 4 Task 3 checkpoint (2026-02-28)
- **Type:** Physics edge case
- **Description:** A rolled die can end up leaning against the back wall OR against another die at an angle, unable to settle flat. Face detection can't determine the result because no face clearly points up. Options: (a) detect stuck/canted dice and give them a physics nudge, (b) add a timeout that re-rolls stuck dice, (c) add angled "kickout" colliders at wall bases to prevent leaning.
- **Impact:** Medium (blocks result detection for that die)
- **Effort:** Medium
- **Suggested phase:** Phase 6 (animation/polish) or dedicated fix

## Closed Enhancements

[Moved here when addressed]
