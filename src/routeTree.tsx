import { createRootRoute, createRouter } from '@tanstack/react-router'
import { rootRoute } from './routes/__root'
import { indexRoute } from './routes/index'
import { inventoryRoute } from './routes/inventory'

const routeTree = rootRoute.addChildren([indexRoute, inventoryRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
} 