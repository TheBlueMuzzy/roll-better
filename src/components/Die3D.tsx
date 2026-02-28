import { RoundedBox } from '@react-three/drei';
import { CircleGeometry, MeshPhysicalMaterial } from 'three';

// --- Player color constants ---
export const PLAYER_COLORS = {
  red: '#c0392b',
  blue: '#2980b9',
  green: '#27ae60',
  purple: '#8e44ad',
  orange: '#d35400',
  yellow: '#f39c12',
  teal: '#16a085',
  pink: '#e84393',
} as const;

// --- Shared geometry & material for all pip dots (created once) ---
const pipGeometry = new CircleGeometry(0.08, 16);
const pipMaterial = new MeshPhysicalMaterial({
  color: '#1a1a1a',
  clearcoat: 0.8,
  clearcoatRoughness: 0.15,
  metalness: 0,
  roughness: 0.4,
});

// --- Pip 2D layouts (offset from face center, spacing 0.22) ---
const pipLayouts: [number, number][][] = [
  [],                                                                       // 0 — unused
  [[0, 0]],                                                                 // 1
  [[-0.22, 0.22], [0.22, -0.22]],                                           // 2
  [[-0.22, 0.22], [0, 0], [0.22, -0.22]],                                   // 3
  [[-0.22, 0.22], [0.22, 0.22], [-0.22, -0.22], [0.22, -0.22]],             // 4
  [[-0.22, 0.22], [0.22, 0.22], [0, 0], [-0.22, -0.22], [0.22, -0.22]],    // 5
  [[-0.22, 0.22], [0.22, 0.22], [-0.22, 0], [0.22, 0], [-0.22, -0.22], [0.22, -0.22]], // 6
];

// --- Face definitions: value, axis direction, position/rotation helpers ---
interface FaceDef {
  value: number;
  position: (px: number, py: number) => [number, number, number];
  rotation: [number, number, number];
}

const OFFSET = 0.501;

const faces: FaceDef[] = [
  // +Y (top) = 1
  {
    value: 1,
    position: (px, py) => [px, OFFSET, py],
    rotation: [-Math.PI / 2, 0, 0],
  },
  // -Y (bottom) = 6
  {
    value: 6,
    position: (px, py) => [px, -OFFSET, -py],
    rotation: [Math.PI / 2, 0, 0],
  },
  // +X (right) = 5
  {
    value: 5,
    position: (px, py) => [OFFSET, py, -px],
    rotation: [0, Math.PI / 2, 0],
  },
  // -X (left) = 2
  {
    value: 2,
    position: (px, py) => [-OFFSET, py, px],
    rotation: [0, -Math.PI / 2, 0],
  },
  // +Z (front) = 3
  {
    value: 3,
    position: (px, py) => [px, py, OFFSET],
    rotation: [0, 0, 0],
  },
  // -Z (back) = 4
  {
    value: 4,
    position: (px, py) => [-px, py, -OFFSET],
    rotation: [0, Math.PI, 0],
  },
];

// --- Pre-compute all pip meshes data (static, never changes) ---
interface PipData {
  key: string;
  position: [number, number, number];
  rotation: [number, number, number];
}

const allPips: PipData[] = [];
for (const face of faces) {
  const layout = pipLayouts[face.value];
  for (let i = 0; i < layout.length; i++) {
    const [px, py] = layout[i];
    allPips.push({
      key: `f${face.value}-p${i}`,
      position: face.position(px, py),
      rotation: face.rotation,
    });
  }
}

// --- Component ---
interface Die3DProps {
  position?: [number, number, number];
  color?: string;
}

export function Die3D({ position = [0, 0, 0], color = '#e8e0d4' }: Die3DProps) {
  return (
    <group position={position}>
      {/* Die body */}
      <RoundedBox
        args={[1, 1, 1]}
        radius={0.07}
        smoothness={4}
        castShadow
      >
        <meshPhysicalMaterial
          color={color}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          metalness={0}
          roughness={0.35}
          envMapIntensity={1.0}
        />
      </RoundedBox>

      {/* Pip dots */}
      {allPips.map((pip) => (
        <mesh
          key={pip.key}
          geometry={pipGeometry}
          material={pipMaterial}
          position={pip.position}
          rotation={pip.rotation}
        />
      ))}
    </group>
  );
}
