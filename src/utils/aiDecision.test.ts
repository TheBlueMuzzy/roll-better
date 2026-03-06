import { describe, it, expect } from 'vitest';
import { getAIUnlockDecision, randomDifficulty } from './aiDecision';
import type { AIDecisionInput } from './aiDecision';
import type { LockedDie } from '../types/game';

// Helper: build a standard goal (sorted)
const standardGoal = [1, 1, 2, 2, 3, 4, 5, 6];

// Helper: build locked dice from slot indices and values
function makeLocked(pairs: [number, number][]): LockedDie[] {
  return pairs.map(([goalSlotIndex, value]) => ({ goalSlotIndex, value }));
}

// ─── UNIVERSAL CONSTRAINTS ─────────────────────────────────────

describe('getAIUnlockDecision — universal constraints', () => {
  it('must-unlock: returns at least 1 slot when poolSize=0 and locked<8 (easy)', () => {
    const input: AIDecisionInput = {
      goalValues: standardGoal,
      lockedDice: makeLocked([[0, 1], [1, 1], [2, 2], [3, 2]]),
      poolSize: 0,
      difficulty: 'easy',
    };
    const result = getAIUnlockDecision(input);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('must-unlock: returns at least 1 slot when poolSize=0 and locked<8 (medium)', () => {
    const input: AIDecisionInput = {
      goalValues: standardGoal,
      lockedDice: makeLocked([[0, 1], [1, 1], [2, 2], [3, 2]]),
      poolSize: 0,
      difficulty: 'medium',
    };
    const result = getAIUnlockDecision(input);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('must-unlock: returns at least 1 slot when poolSize=0 and locked<8 (hard)', () => {
    const input: AIDecisionInput = {
      goalValues: standardGoal,
      lockedDice: makeLocked([[0, 1], [1, 1], [2, 2], [3, 2]]),
      poolSize: 0,
      difficulty: 'hard',
    };
    const result = getAIUnlockDecision(input);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('12-die cap: returns empty when poolSize=10 and 2 locked (unlock would exceed 12)', () => {
    const input: AIDecisionInput = {
      goalValues: standardGoal,
      lockedDice: makeLocked([[0, 1], [1, 1]]),
      poolSize: 10,
      difficulty: 'medium',
    };
    const result = getAIUnlockDecision(input);
    expect(result).toEqual([]);
  });

  it('12-die cap: poolSize=12 returns empty even with locked dice', () => {
    const input: AIDecisionInput = {
      goalValues: standardGoal,
      lockedDice: makeLocked([[0, 1], [1, 1], [2, 2]]),
      poolSize: 12,
      difficulty: 'hard',
    };
    const result = getAIUnlockDecision(input);
    expect(result).toEqual([]);
  });

  it('no locked dice: returns empty (nothing to unlock)', () => {
    const input: AIDecisionInput = {
      goalValues: standardGoal,
      lockedDice: [],
      poolSize: 4,
      difficulty: 'medium',
    };
    const result = getAIUnlockDecision(input);
    expect(result).toEqual([]);
  });

  it('all 8 locked (game won): returns empty', () => {
    const input: AIDecisionInput = {
      goalValues: standardGoal,
      lockedDice: makeLocked([
        [0, 1], [1, 1], [2, 2], [3, 2],
        [4, 3], [5, 4], [6, 5], [7, 6],
      ]),
      poolSize: 0,
      difficulty: 'hard',
    };
    const result = getAIUnlockDecision(input);
    expect(result).toEqual([]);
  });

  it('returned indices are valid goalSlotIndices from lockedDice', () => {
    const input: AIDecisionInput = {
      goalValues: standardGoal,
      lockedDice: makeLocked([[0, 1], [2, 2], [4, 3]]),
      poolSize: 0,
      difficulty: 'medium',
    };
    const result = getAIUnlockDecision(input);
    const validIndices = input.lockedDice.map(d => d.goalSlotIndex);
    for (const idx of result) {
      expect(validIndices).toContain(idx);
    }
  });

  it('never returns duplicate indices', () => {
    const input: AIDecisionInput = {
      goalValues: standardGoal,
      lockedDice: makeLocked([[0, 1], [1, 1], [2, 2], [3, 2], [4, 3]]),
      poolSize: 0,
      difficulty: 'medium',
    };
    const result = getAIUnlockDecision(input);
    const unique = new Set(result);
    expect(unique.size).toBe(result.length);
  });

  it('12-die cap: respects cap even in must-unlock with poolSize=0 and poolSize+unlocks*2<=12', () => {
    // poolSize=0, 6 locked → can unlock up to 6 (0+6*2=12). Should not exceed.
    const input: AIDecisionInput = {
      goalValues: standardGoal,
      lockedDice: makeLocked([[0, 1], [1, 1], [2, 2], [3, 2], [4, 3], [5, 4]]),
      poolSize: 0,
      difficulty: 'medium',
    };
    const result = getAIUnlockDecision(input);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(input.poolSize + result.length * 2).toBeLessThanOrEqual(12);
  });
});

// ─── RANDOM DIFFICULTY ────────────────────────────────────────

describe('randomDifficulty', () => {
  it('returns only valid difficulty values and covers at least 2 of 3', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const d = randomDifficulty();
      expect(['easy', 'medium', 'hard']).toContain(d);
      seen.add(d);
    }
    expect(seen.size).toBeGreaterThanOrEqual(2);
  });
});

// ─── EASY STRATEGY ─────────────────────────────────────────────

describe('getAIUnlockDecision — easy strategy', () => {
  it('returns 0 or 1 slots (never more than 1)', () => {
    const input: AIDecisionInput = {
      goalValues: standardGoal,
      lockedDice: makeLocked([[0, 1], [2, 2], [4, 3]]),
      poolSize: 4,
      difficulty: 'easy',
    };

    // Run multiple times to account for randomness
    for (let i = 0; i < 50; i++) {
      const result = getAIUnlockDecision(input);
      expect(result.length).toBeLessThanOrEqual(1);
    }
  });

  it('sometimes skips (returns empty) and sometimes unlocks (40% unlock rate)', () => {
    const input: AIDecisionInput = {
      goalValues: standardGoal,
      lockedDice: makeLocked([[0, 1], [2, 2], [4, 3]]),
      poolSize: 4,
      difficulty: 'easy',
    };

    let unlockCount = 0;
    const iterations = 200;
    for (let i = 0; i < iterations; i++) {
      const result = getAIUnlockDecision(input);
      if (result.length > 0) unlockCount++;
    }

    // 40% rate → expect between 15% and 65% (generous margin for randomness)
    const rate = unlockCount / iterations;
    expect(rate).toBeGreaterThan(0.15);
    expect(rate).toBeLessThan(0.65);
  });

  it('must-unlock overrides skip chance', () => {
    const input: AIDecisionInput = {
      goalValues: standardGoal,
      lockedDice: makeLocked([[0, 1], [2, 2]]),
      poolSize: 0,
      difficulty: 'easy',
    };

    // Must always return at least 1 when must-unlock applies
    for (let i = 0; i < 20; i++) {
      const result = getAIUnlockDecision(input);
      expect(result.length).toBe(1);
    }
  });
});

// ─── MEDIUM STRATEGY ───────────────────────────────────────────

describe('getAIUnlockDecision — medium strategy', () => {
  it('unlocks 1-2 when pool too small for remaining slots (poolSize=1, 5 locked, 3 remaining)', () => {
    // 5 locked, 3 remaining goal slots → poolSize(1) < remainingSlots(3)/2 = 1.5 → unlock
    const input: AIDecisionInput = {
      goalValues: standardGoal,
      lockedDice: makeLocked([[0, 1], [1, 1], [2, 2], [3, 2], [4, 3]]),
      poolSize: 1,
      difficulty: 'medium',
    };
    const result = getAIUnlockDecision(input);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it('skips when pool is large enough (poolSize=6, 2 locked, 6 remaining)', () => {
    // 2 locked, 6 remaining → poolSize(6) >= remainingSlots(6)/2 = 3 → skip
    const input: AIDecisionInput = {
      goalValues: standardGoal,
      lockedDice: makeLocked([[0, 1], [1, 1]]),
      poolSize: 6,
      difficulty: 'medium',
    };
    const result = getAIUnlockDecision(input);
    expect(result).toEqual([]);
  });

  it('never unlocks more than 2', () => {
    const input: AIDecisionInput = {
      goalValues: standardGoal,
      lockedDice: makeLocked([[0, 1], [1, 1], [2, 2], [3, 2], [4, 3]]),
      poolSize: 0,
      difficulty: 'medium',
    };
    const result = getAIUnlockDecision(input);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it('picks dice whose values appear MOST frequently in remaining goal', () => {
    // Goal: [1,1,3,3,3,3,5,6], locked: slot 0 (val 1), slot 6 (val 5)
    // Remaining goal values: 1,3,3,3,3,6 → 3 appears 4x, 1 appears 1x, 6 appears 1x
    // Locked dice: slot 0 has value 1 (appears 1x in remaining), slot 6 has value 5 (appears 0x in remaining)
    // Should prefer unlocking slot 0 (value 1) or more ideally neither since they don't appear much...
    // Actually: "picks dice whose values appear MOST frequently" = unlock dice whose values
    // are most common in remaining goal = good candidates to re-roll and match
    // Locked slot 0 value=1: 1 appears 1x in remaining
    // Locked slot 6 value=5: 5 appears 0x in remaining (already locked)
    // Actually let me rethink: it should pick locked dice whose values appear most in remaining goal
    // Wait, the spec says "Picks dice whose values appear MOST frequently in remaining goal (maximize match probability after unlock)"
    // So if we unlock a die with value X, and X appears a lot in the remaining goal,
    // we're giving up a guaranteed match for X but gaining 2 dice that could match other things.
    // The idea is: unlock values that are already well-represented (easy to re-match).

    // Better test: goal [2,2,2,2,4,4,5,6], locked: slot 0(val2), slot 4(val4)
    // Remaining: slots 1,2,3(val2), slot5(val4), slot6(val5), slot7(val6)
    // Remaining values: 2,2,2,4,5,6. Value 2 appears 3x, value 4 appears 1x
    // Locked die at slot 0 has value 2 (appears 3x in remaining) → high frequency
    // Locked die at slot 4 has value 4 (appears 1x in remaining) → low frequency
    // Medium should prefer unlocking slot 0 (value 2) because 2 is most frequent in remaining
    const input: AIDecisionInput = {
      goalValues: [2, 2, 2, 2, 4, 4, 5, 6],
      lockedDice: makeLocked([[0, 2], [4, 4]]),
      poolSize: 0, // force must-unlock
      difficulty: 'medium',
    };
    const result = getAIUnlockDecision(input);
    expect(result.length).toBeGreaterThanOrEqual(1);
    // Should include slot 0 (value 2, most frequent in remaining)
    expect(result).toContain(0);
  });

  it('must-unlock works with medium strategy', () => {
    const input: AIDecisionInput = {
      goalValues: standardGoal,
      lockedDice: makeLocked([[0, 1], [2, 2]]),
      poolSize: 0,
      difficulty: 'medium',
    };
    const result = getAIUnlockDecision(input);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── HARD STRATEGY ─────────────────────────────────────────────

describe('getAIUnlockDecision — hard strategy', () => {
  it('returns empty when near completion (<=2 remaining slots)', () => {
    // 6 locked → 2 remaining. Hard never unlocks when <=2 remaining.
    const input: AIDecisionInput = {
      goalValues: standardGoal,
      lockedDice: makeLocked([
        [0, 1], [1, 1], [2, 2], [3, 2], [4, 3], [5, 4],
      ]),
      poolSize: 2,
      difficulty: 'hard',
    };
    const result = getAIUnlockDecision(input);
    expect(result).toEqual([]);
  });

  it('unlocks when expected match rate is poor (6 remaining, poolSize=2)', () => {
    // 2 locked, 6 remaining, only 2 dice → poor match rate → should unlock
    const input: AIDecisionInput = {
      goalValues: standardGoal,
      lockedDice: makeLocked([[0, 1], [1, 1]]),
      poolSize: 2,
      difficulty: 'hard',
    };
    const result = getAIUnlockDecision(input);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('picks dice whose values appear LEAST in remaining goal (sacrifice low-probability)', () => {
    // Goal: [2,2,2,2,4,4,5,6], locked: slot 0(val2), slot 4(val4), slot 6(val5)
    // Remaining: slots 1,2,3(val2), slot5(val4), slot7(val6)
    // Remaining values: 2,2,2,4,6 → val2=3x, val4=1x, val6=1x
    // Locked values: 2(3x in remaining), 4(1x in remaining), 5(0x in remaining)
    // Hard should prefer unlocking slot 6 (value 5, least frequent=0) first
    const input: AIDecisionInput = {
      goalValues: [2, 2, 2, 2, 4, 4, 5, 6],
      lockedDice: makeLocked([[0, 2], [4, 4], [6, 5]]),
      poolSize: 0, // force must-unlock
      difficulty: 'hard',
    };
    const result = getAIUnlockDecision(input);
    expect(result.length).toBeGreaterThanOrEqual(1);
    // Should include slot 6 (value 5, least frequent = 0 in remaining)
    expect(result).toContain(6);
  });

  it('skips when pool is adequate and remaining slots > 2', () => {
    // 3 locked, 5 remaining slots, poolSize=6
    // Expected matches per roll: 6 dice, 5 of 6 goal values needed = decent match rate
    // Each die has ~5/6 chance of being useful... actually let's calculate:
    // Remaining values from [1,1,2,2,3,4,5,6] with [0,1],[1,1],[2,2] locked:
    // Remaining: 2,3,4,5,6 → 5 unique out of 6 faces → each die matches with prob 5/6
    // Expected matches = 6 * (5/6) = 5 → match rate = 5/6 ≈ 0.83 > 0.5 → skip
    const input: AIDecisionInput = {
      goalValues: standardGoal,
      lockedDice: makeLocked([[0, 1], [1, 1], [2, 2]]),
      poolSize: 6,
      difficulty: 'hard',
    };
    const result = getAIUnlockDecision(input);
    expect(result).toEqual([]);
  });

  it('must-unlock overrides near-completion guard', () => {
    // 6 locked, 2 remaining, poolSize=0 → must-unlock even though near completion
    const input: AIDecisionInput = {
      goalValues: standardGoal,
      lockedDice: makeLocked([
        [0, 1], [1, 1], [2, 2], [3, 2], [4, 3], [5, 4],
      ]),
      poolSize: 0,
      difficulty: 'hard',
    };
    const result = getAIUnlockDecision(input);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('unlocks minimum needed to improve expected match rate', () => {
    // Make sure hard doesn't over-unlock — should be conservative
    const input: AIDecisionInput = {
      goalValues: standardGoal,
      lockedDice: makeLocked([[0, 1], [1, 1], [2, 2], [3, 2]]),
      poolSize: 2,
      difficulty: 'hard',
    };
    // 4 locked, 4 remaining, poolSize=2
    // Should unlock some but not all
    const result = getAIUnlockDecision(input);
    // Hard is conservative — should unlock 1-2 at most in this scenario
    expect(result.length).toBeLessThanOrEqual(3);
  });
});
