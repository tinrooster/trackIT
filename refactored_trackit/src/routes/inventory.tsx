import * as React from 'react';
import { createRoute, Link, useNavigate } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { AssetTable } from '../components/inventory/AssetTable';
import { assetService } from '../services/asset.service';
import type { Asset } from '../types';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: 'inventory',
  component: InventoryPage,
});

function InventoryPage() {
  const { data: assets, isLoading, error } = assetService.useAssets();
  const deleteAssetMutation = assetService.useDeleteAsset();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedType, setSelectedType] = React.useState<string>('');
  const [selectedStatus, setSelectedStatus] = React.useState<string>('');
  const navigate = useNavigate();

  // Filter assets based on search term and filters
  const filteredAssets = React.useMemo(() => {
    if (!assets) return [];
    
    return assets.filter(asset => {
      const matchesSearch = !searchTerm || 
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
        
      const matchesType = !selectedType || asset.type === selectedType;
      const matchesStatus = !selectedStatus || asset.status === selectedStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [assets, searchTerm, selectedType, selectedStatus]);

  // Get unique types and statuses for filters
  const types = React.useMemo(() => {
    if (!assets) return [];
    return Array.from(new Set(assets.map(asset => asset.type)));
  }, [assets]);

  const statuses = React.useMemo(() => {
    if (!assets) return [];
    return Array.from(new Set(assets.map(asset => asset.status)));
  }, [assets]);

  const handleDelete = async (asset: Asset) => {
    if (window.confirm(`Are you sure you want to delete ${asset.name}?`)) {
      try {
        await deleteAssetMutation.mutateAsync(asset.id);
      } catch (error) {
        console.error('Failed to delete asset:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading assets</h3>
            <div className="mt-2 text-sm text-red-700">
              {error instanceof Error ? error.message : 'An unknown error occurred'}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          <Link
            to="/inventory/add"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            Add Asset
          </Link>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">
            Search
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="search"
              id="search"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Search by name or serial number"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            Type
          </label>
          <select
            id="type"
            name="type"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">All Types</option>
            {types.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      <AssetTable
        assets={filteredAssets}
        onDelete={handleDelete}
      />
    </div>
  );
} 