import { useGameStore } from '../store/gameStore';

interface WinnersScreenProps {
  onPlayAgain: () => void;
  onMenu: () => void;
}

export function WinnersScreen({ onPlayAgain, onMenu }: WinnersScreenProps) {
  const players = useGameStore((s) => s.players);
  const currentRound = useGameStore((s) => s.currentRound);

  // Sort players by score descending for ranking
  const ranked = [...players].sort((a, b) => b.score - a.score);

  // Determine winner(s) — top score may be tied
  const topScore = ranked[0]?.score ?? 0;
  const winners = ranked.filter((p) => p.score === topScore);
  const isTie = winners.length > 1;

  // Winner announcement text
  let announcementText: string;
  let announcementColor: string;

  if (isTie) {
    announcementText = 'Tie!';
    announcementColor = '#f1c40f'; // gold for tie
  } else {
    const winner = winners[0];
    announcementText = winner.isAI ? `${winner.name} Wins!` : 'You Win!';
    announcementColor = winner.color;
  }

  // Rank label (1st, 2nd, 3rd, 4th)
  const getRankLabel = (index: number): string => {
    if (index === 0) return '\u{1F3C6}'; // trophy emoji for 1st
    if (index === 1) return '2nd';
    if (index === 2) return '3rd';
    return `${index + 1}th`;
  };

  return (
    <div className="winners-backdrop">
      <h1 className="winners-heading">Game Over</h1>

      <div className="winners-announcement" style={{ color: announcementColor }}>
        {announcementText}
        {isTie && (
          <span className="winners-tie-names">
            {winners.map((w) => w.name).join(' & ')}
          </span>
        )}
      </div>

      <div className="winners-list">
        {ranked.map((player, index) => {
          const isWinner = player.score === topScore;
          return (
            <div
              key={player.id}
              className={`winners-row${isWinner ? ' winner' : ''}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <span className="winners-rank">{getRankLabel(index)}</span>
              <div
                className="winners-avatar"
                style={{ backgroundColor: player.color }}
              >
                {player.name.charAt(0).toUpperCase()}
              </div>
              <span className="winners-name">{player.name}</span>
              <span className="winners-score">{player.score}</span>
            </div>
          );
        })}
      </div>

      <div className="winners-rounds">
        Rounds played: {currentRound}
      </div>

      <div className="winners-actions">
        <button className="winners-play-again" onClick={onPlayAgain}>
          PLAY AGAIN
        </button>
        <button className="winners-menu-btn" onClick={onMenu}>
          MENU
        </button>
      </div>
    </div>
  );
}
