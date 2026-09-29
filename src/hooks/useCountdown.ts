// COUNTDOWN — the game's AFK timers (was the RollingCountdown component; only the look moved to
// the kit Bar in src/ui/StatusBanner.tsx). Same timing as before:
//   active     → counts down from `duration` (20 s default), ticking every 100 ms
//   onTimeout  → called once when it reaches 0
//   resetKey   → when it changes mid-countdown, start again from full (e.g. a drag-unlock committed)
// Returns how much time is left, 1 (full) → 0, or null while not running.
import { useRef, useEffect, useState } from 'react';

const TIMEOUT_MS = 20_000;

interface CountdownOptions {
  active: boolean;
  onTimeout: () => void;
  duration?: number;   // Override default 20000ms
  resetKey?: number;   // When this changes, restart timer
}

export function useCountdown({ active, onTimeout, duration, resetKey }: CountdownOptions): number | null {
  const [fraction, setFraction] = useState(1);
  const startRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedRef = useRef(false);
  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  });

  useEffect(() => {
    if (!active) {
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
      setFraction(1); // full again for the next run
    };
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps -- a new duration only applies to the next run, as before

  // Restart timer mid-countdown when resetKey changes (e.g. drag-unlock committed)
  useEffect(() => {
    if (!active || resetKey === undefined) return;
    startRef.current = Date.now();
    firedRef.current = false;
  }, [resetKey]); // eslint-disable-line react-hooks/exhaustive-deps -- only a new key restarts it

  if (!active) return null;
  return fraction;
}
