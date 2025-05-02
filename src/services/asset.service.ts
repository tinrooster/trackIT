// Add Tauri window type declaration
declare global {
  interface Window {
    __TAURI_IPC__?: unknown;
  }
}

import { invoke } from '@tauri-apps/api/tauri';
import { Asset, AssetCreateInput, AssetUpdateInput } from '../types/asset';
import { useMutation, useQuery } from '@tanstack/react-query';

// Debug logging helper
const debug = {
  log: (...args: any[]) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [DEBUG]`, ...args);
  },
  error: (...args: any[]) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR]`, ...args);
  }
};

function isTauriApp() {
  return Boolean(window.__TAURI_IPC__) && window.location.protocol === 'tauri:';
}

// Development mock data
const mockAssets: Asset[] = [
  {
    id: '1',
    name: 'Test Asset 1',
    type: 'Hardware',
    serialNumber: 'HW001',
    barcode: 'BAR001',
    status: 'Available',
    
    project: {
      id: 'P1',
      name: '2025 Sutro Tower Upgrade',
      code: '2025:SUTRO',
      status: 'active'
    },
    
    inService: {
      status: true,
      startDate: new Date('2024-01-15'),
      expectedLifespan: 60, // 5 years
      maintenanceSchedule: 12 // annual
    },
    
    decommission: undefined,
    disposition: undefined,
    
    costs: {
      purchaseCost: 5000,
      projectAllocation: [
        {
          projectId: 'P1',
          percentage: 100,
          hours: 0
        }
      ],
      maintenanceCosts: [],
      operationalCosts: []
    },
    
    location: {
      id: '1',
      name: 'Main Office'
    },
    
    assignedTo: undefined,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    notes: 'New equipment for Sutro Tower upgrade'
  },
  {
    id: '2',
    name: 'Fiber Cable Spool',
    type: 'Cable',
    serialNumber: 'CAB001',
    barcode: 'BAR002',
    status: 'In Use',
    
    project: {
      id: 'P1',
      name: '2025 Sutro Tower Upgrade',
      code: '2025:SUTRO',
      status: 'active'
    },
    
    inService: {
      status: true,
      startDate: new Date('2024-01-15'),
      expectedLifespan: 12,
      maintenanceSchedule: undefined
    },
    
    inventory: {
      initialQuantity: 1000,
      remainingQuantity: 850,
      unit: 'meters',
      minimumThreshold: 100,
      usage: [
        {
          date: new Date('2024-02-01'),
          quantity: 150,
          projectId: 'P1',
          location: 'Sutro Tower Site',
          updatedBy: 'U1'
        }
      ]
    },
    
    costs: {
      purchaseCost: 2000,
      projectAllocation: [
        {
          projectId: 'P1',
          percentage: 100,
          hours: undefined
        }
      ],
      maintenanceCosts: [],
      operationalCosts: []
    },
    
    location: {
      id: '2',
      name: 'Engineering Store'
    },
    
    assignedTo: {
      id: '1',
      name: 'John Doe'
    },
    
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-01'),
    notes: 'Fiber cable for tower infrastructure'
  },
  {
    id: '3',
    name: 'Legacy Server',
    type: 'Hardware',
    serialNumber: 'SRV001',
    barcode: 'BAR003',
    status: 'Decommissioning',
    
    inService: {
      status: false,
      startDate: new Date('2020-01-01'),
      expectedLifespan: 48,
      maintenanceSchedule: 6
    },
    
    decommission: {
      status: 'active',
      plannedDate: new Date('2024-06-30'),
      actualDate: undefined,
      reason: 'End of life cycle',
      approvedBy: 'U2'
    },
    
    disposition: {
      type: 'secure_destruction',
      requirements: ['Secure drive wiping', 'Certificate of destruction required'],
      status: 'pending',
      completedDate: undefined,
      verifiedBy: undefined
    },
    
    costs: {
      purchaseCost: 15000,
      projectAllocation: [
        {
          projectId: 'P2',
          percentage: 100,
          hours: 8760 // 1 year of runtime
        }
      ],
      maintenanceCosts: [
        {
          date: new Date('2022-01-15'),
          cost: 500,
          description: 'Annual maintenance'
        }
      ],
      operationalCosts: [
        {
          type: 'power',
          amount: 1200,
          period: '2023'
        }
      ]
    },
    
    location: {
      id: '3',
      name: 'Server Room'
    },
    
    assignedTo: undefined,
    createdAt: new Date('2020-01-01'),
    updatedAt: new Date('2024-01-15'),
    notes: 'Legacy system scheduled for decommission'
  }
];

// Helper function to safely parse dates from JSON
function parseDates(obj: any): any {
  if (!obj) return obj;
  
  const dateFields = ['createdAt', 'updatedAt', 'lastUpdated', 'expectedDeliveryDate'];
  
  if (typeof obj === 'object') {
    for (const key in obj) {
      if (dateFields.includes(key) && typeof obj[key] === 'string') {
        obj[key] = new Date(obj[key]);
      } else if (typeof obj[key] === 'object') {
        obj[key] = parseDates(obj[key]);
      }
    }
  }
  return obj;
}

// Helper function to safely invoke Tauri commands or fallback to API
async function invokeCommand<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  debug.log(`Invoking command: ${command}`, args)
  
  try {
    if (isTauriApp()) {
      const result = await invoke<T>(command, args);
      return parseDates(result);
    } else {
      // In development, return mock data
      debug.log('Using mock data for development');
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      
      switch (command) {
        case 'get_assets':
          return parseDates([...mockAssets]) as T;
        case 'get_asset':
          const assetId = args?.id as string;
          const asset = mockAssets.find(a => a.id === assetId);
          if (!asset) throw new Error('Asset not found');
          return parseDates({...asset}) as T;
        default:
          throw new Error(`Unhandled command: ${command}`);
      }
    }
  } catch (error) {
    debug.error(`Error invoking command ${command}:`, error);
    throw error;
  }
} 

// Asset service functions
const getAssets = async (): Promise<Asset[]> => {
  return invokeCommand<Asset[]>('get_assets');
};

const getAsset = async (id: string): Promise<Asset> => {
  return invokeCommand<Asset>('get_asset', { id });
};

const createAsset = async (asset: AssetCreateInput): Promise<Asset> => {
  return invokeCommand<Asset>('create_asset', { asset });
};

const updateAsset = async ({ id, asset }: { id: string; asset: AssetUpdateInput }): Promise<Asset> => {
  return invokeCommand<Asset>('update_asset', { id, asset });
};

const deleteAsset = async (id: string): Promise<void> => {
  return invokeCommand<void>('delete_asset', { id });
};

// React Query hooks
const useAssets = () => {
  return useQuery({
    queryKey: ['assets'],
    queryFn: getAssets,
  });
};

const useAsset = (id: string) => {
  return useQuery({
    queryKey: ['asset', id],
    queryFn: () => getAsset(id),
  });
};

const useCreateAsset = () => {
  return useMutation({
    mutationFn: createAsset,
  });
};

const useUpdateAsset = () => {
  return useMutation({
    mutationFn: updateAsset,
  });
};

const useDeleteAsset = () => {
  return useMutation({
    mutationFn: deleteAsset,
  });
};

// Export the service
export const assetService = {
  // Direct functions
  getAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  
  // React Query hooks
  useAssets,
  useAsset,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
}; 