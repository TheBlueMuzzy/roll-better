import { forwardRef, useImperativeHandle, useRef } from 'react';
import { RigidBody, CuboidCollider, type RapierRigidBody } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';

// --- Rolling area X offset (right half of split layout) ---
export const ROLLING_X_OFFSET = 5;

// --- Arena bounds (exported for DicePool spawn positioning) ---
export const ARENA_HALF_X = 4.5;

// DEPRECATED: rolling zone is now asymmetric (ROLLING_Z_MIN / ROLLING_Z_MAX).
// Kept for backward compatibility — DicePool may still reference it.
export const ARENA_HALF_Z = 5;

// --- Symmetric rolling zone bounds (full viewport height) ---
export const ROLLING_Z_MIN = -5;
export const ROLLING_Z_MAX = 5;

// Derived: center and half-extent of the rolling zone
const ROLLING_Z_CENTER = (ROLLING_Z_MIN + ROLLING_Z_MAX) / 2; // 0
const ROLLING_Z_HALF = (ROLLING_Z_MAX - ROLLING_Z_MIN) / 2;   // 5

// Die size
export const DIE_SIZE = 0.8;

// Wall thickness and height
const WALL_THICKNESS = 0.25;
const WALL_HEIGHT = 8; // tall enough to catch dice at peak of roll arc

// Wall nudge amount (quarter die width)
const WALL_NUDGE = DIE_SIZE / 4; // 0.2

// Rest positions for walls
const LEFT_X = ROLLING_X_OFFSET - ARENA_HALF_X;   // 0.5
const RIGHT_X = ROLLING_X_OFFSET + ARENA_HALF_X;  // 9.5
const FRONT_Z = ROLLING_Z_MAX;                      // 5
const BACK_Z = ROLLING_Z_MIN;                       // -5

export interface RollingAreaHandle {
  nudgeWalls: () => void;
}

interface RollingAreaProps {
  onFloorPointerDown?: (point: [number, number, number]) => void;
  onFloorPointerMove?: (point: [number, number, number]) => void;
  onFloorPointerUp?: () => void;
}

export const RollingArea = forwardRef<RollingAreaHandle, RollingAreaProps>(
  function RollingArea({ onFloorPointerDown, onFloorPointerMove, onFloorPointerUp }, ref) {
    const leftWallRef = useRef<RapierRigidBody>(null);
    const rightWallRef = useRef<RapierRigidBody>(null);
    const frontWallRef = useRef<RapierRigidBody>(null);
    const backWallRef = useRef<RapierRigidBody>(null);

    // Nudge animation state
    const nudgePhase = useRef<'idle' | 'out' | 'returning'>('idle');
    const nudgeElapsed = useRef(0);
    const NUDGE_OUT_DUR = 0.05;   // fast out
    const NUDGE_RETURN_DUR = 0.4; // slow return

    useImperativeHandle(ref, () => ({
      nudgeWalls() {
        nudgePhase.current = 'out';
        nudgeElapsed.current = 0;
      },
    }));

    useFrame((_, delta) => {
      if (nudgePhase.current === 'idle') return;
      const dt = Math.min(delta, 0.05);
      nudgeElapsed.current += dt;

      let offset: number;

      if (nudgePhase.current === 'out') {
        const t = Math.min(nudgeElapsed.current / NUDGE_OUT_DUR, 1.0);
        offset = WALL_NUDGE * t;
        if (t >= 1.0) {
          nudgePhase.current = 'returning';
          nudgeElapsed.current = 0;
        }
      } else {
        // returning: ease-in (slow start, accelerate at end)
        const t = Math.min(nudgeElapsed.current / NUDGE_RETURN_DUR, 1.0);
        const eased = t * t; // ease-in: slow at start
        offset = WALL_NUDGE * (1 - eased);
        if (t >= 1.0) {
          nudgePhase.current = 'idle';
          offset = 0;
        }
      }

      // Move walls outward from center by offset
      leftWallRef.current?.setNextKinematicTranslation(
        { x: LEFT_X - offset, y: WALL_HEIGHT, z: ROLLING_Z_CENTER }
      );
      rightWallRef.current?.setNextKinematicTranslation(
        { x: RIGHT_X + offset, y: WALL_HEIGHT, z: ROLLING_Z_CENTER }
      );
      frontWallRef.current?.setNextKinematicTranslation(
        { x: ROLLING_X_OFFSET, y: WALL_HEIGHT, z: FRONT_Z + offset }
      );
      backWallRef.current?.setNextKinematicTranslation(
        { x: ROLLING_X_OFFSET, y: WALL_HEIGHT, z: BACK_Z - offset }
      );
    });

    return (
      <group>
        {/* Floor — static rigid body, sized to rolling zone only */}
        <RigidBody type="fixed" restitution={0.5}>
          <CuboidCollider
            args={[ARENA_HALF_X, 0.1, ROLLING_Z_HALF]}
            position={[ROLLING_X_OFFSET, -0.1, ROLLING_Z_CENTER]}
          />
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0, 0]}
            receiveShadow
            onPointerDown={(e) => {
              if (onFloorPointerDown) {
                e.stopPropagation();
                const p = e.point;
                onFloorPointerDown([p.x, p.y, p.z]);
              }
            }}
            onPointerMove={(e) => {
              if (onFloorPointerMove) {
                const p = e.point;
                onFloorPointerMove([p.x, p.y, p.z]);
              }
            }}
            onPointerUp={() => {
              onFloorPointerUp?.();
            }}
          >
            <planeGeometry args={[24, 16]} />
            <meshStandardMaterial color="#3d2517" roughness={0.7} metalness={0.0} />
          </mesh>
        </RigidBody>

        {/* Left wall — kinematicPosition for nudge animation */}
        {/* Position on RigidBody, collider at local origin */}
        <RigidBody ref={leftWallRef} type="kinematicPosition" position={[LEFT_X, WALL_HEIGHT, ROLLING_Z_CENTER]} restitution={0.3}>
          <CuboidCollider args={[WALL_THICKNESS, WALL_HEIGHT, ROLLING_Z_HALF]} />
        </RigidBody>

        {/* Right wall */}
        <RigidBody ref={rightWallRef} type="kinematicPosition" position={[RIGHT_X, WALL_HEIGHT, ROLLING_Z_CENTER]} restitution={0.3}>
          <CuboidCollider args={[WALL_THICKNESS, WALL_HEIGHT, ROLLING_Z_HALF]} />
        </RigidBody>

        {/* Front wall (positive Z / bottom of screen) */}
        <RigidBody ref={frontWallRef} type="kinematicPosition" position={[ROLLING_X_OFFSET, WALL_HEIGHT, FRONT_Z]} restitution={0.3}>
          <CuboidCollider args={[ARENA_HALF_X, WALL_HEIGHT, WALL_THICKNESS]} />
        </RigidBody>

        {/* Back wall (negative Z / boundary with player/goal zone) */}
        <RigidBody ref={backWallRef} type="kinematicPosition" position={[ROLLING_X_OFFSET, WALL_HEIGHT, BACK_Z]} restitution={0.3}>
          <CuboidCollider args={[ARENA_HALF_X, WALL_HEIGHT, WALL_THICKNESS]} />
        </RigidBody>
      </group>
    );
  }
);
