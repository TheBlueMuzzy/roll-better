import { useRef, useEffect, createRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { Die3D } from './Die3D';
import { DIE_SIZE } from './RollingArea';

// --- Layout constants (exported for PlayerRow reuse) ---
export const SLOT_SPACING = 0.62;
export const SLOT_COUNT = 8;

/** Returns the X position for a given slot index (0-7), centered at 0. */
export function getSlotX(index: number): number {
  return (index - 3.0) * SLOT_SPACING;
}

/**
 * Returns Euler angles [x, y, z] that rotate a Die3D so the given face value
 * points upward (+Y).
 *
 * Die3D face layout:
 *   1 = +Y (top), 6 = -Y (bottom)
 *   5 = +X (right), 2 = -X (left)
 *   3 = +Z (front), 4 = -Z (back)
 */
export function getRotationForFace(value: number): [number, number, number] {
  switch (value) {
    case 1: return [0, 0, 0];                        // already +Y up
    case 6: return [Math.PI, 0, 0];                  // flip upside-down
    case 2: return [0, 0, -Math.PI / 2];             // roll -X to top
    case 5: return [0, 0, Math.PI / 2];              // roll +X to top
    case 3: return [-Math.PI / 2, 0, 0];             // tilt +Z to top
    case 4: return [Math.PI / 2, 0, 0];              // tilt -Z to top
    default: return [0, 0, 0];
  }
}

// Easing functions
function easeIn(t: number): number { return t * t; }
function easeOut(t: number): number { return 1 - (1 - t) * (1 - t); }

// --- Props ---
interface GoalRowProps {
  values: number[];
  z?: number;
  transition?: 'none' | 'exiting' | 'entering';
}

export function GoalRow({ values, z = -4.67, transition = 'none' }: GoalRowProps) {
  // One ref per die wrapper group for animation
  const dieRefs = useRef(
    Array.from({ length: SLOT_COUNT }, () => createRef<Group>()),
  );

  // Track transition state changes to reset animation timing
  const prevTransition = useRef(transition);
  const transitionStart = useRef(0);

  // Detect transition changes
  useEffect(() => {
    if (transition !== prevTransition.current) {
      prevTransition.current = transition;
      transitionStart.current = -1; // signal to capture time on next frame
    }
  }, [transition]);

  // --- Exit animation constants ---
  const EXIT_STAGGER = 0.015;    // 15ms between each die (tight)
  const EXIT_DURATION = 0.35;    // 350ms per die — fast departure
  const EXIT_DISTANCE = 8;       // local-space units to slide right

  // --- Enter animation constants (legacy — reworked in Task 2) ---
  const ENTER_STAGGER = 0.03;
  const ENTER_DURATION = 0.4;
  const SLIDE_DISTANCE = 8;

  useFrame((state) => {
    const clock = state.clock.elapsedTime;

    // Capture start time on the first frame after transition change
    if (transitionStart.current === -1) {
      transitionStart.current = clock;
    }

    for (let i = 0; i < SLOT_COUNT; i++) {
      const group = dieRefs.current[i]?.current;
      if (!group) continue;

      // --- Idle state: reset everything ---
      if (transition === 'none') {
        group.position.x = 0;
        group.rotation.set(0, 0, 0);
        group.scale.setScalar(1);
        continue;
      }

      // --- Exit: fast rightward slide, no rotation ---
      if (transition === 'exiting') {
        const elapsed = clock - transitionStart.current - (EXIT_STAGGER * i);

        if (elapsed < 0) {
          // Not started yet — hold at home position
          group.position.x = 0;
          group.rotation.set(0, 0, 0);
          group.scale.setScalar(1);
          continue;
        }

        const t = Math.min(elapsed / EXIT_DURATION, 1);
        group.position.x = EXIT_DISTANCE * easeIn(t);
        group.rotation.set(0, 0, 0);  // no rotation on exit
        group.scale.setScalar(1);     // no scale change on exit
        continue;
      }

      // --- Enter: slide in from left (legacy, reworked in Task 2) ---
      const elapsed = clock - transitionStart.current - (ENTER_STAGGER * i);

      if (elapsed < 0) {
        group.position.x = -SLIDE_DISTANCE;
        group.rotation.z = Math.PI * 2;
        continue;
      }

      const t = Math.min(elapsed / ENTER_DURATION, 1);
      group.position.x = -SLIDE_DISTANCE * (1 - easeOut(t));
      group.rotation.z = (1 - t) * Math.PI * 2;
    }
  });

  return (
    <group position={[0, 0, z]}>
      {values.slice(0, SLOT_COUNT).map((value, i) => (
        <group
          key={i}
          position={[getSlotX(i), DIE_SIZE / 2, 0]}
          rotation={getRotationForFace(value)}
          scale={DIE_SIZE}
        >
          {/* Wrapper group for animation — position/rotation offset applied by useFrame */}
          <group ref={dieRefs.current[i]}>
            <Die3D />
          </group>
        </group>
      ))}
    </group>
  );
}
