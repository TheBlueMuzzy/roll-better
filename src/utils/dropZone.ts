import { ROLLING_X_OFFSET, ARENA_HALF_X, ROLLING_Z_MIN, ROLLING_Z_MAX } from '../components/RollingArea';

const PADDING = 0.5; // Tolerance inside edges

export function isInRollingZone(position: [number, number, number]): boolean {
  const [x, , z] = position;
  const minX = (ROLLING_X_OFFSET - ARENA_HALF_X) + PADDING;
  const maxX = (ROLLING_X_OFFSET + ARENA_HALF_X) - PADDING;
  const minZ = ROLLING_Z_MIN + PADDING;
  const maxZ = ROLLING_Z_MAX - PADDING;
  return x >= minX && x <= maxX && z >= minZ && z <= maxZ;
}
