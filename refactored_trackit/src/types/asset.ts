export type ProjectInfo = {
  id: string;
  name: string;
  code: string;
  status: string;
}

export type InServiceInfo = {
  status: boolean;
  startDate: Date;
  expectedLifespan: number; // in months
  maintenanceSchedule?: number; // in months
}

export type DecommissionStatus = 'planned' | 'active' | 'complete' | null;

export type DecommissionInfo = {
  status: DecommissionStatus;
  plannedDate?: Date;
  actualDate?: Date;
  reason?: string;
  approvedBy?: string; // User ID
}

export type DispositionType = 'ewaste' | 'secure_destruction' | 'hot_storage' | 'cold_storage' | null;

export type DispositionInfo = {
  type: DispositionType;
  requirements: string[];
  status: string;
  completedDate?: Date;
  verifiedBy?: string; // User ID
}

export type ProjectAllocation = {
  projectId: string;
  percentage: number;
  hours?: number;
}

export type MaintenanceCost = {
  date: Date;
  cost: number;
  description: string;
}

export type OperationalCost = {
  type: string;
  amount: number;
  period: string;
}

export type CostInfo = {
  purchaseCost: number;
  projectAllocation: ProjectAllocation[];
  maintenanceCosts: MaintenanceCost[];
  operationalCosts: OperationalCost[];
}

export type InventoryUsage = {
  date: Date;
  quantity: number;
  projectId: string;
  location: string;
  updatedBy: string; // User ID
}

export type InventoryInfo = {
  initialQuantity: number;
  remainingQuantity: number;
  unit: string;
  minimumThreshold: number;
  usage: InventoryUsage[];
}

export type Location = {
  id: string;
  name: string;
}

export type User = {
  id: string;
  name: string;
}

export type Asset = {
  // Core Fields
  id: string;
  name: string;
  type: string;
  serialNumber: string;
  barcode: string;
  status: string;

  // Project and Service Information
  project?: ProjectInfo;
  inService: InServiceInfo;
  decommission?: DecommissionInfo;
  disposition?: DispositionInfo;

  // Cost and Inventory Tracking
  costs: CostInfo;
  inventory?: InventoryInfo; // Optional as not all assets are consumables

  // Location and Assignment
  location: Location;
  assignedTo?: User;

  // System Fields
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

export type AssetCreateInput = Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>;
export type AssetUpdateInput = Partial<AssetCreateInput>; 