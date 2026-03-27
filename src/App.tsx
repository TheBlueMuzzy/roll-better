import { useRef, useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import type { SceneHandle } from './components/Scene';
import { MainMenu } from './components/MainMenu';
import { WinnersScreen } from './components/WinnersScreen';
import { HUD } from './components/HUD';
import { Settings } from './components/Settings';
import { HowToPlay } from './components/HowToPlay';
import { TipBanner } from './components/TipBanner';
import { TouchIndicator } from './components/TouchIndicator';
import { useGameStore, shouldShowTip } from './store/gameStore';
import { getGameSocket, setGameSocket, sendMessage } from './utils/partyClient';
import { useOnlineGame } from './hooks/useOnlineGame';
import { getSlotX, PROFILE_X_OFFSET } from './components/GoalRow';
import { DIE_SIZE } from './components/RollingArea';
import { getSpawnPositions } from './components/DicePool';
import { findClearSpot } from './utils/clearSpot';
import { initAudio, setVolume, playWinFanfare, playRoundStart, playNoMatch } from './utils/soundManager';
import type { UnlockAnimation, AIUnlockAnimation } from './types/game';
import type { RoomPlayer } from './types/protocol';
import { getAIUnlockDecision } from './utils/aiDecision';
import versionData from '../version.json';
import './App.css';

function App() {
  const version = `v${versionData.version}.${versionData.build}`;
  const sceneRef = useRef<SceneHandle>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [activeTip, setActiveTip] = useState<{ id: string; text: string } | null>(null);
  const isOnlineDisconnected = useGameStore((s) => s.isOnlineDisconnected);
  const [reconnectToast, setReconnectToast] = useState<string | null>(null);

  const audioInited = useRef(false);
  const showTip = useGameStore((s) => s.showTip);

  /** Try to show a tip — only if tips enabled, not already shown, and no tip currently active */
  const tryShowTip = useCallback((id: string, text: string) => {
    if (activeTip) return; // one tip at a time
    if (!shouldShowTip(id)) return;
    showTip(id);
    setActiveTip({ id, text });
  }, [activeTip, showTip]);

  const screen = useGameStore((s) => s.screen);
  const setScreen = useGameStore((s) => s.setScreen);
  const phase = useGameStore((s) => s.phase);
  const setPhase = useGameStore((s) => s.setPhase);
  const initGame = useGameStore((s) => s.initGame);
  const initRound = useGameStore((s) => s.initRound);
  const setRollResults = useGameStore((s) => s.setRollResults);
  const scoreRound = useGameStore((s) => s.scoreRound);
  const applyHandicap = useGameStore((s) => s.applyHandicap);
  const checkWinner = useGameStore((s) => s.checkWinner);
  const checkSessionEnd = useGameStore((s) => s.checkSessionEnd);
  const setGoalTransition = useGameStore((s) => s.setGoalTransition);
  const setPoolExiting = useGameStore((s) => s.setPoolExiting);
  const setPoolSpawning = useGameStore((s) => s.setPoolSpawning);

  // Online game hook — message routing + action senders
  const { sendUnlockRequest, sendSkipUnlock } = useOnlineGame();

  // Read online mode flag (used by phase useEffects, handleRoll, handleConfirmUnlock)
  const isOnlineGame = useGameStore((s) => s.isOnlineGame);

  // Performance settings
  const performanceMode = useGameStore((s) => s.settings.performanceMode);

  // Bot takeover: if local player is promoted to bot, return to main menu
  const localSeatState = useGameStore((s) => s.players[0]?.seatState);
  useEffect(() => {
    if (!isOnlineGame || !localSeatState) return;
    if (localSeatState === 'bot') {
      console.log('[App] Local player promoted to bot — returning to main menu');
      // Clean up online connection
      const socket = getGameSocket();
      if (socket) {
        sendMessage(socket, { type: "leave" });
        socket.close();
      }
      useGameStore.getState().clearOnlineMode();
      setGameSocket(null);
      setPhase('idle');
      setScreen('menu');
    }
  }, [localSeatState, isOnlineGame, setPhase, setScreen]);

  // Reconnect toast listener
  useEffect(() => {
    const handler = (e: Event) => {
      const name = (e as CustomEvent).detail.name;
      setReconnectToast(`${name} reconnected`);
      setTimeout(() => setReconnectToast(null), 3000);
    };
    window.addEventListener('player-reconnected', handler);
    return () => window.removeEventListener('player-reconnected', handler);
  }, []);

  // Audio volume — sync to SoundManager whenever it changes
  const audioVolume = useGameStore((s) => s.settings.audioVolume);
  useEffect(() => {
    setVolume(audioVolume);
  }, [audioVolume]);

  // Tip-related store reads
  const currentRound = useGameStore((s) => s.currentRound);
  const rollNumber = useGameStore((s) => s.roundState.rollNumber);
  const lastLockCount = useGameStore((s) => s.roundState.lastLockCount);
  const shownTips = useGameStore((s) => s.shownTips);
  const playerPoolSize = useGameStore((s) => s.players[0]?.poolSize ?? 0);
  const playerLockedCount = useGameStore((s) => s.players[0]?.lockedDice.length ?? 0);

  // Play button handler — called from MainMenu
  const handlePlay = useCallback((playerCount: number) => {
    initGame(playerCount);
    initRound();
    setScreen('game');
    // Start pool spawn animation
    const state = useGameStore.getState();
    const humanPlayer = state.players[0];
    if (humanPlayer && humanPlayer.poolSize > 0) {
      const spawnPositions = getSpawnPositions(humanPlayer.poolSize);
      setPoolSpawning(true, spawnPositions);
      const spawnDuration = 600 + humanPlayer.poolSize * 80 + 100;
      setTimeout(() => setPoolSpawning(false), spawnDuration);
    }
  }, [initGame, initRound, setScreen, setPoolSpawning]);

  // Play Again handler — replay with stored game preferences
  const handlePlayAgain = useCallback(() => {
    // Online: send play_again to server, return to lobby/menu
    if (isOnlineGame) {
      const socket = getGameSocket();
      if (socket) {
        sendMessage(socket, { type: "play_again" });
      }
      setScreen('menu'); // Return to main menu where lobby renders
      return; // useRoom will handle play_again_ack and lobby/mid-game-join flow
    }

    // Offline: initialize locally
    const { gamePrefs } = useGameStore.getState();
    initGame(gamePrefs.playerCount);
    initRound();
    setScreen('game');
    // Start pool spawn animation (same as handlePlay)
    const newState = useGameStore.getState();
    const humanPlayer = newState.players[0];
    if (humanPlayer && humanPlayer.poolSize > 0) {
      const spawnPositions = getSpawnPositions(humanPlayer.poolSize);
      setPoolSpawning(true, spawnPositions);
      const spawnDuration = 600 + humanPlayer.poolSize * 80 + 100;
      setTimeout(() => setPoolSpawning(false), spawnDuration);
    }
  }, [isOnlineGame, initGame, initRound, setScreen, setPoolSpawning]);

  // Menu handler — return to main menu (reset phase to avoid stale sessionEnd)
  const handleMenu = useCallback(() => {
    // Send intentional "leave" so server can distinguish from network drop
    const socket = getGameSocket();
    if (socket) {
      sendMessage(socket, { type: "leave" });
      socket.close();
    }
    useGameStore.getState().clearOnlineMode();
    setGameSocket(null);
    setPhase('idle');
    setScreen('menu');
  }, [setPhase, setScreen]);


  // Online game start handler — called from LobbyScreen when game_starting fires
  const handleOnlineGameStart = useCallback((players: RoomPlayer[], targetPlayers: number, goalValues: number[], localPlayerId: string) => {
    // Reorder: local player first, then others (preserving join order)
    const localPlayer = players.find(p => p.id === localPlayerId);
    const otherPlayers = players.filter(p => p.id !== localPlayerId);
    const orderedPlayers = [
      ...(localPlayer ? [{ name: localPlayer.name, color: localPlayer.color }] : []),
      ...otherPlayers.map(p => ({ name: p.name, color: p.color })),
    ];

    initGame(targetPlayers, orderedPlayers);
    initRound({ goalValues }); // Use server-provided goals so all clients match
    useGameStore.getState().setOnlineMode(localPlayerId, localPlayer?.isHost ?? false);

    // Build server-to-local player ID mapping
    // Index in this array = player index in store (local first, then others, then bots)
    const serverPlayerIds = [localPlayerId, ...otherPlayers.map(p => p.id)];
    const botCount = targetPlayers - players.length;
    for (let i = 0; i < botCount; i++) {
      serverPlayerIds.push(`bot-${i}`);
    }
    useGameStore.getState().setOnlinePlayerIds(serverPlayerIds);

    setScreen('game');
    // Start pool spawn animation
    const state = useGameStore.getState();
    const humanPlayer = state.players[0];
    if (humanPlayer && humanPlayer.poolSize > 0) {
      const spawnPositions = getSpawnPositions(humanPlayer.poolSize);
      setPoolSpawning(true, spawnPositions);
      const spawnDuration = 600 + humanPlayer.poolSize * 80 + 100;
      setTimeout(() => setPoolSpawning(false), spawnDuration);
    }
  }, [initGame, initRound, setScreen, setPoolSpawning]);

  // --- Contextual tips ---
  useEffect(() => {
    if (phase === 'idle' && currentRound === 1 && rollNumber === 0) {
      tryShowTip('first-roll', 'Hold the rolling area to gather your dice, then release to roll');
    }
    if (phase === 'locking' && lastLockCount > 0) {
      tryShowTip('first-lock', 'Matched! Dice lock to the Goal row automatically');
    }
    if (phase === 'unlocking') {
      const mustUnlockNow = playerPoolSize === 0 && playerLockedCount < 8;
      if (mustUnlockNow && shownTips.includes('first-unlock')) {
        tryShowTip('must-unlock', 'No dice to roll \u2014 you must unlock at least one');
      } else {
        tryShowTip('first-unlock', 'Tap locked dice to select, then press UNLOCK');
      }
    }
  }, [phase, currentRound, rollNumber, lastLockCount, playerPoolSize, playerLockedCount, shownTips, tryShowTip]);

  // After locking phase, show lock count for 1s then check for winner or go to unlocking
  useEffect(() => {
    if (phase === 'locking') {
      // Play "no match" sound when no new locks found
      if (lastLockCount === 0) {
        playNoMatch();
      }

      // Online: server drives phase transitions — don't use local timer
      if (isOnlineGame) return;

      // Offline: local 1s timer
      const timer = setTimeout(() => {
        // Check if someone completed all 8 locks
        if (checkWinner()) {
          scoreRound();
          // scoreRound sets phase to 'scoring'
        } else {
          setPhase('unlocking');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [phase, setPhase, checkWinner, scoreRound, isOnlineGame, lastLockCount]);

  // After scoring, show score for 2s then apply handicap and start next round
  useEffect(() => {
    if (isOnlineGame) return; // Online: server drives scoring (Phase 18)
    if (phase === 'scoring') {
      const timer = setTimeout(() => {
        applyHandicap();
        // applyHandicap sets phase to 'roundEnd'
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase, applyHandicap, isOnlineGame]);

  // After roundEnd: staged goal transition (exit → swap → enter → idle)
  // Pool dice exit animation runs in parallel with goal exit
  // Pool dice spawn animation starts at initRound
  useEffect(() => {
    if (isOnlineGame) return; // Online: server drives round transitions (Phase 18)
    if (phase !== 'roundEnd') return;

    // Check session end immediately — skip animation if game is over
    if (checkSessionEnd()) {
      const t = setTimeout(() => {
        playWinFanfare();
        setPhase('sessionEnd');
        setScreen('winners');
      }, 500);
      return () => clearTimeout(t);
    }

    // Stage 1 (0ms): pool dice pop+shrink + old goal dice exit (in parallel)
    setPoolExiting(true);
    setGoalTransition('exiting');

    // Stage 2 (500ms): pool exit done (~0.45s), swap to new round + enter goals + spawn pool dice
    // initRound clears poolExiting via roundState reset
    const t1 = setTimeout(() => {
      initRound({ skipPhase: true }); // new goals, players reset, poolExiting=false
      setGoalTransition('entering');

      // Start pool spawn animation: dice fly from avatar to pool positions
      const state = useGameStore.getState();
      const humanPlayer = state.players[0];
      if (humanPlayer && humanPlayer.poolSize > 0) {
        const spawnPositions = getSpawnPositions(humanPlayer.poolSize);
        setPoolSpawning(true, spawnPositions);

        // Spawn duration: 0.6s per die + 0.08s stagger per die
        const spawnDuration = 600 + humanPlayer.poolSize * 80 + 100; // +100ms buffer
        setTimeout(() => {
          setPoolSpawning(false);
        }, spawnDuration);
      }
    }, 500);

    // Stage 3 (1500ms): settle goal transition and go idle
    // Extended to 2000ms to accommodate spawn animation for larger pool sizes
    const t2 = setTimeout(() => {
      setGoalTransition('none');
      // Ensure spawning is cleared before going idle
      setPoolSpawning(false);
      playRoundStart();
      setPhase('idle');
    }, 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [phase, checkSessionEnd, setPhase, setScreen, initRound, setGoalTransition, setPoolExiting, setPoolSpawning, isOnlineGame]);

  // Compute and start AI unlock animations, then apply state after they finish
  const startAIUnlockAnimations = useCallback(() => {
    const state = useGameStore.getState();
    const aiAnimations: AIUnlockAnimation[] = [];
    let animDelay = 0;

    for (let i = 1; i < state.players.length; i++) {
      const aiPlayer = state.players[i];
      if (!aiPlayer.isAI || !aiPlayer.difficulty) continue;
      if (aiPlayer.lockedDice.length === 0) continue;
      if (aiPlayer.lockedDice.length >= 8) continue;

      const slotsToUnlock = getAIUnlockDecision({
        goalValues: state.roundState.goalValues,
        lockedDice: aiPlayer.lockedDice,
        poolSize: aiPlayer.poolSize,
        difficulty: aiPlayer.difficulty,
      });

      if (slotsToUnlock.length === 0) continue;

      const profileX = getSlotX(0) - PROFILE_X_OFFSET;
      const rowZ = -3.75 + i * 1.25;

      for (const slotIndex of slotsToUnlock) {
        const lockedEntry = aiPlayer.lockedDice.find((ld) => ld.goalSlotIndex === slotIndex);
        if (!lockedEntry) continue;

        aiAnimations.push({
          playerId: aiPlayer.id,
          slotIndex,
          value: lockedEntry.value,
          fromPos: [getSlotX(slotIndex), DIE_SIZE / 2, rowZ],
          toPos: [profileX, 0, rowZ],
          delay: animDelay,
        });
        animDelay += 0.15 + Math.random() * 0.15;
      }

      console.log(
        `[startAIUnlockAnimations AI-${i}] unlocking slots=[${slotsToUnlock}] pool: ${aiPlayer.poolSize} → ${aiPlayer.poolSize + slotsToUnlock.length * 2}`,
      );
    }

    if (aiAnimations.length > 0) {
      // Store animations so Scene can render them
      useGameStore.getState().setAIUnlockAnimations(aiAnimations);

      // Wait for last animation's delay + animation duration (0.5s) + buffer
      const lastDelay = aiAnimations[aiAnimations.length - 1].delay;
      const totalWait = (lastDelay * 1000) + 600;
      setTimeout(() => {
        useGameStore.getState().processAIUnlocks();
        useGameStore.getState().clearAIUnlockAnimations();
        setPhase('idle');
      }, totalWait);
    } else {
      // No AI unlocks — apply state immediately and go to idle
      useGameStore.getState().processAIUnlocks();
      setPhase('idle');
    }
  }, [setPhase]);

  // UNLOCK button: process unlocks with mitosis animation, then go to idle
  const handleConfirmUnlock = useCallback(() => {
    const state = useGameStore.getState();
    if (state.phase !== 'unlocking') return;

    // Guard: ignore if animation is already in progress
    if (state.roundState.unlockAnimations.length > 0) return;
    if (state.roundState.aiUnlockAnimations.length > 0) return;

    const player = state.players[0];
    const mustUnlock = player.poolSize === 0 && player.lockedDice.length < 8;

    if (isOnlineGame && !state.hasSubmittedUnlock) {
      // Only send to server if not already submitted (AFK auto-unlock sets this before triggering)
      if (player.selectedForUnlock.length > 0) {
        // Send to server immediately (server waits for all)
        sendUnlockRequest(player.selectedForUnlock);
        // Mark as submitted so HUD shows "Waiting..." and prevents re-interaction
        useGameStore.getState().setHasSubmittedUnlock(true);
        // Fall through to the animated path below (same as offline)
      } else if (mustUnlock) {
        return; // Can't skip — must select at least 1
      } else {
        sendSkipUnlock();
        useGameStore.getState().skipUnlock(0);
        useGameStore.getState().setHasSubmittedUnlock(true);
        return; // Skip path: no animation, just wait for server
      }
    }

    if (player.selectedForUnlock.length > 0) {
      // --- ANIMATED PATH: mitosis animation before state change ---
      const selectedSlots = [...player.selectedForUnlock];
      const lockedDice = player.lockedDice;
      const existingPoolPositions = [...state.roundState.remainingDicePositions];

      // Build occupied list: current pool dice positions
      const occupied: [number, number, number][] = [...existingPoolPositions];

      const allAnimations: UnlockAnimation[] = [];

      for (const slotIndex of selectedSlots) {
        // Find the locked die value for this slot
        const lockedEntry = lockedDice.find((ld) => ld.goalSlotIndex === slotIndex);
        if (!lockedEntry) continue;

        // Source position: player row slot
        const fromPos: [number, number, number] = [getSlotX(slotIndex), DIE_SIZE / 2, -3.75];

        // Find a clear spot (avoids existing pool dice + previously computed targets)
        const { targetPos, splitTargets } = findClearSpot(occupied, DIE_SIZE);

        // Add both split targets to occupied so subsequent unlocks don't overlap
        occupied.push(splitTargets[0], splitTargets[1]);

        const DEG30 = (30 * Math.PI) / 180;
        // Stagger: each die starts 250–500ms after the previous
        const prevDelay = allAnimations.length > 0
          ? allAnimations[allAnimations.length - 1].delay
          : 0;
        const delay = allAnimations.length === 0
          ? 0
          : prevDelay + (0.25 + Math.random() * 0.25);

        allAnimations.push({
          slotIndex,
          value: lockedEntry.value,
          fromPos,
          targetPos,
          splitTargets,
          splitYRotations: [
            (Math.random() * 2 - 1) * DEG30,
            (Math.random() * 2 - 1) * DEG30,
          ],
          delay,
        });
      }

      // Trigger animations
      useGameStore.getState().setUnlockAnimations(allAnimations);

      // Wait for last animation's delay + full animation duration (1.7s) + buffer
      const lastDelay = allAnimations.length > 0
        ? allAnimations[allAnimations.length - 1].delay
        : 0;
      const totalWait = (lastDelay * 1000) + 1800;
      setTimeout(() => {
        useGameStore.getState().confirmUnlock(0);
        useGameStore.getState().clearUnlockAnimations();
        // Online: server handles AI unlocks and phase transition
        if (!isOnlineGame) {
          startAIUnlockAnimations();
        }
      }, totalWait);

    } else if (mustUnlock) {
      // Can't skip — player has 0 dice to roll, must unlock at least 1
      return;
    } else {
      // SKIP path: no human animation, start AI unlock animations immediately
      useGameStore.getState().skipUnlock(0);
      startAIUnlockAnimations();
    }
  }, [setPhase, startAIUnlockAnimations, isOnlineGame, sendUnlockRequest, sendSkipUnlock]);

  // AFK auto-unlock: server chose slots for us — trigger same animation pipeline as manual unlock
  const pendingAfkUnlock = useGameStore((s) => s.pendingAfkUnlock);
  useEffect(() => {
    if (!pendingAfkUnlock) return;
    // Mark as submitted so handleConfirmUnlock skips sending to server (already processed)
    useGameStore.getState().setHasSubmittedUnlock(true);
    useGameStore.getState().clearPendingAfkUnlock();
    // Small delay to let React render the selectedForUnlock state first
    setTimeout(() => handleConfirmUnlock(), 50);
  }, [pendingAfkUnlock, handleConfirmUnlock]);

  // AFK auto-roll: programmatic roll with rollAll (lift + impulse + torque).
  // Used by HUD idle timeout when player hasn't started gathering.
  const handleRoll = useCallback(() => {
    if (useGameStore.getState().phase !== 'idle') return;

    // Init audio on first user interaction (autoplay policy)
    if (!audioInited.current) {
      audioInited.current = true;
      initAudio();
      setVolume(useGameStore.getState().settings.audioVolume);
    }

    // No sendRollRequest — values are sent after physics settle (Scene.tsx)
    setPhase('rolling');
    sceneRef.current?.rollAll(); // Visual physics animation (both modes)
  }, [setPhase]);

  const handleRollStart = useCallback(() => {
    if (useGameStore.getState().phase !== 'idle') return;

    // Init audio on first user interaction (autoplay policy)
    if (!audioInited.current) {
      audioInited.current = true;
      initAudio();
      setVolume(useGameStore.getState().settings.audioVolume);
    }

    setPhase('rolling');
  }, [setPhase]);

  // AFK mid-gather: force-release dice via Scene imperative handle
  const handleForceRelease = useCallback(() => {
    sceneRef.current?.forceRelease();
  }, []);

  const handleResults = useCallback(
    (results: number[]) => {
      setRollResults(results);
    },
    [setRollResults],
  );

  // Game container visible when not on menu
  const gameVisible = screen === 'game' || screen === 'winners';

  // Camera FOV: 55° for landscape 16:9 — shows full game board width
  const fov = 55;

  return (
    <>
      <MainMenu visible={screen === 'menu'} onPlay={handlePlay} onGameStart={handleOnlineGameStart} onOpenHowToPlay={() => setHowToPlayOpen(true)} onOpenSettings={() => setSettingsOpen(true)} />
      {gameVisible && (
        <div className={`game-container${gameVisible ? ' game-visible' : ''}`}>
          <Canvas
            shadows={performanceMode === 'advanced'}
            dpr={performanceMode === 'simple' ? 1 : [1, 2]}
            camera={{ position: [0, 12, 0.01], fov: fov }}
            gl={{ antialias: true }}
          >
            <Scene
              ref={sceneRef}
              onRollStart={handleRollStart}
              onResults={handleResults}
            />
          </Canvas>
          <HUD
            onRoll={handleRoll}
            onForceRelease={handleForceRelease}
            onConfirmUnlock={handleConfirmUnlock}
            onOpenSettings={() => setSettingsOpen(true)}
          />
          {activeTip && !settingsOpen && (
            <TipBanner text={activeTip.text} onDismiss={() => setActiveTip(null)} />
          )}
          {isOnlineDisconnected && (
            <div className="connection-overlay">
              <div className="connection-overlay-content">
                <div className="connection-spinner" />
                <span>Reconnecting...</span>
              </div>
            </div>
          )}
          {reconnectToast && (
            <div className="reconnect-toast">{reconnectToast}</div>
          )}
        </div>
      )}
      {screen === 'winners' && (
        <WinnersScreen visible={screen === 'winners'} onPlayAgain={handlePlayAgain} onMenu={handleMenu} />
      )}
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} onUnstick={() => sceneRef.current?.unstickAll()} />
      {howToPlayOpen && <HowToPlay onClose={() => setHowToPlayOpen(false)} />}
      <TouchIndicator />
      <div className="build-version">{version}</div>
    </>
  );
}

export default App;
