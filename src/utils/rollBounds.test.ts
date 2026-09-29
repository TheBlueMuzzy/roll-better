import { describe, it, expect } from 'vitest';
import { ROLL_BOUNDS, isOutOfRollBounds, putBackInRollBounds } from './rollBounds';
import { ROLLING_X_OFFSET, ARENA_HALF_X, ROLLING_Z_MIN, ROLLING_Z_MAX, WALL_THICKNESS, DIE_SIZE } from '../components/RollingArea';
import physics from '../../content/tuning/physics.json';

const margin = physics.outOfBoundsMargin;

describe('ROLL_BOUNDS (B007)', () => {
  it('is the inside faces of the same walls RollingArea builds', () => {
    expect(ROLL_BOUNDS.minX).toBeCloseTo(ROLLING_X_OFFSET - ARENA_HALF_X + WALL_THICKNESS);
    expect(ROLL_BOUNDS.maxX).toBeCloseTo(ROLLING_X_OFFSET + ARENA_HALF_X - WALL_THICKNESS);
    expect(ROLL_BOUNDS.minZ).toBeCloseTo(ROLLING_Z_MIN + WALL_THICKNESS);
    expect(ROLL_BOUNDS.maxZ).toBeCloseTo(ROLLING_Z_MAX - WALL_THICKNESS);
    expect(ROLL_BOUNDS.floorY).toBe(0);
  });
});

describe('isOutOfRollBounds (B007)', () => {
  const centre: [number, number, number] = [ROLLING_X_OFFSET, DIE_SIZE / 2, 0];

  it('a die resting in the middle is inside', () => {
    expect(isOutOfRollBounds(centre)).toBe(false);
  });

  it('a die resting against any wall is inside', () => {
    const half = DIE_SIZE / 2;
    expect(isOutOfRollBounds([ROLL_BOUNDS.minX + half, half, 0])).toBe(false);
    expect(isOutOfRollBounds([ROLL_BOUNDS.maxX - half, half, 0])).toBe(false);
    expect(isOutOfRollBounds([ROLLING_X_OFFSET, half, ROLL_BOUNDS.minZ + half])).toBe(false);
    expect(isOutOfRollBounds([ROLLING_X_OFFSET, half, ROLL_BOUNDS.maxZ - half])).toBe(false);
  });

  it('a die high in the air above the rolling area is inside (it will come down)', () => {
    expect(isOutOfRollBounds([ROLLING_X_OFFSET, 12, 0])).toBe(false);
  });

  it('a die past any wall is out', () => {
    expect(isOutOfRollBounds([ROLL_BOUNDS.minX - margin - 0.01, 0.4, 0])).toBe(true);
    expect(isOutOfRollBounds([ROLL_BOUNDS.maxX + margin + 0.01, 0.4, 0])).toBe(true);
    expect(isOutOfRollBounds([ROLLING_X_OFFSET, 0.4, ROLL_BOUNDS.minZ - margin - 0.01])).toBe(true);
    expect(isOutOfRollBounds([ROLLING_X_OFFSET, 0.4, ROLL_BOUNDS.maxZ + margin + 0.01])).toBe(true);
  });

  it('a die far away (fell off the table) is out', () => {
    expect(isOutOfRollBounds([-3, -40, 12])).toBe(true);
  });

  it('a die that fell through the floor is out', () => {
    expect(isOutOfRollBounds([ROLLING_X_OFFSET, -margin - 0.01, 0])).toBe(true);
  });
});

describe('putBackInRollBounds (B007)', () => {
  it('puts an escaped die back inside, a little above the floor', () => {
    const escaped: [number, number, number][] = [
      [-3, -40, 12], [20, 0.4, 0], [5, -5, -9], [ROLL_BOUNDS.maxX + 1, 0.4, ROLL_BOUNDS.maxZ + 1],
    ];
    for (const p of escaped) {
      const back = putBackInRollBounds(p);
      expect(isOutOfRollBounds(back)).toBe(false);
      // Clear of every wall by at least half a die, so it doesn't start inside one
      expect(back[0]).toBeGreaterThanOrEqual(ROLL_BOUNDS.minX + DIE_SIZE / 2);
      expect(back[0]).toBeLessThanOrEqual(ROLL_BOUNDS.maxX - DIE_SIZE / 2);
      expect(back[2]).toBeGreaterThanOrEqual(ROLL_BOUNDS.minZ + DIE_SIZE / 2);
      expect(back[2]).toBeLessThanOrEqual(ROLL_BOUNDS.maxZ - DIE_SIZE / 2);
      expect(back[1]).toBeGreaterThan(DIE_SIZE / 2);
    }
  });

  it('puts it back near the side it left from (not always the middle)', () => {
    const back = putBackInRollBounds([ROLL_BOUNDS.maxX + 3, 0.4, 1]);
    expect(back[0]).toBeGreaterThan(ROLLING_X_OFFSET);
    expect(back[2]).toBeCloseTo(1);
  });
});
