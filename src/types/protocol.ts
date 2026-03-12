// ─── Shared Protocol Types ───────────────────────────────────────────
// Used by BOTH server (party/) and client (src/).
// Do NOT import from gameStore or any React code here.
// ─────────────────────────────────────────────────────────────────────

// ─── Seat Types ─────────────────────────────────────────────────────

export type SeatState = 'human-active' | 'human-afk' | 'bot';

// ─── Room Types ─────────────────────────────────────────────────────

/** Minimal player info for room state (subset of full Player type) */
export interface RoomPlayer {
  id: string;
  name: string;
  color: string;
  isHost: boolean;
  isReady: boolean;
  persistentId: string;
  seatIndex: number;
}

/** Room lifecycle status */
export type RoomStatus = "waiting" | "playing" | "closed";

// ─── Client → Server Messages ───────────────────────────────────────

export interface JoinMessage {
  type: "join";
  name: string;
  color: string;
  persistentId: string;
}

export interface LeaveMessage {
  type: "leave";
}

export interface StartGameMessage {
  type: "start_game";
  targetPlayers: number;
}

// ─── Game Action Messages (Client → Server) ─────────────────────────

export interface RollResultMessage {
  type: "roll_result";
  values: number[];  // physics-determined dice values from client
  afk?: boolean;     // true when triggered by client's AFK countdown
}

export interface UnlockRequestMessage {
  type: "unlock_request";
  slotIndices: number[];
  afk?: boolean;     // true when triggered by client's AFK countdown
}

export interface SkipUnlockMessage {
  type: "skip_unlock";
  afk?: boolean;     // true when triggered by client's AFK countdown
}

export interface PlayAgainMessage {
  type: "play_again";
}

export interface RollingTimeoutMessage {
  type: "rolling_timeout";
}

export interface PhaseSyncRequestMessage {
  type: "phase_sync_request";
}

export interface SeatClaimMessage {
  type: "seat_claim";
  seatIndex: number;
}

/** All messages the client can send to the server */
export type ClientMessage =
  | JoinMessage
  | LeaveMessage
  | StartGameMessage
  | RollResultMessage
  | UnlockRequestMessage
  | SkipUnlockMessage
  | PlayAgainMessage
  | RollingTimeoutMessage
  | PhaseSyncRequestMessage
  | SeatClaimMessage;

// ─── Server → Client Messages ───────────────────────────────────────

export interface ConnectedMessage {
  type: "connected";
  roomId: string;
  playerId: string;
  persistentId: string;
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

/** Error message from server to client.
 *  Known error codes:
 *  - "room_full" — room has reached MAX_PLAYERS
 *  - "connected_elsewhere" — another tab/connection opened with same persistentId
 */
export interface ErrorMessage {
  type: "error";
  code?: string;
  message: string;
}

export interface GameStartingMessage {
  type: "game_starting";
  players: RoomPlayer[];
  targetPlayers: number;
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
  seatState: SeatState;
  seatIndex: number;
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

export interface SeatStateChangedMessage {
  type: "seat_state_changed";
  playerId: string;
  seatState: SeatState;
  seatIndex: number;
}

export interface SeatListMessage {
  type: "seat_list";
  seats: Array<{
    seatIndex: number;
    name: string;
    color: string;
    score: number;
    lockedCount: number;
  }>;
  round: number;
  goalValues: number[];
}

export interface SeatClaimResultMessage {
  type: "seat_claim_result";
  success: boolean;
  seatIndex: number;
  reason?: string;
  autoMatched?: boolean;
}

export interface SeatTakeoverMessage {
  type: "seat_takeover";
  seatIndex: number;
  playerId: string;
  playerName: string;
  reason: 'reclaim' | 'takeover';
}

export interface PlayAgainAckMessage {
  type: "play_again_ack";
  mode: "lobby" | "mid_game_join";
}

export interface RoomClosedMessage {
  type: "room_closed";
  reason: string;
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
  | PlayerReconnectedMessage
  | SeatStateChangedMessage
  | SeatListMessage
  | SeatClaimResultMessage
  | SeatTakeoverMessage
  | PlayAgainAckMessage
  | RoomClosedMessage;
