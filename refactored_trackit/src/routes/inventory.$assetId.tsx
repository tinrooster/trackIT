import * as React from 'react';
import { createRoute, useNavigate, useParams, Link, useLoaderData } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { assetService } from '../services/asset.service';
import type { Asset, AssetUpdateInput, User, Location, Project } from '../types'; // Use AssetUpdateInput

// --- Mock Data ---
// Replace with actual data fetching (e.g., from loader)
const mockUsers: User[] = [
  { id: 'user1', name: 'Alice', email: 'alice@example.com', role: 'User' }, 
  { id: 'user2', name: 'Bob', email: 'bob@example.com', role: 'Admin' } 
];
const mockLocations: Location[] = [{ id: 'loc1', buildingId: 'b1', roomId: 'r101' }, { id: 'loc2', buildingId: 'b2' }];
const mockProjects: Project[] = [{ id: 'proj1', name: 'Project Alpha' }, { id: 'proj2', name: 'Project Beta' }];
const assetTypes = ['Hardware', 'Software', 'Equipment', 'Tool', 'Consumable', 'Document', 'Other'];
const assetStatuses = ['Available', 'In Use', 'Maintenance', 'Reserved', 'Retired'];
// --- End Mock Data ---

interface AssetDetailLoaderData {
  asset: Asset;
  // TODO: Add actual data fetching for these in loader
  users: User[];
  locations: Location[];
  projects: Project[];
}

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: 'inventory/$assetId',
  component: AssetDetailPage,
  // TODO: Enhance loader to fetch users, locations, projects
  loader: async ({ params: { assetId } }): Promise<AssetDetailLoaderData> => {
    const asset = await assetService.getAsset(assetId);
    // Placeholder data fetching
    return {
      asset,
      users: mockUsers,
      locations: mockLocations,
      projects: mockProjects,
    };
  },
});

