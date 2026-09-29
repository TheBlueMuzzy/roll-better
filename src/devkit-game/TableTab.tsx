// TABLE TOOL (Roll Better's own Dev Kit tab) — the 3D table's felt and divider, from content/ui/table.json.
// ↺ = back to what's saved. A dot next to a name = changed, not saved yet.
import { useEffect, useState } from 'react'
import { tableColors, type TableColors } from '../store/tableColors'
import { CAN_SAVE, copyText, saveContentFile } from '../devkit/saveContent'
import { ColourRow } from '../devkit/color/ColourRow'
import { copyForClaudeText, sameColour } from '../devkit/color/colorLogic'
import { COLOURS, OPACITY_NAME, fromFile, tableChanges } from './tableLogic'
import '../devkit/color/color.css'

export function TableTab() {
  const [table, setTable] = useState(fromFile) // what the game shows right now
  const [saved, setSaved] = useState(fromFile) // what's in the file
  const [loaded] = useState(fromFile) // as the page loaded — Copy for Claude lists changes since then
  const [status, setStatus] = useState<{ kind: 'ok' | 'error' | 'info'; text: string } | null>(null)
  const [copyFallback, setCopyFallback] = useState<string | null>(null) // shown if the clipboard is blocked
  const dirty = tableChanges(saved, table).length > 0

  // Live preview: the Scene repaints through tableColors
  useEffect(() => tableColors.set(table), [table])

  async function save() {
    setStatus({ kind: 'info', text: 'Saving…' })
    try {
      await saveContentFile('content/ui/table.json', { ...table }) // the dev server keeps the file's _help note
      setSaved(table)
      setStatus({ kind: 'ok', text: 'Saved content/ui/table.json — refresh and it stays.' })
    } catch (e) {
      setStatus({ kind: 'error', text: `Couldn't save: ${(e as Error).message}` })
    }
  }

  async function copyForClaude() {
    const text = copyForClaudeText(document.title, tableChanges(loaded, table), !dirty, !CAN_SAVE, 'Table', 'content/ui/table.json')
    if (await copyText(text)) {
      setCopyFallback(null)
      setStatus({ kind: 'ok', text: 'Copied — paste it into your chat with Claude.' })
    } else {
      setCopyFallback(text)
      setStatus({ kind: 'error', text: 'The browser blocked copying — select the text below and copy it.' })
    }
  }

  const set = (key: keyof TableColors, value: string | number) => setTable((t) => ({ ...t, [key]: value }))

  return (
    <div className="ct">
      <h3 className="ct-group">Table (3D) <small>content/ui/table.json · ↺ = back to the saved file</small></h3>
      {COLOURS.map(({ key, name }) => (
        <ColourRow
          key={key}
          label={name}
          value={table[key]}
          changed={!sameColour(table[key], saved[key])}
          resetTo={saved[key]}
          resetHint="Back to the saved file"
          onChange={(v) => set(key, v)}
        />
      ))}
      <div className="ct-row">
        <span className="ct-label">
          {table.dividerOpacity !== saved.dividerOpacity && <span className="ct-dot" title="Changed, not saved yet" />}
          {OPACITY_NAME}
        </span>
        <input className="ct-slider" type="range" min={0} max={1} step={0.01} value={table.dividerOpacity}
          onChange={(e) => set('dividerOpacity', Number(e.target.value))} aria-label={OPACITY_NAME} />
        <span className="ct-number">{table.dividerOpacity.toFixed(2)}</span>
        <button className="ct-reset" disabled={table.dividerOpacity === saved.dividerOpacity}
          onClick={() => set('dividerOpacity', saved.dividerOpacity)} aria-label={`Reset ${OPACITY_NAME} — back to the saved file`}>
          ↺
        </button>
      </div>
      <footer className="devkit-footer">
        {CAN_SAVE && <button className="devkit-btn devkit-btn-main" disabled={!dirty} onClick={save}>Save</button>}
        <button className={CAN_SAVE ? 'devkit-btn' : 'devkit-btn devkit-btn-main'} onClick={copyForClaude}>Copy for Claude</button>
        <button className="devkit-btn" disabled={!dirty} onClick={() => setTable(saved)}>{CAN_SAVE ? 'Undo unsaved' : 'Undo changes'}</button>
        {status && <p className={`devkit-status is-${status.kind}`} role="status">{status.text}</p>}
        {copyFallback && <textarea className="ct-copy" readOnly value={copyFallback} onFocus={(e) => e.target.select()} />}
      </footer>
    </div>
  )
}
