import { RigidBody, CuboidCollider } from '@react-three/rapier';

// --- Arena bounds (exported for DicePool spawn positioning) ---
// Camera at y=12, fov=50, looking down at floor (y=0)
// Vertical half-extent at floor: 12 * tan(25deg) ≈ 5.6
// Portrait 9:16 → horizontal: 5.6 * (9/16) ≈ 3.15
// Tightened slightly so dice don't scrape edges
export const ARENA_HALF_X = 2.8;

// DEPRECATED: rolling zone is now asymmetric (ROLLING_Z_MIN / ROLLING_Z_MAX).
// Kept for backward compatibility — DicePool may still reference it.
export const ARENA_HALF_Z = 4.5;

// --- Asymmetric rolling zone bounds ---
// Back wall sits at Z = -0.8 (boundary between player/goal zone and rolling zone)
// Front wall stays at Z = 4.5 (bottom of screen)
export const ROLLING_Z_MIN = -0.8;
export const ROLLING_Z_MAX = 4.5;

// Derived: center and half-extent of the rolling zone
const ROLLING_Z_CENTER = (ROLLING_Z_MIN + ROLLING_Z_MAX) / 2; // 1.85
const ROLLING_Z_HALF = (ROLLING_Z_MAX - ROLLING_Z_MIN) / 2;   // 2.65

// Die size: 8.5 dice must fit across the arena width
export const DIE_SIZE = (ARENA_HALF_X * 2) / 8.5; // ≈ 0.659

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
          <planeGeometry args={[10, 10]} />
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
