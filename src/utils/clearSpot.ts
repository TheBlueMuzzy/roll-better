import { DIE_SIZE } from '../components/RollingArea';

/**
 * Checks whether a position has enough clearance from all occupied positions.
 */
function hasClearance(
  pos: [number, number, number],
  occupied: [number, number, number][],
  minClearance: number,
): boolean {
  for (const occ of occupied) {
    const dx = pos[0] - occ[0];
    const dz = pos[2] - occ[2];
    if (Math.sqrt(dx * dx + dz * dz) < minClearance) return false;
  }
  return true;
}

/**
 * Finds a clear landing spot in the pool area for a mitosis unlock animation.
 * Picks the candidate closest to the rolling area center that has enough
 * clearance from all occupied positions (at least MIN_CLEARANCE away).
 * Split direction is randomized, and both split targets are validated
 * for clearance against occupied dice.
 *
 * Returns the target position and two split positions.
 */
export function findClearSpot(
  occupiedPositions: [number, number, number][],
  dieSize: number = DIE_SIZE,
): {
  targetPos: [number, number, number];
  splitTargets: [[number, number, number], [number, number, number]];
} {
  // Safe rolling area (inner zone, away from walls)
  const X_MIN = -2.0;
  const X_MAX = 2.0;
  const Z_MIN = 0.0;
  const Z_MAX = 3.5;
  const GRID_SPACING = 0.8;
  const CENTER_X = 0;
  const CENTER_Z = 1.75; // center of safe zone
  const MIN_CLEARANCE = dieSize * 1.5; // must be this far from any occupied die
  const SPLIT_OFFSET = dieSize * 0.7;
  const ANGLE_ATTEMPTS = 8; // try 8 evenly-spaced angles before falling back

  // Generate candidate grid positions
  const candidates: [number, number, number][] = [];
  for (let x = X_MIN; x <= X_MAX; x += GRID_SPACING) {
    for (let z = Z_MIN; z <= Z_MAX; z += GRID_SPACING) {
      candidates.push([x, dieSize / 2, z]);
    }
  }

  // Sort candidates by distance to center (closest first)
  candidates.sort((a, b) => {
    const distA = (a[0] - CENTER_X) ** 2 + (a[2] - CENTER_Z) ** 2;
    const distB = (b[0] - CENTER_X) ** 2 + (b[2] - CENTER_Z) ** 2;
    return distA - distB;
  });

  // For each candidate, try random split angles and validate BOTH split targets
  const startAngle = Math.random() * Math.PI * 2;

  for (const candidate of candidates) {
    // Skip candidates too close to occupied dice
    if (occupiedPositions.length > 0 && !hasClearance(candidate, occupiedPositions, MIN_CLEARANCE)) {
      continue;
    }

    // Try multiple angles for the split direction
    for (let a = 0; a < ANGLE_ATTEMPTS; a++) {
      const angle = startAngle + (a * Math.PI) / ANGLE_ATTEMPTS;
      const dx = Math.cos(angle) * SPLIT_OFFSET;
      const dz = Math.sin(angle) * SPLIT_OFFSET;
      const splitA: [number, number, number] = [candidate[0] - dx, candidate[1], candidate[2] - dz];
      const splitB: [number, number, number] = [candidate[0] + dx, candidate[1], candidate[2] + dz];

      // Check both split targets are clear of occupied dice
      if (
        hasClearance(splitA, occupiedPositions, MIN_CLEARANCE) &&
        hasClearance(splitB, occupiedPositions, MIN_CLEARANCE)
      ) {
        return { targetPos: candidate, splitTargets: [splitA, splitB] };
      }
    }
  }

  // Fallback: use center-most candidate with random angle (best effort)
  const fallback = candidates[0];
  const angle = startAngle;
  const dx = Math.cos(angle) * SPLIT_OFFSET;
  const dz = Math.sin(angle) * SPLIT_OFFSET;
  return {
    targetPos: fallback,
    splitTargets: [
      [fallback[0] - dx, fallback[1], fallback[2] - dz],
      [fallback[0] + dx, fallback[1], fallback[2] + dz],
    ],
  };
}
