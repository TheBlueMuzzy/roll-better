import { useEffect, useCallback } from "react";
import { useGameStore } from "../store/gameStore";
import { getGameSocket, sendMessage, parseServerMessage } from "../utils/partyClient";
import type { GamePhase } from "../types/game";

// ─── Return Type ─────────────────────────────────────────────────────

interface UseOnlineGameReturn {
  sendUnlockRequest: (slotIndices: number[]) => void;
  sendSkipUnlock: () => void;
}

// No-op return for offline games
const offlineReturn: UseOnlineGameReturn = {
  sendUnlockRequest: () => {},
  sendSkipUnlock: () => {},
};

// ─── Hook ────────────────────────────────────────────────────────────

export function useOnlineGame(): UseOnlineGameReturn {
  const isOnlineGame = useGameStore((s) => s.isOnlineGame);

  // Message listener — handles server game messages during play
  useEffect(() => {
    if (!isOnlineGame) return;

    const socket = getGameSocket();
    if (!socket) {
      console.warn("[useOnlineGame] Online game but no game socket available");
      return;
    }

    const handler = (event: MessageEvent) => {
      const msg = parseServerMessage(event.data as string);
      if (!msg) return;

      switch (msg.type) {
        case "phase_change": {
          const newPhase = msg.phase as GamePhase;
          const state = useGameStore.getState();
          if (newPhase !== state.phase) {
            console.log("[useOnlineGame] phase_change:", state.phase, "->", newPhase);
            state.setPhase(newPhase);
          }
          break;
        }

        case "player_lock_result": {
          console.log("[useOnlineGame] player_lock_result received", msg.playerId);
          useGameStore.getState().addPendingLockReveal({
            playerId: msg.playerId,
            newLocks: msg.newLocks,
            poolSize: msg.poolSize,
            lockedDice: msg.lockedDice,
          });
          break;
        }

        case "unlock_result":
          console.log("[useOnlineGame] unlock_result received", msg);
          useGameStore.getState().applyOnlineUnlockResult(
            msg.playerId, msg.unlockedSlots, msg.newPoolSize, msg.lockedDice
          );
          break;

        case "round_start":
          console.log("[useOnlineGame] round_start (Phase 18 scope)", msg);
          break;

        case "scoring":
          console.log("[useOnlineGame] scoring (Phase 18 scope)", msg);
          break;

        case "session_end":
          console.log("[useOnlineGame] session_end (Phase 18 scope)", msg);
          break;
      }
    };

    socket.addEventListener("message", handler);
    return () => {
      socket.removeEventListener("message", handler);
    };
  }, [isOnlineGame]);

  // Action senders
  const sendUnlockRequest = useCallback((slotIndices: number[]) => {
    const socket = getGameSocket();
    if (!socket) {
      console.warn("[useOnlineGame] sendUnlockRequest: no socket");
      return;
    }
    sendMessage(socket, { type: "unlock_request", slotIndices });
  }, []);

  const sendSkipUnlock = useCallback(() => {
    const socket = getGameSocket();
    if (!socket) {
      console.warn("[useOnlineGame] sendSkipUnlock: no socket");
      return;
    }
    sendMessage(socket, { type: "skip_unlock" });
  }, []);

  // Early return for offline games
  if (!isOnlineGame) return offlineReturn;

  return {
    sendUnlockRequest,
    sendSkipUnlock,
  };
}
