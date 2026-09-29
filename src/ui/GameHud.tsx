// GAME HUD — the kit's Hud frame over the table: "Round 2" top-right, the Settings gear bottom-right.
// Everything else the player reads sits ON the table (pinned kit pieces): the status banner and
// timers over the rolling area, a PlayerChip beside every row. Tips and seat messages are toasts.
// Empty HUD space lets every tap through to the game (hold-to-roll, dragging dice).
import { Badge, Button, Hud, Text } from './kit'
import { useGameStore } from '../store/gameStore'
import { useSeatMessages } from '../hooks/useSeatMessages'
import { playUIClick } from '../utils/soundManager'
import { text, fill } from './words'

// The gear sits in a heading-size Text: at the button's own body size the ⚙ glyph is tiny.
export function GameHud({ onOpenSettings }: { onOpenSettings: () => void }) {
  const round = useGameStore((s) => s.currentRound)
  useSeatMessages() // online: a toast when someone's seat changes
  const w = text.hud

  return (
    <Hud
      words={{ label: w.label }}
      currency={<Badge>{fill(w.round, { n: round })}</Badge>}
      bottomRight={
        <Button variant="secondary" icon aria-label={w.settings} onClick={() => { playUIClick(); onOpenSettings() }}>
          <Text kind="heading">⚙</Text>
        </Button>
      }
    />
  )
}
