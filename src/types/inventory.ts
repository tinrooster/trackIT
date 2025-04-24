export type OrderStatus = 'delivered' | 'partially_delivered' | 'backordered' | 'on_order' | 'not_ordered';

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  minQuantity?: number;
  unit: string;
  costPerUnit?: number;
  price?: number;
  category?: string;
  location?: string;
  reorderLevel?: number;
  barcode?: string;
  notes?: string;
  supplier?: string;
  supplierWebsite?: string;
  project?: string;
  orderStatus: OrderStatus;
  deliveryPercentage: number;
  expectedDeliveryDate?: Date;
  lastUpdated: Date;
  createdBy?: string; // User ID who created the item
  lastModifiedBy?: string; // User ID who last modified the item
  status?: 'in_stock' | 'pending' | 'backorder' | 'discontinued';
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