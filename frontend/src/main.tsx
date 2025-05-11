import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen.ts'
import './styles.css'
import reportWebVitals from './reportWebVitals.ts'
import { getVersion } from '@tauri-apps/api/app'
import { createRouter } from '@tanstack/react-router'

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

// Create the router instance
const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

async function initApp() {
  try {
    debug.log('Starting application initialization...')
    debug.log('Environment:', {
      protocol: window.location.protocol,
      isTauri: isTauriApp(),
      tauriIPC: Boolean(window.__TAURI_IPC__),
    })

    // Only try to initialize Tauri if we're actually in the Tauri app
    if (isTauriApp()) {
      debug.log('Running in Tauri environment, initializing...')
      try {
        const version = await getVersion()
        debug.log('Tauri version:', version)
      } catch (e) {
        debug.error('Failed to get Tauri version:', e)
        throw new Error('Failed to initialize Tauri environment')
      }
    } else {
      debug.log('Not running in Tauri environment, continuing with web initialization')
    }

    debug.log('Looking for root element...')
    const rootElement = document.getElementById('root')
    debug.log('Root element found:', !!rootElement)
    
    if (!rootElement) {
      throw new Error('Root element not found!')
    }

    debug.log('Creating React root...')
    const root = createRoot(rootElement)
    
    debug.log('Rendering application...')
    root.render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>
    )
    debug.log('Application rendered successfully')
    
  } catch (error) {
    debug.error('Failed to initialize app:', error)
    // Display error to user
    const rootElement = document.getElementById('root')
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; color: red;">
          <h1>Application Error</h1>
          <p>Failed to initialize the application. Please try restarting.</p>
          <pre>${error instanceof Error ? error.message : String(error)}</pre>
          <div style="margin-top: 20px; padding: 10px; background: #f5f5f5;">
            <strong>Debug Information:</strong>
            <br>
            Protocol: ${window.location.protocol}
            <br>
            Running in Tauri: ${isTauriApp()}
            <br>
            IPC Available: ${typeof window.__TAURI_IPC__ !== 'undefined'}
          </div>
        </div>
      `
    }
  }
}

// Initialize the app
debug.log('Starting app bootstrap...')
initApp().catch(e => debug.error('Fatal initialization error:', e))

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
