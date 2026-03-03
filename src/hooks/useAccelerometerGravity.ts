import { useEffect, useRef } from 'react';

// --- Scene gravity defaults ---
const DEFAULT_GRAVITY = { x: 0, y: -50, z: 0 };

// How strongly phone shaking affects gravity (tunable)
const SHAKE_STRENGTH = 4;

// Clamp so shaking can't overpower base gravity entirely
const MAX_PERTURBATION = 40;

/**
 * Module-level gravity vector — mutated directly from devicemotion events.
 * Read this in useFrame (no React state, no re-renders).
 *
 * Approach: base gravity always points DOWN (y = -50).
 * Phone shake forces (event.acceleration, WITHOUT gravity) are added
 * as perturbation on top. This works regardless of how the phone is held.
 *
 * When phone is still → perturbation = 0 → dice settle normally.
 * When phone shakes → perturbation spikes → dice tumble like a cup.
 */
export const accelGravity = { x: 0, y: -50, z: 0 };

/**
 * Hook that streams DeviceMotion shake forces into accelGravity.
 * Enable during rolling phase on mobile; disable to snap back to default gravity.
 */
export function useAccelerometerGravity(enabled: boolean) {
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    if (!enabled) {
      // Reset to default when disabled
      accelGravity.x = DEFAULT_GRAVITY.x;
      accelGravity.y = DEFAULT_GRAVITY.y;
      accelGravity.z = DEFAULT_GRAVITY.z;
      return;
    }

    // Check for DeviceMotion support
    if (!('DeviceMotionEvent' in window)) return;

    const handleMotion = (event: DeviceMotionEvent) => {
      if (!enabledRef.current) return;

      // Use acceleration (WITHOUT gravity) — gives only shake/movement forces
      const accel = event.acceleration;
      if (!accel || accel.x == null || accel.y == null || accel.z == null) return;

      // Clamp each axis
      const clamp = (v: number) => Math.max(-MAX_PERTURBATION, Math.min(MAX_PERTURBATION, v));

      // Add shake perturbation on top of base gravity
      // Phone X → scene X (shake left/right)
      // Phone Y → scene Z (shake forward/back)
      // Phone Z → scene Y (shake up/down, added to base gravity)
      accelGravity.x = DEFAULT_GRAVITY.x + clamp(accel.x * SHAKE_STRENGTH);
      accelGravity.y = DEFAULT_GRAVITY.y + clamp(accel.z * SHAKE_STRENGTH);
      accelGravity.z = DEFAULT_GRAVITY.z + clamp(-accel.y * SHAKE_STRENGTH);
    };

    window.addEventListener('devicemotion', handleMotion);

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      // Reset gravity on cleanup
      accelGravity.x = DEFAULT_GRAVITY.x;
      accelGravity.y = DEFAULT_GRAVITY.y;
      accelGravity.z = DEFAULT_GRAVITY.z;
    };
  }, [enabled]);
}
