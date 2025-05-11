import * as React from 'react';
import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: 'reports',
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
          <p className="mt-2 text-sm text-gray-700">
            Generate and view reports for inventory metrics and asset usage.
          </p>
        </div>
      </div>
      
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900">Asset Usage</h2>
          <p className="mt-2 text-sm text-gray-500">Track asset utilization and check-out history</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900">Inventory Status</h2>
          <p className="mt-2 text-sm text-gray-500">Overview of current inventory levels and status</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900">Maintenance Log</h2>
          <p className="mt-2 text-sm text-gray-500">View maintenance history and upcoming schedules</p>
        </div>
      </div>
    </div>
  );
} 