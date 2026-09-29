// STATUS PIN — the in-game status line, plain kit text (src/ui/StatusBanner.tsx) pinned over the
// top of the rolling area, level with the Goal dice. Works out which words to show from the game store; the words
// themselves live in content/text/en.json (hud.status).
// It also runs the two AFK timers (moved here from HUD.tsx, timing unchanged) and shows them as a bar:
//   - online, idle: 20 s, then auto-roll (or force-release a gather in progress)
//   - unlocking (offline AND online — B003): 3 s since the last drag, then the turn ends (B006)
import { useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { useCountdown } from '../hooks/useCountdown';
import { shouldRunUnlockTimer } from '../utils/unlockTurn';
import { ROLLING_X_OFFSET } from './RollingArea';
import { Pinned } from './Pinned';
import { StatusBanner } from '../ui/StatusBanner';
import { text, fill } from '../ui/words';

// Top of the rolling area, level with the Goal dice (Goal row z = -5, B016) — instructions read
// next to what they're about, and the bottom of the table stays free for rolling.
// Fit box in world units (Pinned scales the words to it).
const STATUS_POSITION: [number, number, number] = [ROLLING_X_OFFSET, 0, -5.0];
const STATUS_FIT: [number, number] = [8, 1.1];

interface StatusPinProps {
  onRoll: () => void;              // AFK idle: roll for the player
  onForceRelease: () => void;      // AFK mid-gather: let go of the dice
  onUnlockTimerExpire: () => void; // unlock turn over
}

export function StatusPin({ onRoll, onForceRelease, onUnlockTimerExpire }: StatusPinProps) {
  const phase = useGameStore((s) => s.phase);
  const lastLockCount = useGameStore((s) => s.roundState.lastLockCount);
  const roundScore = useGameStore((s) => s.roundState.roundScore);
  const isOnlineGame = useGameStore((s) => s.isOnlineGame);
  const unlockAnimating = useGameStore((s) => s.roundState.unlockAnimations.length > 0);
  const aiUnlockAnimating = useGameStore((s) => s.roundState.aiUnlockAnimations.length > 0);
  const hasSubmittedUnlock = useGameStore((s) => s.hasSubmittedUnlock);
  const unlockTimerResetKey = useGameStore((s) => s.unlockTimerResetKey);
  const committedCount = useGameStore((s) => s.committedUnlocks.length);
  const animationsInProgress = unlockAnimating || aiUnlockAnimating;

  // --- AFK timers ---
  const handleIdleTimeout = useCallback(() => {
    (window as unknown as Record<string, boolean>).__rbAfkRoll = true;
    // If player is mid-gather, force-release dice (they have orbital momentum)
    if (useGameStore.getState().gatherState.active) {
      console.log('[StatusPin] AFK mid-gather timeout — force-releasing');
      onForceRelease();
    } else {
      // Normal idle: use rollAll path (lift + random impulse + torque)
      console.log('[StatusPin] AFK idle timeout — auto-rolling');
      onRoll();
    }
  }, [onRoll, onForceRelease]);

  const idleTimeLeft = useCountdown({ active: isOnlineGame && phase === 'idle', onTimeout: handleIdleTimeout });
  // Drag inactivity timer ends the unlock turn — offline AND online (B003 / TDD D15).
  // Online there is no separate 20 s unlock countdown any more; the server's 25 s timer catches real AFK.
  const unlockTimeLeft = useCountdown({
    active: shouldRunUnlockTimer({ isOnlineGame, phase, animationsInProgress, timerAlreadyFired: unlockTimerResetKey < 0, hasSubmittedUnlock }),
    onTimeout: onUnlockTimerExpire,
    duration: 3000,
    resetKey: unlockTimerResetKey,
  });

  const w = text.hud.status;
  let status = '';
  if (phase === 'lobby') {
    status = w.starting;
  } else if (phase === 'idle') {
    status = w.holdToRoll;
  } else if (phase === 'rolling') {
    status = w.rolling;
  } else if (phase === 'locking') {
    status = lastLockCount > 0 ? fill(w.locked, { n: lastLockCount }) : w.noMatches;
  } else if (phase === 'unlocking') {
    // Nothing while the timer has fired (finalizing) or dice are splitting
    if (unlockTimerResetKey < 0 || animationsInProgress) status = '';
    else if (isOnlineGame && hasSubmittedUnlock) status = w.waiting;
    else if (committedCount > 0) status = fill(w.unlocked, { n: committedCount });
    else status = w.dragToUnlock;
  } else if (phase === 'scoring') {
    status = fill(w.roundComplete, { n: roundScore });
  } else if (phase === 'roundEnd') {
    status = w.nextRound;
  }

  return (
    <Pinned position={STATUS_POSITION} fit={STATUS_FIT} anchor="center">
      <StatusBanner status={status} timeLeft={unlockTimeLeft ?? idleTimeLeft} urgent={unlockTimeLeft !== null} />
    </Pinned>
  );
}
