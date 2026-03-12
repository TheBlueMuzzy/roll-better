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

type OnlineMode = 'idle' | 'creating' | 'joining' | 'joined' | 'claiming';

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

  // --- Transition: joining/joined → claiming when seat_list arrives (mid-game join) ---
  useEffect(() => {
    if (room.seatList !== null && (onlineMode === 'joining' || onlineMode === 'joined')) {
      setOnlineMode('claiming');
    }
  }, [room.seatList, onlineMode]);

  // --- Transition: joining → joined when connected as non-host (pre-game lobby only) ---
  // Requires room.status (set by room_state message) — mid-game joiners never receive
  // room_state, so they stay in 'joining' until seat_list arrives.
  useEffect(() => {
    if (onlineMode === 'joining' && room.isConnected && room.roomCode && !room.isHost && room.status !== null) {
      setOnlineMode('joined');
    }
  }, [onlineMode, room.isConnected, room.roomCode, room.isHost, room.status]);

  // --- Watch for join errors → shake + clear code ---
  const prevErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (room.error && room.error !== prevErrorRef.current && codeChars.some(c => c !== '')) {
      setShakeJoin(true);
      setTimeout(() => {
        if (room.errorCode !== 'room_full') {
          setCodeChars(['', '', '', '']);
        }
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
    // If already in joined, creating, or claiming mode, leave first
    if (onlineMode === 'joined' || onlineMode === 'creating' || onlineMode === 'claiming') {
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
    // If in creating, joined, or claiming mode, leave first
    if (onlineMode === 'creating' || onlineMode === 'joined' || onlineMode === 'claiming') {
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

  // --- Auto-detect lobby return (Play Again → lobby) ---
  // When returning from winners screen with active connection in waiting status,
  // auto-set the correct online mode so the lobby UI renders.
  useEffect(() => {
    if (
      visible &&
      room.isConnected &&
      room.status === 'waiting' &&
      room.players.length > 0 &&
      onlineMode === 'idle'
    ) {
      if (room.isHost) {
        setOnlineMode('creating');
      } else {
        setOnlineMode('joined');
      }
    }
  }, [visible, room.isConnected, room.status, room.players.length, onlineMode, room.isHost]);

  // --- Transition to claiming when seat_list arrives from any mode ---
  // Covers late Play Again (idle/creating/joined) and regular mid-game join (joining/joined)
  useEffect(() => {
    if (room.seatList !== null && (onlineMode === 'idle' || onlineMode === 'creating' || onlineMode === 'joined')) {
      setOnlineMode('claiming');
    }
  }, [room.seatList, onlineMode]);

  return (
    <div className={`menu-backdrop${showClass ? ' menu-visible' : ''}`}>
      <h1 className="menu-title">Roll Better</h1>
      <p className="menu-subtitle">A dice-matching game</p>

      {/* Connected elsewhere error — takes priority over everything */}
      {room.connectedElsewhere && (
        <div className="menu-inline-section">
          <div className="menu-error">You're connected in another tab</div>
          <button
            className="menu-online-btn"
            onClick={() => {
              playUIClick();
              room.clearConnectedElsewhere();
              setOnlineMode('idle');
            }}
          >
            BACK TO MENU
          </button>
        </div>
      )}

      {/* Play Local button */}
      {!room.connectedElsewhere && (
      <button className="menu-play" onClick={() => {
        useGameStore.getState().setGamePrefs({ playerCount: 4 });
        onPlay(4);
      }}>
        PLAY LOCAL
      </button>
      )}

      {/* Create / Join row */}
      {!room.connectedElsewhere && (
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
            className={`menu-online-btn${onlineMode === 'joining' ? ' inactive' : ''}${onlineMode === 'joined' ? ' inactive' : ''}${onlineMode === 'claiming' ? ' inactive' : ''}`}
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
            className={`menu-online-btn${onlineMode === 'creating' ? ' inactive' : ''}${onlineMode === 'joined' ? ' inactive' : ''}${onlineMode === 'claiming' ? ' inactive' : ''}`}
            onClick={handleJoin}
          >
            JOIN
          </button>
        )}
      </div>
      )}

      {/* Conditional inline section */}
      {!room.connectedElsewhere && onlineMode !== 'idle' && (
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
              {room.errorCode === 'room_full' && (
                <button className="menu-online-btn menu-try-again" onClick={handleJoinSubmit}>
                  TRY AGAIN
                </button>
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
            </>
          )}

          {/* Claiming mode: mid-game seat selection */}
          {onlineMode === 'claiming' && room.seatList !== null && (
            <>
              {room.claimedSeat !== null ? (
                <div className="menu-midgame-waiting">
                  <div className="menu-waiting-spinner" />
                  <p className="menu-midgame-status">
                    {room.autoMatched ? 'Reclaiming your seat... Joining next round' : 'Seat claimed! Joining next round...'}
                  </p>
                  <button
                    className="menu-cancel-claim"
                    onClick={() => {
                      playUIClick();
                      room.cancelClaim();
                    }}
                  >
                    CANCEL
                  </button>
                </div>
              ) : (
                <>
                  <p className="menu-midgame-title">Game in progress — pick a seat</p>
                  {room.seatList.length === 0 ? (
                    <p className="menu-midgame-status">No seats available</p>
                  ) : (
                    <div className="menu-seat-list">
                      {room.seatList.map((seat) => (
                        <button
                          key={seat.seatIndex}
                          className="menu-seat-btn"
                          onClick={() => {
                            playUIClick();
                            room.claimSeat(seat.seatIndex);
                          }}
                        >
                          <span className="menu-seat-avatar" style={{ backgroundColor: seat.color }} />
                          <span className="menu-seat-info">
                            <span className="menu-seat-name">{seat.name}</span>
                            <span className="menu-seat-stats">Score: {seat.score} | Locks: {seat.lockedCount}/8</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {room.seatClaimError && (
                    <p className="menu-error">{room.seatClaimError}</p>
                  )}
                </>
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
