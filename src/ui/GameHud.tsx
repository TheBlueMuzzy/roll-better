// GAME HUD — the kit's Hud frame over the table: the Settings gear bottom-right. ("Round 2" is plain
// text beside the Goal chip — src/ui/RowChip.tsx GoalCorner, B019.)
// Everything else the player reads sits ON the table (pinned kit pieces): the status banner and
// timers over the rolling area, a PlayerChip beside every row. Tips and seat messages are toasts.
// Empty HUD space lets every tap through to the game (hold-to-roll, dragging dice).
import { Button, Hud } from './kit'
import { useSeatMessages } from '../hooks/useSeatMessages'
import { playUIClick } from '../utils/soundManager'
import { text } from './words'

// The gear: kit icon button (kit 0.1.9 sizes the glyph to the button — B018).
export function GameHud({ onOpenSettings }: { onOpenSettings: () => void }) {
  useSeatMessages() // online: a toast when someone's seat changes
  const w = text.hud

  return (
    <Hud
      words={{ label: w.label }}
      bottomRight={
        <Button variant="secondary" icon aria-label={w.settings} onClick={() => { playUIClick(); onOpenSettings() }}>
          ⚙
        </Button>
      }
    />
  )
}
