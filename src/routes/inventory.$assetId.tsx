import * as React from 'react';
import { createFileRoute, Link, useParams, useNavigate, Outlet } from '@tanstack/react-router';
import { assetService } from '../services/asset.service';
import { editAssetRoute } from './inventory.$assetId.edit';
import { inventoryRoute } from './inventory';

export const assetDetailRoute = createFileRoute('/inventory/$assetId')({
  component: AssetDetailPage,
  loader: ({ params: { assetId } }) => assetService.getAsset(assetId),
  validateSearch: (search: Record<string, unknown>) => ({}),
});

function AssetDetailPage() {
  const { assetId } = useParams({ from: assetDetailRoute.id });
  const navigate = useNavigate();
  const { data: asset, isLoading, error } = assetService.useAsset(assetId);

  console.log('AssetDetailPage - Current assetId:', assetId);
  console.log('AssetDetailPage - Asset data:', asset);

  const handleEdit = () => {
    console.log('Edit button clicked - Navigating to edit page');
    console.log('Edit button - assetId:', assetId);
    navigate({
      to: '/inventory/$assetId/edit',
      params: { assetId }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading asset</h3>
            <div className="mt-2 text-sm text-red-700">
              {error instanceof Error ? error.message : 'Asset not found or could not be loaded'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">Asset Details</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Details about the selected asset.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleEdit}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Edit
          </button>
          <Link 
            to="/inventory"
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Inventory
          </Link>
        </div>
      </div>
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Name</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{asset.name}</dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Type</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{asset.type}</dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                asset.status === 'Available' 
                  ? 'bg-green-100 text-green-800'
                  : asset.status === 'In Use'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {asset.status}
              </span>
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Serial Number</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{asset.serialNumber || '-'}</dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Location</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{asset.location.name}</dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{asset.assignedTo?.name || '-'}</dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Notes</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{asset.notes || '-'}</dd>
          </div>
        </dl>
      </div>
      {/* Outlet for child routes (e.g., edit page) */}
      <div className="p-4 sm:p-6">
        <Outlet />
      </div>
    </div>
  );
} 