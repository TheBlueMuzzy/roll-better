import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Die3D } from './Die3D';
import { DIE_SIZE } from './RollingArea';
import { getRotationForFace } from './GoalRow';
import type { Group } from 'three';

interface AnimatingDieProps {
  fromPos: [number, number, number];
  toPos: [number, number, number];
  value: number;
  color: string;
  duration?: number;
  delay?: number;
  fromScale?: number;
  toScale?: number;
  onComplete?: () => void;
}

export function AnimatingDie({
  fromPos,
  toPos,
  value,
  color,
  duration = 0.6,
  delay = 0,
  fromScale = 1.0,
  toScale = 1.0,
  onComplete,
}: AnimatingDieProps) {
  const groupRef = useRef<Group>(null);
  const elapsedRef = useRef(0);
  const hasFiredRef = useRef(false);

  const rotation = getRotationForFace(value);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    elapsedRef.current += delta;

    // During delay period, hide the die
    if (elapsedRef.current < delay) {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;
    const animTime = elapsedRef.current - delay;
    const t = Math.min(animTime / duration, 1);

    // Ease-in-out cubic: accelerates then decelerates
    const eased = t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Interpolate X and Z linearly with easing
    const x = fromPos[0] + (toPos[0] - fromPos[0]) * eased;
    const z = fromPos[2] + (toPos[2] - fromPos[2]) * eased;

    // Y: interpolate base height + parabolic arc for lob feel
    const baseY = fromPos[1] + (toPos[1] - fromPos[1]) * eased;
    const y = baseY + Math.sin(t * Math.PI) * 0.8;

    groupRef.current.position.set(x, y, z);

    // Interpolate scale alongside position
    const currentScale = fromScale + (toScale - fromScale) * eased;
    groupRef.current.scale.setScalar(DIE_SIZE * currentScale);

    // Fire completion once when animation ends
    if (t >= 1 && !hasFiredRef.current) {
      hasFiredRef.current = true;
      onComplete?.();
    }
  });

  return (
    <group ref={groupRef} scale={DIE_SIZE} rotation={rotation} visible={delay > 0 ? false : true}>
      <Die3D color={color} />
    </group>
  );
}
