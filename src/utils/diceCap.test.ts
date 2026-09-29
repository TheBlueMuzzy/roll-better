import { describe, it, expect } from 'vitest';
import { totalDiceAfterUnlocks, maxUnlocksAllowed, unlocksLeft, isAtDiceCap, MAX_DICE } from './diceCap';

// F47 — the server's cap only looked at the pool ((12 − pool) / 2), the phone counted
// pool + locked + 2 per unlock. Now both use these helpers.
describe('totalDiceAfterUnlocks', () => {
  it('each unlock adds one die overall (leaves its slot, comes back as two)', () => {
    expect(totalDiceAfterUnlocks(4, 3, 0)).toBe(7);
    expect(totalDiceAfterUnlocks(4, 3, 1)).toBe(8);
    expect(totalDiceAfterUnlocks(4, 3, 3)).toBe(10);
  });
});

describe('maxUnlocksAllowed — 12-dice cap (phone and server)', () => {
  it('counts locked dice too — pool 2 + 7 locked may unlock 3 (old server rule said 5)', () => {
    expect(maxUnlocksAllowed(2, 7)).toBe(3);
  });

  it('never more than the dice you have locked', () => {
    expect(maxUnlocksAllowed(0, 3)).toBe(3);
  });

  it('no room left → 0, never negative', () => {
    expect(maxUnlocksAllowed(10, 2)).toBe(0);
    expect(maxUnlocksAllowed(12, 1)).toBe(0);
    expect(maxUnlocksAllowed(12, 0)).toBe(0);
  });

  it('unlocking the max keeps you at 12 or fewer; one more would go over', () => {
    for (let pool = 0; pool <= 12; pool++) {
      for (let locked = 0; locked <= 7; locked++) {
        const max = maxUnlocksAllowed(pool, locked);
        if (pool + locked <= MAX_DICE) {
          expect(totalDiceAfterUnlocks(pool, locked, max)).toBeLessThanOrEqual(MAX_DICE);
        }
        if (max < locked && pool + locked < MAX_DICE) {
          expect(totalDiceAfterUnlocks(pool, locked, max + 1)).toBeGreaterThan(MAX_DICE);
        }
      }
    }
  });
});

// F48 — at the cap the locked dice show dimmed, so the player can see why they won't move
describe('unlocksLeft / isAtDiceCap — the dimmed-dice signal', () => {
  it('counts the dice already dragged out this turn', () => {
    // pool 2 + 7 locked at the start may unlock 3; after dragging 2 out, 1 is left
    expect(unlocksLeft(2, 5, 2)).toBe(1);
    expect(isAtDiceCap(2, 5, 2)).toBe(false);
  });

  it('at the cap once the last allowed die is dragged out', () => {
    expect(unlocksLeft(2, 4, 3)).toBe(0);
    expect(isAtDiceCap(2, 4, 3)).toBe(true);
  });

  it('already at 12 dice before dragging anything: every locked die is dimmed', () => {
    expect(isAtDiceCap(6, 6, 0)).toBe(true);
  });

  it('no locked dice left: nothing to dim', () => {
    expect(isAtDiceCap(12, 0, 0)).toBe(false);
  });
});
