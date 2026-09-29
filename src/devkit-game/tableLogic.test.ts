import { describe, expect, it } from 'vitest'
import { tableChanges } from './tableLogic'

const table = { rows: '#2b2f63', rolling: '#252858', divider: '#ffffff', dividerOpacity: 0.12 }

describe('Table tab — what changed', () => {
  it('lists nothing when nothing changed (case-only differences too)', () => {
    expect(tableChanges(table, { ...table })).toEqual([])
    expect(tableChanges(table, { ...table, divider: '#FFF' })).toEqual([])
  })
  it('lists colour and opacity changes with friendly names, in panel order', () => {
    expect(tableChanges(table, { ...table, dividerOpacity: 0.3, rows: '#3a3f7a' })).toEqual([
      { name: 'Rows felt', from: '#2b2f63', to: '#3a3f7a' },
      { name: 'Divider line opacity', from: '0.12', to: '0.3' },
    ])
  })
})
