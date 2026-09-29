// Rules for ending a player's unlock turn (drag-to-unlock).
// Pure functions so they can be unit-tested without React or the 3D scene.
// Online works exactly like offline (TDD D15): each player's own inactivity timer ends the turn,
// then ONE message tells the server everything that player dragged.

import type { GamePhase } from '../types/game';

export interface UnlockTimerInput {
  isOnlineGame: boolean;
  phase: GamePhase;
  animationsInProgress: boolean;
  timerAlreadyFired: boolean;   // unlockTimerResetKey < 0 — this turn's timer already ended
  hasSubmittedUnlock: boolean;  // online: this player's choice already went to the server
}

/** Should the drag inactivity timer (the one that ends the unlock turn) be running? */
export function shouldRunUnlockTimer(input: UnlockTimerInput): boolean {
  const { isOnlineGame, phase, animationsInProgress, timerAlreadyFired, hasSubmittedUnlock } = input;
  if (phase !== 'unlocking' || animationsInProgress || timerAlreadyFired) return false;
  if (isOnlineGame && hasSubmittedUnlock) return false; // already told the server — waiting for others
  return true;
}

export type UnlockSubmission =
  | { type: 'unlock_request'; slotIndices: number[] }
  | { type: 'skip_unlock' };

/** The one message the server gets when this player's unlock turn ends. */
export function buildUnlockSubmission(committed: { slotIndex: number }[]): UnlockSubmission {
  if (committed.length === 0) return { type: 'skip_unlock' };
  return { type: 'unlock_request', slotIndices: committed.map((c) => c.slotIndex) };
}

// --- B006: when can a locked die be dragged, and how does a drag end? ---

export interface UnlockTurnState {
  phase: GamePhase;
  timerAlreadyFired: boolean;   // unlockTimerResetKey < 0 — the 3 s timer has ended this turn
  hasSubmittedUnlock: boolean;  // online: this player's choice already went to the server
}

/** Can the player pick up (or drop) a locked die right now? */
export function isUnlockTurnOpen(state: UnlockTurnState): boolean {
  const { phase, timerAlreadyFired, hasSubmittedUnlock } = state;
  if (phase !== 'unlocking') return false;
  if (timerAlreadyFired) return false;   // the 3 s timer closed the turn (solo + online)
  if (hasSubmittedUnlock) return false;  // online: choice already sent
  return true;
}

export interface DragStartInput {
  turnOpen: boolean;     // isUnlockTurnOpen() right now
  dragActive: boolean;   // a die is already being dragged
  stillLocked: boolean;  // the die is still in the player's row (not already parked in the rolling area)
}

/**
 * F48: can this die be picked up? One drag at a time — a second finger is ignored while a die is
 * being dragged — and a die can't be grabbed twice.
 */
export function canStartDrag(input: DragStartInput): boolean {
  const { turnOpen, dragActive, stillLocked } = input;
  return turnOpen && !dragActive && stillLocked;
}

export interface DragReleaseInput {
  turnOpen: boolean;        // isUnlockTurnOpen() at the moment the drag ends
  overRollingZone: boolean; // where the die is when the drag ends
  withinCap: boolean;       // one more unlock keeps the player at 12 dice or fewer
}

/**
 * How a drag ends — on finger release, or when the 3 s timer fires mid-drag.
 * 'commit' = the die counts for this turn and stays in the rolling area.
 * 'snap-back' = the die flies back to its slot.
 */
export function resolveDragRelease(input: DragReleaseInput): 'commit' | 'snap-back' {
  const { turnOpen, overRollingZone, withinCap } = input;
  if (!turnOpen) return 'snap-back'; // too late — the turn is already closed
  return overRollingZone && withinCap ? 'commit' : 'snap-back';
}

/** The timer key after a die is committed — each commit restarts the 3 s timer. */
export function nextUnlockTimerKey(current: number): number {
  if (current < 0) return current; // -1 = timer already fired; never restart it
  return current + 1;
}

/**
 * Leaving the unlock phase: any die still parked in the rolling area (committed but never split)
 * goes back to its slot. Its turn is over — it must never be carried into a later turn (B006) and
 * never silently disappear either. Returns the player's new lockedDice.
 */
export function returnParkedDice<T extends { goalSlotIndex: number; value: number }>(
  lockedDice: T[],
  parked: { slotIndex: number; value: number }[],
): { goalSlotIndex: number; value: number }[] {
  const back = parked
    .filter((p) => !lockedDice.some((l) => l.goalSlotIndex === p.slotIndex))
    .map((p) => ({ goalSlotIndex: p.slotIndex, value: p.value }));
  return back.length === 0 ? lockedDice : [...lockedDice, ...back];
}
