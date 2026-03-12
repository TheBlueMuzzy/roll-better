import { RigidBody, CuboidCollider } from '@react-three/rapier';

// --- Arena bounds (exported for DicePool spawn positioning) ---
// Camera at y=12, fov=50, looking down at floor (y=0)
// Vertical half-extent at floor: 12 * tan(25deg) ≈ 5.6
// Portrait 9:16 → horizontal: 5.6 * (9/16) ≈ 3.15
// Tightened slightly so dice don't scrape edges
export const ARENA_HALF_X = 3.8;

// DEPRECATED: rolling zone is now asymmetric (ROLLING_Z_MIN / ROLLING_Z_MAX).
// Kept for backward compatibility — DicePool may still reference it.
export const ARENA_HALF_Z = 3.5;

// --- Asymmetric rolling zone bounds ---
// Back wall sits 3 rows below Goal row (goal at Z=-3.8, 3 × 0.7 spacing = 2.1)
// Leaves room for player rows between Goal and rolling zone
// Front wall at Z = ROLLING_Z_MAX (bottom of screen)
export const ROLLING_Z_MIN = -0.5;
export const ROLLING_Z_MAX = 3.5;

// Derived: center and half-extent of the rolling zone
const ROLLING_Z_CENTER = (ROLLING_Z_MIN + ROLLING_Z_MAX) / 2; // 1.5
const ROLLING_Z_HALF = (ROLLING_Z_MAX - ROLLING_Z_MIN) / 2;   // 2.0

// Die size: 9.5 dice must fit across the arena width (smaller for avatar space)
export const DIE_SIZE = (ARENA_HALF_X * 2) / 9.5; // ≈ 0.8

// Wall thickness and height
const WALL_THICKNESS = 0.25;
const WALL_HEIGHT = 8; // tall enough to catch dice at peak of roll arc

interface RollingAreaProps {
  onFloorClick?: () => void;
}

export function RollingArea({ onFloorClick }: RollingAreaProps) {
  return (
    <group>
      {/* Floor — static rigid body, sized to rolling zone only */}
      <RigidBody type="fixed" restitution={0.5}>
        <CuboidCollider
          args={[ARENA_HALF_X, 0.1, ROLLING_Z_HALF]}
          position={[0, -0.1, ROLLING_Z_CENTER]}
        />
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
          receiveShadow
          onClick={onFloorClick}
        >
          <planeGeometry args={[24, 16]} />
          <meshStandardMaterial color="#3d2517" roughness={0.7} metalness={0.0} />
        </mesh>
      </RigidBody>

      {/* Left wall — spans rolling zone only */}
      <RigidBody type="fixed" restitution={0.3}>
        <CuboidCollider
          args={[WALL_THICKNESS, WALL_HEIGHT, ROLLING_Z_HALF]}
          position={[-ARENA_HALF_X, WALL_HEIGHT, ROLLING_Z_CENTER]}
        />
      </RigidBody>

      {/* Right wall — spans rolling zone only */}
      <RigidBody type="fixed" restitution={0.3}>
        <CuboidCollider
          args={[WALL_THICKNESS, WALL_HEIGHT, ROLLING_Z_HALF]}
          position={[ARENA_HALF_X, WALL_HEIGHT, ROLLING_Z_CENTER]}
        />
      </RigidBody>

      {/* Front wall (positive Z / bottom of screen) */}
      <RigidBody type="fixed" restitution={0.3}>
        <CuboidCollider
          args={[ARENA_HALF_X, WALL_HEIGHT, WALL_THICKNESS]}
          position={[0, WALL_HEIGHT, ROLLING_Z_MAX]}
        />
      </RigidBody>

      {/* Back wall (negative Z / boundary with player/goal zone) */}
      <RigidBody type="fixed" restitution={0.3}>
        <CuboidCollider
          args={[ARENA_HALF_X, WALL_HEIGHT, WALL_THICKNESS]}
          position={[0, WALL_HEIGHT, ROLLING_Z_MIN]}
        />
      </RigidBody>
    </group>
  );
}
