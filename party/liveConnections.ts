// Which socket is live for each connection id — kept by the server itself, not by PartyServer.
// A phone that reconnects (Wi-Fi ↔ mobile, screen lock) reuses its id, and its NEW socket can open
// before the OLD one's close arrives. PartyServer forgets the id on that late close, which would
// drop the new, live socket too — so only the socket that is still the live one may be forgotten.
// (Same fix as the framework rooms kit / Glyphtender.)
import type { Connection } from "./room";

export class LiveConnections {
  private live = new Map<string, Connection>();

  opened(connection: Connection): void {
    this.live.set(connection.id, connection);
  }

  /** A socket closed (or failed). Forget it only if it's still the live one for its id. */
  closed(connection: Connection): void {
    if (this.live.get(connection.id) === connection) this.live.delete(connection.id);
  }

  get(id: string): Connection | undefined {
    return this.live.get(id);
  }

  all(): Connection[] {
    return Array.from(this.live.values());
  }
}
