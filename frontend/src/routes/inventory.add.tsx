import { createFileRoute } from '@tanstack/react-router'
import { AddAssetForm } from '../components/inventory/AddAssetForm'

export const Route = createFileRoute('/inventory/add')({
  component: RouteComponent,
})

function RouteComponent() {
  console.log('Rendering AddAssetPage');
  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Add New Asset</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create a new asset in the inventory system.
          </p>
        </div>
      </div>
      <div className="mt-8 max-w-3xl">
        <AddAssetForm />
      </div>
    </div>
  );
}
