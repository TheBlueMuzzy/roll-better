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
        case "roll_results": {
          console.log("[useOnlineGame] roll_results received", msg.playerResults);
          const rollState = useGameStore.getState();
          rollState.setPendingServerResults(msg.playerResults);

          // If we didn't tap to roll (still in idle), signal App.tsx to start
          // the physics animation. This preserves the full visual roll experience
          // — dice tumble, settle, then server results merge via timing barrier.
          if (rollState.phase !== 'rolling') {
            console.log("[useOnlineGame] Non-rolling client — triggering visual roll");
            useGameStore.setState({ serverRollTrigger: true });
          }
          break;
        }

        case "phase_change": {
          const newPhase = msg.phase as GamePhase;
          const state = useGameStore.getState();

          // If roll results haven't been applied yet (physics still settling),
          // defer phase changes that would skip past locking. The deferred phase
          // will be applied after applyOnlineRollResults runs + lock animation.
          if (state.pendingServerResults && (newPhase === 'unlocking' || newPhase === 'scoring')) {
            console.log("[useOnlineGame] Deferring phase_change to", newPhase, "— roll results pending");
            useGameStore.setState({ deferredPhase: newPhase });
            break;
          }

          if (newPhase !== state.phase) {
            console.log("[useOnlineGame] phase_change:", state.phase, "->", newPhase);
            useGameStore.getState().setPhase(newPhase);
          }
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
