import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CanvasEditor } from './features/canvas-editor/CanvasEditor'
import './app/app.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CanvasEditor />
  </StrictMode>,
)
