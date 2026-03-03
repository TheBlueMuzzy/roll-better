import PartySocket from "partysocket";
import type { ClientMessage, ServerMessage } from "../types/protocol";

// ─── Configuration ────────────────────────────────────────────────────
const PARTY_HOST =
  import.meta.env.VITE_PARTY_HOST ?? "localhost:1999";

// ─── Connection Factory ───────────────────────────────────────────────

/** Create a PartySocket connection to a room. Caller manages lifecycle. */
export function createPartyConnection(roomId: string): PartySocket {
  return new PartySocket({ host: PARTY_HOST, room: roomId });
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
