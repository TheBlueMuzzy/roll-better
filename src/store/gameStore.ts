import { create } from 'zustand';
import type { GamePhase, GameState, GamePrefs, LockedDie, LockAnimation, UnlockAnimation, AIUnlockAnimation, Settings, AIDifficulty } from '../types/game';
import type { PlayerRollResult, UnlockResultMessage } from '../types/protocol';
import { Euler, Quaternion } from 'three';
import { findAutoLocks } from '../utils/matchDetection';
import { getFaceUpRotation } from '../utils/diceUtils';
import { getSlotX, PROFILE_X_OFFSET } from '../components/GoalRow';
import { DIE_SIZE } from '../components/RollingArea';
import { getAIUnlockDecision } from '../utils/aiDecision';

// Player colors — defined here to avoid circular dependency with Die3D
export const PLAYER_COLORS = [
  '#e74c3c', // red
  '#3498db', // blue
  '#2ecc71', // green
  '#f1c40f', // yellow
  '#9b59b6', // purple
  '#e67e22', // orange
  '#e91e8f', // pink
  '#1abc9c', // cyan
];

interface GameStore extends GameState {
  // Existing actions
  reset: () => void;
  setScreen: (screen: GameState['screen']) => void;
  setPhase: (phase: GamePhase) => void;

  // Game setup
  initGame: (playerCount: number, aiDifficulty?: AIDifficulty, onlinePlayers?: { name: string; color: string }[]) => void;
  initRound: (options?: { skipPhase?: boolean; goalValues?: number[] }) => void;

  // Goal transition
  setGoalTransition: (state: 'none' | 'exiting' | 'entering') => void;

  // Pool animations
  setPoolExiting: (exiting: boolean) => void;
  setPoolSpawning: (spawning: boolean, positions?: [number, number, number][]) => void;

  // Rolling & locking
  setRollResults: (results: number[], positions?: [number, number, number][], rotations?: [number, number, number][]) => void;
  lockDice: (playerIndex: number, locks: LockedDie[]) => void;
  clearLockAnimations: () => void;
  clearAILockAnimations: () => void;

  // Unlocking
  toggleUnlockSelection: (playerIndex: number, goalSlotIndex: number) => void;
  confirmUnlock: (playerIndex: number) => void;
  skipUnlock: (playerIndex: number) => void;
  setUnlockAnimations: (anims: UnlockAnimation[]) => void;
  clearUnlockAnimations: () => void;

  // Scoring & progression
  scoreRound: () => void;
  applyHandicap: () => void;
  checkWinner: () => boolean;
  checkSessionEnd: () => boolean;

  // AI
  processAIUnlocks: () => void;
  setAIUnlockAnimations: (anims: AIUnlockAnimation[]) => void;
  clearAIUnlockAnimations: () => void;

  // Tips
  showTip: (tipId: string) => void;

  // Game preferences
  setGamePrefs: (prefs: Partial<GamePrefs>) => void;

  // Settings
  setAudioVolume: (volume: number) => void;
  setPerformanceMode: (mode: Settings['performanceMode']) => void;
  setShakeToRollEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setTipsEnabled: (enabled: boolean) => void;
  setConfirmationEnabled: (enabled: boolean) => void;

  // Online mode
  setOnlineMode: (playerId: string) => void;
  clearOnlineMode: () => void;
  setOnlinePlayerIds: (ids: string[]) => void;
  applyOnlineUnlockResult: (playerId: string, unlockedSlots: number[], newPoolSize: number, serverLockedDice: { goalSlotIndex: number; value: number }[]) => void;

  // Pending server data (online game sync)
  pendingServerResults: PlayerRollResult[] | null;
  setPendingServerResults: (results: PlayerRollResult[] | null) => void;
  pendingUnlockResult: UnlockResultMessage | null;
  setPendingUnlockResult: (result: UnlockResultMessage | null) => void;

  // Physics settled data (online game — stores physics positions when they arrive before server results)
  physicsSettledData: { positions: [number, number, number][]; rotations: [number, number, number][] } | null;
  setPhysicsSettledData: (data: { positions: [number, number, number][]; rotations: [number, number, number][] } | null) => void;

  // Online roll results — uses server values + physics positions for lock animations
  applyOnlineRollResults: (physicsPositions: [number, number, number][], physicsRotations: [number, number, number][]) => void;
}

