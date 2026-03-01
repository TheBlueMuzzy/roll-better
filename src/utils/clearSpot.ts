import { DIE_SIZE } from '../components/RollingArea';

/**
 * Finds a clear landing spot in the pool area for a mitosis unlock animation.
 * Picks the candidate closest to the rolling area center that has enough
 * clearance from all occupied positions (at least MIN_CLEARANCE away).
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
  const CENTER_X = 0;
  const CENTER_Z = 1.75; // center of safe zone
  const MIN_CLEARANCE = dieSize * 1.5; // must be this far from any occupied die

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

  // Pick the closest-to-center candidate that has enough clearance
  let bestCandidate = candidates[0]; // fallback: center-most

  if (occupiedPositions.length === 0) {
    // No dice to avoid — just pick center
    bestCandidate = candidates[0];
  } else {
    for (const candidate of candidates) {
      let minDist = Infinity;
      for (const occupied of occupiedPositions) {
        const dx = candidate[0] - occupied[0];
        const dz = candidate[2] - occupied[2];
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < minDist) minDist = dist;
      }
      if (minDist >= MIN_CLEARANCE) {
        bestCandidate = candidate;
        break; // first valid = closest to center
      }
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
