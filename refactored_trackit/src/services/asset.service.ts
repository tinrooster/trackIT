import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/tauri'

// Debug logging helper
const debug = {
  log: (...args: any[]) => {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] [ASSET_SERVICE]`, ...args)
  },
  error: (...args: any[]) => {
    const timestamp = new Date().toISOString()
    console.error(`[${timestamp}] [ASSET_SERVICE]`, ...args)
  }
}

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

function isTauriApp() {
  return Boolean(window.__TAURI_IPC__) && window.location.protocol === 'tauri:'
}

// Development mock data
const mockAssets = [
  {
    id: '1',
    name: 'Test Asset 1',
    type: 'Hardware',
    status: 'Available',
    location: {
      id: '1',
      name: 'Main Office'
    },
    assignedTo: null
  },
  {
    id: '2',
    name: 'Test Asset 2',
    type: 'Software',
    status: 'In Use',
    location: {
      id: '1',
      name: 'Main Office'
    },
    assignedTo: {
      id: '1',
      name: 'John Doe'
    }
  }
]

// Helper function to safely invoke Tauri commands or fallback to API
async function invokeCommand<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  debug.log(`Invoking command: ${command}`, args)
  
  if (!isTauriApp()) {
    debug.log('Not running in Tauri environment, using development data')
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Return mock data based on command
    switch (command) {
      case 'get_assets':
        return { assets: mockAssets } as T
      case 'get_asset':
        const asset = mockAssets.find(a => a.id === (args?.id as string))
        if (!asset) throw new Error('Asset not found')
        return { asset } as T
      case 'create_asset':
        const newAsset = {
          id: String(mockAssets.length + 1),
          ...(args?.data as object),
          location: {
            id: '1',
            name: 'Main Office'
          }
        }
        mockAssets.push(newAsset)
        return { asset: newAsset } as T
      case 'update_asset':
        const idx = mockAssets.findIndex(a => a.id === (args?.id as string))
        if (idx === -1) throw new Error('Asset not found')
        mockAssets[idx] = { ...mockAssets[idx], ...(args?.data as object) }
        return { asset: mockAssets[idx] } as T
      case 'delete_asset':
        const deleteIdx = mockAssets.findIndex(a => a.id === (args?.id as string))
        if (deleteIdx === -1) throw new Error('Asset not found')
        mockAssets.splice(deleteIdx, 1)
        return undefined as T
      default:
        throw new Error(`Unknown command: ${command}`)
    }
  }

  try {
    debug.log(`Executing Tauri command ${command}...`)
    const result = await invoke<T>(command, args)
    debug.log(`Command ${command} completed successfully:`, result)
    return result
  } catch (error) {
    debug.error(`Failed to invoke Tauri command ${command}:`, error)
    debug.error('Command details:', { command, args })
    throw error
  }
}

export const assetService = {
  // Get all assets with optional filtering
  useAssets() {
    debug.log('Initializing useAssets hook')
    return useQuery<{ assets: any[] }, Error>({
      queryKey: ['assets'],
      queryFn: async () => {
        debug.log('Fetching all assets')
        const result = await invokeCommand<{ assets: any[] }>('get_assets')
        debug.log('Assets fetched:', result)
        return result
      },
      retry: 3,
      retryDelay: 1000,
      staleTime: 30000, // Consider data fresh for 30 seconds
    })
  },
  
  // Get a single asset by ID
  useAsset(id: string) {
    debug.log('Initializing useAsset hook for id:', id)
    return useQuery<{ asset: any }, Error>({
      queryKey: ['assets', id],
      queryFn: async () => {
        debug.log('Fetching asset:', id)
        const result = await invokeCommand<{ asset: any }>('get_asset', { id })
        debug.log('Asset fetched:', result)
        return result
      },
      retry: 3,
      retryDelay: 1000,
      staleTime: 30000, // Consider data fresh for 30 seconds
    })
  },

  // Create a new asset
  useCreateAsset() {
    debug.log('Initializing useCreateAsset hook')
    const queryClient = useQueryClient()
    return useMutation<{ asset: any }, Error, AssetCreateInput>({
      mutationFn: async (data) => {
        debug.log('Creating asset:', data)
        const result = await invokeCommand<{ asset: any }>('create_asset', { data })
        debug.log('Asset created:', result)
        return result
      },
      onSuccess: () => {
        debug.log('Asset created successfully, invalidating queries')
        queryClient.invalidateQueries({ queryKey: ['assets'] })
      },
      onError: (error) => {
        debug.error('Error in useCreateAsset:', error)
      },
      retry: 2,
    })
  },

  // Update an asset
  useUpdateAsset() {
    debug.log('Initializing useUpdateAsset hook')
    const queryClient = useQueryClient()
    return useMutation<
      { asset: any },
      Error,
      { id: string; data: AssetUpdateInput }
    >({
      mutationFn: async ({ id, data }) => {
        debug.log('Updating asset:', { id, data })
        const result = await invokeCommand<{ asset: any }>('update_asset', { id, data })
        debug.log('Asset updated:', result)
        return result
      },
      onSuccess: (_, { id }) => {
        debug.log('Asset updated successfully, invalidating queries')
        queryClient.invalidateQueries({ queryKey: ['assets'] })
        queryClient.invalidateQueries({ queryKey: ['assets', id] })
      },
      onError: (error, variables) => {
        debug.error(`Error in useUpdateAsset for id ${variables.id}:`, error)
      },
      retry: 2,
    })
  },

  // Delete an asset
  useDeleteAsset() {
    debug.log('Initializing useDeleteAsset hook')
    const queryClient = useQueryClient()
    return useMutation<void, Error, string>({
      mutationFn: async (id) => {
        debug.log('Deleting asset:', id)
        const result = await invokeCommand<void>('delete_asset', { id })
        debug.log('Asset deleted:', id)
        return result
      },
      onSuccess: () => {
        debug.log('Asset deleted successfully, invalidating queries')
        queryClient.invalidateQueries({ queryKey: ['assets'] })
      },
      onError: (error, id) => {
        debug.error(`Error in useDeleteAsset for id ${id}:`, error)
      },
      retry: 2,
    })
  },
} 