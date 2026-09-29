// The Table tab's thinking, kept apart from its looks so it can be tested (tableLogic.test.ts).
import tableFile from '../../content/ui/table.json'
import type { TableColors } from '../store/tableColors'
import { sameColour, type Change } from '../devkit/color/colorLogic'

export const COLOURS = [
  { key: 'rows', name: 'Rows felt' },
  { key: 'rolling', name: 'Rolling area felt' },
  { key: 'divider', name: 'Divider line' },
] as const
export const OPACITY_NAME = 'Divider line opacity'

export const fromFile = (): TableColors => ({ rows: tableFile.rows, rolling: tableFile.rolling, divider: tableFile.divider, dividerOpacity: tableFile.dividerOpacity })

/** Every table value that differs, with friendly names (for Copy for Claude and the dirty check). */
export function tableChanges(before: TableColors, after: TableColors): Change[] {
  const changes: Change[] = COLOURS.filter(({ key }) => !sameColour(before[key], after[key])).map(({ key, name }) => ({ name, from: before[key], to: after[key] }))
  if (before.dividerOpacity !== after.dividerOpacity) changes.push({ name: OPACITY_NAME, from: String(before.dividerOpacity), to: String(after.dividerOpacity) })
  return changes
}
