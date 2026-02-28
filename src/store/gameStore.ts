import { create } from 'zustand';
import type { GamePhase, GameState } from '../types/game';

interface GameStore extends GameState {
  reset: () => void;
  setPhase: (phase: GamePhase) => void;
}

const initialState: GameState = {
  phase: 'lobby',
  players: [],
  goalDice: [],
  currentRound: 1,
  currentPlayerIndex: 0,
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,
  reset: () => set(initialState),
  setPhase: (phase) => set({ phase }),
}));
