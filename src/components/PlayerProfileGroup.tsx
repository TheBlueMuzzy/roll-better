import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

interface PlayerProfileGroupProps {
  name: string;
  color: string;
  score: number;
  startingDice: number;
  position: [number, number, number];
}

export function PlayerProfileGroup({
  name,
  color,
  score,
  startingDice,
  position,
}: PlayerProfileGroupProps) {
  // --- Handicap (Z) scale-pop animation (carried over from PlayerIcon) ---
  const prevStartingDice = useRef(startingDice);
  const popTimer = useRef(0);
  const diceBadgeRef = useRef<HTMLSpanElement>(null);

  useFrame((_, delta) => {
    // Detect startingDice change -> trigger pop
    if (startingDice !== prevStartingDice.current) {
      prevStartingDice.current = startingDice;
      popTimer.current = 0.4; // 0.4s pop duration
    }

    // Animate pop
    if (popTimer.current > 0) {
      popTimer.current = Math.max(0, popTimer.current - delta);
      const t = popTimer.current / 0.4; // 1->0 over duration
      const scale = 1.0 + 0.4 * Math.sin(Math.PI * t);
      if (diceBadgeRef.current) {
        diceBadgeRef.current.style.transform = `scale(${scale})`;
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
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {/* Avatar circle */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: color,
            border: '2px solid rgba(255, 255, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* First letter of name as placeholder */}
          <span
            style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: '#ffffff',
              textShadow: '0 1px 2px rgba(0,0,0,0.4)',
            }}
          >
            {name.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Score (large, bold) */}
        <span
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: '#ffffff',
            lineHeight: 1,
            textShadow: '0 1px 3px rgba(0,0,0,0.6)',
          }}
        >
          {score}
        </span>

        {/* Starting dice count (smaller, secondary) */}
        <span
          ref={diceBadgeRef}
          style={{
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.6)',
            lineHeight: 1,
            display: 'inline-block',
            transformOrigin: 'center',
            textShadow: '0 1px 2px rgba(0,0,0,0.4)',
          }}
        >
          {startingDice}d
        </span>
      </div>
    </Html>
  );
}
