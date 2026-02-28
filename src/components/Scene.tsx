import { OrbitControls, Environment } from '@react-three/drei';

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

      {/* Floor plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#5c3a1e" />
      </mesh>
    </group>
  );
}
