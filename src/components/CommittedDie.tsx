import { Die3D } from './Die3D';
import { DIE_SIZE } from './RollingArea';
import { getRotationForFace } from './GoalRow';

interface CommittedDieProps {
  value: number;
  color: string;
  position: [number, number, number];
}

/** Visual-only glowing die shown in the rolling zone for committed unlocks. No physics. */
export function CommittedDie({ value, color, position }: CommittedDieProps) {
  return (
    <group
      position={[position[0], DIE_SIZE / 2, position[2]]}
      rotation={getRotationForFace(value)}
      scale={DIE_SIZE}
    >
      <Die3D color={color} emissive={color} emissiveIntensity={0.3} />
    </group>
  );
}
