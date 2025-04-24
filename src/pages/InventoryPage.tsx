// Test comment to verify file writing
import { useState, useEffect, useMemo } from 'react';
import type { FC } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAuth } from '@/contexts/AuthContext';
import { InventoryItem, CategoryNode, ItemWithSubcategories } from '@/types/inventory';
import { BatchOperations } from '@/components/BatchOperations';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { getSettings } from '@/lib/storageService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Search, 
  Filter, 
  Copy,
  X,
  Download,
  Pencil,
  Trash,
  ArrowUpDown,
  FileText,
  LayoutList,
  LayoutGrid
} from 'lucide-react';
import { AddItemDialog } from '@/components/AddItemDialog';
import { EditItemDialog } from '@/components/EditItemDialog';
import { DuplicateItemDialog } from '@/components/DuplicateItemDialog';
import { ExportDialog } from '@/components/ExportDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ItemTemplate } from '@/types/templates';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from 'date-fns';
import { formatCurrency, cn } from '@/lib/utils';
import { FormatCellValue } from '@/components/formatting/CellValue';
import * as React from 'react';

// Helper function to flatten categories
function flattenCategories(categories: CategoryNode[]): string[] {
  if (!categories || !Array.isArray(categories)) {
    return [];
  }
  
  const flattened: string[] = [];
  
  const traverse = (node: CategoryNode, parentPath: string = '') => {
    const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
    flattened.push(currentPath);
    
    if (node.children) {
      node.children.forEach(child => traverse(child, currentPath));
    }
  };

  categories.forEach(category => traverse(category));
  return flattened.sort();
}

// Helper to get unique values from an array of items for a specific field
const getUniqueValues = (items: InventoryItem[], field: keyof InventoryItem): string[] => {
  const values = items
    .map(item => item[field])
    .filter((value): value is string => !!value); // Filter out undefined/null values
  return [...new Set(values)].sort();
};

