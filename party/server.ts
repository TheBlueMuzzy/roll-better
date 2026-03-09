import type * as Party from "partykit/server";
import type {
  RoomPlayer,
  RoomStatus,
  ClientMessage,
  ServerMessage,
  GameStartingMessage,
  LockedDieSync,
  PlayerSyncState,
  SeatState,
} from "../src/types/protocol";
import { findAutoLocks } from "../src/utils/matchDetection";
import { getAIUnlockDecision } from "../src/utils/aiDecision";

const MAX_PLAYERS = 8;

const AI_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
function randomDifficulty(): string {
  return AI_DIFFICULTIES[Math.floor(Math.random() * AI_DIFFICULTIES.length)];
}

// Player colors — assigned by join order (matches client PLAYER_COLORS)
const PLAYER_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f1c40f',
  '#9b59b6', '#e67e22', '#e91e8f', '#1abc9c',
];

// ─── Server-Side Game State (not exported) ─────────────────────────

interface ServerPlayerState {
  id: string;
  name: string;
  color: string;
  persistentId: string;
  score: number;
  startingDice: number;
  poolSize: number;
  lockedDice: LockedDieSync[];
  isOnline: boolean;
  intentionalLeave?: boolean;
  difficulty?: string;
  seatState: SeatState;
  seatIndex: number;
  autopilotCounter: number;
}

interface ServerGameState {
  currentRound: number;
  goalValues: number[];
  phase: string;
  players: ServerPlayerState[];
  rollRequestedBy: Set<string>;
  unlockResponses: Map<string, { type: "unlock" | "skip"; slotIndices?: number[] }>;
}

export default class RollBetterServer implements Party.Server {
  readonly room: Party.Room;

  // ─── Room State (in-memory, per room instance) ─────────────────────
  players: Map<string, RoomPlayer> = new Map();
  hostId: string | null = null;
  status: RoomStatus = "waiting";

  // ─── Persistent ID → Connection ID mapping ────────────────────────
  // Survives player disconnect — used for seat reclaim on rejoin
  persistentIdToConnId: Map<string, string> = new Map();

  // ─── Game State (null during lobby, initialized on game start) ────
  gameState: ServerGameState | null = null;

  // ─── Timer IDs (for cleanup on room close) ─────────────────────────
  // lockingTimer removed — workerd timers are unreliable, transition is now immediate
  // (client deferred phase system handles animation timing)
  private scoringTimer: ReturnType<typeof setTimeout> | null = null;
  private roundEndTimer: ReturnType<typeof setTimeout> | null = null;
  private unlockTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private rollingTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private keepaliveTimer: ReturnType<typeof setTimeout> | null = null;

  // ─── Mid-Game Join State ─────────────────────────────────────────
  private midGameJoiners: Map<string, { name: string; persistentId: string }> = new Map();
  private pendingSeatClaims: Map<number, string> = new Map(); // seatIndex → connId

  // ─── Previous Game Context (for Play Again flow) ────────────────
  private previousGamePersistentIds: Map<string, number> = new Map(); // persistentId → seatIndex
  private previousGameTargetPlayers: number = 0;

  // ─── Unready Players (removed at game start, may send play_again later) ──
  // connId → { name, persistentId } — saved before removing from players map
  private unreadyPlayers: Map<string, { name: string; persistentId: string }> = new Map();

  // ─── Disconnect Grace Timers ──────────────────────────────────────
  // Per-player grace timer: connId -> setTimeout handle
  // When a player disconnects during a timed phase, they get a grace window
  // equal to the remaining phase timer. Fires promoteToBotFromAFK on expiry.
  private disconnectGraceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  // ─── Phase Timer Tracking ─────────────────────────────────────────
  // Track when the current phase timer was started and its duration,
  // so we can calculate remaining time for disconnect grace windows.
  private phaseTimerStartedAt: number | null = null;
  private phaseTimerDuration: number | null = null;

  constructor(room: Party.Room) {
    this.room = room;
  }

  /** Build player snapshot array for state sync broadcasts */
  private buildPlayerSnapshot(): PlayerSyncState[] {
    if (!this.gameState) return [];
    return this.gameState.players.map(p => ({
      id: p.id, name: p.name, color: p.color,
      score: p.score, startingDice: p.startingDice,
      poolSize: p.poolSize, lockedDice: p.lockedDice,
      seatState: p.seatState, seatIndex: p.seatIndex,
    }));
  }

  // ─── Connection Lifecycle ──────────────────────────────────────────

