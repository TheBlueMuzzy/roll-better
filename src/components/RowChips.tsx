// ROW CHIPS (3D side) — pins a kit PlayerChip (src/ui/RowChip.tsx) beside every row on the table:
// the Goal row at the top, then the local player, then everyone else. Replaces the old 3D profile
// badges (avatar circle, star, "S | T" text meshes).
// A chip fades while a die you're dragging passes over it: chips are page elements drawn over the
// 3D table, so without the fade they would hide the die (B010).
import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, type Camera } from 'three';
import { useGameStore } from '../store/gameStore';
import { roundScore } from '../utils/scoring';
import { playScoreComplete } from '../utils/soundManager';
import { getSlotX, PROFILE_X_OFFSET } from './GoalRow';
import { DIE_SIZE } from './RollingArea';
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

// A dragged die is lifted (PlayerRow: DIE_SIZE × 2.5 up), so on screen it shows up further out than
// the spot under it. The check therefore happens on SCREEN: the die's drawn square against each
// chip's drawn box (chips carry data-pin, see Pinned).
const DRAG_LIFT = DIE_SIZE * 2.5;
const _point = new Vector3();

// Screen pixel (page coordinates) where a world point is drawn
function toScreen(x: number, y: number, z: number, camera: Camera, canvas: DOMRect): [number, number] {
  _point.set(x, y, z).project(camera);
  return [canvas.left + ((_point.x + 1) / 2) * canvas.width, canvas.top + ((1 - _point.y) / 2) * canvas.height];
}

// The pinned chips (their data-pin names, comma-separated) the dragged die is drawn over, or ''
function chipsUnderDie(dragPos: [number, number, number], camera: Camera, canvasEl: HTMLCanvasElement): string {
  const canvas = canvasEl.getBoundingClientRect();
  const [x, , z] = dragPos;
  const [cx, cy] = toScreen(x, DRAG_LIFT, z, camera, canvas);
  const [edgeX] = toScreen(x + DIE_SIZE / 2, DRAG_LIFT, z, camera, canvas);
  const r = Math.abs(edgeX - cx); // half the die's size on screen
  const chips = document.querySelectorAll<HTMLElement>('[data-pin]'); // drei puts pinned pieces beside the canvas's wrappers
  const under: string[] = [];
  for (const chip of chips) {
    const box = chip.getBoundingClientRect();
    if (cx + r > box.left && cx - r < box.right && cy + r > box.top && cy - r < box.bottom) under.push(chip.dataset.pin ?? '');
  }
  return under.join(',');
}

export function RowChips() {
  const players = useGameStore((s) => s.players);
  const committedCount = useGameStore((s) => s.committedUnlocks.length);
  const me = players[0];

  // --- Fade the chip under a dragged die ---
  // Checked every frame against the store's drag position, but React only hears about it when the
  // faded chip CHANGES (a ref remembers the current one) — never a state update per frame.
  // (A die between two rows can be over two chips at once: both fade.)
  const [dimmed, setDimmed] = useState('');
  const dimmedRef = useRef('');
  useFrame(({ camera, gl }) => {
    const drag = useGameStore.getState().dragUnlockState;
    const under = drag.active && drag.currentPosition ? chipsUnderDie(drag.currentPosition, camera, gl.domElement) : '';
    if (under !== dimmedRef.current) {
      dimmedRef.current = under;
      setDimmed(under);
    }
  });

  // Your score going up: the chip counts up to it (kit), with the score sound
  const myScore = me?.score ?? 0;
  const lastScore = useRef(myScore);
  useEffect(() => {
    if (myScore > lastScore.current) playScoreComplete();
    lastScore.current = myScore;
  }, [myScore]);

  if (!me) return null;

  // Goal chip: points for finishing the Goal now — 8 dice fill it, the rest are left over
  const myDice = me.poolSize + me.lockedDice.length;
  const potentialScore = roundScore(Math.max(0, myDice - 8));

  return (
    <>
      <Pinned position={GOAL_CHIP_POSITION} fit={CHIP_FIT} rem={CHIP_REM} name="goal">
        <GoalRowChip potentialScore={potentialScore} dim={dimmed.split(',').includes('goal')} />
      </Pinned>
      {players.map((p, i) => (
        <Pinned key={p.id} position={[CHIP_RIGHT_X, 0, FIRST_PLAYER_ROW_Z + i * ROW_SPACING]} fit={CHIP_FIT} rem={CHIP_REM} name={p.id}>
          <PlayerRowChip
            name={p.name}
            color={p.color}
            score={p.score}
            startingDice={p.startingDice}
            // The local player's dice parked in the rolling area this turn still count as theirs
            totalDice={p.poolSize + p.lockedDice.length + (i === 0 ? committedCount : 0)}
            isYou={i === 0}
            dim={dimmed.split(',').includes(p.id)}
          />
        </Pinned>
      ))}
    </>
  );
}
