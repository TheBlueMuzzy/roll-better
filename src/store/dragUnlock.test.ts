import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';
import type { Player } from '../types/game';

// F48 — dragging a locked die must never leave a die stuck, swapped or grabbed twice.
// These drive the real store actions the 3D die calls (PlayerRow.tsx).

const ROW_Z = -3.75;
const SLOT_POS: [number, number, number] = [-5, 0.4, ROW_Z]; // a die's own slot in the player row
const OVER_ROLLING_AREA: [number, number, number] = [5, 0.4, 0];

/** The local player in the middle of their unlock turn, with these locked dice (slot i = values[i]). */
function unlockTurnWith(values: number[], poolSize = 2) {
  const player: Player = {
    id: 'me', name: 'Me', color: '#e74c3c', score: 0, startingDice: 8,
    poolSize,
    lockedDice: values.map((value, i) => ({ goalSlotIndex: i, value })),
    selectedForUnlock: [], isAI: false, seatState: 'human-active', seatIndex: 0,
  };
  useGameStore.setState({
    phase: 'unlocking',
    unlockTimerResetKey: 0,
    hasSubmittedUnlock: false,
    isOnlineGame: false,
    committedUnlocks: [],
    dragUnlockState: { active: false, slotIndex: null, value: null, originPosition: null, currentPosition: null },
    players: [player],
    roundState: { ...useGameStore.getState().roundState, remainingDicePositions: [] },
  });
}

const store = () => useGameStore.getState();
const lockedSlots = () => store().players[0].lockedDice.map((d) => d.goalSlotIndex);

describe('lost finger mid-drag — resolves at once by zone (F48)', () => {
  beforeEach(() => unlockTurnWith([3, 5]));

  // PlayerRow calls completeDragUnlock on pointercancel / lostpointercapture, same as a release
  it('lost before the die moved: it snaps back to its slot', () => {
    store().startDragUnlock(0, 3, SLOT_POS);
    store().completeDragUnlock();
    expect(store().dragUnlockState.active).toBe(false);
    expect(lockedSlots()).toEqual([0, 1]);
    expect(store().committedUnlocks).toEqual([]);
  });

  it('lost while over the rolling area: the die counts, like letting go there', () => {
    store().startDragUnlock(0, 3, SLOT_POS);
    store().updateDragPosition(OVER_ROLLING_AREA);
    store().completeDragUnlock();
    expect(store().dragUnlockState.active).toBe(false);
    expect(lockedSlots()).toEqual([1]);
    expect(store().committedUnlocks.map((c) => c.slotIndex)).toEqual([0]);
  });

  it('lost while back over the locked row: it snaps back', () => {
    store().startDragUnlock(0, 3, SLOT_POS);
    store().updateDragPosition(OVER_ROLLING_AREA);
    store().updateDragPosition([-4, 0.4, ROW_Z]);
    store().completeDragUnlock();
    expect(lockedSlots()).toEqual([0, 1]);
    expect(store().committedUnlocks).toEqual([]);
  });

  it('the normal release that follows a lost finger does nothing more', () => {
    store().startDragUnlock(0, 3, SLOT_POS);
    store().updateDragPosition(OVER_ROLLING_AREA);
    store().completeDragUnlock();
    store().completeDragUnlock();
    expect(store().committedUnlocks.length).toBe(1);
  });
});

describe('one drag at a time (F48)', () => {
  beforeEach(() => unlockTurnWith([3, 5]));

  it('a second finger on another die is refused — the first drag carries on', () => {
    expect(store().startDragUnlock(0, 3, SLOT_POS)).toBe(true);
    store().updateDragPosition(OVER_ROLLING_AREA);
    expect(store().startDragUnlock(1, 5, [-4, 0.4, ROW_Z])).toBe(false);
    expect(store().dragUnlockState.slotIndex).toBe(0);
    expect(store().dragUnlockState.currentPosition).toEqual(OVER_ROLLING_AREA);
  });

  it('the same die cannot be grabbed twice', () => {
    store().startDragUnlock(0, 3, SLOT_POS);
    store().updateDragPosition(OVER_ROLLING_AREA);
    expect(store().startDragUnlock(0, 3, SLOT_POS)).toBe(false);
    expect(store().dragUnlockState.currentPosition).toEqual(OVER_ROLLING_AREA);
  });

  it('a die already parked in the rolling area cannot be picked up again', () => {
    store().startDragUnlock(0, 3, SLOT_POS);
    store().updateDragPosition(OVER_ROLLING_AREA);
    store().completeDragUnlock();
    expect(store().startDragUnlock(0, 3, SLOT_POS)).toBe(false);
    expect(store().committedUnlocks.length).toBe(1);
  });

  it('after a drop, the next die can be picked up', () => {
    store().startDragUnlock(0, 3, SLOT_POS);
    store().completeDragUnlock();
    expect(store().startDragUnlock(1, 5, [-4, 0.4, ROW_Z])).toBe(true);
  });
});
