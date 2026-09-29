import { ROLLING_X_OFFSET, ARENA_HALF_X, ROLLING_Z_MIN, ROLLING_Z_MAX } from '../components/RollingArea';
import { drag } from '../tuning/drag';

// Paddings live in content/tuning/drag.json (read on every call, so live edits apply):
//   zonePadding — tolerance inside the walls for "does this drop count?"
//   dropPadding — extra inset for drop positions: room for the split (mitosis) targets near walls

/** The drop zone: where a dragged die counts when you let go (RollingArea.tsx draws its outline highlight). */
export function rollingZoneBounds() {
  return {
    minX: (ROLLING_X_OFFSET - ARENA_HALF_X) + drag.zonePadding,
    maxX: (ROLLING_X_OFFSET + ARENA_HALF_X) - drag.zonePadding,
    minZ: ROLLING_Z_MIN + drag.zonePadding,
    maxZ: ROLLING_Z_MAX - drag.zonePadding,
  };
}

export function isInRollingZone(position: [number, number, number]): boolean {
  const [x, , z] = position;
  const { minX, maxX, minZ, maxZ } = rollingZoneBounds();
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
    const minX = (ROLLING_X_OFFSET - ARENA_HALF_X) + drag.dropPadding;
    const maxX = (ROLLING_X_OFFSET + ARENA_HALF_X) - drag.dropPadding;
    const minZ = ROLLING_Z_MIN + drag.dropPadding;
    const maxZ = ROLLING_Z_MAX - drag.dropPadding;
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
