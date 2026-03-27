import { forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { PhysicsDie } from './PhysicsDie';
import type { PhysicsDieHandle } from './PhysicsDie';
import { Die3D } from './Die3D';
import { getGatherPoints } from '../utils/gatherPoints';
import { useGameStore } from '../store/gameStore';
import { DIE_SIZE, ROLLING_Z_MIN, ROLLING_Z_MAX, ROLLING_X_OFFSET } from './RollingArea';
import type { Group } from 'three';
import { playAllSettled, playExitPop } from '../utils/soundManager';

// Center of the rolling zone — spawn grid is offset to this Z
const ROLLING_Z_CENTER = (ROLLING_Z_MIN + ROLLING_Z_MAX) / 2; // ≈ 1.85

// --- Public API exposed via ref ---
export interface DicePoolHandle {
  rollAll(): void;
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
  function DicePool({ count, color, poolExiting, poolSpawning, spawnTargetPositions, newDiceValues, newDicePositions, newDiceRotations, remainingDiceValues, remainingDicePositions, remainingDiceRotations, onAllSettled }, ref) {
    // Refs for each PhysicsDie
    const dieRefs = useRef<(PhysicsDieHandle | null)[]>(
      Array.from({ length: count }, () => null),
    );

    // Gather (orbit) state
    const gatherActive = useGameStore((s) => s.gatherState.active);
    const gatherTouchPosition = useGameStore((s) => s.gatherState.touchPosition);
    const gatherElapsedRef = useRef(0);
    const rotationOffsetRef = useRef(0);
    const wasGatheringRef = useRef(false);

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
      if (settleTimer.current) { clearTimeout(settleTimer.current); settleTimer.current = null; }

      console.log('[DicePool] ALL SETTLED → triggering snap-flat cascade');

      // Trigger snap-flat cascade on all dice with 30ms stagger
      const STAGGER = 0.03;
      for (let i = 0; i < count; i++) {
        dieRefs.current[i]?.snapFlat(i * STAGGER);
      }

      // After cascade completes, fire actual results
      const cascadeDuration = count * STAGGER + 0.18; // stagger + animation time
      setTimeout(() => {
        console.log('[DicePool] Snap cascade done → results:', [...results.current], 'count:', count);

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
    }, [onAllSettled, count]);

    // Start fallback timer — if all dice have a result, fire after short delay
    // even if some dice keep cycling sleep/wake (e.g. stacked on each other)
    const startFallbackTimer = useCallback(() => {
      if (hasFired.current) return;
      // All dice must have reported a face value at least once
      const allHaveResults = results.current.length === count && results.current.every((r) => r !== null);
      if (!allHaveResults) return;

      // Clear existing timer and start fresh (500ms grace period)
      if (settleTimer.current) clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(() => {
        if (!hasFired.current) {
          console.log('[DicePool] Fallback settle — dice stopped moving, firing results');
          fireResults();
        }
      }, 200);
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

    // Gather orbit: drive dice toward orbital positions around touch point
    useFrame((_, delta) => {
      if (gatherActive && !wasGatheringRef.current) {
        gatherElapsedRef.current = 0;
        rotationOffsetRef.current = 0;
        wasGatheringRef.current = true;
        // Reset settle tracking for this new roll cycle
        // (rollAll does this too, but gather-release skips rollAll)
        if (settleTimer.current) { clearTimeout(settleTimer.current); settleTimer.current = null; }
        settled.current = Array.from({ length: count }, () => false);
        results.current = Array.from({ length: count }, () => null);
        positions.current = Array.from({ length: count }, () => null);
        rotations.current = Array.from({ length: count }, () => null);
        hasFired.current = false;
      } else if (!gatherActive && wasGatheringRef.current) {
        wasGatheringRef.current = false;
        for (let i = 0; i < count; i++) {
          dieRefs.current[i]?.setAttractTarget(null);
        }
        return;
      }

      if (!gatherActive || !gatherTouchPosition) return;

      const dt = Math.min(delta, 0.05);
      gatherElapsedRef.current += dt;

      // Rotation speed ramps from 0.5 to 4.0 rad/s over 3 seconds
      const rampT = Math.min(gatherElapsedRef.current / 2.25, 1.0);
      // 2 dice spin fast (max 12), 12 dice spin slower (max 6), linear between
      const countT = Math.max(0, Math.min(1, (count - 2) / 10));
      const maxSpeed = 12 - countT * 6;    // 2d=12, 12d=6
      const baseSpeed = 1.5 - countT * 0.7; // 2d=1.5, 12d=0.8
      const rotationSpeed = baseSpeed + rampT * (maxSpeed - baseSpeed);
      rotationOffsetRef.current += rotationSpeed * dt;

      const goals = getGatherPoints(
        gatherTouchPosition,
        count,
        undefined,
        rotationOffsetRef.current
      );

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
