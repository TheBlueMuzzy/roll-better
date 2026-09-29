// B017 — the row chips must never cover the first locked dice, and the rows must stay left of
// the rolling area. Checks the layout numbers (GoalRow.tsx + RollingArea.tsx), not pixels.
import { describe, it, expect } from 'vitest';
import { getSlotX, PROFILE_X_OFFSET, SLOT_COUNT } from '../components/GoalRow';
import { DIE_SIZE, SPLIT_X, ROLLING_LEFT_X, ROLLING_RIGHT_X, ROLLING_X_OFFSET, ARENA_HALF_X } from '../components/RollingArea';

// The camera looks straight down from this height (App.tsx), so a die's top face is drawn
// a little further from the centre of the screen than its feet: by CAMERA_HEIGHT / (CAMERA_HEIGHT - DIE_SIZE).
const CAMERA_HEIGHT = 12;
const topFaceSpread = CAMERA_HEIGHT / (CAMERA_HEIGHT - DIE_SIZE);

describe('table layout (B017)', () => {
  it('the chips end before the first die starts, as the camera sees it', () => {
    const chipRightX = getSlotX(0) - PROFILE_X_OFFSET;
    const firstDieLeftOnScreen = (getSlotX(0) - DIE_SIZE / 2) * topFaceSpread;
    expect(firstDieLeftOnScreen - chipRightX).toBeGreaterThan(0.2);
  });

  it('the rows end before the divider, and the rolling area starts after it', () => {
    const lastDieRightOnScreen = (getSlotX(SLOT_COUNT - 1) + DIE_SIZE / 2) * topFaceSpread;
    expect(lastDieRightOnScreen).toBeLessThan(SPLIT_X);
    expect(SPLIT_X).toBeLessThan(ROLLING_LEFT_X);
  });

  it('the rolling area is derived from its two walls and has room for 12 dice', () => {
    expect(ROLLING_X_OFFSET).toBeCloseTo((ROLLING_LEFT_X + ROLLING_RIGHT_X) / 2);
    expect(ARENA_HALF_X).toBeCloseTo((ROLLING_RIGHT_X - ROLLING_LEFT_X) / 2);
    // 12 dice spawn in a 4×3 grid, 1.4 apart (DicePool getSpawnPositions): 5 wide
    expect(ARENA_HALF_X * 2).toBeGreaterThan(4 * DIE_SIZE + 3 * 1.4);
  });
});
