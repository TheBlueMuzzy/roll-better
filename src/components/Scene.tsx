import { useRef, forwardRef, useImperativeHandle, useMemo, useCallback } from 'react';
import { OrbitControls, Environment, AccumulativeShadows, RandomizedLight } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { DicePool } from './DicePool';
import type { DicePoolHandle } from './DicePool';
import { RollingArea, ROLLING_Z_MIN, ROLLING_Z_MAX, ARENA_HALF_X } from './RollingArea';
import { GoalRow } from './GoalRow';
import { PlayerRow } from './PlayerRow';
import { PlayerIcon } from './PlayerIcon';
import { useGameStore } from '../store/gameStore';

// --- Public API exposed via ref ---
export interface SceneHandle {
  rollAll(): void;
}

// --- Props ---
interface SceneProps {
  onRollStart?: () => void;
  onResults?: (results: number[]) => void;
  onRoll?: () => void;
}

export const Scene = forwardRef<SceneHandle, SceneProps>(
  function Scene({ onRollStart, onResults, onRoll }, ref) {
    const dicePoolRef = useRef<DicePoolHandle>(null);

    // Read store values
    const phase = useGameStore((s) => s.phase);
    const roundState = useGameStore((s) => s.roundState);
    const players = useGameStore((s) => s.players);
    const toggleUnlockSelection = useGameStore((s) => s.toggleUnlockSelection);

    const player = players[0];

    // Compute locked values array (8 slots, null if empty, value if locked)
    const lockedValues = useMemo(() => {
      if (!player) return Array(8).fill(null) as (number | null)[];
      const slots: (number | null)[] = Array(8).fill(null);
      for (const ld of player.lockedDice) {
        slots[ld.goalSlotIndex] = ld.value;
      }
      return slots;
    }, [player]);

    const handleToggleUnlock = useCallback((slotIndex: number) => {
      toggleUnlockSelection(0, slotIndex);
    }, [toggleUnlockSelection]);

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
      // Route through App's handleRoll for proper unlock processing
      if (phase === 'idle' || phase === 'unlocking') {
        onRoll?.();
      }
    }

    // Safety: if store not initialized yet, render just lighting/environment
    if (!player || roundState.goalValues.length === 0) {
      return (
        <group>
          <OrbitControls
            target={[0, 0, 0]}
            enableRotate={false}
            enableZoom={false}
            enablePan={false}
          />
          <ambientLight intensity={0.3} color="#ffeedd" />
          <Environment preset="apartment" />
        </group>
      );
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
        <GoalRow values={roundState.goalValues} />

        {/* Player row — slot markers + locked dice (outside Physics) */}
        <PlayerRow
          color={player.color}
          lockedValues={lockedValues}
          phase={phase}
          selectedForUnlock={player.selectedForUnlock}
          onToggleUnlock={handleToggleUnlock}
        />

        {/* Player icon — name, color, score, stats (outside Physics) */}
        <PlayerIcon
          name={player.name}
          color={player.color}
          score={player.score}
          poolSize={player.poolSize}
          matches={player.lockedDice.length}
          startingDice={player.startingDice}
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
            count={player.poolSize}
            color={player.color}
            onAllSettled={handleAllSettled}
          />
        </Physics>
      </group>
    );
  },
);
