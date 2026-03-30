import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Die3D } from './Die3D';
import { DIE_SIZE } from './RollingArea';
import { getRotationForFace } from './GoalRow';
import type { Group } from 'three';

interface CommittedDieProps {
  value: number;
  color: string;
  position: [number, number, number];
  dropPosition: [number, number, number];
}

/** Visual-only glowing die shown in the rolling zone for committed unlocks. No physics.
 *  Animates from dropPosition to position with a small arc on mount. */
export function CommittedDie({ value, color, position, dropPosition }: CommittedDieProps) {
  const groupRef = useRef<Group>(null);
  const animProgress = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (animProgress.current >= 1) return;

    animProgress.current = Math.min(1, animProgress.current + delta * 6);
    // Cubic ease-out
    const t = 1 - Math.pow(1 - animProgress.current, 3);

    // Lerp X/Z from dropPosition to position
    const x = dropPosition[0] + (position[0] - dropPosition[0]) * t;
    const z = dropPosition[2] + (position[2] - dropPosition[2]) * t;
    // Y: base height + parabolic arc (small hop)
    const y = DIE_SIZE / 2 + Math.sin(t * Math.PI) * DIE_SIZE * 2.0;

    groupRef.current.position.set(x, y, z);
  });

  return (
    <group
      ref={groupRef}
      position={[dropPosition[0], DIE_SIZE / 2, dropPosition[2]]}
      rotation={getRotationForFace(value)}
      scale={DIE_SIZE}
    >
      <Die3D color={color} emissive={color} emissiveIntensity={0.3} />
    </group>
  );
}
