import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyStyle } from './ui/kit'
import style from '../content/ui/style.json'

applyStyle(style) // content/ui/style.json → the UI kit's look (Cartoon)

// Dev Kit (` key) — always in local dev; in release builds only while content/devkit.json
// "inReleaseBuilds" is true (prototype → beta). Both are replaced with true/false at build time, so when
// they're both false the dynamic import is dead code and none of src/devkit/ ends up in the released game.
if (import.meta.env.DEV || __DEVKIT_IN_RELEASE__) {
  import('./devkit/mount').then((m) => m.mountDevKit())
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
