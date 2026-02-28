import { useRef, useState } from 'react';
import { OrbitControls, Environment, AccumulativeShadows, RandomizedLight, Html } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { PLAYER_COLORS } from './Die3D';
import { PhysicsDie } from './PhysicsDie';
import type { PhysicsDieHandle } from './PhysicsDie';
import { RollingArea } from './RollingArea';

export function Scene() {
  const physicsDieRef = useRef<PhysicsDieHandle>(null);
  const [dieResult, setDieResult] = useState<number | null>(null);

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
        {/* Rolling area: floor + invisible boundary walls */}
        <RollingArea
          onFloorClick={() => {
            setDieResult(null);
            physicsDieRef.current?.roll();
          }}
        />

        {/* Die — click floor to roll */}
        <PhysicsDie
          ref={physicsDieRef}
          color={PLAYER_COLORS.red}
          position={[0, 1, 0]}
          onResult={setDieResult}
        />
      </Physics>

      {/* Result display — shown above die after settle */}
      {dieResult !== null && (
        <Html position={[0, 3, 0]} center>
          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {dieResult}
          </div>
        </Html>
      )}
    </group>
  );
}
