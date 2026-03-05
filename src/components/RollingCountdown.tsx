import { useRef, useEffect, useState } from 'react';

const TIMEOUT_MS = 20_000;

interface RollingCountdownProps {
  active: boolean;
  onTimeout: () => void;
}

export function RollingCountdown({ active, onTimeout }: RollingCountdownProps) {
  const [fraction, setFraction] = useState(1);
  const startRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedRef = useRef(false);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    if (!active) {
      setFraction(1);
      firedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    startRef.current = Date.now();
    firedRef.current = false;

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 1 - elapsed / TIMEOUT_MS);
      setFraction(remaining);

      if (remaining <= 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        if (!firedRef.current) {
          firedRef.current = true;
          onTimeoutRef.current();
        }
      }
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className="rolling-countdown">
      <div
        className="rolling-countdown-bar"
        style={{ width: `${fraction * 100}%` }}
      />
    </div>
  );
}
