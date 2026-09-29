// RECONNECTING — the kit's Reconnecting dialog while an online game's connection comes back.
// App.tsx opens it (screens.push('reconnecting')) when the store says we're disconnected and
// closes it when we're back; Esc / Back can't close it early — App opens it again.
import { Reconnecting } from './kit'
import { useGameStore } from '../store/gameStore'
import { text } from './words'

export function ReconnectingScreen() {
  const disconnected = useGameStore((s) => s.isOnlineDisconnected)
  if (!disconnected) return null // back already; App closes this screen as soon as it's on top
  return <Reconnecting words={text.reconnecting} />
}
