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
  X,
  Download,
  Pencil,
  Trash,
  ArrowUpDown,
  FileText
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
import { BatchOperations } from '@/components/BatchOperations';
import { getSettings } from '@/lib/storageService';
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
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter);
  const [selectedLocation, setSelectedLocation] = useState(locationFilter);
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
  
  // Get predefined values from settings
  const predefinedCategories = getSettings('CATEGORIES');
  const predefinedUnits = getSettings('UNITS');
  const predefinedLocations = getSettings('LOCATIONS');
  const predefinedSuppliers = getSettings('SUPPLIERS');
  const predefinedProjects = getSettings('PROJECTS');
  
  // Compute unique values for dropdowns, combining predefined values with existing ones
  const categories = useMemo(() => [...new Set([...predefinedCategories, ...getUniqueValues(items, 'category')])].sort(), [items, predefinedCategories]);
  const locations = useMemo(() => [...new Set([...predefinedLocations, ...getUniqueValues(items, 'location')])].sort(), [items, predefinedLocations]);
  const suppliers = useMemo(() => [...new Set([...predefinedSuppliers, ...getUniqueValues(items, 'supplier')])].sort(), [items, predefinedSuppliers]);
  const projects = useMemo(() => [...new Set([...predefinedProjects, ...getUniqueValues(items, 'project')])].sort(), [items, predefinedProjects]);
  const units = useMemo(() => [...new Set([...predefinedUnits, ...getUniqueValues(items, 'unit')])].sort(), [items, predefinedUnits]);

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

  // Batch operations
  const handleBatchEdit = () => {
    // Implement batch edit functionality
    toast.info("Batch edit functionality coming soon");
  };

  const handleDeleteSelected = () => {
    // Implement delete selected functionality
    toast.info("Delete selected functionality coming soon");
  };

  // Single item operations
  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

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

  const handleExport = () => {
    // Implement export functionality
    toast.info("Export functionality coming soon");
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
  const handleEditItem = (updatedItem: InventoryItem) => {
    const updatedItems = items.map(item => 
      item.id === updatedItem.id 
        ? { 
            ...updatedItem, 
            lastUpdated: new Date(), 
            lastModifiedBy: user?.displayName || user?.username || 'Unknown'
          } 
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
    switch (field) {
      case 'category':
        setSelectedCategory(value);
        break;
      case 'location':
        setSelectedLocation(value);
        break;
      case 'project':
        setSelectedProject(value);
        break;
    }
  };

  useEffect(() => {
    // If we have a template from navigation, open the add dialog
    if (template) {
      setIsAddDialogOpen(true);
      // Clear the template from location state to prevent reopening
      navigate(location.pathname, { replace: true });
    }
  }, [template, navigate, location.pathname]);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => handleExport()} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Export Current View
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-col lg:flex-row gap-2">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedLocation || "all"} onValueChange={(value) => setSelectedLocation(value === "all" ? "" : value)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedProject || "all"} onValueChange={(value) => setSelectedProject(value === "all" ? "" : value)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project} value={project}>
                    {project}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(selectedCategory || selectedLocation || selectedProject || searchQuery) && (
            <Button variant="ghost" onClick={() => {
              setSelectedCategory('');
              setSelectedLocation('');
              setSelectedProject('');
              setSearchQuery('');
            }} className="w-full sm:w-auto">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={clearSelection}
          disabled={selectedItems.length === 0}
        >
          Clear Selection
        </Button>
        {selectedItems.length > 0 && (
          <>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeleteSelected()}
            >
              Delete Selected ({selectedItems.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBatchEdit()}
            >
              Batch Edit ({selectedItems.length})
            </Button>
          </>
        )}
      </div>

      <div className="rounded-md border">
        <div className="overflow-hidden">
          <div className="overflow-x-auto">
            <div className="max-h-[calc(100vh-24rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
              <table className="w-full border-collapse min-w-[1000px]">
                <thead className="sticky top-0 bg-gray-100 shadow-sm z-10">
                  <tr>
                    <th className="w-[30px] p-4 text-left font-bold border-b">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th 
                      className="p-4 text-left font-bold border-b cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        Name
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th 
                      className="p-4 text-left font-bold border-b cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSort('category')}
                    >
                      <div className="flex items-center gap-2">
                        Category
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th 
                      className="p-4 text-left font-bold border-b cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSort('quantity')}
                    >
                      <div className="flex items-center gap-2">
                        Quantity
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th 
                      className="p-4 text-left font-bold border-b cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSort('unit')}
                    >
                      <div className="flex items-center gap-2">
                        Unit
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th 
                      className="p-4 text-left font-bold border-b cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSort('costPerUnit')}
                    >
                      <div className="flex items-center gap-2">
                        Cost Per Unit
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="p-4 text-left font-bold border-b">Total Value</th>
                    <th 
                      className="p-4 text-left font-bold border-b cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSort('location')}
                    >
                      <div className="flex items-center gap-2">
                        Location
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th 
                      className="p-4 text-left font-bold border-b cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSort('project')}
                    >
                      <div className="flex items-center gap-2">
                        Project
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th 
                      className="p-4 text-left font-bold border-b cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSort('lastUpdated')}
                    >
                      <div className="flex items-center gap-2">
                        Last Updated
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="w-[100px] p-4 text-left font-bold border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={() => toggleItemSelection(item.id)}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {item.name}
                          {item.notes && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <FileText className="h-4 w-4 text-blue-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{item.notes}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </td>
                      <td className="p-4">{item.category}</td>
                      <td className="p-4">{item.quantity}</td>
                      <td className="p-4">{item.unit}</td>
                      <td className="p-4">${item.costPerUnit?.toFixed(2)}</td>
                      <td className="p-4">${(item.quantity * (item.costPerUnit || 0)).toFixed(2)}</td>
                      <td className="p-4">{item.location}</td>
                      <td className="p-4">{item.project}</td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span>{new Date(item.lastUpdated).toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground">by {item.lastModifiedBy}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {filteredItems.length} items found
      </div>

      {/* Add Item Dialog */}
      {isAddDialogOpen && (
        <AddItemDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSubmit={handleAddItem}
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
          onSave={handleEditItem}
          item={selectedItem}
          categories={categories}
          units={units}
          locations={locations}
          suppliers={suppliers}
          projects={projects}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && itemToDelete && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{itemToDelete.name}" from your inventory.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}