import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import './App.css';

function App() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 12, 0.01], fov: 50 }}
      gl={{ antialias: true }}
    >
      <Scene />
    </Canvas>
  );
}

export default App;
