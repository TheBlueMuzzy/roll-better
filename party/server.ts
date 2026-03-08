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
        // Restore player to online
        gamePlayer.isOnline = true;

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

        // Broadcast player_reconnected to everyone except the rejoining player
        this.broadcastExcept(
          {
            type: "player_reconnected",
            playerId: conn.id,
            playerName: gamePlayer.name,
          } as any,
          [conn.id]
        );

        this.log(`[REJOIN] Player ${gamePlayer.name} reconnected`);
        return; // Skip normal onConnect flow
      }

      // Non-rejoin connection during waiting_for_rejoin: reject
      if ((this.status as string) === "waiting_for_rejoin") {
        this.sendToConnection(conn, {
          type: "error",
          message: "Game in progress",
        });
        conn.close();
        return;
      }
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
      case "restart_game":
        this.handleRestartGame(sender);
        break;
      case "rolling_timeout":
        // Legacy: host client used to send this. Now clients auto-roll themselves.
        // Keep handler for backwards compatibility — still valid as a manual trigger.
        this.handleRollingTimeout(sender);
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

    // Create player — color assigned by join order, not client-specified
    const isFirstPlayer = this.players.size === 0;
    const colorIndex = this.players.size;
    const pid = persistentId ?? "";
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

    // Server generates goal values so all clients share the same goals
    const goalValues = Array.from({ length: 8 }, () => Math.floor(Math.random() * 6) + 1)
      .sort((a, b) => a - b);

    const startMsg: GameStartingMessage = {
      type: "game_starting",
      players: Array.from(this.players.values()),
      targetPlayers,
      goalValues,
    };

    this.room.broadcast(JSON.stringify(startMsg));
    this.log(`Game starting — ${this.players.size} online players, ${targetPlayers} target`);

    // ─── Initialize server game state ────────────────────────────────
    const botCount = targetPlayers - this.players.size;
    const gamePlayers: ServerPlayerState[] = [];

    // Online players
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

    // Bot players (assigned unused colors)
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
   * Handle a restart request after session end.
   * Any remaining player can trigger a restart — reuses the previous game's settings.
   */
  private handleRestartGame(conn: Party.Connection) {
    if (!this.gameState || this.gameState.phase !== "sessionEnd") {
      this.sendToConnection(conn, {
        type: "error",
        message: "Can only restart after a session ends",
      });
      return;
    }

    if (!this.players.has(conn.id)) {
      this.sendToConnection(conn, {
        type: "error",
        message: "You are not in this room",
      });
      return;
    }

    // Clean up any stale timers
    this.cleanupTimers();

    // Reuse settings from previous game
    const targetPlayers = this.gameState.players.length; // same total player count

    // Generate new goals
    const goalValues = Array.from({ length: 8 }, () => Math.floor(Math.random() * 6) + 1)
      .sort((a, b) => a - b);

    const startMsg: GameStartingMessage = {
      type: "game_starting",
      players: Array.from(this.players.values()),
      targetPlayers,
      goalValues,
    };

    this.room.broadcast(JSON.stringify(startMsg));
    this.log(`Game restarting — ${this.players.size} online players, ${targetPlayers} target`);

    // Build fresh game state
    const botCount = targetPlayers - this.players.size;
    const gamePlayers: ServerPlayerState[] = [];

    let restartSeatIdx = 0;
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
        seatIndex: restartSeatIdx,
        autopilotCounter: 0,
      });
      restartSeatIdx++;
    }

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
        seatIndex: restartSeatIdx,
        autopilotCounter: 0,
      });
      restartSeatIdx++;
    }

    this.gameState = {
      currentRound: 0,
      goalValues,
      phase: "idle",
      players: gamePlayers,
      rollRequestedBy: new Set(),
      unlockResponses: new Map(),
    };

    this.serverInitRound(true);
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
    player.seatState = 'bot';
    player.difficulty = randomDifficulty();
    player.isOnline = false;
    // Remove from rollRequestedBy if present — no longer an online player
    if (this.gameState) {
      this.gameState.rollRequestedBy.delete(player.id);
    }
    this.log(`AFK escalation: ${player.name} promoted to Bot (${player.autopilotCounter} consecutive timeouts)`);
    this.broadcastSeatStateChanged(player);
  }

  /**
   * Broadcast a seat_state_changed message to all clients.
   */
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
        // Host migration: assign first remaining player
        const newHostId = this.players.keys().next().value!;
        this.hostId = newHostId;
        const newHost = this.players.get(newHostId)!;
        newHost.isHost = true;
        this.log(`New host: ${newHostId}`);

        // Broadcast fresh room_state so everyone sees host change
        this.broadcastRoomState();
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
      // Non-host was the last player — same keepalive logic
      this.startEmptyRoomKeepalive();
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
