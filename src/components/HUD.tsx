interface HUDProps {
  score: number;
  targetScore: number;
  round: number;
  onRoll: () => void;
  isRolling: boolean;
  diceResults: number[] | null;
}

export function HUD({
  score,
  targetScore,
  round,
  onRoll,
  isRolling,
  diceResults,
}: HUDProps) {
  const handleTap = () => {
    if (!isRolling) onRoll();
  };

  // Three states: idle → rolling → results
  let statusText: string;
  if (isRolling) {
    statusText = 'Rolling';
  } else if (diceResults) {
    statusText = diceResults.join(',');
  } else {
    statusText = 'Tap To Roll';
  }

  return (
    <div className="hud">
      {/* Top bar — round + score */}
      <div className="hud-top">
        <span className="hud-round">Round {round}</span>
        <span className="hud-score">
          {score} / {targetScore}
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
