import { Html } from '@react-three/drei';

interface PlayerIconProps {
  name: string;
  color: string;
  score: number;
  poolSize: number;
  matches: number;
  startingDice: number;
  position: [number, number, number];
}

export function PlayerIcon({
  name,
  color,
  score,
  poolSize,
  matches,
  startingDice,
  position,
}: PlayerIconProps) {
  return (
    <Html
      position={position}
      center={false}
      style={{
        pointerEvents: 'none',
        userSelect: 'none',
        fontFamily: 'system-ui, sans-serif',
        whiteSpace: 'nowrap',
      }}
    >
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: 6,
          padding: '6px 10px',
        }}
      >
        {/* Top row: color dot, name, score */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {/* Color dot */}
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: color,
              flexShrink: 0,
            }}
          />
          {/* Player name */}
          <span
            style={{
              fontWeight: 'bold',
              fontSize: 13,
              color: '#ffffff',
            }}
          >
            {name}
          </span>
          {/* Score badge */}
          <span
            style={{
              fontSize: 12,
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            {score} pts
          </span>
        </div>

        {/* Stat pills row */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            marginTop: 3,
          }}
        >
          {[
            { label: 'Pool', value: poolSize },
            { label: 'Locked', value: matches },
            { label: 'Start', value: startingDice },
          ].map((stat) => (
            <span
              key={stat.label}
              style={{
                fontSize: 10,
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              {stat.label}:{stat.value}
            </span>
          ))}
        </div>
      </div>
    </Html>
  );
}
