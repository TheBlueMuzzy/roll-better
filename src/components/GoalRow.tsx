import { Die3D } from './Die3D';
import { DIE_SIZE } from './RollingArea';

// --- Layout constants (exported for PlayerRow reuse) ---
export const SLOT_SPACING = 0.7;
export const SLOT_COUNT = 8;

/** Returns the X position for a given slot index (0-7), centered at 0. */
export function getSlotX(index: number): number {
  return (index - 3.5) * SLOT_SPACING;
}

/**
 * Returns Euler angles [x, y, z] that rotate a Die3D so the given face value
 * points upward (+Y).
 *
 * Die3D face layout:
 *   1 = +Y (top), 6 = -Y (bottom)
 *   5 = +X (right), 2 = -X (left)
 *   3 = +Z (front), 4 = -Z (back)
 */
export function getRotationForFace(value: number): [number, number, number] {
  switch (value) {
    case 1: return [0, 0, 0];                        // already +Y up
    case 6: return [Math.PI, 0, 0];                  // flip upside-down
    case 2: return [0, 0, -Math.PI / 2];             // roll -X to top
    case 5: return [0, 0, Math.PI / 2];              // roll +X to top
    case 3: return [-Math.PI / 2, 0, 0];             // tilt +Z to top
    case 4: return [Math.PI / 2, 0, 0];              // tilt -Z to top
    default: return [0, 0, 0];
  }
}

// --- Props ---
interface GoalRowProps {
  values: number[];
  z?: number;
}

export function GoalRow({ values, z = -4.67 }: GoalRowProps) {
  return (
    <group position={[0, 0, z]}>
      {values.slice(0, SLOT_COUNT).map((value, i) => (
        <group
          key={i}
          position={[getSlotX(i), DIE_SIZE / 2, 0]}
          rotation={getRotationForFace(value)}
          scale={DIE_SIZE}
        >
          <Die3D />
        </group>
      ))}
    </group>
  );
}
