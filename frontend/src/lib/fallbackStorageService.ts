import { Location, Settings, StorageError } from './types';

const STORAGE_KEY = 'trackIT_offline_settings';
const OFFLINE_FLAG_KEY = 'trackIT_is_offline';

let offlineMode = false;

// Get offline flag
export const isOffline = (): boolean => {
  return offlineMode || localStorage.getItem(OFFLINE_FLAG_KEY) === 'true';
};

// Set offline flag
export const setOfflineMode = (offline: boolean): void => {
  offlineMode = offline;
  localStorage.setItem(OFFLINE_FLAG_KEY, offline.toString());
};

// Get settings from localStorage
export const getOfflineSettings = (): Settings => {
  try {
    const storedSettings = localStorage.getItem(STORAGE_KEY);
    if (!storedSettings) {
      return { locations: [] };
    }

    const settings = JSON.parse(storedSettings);
    if (!settings || !Array.isArray(settings.locations)) {
      throw new StorageError('Invalid offline settings format');
    }

    return settings;
  } catch (error) {
    console.error('Error getting settings from offline store:', error);
    if (error instanceof StorageError) {
      throw error;
    }
    return { locations: [] };
  }
};

// Save settings to localStorage
export const saveOfflineSettings = (settings: Settings): void => {
  try {
    if (!settings || !Array.isArray(settings.locations)) {
      throw new StorageError('Invalid settings format');
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings to offline store:', error);
    throw new StorageError(
      'Failed to save settings to offline store',
      'OFFLINE_STORAGE_ERROR',
      error
    );
  }
};

// Create location in offline storage
export const createOfflineLocation = (location: Omit<Location, 'id'>): Location => {
  try {
    const settings = getOfflineSettings();
    const newLocation: Location = {
      ...location,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    settings.locations.push(newLocation);
    saveOfflineSettings(settings);
    return newLocation;
  } catch (error) {
    throw new StorageError(
      'Failed to create location in offline storage',
      'OFFLINE_CREATE_ERROR',
      error
    );
  }
};

// Delete location from offline storage
export const deleteOfflineLocation = (id: string): Location | null => {
  try {
    const settings = getOfflineSettings();
    const locationIndex = settings.locations.findIndex(loc => loc.id === id);
    
    if (locationIndex === -1) {
      throw new StorageError('Location not found', 'LOCATION_NOT_FOUND');
    }
    
    // Check for child locations
    const hasChildren = settings.locations.some(loc => loc.parentId === id);
    if (hasChildren) {
      throw new StorageError(
        'Cannot delete location with child locations',
        'HAS_CHILDREN'
      );
    }
    
    const deletedLocation = settings.locations[locationIndex];
    settings.locations.splice(locationIndex, 1);
    saveOfflineSettings(settings);
    return deletedLocation;
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }
    throw new StorageError(
      'Failed to delete location from offline storage',
      'OFFLINE_DELETE_ERROR',
      error
    );
  }
}; 