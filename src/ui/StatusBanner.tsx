// STATUS BANNER — what to do right now ("Hold to Roll", "Locked 3!", "Drag dice to unlock"…),
// a kit TurnBanner that pops in again whenever the words change, with a kit Bar beside it while
// an AFK timer runs (time left, full → empty). The game pins it over the bottom of the rolling
// area (src/components/StatusPin.tsx). The bar sits BESIDE the words, not under them, so the
// banner keeps its size on the table when a timer starts or stops.
import { Bar, Row, TurnBanner } from './kit'
import { text } from './words'

type StatusBannerProps = {
  status: string            // '' = no words right now (e.g. while dice split)
  timeLeft: number | null   // 1 → 0 while a timer runs, null when none does
  urgent?: boolean          // the short unlock timer: drawn in the accent colour
}

export function StatusBanner({ status, timeLeft, urgent }: StatusBannerProps) {
  if (!status && timeLeft === null) return null
  return (
    <Row gap="s" className="kit-nowrap">
      {status && <TurnBanner text={status} />}
      {timeLeft !== null && <Bar label={text.hud.timeLeft} value={timeLeft} max={1} variant={urgent ? 'accent' : 'primary'} />}
    </Row>
  )
}
