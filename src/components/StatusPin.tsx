// STATUS PIN — the in-game status line, a kit banner (src/ui/StatusBanner.tsx) pinned over the
// bottom of the rolling area. Works out which words to show from the game store; the words
// themselves live in content/text/en.json (hud.status).
import { useGameStore } from '../store/gameStore';
import { ROLLING_X_OFFSET } from './RollingArea';
import { Pinned } from './Pinned';
import { StatusBanner } from '../ui/StatusBanner';
import { text, fill } from '../ui/words';

// Centred on the strip below the rolling area's bottom wall (z = 5), so it covers as little
// of the dice as it can. Fit box in world units (Pinned scales the banner to it).
const STATUS_POSITION: [number, number, number] = [ROLLING_X_OFFSET, 0, 5.3];
const STATUS_FIT: [number, number] = [8, 1.4];

export function StatusPin() {
  const phase = useGameStore((s) => s.phase);
  const lastLockCount = useGameStore((s) => s.roundState.lastLockCount);
  const roundScore = useGameStore((s) => s.roundState.roundScore);
  const isOnlineGame = useGameStore((s) => s.isOnlineGame);
  const unlockAnimating = useGameStore((s) => s.roundState.unlockAnimations.length > 0);
  const aiUnlockAnimating = useGameStore((s) => s.roundState.aiUnlockAnimations.length > 0);
  const hasSubmittedUnlock = useGameStore((s) => s.hasSubmittedUnlock);
  const unlockTimerResetKey = useGameStore((s) => s.unlockTimerResetKey);
  const committedCount = useGameStore((s) => s.committedUnlocks.length);

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
    if (unlockTimerResetKey < 0 || unlockAnimating || aiUnlockAnimating) status = '';
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
      <StatusBanner status={status} />
    </Pinned>
  );
}
