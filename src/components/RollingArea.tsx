import { RigidBody, CuboidCollider } from '@react-three/rapier';

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
          position={[ROLLING_X_OFFSET, -0.1, ROLLING_Z_CENTER]}
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
          position={[ROLLING_X_OFFSET - ARENA_HALF_X, WALL_HEIGHT, ROLLING_Z_CENTER]}
        />
      </RigidBody>

      {/* Right wall — spans rolling zone only */}
      <RigidBody type="fixed" restitution={0.3}>
        <CuboidCollider
          args={[WALL_THICKNESS, WALL_HEIGHT, ROLLING_Z_HALF]}
          position={[ROLLING_X_OFFSET + ARENA_HALF_X, WALL_HEIGHT, ROLLING_Z_CENTER]}
        />
      </RigidBody>

      {/* Front wall (positive Z / bottom of screen) */}
      <RigidBody type="fixed" restitution={0.3}>
        <CuboidCollider
          args={[ARENA_HALF_X, WALL_HEIGHT, WALL_THICKNESS]}
          position={[ROLLING_X_OFFSET, WALL_HEIGHT, ROLLING_Z_MAX]}
        />
      </RigidBody>

      {/* Back wall (negative Z / boundary with player/goal zone) */}
      <RigidBody type="fixed" restitution={0.3}>
        <CuboidCollider
          args={[ARENA_HALF_X, WALL_HEIGHT, WALL_THICKNESS]}
          position={[ROLLING_X_OFFSET, WALL_HEIGHT, ROLLING_Z_MIN]}
        />
      </RigidBody>
    </group>
  );
}
