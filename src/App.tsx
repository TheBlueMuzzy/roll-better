import { useRef, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import type { SceneHandle } from './components/Scene';
import { HUD } from './components/HUD';
import versionData from '../version.json';
import './App.css';

function App() {
  const version = `v${versionData.version}.${versionData.build}`;
  const sceneRef = useRef<SceneHandle>(null);

  // HUD state — lifted from Scene so HUD (HTML sibling) can read it
  const [isRolling, setIsRolling] = useState(false);
  const [diceResults, setDiceResults] = useState<number[] | null>(null);

  const handleRoll = useCallback(() => {
    sceneRef.current?.rollAll();
  }, []);

  const handleRollStart = useCallback(() => {
    setIsRolling(true);
    setDiceResults(null);
  }, []);

  const handleResults = useCallback((results: number[]) => {
    setDiceResults(results);
    setIsRolling(false);
  }, []);

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
      <HUD
        score={0}
        targetScore={20}
        round={1}
        onRoll={handleRoll}
        isRolling={isRolling}
        diceResults={diceResults}
      />
      <div className="build-version">{version}</div>
    </>
  );
}

export default App;
