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

    let deferredPhaseInterval: ReturnType<typeof setInterval> | null = null;

    const handler = (event: MessageEvent) => {
      const msg = parseServerMessage(event.data as string);
      if (!msg) return;

      switch (msg.type) {
        case "phase_change": {
          const newPhase = msg.phase as GamePhase;
          const state = useGameStore.getState();
          if (newPhase === state.phase) break;

          // Defer phase transition if animations are still playing
          const hasAnimations =
            state.roundState.aiUnlockAnimations.length > 0 ||
            state.roundState.aiLockAnimations.length > 0 ||
            state.roundState.lockAnimations.length > 0 ||
            state.roundState.unlockAnimations.length > 0;

          if (hasAnimations) {
            console.log("[useOnlineGame] phase_change deferred:", state.phase, "->", newPhase, "(animations in progress)");
            // Clear any previous deferred phase poll
            if (deferredPhaseInterval) clearInterval(deferredPhaseInterval);
            // Poll until animations clear, then apply
            deferredPhaseInterval = setInterval(() => {
              const s = useGameStore.getState();
              const stillAnimating =
                s.roundState.aiUnlockAnimations.length > 0 ||
                s.roundState.aiLockAnimations.length > 0 ||
                s.roundState.lockAnimations.length > 0 ||
                s.roundState.unlockAnimations.length > 0;
              if (!stillAnimating) {
                clearInterval(deferredPhaseInterval!);
                deferredPhaseInterval = null;
                console.log("[useOnlineGame] deferred phase_change applied:", s.phase, "->", newPhase);
                s.setPhase(newPhase);
              }
            }, 100);
          } else {
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

        case "scoring": {
          const scoringState = useGameStore.getState();
          const localId = scoringState.onlinePlayerIds[0];
          const localWinner = msg.winners.find((w: { playerId: string; roundScore: number }) => w.playerId === localId);
          console.log(
            "[useOnlineGame] scoring — winners:",
            msg.winners.map((w: { playerId: string; roundScore: number }) => w.playerId),
            "local roundScore:",
            localWinner ? localWinner.roundScore : 0,
          );
          scoringState.applyOnlineScoring(msg.winners, msg.players);
          break;
        }

        case "session_end":
          console.log("[useOnlineGame] session_end — transitioning to winners screen");
          useGameStore.getState().applyOnlineSessionEnd(msg.players);
          break;
      }
    };

    socket.addEventListener("message", handler);
    return () => {
      socket.removeEventListener("message", handler);
      if (deferredPhaseInterval) clearInterval(deferredPhaseInterval);
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
