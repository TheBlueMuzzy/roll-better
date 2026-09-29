// COLOR TOOL (F59) — every UI colour and table colour, with a picker each.
//   UI colours come from content/ui/style.json: the preset's colours, with "tweaks" on top.
//   Table colours come from content/ui/table.json.
// ↺ on a UI colour = back to the preset. ↺ on a table value = back to what's saved in table.json.
// A dot next to a name = changed, not saved yet.
import { useEffect, useState } from 'react'
import styleFile from '../../../content/ui/style.json'
import tableFile from '../../../content/ui/table.json'
import { presets } from '../../ui/kit/styles'
import { applyStyle } from '../../ui/kit'
import { tableColors } from '../../store/tableColors'
import { CAN_SAVE, copyText, saveContentFile } from '../saveContent'
import { ColourBlindPreview } from './ColourBlindPreview'
import {
  DIVIDER_OPACITY_NAME,
  TABLE_COLOURS,
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
import './color.css'

const presetName = styleFile.preset
const preset: Record<string, unknown> = presets[presetName] ?? presets.clean
const presetTitle = presetName.charAt(0).toUpperCase() + presetName.slice(1) // "Cartoon"

function fromFiles(): ColourState {
  return {
    ui: uiColoursFrom(preset, styleFile.tweaks as Record<string, unknown>),
    table: { rows: tableFile.rows, rolling: tableFile.rolling, divider: tableFile.divider, dividerOpacity: tableFile.dividerOpacity },
  }
}

export function ColorTab() {
  const [colours, setColours] = useState(fromFiles) // what the game shows right now
  const [saved, setSaved] = useState(fromFiles) // what's in the files
  const [savedTweaks, setSavedTweaks] = useState(styleFile.tweaks as Record<string, unknown>) // style.json "tweaks" as saved
  const [loaded] = useState(fromFiles) // as the page loaded — Copy for Claude lists changes since then
  const [status, setStatus] = useState<{ kind: 'ok' | 'error' | 'info'; text: string } | null>(null)
  const [copyFallback, setCopyFallback] = useState<string | null>(null) // shown if the clipboard is blocked

  const uiDirty = uiChanged(colours.ui, saved.ui)
  const tableDirty = tableChanged(colours.table, saved.table)

  // Live preview: the UI restyles through the kit's style engine, the 3D table through tableColors
  useEffect(() => {
    applyStyle({ preset: presetName, tweaks: tweaksToSave(preset, colours.ui, savedTweaks) })
  }, [colours.ui, savedTweaks])
  useEffect(() => {
    tableColors.set(colours.table)
  }, [colours.table])

  // Save: style.json gets only the colours that differ from the preset; table.json gets its 4 values
  // (the dev server keeps table.json's _help note). Only files with changes are written.
  async function save() {
    setStatus({ kind: 'info', text: 'Saving…' })
    try {
      const written: string[] = []
      if (uiDirty) {
        const tweaks = tweaksToSave(preset, colours.ui, savedTweaks)
        await saveContentFile('content/ui/style.json', { ...styleFile, tweaks })
        setSavedTweaks(tweaks)
        written.push('style.json')
      }
      if (tableDirty) {
        await saveContentFile('content/ui/table.json', { ...colours.table })
        written.push('table.json')
      }
      setSaved(colours)
      setStatus({ kind: 'ok', text: `Saved ${written.join(' + ')} in content/ui/ — refresh and it stays.` })
    } catch (e) {
      setStatus({ kind: 'error', text: `Couldn't save: ${(e as Error).message}` })
    }
  }

  async function copyForClaude() {
    const text = copyForClaudeText(document.title, listChanges(loaded, colours), !uiDirty && !tableDirty, !CAN_SAVE)
    if (await copyText(text)) {
      setCopyFallback(null)
      setStatus({ kind: 'ok', text: 'Copied — paste it into your chat with Claude.' })
    } else {
      setCopyFallback(text)
      setStatus({ kind: 'error', text: 'The browser blocked copying — select the text below and copy it.' })
    }
  }

  const setUi = (token: string, value: string) => setColours((c) => ({ ...c, ui: { ...c.ui, [token]: value } }))
  const setTable = (key: string, value: string | number) => setColours((c) => ({ ...c, table: { ...c.table, [key]: value } }))

  return (
    <div className="ct">
      <p className="ct-legend">
        <span className="ct-dot" /> = changed, not saved yet · tap a swatch to pick a colour, or type a hex
      </p>

      <ColourBlindPreview />

      <h3 className="ct-group">UI colours <small>content/ui/style.json · ↺ = back to the {presetTitle} preset</small></h3>
      {UI_COLOURS.map(({ token }) => (
        <ColourRow
          key={token}
          label={uiLabel(token)}
          value={colours.ui[token]}
          changed={!sameColour(colours.ui[token], saved.ui[token])}
          resetTo={String(preset[token])}
          resetHint={`Back to the ${presetTitle} preset`}
          onChange={(v) => setUi(token, v)}
        />
      ))}

      <h3 className="ct-group">Table (3D) <small>content/ui/table.json · ↺ = back to the saved file</small></h3>
      {TABLE_COLOURS.map(({ key, name }) => (
        <ColourRow
          key={key}
          label={name}
          value={colours.table[key]}
          changed={!sameColour(colours.table[key], saved.table[key])}
          resetTo={saved.table[key]}
          resetHint="Back to the saved file"
          onChange={(v) => setTable(key, v)}
        />
      ))}
      <div className="ct-row">
        <span className="ct-label">
          {colours.table.dividerOpacity !== saved.table.dividerOpacity && <span className="ct-dot" title="Changed, not saved yet" />}
          {DIVIDER_OPACITY_NAME}
        </span>
        <input
          className="ct-slider"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={colours.table.dividerOpacity}
          onChange={(e) => setTable('dividerOpacity', Number(e.target.value))}
          aria-label={DIVIDER_OPACITY_NAME}
        />
        <span className="ct-number">{colours.table.dividerOpacity.toFixed(2)}</span>
        <button
          className="ct-reset"
          disabled={colours.table.dividerOpacity === saved.table.dividerOpacity}
          onClick={() => setTable('dividerOpacity', saved.table.dividerOpacity)}
          title={`Back to the saved file: ${saved.table.dividerOpacity}`}
          aria-label={`Reset ${DIVIDER_OPACITY_NAME} — back to the saved file`}
        >
          ↺
        </button>
      </div>

      <footer className="devkit-footer">
        {/* Live build: no dev server to save through, so Copy for Claude is the main button (see CAN_SAVE) */}
        {CAN_SAVE && (
          <button className="devkit-btn devkit-btn-main" disabled={!uiDirty && !tableDirty} onClick={save}>
            Save
          </button>
        )}
        <button className={CAN_SAVE ? 'devkit-btn' : 'devkit-btn devkit-btn-main'} onClick={copyForClaude}>
          Copy for Claude
        </button>
        <button className="devkit-btn" disabled={!uiDirty && !tableDirty} onClick={() => setColours(saved)} title="Put every colour back to what's saved">
          {CAN_SAVE ? 'Undo unsaved' : 'Undo changes'}
        </button>
        {status && <p className={`devkit-status is-${status.kind}`} role="status">{status.text}</p>}
        {copyFallback && <textarea className="ct-copy" readOnly value={copyFallback} onFocus={(e) => e.target.select()} />}
      </footer>
    </div>
  )
}

type RowProps = {
  label: string
  value: string
  changed: boolean
  resetTo: string
  resetHint: string
  onChange: (value: string) => void
}

/** One colour: [● name] [swatch = colour picker] [#hex] [↺] */
function ColourRow({ label, value, changed, resetTo, resetHint, onChange }: RowProps) {
  const hex = normalizeHex(value) // null for values like "transparent" — the picker can't show those
  return (
    <div className="ct-row">
      <span className="ct-label">
        {changed && <span className="ct-dot" title="Changed, not saved yet" />}
        {label}
      </span>
      <input
        className="ct-swatch"
        type="color"
        value={hex ?? '#000000'}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`${label} — pick a colour`}
        title="Pick a colour"
      />
      <HexField value={value} label={label} onChange={onChange} />
      <button
        className="ct-reset"
        disabled={sameColour(value, resetTo)}
        onClick={() => onChange(resetTo)}
        title={`${resetHint}: ${resetTo}`}
        aria-label={`Reset ${label} — ${resetHint.toLowerCase()} (${resetTo})`}
      >
        ↺
      </button>
    </div>
  )
}

/** A text box for typing a hex colour. Only a valid colour is passed on; a bad one shows red. */
function HexField({ value, label, onChange }: { value: string; label: string; onChange: (value: string) => void }) {
  const [draft, setDraft] = useState(value)
  // When the colour changes elsewhere (picker, ↺), the text box follows it
  const [lastValue, setLastValue] = useState(value)
  if (value !== lastValue) {
    setLastValue(value)
    setDraft(value)
  }
  const valid = normalizeHex(draft) !== null || draft.trim() === 'transparent'
  const commit = () => {
    const hex = normalizeHex(draft)
    if (hex && hex !== value) onChange(hex)
    else if (draft.trim() === 'transparent' && value !== 'transparent') onChange('transparent')
  }
  return (
    <input
      className={`ct-hex${valid ? '' : ' is-bad'}`}
      value={draft}
      spellCheck={false}
      autoCapitalize="off"
      onChange={(e) => {
        setDraft(e.target.value)
        // Apply as soon as a full 6-digit colour is typed, so the game updates while you type
        const hex = normalizeHex(e.target.value)
        if (hex && e.target.value.replace('#', '').length === 6) onChange(hex)
      }}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && commit()}
      aria-label={`${label} — hex`}
    />
  )
}
