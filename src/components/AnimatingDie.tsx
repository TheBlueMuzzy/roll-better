import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Euler, Quaternion } from 'three';
import { Die3D } from './Die3D';
import { DIE_SIZE } from './RollingArea';
import { getRotationForFace } from './GoalRow';
import { playWhoosh, playLockSnap } from '../utils/soundManager';
import type { Group } from 'three';

interface AnimatingDieProps {
  fromPos: [number, number, number];
  toPos: [number, number, number];
  fromRotation: [number, number, number];
  value: number;
  color: string;
  delay?: number;
  duration?: number;
  fromScale?: number;
  toScale?: number;
  onComplete?: () => void;
}

export function AnimatingDie({
  fromPos,
  toPos,
  fromRotation,
  value,
  color,
  delay = 0,
  duration = 0.6,
  fromScale = 1,
  toScale = 1,
  onComplete,
}: AnimatingDieProps) {
  const groupRef = useRef<Group>(null);
  const elapsedRef = useRef(0);
  const hasFiredRef = useRef(false);
  const hasStartedRef = useRef(false);

  // Precompute quaternions for slerp
  const { startQ, endQ } = useMemo(() => {
    const s = new Quaternion().setFromEuler(new Euler(fromRotation[0], fromRotation[1], fromRotation[2]));
    const target = getRotationForFace(value);
    const e = new Quaternion().setFromEuler(new Euler(target[0], target[1], target[2]));
    return { startQ: s, endQ: e };
  }, [fromRotation, value]);

  // Reusable quaternion for per-frame slerp
  const currentQ = useMemo(() => new Quaternion(), []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    elapsedRef.current += delta;
    const elapsed = elapsedRef.current - delay;

    // Still waiting for stagger delay — sit at source position
    if (elapsed < 0) {
      groupRef.current.position.set(fromPos[0], fromPos[1], fromPos[2]);
      groupRef.current.quaternion.copy(startQ);
      groupRef.current.scale.setScalar(fromScale * DIE_SIZE);
      return;
    }

    // Play whoosh when flight starts (delay expired)
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      playWhoosh();
    }

    const t = Math.min(elapsed / duration, 1);

    // Ease-in-out cubic
    const eased = t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Position
    const x = fromPos[0] + (toPos[0] - fromPos[0]) * eased;
    const z = fromPos[2] + (toPos[2] - fromPos[2]) * eased;
    const baseY = fromPos[1] + (toPos[1] - fromPos[1]) * eased;
    const y = baseY + Math.sin(t * Math.PI) * DIE_SIZE * 1.2;
    groupRef.current.position.set(x, y, z);

    // Slerp rotation from physics settle to square locked orientation
    currentQ.copy(startQ).slerp(endQ, eased);
    groupRef.current.quaternion.copy(currentQ);

    // Scale interpolation (incorporates DIE_SIZE)
    const currentScale = fromScale + (toScale - fromScale) * eased;
    groupRef.current.scale.setScalar(currentScale * DIE_SIZE);

    if (t >= 1 && !hasFiredRef.current) {
      hasFiredRef.current = true;
      playLockSnap();
      onComplete?.();
    }
  });

  return (
    <group ref={groupRef} scale={fromScale * DIE_SIZE}>
      <Die3D color={color} />
    </group>
  );
}
