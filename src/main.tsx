import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './contexts/ThemeContext'
import { WorkspaceProvider } from './contexts/WorkspaceContext'
import { EditorProvider } from './contexts/EditorContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <WorkspaceProvider>
        <EditorProvider>
          <App />
        </EditorProvider>
      </WorkspaceProvider>
    </ThemeProvider>
  </StrictMode>,
)
