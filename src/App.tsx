import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import versionData from '../version.json';
import './App.css';

function App() {
  const version = `v${versionData.version}.${versionData.build}`;

  return (
    <>
      <Canvas
        shadows
        camera={{ position: [0, 12, 0.01], fov: 50 }}
        gl={{ antialias: true }}
      >
        <Scene />
      </Canvas>
      <div className="build-version">{version}</div>
    </>
  );
}

export default App;
