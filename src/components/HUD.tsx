import { useGameStore } from '../store/gameStore';

interface HUDProps {
  onRoll: () => void;
}

export function HUD({ onRoll }: HUDProps) {
  const phase = useGameStore((s) => s.phase);
  const currentRound = useGameStore((s) => s.currentRound);
  const sessionTargetScore = useGameStore((s) => s.sessionTargetScore);
  const rollResults = useGameStore((s) => s.roundState.rollResults);
  const players = useGameStore((s) => s.players);

  const score = players[0]?.score ?? 0;
  const isRolling = phase === 'rolling';

  const handleTap = () => {
    if (phase === 'idle') onRoll();
  };

  // Status text based on phase
  let statusText: string;
  if (phase === 'rolling') {
    statusText = 'Rolling';
  } else if (phase === 'locking' && rollResults) {
    statusText = rollResults.join(', ');
  } else if (phase === 'idle') {
    statusText = 'Tap To Roll';
  } else if (phase === 'lobby') {
    statusText = 'Starting...';
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

      {/* Bottom area — tap-to-roll text */}
      <div className="hud-bottom">
        <span
          className={`hud-status${isRolling ? ' hud-status--rolling' : ''}`}
          onClick={handleTap}
        >
          {statusText}
        </span>
      </div>
    </div>
  );
}
