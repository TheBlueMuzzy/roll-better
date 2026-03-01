export type GamePhase = 'lobby' | 'rolling' | 'locking' | 'unlocking' | 'idle' | 'scoring' | 'roundEnd' | 'sessionEnd';

export interface LockedDie {
  goalSlotIndex: number;
  value: number;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  score: number;
  startingDice: number;
  poolSize: number;
  lockedDice: LockedDie[];
  selectedForUnlock: number[];
  isAI: boolean;
}

export interface RoundState {
  goalValues: number[];
  rollResults: number[] | null;
  rollNumber: number;
  lastLockCount: number;
}

export interface Die {
  id: string;
  value: number | null;
  isLocked: boolean;
  lockedToSlot: number | null;
  position: [number, number, number];
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  currentRound: number;
  roundState: RoundState;
  sessionTargetScore: number;
}
