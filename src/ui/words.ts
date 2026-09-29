// Every word players read lives in content/text/en.json (Muzzy edits it in Obsidian).
// Screens pass their section as the kit block's `words` — anything missing falls back to the kit's English.
// `fill('Room {code}', { code: 'ABCD' })` fills in the {placeholders}.
import text from '../../content/text/en.json'
export { fill } from './kit'
export { text }
