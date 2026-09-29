// PLAY ONLINE — the kit's Lobby block, opened with screens.push('online') from the main menu.
//   No room yet → create a room, or type a friend's code and join.
//   In a room   → the code (kit Copy button), who's in (colour avatars, host badge), Start / Leave.
//   Game already going (mid-game join, late Play Again) → pick a seat (kit SeatPicker).
// All the online rules live in OnlineRoom.tsx; this screen only shows them.
import { Lobby, SeatPicker, fill } from './kit'
import { useOnlineRoom } from './OnlineRoom'
import { playUIClick } from '../utils/soundManager'
import { text } from './words'

export function LobbyScreen() {
  const { room, mode, create, join, start, leave } = useOnlineRoom()
  const w = text.lobby
  const click = (then: () => void) => () => { playUIClick(); then() }

  if (mode === 'claiming' && room.seatList !== null && !room.connectedElsewhere) return <SeatClaim />

  const inRoom = !room.connectedElsewhere && (mode === 'creating' || mode === 'joined') && room.isConnected && room.roomCode
  const roomCode = inRoom ? room.roomCode ?? undefined : undefined
  // Busy: waiting for our new room, or for the room we asked to join
  const busy = (mode === 'creating' && !room.roomCode) || mode === 'joining'
  const error = room.connectedElsewhere ? text.mainMenu.otherTab : room.error ?? undefined

  const players = room.players.map((p) => ({
    id: p.id,
    name: p.id === room.playerId ? fill(w.you, { name: p.name }) : p.name,
    color: p.color, // their dice colour
  }))

  return (
    <Lobby
        words={w}
        roomCode={roomCode}
        players={players}
        meId={room.playerId ?? undefined}
        hostId={room.hostId ?? undefined}
        minPlayers={1} // the host can start alone: empty seats get bots
        busy={busy}
        error={error}
        onCreate={click(create)}
        onJoin={(code) => { playUIClick(); join(code) }}
        // No onReady: players are ready as soon as they join, so the kit shows no Ready step (kit 0.1.7)
        onStart={click(start)}
        onLeave={click(leave)}
        onBack={click(leave)}
      />
  )
}

// MID-GAME SEAT PICK — the kit's SeatPicker (kit 0.1.6): a game is already going, so pick a seat
// (a bot's) to take over. Same room calls as the old menu: claimSeat / cancelClaim / leave.
function SeatClaim() {
  const { room, leave } = useOnlineRoom()
  const w = text.seats
  const seats = (room.seatList ?? []).map((seat) => ({
    id: String(seat.seatIndex),
    name: seat.name,
    color: seat.color,
    detail: fill(w.stats, { score: seat.score, locks: seat.lockedCount }),
  }))
  const waiting = room.claimedSeat !== null

  return (
    <SeatPicker
      seats={seats}
      waiting={waiting}
      error={room.seatClaimError ?? undefined}
      words={{ ...w, joining: room.autoMatched ? w.reclaiming : w.joining }}
      onPick={(id) => { playUIClick(); room.claimSeat(Number(id)) }}
      onCancel={() => { playUIClick(); if (waiting) room.cancelClaim(); else leave() }}
    />
  )
}
