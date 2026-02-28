import { OrbitControls, Environment, AccumulativeShadows, RandomizedLight } from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import { Die3D, PLAYER_COLORS } from './Die3D';

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
      <ambientLight intensity={0.3} color="#ffeedd" />
      <spotLight
        position={[2, 10, -3]}
        intensity={0.8}
        color="#efdfd5"
        angle={Math.PI / 4}
        penumbra={0.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight
        position={[-3, 6, -2]}
        intensity={0.2}
        color="#b4c7e0"
      />

      {/* HDRI environment for reflections */}
      <Environment preset="apartment" />

      {/* Soft grounding shadows (visual-only, outside Physics) */}
      <AccumulativeShadows
        temporal
        frames={100}
        scale={10}
        position={[0, 0.01, 0]}
        opacity={0.25}
      >
        <RandomizedLight
          amount={8}
          radius={4}
          ambient={0.5}
          intensity={1}
          position={[2, 10, -3]}
          bias={0.001}
        />
      </AccumulativeShadows>

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
            <meshStandardMaterial color="#3d2517" roughness={0.7} metalness={0.0} />
          </mesh>
        </RigidBody>

        {/* Die — drops from height */}
        <RigidBody type="dynamic" position={[0, 5, 0]} ccd restitution={0.5}>
          <CuboidCollider args={[0.5, 0.5, 0.5]} restitution={0.5} />
          <Die3D color={PLAYER_COLORS.red} />
        </RigidBody>
      </Physics>
    </group>
  );
}
