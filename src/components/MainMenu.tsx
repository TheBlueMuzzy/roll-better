import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore, PLAYER_COLORS } from '../store/gameStore';
import { useRoom } from '../hooks/useRoom';
import { playUIClick } from '../utils/soundManager';
import type { RoomPlayer } from '../types/protocol';

interface MainMenuProps {
  visible: boolean;
  onPlay: (playerCount: number) => void;
  onGameStart: (players: RoomPlayer[], targetPlayers: number, goalValues: number[], localPlayerId: string) => void;
  onOpenHowToPlay: () => void;
  onOpenSettings: () => void;
}

const SILLY_NAMES = [
  'Wobble', 'Noodle', 'Pickle', 'Wombat', 'Nugget', 'Biscuit', 'Muffin', 'Waffle',
  'Gremlin', 'Goblin', 'Pepper', 'Taco', 'Doodle', 'Sprout', 'Turnip', 'Bonkers',
  'Zippy', 'Pudding', 'Snooze', 'Pebble', 'Bumble', 'Fizz', 'Quirky', 'Rascal',
];

function getRandomName(): string {
  return SILLY_NAMES[Math.floor(Math.random() * SILLY_NAMES.length)];
}

type OnlineMode = 'idle' | 'creating' | 'joining' | 'joined';

