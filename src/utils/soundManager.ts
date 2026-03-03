/**
 * SoundManager — procedural dice sounds via Web Audio API.
 * No external libraries. Module-level state (no classes).
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let activeImpacts = 0;
const MAX_CONCURRENT_IMPACTS = 8;

// --- Lifecycle ---

/** Call on first user tap to satisfy autoplay policy. */
export function initAudio(): void {
  if (ctx) return;
  ctx = new AudioContext();
  masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);

  // Pre-generate 1 second of white noise
  const sampleRate = ctx.sampleRate;
  const length = sampleRate; // 1 second
  noiseBuffer = ctx.createBuffer(1, length, sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
}

/** Set master volume. Takes 0-100 (from store), maps to 0-1 gain. */
export function setVolume(v: number): void {
  if (!masterGain || !ctx) return;
  const gain = Math.max(0, Math.min(1, v / 100));
  masterGain.gain.setValueAtTime(gain, ctx.currentTime);
}

// --- Internal helpers ---

function playNoiseBurst(
  durationMs: number,
  freqLow: number,
  freqHigh: number,
  volume: number,
): void {
  if (!ctx || !masterGain || !noiseBuffer) return;

  const duration = durationMs / 1000;

  // Source: shared noise buffer
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;

  // Bandpass filter
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = (freqLow + freqHigh) / 2;
  filter.Q.value = 1.5;

  // Per-sound gain (volume envelope)
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  // Connect: source → filter → gain → master
  source.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  source.start(now);
  source.stop(now + duration);
}

// --- Public sound generators ---

/**
 * Short noise burst simulating wooden dice impact.
 * @param force - normalized 0-1 impact strength
 */
export function playDiceImpact(force: number): void {
  if (!ctx || !masterGain) return;

  // Throttle concurrent impacts
  if (activeImpacts >= MAX_CONCURRENT_IMPACTS) return;
  activeImpacts++;

  const clampedForce = Math.max(0, Math.min(1, force));
  const duration = 20 + clampedForce * 20; // 20-40ms
  const volume = 0.15 + clampedForce * 0.55; // 0.15-0.7

  playNoiseBurst(duration, 800, 2000, volume);

  // Decrement after sound finishes
  setTimeout(() => {
    activeImpacts = Math.max(0, activeImpacts - 1);
  }, duration + 10);
}

/** Softer, lower-pitched thud when an individual die stops moving. */
export function playDiceSettle(): void {
  if (!ctx || !masterGain) return;
  playNoiseBurst(30, 400, 800, 0.3);
}

/** Short ascending two-tone chime — signals "results are in." */
export function playAllSettled(): void {
  if (!ctx || !masterGain) return;

  const now = ctx.currentTime;

  // Tone 1: 600Hz, 80ms
  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.value = 600;
  const g1 = ctx.createGain();
  g1.gain.setValueAtTime(0.25, now);
  g1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  osc1.connect(g1);
  g1.connect(masterGain);
  osc1.start(now);
  osc1.stop(now + 0.08);

  // Tone 2: 800Hz, 80ms, starts 60ms after tone 1 (slight overlap)
  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = 800;
  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(0.25, now + 0.06);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
  osc2.connect(g2);
  g2.connect(masterGain);
  osc2.start(now + 0.06);
  osc2.stop(now + 0.14);
}
