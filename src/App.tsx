import { useRef, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import type { SceneHandle } from './components/Scene';
import { HUD } from './components/HUD';
import { useGameStore } from './store/gameStore';
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

  // After locking phase, show lock count for 1s then check for winner or go idle
  useEffect(() => {
    if (phase === 'locking') {
      const timer = setTimeout(() => {
        // Check if someone completed all 8 locks
        if (checkWinner()) {
          scoreRound();
          // scoreRound sets phase to 'scoring'
        } else {
          setPhase('idle');
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

  const handleRoll = useCallback(() => {
    // Use getState() for synchronous phase check (avoids stale closure)
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
        />
      </Canvas>
      <HUD onRoll={handleRoll} />
      <div className="build-version">{version}</div>
    </>
  );
}

export default App;
