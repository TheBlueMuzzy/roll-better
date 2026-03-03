import { useState, useEffect, useRef, useCallback } from 'react';
import { useRoom } from '../hooks/useRoom';
import { PLAYER_COLORS } from '../store/gameStore';
import type { RoomPlayer } from '../types/protocol';

interface LobbyScreenProps {
  visible: boolean;
  onGameStart: (players: RoomPlayer[], targetPlayers: number, aiDifficulty: string) => void;
  onBack: () => void;
}

const TARGET_COUNTS = [2, 3, 4, 5, 6, 7, 8];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export function LobbyScreen({ visible, onGameStart, onBack }: LobbyScreenProps) {
  const room = useRoom();

  // --- Fade transition (same mount → rAF → add class pattern as MainMenu) ---
  const [showClass, setShowClass] = useState(false);
  useEffect(() => {
    if (visible) {
      const raf = requestAnimationFrame(() => setShowClass(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setShowClass(false);
    }
  }, [visible]);

  // --- CreateJoin local state ---
  const [name, setName] = useState('');
  const [codeChars, setCodeChars] = useState(['', '', '', '']);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);

  // --- Lobby host controls state ---
  const [targetPlayers, setTargetPlayers] = useState(4);
  const [aiDifficulty, setAiDifficulty] = useState('Medium');

  // --- Clipboard feedback ---
  const [copied, setCopied] = useState(false);

  // Update target players when online player count changes
  useEffect(() => {
    const onlineCount = room.players.length;
    if (onlineCount > targetPlayers) {
      setTargetPlayers(onlineCount);
    }
  }, [room.players.length]);

  // --- Game start detection ---
  useEffect(() => {
    if (room.gameStartData) {
      onGameStart(
        room.gameStartData.players,
        room.gameStartData.targetPlayers,
        room.gameStartData.aiDifficulty,
      );
    }
  }, [room.gameStartData, onGameStart]);

  // --- Code input handlers ---
  const handleCodeInput = useCallback((index: number, value: string) => {
    const upper = value.toUpperCase().replace(/[^A-Z]/g, '');
    if (!upper) return;

    const newChars = [...codeChars];
    newChars[index] = upper[0];
    setCodeChars(newChars);

    // Auto-advance to next input
    if (index < 3) {
      codeInputRefs.current[index + 1]?.focus();
    }
  }, [codeChars]);

  const handleCodeKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (codeChars[index] === '' && index > 0) {
        // Empty input + backspace → focus previous
        codeInputRefs.current[index - 1]?.focus();
        const newChars = [...codeChars];
        newChars[index - 1] = '';
        setCodeChars(newChars);
        e.preventDefault();
      } else {
        // Clear current
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
    // Focus last filled or the 4th input
    const lastIndex = Math.min(pasted.length, 4) - 1;
    if (lastIndex >= 0) {
      codeInputRefs.current[Math.min(lastIndex + 1, 3)]?.focus();
    }
  }, []);

  const fullCode = codeChars.join('');
  const codeComplete = fullCode.length === 4;

  // --- Actions ---
  const handleCreate = () => {
    if (!name.trim()) return;
    room.createRoom(name.trim(), PLAYER_COLORS[0]);
  };

  const handleJoin = () => {
    if (!name.trim() || !codeComplete) return;
    // Color will be corrected by room_state
    room.joinRoom(fullCode, name.trim(), PLAYER_COLORS[1]);
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

  const handleLeave = () => {
    room.leave();
    onBack();
  };

  const handleStart = () => {
    room.startGame(targetPlayers, aiDifficulty.toLowerCase());
  };

  // Determine which view to show
  const inLobby = room.isConnected && room.roomCode;

  // Check if all non-host players are ready (or solo)
  const allReady = room.players.length <= 1 ||
    room.players.filter(p => !p.isHost).every(p => p.isReady);

  // Current player's ready state
  const myPlayer = room.players.find(p => p.id === room.playerId);
  const amReady = myPlayer?.isReady ?? false;

  if (!visible) return null;

  return (
    <div className={`lobby-backdrop${showClass ? ' lobby-visible' : ''}`}>
      {!inLobby ? (
        /* ─── CreateJoin View ─── */
        <div className="lobby-panel">
          <h2 className="lobby-title">Play Online</h2>

          {/* Name input */}
          <input
            className="lobby-name-input"
            type="text"
            maxLength={12}
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* Create Room button */}
          <button
            className="lobby-create-btn"
            disabled={!name.trim()}
            onClick={handleCreate}
          >
            CREATE ROOM
          </button>

          {/* Divider */}
          <div className="lobby-divider">
            <span>or join a room</span>
          </div>

          {/* Room code input: 4 individual inputs */}
          <div className="lobby-code-inputs">
            {codeChars.map((char, i) => (
              <input
                key={i}
                ref={(el) => { codeInputRefs.current[i] = el; }}
                className="lobby-code-char"
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

          {/* Join button */}
          <button
            className="lobby-join-btn"
            disabled={!codeComplete || !name.trim()}
            onClick={handleJoin}
          >
            JOIN
          </button>

          {/* Error display */}
          {room.error && (
            <div className="lobby-error">{room.error}</div>
          )}

          {/* Back button */}
          <button className="lobby-back-btn" onClick={onBack}>
            BACK
          </button>
        </div>
      ) : (
        /* ─── Lobby View ─── */
        <div className="lobby-panel">
          {/* Room code display */}
          <div className="lobby-room-code" onClick={handleCopyCode}>
            {room.roomCode}
            <span className="lobby-copy-label">
              {copied ? 'Copied!' : 'TAP TO COPY'}
            </span>
          </div>
          <p className="lobby-share-text">Share this code with friends</p>

          {/* Player list */}
          <div className="lobby-player-list">
            {room.players.map((player) => (
              <div key={player.id} className="lobby-player-item">
                <span
                  className="lobby-player-dot"
                  style={{ backgroundColor: player.color }}
                />
                <span className="lobby-player-name">
                  {player.isHost && '\u2605 '}
                  {player.name}
                  {player.id === room.playerId && ' (You)'}
                </span>
                <span className={`lobby-ready-indicator${player.isReady ? ' ready' : ''}`}>
                  {player.isReady ? '\u2713' : '\u2014'}
                </span>
              </div>
            ))}
          </div>

          {/* Ready toggle */}
          <button
            className={`lobby-ready-btn${amReady ? ' ready' : ''}`}
            onClick={() => room.toggleReady()}
          >
            {amReady ? 'NOT READY' : 'READY'}
          </button>

          {/* Host controls */}
          {room.isHost && (
            <div className="lobby-host-controls">
              {/* Player count target */}
              <div className="menu-selector-group">
                <span className="menu-selector-label">Total Players (incl. AI)</span>
                <div className="menu-selector">
                  {TARGET_COUNTS.map((count) => (
                    <button
                      key={count}
                      className={`menu-btn${targetPlayers === count ? ' selected' : ''}`}
                      disabled={count < room.players.length}
                      onClick={() => setTargetPlayers(count)}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI difficulty */}
              <div className="menu-selector-group">
                <span className="menu-selector-label">AI Difficulty</span>
                <div className="menu-selector">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      className={`menu-btn${aiDifficulty === d ? ' selected' : ''}`}
                      onClick={() => setAiDifficulty(d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start game */}
              <button
                className="lobby-start-btn"
                disabled={!allReady}
                onClick={handleStart}
              >
                START GAME
              </button>
            </div>
          )}

          {/* Error display */}
          {room.error && (
            <div className="lobby-error">{room.error}</div>
          )}

          {/* Leave button */}
          <button className="lobby-back-btn" onClick={handleLeave}>
            LEAVE
          </button>
        </div>
      )}
    </div>
  );
}
