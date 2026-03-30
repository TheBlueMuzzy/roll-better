import { useRef, useEffect, useState } from 'react';

const TIMEOUT_MS = 20_000;

interface RollingCountdownProps {
  active: boolean;
  onTimeout: () => void;
  duration?: number;   // Override default 20000ms
  resetKey?: number;   // When this changes, restart timer
}

export function RollingCountdown({ active, onTimeout, duration, resetKey }: RollingCountdownProps) {
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
      const timeoutMs = duration ?? TIMEOUT_MS;
      const remaining = Math.max(0, 1 - elapsed / timeoutMs);
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

  // Restart timer mid-countdown when resetKey changes (e.g. drag-unlock committed)
  useEffect(() => {
    if (!active || resetKey === undefined) return;
    startRef.current = Date.now();
    firedRef.current = false;
    setFraction(1);
  }, [resetKey]);

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
