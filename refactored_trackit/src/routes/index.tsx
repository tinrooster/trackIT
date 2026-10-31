import { Link, createRoute } from '@tanstack/react-router'
import { applicationModules } from '../config/appModules'
import { Route as rootRoute } from './__root'

// Rename export from indexRoute to Route
export const Route = createRoute({
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
        {applicationModules.map((module) => (
          <Link
            key={module.id}
            to={module.to}
            className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">{module.title}</h2>
            <p className="text-gray-600">
              {module.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
} 