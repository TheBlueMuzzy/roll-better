import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
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
  // --- Responsive scale (1.0 at 390px baseline, clamped 0.85–1.3) ---
  const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
  const scale = Math.min(Math.max(vw / 390, 0.85), 1.3);

  // --- Handicap (Z) scale-pop animation ---
  const prevStartingDice = useRef(startingDice);
  const popTimer = useRef(0);
  const zBadgeRef = useRef<HTMLSpanElement>(null);

  useFrame((_, delta) => {
    // Detect startingDice change → trigger pop
    if (startingDice !== prevStartingDice.current) {
      prevStartingDice.current = startingDice;
      popTimer.current = 0.4; // 0.4s pop duration
    }

    // Animate pop
    if (popTimer.current > 0) {
      popTimer.current = Math.max(0, popTimer.current - delta);
      // Scale curve: peaks at 1.4 at midpoint (t=0.2), returns to 1.0 at t=0
      const t = popTimer.current / 0.4; // 1→0 over duration
      const scale = 1.0 + 0.4 * Math.sin(Math.PI * t);
      if (zBadgeRef.current) {
        zBadgeRef.current.style.transform = `scale(${scale})`;
      }
    }
  });

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
          padding: `${Math.round(6 * scale)}px ${Math.round(10 * scale)}px`,
        }}
      >
        {/* Top row: color dot, name, score */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: Math.round(6 * scale),
          }}
        >
          {/* Color dot */}
          <div
            style={{
              width: Math.round(12 * scale),
              height: Math.round(12 * scale),
              borderRadius: '50%',
              backgroundColor: color,
              flexShrink: 0,
            }}
          />
          {/* Player name */}
          <span
            style={{
              fontWeight: 'bold',
              fontSize: Math.round(13 * scale),
              color: '#ffffff',
            }}
          >
            {name}
          </span>
          {/* Score badge */}
          <span
            style={{
              fontSize: Math.round(12 * scale),
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
            gap: Math.round(6 * scale),
            marginTop: Math.round(3 * scale),
          }}
        >
          {[
            { label: 'Pool', value: poolSize },
            { label: 'Locked', value: matches },
          ].map((stat) => (
            <span
              key={stat.label}
              style={{
                fontSize: Math.round(10 * scale),
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              {stat.label}:{stat.value}
            </span>
          ))}
          {/* Start (Z) badge — separate for pop animation */}
          <span
            ref={zBadgeRef}
            style={{
              fontSize: Math.round(10 * scale),
              color: 'rgba(255, 255, 255, 0.5)',
              display: 'inline-block',
              transformOrigin: 'center',
            }}
          >
            Start:{startingDice}
          </span>
        </div>
      </div>
    </Html>
  );
}
