import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Die3D } from './Die3D';
import { DIE_SIZE } from './RollingArea';
import { SLOT_COUNT, getSlotX, getRotationForFace } from './GoalRow';
import { useGameStore } from '../store/gameStore';
import type { GamePhase, UnlockAnimation } from '../types/game';
import { Color, Plane, Vector3 } from 'three';
import { toast } from '../ui/kit';
import { text, fill } from '../ui/words';
import { MAX_DICE } from '../utils/diceCap';
import { shouldShowCapToast } from '../utils/unlockTurn';
import type { Group } from 'three';

const _dragPlane = new Plane(new Vector3(0, 1, 0), 0); // Y=0 table plane
const _dragIntersect = new Vector3();

interface PlayerRowProps {
  z?: number;
  color: string;
  lockedValues?: (number | null)[];
  phase?: GamePhase;
  selectedForUnlock?: number[];
  animatingSlotIndices?: number[];
  unlockAnimations?: UnlockAnimation[];
  canUnlock?: boolean;
  maxUnlocks?: number;
  atCap?: boolean; // F48: the 12-dice cap is reached — locked dice dim and can't be dragged
}

const SLOT_VISUAL_SIZE = DIE_SIZE * 0.9;
const OUTLINE_SIZE = DIE_SIZE * 1.15; // slightly larger than die for outline effect
const LIFT_HEIGHT = 0.3; // Y offset when selected ("picked up")
const PULSE_SPEED = 3; // scale pulse frequency
const PULSE_AMOUNT = 0.03; // subtle pulse amplitude

const SHAKE_DURATION = 0.15; // seconds
const SHAKE_INTENSITY = 0.08; // world units
const SHAKE_FREQ = 90; // oscillations per second

const CAP_DIM = 0.55; // how far a die at the 12-dice cap fades toward dark grey (0 = normal look, 1 = grey)
const CAP_DIM_TOWARD = new Color('#2b2b2b');
const CAP_TOAST_COOLDOWN = 2; // seconds — "Max 12 dice" shows at most this often, however fast you tap
let lastCapToastAt: number | null = null; // shared by every die: one toast for the whole row

