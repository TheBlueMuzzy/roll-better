import type * as Party from "partykit/server";

export default class RollBetterServer implements Party.Server {
  readonly room: Party.Room;

  constructor(room: Party.Room) {
    this.room = room;
  }

  onConnect(conn: Party.Connection) {
    conn.send(JSON.stringify({ type: "connected", roomId: this.room.id }));
  }
}
