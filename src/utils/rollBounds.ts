// B007 — is a die still inside the rolling area? Built from the SAME numbers RollingArea
// uses for its walls and floor, so the check can never drift from the real walls.
// The tolerance lives in content/tuning/physics.json (outOfBoundsMargin).
import {
  ROLLING_X_OFFSET,
  ARENA_HALF_X,
  ROLLING_Z_MIN,
  ROLLING_Z_MAX,
  WALL_THICKNESS,
  DIE_SIZE,
} from '../components/RollingArea';
import physics from '../../content/tuning/physics.json';

/** The inside faces of the four walls, and the top of the floor. */
export const ROLL_BOUNDS = {
  minX: ROLLING_X_OFFSET - ARENA_HALF_X + WALL_THICKNESS,
  maxX: ROLLING_X_OFFSET + ARENA_HALF_X - WALL_THICKNESS,
  minZ: ROLLING_Z_MIN + WALL_THICKNESS,
  maxZ: ROLLING_Z_MAX - WALL_THICKNESS,
  floorY: 0,
};

/**
 * True when a die's centre has gone past a wall or through the floor.
 * A die high up in the air above the rolling area is still inside — it will come down.
 */
export function isOutOfRollBounds(position: [number, number, number]): boolean {
  const [x, y, z] = position;
  const m = physics.outOfBoundsMargin;
  return (
    x < ROLL_BOUNDS.minX - m ||
    x > ROLL_BOUNDS.maxX + m ||
    z < ROLL_BOUNDS.minZ - m ||
    z > ROLL_BOUNDS.maxZ + m ||
    y < ROLL_BOUNDS.floorY - m
  );
}

/**
 * Where to put an escaped die back: the nearest spot inside the walls (a full die
 * clear of them), dropped from one die-height above the floor so it lands and settles.
 */
export function putBackInRollBounds(position: [number, number, number]): [number, number, number] {
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  return [
    clamp(position[0], ROLL_BOUNDS.minX + DIE_SIZE, ROLL_BOUNDS.maxX - DIE_SIZE),
    ROLL_BOUNDS.floorY + DIE_SIZE,
    clamp(position[2], ROLL_BOUNDS.minZ + DIE_SIZE, ROLL_BOUNDS.maxZ - DIE_SIZE),
  ];
}
