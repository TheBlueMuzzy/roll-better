import { useRef, useState } from 'react';
import { OrbitControls, Environment, AccumulativeShadows, RandomizedLight, Html } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { PLAYER_COLORS } from './Die3D';
import { DicePool } from './DicePool';
import type { DicePoolHandle } from './DicePool';
import { RollingArea } from './RollingArea';
import { GoalRow } from './GoalRow';

export function Scene() {
  const dicePoolRef = useRef<DicePoolHandle>(null);
  const [diceResults, setDiceResults] = useState<number[] | null>(null);

  function handleAllSettled(results: number[]) {
    const sorted = [...results].sort((a, b) => a - b);
    console.log('All dice settled:', sorted);
    setDiceResults(sorted);
  }

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

      {/* Goal row — static dice at top of screen (outside Physics) */}
      <GoalRow values={[1, 2, 3, 4, 5, 6, 1, 2]} />

      {/* Physics world */}
      <Physics gravity={[0, -50, 0]}>
        {/* Rolling area: floor + invisible boundary walls */}
        <RollingArea
          onFloorClick={() => {
            setDiceResults(null);
            dicePoolRef.current?.rollAll();
          }}
        />

        {/* Dice pool — 5 dice for testing */}
        <DicePool
          ref={dicePoolRef}
          count={5}
          color={PLAYER_COLORS.red}
          onAllSettled={handleAllSettled}
        />
      </Physics>

      {/* Result display — shown after all dice settle */}
      {diceResults !== null && (
        <Html position={[0, 3, 0]} center>
          <div
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              pointerEvents: 'none',
              userSelect: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Results: {diceResults.join(', ')}
          </div>
        </Html>
      )}
    </group>
  );
}
