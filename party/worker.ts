// THE ONLINE SERVER'S FRONT DOOR — Cloudflare runs this file (wrangler.json "main") on Muzzy's own account.
// It hands every room to RollBetterServer (./server.ts), which knows nothing about Cloudflare.
//   Local:  npm run party:dev   (port 1999)   ·   Live: npm run party:deploy (Muzzy's call — it's public)
//
// PartyServer (the open-source successor of PartyKit) gives us PartyKit's rooms on plain Cloudflare:
// one room code = one Durable Object = one copy of the server, at /parties/main/<room code> —
// the same address PartySocket already uses, so the game's client didn't change.
import { Server, routePartykitRequest } from "partyserver";
import type { Connection } from "partyserver";
import RollBetterServer from "./server";
import { LiveConnections } from "./liveConnections";

// The class name is the address: "Main" → /parties/main/… (PartySocket's default). Keep it in step with wrangler.json.
export class Main extends Server {
  private game!: RollBetterServer;
  // Our own list of live sockets — PartyServer's forgets a reconnected phone's NEW socket when the old one closes late
  private live = new LiveConnections();

  onStart() {
    const live = this.live;
    this.game = new RollBetterServer({
      id: this.name,
      getConnection: (id) => live.get(id),
      getConnections: () => live.all(),
      broadcast: (message, without = []) => {
        for (const connection of live.all()) {
          if (!without.includes(connection.id)) connection.send(message);
        }
      },
    });
  }

  onConnect(connection: Connection) {
    this.live.opened(connection);
    this.game.onConnect(connection);
  }

  onMessage(connection: Connection, message: string | ArrayBuffer) {
    if (typeof message === "string") this.game.onMessage(message, connection);
  }

  onClose(connection: Connection) {
    this.live.closed(connection);
    this.game.onClose(connection);
  }

  onError(connection: Connection) {
    this.live.closed(connection);
    this.game.onClose(connection);
  }
}

export default {
  async fetch(request: Request, env: Record<string, unknown>): Promise<Response> {
    return (await routePartykitRequest(request, env)) ?? new Response("Not found", { status: 404 });
  },
};
