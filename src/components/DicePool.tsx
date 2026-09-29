import { forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { PhysicsDie } from './PhysicsDie';
import type { PhysicsDieHandle } from './PhysicsDie';
import { Die3D } from './Die3D';
import { getGatherPoints, getGatherRadius, getGatherCenter } from '../utils/gatherPoints';
import { useGameStore } from '../store/gameStore';
import { DIE_SIZE, ROLLING_Z_MIN, ROLLING_Z_MAX, ROLLING_X_OFFSET } from './RollingArea';
import type { Group } from 'three';
import { playAllSettled, playExitPop } from '../utils/soundManager';

// Center of the rolling zone — spawn grid is offset to this Z
const ROLLING_Z_CENTER = (ROLLING_Z_MIN + ROLLING_Z_MAX) / 2; // ≈ 1.85

// --- Public API exposed via ref ---
export interface DicePoolHandle {
  rollAll(): void;
  releaseGather(): void;
  unstickAll(): void;
}

// --- Props ---
interface DicePoolProps {
  count: number;
  color: string;
  poolExiting?: boolean;
  poolSpawning?: boolean;
  spawnTargetPositions?: [number, number, number][];
  newDiceValues?: number[];
  newDicePositions?: [number, number, number][];
  newDiceRotations?: [number, number, number][];
  remainingDiceValues?: number[];
  remainingDicePositions?: [number, number, number][];
  remainingDiceRotations?: [number, number, number][];
  onAllSettled?: (values: number[], positions: [number, number, number][], rotations: [number, number, number][]) => void;
  onWallNudge?: () => void;
  onAutoRelease?: () => void;
}

// --- ExitingDie: visual-only die that plays pop+shrink animation ---
// Phase 1 (0–0.15s): scale 1 → 1.3 (ease-out)
// Phase 2 (0.15–0.45s): scale 1.3 → 0 (ease-in)
const POP_DURATION = 0.15;
const SHRINK_DURATION = 0.3;
const EXIT_TOTAL = POP_DURATION + SHRINK_DURATION;
const POP_SCALE = 1.3;

function ExitingDie({ position, rotation, color }: {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
}) {
  const groupRef = useRef<Group>(null);
  const elapsedRef = useRef(0);
  const hasStartedRef = useRef(false);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    elapsedRef.current += delta;
    const t = elapsedRef.current;

    // Play exit pop on first frame
    if (!hasStartedRef.current && t > 0) {
      hasStartedRef.current = true;
      playExitPop();
    }

    let scale: number;
    if (t < POP_DURATION) {
      // Phase 1: scale 1 → 1.3 with ease-out (decelerating)
      const p = t / POP_DURATION;
      const eased = 1 - (1 - p) * (1 - p); // ease-out quadratic
      scale = 1 + (POP_SCALE - 1) * eased;
    } else if (t < EXIT_TOTAL) {
      // Phase 2: scale 1.3 → 0 with ease-in (accelerating)
      const p = (t - POP_DURATION) / SHRINK_DURATION;
      const eased = p * p; // ease-in quadratic
      scale = POP_SCALE * (1 - eased);
    } else {
      scale = 0;
    }

    groupRef.current.scale.setScalar(Math.max(0, scale) * DIE_SIZE);
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={DIE_SIZE}>
      <Die3D color={color} />
    </group>
  );
}

function distance(a: [number, number, number], b: [number, number, number]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

// --- Spawn position calculator (exported for reuse) ---
// Lays dice out in a centered grid slightly above the floor
export function getSpawnPositions(count: number): [number, number, number][] {
  const columns = Math.ceil(Math.sqrt(count));
  const spacing = DIE_SIZE + 0.6; // die width + generous gap (prevents collider overlap)
  const positions: [number, number, number][] = [];

  for (let i = 0; i < count; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);

    // Center the grid at the rolling zone center
    const totalCols = columns;
    const totalRows = Math.ceil(count / columns);
    const x = ROLLING_X_OFFSET + (col - (totalCols - 1) / 2) * spacing;
    const z = (row - (totalRows - 1) / 2) * spacing + ROLLING_Z_CENTER;

    positions.push([x, DIE_SIZE / 2 + 0.1, z]);
  }

  return positions;
}

