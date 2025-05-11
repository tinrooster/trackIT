import * as React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Location } from '../../lib/types';
import { 
  fetchLocations, 
  createSafeLocation, 
  deleteSafeLocation 
} from '../../lib/safeStorageService';
import { 
  getLocations, 
  isOfflineMode 
} from '../../lib/staticStore';

type LocationType = Location['type'];

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
      <h3 className="text-lg font-medium text-red-800">Something went wrong</h3>
      <p className="mt-2 text-sm text-red-600">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
      >
        Try again
      </button>
    </div>
  );
}

export function LocationSettings() {
  // Use the static store data directly
  const [locations, setLocations] = React.useState<Location[]>(getLocations());
  const [newLocation, setNewLocation] = React.useState<{
    type: LocationType;
    name?: string;
    parentId?: string;
  }>({
    type: 'Area'
  });
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Just fetch once on mount, with no delay in rendering existing data
  React.useEffect(() => {
    // Function to refresh the locations from the static store
    const refreshFromStore = () => {
      setLocations(getLocations());
    };

    // Immediately set from static store
    refreshFromStore();

    // Start background fetch from backend
    const fetchData = async () => {
      try {
        await fetchLocations();
        // Update with fresh data from the store after fetching
        refreshFromStore();
      } catch (err) {
        console.error('Error in background fetch:', err);
      }
    };

    fetchData();

    // Set up store listener (simplified version for the example)
    const intervalId = setInterval(refreshFromStore, 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Group locations by type
  const locationsByType = React.useMemo(() => ({
    Area: locations.filter(l => l.type === 'Area'),
    Rack: locations.filter(l => l.type === 'Rack'),
    Cabinet: locations.filter(l => l.type === 'Cabinet')
  }), [locations]);

  // Find location by ID
  const getLocationById = React.useCallback(
    (id: string) => locations.find(l => l.id === id),
    [locations]
  );

  // Get location path
  const getLocationPath = React.useCallback((location: Location): string => {
    const path: string[] = [location.name];
    let currentLoc = location;
    
    // Limit recursion depth as a safety measure
    let depth = 0;
    const maxDepth = 10;
    
    while (currentLoc.parentId && depth < maxDepth) {
      const parent = getLocationById(currentLoc.parentId);
      if (!parent) break;
      path.unshift(parent.name);
      currentLoc = parent;
      depth++;
    }
    
    return path.join(' > ');
  }, [getLocationById]);

  // Get available parent locations
  const getAvailableParents = React.useCallback((type: LocationType) => {
    const validParentTypes: Record<LocationType, LocationType[]> = {
      Area: [],
      Rack: ['Area'],
      Cabinet: ['Area', 'Rack']
    };

    return locations
      .filter(loc => validParentTypes[type].includes(loc.type))
      .map(loc => ({
        id: loc.id,
        displayName: `${loc.name} (${loc.type})`
      }));
  }, [locations]);

  // Check if location can be deleted
  const canDeleteLocation = React.useCallback(
    (id: string) => !locations.some(loc => loc.parentId === id),
    [locations]
  );

  // Handle form submission - safe version
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!newLocation.name?.trim()) {
      setError('Name is required');
      return;
    }

    if (newLocation.type !== 'Area' && !newLocation.parentId) {
      setError('Parent location is required');
      return;
    }

    setIsUpdating(true);
    try {
      await createSafeLocation({
        name: newLocation.name.trim(),
        type: newLocation.type,
        parentId: newLocation.parentId
      });
      await fetchLocations();
      setLocations(getLocations());
      setNewLocation({ type: 'Area' }); // Clear form
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create location');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete - safe version
  const handleDelete = async (id: string) => {
    if (!canDeleteLocation(id)) {
      setError('Cannot delete location with child locations');
      return;
    }

    setIsUpdating(true);
    try {
      await deleteSafeLocation(id);
      await fetchLocations();
      setLocations(getLocations());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete location');
    } finally {
      setIsUpdating(false);
    }
  };

  // Show loading state only if we have no data at all
  if (locations.length === 0 && isLoading) {
    return <div className="flex justify-center items-center p-4">Loading locations...</div>;
  }

  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback} 
      onReset={() => window.location.reload()}
    >
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Location Management</h3>
              {isOfflineMode() && (
                <div className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                  Offline Mode
                </div>
              )}
            </div>
            
            {error && (
              <div className="mt-2 text-sm text-red-600">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="locationType" className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <select
                    id="locationType"
                    value={newLocation.type}
                    onChange={e => setNewLocation(prev => ({ 
                      ...prev, 
                      type: e.target.value as LocationType,
                      parentId: undefined 
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    aria-label="Location type"
                  >
                    <option value="Area">Area</option>
                    <option value="Rack">Rack</option>
                    <option value="Cabinet">Cabinet</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="locationName" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    id="locationName"
                    value={newLocation.name || ''}
                    onChange={e => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Enter location name"
                    aria-label="Location name"
                  />
                </div>

                {newLocation.type !== 'Area' && (
                  <div className="sm:col-span-2">
                    <label htmlFor="parentLocation" className="block text-sm font-medium text-gray-700">
                      Parent Location
                    </label>
                    <select
                      id="parentLocation"
                      value={newLocation.parentId || ''}
                      onChange={e => setNewLocation(prev => ({ ...prev, parentId: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      aria-label="Parent location"
                    >
                      <option value="">Select parent location</option>
                      {getAvailableParents(newLocation.type).map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.displayName}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  aria-label="Add location"
                >
                  {isUpdating ? 'Adding...' : 'Add Location'}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900">Current Locations</h4>
              
              {Object.entries(locationsByType).map(([type, locs]) => (
                <div key={type} className="mt-4">
                  <h5 className="text-xs font-medium text-gray-500">{type}s</h5>
                  <ul className="mt-2 divide-y divide-gray-200">
                    {locs.length === 0 ? (
                      <li className="py-3 text-sm text-gray-500">No {type.toLowerCase()}s found</li>
                    ) : (
                      locs.map(loc => (
                        <li key={loc.id} className="py-3 flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{loc.name}</p>
                            {loc.parentId && (
                              <p className="text-xs text-gray-500">{getLocationPath(loc)}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDelete(loc.id)}
                            disabled={!canDeleteLocation(loc.id) || isUpdating}
                            className="ml-2 text-sm text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label={`Delete ${loc.name}`}
                          >
                            Delete
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default LocationSettings; 