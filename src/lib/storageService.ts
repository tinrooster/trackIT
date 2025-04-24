import { InventoryItem, ItemWithSubcategories } from "@/types/inventory";
import { ItemTemplate } from '@/types/templates';
import { CategoryNode } from '@/types/inventory';

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

// Constants for storage keys
export const STORAGE_KEYS = {
  CATEGORIES: 'inventory-categories',
  UNITS: 'inventory-units',
  LOCATIONS: 'inventory-locations',
  SUPPLIERS: 'inventory-suppliers',
  PROJECTS: 'inventory-projects',
  ITEMS: 'inventoryItems',
  HISTORY: 'inventoryHistory',
  TEMPLATES: 'inventory-templates',
  GENERAL_SETTINGS: 'inventory-general-settings',
  USERS: 'users',
};

interface Settings {
  categories: ItemWithSubcategories[];
  units: ItemWithSubcategories[];
  locations: ItemWithSubcategories[];
  suppliers: ItemWithSubcategories[];
  projects: ItemWithSubcategories[];
}

// Get settings from localStorage
export const getSettings = (): Settings => {
  try {
    const settings: Settings = {
      categories: [],
      units: [],
      locations: [],
      suppliers: [],
      projects: []
    };

    // Load each setting
    Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
      if (['CATEGORIES', 'UNITS', 'LOCATIONS', 'SUPPLIERS', 'PROJECTS'].includes(key)) {
        const valuesJson = localStorage.getItem(storageKey);
        if (valuesJson) {
          const values = JSON.parse(valuesJson);
          
          // Convert old string[] format to ItemWithSubcategories[]
          if (Array.isArray(values)) {
            if (values.length > 0) {
              if (typeof values[0] === 'string') {
                // Convert old string[] format to new format
                const newFormat = values.map((name: string) => ({
                  id: crypto.randomUUID(),
                  name,
                  subcategories: []
                }));
                settings[key.toLowerCase() as keyof Settings] = newFormat;
                // Save in new format
                localStorage.setItem(storageKey, JSON.stringify(newFormat));
              } else {
                // Already in new format
                settings[key.toLowerCase() as keyof Settings] = values;
              }
            }
          }
        }
      }
    });

    return settings;
  } catch (error) {
    console.error('Error getting settings from localStorage:', error);
    return {
      categories: [],
      units: [],
      locations: [],
      suppliers: [],
      projects: []
    };
  }
};

// Save settings to localStorage
export const saveSettings = (settings: Settings): void => {
  try {
    Object.entries(settings).forEach(([key, values]) => {
      const storageKey = STORAGE_KEYS[key.toUpperCase() as keyof typeof STORAGE_KEYS];
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(values));
      }
    });
  } catch (error) {
    console.error('Error saving settings to localStorage:', error);
  }
};

// Save templates to localStorage
export const saveTemplates = (templates: ItemTemplate[]): void => {
  try {
    console.log('Saving templates:', templates);
    if (!Array.isArray(templates)) {
      console.error('Templates must be an array');
      return;
    }
    
    // Ensure we're saving valid template data
    const validTemplates = templates.filter(template => 
      template && 
      typeof template === 'object' && 
      template.templateId && 
      template.templateName
    );
    
    const serializedTemplates = JSON.stringify(validTemplates);
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, serializedTemplates);
    
    // Verify the save
    const savedData = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    console.log('Verified saved templates:', savedData);
  } catch (error) {
    console.error('Error saving templates to localStorage:', error);
    throw error;
  }
};

// Get templates from localStorage
export const getTemplates = (): ItemTemplate[] => {
  try {
    const templatesJson = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    console.log('Raw templates from storage:', templatesJson);
    
    if (!templatesJson) {
      console.log('No templates found in storage');
      return [];
    }
    
    const templates = JSON.parse(templatesJson);
    if (!Array.isArray(templates)) {
      console.error('Stored templates is not an array');
      return [];
    }
    
    // Validate template structure
    const validTemplates = templates.filter(template => 
      template && 
      typeof template === 'object' && 
      template.templateId && 
      template.templateName
    );
    
    console.log('Valid templates loaded:', validTemplates);
    return validTemplates;
  } catch (error) {
    console.error('Error getting templates from localStorage:', error);
    return [];
  }
};