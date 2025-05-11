import { Link } from '@tanstack/react-router'

export const Header = () => {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold">TrackIT</span>
            </div>
            <nav className="ml-6 flex space-x-8">
              <Link
                to="/"
                className="inline-flex items-center px-1 pt-1 text-gray-900"
              >
                Home
              </Link>
              <Link
                to="/inventory"
                className="inline-flex items-center px-1 pt-1 text-gray-900"
              >
                Inventory
              </Link>
            </nav>
          </div>
          <div className="flex items-center">
            <Link
              to="/inventory/add"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => console.log('Header: Add Asset button clicked')}
            >
              Add Asset
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
