import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetService } from '@/services/asset.service';
import type { AssetCreateInput, AssetUpdateInput } from '@/services/asset.service';
import type { Asset } from '@/types';

// Query keys
export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (filters: Record<string, string>) => [...assetKeys.lists(), { filters }] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
};

// Re-export the hooks from the service
export const {
  useAssets,
  useAsset,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
} = assetService;

export function useAssets() {
  return useQuery<Asset[], Error>({
    queryKey: ['assets'],
    queryFn: () => assetService.getAssets(),
  });
} 