// CREDITS — the kit's Credits block, listing every font/art/sound credit from content/credits.json
// (organize-assets keeps that file up to date). Opened from Settings → Credits with screens.push('credits').
import { Credits, screens } from './kit'
import credits from '../../content/credits.json'
import { playUIClick } from '../utils/soundManager'

export function CreditsScreen() {
  return <Credits assets={credits} onBack={() => { playUIClick(); screens.pop() }} />
}
