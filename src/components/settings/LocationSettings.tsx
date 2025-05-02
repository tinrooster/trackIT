import * as React from 'react';
import { getSettings, createLocation, deleteLocation, Location, checkDatabaseConnection } from '../../lib/storageService';
import { isOffline } from '../../lib/fallbackStorageService';
import { ErrorBoundary } from 'react-error-boundary';

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
  const [locations, setLocations] = React.useState<Location[]>([]);
  const [newLocation, setNewLocation] = React.useState<{
    type: LocationType;
    name?: string;
    parentId?: string;
  }>({
    type: 'Area'
  });
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [connectionStatus, setConnectionStatus] = React.useState<'online' | 'offline'>('online');
  const mountedRef = React.useRef(true);

  // Load locations on mount and periodically check connection
  React.useEffect(() => {
    const loadLocations = async () => {
      if (!mountedRef.current) return;
      setIsLoading(true);
      try {
        const isCurrentlyOffline = isOffline();
        setConnectionStatus(isCurrentlyOffline ? 'offline' : 'online');
        const settings = await getSettings();
        if (mountedRef.current) {
          setLocations(settings.locations);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to load locations');
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    // Initial load
    loadLocations();

    // Set up periodic connection check
    const connectionCheckInterval = setInterval(async () => {
      if (!mountedRef.current) return;
      try {
        const isCurrentlyOffline = isOffline();
        if (isCurrentlyOffline !== (connectionStatus === 'offline')) {
          setConnectionStatus(isCurrentlyOffline ? 'offline' : 'online');
          // Reload locations when coming back online
          if (!isCurrentlyOffline) {
            await loadLocations();
          }
        }
      } catch (err) {
        console.error('Connection check failed:', err);
      }
    }, 30000);

    return () => {
      mountedRef.current = false;
      clearInterval(connectionCheckInterval);
    };
  }, []); // Only run on mount

  // Memoize location processing functions
  const locationsByType = React.useMemo(() => {
    const grouped = {
      Area: locations.filter(l => l.type === 'Area'),
      Rack: locations.filter(l => l.type === 'Rack'),
      Cabinet: locations.filter(l => l.type === 'Cabinet')
    };
    return grouped;
  }, [locations]);

  const getLocationById = React.useCallback((id: string): Location | undefined => {
    return locations.find(l => l.id === id);
  }, [locations]);

  const getLocationPath = React.useCallback((location: Location): string => {
    const path: string[] = [location.name];
    let currentLoc = location;
    
    while (currentLoc.parentId) {
      const parent = getLocationById(currentLoc.parentId);
      if (!parent) break;
      path.unshift(parent.name);
      currentLoc = parent;
    }
    
    return path.join(' > ');
  }, [getLocationById]);

  const getAvailableParents = React.useCallback((type: LocationType): { id: string; displayName: string; }[] => {
    const validParentTypes: Record<LocationType, LocationType[]> = {
      Area: [],
      Rack: ['Area'],
      Cabinet: ['Area', 'Rack']
    };

    const validParents = locations.filter(loc => {
      return validParentTypes[type].includes(loc.type);
    });

    return validParents.map(loc => ({
      id: loc.id,
      displayName: `${loc.name} (${loc.type})`
    }));
  }, [locations]);

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

    setIsLoading(true);
    try {
      const location = await createLocation({
        name: newLocation.name.trim(),
        type: newLocation.type,
        parentId: newLocation.parentId
      });
      
      setLocations(prev => [...prev, location]);
      setNewLocation({ type: 'Area' }); // Clear form
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create location');
    } finally {
      setIsLoading(false);
    }
  };

  const canDeleteLocation = React.useCallback((locationId: string): boolean => {
    return !locations.some(loc => loc.parentId === locationId);
  }, [locations]);

  const handleDelete = async (locationId: string) => {
    if (!canDeleteLocation(locationId)) {
      setError('Cannot delete location with child locations');
      return;
    }

    setIsLoading(true);
    try {
      await deleteLocation(locationId);
      setLocations(prev => prev.filter(l => l.id !== locationId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete location');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && locations.length === 0) {
    return <div className="flex justify-center items-center p-4">Loading...</div>;
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => setError(null)}>
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Location Management</h3>
              <div className={`px-3 py-1 rounded-full text-sm ${
                connectionStatus === 'online' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {connectionStatus === 'online' ? 'Online' : 'Offline Mode'}
              </div>
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
                  disabled={isLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  aria-label="Add location"
                >
                  {isLoading ? 'Adding...' : 'Add Location'}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900">Current Locations</h4>
              <div className="mt-2 space-y-4">
                {Object.entries(locationsByType).map(([type, locs]) => (
                  <div key={type} className="border rounded-md p-4">
                    <h5 className="font-medium">{type}s</h5>
                    {locs.length === 0 ? (
                      <p className="mt-2 text-sm text-gray-500">No {type.toLowerCase()}s added yet</p>
                    ) : (
                      <ul className="mt-2 space-y-2" role="list">
                        {locs.map(loc => (
                          <li key={loc.id} className="flex justify-between items-center">
                            <div>
                              <span className="text-gray-900">{loc.name}</span>
                              {loc.parentId && (
                                <span className="ml-2 text-sm text-gray-500">
                                  in {getLocationPath(getLocationById(loc.parentId)!)}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleDelete(loc.id)}
                              className={`text-red-600 hover:text-red-800 ${!canDeleteLocation(loc.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                              disabled={!canDeleteLocation(loc.id) || isLoading}
                              title={!canDeleteLocation(loc.id) ? 'Cannot delete location with child locations' : 'Delete location'}
                              aria-label={`Delete ${loc.name}`}
                            >
                              Delete
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
} 