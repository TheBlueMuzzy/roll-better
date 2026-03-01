import { describe, it, expect } from 'vitest';
import { findAutoLocks } from './matchDetection';

describe('findAutoLocks', () => {
  // Case 1 — Basic matching, no existing locks
  it('matches rolled dice to available goal slots', () => {
    const goal = [1, 1, 2, 2, 3, 4, 5, 6];
    const rolled = [1, 3, 5];
    const locks = [];

    const result = findAutoLocks(goal, rolled, locks);

    expect(result).toEqual([
      { goalSlotIndex: 0, value: 1 },
      { goalSlotIndex: 4, value: 3 },
      { goalSlotIndex: 6, value: 5 },
    ]);
  });

  // Case 2 — Multiple dice matching same value
  it('fills multiple slots left-to-right when duplicates rolled', () => {
    const goal = [1, 1, 2, 2, 3, 4, 5, 6];
    const rolled = [2, 2, 2];
    const locks = [];

    const result = findAutoLocks(goal, rolled, locks);

    expect(result).toEqual([
      { goalSlotIndex: 2, value: 2 },
      { goalSlotIndex: 3, value: 2 },
    ]);
  });

  // Case 3 — Existing locks reduce available slots
  it('skips already-locked slots', () => {
    const goal = [1, 1, 2, 2, 3, 4, 5, 6];
    const rolled = [2, 2, 2];
    const locks = [{ goalSlotIndex: 2, value: 2 }];

    const result = findAutoLocks(goal, rolled, locks);

    expect(result).toEqual([
      { goalSlotIndex: 3, value: 2 },
    ]);
  });

  // Case 4 — No matches
  it('returns empty array when no matches found', () => {
    const goal = [1, 1, 2, 2, 3, 4, 5, 6];
    const rolled = [6, 6, 6];
    const locks = [{ goalSlotIndex: 7, value: 6 }];

    const result = findAutoLocks(goal, rolled, locks);

    expect(result).toEqual([]);
  });

  // Case 5 — Perfect match (fill remaining 6 slots)
  it('fills all remaining slots on a perfect roll', () => {
    const goal = [1, 1, 2, 2, 3, 4, 5, 6];
    const rolled = [1, 2, 3, 4, 5, 6];
    const locks = [
      { goalSlotIndex: 0, value: 1 },
      { goalSlotIndex: 2, value: 2 },
    ];

    const result = findAutoLocks(goal, rolled, locks);

    expect(result).toEqual([
      { goalSlotIndex: 1, value: 1 },
      { goalSlotIndex: 3, value: 2 },
      { goalSlotIndex: 4, value: 3 },
      { goalSlotIndex: 5, value: 4 },
      { goalSlotIndex: 6, value: 5 },
      { goalSlotIndex: 7, value: 6 },
    ]);
  });

  // Case 6 — Empty roll
  it('returns empty array for empty roll', () => {
    const goal = [1, 1, 2, 2, 3, 4, 5, 6];
    const rolled = [];
    const locks = [];

    const result = findAutoLocks(goal, rolled, locks);

    expect(result).toEqual([]);
  });

  // Case 7 — All slots already locked
  it('returns empty array when all goal slots are locked', () => {
    const goal = [1, 1, 2, 2, 3, 4, 5, 6];
    const rolled = [1, 2, 3];
    const locks = [
      { goalSlotIndex: 0, value: 1 },
      { goalSlotIndex: 1, value: 1 },
      { goalSlotIndex: 2, value: 2 },
      { goalSlotIndex: 3, value: 2 },
      { goalSlotIndex: 4, value: 3 },
      { goalSlotIndex: 5, value: 4 },
      { goalSlotIndex: 6, value: 5 },
      { goalSlotIndex: 7, value: 6 },
    ];

    const result = findAutoLocks(goal, rolled, locks);

    expect(result).toEqual([]);
  });
});
