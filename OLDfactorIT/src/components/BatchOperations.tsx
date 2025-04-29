import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInventory } from '@/hooks/useInventory';
import { InventoryItem, CategoryNode, ItemWithSubcategories } from '@/types/inventory';
import { Cabinet } from '@/types/cabinets';
import { toast } from 'sonner';
import { Trash2, Edit2 } from 'lucide-react';
import { getItems } from '@/lib/storageService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logging';
import { DebugLogsButton } from '@/components/DebugLogsButton'

// Helper function to flatten categories
function flattenCategories(categories: CategoryNode[]): string[] {
  const flattened: string[] = [];
  
  const traverse = (node: CategoryNode, parentPath: string = '') => {
    const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
    flattened.push(currentPath);
    
    if (node.children) {
      node.children.forEach(child => traverse(child, currentPath));
    }
  };

  if (!categories || !Array.isArray(categories)) {
    return [];
  }

  categories.forEach(category => traverse(category));
  return flattened.sort();
}

// Add this function near the top with other helper functions
function flattenLocations(locations: ItemWithSubcategories[]): string[] {
  const flattened: string[] = [];
  
  const traverse = (node: ItemWithSubcategories, parentPath: string = '') => {
    const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
    flattened.push(currentPath);
    
    if (node.children) {
      node.children.forEach(child => traverse(child, currentPath));
    }
  };

  locations.forEach(location => traverse(location));
  return flattened.sort();
}

interface FlattenedLocation {
  id: string;
  name: string;
}

interface BatchOperationsProps {
  selectedItems: InventoryItem[];
  onClearSelection: () => void;
  onItemsUpdated: () => void;
  onDelete: (items: InventoryItem[]) => void;
}

interface BatchEditValues {
  quantity?: string;
  category?: string;
  subcategory?: string;
  location?: string;
  cabinet?: string;
  project?: string;
  unitSubcategory?: string;
}

