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

## Closed Enhancements

[Moved here when addressed]
