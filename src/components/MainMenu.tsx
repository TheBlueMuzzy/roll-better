import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { playUIClick } from '../utils/soundManager';

interface MainMenuProps {
  visible: boolean;
  onPlay: (playerCount: number) => void;
  onPlayOnline: () => void;
  onOpenHowToPlay: () => void;
  onOpenSettings: () => void;
}

const PLAYER_COUNTS = [2, 3, 4];

export function MainMenu({ visible, onPlay, onPlayOnline, onOpenHowToPlay, onOpenSettings }: MainMenuProps) {
  const gamePrefs = useGameStore((s) => s.gamePrefs);
  const setGamePrefs = useGameStore((s) => s.setGamePrefs);

  const [playerCount, setPlayerCount] = useState(gamePrefs.playerCount);

  // Sync local state when gamePrefs change (e.g. returning to menu after Play Again)
  useEffect(() => {
    setPlayerCount(gamePrefs.playerCount);
  }, [gamePrefs.playerCount]);

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

      {/* Play button */}
      <button className="menu-play" onClick={() => {
        setGamePrefs({ playerCount });
        onPlay(playerCount);
      }}>
        PLAY
      </button>

      {/* Play Online button */}
      <button className="menu-online" onClick={() => { playUIClick(); onPlayOnline(); }}>
        PLAY ONLINE
      </button>

      {/* Link buttons */}
      <div className="menu-links">
        <button className="menu-link-btn" onClick={() => { playUIClick(); onOpenHowToPlay(); }}>
          {'\u{1F4D6}'} How to Play
        </button>
        <button className="menu-link-btn menu-upgrades-btn" disabled={true}>
          Upgrades
          <span className="menu-coming-soon-label">Coming Soon</span>
        </button>
      </div>

      {/* Gear icon — bottom-right, mirrors HUD .settings-gear */}
      <button className="menu-gear" onClick={() => { playUIClick(); onOpenSettings(); }}>
        &#x2699;
      </button>
    </div>
  );
}
