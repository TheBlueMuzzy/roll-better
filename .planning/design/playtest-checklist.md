# Roll Better — Playtest checklist
> Detail for GDD (and TDD §4 Tests) — keep in step with GDD.md. Moved out of the GDD 2026-09-28 (word for word).

## 9. Testing Strategy

### Manual Testing (every milestone)
- Play a full session (to 20 points) against AI
- Verify: scoring math is correct at every pool size
- Verify: handicap adjusts correctly every round
- Verify: Goal generation produces valid sorted dice
- Verify: lock-in limits are enforced (can't lock more than Goal count)
- Verify: bonus dice spawn correctly on unlock (mitosis animation)
- Verify: session ends at 20 points, correct winners shown
- Verify: must-unlock rule triggers when pool is 0
- Verify: 12-die cap prevents further unlocking

### Automated Tests
- `matchDetection.test.ts`: 7 unit tests for `findAutoLocks()` — Goal matching, slot limits, edge cases
- `aiDecision.test.ts`: Unit tests for AI unlock strategies at all difficulty levels

### Online Testing
- 2-player online: verified full session
- 2 humans + 2 bots: verified full session including host exit + Play Again
- Phase sync, deferred animations, scoring, session end: all verified
- **Needs testing**: 5-player game with multiple remaining humans hitting Play Again

### Device Testing
- Chrome desktop (primary dev)
- Safari iOS (iPhone) — touch interactions
- Chrome Android — touch interactions
