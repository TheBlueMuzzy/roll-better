import { forwardRef, useImperativeHandle, useRef } from 'react';
import { RigidBody, CuboidCollider, RapierRigidBody } from '@react-three/rapier';
import { Euler, Quaternion } from 'three';
import { Die3D } from './Die3D';
import { getFaceUp, getFaceUpRotation } from '../utils/diceUtils';
import { DIE_SIZE } from './RollingArea';

// --- Helper: random float in [min, max] ---
function randRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// --- Public API exposed via ref ---
export interface PhysicsDieHandle {
  roll(): void;
  /** True when the die has stopped moving after a roll */
  get isSettled(): boolean;
  /** Returns the last settled face value, or null if no roll completed yet */
  getLastResult(): number | null;
}

// --- Props ---
interface PhysicsDieProps {
  color?: string;
  position?: [number, number, number];
  initialFace?: number;
  onSettle?: () => void;
  onResult?: (value: number, position: [number, number, number]) => void;
  onUnsettled?: () => void;
}

export const PhysicsDie = forwardRef<PhysicsDieHandle, PhysicsDieProps>(
  function PhysicsDie({ color = '#e8e0d4', position = [0, 1, 0], initialFace, onSettle, onResult, onUnsettled }, ref) {
    const bodyRef = useRef<RapierRigidBody>(null);
    const isRolling = useRef(false);
    const lastResult = useRef<number | null>(null);

    // Compute initial rotation from face value (only used at mount time)
    const rotation = initialFace ? getFaceUpRotation(initialFace) : [0, 0, 0] as [number, number, number];

    useImperativeHandle(ref, () => ({
      roll() {
        const body = bodyRef.current;
        if (!body) return;

        // Mark as rolling
        isRolling.current = true;

        // Reset to spawn position
        body.setTranslation({ x: position[0], y: position[1], z: position[2] }, true);

        // Reset velocities
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        body.setAngvel({ x: 0, y: 0, z: 0 }, true);

        // Random initial rotation
        const euler = new Euler(
          randRange(0, Math.PI * 2),
          randRange(0, Math.PI * 2),
          randRange(0, Math.PI * 2),
        );
        const quat = new Quaternion().setFromEuler(euler);
        body.setRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w }, true);

        // Wake the body
        body.wakeUp();

        // Apply upward impulse with random horizontal offset for natural tumbling
        // (scaled for DIE_SIZE ≈ 0.66 → mass ≈ 0.29 — gives ~1s air time)
        body.applyImpulse(
          { x: randRange(-1, 1), y: randRange(6, 9), z: randRange(-1, 1) },
          true,
        );

        // Apply random torque impulse for spin variety
        body.applyTorqueImpulse(
          { x: randRange(-2, 2), y: randRange(-2, 2), z: randRange(-2, 2) },
          true,
        );
      },

      get isSettled() {
        return !isRolling.current;
      },

      getLastResult() {
        return lastResult.current;
      },
    }));

    return (
      <RigidBody
        ref={bodyRef}
        type="dynamic"
        position={position}
        rotation={rotation}
        ccd
        restitution={0.35}
        friction={0.5}
        angularDamping={0.3}
        linearDamping={0.1}
        onSleep={() => {
          if (isRolling.current) {
            isRolling.current = false;

            // Read which face is pointing up
            const body = bodyRef.current;
            if (body) {
              const rotation = body.rotation();
              const threeQuat = new Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
              const faceValue = getFaceUp(threeQuat);
              lastResult.current = faceValue;
              const t = body.translation();
              onResult?.(faceValue, [t.x, t.y, t.z]);
            }

            onSettle?.();
          }
        }}
        onWake={() => {
          // If the die wakes back up (e.g., bumped), mark as rolling again
          // to prevent false settle signals
          if (!isRolling.current) {
            isRolling.current = true;
            onUnsettled?.();
          }
        }}
      >
        <CuboidCollider args={[DIE_SIZE / 2, DIE_SIZE / 2, DIE_SIZE / 2]} />
        <group scale={DIE_SIZE}>
          <Die3D color={color} />
        </group>
      </RigidBody>
    );
  },
);
