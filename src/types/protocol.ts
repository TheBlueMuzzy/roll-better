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

/** All messages the client can send to the server */
export type ClientMessage = JoinMessage | LeaveMessage | ReadyMessage | StartGameMessage;

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

/** All messages the server can send to the client */
export type ServerMessage =
  | ConnectedMessage
  | RoomStateMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | ErrorMessage
  | GameStartingMessage;