/** Animated wrapper for locked dice during unlock phase */
function UnlockableDie({
  slotIndex,
  value,
  color,
  isSelected,
  selectable,
  capped,
  rowZ,
}: {
  slotIndex: number;
  value: number;
  color: string;
  isSelected: boolean;
  selectable: boolean;
  capped: boolean;
  rowZ: number;
}) {
  const groupRef = useRef<Group>(null);
  const shakeStartRef = useRef<number | null>(null);
  const liftRef = useRef(0); // current lift amount, lerps toward target
  const isDragging = useRef(false);
  const dragPointerId = useRef<number | null>(null); // the finger (or mouse) holding this die
  const wasDragging = useRef(false);
  const returnFromPos = useRef<[number, number, number] | null>(null);

  const dragUnlockState = useGameStore((s) => s.dragUnlockState);
  const startDragUnlock = useGameStore((s) => s.startDragUnlock);
  const updateDragPosition = useGameStore((s) => s.updateDragPosition);

  const isBeingDragged = dragUnlockState.active && dragUnlockState.slotIndex === slotIndex;

  // Let go of the die: the store decides commit vs snap-back (rolling zone, 12-dice cap, turn still
  // open) from the last place the die was seen. If the timer already resolved this drag, this does nothing.
  const endDrag = () => {
    isDragging.current = false;
    dragPointerId.current = null;
    useGameStore.getState().completeDragUnlock();
  };

  // F48: the finger can be lost mid-drag without a normal release — the phone takes over the touch
  // (pointercancel: a system gesture, a notification, the page scrolling) or the pointer capture is
  // dropped (lostpointercapture). R3F doesn't pass either to the die, so listen on the page and
  // resolve the drag right away, exactly like letting go at the last known spot.
  useEffect(() => {
    const onPointerLost = (e: PointerEvent) => {
      if (!isDragging.current || e.pointerId !== dragPointerId.current) return;
      endDrag();
    };
    window.addEventListener('pointercancel', onPointerLost, true);
    window.addEventListener('lostpointercapture', onPointerLost, true);
    return () => {
      window.removeEventListener('pointercancel', onPointerLost, true);
      window.removeEventListener('lostpointercapture', onPointerLost, true);
    };
  }, []);

  // At the 12-dice cap the die wears a dimmed colour
  const dieColor = useMemo(() => (capped ? '#' + new Color(color).lerp(CAP_DIM_TOWARD, CAP_DIM).getHexString() : color), [capped, color]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Track drag→not-dragging transition for snap-back
    if (isBeingDragged) {
      wasDragging.current = true;
    } else if (wasDragging.current) {
      // Just stopped dragging — capture current position to lerp back from
      returnFromPos.current = [
        groupRef.current.position.x,
        groupRef.current.position.y,
        groupRef.current.position.z,
      ];
      wasDragging.current = false;
    }

    // Snap-back lerp animation (returning to slot after invalid drop)
    if (returnFromPos.current !== null) {
      const targetX = getSlotX(slotIndex);
      const targetY = DIE_SIZE / 2;
      const targetZ = 0;
      const speed = Math.min(1, delta * 12);
      groupRef.current.position.x += (targetX - groupRef.current.position.x) * speed;
      groupRef.current.position.y += (targetY - groupRef.current.position.y) * speed;
      groupRef.current.position.z += (targetZ - groupRef.current.position.z) * speed;
      // Check if close enough to snap exactly
      const dx = Math.abs(groupRef.current.position.x - targetX);
      const dy = Math.abs(groupRef.current.position.y - targetY);
      const dz = Math.abs(groupRef.current.position.z - targetZ);
      if (dx < 0.01 && dy < 0.01 && dz < 0.01) {
        groupRef.current.position.x = targetX;
        groupRef.current.position.y = targetY;
        groupRef.current.position.z = targetZ;
        returnFromPos.current = null;
      }
      return; // skip pulse/shake/lift while returning
    }

    // Drag position override — world coords converted to local (subtract parent rowZ)
    if (isBeingDragged && dragUnlockState.currentPosition) {
      groupRef.current.position.x = dragUnlockState.currentPosition[0];
      groupRef.current.position.y = DIE_SIZE * 2.5;
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
          if (capped) {
            // F48: can't drag at the 12-dice cap — a little shake + "Max 12 dice" (not once per tap)
            e.stopPropagation();
            shakeStartRef.current = Date.now();
            const now = Date.now();
            if (shouldShowCapToast(now, lastCapToastAt, CAP_TOAST_COOLDOWN)) {
              lastCapToastAt = now;
              toast(fill(text.toasts.maxDice, { max: MAX_DICE }));
            }
            return;
          }
          if (!selectable) return;
          e.stopPropagation();
          // F48: one drag at a time — a second finger (on this die or another) is ignored
          if (isDragging.current) return;
          const originPosition: [number, number, number] = [getSlotX(slotIndex), DIE_SIZE / 2, rowZ];
          if (!startDragUnlock(slotIndex, value, originPosition)) return;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          isDragging.current = true;
          dragPointerId.current = e.pointerId;
        }}
        onPointerMove={(e) => {
          if (!isDragging.current || !selectable || e.pointerId !== dragPointerId.current) return;
          e.stopPropagation();
          if (e.ray.intersectPlane(_dragPlane, _dragIntersect)) {
            updateDragPosition([_dragIntersect.x, DIE_SIZE / 2, _dragIntersect.z]);
          }
        }}
        onPointerUp={(e) => {
          // No `selectable` check here: the turn may have closed mid-drag — still let go cleanly
          if (!isDragging.current || e.pointerId !== dragPointerId.current) return;
          e.stopPropagation();
          endDrag(); // before releasing, so the lostpointercapture that follows is ignored
          (e.target as Element).releasePointerCapture?.(e.pointerId);
        }}
        onPointerOver={(e) => {
          if (!selectable && !capped) return;
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        {/* B010: draw this die (body AND pips) after other no-depth-test table marks, so they never
            show through the pip holes when a lifted die passes over them. (The row badges beside
            each row are page-level kit chips since F58: they fade under a dragged die — RowChips.tsx.) */}
        <Die3D color={dieColor} renderOrder={30} />
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
  animatingSlotIndices = [],
  unlockAnimations = [],
  canUnlock = true,
  maxUnlocks = 0,
  atCap = false,
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
          if (isUnlocking && canUnlock) {
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
                capped={atCap && !isThisSelected}
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
