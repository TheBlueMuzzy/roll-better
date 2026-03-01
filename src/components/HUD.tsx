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
  return (
    <div className="hud">
      {/* Top bar — round + score */}
      <div className="hud-top">
        <span className="hud-round">Round {round}</span>
        <span className="hud-score">
          {score} / {targetScore}
        </span>
      </div>

      {/* Bottom area — results + roll button */}
      <div className="hud-bottom">
        {diceResults && (
          <div className="hud-results">
            Results: {diceResults.join(', ')}
          </div>
        )}
        <button
          className="roll-button"
          onClick={onRoll}
          disabled={isRolling}
        >
          {isRolling ? 'ROLLING...' : 'ROLL'}
        </button>
      </div>
    </div>
  );
}
