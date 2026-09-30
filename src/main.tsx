import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyStyle } from './ui/kit'
import style from '../content/ui/style.json'
import { registerSW } from 'virtual:pwa-register'

applyStyle(style) // content/ui/style.json → the UI kit's look (Cartoon)

// Dev Kit (` key) — always in local dev; in release builds only while content/devkit.json
// "inReleaseBuilds" is true (prototype → beta). Both are replaced with true/false at build time, so when
// they're both false the dynamic import is dead code and none of src/devkit/ ends up in the released game.
if (import.meta.env.DEV || __DEVKIT_IN_RELEASE__) {
  import('./devkit/mount').then((m) => m.mountDevKit())
}

// Offline cache: when a new release is out, the new version downloads in the background and the page
// swaps to it straight away — returning players never see the old version (was: only on the next visit).
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
