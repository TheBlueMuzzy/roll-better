import { forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import { PhysicsDie } from './PhysicsDie';
import type { PhysicsDieHandle } from './PhysicsDie';

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
  const spacing = 1.3; // die is 1x1, leave 0.3 gap
  const positions: [number, number, number][] = [];

  for (let i = 0; i < count; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);

    // Center the grid at origin
    const totalCols = columns;
    const totalRows = Math.ceil(count / columns);
    const x = (col - (totalCols - 1) / 2) * spacing;
    const z = (row - (totalRows - 1) / 2) * spacing;

    // Add small random offset for visual variety
    const jitterX = (Math.random() - 0.5) * 0.2; // ±0.1
    const jitterZ = (Math.random() - 0.5) * 0.2;

    positions.push([x + jitterX, 0.6, z + jitterZ]);
  }

  return positions;
}

export const DicePool = forwardRef<DicePoolHandle, DicePoolProps>(
  function DicePool({ count, color, onAllSettled }, ref) {
    // Refs for each PhysicsDie
    const dieRefs = useRef<(PhysicsDieHandle | null)[]>(
      Array.from({ length: count }, () => null),
    );

    // Settle tracking (refs, not state — per-frame concern)
    const settledCount = useRef(0);
    const results = useRef<(number | null)[]>(
      Array.from({ length: count }, () => null),
    );

    // Spawn positions (computed once per render)
    const spawnPositions = useRef(getSpawnPositions(count));

    // Callback ref factory — assigns each die ref into the array
    const setDieRef = useCallback(
      (index: number) => (handle: PhysicsDieHandle | null) => {
        dieRefs.current[index] = handle;
      },
      [],
    );

    // Result callback factory — tracks each die's result
    const handleDieResult = useCallback(
      (index: number) => (value: number) => {
        results.current[index] = value;
        settledCount.current += 1;

        if (settledCount.current === count) {
          onAllSettled?.(results.current as number[]);
          settledCount.current = 0;
        }
      },
      [count, onAllSettled],
    );

    useImperativeHandle(ref, () => ({
      rollAll() {
        // Reset settled tracking
        settledCount.current = 0;
        results.current = Array.from({ length: count }, () => null);

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
          />
        ))}
      </group>
    );
  },
);
