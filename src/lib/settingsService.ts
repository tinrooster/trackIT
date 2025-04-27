import { z } from "zod";
import { Cabinet, CabinetWithItems } from "@/types/cabinets";

declare global {
  interface Window {
    electronStore: {
      getData: (key: string) => any;
      setData: (key: string, value: any) => void;
      deleteData: (key: string) => void;
    };
  }
}

// Define the settings schema
const defaultSettingsSchema = z.object({
  defaultLocation: z.string().optional(),
  defaultUnit: z.string().optional(),
  defaultCategory: z.string().optional(),
  defaultSupplier: z.string().optional(),
  defaultProject: z.string().optional(),
  defaultOrderStatus: z.enum(['delivered', 'partially_delivered', 'backordered', 'on_order', 'not_ordered']).default('delivered'),
  enableQRTracking: z.boolean().default(true),
  requireCheckoutForSecureCabinets: z.boolean().default(true),
  autoGenerateQRCodes: z.boolean().default(true),
  defaultMinQuantity: z.number().min(0).default(0),
  defaultReorderLevel: z.number().min(0).default(5),
});

export type DefaultSettings = z.infer<typeof defaultSettingsSchema>;

export class SettingsService {
  private static SETTINGS_KEY = 'defaultSettings';
  private static CABINETS_KEY = 'cabinets';

  // Load default settings
  static loadDefaultSettings(): DefaultSettings {
    try {
      const settings = window.electronStore.getData(this.SETTINGS_KEY) as DefaultSettings;
      if (!settings) return this.getDefaultSettings();
      
      return defaultSettingsSchema.parse(settings);
    } catch (error) {
      console.error('Error loading settings:', error);
      return this.getDefaultSettings();
    }
  }

  // Save default settings
  static saveDefaultSettings(settings: DefaultSettings): void {
    try {
      const validated = defaultSettingsSchema.parse(settings);
      window.electronStore.setData(this.SETTINGS_KEY, validated);
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  // Get initial default settings
  private static getDefaultSettings(): DefaultSettings {
    return {
      defaultOrderStatus: 'delivered',
      enableQRTracking: true,
      requireCheckoutForSecureCabinets: true,
      autoGenerateQRCodes: true,
      defaultMinQuantity: 0,
      defaultReorderLevel: 5
    };
  }

  // Cabinet Management
  static async getCabinets(): Promise<Cabinet[]> {
    try {
      const cabinets = window.electronStore.getData(this.CABINETS_KEY) as Cabinet[];
      return cabinets || [];
    } catch (error) {
      console.error('Error loading cabinets:', error);
      return [];
    }
  }

  static async saveCabinet(cabinet: Cabinet): Promise<void> {
    try {
      const cabinets = await this.getCabinets();
      const existingIndex = cabinets.findIndex(c => c.id === cabinet.id);
      
      if (existingIndex >= 0) {
        cabinets[existingIndex] = cabinet;
      } else {
        cabinets.push(cabinet);
      }

      window.electronStore.setData(this.CABINETS_KEY, cabinets);
    } catch (error) {
      console.error('Error saving cabinet:', error);
      throw error;
    }
  }

  static async deleteCabinet(cabinetId: string): Promise<void> {
    try {
      const cabinets = await this.getCabinets();
      const filtered = cabinets.filter(c => c.id !== cabinetId);
      window.electronStore.setData(this.CABINETS_KEY, filtered);
    } catch (error) {
      console.error('Error deleting cabinet:', error);
      throw error;
    }
  }

  static async getCabinetsByLocation(locationId: string): Promise<Cabinet[]> {
    try {
      const cabinets = await this.getCabinets();
      return cabinets.filter(c => c.locationId === locationId);
    } catch (error) {
      console.error('Error getting cabinets by location:', error);
      return [];
    }
  }

  static async getCabinetWithItems(cabinetId: string, items: any[]): Promise<CabinetWithItems | null> {
    try {
      const cabinets = await this.getCabinets();
      const cabinet = cabinets.find(c => c.id === cabinetId);
      if (!cabinet) return null;

      const cabinetItems = items.filter(item => item.cabinet === cabinetId);
      return {
        ...cabinet,
        items: cabinetItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity
        }))
      };
    } catch (error) {
      console.error('Error getting cabinet with items:', error);
      return null;
    }
  }
} 