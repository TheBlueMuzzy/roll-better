import { useRapier } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import { accelGravity } from '../hooks/useAccelerometerGravity';

/**
 * Syncs the Rapier physics world gravity with accelerometer data every frame.
 * Must be placed inside a <Physics> component.
 */
export function GravityController() {
  const { world } = useRapier();

  useFrame(() => {
    const g = world.gravity;
    // Only write if changed (avoid unnecessary work)
    if (g.x !== accelGravity.x || g.y !== accelGravity.y || g.z !== accelGravity.z) {
      world.gravity = { x: accelGravity.x, y: accelGravity.y, z: accelGravity.z };
    }
  });

  return null;
}
