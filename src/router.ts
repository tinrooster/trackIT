import { createRouter } from '@tanstack/react-router'
import { rootRoute } from './routes/__root'
import { indexRoute } from './routes/index'
import { assetsRoute } from './routes/assets'
import { inventoryRoute } from './routes/inventory'

// Create the route tree with all routes
const routeTree = rootRoute.addChildren([
  indexRoute,
  assetsRoute,
  inventoryRoute,
])

// Create and export the router instance
export const router = createRouter({ routeTree })

// Type declaration for TypeScript
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
} 