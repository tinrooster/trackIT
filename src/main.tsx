import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import './styles.css'
import { getVersion } from '@tauri-apps/api/app'

// Debug logging helper
const debug = {
  log: (...args: any[]) => {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] [DEBUG]`, ...args)
  },
  error: (...args: any[]) => {
    const timestamp = new Date().toISOString()
    console.error(`[${timestamp}] [ERROR]`, ...args)
  }
}

function isTauriApp() {
  return Boolean(window.__TAURI_IPC__) && window.location.protocol === 'tauri:'
}

// Initialize the app
async function init() {
  try {
    if (isTauriApp()) {
      const version = await getVersion()
      debug.log('Tauri app version:', version)
    }
  } catch (error) {
    debug.error('Failed to initialize app:', error)
  }
}

// Render the app
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)

// Initialize the app after render
init() 