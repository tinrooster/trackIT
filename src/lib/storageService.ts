import { InventoryItem } from "@/types/inventory";

// Helper to parse date strings back into Date objects
const parseItemDates = (item: any): InventoryItem => {
  return {
    ...item,
    lastUpdated: item.lastUpdated ? new Date(item.lastUpdated) : new Date(),
    expectedDeliveryDate: item.expectedDeliveryDate ? new Date(item.expectedDeliveryDate) : undefined,
  };
};

// Get items from localStorage
export const getItems = (): InventoryItem[] => {
  try {
    const itemsJson = localStorage.getItem('inventoryItems');
    if (!itemsJson) return [];
    
    const itemsArray = JSON.parse(itemsJson);
    // Ensure dates are parsed correctly
    return itemsArray.map(parseItemDates);
  } catch (error) {
    console.error('Error getting items from localStorage:', error);
    return [];
  }
};

// Save items to localStorage
export const saveItems = (items: InventoryItem[]): void => {
  try {
    // Ensure dates are stored as ISO strings for consistency
    const itemsToSave = items.map(item => ({
      ...item,
      lastUpdated: item.lastUpdated instanceof Date ? item.lastUpdated.toISOString() : new Date().toISOString(),
      expectedDeliveryDate: item.expectedDeliveryDate instanceof Date ? item.expectedDeliveryDate.toISOString() : undefined,
    }));
    localStorage.setItem('inventoryItems', JSON.stringify(itemsToSave));
  } catch (error) {
    console.error('Error saving items to localStorage:', error);
  }
};

// Get settings from localStorage
export const getSettings = (key: string): string[] => {
  try {
    const settings = localStorage.getItem(key);
    return settings ? JSON.parse(settings) : [];
  } catch (error) {
    console.error(`Error getting ${key} from localStorage:`, error);
    return [];
  }
};

// Save settings to localStorage
export const saveSettings = (key: string, values: string[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(values));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};