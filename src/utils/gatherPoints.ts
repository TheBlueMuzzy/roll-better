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
  return Math.min(3.0, Math.max(1.0, 0.5 + count * 0.25));
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
  const y = DIE_SIZE / 2;

  // Arena bounds with 0.5 inset so dice don't clip walls
  const minX = ROLLING_X_OFFSET - ARENA_HALF_X + 0.5;
  const maxX = ROLLING_X_OFFSET + ARENA_HALF_X - 0.5;
  const minZ = ROLLING_Z_MIN + 0.5;
  const maxZ = ROLLING_Z_MAX - 0.5;

  const points: [number, number, number][] = [];

  for (let i = 0; i < count; i++) {
    const angle = offset + (i / count) * Math.PI * 2;
    const x = Math.max(minX, Math.min(maxX, center[0] + r * Math.cos(angle)));
    const z = Math.max(minZ, Math.min(maxZ, center[2] + r * Math.sin(angle)));
    points.push([x, y, z]);
  }

  return points;
}
