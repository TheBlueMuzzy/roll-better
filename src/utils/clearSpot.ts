import { DIE_SIZE } from '../components/RollingArea';

/**
 * Finds a clear landing spot in the pool area for a mitosis unlock animation.
 * Generates candidate positions on a grid within the safe rolling area,
 * then picks the one furthest from all occupied positions.
 *
 * Returns the target position and two split positions (horizontal split).
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

  // Generate candidate grid positions
  const candidates: [number, number, number][] = [];
  for (let x = X_MIN; x <= X_MAX; x += GRID_SPACING) {
    for (let z = Z_MIN; z <= Z_MAX; z += GRID_SPACING) {
      candidates.push([x, dieSize / 2, z]);
    }
  }

  // For each candidate, compute minimum distance to any occupied position
  let bestCandidate = candidates[0];
  let bestMinDist = -1;

  for (const candidate of candidates) {
    let minDist = Infinity;

    for (const occupied of occupiedPositions) {
      const dx = candidate[0] - occupied[0];
      const dz = candidate[2] - occupied[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < minDist) {
        minDist = dist;
      }
    }

    // If no occupied positions, all candidates are equally good — pick center
    if (occupiedPositions.length === 0) {
      minDist = 0;
    }

    if (minDist > bestMinDist) {
      bestMinDist = minDist;
      bestCandidate = candidate;
    }
  }

  // Split targets: horizontal offset from target
  const splitOffset = dieSize * 0.7;
  const splitTargets: [[number, number, number], [number, number, number]] = [
    [bestCandidate[0] - splitOffset, bestCandidate[1], bestCandidate[2]],
    [bestCandidate[0] + splitOffset, bestCandidate[1], bestCandidate[2]],
  ];

  return {
    targetPos: bestCandidate,
    splitTargets,
  };
}
