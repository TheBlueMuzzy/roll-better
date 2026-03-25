import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface GoalProfileGroupProps {
  position: [number, number, number];
  potentialScore?: number;
}

// Simple 5-point star shape
function createStarShape(outerRadius: number, innerRadius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const points = 5;
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

const starShape = createStarShape(0.5, 0.22);

// Shift all children left so the right edge of the circle
// aligns with the anchor point (matching HTML translate(-100%) behavior)
const CIRCLE_RADIUS = 0.55;
// Shift left so the right edge clears the first die (DIE_SIZE width gap)
const X_SHIFT = -1.125;
// Shift Z so bottom edge of circle aligns with bottom edge of dice
const Z_SHIFT = -(CIRCLE_RADIUS - 0.4);

export function GoalProfileGroup({ position, potentialScore }: GoalProfileGroupProps) {
  return (
    <group position={position}>
      {/* White circle background */}
      <mesh position={[X_SHIFT, 0.05, Z_SHIFT]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[CIRCLE_RADIUS, 32]} />
        <meshBasicMaterial color="#ffffff" depthTest={false} />
      </mesh>

      {/* Gold star shape */}
      <mesh position={[X_SHIFT, 0.06, Z_SHIFT]} rotation={[-Math.PI / 2, 0, 0]}>
        <shapeGeometry args={[starShape]} />
        <meshBasicMaterial color="#f1c40f" depthTest={false} />
      </mesh>

      {/* Score number inside star */}
      {potentialScore !== undefined && (
        <Text
          position={[X_SHIFT, 0.07, Z_SHIFT + 0.03]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.28}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          depthOffset={-2}
        >
          {String(potentialScore)}
        </Text>
      )}
    </group>
  );
}
