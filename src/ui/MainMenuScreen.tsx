// MAIN MENU — the kit's MainMenu block on the Cartoon backdrop (the style's own page colour).
// Shown while the game store's screen is 'menu'. Play online / How to play / Settings open kit
// screens on top (screens.push), so Back, Esc and tapping the dim close them again.
import { Badge, Button, MainMenu, Screen, Text, screens } from './kit'
import { useGameStore } from '../store/gameStore'
import { playUIClick } from '../utils/soundManager'
import { text } from './words'

type MainMenuScreenProps = {
  version: string
  onPlay: (playerCount: number) => void // local game against the computer
}

export function MainMenuScreen({ version, onPlay }: MainMenuScreenProps) {
  const w = text.mainMenu
  const open = (screen: string) => { playUIClick(); screens.push(screen) }

  const playLocal = () => {
    playUIClick()
    useGameStore.getState().setGamePrefs({ playerCount: 4 })
    onPlay(4)
  }

  // The kit lists its buttons in a fixed order (continue, play, settings, how to play…).
  // Its first slot is the big main button, so local play goes there and online play second.
  // The version sits in the bottom-left corner, not MainMenu's own bottom row: on a landscape
  // phone (390 tall) five buttons + that row don't fit and the version lands on Upgrades.
  return (
    <div className="kit-page menu-page">
      <MainMenu
        title={w.title}
        subtitle={w.subtitle}
        words={{ continue: w.play, play: w.playOnline, settings: w.settings, howToPlay: w.howToPlay }}
        onContinue={playLocal}
        onPlay={() => open('online')}
        onSettings={() => open('settings')}
        onHowToPlay={() => open('howToPlay')}
      >
        <Button variant="secondary" disabled>
          {w.upgrades} <Badge>{w.comingSoon}</Badge>
        </Button>
      </MainMenu>
      <Screen bottomLeft={<Text kind="caption">{version}</Text>} />
    </div>
  )
}
