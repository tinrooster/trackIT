// Asset type definitions
export type Asset = {
  // Core Fields
  id: string;
  name: string;
  type: string;
  status: string;
  serialNumber?: string;
  location: {
    buildingId: string;
    name?: string;
  };
  assignedTo?: {
    id: string;
    name: string;
  };
  project?: string;
  notes?: string;
  currentLevel?: number;

  // System Fields
  createdAt: Date;
  updatedAt: Date;
};

// Input types for create and update operations
export type AssetCreateInput = Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>;
export type AssetUpdateInput = Partial<AssetCreateInput>; 