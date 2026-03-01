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
  /** Exact Euler rotation to restore (overrides initialFace rotation) */
  initialRotation?: [number, number, number];
  onSettle?: () => void;
  onResult?: (value: number, position: [number, number, number], rotation: [number, number, number]) => void;
  onUnsettled?: () => void;
}

export const PhysicsDie = forwardRef<PhysicsDieHandle, PhysicsDieProps>(
  function PhysicsDie({ color = '#e8e0d4', position = [0, 1, 0], initialFace, initialRotation, onSettle, onResult, onUnsettled }, ref) {
    const bodyRef = useRef<RapierRigidBody>(null);
    const isRolling = useRef(false);
    const lastResult = useRef<number | null>(null);

    // Compute initial rotation ONCE on mount (stored in ref so re-renders don't change it)
    const rotationRef = useRef<[number, number, number] | null>(null);
    if (rotationRef.current === null) {
      if (initialRotation) {
        // Exact rotation passed in (preserved from physics settle)
        rotationRef.current = initialRotation;
      } else if (initialFace) {
        // Exact face-up rotation matching MitosisDie/GoalRow orientation
        rotationRef.current = getFaceUpRotation(initialFace);
      } else {
        rotationRef.current = [0, 0, 0];
      }
    }
    const rotation = rotationRef.current;

    useImperativeHandle(ref, () => ({
      roll() {
        const body = bodyRef.current;
        if (!body) return;

        // Mark as rolling
        isRolling.current = true;

        // Lift die above the floor so random rotation doesn't clip into ground
        const cur = body.translation();
        body.setTranslation({ x: cur.x, y: cur.y + DIE_SIZE, z: cur.z }, true);

        // Reset velocities
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        body.setAngvel({ x: 0, y: 0, z: 0 }, true);

        // Random rotation for face variety
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
              const rot = body.rotation();
              const threeQuat = new Quaternion(rot.x, rot.y, rot.z, rot.w);
              const faceValue = getFaceUp(threeQuat);
              lastResult.current = faceValue;
              const t = body.translation();
              // Convert quaternion to Euler for preservation through remounts
              const settledEuler = new Euler().setFromQuaternion(threeQuat);
              onResult?.(faceValue, [t.x, t.y, t.z], [settledEuler.x, settledEuler.y, settledEuler.z]);
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