export function MainMenu({ visible, onPlay, onGameStart, onOpenHowToPlay, onOpenSettings }: MainMenuProps) {
  const room = useRoom();

  // --- Online state machine ---
  const [onlineMode, setOnlineMode] = useState<OnlineMode>('idle');

  // --- Code input state (joining flow) ---
  const [codeChars, setCodeChars] = useState(['', '', '', '']);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);
  const [shakeJoin, setShakeJoin] = useState(false);

  // --- Clipboard feedback ---
  const [copied, setCopied] = useState(false);

  // --- Fade transition ---
  const [showClass, setShowClass] = useState(false);
  useEffect(() => {
    if (visible) {
      const raf = requestAnimationFrame(() => setShowClass(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setShowClass(false);
    }
  }, [visible]);

  // --- Game start detection (same as LobbyScreen) ---
  useEffect(() => {
    if (room.gameStartData && room.playerId) {
      onGameStart(
        room.gameStartData.players,
        room.gameStartData.targetPlayers,
        room.gameStartData.goalValues,
        room.playerId,
      );
    }
  }, [room.gameStartData, onGameStart, room.playerId]);

  // --- Transition: joining → joined when connected as non-host ---
  useEffect(() => {
    if (onlineMode === 'joining' && room.isConnected && room.roomCode && !room.isHost) {
      setOnlineMode('joined');
    }
  }, [onlineMode, room.isConnected, room.roomCode, room.isHost]);

  // --- Watch for join errors → shake + clear code ---
  const prevErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (room.error && room.error !== prevErrorRef.current && codeChars.some(c => c !== '')) {
      setShakeJoin(true);
      setTimeout(() => {
        setCodeChars(['', '', '', '']);
        setShakeJoin(false);
      }, 500);
    }
    prevErrorRef.current = room.error;
  }, [room.error]);

  // --- Code input handlers ---
  const handleCodeInput = useCallback((index: number, value: string) => {
    const upper = value.toUpperCase().replace(/[^A-Z]/g, '');
    if (!upper) return;

    const newChars = [...codeChars];
    newChars[index] = upper[0];
    setCodeChars(newChars);

    if (index < 3) {
      codeInputRefs.current[index + 1]?.focus();
    }
  }, [codeChars]);

  const handleCodeKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (codeChars[index] === '' && index > 0) {
        codeInputRefs.current[index - 1]?.focus();
        const newChars = [...codeChars];
        newChars[index - 1] = '';
        setCodeChars(newChars);
        e.preventDefault();
      } else {
        const newChars = [...codeChars];
        newChars[index] = '';
        setCodeChars(newChars);
      }
    }
  }, [codeChars]);

  const handleCodePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z]/g, '');
    const newChars = ['', '', '', ''];
    for (let i = 0; i < Math.min(pasted.length, 4); i++) {
      newChars[i] = pasted[i];
    }
    setCodeChars(newChars);
    const lastIndex = Math.min(pasted.length, 4) - 1;
    if (lastIndex >= 0) {
      codeInputRefs.current[Math.min(lastIndex + 1, 3)]?.focus();
    }
  }, []);

  const fullCode = codeChars.join('');
  const codeComplete = fullCode.length === 4;

  // --- Actions ---
  const handleCreate = () => {
    playUIClick();
    // If already in joined or creating mode, leave first
    if (onlineMode === 'joined' || onlineMode === 'creating') {
      room.leave();
    }
    // Clear join code
    setCodeChars(['', '', '', '']);
    setCopied(false);
    // Create room
    setOnlineMode('creating');
    room.createRoom(getRandomName(), PLAYER_COLORS[0]);
  };

  const handleJoin = () => {
    playUIClick();
    // If in creating or joined mode, leave first
    if (onlineMode === 'creating' || onlineMode === 'joined') {
      room.leave();
    }
    setCodeChars(['', '', '', '']);
    setCopied(false);
    setOnlineMode('joining');
    // Focus first code input after render
    setTimeout(() => codeInputRefs.current[0]?.focus(), 50);
  };

  const handleJoinSubmit = () => {
    if (!codeComplete) return;
    playUIClick();
    room.joinRoom(fullCode, getRandomName(), PLAYER_COLORS[1]);
  };

  const handleStart = () => {
    playUIClick();
    const online = room.players.length;
    const total = online < 4 ? 4 : online;
    room.startGame(total);
  };

  const handleCopyCode = async () => {
    if (!room.roomCode) return;
    try {
      await navigator.clipboard.writeText(room.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback: do nothing
    }
  };

  // --- Derived state ---
  const allReady = room.players.length <= 1 ||
    room.players.filter(p => !p.isHost).every(p => p.isReady);
  const myPlayer = room.players.find(p => p.id === room.playerId);
  const amReady = myPlayer?.isReady ?? false;

  // --- Reset online mode when returning to menu after a game ---
  useEffect(() => {
    if (visible && !room.isConnected && onlineMode !== 'idle') {
      setOnlineMode('idle');
    }
  }, [visible]);

  return (
    <div className={`menu-backdrop${showClass ? ' menu-visible' : ''}`}>
      <h1 className="menu-title">Roll Better</h1>
      <p className="menu-subtitle">A dice-matching game</p>

      {/* Play Local button */}
      <button className="menu-play" onClick={() => {
        useGameStore.getState().setGamePrefs({ playerCount: 4 });
        onPlay(4);
      }}>
        PLAY LOCAL
      </button>

      {/* Create / Join row */}
      <div className="menu-online-row">
        {/* CREATE button */}
        {onlineMode === 'creating' ? (
          <button
            className="menu-online-btn"
            disabled={!allReady}
            onClick={handleStart}
          >
            START
          </button>
        ) : (
          <button
            className={`menu-online-btn${onlineMode === 'joining' ? ' inactive' : ''}${onlineMode === 'joined' ? ' inactive' : ''}`}
            onClick={handleCreate}
          >
            CREATE
          </button>
        )}

        {/* JOIN button */}
        {onlineMode === 'joining' ? (
          <button
            className={`menu-online-btn${shakeJoin ? ' shake' : ''}`}
            disabled={!codeComplete}
            onClick={handleJoinSubmit}
          >
            {codeComplete ? 'START' : 'JOIN'}
          </button>
        ) : (
          <button
            className={`menu-online-btn${onlineMode === 'creating' ? '' : ''}${onlineMode === 'joined' ? ' inactive' : ''}`}
            onClick={handleJoin}
          >
            JOIN
          </button>
        )}
      </div>

      {/* Conditional inline section */}
      {onlineMode !== 'idle' && (
        <div className="menu-inline-section">
          {/* Creating mode: room code + player list */}
          {onlineMode === 'creating' && room.isConnected && room.roomCode && (
            <>
              <div className="menu-room-code" onClick={handleCopyCode}>
                {room.roomCode}
                <span className="menu-copy-label">
                  {copied ? 'Copied!' : 'TAP TO COPY'}
                </span>
              </div>
              <p className="menu-share-text">Share this code with friends</p>
              <div className="menu-player-list">
                {room.players.map((player) => (
                  <div key={player.id} className="menu-player-item">
                    <span className="menu-player-dot" style={{ backgroundColor: player.color }} />
                    <span className="menu-player-name">
                      {player.isHost && '\u2605 '}
                      {player.name}
                      {player.id === room.playerId && ' (You)'}
                    </span>
                    <span className={`menu-ready-indicator${(player.isHost || player.isReady) ? ' ready' : ''}`}>
                      {(player.isHost || player.isReady) ? '\u2713' : '\u2715'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Joining mode: code inputs */}
          {onlineMode === 'joining' && (
            <>
              <div className="menu-code-inputs">
                {codeChars.map((char, i) => (
                  <input
                    key={i}
                    ref={(el) => { codeInputRefs.current[i] = el; }}
                    className={`menu-code-char${shakeJoin ? ' shake' : ''}`}
                    type="text"
                    maxLength={1}
                    inputMode="text"
                    autoCapitalize="characters"
                    value={char}
                    onChange={(e) => handleCodeInput(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    onPaste={handleCodePaste}
                  />
                ))}
              </div>
              {room.error && (
                <div className="menu-error">{room.error}</div>
              )}
            </>
          )}

          {/* Joined mode: player list + ready toggle */}
          {onlineMode === 'joined' && room.isConnected && (
            <>
              <div className="menu-player-list">
                {room.players.map((player) => (
                  <div key={player.id} className="menu-player-item">
                    <span className="menu-player-dot" style={{ backgroundColor: player.color }} />
                    <span className="menu-player-name">
                      {player.isHost && '\u2605 '}
                      {player.name}
                      {player.id === room.playerId && ' (You)'}
                    </span>
                    <span className={`menu-ready-indicator${(player.isHost || player.isReady) ? ' ready' : ''}`}>
                      {(player.isHost || player.isReady) ? '\u2713' : '\u2715'}
                    </span>
                  </div>
                ))}
              </div>
              {!room.isHost && (
                <button
                  className={`menu-ready-btn${amReady ? ' ready' : ''}`}
                  onClick={() => room.toggleReady()}
                >
                  {amReady ? 'READY \u2713' : 'READY \u2715'}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Link buttons */}
      <div className="menu-links">
        <button className="menu-link-btn menu-upgrades-btn" disabled={true}>
          Upgrades
          <span className="menu-coming-soon-label">Coming Soon</span>
        </button>
      </div>

      {/* ? icon — bottom-left, mirrors gear */}
      <button className="menu-help" onClick={() => { playUIClick(); onOpenHowToPlay(); }}>
        ?
      </button>

      {/* Gear icon — bottom-right */}
      <button className="menu-gear" onClick={() => { playUIClick(); onOpenSettings(); }}>
        &#x2699;
      </button>
    </div>
  );
}
