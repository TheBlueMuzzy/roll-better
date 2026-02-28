import { OrbitControls, Environment } from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';

export function Scene() {
  return (
    <group>
      {/* Dev camera controls — will be removed/locked later */}
      <OrbitControls target={[0, 0, 0]} />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* HDRI environment for reflections */}
      <Environment preset="apartment" />

      {/* Physics world */}
      <Physics gravity={[0, -50, 0]}>
        {/* Floor — static rigid body */}
        <RigidBody type="fixed">
          <CuboidCollider args={[5, 0.05, 5]} position={[0, -0.05, 0]} />
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[10, 10]} />
            <meshStandardMaterial color="#5c3a1e" />
          </mesh>
        </RigidBody>

        {/* Test cube — drops and bounces on the floor */}
        <RigidBody type="dynamic" position={[0, 5, 0]} restitution={0.3}>
          <mesh castShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#e74c3c" />
          </mesh>
        </RigidBody>
      </Physics>
    </group>
  );
}
