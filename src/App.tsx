import { useRef, useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import type { SceneHandle } from './components/Scene';
import { HUD } from './components/HUD';
import { Settings } from './components/Settings';
import { HowToPlay } from './components/HowToPlay';
import { TipBanner } from './components/TipBanner';
import { useGameStore, shouldShowTip } from './store/gameStore';
import { getSlotX } from './components/GoalRow';
import { DIE_SIZE } from './components/RollingArea';
import { findClearSpot } from './utils/clearSpot';
import { getAIUnlockDecision } from './utils/aiDecision';
import type { UnlockAnimation } from './types/game';
import versionData from '../version.json';
import './App.css';

function App() {
  const version = `v${versionData.version}.${versionData.build}`;
  const sceneRef = useRef<SceneHandle>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [activeTip, setActiveTip] = useState<{ id: string; text: string } | null>(null);

  const showTip = useGameStore((s) => s.showTip);

  /** Try to show a tip — only if tips enabled, not already shown, and no tip currently active */
  const tryShowTip = useCallback((id: string, text: string) => {
    if (activeTip) return; // one tip at a time
    if (!shouldShowTip(id)) return;
    showTip(id);
    setActiveTip({ id, text });
  }, [activeTip, showTip]);

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
  const advanceTurn = useGameStore((s) => s.advanceTurn);
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex);
  const currentPlayer = useGameStore((s) => s.players[s.currentPlayerIndex]);
  const isAI = currentPlayer?.isAI ?? false;

  // Tip-related store reads
  const currentRound = useGameStore((s) => s.currentRound);
  const rollNumber = useGameStore((s) => s.roundState.rollNumber);
  const lastLockCount = useGameStore((s) => s.roundState.lastLockCount);
  const shownTips = useGameStore((s) => s.shownTips);
  const playerPoolSize = useGameStore((s) => s.players[s.currentPlayerIndex]?.poolSize ?? 0);
  const playerLockedCount = useGameStore((s) => s.players[s.currentPlayerIndex]?.lockedDice.length ?? 0);

  // Initialize game on mount
  useEffect(() => {
    initGame(2, 'medium');
    initRound();
  }, [initGame, initRound]);

  // --- Contextual tips (human turns only) ---
  useEffect(() => {
    if (isAI) return; // Tips only during human player turns
    if (phase === 'idle' && currentRound === 1 && rollNumber === 0) {
      tryShowTip('first-roll', 'Tap anywhere to roll your dice');
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
  }, [phase, isAI, currentRound, rollNumber, lastLockCount, playerPoolSize, playerLockedCount, shownTips, tryShowTip]);

  // After locking phase, show lock count for 1s then check for winner or go to unlocking
  useEffect(() => {
    if (phase === 'locking') {
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
  }, [phase, setPhase, checkWinner, scoreRound]);

  // After scoring, show score for 2s then check if more players need to go
  useEffect(() => {
    if (phase === 'scoring') {
      const timer = setTimeout(() => {
        const state = useGameStore.getState();
        const nextIndex = state.currentPlayerIndex + 1;
        if (nextIndex < state.players.length) {
          // More players still need to take their turn this round
          advanceTurn();
        } else {
          // All players done — apply handicap (sets phase to 'roundEnd')
          applyHandicap();
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase, applyHandicap, advanceTurn]);

  // --- AI auto-roll: when it's an AI player's turn and phase is idle ---
  useEffect(() => {
    if (phase !== 'idle' || !isAI) return;
    const delay = 800 + Math.random() * 400; // 800-1200ms
    const timer = setTimeout(() => {
      // Guard: phase may have changed during the delay
      if (useGameStore.getState().phase !== 'idle') return;
      setPhase('rolling');
      sceneRef.current?.rollAll();
    }, delay);
    return () => clearTimeout(timer);
  }, [phase, isAI, setPhase]);

  // --- AI auto-unlock: when it's an AI player's turn and phase is unlocking ---
  useEffect(() => {
    if (phase !== 'unlocking' || !isAI) return;
    const delay = 600 + Math.random() * 400; // 600-1000ms
    const timer = setTimeout(() => {
      const state = useGameStore.getState();
      // Guard: phase may have changed
      if (state.phase !== 'unlocking') return;

      const aiPlayer = state.players[state.currentPlayerIndex];
      const decision = getAIUnlockDecision({
        goalValues: state.roundState.goalValues,
        lockedDice: aiPlayer.lockedDice,
        poolSize: aiPlayer.poolSize,
        difficulty: aiPlayer.difficulty ?? 'medium',
      });

      if (decision.length > 0) {
        // Select the slots the AI decided to unlock
        for (const slotIndex of decision) {
          useGameStore.getState().toggleUnlockSelection(state.currentPlayerIndex, slotIndex);
        }
        // Run the animated unlock flow (reuse handleConfirmUnlock logic)
        // Need to re-read state after selections
        const updatedState = useGameStore.getState();
        const player = updatedState.players[updatedState.currentPlayerIndex];
        const selectedSlots = [...player.selectedForUnlock];
        const lockedDice = player.lockedDice;
        const existingPoolPositions = [...updatedState.roundState.remainingDicePositions];
        const occupied: [number, number, number][] = [...existingPoolPositions];
        const allAnimations: UnlockAnimation[] = [];

        for (const slotIndex of selectedSlots) {
          const lockedEntry = lockedDice.find((ld) => ld.goalSlotIndex === slotIndex);
          if (!lockedEntry) continue;
          const fromPos: [number, number, number] = [getSlotX(slotIndex), DIE_SIZE / 2, -3.77];
          const { targetPos, splitTargets } = findClearSpot(occupied, DIE_SIZE);
          occupied.push(splitTargets[0], splitTargets[1]);
          const DEG30 = (30 * Math.PI) / 180;
          const prevDelay = allAnimations.length > 0
            ? allAnimations[allAnimations.length - 1].delay
            : 0;
          const animDelay = allAnimations.length === 0
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
            delay: animDelay,
          });
        }

        useGameStore.getState().setUnlockAnimations(allAnimations);

        const lastDelay = allAnimations.length > 0
          ? allAnimations[allAnimations.length - 1].delay
          : 0;
        const totalWait = (lastDelay * 1000) + 1800;
        setTimeout(() => {
          const s = useGameStore.getState();
          useGameStore.getState().confirmUnlock(s.currentPlayerIndex);
          useGameStore.getState().clearUnlockAnimations();
          setPhase('idle');
        }, totalWait);
      } else {
        // AI decides not to unlock — skip
        useGameStore.getState().skipUnlock(state.currentPlayerIndex);
        setPhase('idle');
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [phase, isAI, setPhase]);

  // After roundEnd: staged goal transition (exit → swap → enter → idle)
  useEffect(() => {
    if (phase !== 'roundEnd') return;

    // Check session end immediately — skip animation if game is over
    if (checkSessionEnd()) {
      const timer = setTimeout(() => setPhase('sessionEnd'), 500);
      return () => clearTimeout(timer);
    }

    // Stage 1: old goal dice exit (roll off right)
    setGoalTransition('exiting');

    // Stage 2: after 500ms, swap to new round goals + start enter animation
    const t1 = setTimeout(() => {
      initRound({ skipPhase: true }); // new goals, players reset, but stay in roundEnd
      setGoalTransition('entering');
    }, 500);

    // Stage 3: after 1500ms total, settle and go idle
    const t2 = setTimeout(() => {
      setGoalTransition('none');
      setPhase('idle');
    }, 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [phase, checkSessionEnd, setPhase, initRound, setGoalTransition]);

  // UNLOCK button: process unlocks with mitosis animation, then go to idle
  const handleConfirmUnlock = useCallback(() => {
    const state = useGameStore.getState();
    if (state.phase !== 'unlocking') return;

    // Guard: ignore if animation is already in progress
    if (state.roundState.unlockAnimations.length > 0) return;

    const player = state.players[state.currentPlayerIndex];
    const mustUnlock = player.poolSize === 0 && player.lockedDice.length < 8;

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
        const fromPos: [number, number, number] = [getSlotX(slotIndex), DIE_SIZE / 2, -3.77];

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
        const s = useGameStore.getState();
        s.confirmUnlock(s.currentPlayerIndex);
        s.clearUnlockAnimations();
        setPhase('idle');
      }, totalWait);

    } else if (mustUnlock) {
      // Can't skip — player has 0 dice to roll, must unlock at least 1
      return;
    } else {
      // SKIP path: no animation, immediate
      const s = useGameStore.getState();
      s.skipUnlock(s.currentPlayerIndex);
      setPhase('idle');
    }
  }, [setPhase]);

  // Tap to Roll: only works during idle and human player's turn
  const handleRoll = useCallback(() => {
    const state = useGameStore.getState();
    if (state.phase !== 'idle') return;
    if (state.players[state.currentPlayerIndex]?.isAI) return; // AI rolls automatically

    setPhase('rolling');
    sceneRef.current?.rollAll();
  }, [setPhase]);

  const handleRollStart = useCallback(() => {
    setPhase('rolling');
  }, [setPhase]);

  const handleResults = useCallback(
    (results: number[]) => {
      setRollResults(results);
    },
    [setRollResults],
  );

  return (
    <>
      <Canvas
        shadows
        camera={{ position: [0, 12, 0.01], fov: 50 }}
        gl={{ antialias: true }}
      >
        <Scene
          ref={sceneRef}
          onRollStart={handleRollStart}
          onResults={handleResults}
          onRoll={handleRoll}
        />
      </Canvas>
      <HUD onRoll={handleRoll} onConfirmUnlock={handleConfirmUnlock} onOpenSettings={() => setSettingsOpen(true)} />
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} onOpenHowToPlay={() => setHowToPlayOpen(true)} />
      {howToPlayOpen && <HowToPlay onClose={() => setHowToPlayOpen(false)} />}
      {activeTip && !settingsOpen && (
        <TipBanner text={activeTip.text} onDismiss={() => setActiveTip(null)} />
      )}
      <div className="build-version">{version}</div>
    </>
  );
}

export default App;
