import PartySocket from "partysocket";
import type { ClientMessage, ServerMessage } from "../types/protocol";

// ─── Configuration ────────────────────────────────────────────────────
const PARTY_HOST =
  import.meta.env.VITE_PARTY_HOST ?? "localhost:1999";

// ─── Stable Client ID ────────────────────────────────────────────────
// Each browser tab gets a persistent ID via sessionStorage so PartySocket
// reconnections reuse the same conn.id on the server.
const SESSION_KEY = "rb-client-id";

function generateId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 16; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

/** Get the stable client ID for this tab session (creates one if missing). */
export function getStableClientId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = generateId();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

// ─── Module-Level Game Socket ────────────────────────────────────────
// Persists the game-phase socket outside React lifecycle so hooks like
// useOnlineGame can access it independently of useRoom.
let gameSocket: PartySocket | null = null;
export function setGameSocket(s: PartySocket | null) { gameSocket = s; }
export function getGameSocket(): PartySocket | null { return gameSocket; }

// ─── Connection Factory ───────────────────────────────────────────────

/** Create a PartySocket connection to a room. Caller manages lifecycle. */
export function createPartyConnection(roomId: string): PartySocket {
  return new PartySocket({ host: PARTY_HOST, room: roomId, id: getStableClientId() });
}

// ─── Message Helpers ──────────────────────────────────────────────────

/** Send a typed client message over the socket. */
export function sendMessage(
  socket: PartySocket,
  message: ClientMessage,
): void {
  socket.send(JSON.stringify(message));
}

/** Parse raw WebSocket data into a typed ServerMessage, or null on failure. */
export function parseServerMessage(data: string): ServerMessage | null {
  try {
    const parsed = JSON.parse(data) as ServerMessage;
    if (!parsed || typeof parsed.type !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}
