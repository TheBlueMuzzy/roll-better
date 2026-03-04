import { useRef, useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { getGameSocket, sendMessage } from '../utils/partyClient';

const TIMEOUT_MS = 20_000;

export function RollingCountdown() {
  const phase = useGameStore((s) => s.phase);
  const isOnlineGame = useGameStore((s) => s.isOnlineGame);
  const isOnlineHost = useGameStore((s) => s.isOnlineHost);

  const [fraction, setFraction] = useState(1);
  const startRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sentRef = useRef(false);

  const isRolling = phase === 'rolling' && isOnlineGame;

  useEffect(() => {
    if (!isRolling) {
      // Reset when leaving rolling phase
      setFraction(1);
      sentRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start countdown
    startRef.current = Date.now();
    sentRef.current = false;

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 1 - elapsed / TIMEOUT_MS);
      setFraction(remaining);

      if (remaining <= 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        // Host sends rolling_timeout to server
        if (isOnlineHost && !sentRef.current) {
          sentRef.current = true;
          const socket = getGameSocket();
          if (socket) {
            sendMessage(socket, { type: 'rolling_timeout' });
            console.log('[RollingCountdown] Host sent rolling_timeout');
          }
        }
      }
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRolling, isOnlineHost]);

  if (!isRolling) return null;

  return (
    <div className="rolling-countdown">
      <div
        className="rolling-countdown-bar"
        style={{ width: `${fraction * 100}%` }}
      />
    </div>
  );
}
