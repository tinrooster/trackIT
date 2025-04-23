import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { InventoryTable } from '@/components/InventoryTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Filter, 
  Copy,
  X 
} from 'lucide-react';
import { AddItemDialog } from '@/components/AddItemDialog';
import { EditItemDialog } from '@/components/EditItemDialog';
import { InventoryItem } from '@/types/inventory';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { DuplicateItemDialog } from '@/components/DuplicateItemDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Helper to get unique values from an array of items for a specific field
const getUniqueValues = (items: InventoryItem[], field: keyof InventoryItem): string[] => {
  const values = items
    .map(item => item[field])
    .filter((value): value is string => !!value); // Filter out undefined/null values
  return [...new Set(values)].sort();
};

export default function InventoryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  
  // Get any filter params from URL
  const categoryFilter = searchParams.get('category') || '';
  const locationFilter = searchParams.get('location') || '';
  const supplierFilter = searchParams.get('supplier') || '';
  const projectFilter = searchParams.get('project') || '';

  // State for inventory items
  const [items, setItems] = useLocalStorage<InventoryItem[]>('inventoryItems', []);
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({
    ...(categoryFilter && { category: categoryFilter }),
    ...(locationFilter && { location: locationFilter }),
    ...(supplierFilter && { supplier: supplierFilter }),
    ...(projectFilter && { project: projectFilter }),
  });
  
  // State for dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  
  // Compute unique values for dropdowns
  const categories = useMemo(() => getUniqueValues(items, 'category'), [items]);
  const locations = useMemo(() => getUniqueValues(items, 'location'), [items]);
  const suppliers = useMemo(() => getUniqueValues(items, 'supplier'), [items]);
  const projects = useMemo(() => getUniqueValues(items, 'project'), [items]);
  const units = useMemo(() => getUniqueValues(items, 'unit'), [items]);

  // Update URL when filters change
  useEffect(() => {
    const newParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) newParams.set(key, value);
    });
    
    // Only update if the params have changed to avoid unnecessary history entries
    if (newParams.toString() !== searchParams.toString()) {
      setSearchParams(newParams);
    }
  }, [filters, setSearchParams, searchParams]);

  // Highlight newly added items
  useEffect(() => {
    if (highlightedItemId) {
      const timer = setTimeout(() => {
        setHighlightedItemId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightedItemId]);

  // Handle adding a new item
  const handleAddItem = (newItemData: Omit<InventoryItem, "id" | "lastUpdated">) => {
    const newItem: InventoryItem = {
      ...newItemData,
      id: uuidv4(),
      lastUpdated: new Date(),
      createdBy: user?.id,
      lastModifiedBy: user?.id
    };
    
    setItems([...items, newItem]);
    setHighlightedItemId(newItem.id);
    toast.success(`Added "${newItem.name}" to inventory`);
    return Promise.resolve();
  };

  // Handle editing an item
  const handleEditItem = (updatedItem: InventoryItem) => {
    const updatedItems = items.map(item => 
      item.id === updatedItem.id 
        ? { ...updatedItem, lastUpdated: new Date(), lastModifiedBy: user?.id } 
        : item
    );
    setItems(updatedItems);
    setIsEditDialogOpen(false);
    toast.success(`Updated "${updatedItem.name}"`);
  };

  // Handle duplicating an item
  const handleDuplicateItem = async (newItemData: Partial<InventoryItem>) => {
    const newItem: InventoryItem = {
      ...newItemData,
      id: uuidv4(),
      lastUpdated: new Date(),
      createdBy: user?.id,
      lastModifiedBy: user?.id
    } as InventoryItem;
    
    setItems([...items, newItem]);
    setHighlightedItemId(newItem.id);
    setIsDuplicateDialogOpen(false);
    toast.success(`Duplicated "${selectedItem?.name}" successfully`);
  };

  // Handle filter changes
  const handleFilterChange = (field: string, value: string) => {
    if (value === '') {
      const newFilters = { ...filters };
      delete newFilters[field];
      setFilters(newFilters);
    } else {
      setFilters({ ...filters, [field]: value });
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
          {selectedItem && (
            <Button variant="outline" onClick={() => setIsDuplicateDialogOpen(true)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </Button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Your Inventory is Empty</CardTitle>
            <CardDescription>
              Get started by adding your first inventory item
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>You haven't added any inventory items yet. Click the "Add Item" button to create your first item, or import items from a spreadsheet in the Settings page.</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
              <Button variant="outline" onClick={() => navigate('/settings')}>
                <Filter className="mr-2 h-4 w-4" />
                Go to Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search inventory..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.location || ''}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              >
                <option value="">All Locations</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
              
              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.project || ''}
                onChange={(e) => handleFilterChange('project', e.target.value)}
              >
                <option value="">All Projects</option>
                {projects.map(project => (
                  <option key={project} value={project}>{project}</option>
                ))}
              </select>
              
              {Object.keys(filters).length > 0 && (
                <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear filters">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <InventoryTable
            items={items}
            onEdit={(item) => {
              setSelectedItem(item);
              setIsEditDialogOpen(true);
            }}
            searchQuery={searchQuery}
            filters={filters}
            highlightRowId={highlightedItemId}
          />
        </>
      )}

      {/* Add Item Dialog */}
      {isAddDialogOpen && (
        <AddItemDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onAddItem={handleAddItem}
          categories={categories}
          units={units}
          locations={locations}
          suppliers={suppliers}
          projects={projects}
        />
      )}

      {/* Edit Item Dialog */}
      {isEditDialogOpen && selectedItem && (
        <EditItemDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
          onSave={handleEditItem}
          categories={categories}
          units={units}
          locations={locations}
          suppliers={suppliers}
          projects={projects}
        />
      )}

      {/* Duplicate Item Dialog */}
      {isDuplicateDialogOpen && selectedItem && (
        <DuplicateItemDialog
          isOpen={isDuplicateDialogOpen}
          onClose={() => setIsDuplicateDialogOpen(false)}
          item={selectedItem}
          onDuplicate={handleDuplicateItem}
        />
      )}
    </div>
  );
}