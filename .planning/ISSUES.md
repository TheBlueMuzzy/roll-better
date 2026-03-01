# Project Issues Log

Enhancements discovered during execution. Not critical - address in future phases.

---

## P0 Bugs

### BUG-001: Dice matching goal slots don't all lock — some matches silently dropped

- **Priority:** P0 — blocks gameplay
- **Discovered:** 2026-03-01 during 05-04 checkpoint 3 testing (build v0.1.0.51)
- **Status:** OPEN — investigation complete, fix pending
- **Reported by:** User (3 separate occurrences)

#### Reproduction Reports

1. **Report 1:** Rolled two 1s. Three 1s in goal. Only one 1 locked.
2. **Report 2:** Rolled five 1s (after unlock). Only one 1 locked.
3. **Report 3:** Rolled two 6s. Two 6s in goal. Only one 6 locked.

All occurrences: some matching dice silently ignored, no error in console.

#### Investigation Summary

**Pure logic — VERIFIED CORRECT:**
- `findAutoLocks()` in `src/utils/matchDetection.ts` — tested with 7 unit tests, all pass
- Logic: iterates rolledValues, for each finds first available goal slot with matching value
- Test: `findAutoLocks([1,1,1,2,3,4,5,6], [1,1], [])` correctly returns 2 locks
- Stress test: 10 automated rolls via Playwright all locked correctly
- **Conclusion:** The logic is not the bug. The inputs to the logic are wrong.

**Face detection — LIKELY CULPRIT:**
- `getFaceUp()` in `src/utils/diceUtils.ts` — dot product of rotated face normals vs world up
- Returns face with highest dot product
- Added confidence check: warns when bestDot < 0.85 (~32° from flat)
- **Hypothesis:** If a die is slightly tilted/canted (leaning against wall or another die), getFaceUp may read the WRONG face value. The die shows "6" to the player but getFaceUp reads "3" because the normal isn't aligned with world up.
- This would explain the symptom perfectly: die visually shows a matching value, but getFaceUp reports a different value → findAutoLocks doesn't see a match → die doesn't lock.

**Settle detection — POSSIBLE CONTRIBUTOR:**
- `PhysicsDie.tsx` uses Rapier onSleep/onWake events
- `DicePool.tsx` tracks per-die settled booleans with onUnsettled callback
- If die A bumps die B after B settled, B fires onUnsettled then re-settles
- **Risk:** If bump causes B to shift slightly, the re-read might get a different face value
- **Risk:** hasFired guard could prevent re-firing if one die settles before others unsettled

**@react-three/rapier callbacks — VERIFIED OK:**
- Callbacks use useEffect with dependency arrays, not stale closures
- With stable keys (key={i}), components don't remount, refs stay valid

**PlayerRow display — VERIFIED OK:**
- Just renders lockedDice from store, doesn't affect locking logic

#### Root Cause Hypotheses (ranked by likelihood)

1. **getFaceUp misread (HIGH):** Die is slightly tilted (canted against wall/other die). Player sees "6" from above but the normal calculation returns a different face because no face is cleanly aligned with world up. ISS-002 is related — canting is a known issue.

2. **Settle timing race (MEDIUM):** Die A settles → reports value → Die B bumps Die A → Die A unsettles → Die A re-settles with same or different value → but the "all settled" callback already fired with incomplete/wrong results from the first settle pass.

3. **Results array corruption (LOW):** DicePool's results.current array might have stale entries from a previous roll if the array isn't fully reset. The incremental array management (for stable keys) could leave old values in slots.

4. **Pool count desync (LOW):** Player.poolSize might not match the actual number of PhysicsDie components rendered, causing DicePool to report fewer results than expected.

#### Diagnostic Logging Currently In Place (commit b5439c9)

These console.log statements are already in the code to catch the bug on next occurrence:

**DicePool.tsx:**
```
[DicePool] Die {i} settled → face {value} (settled: TRUE,false,false,...)
[DicePool] Die {i} UNSETTLED (bumped)
[DicePool] ALL SETTLED → results: [1,6,3,...] count: N
[DicePool] Count change: N → M
```

**gameStore.ts (setRollResults):**
```
[setRollResults] goal=[1,1,1,2,3,4,5,6] rolled=[1,6] existingLocks=3 newLocks=1
  details=[slot0=val1] pool: 2 → 1
```

**diceUtils.ts (getFaceUp):**
```
[getFaceUp] LOW CONFIDENCE: face=3 dot=0.742 — die may be canted
```

#### Key Files

| File | Role | Status |
|------|------|--------|
| `src/utils/matchDetection.ts` | Pure lock logic | Verified correct |
| `src/utils/matchDetection.test.ts` | 7 unit tests | All pass |
| `src/utils/diceUtils.ts` | getFaceUp + getFaceUpRotation | Suspect #1 — confidence logging added |
| `src/components/PhysicsDie.tsx` | Individual die physics + settle events | Suspect #2 — settle timing |
| `src/components/DicePool.tsx` | Pool management + all-settled callback | Suspect #2 — results aggregation |
| `src/store/gameStore.ts` | setRollResults consumes roll data | Diagnostic logging added |
| `src/components/Die3D.tsx` | Visual die (face layout) | Verified matches FACE_NORMALS |

#### What To Fix

**Approach A — Robust face reading (fixes hypothesis #1):**
- In getFaceUp, if bestDot < 0.85, re-read after a short delay or nudge the die
- Or: lower the confidence threshold and accept slightly tilted reads
- Or: detect canted dice and give them a physics impulse to settle flat (also fixes ISS-002)

**Approach B — Settle hardening (fixes hypothesis #2):**
- After ALL dice report settled, wait an extra 100-200ms safety window
- If any die unsettles during the window, reset and wait again
- Only fire onAllSettled after the safety window passes clean

**Approach C — Both (recommended):**
- Implement both A and B for defense in depth
- A prevents wrong face reads, B prevents timing races

#### Related Issues
- ISS-002 (dice canting against walls) — directly causes hypothesis #1
- ISS-001 (settle detection slow) — conflicts with approach B (adding delay makes it worse)
- ISS-003 (cosmetic wrong faces after lock) — separate issue, cosmetic only

#### Commits From Investigation
- `24f6e38` — fix(05-04): stable dice keys + unlock dice show correct face
- `b5439c9` — chore(05-04): add diagnostic logging for settle + lock pipeline

---

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
