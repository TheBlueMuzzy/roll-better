import { useRef, useState, forwardRef, useImperativeHandle, useMemo, useCallback } from 'react';
import { OrbitControls, Environment, AccumulativeShadows, RandomizedLight } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { GravityController } from './GravityController';
import { DicePool } from './DicePool';
import type { DicePoolHandle } from './DicePool';
import { RollingArea, ROLLING_Z_MIN, ARENA_HALF_X, DIE_SIZE } from './RollingArea';
import { GoalRow, getSlotX, PROFILE_X_OFFSET } from './GoalRow';
import { GoalIndicators } from './GoalIndicators';
import { PlayerRow } from './PlayerRow';
import { PlayerProfileGroup } from './PlayerProfileGroup';
import { GoalProfileGroup } from './GoalProfileGroup';
import { AnimatingDie } from './AnimatingDie';
import { MitosisDie } from './MitosisDie';
import { SpawningDie } from './SpawningDie';
import { useGameStore } from '../store/gameStore';
import { playSelectDie, playDeselectDie } from '../utils/soundManager';

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
    const performanceMode = useGameStore((s) => s.settings.performanceMode);
    const toggleUnlockSelection = useGameStore((s) => s.toggleUnlockSelection);

    const goalTransition = useGameStore((s) => s.roundState.goalTransition);
    const poolExiting = useGameStore((s) => s.roundState.poolExiting);
    const poolSpawning = useGameStore((s) => s.roundState.poolSpawning);
    const poolSpawnPositions = useGameStore((s) => s.roundState.poolSpawnPositions);
    const pendingNewDice = useGameStore((s) => s.roundState.pendingNewDice);
    const pendingNewDicePositions = useGameStore((s) => s.roundState.pendingNewDicePositions);
    const pendingNewDiceRotations = useGameStore((s) => s.roundState.pendingNewDiceRotations);
    const remainingDiceValues = useGameStore((s) => s.roundState.remainingDiceValues);
    const remainingDicePositions = useGameStore((s) => s.roundState.remainingDicePositions);
    const remainingDiceRotations = useGameStore((s) => s.roundState.remainingDiceRotations);
    const lockAnimations = useGameStore((s) => s.roundState.lockAnimations);
    const animatingSlotIndices = useGameStore((s) => s.roundState.animatingSlotIndices);
    const clearLockAnimations = useGameStore((s) => s.clearLockAnimations);
    const aiLockAnimations = useGameStore((s) => s.roundState.aiLockAnimations);
    const aiAnimatingSlotIndices = useGameStore((s) => s.roundState.aiAnimatingSlotIndices);
    const clearAILockAnimations = useGameStore((s) => s.clearAILockAnimations);
    const unlockAnimations = useGameStore((s) => s.roundState.unlockAnimations);
    const aiUnlockAnimations = useGameStore((s) => s.roundState.aiUnlockAnimations);
    const player = players[0];

    // Track how many lerp animations have completed (human)
    const lerpCompleteCount = useRef(0);
    const lerpExpectedCount = useRef(0);

    // Track how many AI lerp animations have completed
    const aiLerpCompleteCount = useRef(0);
    const aiLerpExpectedCount = useRef(0);

    // Compute locked values array (8 slots, null if empty, value if locked)
    const lockedValues = useMemo(() => {
      if (!player) return Array(8).fill(null) as (number | null)[];
      const slots: (number | null)[] = Array(8).fill(null);
      for (const ld of player.lockedDice) {
        slots[ld.goalSlotIndex] = ld.value;
      }
      return slots;
    }, [player]);

    // Compute locked values for AI players
    const aiLockedValues = useMemo(() => {
      return players.slice(1).map((aiPlayer) => {
        const slots: (number | null)[] = Array(8).fill(null);
        for (const ld of aiPlayer.lockedDice) {
          slots[ld.goalSlotIndex] = ld.value;
        }
        return slots;
      });
    }, [players]);

    // Compute AI unlock animating slot indices (slots to hide during fly-out animation)
    const aiUnlockSlotIndices = useMemo(() => {
      const result: Record<string, number[]> = {};
      for (const anim of aiUnlockAnimations) {
        if (!result[anim.playerId]) result[anim.playerId] = [];
        result[anim.playerId].push(anim.slotIndex);
      }
      return result;
    }, [aiUnlockAnimations]);

    const [shakingSlot, setShakingSlot] = useState<number | null>(null);

    const handleToggleUnlock = useCallback((slotIndex: number) => {
      const p = useGameStore.getState().players[0];
      const isCurrentlySelected = p.selectedForUnlock.includes(slotIndex);

      // If trying to select (not deselect), check 12-die cap
      // Each unlock adds 1 net die: total after = pool + locked + numUnlocks
      if (!isCurrentlySelected) {
        const wouldBeTotal = p.poolSize + p.lockedDice.length + (p.selectedForUnlock.length + 1);
        if (wouldBeTotal > 12) {
          setShakingSlot(slotIndex);
          setTimeout(() => setShakingSlot(null), 150);
          return;
        }
        playSelectDie();
      } else {
        playDeselectDie();
      }

      toggleUnlockSelection(0, slotIndex);
    }, [toggleUnlockSelection]);

    // Expose rollAll to parent (App) via ref
    useImperativeHandle(ref, () => ({
      rollAll() {
        onRollStart?.();
        dicePoolRef.current?.rollAll();
      },
    }));

    function handleAllSettled(values: number[], positions: [number, number, number][], rotations: [number, number, number][]) {
      console.log('All dice settled:', values);
      // Reset lerp tracking for this roll (human + AI)
      lerpCompleteCount.current = 0;
      lerpExpectedCount.current = 0;
      aiLerpCompleteCount.current = 0;
      aiLerpExpectedCount.current = 0;

      const state = useGameStore.getState();
      if (state.isOnlineGame) {
        // Online: store physics positions, wait for server results merge
        state.setPhysicsSettledData({ positions, rotations });
      } else {
        // Offline: use physics-determined values directly
        state.setRollResults(values, positions, rotations);
        // Also notify App via callback (for any non-position-aware consumers)
        onResults?.(values);
      }
    }

    function handleLerpComplete() {
      lerpCompleteCount.current++;
      if (lerpCompleteCount.current >= lerpExpectedCount.current && lerpExpectedCount.current > 0) {
        clearLockAnimations();
      }
    }

    // Sync expected lerp count when lockAnimations changes
    if (lockAnimations.length > 0 && lerpExpectedCount.current === 0) {
      lerpExpectedCount.current = lockAnimations.length;
      lerpCompleteCount.current = 0;
    }

    function handleAILerpComplete() {
      aiLerpCompleteCount.current++;
      if (aiLerpCompleteCount.current >= aiLerpExpectedCount.current && aiLerpExpectedCount.current > 0) {
        clearAILockAnimations();
      }
    }

    // Sync expected AI lerp count when aiLockAnimations changes
    if (aiLockAnimations.length > 0 && aiLerpExpectedCount.current === 0) {
      aiLerpExpectedCount.current = aiLockAnimations.length;
      aiLerpCompleteCount.current = 0;
    }

    function handleFloorClick() {
      // Only allow rolling when in idle phase
      // During unlocking, player uses UNLOCK button in HUD
      if (phase !== 'idle') return;
      onRoll?.();
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

        {/* Soft grounding shadows (visual-only, outside Physics) — disabled in simple mode */}
        {performanceMode === 'advanced' && (
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
        )}

        {/* Placement zone floor — different color, edge-to-edge horizontally */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.001, (-5.6 + ROLLING_Z_MIN) / 2]}
          receiveShadow
        >
          <planeGeometry args={[10, ROLLING_Z_MIN - (-5.6)]} />
          <meshStandardMaterial color="#4a3020" roughness={0.8} metalness={0.0} />
        </mesh>

        {/* Goal row — dice at top of screen with transition animation (outside Physics) */}
        <GoalRow values={roundState.goalValues} transition={goalTransition} />

        {/* Goal indicators — colored dots under goal dice showing who has each slot locked */}
        <GoalIndicators players={players} />

        {/* Player row — slot markers + locked dice (outside Physics) */}
        <PlayerRow
          color={player.color}
          lockedValues={lockedValues}
          phase={phase}
          selectedForUnlock={player.selectedForUnlock}
          onToggleUnlock={handleToggleUnlock}
          shakingSlot={shakingSlot}
          animatingSlotIndices={animatingSlotIndices}
          unlockAnimations={unlockAnimations}
          canUnlock={(12 - player.poolSize - player.lockedDice.length) > 0}
          maxUnlocks={Math.max(0, 12 - player.poolSize - player.lockedDice.length)}
        />

        {/* AI player rows — below human row (outside Physics) */}
        {players.slice(1).map((aiPlayer, idx) => {
          // Combine lock-in and unlock-out animating indices for this AI player
          const lockSlots = aiAnimatingSlotIndices[aiPlayer.id] || [];
          const unlockSlots = aiUnlockSlotIndices[aiPlayer.id] || [];
          const combinedSlots = lockSlots.length > 0 && unlockSlots.length > 0
            ? [...lockSlots, ...unlockSlots]
            : lockSlots.length > 0 ? lockSlots : unlockSlots;
          return (
            <PlayerRow
              key={aiPlayer.id}
              z={-3.77 + (idx + 1) * 0.9}
              color={aiPlayer.color}
              lockedValues={aiLockedValues[idx]}
              animatingSlotIndices={combinedSlots}
            />
          );
        })}

        {/* Profile groups — avatar circle + star-score + stats, left of each row */}
        <PlayerProfileGroup
          name={player.name}
          color={player.color}
          score={player.score}
          startingDice={player.startingDice}
          totalDice={player.poolSize + player.lockedDice.length}
          position={[getSlotX(0) - PROFILE_X_OFFSET, 0, -3.77]}
        />

        {/* AI player profile groups */}
        {players.slice(1).map((aiPlayer, idx) => (
          <PlayerProfileGroup
            key={`profile-${aiPlayer.id}`}
            name={aiPlayer.name}
            color={aiPlayer.color}
            score={aiPlayer.score}
            startingDice={aiPlayer.startingDice}
            totalDice={aiPlayer.poolSize + aiPlayer.lockedDice.length}
            position={[getSlotX(0) - PROFILE_X_OFFSET, 0, -3.77 + (idx + 1) * 0.9]}
          />
        ))}

        {/* Goal profile group — star icon left of goal row, shows potential score */}
        <GoalProfileGroup
          position={[getSlotX(0) - PROFILE_X_OFFSET, 0, -4.67]}
          potentialScore={(() => {
            const totalDice = player.poolSize + player.lockedDice.length;
            const projectedPool = Math.max(0, totalDice - 8);
            const penalties = [1, 0, 1, 1];
            let penalty = 0;
            for (let i = 0; i < projectedPool && i < penalties.length; i++) {
              penalty += penalties[i];
            }
            return Math.max(0, 8 - penalty);
          })()}
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
          {/* Syncs Rapier gravity with phone accelerometer during rolling */}
          <GravityController />

          {/* Rolling area: floor + invisible boundary walls */}
          <RollingArea onFloorClick={handleFloorClick} />

          {/* Dice pool */}
          <DicePool
            ref={dicePoolRef}
            count={player.poolSize}
            color={player.color}
            poolExiting={poolExiting}
            poolSpawning={poolSpawning}
            spawnTargetPositions={poolSpawnPositions}
            newDiceValues={pendingNewDice}
            newDicePositions={pendingNewDicePositions}
            newDiceRotations={pendingNewDiceRotations}
            remainingDiceValues={remainingDiceValues}
            remainingDicePositions={remainingDicePositions}
            remainingDiceRotations={remainingDiceRotations}
            onAllSettled={handleAllSettled}
          />
        </Physics>

        {/* Pool spawn animations — dice fly from avatar to pool positions (outside Physics) */}
        {poolSpawning && poolSpawnPositions.map((toPos, i) => (
          <SpawningDie
            key={`spawn-${i}`}
            fromPos={[getSlotX(0) - PROFILE_X_OFFSET, DIE_SIZE / 2, -3.77]}
            toPos={toPos}
            color={player.color}
            delay={i * 0.08}
          />
        ))}

        {/* Lock lerp animations — flying dice outside Physics */}
        {lockAnimations.map((anim, i) => (
          <AnimatingDie
            key={i}
            fromPos={anim.fromPos}
            toPos={anim.toPos}
            fromRotation={anim.fromRotation}
            value={anim.value}
            color={player.color}
            delay={anim.delay}
            onComplete={handleLerpComplete}
          />
        ))}

        {/* AI lock animations — dice emerge from profile and fly to slots */}
        {aiLockAnimations.map((anim, i) => {
          const aiPlayer = players.find((p) => p.id === anim.playerId);
          return (
            <AnimatingDie
              key={`ai-lock-${i}`}
              fromPos={anim.fromPos}
              toPos={anim.toPos}
              fromRotation={anim.fromRotation}
              value={anim.value}
              color={aiPlayer?.color || '#888'}
              delay={anim.delay}
              fromScale={anim.fromScale}
              toScale={anim.toScale}
              onComplete={handleAILerpComplete}
            />
          );
        })}

        {/* Mitosis unlock animations — flying + splitting dice outside Physics */}
        {unlockAnimations.map((anim, i) => (
          <MitosisDie
            key={`mitosis-${anim.slotIndex}-${i}`}
            fromPos={anim.fromPos}
            targetPos={anim.targetPos}
            splitTargets={anim.splitTargets}
            splitYRotations={anim.splitYRotations}
            delay={anim.delay}
            value={anim.value}
            color={player.color}
          />
        ))}

        {/* AI unlock animations — dice fly from row slots back to profile, scaling down to 0 */}
        {aiUnlockAnimations.map((anim, i) => {
          const aiPlayer = players.find((p) => p.id === anim.playerId);
          return (
            <AnimatingDie
              key={`ai-unlock-${anim.playerId}-${anim.slotIndex}-${i}`}
              fromPos={anim.fromPos}
              toPos={anim.toPos}
              fromRotation={[0, 0, 0]}
              value={anim.value}
              color={aiPlayer?.color || '#888'}
              delay={anim.delay}
              duration={0.5}
              fromScale={1}
              toScale={0}
            />
          );
        })}
      </group>
    );
  },
);
