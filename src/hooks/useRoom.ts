import { useState, useRef, useEffect, useCallback } from "react";
import { createPartyConnection, sendMessage, parseServerMessage, setGameSocket, getPersistentPlayerId } from "../utils/partyClient";
import { useGameStore } from "../store/gameStore";
import type { RoomPlayer, RoomStatus } from "../types/protocol";
import type { GamePhase } from "../types/game";
import type PartySocket from "partysocket";

// ─── Room Code Generation ──────────────────────────────────────────────
// 4-letter uppercase codes, excluding I and O to avoid confusion with 1 and 0
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

// ─── Hook Return Type ──────────────────────────────────────────────────

interface GameStartData {
  players: RoomPlayer[];
  targetPlayers: number;
  goalValues: number[];
}

interface SeatInfo {
  seatIndex: number;
  name: string;
  color: string;
  score: number;
  lockedCount: number;
}

interface UseRoomReturn {
  roomCode: string | null;
  playerId: string | null;
  players: RoomPlayer[];
  hostId: string | null;
  isConnected: boolean;
  isHost: boolean;
  status: RoomStatus | null;
  error: string | null;
  errorCode: string | null;
  gameStartData: GameStartData | null;
  seatList: SeatInfo[] | null;
  claimedSeat: number | null;
  seatClaimError: string | null;
  autoMatched: boolean;
  connectedElsewhere: boolean;
  clearConnectedElsewhere: () => void;
  cancelClaim: () => void;
  createRoom: (playerName: string, color: string) => void;
  joinRoom: (code: string, playerName: string, color: string) => void;
  leave: () => void;
  toggleReady: () => void;
  startGame: (targetPlayers: number) => void;
  claimSeat: (seatIndex: number) => void;
}

// ─── Hook ──────────────────────────────────────────────────────────────

