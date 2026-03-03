import type * as Party from "partykit/server";
import type {
  RoomPlayer,
  RoomStatus,
  ClientMessage,
  ServerMessage,
  GameStartingMessage,
  LockedDieSync,
  PlayerSyncState,
  PlayerRollResult,
} from "../src/types/protocol";
import { findAutoLocks } from "../src/utils/matchDetection";
import { getAIUnlockDecision } from "../src/utils/aiDecision";

const MAX_PLAYERS = 8;

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
  score: number;
  startingDice: number;
  poolSize: number;
  lockedDice: LockedDieSync[];
  isOnline: boolean;
  difficulty?: string;
}

interface ServerGameState {
  currentRound: number;
  goalValues: number[];
  phase: string;
  players: ServerPlayerState[];
  rollRequestedBy: Set<string>;
  unlockResponses: Map<string, { type: "unlock" | "skip"; slotIndices?: number[] }>;
  aiDifficulty: string;
}

export default class RollBetterServer implements Party.Server {
  readonly room: Party.Room;

  // ─── Room State (in-memory, per room instance) ─────────────────────
  players: Map<string, RoomPlayer> = new Map();
  hostId: string | null = null;
  status: RoomStatus = "waiting";

  // ─── Game State (null during lobby, initialized on game start) ────
  gameState: ServerGameState | null = null;

