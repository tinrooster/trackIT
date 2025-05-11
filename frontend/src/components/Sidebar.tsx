import { Link } from '@tanstack/react-router'

export const Sidebar = () => {
  return (
    <aside className="w-64 bg-white shadow">
      <div className="p-4">
        <nav className="space-y-2">
          <Link
            to="/inventory"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
          >
            Inventory
          </Link>
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar 