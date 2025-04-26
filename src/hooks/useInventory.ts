import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { InventoryItem, CategoryNode, ItemWithSubcategories, OrderStatus } from '@/types/inventory'
import { getItems, saveItems, getSettings, saveSettings } from '@/lib/storageService' 
import { DUMMY_INVENTORY_DATA } from '@/lib/dummyData'; 
import { toast } from 'sonner'; 
import { Settings } from '@/lib/storageService'
import { Cabinet } from '@/types/cabinets'

type SettingsKey = keyof Settings;
const SETTINGS_KEYS: SettingsKey[] = ['categories', 'units', 'locations', 'suppliers', 'projects'];
type ItemField = 'category' | 'unit' | 'location' | 'supplier' | 'project';

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [units, setUnits] = useState<ItemWithSubcategories[]>([]);
  const [locations, setLocations] = useState<ItemWithSubcategories[]>([]);
  const [suppliers, setSuppliers] = useState<ItemWithSubcategories[]>([]);
  const [projects, setProjects] = useState<ItemWithSubcategories[]>([]);
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);

  // Load items and settings
  useEffect(() => {
    let loadedItems: InventoryItem[] = [];
    try {
      loadedItems = getItems();
      console.log('Loaded items from localStorage:', loadedItems.length);
      
      if (loadedItems.length === 0) {
        console.log('localStorage empty, loading dummy data...');
        loadedItems = DUMMY_INVENTORY_DATA.map(item => ({ 
          ...item,
          lastUpdated: new Date(item.lastUpdated),
          expectedDeliveryDate: item.expectedDeliveryDate ? new Date(item.expectedDeliveryDate) : undefined
        }));
        saveItems(loadedItems); 
        toast.info("Loaded dummy inventory data.");
      }
      
      setItems(loadedItems);
      
      // Load settings
      const settings = getSettings();
      setCategories(settings.categories);
      setUnits(settings.units);
      setLocations(settings.locations);
      setSuppliers(settings.suppliers);
      setProjects(settings.projects);

      // Load cabinets
      const savedCabinets = localStorage.getItem('cabinets');
      if (savedCabinets) {
        setCabinets(JSON.parse(savedCabinets));
      }

      // Load history
      const loadedHistory = localStorage.getItem('inventoryHistory');
      if (loadedHistory) {
        try {
          const parsedHistory = JSON.parse(loadedHistory).map((entry: any) => ({
            ...entry,
            timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date()
          }));
          setHistory(parsedHistory);
        } catch (histError) {
          console.error("Error parsing history:", histError);
          setHistory([]);
        }
      }
    } catch (error) {
      console.error('Failed to load items or settings:', error);
    } finally {
      setLoading(false);
    }
  }, []); 
  
  // Load settings
  useEffect(() => {
    try {
      const settings = getSettings();
      setCategories(settings.categories as CategoryNode[]);
      setUnits(settings.units);
      setLocations(settings.locations);
      setSuppliers(settings.suppliers);
      setProjects(settings.projects);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);
  
  // Save items
  useEffect(() => { if (!loading) saveItems(items); }, [items, loading]);
  // Save history
  useEffect(() => { 
     if (!loading && history.length > 0) { 
       try {
         const historyToSave = history.map(entry => ({
           ...entry,
           timestamp: entry.timestamp instanceof Date ? entry.timestamp.toISOString() : new Date().toISOString()
         }));
         localStorage.setItem('inventoryHistory', JSON.stringify(historyToSave));
       } catch (error) { console.error("Error saving history:", error); }
     } 
  }, [history, loading]);

  // --- Settings Management & Reconciliation ---
  const updateSettingsList = useCallback((
    listKey: SettingsKey, 
    newList: ItemWithSubcategories[], 
    reassignInfo?: { valueToRemove: string; reassignTo?: string } 
  ) => {
    let listSetter: React.Dispatch<React.SetStateAction<ItemWithSubcategories[]>>;
    let itemField: ItemField;
    const itemFieldMap: Record<SettingsKey, ItemField> = {
      categories: 'category',
      units: 'unit',
      locations: 'location',
      suppliers: 'supplier',
      projects: 'project'
    };
    itemField = itemFieldMap[listKey];

    switch (listKey) {
      case 'categories':
        listSetter = setCategories as React.Dispatch<React.SetStateAction<ItemWithSubcategories[]>>;
        break;
      case 'units':
        listSetter = setUnits;
        break;
      case 'locations':
        listSetter = setLocations;
        break;
      case 'suppliers':
        listSetter = setSuppliers;
        break;
      case 'projects':
        listSetter = setProjects;
        break;
      default:
        listSetter = setCategories as React.Dispatch<React.SetStateAction<ItemWithSubcategories[]>>;
        break;
    }

    let reconciledCount = 0;
    if (reassignInfo) {
      const { valueToRemove, reassignTo } = reassignInfo;
      setItems(prevItems => {
        const updatedItems = prevItems.map(item => {
          const fieldValue = item[itemField];
          if (typeof fieldValue === 'string' && fieldValue === valueToRemove) {
            reconciledCount++;
            return { ...item, [itemField]: reassignTo, lastUpdated: new Date() }; 
          }
          return item;
        });
        return updatedItems; 
      });
      if (reconciledCount > 0) {
        toast.info(`Updated ${reconciledCount} items from ${valueToRemove} to ${reassignTo || 'unassigned'}`);
      }
    }

    listSetter(newList);
    const settings = getSettings();
    settings[listKey] = newList;
    saveSettings(settings);
    if (!reassignInfo) toast.success(`${listKey} list updated.`);
  }, [items]);

  // --- Inventory Item Management ---
  const getItemById = useCallback((id: string): InventoryItem | undefined => {
    return items.find(item => item.id === id);
  }, [items]);
  
  const addItem = useCallback((newItemData: Omit<InventoryItem, 'id' | 'lastUpdated'>): InventoryItem => {
    const newItem: InventoryItem = {
      ...newItemData,
      id: uuidv4(),
      lastUpdated: new Date()
    };
    setItems(prevItems => [...prevItems, newItem]);
    const historyEntry = { 
      id: uuidv4(), itemId: newItem.id, itemName: newItem.name, 
      previousQuantity: 0, newQuantity: newItem.quantity, 
      reason: 'Initial inventory entry', timestamp: new Date() 
    };
    setHistory(prevHistory => [...prevHistory, historyEntry]);
    return newItem;
  }, []);
  
  const updateItem = useCallback((updatedItemData: Partial<InventoryItem> & { id: string }): InventoryItem => {
    // Get the existing item to merge with updates
    const existingItem = items.find(item => item.id === updatedItemData.id);
    if (!existingItem) {
      throw new Error(`Item with ID ${updatedItemData.id} not found`);
    }

    // Create the updated item with proper type checking
    const finalUpdatedItem = {
      ...existingItem, // Start with existing item to ensure all required fields
      ...updatedItemData, // Override with any provided updates
      lastUpdated: new Date(),
      // Ensure required fields are preserved
      name: updatedItemData.name ?? existingItem.name,
      category: updatedItemData.category ?? existingItem.category,
      unit: updatedItemData.unit ?? existingItem.unit,
      location: updatedItemData.location ?? existingItem.location,
      quantity: updatedItemData.quantity ?? existingItem.quantity,
      // Handle optional fields
      orderStatus: updatedItemData.orderStatus ?? existingItem.orderStatus,
      deliveryPercentage: updatedItemData.deliveryPercentage ?? existingItem.deliveryPercentage ?? 100
    } as InventoryItem; // Assert the type since we know we have all required fields

    setItems(prevItems => {
      const newItems = prevItems.map(item => 
        item.id === updatedItemData.id ? finalUpdatedItem : item
      );
      // Persist to localStorage
      saveItems(newItems);
      return newItems;
    });

    return finalUpdatedItem;
  }, [items]);
  
  const deleteItem = useCallback((itemId: string) => {
    setItems(prevItems => {
      const newItems = prevItems.filter(item => item.id !== itemId);
      // Persist to localStorage
      saveItems(newItems);
      return newItems;
    });
  }, []);
  
  const adjustQuantity = useCallback((itemId: string, newQuantity: number, reason: string): InventoryItem | undefined => {
    let updatedItem: InventoryItem | undefined = undefined;
    const originalItem = items.find(item => item.id === itemId); 
    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === itemId) {
          updatedItem = { ...item, quantity: newQuantity, lastUpdated: new Date() };
          return updatedItem;
        }
        return item;
      });
    });
    if (updatedItem && originalItem) { 
      const historyEntry = { 
        id: uuidv4(), itemId: itemId, itemName: updatedItem.name, 
        previousQuantity: originalItem.quantity, newQuantity: newQuantity, 
        reason: reason, timestamp: new Date() 
      };
      setHistory(prevHistory => [...prevHistory, historyEntry]);
    }
    return updatedItem;
  }, [items]); 

  // --- Import Items ---
  const importItems = useCallback(async (itemsToImport: Partial<InventoryItem>[]): Promise<{ importedCount: number; skippedCount: number }> => {
    return new Promise((resolve) => {
      let importedCount = 0;
      let skippedCount = 0;
      const newItems: InventoryItem[] = []; // To collect newly created items
      const updatedItemsMap = new Map<string, InventoryItem>(); // To track updates

      itemsToImport.forEach((importRow, index) => {
        // Basic validation
        if (!importRow.name || !importRow.unit || importRow.quantity === undefined || importRow.quantity === null) {
          console.warn(`Skipping row ${index + 1} due to missing required fields (name, unit, quantity).`);
          skippedCount++;
          return;
        }

        // Try to find existing item by name (case-insensitive)
        const existingItemIndex = items.findIndex(item => item.name.toLowerCase() === String(importRow.name).toLowerCase());

        if (existingItemIndex !== -1) {
          // Update existing item
          const existingItem = items[existingItemIndex];
          const updatedItem: InventoryItem = {
            ...existingItem,
            ...importRow, // Override with imported data
            // Ensure numeric types and handle potential undefined values from importRow
            quantity: Number(importRow.quantity), 
            costPerUnit: importRow.costPerUnit !== undefined ? Number(importRow.costPerUnit) : existingItem.costPerUnit,
            reorderLevel: importRow.reorderLevel !== undefined ? Number(importRow.reorderLevel) : existingItem.reorderLevel,
            deliveryPercentage: importRow.deliveryPercentage !== undefined ? Number(importRow.deliveryPercentage) : existingItem.deliveryPercentage,
            // Ensure dates are Date objects
            expectedDeliveryDate: importRow.expectedDeliveryDate ? new Date(importRow.expectedDeliveryDate) : existingItem.expectedDeliveryDate,
            lastUpdated: new Date(), // Always update timestamp
          };
          updatedItemsMap.set(updatedItem.id, updatedItem); // Store update
          importedCount++;
        } else {
          // Add as new item
          const newItem: InventoryItem = {
            id: uuidv4(),
            name: String(importRow.name),
            description: importRow.description ? String(importRow.description) : undefined,
            quantity: Number(importRow.quantity),
            unit: String(importRow.unit),
            costPerUnit: importRow.costPerUnit !== undefined ? Number(importRow.costPerUnit) : undefined,
            category: importRow.category ? String(importRow.category) : undefined,
            location: importRow.location ? String(importRow.location) : undefined,
            reorderLevel: importRow.reorderLevel !== undefined ? Number(importRow.reorderLevel) : undefined,
            barcode: importRow.barcode ? String(importRow.barcode) : undefined,
            notes: importRow.notes ? String(importRow.notes) : undefined,
            supplier: importRow.supplier ? String(importRow.supplier) : undefined,
            supplierWebsite: importRow.supplierWebsite ? String(importRow.supplierWebsite) : undefined,
            project: importRow.project ? String(importRow.project) : undefined,
            orderStatus: importRow.orderStatus || 'delivered', // Default status
            deliveryPercentage: importRow.deliveryPercentage !== undefined ? Number(importRow.deliveryPercentage) : 100,
            expectedDeliveryDate: importRow.expectedDeliveryDate ? new Date(importRow.expectedDeliveryDate) : undefined,
            lastUpdated: new Date(), // Set timestamp for new item
          };
          newItems.push(newItem); // Collect new item
          importedCount++;
        }
      });

      // Update the state in one go for better performance
      setItems(prevItems => {
        // Apply updates
        const itemsAfterUpdate = prevItems.map(item => updatedItemsMap.get(item.id) || item);
        // Add new items
        return [...itemsAfterUpdate, ...newItems];
      });

      // Optionally add history entries for imported items (can be verbose)
      // Consider adding a single history entry summarizing the import

      resolve({ importedCount, skippedCount });
    });
  }, [items]); // Depend on items to get the latest list for checking existence
  
  // Save items whenever they change
  useEffect(() => {
    if (!loading) {
      console.log('Saving items to localStorage:', items.length);
      saveItems(items);
    }
  }, [items, loading]);

  return {
    items,
    setItems,
    history,
    loading,
    categories,
    units,
    locations,
    suppliers,
    projects,
    cabinets,
    getItemById,
    addItem,
    updateItem,
    deleteItem,
    adjustQuantity,
    updateSettingsList,
    importItems,
  };
}