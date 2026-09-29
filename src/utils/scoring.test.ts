import { describe, it, expect } from 'vitest';
import { roundScore } from './scoring';
import scoring from '../../content/tuning/scoring.json';

describe('roundScore', () => {
  it('reads each leftover count straight from content/tuning/scoring.json', () => {
    scoring.pointsByLeftoverDice.forEach((points, leftover) => {
      expect(roundScore(leftover)).toBe(points);
    });
  });

  it('covers every leftover count a winner can have (0–4, since 12 dice is the cap)', () => {
    expect(scoring.pointsByLeftoverDice.length).toBeGreaterThanOrEqual(5);
  });

  it('clamps out-of-range counts to the ends of the list', () => {
    const points = scoring.pointsByLeftoverDice;
    expect(roundScore(-1)).toBe(points[0]);
    expect(roundScore(99)).toBe(points[points.length - 1]);
  });
});