export const DicePool = forwardRef<DicePoolHandle, DicePoolProps>(
  function DicePool({ count, color, poolExiting, poolSpawning, spawnTargetPositions, newDiceValues, newDicePositions, newDiceRotations, remainingDiceValues, remainingDicePositions, remainingDiceRotations, onAllSettled, onWallNudge, onAutoRelease }, ref) {
    // Refs for each PhysicsDie
    const dieRefs = useRef<(PhysicsDieHandle | null)[]>(
      Array.from({ length: count }, () => null),
    );

    // Gather (orbit) state
    const gatherElapsedRef = useRef(0);
    const rotationOffsetRef = useRef(0);
    const wasGatheringRef = useRef(false);
    // Centre the dice were orbiting on the last gather frame — the release fling spins
    // them off around it. (The store clears touchPosition on release, so keep our own copy.)
    const lastOrbitCentreRef = useRef<[number, number, number] | null>(null);
    // Dev-only gather log (B008): each die's distance to its orbit spot when the pull
    // started and its last orbit spot — checked at release to see if it was swept in
    const gatherStartDistRef = useRef<(number | null)[]>([]);
    const lastGoalsRef = useRef<[number, number, number][]>([]);
    const gatherStartMsRef = useRef(0); // real clock (gatherElapsed is capped per frame)
    const rollStartTime = useRef(0);

    // Settle tracking — per-die booleans (handles dice bumping each other)
    const settled = useRef<boolean[]>(Array.from({ length: count }, () => false));
    const results = useRef<(number | null)[]>(
      Array.from({ length: count }, () => null),
    );
    const positions = useRef<([number, number, number] | null)[]>(
      Array.from({ length: count }, () => null),
    );
    const rotations = useRef<([number, number, number] | null)[]>(
      Array.from({ length: count }, () => null),
    );
    const hasFired = useRef(false);

    // Fallback timer: if dice keep cycling sleep/wake (e.g. stacked),
    // fire onAllSettled once all dice have reported a result
    const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Generation counter — bumped when pool shrinks after locking to force remount
    // so remaining dice show correct face values (not the locked die's face)
    const generation = useRef(0);

    // Spawn positions — regenerated when count changes or on rollAll
    const spawnPositions = useRef(getSpawnPositions(count));
    const prevCount = useRef(count);

    // Track info about dice that need initialFace (from unlock or post-lock remaining)
    const initialFaces = useRef<Map<number, number>>(new Map());

    // Track preserved rotations for remaining dice (from physics settle)
    const preservedRotations = useRef<Map<number, [number, number, number]>>(new Map());

    // Sync refs with count during render — INCREMENTAL (don't destroy existing)
    if (count !== prevCount.current) {
      const oldCount = prevCount.current;
      console.log(`[DicePool] Count change: ${oldCount} → ${count}`);
      prevCount.current = count;
      initialFaces.current = new Map();
      preservedRotations.current = new Map();

      // If spawn target positions were pre-computed (from spawn animation),
      // use them so PhysicsDie appear exactly where SpawningDie ended
      if (spawnTargetPositions && spawnTargetPositions.length === count && oldCount === 0) {
        spawnPositions.current = spawnTargetPositions;
        dieRefs.current = Array.from({ length: count }, () => null);
        settled.current = Array.from({ length: count }, () => false);
        results.current = Array.from({ length: count }, () => null);
        positions.current = Array.from({ length: count }, () => null);
        rotations.current = Array.from({ length: count }, () => null);
        hasFired.current = false;
      } else if (count > oldCount) {
        // Growing: keep existing dice positions unchanged, only add positions for new dice.
        // Existing physics dice stay where they are (no teleport).
        const existingPositions = spawnPositions.current.slice(0, oldCount);
        const addedCount = count - oldCount;

        // Use split target positions from unlock animation if available,
        // otherwise fall back to grid positions for added dice
        let addedPositions: [number, number, number][];
        if (newDicePositions && newDicePositions.length === addedCount) {
          addedPositions = newDicePositions;
        } else {
          addedPositions = getSpawnPositions(addedCount);
        }
        spawnPositions.current = [...existingPositions, ...addedPositions];

        dieRefs.current = [...dieRefs.current.slice(0, oldCount), ...Array(addedCount).fill(null)];
        settled.current = [...settled.current.slice(0, oldCount), ...Array(addedCount).fill(false)];
        results.current = [...results.current.slice(0, oldCount), ...Array(addedCount).fill(null)];
        positions.current = [...positions.current.slice(0, oldCount), ...Array(addedCount).fill(null)];
        rotations.current = [...rotations.current.slice(0, oldCount), ...Array(addedCount).fill(null)];
        // Set rotation for new dice from unlock animation (includes casual Y spin)
        if (newDiceRotations && newDiceRotations.length === addedCount) {
          for (let i = 0; i < addedCount; i++) {
            preservedRotations.current.set(oldCount + i, newDiceRotations[i]);
          }
        } else if (newDiceValues) {
          // Fallback: use face rotation (square)
          for (let i = 0; i < newDiceValues.length; i++) {
            initialFaces.current.set(oldCount + i, newDiceValues[i]);
          }
        }
      } else {
        // Shrinking (after locking): bump generation to force ALL dice to remount
        // with correct face values. Without this, the wrong physical die stays
        // in the pool (index-based keys keep die 0 even if die 0 was the locked one).
        generation.current++;

        // Use actual physical positions if available, otherwise fall back to grid
        if (remainingDicePositions && remainingDicePositions.length === count) {
          spawnPositions.current = remainingDicePositions;
        } else {
          spawnPositions.current = getSpawnPositions(count);
        }

        // Preserve actual physical rotations so dice don't snap to aligned orientation
        if (remainingDiceRotations && remainingDiceRotations.length === count) {
          for (let i = 0; i < count; i++) {
            preservedRotations.current.set(i, remainingDiceRotations[i]);
          }
        }

        dieRefs.current = Array.from({ length: count }, () => null);
        settled.current = Array.from({ length: count }, () => false);
        results.current = Array.from({ length: count }, () => null);
        positions.current = Array.from({ length: count }, () => null);
        rotations.current = Array.from({ length: count }, () => null);
        // Set initialFace for remaining dice so they show the correct (non-locked) values
        if (remainingDiceValues) {
          for (let i = 0; i < remainingDiceValues.length; i++) {
            initialFaces.current.set(i, remainingDiceValues[i]);
          }
        }
      }
      hasFired.current = false;
    }

    // Callback ref factory — assigns each die ref into the array
    const setDieRef = useCallback(
      (index: number) => (handle: PhysicsDieHandle | null) => {
        dieRefs.current[index] = handle;
      },
      [],
    );

    // Fire results — shared between immediate settle and fallback timer
    const fireResults = useCallback(() => {
      if (hasFired.current) return;
      hasFired.current = true;
      rollStartTime.current = 0;
      if (settleTimer.current) { clearTimeout(settleTimer.current); settleTimer.current = null; }

      console.log('[DicePool] ALL SETTLED → triggering snap-flat cascade');

      // Nudge walls outward to release any dice canted against them
      onWallNudge?.();

      // Trigger snap-flat cascade on all dice with 30ms stagger
      const STAGGER = 0.03;
      for (let i = 0; i < count; i++) {
        dieRefs.current[i]?.snapFlat(i * STAGGER);
      }

      // After cascade completes, fire actual results
      // SNAP_LIFT_DUR=0.08 + SNAP_DROP_DUR=0.05 = 0.13s per die + stagger
      const cascadeDuration = count * STAGGER + 0.15; // stagger + snap animation + small buffer
      setTimeout(() => {
        console.log('[DicePool] Snap cascade done → results:', [...results.current], 'count:', count);

        // Re-read positions/rotations AFTER snapFlat so lock lerps start
        // from the corrected pose (not the pre-snap canted pose)
        for (let i = 0; i < count; i++) {
          const transform = dieRefs.current[i]?.getTransform();
          if (transform) {
            positions.current[i] = transform.position;
            rotations.current[i] = transform.rotation;
          }
        }

        const paired = results.current.map((v, i) => ({
          value: v!,
          position: positions.current[i]!,
          rotation: rotations.current[i]!,
        }));
        paired.sort((a, b) => a.value - b.value);
        const sortedValues = paired.map((p) => p.value);
        const sortedPositions = paired.map((p) => p.position);
        const sortedRotations = paired.map((p) => p.rotation);

        playAllSettled();
        onAllSettled?.(sortedValues, sortedPositions, sortedRotations);
      }, cascadeDuration * 1000);
    }, [onAllSettled, onWallNudge, count]);

    // Start fallback timer — if all dice have a result, fire after short delay
    // even if some dice keep cycling sleep/wake (e.g. stacked on each other)
    const startFallbackTimer = useCallback(() => {
      if (hasFired.current) return;
      // All dice must have reported a face value at least once
      const allHaveResults = results.current.length === count && results.current.every((r) => r !== null);
      if (!allHaveResults) return;

      // Clear existing timer and start fresh (short grace period)
      if (settleTimer.current) clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(() => {
        if (!hasFired.current) {
          console.log('[DicePool] Fallback settle — dice stopped moving, firing results');
          fireResults();
        }
      }, 50);
    }, [count, fireResults]);

    // Result callback factory — marks die as settled, checks if ALL settled
    const handleDieResult = useCallback(
      (index: number) => (value: number, position: [number, number, number], rotation: [number, number, number]) => {
        console.log(`[DicePool] Die ${index} settled → face ${value}  (settled: ${settled.current.map((s, j) => j === index ? 'TRUE' : s).join(',')})`);
        results.current[index] = value;
        positions.current[index] = position;
        rotations.current[index] = rotation;
        settled.current[index] = true;

        // Immediate path: all dice settled at once
        if (!hasFired.current && settled.current.every(Boolean)) {
          fireResults();
        } else {
          // Fallback path: some dice may be stacked/cycling — use timer
          startFallbackTimer();
        }
      },
      [fireResults, startFallbackTimer],
    );

    // Unsettled callback — die got bumped after settling
    const handleDieUnsettled = useCallback(
      (index: number) => () => {
        console.log(`[DicePool] Die ${index} UNSETTLED (bumped)`);
        settled.current[index] = false;
        // Don't reset hasFired — if results already fired, we're done
        // Only reset if we haven't fired yet (die genuinely still rolling)
        if (!hasFired.current) {
          // Restart fallback timer since a die is still moving
          startFallbackTimer();
        }
      },
      [startFallbackTimer],
    );

    // Dev-only gather log (B008): at release, was every die pulled toward its orbit spot?
    // A die counts as swept in if it got at least 20% closer, or is already on its spot.
    function logGatherRelease() {
      if (lastGoalsRef.current.length === 0) {
        console.log(`[Gather] released before the first pull frame — rolling all ${count} dice normally`);
        return;
      }
      // The pull takes ~1 s to reach the ring — a quick tap can't be judged
      const heldSeconds = (performance.now() - gatherStartMsRef.current) / 1000;
      if (heldSeconds < 0.6) {
        console.log(`[Gather] quick tap (${heldSeconds.toFixed(2)}s) — too short to judge the pull`);
        return;
      }
      const lines: string[] = [];
      const missed: number[] = [];
      for (let i = 0; i < count; i++) {
        const pos = dieRefs.current[i]?.getTransform()?.position;
        const goal = lastGoalsRef.current[i];
        const startDist = gatherStartDistRef.current[i];
        if (!pos || !goal || startDist == null) {
          missed.push(i);
          lines.push(`die ${i}: never pulled (${!pos ? 'no die' : 'no orbit spot'})`);
          continue;
        }
        const endDist = distance(pos, goal);
        const pulled = endDist < 0.3 || endDist < startDist * 0.8;
        if (!pulled) missed.push(i);
        lines.push(`die ${i}: ${startDist.toFixed(2)} → ${endDist.toFixed(2)} from its spot, y ${pos[1].toFixed(2)}${pulled ? '' : ' ← MISSED'}`);
      }
      const summary = missed.length === 0
        ? `all ${count} dice swept in`
        : `MISSED ${missed.length}/${count} dice [${missed.join(', ')}]`;
      console.log(`[Gather] release after ${heldSeconds.toFixed(2)}s: ${summary} — ${lines.join(' | ')}`);
    }

    // Dev-only: lets e2e/roll-physics.mjs read where every die is (B007/B008 checks)
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__rbDice = () =>
        dieRefs.current.slice(0, count).map((die) => ({
          position: die?.getTransform()?.position ?? null,
          speed: die?.getSpeed() ?? 0,
        }));
    }

    // Release = the roll. Called straight from the pointer-up / auto-release / AFK code
    // (Scene), not detected from React state a frame later: a quick tap could start and
    // end the gather between two drawn frames, the pool never noticed, and the roll hung
    // in 'rolling' forever with no timeout (B007).
    function releaseGather() {
      wasGatheringRef.current = false;
      // The roll starts now — reset settle tracking for this roll
      // (rollAll does this too, but gather-release skips rollAll)
      if (settleTimer.current) { clearTimeout(settleTimer.current); settleTimer.current = null; }
      settled.current = Array.from({ length: count }, () => false);
      results.current = Array.from({ length: count }, () => null);
      positions.current = Array.from({ length: count }, () => null);
      rotations.current = Array.from({ length: count }, () => null);
      hasFired.current = false;
      rollStartTime.current = Date.now();
      if (import.meta.env.DEV) logGatherRelease();
      // Compute tangential release velocity for each die, around the orbit centre
      const center = lastOrbitCentreRef.current;
      const speed = rotationOffsetRef.current > 0 ?
        // Use last rotation speed — approximate from recent offset change
        Math.min(gatherElapsedRef.current / 2.25, 1.0) : 0;
      const countT2 = Math.max(0, Math.min(1, (count - 2) / 10));
      const maxSpd = 45 - countT2 * 20;
      const baseSpd = 7.5 - countT2 * 3.5;
      const curvedSpd = speed * speed * speed;
      const rotSpeed = baseSpd + curvedSpd * (maxSpd - baseSpd);

      for (let i = 0; i < count; i++) {
        const die = dieRefs.current[i];
        if (!die) continue;
        const transform = die.getTransform();
        if (transform && center) {
          // Radius vector from center to die (XZ plane)
          const rx = transform.position[0] - center[0];
          const rz = transform.position[2] - center[2];
          const r = Math.sqrt(rx * rx + rz * rz);
          if (r > 0.01) {
            // Tangential direction: perpendicular to radius
            const tx = -rz / r;
            const tz = rx / r;
            const tangentialSpeed = rotSpeed * r;
            // Fling outward: tangential + some radial (outward push)
            const radialPush = tangentialSpeed * 0.3;
            die.setAttractTarget(null, [
              tx * tangentialSpeed + (rx / r) * radialPush,
              -2, // slight downward to start the fall
              tz * tangentialSpeed + (rz / r) * radialPush,
            ]);
          } else {
            die.setAttractTarget(null);
          }
        } else {
          die.setAttractTarget(null);
        }
      }
      // Released before the pull ever ran (tap quicker than one frame): roll them normally
      if (lastGoalsRef.current.length === 0) {
        for (let i = 0; i < count; i++) dieRefs.current[i]?.roll();
      }
      lastGoalsRef.current = [];
      lastOrbitCentreRef.current = null;
      gatherElapsedRef.current = 0;
      rotationOffsetRef.current = 0;
    }

    // Gather orbit: drive dice toward orbital positions around touch point
    useFrame((_, delta) => {
      // Read the store directly (not React state) so the pool sees the gather this frame
      const { active: gatherActive, touchPosition: gatherTouchPosition } = useGameStore.getState().gatherState;
      if (gatherActive && !wasGatheringRef.current) {
        gatherElapsedRef.current = 0;
        rotationOffsetRef.current = 0;
        wasGatheringRef.current = true;
        lastOrbitCentreRef.current = null;
        gatherStartDistRef.current = Array.from({ length: count }, () => null);
        lastGoalsRef.current = [];
        gatherStartMsRef.current = performance.now();
        // B007: no roll is in flight while gathering — the roll starts at release.
        // Block every settle path (speed check, fallback timer, 10 s timeout) until then,
        // or dice sitting still before the pull (e.g. a pool that just spawned) would
        // "settle" mid-gather, their results get ignored, and the roll hangs forever.
        if (settleTimer.current) { clearTimeout(settleTimer.current); settleTimer.current = null; }
        hasFired.current = true;
        rollStartTime.current = 0;
      }

      // Active velocity check — detect nearly-stopped dice faster than Rapier onSleep
      // Only runs after dice have been rolling for at least 0.5s (avoids firing at rest)
      if (!hasFired.current && rollStartTime.current > 0 && Date.now() - rollStartTime.current > 500) {
        const allNearlyStopped = dieRefs.current.every((die, i) => {
          if (i >= count) return true;
          if (!die) return true;
          return die.getSpeed() < 0.5;
        });
        if (allNearlyStopped) {
          // Read face values directly and fire immediately
          let allHaveValues = true;
          for (let i = 0; i < count; i++) {
            if (results.current[i] === null) {
              const value = dieRefs.current[i]?.getResult();
              const transform = dieRefs.current[i]?.getTransform();
              if (value !== undefined && transform) {
                results.current[i] = value;
                positions.current[i] = transform.position;
                rotations.current[i] = transform.rotation;
                settled.current[i] = true;
              } else {
                allHaveValues = false;
              }
            }
          }
          if (allHaveValues) {
            fireResults();
          }
        }
      }

      // Absolute 10s settle timeout — prevents infinite oscillation (ISS-005)
      if (!hasFired.current && rollStartTime.current > 0 && Date.now() - rollStartTime.current > 10000) {
        console.warn('[DicePool] Absolute 10s settle timeout — force-firing results');
        for (let i = 0; i < count; i++) {
          if (results.current[i] === null) {
            const value = dieRefs.current[i]?.getResult();
            const transform = dieRefs.current[i]?.getTransform();
            if (value !== undefined && transform) {
              results.current[i] = value;
              positions.current[i] = transform.position;
              rotations.current[i] = transform.rotation;
            }
          }
        }
        fireResults();
      }

      if (!gatherActive || !gatherTouchPosition) return;

      const dt = Math.min(delta, 0.05);
      gatherElapsedRef.current += dt;

      const RAMP_DUR = 2.5;
      const SHRINK_DUR = 2.25; // scale + radius shrink over 0→2.25s

      // Auto-release at max charge
      if (gatherElapsedRef.current >= RAMP_DUR) {
        onAutoRelease?.();
        return;
      }

      // Hockey stick speed curve: t³ for ease-in acceleration
      const rampT = Math.min(gatherElapsedRef.current / SHRINK_DUR, 1.0);
      const countT = Math.max(0, Math.min(1, (count - 2) / 10));
      const maxSpeed = 45 - countT * 20;    // 2d=45, 12d=25
      const baseSpeed = 7.5 - countT * 3.5; // 2d=7.5, 12d=4.0
      const curvedT = rampT * rampT * rampT; // cubic ease-in (hockey stick)
      const rotationSpeed = baseSpeed + curvedT * (maxSpeed - baseSpeed);
      rotationOffsetRef.current += rotationSpeed * dt;

      // Dice shrink 1.0 → 0.25 over 0→2.25s
      const shrinkT = Math.min(gatherElapsedRef.current / SHRINK_DUR, 1.0);
      const dieScale = 1.0 - 0.75 * shrinkT; // 1.0 → 0.25
      for (let i = 0; i < count; i++) {
        dieRefs.current[i]?.setAttractScale(dieScale);
      }

      // Radius shrinks over same period — stop at size where 0.25 dice don't collide
      // At 0.25 scale, die width = 0.2. Need spacing > 0.4 between centers.
      // Min safe radius = 0.4 * count / (2π). For 12: ~0.76
      const baseRadius = getGatherRadius(count);
      const minRadius = Math.max(0.4, 0.065 * count); // safe floor per count
      const radiusScale = 1.0 - shrinkT * (1.0 - minRadius / baseRadius);
      const radius = baseRadius * Math.max(radiusScale, minRadius / baseRadius);

      const goals = getGatherPoints(
        gatherTouchPosition,
        count,
        radius,
        rotationOffsetRef.current
      );
      lastOrbitCentreRef.current = getGatherCenter(gatherTouchPosition, radius);
      lastGoalsRef.current = goals;
      if (import.meta.env.DEV) {
        // First frame each die is here to pull: remember how far it was from its spot
        for (let i = 0; i < count && i < goals.length; i++) {
          const pos = dieRefs.current[i]?.getTransform()?.position;
          if (pos && gatherStartDistRef.current[i] == null) {
            gatherStartDistRef.current[i] = distance(pos, goals[i]);
          }
        }
      }

      for (let i = 0; i < count && i < goals.length; i++) {
        dieRefs.current[i]?.setAttractTarget(goals[i]);
      }
    });

    useImperativeHandle(ref, () => ({
      rollAll() {
        // Clear any pending fallback timer
        if (settleTimer.current) { clearTimeout(settleTimer.current); settleTimer.current = null; }
        // Reset settled tracking
        settled.current = Array.from({ length: count }, () => false);
        results.current = Array.from({ length: count }, () => null);
        positions.current = Array.from({ length: count }, () => null);
        rotations.current = Array.from({ length: count }, () => null);
        hasFired.current = false;
        rollStartTime.current = Date.now();
        initialFaces.current = new Map();
        preservedRotations.current = new Map();
        wasGatheringRef.current = false;
        gatherElapsedRef.current = 0;
        rotationOffsetRef.current = 0;

        // Roll each die from wherever it currently sits
        for (let i = 0; i < count; i++) {
          dieRefs.current[i]?.roll();
        }
      },

      releaseGather,

      unstickAll() {
        const gridPositions = getSpawnPositions(count);
        for (let i = 0; i < count; i++) {
          dieRefs.current[i]?.unstick(gridPositions[i], i * 0.04);
        }
      },
    }));

    // When poolSpawning, render nothing — SpawningDie handles visuals in Scene
    if (poolSpawning) {
      return <group />;
    }

    // When poolExiting, render visual-only ExitingDie (pop+shrink) instead of PhysicsDie
    if (poolExiting && count > 0) {
      return (
        <group>
          {spawnPositions.current.map((pos, i) => (
            <ExitingDie
              key={`exit-${generation.current}-${i}`}
              position={pos}
              rotation={preservedRotations.current.get(i) || [0, 0, 0]}
              color={color}
            />
          ))}
        </group>
      );
    }

    return (
      <group>
        {spawnPositions.current.map((pos, i) => (
          <PhysicsDie
            key={`${generation.current}-${i}`}
            ref={setDieRef(i)}
            color={color}
            position={pos}
            initialFace={initialFaces.current.get(i)}
            initialRotation={preservedRotations.current.get(i)}
            onResult={handleDieResult(i)}
            onUnsettled={handleDieUnsettled(i)}
          />
        ))}
      </group>
    );
  },
);
