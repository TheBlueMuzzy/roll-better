// HOW TO PLAY — the kit's HowToPlay block: 6 pages with page dots, Next / Back / Got it.
// Pages and button words come from content/text/en.json → howToPlay (Muzzy edits them there).
// Opened with screens.push('howToPlay'); Got it, Esc, phone Back and tapping the dim close it.
import { HowToPlay, screens } from './kit'
import { playUIClick } from '../utils/soundManager'
import { text } from './words'

export function HowToPlayScreen() {
  return (
    <HowToPlay
      pages={text.howToPlay.pages}
      words={text.howToPlay.words}
      onDone={() => { playUIClick(); screens.pop() }}
    />
  )
}
