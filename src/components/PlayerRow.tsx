import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Die3D } from './Die3D';
import { DIE_SIZE } from './RollingArea';
import { SLOT_COUNT, getSlotX, getRotationForFace } from './GoalRow';
import { useGameStore } from '../store/gameStore';
import type { GamePhase, UnlockAnimation } from '../types/game';
import { Plane, Vector3 } from 'three';
import type { Group } from 'three';

const _dragPlane = new Plane(new Vector3(0, 1, 0), 0); // Y=0 table plane
const _dragIntersect = new Vector3();

interface PlayerRowProps {
  z?: number;
  color: string;
  lockedValues?: (number | null)[];
  phase?: GamePhase;
  selectedForUnlock?: number[];
  onToggleUnlock?: (slotIndex: number) => void;
  shakingSlot?: number | null;
  animatingSlotIndices?: number[];
  unlockAnimations?: UnlockAnimation[];
  canUnlock?: boolean;
  maxUnlocks?: number;
}

const SLOT_VISUAL_SIZE = DIE_SIZE * 0.9;
const OUTLINE_SIZE = DIE_SIZE * 1.15; // slightly larger than die for outline effect
const LIFT_HEIGHT = 0.3; // Y offset when selected ("picked up")
const PULSE_SPEED = 3; // scale pulse frequency
const PULSE_AMOUNT = 0.03; // subtle pulse amplitude

const SHAKE_DURATION = 0.15; // seconds
const SHAKE_INTENSITY = 0.08; // world units
const SHAKE_FREQ = 90; // oscillations per second

/** Animated wrapper for locked dice during unlock phase */
function UnlockableDie({
  slotIndex,
  value,
  color,
  isSelected,
  selectable,
  shaking,
  onToggle,
  rowZ,
}: {
  slotIndex: number;
  value: number;
  color: string;
  isSelected: boolean;
  selectable: boolean;
  shaking: boolean;
  onToggle: () => void;
  rowZ: number;
}) {
  const groupRef = useRef<Group>(null);
  const shakeStartRef = useRef<number | null>(null);
  const liftRef = useRef(0); // current lift amount, lerps toward target
  const isDragging = useRef(false);

  const dragUnlockState = useGameStore((s) => s.dragUnlockState);
  const startDragUnlock = useGameStore((s) => s.startDragUnlock);
  const updateDragPosition = useGameStore((s) => s.updateDragPosition);
  const cancelDragUnlock = useGameStore((s) => s.cancelDragUnlock);

  const isBeingDragged = dragUnlockState.active && dragUnlockState.slotIndex === slotIndex;

  // Track shake start time
  if (shaking && shakeStartRef.current === null) {
    shakeStartRef.current = Date.now();
  } else if (!shaking) {
    shakeStartRef.current = null;
  }

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Drag position override — world coords converted to local (subtract parent rowZ)
    if (isBeingDragged && dragUnlockState.currentPosition) {
      groupRef.current.position.x = dragUnlockState.currentPosition[0];
      groupRef.current.position.y = DIE_SIZE * 0.75;
      groupRef.current.position.z = dragUnlockState.currentPosition[2] - rowZ;
      return; // skip lift/pulse/shake while dragging
    }

    // Shake: horizontal oscillation that decays
    const baseX = getSlotX(slotIndex);
    if (shakeStartRef.current !== null) {
      const elapsed = (Date.now() - shakeStartRef.current) / 1000;
      if (elapsed < SHAKE_DURATION) {
        const decay = 1 - elapsed / SHAKE_DURATION;
        const offset = Math.sin(elapsed * SHAKE_FREQ) * SHAKE_INTENSITY * decay;
        groupRef.current.position.x = baseX + offset;
      } else {
        groupRef.current.position.x = baseX;
        shakeStartRef.current = null;
      }
    } else {
      groupRef.current.position.x = baseX;
    }

    // Reset Z in case we just stopped dragging
    groupRef.current.position.z = 0;

    // Lift: translate Y up when selected, back down when deselected
    const liftTarget = isSelected ? LIFT_HEIGHT : 0;
    liftRef.current += (liftTarget - liftRef.current) * Math.min(1, delta * 10);
    groupRef.current.position.y = DIE_SIZE / 2 + liftRef.current;

    // Pulse: gentle scale pulse on selectable unselected dice (shows interactivity)
    if (!isSelected && selectable) {
      const pulse = 1 + Math.sin(Date.now() * 0.001 * PULSE_SPEED) * PULSE_AMOUNT;
      groupRef.current.scale.setScalar(DIE_SIZE * pulse);
    } else {
      // Selected or unselectable dice stay at base scale
      groupRef.current.scale.setScalar(DIE_SIZE);
    }
  });

  return (
    <group>
      {/* Die mesh — draggable */}
      <group
        ref={groupRef}
        position={[getSlotX(slotIndex), DIE_SIZE / 2, 0]}
        rotation={getRotationForFace(value)}
        scale={DIE_SIZE}
        onPointerDown={(e) => {
          e.stopPropagation();
          if (!selectable) return;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          const originPosition: [number, number, number] = [getSlotX(slotIndex), DIE_SIZE / 2, rowZ];
          startDragUnlock(slotIndex, value, originPosition);
          isDragging.current = true;
        }}
        onPointerMove={(e) => {
          if (!isDragging.current) return;
          e.stopPropagation();
          if (e.ray.intersectPlane(_dragPlane, _dragIntersect)) {
            updateDragPosition([_dragIntersect.x, DIE_SIZE / 2, _dragIntersect.z]);
          }
        }}
        onPointerUp={(e) => {
          if (!isDragging.current) return;
          e.stopPropagation();
          (e.target as Element).releasePointerCapture?.(e.pointerId);
          isDragging.current = false;
          cancelDragUnlock(); // temporary — Phase 44-02 adds drop zone check
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

      {/* White outline ring — only visible when selectable or already selected */}
      {(selectable || isSelected) && (
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
      )}
    </group>
  );
}

export function PlayerRow({
  z = -3.75,
  color,
  lockedValues = Array(SLOT_COUNT).fill(null),
  phase,
  selectedForUnlock = [],
  onToggleUnlock,
  shakingSlot = null,
  animatingSlotIndices = [],
  unlockAnimations = [],
  canUnlock = true,
  maxUnlocks = 0,
}: PlayerRowProps) {
  const isUnlocking = phase === 'unlocking';
  const remainingSelections = maxUnlocks - selectedForUnlock.length;

  return (
    <group position={[0, 0, z]}>
      {Array.from({ length: SLOT_COUNT }, (_, i) => {
        const value = lockedValues[i] ?? null;

        // Locked die
        if (value !== null) {
          // Skip rendering if this slot is currently being animated (die is flying in)
          if (animatingSlotIndices.includes(i)) {
            return null;
          }
          // Skip rendering if this slot is being animated out (mitosis unlock)
          if (unlockAnimations.some((a) => a.slotIndex === i)) {
            return null;
          }
          // During unlocking — interactive with highlights (only if player can unlock)
          if (isUnlocking && onToggleUnlock && canUnlock) {
            const isThisSelected = selectedForUnlock.includes(i);
            const isSelectable = isThisSelected || remainingSelections > 0;
            return (
              <UnlockableDie
                key={i}
                slotIndex={i}
                value={value}
                color={color}
                isSelected={isThisSelected}
                selectable={isSelectable}
                shaking={shakingSlot === i}
                onToggle={() => onToggleUnlock(i)}
                rowZ={z}
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
