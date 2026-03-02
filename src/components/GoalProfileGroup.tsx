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
        {/* Star icon inside a gold circle — same size as player avatars */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            backgroundColor: '#f1c40f',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: 24,
              lineHeight: 1,
              color: '#ffffff',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            &#9733;
          </span>
        </div>
      </div>
    </Html>
  );
}
