// --- Haptic Feedback Utility ---
// Pure utility functions — no React state, no store dependency.
// All functions gracefully no-op on unsupported devices (iOS Safari, desktop).

// --- Feature detection ---

/** Returns true if the Vibration API is available */
export function isHapticsSupported(): boolean {
  return 'vibrate' in navigator;
}

// --- Core haptic functions ---

/** Single vibration pulse (ms). No-op if unsupported. */
export function hapticPulse(ms: number): void {
  if (isHapticsSupported()) {
    navigator.vibrate(ms);
  }
}

/** Vibration pattern [pulse, pause, pulse, ...]. No-op if unsupported. */
export function hapticPattern(pattern: number[]): void {
  if (isHapticsSupported()) {
    navigator.vibrate(pattern);
  }
}

// --- Named pattern constants ---

/** Quick tap for dice bounce — scales with force via hapticBounce() */
export const HAPTIC_BOUNCE = 8;

/** Double tap — satisfying lock click */
export const HAPTIC_LOCK: number[] = [15, 50, 15];

/** Triple light tap — release feeling */
export const HAPTIC_UNLOCK: number[] = [10, 30, 10, 30, 10];

/** Single medium pulse — "go!" */
export const HAPTIC_ROLL_START = 30;

/** Escalating taps — counting up */
export const HAPTIC_SCORE: number[] = [5, 20, 5, 20, 5, 20, 10];

/** Celebration pattern */
export const HAPTIC_WIN: number[] = [20, 40, 20, 40, 30, 60, 50];

// --- Force-proportional bounce ---

/**
 * Trigger a force-proportional haptic pulse for dice bounces.
 * Clamps force to [0, 50], maps to [3, 15]ms pulse duration.
 * Skips entirely if force < 5 (too light to feel — prevents haptic spam).
 */
export function hapticBounce(forceMagnitude: number): void {
  if (forceMagnitude < 5) return; // too light — skip

  // Clamp to [0, 50]
  const clamped = Math.min(Math.max(forceMagnitude, 0), 50);

  // Map [0, 50] → [3, 15]ms
  const duration = 3 + (clamped / 50) * 12;

  hapticPulse(Math.round(duration));
}
