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
  onComplete?: () => void;
}

export function AnimatingDie({
  fromPos,
  toPos,
  value,
  color,
  duration = 0.6,
  onComplete,
}: AnimatingDieProps) {
  const groupRef = useRef<Group>(null);
  const elapsedRef = useRef(0);
  const hasFiredRef = useRef(false);

  const rotation = getRotationForFace(value);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    elapsedRef.current += delta;
    const t = Math.min(elapsedRef.current / duration, 1);

    // Ease-out cubic: decelerates as it arrives
    const eased = 1 - Math.pow(1 - t, 3);

    // Interpolate X and Z linearly with easing
    const x = fromPos[0] + (toPos[0] - fromPos[0]) * eased;
    const z = fromPos[2] + (toPos[2] - fromPos[2]) * eased;

    // Y: interpolate base height + parabolic arc for lob feel
    const baseY = fromPos[1] + (toPos[1] - fromPos[1]) * eased;
    const y = baseY + Math.sin(t * Math.PI) * 0.8;

    groupRef.current.position.set(x, y, z);

    // Fire completion once when animation ends
    if (t >= 1 && !hasFiredRef.current) {
      hasFiredRef.current = true;
      onComplete?.();
    }
  });

  return (
    <group ref={groupRef} scale={DIE_SIZE} rotation={rotation}>
      <Die3D color={color} />
    </group>
  );
}
