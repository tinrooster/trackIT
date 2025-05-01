import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/tauri'
import type { Asset } from '../types'

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
export type AssetCreateInput = Omit<Asset, 'id'>
export type AssetUpdateInput = Partial<Asset>

const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (filters: Record<string, string>) => [...assetKeys.lists(), { filters }] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
}

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
  // API calls
  async getAssets(): Promise<Asset[]> {
    try {
      const assets = await invoke<Asset[]>('get_assets')
      return assets
    } catch (error) {
      console.error('Failed to fetch assets:', error)
      throw error
    }
  },

  async getAsset(id: string): Promise<Asset> {
    try {
      const asset = await invoke<Asset>('get_asset', { id })
      return asset
    } catch (error) {
      console.error(`Failed to fetch asset ${id}:`, error)
      throw error
    }
  },

  async createAsset(asset: AssetCreateInput): Promise<Asset> {
    try {
      const newAsset = await invoke<Asset>('create_asset', { asset })
      return newAsset
    } catch (error) {
      console.error('Failed to create asset:', error)
      throw error
    }
  },

  async updateAsset(id: string, asset: AssetUpdateInput): Promise<Asset> {
    try {
      const updatedAsset = await invoke<Asset>('update_asset', { id, asset })
      return updatedAsset
    } catch (error) {
      console.error(`Failed to update asset ${id}:`, error)
      throw error
    }
  },

  async deleteAsset(id: string): Promise<void> {
    try {
      await invoke('delete_asset', { id })
    } catch (error) {
      console.error(`Failed to delete asset ${id}:`, error)
      throw error
    }
  },

  // React Query hooks
  useAssets() {
    return useQuery<Asset[], Error>({
      queryKey: assetKeys.lists(),
      queryFn: () => this.getAssets(),
    })
  },

  useAsset(id: string) {
    return useQuery<Asset, Error>({
      queryKey: assetKeys.detail(id),
      queryFn: () => this.getAsset(id),
    })
  },

  useCreateAsset() {
    const queryClient = useQueryClient()
    return useMutation<Asset, Error, AssetCreateInput>({
      mutationFn: (asset) => this.createAsset(asset),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: assetKeys.lists() })
      },
    })
  },

  useUpdateAsset() {
    const queryClient = useQueryClient()
    return useMutation<Asset, Error, { id: string; asset: AssetUpdateInput }>({
      mutationFn: ({ id, asset }) => this.updateAsset(id, asset),
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries({ queryKey: assetKeys.detail(id) })
        queryClient.invalidateQueries({ queryKey: assetKeys.lists() })
      },
    })
  },

  useDeleteAsset() {
    const queryClient = useQueryClient()
    return useMutation<void, Error, string>({
      mutationFn: (id) => this.deleteAsset(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: assetKeys.lists() })
      },
    })
  },
} 