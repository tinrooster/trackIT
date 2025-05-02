import * as React from 'react';
import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { assetService } from '../services/asset.service';
import type { AssetCreateInput } from '../types/asset';
import { assetDetailRoute } from './inventory.$assetId';

// Debug logging helper
const debug = {
  log: (...args: any[]) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [EDIT_ASSET_PAGE]`, ...args);
  },
  error: (...args: any[]) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [EDIT_ASSET_PAGE]`, ...args);
  }
};

export const editAssetRoute = createFileRoute('/inventory/$assetId/edit')({
  component: EditAssetPage,
  loader: ({ params: { assetId } }) => assetService.getAsset(assetId),
  validateSearch: (search: Record<string, unknown>) => ({}),
});

function EditAssetPage() {
  const { assetId } = useParams({ from: editAssetRoute.id });
  const navigate = useNavigate();
  const { data: asset, isLoading, error } = assetService.useAsset(assetId);
  const updateAssetMutation = assetService.useUpdateAsset();
  const [formError, setFormError] = React.useState<string | null>(null);

  debug.log('Initializing EditAssetPage');
  debug.log('Current assetId:', assetId);
  debug.log('Asset data:', asset);
  debug.log('Loading state:', isLoading);
  debug.log('Error state:', error);

  React.useEffect(() => {
    debug.log('EditAssetPage mounted');
    return () => {
      debug.log('EditAssetPage unmounted');
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    debug.log('Form submission started');
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    
    // Construct the asset update data from form
    const assetData: Partial<AssetCreateInput> = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      status: formData.get('status') as string,
      serialNumber: formData.get('serialNumber') as string || undefined,
      notes: formData.get('notes') as string || undefined,
      // Preserve existing fields that aren't in the form
      location: asset?.location,
      assignedTo: asset?.assignedTo,
      project: asset?.project,
    };

    debug.log('Form data collected:', assetData);

    try {
      debug.log('Attempting to update asset');
      await updateAssetMutation.mutateAsync({ 
        id: assetId, 
        asset: assetData 
      });
      debug.log('Asset update successful');
      navigate({ to: assetDetailRoute.id });
    } catch (err) {
      debug.error('Failed to update asset:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to update asset');
    }
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

  // Get types and statuses (this would be from an API in a real app)
  const assetTypes = [
    'Hardware',
    'Software',
    'Equipment',
    'Tool',
    'Consumable',
    'Document',
    'Other'
  ];

  const assetStatuses = [
    'Available',
    'In Use',
    'Maintenance',
    'Reserved',
    'Retired'
  ];

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Edit Asset</h1>
          <p className="mt-2 text-sm text-gray-700">
            Update asset information in the inventory system.
          </p>
        </div>
      </div>

      {formError && (
        <div className="mt-4 bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Form error</h3>
              <div className="mt-2 text-sm text-red-700">{formError}</div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              id="name"
              required
              defaultValue={asset.name}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
            <select
              id="type"
              name="type"
              required
              defaultValue={asset.type}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Select a type</option>
              {assetTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
            <select
              id="status"
              name="status"
              required
              defaultValue={asset.status}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Select a status</option>
              {assetStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700">Serial Number</label>
            <input
              type="text"
              name="serialNumber"
              id="serialNumber"
              defaultValue={asset.serialNumber || ''}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            name="notes"
            id="notes"
            rows={3}
            defaultValue={asset.notes || ''}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              debug.log('Cancel button clicked');
              navigate({ to: '/inventory' });
            }}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateAssetMutation.isPending}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {updateAssetMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
} 