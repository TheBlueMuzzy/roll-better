import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

interface PlayerProfileGroupProps {
  name: string;
  color: string;
  score: number;
  startingDice: number;
  totalDice: number;
  position: [number, number, number];
}

export function PlayerProfileGroup({
  name,
  color,
  score,
  startingDice,
  totalDice,
  position,
}: PlayerProfileGroupProps) {
  // --- Handicap (startingDice) scale-pop animation ---
  const prevStartingDice = useRef(startingDice);
  const popTimer = useRef(0);
  const statsRef = useRef<HTMLDivElement>(null);

  useFrame((_, delta) => {
    if (startingDice !== prevStartingDice.current) {
      prevStartingDice.current = startingDice;
      popTimer.current = 0.4;
    }

    if (popTimer.current > 0) {
      popTimer.current = Math.max(0, popTimer.current - delta);
      const t = popTimer.current / 0.4;
      const scale = 1.0 + 0.3 * Math.sin(Math.PI * t);
      if (statsRef.current) {
        statsRef.current.style.transform = `scale(${scale})`;
      }
    }
  });

  return (
    <Html
      position={position}
      center
      occlude={false}
      style={{
        pointerEvents: 'none',
        userSelect: 'none',
        fontFamily: 'system-ui, sans-serif',
        whiteSpace: 'nowrap',
      }}
    >
      {/* Two-column layout: A) Avatar | B) Star+score / SX|TX */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {/* Column A: Avatar circle */}
        <div
          style={{
            width: 57,
            height: 57,
            borderRadius: '50%',
            backgroundColor: color,
            border: '2px solid rgba(255, 255, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#ffffff',
              textShadow: '0 1px 2px rgba(0,0,0,0.4)',
            }}
          >
            {name.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Column B: two rows stacked */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {/* B.1: Star with score */}
          <div
            style={{
              position: 'relative',
              width: 52,
              height: 52,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                position: 'absolute',
                fontSize: 52,
                lineHeight: 1,
                color: '#f1c40f',
                textShadow: '0 1px 3px rgba(0,0,0,0.4)',
              }}
            >
              &#9733;
            </span>
            <span
              style={{
                position: 'relative',
                top: 3,
                fontSize: 20,
                fontWeight: 'bold',
                color: '#ffffff',
                lineHeight: 1,
                zIndex: 1,
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }}
            >
              {score}
            </span>
          </div>

          {/* B.2: S{startingDice} | T{totalDice} */}
          <div
            ref={statsRef}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transformOrigin: 'center',
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: 1,
                textShadow: '0 1px 2px rgba(0,0,0,0.4)',
              }}
            >
              S{startingDice}
            </span>
            <span
              style={{
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.35)',
                lineHeight: 1,
              }}
            >
              |
            </span>
            <span
              style={{
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: 1,
                textShadow: '0 1px 2px rgba(0,0,0,0.4)',
              }}
            >
              T{totalDice}
            </span>
          </div>
        </div>
      </div>
    </Html>
  );
}