export default function BatchOperations({ selectedItems, onClearSelection, onItemsUpdated, onDelete }: BatchOperationsProps) {
  const { items, updateItem, deleteItem, categories, units, locations, projects, setItems, cabinets } = useInventory();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isBatchEditOpen, setIsBatchEditOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [batchEditValues, setBatchEditValues] = React.useState<BatchEditValues>({});
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [availableSubcategories, setAvailableSubcategories] = React.useState<string[]>([]);
  const [availableCabinets, setAvailableCabinets] = React.useState<Cabinet[]>([]);

  // Get flattened category names
  const flattenedCategories = React.useMemo(() => flattenCategories(categories || []), [categories]);

  // Get flattened location paths
  const flattenedLocationPaths = React.useMemo(() => flattenLocations(locations || []), [locations]);

  // Update available subcategories when category changes
  React.useEffect(() => {
    if (batchEditValues.category && batchEditValues.category !== 'nochange') {
      // Find the selected category node
      const categoryParts = batchEditValues.category.split('/');
      const categoryName = categoryParts[categoryParts.length - 1];
      
      let foundCategory: CategoryNode | undefined;
      
      const findCategory = (nodes: CategoryNode[] | undefined, path: string[] = []): CategoryNode | undefined => {
        if (!nodes) return undefined;
        
        for (const node of nodes) {
          const currentPath = [...path, node.name];
          if (currentPath.join('/') === batchEditValues.category) {
            return node;
          }
          
          const found = findCategory(node.children, currentPath);
          if (found) return found;
        }
        
        return undefined;
      };
      
      foundCategory = findCategory(categories);
      
      // Set available subcategories
      if (foundCategory && foundCategory.children && foundCategory.children.length > 0) {
        setAvailableSubcategories(foundCategory.children.map(child => child.name));
      } else {
        setAvailableSubcategories([]);
      }
    } else {
      setAvailableSubcategories([]);
    }
  }, [batchEditValues.category, categories]);

  // Update available cabinets when location changes
  React.useEffect(() => {
    if (batchEditValues.location && batchEditValues.location !== 'nochange' && cabinets) {
      // Get the base location name (last part of the path)
      const locationName = batchEditValues.location.split('/').pop() || '';
      logger.info('system', 'Looking for cabinets for location', { locationName });
      logger.info('system', 'Available cabinets', { cabinets });
      
      // Filter cabinets directly by locationId matching the location name
      const locationCabinets = cabinets.filter(cabinet => cabinet.locationId === locationName);
      logger.info('system', 'Found cabinets for location', { locationCabinets });
      setAvailableCabinets(locationCabinets);
    } else {
      setAvailableCabinets([]);
    }
  }, [batchEditValues.location, cabinets]);

  // Reset batch edit values when dialog opens/closes
  React.useEffect(() => {
    if (!isBatchEditOpen) {
      setBatchEditValues({});
    }
  }, [isBatchEditOpen]);

  // Batch delete selected items
  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) {
      toast.error('Please select items to delete');
      return;
    }

    try {
      // Get current items from storage
      const currentItems = getItems();
      
      // Filter out the selected items
      const updatedItems = currentItems.filter(item => !selectedItems.some(selected => selected.id === item.id));
      
      // Save to localStorage
      localStorage.setItem('inventoryItems', JSON.stringify(updatedItems));
      
      // Update global state immediately
      setItems(updatedItems);
      
      // Clear selection and close dialog
      onClearSelection();
      setIsDeleteDialogOpen(false);
      
      // Force window location reload to ensure UI is refreshed
      window.location.reload();
      
      // Show success message
      toast.success(`Deleted ${selectedItems.length} items`);
      logger.info('system', 'Successfully deleted items', { count: selectedItems.length });
    } catch (error) {
      logger.error('system', 'Error in batch delete', error);
      console.error('Error in batch delete:', error);
      toast.error('Failed to delete items');
    }
  };

  // Batch edit selected items
  const handleBatchEdit = async () => {
    setIsUpdating(true);
    try {
      // Get current items from storage
      const currentItems = getItems();
      logger.info('system', 'Starting batch edit', { 
        selectedCount: selectedItems.length,
        batchEditValues 
      });
      
      // Track successful updates
      let successCount = 0;
      
      // Create a new array with updates
      const updatedItems = currentItems.map(item => {
        const isSelected = selectedItems.some(selected => selected.id === item.id);
        if (!isSelected) return item;

        // Apply batch updates to selected items
        const updates: Partial<InventoryItem> = {};
        
        if (batchEditValues.quantity !== undefined) {
          updates.quantity = Number(batchEditValues.quantity);
        }
        if (batchEditValues.category && batchEditValues.category !== 'nochange') {
          updates.category = batchEditValues.category;
        }
        if (batchEditValues.subcategory && batchEditValues.subcategory !== 'nochange') {
          updates.subcategory = batchEditValues.subcategory;
        }
        if (batchEditValues.location && batchEditValues.location !== 'nochange') {
          updates.location = batchEditValues.location;
        }
        if (batchEditValues.cabinet && batchEditValues.cabinet !== 'nochange') {
          updates.cabinet = batchEditValues.cabinet;
        }
        if (batchEditValues.project && batchEditValues.project !== 'nochange') {
          updates.project = batchEditValues.project;
        }
        if (batchEditValues.unitSubcategory && batchEditValues.unitSubcategory !== 'nochange') {
          updates.unitSubcategory = batchEditValues.unitSubcategory;
        }

        if (Object.keys(updates).length > 0) {
          successCount++;
          logger.info('system', 'Updating item', { itemId: item.id, updates });
          return { 
            ...item, 
            ...updates, 
            lastUpdated: new Date(),
            lastModifiedBy: user?.username || user?.displayName || 'Unknown' 
          };
        }
        return item;
      });

      // Save to localStorage
      localStorage.setItem('inventoryItems', JSON.stringify(updatedItems));
      setItems(updatedItems);
      
      if (successCount > 0) {
        // Reset form and close dialog
        setBatchEditValues({});
        setIsBatchEditOpen(false);
        onClearSelection();
        
        // Force window location reload to ensure UI is refreshed
        window.location.reload();
        
        // Show success message
        toast.success(`Successfully updated ${successCount} item${successCount !== 1 ? 's' : ''}`);
        logger.info('system', 'Successfully updated items', { count: successCount });
      }

    } catch (error) {
      logger.error('system', 'Error in batch edit', error);
      console.error('Error in batch edit:', error);
      toast.error('Failed to update items');
    } finally {
      setIsUpdating(false);
    }
  };

  // Update state handlers to store values as strings
  const handleQuantityChange = (value: string) => {
    setBatchEditValues(prev => ({ ...prev, quantity: value || undefined }));
  };

  const handleCategoryChange = (value: string) => {
    setBatchEditValues(prev => ({
      ...prev,
      category: value !== 'nochange' ? value : undefined,
      // Clear subcategory when category changes
      subcategory: undefined
    }));
  };

  const handleLocationChange = (value: string) => {
    setBatchEditValues(prev => ({
      ...prev,
      location: value !== 'nochange' ? value : undefined,
      subcategory: undefined // Clear subcategory when location changes
    }));
  };

  const handleProjectChange = (value: string) => {
    setBatchEditValues(prev => ({
      ...prev,
      project: value !== 'nochange' ? value : undefined
    }));
  };

  const handleSubcategoryChange = (value: string) => {
    setBatchEditValues(prev => ({
      ...prev,
      subcategory: value !== 'nochange' ? value : undefined
    }));
  };

  const handleCabinetChange = (value: string) => {
    setBatchEditValues(prev => ({
      ...prev,
      cabinet: value !== 'nochange' ? value : undefined
    }));
  };

  const handleUnitSubcategoryChange = (value: string) => {
    setBatchEditValues(prev => ({
      ...prev,
      unitSubcategory: value !== 'nochange' ? value : undefined
    }));
  };

  return (
    <div className="space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onClearSelection}
        disabled={selectedItems.length === 0}
      >
        Clear Selection ({selectedItems.length})
      </Button>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="destructive"
            size="sm"
            disabled={selectedItems.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Items</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedItems.length} selected item{selectedItems.length !== 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBatchDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBatchEditOpen} onOpenChange={setIsBatchEditOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={selectedItems.length === 0}
          >
            <Edit2 className="mr-2 h-4 w-4" />
            Batch Edit ({selectedItems.length})
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Batch Edit Items</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">Category</Label>
              <div className="col-span-3">
                <Select value={batchEditValues.category || "nochange"} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue>
                      {batchEditValues.category || "No change"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nochange">No change</SelectItem>
                    {flattenedCategories.map((category: string) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {availableSubcategories.length > 0 && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subcategory" className="text-right">Subcategory</Label>
                <div className="col-span-3">
                  <Select value={batchEditValues.subcategory || "nochange"} onValueChange={handleSubcategoryChange}>
                    <SelectTrigger>
                      <SelectValue>
                        {batchEditValues.subcategory || "No change"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nochange">No change</SelectItem>
                      {availableSubcategories.map((subcategory: string) => (
                        <SelectItem key={subcategory} value={subcategory}>{subcategory}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">Location</Label>
              <div className="col-span-3">
                <Select value={batchEditValues.location || "nochange"} onValueChange={handleLocationChange}>
                  <SelectTrigger>
                    <SelectValue>
                      {batchEditValues.location || "No change"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nochange">No change</SelectItem>
                    {flattenedLocationPaths.map((location: string) => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {availableCabinets.length > 0 && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cabinet" className="text-right">Cabinet</Label>
                <div className="col-span-3">
                  <Select value={batchEditValues.cabinet || "nochange"} onValueChange={handleCabinetChange}>
                    <SelectTrigger>
                      <SelectValue>
                        {batchEditValues.cabinet || "No change"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nochange">No change</SelectItem>
                      {availableCabinets.map(cabinet => (
                        <SelectItem key={cabinet.id} value={cabinet.name}>{cabinet.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project" className="text-right">Project</Label>
              <div className="col-span-3">
                <Select value={batchEditValues.project || "nochange"} onValueChange={handleProjectChange}>
                  <SelectTrigger>
                    <SelectValue>
                      {batchEditValues.project || "No change"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nochange">No change</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.name}>{project.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">Quantity</Label>
              <div className="col-span-3">
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Leave blank for no change"
                  value={batchEditValues.quantity || ''}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setBatchEditValues({});
              setIsBatchEditOpen(false);
            }}>
              Cancel
            </Button>
            <Button onClick={handleBatchEdit} disabled={isUpdating}>
              {isUpdating ? (
                <>Updating {selectedItems.length} Items...</>
              ) : (
                <>Update {selectedItems.length} Items</>
              )}
            </Button>
          </DialogFooter>
          <DebugLogsButton 
            onDownload={async () => {
              try {
                // Use our logger to save the logs
                await logger.downloadLogs('batch-operations');
              } catch (error) {
                console.error('Error downloading logs:', error);
                toast.error('Failed to download logs');
              }
            }}
            context="batch-operations"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 