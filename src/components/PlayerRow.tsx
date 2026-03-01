import { Die3D } from './Die3D';
import { DIE_SIZE } from './RollingArea';
import { SLOT_COUNT, getSlotX, getRotationForFace } from './GoalRow';
import type { GamePhase } from '../types/game';

interface PlayerRowProps {
  z?: number;
  color: string;
  lockedValues?: (number | null)[];
  phase?: GamePhase;
  selectedForUnlock?: number[];
  onToggleUnlock?: (slotIndex: number) => void;
}

const SLOT_VISUAL_SIZE = DIE_SIZE * 0.9;

export function PlayerRow({
  z = -3.77,
  color,
  lockedValues = Array(SLOT_COUNT).fill(null),
  phase,
  selectedForUnlock = [],
  onToggleUnlock,
}: PlayerRowProps) {
  const isUnlocking = phase === 'unlocking';

  return (
    <group position={[0, 0, z]}>
      {Array.from({ length: SLOT_COUNT }, (_, i) => {
        const value = lockedValues[i] ?? null;
        const isSelected = selectedForUnlock.includes(i);

        // Locked die — render Die3D with correct face rotation
        if (value !== null) {
          return (
            <group key={i}>
              {/* Die mesh */}
              <group
                position={[getSlotX(i), DIE_SIZE / 2, 0]}
                rotation={getRotationForFace(value)}
                scale={isSelected ? DIE_SIZE * 1.1 : DIE_SIZE}
                onClick={isUnlocking ? (e) => {
                  e.stopPropagation();
                  onToggleUnlock?.(i);
                } : undefined}
                onPointerOver={isUnlocking ? (e) => {
                  e.stopPropagation();
                  document.body.style.cursor = 'pointer';
                } : undefined}
                onPointerOut={isUnlocking ? () => {
                  document.body.style.cursor = 'default';
                } : undefined}
              >
                <Die3D color={color} />
              </group>

              {/* Selection indicator — white ring under die when selected for unlock */}
              {isSelected && (
                <mesh
                  position={[getSlotX(i), 0.03, 0]}
                  rotation={[-Math.PI / 2, 0, 0]}
                >
                  <ringGeometry args={[SLOT_VISUAL_SIZE * 0.5, SLOT_VISUAL_SIZE * 0.65]} />
                  <meshBasicMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.8}
                    depthWrite={false}
                  />
                </mesh>
              )}
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
