import { useRef, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import type { SceneHandle } from './components/Scene';
import { HUD } from './components/HUD';
import { useGameStore } from './store/gameStore';
import { getSlotX } from './components/GoalRow';
import { DIE_SIZE } from './components/RollingArea';
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

  // UNLOCK button: process unlocks with animation, then go to idle (ready to roll)
  const handleConfirmUnlock = useCallback(() => {
    const state = useGameStore.getState();
    if (state.phase !== 'unlocking') return;

    const player = state.players[0];
    const mustUnlock = player.poolSize === 0 && player.lockedDice.length < 8;

    if (player.selectedForUnlock.length > 0) {
      // Capture data BEFORE confirmUnlock changes state
      const selectedSlots = [...player.selectedForUnlock];
      const lockedDice = [...player.lockedDice];

      // Build animation data for each selected slot
      const allAnimations: UnlockAnimation[] = [];

      for (const slotIndex of selectedSlots) {
        const lockedDie = lockedDice.find((ld) => ld.goalSlotIndex === slotIndex);
        const value = lockedDie ? lockedDie.value : 1;

        // Departure: locked die flies from player row to pool center
        allAnimations.push({
          type: 'departure',
          fromPos: [getSlotX(slotIndex), DIE_SIZE / 2, -3.77],
          toPos: [0, DIE_SIZE / 2, 1.85],
          value,
          duration: 0.3,
        });

        // Spawn: bonus die appears at goal row and flies to pool center
        allAnimations.push({
          type: 'spawn',
          fromPos: [getSlotX(slotIndex), DIE_SIZE / 2, -4.67],
          toPos: [0, DIE_SIZE / 2, 1.85],
          value,
          duration: 0.5,
        });
      }

      // Start animations
      useGameStore.getState().setUnlockAnimations(allAnimations);

      // After animation window, apply state change
      setTimeout(() => {
        useGameStore.getState().confirmUnlock(0);
        useGameStore.getState().clearUnlockAnimations();
        setPhase('idle');
      }, 800);
    } else if (mustUnlock) {
      // Can't skip — player has 0 dice to roll, must unlock at least 1
      return;
    } else {
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
