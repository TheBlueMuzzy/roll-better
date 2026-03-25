import { Text } from '@react-three/drei';

interface GoalProfileGroupProps {
  position: [number, number, number];
  potentialScore?: number;
}

export function GoalProfileGroup({ position, potentialScore }: GoalProfileGroupProps) {
  return (
    <group position={position}>
      {/* White circle background — raised well above floor */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.45, 32]} />
        <meshBasicMaterial color="#ffffff" depthTest={false} />
      </mesh>

      {/* Gold star character */}
      <Text
        position={[0, 0.06, 0.02]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.7}
        color="#f1c40f"
        anchorX="center"
        anchorY="middle"
        depthOffset={-1}
      >
        ★
      </Text>

      {/* Score number inside star */}
      {potentialScore !== undefined && (
        <Text
          position={[0, 0.07, 0.04]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.25}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          fontWeight={700}
          depthOffset={-2}
        >
          {String(potentialScore)}
        </Text>
      )}
    </group>
  );
}
