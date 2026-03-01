import type { LockedDie } from '../types/game';

export function findAutoLocks(
  goalValues: number[],
  rolledValues: number[],
  currentLocks: LockedDie[]
): LockedDie[] {
  // Build set of locked slot indices for fast lookup
  const lockedSlots = new Set(currentLocks.map(l => l.goalSlotIndex));

  // Build remaining slots map: value → [available slot indices]
  const remainingSlots = new Map<number, number[]>();
  for (let i = 0; i < goalValues.length; i++) {
    if (!lockedSlots.has(i)) {
      const val = goalValues[i];
      if (!remainingSlots.has(val)) {
        remainingSlots.set(val, []);
      }
      remainingSlots.get(val)!.push(i);
    }
  }

  // Match rolled dice to remaining slots
  const newLocks: LockedDie[] = [];
  for (const dieValue of rolledValues) {
    const slots = remainingSlots.get(dieValue);
    if (slots && slots.length > 0) {
      const slotIndex = slots.shift()!; // take lowest index (left-to-right)
      newLocks.push({ goalSlotIndex: slotIndex, value: dieValue });
    }
  }

  // Sort by goalSlotIndex
  newLocks.sort((a, b) => a.goalSlotIndex - b.goalSlotIndex);
  return newLocks;
}
