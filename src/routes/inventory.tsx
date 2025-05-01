import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { AssetList } from '@/components/inventory/AssetList';

function InventoryPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <p className="text-gray-600">
          Manage your assets, track equipment, and handle check-ins/check-outs
        </p>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Assets</h2>
          <p className="text-sm text-gray-600">View and manage all equipment</p>
        </div>
        <button className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
          Add New Asset
        </button>
      </div>

      <AssetList />
    </div>
  );
}

export const inventoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/inventory',
  component: AssetList,
}); 