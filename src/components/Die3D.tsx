import { RoundedBox } from '@react-three/drei';

interface Die3DProps {
  position?: [number, number, number];
}

export function Die3D({ position = [0, 0, 0] }: Die3DProps) {
  return (
    <group position={position}>
      <RoundedBox
        args={[1, 1, 1]}
        radius={0.07}
        smoothness={4}
        castShadow
      >
        <meshStandardMaterial color="#e8e0d4" />
      </RoundedBox>
    </group>
  );
}
