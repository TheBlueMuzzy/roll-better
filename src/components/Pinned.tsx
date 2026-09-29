// PINNED — shows kit UI (a PlayerChip, a banner…) stuck to a point on the 3D table.
// drei's Html follows the point as the camera/window changes (it moves the DOM itself each frame,
// no React state). This wrapper adds two things the game needs:
//   anchor: 'right'  → the piece's right-middle sits on the point (chips left of a row)
//           'center' → the piece's middle sits on the point (banners)
//   fit:    [width, height] in world units — the piece is scaled to fit that box, so it keeps the
//           same size ON THE TABLE on a phone and on a big screen (the table itself scales that way).
//   rem:    optional — world units per rem (the kit's text unit at normal text size). Pieces with the
//           same rem are drawn at the same size (a column of chips), however wide their words are;
//           `fit` still shrinks one that would spill out of its box.
// Everything inside is wrapped in kit-scope (kit fonts + colours) and never catches taps:
// the table underneath gets them (hold-to-roll, dragging dice).
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { Vector3, type Camera } from 'three';

// How many screen pixels one world unit (sideways) takes up at `point` right now: project the point
// and a point one unit to its right, and measure the gap. (drei's viewport factor uses the straight-line
// distance to the camera, which makes pieces near the edge of the view come out too small.)
const _a = new Vector3();
const _b = new Vector3();
function pixelsPerUnitAt(point: Vector3, camera: Camera, screenWidth: number) {
  _a.copy(point).project(camera);
  _b.copy(point).setX(point.x + 1).project(camera);
  return (Math.abs(_b.x - _a.x) * screenWidth) / 2;
}

interface PinnedProps {
  position: [number, number, number];
  fit: [number, number];
  rem?: number;
  anchor?: 'right' | 'center';
  name?: string; // shows up as data-pin="name", so code can find this piece on the page
  children: ReactNode;
}

// Pinned pieces sit above the 3D canvas but below the HUD (z 10), tips and every kit screen
const Z_RANGE = [5, 0];
// CSS px in one rem at normal text size (a bigger text setting makes pinned pieces bigger too)
const REM_PX = 16;

export function Pinned({ position, fit, rem, anchor = 'right', name, children }: PinnedProps) {
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera);
  // The piece's own box (inside drei's div). drei draws it in its own React root a moment later,
  // so a callback ref notes it and `mounted` tells the effect below it's there.
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const attachBox = useCallback((el: HTMLDivElement | null) => {
    boxRef.current = el;
    setMounted(el !== null);
  }, []);
  const point = useRef(new Vector3());

  const [x, y, z] = position;
  const [fitW, fitH] = fit;

  // Scale = how much the piece must grow or shrink to fill the fit box (whichever side is tighter).
  // offsetWidth/Height ignore the scale transform, so measuring never feeds back into itself.
  const applyScale = useCallback(() => {
    const box = boxRef.current;
    if (!box || !box.offsetWidth || !box.offsetHeight) return;
    point.current.set(x, y, z);
    const pixelsPerUnit = pixelsPerUnitAt(point.current, camera, size.width);
    let scale = Math.min((fitW * pixelsPerUnit) / box.offsetWidth, (fitH * pixelsPerUnit) / box.offsetHeight);
    if (rem) scale = Math.min(scale, (rem * pixelsPerUnit) / REM_PX);
    box.style.setProperty('--pin-scale', String(scale));
    box.dataset.ready = 'true';
  }, [x, y, z, fitW, fitH, rem, camera, size]);

  // Again on every window resize (size changes) and whenever the piece's content changes size
  useEffect(() => {
    if (!mounted || !boxRef.current) return;
    applyScale();
    const watcher = new ResizeObserver(applyScale);
    watcher.observe(boxRef.current);
    return () => watcher.disconnect();
  }, [mounted, applyScale]);

  return (
    <Html position={position} zIndexRange={Z_RANGE} pointerEvents="none">
      <div ref={attachBox} className="kit-scope pinned" data-anchor={anchor} data-pin={name}>
        {children}
      </div>
    </Html>
  );
}
