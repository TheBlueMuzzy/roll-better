// ROW CHIPS (3D side) — pins a kit PlayerChip (src/ui/RowChip.tsx) beside every row on the table:
// the Goal row at the top, then the local player, then everyone else. Replaces the old 3D profile
// badges (avatar circle, star, "S | T" text meshes).
import { useGameStore } from '../store/gameStore';
import { roundScore } from '../utils/scoring';
import { getSlotX, PROFILE_X_OFFSET } from './GoalRow';
import { Pinned } from './Pinned';
import { GoalRowChip, PlayerRowChip } from '../ui/RowChip';

// Where the rows are (same numbers as Scene.tsx's rows): Goal row, then player rows 1.25 apart
const GOAL_ROW_Z = -5.0;
const FIRST_PLAYER_ROW_Z = -3.75;
const ROW_SPACING = 1.25;

// Each chip's right edge sits just left of the row's first slot; it fits in the space between
// there and the left edge of the view (fit, in world units). CHIP_REM keeps every chip the same size.
// The Goal row's dice are bigger and stand taller, so its chip sits a little further up and left.
const CHIP_RIGHT_X = getSlotX(0) - PROFILE_X_OFFSET;
const CHIP_FIT: [number, number] = [2.95, 1.15];
const CHIP_REM = 0.34;
const GOAL_CHIP_POSITION: [number, number, number] = [CHIP_RIGHT_X - 0.3, 0, GOAL_ROW_Z - 0.15];

export function RowChips() {
  const players = useGameStore((s) => s.players);
  const committedCount = useGameStore((s) => s.committedUnlocks.length);
  const me = players[0];
  if (!me) return null;

  // Goal chip: points for finishing the Goal now — 8 dice fill it, the rest are left over
  const myDice = me.poolSize + me.lockedDice.length;
  const potentialScore = roundScore(Math.max(0, myDice - 8));

  return (
    <>
      <Pinned position={GOAL_CHIP_POSITION} fit={CHIP_FIT} rem={CHIP_REM}>
        <GoalRowChip potentialScore={potentialScore} dim={false} />
      </Pinned>
      {players.map((p, i) => (
        <Pinned key={p.id} position={[CHIP_RIGHT_X, 0, FIRST_PLAYER_ROW_Z + i * ROW_SPACING]} fit={CHIP_FIT} rem={CHIP_REM}>
          <PlayerRowChip
            name={p.name}
            color={p.color}
            score={p.score}
            startingDice={p.startingDice}
            // The local player's dice parked in the rolling area this turn still count as theirs
            totalDice={p.poolSize + p.lockedDice.length + (i === 0 ? committedCount : 0)}
            isYou={i === 0}
            dim={false}
          />
        </Pinned>
      ))}
    </>
  );
}
