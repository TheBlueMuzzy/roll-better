// SEAT MESSAGES — online only: a kit toast when someone else's seat changes
// ("Sam is on autopilot", "Bot took over for Sam", "Sam is back", "Sam joined the game").
// Words in content/text/en.json (hud.seat). Moved out of the old HUD.tsx unchanged.
import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import type { SeatState } from '../types/protocol';
import { toast } from '../ui/kit';
import { text, fill } from '../ui/words';

export function useSeatMessages() {
  const players = useGameStore((s) => s.players);
  const isOnlineGame = useGameStore((s) => s.isOnlineGame);
  const prevSeatStatesRef = useRef<Map<string, SeatState>>(new Map());

  useEffect(() => {
    if (!isOnlineGame) return;
    const localId = useGameStore.getState().onlinePlayerId;
    const prev = prevSeatStatesRef.current;
    const seat = text.hud.seat;

    for (const p of players) {
      if (p.id === 'player-0' && localId) continue; // skip local player for notifications
      const prevState = prev.get(p.id);
      if (prevState && prevState !== p.seatState) {
        if (prevState === 'human-active' && p.seatState === 'human-afk') {
          toast(fill(seat.autopilot, { name: p.name }));
        } else if (prevState === 'human-afk' && p.seatState === 'bot') {
          toast(fill(seat.botTookOver, { name: p.name }));
        } else if (prevState === 'human-afk' && p.seatState === 'human-active') {
          toast(fill(seat.back, { name: p.name }));
        } else if (prevState === 'bot' && p.seatState === 'human-active') {
          if (p.takeoverReason === 'reclaim') {
            toast(fill(seat.reclaimed, { name: p.name }));
          } else {
            toast(fill(seat.joined, { name: p.name }));
          }
        }
      }
      prev.set(p.id, p.seatState);
    }
  }, [players, isOnlineGame]);
}