// Helper function to convert ItemWithSubcategories to CategoryNode
const convertToCategories = (items: ItemWithSubcategories[]): CategoryNode[] => {
  return items.map(item => ({
    id: item.id,
    name: item.name,
    children: item.subcategories ? item.subcategories.map((sub: string) => ({
      id: crypto.randomUUID(),
      name: sub,
      parentId: item.id
    })) : undefined
  }));
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
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter);
  const [selectedLocation, setSelectedLocation] = useState(locationFilter);
  const [selectedSupplier, setSelectedSupplier] = useState(supplierFilter);
  const [selectedProject, setSelectedProject] = useState(projectFilter);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  // State for dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  
  // Load settings
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [units, setUnits] = useState<ItemWithSubcategories[]>([]);
  const [locations, setLocations] = useState<ItemWithSubcategories[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [projects, setProjects] = useState<string[]>([]);

  // Load settings from localStorage
  useEffect(() => {
    const loadSettings = () => {
      const settings = getSettings();
      // Transform settings into appropriate formats
      setCategories(convertToCategories(settings.categories));
      setUnits(settings.units);
      setLocations(settings.locations);
      setSuppliers(settings.suppliers.map(sup => sup.name));
      setProjects(settings.projects.map(proj => proj.name));
    };
    loadSettings();
  }, []);

  // Get template from navigation state if available
  const template = location.state?.template as ItemTemplate | undefined;

  // Add sorting state
  const [sortField, setSortField] = useState<keyof InventoryItem>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Update the filtered items to include sorting
  const filteredItems = useMemo(() => {
    const filtered = items.filter(item => {
      const searchFields = [
        item.name,
        item.category,
        item.location,
        item.project,
        item.notes
      ].map(field => field?.toLowerCase() || '');

      const matchesSearch = !searchQuery || 
        searchFields.some(field => field.includes(searchQuery.toLowerCase()));
      
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      const matchesLocation = !selectedLocation || item.location === selectedLocation;
      const matchesProject = !selectedProject || item.project === selectedProject;

      return matchesSearch && matchesCategory && matchesLocation && matchesProject;
    });

    // Sort the filtered items
    return [...filtered].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [items, searchQuery, selectedCategory, selectedLocation, selectedProject, sortField, sortDirection]);

  // Get flattened categories for filtering
  const flattenedCategories = useMemo(() => flattenCategories(categories), [categories]);

  // Handle column sort
  const handleSort = (field: keyof InventoryItem) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
    setIsAllSelected(!isAllSelected);
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSelection = prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId];
      setIsAllSelected(newSelection.length === filteredItems.length);
      return newSelection;
    });
  };

  const clearSelection = () => {
    setSelectedItems([]);
    setIsAllSelected(false);
  };

  // Single item operations
  const handleDelete = (item: InventoryItem) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      const updatedItems = items.filter(item => item.id !== itemToDelete.id);
      setItems(updatedItems);
      toast.success(`Deleted "${itemToDelete.name}"`);
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  // Update URL when filters change
  const filters = useMemo(() => ({
    category: selectedCategory,
    location: selectedLocation,
    project: selectedProject
  }), [selectedCategory, selectedLocation, selectedProject]);

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
  const handleAddItem = async (newItemData: Omit<InventoryItem, "id" | "lastUpdated">) => {
    const newItem: InventoryItem = {
      ...newItemData,
      id: uuidv4(),
      lastUpdated: new Date(),
      createdBy: user?.displayName || user?.username || 'Unknown',
      lastModifiedBy: user?.displayName || user?.username || 'Unknown'
    };
    
    setItems([...items, newItem]);
    setHighlightedItemId(newItem.id);
    toast.success(`Added "${newItem.name}" to inventory`);
    setIsAddDialogOpen(false); // Close the dialog after successful save
    return Promise.resolve();
  };

  // Handle editing an item
  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (updatedItem: InventoryItem) => {
    try {
      const updatedItems = items.map(item => 
        item.id === updatedItem.id ? { ...updatedItem, lastUpdated: new Date() } : item
      );
      setItems(updatedItems);
      toast.success(`Updated "${updatedItem.name}"`);
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      setHighlightedItemId(updatedItem.id);
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    }
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
    switch (field) {
      case 'category':
        setSelectedCategory(value === 'all' ? '' : value);
        break;
      case 'location':
        setSelectedLocation(value === 'all' ? '' : value);
        break;
      case 'project':
        setSelectedProject(value === 'all' ? '' : value);
        break;
    }
  };

  // Get unique values for filters
  const uniqueLocations = useMemo(() => {
    const allLocations = locations.flatMap(loc => [
      loc.name,
      ...(loc.subcategories?.map(sub => `${loc.name}/${sub}`) || [])
    ]);
    return [...new Set(allLocations)];
  }, [locations]);

  const uniqueUnits = useMemo(() => {
    const allUnits = units.flatMap(unit => [
      unit.name,
      ...(unit.subcategories?.map(sub => `${unit.name}/${sub}`) || [])
    ]);
    return [...new Set(allUnits)];
  }, [units]);

  useEffect(() => {
    // If we have a template from navigation, open the add dialog
    if (template) {
      setIsAddDialogOpen(true);
      // Clear the template from location state to prevent reopening
      navigate(location.pathname, { replace: true });
    }
  }, [template, navigate, location.pathname]);

  const [isDetailedView, setIsDetailedView] = useState(false);

  // Define column sets for different views
  const SIMPLE_COLUMNS = ['name', 'category', 'location', 'project', 'quantity'];
  const DETAILED_COLUMNS = ['name', 'category', 'quantity', 'unit', 'costPerUnit', 'totalValue', 'location', 'project', 'lastUpdated'];

  const activeColumns = isDetailedView ? DETAILED_COLUMNS : SIMPLE_COLUMNS;

  return (
    <div className="container mx-auto px-4 py-6 space-y-4 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Inventory</h1>
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-w-[240px]"
            />
            <div className="flex items-center space-x-2">
              <Select value={selectedCategory || 'all'} onValueChange={(value) => handleFilterChange('category', value)}>
                <SelectTrigger className="min-w-[200px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent className="min-w-[200px]">
                  <SelectItem value="all">All Categories</SelectItem>
                  {flattenedCategories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedLocation || "all"} onValueChange={(value) => handleFilterChange('location', value === "all" ? "" : value)}>
                <SelectTrigger className="min-w-[200px]">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent className="min-w-[200px]">
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map(location => (
                    <React.Fragment key={location.id}>
                      <SelectItem value={location.name}>
                        {location.name}
                      </SelectItem>
                      {location.subcategories?.map(subcategory => (
                        <SelectItem key={`${location.name}/${subcategory}`} value={`${location.name}/${subcategory}`}>
                          {location.name} - {subcategory}
                        </SelectItem>
                      ))}
                    </React.Fragment>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedProject || "all"} onValueChange={(value) => handleFilterChange('project', value === "all" ? "" : value)}>
                <SelectTrigger className="min-w-[200px]">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent className="min-w-[200px]">
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project} value={project}>{project}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        handleFilterChange('category', 'all');
                        handleFilterChange('location', 'all');
                        handleFilterChange('project', 'all');
                      }}
                      className="ml-1"
                      disabled={!selectedCategory && !selectedLocation && !selectedProject}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {selectedCategory || selectedLocation || selectedProject 
                      ? "Clear all filters" 
                      : "No active filters"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 mr-4">
            <Switch
              id="view-mode"
              checked={isDetailedView}
              onCheckedChange={setIsDetailedView}
            />
            <Label htmlFor="view-mode" className="text-sm">
              {isDetailedView ? 'Detailed View' : 'Simple View'}
            </Label>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-muted-foreground">
          {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
        </div>
        <Button variant="outline" onClick={() => setIsExportDialogOpen(true)}>
          <Download className="mr-2 h-4 w-4" />
          Export Current View
        </Button>
      </div>

      {selectedItems.length > 0 && (
        <BatchOperations
          selectedItems={selectedItems}
          onClearSelection={clearSelection}
          onItemsUpdated={() => {
            // Refresh the items list if needed
            const updatedItems = [...items];
            setItems(updatedItems);
          }}
        />
      )}

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              {activeColumns.map((column) => (
                <TableHead key={column}>
                  <div className="flex items-center space-x-1 cursor-pointer" onClick={() => handleSort(column as keyof InventoryItem)}>
                    <span>{column.charAt(0).toUpperCase() + column.slice(1).replace(/([A-Z])/g, ' $1')}</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
              ))}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id} className={highlightedItemId === item.id ? 'bg-blue-50' : ''}>
                <TableCell>
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={() => toggleItemSelection(item.id)}
                  />
                </TableCell>
                {activeColumns.map((column) => (
                  <TableCell key={column}>
                    <FormatCellValue item={item} column={column} />
                  </TableCell>
                ))}
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => {
                      setSelectedItem(item);
                      setIsEditDialogOpen(true);
                    }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setSelectedItem(item);
                      setIsDuplicateDialogOpen(true);
                    }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <AddItemDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddItem}
        categories={categories}
        units={units}
        locations={locations}
        suppliers={suppliers}
        projects={projects}
        selectedTemplate={location.state?.template}
      />

      {selectedItem && (
        <>
          <EditItemDialog
            item={selectedItem}
            isOpen={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            onSave={handleSaveEdit}
            categories={flattenedCategories}
            units={units}
            locations={locations}
            suppliers={suppliers}
            projects={projects}
          />

          <DuplicateItemDialog
            isOpen={isDuplicateDialogOpen}
            onClose={() => setIsDuplicateDialogOpen(false)}
            item={selectedItem as InventoryItem}
            onDuplicate={handleDuplicateItem}
          />
        </>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{itemToDelete?.name}" from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        items={filteredItems}
        defaultFilename={`inventory_export_${new Date().toISOString().split('T')[0]}_${filteredItems.length}_items`}
      />
    </div>
  );
}