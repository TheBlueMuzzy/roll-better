import { useEffect, useRef, useCallback, useState } from 'react';

// --- Tunable constants ---
const SHAKE_THRESHOLD = 15;  // magnitude of acceleration delta to trigger shake
const SHAKE_COOLDOWN = 1000; // ms to ignore after a shake trigger

type PermissionState = 'prompt' | 'granted' | 'denied' | 'not-needed';

/**
 * Shake-to-roll hook using DeviceMotion API.
 * Calls onShake() when a shake gesture is detected (threshold + cooldown).
 * Handles iOS requestPermission flow; Android auto-grants.
 */
export function useShakeToRoll(onShake: () => void, enabled: boolean) {
  const [isSupported, setIsSupported] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt');

  // Refs for high-frequency acceleration tracking (never use state for these)
  const lastAccelRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const lastTriggerRef = useRef(0);
  const onShakeRef = useRef(onShake);

  // Keep onShake ref current without re-subscribing the event listener
  useEffect(() => {
    onShakeRef.current = onShake;
  }, [onShake]);

  // Feature detection + iOS check (runs once on mount)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hasDeviceMotion = 'DeviceMotionEvent' in window;
    setIsSupported(hasDeviceMotion);

    if (!hasDeviceMotion) {
      // Desktop / unsupported — no need for permission
      setPermissionState('not-needed');
      return;
    }

    // Check if iOS permission flow is needed
    const needsPermission =
      typeof (DeviceMotionEvent as any).requestPermission === 'function';

    if (!needsPermission) {
      // Android or older iOS — auto-granted
      setPermissionState('not-needed');
    }
    // else: iOS 13+ — stays 'prompt' until user taps the permission button
  }, []);

  // iOS permission request — must be called from a user gesture
  const requestPermission = useCallback(async () => {
    if (typeof (DeviceMotionEvent as any).requestPermission !== 'function') {
      setPermissionState('not-needed');
      return;
    }

    try {
      const result: string = await (DeviceMotionEvent as any).requestPermission();
      if (result === 'granted') {
        setPermissionState('granted');
      } else {
        setPermissionState('denied');
      }
    } catch {
      setPermissionState('denied');
    }
  }, []);

  // Attach / detach devicemotion listener
  useEffect(() => {
    if (!isSupported) return;
    if (!enabled) return;
    if (permissionState !== 'granted' && permissionState !== 'not-needed') return;

    const handleMotion = (event: DeviceMotionEvent) => {
      const accel = event.accelerationIncludingGravity;
      if (!accel || accel.x == null || accel.y == null || accel.z == null) return;

      const { x, y, z } = accel as { x: number; y: number; z: number };
      const last = lastAccelRef.current;

      if (last !== null) {
        const dx = x - last.x;
        const dy = y - last.y;
        const dz = z - last.z;
        const magnitude = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (magnitude > SHAKE_THRESHOLD) {
          const now = Date.now();
          if (now - lastTriggerRef.current > SHAKE_COOLDOWN) {
            lastTriggerRef.current = now;
            onShakeRef.current();
          }
        }
      }

      lastAccelRef.current = { x, y, z };
    };

    window.addEventListener('devicemotion', handleMotion);

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      lastAccelRef.current = null;
    };
  }, [isSupported, enabled, permissionState]);

  return { isSupported, permissionState, requestPermission };
}