export function useRoom(): UseRoomReturn {
  const socketRef = useRef<PartySocket | null>(null);

  // Reactive state
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [hostId, setHostId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<RoomStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [gameStartData, setGameStartData] = useState<GameStartData | null>(null);
  const [seatList, setSeatList] = useState<SeatInfo[] | null>(null);
  const [claimedSeat, setClaimedSeat] = useState<number | null>(null);
  const [seatClaimError, setSeatClaimError] = useState<string | null>(null);
  const [autoMatched, setAutoMatched] = useState(false);
  const [connectedElsewhere, setConnectedElsewhere] = useState(false);

  // Derived state
  const isHost = playerId !== null && hostId !== null && hostId === playerId;

  // Ref to hold pending join info (name + color to send after "connected")
  const pendingJoinRef = useRef<{ name: string; color: string } | null>(null);

  // Track intent: 'create' vs 'join' — used to detect "room not found"
  const intentRef = useRef<'create' | 'join' | null>(null);

  // Track intentional closes (leave, room-not-found) to suppress "Connection lost"
  const intentionalCloseRef = useRef(false);

  // Track whether we're in an active game (game_starting received)
  const gameActiveRef = useRef(false);

  // Track recent server errors to prevent onclose overwriting them
  const lastErrorTimeRef = useRef(0);

  // Refs to track mid-game join state (needed in handler closure where React state is stale)
  const seatListRef = useRef<SeatInfo[] | null>(null);
  const claimedSeatRef = useRef<number | null>(null);

  // Error auto-clear timer ref
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper: set error with 3-second auto-clear (room_full persists until user acts)
  const setErrorWithAutoClear = useCallback((msg: string, code?: string) => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setError(msg);
    setErrorCode(code ?? null);
    lastErrorTimeRef.current = Date.now();
    if (code !== 'room_full') {
      errorTimerRef.current = setTimeout(() => {
        setError(null);
        setErrorCode(null);
      }, 3000);
    }
  }, []);

  // Helper: reset all connection state
  const resetState = useCallback(() => {
    setRoomCode(null);
    setPlayerId(null);
    setPlayers([]);
    setHostId(null);
    setIsConnected(false);
    setStatus(null);
    setGameStartData(null);
    setSeatList(null);
    setClaimedSeat(null);
    setSeatClaimError(null);
    setAutoMatched(false);
    setErrorCode(null);
    pendingJoinRef.current = null;
    seatListRef.current = null;
    claimedSeatRef.current = null;
  }, []);

  // Helper: attach listeners to a socket
  const attachListeners = useCallback((socket: PartySocket) => {
    socket.onmessage = (event) => {
      const msg = parseServerMessage(event.data as string);
      if (!msg) return;

      switch (msg.type) {
        case "connected":
          setPlayerId(msg.playerId);
          setRoomCode(msg.roomId);
          setIsConnected(true);
          // Send the pending join message now that we're connected
          if (pendingJoinRef.current) {
            sendMessage(socket, {
              type: "join",
              name: pendingJoinRef.current.name,
              color: pendingJoinRef.current.color,
              persistentId: getPersistentPlayerId(),
            });
            pendingJoinRef.current = null;
          }
          break;

        case "room_state":
          // Detect "room not found" — joined as sole player when intent was "join"
          if (intentRef.current === 'join' && msg.players.length === 1) {
            intentionalCloseRef.current = true;
            if (socketRef.current) {
              socketRef.current.close();
              socketRef.current = null;
            }
            resetState();
            setErrorWithAutoClear("Room not found");
            intentRef.current = null;
            return;
          }
          intentRef.current = null;
          setPlayers(msg.players);
          setHostId(msg.hostId);
          setStatus(msg.status);
          break;

        case "player_joined":
          setPlayers((prev) => [...prev, msg.player]);
          break;

        case "player_left":
          setPlayers((prev) => prev.filter((p) => p.id !== msg.playerId));
          break;

        case "game_starting":
          setGameStartData({
            players: msg.players,
            targetPlayers: msg.targetPlayers,
            goalValues: msg.goalValues,
          });
          // Store socket for game-phase access (useOnlineGame reads it)
          setGameSocket(socketRef.current);
          gameActiveRef.current = true;
          break;

        case "rejoin_state":
          // Server confirmed rejoin — update room connection state
          setIsConnected(true);
          useGameStore.getState().setOnlineDisconnected(false);

          // Mid-game joiner: seatList/claimedSeat were set, meaning this player joined mid-game
          if (seatListRef.current !== null || claimedSeatRef.current !== null) {
            const localId = socket.id;
            const serverPlayers = msg.players;
            const localPlayer = serverPlayers.find((p: { id: string }) => p.id === localId);
            const otherPlayers = serverPlayers.filter((p: { id: string }) => p.id !== localId);

            // Reorder: local player first, then others (same as handleOnlineGameStart)
            const orderedPlayers = [
              ...(localPlayer ? [{ name: localPlayer.name, color: localPlayer.color }] : []),
              ...otherPlayers.map((p: { name: string; color: string }) => ({ name: p.name, color: p.color })),
            ];

            const store = useGameStore.getState();
            store.initGame(serverPlayers.length, orderedPlayers);
            store.initRound({ goalValues: msg.goalValues, skipPhase: true });
            store.setOnlineMode(localId, false); // mid-game joiner is never host

            // Build server-to-local player ID mapping
            const serverPlayerIds = [localId, ...otherPlayers.map((p: { id: string }) => p.id)];
            store.setOnlinePlayerIds(serverPlayerIds);

            // Sync full state from rejoin (scores, locked dice, pool sizes, etc.)
            store.syncAllPlayerState(msg.players);
            store.setCurrentRound(msg.round);

            // Clear animation state (joining mid-game, no animations to play)
            store.clearLockAnimations();
            store.clearAILockAnimations();
            store.clearUnlockAnimations();
            store.clearAIUnlockAnimations();

            // Set phase to match server and show game
            store.setPhase(msg.phase as GamePhase);
            store.setScreen('game');

            setGameSocket(socketRef.current);
            gameActiveRef.current = true;

            // Clear mid-game join state
            setSeatList(null);
            setClaimedSeat(null);
            setSeatClaimError(null);
            seatListRef.current = null;
            claimedSeatRef.current = null;
          }
          // Regular reconnect: useOnlineGame handles the state sync
          break;

        case "seat_takeover":
          // Broadcast to all: a mid-game joiner took over a bot seat
          // State sync comes via seat_state_changed message
          break;

        case "player_reconnected":
          // Handled by useOnlineGame for toast notifications
          break;

        case "seat_list":
          setSeatList(msg.seats);
          seatListRef.current = msg.seats;
          break;

        case "seat_claim_result":
          if (msg.success) {
            setClaimedSeat(msg.seatIndex);
            claimedSeatRef.current = msg.seatIndex;
            setSeatClaimError(null);
            setAutoMatched(msg.autoMatched ?? false);
          } else {
            if (msg.reason === "seat_taken") {
              setSeatClaimError("That seat was just taken \u2014 pick another");
            } else if (msg.reason === "not_a_bot") {
              setSeatClaimError("That seat is no longer available");
            } else {
              setSeatClaimError(msg.reason || "Seat unavailable");
            }
          }
          break;

        case "play_again_ack":
          // Server acknowledged play_again — mode determines next flow
          if (msg.mode === "lobby") {
            // Returning to lobby — subsequent room_state will populate players/host/status
            // gameActiveRef stays true so the socket doesn't reset on reconnect
            console.log("[useRoom] play_again_ack: lobby mode — returning to lobby");
          } else if (msg.mode === "mid_game_join") {
            // Late join — subsequent seat_list will trigger claiming mode
            console.log("[useRoom] play_again_ack: mid_game_join — waiting for seat_list");
          }
          break;

        case "room_closed":
          // Server dissolved the room (all humans became bots, or seat taken)
          intentionalCloseRef.current = true;
          if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
          }
          gameActiveRef.current = false;
          resetState();
          useGameStore.getState().setScreen('menu');
          setErrorWithAutoClear(msg.reason || "Room closed");
          break;

        case "error":
          if (msg.code === "connected_elsewhere") {
            setConnectedElsewhere(true);
            intentionalCloseRef.current = true;
            gameActiveRef.current = false;
            if (socketRef.current) {
              socketRef.current.close();
              socketRef.current = null;
            }
          } else {
            setErrorWithAutoClear(msg.message, msg.code);
          }
          break;
      }
    };

    socket.onclose = () => {
      if (intentionalCloseRef.current) {
        intentionalCloseRef.current = false;
        gameActiveRef.current = false;
        return;
      }
      if (gameActiveRef.current) {
        // During game: DON'T reset — PartySocket will auto-reconnect
        // Just mark as disconnected so UI can show "Reconnecting..."
        setIsConnected(false);
        useGameStore.getState().setOnlineDisconnected(true);
      } else {
        // During lobby/menu: reset as before
        const hadRecentError = Date.now() - lastErrorTimeRef.current < 500;
        resetState();
        if (!hadRecentError) {
          setErrorWithAutoClear("Connection lost");
        }
      }
    };

    socket.onopen = () => {
      if (gameActiveRef.current) {
        // Reconnected during game — server will send connected + rejoin_state
        setIsConnected(true);
        useGameStore.getState().setOnlineDisconnected(false);
      }
    };
  }, [resetState, setErrorWithAutoClear]);

  // ─── Actions ─────────────────────────────────────────────────────────

  const createRoom = useCallback((playerName: string, color: string) => {
    // Close any existing connection
    if (socketRef.current) {
      intentionalCloseRef.current = true;
      socketRef.current.close();
      socketRef.current = null;
    }

    intentRef.current = 'create';
    const code = generateRoomCode();
    pendingJoinRef.current = { name: playerName, color };

    const socket = createPartyConnection(code);
    socketRef.current = socket;
    attachListeners(socket);
  }, [attachListeners]);

  const joinRoom = useCallback((code: string, playerName: string, color: string) => {
    // Validate code format: 4 uppercase letters
    if (!/^[A-Z]{4}$/.test(code)) {
      setErrorWithAutoClear("Room code must be 4 letters");
      return;
    }

    // Close any existing connection
    if (socketRef.current) {
      intentionalCloseRef.current = true;
      socketRef.current.close();
      socketRef.current = null;
    }

    intentRef.current = 'join';
    pendingJoinRef.current = { name: playerName, color };

    const socket = createPartyConnection(code);
    socketRef.current = socket;
    attachListeners(socket);
  }, [attachListeners, setErrorWithAutoClear]);

  const leave = useCallback(() => {
    if (socketRef.current) {
      intentionalCloseRef.current = true;
      gameActiveRef.current = false;
      sendMessage(socketRef.current, { type: "leave" });
      socketRef.current.close();
      socketRef.current = null;
    }
    resetState();
  }, [resetState]);

  const toggleReady = useCallback(() => {
    if (socketRef.current && isConnected) {
      sendMessage(socketRef.current, { type: "ready" });
    }
  }, [isConnected]);

  const startGame = useCallback((targetPlayers: number) => {
    if (socketRef.current && isConnected) {
      sendMessage(socketRef.current, {
        type: "start_game",
        targetPlayers,
      });
    }
  }, [isConnected]);

  const claimSeat = useCallback((seatIndex: number) => {
    if (socketRef.current && isConnected) {
      sendMessage(socketRef.current, { type: "seat_claim", seatIndex });
    }
  }, [isConnected]);

  const cancelClaim = useCallback(() => {
    setClaimedSeat(null);
    claimedSeatRef.current = null;
    setSeatClaimError(null);
  }, []);

  const clearConnectedElsewhere = useCallback(() => {
    setConnectedElsewhere(false);
  }, []);

  // ─── Cleanup on unmount ──────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
      }
    };
  }, []);

  return {
    roomCode,
    playerId,
    players,
    hostId,
    isConnected,
    isHost,
    status,
    error,
    errorCode,
    gameStartData,
    seatList,
    claimedSeat,
    seatClaimError,
    autoMatched,
    connectedElsewhere,
    clearConnectedElsewhere,
    cancelClaim,
    createRoom,
    joinRoom,
    leave,
    toggleReady,
    startGame,
    claimSeat,
  };
}
