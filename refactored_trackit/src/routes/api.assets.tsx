import * as React from 'react';
import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { assetService } from '../services/asset.service';
import type { Asset } from '../types';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/api/assets',
  loader: async () => {
    const result = await assetService.useAssets();
    return { assets: (result?.data ?? []) as Asset[] };
  },
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-4 bg-red-50 text-red-700 rounded-md">
      <h3 className="text-lg font-semibold">Error Loading Assets</h3>
      <p>{error.message}</p>
    </div>
  )
}); 