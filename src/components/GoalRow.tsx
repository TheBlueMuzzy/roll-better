import { useRef, useEffect, createRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { Die3D } from './Die3D';
import { DIE_SIZE } from './RollingArea';

// --- Layout constants (exported for PlayerRow reuse) ---
export const SLOT_SPACING = DIE_SIZE * 1.05;
export const SLOT_COUNT = 8;

/** Offset from slot 0 to profile group anchor (exported for reuse). */
export const PROFILE_X_OFFSET = 0.65;

/** X offset applied to all rows (shifts rows to left half of split layout). */
export const ROW_X_OFFSET = -4;

/** Returns the X position for a given slot index (0-7), shifted left for split layout. */
export function getSlotX(index: number): number {
  return ROW_X_OFFSET + (index - 3.5) * SLOT_SPACING;
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

// Star icon world X — same offset used by GoalProfileGroup in Scene.tsx
const STAR_WORLD_X = getSlotX(0) - PROFILE_X_OFFSET;

// --- Props ---
interface GoalRowProps {
  values: number[];
  z?: number;
  transition?: 'none' | 'exiting' | 'entering';
}

export function GoalRow({ values, z = -5.0, transition = 'none' }: GoalRowProps) {
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
  const EXIT_DISTANCE = 12;      // local-space units to slide right

  // --- Enter animation constants ---
  const ENTER_STAGGER = 0.04;    // 40ms between each die (left to right)
  const ENTER_DURATION = 0.5;    // 500ms per die — satisfying arrival
  const TUMBLE_SPEED_X = 8;      // radians/sec tumble around X axis
  const TUMBLE_SPEED_Z = 6;      // radians/sec tumble around Z axis

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

      // --- Enter: emerge from star icon with scale + tumble ---
      // Star position in inner-group local space (outer group is at getSlotX(i)
      // with scale=DIE_SIZE, so divide by DIE_SIZE to convert world→local)
      const starLocalX = (STAR_WORLD_X - getSlotX(i)) / DIE_SIZE;

      const elapsed = clock - transitionStart.current - (ENTER_STAGGER * i);

      if (elapsed < 0) {
        // Not started yet — hold at star origin, invisible
        group.position.x = starLocalX;
        group.rotation.set(0, 0, 0);
        group.scale.setScalar(0);
        continue;
      }

      const t = Math.min(elapsed / ENTER_DURATION, 1);

      if (t < 1) {
        // In flight: lerp position, scale up, tumble
        const easedT = easeOut(t);
        group.position.x = starLocalX * (1 - easedT); // star → 0 (home)
        group.scale.setScalar(t);                      // linear 0 → 1
        // Continuous tumble rotation (visual only)
        group.rotation.x = elapsed * TUMBLE_SPEED_X;
        group.rotation.z = elapsed * TUMBLE_SPEED_Z;
      } else {
        // Arrived: snap to home, clear rotation (outer group has face rotation)
        group.position.x = 0;
        group.rotation.set(0, 0, 0);
        group.scale.setScalar(1);
      }
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
          {/* Wrapper group for animation — position/rotation/scale driven by useFrame */}
          <group ref={dieRefs.current[i]}>
            <Die3D />
          </group>
        </group>
      ))}
    </group>
  );
}
