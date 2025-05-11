import { createRouter } from '@tanstack/react-router'
import { Route as rootRoute } from './routes/__root'
import { Route as indexRoute } from './routes/index'
import { Route as inventoryRoute } from './routes/inventory'

const routeTree = rootRoute.addChildren([
  indexRoute,
  inventoryRoute,
])

export const router = createRouter({ routeTree }) 