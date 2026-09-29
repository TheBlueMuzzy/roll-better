// WINNERS — the end of a session (someone reached the target score): the kit's Results block.
// Everyone best first in their dice colour, ★ on the winner, "You" on the local player, then
// Play again / Menu. Same screen online and offline — App.tsx shows it while the store's screen is
// 'winners' (offline: App's round flow; online: the store's applyOnlineSessionEnd).
// dim: the table stays visible behind it, darkened (kit Results dim).
import { Results } from './kit'
import { useGameStore } from '../store/gameStore'
import { playUIClick } from '../utils/soundManager'
import { text, fill } from './words'
import { useOnlineRoom } from './OnlineRoom'

type WinnersScreenProps = {
  onPlayAgain: () => void
  onMenu: () => void
}

export function WinnersScreen({ onPlayAgain, onMenu }: WinnersScreenProps) {
  const w = text.winners
  const players = useGameStore((s) => s.players)
  const currentRound = useGameStore((s) => s.currentRound)
  const me = players[0] // the local player is always first in the store
  const { leave } = useOnlineRoom()
  // Menu from an online game: leave the room the intentional way first, so the socket closing
  // isn't mistaken for a dropped connection (that left a stuck "Reconnecting" over the next solo game)
  const toMenu = () => { if (useGameStore.getState().isOnlineGame) leave(); onMenu() }

  // Title: "You win!", "Sam wins!" or "Tie!" when the top score is shared
  const topScore = Math.max(...players.map((p) => p.score))
  const winners = players.filter((p) => p.score === topScore)
  let title: string
  if (winners.length > 1) title = w.tie
  else if (winners[0]?.id === me?.id) title = w.youWin
  else title = fill(w.someoneWins, { name: winners[0]?.name ?? '' })

  const click = (then: () => void) => () => { playUIClick(); then() }

  return (
    <Results
      players={players.map((p) => ({ id: p.id, name: p.name, score: p.score, color: p.color }))}
      meId={me?.id}
      title={title}
      message={fill(w.rounds, { n: currentRound })}
      onRematch={click(onPlayAgain)}
      onQuit={click(toMenu)}
      words={w}
      dim
    />
  )
}
