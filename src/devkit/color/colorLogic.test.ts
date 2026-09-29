import { describe, expect, it } from 'vitest'
import cartoon from '../../ui/kit/styles/cartoon.json'
import { colourTokens, lineColourTokens } from '../../ui/kit/style/tokens'
import {
  UI_COLOURS,
  copyForClaudeText,
  listChanges,
  normalizeHex,
  sameColour,
  tableChanged,
  tweaksToSave,
  uiChanged,
  uiColoursFrom,
  uiLabel,
  type ColourState,
} from './colorLogic'

const table = { rows: '#2b2f63', rolling: '#252858', divider: '#ffffff', dividerOpacity: 0.12 }
const start = (): ColourState => ({ ui: uiColoursFrom(cartoon), table: { ...table } })

describe('the colour list', () => {
  it('covers exactly the kit\'s 15 colour tokens', () => {
    const kit = [...Object.keys(colourTokens), ...Object.keys(lineColourTokens)].sort()
    expect(UI_COLOURS.map((c) => c.token).sort()).toEqual(kit)
    expect(UI_COLOURS).toHaveLength(15)
  })
  it('gives friendly labels', () => {
    expect(uiLabel('primary')).toBe('Main buttons (primary)')
    expect(uiLabel('game-shade')).toBe('HUD text halo (game-shade)')
  })
})

describe('normalizeHex / sameColour', () => {
  it('tidies typed colours', () => {
    expect(normalizeHex('#FFC629')).toBe('#ffc629')
    expect(normalizeHex('ffc629')).toBe('#ffc629')
    expect(normalizeHex(' #abc ')).toBe('#aabbcc')
    expect(normalizeHex('#ffc62')).toBeNull()
    expect(normalizeHex('transparent')).toBeNull()
    expect(normalizeHex('#ggg')).toBeNull()
  })
  it('treats #FFF and #ffffff as the same colour', () => {
    expect(sameColour('#FFF', '#ffffff')).toBe(true)
    expect(sameColour('#fff', '#fffffe')).toBe(false)
    expect(sameColour('transparent', 'transparent')).toBe(true)
  })
})

describe('uiColoursFrom', () => {
  it('is the preset with the file\'s tweaks on top', () => {
    const ui = uiColoursFrom(cartoon, { primary: '#ff9f1c', 'font-body': 'x' })
    expect(ui.primary).toBe('#ff9f1c')
    expect(ui.bg).toBe(cartoon.bg)
    expect(ui['font-body']).toBeUndefined() // only colours
  })
})

describe('tweaksToSave — what Save writes into style.json "tweaks"', () => {
  it('writes nothing when every colour matches the preset', () => {
    expect(tweaksToSave(cartoon, uiColoursFrom(cartoon))).toEqual({})
  })
  it('writes only the colours that differ from the preset', () => {
    const ui = { ...uiColoursFrom(cartoon), primary: '#ff9f1c' }
    expect(tweaksToSave(cartoon, ui)).toEqual({ primary: '#ff9f1c' })
  })
  it('drops an old colour tweak once it is set back to the preset value (any case)', () => {
    const ui = { ...uiColoursFrom(cartoon), accent: '#3CCF62' }
    expect(tweaksToSave(cartoon, ui, { accent: '#00ff00' })).toEqual({})
  })
  it('keeps non-colour tweaks the file already had', () => {
    const ui = { ...uiColoursFrom(cartoon), danger: '#aa0000' }
    expect(tweaksToSave(cartoon, ui, { 'font-scale': 1.3, danger: '#bb0000' })).toEqual({ 'font-scale': 1.3, danger: '#aa0000' })
  })
})

describe('listChanges / dirty checks', () => {
  it('lists nothing when nothing changed', () => {
    expect(listChanges(start(), start())).toEqual([])
    expect(uiChanged(start().ui, start().ui)).toBe(false)
    expect(tableChanged(start().table, start().table)).toBe(false)
  })
  it('lists UI, table and opacity changes with friendly names, in panel order', () => {
    const after = start()
    after.table.rows = '#3a3f7a'
    after.ui.primary = '#ff9f1c'
    after.table.dividerOpacity = 0.3
    expect(listChanges(start(), after)).toEqual([
      { name: 'Main buttons (primary)', from: '#ffc629', to: '#ff9f1c' },
      { name: 'Rows felt', from: '#2b2f63', to: '#3a3f7a' },
      { name: 'Divider line opacity', from: '0.12', to: '0.3' },
    ])
    expect(uiChanged(start().ui, after.ui)).toBe(true)
    expect(tableChanged(start().table, after.table)).toBe(true)
  })
  it('ignores case-only differences', () => {
    const after = start()
    after.ui.bg = cartoon.bg.toUpperCase()
    expect(listChanges(start(), after)).toEqual([])
  })
})

describe('copyForClaudeText', () => {
  const changes = [{ name: 'Main buttons (primary)', from: '#ffc629', to: '#ff9f1c' }]
  it('is a plain-English list of what changed', () => {
    expect(copyForClaudeText('Roll Better', changes, true)).toBe(
      'Colour changes from the Dev Kit (Roll Better) — saved to content/ui/style.json and content/ui/table.json:\n' +
        '- Main buttons (primary): #ffc629 → #ff9f1c',
    )
  })
  it('says when changes are not saved yet', () => {
    expect(copyForClaudeText('Roll Better', changes, false)).toContain('NOT all saved yet')
  })
  it('says so when nothing changed', () => {
    expect(copyForClaudeText('Roll Better', [], true)).toBe('No colour changes in the Dev Kit (Roll Better) since the game loaded.')
  })
})
