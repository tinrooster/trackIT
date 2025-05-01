import { Router, createRoute } from '@tanstack/react-router'
import { rootRoute } from './__root'
import { Link } from '@tanstack/react-router'
import { assetsRoute } from './api.assets'

// Create the index route
export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

// Create the route tree with all routes
const routeTree = rootRoute.addChildren([
  indexRoute,
  assetsRoute,
])

// Create and export the router instance
export const router = new Router({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function HomePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          TEd_TrackIT v0.1.0
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          KGO Engineering * centralized inventory management   
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto mt-12">
        <Link
          to="/inventory"
          className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">Inventory Management</h2>
          <p className="text-gray-600">
            Track and manage all your equipment and assets
          </p>
        </Link>

        <div className="p-6 bg-white rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Check In/Out</h2>
          <p className="text-gray-600">
            Manage equipment assignments and returns
          </p>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Reports</h2>
          <p className="text-gray-600">
            Generate insights and track inventory metrics
          </p>
        </div>
      </div>
    </div>
  )
} 