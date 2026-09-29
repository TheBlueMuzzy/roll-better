import { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { playScoreTick, playScoreComplete, playUIClick } from '../utils/soundManager';
import type { SeatState } from '../types/protocol';
import { toast } from '../ui/kit';
import { text, fill } from '../ui/words';


interface HUDProps {
  onOpenSettings: () => void;
}

export function HUD({ onOpenSettings }: HUDProps) {
  const phase = useGameStore((s) => s.phase);
  const currentRound = useGameStore((s) => s.currentRound);
  const sessionTargetScore = useGameStore((s) => s.sessionTargetScore);
  const roundScore = useGameStore((s) => s.roundState.roundScore);
  const players = useGameStore((s) => s.players);
  const isOnlineGame = useGameStore((s) => s.isOnlineGame);

  const player = players[0];
  const score = player?.score ?? 0;

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

  return (
    <div className="hud">
      {/* Top bar — round + score */}
      <div className="hud-top">
        <span className="hud-round">Round {currentRound}</span>
        {/* Score display removed */}
      </div>

      {/* Bottom area — status text + controls + pool stats */}
      <div className="hud-bottom">
        {/* AFK timers: run and shown by StatusPin.tsx (inside the Canvas), beside the status banner */}
        {/* Status words: a kit banner pinned over the rolling area (StatusPin.tsx, inside the Canvas) */}
      </div>

      {/* Settings gear button — bottom-right */}
      <button className="settings-gear" onClick={() => { playUIClick(); onOpenSettings(); }}>
        &#x2699;
      </button>
    </div>
  );
}
