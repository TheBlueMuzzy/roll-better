// PINNED — shows kit UI (a PlayerChip, a banner…) stuck to a point on the 3D table.
// The game's small R3F adapter around the kit's PinnedBox (src/ui/kit/blocks/pinned.tsx, see the kit
// CATALOG → Pinned): drei's Html follows the point as the camera/window changes, and this works out
// how many screen pixels one world unit takes up there. PinnedBox does the rest:
//   fit:    [width, height] in world units — the piece is scaled to fit that box, so it keeps the
//           same size ON THE TABLE on a phone and on a big screen (the table itself scales that way).
//   rem:    optional — world units per rem. Pieces with the same rem are drawn at the same size
//           (a column of chips); `fit` still shrinks one that would spill out of its box.
//   anchor: 'right' → the piece's right-middle sits on the point (chips left of a row)
//           'center' → the piece's middle sits on the point (banners)
//   name:   shows up as data-pin="name", so code can find this piece on the page.
// Everything inside wears kit-scope (kit fonts + colours) and never catches taps:
// the table underneath gets them (hold-to-roll, dragging dice).
import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { PinnedBox, type PinnedBoxProps } from '../ui/kit';

// How many screen pixels one world unit (sideways) takes up at `position`: project the point and a
// point one unit to its right, and measure the gap. (drei's viewport factor uses the straight-line
// distance to the camera, which makes pieces near the edge of the view come out too small.)
const _a = new Vector3();
const _b = new Vector3();

// Pinned pieces sit above the 3D canvas but below the HUD (z 10), tips and every kit screen
const Z_RANGE = [5, 0];

type PinnedProps = Omit<PinnedBoxProps, 'pixelsPerUnit'> & { position: [number, number, number] };

export function Pinned({ position, ...box }: PinnedProps) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size); // a new size (window resize) works it out again
  const [x, y, z] = position;
  _a.set(x, y, z).project(camera);
  _b.set(x + 1, y, z).project(camera);
  const pixelsPerUnit = (Math.abs(_b.x - _a.x) * size.width) / 2;

  return (
    <Html position={position} zIndexRange={Z_RANGE} pointerEvents="none">
      <PinnedBox pixelsPerUnit={pixelsPerUnit} {...box} />
    </Html>
  );
}
