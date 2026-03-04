import { useEffect, useCallback } from "react";
import { useGameStore } from "../store/gameStore";
import { getGameSocket, sendMessage, parseServerMessage } from "../utils/partyClient";
import { getSpawnPositions } from "../components/DicePool";
import type { GamePhase } from "../types/game";
import type { PlayerSyncState } from "../types/protocol";

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
    let deferredPhaseTimeout: ReturnType<typeof setTimeout> | null = null;

    const handler = (event: MessageEvent) => {
      const msg = parseServerMessage(event.data as string);
      if (!msg) return;

      switch (msg.type) {
        case "phase_change": {
          const newPhase = msg.phase as GamePhase;
          const state = useGameStore.getState();
          if (newPhase === state.phase) break;

          // roundEnd triggers exit animations immediately — never deferred
          if (newPhase === 'roundEnd') {
            console.log("[useOnlineGame] phase_change roundEnd — triggering exit animations");
            state.setPoolExiting(true);
            state.setGoalTransition('exiting');
            state.setPhase('roundEnd');
            break;
          }

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
            if (deferredPhaseTimeout) clearTimeout(deferredPhaseTimeout);
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
                if (deferredPhaseTimeout) { clearTimeout(deferredPhaseTimeout); deferredPhaseTimeout = null; }
                console.log("[useOnlineGame] deferred phase_change applied:", s.phase, "->", newPhase);
                s.setPhase(newPhase);
              }
            }, 100);
            // Safety: force-apply after 5s to prevent infinite polling
            deferredPhaseTimeout = setTimeout(() => {
              if (deferredPhaseInterval) {
                clearInterval(deferredPhaseInterval);
                deferredPhaseInterval = null;
                deferredPhaseTimeout = null;
                const s = useGameStore.getState();
                console.warn("[useOnlineGame] deferred phase_change FORCED after 5s timeout:", s.phase, "->", newPhase);
                // Clear any stale animation state that was blocking
                s.clearLockAnimations();
                s.clearAILockAnimations();
                s.clearUnlockAnimations();
                s.clearAIUnlockAnimations();
                s.setPhase(newPhase);
              }
            }, 5000);
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

        case "round_start": {
          console.log("[useOnlineGame] round_start — round", msg.round, "goals:", msg.goalValues);
          const rsState = useGameStore.getState();

          // Apply server player sync (handicap-adjusted startingDice + scores)
          rsState.applyServerPlayerSync(msg.players as PlayerSyncState[]);

          // Init round with server-provided goals (skipPhase so we control timing)
          useGameStore.getState().initRound({ goalValues: msg.goalValues, skipPhase: true });

          // Start enter animations: goal dice fly in
          useGameStore.getState().setGoalTransition('entering');

          // Spawn pool dice from avatar to pool positions
          const updatedState = useGameStore.getState();
          const localPlayer = updatedState.players[0];
          if (localPlayer && localPlayer.poolSize > 0) {
            const spawnPositions = getSpawnPositions(localPlayer.poolSize);
            useGameStore.getState().setPoolSpawning(true, spawnPositions);
          }

          // After 1500ms: settle animations and go idle
          setTimeout(() => {
            const s = useGameStore.getState();
            s.setGoalTransition('none');
            s.setPoolSpawning(false);
            s.setPhase('idle');
          }, 1500);
          break;
        }

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
      if (deferredPhaseTimeout) clearTimeout(deferredPhaseTimeout);
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
