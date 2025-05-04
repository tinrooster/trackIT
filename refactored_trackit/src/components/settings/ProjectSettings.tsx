import * as React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Project } from '../../lib/types';
import { 
  fetchProjects, 
  createSafeProject, 
  deleteSafeProject 
} from '../../lib/safeStorageService';
import { 
  getProjects, 
  isOfflineMode 
} from '../../lib/staticStore';

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
  // Use the static store data directly
  const [projects, setProjects] = React.useState<Project[]>(getProjects());
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
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Just fetch once on mount, with no delay in rendering existing data
  React.useEffect(() => {
    // Function to refresh the projects from the static store
    const refreshFromStore = () => {
      setProjects(getProjects());
    };

    // Immediately set from static store
    refreshFromStore();

    // Start background fetch from backend
    const fetchData = async () => {
      try {
        await fetchProjects();
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

  // Handle form submission - safe version
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!newProject.name.trim()) {
      setError('Name is required');
      return;
    }

    setIsUpdating(true);
    try {
      await createSafeProject({
        name: newProject.name.trim(),
        description: newProject.description?.trim(),
        status: newProject.status,
        startDate: newProject.startDate,
        endDate: newProject.endDate
      });
      
      // Static store is already updated, just refresh our local state
      setProjects(getProjects());
      setNewProject({ name: '', status: 'PLANNED' }); // Clear form
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete - safe version
  const handleDelete = async (id: string) => {
    setIsUpdating(true);
    try {
      await deleteSafeProject(id);
      // Static store is already updated, just refresh our local state
      setProjects(getProjects());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    } finally {
      setIsUpdating(false);
    }
  };

  // Get status badge color
  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Show loading state only if we have no data at all
  if (projects.length === 0 && isLoading) {
    return <div className="flex justify-center items-center p-4">Loading projects...</div>;
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
              <h3 className="text-lg font-medium leading-6 text-gray-900">Project Management</h3>
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
                  disabled={isUpdating}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  aria-label="Add project"
                >
                  {isUpdating ? 'Adding...' : 'Add Project'}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900">Current Projects</h4>
              <div className="mt-2 divide-y divide-gray-200">
                {projects.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4">No projects found</p>
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
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                              {project.status.replace('_', ' ')}
                            </span>
                            {project.startDate && (
                              <span className="ml-2">
                                From: {new Date(project.startDate).toLocaleDateString()}
                              </span>
                            )}
                            {project.endDate && (
                              <span className="ml-2">
                                To: {new Date(project.endDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(project.id)}
                          disabled={isUpdating}
                          className="ml-2 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
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

export default ProjectSettings; 