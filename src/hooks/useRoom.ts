import { useState, useRef, useEffect, useCallback } from "react";
import { createPartyConnection, sendMessage, parseServerMessage } from "../utils/partyClient";
import type { RoomPlayer, RoomStatus } from "../types/protocol";
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
  aiDifficulty: string;
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
  gameStartData: GameStartData | null;
  createRoom: (playerName: string, color: string) => void;
  joinRoom: (code: string, playerName: string, color: string) => void;
  leave: () => void;
  toggleReady: () => void;
  startGame: (targetPlayers: number, aiDifficulty: string) => void;
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
  const [gameStartData, setGameStartData] = useState<GameStartData | null>(null);

  // Derived state
  const isHost = playerId !== null && hostId !== null && hostId === playerId;

  // Ref to hold pending join info (name + color to send after "connected")
  const pendingJoinRef = useRef<{ name: string; color: string } | null>(null);

  // Error auto-clear timer ref
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper: set error with 3-second auto-clear
  const setErrorWithAutoClear = useCallback((msg: string) => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setError(msg);
    errorTimerRef.current = setTimeout(() => setError(null), 3000);
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
    pendingJoinRef.current = null;
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
            });
            pendingJoinRef.current = null;
          }
          break;

        case "room_state":
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
            aiDifficulty: msg.aiDifficulty,
          });
          break;

        case "error":
          setErrorWithAutoClear(msg.message);
          break;
      }
    };

    socket.onclose = () => {
      resetState();
      setErrorWithAutoClear("Connection lost");
    };
  }, [resetState, setErrorWithAutoClear]);

  // ─── Actions ─────────────────────────────────────────────────────────

  const createRoom = useCallback((playerName: string, color: string) => {
    // Close any existing connection
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

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
      socketRef.current.close();
      socketRef.current = null;
    }

    pendingJoinRef.current = { name: playerName, color };

    const socket = createPartyConnection(code);
    socketRef.current = socket;
    attachListeners(socket);
  }, [attachListeners, setErrorWithAutoClear]);

  const leave = useCallback(() => {
    if (socketRef.current) {
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

  const startGame = useCallback((targetPlayers: number, aiDifficulty: string) => {
    if (socketRef.current && isConnected) {
      sendMessage(socketRef.current, {
        type: "start_game",
        targetPlayers,
        aiDifficulty,
      });
    }
  }, [isConnected]);

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
    gameStartData,
    createRoom,
    joinRoom,
    leave,
    toggleReady,
    startGame,
  };
}
