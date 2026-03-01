import { useGameStore } from '../store/gameStore';

interface HUDProps {
  onRoll: () => void;
  onConfirmUnlock: () => void;
}

export function HUD({ onRoll, onConfirmUnlock }: HUDProps) {
  const phase = useGameStore((s) => s.phase);
  const currentRound = useGameStore((s) => s.currentRound);
  const sessionTargetScore = useGameStore((s) => s.sessionTargetScore);
  const lastLockCount = useGameStore((s) => s.roundState.lastLockCount);
  const players = useGameStore((s) => s.players);

  const player = players[0];
  const score = player?.score ?? 0;
  const poolSize = player?.poolSize ?? 0;
  const startingDice = player?.startingDice ?? 2;
  const isRolling = phase === 'rolling';
  const selectedCount = player?.selectedForUnlock?.length ?? 0;
  const lockedCount = player?.lockedDice?.length ?? 0;
  const mustUnlock = poolSize === 0 && lockedCount < 8;

  const handleTapRoll = () => {
    if (phase === 'idle') onRoll();
  };

  // Compute round score for display during scoring phase
  // Same formula as store: max(0, 8 - poolSize * 2)
  const roundScore = Math.max(0, 8 - poolSize * 2);

  // Status text based on phase
  let statusText: string;
  if (phase === 'lobby') {
    statusText = 'Starting...';
  } else if (phase === 'idle') {
    statusText = 'Tap To Roll';
  } else if (phase === 'rolling') {
    statusText = 'Rolling...';
  } else if (phase === 'locking') {
    statusText = lastLockCount > 0 ? `Locked ${lastLockCount}!` : 'No matches';
  } else if (phase === 'unlocking') {
    if (mustUnlock && selectedCount === 0) {
      statusText = 'No dice left — unlock 1+';
    } else if (selectedCount > 0) {
      statusText = `${selectedCount} selected`;
    } else {
      statusText = 'Tap dice to unlock';
    }
  } else if (phase === 'scoring') {
    statusText = `Round Complete! +${roundScore}pts`;
  } else if (phase === 'roundEnd') {
    statusText = 'Next Round...';
  } else if (phase === 'sessionEnd') {
    statusText = `Game Over! Score: ${score}`;
  } else {
    statusText = '';
  }

  return (
    <div className="hud">
      {/* Top bar — round + score */}
      <div className="hud-top">
        <span className="hud-round">Round {currentRound}</span>
        <span className="hud-score">
          {score} / {sessionTargetScore}
        </span>
      </div>

      {/* Bottom area — status text + controls + pool stats */}
      <div className="hud-bottom">
        {/* During unlocking: status text + UNLOCK button */}
        {phase === 'unlocking' ? (
          <>
            <span className="hud-status">{statusText}</span>
            <button
              className={`hud-unlock-btn${mustUnlock && selectedCount === 0 ? ' hud-unlock-btn--disabled' : ''}`}
              onClick={onConfirmUnlock}
              disabled={mustUnlock && selectedCount === 0}
            >
              {selectedCount > 0 ? `UNLOCK ${selectedCount}` : mustUnlock ? 'MUST UNLOCK' : 'SKIP'}
            </button>
          </>
        ) : (
          /* All other phases: tappable status text */
          <span
            className={`hud-status${isRolling ? ' hud-status--rolling' : ''}`}
            onClick={handleTapRoll}
          >
            {statusText}
          </span>
        )}

        {phase !== 'sessionEnd' && phase !== 'lobby' && (
          <span className="hud-pool-stats">
            {poolSize}/12 dice &middot; Start: {startingDice}
          </span>
        )}
      </div>
    </div>
  );
}
