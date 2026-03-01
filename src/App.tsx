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

  // Initialize game on mount
  useEffect(() => {
    initGame(2);
    initRound();
  }, [initGame, initRound]);

  // After locking phase, auto-transition to idle after a brief delay
  // so the player can see results before rolling again
  useEffect(() => {
    if (phase === 'locking') {
      const timer = setTimeout(() => {
        setPhase('idle');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase, setPhase]);

  const handleRoll = useCallback(() => {
    if (phase !== 'idle') return;
    setPhase('rolling');
    sceneRef.current?.rollAll();
  }, [phase, setPhase]);

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
