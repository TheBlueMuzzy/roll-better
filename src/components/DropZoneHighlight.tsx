import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, type Group, type MeshBasicMaterial } from 'three';
import { useGameStore } from '../store/gameStore';
import { isInRollingZone, rollingZoneBounds } from '../utils/dropZone';
import { drag, useDragTuningEdits } from '../tuning/drag';

// F48: the rolling area lights up while a die you're dragging is over it — letting go there counts.
// content/tuning/drag.json → zoneHighlight picks the look:
//   "tint"    — the drop zone's felt glows brighter (a see-through glow laid on the felt)
//   "outline" — a glowing frame around the drop zone
// The drag position is read from the store every frame and applied to the materials — never React state.

const FLOOR_Y = 0.02; // just above the felt

// The four bars of the frame: centre (x, z) and size (w along x, h along z)
function outlineBars() {
  const { minX, maxX, minZ, maxZ } = rollingZoneBounds();
  const t = drag.zoneOutlineWidth;
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;
  const w = maxX - minX;
  const h = maxZ - minZ;
  return [
    { x: cx, z: minZ, w: w + t, h: t }, // top
    { x: cx, z: maxZ, w: w + t, h: t }, // bottom
    { x: minX, z: cz, w: t, h: h + t }, // left
    { x: maxX, z: cz, w: t, h: h + t }, // right
  ];
}

export function DropZoneHighlight() {
  useDragTuningEdits(); // zone size (zonePadding) + frame width are read while drawing — redraw on a Dev Kit edit
  const tintMat = useRef<MeshBasicMaterial>(null);
  const outlineGroup = useRef<Group>(null);
  const outlineMats = useRef<(MeshBasicMaterial | null)[]>([]);
  const glow = useRef(0); // 0 = off, 1 = fully on — fades between

  useFrame((_, delta) => {
    const d = useGameStore.getState().dragUnlockState;
    const over = d.active && d.currentPosition !== null && isInRollingZone(d.currentPosition);
    if (!over && glow.current === 0) return; // idle: nothing to update
    glow.current += ((over ? 1 : 0) - glow.current) * Math.min(1, delta * drag.highlightFadeSpeed);
    if (!over && glow.current < 0.01) glow.current = 0;

    const tint = drag.zoneHighlight === 'tint' ? glow.current : 0;
    const outline = drag.zoneHighlight === 'outline' ? glow.current : 0;
    if (tintMat.current) {
      tintMat.current.color.set(drag.highlightColor);
      tintMat.current.opacity = tint * drag.tintStrength;
      tintMat.current.visible = tint > 0;
    }
    if (outlineGroup.current) outlineGroup.current.visible = outline > 0;
    for (const mat of outlineMats.current) {
      if (!mat) continue;
      mat.color.set(drag.highlightColor);
      mat.opacity = outline * drag.zoneOutlineOpacity;
    }
  });

  const { minX, maxX, minZ, maxZ } = rollingZoneBounds();
  return (
    <group>
      {/* "tint": a see-through glow over the drop zone — added on top, so the felt brightens */}
      <mesh position={[(minX + maxX) / 2, FLOOR_Y, (minZ + maxZ) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[maxX - minX, maxZ - minZ]} />
        <meshBasicMaterial ref={tintMat} transparent opacity={0} visible={false} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
      </mesh>

      {/* "outline": glowing frame around the drop zone */}
      <group ref={outlineGroup} visible={false}>
        {outlineBars().map((bar, i) => (
          <mesh key={i} position={[bar.x, FLOOR_Y + 0.01, bar.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[bar.w, bar.h]} />
            <meshBasicMaterial
              ref={(m) => { outlineMats.current[i] = m; }}
              transparent
              opacity={0}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