  // ─── Timer IDs (for cleanup on room close) ─────────────────────────
  private lockingTimer: ReturnType<typeof setTimeout> | null = null;
  private scoringTimer: ReturnType<typeof setTimeout> | null = null;
  private roundEndTimer: ReturnType<typeof setTimeout> | null = null;

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
      case "roll_request":
        this.handleRollRequest(sender);
        break;
      case "unlock_request":
        this.handleUnlockRequest(sender, parsed.slotIndices);
        break;
      case "skip_unlock":
        this.handleSkipUnlock(sender);
        break;
      default:
        this.log(`Warning: unknown message type "${(parsed as { type: string }).type}" from ${sender.id}`);
        break;
    }
  }

  onClose(conn: Party.Connection) {
    this.removePlayer(conn.id);

    // If no players remain, clean up timers
    if (this.players.size === 0) {
      this.cleanupTimers();
    }
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

    // Create player — color assigned by join order, not client-specified
    const isFirstPlayer = this.players.size === 0;
    const colorIndex = this.players.size;
    const player: RoomPlayer = {
      id: conn.id,
      name: trimmedName,
      color: PLAYER_COLORS[colorIndex % PLAYER_COLORS.length],
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

    // Server generates goal values so all clients share the same goals
    const goalValues = Array.from({ length: 8 }, () => Math.floor(Math.random() * 6) + 1)
      .sort((a, b) => a - b);

    const startMsg: GameStartingMessage = {
      type: "game_starting",
      players: Array.from(this.players.values()),
      targetPlayers,
      aiDifficulty,
      goalValues,
    };

    this.room.broadcast(JSON.stringify(startMsg));
    this.log(`Game starting — ${this.players.size} online players, ${targetPlayers} target, AI: ${aiDifficulty}`);

    // ─── Initialize server game state ────────────────────────────────
    const botCount = targetPlayers - this.players.size;
    const gamePlayers: ServerPlayerState[] = [];

    // Online players
    for (const p of this.players.values()) {
      gamePlayers.push({
        id: p.id,
        name: p.name,
        color: p.color,
        score: 0,
        startingDice: 5,
        poolSize: 5,
        lockedDice: [],
        isOnline: true,
      });
    }

    // Bot players (assigned unused colors)
    for (let i = 0; i < botCount; i++) {
      const botIndex = this.players.size + i;
      gamePlayers.push({
        id: `bot-${i}`,
        name: `Bot ${i + 1}`,
        color: PLAYER_COLORS[botIndex % PLAYER_COLORS.length],
        score: 0,
        startingDice: 5,
        poolSize: 5,
        lockedDice: [],
        isOnline: false,
        difficulty: aiDifficulty,
      });
    }

    this.gameState = {
      currentRound: 0,
      goalValues,               // reuse from game_starting for round 1
      phase: "idle",
      players: gamePlayers,
      rollRequestedBy: new Set(),
      unlockResponses: new Map(),
      aiDifficulty,
    };

    // Start round 1 — reuse the goalValues already generated above
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
   * Handle a roll request from any connected player.
   * Generates dice rolls for ALL players (online + bots), computes auto-locks,
   * and broadcasts results.
   */
  private handleRollRequest(sender: Party.Connection) {
    // Validate: game must be active
    if (!this.gameState) {
      this.sendToConnection(sender, { type: "error", message: "No active game" });
      return;
    }

    // Duplicate roll guard: ignore if already rolling or locking
    if (this.gameState.phase === "rolling" || this.gameState.phase === "locking") {
      return;
    }

    // Must be in idle phase to roll
    if (this.gameState.phase !== "idle") {
      this.sendToConnection(sender, { type: "error", message: "Cannot roll in current phase" });
      return;
    }

    // Sender must be a player in the game
    const senderInGame = this.gameState.players.some((p) => p.id === sender.id);
    if (!senderInGame) {
      this.sendToConnection(sender, { type: "error", message: "You are not in this game" });
      return;
    }

    // ─── Execute roll for ALL players ───────────────────────────────
    this.gameState.phase = "rolling";

    const playerResults: PlayerRollResult[] = [];

    for (const player of this.gameState.players) {
      // Generate random dice values for this player's pool
      const rolled: number[] = Array.from({ length: player.poolSize }, () =>
        Math.floor(Math.random() * 6) + 1
      );

      // Compute auto-locks using shared pure function
      const newLocks = findAutoLocks(
        this.gameState.goalValues,
        rolled,
        player.lockedDice
      );

      // Update server state: add new locks, reduce pool
      player.lockedDice = [...player.lockedDice, ...newLocks].sort(
        (a, b) => a.goalSlotIndex - b.goalSlotIndex
      );
      player.poolSize -= newLocks.length;

      playerResults.push({
        playerId: player.id,
        rolled,
        newLocks,
        poolSize: player.poolSize,
        lockedDice: player.lockedDice,
      });
    }

    // Broadcast roll results to all clients
    const rollMsg: ServerMessage = {
      type: "roll_results",
      playerResults,
    };
    this.room.broadcast(JSON.stringify(rollMsg));
    this.log(`Roll executed — ${playerResults.length} players rolled`);

    // Set phase to locking
    this.gameState.phase = "locking";

    // After a delay, check for winner or advance to unlocking
    this.lockingTimer = setTimeout(() => {
      this.lockingTimer = null;
      if (!this.gameState || this.gameState.phase !== "locking") return;
      this.checkWinnerOrUnlock();
    }, 1000);
  }

  // ─── Unlock Handlers ────────────────────────────────────────────

  /**
   * Handle an unlock request from an online player.
   * Validates slot indices, stores the response, and checks if all have responded.
   */
  private handleUnlockRequest(sender: Party.Connection, slotIndices: number[]) {
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

    // Store response
    this.gameState.unlockResponses.set(sender.id, { type: "unlock", slotIndices });
    this.log(`Player ${player.name} chose to unlock slots [${slotIndices.join(", ")}]`);

    // Check if all online players have responded
    this.checkAllUnlockResponses();
  }

  /**
   * Handle a skip-unlock from an online player.
   * Validates the must-unlock guard, stores the response, checks completion.
   */
  private handleSkipUnlock(sender: Party.Connection) {
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

    // Must-unlock guard: can't skip if poolSize === 0 and not all 8 locked
    if (player.poolSize === 0 && player.lockedDice.length < 8) {
      this.sendToConnection(sender, {
        type: "error",
        message: "You must unlock at least one die — your pool is empty",
      });
      return;
    }

    // Store response
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

    // ─── AI bot unlock decisions ────────────────────────────────────
    for (const player of this.gameState.players) {
      if (player.isOnline) continue; // skip human players
      if (player.lockedDice.length === 0) continue;
      if (player.lockedDice.length >= 8) continue;

      const difficulty = player.difficulty ?? this.gameState.aiDifficulty;
      const slotsToUnlock = getAIUnlockDecision({
        goalValues: this.gameState.goalValues,
        lockedDice: player.lockedDice,
        poolSize: player.poolSize,
        difficulty: difficulty as "easy" | "medium" | "hard",
      });

      if (slotsToUnlock.length > 0) {
        // Apply unlock to server state
        player.lockedDice = player.lockedDice.filter(
          (ld) => !slotsToUnlock.includes(ld.goalSlotIndex)
        );
        player.poolSize += 2 * slotsToUnlock.length;

        // Broadcast unlock_result for this bot
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

    // ─── Human player unlock decisions ──────────────────────────────
    for (const [playerId, response] of this.gameState.unlockResponses) {
      const player = this.gameState.players.find((p) => p.id === playerId);
      if (!player) continue;

      if (response.type === "unlock" && response.slotIndices && response.slotIndices.length > 0) {
        const unlockCount = response.slotIndices.length;

        // Remove locked dice at selected slots
        player.lockedDice = player.lockedDice.filter(
          (ld) => !response.slotIndices!.includes(ld.goalSlotIndex)
        );
        player.poolSize += 2 * unlockCount;

        // Broadcast unlock_result for this player
        const unlockMsg: ServerMessage = {
          type: "unlock_result",
          playerId: player.id,
          unlockedSlots: response.slotIndices,
          newPoolSize: player.poolSize,
          lockedDice: player.lockedDice,
        };
        this.room.broadcast(JSON.stringify(unlockMsg));
        this.log(`Player ${player.name} unlocked ${unlockCount} slots — pool: ${player.poolSize}`);
      }
      // 'skip' → no state change, no broadcast needed
    }

    // Clear responses and transition to idle
    this.gameState.unlockResponses.clear();
    this.gameState.phase = "idle";
    const phaseMsg: ServerMessage = { type: "phase_change", phase: "idle" };
    this.room.broadcast(JSON.stringify(phaseMsg));
    this.log("Phase → idle (unlocks processed)");
  }

  // ─── Scoring & Round Transitions ──────────────────────────────────

  /**
   * After locking completes, check if any player has won (8 locked dice).
   * If yes → scoring. If no → unlocking phase.
   */
  private checkWinnerOrUnlock() {
    if (!this.gameState) return;

    const winner = this.gameState.players.find((p) => p.lockedDice.length >= 8);
    if (winner) {
      this.handleScoring(winner.id);
    } else {
      // Advance to unlocking phase
      this.gameState.phase = "unlocking";
      this.gameState.unlockResponses.clear();
      const phaseMsg: ServerMessage = { type: "phase_change", phase: "unlocking" };
      this.room.broadcast(JSON.stringify(phaseMsg));
      this.log("Phase → unlocking");
    }
  }

  /**
   * Compute the round score for the winner, broadcast scoring message,
   * then transition to handicap/next round after a delay.
   */
  private handleScoring(winnerId: string) {
    if (!this.gameState) return;

    const winner = this.gameState.players.find((p) => p.id === winnerId);
    if (!winner) return;

    // Compute round score: same formula as gameStore.ts
    const penalties = [1, 0, 1, 1];
    let penalty = 0;
    for (let i = 0; i < winner.poolSize && i < penalties.length; i++) {
      penalty += penalties[i];
    }
    const roundScore = Math.max(0, 8 - penalty);

    // Add score to winner
    winner.score += roundScore;

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
    }));

    // Broadcast scoring message
    const scoringMsg: ServerMessage = {
      type: "scoring",
      winnerId,
      roundScore,
      players: syncPlayers,
    };
    this.room.broadcast(JSON.stringify(scoringMsg));
    this.log(`Scoring: ${winner.name} won with ${roundScore} points (pool: ${winner.poolSize}) — total: ${winner.score}`);

    // After 2 seconds, apply handicap and move to next round
    this.scoringTimer = setTimeout(() => {
      this.scoringTimer = null;
      this.handleHandicapAndNextRound(winnerId);
    }, 2000);
  }

  /**
   * Apply handicap to all players, check for session end,
   * then start next round or end session.
   */
  private handleHandicapAndNextRound(winnerId: string) {
    if (!this.gameState) return;

    // Apply handicap
    for (const player of this.gameState.players) {
      if (player.id === winnerId) {
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
      const phaseMsg: ServerMessage = { type: "phase_change", phase: "roundEnd" };
      this.room.broadcast(JSON.stringify(phaseMsg));
      this.log("Phase → roundEnd");

      // After 500ms, start next round
      this.roundEndTimer = setTimeout(() => {
        this.roundEndTimer = null;
        this.serverInitRound();
      }, 500);
    }
  }

  // ─── Timer Cleanup ────────────────────────────────────────────────

  /**
   * Clear all pending timers to prevent callbacks firing after room closes.
   */
  private cleanupTimers() {
    if (this.lockingTimer) {
      clearTimeout(this.lockingTimer);
      this.lockingTimer = null;
    }
    if (this.scoringTimer) {
      clearTimeout(this.scoringTimer);
      this.scoringTimer = null;
    }
    if (this.roundEndTimer) {
      clearTimeout(this.roundEndTimer);
      this.roundEndTimer = null;
    }
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
