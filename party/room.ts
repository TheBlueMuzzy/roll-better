// The few bits of a room the game server uses — worker.ts hands it one per room code.
// Kept tiny and Cloudflare-free, so the server (and its tests) never import PartyServer.
export interface Connection {
  id: string;
  send(message: string): void;
  close(): void;
}

export interface Room {
  id: string;
  broadcast(message: string, without?: string[]): void;
  getConnection(id: string): Connection | undefined;
  getConnections(): Iterable<Connection>;
}