  onConnect(conn: Party.Connection) {
    this.log(`[CONNECT] id=${conn.id.slice(0, 8)} players=${this.players.size} status=${this.status as string} hasGame=${!!this.gameState}`);

    // ─── Rejoin Detection ──────────────────────────────────────────────
    // If a game is active and this connection ID matches an offline player
    // who didn't intentionally leave, restore them into the game.
    if (this.gameState && ((this.status as string) === "playing" || (this.status as string) === "waiting_for_rejoin")) {
      const gamePlayer = this.gameState.players.find(
        (p) => p.id === conn.id && !p.isOnline && p.intentionalLeave !== true
      );
      if (gamePlayer) {
        // ─── Edge case: reconnect after grace expired ──────────────────
        // Grace timer already fired — player is now a bot. Don't restore.
        if (gamePlayer.seatState === 'bot') {
          const seatClaimed = this.pendingSeatClaims.has(gamePlayer.seatIndex);
          this.log(`[REJOIN] ${gamePlayer.name} reconnected but seat is now bot${seatClaimed ? ' (claimed by another player)' : ''} — rejecting`);
          this.sendToConnection(conn, {
            type: "connected",
            roomId: this.room.id,
            playerId: conn.id,
            persistentId: "",
          });
          this.sendToConnection(conn, {
            type: "room_closed",
            reason: "seat_taken_by_bot",
          });
          conn.close();
          return;
        }

        // Restore player to online
        gamePlayer.isOnline = true;

        // ─── Cancel disconnect grace timer if pending ──────────────────
        const graceTimer = this.disconnectGraceTimers.get(conn.id);
        if (graceTimer) {
          clearTimeout(graceTimer);
          this.disconnectGraceTimers.delete(conn.id);
          this.log(`[GRACE] Cancelled grace timer for ${gamePlayer.name} — reconnected in time`);
        }

        // ─── Restore seat state ────────────────────────────────────────
        gamePlayer.seatState = 'human-active';
        gamePlayer.autopilotCounter = 0;

        // Re-add to players Map
        this.players.set(conn.id, {
          id: conn.id,
          name: gamePlayer.name,
          color: gamePlayer.color,
          isHost: conn.id === this.hostId,
          isReady: true,
          persistentId: gamePlayer.persistentId,
          seatIndex: gamePlayer.seatIndex,
        });

        // Cancel keepalive timer if room was waiting for rejoin
        if ((this.status as string) === "waiting_for_rejoin") {
          this.status = "playing";
          if (this.keepaliveTimer) {
            clearTimeout(this.keepaliveTimer);
            this.keepaliveTimer = null;
          }
          this.log(`[KEEPALIVE] Cancelled — player rejoined`);
        }

        // Send connected ack (useRoom needs this)
        this.sendToConnection(conn, {
          type: "connected",
          roomId: this.room.id,
          playerId: conn.id,
          persistentId: "",
        });

        // Send rejoin_state with full game snapshot
        this.sendToConnection(conn, {
          type: "rejoin_state",
          phase: this.gameState.phase,
          round: this.gameState.currentRound,
          goalValues: this.gameState.goalValues,
          players: this.buildPlayerSnapshot(),
        } as any);

        // Broadcast seat_state_changed so all clients see player restored
        this.broadcastSeatStateChanged(gamePlayer);

        // Broadcast player_reconnected to everyone except the rejoining player
        this.broadcastExcept(
          {
            type: "player_reconnected",
            playerId: conn.id,
            playerName: gamePlayer.name,
          } as any,
          [conn.id]
        );

        this.log(`[REJOIN] Player ${gamePlayer.name} reconnected — seat restored to human-active`);
        return; // Skip normal onConnect flow
      }

      // Non-rejoin connection during active game: allow through to handleJoin
      // which will route them to mid-game join flow (seat selection)
    }

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
        code: "room_full",
        message: "Room is full",
      });
      conn.close();
      return;
    }

    // Send connected ack — player is NOT in the room yet (wait for "join")
    this.sendToConnection(conn, {
      type: "connected",
      roomId: this.room.id,
      playerId: conn.id,
      persistentId: "",
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

    // ─── DEBUG: Log every inbound message with server phase context ───
    const phase = this.gameState?.phase ?? "no-game";
    const onlineIds = this.gameState?.players.filter(p => p.isOnline).map(p => p.id.slice(0, 8)) ?? [];
    const rolled = this.gameState ? [...this.gameState.rollRequestedBy].map(id => id.slice(0, 8)) : [];
    this.log(`[IN] type="${parsed.type}" from=${sender.id.slice(0, 8)} phase="${phase}" online=[${onlineIds}] rolled=[${rolled}]`);

    switch (parsed.type) {
      case "join":
        this.handleJoin(sender, parsed.name, parsed.color, parsed.persistentId);
        break;
      case "leave":
        this.removePlayer(sender.id, true);
        break;
      case "ready":
        this.handleReady(sender);
        break;
      case "start_game":
        this.handleStartGame(sender, parsed.targetPlayers);
        break;
      case "roll_result":
        this.handleRollResult(sender, parsed.values, !!parsed.afk);
        break;
      case "unlock_request":
        this.handleUnlockRequest(sender, parsed.slotIndices, !!parsed.afk);
        break;
      case "skip_unlock":
        this.handleSkipUnlock(sender, !!parsed.afk);
        break;
      case "play_again":
        this.handlePlayAgain(sender);
        break;
      case "rolling_timeout":
        // Legacy: host client used to send this. Now clients auto-roll themselves.
        // Keep handler for backwards compatibility — still valid as a manual trigger.
        this.handleRollingTimeout(sender);
        break;
      case "seat_claim":
        this.handleSeatClaim(sender, parsed.seatIndex);
        break;
      case "phase_sync_request":
        // Client watchdog detected a stall — respond with full state snapshot
        if (this.gameState) {
          const syncPhase = this.gameState.phase;
          const syncPlayers = this.buildPlayerSnapshot();
          this.log(`[PHASE_SYNC] Responding to ${sender.id.slice(0, 8)}: phase="${syncPhase}" players=${syncPlayers.length}`);
          this.sendToConnection(sender, {
            type: "phase_sync",
            phase: syncPhase,
            players: syncPlayers,
            goalValues: this.gameState.goalValues,
          });
        } else {
          this.log(`[PHASE_SYNC] CANNOT respond to ${sender.id.slice(0, 8)} — gameState is NULL`);
        }
        break;
      default:
        this.log(`Warning: unknown message type "${(parsed as { type: string }).type}" from ${sender.id}`);
        break;
    }
  }

  onClose(conn: Party.Connection) {
    this.log(`[CLOSE] id=${conn.id.slice(0, 8)} players=${this.players.size} hasGame=${!!this.gameState}`);
    this.removePlayer(conn.id);

    // Clean up mid-game joiner if they disconnect before takeover
    if (this.midGameJoiners.has(conn.id)) {
      this.midGameJoiners.delete(conn.id);
      // Remove any pending claims by this joiner
      for (const [idx, claimantId] of this.pendingSeatClaims) {
        if (claimantId === conn.id) {
          this.pendingSeatClaims.delete(idx);
          break;
        }
      }
      this.log(`[MID-GAME JOIN] Joiner ${conn.id.slice(0, 8)} disconnected — cleaned up`);
    }

    // If no players remain, clean up timers
    if (this.players.size === 0) {
      this.cleanupTimers();
    }
  }

  // ─── Message Handlers ─────────────────────────────────────────────

  private handleJoin(conn: Party.Connection, name: string, _color: string, persistentId?: string) {
    // Duplicate join — already in players map
    if (this.players.has(conn.id)) {
      this.sendRoomState(conn);
      return;
    }

    // Room at capacity
    if (this.players.size >= MAX_PLAYERS) {
      this.sendToConnection(conn, {
        type: "error",
        code: "room_full",
        message: "Room is full",
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

    const pid = persistentId ?? "";

    // Mid-game join: game is active, send available bot seats
    if (this.gameState && (this.status === "playing" || (this.status as string) === "waiting_for_rejoin")) {
      this.midGameJoiners.set(conn.id, { name: trimmedName, persistentId: pid });
      if (pid) {
        this.persistentIdToConnId.set(pid, conn.id);
      }
      this.sendSeatList(conn);
      this.tryAutoMatchSeat(conn);
      this.log(`[MID-GAME JOIN] ${trimmedName} connected — sent seat list`);
      return;
    }

    // Create player — color assigned by join order, not client-specified
    const isFirstPlayer = this.players.size === 0;
    const colorIndex = this.players.size;
    const player: RoomPlayer = {
      id: conn.id,
      name: trimmedName,
      color: PLAYER_COLORS[colorIndex % PLAYER_COLORS.length],
      isHost: isFirstPlayer,
      isReady: false,
      persistentId: pid,
      seatIndex: this.players.size,
    };

    // Set host if first player
    if (isFirstPlayer) {
      this.hostId = conn.id;
    }

    // Add to players map and persistent ID mapping
    this.players.set(conn.id, player);
    if (pid) {
      this.persistentIdToConnId.set(pid, conn.id);
    }
    this.log(`[JOIN] persistentId=${pid.slice(0, 8)} connId=${conn.id.slice(0, 8)}`);

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
    targetPlayers: number
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

    // Separate ready vs unready players
    // Ready (or host): play as humans. Unready: removed from players map (become bot seats).
    const readyPlayers: RoomPlayer[] = [];
    const unreadyIds: string[] = [];
    for (const [id, player] of this.players) {
      if (player.isReady || id === this.hostId) {
        readyPlayers.push(player);
      } else {
        unreadyIds.push(id);
      }
    }

    // Remove unready players from tracking (connection stays open for mid-game join later)
    // Save their info first so they can send play_again to enter mid-game join
    this.unreadyPlayers.clear();
    for (const id of unreadyIds) {
      const unreadyPlayer = this.players.get(id);
      if (unreadyPlayer) {
        this.unreadyPlayers.set(id, { name: unreadyPlayer.name, persistentId: unreadyPlayer.persistentId });
      }
      this.log(`[START] Removing unready player ${unreadyPlayer?.name ?? id.slice(0, 8)} — will become bot seat`);
      this.players.delete(id);
    }

    // Determine target player count: use previous game's count if available, else the requested count
    const effectiveTargetPlayers = this.previousGameTargetPlayers > 0
      ? this.previousGameTargetPlayers
      : targetPlayers;

    // Transition to playing
    this.status = "playing";

    // Server generates goal values so all clients share the same goals
    const goalValues = Array.from({ length: 8 }, () => Math.floor(Math.random() * 6) + 1)
      .sort((a, b) => a - b);

    const startMsg: GameStartingMessage = {
      type: "game_starting",
      players: Array.from(this.players.values()),
      targetPlayers: effectiveTargetPlayers,
      goalValues,
    };

    this.room.broadcast(JSON.stringify(startMsg));
    this.log(`Game starting — ${readyPlayers.length} ready players, ${unreadyIds.length} unready (removed), ${effectiveTargetPlayers} target`);

    // ─── Initialize server game state ────────────────────────────────
    const botCount = effectiveTargetPlayers - this.players.size;
    const gamePlayers: ServerPlayerState[] = [];

    // Ready human players
    let seatIdx = 0;
    for (const p of this.players.values()) {
      gamePlayers.push({
        id: p.id,
        name: p.name,
        color: p.color,
        persistentId: p.persistentId,
        score: 0,
        startingDice: 2,
        poolSize: 2,
        lockedDice: [],
        isOnline: true,
        seatState: 'human-active',
        seatIndex: seatIdx,
        autopilotCounter: 0,
      });
      seatIdx++;
    }

    // Bot players (fill remaining seats)
    for (let i = 0; i < botCount; i++) {
      const botIndex = this.players.size + i;
      gamePlayers.push({
        id: `bot-${i}`,
        name: `Bot ${i + 1}`,
        color: PLAYER_COLORS[botIndex % PLAYER_COLORS.length],
        persistentId: `bot-${i}`,
        score: 0,
        startingDice: 2,
        poolSize: 2,
        lockedDice: [],
        isOnline: false,
        difficulty: randomDifficulty(),
        seatState: 'bot',
        seatIndex: seatIdx,
        autopilotCounter: 0,
      });
      seatIdx++;
    }

    this.gameState = {
      currentRound: 0,
      goalValues,               // reuse from game_starting for round 1
      phase: "idle",
      players: gamePlayers,
      rollRequestedBy: new Set(),
      unlockResponses: new Map(),
    };

    // Start round 1 — reuse the goalValues already generated above
    this.serverInitRound(true);
  }

  /**
   * Handle a play_again request. Transitions from sessionEnd → lobby,
   * or marks player ready if already in lobby, or defers to mid-game join.
   */
  private handlePlayAgain(conn: Party.Connection) {
    // Guard: player must be in the room OR be an unready player from game start
    if (!this.players.has(conn.id) && !this.unreadyPlayers.has(conn.id)) return;

    // Case 1: First play_again during sessionEnd — transition to lobby
    if (this.gameState?.phase === "sessionEnd") {
      // Save previous game context for auto-match (Plan 32-02)
      this.previousGamePersistentIds.clear();
      this.previousGameTargetPlayers = this.gameState.players.length;
      for (const gp of this.gameState.players) {
        this.previousGamePersistentIds.set(gp.persistentId, gp.seatIndex);
      }

      // Clean up all timers, mid-game joiners, pending claims, unready tracking
      this.cleanupTimers();
      this.unreadyPlayers.clear();

      // Reset to lobby state
      this.gameState = null;
      this.status = "waiting";

      // Reset all players to not ready
      for (const player of this.players.values()) {
        player.isReady = false;
      }

      // Mark the sender as ready
      const senderPlayer = this.players.get(conn.id);
      if (senderPlayer) senderPlayer.isReady = true;

      // Ack the sender
      this.sendToConnection(conn, {
        type: "play_again_ack",
        mode: "lobby",
      } as ServerMessage);

      // Broadcast room_state to all
      this.broadcastRoomState();

      this.log(`[PLAY AGAIN] ${conn.id.slice(0, 8)} triggered lobby transition — ${this.players.size} players in lobby`);
      return;
    }

    // Case 2: Already in lobby (waiting) — mark ready
    if (this.status === "waiting") {
      const senderPlayer = this.players.get(conn.id);
      if (senderPlayer) senderPlayer.isReady = true;

      this.sendToConnection(conn, {
        type: "play_again_ack",
        mode: "lobby",
      } as ServerMessage);

      this.broadcastRoomState();

      this.log(`[PLAY AGAIN] ${conn.id.slice(0, 8)} marked ready in lobby`);
      return;
    }

    // Case 3: Game already started (late joiner) — route through mid-game join
    if (this.status === "playing" && this.gameState?.phase !== "sessionEnd") {
      // Get player identity from unreadyPlayers map (saved at game start) or players map
      const unreadyInfo = this.unreadyPlayers.get(conn.id);
      const playerInfo = this.players.get(conn.id);
      const name = unreadyInfo?.name ?? playerInfo?.name;
      const persistentId = unreadyInfo?.persistentId ?? playerInfo?.persistentId ?? "";

      if (!name) {
        this.log(`[PLAY AGAIN] ${conn.id.slice(0, 8)} — game in progress but no identity found, ignoring`);
        return;
      }

      // Remove from players map if present (they're leaving lobby-remnant state)
      if (playerInfo) this.players.delete(conn.id);
      // Remove from unreadyPlayers (consumed)
      if (unreadyInfo) this.unreadyPlayers.delete(conn.id);

      // Add to mid-game joiners
      this.midGameJoiners.set(conn.id, { name, persistentId });
      if (persistentId) {
        this.persistentIdToConnId.set(persistentId, conn.id);
      }

      // Send ack
      this.sendToConnection(conn, {
        type: "play_again_ack",
        mode: "mid_game_join",
      } as ServerMessage);

      // Send available bot seats, then try auto-match to old seat
      this.sendSeatList(conn);
      this.tryAutoMatchSeat(conn);

      this.log(`[PLAY AGAIN] ${conn.id.slice(0, 8)} (${name}) — game in progress, routed to mid-game join`);
      return;
    }
  }

  // ─── Game Logic ─────────────────────────────────────────────────

  /**
   * Initialize a new round. If reuseGoals is true, keep existing goalValues
   * (used for round 1 where goals were already generated with game_starting).
   */
  private serverInitRound(reuseGoals: boolean = false) {
    if (!this.gameState) return;

    // Generate new goals for rounds after the first
    if (!reuseGoals) {
      this.gameState.goalValues = Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 6) + 1
      ).sort((a, b) => a - b);
    }

    // Reset all players for new round
    for (const p of this.gameState.players) {
      p.poolSize = p.startingDice;
      p.lockedDice = [];
    }

    this.gameState.phase = "idle";
    this.gameState.currentRound += 1;
    this.gameState.rollRequestedBy.clear();
    this.gameState.unlockResponses.clear();

    // Broadcast round_start to all clients
    const syncPlayers: PlayerSyncState[] = this.gameState.players.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      score: p.score,
      startingDice: p.startingDice,
      poolSize: p.poolSize,
      lockedDice: p.lockedDice,
      seatState: p.seatState,
      seatIndex: p.seatIndex,
    }));

    const roundStartMsg: ServerMessage = {
      type: "round_start",
      round: this.gameState.currentRound,
      goalValues: this.gameState.goalValues,
      players: syncPlayers,
    };

    this.room.broadcast(JSON.stringify(roundStartMsg));
    this.log(`Round ${this.gameState.currentRound} started — goals: [${this.gameState.goalValues.join(", ")}]`);

    // Execute pending mid-game seat claims at round boundary
    this.executePendingSeatClaims();
  }

  /**
   * Handle a roll result from a connected player.
   * Client sends its physics-determined dice values after they settle.
   * Server computes locks and relays to other clients (per-player, no batching).
   */
  private handleRollResult(sender: Party.Connection, values: number[], afk: boolean = false) {
    if (!this.gameState) {
      this.sendToConnection(sender, { type: "error", message: "No active game" });
      return;
    }

    // Allow rolling during idle OR rolling phase (other players may still be rolling)
    if (this.gameState.phase !== "idle" && this.gameState.phase !== "rolling") {
      this.log(`[ROLL REJECTED] phase="${this.gameState.phase}" from=${sender.id.slice(0, 8)} — not idle/rolling`);
      return;
    }

    // Find this player in game state
    const player = this.gameState.players.find(p => p.id === sender.id && p.isOnline);
    if (!player) {
      this.log(`[ROLL REJECTED] player not found or offline: ${sender.id.slice(0, 8)}`);
      this.sendToConnection(sender, { type: "error", message: "You are not in this game" });
      return;
    }

    // Duplicate guard: ignore if this player already rolled this cycle
    if (this.gameState.rollRequestedBy.has(sender.id)) {
      this.log(`[ROLL REJECTED] duplicate: ${sender.id.slice(0, 8)} already in rollRequestedBy`);
      return;
    }

    // Validate values array length matches player's pool size
    if (values.length !== player.poolSize) {
      this.log(`[ROLL REJECTED] count mismatch: got ${values.length}, expected poolSize=${player.poolSize} from=${sender.id.slice(0, 8)}`);
      this.sendToConnection(sender, { type: "error", message: "Invalid dice count" });
      return;
    }

    // Validate each value is 1-6
    if (values.some(v => v < 1 || v > 6 || !Number.isInteger(v))) {
      this.log(`[ROLL REJECTED] invalid values: [${values}] from=${sender.id.slice(0, 8)}`);
      this.sendToConnection(sender, { type: "error", message: "Invalid dice values" });
      return;
    }

    // AFK escalation: client flags auto-rolls triggered by AFK countdown
    if (afk) {
      player.autopilotCounter++;
      if (player.seatState !== 'human-afk') {
        player.seatState = 'human-afk';
        this.broadcastSeatStateChanged(player);
      }
      this.log(`AFK auto-roll from client: ${player.name} (autopilot #${player.autopilotCounter})`);
      if (player.autopilotCounter >= 2) {
        this.promoteToBotFromAFK(player);
      }
    } else {
      // Genuine manual action — reset AFK escalation
      this.resetAFKEscalation(player);
    }

    // Transition to rolling phase on first roll_result received
    if (this.gameState.phase === "idle") {
      this.gameState.phase = "rolling";

      // Start rolling AFK timeout — 25 seconds (client's 20s + 5s margin).
      this.phaseTimerStartedAt = Date.now();
      this.phaseTimerDuration = 25_000;
      this.rollingTimeoutTimer = setTimeout(() => {
        this.rollingTimeoutTimer = null;
        this.phaseTimerStartedAt = null;
        this.phaseTimerDuration = null;
        this.autoRollUnresponsivePlayers();
      }, 25_000);
    }

    // Record that this player has rolled
    this.gameState.rollRequestedBy.add(sender.id);

    // Compute locks for THIS player using client-reported values
    const newLocks = findAutoLocks(this.gameState.goalValues, values, player.lockedDice);

    // Update server state for this player
    player.lockedDice = [...player.lockedDice, ...newLocks].sort(
      (a, b) => a.goalSlotIndex - b.goalSlotIndex
    );
    player.poolSize -= newLocks.length;

    // Send this player's lock result to all OTHER clients (sender already applied locally)
    const lockResult: ServerMessage = {
      type: "player_lock_result",
      playerId: player.id,
      rolled: values,
      newLocks,
      poolSize: player.poolSize,
      lockedDice: player.lockedDice,
    };
    this.broadcastExcept(lockResult, [sender.id]);
    this.log(`Player ${player.name} rolled [${values}] — ${newLocks.length} locks, pool: ${player.poolSize}`);

    // Check if ALL players (online + bots) have rolled
    this.checkAllRolled();
  }

  /**
   * Check if all online players have submitted roll results.
   * If yes, roll for bots, then transition to locking.
   */
  private checkAllRolled() {
    if (!this.gameState) { this.log("[checkAllRolled] ABORT: no gameState"); return; }

    const onlinePlayers = this.gameState.players.filter(p => p.isOnline);
    const rolledIds = [...this.gameState.rollRequestedBy].map(id => id.slice(0, 8));
    const waitingFor = onlinePlayers.filter(p => !this.gameState!.rollRequestedBy.has(p.id)).map(p => `${p.name}(${p.id.slice(0, 8)})`);
    const allOnlineRolled = onlinePlayers.every(p => this.gameState!.rollRequestedBy.has(p.id));

    this.log(`[checkAllRolled] online=${onlinePlayers.length} rolled=[${rolledIds}] waiting=[${waitingFor}] allDone=${allOnlineRolled}`);

    if (!allOnlineRolled) return; // Still waiting for online players

    // Clear rolling AFK timeout — all online players submitted
    if (this.rollingTimeoutTimer) {
      clearTimeout(this.rollingTimeoutTimer);
      this.rollingTimeoutTimer = null;
      this.phaseTimerStartedAt = null;
      this.phaseTimerDuration = null;
    }

    this.log("[checkAllRolled] All online rolled — processing bots now");

    // All online players have rolled — now roll for bots
    for (const bot of this.gameState.players.filter(p => !p.isOnline)) {
      const botValues = Array.from({ length: bot.poolSize }, () =>
        Math.floor(Math.random() * 6) + 1
      );
      const botLocks = findAutoLocks(this.gameState.goalValues, botValues, bot.lockedDice);
      bot.lockedDice = [...bot.lockedDice, ...botLocks].sort(
        (a, b) => a.goalSlotIndex - b.goalSlotIndex
      );
      bot.poolSize -= botLocks.length;

      // Broadcast bot results to ALL clients
      const botResult: ServerMessage = {
        type: "player_lock_result",
        playerId: bot.id,
        rolled: botValues,
        newLocks: botLocks,
        poolSize: bot.poolSize,
        lockedDice: bot.lockedDice,
      };
      this.room.broadcast(JSON.stringify(botResult));
      this.log(`Bot ${bot.name} rolled [${botValues}] — ${botLocks.length} locks`);
    }

    // All rolled — transition to locking, then immediately check winner/unlock.
    this.gameState.phase = "locking";
    this.gameState.rollRequestedBy.clear();

    // Snapshot player states for debug
    const lockSummary = this.gameState.players.map(p => `${p.name}(locks=${p.lockedDice.length},pool=${p.poolSize})`);
    this.log(`[checkAllRolled] → locking. Players: [${lockSummary}]. Calling checkWinnerOrUnlock...`);

    this.checkWinnerOrUnlock();
    this.log(`[checkAllRolled] checkWinnerOrUnlock returned. phase="${this.gameState?.phase ?? 'null'}"`);
  }

  // ─── Unlock Handlers ────────────────────────────────────────────

  /**
   * Handle an unlock request from an online player.
   * Validates slot indices, stores the response, and checks if all have responded.
   */
  private handleUnlockRequest(sender: Party.Connection, slotIndices: number[], afk: boolean = false) {
    if (!this.gameState) {
      this.sendToConnection(sender, { type: "error", message: "No active game" });
      return;
    }

    if (this.gameState.phase !== "unlocking") {
      this.sendToConnection(sender, { type: "error", message: "Cannot unlock in current phase" });
      return;
    }

    const player = this.gameState.players.find((p) => p.id === sender.id && p.isOnline);
    if (!player) {
      this.sendToConnection(sender, { type: "error", message: "You are not an online player in this game" });
      return;
    }

    // Duplicate guard
    if (this.gameState.unlockResponses.has(sender.id)) return;

    // Validate each slot index: must be a currently locked slot belonging to this player
    const lockedSlotIndices = new Set(player.lockedDice.map((d) => d.goalSlotIndex));
    for (const idx of slotIndices) {
      if (!lockedSlotIndices.has(idx)) {
        this.sendToConnection(sender, {
          type: "error",
          message: `Slot ${idx} is not a locked slot for you`,
        });
        return;
      }
    }

    // Cap unlocks: pool cannot exceed 12
    const maxUnlocks = Math.floor((12 - player.poolSize) / 2);
    const cappedSlots = slotIndices.slice(0, Math.max(0, maxUnlocks));
    if (cappedSlots.length === 0) {
      // Pool already at or near 12 — treat as skip
      this.gameState.unlockResponses.set(sender.id, { type: "skip" });
      this.log(`Player ${player.name} unlock rejected — pool already at ${player.poolSize}/12`);
      this.checkAllUnlockResponses();
      return;
    }

    // AFK escalation: client flags auto-unlocks triggered by AFK countdown
    if (afk) {
      player.autopilotCounter++;
      if (player.seatState !== 'human-afk') {
        player.seatState = 'human-afk';
        this.broadcastSeatStateChanged(player);
      }
      this.log(`AFK auto-unlock from client: ${player.name} (autopilot #${player.autopilotCounter})`);
      if (player.autopilotCounter >= 2) {
        this.promoteToBotFromAFK(player);
      }
    } else {
      this.resetAFKEscalation(player);
    }

    // Apply unlock to server state immediately
    const unlockCount = cappedSlots.length;
    player.lockedDice = player.lockedDice.filter(
      (ld) => !cappedSlots.includes(ld.goalSlotIndex)
    );
    player.poolSize += 2 * unlockCount;

    // Relay to OTHER clients immediately (sender already applied locally)
    const unlockMsg: ServerMessage = {
      type: "unlock_result",
      playerId: player.id,
      unlockedSlots: cappedSlots,
      newPoolSize: player.poolSize,
      lockedDice: player.lockedDice,
    };
    this.broadcastExcept(unlockMsg, [sender.id]);
    this.log(`Player ${player.name} unlocked ${unlockCount} slots — pool: ${player.poolSize}`);

    // Record that this player has responded
    this.gameState.unlockResponses.set(sender.id, { type: "unlock", slotIndices: cappedSlots });

    // Check if all online players have responded
    this.checkAllUnlockResponses();
  }

  /**
   * Handle a skip-unlock from an online player.
   * Validates the must-unlock guard, stores the response, checks completion.
   */
  private handleSkipUnlock(sender: Party.Connection, afk: boolean = false) {
    if (!this.gameState) {
      this.sendToConnection(sender, { type: "error", message: "No active game" });
      return;
    }

    if (this.gameState.phase !== "unlocking") {
      this.sendToConnection(sender, { type: "error", message: "Cannot skip unlock in current phase" });
      return;
    }

    const player = this.gameState.players.find((p) => p.id === sender.id && p.isOnline);
    if (!player) {
      this.sendToConnection(sender, { type: "error", message: "You are not an online player in this game" });
      return;
    }

    // Duplicate guard
    if (this.gameState.unlockResponses.has(sender.id)) return;

    // Must-unlock guard: can't skip if poolSize === 0 and not all 8 locked
    if (player.poolSize === 0 && player.lockedDice.length < 8) {
      this.sendToConnection(sender, {
        type: "error",
        message: "You must unlock at least one die — your pool is empty",
      });
      return;
    }

    // AFK escalation: client flags auto-skips triggered by AFK countdown
    if (afk) {
      player.autopilotCounter++;
      if (player.seatState !== 'human-afk') {
        player.seatState = 'human-afk';
        this.broadcastSeatStateChanged(player);
      }
      this.log(`AFK auto-skip from client: ${player.name} (autopilot #${player.autopilotCounter})`);
      if (player.autopilotCounter >= 2) {
        this.promoteToBotFromAFK(player);
      }
    } else {
      this.resetAFKEscalation(player);
    }

    // No broadcast needed for skip — no state change
    this.gameState.unlockResponses.set(sender.id, { type: "skip" });
    this.log(`Player ${player.name} skipped unlock`);

    // Check if all online players have responded
    this.checkAllUnlockResponses();
  }

  /**
   * Check if all online players have submitted unlock/skip responses.
   * If yes, process all unlocks.
   */
  private checkAllUnlockResponses() {
    if (!this.gameState) return;

    const onlinePlayers = this.gameState.players.filter((p) => p.isOnline);
    const allResponded = onlinePlayers.every((p) =>
      this.gameState!.unlockResponses.has(p.id)
    );

    if (allResponded) {
      this.processAllUnlocks();
    }
  }

  /**
   * Process all unlock decisions: AI bots first, then human responses.
   * Broadcasts unlock_result for each player who unlocked.
   * Transitions to idle phase.
   */
  private processAllUnlocks() {
    if (!this.gameState) return;

    // Clear AFK timeout — all responses are in
    if (this.unlockTimeoutTimer) {
      clearTimeout(this.unlockTimeoutTimer);
      this.unlockTimeoutTimer = null;
      this.phaseTimerStartedAt = null;
      this.phaseTimerDuration = null;
    }

    // Human unlock results were already relayed per-player in handleUnlockRequest.
    // Now process bot unlocks and broadcast to ALL clients.
    for (const player of this.gameState.players) {
      if (player.isOnline) continue; // skip human players (already processed)
      if (player.lockedDice.length === 0) continue;
      if (player.lockedDice.length >= 8) continue;

      const difficulty = player.difficulty ?? 'medium';
      const slotsToUnlock = getAIUnlockDecision({
        goalValues: this.gameState.goalValues,
        lockedDice: player.lockedDice,
        poolSize: player.poolSize,
        difficulty: difficulty as "easy" | "medium" | "hard",
      });

      if (slotsToUnlock.length > 0) {
        player.lockedDice = player.lockedDice.filter(
          (ld) => !slotsToUnlock.includes(ld.goalSlotIndex)
        );
        player.poolSize += 2 * slotsToUnlock.length;

        const unlockMsg: ServerMessage = {
          type: "unlock_result",
          playerId: player.id,
          unlockedSlots: slotsToUnlock,
          newPoolSize: player.poolSize,
          lockedDice: player.lockedDice,
        };
        this.room.broadcast(JSON.stringify(unlockMsg));
        this.log(`Bot ${player.name} unlocked slots [${slotsToUnlock.join(", ")}] — pool: ${player.poolSize}`);
      }
    }

    // Clear responses and transition to idle
    this.gameState.unlockResponses.clear();
    this.gameState.phase = "idle";
    const idleSnapshot = this.buildPlayerSnapshot();
    const phaseMsg: ServerMessage = { type: "phase_change", phase: "idle", players: idleSnapshot };
    const idleMsgStr = JSON.stringify(phaseMsg);
    this.log(`[BROADCAST] phase_change:idle (${idleMsgStr.length} bytes, ${idleSnapshot.length} players)`);
    this.room.broadcast(idleMsgStr);
    this.log("Phase → idle (unlocks processed)");

    // Execute pending mid-game seat claims at phase boundary
    this.executePendingSeatClaims();
  }

  // ─── Scoring & Round Transitions ──────────────────────────────────

  /**
   * After locking completes, check if any players have won (8 locked dice).
   * Multiple players can win on the same roll — all get scored.
   * If yes → scoring. If no → unlocking phase.
   */
  private checkWinnerOrUnlock() {
    if (!this.gameState) { this.log("[checkWinnerOrUnlock] ABORT: no gameState"); return; }

    const winners = this.gameState.players.filter((p) => p.lockedDice.length >= 8);
    this.log(`[checkWinnerOrUnlock] winners=${winners.length} (${winners.map(w => w.name)})`);

    if (winners.length > 0) {
      this.handleScoring(winners.map((w) => w.id));
    } else {
      // Advance to unlocking phase
      this.gameState.phase = "unlocking";
      this.gameState.unlockResponses.clear();
      const snapshot = this.buildPlayerSnapshot();
      const phaseMsg: ServerMessage = { type: "phase_change", phase: "unlocking", players: snapshot };
      const msgStr = JSON.stringify(phaseMsg);
      this.log(`[BROADCAST] phase_change:unlocking (${msgStr.length} bytes, ${snapshot.length} players)`);
      this.room.broadcast(msgStr);
      this.log("Phase → unlocking — broadcast sent");

      // Execute pending mid-game seat claims at phase boundary
      this.executePendingSeatClaims();

      // Start AFK timeout — 25 seconds (client's 20s + 5s margin so client fires first)
      this.phaseTimerStartedAt = Date.now();
      this.phaseTimerDuration = 25_000;
      this.unlockTimeoutTimer = setTimeout(() => {
        this.unlockTimeoutTimer = null;
        this.phaseTimerStartedAt = null;
        this.phaseTimerDuration = null;
        this.autoSkipUnresponsivePlayers();
      }, 25_000);
    }
  }

  /**
   * Compute round scores for all winners, broadcast scoring message,
   * then transition to handicap/next round after a delay.
   * Multiple players can win on the same roll.
   */
  private handleScoring(winnerIds: string[]) {
    if (!this.gameState) return;

    // Compute round score for each winner
    const penalties = [1, 0, 1, 1];
    const winnersData: { playerId: string; roundScore: number }[] = [];

    for (const winnerId of winnerIds) {
      const winner = this.gameState.players.find((p) => p.id === winnerId);
      if (!winner) continue;

      let penalty = 0;
      for (let i = 0; i < winner.poolSize && i < penalties.length; i++) {
        penalty += penalties[i];
      }
      const roundScore = Math.max(0, 8 - penalty);
      winner.score += roundScore;
      winnersData.push({ playerId: winnerId, roundScore });
      this.log(`Scoring: ${winner.name} won with ${roundScore} points (pool: ${winner.poolSize}) — total: ${winner.score}`);
    }

    // Set phase to scoring
    this.gameState.phase = "scoring";

    // Build sync player states for broadcast
    const syncPlayers: PlayerSyncState[] = this.gameState.players.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      score: p.score,
      startingDice: p.startingDice,
      poolSize: p.poolSize,
      lockedDice: p.lockedDice,
      seatState: p.seatState,
      seatIndex: p.seatIndex,
    }));

    // Broadcast scoring message
    const scoringMsg: ServerMessage = {
      type: "scoring",
      winners: winnersData,
      players: syncPlayers,
    };
    this.room.broadcast(JSON.stringify(scoringMsg));

    // Execute pending mid-game seat claims at phase boundary
    this.executePendingSeatClaims();

    // After 2 seconds, apply handicap and move to next round
    this.scoringTimer = setTimeout(() => {
      this.scoringTimer = null;
      this.handleHandicapAndNextRound(winnerIds);
    }, 2000);
  }

  /**
   * Apply handicap to all players, check for session end,
   * then start next round or end session.
   * Multiple winners each get the handicap penalty.
   */
  private handleHandicapAndNextRound(winnerIds: string[]) {
    if (!this.gameState) return;

    const winnerSet = new Set(winnerIds);

    // Apply handicap
    for (const player of this.gameState.players) {
      if (winnerSet.has(player.id)) {
        // Winner: decrease starting dice (min 1)
        player.startingDice = Math.max(1, player.startingDice - 1);
      } else {
        // Others: increase starting dice (max 12)
        player.startingDice = Math.min(12, player.startingDice + 1);
      }
    }

    // Check session end: any player score >= 20
    const sessionOver = this.gameState.players.some((p) => p.score >= 20);

    if (sessionOver) {
      // Session end
      this.gameState.phase = "sessionEnd";
      const syncPlayers: PlayerSyncState[] = this.gameState.players.map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        score: p.score,
        startingDice: p.startingDice,
        poolSize: p.poolSize,
        lockedDice: p.lockedDice,
        seatState: p.seatState,
        seatIndex: p.seatIndex,
      }));
      const sessionEndMsg: ServerMessage = {
        type: "session_end",
        players: syncPlayers,
      };
      this.room.broadcast(JSON.stringify(sessionEndMsg));
      this.log("Session ended — a player reached 20 points");
    } else {
      // Round end → next round
      this.gameState.phase = "roundEnd";
      const phaseMsg: ServerMessage = { type: "phase_change", phase: "roundEnd", players: this.buildPlayerSnapshot() };
      this.room.broadcast(JSON.stringify(phaseMsg));
      this.log("Phase → roundEnd");

      // Execute pending mid-game seat claims at phase boundary
      this.executePendingSeatClaims();

      // After 500ms, start next round
      this.roundEndTimer = setTimeout(() => {
        this.roundEndTimer = null;
        this.serverInitRound();
      }, 500);
    }
  }

  // ─── Client-Driven Rolling Timeout ──────────────────────────────────

  /**
   * Handle a rolling_timeout message from the host client.
   * The host's countdown bar reached zero — auto-roll any AFK players.
   */
  private handleRollingTimeout(sender: Party.Connection) {
    if (!this.gameState || this.gameState.phase !== "rolling") return;

    // Only the host can trigger this
    if (sender.id !== this.hostId) return;

    this.log("Host sent rolling_timeout — auto-rolling AFK players");

    // Clear server-side fallback timer (host beat it to the punch)
    if (this.rollingTimeoutTimer) {
      clearTimeout(this.rollingTimeoutTimer);
      this.rollingTimeoutTimer = null;
      this.phaseTimerStartedAt = null;
      this.phaseTimerDuration = null;
    }

    this.autoRollUnresponsivePlayers();
  }

  // ─── AFK Escalation ─────────────────────────────────────────────────

  /**
   * Promote an AFK player to full bot control after 3 consecutive timeouts.
   * Sets seatState='bot', assigns random difficulty, marks offline.
   */
  private promoteToBotFromAFK(player: ServerPlayerState) {
    const wasHost = player.id === this.hostId;
    player.seatState = 'bot';
    player.difficulty = randomDifficulty();
    player.isOnline = false;
    // Remove from rollRequestedBy if present — no longer an online player
    if (this.gameState) {
      this.gameState.rollRequestedBy.delete(player.id);
    }
    this.log(`AFK escalation: ${player.name} promoted to Bot (${player.autopilotCounter} consecutive timeouts)`);
    this.broadcastSeatStateChanged(player);

    // If this player was the host, migrate host to next connected human
    if (wasHost) {
      if (!this.migrateHost()) {
        // No connected humans left — dissolve the room
        this.dissolveRoom("all_players_afk");
      }
    }
  }

  /**
   * Migrate host to the next connected human-active player.
   * Returns true if a new host was found, false if no humans remain.
   */
  /**
   * Dissolve the room when all humans have been promoted to bots.
   * Broadcasts room_closed to all connected clients and mid-game joiners,
   * cleans up state, and closes connections.
   */
  private dissolveRoom(reason: string) {
    this.log(`Room dissolving: ${reason}`);

    const msg: ServerMessage = { type: "room_closed", reason };
    const msgStr = JSON.stringify(msg);

    // Notify all connected clients (regular players)
    this.room.broadcast(msgStr);

    // Notify mid-game joiners (they're connected but not in the players map)
    for (const [connId] of this.midGameJoiners) {
      const conn = this.room.getConnection(connId);
      if (conn) conn.send(msgStr);
    }

    // Clean up room state
    this.status = "closed";
    this.gameState = null;
    this.cleanupTimers();

    // Close all connections
    for (const conn of this.room.getConnections()) {
      conn.close();
    }

    this.log(`Room dissolved (${reason})`);
  }

  private migrateHost(): boolean {
    // Build set of currently connected client IDs for fast lookup
    const connectedIds = new Set<string>();
    for (const conn of this.room.getConnections()) {
      connectedIds.add(conn.id);
    }

    // Game-aware migration: find first human-active player who is still connected
    if (this.gameState) {
      for (const gp of this.gameState.players) {
        if (gp.seatState === 'human-active' && connectedIds.has(gp.id)) {
          const oldHost = this.players.get(this.hostId!);
          if (oldHost) oldHost.isHost = false;

          this.hostId = gp.id;
          const newHost = this.players.get(gp.id);
          if (newHost) newHost.isHost = true;

          this.log(`Host migrated to ${gp.name} (${gp.id})`);
          this.broadcastRoomState();
          return true;
        }
      }
      return false;
    }

    // Lobby fallback (no gameState): pick first connected player from this.players
    for (const [id, player] of this.players) {
      if (connectedIds.has(id)) {
        const oldHost = this.players.get(this.hostId!);
        if (oldHost) oldHost.isHost = false;

        this.hostId = id;
        player.isHost = true;

        this.log(`Host migrated (lobby) to ${player.name} (${id})`);
        this.broadcastRoomState();
        return true;
      }
    }

    return false;
  }

  /**
   * Broadcast a seat_state_changed message to all clients.
   */
  /**
   * Execute all pending seat claims at phase boundaries.
   * Swaps bot → human-active, sends rejoin_state to new player,
   * broadcasts seat_takeover + seat_state_changed to all clients.
   */
  private executePendingSeatClaims() {
    if (!this.gameState || this.pendingSeatClaims.size === 0) return;

    for (const [seatIndex, claimantConnId] of this.pendingSeatClaims) {
      const joinerInfo = this.midGameJoiners.get(claimantConnId);
      if (!joinerInfo) {
        this.log(`[TAKEOVER] Skipping seat ${seatIndex} — claimant ${claimantConnId.slice(0, 8)} no longer connected`);
        continue;
      }

      // Verify the connection is still open
      const conn = this.room.getConnection(claimantConnId);
      if (!conn) {
        this.log(`[TAKEOVER] Skipping seat ${seatIndex} — connection gone`);
        this.midGameJoiners.delete(claimantConnId);
        continue;
      }

      // Find the bot player in game state
      const botPlayer = this.gameState.players.find(p => p.seatIndex === seatIndex);
      if (!botPlayer || botPlayer.seatState !== 'bot') {
        this.log(`[TAKEOVER] Skipping seat ${seatIndex} — no longer a bot`);
        this.sendToConnection(conn, {
          type: "seat_claim_result",
          success: false,
          seatIndex,
          reason: "seat_no_longer_bot",
        } as any);
        continue;
      }

      // === Execute takeover ===
      // Update game state: bot → human
      botPlayer.id = claimantConnId;
      botPlayer.name = joinerInfo.name;
      botPlayer.persistentId = joinerInfo.persistentId;
      botPlayer.isOnline = true;
      botPlayer.seatState = 'human-active';
      botPlayer.autopilotCounter = 0;
      delete botPlayer.difficulty;
      // Keep: color, score, lockedDice, poolSize, startingDice, seatIndex

      // Add to players Map (they're now a real room participant)
      this.players.set(claimantConnId, {
        id: claimantConnId,
        name: joinerInfo.name,
        color: botPlayer.color,
        isHost: false,
        isReady: true,
        persistentId: joinerInfo.persistentId,
        seatIndex: botPlayer.seatIndex,
      });

      // Remove from mid-game joiners
      this.midGameJoiners.delete(claimantConnId);

      // Send rejoin_state to new player (same format as reconnect)
      this.sendToConnection(conn, {
        type: "rejoin_state",
        phase: this.gameState.phase,
        round: this.gameState.currentRound,
        goalValues: this.gameState.goalValues,
        players: this.buildPlayerSnapshot(),
      } as any);

      // Broadcast seat_takeover to ALL clients (including the new player)
      const takeoverMsg = {
        type: "seat_takeover",
        seatIndex,
        playerId: claimantConnId,
        playerName: joinerInfo.name,
      };
      this.room.broadcast(JSON.stringify(takeoverMsg));

      // Broadcast seat_state_changed for the seat
      this.broadcastSeatStateChanged(botPlayer);

      this.log(`[TAKEOVER] Seat ${seatIndex} transferred: ${botPlayer.name} took over (was bot)`);
    }

    // Clear all pending claims (processed or skipped)
    this.pendingSeatClaims.clear();
  }

  private broadcastSeatStateChanged(player: ServerPlayerState) {
    const msg: ServerMessage = {
      type: "seat_state_changed",
      playerId: player.id,
      seatState: player.seatState,
      seatIndex: player.seatIndex,
    };
    this.room.broadcast(JSON.stringify(msg));
  }

  /**
   * Reset AFK escalation state when a player takes a GENUINE manual action.
   * If the player is already human-afk, the action was the client's auto-roll/auto-unlock
   * on their behalf — don't reset (let the counter keep accumulating toward bot promotion).
   */
  private resetAFKEscalation(player: ServerPlayerState) {
    // Only reset if player is actively playing (not already marked AFK)
    if (player.seatState !== 'human-active') return;
    if (player.autopilotCounter > 0) {
      player.autopilotCounter = 0;
    }
  }

  // ─── AFK Handling ───────────────────────────────────────────────────

  /**
   * Auto-skip any online players who haven't responded to unlock/skip
   * within the timeout period (20 seconds).
   */
  private autoSkipUnresponsivePlayers() {
    if (!this.gameState || this.gameState.phase !== "unlocking") return;

    const onlinePlayers = this.gameState.players.filter((p) => p.isOnline);
    for (const player of onlinePlayers) {
      if (!this.gameState.unlockResponses.has(player.id)) {
        // AFK escalation: track consecutive timeouts
        player.autopilotCounter++;
        if (player.autopilotCounter >= 2) {
          this.promoteToBotFromAFK(player);
        } else if (player.seatState !== 'human-afk') {
          player.seatState = 'human-afk';
          this.broadcastSeatStateChanged(player);
        }

        // AFK unlock rule: if total dice (pool + locked) < 8, unlock enough to reach 8
        // Each unlock adds 1 to total (bonus die), so unlocks needed = 8 - total
        const totalDice = player.poolSize + player.lockedDice.length;
        if (totalDice < 8 && player.lockedDice.length > 0 && player.lockedDice.length < 8) {
          const unlocksToPerform = Math.min(8 - totalDice, player.lockedDice.length);
          const slotsToUnlock = player.lockedDice
            .slice(0, unlocksToPerform)
            .map((ld) => ld.goalSlotIndex);
          player.lockedDice = player.lockedDice.filter(
            (ld) => !slotsToUnlock.includes(ld.goalSlotIndex)
          );
          player.poolSize += 2 * slotsToUnlock.length;

          const unlockMsg: ServerMessage = {
            type: "unlock_result",
            playerId: player.id,
            unlockedSlots: slotsToUnlock,
            newPoolSize: player.poolSize,
            lockedDice: player.lockedDice,
          };
          this.room.broadcast(JSON.stringify(unlockMsg));
          this.log(`AFK auto-unlock ${player.name}: slots [${slotsToUnlock.join(", ")}] — pool: ${player.poolSize}`);
        }
        this.gameState.unlockResponses.set(player.id, { type: "skip" });
        this.log(`Auto-resolved AFK player: ${player.name} (autopilot #${player.autopilotCounter})`);
      }
    }

    // Defensive: catch any offline non-bot players without a pending grace timer
    // (shouldn't happen, but prevents game stalls)
    for (const player of this.gameState.players) {
      if (!player.isOnline && player.seatState !== 'bot' && !this.disconnectGraceTimers.has(player.id)) {
        this.log(`[DEFENSIVE] Offline player ${player.name} has no grace timer — promoting to bot`);
        this.promoteToBotFromAFK(player);
      }
    }

    this.checkAllUnlockResponses();
  }

  /**
   * Auto-roll random dice for any online players who haven't submitted
   * roll results within the timeout period (20 seconds).
   */
  private autoRollUnresponsivePlayers() {
    if (!this.gameState || this.gameState.phase !== "rolling") {
      this.log(`[autoRoll] ABORT: phase="${this.gameState?.phase ?? 'null'}"`);
      return;
    }

    this.log(`[autoRoll] Checking for unresponsive players...`);
    const onlinePlayers = this.gameState.players.filter((p) => p.isOnline);
    for (const player of onlinePlayers) {
      if (this.gameState.rollRequestedBy.has(player.id)) continue;

      // AFK escalation: track consecutive timeouts
      player.autopilotCounter++;
      if (player.autopilotCounter >= 2) {
        this.promoteToBotFromAFK(player);
      } else if (player.seatState !== 'human-afk') {
        player.seatState = 'human-afk';
        this.broadcastSeatStateChanged(player);
      }

      // Generate random dice values for the AFK player
      const values = Array.from({ length: player.poolSize }, () =>
        Math.floor(Math.random() * 6) + 1
      );

      // Record that this player has rolled
      this.gameState.rollRequestedBy.add(player.id);

      // Compute locks using the random values
      const newLocks = findAutoLocks(this.gameState.goalValues, values, player.lockedDice);

      // Update server state
      player.lockedDice = [...player.lockedDice, ...newLocks].sort(
        (a, b) => a.goalSlotIndex - b.goalSlotIndex
      );
      player.poolSize -= newLocks.length;

      // Broadcast to ALL clients (AFK player didn't submit locally, so include them)
      const lockResult: ServerMessage = {
        type: "player_lock_result",
        playerId: player.id,
        rolled: values,
        newLocks,
        poolSize: player.poolSize,
        lockedDice: player.lockedDice,
      };
      this.room.broadcast(JSON.stringify(lockResult));
      this.log(`Auto-rolled for AFK player: ${player.name} — [${values}] — ${newLocks.length} locks (autopilot #${player.autopilotCounter})`);
    }

    // Defensive: catch any offline non-bot players without a pending grace timer
    // (shouldn't happen, but prevents game stalls)
    for (const player of this.gameState.players) {
      if (!player.isOnline && player.seatState !== 'bot' && !this.disconnectGraceTimers.has(player.id)) {
        this.log(`[DEFENSIVE] Offline player ${player.name} has no grace timer — promoting to bot`);
        this.promoteToBotFromAFK(player);
      }
    }

    // All AFK players handled — check if ready to proceed
    this.checkAllRolled();
  }

  // ─── Timer Cleanup ────────────────────────────────────────────────

  /**
   * Clear all pending timers to prevent callbacks firing after room closes.
   */
  private cleanupTimers() {
    // lockingTimer removed (now immediate)
    if (this.scoringTimer) {
      clearTimeout(this.scoringTimer);
      this.scoringTimer = null;
    }
    if (this.roundEndTimer) {
      clearTimeout(this.roundEndTimer);
      this.roundEndTimer = null;
    }
    if (this.unlockTimeoutTimer) {
      clearTimeout(this.unlockTimeoutTimer);
      this.unlockTimeoutTimer = null;
    }
    if (this.rollingTimeoutTimer) {
      clearTimeout(this.rollingTimeoutTimer);
      this.rollingTimeoutTimer = null;
    }
    if (this.keepaliveTimer) {
      clearTimeout(this.keepaliveTimer);
      this.keepaliveTimer = null;
    }
    // Clear all per-player disconnect grace timers
    for (const timer of this.disconnectGraceTimers.values()) {
      clearTimeout(timer);
    }
    this.disconnectGraceTimers.clear();
    // Clear phase timer tracking
    this.phaseTimerStartedAt = null;
    this.phaseTimerDuration = null;
    // Clear mid-game join state
    this.midGameJoiners.clear();
    this.pendingSeatClaims.clear();
  }

  // ─── Helpers ──────────────────────────────────────────────────────

  private removePlayer(connectionId: string, intentional: boolean = false) {
    // Guard: player might have connected but never sent "join"
    if (!this.players.has(connectionId)) {
      return;
    }

    const wasHost = this.hostId === connectionId;
    this.players.delete(connectionId);
    this.log(`Player left: ${connectionId} (intentional=${intentional})`);

    // Mark player offline in game state so unlock collection doesn't stall
    if (this.gameState) {
      const gamePlayer = this.gameState.players.find((p) => p.id === connectionId);
      if (gamePlayer) {
        gamePlayer.isOnline = false;
        if (intentional) {
          gamePlayer.intentionalLeave = true;
        }

        // ─── Per-player disconnect grace timer ────────────────────────
        // Only applies during active game with non-intentional disconnect
        if (!intentional && gamePlayer.seatState !== 'bot') {
          const phase = this.gameState.phase;

          if (phase === "rolling" || phase === "unlocking") {
            // Timed phase: grace = remaining time on phase timer
            let graceMs = 0;
            if (this.phaseTimerStartedAt && this.phaseTimerDuration) {
              const elapsed = Date.now() - this.phaseTimerStartedAt;
              graceMs = Math.max(0, this.phaseTimerDuration - elapsed);
            }

            if (graceMs > 0) {
              this.log(`[GRACE] Starting ${graceMs}ms grace timer for ${gamePlayer.name} (phase=${phase})`);
              const timer = setTimeout(() => {
                this.disconnectGraceTimers.delete(connectionId);
                if (gamePlayer.seatState !== 'bot') {
                  this.log(`[GRACE] Grace expired for ${gamePlayer.name} — promoting to bot`);
                  this.promoteToBotFromAFK(gamePlayer);
                }
              }, graceMs);
              this.disconnectGraceTimers.set(connectionId, timer);
            } else {
              // No time remaining — promote immediately
              this.log(`[GRACE] No time remaining for ${gamePlayer.name} — immediate bot promotion`);
              this.promoteToBotFromAFK(gamePlayer);
            }
          } else if (phase === "locking" || phase === "scoring" || phase === "roundEnd" || phase === "sessionEnd") {
            // Non-timed phase: grace = 0, promote immediately
            this.log(`[GRACE] Non-timed phase (${phase}) — immediate bot promotion for ${gamePlayer.name}`);
            this.promoteToBotFromAFK(gamePlayer);
          }
          // lobby/idle/not started: no grace timer, just remove normally
        }
      }
      // Remove any pending unlock response from this player
      this.gameState.unlockResponses.delete(connectionId);
      // If we're waiting for unlock responses, re-check — game might be unblocked now
      if (this.gameState.phase === "unlocking") {
        this.checkAllUnlockResponses();
      }
      // If we're waiting for roll results, re-check — remaining online players may all be done
      if (this.gameState.phase === "rolling" || this.gameState.phase === "idle") {
        this.checkAllRolled();
      }
    }

    // Broadcast player_left to remaining players
    this.room.broadcast(
      JSON.stringify({ type: "player_left", playerId: connectionId } satisfies ServerMessage)
    );

    if (wasHost) {
      if (this.players.size > 0) {
        // Host migration: try game-aware migration first, fall back to first player
        if (!this.migrateHost()) {
          // migrateHost failed (no connected human-active in game) — fall back to first remaining player
          const newHostId = this.players.keys().next().value!;
          this.hostId = newHostId;
          const newHost = this.players.get(newHostId)!;
          newHost.isHost = true;
          this.log(`New host (fallback): ${newHostId}`);
          this.broadcastRoomState();
        }
      } else if (this.gameState && (this.status as string) === "playing") {
        // Room empty during active game — keep alive for 10s waiting for rejoin
        this.startEmptyRoomKeepalive();
      } else {
        // Last player left — close the room
        this.hostId = null;
        this.status = "closed";
        this.log(`Room closed (last player left)`);
      }
    } else if (this.players.size === 0 && this.gameState && (this.status as string) === "playing") {
      // Non-host was the last player during active game — same keepalive logic
      this.startEmptyRoomKeepalive();
    } else if (this.players.size === 0 && !this.gameState) {
      // Non-host was the last player during lobby — close the room
      this.hostId = null;
      this.status = "closed";
      this.log(`Room closed (last player left lobby)`);
    }
  }

  /**
   * Start a short keepalive timer when all humans have disconnected.
   * If no human reconnects within 10s, close the room.
   */
  private startEmptyRoomKeepalive() {
    // Cancel any existing keepalive
    if (this.keepaliveTimer) {
      clearTimeout(this.keepaliveTimer);
      this.keepaliveTimer = null;
    }
    (this.status as any) = "waiting_for_rejoin";
    this.keepaliveTimer = setTimeout(() => {
      this.keepaliveTimer = null;
      this.status = "closed";
      this.gameState = null;
      this.cleanupTimers();
      this.log(`[KEEPALIVE] Room expired — no rejoin within 10s`);
    }, 10_000);
    this.log(`[KEEPALIVE] Room empty — waiting 10s for rejoin`);
  }

  private sendToConnection(conn: Party.Connection, message: ServerMessage) {
    conn.send(JSON.stringify(message));
  }

  private sendRoomState(conn: Party.Connection) {
    this.sendToConnection(conn, this.buildRoomStateMessage());
  }

  private handleSeatClaim(conn: Party.Connection, seatIndex: number) {
    if (!this.gameState) {
      this.sendToConnection(conn, { type: "seat_claim_result", success: false, seatIndex, reason: "no_game" } as any);
      return;
    }

    // Must be a mid-game joiner (not already in the game)
    if (!this.midGameJoiners.has(conn.id)) {
      this.sendToConnection(conn, { type: "seat_claim_result", success: false, seatIndex, reason: "not_a_joiner" } as any);
      return;
    }

    // Find the target seat
    const targetPlayer = this.gameState.players.find(p => p.seatIndex === seatIndex);
    if (!targetPlayer) {
      this.sendToConnection(conn, { type: "seat_claim_result", success: false, seatIndex, reason: "no_such_seat" } as any);
      return;
    }

    // Must be a bot seat
    if (targetPlayer.seatState !== 'bot') {
      this.sendToConnection(conn, { type: "seat_claim_result", success: false, seatIndex, reason: "not_a_bot" } as any);
      return;
    }

    // First claim wins — check if already claimed by someone else
    if (this.pendingSeatClaims.has(seatIndex)) {
      this.sendToConnection(conn, { type: "seat_claim_result", success: false, seatIndex, reason: "seat_taken" } as any);
      return;
    }

    // Cancel any previous claim by this same joiner (can only claim one seat)
    for (const [idx, claimantId] of this.pendingSeatClaims) {
      if (claimantId === conn.id) {
        this.pendingSeatClaims.delete(idx);
        break;
      }
    }

    // Store the pending claim
    this.pendingSeatClaims.set(seatIndex, conn.id);
    this.sendToConnection(conn, { type: "seat_claim_result", success: true, seatIndex } as any);
    this.log(`[SEAT CLAIM] ${conn.id.slice(0, 8)} claimed seat ${seatIndex} (${targetPlayer.name}) — pending takeover at phase boundary`);
  }

  private sendSeatList(conn: Party.Connection) {
    if (!this.gameState) return;
    const botSeats = this.gameState.players
      .filter(p => p.seatState === 'bot')
      .filter(p => !this.pendingSeatClaims.has(p.seatIndex))
      .map(p => ({
        seatIndex: p.seatIndex,
        name: p.name,
        color: p.color,
        score: p.score,
        lockedCount: p.lockedDice.length,
      }));
    this.sendToConnection(conn, {
      type: "seat_list",
      seats: botSeats,
      round: this.gameState.currentRound,
      goalValues: this.gameState.goalValues,
    } as any);
  }

  /**
   * Try to auto-match a mid-game joiner to their old seat from the previous game.
   * If their persistentId maps to a bot-held seat that isn't already claimed, auto-claim it.
   * Returns true if auto-matched, false otherwise (player must manually select).
   */
  private tryAutoMatchSeat(conn: Party.Connection): boolean {
    if (!this.gameState) return false;

    const joinerInfo = this.midGameJoiners.get(conn.id);
    if (!joinerInfo || !joinerInfo.persistentId) return false;

    // Look up old seat index from previous game
    const oldSeatIndex = this.previousGamePersistentIds.get(joinerInfo.persistentId);
    if (oldSeatIndex === undefined) return false;

    // Check if that seat is still a bot and not already claimed
    const seatPlayer = this.gameState.players.find(p => p.seatIndex === oldSeatIndex);
    if (!seatPlayer || seatPlayer.seatState !== 'bot') {
      this.log(`[AUTO-MATCH] ${joinerInfo.name}'s old seat ${oldSeatIndex} unavailable — manual selection required`);
      return false;
    }

    if (this.pendingSeatClaims.has(oldSeatIndex)) {
      this.log(`[AUTO-MATCH] ${joinerInfo.name}'s old seat ${oldSeatIndex} already claimed — manual selection required`);
      return false;
    }

    // Cancel any previous claim by this joiner (shouldn't happen, but be safe)
    for (const [idx, claimantId] of this.pendingSeatClaims) {
      if (claimantId === conn.id) {
        this.pendingSeatClaims.delete(idx);
        break;
      }
    }

    // Auto-claim the seat
    this.pendingSeatClaims.set(oldSeatIndex, conn.id);
    this.sendToConnection(conn, {
      type: "seat_claim_result",
      success: true,
      seatIndex: oldSeatIndex,
      autoMatched: true,
    } as any);

    this.log(`[AUTO-MATCH] ${joinerInfo.name} auto-claimed seat ${oldSeatIndex} (returning player)`);
    return true;
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
