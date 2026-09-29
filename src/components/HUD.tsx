import { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { playScoreTick, playScoreComplete, playUIClick } from '../utils/soundManager';
import { RollingCountdown } from './RollingCountdown';
import type { SeatState } from '../types/protocol';
import { shouldRunUnlockTimer } from '../utils/unlockTurn';
import { toast } from '../ui/kit';
import { text, fill } from '../ui/words';


interface HUDProps {
  onRoll: () => void;
  onForceRelease: () => void;
  onUnlockTimerExpire: () => void;
  onOpenSettings: () => void;
}

export function HUD({ onRoll, onForceRelease, onUnlockTimerExpire, onOpenSettings }: HUDProps) {
  const phase = useGameStore((s) => s.phase);
  const currentRound = useGameStore((s) => s.currentRound);
  const sessionTargetScore = useGameStore((s) => s.sessionTargetScore);
  const lastLockCount = useGameStore((s) => s.roundState.lastLockCount);
  const roundScore = useGameStore((s) => s.roundState.roundScore);
  const players = useGameStore((s) => s.players);
  const isOnlineGame = useGameStore((s) => s.isOnlineGame);

  const player = players[0];
  const score = player?.score ?? 0;
  const isRolling = phase === 'rolling';
  const unlockAnimating = useGameStore((s) => s.roundState.unlockAnimations.length > 0);
  const aiUnlockAnimating = useGameStore((s) => s.roundState.aiUnlockAnimations.length > 0);
  const animationsInProgress = unlockAnimating || aiUnlockAnimating;
  const hasSubmittedUnlock = useGameStore((s) => s.hasSubmittedUnlock);
  const unlockTimerResetKey = useGameStore((s) => s.unlockTimerResetKey);
  const committedUnlocks = useGameStore((s) => s.committedUnlocks);

  // --- Seat state change notifications (kit toasts, words in content/text/en.json hud.seat) ---
  const prevSeatStatesRef = useRef<Map<string, SeatState>>(new Map());

  useEffect(() => {
    if (!isOnlineGame) return;
    const localId = useGameStore.getState().onlinePlayerId;
    const prev = prevSeatStatesRef.current;
    const seat = text.hud.seat;

    for (const p of players) {
      if (p.id === 'player-0' && localId) continue; // skip local player for notifications
      const prevState = prev.get(p.id);
      if (prevState && prevState !== p.seatState) {
        if (prevState === 'human-active' && p.seatState === 'human-afk') {
          toast(fill(seat.autopilot, { name: p.name }));
        } else if (prevState === 'human-afk' && p.seatState === 'bot') {
          toast(fill(seat.botTookOver, { name: p.name }));
        } else if (prevState === 'human-afk' && p.seatState === 'human-active') {
          toast(fill(seat.back, { name: p.name }));
        } else if (prevState === 'bot' && p.seatState === 'human-active') {
          if (p.takeoverReason === 'reclaim') {
            toast(fill(seat.reclaimed, { name: p.name }));
          } else {
            toast(fill(seat.joined, { name: p.name }));
          }
        }
      }
      prev.set(p.id, p.seatState);
    }
  }, [players, isOnlineGame]);

  // --- AFK countdown logic ---
  const showIdleCountdown = isOnlineGame && phase === 'idle';
  const timerAlreadyFired = unlockTimerResetKey < 0;
  // Drag inactivity timer ends the unlock turn — offline AND online (B003 / TDD D15).
  // Online there is no separate 20 s unlock countdown any more; the server's 25 s timer catches real AFK.
  const showUnlockInactivityTimer = shouldRunUnlockTimer({ isOnlineGame, phase, animationsInProgress, timerAlreadyFired, hasSubmittedUnlock });

  const handleIdleTimeout = useCallback(() => {
    (window as unknown as Record<string, boolean>).__rbAfkRoll = true;
    // If player is mid-gather, force-release dice (they have orbital momentum)
    if (useGameStore.getState().gatherState.active) {
      console.log('[HUD] AFK mid-gather timeout — force-releasing');
      onForceRelease();
    } else {
      // Normal idle: use rollAll path (lift + random impulse + torque)
      console.log('[HUD] AFK idle timeout — auto-rolling');
      onRoll();
    }
  }, [onRoll, onForceRelease]);


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

  // Status text based on phase
  let statusText: string;
  if (phase === 'lobby') {
    statusText = 'Starting...';
  } else if (phase === 'idle') {
    statusText = 'Hold to Roll';
  } else if (phase === 'rolling') {
    statusText = 'Rolling...';
  } else if (phase === 'locking') {
    statusText = lastLockCount > 0 ? `Locked ${lastLockCount}!` : 'No matches';
  } else if (phase === 'unlocking') {
    if (unlockTimerResetKey < 0) {
      statusText = '';  // Timer fired, finalizing — no text
    } else if (animationsInProgress) {
      statusText = '';
    } else if (isOnlineGame && hasSubmittedUnlock) {
      statusText = 'Waiting for others...';
    } else if (committedUnlocks.length > 0) {
      statusText = `${committedUnlocks.length} unlocked`;
    } else {
      statusText = 'Drag dice to unlock';
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
        <RollingCountdown
          active={showUnlockInactivityTimer}
          onTimeout={onUnlockTimerExpire}
          duration={3000}
          resetKey={unlockTimerResetKey}
        />
        {/* During unlocking: status text only (buttons rendered centered below) */}
        {phase === 'unlocking' ? (
          <span className="hud-status">{statusText}</span>
        ) : (
          /* All other phases: status text */
          <span
            className={`hud-status${isRolling ? ' hud-status--rolling' : ''}`}
          >
            {statusText}
          </span>
        )}

      </div>

      {/* Settings gear button — bottom-right */}
      <button className="settings-gear" onClick={() => { playUIClick(); onOpenSettings(); }}>
        &#x2699;
      </button>
    </div>
  );
}
