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

### ISS-003: Online players see different goal dice — FIXED (server-generated goalValues)

- **Discovered:** Phase 15 Task 3 checkpoint (2026-03-03)
- **Status:** CLOSED — fixed in commit e5b0e8f (server generates goalValues in game_starting)

### ISS-004: Online game rolls not synced — each client rolls independently

- **Discovered:** Phase 15 Task 3 checkpoint (2026-03-03)
- **Type:** Multiplayer sync (architectural)
- **Description:** After game_starting, each client runs a fully local game — rolls are random per-device, AI decisions are independent, lock results diverge immediately. The lobby + shared goals create the illusion of multiplayer, but actual gameplay is not synced. Fixing this requires server-authoritative rolls or a shared PRNG seed, plus a state sync protocol so all clients see the same game state.
- **Impact:** High (online games diverge after first roll)
- **Effort:** Large — core Phase 16 (State Sync Protocol) scope
- **Suggested phase:** Phase 16

### ISS-005: Dice can intersect and get permanently stuck (never settle)

- **Discovered:** Phase 17 Task 4 checkpoint (2026-03-04)
- **Type:** Physics edge case
- **Description:** Two dice can clip into each other and become stuck, oscillating forever. Physics reports them as never settling, so the game appears permanently in "rolling" state. Related to ISS-002 (canting). Fix options: (a) timeout — if dice don't settle within N seconds, force-read faces or re-roll stuck dice, (b) detect overlapping dice and give separation impulse, (c) reduce restitution to minimize bounce energy.
- **Impact:** Low (rare, but game-breaking when it happens)
- **Effort:** Medium
- **Suggested phase:** Same fix pass as ISS-001/ISS-002

### BUG-002: Online reveal buffering broken — data loss in setRollResults

- **Priority:** P0 — breaks online multiplayer
- **Discovered:** 2026-03-04 during 18-02 checkpoint testing
- **Status:** FIXED — commit 45316e2
- **Reported by:** User (multiple symptoms in one session)

#### Symptoms Observed

1. **P2 sees P1's locks before P2 has rolled** — lock reveals supposed to buffer until local player rolls, but appear immediately
2. **AI lock dice don't animate on P1's screen** — sometimes "just appear" instead of profile-emerge animation
3. **AI unlock dice show value 1** — all AI dice animating out display as 1 instead of their actual value
4. **Game freeze** — game stuck after a lock at score 5,0,8,0 (deferred phase_change polling forever)

#### Root Cause: `setRollResults` wiped buffered reveals (gameStore.ts)

`setRollResults` included `pendingLockReveals: []` and `pendingUnlockReveals: []` in its `set()` call. Timeline:

1. P1 settles → server relays P1's lock results to P2
2. P2 hasn't rolled yet → result buffered in `pendingLockReveals`
3. P2 rolls → physics settle → `setRollResults` fires
4. **`pendingLockReveals: []` wipes the buffer** → P1's results lost
5. `hasLocalPlayerLocked` set to `true` (if local player locked) → no buffering gate
6. Any future reveals from P1 apply immediately (no buffer = instant reveal)

**Secondary bug:** `applyOtherPlayerUnlockReveal` used `lockedEntry?.value ?? 1` — when lock reveals were lost (Bug A), bot `lockedDice` was empty in store, so all unlock animations showed face value 1.

**Tertiary bug:** Deferred phase polling (`deferredPhaseInterval`) had no safety timeout. If stale animation state blocked clearing, the interval polled forever → game freeze.

#### Fixes Applied (commit 45316e2)

| Fix | File | Change |
|-----|------|--------|
| Stop clearing buffers in setRollResults | `gameStore.ts` | Removed `pendingLockReveals: []` and `pendingUnlockReveals: []` from `set()` call. Buffers now only clear in `initRound` (new round) and `flushPending*` (when applied). |
| Smart unlock value fallback | `gameStore.ts` | Changed `?? 1` to `?? goalValues[slotIndex] ?? 1` — locks always match their goal slot. |
| Deferred phase safety timeout | `useOnlineGame.ts` | Added 5s timeout that force-clears stale animations and applies the phase change. |

#### Investigation Note

Initial theory blamed `lerpExpectedCount` refs in Scene.tsx not resetting between rounds. This was **incorrect** — `handleAllSettled` (Scene.tsx:136-139) DOES reset all refs to 0 before each roll. The actual root cause was the data-clearing in setRollResults.

#### Related Issues
- BUG-001 (canted dice) — separate issue, unrelated

---

## Closed Enhancements

[Moved here when addressed]
