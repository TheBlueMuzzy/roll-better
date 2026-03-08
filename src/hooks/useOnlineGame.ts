import { useEffect, useCallback } from "react";
import { useGameStore } from "../store/gameStore";
import { getGameSocket, sendMessage, parseServerMessage } from "../utils/partyClient";
import { getSpawnPositions } from "../components/DicePool";
import type { GamePhase } from "../types/game";
import type { PlayerSyncState, RoomPlayer } from "../types/protocol";

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

// Phases that should transition automatically (client shouldn't stay in these long)
const TRANSIENT_PHASES = new Set(['locking', 'scoring', 'roundEnd']);
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

    // ─── Watchdog: detect stalls in transient phases ───────────────
    let watchdogInterval: ReturnType<typeof setInterval> | null = null;
    let lastPhase: string = '';
    let phaseEnteredAt: number = 0;
    let watchdogFireCount: number = 0;

    watchdogInterval = setInterval(() => {
      const s = useGameStore.getState();
      if (!s.isOnlineGame) return;

      // Track phase entry time
      if (s.phase !== lastPhase) {
        lastPhase = s.phase;
        phaseEnteredAt = Date.now();
        watchdogFireCount = 0;
      }

      // Check for stall in transient phases (>5s)
      if (TRANSIENT_PHASES.has(s.phase) && Date.now() - phaseEnteredAt > 5000) {
        watchdogFireCount++;
        console.warn(
          `[WATCHDOG] Stall #${watchdogFireCount}: phase="${s.phase}" for ${((Date.now() - phaseEnteredAt) / 1000).toFixed(1)}s`,
        );

        // Force-clear ALL animation arrays
        s.clearLockAnimations();
        s.clearAILockAnimations();
        s.clearUnlockAnimations();
        s.clearAIUnlockAnimations();

        // Clear deferred phase polling
        if (deferredPhaseInterval) { clearInterval(deferredPhaseInterval); deferredPhaseInterval = null; }
        if (deferredPhaseTimeout) { clearTimeout(deferredPhaseTimeout); deferredPhaseTimeout = null; }

        if (watchdogFireCount >= 3) {
          // Self-heal: server isn't responding (crash/disconnect/lost messages)
          // Force client to idle — next phase_change or round_start snapshot will re-sync
          console.warn("[WATCHDOG] Self-healing: forcing to idle after 3 stalls");
          s.setLocalPlayerLocked(false);
          s.setHasSubmittedUnlock(false);
          sendMessage(socket, { type: "skip_unlock" }); // unblock server if waiting
          s.setPhase('idle');
          watchdogFireCount = 0;
          phaseEnteredAt = Date.now();
          lastPhase = 'idle';
        } else {
          // First attempts: ask server for full state — snapshot will fix desync
          console.warn("[WATCHDOG] Requesting phase sync from server");
          sendMessage(socket, { type: "phase_sync_request" });
          phaseEnteredAt = Date.now();
        }
      }
    }, 1000);

    // ─── Message handler ────────────────────────────────────────────

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
            // Apply snapshot immediately for roundEnd
            if (msg.players) {
              useGameStore.getState().syncAllPlayerState(msg.players);
            }
            console.log("[useOnlineGame] phase_change roundEnd — triggering exit animations");
            state.setPoolExiting(true);
            state.setGoalTransition('exiting');
            state.setPhase('roundEnd');
            break;
          }

          // Defer phase transition AND snapshot if animations are still playing
          // (applying snapshot mid-animation causes poolSize to change, spawning extra dice)
          const hasAnimations =
            state.roundState.aiUnlockAnimations.length > 0 ||
            state.roundState.aiLockAnimations.length > 0 ||
            state.roundState.lockAnimations.length > 0 ||
            state.roundState.unlockAnimations.length > 0;

          // Capture snapshot for deferred application
          const snapshotPlayers = msg.players;

          if (hasAnimations) {
            console.log(
              "[useOnlineGame] phase_change deferred:", state.phase, "->", newPhase,
              "anims:", {
                lock: state.roundState.lockAnimations.length,
                aiLock: state.roundState.aiLockAnimations.length,
                unlock: state.roundState.unlockAnimations.length,
                aiUnlock: state.roundState.aiUnlockAnimations.length,
              },
            );
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
                // Apply deferred snapshot now that animations are done
                if (snapshotPlayers) {
                  useGameStore.getState().syncAllPlayerState(snapshotPlayers);
                }
                if (newPhase === 'idle') {
                  s.setLocalPlayerLocked(false);
                  s.setHasSubmittedUnlock(false);
                }
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
                // Apply deferred snapshot
                if (snapshotPlayers) {
                  useGameStore.getState().syncAllPlayerState(snapshotPlayers);
                }
                if (newPhase === 'idle') {
                  s.setLocalPlayerLocked(false);
                  s.setHasSubmittedUnlock(false);
                }
                s.setPhase(newPhase);
              }
            }, 5000);
          } else {
            console.log("[useOnlineGame] phase_change:", state.phase, "->", newPhase);
            // Apply snapshot immediately (no animations blocking)
            if (snapshotPlayers) {
              useGameStore.getState().syncAllPlayerState(snapshotPlayers);
            }
            // Reset buffering flags when cycling back to idle (new roll cycle within same round)
            if (newPhase === 'idle') {
              state.setLocalPlayerLocked(false);
              state.setHasSubmittedUnlock(false);
            }
            state.setPhase(newPhase);
          }
          break;
        }

        case "phase_sync": {
          // Watchdog response: server sent full state snapshot
          const serverPhase = msg.phase as GamePhase;
          const clientPhase = useGameStore.getState().phase;
          console.log(`[WATCHDOG] phase_sync: server="${serverPhase}" client="${clientPhase}"`);

          // Apply player snapshot if present
          if (msg.players) {
            useGameStore.getState().syncAllPlayerState(msg.players);
          }
          // Apply goal values in case round_start was missed
          if (msg.goalValues) {
            useGameStore.getState().setGoalValues(msg.goalValues);
          }

          if (serverPhase !== clientPhase) {
            console.warn(`[WATCHDOG] Phase mismatch — forcing client to "${serverPhase}"`);
            const s = useGameStore.getState();
            // Clear all animation state
            s.clearLockAnimations();
            s.clearAILockAnimations();
            s.clearUnlockAnimations();
            s.clearAIUnlockAnimations();
            // Clear any deferred phase poll
            if (deferredPhaseInterval) { clearInterval(deferredPhaseInterval); deferredPhaseInterval = null; }
            if (deferredPhaseTimeout) { clearTimeout(deferredPhaseTimeout); deferredPhaseTimeout = null; }
            // Reset buffering flags
            s.setLocalPlayerLocked(false);
            s.setHasSubmittedUnlock(false);
            // Force phase
            s.setPhase(serverPhase);
          }
          break;
        }

        case "player_lock_result": {
          // Buffer all lock results (snapshot in next phase_change corrects any desync)
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

        case "rejoin_state": {
          console.log("[useOnlineGame] rejoin_state — restoring game state", {
            phase: msg.phase,
            round: msg.round,
            goalValues: msg.goalValues,
            players: msg.players?.length,
          });

          const store = useGameStore.getState();

          // Apply goal values (in case round changed while disconnected)
          if (msg.goalValues) {
            store.setGoalValues(msg.goalValues);
          }

          // Sync all player states from server snapshot
          if (msg.players) {
            store.syncAllPlayerState(msg.players);
          }

          // Clear ALL animation state (we missed the animations while disconnected)
          store.clearLockAnimations();
          store.clearAILockAnimations();
          store.clearUnlockAnimations();
          store.clearAIUnlockAnimations();

          // Clear any deferred phase polling
          if (deferredPhaseInterval) { clearInterval(deferredPhaseInterval); deferredPhaseInterval = null; }
          if (deferredPhaseTimeout) { clearTimeout(deferredPhaseTimeout); deferredPhaseTimeout = null; }

          // Reset buffering flags
          store.setLocalPlayerLocked(false);
          store.setHasSubmittedUnlock(false);

          // Force phase to match server
          const rejoinPhase = msg.phase as GamePhase;
          if (store.phase !== rejoinPhase) {
            console.log(`[useOnlineGame] rejoin phase sync: "${store.phase}" -> "${rejoinPhase}"`);
            store.setPhase(rejoinPhase);
          }

          // Sync round number — player may have missed entire rounds while disconnected
          store.setCurrentRound(msg.round);

          // Reset watchdog state so it doesn't self-heal based on stale pre-disconnect timing
          lastPhase = rejoinPhase;
          phaseEnteredAt = Date.now();
          watchdogFireCount = 0;

          break;
        }

        case "player_reconnected":
          console.log(`[useOnlineGame] Player reconnected: ${msg.playerName} (${msg.playerId})`);
          window.dispatchEvent(new CustomEvent('player-reconnected', { detail: { name: msg.playerName } }));
          break;

        case "seat_state_changed":
          console.log(`[useOnlineGame] seat_state_changed: ${msg.playerId} → ${msg.seatState}`);
          useGameStore.getState().updatePlayerSeatState(
            msg.playerId,
            msg.seatState,
            msg.seatIndex
          );
          break;

        case "seat_takeover":
          // A mid-game joiner took over a bot seat — update name, ID, seatState
          console.log(`[seat_takeover] ${msg.playerName} took over seat ${msg.seatIndex}`);
          useGameStore.getState().handleSeatTakeover(msg.seatIndex, msg.playerId, msg.playerName);
          break;

        case "game_starting": {
          // Restart: server sent game_starting during an active online session
          console.log("[useOnlineGame] game_starting (restart) — re-initializing game");
          const store = useGameStore.getState();
          const localId = store.onlinePlayerId;
          if (!localId) break;

          const serverPlayers = msg.players as RoomPlayer[];
          const localPlayer = serverPlayers.find((p: RoomPlayer) => p.id === localId);
          const otherPlayers = serverPlayers.filter((p: RoomPlayer) => p.id !== localId);
          const orderedPlayers = [
            ...(localPlayer ? [{ name: localPlayer.name, color: localPlayer.color }] : []),
            ...otherPlayers.map((p: RoomPlayer) => ({ name: p.name, color: p.color })),
          ];

          store.initGame(msg.targetPlayers, orderedPlayers);
          useGameStore.getState().initRound({ goalValues: msg.goalValues });
          useGameStore.getState().setOnlineMode(localId, localPlayer?.isHost ?? false);

          // Rebuild server-to-local player ID mapping
          const serverPlayerIds = [localId, ...otherPlayers.map((p: RoomPlayer) => p.id)];
          const botCount = msg.targetPlayers - serverPlayers.length;
          for (let i = 0; i < botCount; i++) {
            serverPlayerIds.push(`bot-${i}`);
          }
          useGameStore.getState().setOnlinePlayerIds(serverPlayerIds);
          useGameStore.getState().setScreen('game');

          // Pool spawn animation
          const newState = useGameStore.getState();
          const humanPlayer = newState.players[0];
          if (humanPlayer && humanPlayer.poolSize > 0) {
            const spawnPositions = getSpawnPositions(humanPlayer.poolSize);
            useGameStore.getState().setPoolSpawning(true, spawnPositions);
            const spawnDuration = 600 + humanPlayer.poolSize * 80 + 100;
            setTimeout(() => useGameStore.getState().setPoolSpawning(false), spawnDuration);
          }
          break;
        }
      }
    };

    socket.addEventListener("message", handler);
    return () => {
      socket.removeEventListener("message", handler);
      if (deferredPhaseInterval) clearInterval(deferredPhaseInterval);
      if (deferredPhaseTimeout) clearTimeout(deferredPhaseTimeout);
      if (watchdogInterval) clearInterval(watchdogInterval);
    };
  }, [isOnlineGame]);

  // Action senders
  const sendUnlockRequest = useCallback((slotIndices: number[]) => {
    const socket = getGameSocket();
    if (!socket) {
      console.warn("[useOnlineGame] sendUnlockRequest: no socket");
      return;
    }
    const afk = !!(window as unknown as Record<string, boolean>).__rbAfkUnlock;
    (window as unknown as Record<string, boolean>).__rbAfkUnlock = false;
    sendMessage(socket, { type: "unlock_request", slotIndices, afk });
  }, []);

  const sendSkipUnlock = useCallback(() => {
    const socket = getGameSocket();
    if (!socket) {
      console.warn("[useOnlineGame] sendSkipUnlock: no socket");
      return;
    }
    const afk = !!(window as unknown as Record<string, boolean>).__rbAfkUnlock;
    (window as unknown as Record<string, boolean>).__rbAfkUnlock = false;
    sendMessage(socket, { type: "skip_unlock", afk });
  }, []);

  // Early return for offline games
  if (!isOnlineGame) return offlineReturn;

  return {
    sendUnlockRequest,
    sendSkipUnlock,
  };
}
