import * as React from 'react';
import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { AddAssetForm } from '../components/inventory/AddAssetForm';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/inventory/add',
  component: AddAssetPage,
});

function AddAssetPage() {
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