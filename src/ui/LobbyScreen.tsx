// PLAY ONLINE — the kit's Lobby block, opened with screens.push('online') from the main menu.
//   No room yet → create a room, or type a friend's code and join.
//   In a room   → the code (Copy code button), who's in (colour avatar, host badge, ready), Start / Leave.
//   Game already going (mid-game join, late Play Again) → pick a seat (placeholder until task 8).
// All the online rules live in OnlineRoom.tsx; this screen only shows them.
import { Avatar, Button, ListRow, Lobby, Panel, Row, Screen, ScrollArea, Spinner, Text, fill, toast } from './kit'
import { useOnlineRoom } from './OnlineRoom'
import { playUIClick } from '../utils/soundManager'
import { text } from './words'

// A player's colour (their dice colour) as a tiny picture for the kit Avatar,
// which draws a picture when it has one. The colour is game data, not a style.
const colourPicture = (colour: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1" fill="${colour}"/></svg>`)}`

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
    ready: p.isReady,
    avatar: colourPicture(p.color),
  }))

  const copyCode = async () => {
    playUIClick()
    if (!room.roomCode) return
    try {
      await navigator.clipboard.writeText(room.roomCode)
      toast(w.copied)
    } catch {
      // No clipboard (e.g. not allowed): the code is on screen to read out
    }
  }

  return (
    <>
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
        onReady={room.toggleReady} // players are readied on join, so this does nothing (as before)
        onStart={click(start)}
        onLeave={click(leave)}
      />
      {/* Kit Lobby has no Back on the create / join card and no copy on the room card */}
      {roomCode
        ? <Screen topRight={<Button variant="secondary" onClick={copyCode}>{w.copy}</Button>} />
        : <Screen topLeft={<Button variant="secondary" onClick={click(leave)}>{w.back}</Button>} />}
    </>
  )
}

// MID-GAME SEAT PICK — the old menu's seat claim (same room calls), built from kit parts.
// TODO(task 8): SeatPicker — swap this whole component for the kit SeatPicker block; the
// data it needs is room.seatList / room.claimedSeat / room.autoMatched / room.seatClaimError,
// and the calls are room.claimSeat(seatIndex) / room.cancelClaim() / leave().
function SeatClaim() {
  const { room, leave } = useOnlineRoom()
  const w = text.seats
  const seats = room.seatList ?? []

  return (
    <Screen label={w.title} topLeft={<Button variant="secondary" onClick={() => { playUIClick(); leave() }}>{text.lobby.back}</Button>}>
      <Panel depth={2} gap="m" className="kit-modal">
        {room.claimedSeat !== null ? (
          <>
            <Row gap="m" className="kit-nowrap">
              <Spinner label={w.claimed} />
              <Text>{room.autoMatched ? w.reclaiming : w.claimed}</Text>
            </Row>
            <Row justify="end">
              <Button variant="secondary" onClick={() => { playUIClick(); room.cancelClaim() }}>{w.cancel}</Button>
            </Row>
          </>
        ) : (
          <>
            <Text kind="title">{w.title}</Text>
            {seats.length === 0 && <Text kind="caption">{w.none}</Text>}
            {seats.length > 0 && (
              <ScrollArea label={w.title} max="m">
                {seats.map((seat) => (
                  <ListRow
                    key={seat.seatIndex}
                    label={<Row gap="s" className="kit-nowrap"><Avatar name={seat.name} src={colourPicture(seat.color)} /><Text kind="label">{seat.name}</Text></Row>}
                    detail={fill(w.stats, { score: seat.score, locks: seat.lockedCount })}
                    onClick={() => { playUIClick(); room.claimSeat(seat.seatIndex) }}
                  />
                ))}
              </ScrollArea>
            )}
            {room.seatClaimError && <Text kind="caption"><span className="kit-error">{room.seatClaimError}</span></Text>}
          </>
        )}
      </Panel>
    </Screen>
  )
}
