import { forwardRef, useImperativeHandle, useRef } from 'react';
import { RigidBody, CuboidCollider, RapierRigidBody } from '@react-three/rapier';
import { Euler, Quaternion } from 'three';
import { Die3D } from './Die3D';
import { getFaceUp } from '../utils/diceUtils';

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
  onSettle?: () => void;
  onResult?: (value: number) => void;
}

export const PhysicsDie = forwardRef<PhysicsDieHandle, PhysicsDieProps>(
  function PhysicsDie({ color = '#e8e0d4', position = [0, 1, 0], onSettle, onResult }, ref) {
    const bodyRef = useRef<RapierRigidBody>(null);
    const isRolling = useRef(false);
    const lastResult = useRef<number | null>(null);

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
        body.applyImpulse(
          { x: randRange(-3, 3), y: randRange(15, 25), z: randRange(-3, 3) },
          true,
        );

        // Apply random torque impulse for spin variety
        body.applyTorqueImpulse(
          { x: randRange(-5, 5), y: randRange(-5, 5), z: randRange(-5, 5) },
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
              onResult?.(faceValue);
            }

            onSettle?.();
          }
        }}
        onWake={() => {
          // If the die wakes back up (e.g., bumped), mark as rolling again
          // to prevent false settle signals
          isRolling.current = true;
        }}
      >
        <CuboidCollider args={[0.5, 0.5, 0.5]} />
        <Die3D color={color} />
      </RigidBody>
    );
  },
);
