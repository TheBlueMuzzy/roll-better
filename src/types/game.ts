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
  fromScale?: number;                  // starting scale (0 = invisible, default 1)
  toScale?: number;                    // ending scale (default 1)
  playerId?: string;                   // which player this animation belongs to
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

export interface AIUnlockAnimation {
  playerId: string;                    // which AI player
  slotIndex: number;                   // which goal slot being unlocked
  value: number;                       // face value of the die
  fromPos: [number, number, number];   // absolute world position of the slot in AI's row
  toPos: [number, number, number];     // AI profile group position
  delay: number;                       // stagger timing
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
  aiLockAnimations: LockAnimation[];
  aiAnimatingSlotIndices: Record<string, number[]>;
  unlockAnimations: UnlockAnimation[];
  aiUnlockAnimations: AIUnlockAnimation[];
  goalTransition: 'none' | 'exiting' | 'entering';
  poolExiting: boolean;
  poolSpawning: boolean;
  poolSpawnPositions: [number, number, number][];
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
  hapticsEnabled: boolean;                     // default true (Vibration API devices only)
  tipsEnabled: boolean;                        // default true
  confirmationEnabled: boolean;                // default true
}

export interface GamePrefs {
  playerCount: number;       // last-used, default 3
}

export interface GameState {
  screen: 'menu' | 'game' | 'winners';
  phase: GamePhase;
  players: Player[];
  currentRound: number;
  roundState: RoundState;
  sessionTargetScore: number;
  settings: Settings;
  shownTips: string[];
  gamePrefs: GamePrefs;
  // Online mode
  isOnlineGame: boolean;
  isOnlineHost: boolean;
  onlinePlayerId: string | null;
  onlinePlayerIds: string[];
  isOnlineDisconnected: boolean;
}
