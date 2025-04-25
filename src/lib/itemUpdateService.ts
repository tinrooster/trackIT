import { InventoryItem } from "@/types/inventory";
import { Cabinet } from "@/types/cabinets";

export interface UpdateOptions {
  deleteReferences?: boolean;  // If true, removes references to deleted item
  replacementValue?: string;   // If provided, replaces references with this value
}

export class ItemUpdateService {
  // Handle location updates/deletions
  static async handleLocationUpdate(
    oldLocationId: string,
    items: InventoryItem[],
    options: UpdateOptions
  ): Promise<InventoryItem[]> {
    return items.map(item => {
      if (item.location === oldLocationId) {
        return {
          ...item,
          location: options.replacementValue || undefined,
          cabinet: undefined // Clear cabinet reference if location is changed/deleted
        };
      }
      return item;
    });
  }

  // Handle cabinet updates/deletions
  static async handleCabinetUpdate(
    oldCabinetId: string,
    items: InventoryItem[],
    options: UpdateOptions
  ): Promise<InventoryItem[]> {
    return items.map(item => {
      if (item.cabinet === oldCabinetId) {
        return {
          ...item,
          cabinet: options.replacementValue || undefined
        };
      }
      return item;
    });
  }

  // Handle category updates/deletions
  static async handleCategoryUpdate(
    oldCategory: string,
    items: InventoryItem[],
    options: UpdateOptions
  ): Promise<InventoryItem[]> {
    return items.map(item => {
      if (item.category === oldCategory) {
        return {
          ...item,
          category: options.replacementValue || undefined
        };
      }
      return item;
    });
  }

  // Handle supplier updates/deletions
  static async handleSupplierUpdate(
    oldSupplier: string,
    items: InventoryItem[],
    options: UpdateOptions
  ): Promise<InventoryItem[]> {
    return items.map(item => {
      if (item.supplier === oldSupplier) {
        return {
          ...item,
          supplier: options.replacementValue || undefined,
          supplierWebsite: options.deleteReferences ? undefined : item.supplierWebsite
        };
      }
      return item;
    });
  }

  // Handle unit updates/deletions
  static async handleUnitUpdate(
    oldUnit: string,
    items: InventoryItem[],
    options: UpdateOptions
  ): Promise<InventoryItem[]> {
    if (!options.replacementValue && !options.deleteReferences) {
      throw new Error("Units cannot be deleted without replacement or explicit deletion");
    }
    return items.map(item => {
      if (item.unit === oldUnit) {
        return {
          ...item,
          unit: options.replacementValue || "units" // Default to generic "units" if no replacement
        };
      }
      return item;
    });
  }

  // Generate QR code for cabinet
  static generateCabinetQRCode(cabinet: Cabinet): string {
    // Generate a unique QR code that includes location and cabinet info
    const qrData = {
      type: 'cabinet',
      id: cabinet.id,
      name: cabinet.name,
      locationId: cabinet.locationId,
      timestamp: new Date().toISOString()
    };
    
    // Return as JSON string that can be converted to QR code
    return JSON.stringify(qrData);
  }

  // Validate cabinet assignment
  static validateCabinetAssignment(
    item: InventoryItem,
    cabinet: Cabinet
  ): { valid: boolean; message?: string } {
    if (!cabinet) {
      return { valid: false, message: "Cabinet not found" };
    }

    // Check if item category is allowed in this cabinet
    if (cabinet.allowedCategories?.length && item.category) {
      if (!cabinet.allowedCategories.includes(item.category)) {
        return {
          valid: false,
          message: `Category ${item.category} is not allowed in this cabinet`
        };
      }
    }

    // Add more validation rules as needed
    return { valid: true };
  }
} 