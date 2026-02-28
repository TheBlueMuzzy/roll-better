import { RigidBody, CuboidCollider } from '@react-three/rapier';

// --- Arena bounds (exported for DicePool spawn positioning) ---
// Camera at y=12, fov=50, looking down at floor (y=0)
// Vertical half-extent at floor: 12 * tan(25deg) ≈ 5.6
// Portrait 9:16 → horizontal: 5.6 * (9/16) ≈ 3.15
// Tightened slightly so dice don't scrape edges
export const ARENA_HALF_X = 2.8;
export const ARENA_HALF_Z = 4.5;

// Wall thickness and height
const WALL_THICKNESS = 0.1;
const WALL_HEIGHT = 3; // tall enough to catch bouncing dice (rarely go above y=2-3)

interface RollingAreaProps {
  onFloorClick?: () => void;
}

export function RollingArea({ onFloorClick }: RollingAreaProps) {
  return (
    <group>
      {/* Floor — static rigid body */}
      <RigidBody type="fixed" restitution={0.5}>
        <CuboidCollider args={[5, 0.1, 5]} position={[0, -0.1, 0]} />
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

      {/* Left wall */}
      <RigidBody type="fixed" restitution={0.3}>
        <CuboidCollider
          args={[WALL_THICKNESS, WALL_HEIGHT, ARENA_HALF_Z]}
          position={[-ARENA_HALF_X, WALL_HEIGHT, 0]}
        />
      </RigidBody>

      {/* Right wall */}
      <RigidBody type="fixed" restitution={0.3}>
        <CuboidCollider
          args={[WALL_THICKNESS, WALL_HEIGHT, ARENA_HALF_Z]}
          position={[ARENA_HALF_X, WALL_HEIGHT, 0]}
        />
      </RigidBody>

      {/* Front wall (positive Z) */}
      <RigidBody type="fixed" restitution={0.3}>
        <CuboidCollider
          args={[ARENA_HALF_X, WALL_HEIGHT, WALL_THICKNESS]}
          position={[0, WALL_HEIGHT, ARENA_HALF_Z]}
        />
      </RigidBody>

      {/* Back wall (negative Z) */}
      <RigidBody type="fixed" restitution={0.3}>
        <CuboidCollider
          args={[ARENA_HALF_X, WALL_HEIGHT, WALL_THICKNESS]}
          position={[0, WALL_HEIGHT, -ARENA_HALF_Z]}
        />
      </RigidBody>
    </group>
  );
}