const initialRoundState = {
  goalValues: [],
  rollResults: null,
  rollNumber: 0,
  lastLockCount: 0,
  roundScore: 0,
  pendingNewDice: [] as number[],
  pendingNewDicePositions: [] as [number, number, number][],
  pendingNewDiceRotations: [] as [number, number, number][],
  remainingDiceValues: [] as number[],
  remainingDicePositions: [] as [number, number, number][],
  remainingDiceRotations: [] as [number, number, number][],
  lockAnimations: [] as LockAnimation[],
  animatingSlotIndices: [] as number[],
  aiLockAnimations: [] as LockAnimation[],
  aiAnimatingSlotIndices: {} as Record<string, number[]>,
  unlockAnimations: [] as UnlockAnimation[],
  aiUnlockAnimations: [] as AIUnlockAnimation[],
  goalTransition: 'none' as const,
  poolExiting: false,
  poolSpawning: false,
  poolSpawnPositions: [] as [number, number, number][],
};

const defaultSettings: Settings = {
  audioVolume: 80,
  performanceMode: 'advanced',
  shakeToRollEnabled: true,
  hapticsEnabled: true,
  tipsEnabled: true,
  confirmationEnabled: true,
};

const defaultGamePrefs: GamePrefs = {
  playerCount: 3,
  aiDifficulty: 'medium',
};

const initialState: GameState = {
  screen: 'menu',
  phase: 'lobby',
  players: [],
  currentRound: 0,
  roundState: initialRoundState,
  sessionTargetScore: 20,
  settings: defaultSettings,
  shownTips: [],
  gamePrefs: defaultGamePrefs,
  isOnlineGame: false,
  onlinePlayerId: null,
  onlinePlayerIds: [],
  deferredPhase: null,
};

// --- Internal helpers for online roll results (not exported) ---

type StoreGet = () => GameStore;
type StoreSet = (partial: Partial<GameStore> | ((state: GameStore) => Partial<GameStore>)) => void;

/** Timing barrier: checks if BOTH pendingServerResults AND physicsSettledData are ready.
 *  If both are set, applies the online roll results and clears the staging fields. */
function tryApplyOnlineResults(get: StoreGet, set: StoreSet) {
  const state = get();
  if (state.pendingServerResults && state.physicsSettledData) {
    applyOnlineRollResultsImpl(get, set, state.physicsSettledData.positions, state.physicsSettledData.rotations);
  }
}

