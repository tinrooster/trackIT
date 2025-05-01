import { Link } from '@tanstack/react-router'

export function Navigation() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link to="/" className="text-xl font-semibold text-gray-900">
            TrackIT
          </Link>
          <nav className="flex space-x-4">
            <Link
              to="/inventory"
              className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Inventory
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          {/* User menu will go here */}
        </div>
      </div>
    </header>
  )
} 