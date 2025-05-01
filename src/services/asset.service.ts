import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Asset types and service definitions
export type AssetCreateInput = {
  name: string
  type: string
  serialNumber: string
  barcode: string
  status?: string
  locationId: string
  assignedToId?: string | null
  purchaseDate: Date
  warrantyExpiration?: Date | null
  lastMaintenance?: Date | null
  nextMaintenance?: Date | null
  notes?: string | null
}

export type AssetUpdateInput = Partial<AssetCreateInput>

export const assetService = {
  // Get all assets with optional filtering
  useAssets() {
    return useQuery({
      queryKey: ['assets'],
      queryFn: async () => {
        const response = await fetch('/api/assets')
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Failed to fetch assets')
        }
        return response.json()
      },
    })
  },
  
  // Get a single asset by ID
  useAsset(id: string) {
    return useQuery({
      queryKey: ['assets', id],
      queryFn: async () => {
        const response = await fetch(`/api/assets/${id}`)
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Failed to fetch asset')
        }
        return response.json()
      },
    })
  },

  // Create a new asset
  useCreateAsset() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: async (data: AssetCreateInput) => {
        const response = await fetch('/api/assets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Failed to create asset')
        }
        return response.json()
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['assets'] })
      },
    })
  },

  // Update an asset
  useUpdateAsset() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: async ({ id, data }: { id: string; data: AssetUpdateInput }) => {
        const response = await fetch(`/api/assets/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Failed to update asset')
        }
        return response.json()
      },
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries({ queryKey: ['assets'] })
        queryClient.invalidateQueries({ queryKey: ['assets', id] })
      },
    })
  },

  // Delete an asset
  useDeleteAsset() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: async (id: string) => {
        const response = await fetch(`/api/assets/${id}`, {
          method: 'DELETE',
        })
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Failed to delete asset')
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['assets'] })
      },
    })
  },
} 