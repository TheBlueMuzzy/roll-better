// PINNED — shows kit UI (a PlayerChip, a banner…) stuck to a point on the 3D table.
// drei's Html follows the point as the camera/window changes (it moves the DOM itself each frame,
// no React state). This wrapper adds two things the game needs:
//   anchor: 'right'  → the piece's right-middle sits on the point (chips left of a row)
//           'center' → the piece's middle sits on the point (banners)
//   fit:    [width, height] in world units — the piece is scaled to fit that box, so it keeps the
//           same size ON THE TABLE on a phone and on a big screen (the table itself scales that way).
// Everything inside is wrapped in kit-scope (kit fonts + colours) and never catches taps:
// the table underneath gets them (hold-to-roll, dragging dice).
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { Vector3 } from 'three';

interface PinnedProps {
  position: [number, number, number];
  fit: [number, number];
  anchor?: 'right' | 'center';
  children: ReactNode;
}

// Pinned pieces sit above the 3D canvas but below the HUD (z 10), tips and every kit screen
const Z_RANGE = [5, 0];

export function Pinned({ position, fit, anchor = 'right', children }: PinnedProps) {
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera);
  const viewport = useThree((s) => s.viewport);
  // The piece's own box (inside drei's div). A callback ref, because drei draws it in its own root a moment later.
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const point = useRef(new Vector3());

  const [x, y, z] = position;
  const [fitW, fitH] = fit;

  // Scale = how much the piece must grow or shrink to fill the fit box (whichever side is tighter).
  // offsetWidth/Height ignore the scale transform, so measuring never feeds back into itself.
  const applyScale = useCallback(() => {
    if (!box || !box.offsetWidth || !box.offsetHeight) return;
    point.current.set(x, y, z);
    const pixelsPerUnit = viewport.getCurrentViewport(camera, point.current, size).factor;
    const scale = Math.min((fitW * pixelsPerUnit) / box.offsetWidth, (fitH * pixelsPerUnit) / box.offsetHeight);
    box.style.setProperty('--pin-scale', String(scale));
    box.dataset.ready = 'true';
  }, [box, x, y, z, fitW, fitH, camera, viewport, size]);

  // Again on every window resize (size changes) and whenever the piece's content changes size
  useEffect(() => {
    applyScale();
    if (!box) return;
    const watcher = new ResizeObserver(applyScale);
    watcher.observe(box);
    return () => watcher.disconnect();
  }, [box, applyScale]);

  return (
    <Html position={position} zIndexRange={Z_RANGE} pointerEvents="none">
      <div ref={setBox} className="kit-scope pinned" data-anchor={anchor}>
        {children}
      </div>
    </Html>
  );
}
