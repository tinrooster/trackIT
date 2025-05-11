import * as React from 'react';
import { Asset } from '../../types';
import { Link } from '@tanstack/react-router';

interface AssetTableProps {
  assets: Asset[];
  onDelete: (asset: Asset) => void;
}

export function AssetTable({ assets, onDelete }: AssetTableProps) {
  const [viewType, setViewType] = React.useState<'basic' | 'it-assets' | 'expendables'>('basic');
  
  // Function to get location display string
  const getLocationString = (location: Asset['location']) => {
    if (location.name) return location.name;
    
    // Fallback to building ID if name is not available
    return location.buildingId || 'Unknown';
  };
  
  return (
    <div className="mt-8 flow-root">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">
          {assets.length} {assets.length === 1 ? 'item' : 'items'} found
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setViewType('basic')}
            className={`px-3 py-1 text-sm rounded ${viewType === 'basic' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Basic View
          </button>
          <button 
            onClick={() => setViewType('it-assets')}
            className={`px-3 py-1 text-sm rounded ${viewType === 'it-assets' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            IT Assets
          </button>
          <button 
            onClick={() => setViewType('expendables')}
            className={`px-3 py-1 text-sm rounded ${viewType === 'expendables' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Expendables
          </button>
        </div>
      </div>
      
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    Name
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Type
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  
                  {viewType === 'basic' && (
                    <>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Location
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Assigned To
                      </th>
                    </>
                  )}
                  
                  {viewType === 'it-assets' && (
                    <>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Asset Tag
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Serial Number
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Project
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Location
                      </th>
                    </>
                  )}
                  
                  {viewType === 'expendables' && (
                    <>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Project
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Location
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Current Level
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Update Level
                      </th>
                    </>
                  )}
                  
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {assets.map((asset) => (
                  <tr key={asset.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      <Link
                        to="/inventory/$assetId"
                        params={{ assetId: asset.id }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {asset.name}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{asset.type}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        asset.status === 'Available' 
                          ? 'bg-green-100 text-green-800'
                          : asset.status === 'In Use'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {asset.status}
                      </span>
                    </td>
                    
                    {viewType === 'basic' && (
                      <>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {getLocationString(asset.location)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {asset.assignedTo?.name || '-'}
                        </td>
                      </>
                    )}
                    
                    {viewType === 'it-assets' && (
                      <>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {asset.id.substring(0, 8) || '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {asset.serialNumber || '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {asset.project || '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {getLocationString(asset.location)}
                        </td>
                      </>
                    )}
                    
                    {viewType === 'expendables' && (
                      <>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {asset.project || '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {getLocationString(asset.location)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {asset.currentLevel || 'Unknown'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              className="w-20 rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              defaultValue={asset.currentLevel}
                              min="0"
                            />
                            <button
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              onClick={() => {
                                // This would be replaced with actual update logic
                                alert(`Update level for ${asset.name}`);
                              }}
                            >
                              Update
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                    
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <Link
                        to="/inventory/$assetId"
                        params={{ assetId: asset.id }}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View/Edit
                      </Link>
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete ${asset.name}?`)) {
                            onDelete(asset);
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
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
  );
} 