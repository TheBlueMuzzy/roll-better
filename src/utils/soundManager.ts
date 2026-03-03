/**
 * SoundManager — audio hooks for game events.
 * All trigger points wired throughout the codebase.
 * Sound implementations are stubs — replace with real audio assets later.
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;

// --- Lifecycle ---

/** Call on first user tap to satisfy autoplay policy. */
export function initAudio(): void {
  if (ctx) return;
  ctx = new AudioContext();
  masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
}

/** Set master volume. Takes 0-100 (from store), maps to 0-1 gain. */
export function setVolume(v: number): void {
  if (!masterGain || !ctx) return;
  const gain = Math.max(0, Math.min(1, v / 100));
  masterGain.gain.setValueAtTime(gain, ctx.currentTime);
}

// --- Dice physics hooks ---

/** Dice impact — called from onContactForce. @param force - normalized 0-1 */
export function playDiceImpact(_force: number): void {}

/** Individual die settles (stops moving). */
export function playDiceSettle(): void {}

/** All dice settled — results are in. */
export function playAllSettled(): void {}

// --- Lock/unlock animation hooks ---

/** Die locking into slot — snap sound. */
export function playLockSnap(): void {}

/** Die movement — whoosh sound. */
export function playWhoosh(): void {}

/** Mitosis shake phase — low rumble. */
export function playMitosisRumble(): void {}

/** Mitosis split — bright pop. */
export function playMitosisPop(): void {}

/** Die spawns into pool. */
export function playSpawnPop(): void {}

/** Die exits pool. */
export function playExitPop(): void {}

// --- Scoring hooks ---

/** Per-point tick during score counting. */
export function playScoreTick(): void {}

/** Score counting complete — chime. */
export function playScoreComplete(): void {}

/** Session winner — fanfare. */
export function playWinFanfare(): void {}

// --- UI hooks ---

/** Generic button/selection click. */
export function playUIClick(): void {}

/** Die selected in unlock phase. */
export function playSelectDie(): void {}

/** Die deselected in unlock phase. */
export function playDeselectDie(): void {}

/** New round starting. */
export function playRoundStart(): void {}

/** No matches found. */
export function playNoMatch(): void {}
