import type * as Party from "partykit/server";
import type {
  RoomPlayer,
  RoomStatus,
  ClientMessage,
  ServerMessage,
  GameStartingMessage,
} from "../src/types/protocol";

const MAX_PLAYERS = 8;

export default class RollBetterServer implements Party.Server {
  readonly room: Party.Room;

  // ─── Room State (in-memory, per room instance) ─────────────────────
  players: Map<string, RoomPlayer> = new Map();
  hostId: string | null = null;
  status: RoomStatus = "waiting";

  constructor(room: Party.Room) {
    this.room = room;
  }

  // ─── Connection Lifecycle ──────────────────────────────────────────

  onConnect(conn: Party.Connection) {
    // Reject if room is closed or full
    if (this.status === "closed") {
      this.sendToConnection(conn, {
        type: "error",
        message: "Room is closed",
      });
      conn.close();
      return;
    }

    if (this.players.size >= MAX_PLAYERS) {
      this.sendToConnection(conn, {
        type: "error",
        message: "Room is full (max 8 players)",
      });
      conn.close();
      return;
    }

    // Send connected ack — player is NOT in the room yet (wait for "join")
    this.sendToConnection(conn, {
      type: "connected",
      roomId: this.room.id,
      playerId: conn.id,
    });
  }

  onMessage(message: string, sender: Party.Connection) {
    let parsed: ClientMessage;

    try {
      parsed = JSON.parse(message) as ClientMessage;
    } catch {
      this.sendToConnection(sender, {
        type: "error",
        message: "Malformed message (invalid JSON)",
      });
      this.log(`Error: malformed JSON from ${sender.id}`);
      return;
    }

    // Validate type field exists
    if (!parsed || typeof parsed.type !== "string") {
      this.sendToConnection(sender, {
        type: "error",
        message: "Missing message type",
      });
      return;
    }

    switch (parsed.type) {
      case "join":
        this.handleJoin(sender, parsed.name, parsed.color);
        break;
      case "leave":
        this.removePlayer(sender.id);
        break;
      case "ready":
        this.handleReady(sender);
        break;
      case "start_game":
        this.handleStartGame(sender, parsed.targetPlayers, parsed.aiDifficulty);
        break;
      default:
        this.log(`Warning: unknown message type "${(parsed as { type: string }).type}" from ${sender.id}`);
        break;
    }
  }

  onClose(conn: Party.Connection) {
    this.removePlayer(conn.id);
  }

  // ─── Message Handlers ─────────────────────────────────────────────

  private handleJoin(conn: Party.Connection, name: string, color: string) {
    // Duplicate join — already in players map
    if (this.players.has(conn.id)) {
      this.sendRoomState(conn);
      return;
    }

    // Room at capacity
    if (this.players.size >= MAX_PLAYERS) {
      this.sendToConnection(conn, {
        type: "error",
        message: "Room is full (max 8 players)",
      });
      return;
    }

    // Validate name
    const trimmedName = (name ?? "").toString().trim();
    if (trimmedName.length === 0) {
      this.sendToConnection(conn, {
        type: "error",
        message: "Name cannot be empty",
      });
      return;
    }

    // Create player
    const isFirstPlayer = this.players.size === 0;
    const player: RoomPlayer = {
      id: conn.id,
      name: trimmedName,
      color: color ?? "#ffffff",
      isHost: isFirstPlayer,
      isReady: false,
    };

    // Set host if first player
    if (isFirstPlayer) {
      this.hostId = conn.id;
    }

    // Add to players map
    this.players.set(conn.id, player);
    this.log(`Player joined: ${trimmedName} (${conn.id})`);

    // Broadcast player_joined to everyone EXCEPT the joining player
    this.broadcastExcept(
      { type: "player_joined", player },
      [conn.id]
    );

    // Send full room_state to the joining player
    this.sendRoomState(conn);
  }

  private handleReady(conn: Party.Connection) {
    const player = this.players.get(conn.id);
    if (!player) return;

    player.isReady = !player.isReady;
    this.log(`Player ${player.name} is now ${player.isReady ? "ready" : "not ready"}`);
    this.broadcastRoomState();
  }

  private handleStartGame(
    conn: Party.Connection,
    targetPlayers: number,
    aiDifficulty: string
  ) {
    // Only the host can start the game
    if (conn.id !== this.hostId) {
      this.sendToConnection(conn, {
        type: "error",
        message: "Only the host can start the game",
      });
      return;
    }

    // Must have at least 1 player (the host)
    if (this.players.size < 1) {
      this.sendToConnection(conn, {
        type: "error",
        message: "Need at least 1 player to start",
      });
      return;
    }

    // All non-host players must be ready
    for (const [id, player] of this.players) {
      if (id !== this.hostId && !player.isReady) {
        this.sendToConnection(conn, {
          type: "error",
          message: `Player ${player.name} is not ready`,
        });
        return;
      }
    }

    // Transition to playing
    this.status = "playing";

    const startMsg: GameStartingMessage = {
      type: "game_starting",
      players: Array.from(this.players.values()),
      targetPlayers,
      aiDifficulty,
    };

    this.room.broadcast(JSON.stringify(startMsg));
    this.log(`Game starting — ${this.players.size} online players, ${targetPlayers} target, AI: ${aiDifficulty}`);
  }

  // ─── Helpers ──────────────────────────────────────────────────────

  private removePlayer(connectionId: string) {
    // Guard: player might have connected but never sent "join"
    if (!this.players.has(connectionId)) {
      return;
    }

    const wasHost = this.hostId === connectionId;
    this.players.delete(connectionId);
    this.log(`Player left: ${connectionId}`);

    // Broadcast player_left to remaining players
    this.room.broadcast(
      JSON.stringify({ type: "player_left", playerId: connectionId } satisfies ServerMessage)
    );

    if (wasHost) {
      if (this.players.size > 0) {
        // Host migration: assign first remaining player
        const newHostId = this.players.keys().next().value!;
        this.hostId = newHostId;
        const newHost = this.players.get(newHostId)!;
        newHost.isHost = true;
        this.log(`New host: ${newHostId}`);

        // Broadcast fresh room_state so everyone sees host change
        this.broadcastRoomState();
      } else {
        // Last player left — close the room
        this.hostId = null;
        this.status = "closed";
        this.log(`Room closed (last player left)`);
      }
    }
  }

  private sendToConnection(conn: Party.Connection, message: ServerMessage) {
    conn.send(JSON.stringify(message));
  }

  private sendRoomState(conn: Party.Connection) {
    this.sendToConnection(conn, this.buildRoomStateMessage());
  }

  private broadcastRoomState() {
    this.room.broadcast(JSON.stringify(this.buildRoomStateMessage()));
  }

  private broadcastExcept(message: ServerMessage, excludeIds: string[]) {
    this.room.broadcast(JSON.stringify(message), excludeIds);
  }

  private buildRoomStateMessage(): ServerMessage {
    return {
      type: "room_state",
      players: Array.from(this.players.values()),
      hostId: this.hostId ?? "",
      status: this.status,
    };
  }

  private log(message: string) {
    console.log(`[Room ${this.room.id}] ${message}`);
  }
}
