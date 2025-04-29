import { InventoryItem, CategoryNode, ItemWithSubcategories } from '@/types/inventory';
import { ItemTemplate } from '@/types/templates';

declare global {
  interface Window {
    electronStore: {
      getData: (key: string) => any;
      setData: (key: string, value: any) => void;
      deleteData: (key: string) => void;
    };
  }
}

// Constants for storage keys
export const STORAGE_KEYS = {
  CATEGORIES: 'inventory-categories',
  UNITS: 'inventory-units',
  LOCATIONS: 'inventory-locations',
  SUPPLIERS: 'inventory-suppliers',
  PROJECTS: 'inventory-projects',
  ITEMS: 'inventoryItems',
  HISTORY: 'inventory-history',
  TEMPLATES: 'inventory-templates',
  GENERAL_SETTINGS: 'inventory-general-settings',
  USERS: 'users',
};

// Helper function to parse dates in items
const parseItemDates = (item: any): InventoryItem => ({
  ...item,
  lastUpdated: item.lastUpdated ? new Date(item.lastUpdated) : new Date(),
  expectedDeliveryDate: item.expectedDeliveryDate ? new Date(item.expectedDeliveryDate) : undefined
});

// Get items from store
export const getItems = (): InventoryItem[] => {
  try {
    const items = window.electronStore.getData(STORAGE_KEYS.ITEMS) as InventoryItem[];
    return items ? items.map(parseItemDates) : [];
  } catch (error) {
    console.error('Error getting items from store:', error);
    return [];
  }
};

// Save items to store
export const saveItems = (items: InventoryItem[]): void => {
  try {
    const itemsToSave = items.map(item => ({
      ...item,
      lastUpdated: item.lastUpdated instanceof Date ? item.lastUpdated.toISOString() : new Date().toISOString(),
      expectedDeliveryDate: item.expectedDeliveryDate instanceof Date ? item.expectedDeliveryDate.toISOString() : undefined,
    }));
    window.electronStore.setData(STORAGE_KEYS.ITEMS, itemsToSave);
  } catch (error) {
    console.error('Error saving items to store:', error);
  }
};

export interface Settings {
  categories: CategoryNode[];
  units: ItemWithSubcategories[];
  locations: ItemWithSubcategories[];
  suppliers: ItemWithSubcategories[];
  projects: ItemWithSubcategories[];
}

// Get settings from store
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
        const values = window.electronStore.getData(storageKey);
        if (values) {
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
                window.electronStore.setData(storageKey, newFormat);
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
    console.error('Error getting settings from store:', error);
    return {
      categories: [],
      units: [],
      locations: [],
      suppliers: [],
      projects: []
    };
  }
};

// Save settings to store
export const saveSettings = (settings: Settings): void => {
  try {
    Object.entries(settings).forEach(([key, values]) => {
      const storageKey = STORAGE_KEYS[key.toUpperCase() as keyof typeof STORAGE_KEYS];
      if (storageKey) {
        window.electronStore.setData(storageKey, values);
      }
    });
  } catch (error) {
    console.error('Error saving settings to store:', error);
  }
};

// Save templates to store
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
    
    window.electronStore.setData(STORAGE_KEYS.TEMPLATES, validTemplates);
    console.log('Templates saved successfully');
  } catch (error) {
    console.error('Error saving templates to store:', error);
    throw error;
  }
};

// Get templates from store
export const getTemplates = (): ItemTemplate[] => {
  try {
    const templates = window.electronStore.getData(STORAGE_KEYS.TEMPLATES) as ItemTemplate[];
    console.log('Templates loaded from store:', templates);
    
    if (!templates) {
      console.log('No templates found in storage');
      return [];
    }
    
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
    console.error('Error getting templates from store:', error);
    return [];
  }
};