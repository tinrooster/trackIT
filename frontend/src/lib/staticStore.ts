import { Location, Project } from './types';

// Static data store for application state
export interface StaticStore {
  locations: Location[];
  projects: Project[];
  isOffline: boolean;
  initialized: {
    locations: boolean;
    projects: boolean;
  };
}

// Initialize with empty data
export const staticStore: StaticStore = {
  locations: [],
  projects: [],
  isOffline: false,
  initialized: {
    locations: false,
    projects: false
  }
};

// Get store data
export function getLocations(): Location[] {
  return [...staticStore.locations];
}

export function getProjects(): Project[] {
  return [...staticStore.projects];
}

export function isInitialized(store: keyof StaticStore["initialized"]): boolean {
  return staticStore.initialized[store];
}

// Update store data
export function updateLocations(locations: Location[]): void {
  staticStore.locations = [...locations];
  staticStore.initialized.locations = true;
}

export function updateProjects(projects: Project[]): void {
  staticStore.projects = [...projects];
  staticStore.initialized.projects = true;
}

export function addLocation(location: Location): void {
  staticStore.locations = [...staticStore.locations, location];
}

export function removeLocation(id: string): void {
  staticStore.locations = staticStore.locations.filter(loc => loc.id !== id);
}

export function addProject(project: Project): void {
  staticStore.projects = [...staticStore.projects, project];
}

export function removeProject(id: string): void {
  staticStore.projects = staticStore.projects.filter(p => p.id !== id);
}

export function setOffline(isOffline: boolean): void {
  staticStore.isOffline = isOffline;
}

export function isOfflineMode(): boolean {
  return staticStore.isOffline;
} 