/** Core implementation for applyOnlineRollResults — uses server-provided values with physics positions for animations. */
function applyOnlineRollResultsImpl(
  get: StoreGet,
  set: StoreSet,
  physicsPositions: [number, number, number][],
  physicsRotations: [number, number, number][],
) {
  const state = get();
  const serverResults = state.pendingServerResults;
  if (!serverResults) {
    console.warn('[applyOnlineRollResults] No pendingServerResults available');
    return;
  }

  // Find local player's result by onlinePlayerId, fallback to index 0
  const localResult = serverResults.find(r => r.playerId === state.onlinePlayerId)
    || serverResults[0];

  if (!localResult) {
    console.warn('[applyOnlineRollResults] Could not find local player result');
    return;
  }

  const player = state.players[0];
  const players = [...state.players];

  // --- Local human player (index 0): server values + physics positions for lock animations ---
  const serverRolled = localResult.rolled;
  const newLocks = localResult.newLocks; // LockedDieSync — same shape as LockedDie

  // Compute lock animations using physics positions (same pattern as setRollResults)
  let lockAnimations: LockAnimation[] = [];
  let animatingSlotIndices: number[] = [];

  if (physicsPositions.length > 0 && newLocks.length > 0) {
    // Map each lock to its source position in physics results
    const locksByValue = new Map<number, number[]>();
    for (const lock of newLocks) {
      if (!locksByValue.has(lock.value)) locksByValue.set(lock.value, []);
      locksByValue.get(lock.value)!.push(lock.goalSlotIndex);
    }

    for (let i = 0; i < serverRolled.length; i++) {
      const v = serverRolled[i];
      const slots = locksByValue.get(v);
      if (slots && slots.length > 0) {
        const goalSlotIndex = slots.shift()!;
        const prevDelay = lockAnimations.length > 0
          ? lockAnimations[lockAnimations.length - 1].delay
          : 0;
        const delay = lockAnimations.length === 0
          ? 0
          : prevDelay + (0.25 + Math.random() * 0.25);
        lockAnimations.push({
          fromPos: physicsPositions[i] || [0, DIE_SIZE / 2, 0],
          toPos: [getSlotX(goalSlotIndex), DIE_SIZE / 2, -3.77],
          fromRotation: physicsRotations[i] || [0, 0, 0],
          value: v,
          delay,
        });
      }
    }

    animatingSlotIndices = newLocks.map(l => l.goalSlotIndex);
  }

  // Compute remaining dice (dice that stay in pool — same consumption pattern as setRollResults)
  const lockedValueBag = new Map<number, number>();
  for (const lock of newLocks) {
    lockedValueBag.set(lock.value, (lockedValueBag.get(lock.value) || 0) + 1);
  }
  const remainingDiceValues: number[] = [];
  const remainingDicePositions: [number, number, number][] = [];
  const remainingDiceRotations: [number, number, number][] = [];
  for (let i = 0; i < serverRolled.length; i++) {
    const v = serverRolled[i];
    const lockCount = lockedValueBag.get(v) || 0;
    if (lockCount > 0) {
      lockedValueBag.set(v, lockCount - 1);
    } else {
      remainingDiceValues.push(v);
      if (physicsPositions[i]) remainingDicePositions.push(physicsPositions[i]);
      if (physicsRotations[i]) remainingDiceRotations.push(physicsRotations[i]);
    }
  }

  // Update human player with server values
  const updatedPlayer = { ...player };
  updatedPlayer.lockedDice = [...updatedPlayer.lockedDice, ...newLocks];
  updatedPlayer.poolSize = localResult.poolSize;
  players[0] = updatedPlayer;

  console.log(
    `[applyOnlineRollResults] rolled=[${serverRolled}] newLocks=${newLocks.length} ` +
    `pool: ${player.poolSize} → ${localResult.poolSize}`,
  );

  // --- Other players (index 1+): server values + profile-emerge animations ---
  const aiLockAnimations: LockAnimation[] = [];
  const aiAnimatingSlotIndices: Record<string, number[]> = {};
  let aiAnimDelay = 0;

  for (let i = 1; i < players.length; i++) {
    const otherPlayer = players[i];
    // Find this player's result from server
    // Use onlinePlayerIds mapping — client IDs ("player-1") don't match server IDs
    const serverPlayerId = state.onlinePlayerIds[i];
    const otherResult = serverResults.find(r => r.playerId === serverPlayerId);
    if (!otherResult) continue;

    // Update player state from server
    const updatedOther = { ...otherPlayer };
    updatedOther.lockedDice = otherResult.lockedDice;
    updatedOther.poolSize = otherResult.poolSize;
    players[i] = updatedOther;

    // Create lock animations for other players (profile-emerge pattern)
    if (otherResult.newLocks.length > 0) {
      const profileX = getSlotX(0) - PROFILE_X_OFFSET;
      const rowZ = -3.77 + i * 0.9;
      const slotsAnimating: number[] = [];

      for (const lock of otherResult.newLocks) {
        aiLockAnimations.push({
          fromPos: [profileX, DIE_SIZE / 2, rowZ],
          toPos: [getSlotX(lock.goalSlotIndex), DIE_SIZE / 2, rowZ],
          fromRotation: [0, 0, 0],
          value: lock.value,
          delay: aiAnimDelay,
          fromScale: 0,
          toScale: 1,
          playerId: otherPlayer.id,
        });
        slotsAnimating.push(lock.goalSlotIndex);
        aiAnimDelay += 0.25 + Math.random() * 0.25;
      }

      aiAnimatingSlotIndices[otherPlayer.id] = slotsAnimating;
    }

    console.log(
      `[applyOnlineRollResults Player-${i}] locks=${otherResult.newLocks.length} pool: ${otherPlayer.poolSize} → ${updatedOther.poolSize}`,
    );
  }

  // Final state update
  set({
    players,
    phase: 'locking',
    roundState: {
      ...state.roundState,
      rollResults: serverRolled,
      rollNumber: state.roundState.rollNumber + 1,
      lastLockCount: newLocks.length,
      pendingNewDice: [],
      pendingNewDicePositions: [],
      pendingNewDiceRotations: [],
      remainingDiceValues,
      remainingDicePositions,
      remainingDiceRotations,
      lockAnimations,
      animatingSlotIndices,
      aiLockAnimations,
      aiAnimatingSlotIndices,
    },
    pendingServerResults: null,
    physicsSettledData: null,
  });

  // Check for deferred phase change (server sent phase_change while physics were still settling)
  const deferred = get().deferredPhase;
  if (deferred) {
    console.log('[applyOnlineRollResults] Applying deferred phase change:', deferred, '(after 1s for lock animation)');
    setTimeout(() => {
      set({ phase: deferred, deferredPhase: null });
    }, 1000);
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,
  pendingServerResults: null,
  pendingUnlockResult: null,
  physicsSettledData: null,

  reset: () => set({ ...initialState, settings: get().settings, gamePrefs: get().gamePrefs }),

  setScreen: (screen) => set({ screen }),

  setPhase: (phase) => set({ phase }),

  initGame: (playerCount: number, aiDifficulty: AIDifficulty = 'medium', onlinePlayers?: { name: string; color: string }[]) => {
    // onlinePlayers: ordered array from lobby (local player first, then others).
    // Indices 0..onlinePlayers.length-1 use lobby names/colors.
    // Remaining slots filled with AI bots using unused colors.
    const onlineCount = onlinePlayers?.length ?? 0;
    const usedColors = new Set(onlinePlayers?.map(p => p.color) ?? []);
    const botColors = PLAYER_COLORS.filter(c => !usedColors.has(c));
    let botIdx = 0;

    const players = Array.from({ length: playerCount }, (_, i) => {
      if (onlinePlayers && i < onlineCount) {
        // Online player (index 0 = local human, others = AI locally until Phase 16)
        return {
          id: `player-${i}`,
          name: onlinePlayers[i].name,
          color: onlinePlayers[i].color,
          score: 0,
          startingDice: 2,
          poolSize: 2,
          lockedDice: [] as LockedDie[],
          selectedForUnlock: [] as number[],
          isAI: i !== 0,
          difficulty: i !== 0 ? aiDifficulty : undefined,
        };
      }
      // AI bot filling remaining slots
      const color = botColors[botIdx % botColors.length];
      botIdx++;
      return {
        id: `player-${i}`,
        name: `Bot ${botIdx}`,
        color,
        score: 0,
        startingDice: 2,
        poolSize: 2,
        lockedDice: [] as LockedDie[],
        selectedForUnlock: [] as number[],
        isAI: true,
        difficulty: aiDifficulty,
      };
    });

    set({ players, phase: 'lobby', currentRound: 0, roundState: initialRoundState, shownTips: [] });
  },

  initRound: (options?: { skipPhase?: boolean; goalValues?: number[] }) => {
    const state = get();
    const goalValues = options?.goalValues ??
      Array.from({ length: 8 }, () => Math.floor(Math.random() * 6) + 1).sort((a, b) => a - b);

    const players = state.players.map((p) => ({
      ...p,
      poolSize: p.startingDice,
      lockedDice: [],
      selectedForUnlock: [],
    }));

    const updates: Partial<GameState> & { players: typeof players; currentRound: number } = {
      players,
      roundState: {
        goalValues,
        rollResults: null,
        rollNumber: 0,
        lastLockCount: 0,
        roundScore: 0,
        pendingNewDice: [],
        pendingNewDicePositions: [],
        pendingNewDiceRotations: [],
        remainingDiceValues: [],
        remainingDicePositions: [],
        remainingDiceRotations: [],
        lockAnimations: [],
        animatingSlotIndices: [],
        aiLockAnimations: [],
        aiAnimatingSlotIndices: {},
        unlockAnimations: [],
        aiUnlockAnimations: [],
        goalTransition: 'none',
        poolExiting: false,
        poolSpawning: false,
        poolSpawnPositions: [],
      },
      currentRound: state.currentRound + 1,
    };
    if (!options?.skipPhase) {
      updates.phase = 'idle';
    }
    set(updates);
  },

  setGoalTransition: (goalTransition: 'none' | 'exiting' | 'entering') => {
    const state = get();
    set({
      roundState: {
        ...state.roundState,
        goalTransition,
      },
    });
  },

  setPoolExiting: (poolExiting: boolean) => {
    const state = get();
    set({
      roundState: {
        ...state.roundState,
        poolExiting,
      },
    });
  },

  setPoolSpawning: (poolSpawning: boolean, positions?: [number, number, number][]) => {
    const state = get();
    set({
      roundState: {
        ...state.roundState,
        poolSpawning,
        poolSpawnPositions: positions || state.roundState.poolSpawnPositions,
      },
    });
  },

  setRollResults: (results: number[], positions?: [number, number, number][], rotations?: [number, number, number][]) => {
    const state = get();

    // Guard: ignore if already processing (double-fire from settle detection)
    if (state.phase !== 'rolling') {
      console.warn('[setRollResults] IGNORED — phase is', state.phase, 'not rolling');
      return;
    }

    const player = state.players[0];

    // Find new auto-locks from rolled results
    const newLocks = findAutoLocks(
      state.roundState.goalValues,
      results,
      player.lockedDice,
    );

    // --- BUG-001 VALIDATION: independently count expected locks ---
    const lockedSlotSet = new Set(player.lockedDice.map(l => l.goalSlotIndex));
    const availableByValue = new Map<number, number>();
    for (let i = 0; i < state.roundState.goalValues.length; i++) {
      if (!lockedSlotSet.has(i)) {
        const v = state.roundState.goalValues[i];
        availableByValue.set(v, (availableByValue.get(v) || 0) + 1);
      }
    }
    let expectedTotal = 0;
    const rolledCounts = new Map<number, number>();
    for (const v of results) {
      rolledCounts.set(v, (rolledCounts.get(v) || 0) + 1);
    }
    for (const [val, rolledCount] of rolledCounts) {
      const availCount = availableByValue.get(val) || 0;
      expectedTotal += Math.min(rolledCount, availCount);
    }
    if (newLocks.length !== expectedTotal) {
      console.error(
        `[BUG-001 MISMATCH] Expected ${expectedTotal} locks but got ${newLocks.length}! ` +
        `goal=[${state.roundState.goalValues}] rolled=[${results}] ` +
        `existingLocks=[${player.lockedDice.map(l => `s${l.goalSlotIndex}=v${l.value}`)}] ` +
        `available=${JSON.stringify(Object.fromEntries(availableByValue))} ` +
        `rolledCounts=${JSON.stringify(Object.fromEntries(rolledCounts))}`,
      );
    }
    // --- END VALIDATION ---

    console.log(
      `[setRollResults] goal=[${state.roundState.goalValues}] rolled=[${results}] ` +
      `existingLocks=${player.lockedDice.length} newLocks=${newLocks.length} ` +
      `details=[${newLocks.map(l => `slot${l.goalSlotIndex}=val${l.value}`)}] ` +
      `pool: ${player.poolSize} → ${player.poolSize - newLocks.length}`,
    );

    // Compute non-locked die values, positions, AND rotations (dice that stay in the pool)
    // Consume locked values from rolled results to find leftovers
    const lockedValueBag = new Map<number, number>();
    for (const lock of newLocks) {
      lockedValueBag.set(lock.value, (lockedValueBag.get(lock.value) || 0) + 1);
    }
    const remainingDiceValues: number[] = [];
    const remainingDicePositions: [number, number, number][] = [];
    const remainingDiceRotations: [number, number, number][] = [];
    for (let i = 0; i < results.length; i++) {
      const v = results[i];
      const lockCount = lockedValueBag.get(v) || 0;
      if (lockCount > 0) {
        lockedValueBag.set(v, lockCount - 1); // "consume" one lock
      } else {
        remainingDiceValues.push(v);
        if (positions) {
          remainingDicePositions.push(positions[i]);
        }
        if (rotations) {
          remainingDiceRotations.push(rotations[i]);
        }
      }
    }

    // Compute lock animations when positions are available and there are new locks
    let lockAnimations: LockAnimation[] = [];
    let animatingSlotIndices: number[] = [];

    if (positions && newLocks.length > 0) {
      // Map each lock back to its source position in the sorted results array.
      // findAutoLocks iterates rolledValues (sorted) in order and consumes matches
      // left-to-right from goal slots. We replicate that consumption order to pair
      // each lock with the correct source position.
      const locksByValue = new Map<number, number[]>();
      for (const lock of newLocks) {
        if (!locksByValue.has(lock.value)) locksByValue.set(lock.value, []);
        locksByValue.get(lock.value)!.push(lock.goalSlotIndex);
      }

      for (let i = 0; i < results.length; i++) {
        const v = results[i];
        const slots = locksByValue.get(v);
        if (slots && slots.length > 0) {
          const goalSlotIndex = slots.shift()!;
          const prevDelay = lockAnimations.length > 0
            ? lockAnimations[lockAnimations.length - 1].delay
            : 0;
          const delay = lockAnimations.length === 0
            ? 0
            : prevDelay + (0.25 + Math.random() * 0.25);
          lockAnimations.push({
            fromPos: positions[i],
            toPos: [getSlotX(goalSlotIndex), DIE_SIZE / 2, -3.77],
            fromRotation: rotations ? rotations[i] : [0, 0, 0],
            value: v,
            delay,
          });
        }
      }

      animatingSlotIndices = newLocks.map((l) => l.goalSlotIndex);

      console.log(
        `[setRollResults] lockAnimations: ${lockAnimations.length}`,
        lockAnimations.map((a) => `val${a.value} from[${a.fromPos.map(n => n.toFixed(2))}] to[${a.toPos.map(n => n.toFixed(2))}]`),
      );
    }

    // Apply new locks to human player
    const players = [...state.players];
    const updatedPlayer = { ...player };
    updatedPlayer.lockedDice = [...updatedPlayer.lockedDice, ...newLocks];
    updatedPlayer.poolSize = updatedPlayer.poolSize - newLocks.length;
    players[0] = updatedPlayer;

    // --- Simultaneous AI rolls: process all AI players in the same update ---
    const aiLockAnimations: LockAnimation[] = [];
    const aiAnimatingSlotIndices: Record<string, number[]> = {};
    let aiAnimDelay = 0;

    for (let i = 1; i < players.length; i++) {
      const aiPlayer = players[i];
      if (!aiPlayer.isAI || aiPlayer.poolSize <= 0) continue;

      // Generate random roll results for AI
      const aiResults = Array.from({ length: aiPlayer.poolSize }, () =>
        Math.floor(Math.random() * 6) + 1,
      );

      // Find auto-locks for AI
      const aiLocks = findAutoLocks(
        state.roundState.goalValues,
        aiResults,
        aiPlayer.lockedDice,
      );

      // Apply locks to AI player
      const updatedAI = { ...aiPlayer };
      updatedAI.lockedDice = [...updatedAI.lockedDice, ...aiLocks];
      updatedAI.poolSize = updatedAI.poolSize - aiLocks.length;
      players[i] = updatedAI;

      // Compute AI lock animation data (emerge from profile → slot)
      if (aiLocks.length > 0) {
        const profileX = getSlotX(0) - PROFILE_X_OFFSET;
        const rowZ = -3.77 + i * 0.9;
        const slotsAnimating: number[] = [];

        for (const lock of aiLocks) {
          aiLockAnimations.push({
            fromPos: [profileX, DIE_SIZE / 2, rowZ],
            toPos: [getSlotX(lock.goalSlotIndex), DIE_SIZE / 2, rowZ],
            fromRotation: [0, 0, 0],
            value: lock.value,
            delay: aiAnimDelay,
            fromScale: 0,
            toScale: 1,
            playerId: aiPlayer.id,
          });
          slotsAnimating.push(lock.goalSlotIndex);
          aiAnimDelay += 0.25 + Math.random() * 0.25;
        }

        aiAnimatingSlotIndices[aiPlayer.id] = slotsAnimating;
      }

      console.log(
        `[setRollResults AI-${i}] rolled=[${aiResults}] locks=${aiLocks.length} pool: ${aiPlayer.poolSize} → ${updatedAI.poolSize}`,
      );
    }

    // Update round state and set phase to locking (for UI feedback)
    set({
      players,
      roundState: {
        ...state.roundState,
        rollResults: results,
        rollNumber: state.roundState.rollNumber + 1,
        lastLockCount: newLocks.length,
        pendingNewDice: [],
        pendingNewDicePositions: [],
        pendingNewDiceRotations: [],
        remainingDiceValues,
        remainingDicePositions,
        remainingDiceRotations,
        lockAnimations,
        animatingSlotIndices,
        aiLockAnimations,
        aiAnimatingSlotIndices,
      },
      phase: 'locking',
    });
  },

  clearLockAnimations: () => {
    const state = get();
    set({
      roundState: {
        ...state.roundState,
        lockAnimations: [],
        animatingSlotIndices: [],
      },
    });
  },

  clearAILockAnimations: () => {
    const state = get();
    set({
      roundState: {
        ...state.roundState,
        aiLockAnimations: [],
        aiAnimatingSlotIndices: {},
      },
    });
  },

  lockDice: (playerIndex: number, locks: LockedDie[]) => {
    const state = get();
    const players = [...state.players];
    const player = { ...players[playerIndex] };

    player.lockedDice = [...player.lockedDice, ...locks];
    player.poolSize = player.poolSize - locks.length;
    players[playerIndex] = player;

    set({ players, phase: 'idle' });
  },

  toggleUnlockSelection: (playerIndex: number, goalSlotIndex: number) => {
    const state = get();
    const players = [...state.players];
    const player = { ...players[playerIndex] };

    const idx = player.selectedForUnlock.indexOf(goalSlotIndex);
    if (idx === -1) {
      // Check 12-die cap: each unlock adds 1 net die (pool+2, locked-1)
      // Total after unlock = poolSize + lockedCount + numUnlocks
      const wouldBeTotal = player.poolSize + player.lockedDice.length + (player.selectedForUnlock.length + 1);
      if (wouldBeTotal > 12) {
        // Can't select more — would exceed 12 dice cap
        return;
      }
      player.selectedForUnlock = [...player.selectedForUnlock, goalSlotIndex];
    } else {
      player.selectedForUnlock = player.selectedForUnlock.filter((s) => s !== goalSlotIndex);
    }

    players[playerIndex] = player;
    set({ players });
  },

  confirmUnlock: (playerIndex: number) => {
    const state = get();
    const players = [...state.players];
    const player = { ...players[playerIndex] };

    const slotsToUnlock = player.selectedForUnlock;

    // Get values of dice being unlocked (before removing them)
    const unlockedValues = player.lockedDice
      .filter((ld) => slotsToUnlock.includes(ld.goalSlotIndex))
      .map((ld) => ld.value);

    // Each unlock returns the die + 1 bonus die of the same value
    const pendingNewDice = unlockedValues.flatMap((v) => [v, v]);

    // Extract split target positions + rotations from unlock animations (still in state at this point)
    // so new physics dice appear exactly where the MitosisDie animation ended
    const pendingNewDicePositions: [number, number, number][] = [];
    const pendingNewDiceRotations: [number, number, number][] = [];
    for (const anim of state.roundState.unlockAnimations) {
      pendingNewDicePositions.push(anim.splitTargets[0], anim.splitTargets[1]);
      // Compose face tilt + Y spin via quaternions so Euler stays correct
      const faceRot = getFaceUpRotation(anim.value);
      for (const yRot of anim.splitYRotations) {
        const faceQ = new Quaternion().setFromEuler(new Euler(faceRot[0], faceRot[1], faceRot[2]));
        const yQ = new Quaternion().setFromEuler(new Euler(0, yRot, 0));
        const combined = yQ.multiply(faceQ); // Y spin applied in world space
        const result = new Euler().setFromQuaternion(combined);
        pendingNewDiceRotations.push([result.x, result.y, result.z]);
      }
    }

    // Remove locked dice at selected slots
    player.lockedDice = player.lockedDice.filter(
      (ld) => !slotsToUnlock.includes(ld.goalSlotIndex),
    );
    // Each unlocked slot returns 1 die (the locked die) + 1 bonus die from goal
    player.poolSize = player.poolSize + slotsToUnlock.length * 2;
    player.selectedForUnlock = [];

    players[playerIndex] = player;
    set({
      players,
      roundState: {
        ...state.roundState,
        pendingNewDice,
        pendingNewDicePositions,
        pendingNewDiceRotations,
      },
    });
  },

  skipUnlock: (playerIndex: number) => {
    const state = get();
    const players = [...state.players];
    const player = { ...players[playerIndex] };

    player.selectedForUnlock = [];
    players[playerIndex] = player;
    set({ players });
  },

  setUnlockAnimations: (anims: UnlockAnimation[]) => {
    const state = get();
    set({
      roundState: {
        ...state.roundState,
        unlockAnimations: anims,
      },
    });
  },

  clearUnlockAnimations: () => {
    const state = get();
    set({
      roundState: {
        ...state.roundState,
        unlockAnimations: [],
      },
    });
  },

  setAIUnlockAnimations: (anims: AIUnlockAnimation[]) => {
    const state = get();
    set({
      roundState: {
        ...state.roundState,
        aiUnlockAnimations: anims,
      },
    });
  },

  clearAIUnlockAnimations: () => {
    const state = get();
    set({
      roundState: {
        ...state.roundState,
        aiUnlockAnimations: [],
      },
    });
  },

  processAIUnlocks: () => {
    const state = get();
    const players = [...state.players];
    let changed = false;

    for (let i = 1; i < players.length; i++) {
      const aiPlayer = players[i];
      if (!aiPlayer.isAI || !aiPlayer.difficulty) continue;
      if (aiPlayer.lockedDice.length === 0) continue;
      if (aiPlayer.lockedDice.length >= 8) continue;

      const slotsToUnlock = getAIUnlockDecision({
        goalValues: state.roundState.goalValues,
        lockedDice: aiPlayer.lockedDice,
        poolSize: aiPlayer.poolSize,
        difficulty: aiPlayer.difficulty,
      });

      if (slotsToUnlock.length > 0) {
        const updatedAI = { ...aiPlayer };
        updatedAI.lockedDice = updatedAI.lockedDice.filter(
          (ld) => !slotsToUnlock.includes(ld.goalSlotIndex),
        );
        updatedAI.poolSize = updatedAI.poolSize + slotsToUnlock.length * 2;
        updatedAI.selectedForUnlock = [];
        players[i] = updatedAI;
        changed = true;

        console.log(
          `[processAIUnlocks AI-${i}] unlocked slots=[${slotsToUnlock}] pool: ${aiPlayer.poolSize} → ${updatedAI.poolSize}`,
        );
      }
    }

    if (changed) {
      set({ players });
    }
  },

  scoreRound: () => {
    const state = get();
    let computedRoundScore = 0;
    const players = state.players.map((p) => {
      // Only score players who completed the goal (all 8 slots locked)
      if (p.lockedDice.length === 8) {
        // poolSize = remaining unlocked dice at time of win
        // Penalty per extra die: 9th=-1, 10th=0, 11th=-1, 12th=-1
        const penalties = [1, 0, 1, 1];
        let penalty = 0;
        for (let i = 0; i < p.poolSize && i < penalties.length; i++) {
          penalty += penalties[i];
        }
        computedRoundScore = Math.max(0, 8 - penalty);
        return { ...p, score: p.score + computedRoundScore };
      }
      return p;
    });

    set({
      players,
      phase: 'scoring',
      roundState: {
        ...state.roundState,
        roundScore: computedRoundScore,
      },
    });
  },

  applyHandicap: () => {
    const state = get();
    // Determine who won this round (completed 8 locks)
    const players = state.players.map((p) => {
      if (p.lockedDice.length === 8) {
        // Won — decrease starting dice (min 1)
        return { ...p, startingDice: Math.max(1, p.startingDice - 1) };
      } else {
        // Lost — increase starting dice (max 12)
        return { ...p, startingDice: Math.min(12, p.startingDice + 1) };
      }
    });

    set({ players, phase: 'roundEnd' });
  },

  checkWinner: () => {
    const state = get();
    return state.players.some((p) => p.lockedDice.length === 8);
  },

  checkSessionEnd: () => {
    const state = get();
    return state.players.some((p) => p.score >= state.sessionTargetScore);
  },

  // --- Tips ---
  showTip: (tipId: string) => {
    const state = get();
    if (state.shownTips.includes(tipId)) return;
    set({ shownTips: [...state.shownTips, tipId] });
  },

  // --- Game preferences ---
  setGamePrefs: (prefs) => set((s) => ({ gamePrefs: { ...s.gamePrefs, ...prefs } })),

  // --- Settings actions ---
  setAudioVolume: (volume: number) => {
    set({ settings: { ...get().settings, audioVolume: volume } });
  },

  setPerformanceMode: (mode: Settings['performanceMode']) => {
    set({ settings: { ...get().settings, performanceMode: mode } });
  },

  setShakeToRollEnabled: (enabled: boolean) => {
    set({ settings: { ...get().settings, shakeToRollEnabled: enabled } });
  },

  setHapticsEnabled: (enabled: boolean) => {
    set({ settings: { ...get().settings, hapticsEnabled: enabled } });
  },

  setTipsEnabled: (enabled: boolean) => {
    set({ settings: { ...get().settings, tipsEnabled: enabled } });
  },

  setConfirmationEnabled: (enabled: boolean) => {
    set({ settings: { ...get().settings, confirmationEnabled: enabled } });
  },

  // --- Online mode ---
  setOnlineMode: (playerId: string) => {
    set({ isOnlineGame: true, onlinePlayerId: playerId });
  },
  clearOnlineMode: () => {
    set({ isOnlineGame: false, onlinePlayerId: null, onlinePlayerIds: [], deferredPhase: null });
  },
  setOnlinePlayerIds: (ids: string[]) => {
    set({ onlinePlayerIds: ids });
  },
  applyOnlineUnlockResult: (playerId: string, _unlockedSlots: number[], newPoolSize: number, serverLockedDice: { goalSlotIndex: number; value: number }[]) => {
    const state = get();
    const playerIndex = state.onlinePlayerIds.indexOf(playerId);
    if (playerIndex === -1) return; // Bot or unknown — server manages

    const players = [...state.players];
    const player = { ...players[playerIndex] };
    player.lockedDice = serverLockedDice.map(ld => ({ goalSlotIndex: ld.goalSlotIndex, value: ld.value }));
    player.poolSize = newPoolSize;
    player.selectedForUnlock = [];
    players[playerIndex] = player;

    console.log(
      `[applyOnlineUnlockResult] player=${playerId} index=${playerIndex} ` +
      `pool=${newPoolSize} locks=${serverLockedDice.length}`,
    );

    set({ players });
  },

  // --- Pending server data (online game sync) ---
  setPendingServerResults: (results) => {
    set({ pendingServerResults: results });
    if (results !== null) {
      // Check if physics data is also ready (timing barrier)
      tryApplyOnlineResults(get, set);
    }
  },
  setPendingUnlockResult: (result) => set({ pendingUnlockResult: result }),

  // --- Physics settled data (online game) ---
  setPhysicsSettledData: (data) => {
    set({ physicsSettledData: data });
    if (data !== null) {
      // Check if server results are also ready (timing barrier)
      tryApplyOnlineResults(get, set);
    }
  },

  // --- Online roll results ---
  applyOnlineRollResults: (physicsPositions, physicsRotations) => {
    applyOnlineRollResultsImpl(get, set, physicsPositions, physicsRotations);
  },
}));

/** Check if a tip should be shown (tips enabled + not already shown this session) */
export function shouldShowTip(tipId: string): boolean {
  const state = useGameStore.getState();
  return state.settings.tipsEnabled && !state.shownTips.includes(tipId);
}
