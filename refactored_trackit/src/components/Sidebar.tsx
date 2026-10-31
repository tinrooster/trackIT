import { Link } from '@tanstack/react-router'
import { applicationModules } from '../config/appModules'

export const Sidebar = () => {
  return (
    <aside className="w-64 bg-white shadow">
      <div className="p-4">
        <nav className="space-y-2">
          {applicationModules.map((module) => (
            <Link
              key={module.id}
              to={module.to}
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            >
              {module.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar 