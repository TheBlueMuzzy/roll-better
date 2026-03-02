import { Html } from '@react-three/drei';

interface GoalProfileGroupProps {
  position: [number, number, number];
}

export function GoalProfileGroup({ position }: GoalProfileGroupProps) {
  return (
    <Html
      position={position}
      center
      occlude={false}
      style={{
        pointerEvents: 'none',
        userSelect: 'none',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* White circle with oversized gold star */}
        <div
          style={{
            position: 'relative',
            width: 57,
            height: 57,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* White circle background */}
          <div
            style={{
              width: 57,
              height: 57,
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              border: '2px solid rgba(255, 255, 255, 0.3)',
            }}
          />
          {/* Gold star — 2.5x size, centered over the circle */}
          <span
            style={{
              position: 'absolute',
              fontSize: 75,
              lineHeight: 1,
              color: '#f1c40f',
              textShadow: '0 1px 3px rgba(0,0,0,0.3)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            &#9733;
          </span>
        </div>
      </div>
    </Html>
  );
}
