export type GamePhase = 'lobby' | 'rolling' | 'locking' | 'unlocking' | 'scoring' | 'roundEnd' | 'sessionEnd';

export interface Player {
  id: string;
  name: string;
  color: string;
  score: number;
  handicap: number;
  dice: Die[];
  isAI: boolean;
}

export interface Die {
  id: string;
  value: number | null;
  isLocked: boolean;
  position: [number, number, number];
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  goalDice: Die[];
  currentRound: number;
  currentPlayerIndex: number;
}
