export type GamePhase = 'lobby' | 'rolling' | 'locking' | 'unlocking' | 'idle' | 'scoring' | 'roundEnd' | 'sessionEnd';

export interface LockedDie {
  goalSlotIndex: number;
  value: number;
}

export interface LockAnimation {
  fromPos: [number, number, number];  // die's settled position in pool
  toPos: [number, number, number];    // target slot in player row
  fromRotation: [number, number, number]; // die's settled rotation (Euler)
  value: number;                       // face value for correct rotation
  delay: number;                       // seconds to wait before starting
}

export interface UnlockAnimation {
  slotIndex: number;           // which goal slot is being unlocked
  value: number;               // die face value
  fromPos: [number, number, number];    // player row position
  targetPos: [number, number, number];  // clear spot in pool
  splitTargets: [[number, number, number], [number, number, number]]; // two final positions
  splitYRotations: [number, number]; // casual Y rotation for each split die
  delay: number;               // seconds to wait before starting animation
}

export type AIDifficulty = 'easy' | 'medium' | 'hard';

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
  difficulty?: AIDifficulty;
}

export interface RoundState {
  goalValues: number[];
  rollResults: number[] | null;
  rollNumber: number;
  lastLockCount: number;
  roundScore: number;
  pendingNewDice: number[];
  pendingNewDicePositions: [number, number, number][];
  pendingNewDiceRotations: [number, number, number][];
  remainingDiceValues: number[];
  remainingDicePositions: [number, number, number][];
  remainingDiceRotations: [number, number, number][];
  lockAnimations: LockAnimation[];
  animatingSlotIndices: number[];
  unlockAnimations: UnlockAnimation[];
  goalTransition: 'none' | 'exiting' | 'entering';
}

export interface Die {
  id: string;
  value: number | null;
  isLocked: boolean;
  lockedToSlot: number | null;
  position: [number, number, number];
}

export interface Settings {
  audioVolume: number;                         // 0-100, default 80
  performanceMode: 'advanced' | 'simple';      // default 'advanced'
  tipsEnabled: boolean;                        // default true
  confirmationEnabled: boolean;                // default true
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  currentPlayerIndex: number;
  currentRound: number;
  roundState: RoundState;
  sessionTargetScore: number;
  settings: Settings;
  shownTips: string[];
}
