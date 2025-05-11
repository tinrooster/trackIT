import { safeInvoke, enqueueOperation } from './operationQueue';
import { 
  getLocations, 
  updateLocations, 
  addLocation, 
  removeLocation,
  getProjects,
  updateProjects,
  addProject,
  removeProject,
  setOffline,
  isOfflineMode
} from './staticStore';
import { Location, Project, StorageError, LocationData, ProjectData } from './types';
import { isOffline as checkOfflineStorage, setOfflineMode as setOfflineStorageMode, 
  createOfflineLocation, deleteOfflineLocation } from './fallbackStorageService';

// Initial loading state
let isLoadingLocations = false;
let isLoadingProjects = false;

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
    
    // Check offline mode
    const isCurrentlyOffline = checkOfflineStorage();
    setOffline(isCurrentlyOffline);
    
  } catch (error) {
    console.error('Error loading initial data from localStorage:', error);
  }
}

// Call this on application start
initializeFromLocalStorage();

// Safe locations API
export async function fetchLocations(): Promise<Location[]> {
  // Return cached data immediately if available
  const cachedLocations = getLocations();
  
  // Don't fetch if already loading or offline
  if (isLoadingLocations || isOfflineMode()) {
    return cachedLocations;
  }
  
  isLoadingLocations = true;
  
  // Queue backend operation
  enqueueOperation(
    () => safeInvoke<Location[]>('get_locations'),
    (locations) => {
      updateLocations(locations);
      isLoadingLocations = false;
    },
    (error) => {
      console.error('Failed to load locations:', error);
      setOffline(true);
      setOfflineStorageMode(true);
      isLoadingLocations = false;
    }
  );
  
  // Return current data immediately
  return cachedLocations;
}

export async function createSafeLocation(location: Omit<Location, 'id'>): Promise<Location> {
  if (isOfflineMode()) {
    try {
      const newLocation = createOfflineLocation(location);
      addLocation(newLocation);
      return newLocation;
    } catch (error) {
      throw error instanceof Error ? error : new StorageError(String(error));
    }
  }
  
  return new Promise<Location>((resolve, reject) => {
    const locationData: LocationData = {
      name: location.name,
      type_: location.type,
      parent_id: location.parentId
    };
    
    enqueueOperation(
      () => safeInvoke<Location>('create_location', { locationData }),
      (newLocation) => {
        // Add to static store
        addLocation(newLocation);
        resolve(newLocation);
      },
      (error) => {
        // Try offline fallback
        try {
          const offlineLocation = createOfflineLocation(location);
          addLocation(offlineLocation);
          setOffline(true);
          setOfflineStorageMode(true);
          resolve(offlineLocation);
        } catch (fallbackError) {
          reject(fallbackError);
        }
      }
    );
  });
}

export async function deleteSafeLocation(id: string): Promise<Location> {
  if (isOfflineMode()) {
    try {
      const deletedLocation = deleteOfflineLocation(id);
      if (deletedLocation) {
        removeLocation(id);
        return deletedLocation;
      }
      throw new StorageError('Location not found');
    } catch (error) {
      throw error instanceof Error ? error : new StorageError(String(error));
    }
  }
  
  return new Promise<Location>((resolve, reject) => {
    enqueueOperation(
      () => safeInvoke<Location>('delete_location', { id }),
      (deletedLocation) => {
        removeLocation(id);
        resolve(deletedLocation);
      },
      (error) => {
        // Try offline fallback
        try {
          const deletedLocation = deleteOfflineLocation(id);
          if (deletedLocation) {
            removeLocation(id);
            setOffline(true);
            setOfflineStorageMode(true);
            resolve(deletedLocation);
          } else {
            reject(new StorageError('Failed to delete location in offline mode'));
          }
        } catch (fallbackError) {
          reject(fallbackError);
        }
      }
    );
  });
}

