import { forwardRef, useImperativeHandle, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider, RapierRigidBody } from '@react-three/rapier';
import { Euler, Quaternion, Vector3 } from 'three';
import { Die3D } from './Die3D';
import { getFaceUpConfidence, getFaceUpRotation } from '../utils/diceUtils';
import { DIE_SIZE } from './RollingArea';
import { playDiceImpact, playDiceSettle } from '../utils/soundManager';

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
  /** Reads the current face-up value live from the physics body */
  getResult(): number | undefined;
  /** Returns current position and rotation from the physics body */
  getTransform(): { position: [number, number, number]; rotation: [number, number, number] } | null;
  setAttractTarget(target: [number, number, number] | null): void;
  /** Lift, rotate to best face, drop back — with stagger delay */
  snapFlat(delay: number): void;
  /** Smoothly lerp to position with best face up */
  unstick(pos: [number, number, number], delay: number): void;
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
    const attractTargetRef = useRef<[number, number, number] | null>(null);
    const attractElapsedRef = useRef(0);
    // Snap-flat animation state
    const snapDelayRef = useRef(-1);      // countdown before snap starts (-1 = inactive)
    const snapPhaseRef = useRef<'waiting' | 'lifting' | 'dropping' | 'done'>('done');
    const snapElapsedRef = useRef(0);
    const snapStartYRef = useRef(0);
    const snapStartQuatRef = useRef(new Quaternion());
    const snapTargetQuatRef = useRef(new Quaternion());
    const snapFaceValueRef = useRef(1);
    // Unstick lerp state
    const unstickPhaseRef = useRef<'waiting' | 'moving' | 'done'>('done');
    const unstickDelayRef = useRef(-1);
    const unstickElapsedRef = useRef(0);
    const unstickStartPosRef = useRef<[number, number, number]>([0, 0, 0]);
    const unstickTargetPosRef = useRef<[number, number, number]>([0, 0, 0]);
    const unstickStartQuatRef = useRef(new Quaternion());
    const unstickTargetQuatRef = useRef(new Quaternion());
    const attractScaleRef = useRef(1.0);     // current visual/collider scale (1.0 = full, 0.75 = shrunk)
    const releaseElapsedRef = useRef(-1);     // -1 = not releasing, >=0 = scaling back up
    const visualGroupRef = useRef<import('three').Group>(null);


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

      getResult() {
        const body = bodyRef.current;
        if (!body) return undefined;
        const rot = body.rotation();
        const q = new Quaternion(rot.x, rot.y, rot.z, rot.w);
        const { value } = getFaceUpConfidence(q);
        return value;
      },

      getTransform() {
        const body = bodyRef.current;
        if (!body) return null;
        const t = body.translation();
        const r = body.rotation();
        const euler = new Euler().setFromQuaternion(new Quaternion(r.x, r.y, r.z, r.w));
        return {
          position: [t.x, t.y, t.z] as [number, number, number],
          rotation: [euler.x, euler.y, euler.z] as [number, number, number],
        };
      },

      setAttractTarget(target: [number, number, number] | null) {
        if (target && !attractTargetRef.current) {
          attractElapsedRef.current = 0;
          if (bodyRef.current) {
            bodyRef.current.wakeUp();
            bodyRef.current.setGravityScale(0, true);
            bodyRef.current.applyImpulse({ x: 0, y: 3, z: 0 }, true);
            // Random tumble for floaty feel
            bodyRef.current.applyTorqueImpulse(
              { x: randRange(-1.5, 1.5), y: randRange(-1.5, 1.5), z: randRange(-1.5, 1.5) },
              true
            );
            // Sensor mode: pass through walls and other dice during attraction
            for (let c = 0; c < bodyRef.current.numColliders(); c++) {
              bodyRef.current.collider(c).setSensor(true);
            }
          }
        }
        if (!target && attractTargetRef.current && bodyRef.current) {
          const lastGoal = attractTargetRef.current;
          const body = bodyRef.current;
          body.setTranslation({ x: lastGoal[0], y: lastGoal[1], z: lastGoal[2] }, true);
          body.setGravityScale(1, true);
          isRolling.current = true;
          // Restore full collider + solid mode in one frame
          const fullHalf = DIE_SIZE / 2;
          for (let c = 0; c < body.numColliders(); c++) {
            body.collider(c).setSensor(false);
            body.collider(c).setHalfExtents({ x: fullHalf, y: fullHalf, z: fullHalf });
          }
          // Apply random torque impulse for tumble feel on release
          // Dice already have linear velocity from orbital tracking (setLinvel)
          body.applyTorqueImpulse(
            { x: randRange(-2, 2), y: randRange(-2, 2), z: randRange(-2, 2) },
            true,
          );
          // Start visual-only scale-up
          releaseElapsedRef.current = 0;
          attractScaleRef.current = 0.5;
        }
        attractTargetRef.current = target;
      },

      snapFlat(delay: number) {
        const body = bodyRef.current;
        if (!body) return;
        const rot = body.rotation();
        const q = new Quaternion(rot.x, rot.y, rot.z, rot.w);
        const { value, dot } = getFaceUpConfidence(q);
        // Already flat — skip the animation entirely
        if (dot > 0.95) return;
        snapFaceValueRef.current = value;
        snapStartQuatRef.current.copy(q);

        // Compute minimal rotation: only tip the best face to point up,
        // preserving the existing Y-axis spin (so dice don't look grid-aligned).
        // 1. Find where the best face normal currently points
        const FACE_NORMALS_MAP: Record<number, Vector3> = {
          1: new Vector3(0, 1, 0),   // +Y
          2: new Vector3(-1, 0, 0),  // -X
          3: new Vector3(0, 0, 1),   // +Z
          4: new Vector3(0, 0, -1),  // -Z
          5: new Vector3(1, 0, 0),   // +X
          6: new Vector3(0, -1, 0),  // -Y
        };
        const faceNormal = FACE_NORMALS_MAP[value].clone().applyQuaternion(q);
        const worldUp = new Vector3(0, 1, 0);
        // 2. Find the rotation from current face direction to world up
        const correctionQuat = new Quaternion().setFromUnitVectors(faceNormal.normalize(), worldUp);
        // 3. Apply correction to current rotation = target (preserves Y spin)
        snapTargetQuatRef.current.copy(correctionQuat).multiply(q);

        snapStartYRef.current = body.translation().y;
        snapDelayRef.current = delay;
        snapPhaseRef.current = 'waiting';
        snapElapsedRef.current = 0;
      },

      unstick(pos: [number, number, number], delay: number) {
        const body = bodyRef.current;
        if (!body) return;
        // Capture start state
        const tr = body.translation();
        unstickStartPosRef.current = [tr.x, tr.y, tr.z];
        unstickTargetPosRef.current = pos;
        const rot = body.rotation();
        const q = new Quaternion(rot.x, rot.y, rot.z, rot.w);
        unstickStartQuatRef.current.copy(q);
        // Target: best face up, squared up (axis-aligned, no Y spin preservation)
        const { value } = getFaceUpConfidence(q);
        const targetEuler = getFaceUpRotation(value);
        unstickTargetQuatRef.current.setFromEuler(new Euler(targetEuler[0], targetEuler[1], targetEuler[2]));
        // Freeze physics + turn off colliders for the move
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        body.setGravityScale(0, true);
        for (let c = 0; c < body.numColliders(); c++) {
          body.collider(c).setSensor(true);
          body.collider(c).setHalfExtents({ x: DIE_SIZE / 2, y: DIE_SIZE / 2, z: DIE_SIZE / 2 });
        }
        // Reset any in-flight gather/snap state
        if (visualGroupRef.current) visualGroupRef.current.scale.setScalar(DIE_SIZE);
        attractTargetRef.current = null;
        attractScaleRef.current = 1.0;
        releaseElapsedRef.current = -1;
        snapPhaseRef.current = 'done';
        unstickDelayRef.current = delay;
        unstickPhaseRef.current = 'waiting';
        unstickElapsedRef.current = 0;
      },
    }));

    // Attractor: velocity-controlled from the start, approach factor ramps for smooth pull-in
    useFrame((_, delta) => {
      const body = bodyRef.current;
      const dt = Math.min(delta, 0.05);

      // Visual-only scale-up after release (collider already full, physics running normally)
      if (releaseElapsedRef.current >= 0 && !attractTargetRef.current) {
        releaseElapsedRef.current += dt;
        const scaleT = Math.min(releaseElapsedRef.current / 0.3, 1.0);
        attractScaleRef.current = 0.5 + 0.5 * scaleT;
        if (visualGroupRef.current) {
          visualGroupRef.current.scale.setScalar(DIE_SIZE * attractScaleRef.current);
        }
        if (scaleT >= 1.0) {
          releaseElapsedRef.current = -1;
          attractScaleRef.current = 1.0;
        }
        // No return — let physics run normally during scale-up
      }

      const target = attractTargetRef.current;
      if (!body || !target) return;

      body.wakeUp();
      body.setGravityScale(0, true);

      attractElapsedRef.current += dt;

      // Shrink from 1.0 → 0.5 over first 1s
      const shrinkT = Math.min(attractElapsedRef.current / 1.0, 1.0);
      attractScaleRef.current = 1.0 - 0.5 * shrinkT;
      if (visualGroupRef.current) {
        visualGroupRef.current.scale.setScalar(DIE_SIZE * attractScaleRef.current);
      }
      const half = (DIE_SIZE / 2) * attractScaleRef.current;
      for (let c = 0; c < body.numColliders(); c++) {
        body.collider(c).setHalfExtents({ x: half, y: half, z: half });
      }

      const pos = body.translation();
      const safeHeight = target[1]; // goal Y = the float height

      // Phase 1: Rise straight up until clear of the floor
      // Don't pull laterally until die has reached goal height
      if (pos.y < safeHeight - 0.1) {
        const liftSpeed = 8;
        body.setLinvel({ x: 0, y: liftSpeed, z: 0 }, true);
        return;
      }

      // Phase 2: Pull toward goal (die is airborne)
      const dx = target[0] - pos.x;
      const dy = target[1] - pos.y;
      const dz = target[2] - pos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < 0.02) {
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        return;
      }

      const t = Math.min(attractElapsedRef.current / 1.0, 1.0);
      const approach = (0.045 + 0.33 * t * t) / dt;

      let vx = dx * approach;
      let vy = dy * approach;
      let vz = dz * approach;

      const maxVel = 40;
      const velMag = Math.sqrt(vx * vx + vy * vy + vz * vz);
      if (velMag > maxVel) {
        const s = maxVel / velMag;
        vx *= s;
        vy *= s;
        vz *= s;
      }

      body.setLinvel({ x: vx, y: vy, z: vz }, true);
    });

    // Unstick animation: smooth lerp to grid position
    const UNSTICK_DUR = 0.3;
    const _unstickQuat = useRef(new Quaternion());

    useFrame((_, delta) => {
      const body = bodyRef.current;
      if (!body || unstickPhaseRef.current === 'done') return;
      const dt = Math.min(delta, 0.05);

      if (unstickPhaseRef.current === 'waiting') {
        unstickDelayRef.current -= dt;
        if (unstickDelayRef.current > 0) return;
        unstickPhaseRef.current = 'moving';
        unstickElapsedRef.current = 0;
        return;
      }

      unstickElapsedRef.current += dt;
      const t = Math.min(unstickElapsedRef.current / UNSTICK_DUR, 1.0);
      const eased = 1 - (1 - t) * (1 - t); // ease-out

      // Lerp position
      const sp = unstickStartPosRef.current;
      const tp = unstickTargetPosRef.current;
      body.setTranslation({
        x: sp[0] + (tp[0] - sp[0]) * eased,
        y: sp[1] + (tp[1] - sp[1]) * eased,
        z: sp[2] + (tp[2] - sp[2]) * eased,
      }, true);
      // Slerp rotation
      _unstickQuat.current.copy(unstickStartQuatRef.current).slerp(unstickTargetQuatRef.current, eased);
      body.setRotation({
        x: _unstickQuat.current.x, y: _unstickQuat.current.y,
        z: _unstickQuat.current.z, w: _unstickQuat.current.w,
      }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);

      if (t >= 1.0) {
        unstickPhaseRef.current = 'done';
        // Restore normal physics state
        body.setGravityScale(1, true);
        for (let c = 0; c < body.numColliders(); c++) {
          body.collider(c).setSensor(false);
        }
      }
    });

    // Snap-flat animation: lift, rotate to best face, drop
    const SNAP_LIFT_DUR = 0.08;  // seconds to lift
    const SNAP_DROP_DUR = 0.05;  // seconds to drop
    const SNAP_LIFT_HEIGHT = DIE_SIZE / 2;
    const _slerpQuat = useRef(new Quaternion());

    useFrame((_, delta) => {
      const body = bodyRef.current;
      if (!body || snapPhaseRef.current === 'done') return;

      const dt = Math.min(delta, 0.05);

      // Countdown delay
      if (snapPhaseRef.current === 'waiting') {
        snapDelayRef.current -= dt;
        if (snapDelayRef.current > 0) return;
        snapPhaseRef.current = 'lifting';
        snapElapsedRef.current = 0;
        // Freeze physics during snap
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        body.setGravityScale(0, true);
        return;
      }

      snapElapsedRef.current += dt;

      if (snapPhaseRef.current === 'lifting') {
        const t = Math.min(snapElapsedRef.current / SNAP_LIFT_DUR, 1.0);
        const eased = 1 - (1 - t) * (1 - t); // ease-out
        // Lift
        const pos = body.translation();
        const targetY = snapStartYRef.current + SNAP_LIFT_HEIGHT * eased;
        body.setTranslation({ x: pos.x, y: targetY, z: pos.z }, true);
        // Slerp rotation
        _slerpQuat.current.copy(snapStartQuatRef.current).slerp(snapTargetQuatRef.current, eased);
        body.setRotation({
          x: _slerpQuat.current.x, y: _slerpQuat.current.y,
          z: _slerpQuat.current.z, w: _slerpQuat.current.w
        }, true);
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        body.setAngvel({ x: 0, y: 0, z: 0 }, true);

        if (t >= 1.0) {
          snapPhaseRef.current = 'dropping';
          snapElapsedRef.current = 0;
        }
        return;
      }

      if (snapPhaseRef.current === 'dropping') {
        const t = Math.min(snapElapsedRef.current / SNAP_DROP_DUR, 1.0);
        const eased = t * t; // ease-in
        // Drop back
        const pos = body.translation();
        const targetY = (snapStartYRef.current + SNAP_LIFT_HEIGHT) - SNAP_LIFT_HEIGHT * eased;
        body.setTranslation({ x: pos.x, y: targetY, z: pos.z }, true);
        // Hold target rotation
        body.setRotation({
          x: snapTargetQuatRef.current.x, y: snapTargetQuatRef.current.y,
          z: snapTargetQuatRef.current.z, w: snapTargetQuatRef.current.w
        }, true);
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        body.setAngvel({ x: 0, y: 0, z: 0 }, true);

        if (t >= 1.0) {
          snapPhaseRef.current = 'done';
          body.setGravityScale(1, true);
        }
        return;
      }
    });

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
        onContactForce={(payload) => {
          if (isRolling.current) {
            const normalizedForce = Math.max(0, Math.min(1, payload.totalForceMagnitude / 500));
            playDiceImpact(normalizedForce);
          }
        }}
        onSleep={() => {
          if (isRolling.current) {
            const body = bodyRef.current;
            if (body) {
              const rot = body.rotation();
              const threeQuat = new Quaternion(rot.x, rot.y, rot.z, rot.w);
              const { value: faceValue, dot: _dot } = getFaceUpConfidence(threeQuat);

              // Canted die detection — nudge disabled (feels slow/unnatural)
              // TODO: Phase 43 will address canting with a different approach

              isRolling.current = false;
              lastResult.current = faceValue;
              const t = body.translation();
              const settledEuler = new Euler().setFromQuaternion(threeQuat);
              onResult?.(faceValue, [t.x, t.y, t.z], [settledEuler.x, settledEuler.y, settledEuler.z]);
            } else {
              isRolling.current = false;
            }

            onSettle?.();
            playDiceSettle();
          }
        }}
        onWake={() => {
          if (!isRolling.current) {
            isRolling.current = true;
            onUnsettled?.();
          }
        }}
      >
        <CuboidCollider args={[DIE_SIZE / 2, DIE_SIZE / 2, DIE_SIZE / 2]} />
        <group ref={visualGroupRef} scale={DIE_SIZE}>
          <Die3D color={color} />
        </group>
      </RigidBody>
    );
  },
);
