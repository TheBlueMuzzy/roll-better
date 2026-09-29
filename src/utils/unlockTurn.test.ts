import { describe, it, expect } from 'vitest';
import {
  shouldRunUnlockTimer,
  buildUnlockSubmission,
  isUnlockTurnOpen,
  canStartDrag,
  resolveDragRelease,
  nextUnlockTimerKey,
  returnParkedDice,
  shouldShowCapToast,
} from './unlockTurn';

// B003 — online, dragging dice to unlock did nothing for the other player.
// Cause: online, the drag inactivity timer was switched off, so the turn only ended through the
// old 20 s AFK countdown, which ignored dragged dice — and nothing ever sent the drags to the server.
describe('shouldRunUnlockTimer — B003 online drag-to-unlock', () => {
  const unlockingOnline = {
    isOnlineGame: true,
    phase: 'unlocking' as const,
    animationsInProgress: false,
    timerAlreadyFired: false,
    hasSubmittedUnlock: false,
  };

  it('online: the drag inactivity timer runs during the unlock phase (same as offline)', () => {
    expect(shouldRunUnlockTimer(unlockingOnline)).toBe(true);
  });

  it('online: once this player has sent their choice, the timer stops', () => {
    expect(shouldRunUnlockTimer({ ...unlockingOnline, hasSubmittedUnlock: true })).toBe(false);
  });

  it('offline: unchanged — timer runs until it has fired once', () => {
    const offline = { ...unlockingOnline, isOnlineGame: false };
    expect(shouldRunUnlockTimer(offline)).toBe(true);
    expect(shouldRunUnlockTimer({ ...offline, timerAlreadyFired: true })).toBe(false);
  });

  it('no timer while dice are still animating or outside the unlock phase', () => {
    expect(shouldRunUnlockTimer({ ...unlockingOnline, animationsInProgress: true })).toBe(false);
    expect(shouldRunUnlockTimer({ ...unlockingOnline, phase: 'idle' })).toBe(false);
  });
});

describe('buildUnlockSubmission — B003', () => {
  it('sends every dragged die in ONE unlock_request', () => {
    expect(buildUnlockSubmission([{ slotIndex: 2 }, { slotIndex: 5 }])).toEqual({
      type: 'unlock_request',
      slotIndices: [2, 5],
    });
  });

  it('nothing dragged = skip', () => {
    expect(buildUnlockSubmission([])).toEqual({ type: 'skip_unlock' });
  });
});

// B006 — solo: a die dragged just after the unlock timer ended sat uncounted in the rolling area,
// then split a few rolls later. Cause: after the timer fired the phase stays 'unlocking' while the
// split animations play, and nothing stopped a new drag from starting or committing.
describe('isUnlockTurnOpen — B006 late drag', () => {
  const open = { phase: 'unlocking' as const, timerAlreadyFired: false, hasSubmittedUnlock: false };

  it('a locked die can be picked up during the unlock turn', () => {
    expect(isUnlockTurnOpen(open)).toBe(true);
  });

  it('after the 3 s timer fires, locked dice cannot be picked up (solo)', () => {
    expect(isUnlockTurnOpen({ ...open, timerAlreadyFired: true })).toBe(false);
  });

  it('online: after the choice went to the server, locked dice cannot be picked up', () => {
    expect(isUnlockTurnOpen({ ...open, hasSubmittedUnlock: true })).toBe(false);
  });

  it('outside the unlock phase, locked dice cannot be picked up', () => {
    expect(isUnlockTurnOpen({ ...open, phase: 'idle' })).toBe(false);
    expect(isUnlockTurnOpen({ ...open, phase: 'rolling' })).toBe(false);
  });
});

describe('canStartDrag — F48 one drag at a time', () => {
  const free = { turnOpen: true, dragActive: false, stillLocked: true };

  it('a locked die can be picked up while the turn is open and nothing else is dragged', () => {
    expect(canStartDrag(free)).toBe(true);
  });

  it('a second finger is ignored while another die is being dragged', () => {
    expect(canStartDrag({ ...free, dragActive: true })).toBe(false);
  });

  it('a die already parked in the rolling area cannot be grabbed again', () => {
    expect(canStartDrag({ ...free, stillLocked: false })).toBe(false);
  });

  it('nothing can be picked up once the turn is closed (B006)', () => {
    expect(canStartDrag({ ...free, turnOpen: false })).toBe(false);
  });
});

describe('resolveDragRelease — B006 late drag', () => {
  const inTime = { turnOpen: true, overRollingZone: true, withinCap: true };

  it('timer fires mid-drag over the rolling zone → the die counts for this turn', () => {
    expect(resolveDragRelease(inTime)).toBe('commit');
  });

  it('timer fires mid-drag over the locked-dice zone → the die snaps back', () => {
    expect(resolveDragRelease({ ...inTime, overRollingZone: false })).toBe('snap-back');
  });

  it('over the 12-dice cap → the die snaps back', () => {
    expect(resolveDragRelease({ ...inTime, withinCap: false })).toBe('snap-back');
  });

  it('a die dropped after the turn closed snaps back, even over the rolling zone', () => {
    expect(resolveDragRelease({ ...inTime, turnOpen: false })).toBe('snap-back');
  });
});

describe('nextUnlockTimerKey — B006 late drag', () => {
  it('each commit restarts the 3 s timer', () => {
    expect(nextUnlockTimerKey(0)).toBe(1);
    expect(nextUnlockTimerKey(3)).toBe(4);
  });

  it('once the timer has fired (-1) it stays fired — a late drop never restarts it', () => {
    expect(nextUnlockTimerKey(-1)).toBe(-1);
  });
});

// B006 follow-up — whatever the timing, a parked die is never carried past its own unlock phase.
// Before: leaving the unlock phase just emptied the parked list, so a die parked there vanished
// (already removed from the locked row, never split). Now it goes back to its slot.
describe('returnParkedDice — B006 leaving the unlock phase', () => {
  it('a die still parked when the unlock phase ends goes back to its slot', () => {
    const locked = [{ goalSlotIndex: 0, value: 1 }];
    expect(returnParkedDice(locked, [{ slotIndex: 4, value: 5 }])).toEqual([
      { goalSlotIndex: 0, value: 1 },
      { goalSlotIndex: 4, value: 5 },
    ]);
  });

  it('nothing parked → locked dice unchanged', () => {
    const locked = [{ goalSlotIndex: 2, value: 3 }];
    expect(returnParkedDice(locked, [])).toBe(locked);
  });

  it('never duplicates a die that is already in its slot', () => {
    const locked = [{ goalSlotIndex: 4, value: 5 }];
    expect(returnParkedDice(locked, [{ slotIndex: 4, value: 5 }])).toEqual(locked);
  });
});

describe('shouldShowCapToast — F48 "Max 12 dice" is not spammed', () => {
  it('shows the first time', () => {
    expect(shouldShowCapToast(1000, null, 2)).toBe(true);
  });

  it('tapping again within the cooldown shows nothing', () => {
    expect(shouldShowCapToast(2500, 1000, 2)).toBe(false);
  });

  it('shows again once the cooldown has passed', () => {
    expect(shouldShowCapToast(3000, 1000, 2)).toBe(true);
  });
});
