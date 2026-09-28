import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyStyle } from './ui/kit'
import style from '../content/ui/style.json'

applyStyle(style) // content/ui/style.json → the UI kit's look (Cartoon)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
