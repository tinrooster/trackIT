import * as React from 'react';
import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { LocationSettings } from '../components/settings/LocationSettings';
import { ProjectSettings } from '../components/settings/ProjectSettings';
import { ErrorBoundary } from 'react-error-boundary';

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

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: 'settings',
  component: SettingsPage,
});

// Memoized tab components to prevent unnecessary re-renders
const LocationTab = React.memo(() => (
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <LocationSettings />
  </ErrorBoundary>
));

const ProjectTab = React.memo(() => (
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <ProjectSettings />
  </ErrorBoundary>
));

const GeneralTab = React.memo(() => (
  <div className="space-y-6">
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">General Settings</h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>Basic application configuration and preferences.</p>
        </div>
      </div>
    </div>
  </div>
));

const UsersTab = React.memo(() => (
  <div className="space-y-6">
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">User Management</h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>Manage user accounts and permissions.</p>
        </div>
      </div>
    </div>
  </div>
));

function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState<'locations' | 'projects' | 'general' | 'users'>('general');

  // Memoize tab content to prevent unnecessary re-renders
  const tabContent = React.useMemo(() => ({
    general: <GeneralTab />,
    locations: <LocationTab />,
    projects: <ProjectTab />,
    users: <UsersTab />
  }), []);

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="mt-2 text-sm text-gray-700">
            Configure application settings and manage system preferences.
          </p>
        </div>
      </div>
      
      <div className="mt-8 max-w-6xl">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('general')}
              className={`
                border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'general' ? 'border-blue-500 text-blue-600' : ''}
              `}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('locations')}
              className={`
                border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'locations' ? 'border-blue-500 text-blue-600' : ''}
              `}
            >
              Locations
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`
                border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'projects' ? 'border-blue-500 text-blue-600' : ''}
              `}
            >
              Projects
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`
                border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'users' ? 'border-blue-500 text-blue-600' : ''}
              `}
            >
              Users
            </button>
          </nav>
        </div>

        <div className="mt-8">
          <React.Suspense fallback={<div className="flex justify-center items-center p-4">Loading...</div>}>
            {tabContent[activeTab]}
          </React.Suspense>
        </div>
      </div>
    </div>
  );
} 