import { describe, it, expect } from 'vitest';
import dragFile from '../../content/tuning/drag.json';
import { drag } from './drag';

// F48 — every drag feel number in content/tuning/drag.json must explain itself (_help) and
// give the Dev Kit Tuning tab a slider range (_ranges), so Muzzy can tune it without guessing.
describe('content/tuning/drag.json', () => {
  const values = Object.entries(dragFile).filter(([key]) => !key.startsWith('_'));

  it('every value has a plain-English _help line', () => {
    for (const [key] of values) expect(dragFile._help, key).toHaveProperty(key);
  });

  it('every number has a slider range [min, max, step] that holds its value', () => {
    const ranges = dragFile._ranges as Record<string, number[]>;
    for (const [key, value] of values) {
      if (typeof value !== 'number') continue;
      expect(ranges[key], key).toHaveLength(3);
      const [min, max, step] = ranges[key];
      expect(value, key).toBeGreaterThanOrEqual(min);
      expect(value, key).toBeLessThanOrEqual(max);
      expect(step, key).toBeGreaterThan(0);
    }
  });

  it('zoneHighlight is one of the two looks', () => {
    expect(['tint', 'outline']).toContain(dragFile.zoneHighlight);
  });

  it('the game reads the file through one shared object', () => {
    expect(drag.dragHeight).toBe(dragFile.dragHeight);
  });
});
