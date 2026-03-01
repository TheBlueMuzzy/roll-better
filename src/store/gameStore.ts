import { create } from 'zustand';
import type { GamePhase, GameState, LockedDie } from '../types/game';
import { findAutoLocks } from '../utils/matchDetection';

// Player colors — defined here to avoid circular dependency with Die3D
const PLAYER_COLORS = [
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
  setPhase: (phase: GamePhase) => void;

  // Game setup
  initGame: (playerCount: number) => void;
  initRound: () => void;

  // Rolling & locking
  setRollResults: (results: number[]) => void;
  lockDice: (playerIndex: number, locks: LockedDie[]) => void;

  // Unlocking
  toggleUnlockSelection: (playerIndex: number, goalSlotIndex: number) => void;
  confirmUnlock: (playerIndex: number) => void;
  skipUnlock: (playerIndex: number) => void;

  // Scoring & progression
  scoreRound: () => void;
  applyHandicap: () => void;
  checkWinner: () => boolean;
  checkSessionEnd: () => boolean;
}

const initialRoundState = {
  goalValues: [],
  rollResults: null,
  rollNumber: 0,
  lastLockCount: 0,
  pendingNewDice: [] as number[],
  remainingDiceValues: [] as number[],
};

const initialState: GameState = {
  phase: 'lobby',
  players: [],
  currentRound: 0,
  roundState: initialRoundState,
  sessionTargetScore: 20,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  reset: () => set(initialState),

  setPhase: (phase) => set({ phase }),

  initGame: (playerCount: number) => {
    const players = Array.from({ length: playerCount }, (_, i) => ({
      id: `player-${i}`,
      name: i === 0 ? 'You' : `Player ${i + 1}`,
      color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      score: 0,
      startingDice: 2,
      poolSize: 2,
      lockedDice: [],
      selectedForUnlock: [],
      isAI: i !== 0,
    }));

    set({ players, phase: 'lobby', currentRound: 0, roundState: initialRoundState });
  },

  initRound: () => {
    const state = get();
    const goalValues = Array.from({ length: 8 }, () => Math.floor(Math.random() * 6) + 1)
      .sort((a, b) => a - b);

    const players = state.players.map((p) => ({
      ...p,
      poolSize: p.startingDice,
      lockedDice: [],
      selectedForUnlock: [],
    }));

    set({
      players,
      roundState: {
        goalValues,
        rollResults: null,
        rollNumber: 0,
        lastLockCount: 0,
        pendingNewDice: [],
        remainingDiceValues: [],
      },
      currentRound: state.currentRound + 1,
      phase: 'idle',
    });
  },

  setRollResults: (results: number[]) => {
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

    // Compute non-locked die values (dice that stay in the pool)
    // Consume locked values from rolled results to find leftovers
    const lockedValueBag = new Map<number, number>();
    for (const lock of newLocks) {
      lockedValueBag.set(lock.value, (lockedValueBag.get(lock.value) || 0) + 1);
    }
    const remainingDiceValues: number[] = [];
    for (const v of results) {
      const lockCount = lockedValueBag.get(v) || 0;
      if (lockCount > 0) {
        lockedValueBag.set(v, lockCount - 1); // "consume" one lock
      } else {
        remainingDiceValues.push(v);
      }
    }

    // Apply new locks to player
    const players = [...state.players];
    const updatedPlayer = { ...player };
    updatedPlayer.lockedDice = [...updatedPlayer.lockedDice, ...newLocks];
    updatedPlayer.poolSize = updatedPlayer.poolSize - newLocks.length;
    players[0] = updatedPlayer;

    // Update round state and set phase to locking (for UI feedback)
    set({
      players,
      roundState: {
        ...state.roundState,
        rollResults: results,
        rollNumber: state.roundState.rollNumber + 1,
        lastLockCount: newLocks.length,
        pendingNewDice: [],
        remainingDiceValues,
      },
      phase: 'locking',
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

  scoreRound: () => {
    const state = get();
    const players = state.players.map((p) => {
      // Only score players who completed the goal (all 8 slots locked)
      if (p.lockedDice.length === 8) {
        // poolSize = remaining unlocked dice at time of win
        // Fewer remaining = better score (8 is perfect, 0+ extra dice penalize)
        const roundScore = Math.max(0, 8 - p.poolSize * 2);
        return { ...p, score: p.score + roundScore };
      }
      return p;
    });

    set({ players, phase: 'scoring' });
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
}));
