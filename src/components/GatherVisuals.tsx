import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store/gameStore';
import { getGatherRadius } from '../utils/gatherPoints';
import {
  ROLLING_X_OFFSET,
  ARENA_HALF_X,
  ROLLING_Z_MIN,
  ROLLING_Z_MAX,
  ORBIT_HEIGHT,
} from './RollingArea';
import type { Mesh, MeshBasicMaterial } from 'three';

// Starting radius: half the smaller rolling area dimension
const START_RADIUS = ARENA_HALF_X; // 4.5

// Ring lifespan range
const FIRST_LIFESPAN = 0.3;  // first ring lives this long
const LAST_LIFESPAN = 0.04;  // rings at max charge live this long

// Spawn interval range
const FIRST_INTERVAL = 0.5;  // seconds between first spawns
const LAST_INTERVAL = 0.03;  // seconds between last spawns

// Linear interpolation — no exponential curves
const SPAWN_EXPONENT = 1;
const LIFESPAN_EXPONENT = 1;

const MAX_RINGS = 50;

interface RingState {
  active: boolean;
  spawnTime: number;
  duration: number;
}

/**
 * Vacuum VFX: rings spawn at half the roll area size, shrink to 0
 * at the orbit center. Opacity fades from 0% to 100%.
 * Spawn rate accelerates faster than lifespan shrinks → bunching at center.
 */
export function GatherVisuals() {
  const gatherActive = useGameStore((s) => s.gatherState.active);
  const touchPosition = useGameStore((s) => s.gatherState.touchPosition);
  const dieCount = useGameStore((s) => s.gatherState.dieCount);
  const playerColor = useGameStore((s) => s.players[0]?.color ?? '#ffffff');

  const ringRefs = useRef<(Mesh | null)[]>([]);
  const ringMatRefs = useRef<(MeshBasicMaterial | null)[]>([]);

  const ringsState = useRef<RingState[]>(
    Array.from({ length: MAX_RINGS }, () => ({ active: false, spawnTime: 0, duration: 1 }))
  );
  const elapsedRef = useRef(0);
  const nextSpawnRef = useRef(0);
  const wasActiveRef = useRef(false);

  const indices = useMemo(() => Array.from({ length: MAX_RINGS }, (_, i) => i), []);

  useFrame((_, delta) => {
    if (!gatherActive || !touchPosition) {
      if (wasActiveRef.current) {
        wasActiveRef.current = false;
        elapsedRef.current = 0;
        nextSpawnRef.current = 0;
        for (let i = 0; i < MAX_RINGS; i++) {
          ringsState.current[i].active = false;
          const mesh = ringRefs.current[i];
          if (mesh) mesh.visible = false;
        }
      }
      return;
    }

    if (!wasActiveRef.current) {
      wasActiveRef.current = true;
      elapsedRef.current = 0;
      nextSpawnRef.current = 0;
      for (let i = 0; i < MAX_RINGS; i++) {
        ringsState.current[i].active = false;
        const mesh = ringRefs.current[i];
        if (mesh) mesh.visible = false;
      }
    }

    const dt = Math.min(delta, 0.05);
    elapsedRef.current += dt;
    const elapsed = elapsedRef.current;

    const RAMP_DUR = 2.5;

    // Compute orbit center (clamped touch position)
    const baseRadius = getGatherRadius(dieCount);
    const shrinkT = Math.min(elapsed / 2.25, 1.0);
    const minRadius = Math.max(0.4, 0.065 * dieCount);
    const rScale = 1.0 - shrinkT * (1.0 - minRadius / baseRadius);
    const orbitRadius = baseRadius * Math.max(rScale, minRadius / baseRadius);
    const margin = orbitRadius + 0.5;
    const cMinX = ROLLING_X_OFFSET - ARENA_HALF_X + margin;
    const cMaxX = ROLLING_X_OFFSET + ARENA_HALF_X - margin;
    const cMinZ = ROLLING_Z_MIN + margin;
    const cMaxZ = ROLLING_Z_MAX - margin;
    const cx = cMinX < cMaxX ? Math.max(cMinX, Math.min(cMaxX, touchPosition[0])) : ROLLING_X_OFFSET;
    const cz = cMinZ < cMaxZ ? Math.max(cMinZ, Math.min(cMaxZ, touchPosition[2])) : (ROLLING_Z_MIN + ROLLING_Z_MAX) / 2;

    // Spawn new rings
    while (elapsed >= nextSpawnRef.current) {
      let slot = -1;
      for (let i = 0; i < MAX_RINGS; i++) {
        if (!ringsState.current[i].active) { slot = i; break; }
      }
      if (slot === -1) {
        let oldest = 0;
        for (let i = 1; i < MAX_RINGS; i++) {
          if (ringsState.current[i].spawnTime < ringsState.current[oldest].spawnTime) oldest = i;
        }
        slot = oldest;
      }

      // Lifespan curve: shrinks with t^LIFESPAN_EXPONENT (slightly slower than spawn)
      const t = Math.min(nextSpawnRef.current / RAMP_DUR, 1.0);
      const lifespanCurve = Math.pow(t, LIFESPAN_EXPONENT);
      const duration = FIRST_LIFESPAN - lifespanCurve * (FIRST_LIFESPAN - LAST_LIFESPAN);

      ringsState.current[slot] = { active: true, spawnTime: nextSpawnRef.current, duration };

      // Spawn rate curve: accelerates with t^SPAWN_EXPONENT (faster than lifespan)
      const spawnCurve = Math.pow(t, SPAWN_EXPONENT);
      const interval = FIRST_INTERVAL - spawnCurve * (FIRST_INTERVAL - LAST_INTERVAL);
      nextSpawnRef.current += interval;
    }

    // Update all active rings
    for (let i = 0; i < MAX_RINGS; i++) {
      const ring = ringsState.current[i];
      const mesh = ringRefs.current[i];
      const mat = ringMatRefs.current[i];
      if (!mesh || !mat) continue;

      if (!ring.active) {
        mesh.visible = false;
        continue;
      }

      const age = elapsed - ring.spawnTime;
      const progress = age / ring.duration; // 0 → 1

      if (progress >= 1) {
        ring.active = false;
        mesh.visible = false;
        continue;
      }

      mesh.visible = true;

      // Position: orbit center at orbit height
      mesh.position.set(cx, ORBIT_HEIGHT, cz);

      // Scale: START_RADIUS → 0 (linear)
      const radius = START_RADIUS * (1.0 - progress);
      mesh.scale.set(radius, radius, 1);

      // Opacity: 0%@0 → 5%@0.25 → 25%@0.5 → 100%@1.0 (piecewise linear)
      let opacity: number;
      if (progress < 0.25) {
        opacity = (progress / 0.25) * 0.05;
      } else if (progress < 0.5) {
        opacity = 0.05 + ((progress - 0.25) / 0.25) * 0.2;
      } else {
        opacity = 0.25 + ((progress - 0.5) / 0.5) * 0.75;
      }
      mat.opacity = opacity;
    }
  });

  if (!gatherActive) return null;

  return (
    <group>
      {indices.map((i) => (
        <mesh
          key={i}
          ref={(el) => { ringRefs.current[i] = el; }}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
        >
          <ringGeometry args={[0.96, 1, 64]} />
          <meshBasicMaterial
            ref={(el) => { ringMatRefs.current[i] = el; }}
            color={playerColor}
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
