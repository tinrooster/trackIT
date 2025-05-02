import { invoke } from '@tauri-apps/api/tauri';
import { isOffline } from './fallbackStorageService';
import { Project } from './types';

const OFFLINE_STORAGE_KEY = 'trackIT_offline_projects';

// Get projects from localStorage
const getOfflineProjects = (): Project[] => {
  try {
    const storedProjects = localStorage.getItem(OFFLINE_STORAGE_KEY);
    if (storedProjects) {
      return JSON.parse(storedProjects);
    }
    return [];
  } catch (error) {
    console.error('Error getting projects from offline store:', error);
    return [];
  }
};

// Save projects to localStorage
const saveOfflineProjects = (projects: Project[]): void => {
  try {
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('Error saving projects to offline store:', error);
  }
};

// Get all projects
export const getProjects = async (): Promise<Project[]> => {
  try {
    if (isOffline()) {
      return getOfflineProjects();
    }

    return await invoke<Project[]>('get_projects');
  } catch (error) {
    console.error('Error getting projects:', error);
    return getOfflineProjects();
  }
};

// Create a new project
export const createProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> => {
  try {
    if (isOffline()) {
      const projects = getOfflineProjects();
      const newProject: Project = {
        ...project,
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      projects.push(newProject);
      saveOfflineProjects(projects);
      return newProject;
    }

    return await invoke<Project>('create_project', {
      projectData: {
        name: project.name,
        description: project.description,
        status: project.status,
        start_date: project.startDate?.toISOString(),
        end_date: project.endDate?.toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

// Delete a project
export const deleteProject = async (id: string): Promise<Project> => {
  try {
    if (isOffline()) {
      const projects = getOfflineProjects();
      const projectIndex = projects.findIndex(p => p.id === id);
      if (projectIndex === -1) {
        throw new Error('Project not found');
      }
      const deletedProject = projects[projectIndex];
      projects.splice(projectIndex, 1);
      saveOfflineProjects(projects);
      return deletedProject;
    }

    return await invoke<Project>('delete_project', { id });
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}; 