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
  const { phase, hasSubmittedUnlock } = state;
  return phase === 'unlocking' && !hasSubmittedUnlock;
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
  const { overRollingZone, withinCap } = input;
  return overRollingZone && withinCap ? 'commit' : 'snap-back';
}

/** The timer key after a die is committed — each commit restarts the 3 s timer. */
export function nextUnlockTimerKey(current: number): number {
  return current + 1;
}
