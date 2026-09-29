// The 12-dice cap for unlocking — shared by the phone (drag-to-unlock) and the server (party/server.ts)
// so both always agree on how many dice a player may unlock.
// Pure functions, no imports, so the PartyKit server can bundle it too.

export const MAX_DICE = 12;

/**
 * How many dice a player owns after unlocking some of their locked dice.
 * Each unlocked die leaves its slot (−1 locked) and comes back as 2 pool dice (+2).
 */
export function totalDiceAfterUnlocks(poolSize: number, lockedCount: number, unlockCount: number): number {
  return poolSize + (lockedCount - unlockCount) + 2 * unlockCount;
}

/**
 * The most dice a player may unlock this turn without going over 12 dice in total
 * (pool + still-locked + 2 per unlock ≤ 12). Never more than they have locked, never negative.
 * `lockedCount` = locked dice at the START of the turn (before any were dragged out).
 */
export function maxUnlocksAllowed(poolSize: number, lockedCount: number): number {
  const roomLeft = MAX_DICE - poolSize - lockedCount; // each unlock adds one die overall
  return Math.max(0, Math.min(lockedCount, roomLeft));
}

/** How many more dice may be dragged out this turn. `lockedNow` = still in the row, `committed` = already dragged out. */
export function unlocksLeft(poolSize: number, lockedNow: number, committed: number): number {
  return maxUnlocksAllowed(poolSize, lockedNow + committed) - committed;
}

/** At the cap: the player still has locked dice, but unlocking any would take them past 12 (F48: they show dimmed). */
export function isAtDiceCap(poolSize: number, lockedNow: number, committed: number): boolean {
  return lockedNow > 0 && unlocksLeft(poolSize, lockedNow, committed) <= 0;
}
