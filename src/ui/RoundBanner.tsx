// ROUND BANNER — the kit's RoundIntro ("Round 2") for a moment at the start of every round.
// It only shows: play carries on underneath (App.css .round-banner-layer lets every tap through),
// and it never delays the round. How long it stays: content/tuning/ui.json roundBannerSeconds.
import { useEffect, useState } from 'react'
import { RoundIntro } from './kit'
import { useGameStore } from '../store/gameStore'
import { text } from './words'
import tuning from '../../content/tuning/ui.json'

export function RoundBanner() {
  const screen = useGameStore((s) => s.screen)
  const [shownRound, setShownRound] = useState<number | null>(null)

  // Watch the store: a new round, or a game (re)starting → show that round's number
  useEffect(() => useGameStore.subscribe((now, before) => {
    if (now.screen !== 'game' || now.currentRound < 1 || tuning.roundBannerSeconds <= 0) return
    const gameStarted = before.screen !== 'game'
    const newRound = now.currentRound !== before.currentRound
    if (gameStarted || newRound) setShownRound(now.currentRound)
  }), [])

  // …then hide it again
  useEffect(() => {
    if (shownRound === null) return
    const timer = setTimeout(() => setShownRound(null), tuning.roundBannerSeconds * 1000)
    return () => clearTimeout(timer)
  }, [shownRound])

  if (shownRound === null || screen !== 'game') return null
  return <RoundIntro round={shownRound} words={text.roundIntro} />
}
