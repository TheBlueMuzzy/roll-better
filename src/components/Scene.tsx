import { OrbitControls, Environment } from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import { Die3D } from './Die3D';

export function Scene() {
  return (
    <group>
      {/* Locked top-down camera */}
      <OrbitControls
        target={[0, 0, 0]}
        enableRotate={false}
        enableZoom={false}
        enablePan={false}
      />

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
        <RigidBody type="fixed" restitution={0.5}>
          <CuboidCollider args={[5, 0.1, 5]} position={[0, -0.1, 0]} />
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[10, 10]} />
            <meshStandardMaterial color="#5c3a1e" />
          </mesh>
        </RigidBody>

        {/* Die — drops from height */}
        <RigidBody type="dynamic" position={[0, 5, 0]} ccd restitution={0.5}>
          <CuboidCollider args={[0.5, 0.5, 0.5]} restitution={0.5} />
          <Die3D />
        </RigidBody>
      </Physics>
    </group>
  );
}
