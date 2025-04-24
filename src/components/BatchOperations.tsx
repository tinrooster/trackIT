import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInventory } from '@/hooks/useInventory';
import { InventoryItem, CategoryNode } from '@/types/inventory';
import { toast } from 'sonner';
import { Trash2, Edit2 } from 'lucide-react';

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

interface BatchOperationsProps {
  selectedItems: string[];
  onClearSelection: () => void;
  onItemsUpdated: () => void;
}

export function BatchOperations({ selectedItems, onClearSelection, onItemsUpdated }: BatchOperationsProps) {
  const { items, updateItem, deleteItem, categories, units, locations, projects } = useInventory();
  const [isBatchEditOpen, setIsBatchEditOpen] = React.useState(false);
  const [batchEditValues, setBatchEditValues] = React.useState<Partial<InventoryItem>>({});

  // Get flattened category names
  const flattenedCategories = React.useMemo(() => flattenCategories(categories || []), [categories]);

  // Reset batch edit values when dialog opens/closes
  React.useEffect(() => {
    if (!isBatchEditOpen) {
      setBatchEditValues({});
    }
  }, [isBatchEditOpen]);

  // Batch delete selected items
  const handleBatchDelete = () => {
    if (selectedItems.length === 0) {
      toast.error('Please select items to delete');
      return;
    }

    selectedItems.forEach(itemId => {
      deleteItem(itemId);
    });

    onClearSelection();
    toast.success(`Deleted ${selectedItems.length} items`);
    onItemsUpdated();
  };

  // Batch edit selected items
  const handleBatchEdit = () => {
    if (selectedItems.length === 0) {
      toast.error('Please select items to edit');
      return;
    }

    selectedItems.forEach(itemId => {
      const item = items.find(i => i.id === itemId);
      if (item) {
        const updatedItem: InventoryItem = {
          ...item,
          ...Object.fromEntries(
            Object.entries(batchEditValues).filter(([_, value]) => value !== undefined && value !== '')
          ),
          lastUpdated: new Date(),
        };
        updateItem(updatedItem);
      }
    });

    setBatchEditValues({});
    setIsBatchEditOpen(false);
    toast.success(`Updated ${selectedItems.length} items`);
    onItemsUpdated();
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
      
      <Button
        variant="destructive"
        size="sm"
        onClick={handleBatchDelete}
        disabled={selectedItems.length === 0}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete Selected
      </Button>

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
                <Select defaultValue="nochange">
                  <SelectTrigger>
                    <SelectValue>No change</SelectValue>
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
                <Select defaultValue="nochange">
                  <SelectTrigger>
                    <SelectValue>No change</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nochange">No change</SelectItem>
                    {locations.map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project" className="text-right">Project</Label>
              <div className="col-span-3">
                <Select defaultValue="nochange">
                  <SelectTrigger>
                    <SelectValue>No change</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nochange">No change</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project} value={project}>{project}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="unit" className="text-right">Unit</Label>
              <div className="col-span-3">
                <Select defaultValue="nochange">
                  <SelectTrigger>
                    <SelectValue>No change</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nochange">No change</SelectItem>
                    {units.map(unit => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  onChange={(e) => setBatchEditValues({ 
                    ...batchEditValues, 
                    costPerUnit: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
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
                  onChange={(e) => setBatchEditValues({ 
                    ...batchEditValues, 
                    price: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBatchEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBatchEdit}>
              Update {selectedItems.length} Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 