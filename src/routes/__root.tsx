import * as React from 'react'
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { NotFound } from '../components/NotFound'

export interface RouterContext {
  queryClient: QueryClient
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      gcTime: 1000 * 60 * 60,
      retry: 0,
    },
  },
})

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <div>
        <header className="bg-white shadow">
          <nav className="container mx-auto px-4 py-3">
            <Link to="/" className="text-lg font-semibold">
              TrackIT
            </Link>
            <div className="ml-4 space-x-4">
              <Link to="/inventory" className="text-gray-600 hover:text-gray-900">
                Inventory
              </Link>
              <Link to="/assets" className="text-gray-600 hover:text-gray-900">
                Assets
              </Link>
            </div>
          </nav>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Outlet />
        </main>
      </div>
      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: () => <NotFound />,
  context: {
    queryClient,
  },
}) 