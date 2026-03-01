import { useRef, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import type { SceneHandle } from './components/Scene';
import { HUD } from './components/HUD';
import { useGameStore } from './store/gameStore';
import { getSlotX } from './components/GoalRow';
import { DIE_SIZE } from './components/RollingArea';
import { findClearSpot } from './utils/clearSpot';
import type { UnlockAnimation } from './types/game';
import versionData from '../version.json';
import './App.css';

function App() {
  const version = `v${versionData.version}.${versionData.build}`;
  const sceneRef = useRef<SceneHandle>(null);

  const phase = useGameStore((s) => s.phase);
  const setPhase = useGameStore((s) => s.setPhase);
  const initGame = useGameStore((s) => s.initGame);
  const initRound = useGameStore((s) => s.initRound);
  const setRollResults = useGameStore((s) => s.setRollResults);
  const scoreRound = useGameStore((s) => s.scoreRound);
  const applyHandicap = useGameStore((s) => s.applyHandicap);
  const checkWinner = useGameStore((s) => s.checkWinner);
  const checkSessionEnd = useGameStore((s) => s.checkSessionEnd);

  // Initialize game on mount
  useEffect(() => {
    initGame(2);
    initRound();
  }, [initGame, initRound]);

  // After locking phase, show lock count for 1s then check for winner or go to unlocking
  useEffect(() => {
    if (phase === 'locking') {
      const timer = setTimeout(() => {
        // Check if someone completed all 8 locks
        if (checkWinner()) {
          scoreRound();
          // scoreRound sets phase to 'scoring'
        } else {
          setPhase('unlocking');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [phase, setPhase, checkWinner, scoreRound]);

  // After scoring, show score for 2s then apply handicap and start next round
  useEffect(() => {
    if (phase === 'scoring') {
      const timer = setTimeout(() => {
        applyHandicap();
        // applyHandicap sets phase to 'roundEnd'
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase, applyHandicap]);

  // After roundEnd, check session end or start new round
  useEffect(() => {
    if (phase === 'roundEnd') {
      const timer = setTimeout(() => {
        if (checkSessionEnd()) {
          setPhase('sessionEnd');
        } else {
          initRound();
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase, checkSessionEnd, setPhase, initRound]);

  // UNLOCK button: process unlocks with mitosis animation, then go to idle
  const handleConfirmUnlock = useCallback(() => {
    const state = useGameStore.getState();
    if (state.phase !== 'unlocking') return;

    // Guard: ignore if animation is already in progress
    if (state.roundState.unlockAnimations.length > 0) return;

    const player = state.players[0];
    const mustUnlock = player.poolSize === 0 && player.lockedDice.length < 8;

    if (player.selectedForUnlock.length > 0) {
      // --- ANIMATED PATH: mitosis animation before state change ---
      const selectedSlots = [...player.selectedForUnlock];
      const lockedDice = player.lockedDice;
      const existingPoolPositions = [...state.roundState.remainingDicePositions];

      // Build occupied list: current pool dice positions
      const occupied: [number, number, number][] = [...existingPoolPositions];

      const allAnimations: UnlockAnimation[] = [];

      for (const slotIndex of selectedSlots) {
        // Find the locked die value for this slot
        const lockedEntry = lockedDice.find((ld) => ld.goalSlotIndex === slotIndex);
        if (!lockedEntry) continue;

        // Source position: player row slot
        const fromPos: [number, number, number] = [getSlotX(slotIndex), DIE_SIZE / 2, -3.77];

        // Find a clear spot (avoids existing pool dice + previously computed targets)
        const { targetPos, splitTargets } = findClearSpot(occupied, DIE_SIZE);

        // Add both split targets to occupied so subsequent unlocks don't overlap
        occupied.push(splitTargets[0], splitTargets[1]);

        const DEG30 = (30 * Math.PI) / 180;
        // Stagger: each die starts 250–500ms after the previous
        const prevDelay = allAnimations.length > 0
          ? allAnimations[allAnimations.length - 1].delay
          : 0;
        const delay = allAnimations.length === 0
          ? 0
          : prevDelay + (0.25 + Math.random() * 0.25);

        allAnimations.push({
          slotIndex,
          value: lockedEntry.value,
          fromPos,
          targetPos,
          splitTargets,
          splitYRotations: [
            (Math.random() * 2 - 1) * DEG30,
            (Math.random() * 2 - 1) * DEG30,
          ],
          delay,
        });
      }

      // Trigger animations
      useGameStore.getState().setUnlockAnimations(allAnimations);

      // Wait for last animation's delay + full animation duration (1.7s) + buffer
      const lastDelay = allAnimations.length > 0
        ? allAnimations[allAnimations.length - 1].delay
        : 0;
      const totalWait = (lastDelay * 1000) + 1800;
      setTimeout(() => {
        useGameStore.getState().confirmUnlock(0);
        useGameStore.getState().clearUnlockAnimations();
        setPhase('idle');
      }, totalWait);

    } else if (mustUnlock) {
      // Can't skip — player has 0 dice to roll, must unlock at least 1
      return;
    } else {
      // SKIP path: no animation, immediate
      useGameStore.getState().skipUnlock(0);
      setPhase('idle');
    }
  }, [setPhase]);

  // Tap to Roll: only works during idle
  const handleRoll = useCallback(() => {
    if (useGameStore.getState().phase !== 'idle') return;

    setPhase('rolling');
    sceneRef.current?.rollAll();
  }, [setPhase]);

  const handleRollStart = useCallback(() => {
    setPhase('rolling');
  }, [setPhase]);

  const handleResults = useCallback(
    (results: number[]) => {
      setRollResults(results);
    },
    [setRollResults],
  );

  return (
    <>
      <Canvas
        shadows
        camera={{ position: [0, 12, 0.01], fov: 50 }}
        gl={{ antialias: true }}
      >
        <Scene
          ref={sceneRef}
          onRollStart={handleRollStart}
          onResults={handleResults}
          onRoll={handleRoll}
        />
      </Canvas>
      <HUD onRoll={handleRoll} onConfirmUnlock={handleConfirmUnlock} />
      <div className="build-version">{version}</div>
    </>
  );
}

export default App;
