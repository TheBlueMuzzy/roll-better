import { useState, useEffect } from 'react';
import type { AIDifficulty } from '../types/game';

interface MainMenuProps {
  visible: boolean;
  onPlay: (playerCount: number, difficulty: AIDifficulty) => void;
  onOpenSettings: () => void;
}

const PLAYER_COUNTS = [2, 3, 4];
const DIFFICULTIES: { label: string; value: AIDifficulty }[] = [
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
];

export function MainMenu({ visible, onPlay, onOpenSettings }: MainMenuProps) {
  const [playerCount, setPlayerCount] = useState(3);
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');

  // mount → rAF → add class pattern (same as TipBanner)
  const [showClass, setShowClass] = useState(false);
  useEffect(() => {
    if (visible) {
      const raf = requestAnimationFrame(() => setShowClass(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setShowClass(false);
    }
  }, [visible]);

  return (
    <div className={`menu-backdrop${showClass ? ' menu-visible' : ''}`}>
      <h1 className="menu-title">Roll Better</h1>
      <p className="menu-subtitle">A dice-matching game</p>

      {/* Player count selector */}
      <div className="menu-selector-group">
        <span className="menu-selector-label">Players</span>
        <div className="menu-selector">
          {PLAYER_COUNTS.map((count) => (
            <button
              key={count}
              className={`menu-btn${playerCount === count ? ' selected' : ''}`}
              onClick={() => setPlayerCount(count)}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty selector */}
      <div className="menu-selector-group">
        <span className="menu-selector-label">Difficulty</span>
        <div className="menu-selector">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              className={`menu-btn${difficulty === d.value ? ' selected' : ''}`}
              onClick={() => setDifficulty(d.value)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Play button */}
      <button className="menu-play" onClick={() => onPlay(playerCount, difficulty)}>
        PLAY
      </button>

      {/* Online placeholder */}
      <span className="menu-coming-soon">Online (Coming Soon)</span>

      {/* Settings gear */}
      <button className="settings-gear menu-gear" onClick={onOpenSettings}>
        &#x2699;
      </button>
    </div>
  );
}
