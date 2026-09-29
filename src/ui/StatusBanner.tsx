// STATUS BANNER — what to do right now ("Hold to Roll", "Locked 3!", "Drag dice to unlock"…),
// a kit TurnBanner that pops in again whenever the words change. The game pins it over the bottom
// of the rolling area (src/components/StatusPin.tsx). No words (e.g. while dice split) → nothing shown.
import { TurnBanner } from './kit'

export function StatusBanner({ status }: { status: string }) {
  if (!status) return null
  return <TurnBanner text={status} />
}
