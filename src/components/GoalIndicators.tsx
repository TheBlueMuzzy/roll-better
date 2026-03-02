import { useMemo } from 'react';
import { getSlotX, SLOT_COUNT } from './GoalRow';
import type { Player } from '../types/game';

// --- Layout constants ---
const INDICATOR_RADIUS = 0.12;
const INDICATOR_SEGMENTS = 32;
const INDICATOR_Y = 0.02;     // Just above floor to avoid z-fighting
const Z_OFFSET = 0.25;        // Offset toward player (positive Z) from goal row

interface GoalIndicatorsProps {
  players: Player[];
  z?: number;  // goal row Z position — default matches GoalRow
}

export function GoalIndicators({ players, z = -4.67 }: GoalIndicatorsProps) {
  // For each of the 8 goal slots, collect which players have it locked
  const slotPlayers = useMemo(() => {
    const result: { color: string; playerId: string }[][] = Array.from(
      { length: SLOT_COUNT },
      () => [],
    );
    for (const player of players) {
      for (const ld of player.lockedDice) {
        if (ld.goalSlotIndex >= 0 && ld.goalSlotIndex < SLOT_COUNT) {
          result[ld.goalSlotIndex].push({
            color: player.color,
            playerId: player.id,
          });
        }
      }
    }
    return result;
  }, [players]);

  return (
    <group position={[0, 0, z + Z_OFFSET]}>
      {slotPlayers.map((playersOnSlot, slotIndex) => {
        if (playersOnSlot.length === 0) return null;

        const x = getSlotX(slotIndex);

        // Render a solid circle in the first player's color
        return (
          <group key={slotIndex} position={[x, INDICATOR_Y, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[INDICATOR_RADIUS, INDICATOR_SEGMENTS]} />
              <meshBasicMaterial color={playersOnSlot[0].color} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
