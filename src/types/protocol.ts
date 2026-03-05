// ─── Shared Protocol Types ───────────────────────────────────────────
// Used by BOTH server (party/) and client (src/).
// Do NOT import from gameStore or any React code here.
// ─────────────────────────────────────────────────────────────────────

// ─── Room Types ─────────────────────────────────────────────────────

/** Minimal player info for room state (subset of full Player type) */
export interface RoomPlayer {
  id: string;
  name: string;
  color: string;
  isHost: boolean;
  isReady: boolean;
}

/** Room lifecycle status */
export type RoomStatus = "waiting" | "playing" | "closed";

// ─── Client → Server Messages ───────────────────────────────────────

export interface JoinMessage {
  type: "join";
  name: string;
  color: string;
}

export interface LeaveMessage {
  type: "leave";
}

export interface ReadyMessage {
  type: "ready";
}

export interface StartGameMessage {
  type: "start_game";
  targetPlayers: number;
  aiDifficulty: string;
}

// ─── Game Action Messages (Client → Server) ─────────────────────────

export interface RollResultMessage {
  type: "roll_result";
  values: number[];  // physics-determined dice values from client
}

export interface UnlockRequestMessage {
  type: "unlock_request";
  slotIndices: number[];
}

export interface SkipUnlockMessage {
  type: "skip_unlock";
}

export interface RestartGameMessage {
  type: "restart_game";
}

export interface RollingTimeoutMessage {
  type: "rolling_timeout";
}

export interface PhaseSyncRequestMessage {
  type: "phase_sync_request";
}

/** All messages the client can send to the server */
export type ClientMessage =
  | JoinMessage
  | LeaveMessage
  | ReadyMessage
  | StartGameMessage
  | RollResultMessage
  | UnlockRequestMessage
  | SkipUnlockMessage
  | RestartGameMessage
  | RollingTimeoutMessage
  | PhaseSyncRequestMessage;

// ─── Server → Client Messages ───────────────────────────────────────

export interface ConnectedMessage {
  type: "connected";
  roomId: string;
  playerId: string;
}

export interface RoomStateMessage {
  type: "room_state";
  players: RoomPlayer[];
  hostId: string;
  status: RoomStatus;
}

export interface PlayerJoinedMessage {
  type: "player_joined";
  player: RoomPlayer;
}

export interface PlayerLeftMessage {
  type: "player_left";
  playerId: string;
}

export interface ErrorMessage {
  type: "error";
  message: string;
}

export interface GameStartingMessage {
  type: "game_starting";
  players: RoomPlayer[];
  targetPlayers: number;
  aiDifficulty: string;
  goalValues: number[];
}

// ─── Game Sync Types ──────────────────────────────────────────────────

/** A locked die for protocol sync — protocol-local, NOT imported from game.ts */
export interface LockedDieSync {
  goalSlotIndex: number;
  value: number;
}

/** Player state for round sync */
export interface PlayerSyncState {
  id: string;
  name: string;
  color: string;
  score: number;
  startingDice: number;
  poolSize: number;
  lockedDice: LockedDieSync[];
}

/** Per-player roll result */
export interface PlayerRollResult {
  playerId: string;
  rolled: number[];
  newLocks: LockedDieSync[];
  poolSize: number;
  lockedDice: LockedDieSync[];
}

// ─── Game Action Messages (Server → Client) ─────────────────────────

export interface RollResultsMessage {
  type: "roll_results";
  playerResults: PlayerRollResult[];
}

export interface PhaseChangeMessage {
  type: "phase_change";
  phase: string;
  players?: PlayerSyncState[];  // Full snapshot for state recovery
}

export interface RoundStartMessage {
  type: "round_start";
  round: number;
  goalValues: number[];
  players: PlayerSyncState[];
}

export interface UnlockResultMessage {
  type: "unlock_result";
  playerId: string;
  unlockedSlots: number[];
  newPoolSize: number;
  lockedDice: LockedDieSync[];
}

export interface ScoringMessage {
  type: "scoring";
  winners: { playerId: string; roundScore: number }[];
  players: PlayerSyncState[];
}

export interface SessionEndMessage {
  type: "session_end";
  players: PlayerSyncState[];
}

/** Per-player lock result broadcast from server to other clients */
export interface PlayerLockResultMessage {
  type: "player_lock_result";
  playerId: string;
  rolled: number[];
  newLocks: LockedDieSync[];
  poolSize: number;
  lockedDice: LockedDieSync[];
}

export interface PhaseSyncMessage {
  type: "phase_sync";
  phase: string;
  players?: PlayerSyncState[];
  goalValues?: number[];
}

export interface RejoinStateMessage {
  type: "rejoin_state";
  phase: string;
  round: number;
  goalValues: number[];
  players: PlayerSyncState[];
}

export interface PlayerReconnectedMessage {
  type: "player_reconnected";
  playerId: string;
  playerName: string;
}

/** All messages the server can send to the client */
export type ServerMessage =
  | ConnectedMessage
  | RoomStateMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | ErrorMessage
  | GameStartingMessage
  | RollResultsMessage
  | PhaseChangeMessage
  | RoundStartMessage
  | UnlockResultMessage
  | ScoringMessage
  | SessionEndMessage
  | PlayerLockResultMessage
  | PhaseSyncMessage
  | RejoinStateMessage
  | PlayerReconnectedMessage;
