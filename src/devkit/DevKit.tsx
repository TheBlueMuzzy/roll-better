// THE BMUZ DEV KIT — developer tools that live inside the game, in dev builds only.
// main.tsx loads it (via mount.tsx) with a dynamic import behind import.meta.env.DEV, so the live build has none of it.
//   Open:  the ` key (desktop) or triple-tap the top-right corner (phone)
//   Close: Esc, the ✕ button, or ` again
// Tools are tabs across the top. To add a tool: make a component and add it to TABS below.
// The one rule (DEVKIT.md): tools edit content/ JSON files, never code.
import { useEffect, useRef, useState, type ComponentType } from 'react'
import { ColorTab } from './color/ColorTab'
import './devkit.css'

// Searched for by the live-build check (Sprint 04 task 3) — it must never appear in dist/
const DEVKIT_MARKER = 'bmuz-devkit-console'

type Tab = { id: string; label: string; Panel: ComponentType }
const TABS: Tab[] = [
  { id: 'color', label: 'Color', Panel: ColorTab },
]

const CORNER_SIZE_PX = 64 // the invisible top-right square you triple-tap on a phone
const TRIPLE_TAP_MS = 700 // all three taps must land within this time
const GHOST_CLICK_MS = 500 // see closeFromButton

// Is the player typing in one of the game's text boxes? Then ` is just a character, not the Dev Kit key.
// (The Dev Kit's own boxes never need a `, so there it still opens/closes the panel.)
function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null
  if (!el || el.closest?.('.devkit')) return false
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable
}

export function DevKit() {
  const [open, setOpen] = useState(false)
  const [tabId, setTabId] = useState(TABS[0].id)
  const openRef = useRef(open) // the key handler below reads this (it's set up once)
  const panel = useRef<HTMLElement>(null)
  useEffect(() => {
    openRef.current = open
    // The game's toasts and tooltips are browser popovers, which float above any z-index.
    // Making the panel a popover too puts it on top of whatever is showing when it opens.
    const el = panel.current
    if (!el?.showPopover) return // older browsers: `hidden` alone shows/hides it
    if (open && !el.matches(':popover-open')) el.showPopover()
    if (!open && el.matches(':popover-open')) el.hidePopover()
  }, [open])

  // ` toggles, Esc closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === '`' || e.code === 'Backquote') && !isTyping(e.target)) {
        e.preventDefault()
        setOpen((o) => !o)
      } else if (e.key === 'Escape' && openRef.current) {
        e.stopPropagation() // the Dev Kit eats this Esc so the game doesn't also react to it
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  // Triple-tap the top-right corner (phones have no ` key)
  const lastTripleTap = useRef(-Infinity)
  useEffect(() => {
    let taps: number[] = []
    const onDown = (e: PointerEvent) => {
      const inCorner = e.clientX > window.innerWidth - CORNER_SIZE_PX && e.clientY < CORNER_SIZE_PX
      const onPanel = (e.target as HTMLElement | null)?.closest?.('.devkit')
      if (!inCorner || onPanel) return
      const now = performance.now()
      taps = taps.filter((t) => now - t < TRIPLE_TAP_MS)
      taps.push(now)
      if (taps.length >= 3) {
        taps = []
        lastTripleTap.current = now
        setOpen((o) => !o)
      }
    }
    window.addEventListener('pointerdown', onDown, true)
    return () => window.removeEventListener('pointerdown', onDown, true)
  }, [])

  // The third tap's "click" arrives after the panel has opened — right on top of ✕. Ignore that one.
  const closeFromButton = () => {
    if (performance.now() - lastTripleTap.current > GHOST_CLICK_MS) setOpen(false)
  }

  // The panel stays mounted while hidden, so unsaved edits survive closing and reopening it.
  return (
    <aside ref={panel} {...{ popover: 'manual' }} className="devkit" data-devkit={DEVKIT_MARKER} hidden={!open} aria-label="Dev Kit">
      <header className="devkit-top">
        <strong className="devkit-title">Dev Kit</strong>
        <nav className="devkit-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={t.id === tabId}
              className="devkit-tab"
              onClick={() => setTabId(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <button className="devkit-close" onClick={closeFromButton} aria-label="Close the Dev Kit" title="Close (Esc)">
          ✕
        </button>
      </header>
      {TABS.map((t) => (
        <section key={t.id} className="devkit-body" hidden={t.id !== tabId} role="tabpanel">
          <t.Panel />
        </section>
      ))}
    </aside>
  )
}
