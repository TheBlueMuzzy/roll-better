import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Die3D } from './Die3D';
import { DIE_SIZE } from './RollingArea';
import { playSpawnPop } from '../utils/soundManager';
import type { Group } from 'three';

interface SpawningDieProps {
  fromPos: [number, number, number];  // player avatar position
  toPos: [number, number, number];    // target pool position
  color: string;
  delay?: number;                      // stagger delay in seconds
  duration?: number;                   // flight duration in seconds
  onComplete?: () => void;
}

// Scale overshoot: 0 → 1.15 → 1.0
// Using sine-based bounce: scale = (1 + 0.15 * sin(t * PI)) * eased_t
// where eased_t goes 0→1 with ease-out

export function SpawningDie({
  fromPos,
  toPos,
  color,
  delay = 0,
  duration = 0.6,
  onComplete,
}: SpawningDieProps) {
  const groupRef = useRef<Group>(null);
  const elapsedRef = useRef(0);
  const hasFiredRef = useRef(false);
  const hasStartedRef = useRef(false);

  // Random tumble speeds (fixed per die instance)
  const tumbleSpeeds = useMemo(() => ({
    x: 8 + Math.random() * 6,   // 8–14 rad/s
    z: 5 + Math.random() * 5,   // 5–10 rad/s
  }), []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    elapsedRef.current += delta;
    const elapsed = elapsedRef.current - delay;

    // Still waiting for stagger delay
    if (elapsed < 0) {
      groupRef.current.position.set(fromPos[0], fromPos[1], fromPos[2]);
      groupRef.current.scale.setScalar(0);
      return;
    }

    // Play spawn pop when flight starts (delay expired)
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      playSpawnPop();
    }

    const t = Math.min(elapsed / duration, 1);

    // Ease-out cubic for position (fast start, slow end)
    const eased = 1 - Math.pow(1 - t, 3);

    // Position: lerp from avatar to pool position
    const x = fromPos[0] + (toPos[0] - fromPos[0]) * eased;
    const z = fromPos[2] + (toPos[2] - fromPos[2]) * eased;
    // Arc: lift up during flight
    const baseY = fromPos[1] + (toPos[1] - fromPos[1]) * eased;
    const y = baseY + Math.sin(t * Math.PI) * 0.6;
    groupRef.current.position.set(x, y, z);

    // Scale: ease-out with overshoot bounce
    // Base scale ramps 0→1 with ease-out, plus sine bounce for overshoot
    const scaleBase = eased;
    const bounce = Math.sin(t * Math.PI) * 0.15; // peaks at 1.15 midway
    const scale = Math.max(0, scaleBase + bounce);
    groupRef.current.scale.setScalar(scale * DIE_SIZE);

    // Tumble rotation during flight
    groupRef.current.rotation.x += delta * tumbleSpeeds.x;
    groupRef.current.rotation.z += delta * tumbleSpeeds.z;

    if (t >= 1 && !hasFiredRef.current) {
      hasFiredRef.current = true;
      // Ensure final state is exact
      groupRef.current.position.set(toPos[0], toPos[1], toPos[2]);
      groupRef.current.scale.setScalar(1 * DIE_SIZE);
      onComplete?.();
    }
  });

  return (
    <group ref={groupRef} scale={0}>
      <Die3D color={color} />
    </group>
  );
}
