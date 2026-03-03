import { useEffect, useCallback } from "react";
import { useGameStore } from "../store/gameStore";
import { getGameSocket, sendMessage, parseServerMessage } from "../utils/partyClient";
import type { GamePhase } from "../types/game";

// ─── Return Type ─────────────────────────────────────────────────────

interface UseOnlineGameReturn {
  sendRollRequest: () => void;
  sendUnlockRequest: (slotIndices: number[]) => void;
  sendSkipUnlock: () => void;
}

// No-op return for offline games
const offlineReturn: UseOnlineGameReturn = {
  sendRollRequest: () => {},
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
        case "roll_results":
          console.log("[useOnlineGame] roll_results received", msg.playerResults);
          useGameStore.getState().setPendingServerResults(msg.playerResults);
          break;

        case "phase_change": {
          const newPhase = msg.phase as GamePhase;
          const currentPhase = useGameStore.getState().phase;
          if (newPhase !== currentPhase) {
            console.log("[useOnlineGame] phase_change:", currentPhase, "->", newPhase);
            useGameStore.getState().setPhase(newPhase);
          }
          break;
        }

        case "unlock_result":
          console.log("[useOnlineGame] unlock_result received", msg);
          useGameStore.getState().setPendingUnlockResult(msg);
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
  const sendRollRequest = useCallback(() => {
    const socket = getGameSocket();
    if (!socket) {
      console.warn("[useOnlineGame] sendRollRequest: no socket");
      return;
    }
    sendMessage(socket, { type: "roll_request" });
  }, []);

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
    sendRollRequest,
    sendUnlockRequest,
    sendSkipUnlock,
  };
}
