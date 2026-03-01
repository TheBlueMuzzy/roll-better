import { forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import { PhysicsDie } from './PhysicsDie';
import type { PhysicsDieHandle } from './PhysicsDie';
import { DIE_SIZE, ROLLING_Z_MIN, ROLLING_Z_MAX } from './RollingArea';

// Center of the rolling zone — spawn grid is offset to this Z
const ROLLING_Z_CENTER = (ROLLING_Z_MIN + ROLLING_Z_MAX) / 2; // ≈ 1.85

// --- Public API exposed via ref ---
export interface DicePoolHandle {
  rollAll(): void;
}

// --- Props ---
interface DicePoolProps {
  count: number;
  color: string;
  newDiceValues?: number[];
  newDicePositions?: [number, number, number][];
  newDiceRotations?: [number, number, number][];
  remainingDiceValues?: number[];
  remainingDicePositions?: [number, number, number][];
  remainingDiceRotations?: [number, number, number][];
  onAllSettled?: (values: number[], positions: [number, number, number][], rotations: [number, number, number][]) => void;
}

// --- Spawn position calculator (exported for reuse) ---
// Lays dice out in a centered grid slightly above the floor
export function getSpawnPositions(count: number): [number, number, number][] {
  const columns = Math.ceil(Math.sqrt(count));
  const spacing = DIE_SIZE + 0.3; // die width + gap
  const positions: [number, number, number][] = [];

  for (let i = 0; i < count; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);

    // Center the grid at the rolling zone center
    const totalCols = columns;
    const totalRows = Math.ceil(count / columns);
    const x = (col - (totalCols - 1) / 2) * spacing;
    const z = (row - (totalRows - 1) / 2) * spacing + ROLLING_Z_CENTER;

    // Add small random offset for visual variety
    const jitterX = (Math.random() - 0.5) * 0.2; // ±0.1
    const jitterZ = (Math.random() - 0.5) * 0.2;

    positions.push([x + jitterX, DIE_SIZE / 2 + 0.1, z + jitterZ]);
  }

  return positions;
}

export const DicePool = forwardRef<DicePoolHandle, DicePoolProps>(
  function DicePool({ count, color, newDiceValues, newDicePositions, newDiceRotations, remainingDiceValues, remainingDicePositions, remainingDiceRotations, onAllSettled }, ref) {
    // Refs for each PhysicsDie
    const dieRefs = useRef<(PhysicsDieHandle | null)[]>(
      Array.from({ length: count }, () => null),
    );

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

      if (count > oldCount) {
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

    // Result callback factory — marks die as settled, checks if ALL settled
    const handleDieResult = useCallback(
      (index: number) => (value: number, position: [number, number, number], rotation: [number, number, number]) => {
        console.log(`[DicePool] Die ${index} settled → face ${value}  (settled: ${settled.current.map((s, j) => j === index ? 'TRUE' : s).join(',')})`);
        results.current[index] = value;
        positions.current[index] = position;
        rotations.current[index] = rotation;
        settled.current[index] = true;

        if (!hasFired.current && settled.current.every(Boolean)) {
          hasFired.current = true;
          console.log('[DicePool] ALL SETTLED → results:', [...results.current], 'count:', count);

          // Sort values, positions, and rotations together so indices stay aligned
          const paired = results.current.map((v, i) => ({
            value: v!,
            position: positions.current[i]!,
            rotation: rotations.current[i]!,
          }));
          paired.sort((a, b) => a.value - b.value);
          const sortedValues = paired.map((p) => p.value);
          const sortedPositions = paired.map((p) => p.position);
          const sortedRotations = paired.map((p) => p.rotation);

          onAllSettled?.(sortedValues, sortedPositions, sortedRotations);
        }
      },
      [onAllSettled, count],
    );

    // Unsettled callback — die got bumped after settling
    const handleDieUnsettled = useCallback(
      (index: number) => () => {
        console.log(`[DicePool] Die ${index} UNSETTLED (bumped)`);
        settled.current[index] = false;
        hasFired.current = false;
      },
      [],
    );

    useImperativeHandle(ref, () => ({
      rollAll() {
        // Reset settled tracking
        settled.current = Array.from({ length: count }, () => false);
        results.current = Array.from({ length: count }, () => null);
        positions.current = Array.from({ length: count }, () => null);
        rotations.current = Array.from({ length: count }, () => null);
        hasFired.current = false;
        initialFaces.current = new Map();
        preservedRotations.current = new Map();

        // Roll each die from wherever it currently sits
        for (let i = 0; i < count; i++) {
          dieRefs.current[i]?.roll();
        }
      },
    }));

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
