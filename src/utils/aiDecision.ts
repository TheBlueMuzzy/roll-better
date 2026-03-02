import type { LockedDie, AIDifficulty } from '../types/game';

export type { AIDifficulty };

export interface AIDecisionInput {
  goalValues: number[];          // 8 sorted goal values
  lockedDice: LockedDie[];       // currently locked dice
  poolSize: number;              // current pool size
  difficulty: AIDifficulty;
}

// ─── Helpers ───────────────────────────────────────────────────

/** How many unlocks can we do without exceeding the 12-die cap? Each unlock adds 2 dice. */
function maxUnlocksForCap(poolSize: number): number {
  // poolSize + numUnlocks * 2 <= 12
  return Math.max(0, Math.floor((12 - poolSize) / 2));
}

/** Get the remaining (unmatched) goal values — the ones that still need to be rolled. */
function getRemainingGoalValues(goalValues: number[], lockedDice: LockedDie[]): number[] {
  const lockedSlots = new Set(lockedDice.map(d => d.goalSlotIndex));
  const remaining: number[] = [];
  for (let i = 0; i < goalValues.length; i++) {
    if (!lockedSlots.has(i)) {
      remaining.push(goalValues[i]);
    }
  }
  return remaining;
}

/** Count how many times each value appears in an array. Returns Map<value, count>. */
function countValues(values: number[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return counts;
}

/**
 * Estimate expected match efficiency per roll.
 * For each die in the pool, the probability of matching any remaining goal value
 * is (number of unique remaining values) / 6.
 * Expected matches = poolSize * (uniqueRemainingValues / 6), capped by remaining slots.
 * Match rate = expected matches / remaining slots (how fast can we fill remaining slots).
 */
function expectedMatchRate(poolSize: number, remainingGoalValues: number[]): number {
  if (poolSize === 0 || remainingGoalValues.length === 0) return 0;
  const uniqueRemaining = new Set(remainingGoalValues).size;
  const expectedMatches = poolSize * (uniqueRemaining / 6);
  return expectedMatches / remainingGoalValues.length; // efficiency relative to what's needed
}

// ─── Strategy functions ────────────────────────────────────────

function easyStrategy(
  lockedDice: LockedDie[],
  capLimit: number,
  mustUnlock: boolean
): number[] {
  if (capLimit === 0) return [];

  // Easy: 40% chance to unlock at all (unless must-unlock)
  if (!mustUnlock && Math.random() >= 0.4) {
    return [];
  }

  // Pick 1 random locked die
  const randomIndex = Math.floor(Math.random() * lockedDice.length);
  return [lockedDice[randomIndex].goalSlotIndex];
}

function mediumStrategy(
  lockedDice: LockedDie[],
  goalValues: number[],
  poolSize: number,
  capLimit: number,
  mustUnlock: boolean
): number[] {
  if (capLimit === 0) return [];

  const remainingValues = getRemainingGoalValues(goalValues, lockedDice);
  const remainingSlots = remainingValues.length;

  // Heuristic: unlock if poolSize < remainingSlots / 2 (or must-unlock)
  if (!mustUnlock && poolSize >= remainingSlots / 2) {
    return [];
  }

  // Score each locked die by how frequently its value appears in remaining goal
  // Higher frequency = better candidate (more likely to re-match after unlock)
  const remainingCounts = countValues(remainingValues);

  const scored = lockedDice.map(d => ({
    slotIndex: d.goalSlotIndex,
    value: d.value,
    frequency: remainingCounts.get(d.value) ?? 0,
  }));

  // Sort by frequency descending (most frequent first)
  scored.sort((a, b) => b.frequency - a.frequency);

  // Unlock 1-2 dice max, respecting cap
  const unlockCount = Math.min(2, capLimit, scored.length);

  // If must-unlock, ensure at least 1
  const finalCount = mustUnlock ? Math.max(1, unlockCount) : unlockCount;

  return scored.slice(0, finalCount).map(s => s.slotIndex);
}

function hardStrategy(
  lockedDice: LockedDie[],
  goalValues: number[],
  poolSize: number,
  capLimit: number,
  mustUnlock: boolean
): number[] {
  if (capLimit === 0) return [];

  const remainingValues = getRemainingGoalValues(goalValues, lockedDice);
  const remainingSlots = remainingValues.length;

  // Near completion guard: never unlock if <=2 remaining slots (unless must-unlock)
  if (!mustUnlock && remainingSlots <= 2) {
    return [];
  }

  // Calculate expected match rate with current pool
  const matchRate = expectedMatchRate(poolSize, remainingValues);

  // Only unlock when match rate is poor (< 0.5) or must-unlock
  if (!mustUnlock && matchRate >= 0.5) {
    return [];
  }

  // Score each locked die by how frequently its value appears in remaining goal
  // Lower frequency = better candidate for sacrifice (least likely to re-match)
  const remainingCounts = countValues(remainingValues);

  const scored = lockedDice.map(d => ({
    slotIndex: d.goalSlotIndex,
    value: d.value,
    frequency: remainingCounts.get(d.value) ?? 0,
  }));

  // Sort by frequency ascending (least frequent first = sacrifice candidates)
  scored.sort((a, b) => a.frequency - b.frequency);

  // Unlock minimum needed to improve match rate above 0.5
  // Each unlock: removes 1 locked die, adds 2 to pool
  // Simulate unlocking one at a time until match rate improves
  let simulatedPool = poolSize;
  const toUnlock: number[] = [];

  for (const candidate of scored) {
    if (toUnlock.length >= capLimit) break;

    toUnlock.push(candidate.slotIndex);
    simulatedPool += 2;

    // Recalculate: the unlocked die's value goes back to being a remaining goal value
    // But for simplicity, just check if the new pool improves match rate enough
    const newMatchRate = expectedMatchRate(simulatedPool, remainingValues);
    if (newMatchRate >= 0.5 && !mustUnlock) break;
    if (newMatchRate >= 0.5 && mustUnlock && toUnlock.length >= 1) break;
  }

  // If must-unlock but we haven't picked any yet, pick at least 1
  if (mustUnlock && toUnlock.length === 0 && scored.length > 0) {
    toUnlock.push(scored[0].slotIndex);
  }

  return toUnlock;
}

// ─── Main function ─────────────────────────────────────────────

/** Decides which locked dice an AI player should unlock. Returns goalSlotIndices to unlock. */
export function getAIUnlockDecision(input: AIDecisionInput): number[] {
  const { goalValues, lockedDice, poolSize, difficulty } = input;

  // Nothing to unlock
  if (lockedDice.length === 0) return [];

  // All 8 locked = game already won
  if (lockedDice.length >= 8) return [];

  // How many unlocks the 12-die cap allows
  const capLimit = maxUnlocksForCap(poolSize);

  // Must-unlock: poolSize=0 AND lockedDice < 8
  const mustUnlock = poolSize === 0 && lockedDice.length < 8;

  // If cap is 0 and we don't have a must-unlock exception, return empty
  // If must-unlock but cap is 0, that's an impossible state (poolSize=0 means cap=6)
  if (capLimit === 0) return [];

  switch (difficulty) {
    case 'easy':
      return easyStrategy(lockedDice, capLimit, mustUnlock);
    case 'medium':
      return mediumStrategy(lockedDice, goalValues, poolSize, capLimit, mustUnlock);
    case 'hard':
      return hardStrategy(lockedDice, goalValues, poolSize, capLimit, mustUnlock);
    default:
      return [];
  }
}