// Safe projects API
export async function fetchProjects(): Promise<Project[]> {
  // Return cached data immediately if available
  const cachedProjects = getProjects();
  
  // Don't fetch if already loading or offline
  if (isLoadingProjects || isOfflineMode()) {
    return cachedProjects;
  }
  
  isLoadingProjects = true;
  
  // Queue backend operation
  enqueueOperation(
    () => safeInvoke<Project[]>('get_projects'),
    (projects) => {
      updateProjects(projects);
      isLoadingProjects = false;
    },
    (error) => {
      console.error('Failed to load projects:', error);
      setOffline(true);
      setOfflineStorageMode(true);
      isLoadingProjects = false;
    }
  );
  
  // Return current data immediately
  return cachedProjects;
}

export async function createSafeProject(project: Omit<Project, 'id'>): Promise<Project> {
  if (isOfflineMode()) {
    try {
      // Create offline project
      const newProject: Project = {
        ...project,
        id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      };
      
      // Save to localStorage
      const existingProjects = getProjects();
      const updatedProjects = [...existingProjects, newProject];
      localStorage.setItem('trackIT_offline_projects', JSON.stringify({ projects: updatedProjects }));
      
      // Update static store
      addProject(newProject);
      return newProject;
    } catch (error) {
      throw error instanceof Error ? error : new StorageError(String(error));
    }
  }
  
  return new Promise<Project>((resolve, reject) => {
    const projectData: ProjectData = {
      name: project.name,
      description: project.description,
      status: project.status,
      start_date: project.startDate,
      end_date: project.endDate
    };
    
    enqueueOperation(
      () => safeInvoke<Project>('create_project', { projectData }),
      (newProject) => {
        // Add to static store
        addProject(newProject);
        resolve(newProject);
      },
      (error) => {
        // Try offline fallback
        try {
          const offlineProject: Project = {
            ...project,
            id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
          };
          
          // Save to localStorage
          const existingProjects = getProjects();
          const updatedProjects = [...existingProjects, offlineProject];
          localStorage.setItem('trackIT_offline_projects', JSON.stringify({ projects: updatedProjects }));
          
          // Update static store
          addProject(offlineProject);
          setOffline(true);
          setOfflineStorageMode(true);
          resolve(offlineProject);
        } catch (fallbackError) {
          reject(fallbackError);
        }
      }
    );
  });
}

export async function deleteSafeProject(id: string): Promise<Project> {
  if (isOfflineMode()) {
    try {
      const existingProjects = getProjects();
      const projectToDelete = existingProjects.find(p => p.id === id);
      
      if (!projectToDelete) {
        throw new StorageError('Project not found');
      }
      
      // Update localStorage
      const updatedProjects = existingProjects.filter(p => p.id !== id);
      localStorage.setItem('trackIT_offline_projects', JSON.stringify({ projects: updatedProjects }));
      
      // Update static store
      removeProject(id);
      return projectToDelete;
    } catch (error) {
      throw error instanceof Error ? error : new StorageError(String(error));
    }
  }
  
  return new Promise<Project>((resolve, reject) => {
    enqueueOperation(
      () => safeInvoke<Project>('delete_project', { id }),
      (deletedProject) => {
        removeProject(id);
        resolve(deletedProject);
      },
      (error) => {
        // Try offline fallback
        try {
          const existingProjects = getProjects();
          const projectToDelete = existingProjects.find(p => p.id === id);
          
          if (!projectToDelete) {
            reject(new StorageError('Project not found'));
            return;
          }
          
          // Update localStorage
          const updatedProjects = existingProjects.filter(p => p.id !== id);
          localStorage.setItem('trackIT_offline_projects', JSON.stringify({ projects: updatedProjects }));
          
          // Update static store
          removeProject(id);
          setOffline(true);
          setOfflineStorageMode(true);
          resolve(projectToDelete);
        } catch (fallbackError) {
          reject(fallbackError);
        }
      }
    );
  });
} 