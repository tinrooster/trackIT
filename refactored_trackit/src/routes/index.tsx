import { createRoute } from '@tanstack/react-router'
import { rootRoute } from './__root'
import { Link } from '@tanstack/react-router'

// Create the index route
export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

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

        <Link
          to="/reports"
          className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">Reports</h2>
          <p className="text-gray-600">
            Generate insights and track inventory metrics
          </p>
        </Link>

        <Link
          to="/settings"
          className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">Settings</h2>
          <p className="text-gray-600">
            Configure application settings and preferences
          </p>
        </Link>
      </div>
    </div>
  )
} 