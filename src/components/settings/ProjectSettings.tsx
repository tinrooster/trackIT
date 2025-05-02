import * as React from 'react';
import { Project, getProjects, createProject, deleteProject } from '../../lib/projectService';
import { isOffline } from '../../lib/fallbackStorageService';
import { ErrorBoundary } from 'react-error-boundary';

type ProjectStatus = Project['status'];

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

export function ProjectSettings() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [newProject, setNewProject] = React.useState<{
    name: string;
    description?: string;
    status: ProjectStatus;
    startDate?: string;
    endDate?: string;
  }>({
    name: '',
    status: 'PLANNED'
  });
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [connectionStatus, setConnectionStatus] = React.useState<'online' | 'offline'>('online');
  const mountedRef = React.useRef(true);

  // Load projects on mount and handle connection status
  React.useEffect(() => {
    const loadProjects = async () => {
      if (!mountedRef.current) return;
      setIsLoading(true);
      try {
        const isCurrentlyOffline = isOffline();
        setConnectionStatus(isCurrentlyOffline ? 'offline' : 'online');
        const loadedProjects = await getProjects();
        if (mountedRef.current) {
          setProjects(loadedProjects);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to load projects');
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    // Initial load
    loadProjects();

    // Set up periodic connection check
    const connectionCheckInterval = setInterval(async () => {
      if (!mountedRef.current) return;
      try {
        const isCurrentlyOffline = isOffline();
        if (isCurrentlyOffline !== (connectionStatus === 'offline')) {
          setConnectionStatus(isCurrentlyOffline ? 'offline' : 'online');
          // Reload projects when coming back online
          if (!isCurrentlyOffline) {
            await loadProjects();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!newProject.name.trim()) {
      setError('Name is required');
      return;
    }

    setIsLoading(true);
    try {
      const project = await createProject({
        name: newProject.name.trim(),
        description: newProject.description?.trim(),
        status: newProject.status,
        startDate: newProject.startDate ? new Date(newProject.startDate) : undefined,
        endDate: newProject.endDate ? new Date(newProject.endDate) : undefined
      });
      
      setProjects(prev => [...prev, project]);
      setNewProject({ name: '', status: 'PLANNED' }); // Clear form
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    setIsLoading(true);
    try {
      await deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && projects.length === 0) {
    return <div className="flex justify-center items-center p-4">Loading...</div>;
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => setError(null)}>
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Project Management</h3>
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
                  <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    id="projectName"
                    value={newProject.name}
                    onChange={e => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Enter project name"
                    aria-label="Project name"
                  />
                </div>

                <div>
                  <label htmlFor="projectStatus" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="projectStatus"
                    value={newProject.status}
                    onChange={e => setNewProject(prev => ({ ...prev, status: e.target.value as ProjectStatus }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    aria-label="Project status"
                  >
                    <option value="PLANNED">Planned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="projectDescription"
                    value={newProject.description || ''}
                    onChange={e => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Enter project description"
                    aria-label="Project description"
                  />
                </div>

                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={newProject.startDate || ''}
                    onChange={e => setNewProject(prev => ({ ...prev, startDate: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    aria-label="Project start date"
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={newProject.endDate || ''}
                    onChange={e => setNewProject(prev => ({ ...prev, endDate: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    aria-label="Project end date"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  aria-label="Add project"
                >
                  {isLoading ? 'Adding...' : 'Add Project'}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900">Current Projects</h4>
              <div className="mt-2 divide-y divide-gray-200">
                {projects.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4">No projects added yet</p>
                ) : (
                  projects.map(project => (
                    <div key={project.id} className="py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="text-base font-medium text-gray-900">{project.name}</h5>
                          {project.description && (
                            <p className="mt-1 text-sm text-gray-500">{project.description}</p>
                          )}
                          <div className="mt-1 text-sm text-gray-500">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              project.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                              project.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              project.status === 'ON_HOLD' ? 'bg-yellow-100 text-yellow-800' :
                              project.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {project.status.replace('_', ' ')}
                            </span>
                            {project.startDate && (
                              <span className="ml-2">
                                Start: {new Date(project.startDate).toLocaleDateString()}
                              </span>
                            )}
                            {project.endDate && (
                              <span className="ml-2">
                                End: {new Date(project.endDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="ml-4 text-red-600 hover:text-red-800"
                          disabled={isLoading}
                          aria-label={`Delete ${project.name}`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
} 