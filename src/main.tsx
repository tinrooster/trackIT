import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './routeTree'
import './styles.css'
import reportWebVitals from './reportWebVitals.ts'

console.log('Starting app initialization...')

const rootElement = document.getElementById('app')
console.log('Root element found:', rootElement)

if (!rootElement) {
  console.error('Root element not found!')
} else {
  const root = ReactDOM.createRoot(rootElement)
  console.log('Created React root')
  
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  )
  console.log('Rendered app')
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
