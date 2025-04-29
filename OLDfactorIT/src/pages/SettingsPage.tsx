import { useState, useEffect, useRef } from 'react'
import { Save, GripVertical, AlertCircle, Download, Upload, Trash2, Pencil, UserPlus, Shield, Key, Camera, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { getItems, saveItems, getSettings, saveSettings, STORAGE_KEYS } from '@/lib/storageService'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import { InventoryItem, CategoryNode, ItemWithSubcategories } from '@/types/inventory'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAuth } from '@/contexts/AuthContext'
import { Label } from "@/components/ui/label"
import { getPasswordError } from '@/utils/passwordUtils'
import { EditableItemWithSubcategoriesList } from '@/components/EditableItemWithSubcategoriesList'
import { CategoryTreeManager } from '@/components/CategoryTreeManager'
import { v4 as uuidv4 } from 'uuid'
import CabinetManagement from './CabinetManagement'
import { DataBackupTab } from "@/components/settings/DataBackupTab"
import { GeneralSettingsTab } from '@/components/settings/GeneralSettingsTab'
import { CameraSettingsDialog } from '@/components/CameraSettingsDialog'
import * as XLSX from 'xlsx'
import { SystemLogs } from '@/components/settings/SystemLogs'
import AddUserDialog from '@/components/AddUserDialog'

interface SettingsState {
  categories: ItemWithSubcategories[];
  units: ItemWithSubcategories[];
  locations: ItemWithSubcategories[];
  suppliers: ItemWithSubcategories[];
  projects: ItemWithSubcategories[];
}

type SettingsKey = keyof SettingsState;

interface ListInfo {
  list: ItemWithSubcategories[];
  title: string;
  key: SettingsKey;
  description: string;
}

const listInfo: Record<SettingsKey, { title: string; description: string }> = {
  categories: {
    title: 'Categories',
    description: 'Manage categories and subcategories for organizing your inventory items'
  },
  units: {
    title: 'Units',
    description: 'Manage units of measurement for your inventory items'
  },
  locations: {
    title: 'Locations',
    description: 'Manage storage locations for your inventory items'
  },
  suppliers: {
    title: 'Suppliers',
    description: 'Manage suppliers for your inventory items'
  },
  projects: {
    title: 'Projects',
    description: 'Manage projects for your inventory items'
  }
};

// Define User type locally for now
type User = {
  id: string;
  username: string;
  displayName: string;
  password: string;
  role: 'admin' | 'user' | 'viewer';
  securityQuestion: string;
  securityAnswer: string;
  phoneExtension?: string;
};

