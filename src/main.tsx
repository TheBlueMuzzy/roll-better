import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyStyle } from './ui/kit'
import style from '../content/ui/style.json'

applyStyle(style) // content/ui/style.json → the UI kit's look (Cartoon)

// Dev Kit (` key) — dev builds only. The dynamic import sits behind import.meta.env.DEV, which the
// live build replaces with false, so none of src/devkit/ ends up in the released game.
if (import.meta.env.DEV) {
  import('./devkit/mount').then((m) => m.mountDevKit())
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
