// ROW CHIPS — the kit PlayerChip beside each row on the table (pinned by src/components/RowChips.tsx).
//   Player row: colour avatar + initials, "S2 | T5" detail (S = dice they start the round with,
//   T = dice they have in total), ★ score (counts up when it rises); you get the highlight ring.
//   All on ONE line: on a landscape phone the rows are only ~39 px apart, and a second line (name or
//   a Bot badge) would make every chip a third smaller. Bots read as "B2" in their avatar.
//   Goal row:   just ★ and the points you'd score if you finished the Goal with the dice you have now,
//               with "Round N" as plain text to its left (B019: information, not a badge).
// dim: faded while a dragged die passes over the chip, so the die stays readable (B010).
// Words in content/text/en.json (chips).
import { HudText, PlayerChip, Row } from './kit'
import { useGameStore } from '../store/gameStore'
import { text, fill } from './words'

type PlayerRowChipProps = {
  name: string
  color: string
  score: number
  startingDice: number
  totalDice: number
  isYou: boolean
  dim: boolean
}

export function PlayerRowChip({ name, color, score, startingDice, totalDice, isYou, dim }: PlayerRowChipProps) {
  const w = text.chips
  return (
    <PlayerChip
      name={name}
      showName={false}
      color={color}
      score={score}
      detail={fill(w.detail, { s: startingDice, t: totalDice })}
      active={isYou}
      dim={dim}
      size="s"
      words={{ score: w.score }}
    />
  )
}

export function GoalRowChip({ potentialScore, dim }: { potentialScore: number; dim: boolean }) {
  const w = text.chips
  return (
    <PlayerChip
      name={w.goal}
      showName={false}
      avatar={false}
      score={potentialScore}
      dim={dim}
      size="s"
      words={{ score: w.goalScore }}
    />
  )
}

// "Round 2" + the Goal chip, side by side (one pin on the table, top-left beside the Goal dice)
export function GoalCorner({ potentialScore, dim }: { potentialScore: number; dim: boolean }) {
  const round = useGameStore((s) => s.currentRound)
  return (
    <Row gap="s" className="kit-nowrap">
      <HudText size="s">{fill(text.hud.round, { n: round })}</HudText>
      <GoalRowChip potentialScore={potentialScore} dim={dim} />
    </Row>
  )
}
