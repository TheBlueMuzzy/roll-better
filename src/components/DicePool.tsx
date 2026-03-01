import { forwardRef, useImperativeHandle, useRef, useCallback, useMemo } from 'react';
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
  onAllSettled?: (results: number[]) => void;
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
  function DicePool({ count, color, newDiceValues, onAllSettled }, ref) {
    // Refs for each PhysicsDie
    const dieRefs = useRef<(PhysicsDieHandle | null)[]>(
      Array.from({ length: count }, () => null),
    );

    // Settle tracking — per-die booleans (handles dice bumping each other)
    const settled = useRef<boolean[]>(Array.from({ length: count }, () => false));
    const results = useRef<(number | null)[]>(
      Array.from({ length: count }, () => null),
    );
    const hasFired = useRef(false);

    // Spawn positions — regenerated when count changes or on rollAll
    const spawnPositions = useRef(getSpawnPositions(count));
    const prevCount = useRef(count);

    // Track info about newly added dice (for initialFace prop)
    const newDiceInfo = useRef<{ startIndex: number; values: number[] } | null>(null);

    // Sync refs with count during render — INCREMENTAL (don't destroy existing)
    if (count !== prevCount.current) {
      const oldCount = prevCount.current;
      prevCount.current = count;
      spawnPositions.current = getSpawnPositions(count);

      if (count > oldCount) {
        // Growing: keep existing dice state, extend arrays for new dice
        dieRefs.current = [...dieRefs.current.slice(0, oldCount), ...Array(count - oldCount).fill(null)];
        settled.current = [...settled.current.slice(0, oldCount), ...Array(count - oldCount).fill(false)];
        results.current = [...results.current.slice(0, oldCount), ...Array(count - oldCount).fill(null)];
        newDiceInfo.current = { startIndex: oldCount, values: newDiceValues || [] };
      } else {
        // Shrinking: truncate arrays (higher-index dice unmount)
        dieRefs.current = dieRefs.current.slice(0, count);
        settled.current = settled.current.slice(0, count);
        results.current = results.current.slice(0, count);
        newDiceInfo.current = null;
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
      (index: number) => (value: number) => {
        results.current[index] = value;
        settled.current[index] = true;

        if (!hasFired.current && settled.current.every(Boolean)) {
          hasFired.current = true;
          onAllSettled?.(results.current as number[]);
        }
      },
      [onAllSettled],
    );

    // Unsettled callback — die got bumped after settling
    const handleDieUnsettled = useCallback(
      (index: number) => () => {
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
        hasFired.current = false;
        newDiceInfo.current = null;

        // Regenerate spawn positions for fresh jitter
        spawnPositions.current = getSpawnPositions(count);

        // Roll each die
        for (let i = 0; i < count; i++) {
          dieRefs.current[i]?.roll();
        }
      },
    }));

    return (
      <group>
        {spawnPositions.current.map((pos, i) => {
          // New dice from unlocking get initialFace to show the unlocked value
          let initialFace: number | undefined;
          if (newDiceInfo.current && i >= newDiceInfo.current.startIndex) {
            const newIdx = i - newDiceInfo.current.startIndex;
            initialFace = newDiceInfo.current.values[newIdx];
          }

          return (
            <PhysicsDie
              key={i}
              ref={setDieRef(i)}
              color={color}
              position={pos}
              initialFace={initialFace}
              onResult={handleDieResult(i)}
              onUnsettled={handleDieUnsettled(i)}
            />
          );
        })}
      </group>
    );
  },
);
