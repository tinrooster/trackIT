import { invoke } from '@tauri-apps/api/tauri';
import {
  getOfflineSettings,
  createOfflineLocation,
  deleteOfflineLocation,
  isOffline,
  setOfflineMode
} from './fallbackStorageService';
import { Location, Settings, StorageError, LocationData } from './types';

let isCheckingConnection = false;

// Check database connection
export const checkDatabaseConnection = async (): Promise<boolean> => {
  if (isCheckingConnection) {
    return !isOffline();
  }

  try {
    isCheckingConnection = true;
    await invoke('get_locations');
    setOfflineMode(false);
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    setOfflineMode(true);
    return false;
  } finally {
    isCheckingConnection = false;
  }
};

// Get settings from database or fallback to localStorage
export const getSettings = async (): Promise<Settings> => {
  try {
    // Check connection status without recursion
    if (isOffline() && !isCheckingConnection) {
      return getOfflineSettings();
    }

    const locations = await invoke<Location[]>('get_locations');
    if (!Array.isArray(locations)) {
      throw new StorageError('Invalid response from server');
    }
    return { locations };
  } catch (error) {
    console.error('Error getting settings from database:', error);
    if (!isCheckingConnection) {
      setOfflineMode(true);
      return getOfflineSettings();
    }
    throw error;
  }
};

// Save location to database or fallback to localStorage
export const createLocation = async (location: Omit<Location, 'id'>): Promise<Location> => {
  try {
    if (isOffline() && !isCheckingConnection) {
      return createOfflineLocation(location);
    }

    const locationData: LocationData = {
      name: location.name,
      type_: location.type,
      parent_id: location.parentId
    };

    const result = await invoke<Location>('create_location', { locationData });
    if (!result || typeof result.id !== 'string') {
      throw new StorageError('Invalid response from server');
    }

    return {
      id: result.id,
      name: result.name,
      type: result.type as Location['type'],
      parentId: result.parentId
    };
  } catch (error) {
    console.error('Error creating location:', error);
    if (error instanceof StorageError) {
      throw error;
    }
    if (!isCheckingConnection) {
      setOfflineMode(true);
      return createOfflineLocation(location);
    }
    throw error;
  }
};

// Delete location from database or fallback to localStorage
export const deleteLocation = async (id: string): Promise<Location> => {
  try {
    if (isOffline() && !isCheckingConnection) {
      const deletedLocation = deleteOfflineLocation(id);
      if (!deletedLocation) {
        throw new StorageError('Failed to delete location');
      }
      return deletedLocation;
    }

    const result = await invoke<Location>('delete_location', { id });
    if (!result || typeof result.id !== 'string') {
      throw new StorageError('Invalid response from server');
    }

    return {
      id: result.id,
      name: result.name,
      type: result.type as Location['type'],
      parentId: result.parentId
    };
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }
    if (isOffline() && !isCheckingConnection) {
      throw error; // Re-throw offline storage errors
    }
    console.error('Error deleting location:', error);
    if (!isCheckingConnection) {
      setOfflineMode(true);
      const deletedLocation = deleteOfflineLocation(id);
      if (!deletedLocation) {
        throw new StorageError('Failed to delete location');
      }
      return deletedLocation;
    }
    throw error;
  }
}; 