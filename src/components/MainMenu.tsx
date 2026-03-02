import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
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
  const gamePrefs = useGameStore((s) => s.gamePrefs);
  const setGamePrefs = useGameStore((s) => s.setGamePrefs);

  const [playerCount, setPlayerCount] = useState(gamePrefs.playerCount);
  const [difficulty, setDifficulty] = useState<AIDifficulty>(gamePrefs.aiDifficulty);

  // Sync local state when gamePrefs change (e.g. returning to menu after Play Again)
  useEffect(() => {
    setPlayerCount(gamePrefs.playerCount);
    setDifficulty(gamePrefs.aiDifficulty);
  }, [gamePrefs.playerCount, gamePrefs.aiDifficulty]);

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
      <button className="menu-play" onClick={() => {
        setGamePrefs({ playerCount, aiDifficulty: difficulty });
        onPlay(playerCount, difficulty);
      }}>
        PLAY
      </button>

      {/* Online placeholder */}
      <span className="menu-coming-soon">Online (Coming Soon)</span>

      {/* Settings link */}
      <button className="menu-settings-link" onClick={onOpenSettings}>
        Settings
      </button>
    </div>
  );
}
