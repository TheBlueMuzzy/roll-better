import { forwardRef, useImperativeHandle, useRef, useCallback, useEffect } from 'react';
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
  function DicePool({ count, color, onAllSettled }, ref) {
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

    // Spawn positions (computed once per render, updated when count changes)
    const spawnPositions = useRef(getSpawnPositions(count));

    // Track previous count so we can detect changes between rolls
    const prevCount = useRef(count);

    // When count changes (poolSize shrinks after locking, or grows after unlock),
    // reset spawn positions and tracking arrays for the next roll.
    // This does NOT interrupt mid-roll — it prepares for the next render.
    useEffect(() => {
      if (count !== prevCount.current) {
        prevCount.current = count;
        spawnPositions.current = getSpawnPositions(count);
        dieRefs.current = Array.from({ length: count }, () => null);
        settled.current = Array.from({ length: count }, () => false);
        results.current = Array.from({ length: count }, () => null);
        hasFired.current = false;
      }
    }, [count]);

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
        {spawnPositions.current.map((pos, i) => (
          <PhysicsDie
            key={i}
            ref={setDieRef(i)}
            color={color}
            position={pos}
            onResult={handleDieResult(i)}
            onUnsettled={handleDieUnsettled(i)}
          />
        ))}
      </group>
    );
  },
);