export default function SettingsPage() {
  const { currentUser, logout } = useAuth();
  
  // Initialize states from URL parameters
  const [mainTab, setMainTab] = useState(() => {
    // Get tab from URL query parameter
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    // If tab is 'users', set mainTab to 'users', if 'test' set to 'test', otherwise default to 'lists'
    if (tab === 'users') return 'users';
    if (tab === 'test') return 'test';
    return 'lists';
  });
  
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    return tab || 'categories';
  });

  // Update URL when tabs change
  useEffect(() => {
    const url = new URL(window.location.href);
    if (mainTab === 'users') {
      url.searchParams.set('tab', 'users');
    } else {
      url.searchParams.set('tab', activeTab);
    }
    window.history.replaceState({}, '', url.toString());
  }, [mainTab, activeTab]);

  const [settings, setSettings] = useState<SettingsState>({
    categories: [],
    units: [],
    locations: [],
    suppliers: [],
    projects: []
  });

  const [showReconcileDialog, setShowReconcileDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{type: string, value: string} | null>(null)
  const [affectedItemsCount, setAffectedItemsCount] = useState<number>(0)
  const [reconcileAction, setReconcileAction] = useState<'delete' | 'replace'>('delete')
  const [replacementValue, setReplacementValue] = useState('')
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [resettingUser, setResettingUser] = useState<User | null>(null)
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);

  const [importDuplicates, setImportDuplicates] = useState<{
    type: SettingsKey;
    existing: ItemWithSubcategories[];
    imported: any[];
  } | null>(null);
  const [importDuplicateAction, setImportDuplicateAction] = useState<'skip' | 'replace' | 'merge'>('skip');
  const [importInProgress, setImportInProgress] = useState<{
    data: any;
    fileType: 'json' | 'excel';
    file: File;
  } | null>(null);

  // Add a new state variable for the import success dialog near other state variables
  const [importSuccess, setImportSuccess] = useState<{
    itemCounts: Record<string, number>;
    fileType: 'json' | 'excel';
  } | null>(null);

  const listMap: Record<SettingsKey, ListInfo> = {
    categories: { 
      list: settings.categories, 
      title: 'Categories', 
      key: 'categories',
      description: 'Manage categories and subcategories for organizing your inventory items'
    },
    units: { 
      list: settings.units, 
      title: 'Units', 
      key: 'units',
      description: 'Manage units'
    },
    locations: { 
      list: settings.locations, 
      title: 'Locations', 
      key: 'locations',
      description: 'Manage storage locations for your inventory items'
    },
    suppliers: { 
      list: settings.suppliers, 
      title: 'Suppliers', 
      key: 'suppliers',
      description: 'Manage suppliers for your inventory items'
    },
    projects: { 
      list: settings.projects, 
      title: 'Projects', 
      key: 'projects',
      description: 'Manage projects for your inventory items'
    }
  };

  const updateSettingsList = (key: SettingsKey, newValue: ItemWithSubcategories[]) => {
    setSettings(prev => ({
      ...prev,
      [key]: newValue
    }))
    // Update settings using the new interface
    saveSettings({
      ...settings,
      [key]: newValue
    });
  };

  useEffect(() => {
    const loadSettings = () => {
      // Use the new getSettings interface that returns all settings at once
      const savedSettings = getSettings();
      setSettings(savedSettings);
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const savedUsers = localStorage.getItem('inventory-users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    }
  }, []);

  const saveAllSettings = () => {
    try {
      // Use the new saveSettings interface that takes all settings at once
      saveSettings(settings);
      toast.success("Settings saved successfully!")
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings")
    }
  }

  const saveUsers = (newUsers: User[]) => {
    localStorage.setItem('inventory-users', JSON.stringify(newUsers));
    setUsers(newUsers);
  };

  const handleAddItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    if (value && !list.includes(value)) {
      setList([...list, value]) // Add to end
    }
  }

  const handleRemoveItemCheck = (typeTitle: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    const items = getItems()
    const typeKey = listMap[activeTab as keyof typeof listMap].key as keyof InventoryItem;
    const affected = items.filter(item => item[typeKey] === value)

    if (affected.length > 0) {
      setItemToDelete({type: typeTitle, value}) // Store Title (e.g., "Categories")
      setAffectedItemsCount(affected.length)
      setReconcileAction('delete'); // Default action
      setReplacementValue(''); // Reset replacement value
      setShowReconcileDialog(true)
    } else {
      // No items affected, just remove
      setList(list.filter(item => item !== value))
    }
  }

  const handleReconcileConfirm = () => {
    if (!itemToDelete) return;

    const { type, value } = itemToDelete;
    const typeKey = type.toLowerCase();

    // Find the correct settings key for this item type
    let settingsKey: SettingsKey;
    switch (typeKey) {
      case 'categories':
        settingsKey = 'categories';
        break;
      case 'units':
        settingsKey = 'units';
        break;
      case 'locations':
        settingsKey = 'locations';
        break;
      case 'suppliers':
        settingsKey = 'suppliers';
        break;
      case 'projects':
        settingsKey = 'projects';
        break;
      default:
        // Handle singular form of the types
        settingsKey = (typeKey.endsWith('y') ? 
          typeKey.slice(0, -1) + 'ies' : 
          typeKey.endsWith('s') ? 
            typeKey : 
            typeKey + 's') as SettingsKey;
    }

    // 1. Update the settings list
    const newList = settings[settingsKey].filter(item => item.name !== value);
    updateSettingsList(settingsKey, newList);

    // 2. Update affected inventory items
    const items = getItems();
    let updatedItems = items;
    let toastMessage = "";

    // For singular key name in inventory items (category instead of categories)
    const itemKey = typeKey.endsWith('ies') ? 
      typeKey.slice(0, -3) + 'y' : 
      typeKey.endsWith('s') ? 
        typeKey.slice(0, -1) : 
        typeKey;

    if (reconcileAction === 'replace' && replacementValue) {
      updatedItems = items.map(item => {
        if (item[itemKey as keyof InventoryItem] === value) {
          return { ...item, [itemKey]: replacementValue };
        }
        return item;
      });
      toastMessage = `Updated ${affectedItemsCount} items: Replaced "${value}" with "${replacementValue}" in ${typeKey}.`;
    } else { // 'delete' action
      updatedItems = items.map(item => {
        if (item[itemKey as keyof InventoryItem] === value) {
          const newItem = { ...item };
          delete newItem[itemKey as keyof InventoryItem];
          return newItem;
        }
        return item;
      });
      toastMessage = `Removed "${value}" from ${affectedItemsCount} items.`;
    }

    saveItems(updatedItems);
    toast.success(toastMessage);

    setShowReconcileDialog(false);
    setItemToDelete(null);
    setAffectedItemsCount(0);
    setReplacementValue('');
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const getCurrentListInfo = () => {
    const listMap: Record<string, { list: ItemWithSubcategories[]; settingsKey: SettingsKey }> = {
      categories: { list: settings.categories, settingsKey: 'categories' },
      units: { list: settings.units, settingsKey: 'units' },
      locations: { list: settings.locations, settingsKey: 'locations' },
      suppliers: { list: settings.suppliers, settingsKey: 'suppliers' },
      projects: { list: settings.projects, settingsKey: 'projects' }
    };
    return listMap[activeTab];
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const { list, settingsKey } = getCurrentListInfo();
      const oldIndex = list.findIndex(item => item.id === active.id);
      const newIndex = list.findIndex(item => item.id === over.id);

      const newList = arrayMove(list, oldIndex, newIndex);
      updateSettingsList(settingsKey, newList);
    }
  };

  const importConfiguration = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        
        // Validate the configuration structure
        const requiredKeys = ['categories', 'units', 'locations', 'suppliers', 'projects'];
        if (!requiredKeys.every(key => Array.isArray(config[key]))) {
          throw new Error('Invalid configuration format');
        }

        // Import all settings at once
        saveSettings({
          categories: config.categories,
          units: config.units,
          locations: config.locations,
          suppliers: config.suppliers,
          projects: config.projects
        });

        // Refresh the UI
        setSettings({
          categories: config.categories,
          units: config.units,
          locations: config.locations,
          suppliers: config.suppliers,
          projects: config.projects
        });

        toast.success("Configuration imported successfully");
      } catch (error) {
        toast.error("Failed to import configuration. Please check the file format.");
      }
    };
    reader.readAsText(file);
  };

  const exportConfiguration = () => {
    const config = {
      ...settings,
      generalSettings: null, // We'll handle general settings separately if needed
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trackIT_config_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("Configuration exported successfully");
  };

  const handleImportData = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          console.log("Processing JSON file:", file.name);
          const data = JSON.parse(e.target?.result as string);
          
          // Validate data structure
          if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format');
          }
          console.log("JSON data parsed successfully:", Object.keys(data));
          
          // Process and ensure all items have IDs
          if (data.inventory && Array.isArray(data.inventory)) {
            console.log("Inventory items found in JSON:", data.inventory.length);
            // Ensure each inventory item has an ID
            data.inventory = data.inventory.map((item: any) => {
              if (!item.id) {
                return { ...item, id: uuidv4() };
              }
              return item;
            });
          }
          
          // Process settings data to ensure IDs
          ['categories', 'units', 'locations', 'suppliers', 'projects'].forEach(key => {
            if (data[key] && Array.isArray(data[key])) {
              console.log(`${key} found in JSON:`, data[key].length);
              // Ensure each item has an ID
              data[key] = data[key].map((item: any) => {
                if (!item.id) {
                  return { ...item, id: uuidv4() };
                }
                return item;
              });
            }
          });
          
          if (data.inventory) {
            console.log("Inventory items found in JSON:", data.inventory.length);
          }

          setImportInProgress({
            data,
            fileType: 'json',
            file
          });
          
          // Check for duplicates and potential conflicts
          checkForDuplicates(data);
          
          if (!importDuplicates) {
            // No duplicates, proceed with import
            console.log("No duplicates found, proceeding with import");
            processImport(data);
            toast.success("Data imported successfully");
            resolve();
          } else {
            // Duplicates found, dialog will handle the rest
            // Resolution will be handled through the dialog
            // The dialog will call processImport when user confirms
            resolve();
          }
        } catch (error) {
          console.error("Error importing JSON:", error);
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleImportExcel = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            throw new Error("Failed to read Excel file");
          }
          
          console.log("Processing Excel file:", file.name);
          // Parse the Excel file
          const workbook = XLSX.read(data, { type: 'array' });
          console.log("Excel sheets found:", workbook.SheetNames);
          
          // Extract data from worksheets
          const importedData: any = {};
          
          // Import inventory items
          if (workbook.SheetNames.includes("Inventory")) {
            const inventorySheet = workbook.Sheets["Inventory"];
            const inventoryItems = XLSX.utils.sheet_to_json(inventorySheet);
            console.log("Inventory items found in Excel:", inventoryItems.length);
            
            // Process dates - XLSX might parse dates as numbers, need to convert them
            const processedItems = inventoryItems.map((item: any) => {
              const processedItem = { ...item };
              
              // Ensure item has an ID
              if (!processedItem.id) {
                processedItem.id = uuidv4();
                console.log("Generated new ID for item:", processedItem.name || "unnamed item");
              }
              
              // Convert date fields if they exist
              ['lastUpdated', 'dateInService', 'lastMaintenanceDate', 'nextMaintenanceDate', 'expectedDeliveryDate'].forEach(field => {
                if (processedItem[field]) {
                  // Handle Excel date format (number of days since 1900-01-01)
                  if (typeof processedItem[field] === 'number') {
                    processedItem[field] = new Date(Math.round((processedItem[field] - 25569) * 86400 * 1000));
                  } else {
                    processedItem[field] = new Date(processedItem[field]);
                  }
                }
              });
              return processedItem;
            });
            
            importedData.inventory = processedItems;
          }
          
          // Import categories, units, locations, suppliers, projects
          ['Categories', 'Units', 'Locations', 'Suppliers', 'Projects'].forEach(sheetName => {
            if (workbook.SheetNames.includes(sheetName)) {
              const sheet = workbook.Sheets[sheetName];
              const items = XLSX.utils.sheet_to_json(sheet);
              console.log(`${sheetName} found in Excel:`, items.length);
              
              // Ensure each item has an ID
              const itemsWithIds = items.map((item: any) => {
                if (!item.id) {
                  return { ...item, id: uuidv4() };
                }
                return item;
              });
              
              importedData[sheetName.toLowerCase()] = itemsWithIds;
            }
          });

          setImportInProgress({
            data: importedData,
            fileType: 'excel',
            file
          });

          // Check for duplicates
          checkForDuplicates(importedData);
          
          if (!importDuplicates) {
            // No duplicates, proceed with import
            console.log("No duplicates found, proceeding with import");
            processImport(importedData);
            toast.success("Data imported from Excel successfully");
            resolve();
          } else {
            // Duplicates found, dialog will handle
            resolve();
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read Excel file'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Check for duplicate items in imported data
  const checkForDuplicates = (data: any) => {
    console.log("Checking for duplicates in imported data:", data);
    const settingsKeys: SettingsKey[] = ['categories', 'units', 'locations', 'suppliers', 'projects'];

    // First check inventory items if they exist
    if (data.inventory && Array.isArray(data.inventory)) {
      const existingItems = getItems();
      console.log("Existing inventory items:", existingItems.length);
      
      if (existingItems.length > 0) {
        // Find duplicate items by ID
        const duplicateItems = data.inventory.filter((imported: any) => 
          existingItems.some(existing => existing.id === imported.id)
        );
        
        if (duplicateItems.length > 0) {
          console.log("Found duplicate inventory items:", duplicateItems.length);
          setImportDuplicates({
            type: 'inventory' as any,
            existing: existingItems.filter(existing => 
              duplicateItems.some((dup: any) => dup.id === existing.id)
            ),
            imported: duplicateItems
          });
          return;
        }
      }
    }

    for (const key of settingsKeys) {
      if (!data[key] || !Array.isArray(data[key])) continue;

      // Get existing items
      const existingItems = settings[key];
      console.log(`Checking ${key}:`, data[key].length, "against", existingItems.length);
      
      // Find items with duplicate IDs or names
      const importedItems = data[key];
      const duplicateItems = importedItems.filter(imported => 
        existingItems.some(existing => 
          existing.id === imported.id || existing.name === imported.name
        )
      );

      if (duplicateItems.length > 0) {
        console.log(`Found duplicate ${key}:`, duplicateItems.length);
        // Get the existing items that conflict
        const existingDuplicates = existingItems.filter(existing => 
          importedItems.some(imported => 
            existing.id === imported.id || existing.name === imported.name
          )
        );

        setImportDuplicates({
          type: key,
          existing: existingDuplicates,
          imported: duplicateItems
        });
        return; // Stop at first duplicate type found
      }
    }

    console.log("No duplicates found in import data");
    // No duplicates found
    setImportDuplicates(null);
  };

  // Process the import based on user's decision
  const processImport = (data: any) => {
    const settingsKeys: SettingsKey[] = ['categories', 'units', 'locations', 'suppliers', 'projects'];
    const importedCounts: Record<string, number> = {};
    
    // Handle inventory separately if it exists
    if (data.inventory && Array.isArray(data.inventory)) {
      console.log(`Processing ${data.inventory.length} inventory items with action: ${importDuplicateAction}`);
      // Handle based on reconciliation choice
      if (importDuplicateAction === 'replace') {
        console.log("Replacing all inventory items");
        saveItems(data.inventory);
        importedCounts.inventory = data.inventory.length;
      } else if (importDuplicateAction === 'merge') {
        const existingItems = getItems();
        console.log("Merging inventory: existing:", existingItems.length);
        const newItems = data.inventory.filter((imported: any) => 
          !existingItems.some(existing => existing.id === imported.id)
        );
        console.log("New items to add:", newItems.length);
        saveItems([...existingItems, ...newItems]);
        importedCounts.inventory = newItems.length;
      } else if (importDuplicateAction === 'skip') {
        // For 'skip', we should still import items that don't exist yet
        const existingItems = getItems();
        console.log("Skipping duplicates: existing:", existingItems.length);
        const newItems = data.inventory.filter((imported: any) => 
          !existingItems.some(existing => existing.id === imported.id)
        );
        
        console.log("New non-duplicate items to add:", newItems.length);
        if (newItems.length > 0) {
          saveItems([...existingItems, ...newItems]);
          importedCounts.inventory = newItems.length;
        }
      }
    }
    
    // Process other settings data
    for (const key of settingsKeys) {
      if (!data[key] || !Array.isArray(data[key])) continue;
      
      if (importDuplicateAction === 'replace' || !importDuplicates) {
        // Replace all or no duplicates found
        updateSettingsList(key, data[key]);
        importedCounts[key] = data[key].length;
      } else if (importDuplicateAction === 'merge') {
        // Merge with existing, keeping existing when duplicates
        const existingItems = settings[key];
        const newItems = data[key].filter((imported: any) => 
          !existingItems.some(existing => 
            existing.id === imported.id || existing.name === imported.name
          )
        );
        updateSettingsList(key, [...existingItems, ...newItems]);
        importedCounts[key] = newItems.length;
      } else if (importDuplicateAction === 'skip') {
        // Skip importing any duplicates
        if (importDuplicates && importDuplicates.type === key) {
          // Remove duplicates from import data
          const importedWithoutDuplicates = data[key].filter((imported: any) => 
            !importDuplicates.existing.some(existing => 
              existing.id === imported.id || existing.name === imported.name
            )
          );
          // Merge non-duplicates with existing
          updateSettingsList(key, [...settings[key], ...importedWithoutDuplicates]);
          importedCounts[key] = importedWithoutDuplicates.length;
        } else {
          // This category doesn't have duplicates, import all
          updateSettingsList(key, [...settings[key], ...data[key]]);
          importedCounts[key] = data[key].length;
        }
      }
    }
    
    // Show success dialog with import details
    setImportSuccess({
      itemCounts: importedCounts,
      fileType: importInProgress?.fileType || 'json'
    });
    
    // Reset import state
    setImportDuplicates(null);
    setImportInProgress(null);
    setImportDuplicateAction('skip');
  };

  // Handle the import dialog confirmation
  const handleImportConfirm = () => {
    if (!importInProgress) return;
    
    processImport(importInProgress.data);
    toast.success(`Import complete. Check the summary for details.`);
  };

  const handleEditItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, oldValue: string, newValue: string, key: keyof typeof STORAGE_KEYS) => {
    if (!newValue.trim() || list.includes(newValue.trim())) {
      toast.error(newValue.trim() ? "This value already exists" : "Please enter a value");
      return;
    }

    // Check if the item being edited is used in any inventory items
    const items = getItems();
    const typeKey = listMap[activeTab as keyof typeof listMap].key as keyof InventoryItem;
    const affected = items.filter(item => item[typeKey] === oldValue);

    // Update the list
    const updatedList = list.map(item => item === oldValue ? newValue.trim() : item);
    setList(updatedList);
    saveSettings({
      ...settings,
      [key]: updatedList
    });

    // Update any inventory items using this value
    if (affected.length > 0) {
      const updatedItems = items.map(item => {
        if (item[typeKey] === oldValue) {
          return { ...item, [typeKey]: newValue.trim() };
        }
        return item
      });
      saveItems(updatedItems);
      toast.success(`Updated ${affected.length} items with the new value`);
    } else {
      toast.success("Value updated successfully");
    }
  };

  const handleAddUser = (newUser: Omit<User, 'id'>) => {
    const userExists = users.some(u => u.username === newUser.username);
    if (userExists) {
      toast.error("Username already exists");
      return;
    }

    const user: User = {
      ...newUser,
      id: crypto.randomUUID()
    };

    saveUsers([...users, user]);
    toast.success("User added successfully");
  };

  const handleEditUser = (userId: string, updates: Partial<User>) => {
    // Only allow admins to change roles
    if (updates.role && currentUser?.role !== 'admin') {
      toast.error("Only administrators can change user roles");
      return;
    }

    // Users can only edit their own profile unless they're an admin
    if (userId !== currentUser?.id && currentUser?.role !== 'admin') {
      toast.error("You can only edit your own profile");
      return;
    }

    // Don't allow users to change their own role
    if (userId === currentUser?.id && updates.role && updates.role !== currentUser.role) {
      toast.error("You cannot change your own role");
      return;
    }

    const updatedUsers = users.map(u => 
      u.id === userId ? { ...u, ...updates } : u
    );
    saveUsers(updatedUsers);
    toast.success("User profile updated");
  };

  const handleUpdateRole = (userId: string, newRole: 'admin' | 'user' | 'viewer') => {
    if (currentUser?.role !== 'admin') {
      toast.error("Only administrators can change user roles");
      return;
    }

    if (userId === currentUser?.id) {
      toast.error("You cannot change your own role");
      return;
    }

    const updatedUsers = users.map(u => 
      u.id === userId ? { ...u, role: newRole } : u
    );
    saveUsers(updatedUsers);
    toast.success("User role updated");
  };

  const handleRemoveUser = (userId: string) => {
    if (currentUser?.role !== 'admin') {
      toast.error("Only administrators can remove users");
      return;
    }

    if (userId === currentUser?.id) {
      toast.error("You cannot remove your own account");
      return;
    }
    
    const updatedUsers = users.filter(u => u.id !== userId);
    saveUsers(updatedUsers);
    toast.success("User removed");
  };

  const handleResetPassword = async (username: string, newPassword: string) => {
    try {
      // TODO: Implement password reset logic
      toast.success("Password reset functionality not implemented yet");
    } catch (error) {
      toast.error("Failed to reset password");
    }
  };

  const renderUsersList = () => {
    if (!currentUser) return null;

    return users.map(u => (
      <div
        key={u.id}
        className="flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => {
          // Only allow users to edit their own profile unless they're an admin
          if (u.id === currentUser.id || currentUser.role === 'admin') {
            setEditingUser(u);
          }
        }}
      >
        <div className="flex items-center space-x-4">
          <div>
            <p className="font-medium">{u.displayName}</p>
            <p className="text-sm text-muted-foreground">@{u.username}</p>
          </div>
          <Badge variant={u.role === 'admin' ? 'default' : u.role === 'user' ? 'secondary' : 'outline'}>
            {u.role}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {currentUser.role === 'admin' && u.id !== currentUser.id && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setResettingUser(u);
                }}
                title="Reset Password"
              >
                <Key className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveUser(u.id);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      </div>
    ));
  };

  // Add these functions to handle data import, export, backup and restore
  const handleExportData = () => {
    try {
      const data = {
        locations: settings.locations,
        categories: settings.categories,
        units: settings.units,
        suppliers: settings.suppliers,
        projects: settings.projects,
        // Include any other data you want to export
        settings: {} // Add your settings here
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'trackIT-data-export.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unknown error occurred");
    }
  };

  const handleBackupData = () => {
    try {
      const backupData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        data: {
          locations: settings.locations,
          categories: settings.categories,
          units: settings.units,
          suppliers: settings.suppliers,
          projects: settings.projects,
          // Add other data you want to backup
          settings: {} // Add your settings here
        }
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trackIT-backup-${new Date().toISOString().split('T')[0]}.backup`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Backup created successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unknown error occurred");
    }
  };

  const handleRestoreData = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const backupData = JSON.parse(e.target?.result as string);
          
          // Validate backup structure
          if (!backupData || !backupData.version || !backupData.data) {
            throw new Error('Invalid backup format');
          }
          
          // Replace all data with backup data
          const { data } = backupData;
          
          setSettings({
            locations: data.locations || [],
            categories: data.categories || [],
            units: data.units || [],
            suppliers: data.suppliers || [],
            projects: data.projects || [],
          });
          
          toast.success("Backup restored successfully");
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  // Add Excel export function to handle Excel export
  const handleExportExcel = () => {
    try {
      // Create a data object similar to handleExportData
      const data = {
        locations: settings.locations,
        categories: settings.categories,
        units: settings.units,
        suppliers: settings.suppliers,
        projects: settings.projects,
        inventory: getItems()
      };
      
      // Create a worksheet from the data
      const workbook = XLSX.utils.book_new();
      
      // Create a separate worksheet for each data type
      const inventoryWorksheet = XLSX.utils.json_to_sheet(data.inventory);
      XLSX.utils.book_append_sheet(workbook, inventoryWorksheet, "Inventory");
      
      const categoriesWorksheet = XLSX.utils.json_to_sheet(data.categories);
      XLSX.utils.book_append_sheet(workbook, categoriesWorksheet, "Categories");
      
      const unitsWorksheet = XLSX.utils.json_to_sheet(data.units);
      XLSX.utils.book_append_sheet(workbook, unitsWorksheet, "Units");
      
      const locationsWorksheet = XLSX.utils.json_to_sheet(data.locations);
      XLSX.utils.book_append_sheet(workbook, locationsWorksheet, "Locations");
      
      const suppliersWorksheet = XLSX.utils.json_to_sheet(data.suppliers);
      XLSX.utils.book_append_sheet(workbook, suppliersWorksheet, "Suppliers");
      
      const projectsWorksheet = XLSX.utils.json_to_sheet(data.projects);
      XLSX.utils.book_append_sheet(workbook, projectsWorksheet, "Projects");
      
      // Generate the Excel file
      XLSX.writeFile(workbook, `trackIT-data-export-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success("Data exported to Excel successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unknown error occurred during Excel export");
    }
  };

  return (
    <div className="container max-w-6xl py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-800">Settings</h1>
        <div className="flex gap-2">
          <Button onClick={saveAllSettings} className="bg-gray-800 hover:bg-gray-700">
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>

      <Alert className="mb-6 bg-gray-50 text-gray-800 border-gray-300">
        <AlertCircle className="h-4 w-4 text-gray-700" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription className="text-gray-600">
          Changes to categories, units, and other settings may affect existing inventory items. 
          When removing a value that's in use, you'll be prompted to either remove it from items or replace it.
          Consider exporting your configuration before making significant changes.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="general" className="border-gray-200">
        <TabsList className="mb-4 bg-gray-100">
          <TabsTrigger value="general" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">General Settings</TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">Categories</TabsTrigger>
          <TabsTrigger value="suppliers" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">Suppliers</TabsTrigger>
          <TabsTrigger value="units" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">Units</TabsTrigger>
          <TabsTrigger value="locations" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">Locations</TabsTrigger>
          <TabsTrigger value="projects" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">Projects</TabsTrigger>
          <TabsTrigger value="cabinets" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">Cabinets</TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">Users</TabsTrigger>
          <TabsTrigger value="data" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">Data Management</TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">System Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettingsTab onOpenCameraSettings={() => setIsCameraDialogOpen(true)} />
        </TabsContent>

        <TabsContent value="categories">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                Define and organize categories for inventory items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EditableItemWithSubcategoriesList
                items={settings.categories}
                setItems={(newItems) => updateSettingsList('categories', newItems)}
                title="Categories"
                onCheckBeforeDelete={(value, onSafeToDelete) => {
                  // Check if this category is being used in any inventory items
                  const items = getItems();
                  const affectedItems = items.filter(item => item.category === value);
                  
                  if (affectedItems.length > 0) {
                    // Show reconciliation dialog
                    setItemToDelete({type: 'Categories', value});
                    setAffectedItemsCount(affectedItems.length);
                    setReconcileAction('delete');
                    setReplacementValue('');
                    setShowReconcileDialog(true);
                  } else {
                    // Safe to delete
                    onSafeToDelete();
                  }
                }}
              />
              
              <div className="mt-6 border-t pt-4">
                <h3 className="text-md font-medium mb-2 text-gray-800">Fix Unreconciled Items</h3>
                <p className="text-sm text-gray-500 mb-4">
                  If you have inventory items showing categories that no longer exist in your list, 
                  you can clean them up with this tool.
                </p>
                <Button 
                  variant="outline" 
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
                  onClick={() => {
                    // Get all inventory items
                    const items = getItems();
                    // Get list of valid categories
                    const validCategories = settings.categories.map(cat => cat.name);
                    
                    // Find items with invalid categories
                    const itemsWithInvalidCategories = items.filter(
                      item => item.category && !validCategories.includes(item.category)
                    );
                    
                    if (itemsWithInvalidCategories.length === 0) {
                      toast.info("No inventory items with invalid categories found");
                      return;
                    }
                    
                    // Fix the items by removing invalid categories
                    const fixedItems = items.map(item => {
                      if (item.category && !validCategories.includes(item.category)) {
                        // Make a copy of the item
                        const newItem = { ...item };
                        // Store the invalid category in a custom field for reference
                        newItem.customFields = { 
                          ...newItem.customFields, 
                          previousCategory: item.category 
                        };
                        // Remove the invalid category
                        delete newItem.category;
                        return newItem;
                      }
                      return item;
                    });
                    
                    // Save the fixed items
                    saveItems(fixedItems);
                    
                    toast.success(`Fixed ${itemsWithInvalidCategories.length} items with invalid categories`);
                  }}
                >
                  Fix Unreconciled Items
        </Button>
              </div>
            </CardContent>
          </Card>
          
          <Alert className="bg-gray-50 text-gray-800 border-gray-300">
            <AlertCircle className="h-4 w-4 text-gray-700" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription className="text-gray-600">
              Changes to categories may affect existing inventory items. 
              When removing a category that's in use, you'll be prompted to either remove it from items or replace it.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="suppliers">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Suppliers</CardTitle>
              <CardDescription>
                Manage suppliers for your inventory items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EditableItemWithSubcategoriesList
                items={settings.suppliers}
                setItems={(newItems) => updateSettingsList('suppliers', newItems)}
                title="Suppliers"
                enableSubcategories={false}
                onCheckBeforeDelete={(value, onSafeToDelete) => {
                  // Check if this supplier is being used in any inventory items
                  const items = getItems();
                  const affectedItems = items.filter(item => item.supplier === value);
                  
                  if (affectedItems.length > 0) {
                    // Show reconciliation dialog
                    setItemToDelete({type: 'Suppliers', value});
                    setAffectedItemsCount(affectedItems.length);
                    setReconcileAction('delete');
                    setReplacementValue('');
                    setShowReconcileDialog(true);
                  } else {
                    // Safe to delete
                    onSafeToDelete();
                  }
                }}
              />
              
              <div className="mt-6 border-t pt-4">
                <h3 className="text-md font-medium mb-2 text-gray-800">Fix Unreconciled Items</h3>
                <p className="text-sm text-gray-500 mb-4">
                  If you have inventory items showing suppliers that no longer exist in your list, 
                  you can clean them up with this tool.
                </p>
                <Button 
                  variant="outline" 
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
                  onClick={() => {
                    // Get all inventory items
                    const items = getItems();
                    // Get list of valid suppliers
                    const validSuppliers = settings.suppliers.map(sup => sup.name);
                    
                    // Find items with invalid suppliers
                    const itemsWithInvalidSuppliers = items.filter(
                      item => item.supplier && !validSuppliers.includes(item.supplier)
                    );
                    
                    if (itemsWithInvalidSuppliers.length === 0) {
                      toast.info("No inventory items with invalid suppliers found");
                      return;
                    }
                    
                    // Fix the items by removing invalid suppliers
                    const fixedItems = items.map(item => {
                      if (item.supplier && !validSuppliers.includes(item.supplier)) {
                        // Make a copy of the item
                        const newItem = { ...item };
                        // Store the invalid supplier in a custom field for reference
                        newItem.customFields = { 
                          ...newItem.customFields, 
                          previousSupplier: item.supplier 
                        };
                        // Remove the invalid supplier
                        delete newItem.supplier;
                        return newItem;
                      }
                      return item;
                    });
                    
                    // Save the fixed items
                    saveItems(fixedItems);
                    
                    toast.success(`Fixed ${itemsWithInvalidSuppliers.length} items with invalid suppliers`);
                  }}
                >
                  Fix Unreconciled Items
          </Button>
        </div>
            </CardContent>
          </Card>
          
          <Alert className="bg-gray-50 text-gray-800 border-gray-300">
            <AlertCircle className="h-4 w-4 text-gray-700" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription className="text-gray-600">
              Changes to suppliers may affect existing inventory items. 
              When removing a supplier that's in use, you'll be prompted to either remove it from items or replace it.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="units">
          <Card className="mb-6">
                  <CardHeader>
              <CardTitle>Units</CardTitle>
              <CardDescription>
                Manage units of measurement for your inventory items
              </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <EditableItemWithSubcategoriesList
                items={settings.units}
                setItems={(newItems) => updateSettingsList('units', newItems)}
                title="Units"
                onCheckBeforeDelete={(value, onSafeToDelete) => {
                  // Check if this unit is being used in any inventory items
                  const items = getItems();
                  const affectedItems = items.filter(item => item.unit === value);
                  
                  if (affectedItems.length > 0) {
                    // Show reconciliation dialog
                    setItemToDelete({type: 'Units', value});
                    setAffectedItemsCount(affectedItems.length);
                    setReconcileAction('delete');
                    setReplacementValue('');
                    setShowReconcileDialog(true);
                  } else {
                    // Safe to delete
                    onSafeToDelete();
                  }
                }}
              />
              
              <div className="mt-6 border-t pt-4">
                <h3 className="text-md font-medium mb-2 text-gray-800">Fix Unreconciled Items</h3>
                <p className="text-sm text-gray-500 mb-4">
                  If you have inventory items showing units that no longer exist in your list, 
                  you can clean them up with this tool.
                </p>
                <Button 
                  variant="outline" 
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
                  onClick={() => {
                    // Get all inventory items
                    const items = getItems();
                    // Get list of valid units
                    const validUnits = settings.units.map(unit => unit.name);
                    
                    // Find items with invalid units
                    const itemsWithInvalidUnits = items.filter(
                      item => item.unit && !validUnits.includes(item.unit)
                    );
                    
                    if (itemsWithInvalidUnits.length === 0) {
                      toast.info("No inventory items with invalid units found");
                      return;
                    }
                    
                    // Fix the items by setting a default unit
                    const defaultUnit = validUnits.length > 0 ? validUnits[0] : "each";
                    const fixedItems = items.map(item => {
                      if (item.unit && !validUnits.includes(item.unit)) {
                        // Make a copy of the item
                        const newItem = { ...item };
                        // Store the invalid unit in a custom field for reference
                        newItem.customFields = { 
                          ...newItem.customFields, 
                          previousUnit: item.unit 
                        };
                        // Set a default unit (unlike categories, units are required)
                        newItem.unit = defaultUnit;
                        return newItem;
                      }
                      return item;
                    });
                    
                    // Save the fixed items
                    saveItems(fixedItems);
                    
                    toast.success(`Fixed ${itemsWithInvalidUnits.length} items with invalid units`);
                  }}
                >
                  Fix Unreconciled Items
                </Button>
              </div>
                  </CardContent>
                </Card>
        </TabsContent>

        <TabsContent value="locations">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Locations</CardTitle>
              <CardDescription>
                Manage storage locations for your inventory items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EditableItemWithSubcategoriesList
                items={settings.locations}
                setItems={(newItems) => updateSettingsList('locations', newItems)}
                title="Locations"
                onCheckBeforeDelete={(value, onSafeToDelete) => {
                  // Check if this location is being used in any inventory items
                  const items = getItems();
                  const affectedItems = items.filter(item => item.location === value);
                  
                  if (affectedItems.length > 0) {
                    // Show reconciliation dialog
                    setItemToDelete({type: 'Locations', value});
                    setAffectedItemsCount(affectedItems.length);
                    setReconcileAction('delete');
                    setReplacementValue('');
                    setShowReconcileDialog(true);
                  } else {
                    // Safe to delete
                    onSafeToDelete();
                  }
                }}
              />
              
              <div className="mt-6 border-t pt-4">
                <h3 className="text-md font-medium mb-2 text-gray-800">Fix Unreconciled Items</h3>
                <p className="text-sm text-gray-500 mb-4">
                  If you have inventory items showing locations that no longer exist in your list, 
                  you can clean them up with this tool.
                </p>
                <Button 
                  variant="outline" 
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
                  onClick={() => {
                    // Get all inventory items
                    const items = getItems();
                    // Get list of valid locations
                    const validLocations = settings.locations.map(loc => loc.name);
                    
                    // Find items with invalid locations
                    const itemsWithInvalidLocations = items.filter(
                      item => item.location && !validLocations.includes(item.location)
                    );
                    
                    if (itemsWithInvalidLocations.length === 0) {
                      toast.info("No inventory items with invalid locations found");
                      return;
                    }
                    
                    // Fix the items by removing invalid locations
                    const fixedItems = items.map(item => {
                      if (item.location && !validLocations.includes(item.location)) {
                        // Make a copy of the item
                        const newItem = { ...item };
                        // Store the invalid location in a custom field for reference
                        newItem.customFields = { 
                          ...newItem.customFields, 
                          previousLocation: item.location 
                        };
                        // Remove the invalid location
                        delete newItem.location;
                        return newItem;
                      }
                      return item;
                    });
                    
                    // Save the fixed items
                    saveItems(fixedItems);
                    
                    toast.success(`Fixed ${itemsWithInvalidLocations.length} items with invalid locations`);
                  }}
                >
                  Fix Unreconciled Items
              </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Projects</CardTitle>
              <CardDescription>
                Manage projects for your inventory items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EditableItemWithSubcategoriesList
                items={settings.projects}
                setItems={(newItems) => updateSettingsList('projects', newItems)}
                title="Projects"
                onCheckBeforeDelete={(value, onSafeToDelete) => {
                  // Check if this project is being used in any inventory items
                  const items = getItems();
                  const affectedItems = items.filter(item => item.project === value);
                  
                  if (affectedItems.length > 0) {
                    // Show reconciliation dialog
                    setItemToDelete({type: 'Projects', value});
                    setAffectedItemsCount(affectedItems.length);
                    setReconcileAction('delete');
                    setReplacementValue('');
                    setShowReconcileDialog(true);
                  } else {
                    // Safe to delete
                    onSafeToDelete();
                  }
                }}
              />
              
              <div className="mt-6 border-t pt-4">
                <h3 className="text-md font-medium mb-2 text-gray-800">Fix Unreconciled Items</h3>
                <p className="text-sm text-gray-500 mb-4">
                  If you have inventory items showing projects that no longer exist in your list, 
                  you can clean them up with this tool.
                </p>
                <Button 
                  variant="outline" 
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
                  onClick={() => {
                    // Get all inventory items
                    const items = getItems();
                    // Get list of valid projects
                    const validProjects = settings.projects.map(proj => proj.name);
                    
                    // Find items with invalid projects
                    const itemsWithInvalidProjects = items.filter(
                      item => item.project && !validProjects.includes(item.project)
                    );
                    
                    if (itemsWithInvalidProjects.length === 0) {
                      toast.info("No inventory items with invalid projects found");
                      return;
                    }
                    
                    // Fix the items by removing invalid projects
                    const fixedItems = items.map(item => {
                      if (item.project && !validProjects.includes(item.project)) {
                        // Make a copy of the item
                        const newItem = { ...item };
                        // Store the invalid project in a custom field for reference
                        newItem.customFields = { 
                          ...newItem.customFields, 
                          previousProject: item.project 
                        };
                        // Remove the invalid project
                        delete newItem.project;
                        return newItem;
                      }
                      return item;
                    });
                    
                    // Save the fixed items
                    saveItems(fixedItems);
                    
                    toast.success(`Fixed ${itemsWithInvalidProjects.length} items with invalid projects`);
                  }}
                >
                  Fix Unreconciled Items
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cabinets">
          <Card>
            <CardHeader>
              <CardTitle>Storage Cabinet Management</CardTitle>
              <CardDescription>
                Manage storage cabinets and their locations. Cabinets are assigned to existing locations from the Location Management list.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CabinetManagement 
                locations={settings.locations.map(loc => loc.name)} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>User Management</CardTitle>
              <Button onClick={() => setShowAddUserDialog(true)} className="flex items-center">
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </CardHeader>
            <CardContent>
              {renderUsersList()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <DataBackupTab
            onExportData={handleExportData}
            onExportExcel={handleExportExcel}
            onImportData={handleImportData}
            onImportExcel={handleImportExcel}
            onBackupData={handleBackupData}
            onRestoreData={handleRestoreData}
          />
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>View system activity and troubleshoot issues</CardDescription>
            </CardHeader>
            <CardContent>
              <SystemLogs />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddUserDialog
        open={showAddUserDialog}
        onOpenChange={setShowAddUserDialog}
        onAdd={handleAddUser}
      />

      {editingUser && (
        <EditUserDialog
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          user={editingUser as User}
          onSave={handleEditUser}
        />
      )}

      {resettingUser && (
        <AdminResetPasswordDialog
          open={!!resettingUser}
          onOpenChange={(open) => !open && setResettingUser(null)}
          user={resettingUser as User}
          onReset={handleResetPassword}
        />
      )}

      {/* Reconciliation Dialog */}
      <Dialog open={showReconcileDialog} onOpenChange={setShowReconcileDialog}>
        <DialogContent className="bg-gray-50 border-gray-300">
          <DialogHeader>
            <DialogTitle className="text-gray-800">Confirm Removal</DialogTitle>
            <DialogDescription className="text-gray-600">
              The {itemToDelete?.type.toLowerCase().slice(0, -1)} "{itemToDelete?.value}" is used by {affectedItemsCount} inventory items.
              What would you like to do?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-start space-x-2">
              <input
                type="radio"
                id="delete-option"
                name="reconcile-action"
                checked={reconcileAction === 'delete'}
                onChange={() => setReconcileAction('delete')}
                className="mt-1"
              />
              <div>
                <label htmlFor="delete-option" className="font-medium text-gray-800">Remove from items</label>
                <p className="text-sm text-gray-500">
                  Remove this {itemToDelete?.type.toLowerCase().slice(0, -1)} from all items that use it.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <input
                type="radio"
                id="replace-option"
                name="reconcile-action"
                checked={reconcileAction === 'replace'}
                onChange={() => setReconcileAction('replace')}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="replace-option" className="font-medium text-gray-800">Replace with another value</label>
                <p className="text-sm text-gray-500 mb-2">
                  Replace with another {itemToDelete?.type.toLowerCase().slice(0, -1)} in all affected items.
                </p>

                {reconcileAction === 'replace' && itemToDelete && (
                  <select
                    className="w-full p-2 border border-gray-300 rounded bg-white text-gray-800"
                    value={replacementValue}
                    onChange={(e) => setReplacementValue(e.target.value)}
                  >
                    <option value="">Select replacement...</option>
                    {settings[itemToDelete.type.toLowerCase() as SettingsKey]
                      .filter(item => item.name !== itemToDelete.value)
                      .map(item => (
                        <option key={item.id} value={item.name}>{item.name}</option>
                      ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReconcileDialog(false)} 
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300">
              Cancel
            </Button>
            <Button
              onClick={handleReconcileConfirm}
              disabled={reconcileAction === 'replace' && !replacementValue}
              className="bg-gray-800 hover:bg-gray-700"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Reconciliation Dialog */}
      <Dialog 
        open={!!importDuplicates} 
        onOpenChange={(open) => {
          if (!open) {
            setImportDuplicates(null);
            setImportInProgress(null);
          }
        }}
      >
        <DialogContent className="bg-gray-50 border-gray-300 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-800">Duplicate Items Found</DialogTitle>
            <DialogDescription className="text-gray-600">
              {importDuplicates && `Found ${importDuplicates.imported.length} duplicate ${importDuplicates.type} 
              in the import file that conflict with existing items. How would you like to handle these?`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-96 overflow-auto">
            <div className="flex items-start space-x-2">
              <input
                type="radio"
                id="skip-option"
                name="import-action"
                checked={importDuplicateAction === 'skip'}
                onChange={() => setImportDuplicateAction('skip')}
                className="mt-1"
              />
              <div>
                <label htmlFor="skip-option" className="font-medium text-gray-800">Skip duplicates</label>
                <p className="text-sm text-gray-500">
                  Import only new items and skip any duplicates found.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <input
                type="radio"
                id="replace-option"
                name="import-action"
                checked={importDuplicateAction === 'replace'}
                onChange={() => setImportDuplicateAction('replace')}
                className="mt-1"
              />
              <div>
                <label htmlFor="replace-option" className="font-medium text-gray-800">Replace existing items</label>
                <p className="text-sm text-gray-500">
                  Replace existing items with the imported versions.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <input
                type="radio"
                id="merge-option"
                name="import-action"
                checked={importDuplicateAction === 'merge'}
                onChange={() => setImportDuplicateAction('merge')}
                className="mt-1"
              />
              <div>
                <label htmlFor="merge-option" className="font-medium text-gray-800">Merge and keep existing</label>
                <p className="text-sm text-gray-500">
                  Import all items, but keep existing versions when duplicates are found.
                </p>
              </div>
            </div>

            {importDuplicates && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-800 mb-2">Duplicate {importDuplicates.type}:</h4>
                <div className="border rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importDuplicates.imported.slice(0, 10).map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">{item.name}</td>
                          <td className="px-4 py-2 text-amber-600">Duplicate</td>
                        </tr>
                      ))}
                      {importDuplicates.imported.length > 10 && (
                        <tr className="border-t">
                          <td colSpan={2} className="px-4 py-2 text-gray-500 italic">
                            And {importDuplicates.imported.length - 10} more...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setImportDuplicates(null);
                setImportInProgress(null);
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImportConfirm}
              className="bg-gray-800 hover:bg-gray-700"
            >
              Confirm Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isCameraDialogOpen && (
        <CameraSettingsDialog
          isOpen={isCameraDialogOpen}
          onClose={() => setIsCameraDialogOpen(false)}
        />
      )}

      {/* Import Success Dialog */}
      <Dialog 
        open={!!importSuccess} 
        onOpenChange={(open) => {
          if (!open) {
            setImportSuccess(null);
          }
        }}
      >
        <DialogContent className="bg-gray-50 border-gray-300 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-800">Import Successful</DialogTitle>
            <DialogDescription className="text-gray-600">
              The following items were imported from {importSuccess?.fileType === 'excel' ? 'Excel' : 'JSON'} file:
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              {importSuccess && Object.entries(importSuccess.itemCounts).map(([key, count]) => (
                <div key={key} className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium capitalize">{key}</span>
                  <span className="text-gray-900">{count} items</span>
                </div>
              ))}

              {importSuccess && Object.keys(importSuccess.itemCounts).length === 0 && (
                <p className="text-amber-600 italic text-center py-2">
                  No items were imported. Check if your file has the correct format.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setImportSuccess(null)}
              className="bg-gray-800 hover:bg-gray-700"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}