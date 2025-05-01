import { z } from 'zod' // For validation

// Validation schema
export const InventoryItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  quantity: z.number().min(0, "Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
  location: z.string().min(1, "Location is required"),
  cost: z.number().optional(),
  budgetCode: z.string().optional(),
  barcode: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().optional(),
  warrantyExpiration: z.string().optional(),
  notes: z.string().optional(),
  lastModified: z.string(),
  status: z.enum(['available', 'in_use', 'maintenance', 'retired']),
})

export type InventoryItem = z.infer<typeof InventoryItemSchema>

// Service class for inventory operations
export class InventoryService {
  private static STORAGE_KEY = 'trackIT_inventory'

  // Load items from localStorage
  static async getItems(): Promise<InventoryItem[]> {
    const stored = localStorage.getItem(this.STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  }

  // Save items to localStorage
  static async saveItems(items: InventoryItem[]): Promise<void> {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items))
  }

  // Lookup item by barcode (simulated API call)
  static async lookupBarcode(barcode: string): Promise<Partial<InventoryItem> | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simulate external database lookup
    const mockDatabase: Record<string, Partial<InventoryItem>> = {
      '12345': {
        name: 'HDMI Cable 2.1',
        manufacturer: 'TechBrand',
        type: 'Cable',
        model: 'HDMI-2.1-2M',
        cost: 29.99,
      },
      // Add more mock items as needed
    }
    
    return mockDatabase[barcode] || null
  }
} 