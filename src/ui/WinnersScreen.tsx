// WINNERS — the end of a session (someone reached the target score): the kit's Results block.
// Everyone best first in their dice colour, ★ on the winner, "You" on the local player, then
// Play again / Menu. Same screen online and offline — App.tsx shows it while the store's screen is
// 'winners' (offline: App's round flow; online: the store's applyOnlineSessionEnd).
// The kit Results has no dim of its own, so it sits in a dialog Screen, which dims the table under it.
import { Results, Screen } from './kit'
import { useGameStore } from '../store/gameStore'
import { playUIClick } from '../utils/soundManager'
import { text, fill } from './words'

type WinnersScreenProps = {
  onPlayAgain: () => void
  onMenu: () => void
}

export function WinnersScreen({ onPlayAgain, onMenu }: WinnersScreenProps) {
  const w = text.winners
  const players = useGameStore((s) => s.players)
  const currentRound = useGameStore((s) => s.currentRound)
  const me = players[0] // the local player is always first in the store

  // Title: "You win!", "Sam wins!" or "Tie!" when the top score is shared
  const topScore = Math.max(...players.map((p) => p.score))
  const winners = players.filter((p) => p.score === topScore)
  let title: string
  if (winners.length > 1) title = w.tie
  else if (winners[0]?.id === me?.id) title = w.youWin
  else title = fill(w.someoneWins, { name: winners[0]?.name ?? '' })

  const click = (then: () => void) => () => { playUIClick(); then() }

  return (
    <Screen dialog label={title}>
      <Results
        players={players.map((p) => ({ id: p.id, name: p.name, score: p.score, color: p.color }))}
        meId={me?.id}
        title={title}
        message={fill(w.rounds, { n: currentRound })}
        onRematch={click(onPlayAgain)}
        onQuit={click(onMenu)}
        words={w}
      />
    </Screen>
  )
}
