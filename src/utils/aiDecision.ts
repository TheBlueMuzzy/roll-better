import type { LockedDie } from '../types/game';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export interface AIDecisionInput {
  goalValues: number[];          // 8 sorted goal values
  lockedDice: LockedDie[];       // currently locked dice
  poolSize: number;              // current pool size
  difficulty: AIDifficulty;
}

/** Decides which locked dice an AI player should unlock. Returns goalSlotIndices to unlock. */
export function getAIUnlockDecision(_input: AIDecisionInput): number[] {
  return [];
}
