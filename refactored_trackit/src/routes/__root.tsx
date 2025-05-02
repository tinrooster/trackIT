import * as React from 'react';
import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { NotFound } from '../components/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      gcTime: 1000 * 60 * 60,
      retry: 0,
    },
  },
});

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <nav className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <Link
                  to="/"
                  className="text-xl font-bold text-gray-900 hover:text-gray-700"
                >
                  TrackIT
                </Link>
                <div className="hidden md:flex space-x-4">
                  <Link
                    to="/inventory"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    activeProps={{
                      className: 'text-blue-600 hover:text-blue-700',
                    }}
                  >
                    Inventory
                  </Link>
                  <Link
                    to="/reports"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    activeProps={{
                      className: 'text-blue-600 hover:text-blue-700',
                    }}
                  >
                    Reports
                  </Link>
                  <Link
                    to="/settings"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    activeProps={{
                      className: 'text-blue-600 hover:text-blue-700',
                    }}
                  >
                    Settings
                  </Link>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  to="/inventory/add"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Asset
                </Link>
              </div>
            </div>
          </nav>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Outlet />
        </main>
      </div>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => <NotFound />,
}); 