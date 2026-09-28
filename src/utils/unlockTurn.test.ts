import { describe, it, expect } from 'vitest';
import { shouldRunUnlockTimer, buildUnlockSubmission } from './unlockTurn';

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