function AssetDetailPage() {
  const { assetId } = useParams({ from: Route.id });
  const navigate = useNavigate();
  const initialData = useLoaderData({ from: Route.id });
  // Pass only assetId to useAsset hook
  const { data: asset, isLoading: isAssetLoading, error: assetError } = assetService.useAsset(assetId);

  // Use initialData only if useAsset doesn't provide it initially or for comparison
  const displayAsset = asset || initialData.asset;

  const updateAssetMutation = assetService.useUpdateAsset();

  const [isEditing, setIsEditing] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // TODO: Add loading/error states for users, locations, projects if fetched separately

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const formData = new FormData(e.currentTarget);

    if (!displayAsset) { // Check against displayAsset
        setFormError("Asset data is not available.");
        return;
    }

    // Use the new AssetUpdateInput type
    const assetData: AssetUpdateInput = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      status: formData.get('status') as string,
      // Handle null assignment for optional fields if empty
      serialNumber: (formData.get('serialNumber') as string) || null,
      notes: (formData.get('notes') as string) || null,
      locationId: (formData.get('locationId') as string) || null,
      assignedToId: (formData.get('assignedToId') as string) || null,
      projectId: (formData.get('projectId') as string) || null,
      // currentLevel might need specific handling if editable
    };

    try {
      // Temporarily cast to any to satisfy linter, assuming backend expects AssetUpdateInput
      await updateAssetMutation.mutateAsync({
        id: assetId,
        asset: assetData as any 
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update asset:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to update asset');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormError(null);
    // Form fields will reset to asset data automatically on next render
  };

  if (isAssetLoading && !displayAsset) { // Adjust loading condition
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (assetError || !displayAsset) { // Adjust error condition
    console.error('Error loading asset:', assetError);
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
              {assetError instanceof Error ? assetError.message : 'Asset not found or could not be loaded'}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Helper to display location
  const getLocationDisplay = (location: Location | null | undefined) => {
    if (!location) return '-';
    return `${location.buildingId || ''}${location.roomId ? ` / ${location.roomId}` : ''}`;
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      {/* Form wrapper only in edit mode */}
      <form onSubmit={isEditing ? handleSubmit : (e) => e.preventDefault()}>
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Asset Details</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {isEditing ? 'Update the asset information.' : 'Details about the selected asset.'}
            </p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateAssetMutation.isPending}
                  className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {updateAssetMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button" // Changed from submit if form wraps always
                  onClick={() => setIsEditing(true)}
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
              </>
            )}
          </div>
        </div>

        {formError && (
           <div className="px-4 pb-4 sm:px-6">
            <div className="bg-red-50 p-3 rounded-md text-sm text-red-700">
                Error: {formError}
            </div>
           </div>
        )}

        <div className="border-t border-gray-200">
          <dl>
            {/* Name */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    defaultValue={displayAsset.name}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                ) : (
                  displayAsset.name
                )}
              </dd>
            </div>

            {/* Type */}
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Type</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                 {isEditing ? (
                   <select
                     id="type"
                     name="type"
                     required
                     defaultValue={displayAsset.type}
                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                   >
                     <option value="">Select a type</option>
                     {assetTypes.map(type => (
                       <option key={type} value={type}>{type}</option>
                     ))}
                   </select>
                 ) : (
                   displayAsset.type
                 )}
              </dd>
            </div>

            {/* Status */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                 {isEditing ? (
                   <select
                     id="status"
                     name="status"
                     required
                     defaultValue={displayAsset.status}
                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                   >
                     <option value="">Select a status</option>
                     {assetStatuses.map(status => (
                       <option key={status} value={status}>{status}</option>
                     ))}
                   </select>
                 ) : (
                   <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                     displayAsset.status === 'Available' ? 'bg-green-100 text-green-800' :
                     displayAsset.status === 'In Use' ? 'bg-blue-100 text-blue-800' :
                     'bg-gray-100 text-gray-800'
                   }`}>
                     {displayAsset.status}
                   </span>
                 )}
              </dd>
            </div>

            {/* Serial Number */}
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Serial Number</dt>
               <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                 {isEditing ? (
                   <input
                     type="text"
                     name="serialNumber"
                     id="serialNumber"
                     defaultValue={displayAsset.serialNumber || ''}
                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                   />
                 ) : (
                   displayAsset.serialNumber || '-'
                 )}
              </dd>
            </div>

            {/* Location */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Location</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                 {isEditing ? (
                   <select
                     id="locationId"
                     name="locationId" // Submit the ID
                     defaultValue={displayAsset.location?.id || ''} // Use location ID
                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                   >
                     <option value="">Select a location</option>
                     {/* Use actual locations from loader data */}
                     {initialData.locations.map((loc: Location) => (
                       <option key={loc.id} value={loc.id}>{getLocationDisplay(loc)}</option>
                     ))}
                   </select>
                 ) : (
                   getLocationDisplay(displayAsset.location)
                 )}
              </dd>
            </div>

            {/* Assigned To */}
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
               <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                 {isEditing ? (
                   <select
                     id="assignedToId"
                     name="assignedToId" // Submit the ID
                     defaultValue={displayAsset.assignedTo?.id || ''} // Use user ID
                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                   >
                     <option value="">Select a user</option>
                     {/* Use actual users from loader data */}
                     {initialData.users.map((user: User) => (
                       <option key={user.id} value={user.id}>{user.name}</option>
                     ))}
                   </select>
                 ) : (
                   displayAsset.assignedTo?.name || '-'
                 )}
              </dd>
            </div>

            {/* Project */}
             <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Project</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                 {isEditing ? (
                   <select
                     id="projectId"
                     name="projectId" // Submit the ID
                     defaultValue={displayAsset.project?.id || ''} // Use project ID
                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                   >
                     <option value="">Select a project</option>
                      {/* Use actual projects from loader data */}
                     {initialData.projects.map((proj: Project) => (
                       <option key={proj.id} value={proj.id}>{proj.name}</option>
                     ))}
                   </select>
                 ) : (
                   displayAsset.project?.name || '-' // Display name
                 )}
              </dd>
            </div>

            {/* Notes */}
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Notes</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isEditing ? (
                   <textarea
                     name="notes"
                     id="notes"
                     rows={3}
                     defaultValue={displayAsset.notes || ''}
                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                   />
                 ) : (
                   displayAsset.notes || '-'
                 )}
              </dd>
            </div>
          </dl>
        </div>
      </form>
    </div>
  );
} 