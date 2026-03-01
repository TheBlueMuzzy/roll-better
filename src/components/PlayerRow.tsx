import { Die3D } from './Die3D';
import { DIE_SIZE } from './RollingArea';
import { SLOT_COUNT, getSlotX, getRotationForFace } from './GoalRow';

interface PlayerRowProps {
  z?: number;
  color: string;
  lockedValues?: (number | null)[];
}

const SLOT_VISUAL_SIZE = DIE_SIZE * 0.9;

export function PlayerRow({
  z = -2.2,
  color,
  lockedValues = Array(SLOT_COUNT).fill(null),
}: PlayerRowProps) {
  return (
    <group position={[0, 0, z]}>
      {Array.from({ length: SLOT_COUNT }, (_, i) => {
        const value = lockedValues[i] ?? null;

        // Locked die — render Die3D with correct face rotation
        if (value !== null) {
          return (
            <group
              key={i}
              position={[getSlotX(i), DIE_SIZE / 2, 0]}
              rotation={getRotationForFace(value)}
              scale={DIE_SIZE}
            >
              <Die3D color={color} />
            </group>
          );
        }

        // Empty slot — faint colored ghost square on the floor
        return (
          <mesh
            key={i}
            position={[getSlotX(i), 0.02, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[SLOT_VISUAL_SIZE, SLOT_VISUAL_SIZE]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.15}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}
