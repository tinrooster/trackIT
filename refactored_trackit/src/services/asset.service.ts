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

// IndexedDB setup
const DB_NAME = 'trackIT_db'
const STORE_NAME = 'assets'
const DB_VERSION = 1

let db: IDBDatabase | null = null

async function initDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve()
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      debug.error('Failed to open database')
      reject(request.error)
    }

    request.onsuccess = () => {
      db = request.result
      debug.log('Database opened successfully')
      resolve()
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        debug.log('Object store created')
      }
    }
  })
}

async function getStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
  await initDB()
  if (!db) throw new Error('Database not initialized')
  const transaction = db.transaction(STORE_NAME, mode)
  return transaction.objectStore(STORE_NAME)
}

// Development mock data
const mockAssets = [
  {
    id: '1',
    name: 'Test Asset 1',
    type: 'Hardware',
    status: 'Available',
    location: {
      buildingId: 'b1',
      areaId: 'a1',
      rackId: 'r1'
    },
    project: 'p1',
    assignedTo: null
  },
  {
    id: '2',
    name: 'Test Asset 2',
    type: 'Software',
    status: 'In Use',
    location: {
      buildingId: 'b2',
      areaId: 'a3'
    },
    project: 'p2',
    assignedTo: {
      id: '1',
      name: 'John Doe'
    }
  }
]

// Helper function to safely invoke Tauri commands or fallback to API
async function invokeCommand<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  debug.log(`Invoking command: ${command}`, args)
  
  if (!Boolean(window.__TAURI_IPC__) && window.location.protocol === 'tauri:') {
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
          name: (args?.data as any).name || 'New Asset',
          type: (args?.data as any).type || 'Hardware',
          status: (args?.data as any).status || 'Available',
          location: (args?.data as any).location || {
            buildingId: 'b1'
          },
          project: (args?.data as any).project,
          assignedTo: null
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

// Asset service implementation
export const assetService = {
  // API calls
  async getAssets(): Promise<Asset[]> {
    debug.log('Fetching all assets')
    try {
      const store = await getStore()
      return new Promise((resolve, reject) => {
        const request = store.getAll()
        request.onsuccess = () => {
          debug.log('Successfully fetched assets:', request.result.length)
          resolve(request.result)
        }
        request.onerror = () => {
          debug.error('Failed to fetch assets:', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      debug.error('Failed to fetch assets:', error)
      throw error
    }
  },

  async getAsset(id: string): Promise<Asset> {
    debug.log('Fetching asset by ID:', id)
    try {
      const store = await getStore()
      return new Promise((resolve, reject) => {
        const request = store.get(id)
        request.onsuccess = () => {
          if (!request.result) {
            const error = new Error('Asset not found')
            debug.error(error)
            reject(error)
            return
          }
          debug.log('Successfully fetched asset:', request.result)
          resolve(request.result)
        }
        request.onerror = () => {
          debug.error(`Failed to fetch asset ${id}:`, request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      debug.error(`Failed to fetch asset ${id}:`, error)
      throw error
    }
  },

  async createAsset(asset: AssetCreateInput): Promise<Asset> {
    debug.log('Creating new asset:', asset)
    try {
      const store = await getStore('readwrite')
      const newAsset: Asset = {
        ...asset,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      return new Promise((resolve, reject) => {
        const request = store.add(newAsset)
        request.onsuccess = () => {
          debug.log('Successfully created asset:', newAsset)
          resolve(newAsset)
        }
        request.onerror = () => {
          debug.error('Failed to create asset:', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      debug.error('Failed to create asset:', error)
      throw error
    }
  },

  async updateAsset(id: string, assetUpdate: AssetUpdateInput): Promise<Asset> {
    debug.log('Updating asset:', { id, updates: assetUpdate })
    try {
      const store = await getStore('readwrite')
      return new Promise((resolve, reject) => {
        // First get the existing asset
        const getRequest = store.get(id)
        getRequest.onsuccess = () => {
          if (!getRequest.result) {
            const error = new Error('Asset not found')
            debug.error(error)
            reject(error)
            return
          }

          const updatedAsset: Asset = {
            ...getRequest.result,
            ...assetUpdate,
            updatedAt: new Date()
          }

          const putRequest = store.put(updatedAsset)
          putRequest.onsuccess = () => {
            debug.log('Successfully updated asset:', updatedAsset)
            resolve(updatedAsset)
          }
          putRequest.onerror = () => {
            debug.error(`Failed to update asset ${id}:`, putRequest.error)
            reject(putRequest.error)
          }
        }
        getRequest.onerror = () => {
          debug.error(`Failed to fetch asset ${id} for update:`, getRequest.error)
          reject(getRequest.error)
        }
      })
    } catch (error) {
      debug.error(`Failed to update asset ${id}:`, error)
      throw error
    }
  },

  async deleteAsset(id: string): Promise<void> {
    debug.log('Deleting asset:', id)
    try {
      const store = await getStore('readwrite')
      return new Promise((resolve, reject) => {
        const request = store.delete(id)
        request.onsuccess = () => {
          debug.log('Successfully deleted asset:', id)
          resolve()
        }
        request.onerror = () => {
          debug.error(`Failed to delete asset ${id}:`, request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      debug.error(`Failed to delete asset ${id}:`, error)
      throw error
    }
  },

  // React Query hooks
  useAssets() {
    debug.log('Setting up useAssets hook')
    return useQuery<Asset[], Error>({
      queryKey: ['assets'],
      queryFn: () => this.getAssets(),
    })
  },

  useAsset(id: string) {
    debug.log('Setting up useAsset hook for ID:', id)
    return useQuery<Asset, Error>({
      queryKey: ['asset', id],
      queryFn: () => this.getAsset(id),
    })
  },

  useCreateAsset() {
    debug.log('Setting up useCreateAsset hook')
    const queryClient = useQueryClient()
    return useMutation<Asset, Error, AssetCreateInput>({
      mutationFn: (asset) => this.createAsset(asset),
      onSuccess: () => {
        debug.log('Asset creation successful, invalidating queries')
        queryClient.invalidateQueries({ queryKey: ['assets'] })
      },
    })
  },

  useUpdateAsset() {
    debug.log('Setting up useUpdateAsset hook')
    const queryClient = useQueryClient()
    return useMutation<Asset, Error, { id: string; asset: AssetUpdateInput }>({
      mutationFn: ({ id, asset }) => this.updateAsset(id, asset),
      onSuccess: (_, { id }) => {
        debug.log('Asset update successful, invalidating queries')
        queryClient.invalidateQueries({ queryKey: ['asset', id] })
        queryClient.invalidateQueries({ queryKey: ['assets'] })
      },
    })
  },

  useDeleteAsset() {
    debug.log('Setting up useDeleteAsset hook')
    const queryClient = useQueryClient()
    return useMutation<void, Error, string>({
      mutationFn: (id) => this.deleteAsset(id),
      onSuccess: () => {
        debug.log('Asset deletion successful, invalidating queries')
        queryClient.invalidateQueries({ queryKey: ['assets'] })
      },
    })
  },
} 