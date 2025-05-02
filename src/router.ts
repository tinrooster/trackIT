import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

// Create and export the router instance
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

// Type declaration for TypeScript
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
} 