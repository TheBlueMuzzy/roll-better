// Round scoring — shared by the phone (score + star preview) and the server (party/server.ts)
// so both always agree. The numbers live in content/tuning/scoring.json (Muzzy edits them there).
import scoring from '../../content/tuning/scoring.json';

/**
 * Points a round winner scores, given how many dice are left over in their pool.
 * More leftovers than the list covers → the last number in the list.
 */
export function roundScore(leftoverDice: number): number {
  const points = scoring.pointsByLeftoverDice;
  const index = Math.min(Math.max(0, leftoverDice), points.length - 1);
  return points[index];
}
