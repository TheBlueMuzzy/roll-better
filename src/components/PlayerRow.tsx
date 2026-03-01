import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Die3D } from './Die3D';
import { DIE_SIZE } from './RollingArea';
import { SLOT_COUNT, getSlotX, getRotationForFace } from './GoalRow';
import type { GamePhase } from '../types/game';
import type { Group } from 'three';

interface PlayerRowProps {
  z?: number;
  color: string;
  lockedValues?: (number | null)[];
  phase?: GamePhase;
  selectedForUnlock?: number[];
  onToggleUnlock?: (slotIndex: number) => void;
}

const SLOT_VISUAL_SIZE = DIE_SIZE * 0.9;
const OUTLINE_SIZE = DIE_SIZE * 1.15; // slightly larger than die for outline effect
const SELECTED_SCALE = 0.75; // shrink 25% when selected
const PULSE_SPEED = 3; // scale pulse frequency
const PULSE_AMOUNT = 0.03; // subtle pulse amplitude

/** Animated wrapper for locked dice during unlock phase */
function UnlockableDie({
  slotIndex,
  value,
  color,
  isSelected,
  onToggle,
}: {
  slotIndex: number;
  value: number;
  color: string;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const groupRef = useRef<Group>(null);

  // Subtle scale pulse on unlockable dice (not selected ones — they shrink static)
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const targetScale = isSelected ? SELECTED_SCALE : 1;
    if (!isSelected) {
      // Gentle pulse to show they're interactive
      const pulse = 1 + Math.sin(Date.now() * 0.001 * PULSE_SPEED) * PULSE_AMOUNT;
      groupRef.current.scale.setScalar(DIE_SIZE * pulse);
    } else {
      // Lerp to shrunk size
      const current = groupRef.current.scale.x / DIE_SIZE;
      const next = current + (targetScale - current) * Math.min(1, delta * 10);
      groupRef.current.scale.setScalar(DIE_SIZE * next);
    }
  });

  return (
    <group>
      {/* Die mesh — tappable */}
      <group
        ref={groupRef}
        position={[getSlotX(slotIndex), DIE_SIZE / 2, 0]}
        rotation={getRotationForFace(value)}
        scale={DIE_SIZE}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <Die3D color={color} />
      </group>

      {/* White outline ring — always visible during unlock phase */}
      <mesh
        position={[getSlotX(slotIndex), 0.03, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[OUTLINE_SIZE * 0.45, OUTLINE_SIZE * 0.55]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={isSelected ? 1.0 : 0.5}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

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

        // Locked die
        if (value !== null) {
          // During unlocking — interactive with highlights
          if (isUnlocking && onToggleUnlock) {
            return (
              <UnlockableDie
                key={i}
                slotIndex={i}
                value={value}
                color={color}
                isSelected={selectedForUnlock.includes(i)}
                onToggle={() => onToggleUnlock(i)}
              />
            );
          }

          // Normal locked die — static, not interactive
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
