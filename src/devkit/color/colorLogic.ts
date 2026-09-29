// The Color tool's thinking, kept apart from its looks so it can be tested (colorLogic.test.ts).
// Nothing here touches the page or the files.

/** The 15 UI kit colours, in the order the panel lists them, with names Muzzy would use. */
export const UI_COLOURS = [
  { token: 'bg', name: 'Page background' },
  { token: 'on-bg', name: 'Text on page' },
  { token: 'surface', name: 'Cards' },
  { token: 'on-surface', name: 'Text on cards' },
  { token: 'primary', name: 'Main buttons' },
  { token: 'on-primary', name: 'Text on main buttons' },
  { token: 'accent', name: 'Highlight' },
  { token: 'danger', name: 'Danger' },
  { token: 'on-danger', name: 'Text on danger' },
  { token: 'muted', name: 'Quiet text' },
  { token: 'border', name: 'Outlines' },
  { token: 'focus', name: 'Keyboard focus' },
  { token: 'ink', name: 'Ink' },
  { token: 'on-game', name: 'HUD text on the table' },
  { token: 'game-shade', name: 'HUD text halo' },
] as const

/** The 3D table's colours (content/ui/table.json). Divider opacity is a slider, not a colour. */
export const TABLE_COLOURS = [
  { key: 'rows', name: 'Rows felt' },
  { key: 'rolling', name: 'Rolling area felt' },
  { key: 'divider', name: 'Divider line' },
] as const
export const DIVIDER_OPACITY_NAME = 'Divider line opacity'

export type UiColours = Record<string, string> // token → "#rrggbb"
export type TableValues = { rows: string; rolling: string; divider: string; dividerOpacity: number }
export type ColourState = { ui: UiColours; table: TableValues }
export type Change = { name: string; from: string; to: string }

/** "Main buttons (primary)" */
export const uiLabel = (token: string) => `${UI_COLOURS.find((c) => c.token === token)?.name ?? token} (${token})`

const isUiColour = (name: string) => UI_COLOURS.some((c) => c.token === name)

/** Tidy a typed colour: "#ABC", "abc", "#AABBCC" → "#aabbcc". Anything else → null. */
export function normalizeHex(text: string): string | null {
  const t = text.trim().toLowerCase().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/.test(t)) return '#' + [...t].map((ch) => ch + ch).join('')
  if (/^[0-9a-f]{6}$/.test(t)) return '#' + t
  return null
}

/** Same colour? ("#FFF" and "#ffffff" are.) Non-hex values like "transparent" compare as text. */
export function sameColour(a: string | undefined, b: string | undefined): boolean {
  if (a === undefined || b === undefined) return a === b
  return (normalizeHex(a) ?? a) === (normalizeHex(b) ?? b)
}

/** The colours the game shows: the preset's, with the file's tweaks on top. */
export function uiColoursFrom(preset: Record<string, unknown>, tweaks: Record<string, unknown> = {}): UiColours {
  const out: UiColours = {}
  for (const { token } of UI_COLOURS) out[token] = String(tweaks[token] ?? preset[token])
  return out
}

/**
 * What goes in style.json "tweaks" on Save: every colour that differs from the preset
 * (colours equal to the preset are dropped), plus any non-colour tweaks the file already had —
 * this tool only owns the colours, so fonts/spacing tweaks are left exactly as they were.
 */
export function tweaksToSave(
  preset: Record<string, unknown>,
  colours: UiColours,
  oldTweaks: Record<string, unknown> = {},
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [name, value] of Object.entries(oldTweaks)) if (!isUiColour(name)) out[name] = value
  for (const { token } of UI_COLOURS) {
    if (!sameColour(colours[token], String(preset[token]))) out[token] = colours[token]
  }
  return out
}

/** Every value that differs between two states, with friendly names, in panel order. */
export function listChanges(before: ColourState, after: ColourState): Change[] {
  const changes: Change[] = []
  for (const { token } of UI_COLOURS) {
    if (!sameColour(before.ui[token], after.ui[token])) changes.push({ name: uiLabel(token), from: before.ui[token], to: after.ui[token] })
  }
  for (const { key, name } of TABLE_COLOURS) {
    if (!sameColour(before.table[key], after.table[key])) changes.push({ name, from: before.table[key], to: after.table[key] })
  }
  if (before.table.dividerOpacity !== after.table.dividerOpacity) {
    changes.push({ name: DIVIDER_OPACITY_NAME, from: String(before.table.dividerOpacity), to: String(after.table.dividerOpacity) })
  }
  return changes
}

/** Does the table part differ? (decides whether Save needs to write table.json) */
export const tableChanged = (a: TableValues, b: TableValues) =>
  TABLE_COLOURS.some(({ key }) => !sameColour(a[key], b[key])) || a.dividerOpacity !== b.dividerOpacity

/** Does the UI part differ? (decides whether Save needs to write style.json) */
export const uiChanged = (a: UiColours, b: UiColours) => UI_COLOURS.some(({ token }) => !sameColour(a[token], b[token]))

/**
 * The "Copy for Claude" text, e.g.
 *   Colour changes from the Dev Kit (Roll Better) — saved to content/ui/style.json and content/ui/table.json:
 *   - Main buttons (primary): #ffc629 → #ff9f1c
 */
export function copyForClaudeText(game: string, changes: Change[], allSaved: boolean): string {
  if (changes.length === 0) return `No colour changes in the Dev Kit (${game}) since the game loaded.`
  const status = allSaved
    ? 'saved to content/ui/style.json and content/ui/table.json'
    : 'NOT all saved yet (press Save in the Dev Kit to write them to content/)'
  const lines = changes.map((c) => `- ${c.name}: ${c.from} → ${c.to}`)
  return [`Colour changes from the Dev Kit (${game}) — ${status}:`, ...lines].join('\n')
}
