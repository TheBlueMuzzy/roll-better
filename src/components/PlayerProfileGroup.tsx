import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface PlayerProfileGroupProps {
  name: string;
  color: string;
  score: number;
  startingDice: number;
  totalDice: number;
  position: [number, number, number];
  isBot?: boolean;
}

// Reuse the same star shape as GoalProfileGroup
function createStarShape(outerRadius: number, innerRadius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const points = 5;
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points + Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

const starShape = createStarShape(0.35, 0.15);

// Layout constants
const AVATAR_RADIUS = 0.35;
const AVATAR_X = -1.575;     // Avatar position (left of anchor, +1/4 avatar width gap from star)
const STAR_X = AVATAR_X + 0.875; // Star to the right of avatar (+0.175 to restore position)
const STATS_Z = 0.45;        // Stats below star (+Z = toward camera = down on screen)

export function PlayerProfileGroup({
  name,
  color,
  score,
  startingDice,
  totalDice,
  position,
  isBot,
}: PlayerProfileGroupProps) {
  // --- Handicap (startingDice) scale-pop animation ---
  const prevStartingDice = useRef(startingDice);
  const popTimer = useRef(0);
  const statsGroupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (startingDice !== prevStartingDice.current) {
      prevStartingDice.current = startingDice;
      popTimer.current = 0.4;
    }

    if (popTimer.current > 0) {
      popTimer.current = Math.max(0, popTimer.current - delta);
      const t = popTimer.current / 0.4;
      const s = 1.0 + 0.3 * Math.sin(Math.PI * t);
      if (statsGroupRef.current) {
        statsGroupRef.current.scale.set(s, s, s);
      }
    }
  });

  return (
    <group position={position}>
      {/* === Column A: Avatar circle with letter === */}

      {/* Avatar circle (player color) */}
      <mesh position={[AVATAR_X, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={10}>
        <circleGeometry args={[AVATAR_RADIUS, 32]} />
        <meshBasicMaterial color={color} depthTest={false} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* Avatar letter */}
      <Text
        position={[AVATAR_X, 0.06, 0.02]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.28}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        depthOffset={-1}
        fontWeight={700}
      >
        {name.charAt(0).toUpperCase()}
      </Text>

      {/* Bot indicator — white dot with dark B, top-left of avatar */}
      {isBot && (
        <group position={[AVATAR_X - 0.22, 0, -0.22]}>
          <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.13, 16]} />
            <meshBasicMaterial color="#ffffff" depthTest={false} toneMapped={false} />
          </mesh>
          <Text
            position={[0, 0.09, 0.01]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.15}
            color="#333333"
            anchorX="center"
            anchorY="middle"
            depthOffset={-3}
          >
            B
          </Text>
        </group>
      )}

      {/* === Column B: Star+score and stats === */}

      {/* Gold star shape */}
      <mesh position={[STAR_X, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <shapeGeometry args={[starShape]} />
        <meshBasicMaterial color="#f1c40f" depthTest={false} toneMapped={false} />
      </mesh>

      {/* Score number inside star */}
      <Text
        position={[STAR_X, 0.06, 0.02]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.2}
        color="#000000"
        anchorX="center"
        anchorY="middle"
        depthOffset={-2}
        fontWeight={700}
      >
        {String(score)}
      </Text>

      {/* Stats text — S{startingDice} | T{totalDice} */}
      <group ref={statsGroupRef}>
        <Text
          position={[STAR_X, 0.05, STATS_Z]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.22}
          color="#aaaaaa"
          fontWeight={700}
          anchorX="center"
          anchorY="middle"
          depthOffset={-1}
        >
          {`S${startingDice} | T${totalDice}`}
        </Text>
      </group>
    </group>
  );
}
