import { 
  getLocations, 
  updateLocations, 
  addLocation, 
  removeLocation,
  getProjects,
  updateProjects,
  addProject,
  removeProject
} from './staticStore';
import { Location, Project, StorageError } from './types';
import { createOfflineLocation, deleteOfflineLocation } from './fallbackStorageService';

// Initialize by loading data from local storage
function initializeFromLocalStorage() {
  try {
    const storedData = localStorage.getItem('trackIT_offline_settings');
    if (storedData) {
      const parsed = JSON.parse(storedData);
      if (parsed && Array.isArray(parsed.locations)) {
        updateLocations(parsed.locations);
      }
    }
    
    const storedProjects = localStorage.getItem('trackIT_offline_projects');
    if (storedProjects) {
      const parsed = JSON.parse(storedProjects);
      if (parsed && Array.isArray(parsed.projects)) {
        updateProjects(parsed.projects);
      }
    }
  } catch (error) {
    console.error('Error loading initial data from localStorage:', error);
  }
}

// Call this on application start
initializeFromLocalStorage();

// Safe locations API (data is stored locally)
export async function fetchLocations(): Promise<Location[]> {
  return getLocations();
}

export async function createSafeLocation(location: Omit<Location, 'id'>): Promise<Location> {
  try {
    const newLocation = createOfflineLocation(location);
    addLocation(newLocation);
    return newLocation;
  } catch (error) {
    throw error instanceof Error ? error : new StorageError(String(error));
  }
}

export async function deleteSafeLocation(id: string): Promise<Location> {
  try {
    const deletedLocation = deleteOfflineLocation(id);
    if (!deletedLocation) {
      throw new StorageError('Location not found');
    }
    removeLocation(id);
    return deletedLocation;
  } catch (error) {
    throw error instanceof Error ? error : new StorageError(String(error));
  }
}

// Safe projects API (data is stored locally)
export async function fetchProjects(): Promise<Project[]> {
  return getProjects();
}

export async function createSafeProject(project: Omit<Project, 'id'>): Promise<Project> {
  try {
    const newProject: Project = {
      ...project,
      id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    };
    const updatedProjects = [...getProjects(), newProject];
    localStorage.setItem('trackIT_offline_projects', JSON.stringify({ projects: updatedProjects }));
    addProject(newProject);
    return newProject;
  } catch (error) {
    throw error instanceof Error ? error : new StorageError(String(error));
  }
}

export async function deleteSafeProject(id: string): Promise<Project> {
  try {
    const existingProjects = getProjects();
    const projectToDelete = existingProjects.find(p => p.id === id);
    if (!projectToDelete) {
      throw new StorageError('Project not found');
    }
    const updatedProjects = existingProjects.filter(p => p.id !== id);
    localStorage.setItem('trackIT_offline_projects', JSON.stringify({ projects: updatedProjects }));
    removeProject(id);
    return projectToDelete;
  } catch (error) {
    throw error instanceof Error ? error : new StorageError(String(error));
  }
}
