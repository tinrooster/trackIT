export enum OrderStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  BACK_ORDERED = "BACK_ORDERED"
}

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  subcategory?: string;
  unit: string;
  unitSubcategory?: string;
  location?: string;
  cabinet?: string;
  quantity: number;
  supplier?: string;
  supplierWebsite?: string;
  project?: string;
  notes?: string;
  qrCode?: string;
  orderStatus?: OrderStatus;
  deliveryPercentage?: number;
  expectedDeliveryDate?: string | Date;
  minQuantity?: number;
  costPerUnit?: number;
  price?: number;
  reorderLevel?: number;
  barcode?: string;
  serialNumber?: string;
  manufacturer?: string;
  modelNumber?: string;
  dateInService?: string | Date;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  maintenanceNotes?: string;
  customFields?: Record<string, string>;
  lastUpdated: Date;
  lastModifiedBy?: string; // Username of the person who last modified the item
}

export interface InventoryHistoryEntry {
  id: string;
  itemId: string;
  itemName: string;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  timestamp: Date;
  userId?: string; // User ID who made the change
  userName?: string; // Username who made the change
}

export interface Template extends Omit<InventoryItem, 'id' | 'lastUpdated'> {
  templateName: string;
}

export interface CategoryNode {
  id: string;
  name: string;
  children?: CategoryNode[];
  parentId?: string;
  path?: string; // Stores full path like "Electronics/Computers/Laptops"
}

export interface ItemWithSubcategories {
  id: string;
  name: string;
  description?: string;
  children?: ItemWithSubcategories[];
}