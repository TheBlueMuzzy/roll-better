import { useRef, forwardRef, useImperativeHandle } from 'react';
import { OrbitControls, Environment, AccumulativeShadows, RandomizedLight } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { PLAYER_COLORS } from './Die3D';
import { DicePool } from './DicePool';
import type { DicePoolHandle } from './DicePool';
import { RollingArea, ROLLING_Z_MIN, ROLLING_Z_MAX, ARENA_HALF_X } from './RollingArea';
import { GoalRow } from './GoalRow';
import { PlayerRow } from './PlayerRow';
import { PlayerIcon } from './PlayerIcon';

// --- TEST DATA (replaced by game logic in Phase 5) ---
const TEST_GOAL_VALUES = [1, 1, 2, 2, 3, 4, 5, 6];
const TEST_LOCKED_VALUES: (number | null)[] = [null, null, null, null, 3, null, 5, null];
const TEST_PLAYER = { name: 'You', color: PLAYER_COLORS.red, score: 0, poolSize: 5, matches: 2, handicap: 8 };
const TEST_DICE_COUNT = 5;

// --- Public API exposed via ref ---
export interface SceneHandle {
  rollAll(): void;
}

// --- Props ---
interface SceneProps {
  onRollStart?: () => void;
  onResults?: (results: number[]) => void;
}

export const Scene = forwardRef<SceneHandle, SceneProps>(
  function Scene({ onRollStart, onResults }, ref) {
    const dicePoolRef = useRef<DicePoolHandle>(null);

    // Expose rollAll to parent (App) via ref
    useImperativeHandle(ref, () => ({
      rollAll() {
        onRollStart?.();
        dicePoolRef.current?.rollAll();
      },
    }));

    function handleAllSettled(results: number[]) {
      const sorted = [...results].sort((a, b) => a - b);
      console.log('All dice settled:', sorted);
      onResults?.(sorted);
    }

    function handleFloorClick() {
      onRollStart?.();
      dicePoolRef.current?.rollAll();
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

        {/* Placement zone floor — different color, edge-to-edge horizontally */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.001, (-5.6 + ROLLING_Z_MIN) / 2]}
          receiveShadow
        >
          <planeGeometry args={[10, ROLLING_Z_MIN - (-5.6)]} />
          <meshStandardMaterial color="#4a3020" roughness={0.8} metalness={0.0} />
        </mesh>

        {/* Goal row — static dice at top of screen (outside Physics) */}
        <GoalRow values={TEST_GOAL_VALUES} />

        {/* Player row — slot markers + locked dice (outside Physics) */}
        <PlayerRow
          color={TEST_PLAYER.color}
          lockedValues={TEST_LOCKED_VALUES}
        />

        {/* Player icon — name, color, score, stats (outside Physics) */}
        <PlayerIcon
          name={TEST_PLAYER.name}
          color={TEST_PLAYER.color}
          score={TEST_PLAYER.score}
          poolSize={TEST_PLAYER.poolSize}
          matches={TEST_PLAYER.matches}
          handicap={TEST_PLAYER.handicap}
          position={[-ARENA_HALF_X + 0.3, 0, ROLLING_Z_MAX - 0.3]}
        />

        {/* Subtle divider between player row and rolling area */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.01, ROLLING_Z_MIN]}
        >
          <planeGeometry args={[ARENA_HALF_X * 2, 0.02]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.12}
            depthWrite={false}
          />
        </mesh>

        {/* Physics world */}
        <Physics gravity={[0, -50, 0]}>
          {/* Rolling area: floor + invisible boundary walls */}
          <RollingArea onFloorClick={handleFloorClick} />

          {/* Dice pool */}
          <DicePool
            ref={dicePoolRef}
            count={TEST_DICE_COUNT}
            color={TEST_PLAYER.color}
            onAllSettled={handleAllSettled}
          />
        </Physics>
      </group>
    );
  },
);
