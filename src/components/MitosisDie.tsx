import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Die3D } from './Die3D';
import { DIE_SIZE } from './RollingArea';
import { getRotationForFace } from './GoalRow';
import type { Group } from 'three';

interface MitosisDieProps {
  fromPos: [number, number, number];
  targetPos: [number, number, number];
  splitTargets: [[number, number, number], [number, number, number]];
  value: number;
  color: string;
  onComplete?: () => void;
}

// Phase timing (seconds)
const LERP_END = 0.5;
const SHAKE_END = 0.9;
const SPLIT_END = 1.3;

export function MitosisDie({
  fromPos,
  targetPos,
  splitTargets,
  value,
  color,
  onComplete,
}: MitosisDieProps) {
  const groupRef = useRef<Group>(null);
  const dieGroupARef = useRef<Group>(null);
  const dieGroupBRef = useRef<Group>(null);
  const elapsedRef = useRef(0);
  const hasFiredRef = useRef(false);
  const bVisibleRef = useRef(false);

  const rotation = getRotationForFace(value);

  useFrame((_, delta) => {
    if (!groupRef.current || !dieGroupARef.current || !dieGroupBRef.current) return;

    elapsedRef.current += delta;
    const elapsed = elapsedRef.current;

    if (elapsed < LERP_END) {
      // ---- Phase 1: LERP (0 to 0.5s) ----
      // Single die flies from fromPos to targetPos
      const t = Math.min(elapsed / LERP_END, 1);

      // Ease-in-out cubic
      const eased = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;

      // Interpolate XZ with easing
      const x = fromPos[0] + (targetPos[0] - fromPos[0]) * eased;
      const z = fromPos[2] + (targetPos[2] - fromPos[2]) * eased;

      // Y: interpolate base + parabolic arc
      const baseY = fromPos[1] + (targetPos[1] - fromPos[1]) * eased;
      const y = baseY + Math.sin(t * Math.PI) * 0.8;

      // Move die A to interpolated position
      dieGroupARef.current.position.set(x, y, z);
      dieGroupARef.current.visible = true;
      dieGroupBRef.current.visible = false;

    } else if (elapsed < SHAKE_END) {
      // ---- Phase 2: SHAKE (0.5s to 0.9s) ----
      // Die shakes at targetPos with increasing intensity
      const phaseElapsed = elapsed - LERP_END;
      const phaseDuration = SHAKE_END - LERP_END;
      const phaseT = phaseElapsed / phaseDuration; // 0 to 1

      // Amplitude ramps from 0.02 to 0.12
      const amplitude = 0.02 + phaseT * 0.10;
      const shakeOffset = Math.sin(elapsed * 40) * amplitude;

      dieGroupARef.current.position.set(
        targetPos[0] + shakeOffset,
        targetPos[1],
        targetPos[2],
      );
      dieGroupARef.current.visible = true;
      dieGroupBRef.current.visible = false;

    } else if (elapsed < SPLIT_END) {
      // ---- Phase 3: SPLIT (0.9s to 1.3s) ----
      // Die divides into two, easing out to split targets
      if (!bVisibleRef.current) {
        bVisibleRef.current = true;
        dieGroupBRef.current.visible = true;
        // Start both at targetPos
        dieGroupBRef.current.position.set(targetPos[0], targetPos[1], targetPos[2]);
      }

      const phaseElapsed = elapsed - SHAKE_END;
      const phaseDuration = SPLIT_END - SHAKE_END;
      const t = Math.min(phaseElapsed / phaseDuration, 1);

      // Ease-out cubic: fast start, decelerate
      const eased = 1 - Math.pow(1 - t, 3);

      // Die A moves toward splitTargets[0]
      const ax = targetPos[0] + (splitTargets[0][0] - targetPos[0]) * eased;
      const az = targetPos[2] + (splitTargets[0][2] - targetPos[2]) * eased;
      dieGroupARef.current.position.set(ax, targetPos[1], az);

      // Die B moves toward splitTargets[1]
      const bx = targetPos[0] + (splitTargets[1][0] - targetPos[0]) * eased;
      const bz = targetPos[2] + (splitTargets[1][2] - targetPos[2]) * eased;
      dieGroupBRef.current.position.set(bx, targetPos[1], bz);

    } else {
      // ---- Animation complete ----
      // Ensure final positions are exact
      dieGroupARef.current.position.set(splitTargets[0][0], splitTargets[0][1], splitTargets[0][2]);
      dieGroupBRef.current.position.set(splitTargets[1][0], splitTargets[1][1], splitTargets[1][2]);
      dieGroupARef.current.visible = true;
      dieGroupBRef.current.visible = true;

      if (!hasFiredRef.current) {
        hasFiredRef.current = true;
        onComplete?.();
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Die A — visible from the start */}
      <group ref={dieGroupARef} scale={DIE_SIZE} rotation={rotation}>
        <Die3D color={color} />
      </group>

      {/* Die B — starts hidden, becomes visible during split phase */}
      <group ref={dieGroupBRef} scale={DIE_SIZE} rotation={rotation} visible={false}>
        <Die3D color={color} />
      </group>
    </group>
  );
}
