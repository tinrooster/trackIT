import * as React from 'react';
import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '../routes/__root';
import { assetService } from '../services/asset.service';
import type { Asset } from '../types/asset';

export const inventoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/inventory',
  loader: async () => {
    const assets = await assetService.getAssets();
    return { assets };
  },
  component: InventoryPage,
});

function InventoryPage() {
  const { assets } = inventoryRoute.useLoaderData() as { assets: Asset[] };

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Inventory</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all assets in your inventory including their name, type, status, and location.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            Add Asset
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Type
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Location
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {assets.map((asset) => (
                    <tr key={asset.id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{asset.name}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{asset.type}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{asset.status}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{asset.location.name}</td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button className="text-blue-600 hover:text-blue-900">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 