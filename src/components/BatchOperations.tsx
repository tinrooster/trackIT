import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInventory } from '@/hooks/useInventory';
import { InventoryItem, CategoryNode, ItemWithSubcategories } from '@/types/inventory';
import { toast } from 'sonner';
import { Trash2, Edit2 } from 'lucide-react';
import { getItems } from '@/lib/storageService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

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
  costPerUnit?: string;
  price?: string;
  category?: string;
  location?: string;
  project?: string;
}

export default function BatchOperations({ selectedItems, onClearSelection, onItemsUpdated, onDelete }: BatchOperationsProps) {
  const { items, updateItem, deleteItem, categories, units, locations, projects, setItems } = useInventory();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isBatchEditOpen, setIsBatchEditOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [batchEditValues, setBatchEditValues] = React.useState<BatchEditValues>({});
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Get flattened category names
  const flattenedCategories = React.useMemo(() => flattenCategories(categories || []), [categories]);

  // Get flattened location names
  const flattenedLocations = React.useMemo(() => 
    Array.isArray(locations) ? locations.map(loc => ({
      id: loc.id || '', 
      name: loc.name || ''
    } as FlattenedLocation)) : [], 
    [locations]
  );

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
    } catch (error) {
      console.error('Error in batch delete:', error);
      toast.error('Failed to delete items');
    }
  };

  // Batch edit selected items
  const handleBatchEdit = async () => {
    if (!selectedItems.length) {
      toast.error("No items selected for batch edit");
      return;
    }

    setIsUpdating(true);

    try {
      // Get current items from storage
      const currentItems = getItems();
      
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
        if (batchEditValues.costPerUnit !== undefined) {
          updates.costPerUnit = Number(batchEditValues.costPerUnit);
        }
        if (batchEditValues.price !== undefined) {
          updates.price = Number(batchEditValues.price);
        }
        if (batchEditValues.category && batchEditValues.category !== 'nochange') {
          updates.category = batchEditValues.category;
        }
        if (batchEditValues.location && batchEditValues.location !== 'nochange') {
          updates.location = batchEditValues.location;
        }
        if (batchEditValues.project && batchEditValues.project !== 'nochange') {
          updates.project = batchEditValues.project;
        }

        if (Object.keys(updates).length > 0) {
          successCount++;
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
      
      // Update global state immediately
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
      }

    } catch (error) {
      console.error('Error in batch edit:', error);
      toast.error('An error occurred during batch edit');
    } finally {
      setIsUpdating(false);
    }
  };

  // Update state handlers to store values as strings
  const handleQuantityChange = (value: string) => {
    setBatchEditValues((prev: BatchEditValues) => value ? { ...prev, quantity: value } : { ...prev, quantity: undefined });
  };

  const handleCostPerUnitChange = (value: string) => {
    setBatchEditValues((prev: BatchEditValues) => value ? { ...prev, costPerUnit: value } : { ...prev, costPerUnit: undefined });
  };

  const handlePriceChange = (value: string) => {
    setBatchEditValues((prev: BatchEditValues) => value ? { ...prev, price: value } : { ...prev, price: undefined });
  };

  const handleCategoryChange = (value: string) => {
    setBatchEditValues((prev: BatchEditValues) => value !== 'nochange' ? { ...prev, category: value } : { ...prev, category: undefined });
  };

  const handleLocationChange = (value: string) => {
    setBatchEditValues((prev: BatchEditValues) => value !== 'nochange' ? { ...prev, location: value } : { ...prev, location: undefined });
  };

  const handleProjectChange = (value: string) => {
    setBatchEditValues((prev: BatchEditValues) => value !== 'nochange' ? { ...prev, project: value } : { ...prev, project: undefined });
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
                    {flattenedLocations.map(location => (
                      <SelectItem key={location.id} value={location.name}>{location.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

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

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="costPerUnit" className="text-right">Cost Per Unit ($)</Label>
              <div className="col-span-3">
                <Input
                  id="costPerUnit"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Leave blank for no change"
                  value={batchEditValues.costPerUnit || ''}
                  onChange={(e) => handleCostPerUnitChange(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">Price ($)</Label>
              <div className="col-span-3">
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Leave blank for no change"
                  value={batchEditValues.price || ''}
                  onChange={(e) => handlePriceChange(e.target.value)}
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
        </DialogContent>
      </Dialog>
    </div>
  );
} 