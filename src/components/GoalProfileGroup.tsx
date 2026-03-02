import { Html } from '@react-three/drei';

interface GoalProfileGroupProps {
  position: [number, number, number];
  potentialScore?: number;
}

export function GoalProfileGroup({ position, potentialScore }: GoalProfileGroupProps) {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
  const scale = Math.min(Math.max(vw / 390, 0.85), 1.3);
  return (
    <Html
      position={position}
      occlude={false}
      style={{
        pointerEvents: 'none',
        userSelect: 'none',
        fontFamily: 'system-ui, sans-serif',
        transform: 'translate(-100%, -50%)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: Math.round(48 * scale * 0.25) + Math.round(48 * scale * 0.35),
        }}
      >
        {/* White circle with oversized gold star + score */}
        <div
          style={{
            position: 'relative',
            width: Math.round(48 * scale),
            height: Math.round(48 * scale),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* White circle background */}
          <div
            style={{
              width: Math.round(48 * scale),
              height: Math.round(48 * scale),
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              border: '2px solid rgba(255, 255, 255, 0.3)',
            }}
          />
          {/* Gold star */}
          <span
            style={{
              position: 'absolute',
              fontSize: Math.round(62 * scale),
              lineHeight: 1,
              color: '#f1c40f',
              textShadow: '0 1px 3px rgba(0,0,0,0.3)',
              top: 'calc(50% - 5px)',
              left: '50%',
              transform: 'translate(-50%, -50%) scale(0.90)',
            }}
          >
            &#9733;
          </span>
          {/* Score number inside star */}
          {potentialScore !== undefined && (
            <span
              style={{
                position: 'absolute',
                top: 'calc(50% - 3px)',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: Math.round(16 * scale),
                fontWeight: 'bold',
                color: '#ffffff',
                lineHeight: 1,
                zIndex: 1,
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }}
            >
              {potentialScore}
            </span>
          )}
        </div>
      </div>
    </Html>
  );
}
