import { createRouter } from '@tanstack/react-router'
// Import root route and all page routes
import { rootRoute } from './routes/__root'
import { indexRoute } from './routes/index'
import { inventoryRoute } from './routes/inventory'
import { addAssetRoute } from './routes/inventory.add'
import { assetDetailRoute } from './routes/inventory.$assetId'
import { editAssetRoute } from './routes/inventory.$assetId.edit'
import { reportsRoute } from './routes/reports'
import { settingsRoute } from './routes/settings'

// Create the route tree with proper nesting
const routeTree = rootRoute.addChildren([
  indexRoute,
  inventoryRoute,
  addAssetRoute,
  assetDetailRoute,
  editAssetRoute,
  reportsRoute,
  settingsRoute
])

// Create the router with the route tree
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

// Register the router for TypeScript support
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
} 