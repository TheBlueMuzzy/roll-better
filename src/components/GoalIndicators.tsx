import { useMemo } from 'react';
import { getSlotX, SLOT_COUNT } from './GoalRow';
import type { Player } from '../types/game';

// --- Layout constants ---
const INDICATOR_RADIUS = 0.12;
const INDICATOR_SEGMENTS = 32;
const INDICATOR_Y = 0.02;     // Just above floor to avoid z-fighting
const Z_OFFSET = -0.73;       // Offset ABOVE goal row (negative Z = toward top of screen)

// Outline ring for visibility on dark surface
const RING_INNER = INDICATOR_RADIUS;
const RING_OUTER = INDICATOR_RADIUS + 0.018;

interface GoalIndicatorsProps {
  players: Player[];
  z?: number;  // goal row Z position — default matches GoalRow
}

export function GoalIndicators({ players, z = -3.2 }: GoalIndicatorsProps) {
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

        return (
          <group key={slotIndex} position={[x, INDICATOR_Y, 0]}>
            {/* Outline ring — dark border for visibility on wood surface */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
              <ringGeometry args={[RING_INNER, RING_OUTER, INDICATOR_SEGMENTS]} />
              <meshBasicMaterial color="#000000" transparent opacity={0.5} depthWrite={false} />
            </mesh>

            {playersOnSlot.length === 1 ? (
              /* Single player: solid full circle */
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[INDICATOR_RADIUS, INDICATOR_SEGMENTS]} />
                <meshBasicMaterial color={playersOnSlot[0].color} />
              </mesh>
            ) : (
              /* Multiple players: equal wedges, one per player */
              <>
                {playersOnSlot.map((playerInfo, i) => {
                  const wedgeAngle = (2 * Math.PI) / playersOnSlot.length;
                  return (
                    <mesh key={playerInfo.playerId} rotation={[-Math.PI / 2, 0, 0]}>
                      <circleGeometry
                        args={[
                          INDICATOR_RADIUS,
                          INDICATOR_SEGMENTS,
                          i * wedgeAngle,       // thetaStart
                          wedgeAngle,            // thetaLength
                        ]}
                      />
                      <meshBasicMaterial color={playerInfo.color} />
                    </mesh>
                  );
                })}
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}
