import {
  ROLLING_X_OFFSET,
  ARENA_HALF_X,
  ROLLING_Z_MIN,
  ROLLING_Z_MAX,
  DIE_SIZE,
} from '../components/RollingArea';

/**
 * Calculate the default gather radius based on die count.
 * Scales up with more dice, clamped between 1.0 and 3.0.
 */
export function getGatherRadius(count: number): number {
  // Linear interpolation: 2 dice = 1.0, 12 dice = 2.0
  const t = Math.max(0, Math.min(1, (count - 2) / 10));
  return 1.0 + t * 1.0;
}

/**
 * Calculate evenly-spaced positions in a circle around a center point.
 * Used to place goal markers where dice will gather before a roll.
 *
 * @param center - Touch/pointer position on the floor [x, y, z]
 * @param count - Number of dice to place
 * @param radius - Circle radius (defaults to getGatherRadius(count))
 * @param rotationOffset - Starting angle offset in radians (default 0)
 * @returns Array of [x, y, z] positions, clamped within arena bounds
 */
export function getGatherPoints(
  center: [number, number, number],
  count: number,
  radius?: number,
  rotationOffset?: number,
): [number, number, number][] {
  if (count === 0 || center === null) return [];

  const r = radius ?? getGatherRadius(count);
  const offset = rotationOffset ?? 0;
  const y = DIE_SIZE * 1.875; // ~1.5 units above floor

  // Clamp the CENTER so the entire ring fits inside the arena.
  // The ring extends ±radius from center, so center must stay
  // radius + margin away from each wall.
  const margin = r + 0.5; // radius + wall clearance
  const cMinX = ROLLING_X_OFFSET - ARENA_HALF_X + margin;
  const cMaxX = ROLLING_X_OFFSET + ARENA_HALF_X - margin;
  const cMinZ = ROLLING_Z_MIN + margin;
  const cMaxZ = ROLLING_Z_MAX - margin;

  // If arena is too small for the ring, just use the arena center
  const cx = cMinX < cMaxX ? Math.max(cMinX, Math.min(cMaxX, center[0])) : ROLLING_X_OFFSET;
  const cz = cMinZ < cMaxZ ? Math.max(cMinZ, Math.min(cMaxZ, center[2])) : (ROLLING_Z_MIN + ROLLING_Z_MAX) / 2;

  const points: [number, number, number][] = [];

  for (let i = 0; i < count; i++) {
    const angle = offset + (i / count) * Math.PI * 2;
    const x = cx + r * Math.cos(angle);
    const z = cz + r * Math.sin(angle);
    points.push([x, y, z]);
  }

  return points;
}
