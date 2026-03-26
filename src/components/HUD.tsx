import { useRef, useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { playScoreTick, playScoreComplete, playUIClick } from '../utils/soundManager';
import { RollingCountdown } from './RollingCountdown';
import type { SeatState } from '../types/protocol';


interface HUDProps {
  onRoll: () => void;
  onConfirmUnlock: () => void;
  onOpenSettings: () => void;
}

export function HUD({ onRoll, onConfirmUnlock, onOpenSettings }: HUDProps) {
  const phase = useGameStore((s) => s.phase);
  const currentRound = useGameStore((s) => s.currentRound);
  const sessionTargetScore = useGameStore((s) => s.sessionTargetScore);
  const lastLockCount = useGameStore((s) => s.roundState.lastLockCount);
  const roundScore = useGameStore((s) => s.roundState.roundScore);
  const players = useGameStore((s) => s.players);
  const isOnlineGame = useGameStore((s) => s.isOnlineGame);

  const player = players[0];
  const score = player?.score ?? 0;
  const poolSize = player?.poolSize ?? 0;
  const isRolling = phase === 'rolling';
  const selectedCount = player?.selectedForUnlock?.length ?? 0;
  const lockedCount = player?.lockedDice?.length ?? 0;
  const mustUnlock = poolSize === 0 && lockedCount < 8;
  const maxUnlocks = Math.max(0, 12 - poolSize - lockedCount);
  const atUnlockCap = selectedCount >= maxUnlocks && maxUnlocks > 0;
  const unlockAnimating = useGameStore((s) => s.roundState.unlockAnimations.length > 0);
  const aiUnlockAnimating = useGameStore((s) => s.roundState.aiUnlockAnimations.length > 0);
  const animationsInProgress = unlockAnimating || aiUnlockAnimating;
  const hasSubmittedUnlock = useGameStore((s) => s.hasSubmittedUnlock);

  // --- Seat state change notifications ---
  const [seatNotifications, setSeatNotifications] = useState<string[]>([]);
  const prevSeatStatesRef = useRef<Map<string, SeatState>>(new Map());

  useEffect(() => {
    if (!isOnlineGame) return;
    const localId = useGameStore.getState().onlinePlayerId;
    const prev = prevSeatStatesRef.current;
    const newNotifications: string[] = [];

    for (const p of players) {
      if (p.id === 'player-0' && localId) continue; // skip local player for notifications
      const prevState = prev.get(p.id);
      if (prevState && prevState !== p.seatState) {
        if (prevState === 'human-active' && p.seatState === 'human-afk') {
          newNotifications.push(`${p.name} is on autopilot`);
        } else if (prevState === 'human-afk' && p.seatState === 'bot') {
          newNotifications.push(`Bot took over for ${p.name}`);
        } else if (prevState === 'human-afk' && p.seatState === 'human-active') {
          newNotifications.push(`${p.name} is back`);
        } else if (prevState === 'bot' && p.seatState === 'human-active') {
          if (p.takeoverReason === 'reclaim') {
            newNotifications.push(`${p.name} is back!`);
          } else {
            newNotifications.push(`${p.name} joined the game`);
          }
        }
      }
      prev.set(p.id, p.seatState);
    }

    if (newNotifications.length > 0) {
      setSeatNotifications(curr => [...curr, ...newNotifications].slice(-2));
      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        setSeatNotifications(curr => curr.slice(newNotifications.length));
      }, 3000);
    }
  }, [players, isOnlineGame]);

  // --- AFK countdown logic ---
  const showIdleCountdown = isOnlineGame && phase === 'idle';
  const showUnlockCountdown = isOnlineGame && phase === 'unlocking' && !hasSubmittedUnlock && !animationsInProgress;

  const handleIdleTimeout = useCallback(() => {
    console.log('[HUD] AFK idle timeout — auto-rolling');
    (window as unknown as Record<string, boolean>).__rbAfkRoll = true;
    onRoll();
  }, [onRoll]);

  const handleUnlockTimeout = useCallback(() => {
    const state = useGameStore.getState();
    const p = state.players[0];
    if (!p) return;

    // Clear any manual selections first — AFK AI takes over completely
    for (const slot of p.selectedForUnlock) {
      useGameStore.getState().toggleUnlockSelection(0, slot);
    }

    // Re-read player state after clearing selections
    const fresh = useGameStore.getState().players[0];
    if (!fresh) return;

    const totalDice = fresh.poolSize + fresh.lockedDice.length;

    if (totalDice < 8 && fresh.lockedDice.length > 0) {
      // Unlock as many as possible without exceeding 8 total dice
      // Each unlock adds 1 net die (removes 1 locked, adds 2 to pool)
      const maxUnlocks = Math.min(fresh.lockedDice.length, 8 - totalDice);
      const slotsToUnlock = fresh.lockedDice.slice(0, maxUnlocks).map(ld => ld.goalSlotIndex);
      for (const slot of slotsToUnlock) {
        useGameStore.getState().toggleUnlockSelection(0, slot);
      }
      console.log('[HUD] AFK unlock timeout — unlocking', slotsToUnlock.length, 'to reach 8 dice');
    } else if (fresh.poolSize === 0 && fresh.lockedDice.length < 8) {
      // Must unlock at least 1 (no dice to roll)
      const slot = fresh.lockedDice[0]?.goalSlotIndex;
      if (slot !== undefined) {
        useGameStore.getState().toggleUnlockSelection(0, slot);
      }
      console.log('[HUD] AFK unlock timeout — must-unlock 1');
    } else {
      console.log('[HUD] AFK unlock timeout — auto-skipping');
    }

    // Trigger the confirm/skip (same as pressing the button)
    (window as unknown as Record<string, boolean>).__rbAfkUnlock = true;
    onConfirmUnlock();
  }, [onConfirmUnlock]);

  // --- Score counting animation ---
  const scoreRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number>(0);

  const animateScore = useCallback((startScore: number, targetScore: number) => {
    if (startScore === targetScore || !scoreRef.current) return;

    const duration = 1500; // 1.5s
    const startTime = performance.now();
    let lastTickScore = startScore; // track displayed score for tick sounds
    let lastTickTime = 0; // throttle ticks to ~10/sec (every 100ms)

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease-out: 1 - (1-t)^3  (cubic deceleration)
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(startScore + (targetScore - startScore) * eased);

      if (scoreRef.current) {
        scoreRef.current.textContent = `${current} / ${sessionTargetScore}`;

        // Play tick sound when displayed score increments (throttled to ~10/sec)
        if (current !== lastTickScore && now - lastTickTime >= 100) {
          lastTickScore = current;
          lastTickTime = now;
          playScoreTick();
        }

        // Brief scale pulse when reaching final value
        if (t >= 1) {
          playScoreComplete();
          scoreRef.current.style.transform = 'scale(1.15)';
          setTimeout(() => {
            if (scoreRef.current) scoreRef.current.style.transform = 'scale(1)';
          }, 150);
        }
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [sessionTargetScore]);

  // Trigger counting animation when scoring phase starts
  useEffect(() => {
    if (phase === 'scoring' && roundScore > 0) {
      const startScore = score - roundScore;
      animateScore(startScore, score);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [phase, score, roundScore, animateScore]);

  const handleTapRoll = () => {
    if (phase === 'idle') onRoll();
  };

  // Status text based on phase
  let statusText: string;
  if (phase === 'lobby') {
    statusText = 'Starting...';
  } else if (phase === 'idle') {
    statusText = 'Tap to Roll';
  } else if (phase === 'rolling') {
    statusText = 'Rolling...';
  } else if (phase === 'locking') {
    statusText = lastLockCount > 0 ? `Locked ${lastLockCount}!` : 'No matches';
  } else if (phase === 'unlocking') {
    if (hasSubmittedUnlock) {
      statusText = 'Waiting for others...';
    } else if (mustUnlock && selectedCount === 0) {
      statusText = 'No dice left — unlock 1+';
    } else if (atUnlockCap) {
      statusText = `${selectedCount} selected (max 12 dice)`;
    } else if (selectedCount > 0) {
      statusText = `${selectedCount} selected`;
    } else {
      statusText = 'Tap dice to unlock';
    }
  } else if (phase === 'scoring') {
    statusText = `Round Complete! +${roundScore}pts`;
  } else if (phase === 'roundEnd') {
    statusText = 'Next Round...';
  } else if (phase === 'sessionEnd') {
    statusText = '';
  } else {
    statusText = '';
  }

  return (
    <div className="hud">
      {/* Top bar — round + score */}
      <div className="hud-top">
        <span className="hud-round">Round {currentRound}</span>
        {/* Score display removed */}
      </div>

      {/* Bottom area — status text + controls + pool stats */}
      <div className="hud-bottom">
        <RollingCountdown active={showIdleCountdown} onTimeout={handleIdleTimeout} />
        <RollingCountdown active={showUnlockCountdown} onTimeout={handleUnlockTimeout} />
        {/* During unlocking: status text only (buttons rendered centered below) */}
        {phase === 'unlocking' ? (
          <span className="hud-status">{statusText}</span>
        ) : (
          /* All other phases: tappable status text */
          <span
            className={`hud-status${isRolling ? ' hud-status--rolling' : ''}${phase === 'idle' ? ' tap-pulse' : ''}`}
            onClick={handleTapRoll}
          >
            {statusText}
          </span>
        )}

      </div>

      {/* Unlock/Skip button — centered in pool area during unlock phase, hidden during animations */}
      {phase === 'unlocking' && !animationsInProgress && !hasSubmittedUnlock && (
        <button
          className={`hud-skip-btn${mustUnlock && selectedCount === 0 ? ' hud-skip-btn--disabled' : ''}`}
          onClick={onConfirmUnlock}
          disabled={mustUnlock && selectedCount === 0}
        >
          {selectedCount > 0 ? `UNLOCK ${selectedCount}` : mustUnlock ? 'MUST UNLOCK' : 'SKIP'}
        </button>
      )}

      {/* Seat state change notifications */}
      {seatNotifications.length > 0 && (
        <div className="hud-notifications">
          {seatNotifications.map((msg, i) => (
            <div key={`${msg}-${i}`} className="hud-notification-item">
              {msg}
            </div>
          ))}
        </div>
      )}

      {/* Settings gear button — bottom-right */}
      <button className="settings-gear" onClick={() => { playUIClick(); onOpenSettings(); }}>
        &#x2699;
      </button>
    </div>
  );
}
