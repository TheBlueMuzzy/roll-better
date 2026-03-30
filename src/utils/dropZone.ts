import { ROLLING_X_OFFSET, ARENA_HALF_X, ROLLING_Z_MIN, ROLLING_Z_MAX } from '../components/RollingArea';

const PADDING = 0.5; // Tolerance inside edges for basic zone check
const DROP_PADDING = 1.2; // Extra inset for drop positions — room for mitosis split targets near walls

export function isInRollingZone(position: [number, number, number]): boolean {
  const [x, , z] = position;
  const minX = (ROLLING_X_OFFSET - ARENA_HALF_X) + PADDING;
  const maxX = (ROLLING_X_OFFSET + ARENA_HALF_X) - PADDING;
  const minZ = ROLLING_Z_MIN + PADDING;
  const maxZ = ROLLING_Z_MAX - PADDING;
  return x >= minX && x <= maxX && z >= minZ && z <= maxZ;
}

/**
 * Nudge a drop position away from occupied dice so they don't overlap.
 * Tries expanding rings of candidate positions, staying within the rolling zone.
 */
export function findNearestClearPosition(
  dropPos: [number, number, number],
  occupiedPositions: [number, number, number][],
  dieSize: number,
): [number, number, number] {
  const MIN_CLEARANCE = dieSize * 2.0; // Room for mitosis split targets

  const isOverlapping = (pos: [number, number, number]) =>
    occupiedPositions.some(occ => {
      const dx = pos[0] - occ[0];
      const dz = pos[2] - occ[2];
      return Math.sqrt(dx * dx + dz * dz) < MIN_CLEARANCE;
    });

  // Tighter bounds check — drop must be far enough from walls for split targets
  const isInDropBounds = (pos: [number, number, number]) => {
    const [x, , z] = pos;
    const minX = (ROLLING_X_OFFSET - ARENA_HALF_X) + DROP_PADDING;
    const maxX = (ROLLING_X_OFFSET + ARENA_HALF_X) - DROP_PADDING;
    const minZ = ROLLING_Z_MIN + DROP_PADDING;
    const maxZ = ROLLING_Z_MAX - DROP_PADDING;
    return x >= minX && x <= maxX && z >= minZ && z <= maxZ;
  };

  if (!isOverlapping(dropPos) && isInDropBounds(dropPos)) return dropPos; // Already clear and in bounds

  // Try nudging in expanding rings
  for (let radius = MIN_CLEARANCE; radius < MIN_CLEARANCE * 4; radius += dieSize * 0.5) {
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) { // 12 directions
      const candidate: [number, number, number] = [
        dropPos[0] + Math.cos(angle) * radius,
        dropPos[1],
        dropPos[2] + Math.sin(angle) * radius,
      ];
      if (!isOverlapping(candidate) && isInDropBounds(candidate)) {
        return candidate;
      }
    }
  }

  return dropPos; // Fallback: use original position
}
