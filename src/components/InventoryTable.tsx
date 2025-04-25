import * as React from 'react';
import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InventoryItem } from "@/types/inventory";
import { format } from "date-fns";
import { Pencil, ArrowUpDown, FileDown, DollarSign, LayoutList, LayoutGrid, Box, Lock, BarChart2, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToExcel } from "@/lib/exportUtils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

type SortConfig = {
  key: keyof InventoryItem | 'totalValue' | 'cabinet';
  direction: "asc" | "desc";
};

interface Cabinet {
  id: string;
  name: string;
  locationId: string;
  description: string;
  isSecure: boolean;
  allowedCategories: string[];
  qrCode: string;
}

// Helper to format currency
const formatCurrency = (value: number | undefined) => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

// Define column sets for different views
const SIMPLE_COLUMNS: (keyof InventoryItem | 'actions')[] = [
  'name', 'category', 'quantity', 'unit', 'location', 'project', 'actions'
];

const DETAILED_COLUMNS: (keyof InventoryItem | 'totalValue' | 'actions')[] = [
  'name', 'category', 'quantity', 'unit', 'costPerUnit', 'totalValue', 'location', 'project', 'lastUpdated', 'actions'
];

const EXPORT_COLUMNS: (keyof InventoryItem | 'totalValue')[] = [
  'name', 'description', 'category', 'quantity', 'unit', 'costPerUnit', 'totalValue', 'location', 'supplier', 'project', 'barcode', 'reorderLevel', 'notes', 'lastUpdated'
];

interface InventoryTableProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete?: (item: InventoryItem) => void;
  searchQuery?: string;
  filters?: Record<string, string>;
  highlightRowId?: string | null;
  showActions?: boolean;
}

export function InventoryTable({
  items,
  onEdit,
  onDelete,
  searchQuery = "",
  filters = {},
  highlightRowId = null,
  showActions = true
}: InventoryTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "name", direction: "asc" });
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [cabinetFilter, setCabinetFilter] = useState<string>('all');
  const [isDetailedView, setIsDetailedView] = useState(false);
  const [locations, setLocations] = useState<{ id: string; name: string; }[]>([]);

  // Load cabinets and locations from localStorage
  useEffect(() => {
    const savedCabinets = localStorage.getItem('cabinets');
    if (savedCabinets) {
      setCabinets(JSON.parse(savedCabinets));
    }

    console.log('[DEBUG] Loading locations from localStorage');
    const savedLocations = localStorage.getItem('inventory-locations');
    console.log('[DEBUG] Raw saved locations:', savedLocations);
    
    if (savedLocations) {
      try {
        const parsedLocations = JSON.parse(savedLocations);
        console.log('[DEBUG] Parsed locations:', parsedLocations);
        setLocations(parsedLocations);
      } catch (error) {
        console.error('[DEBUG] Error parsing locations:', error);
        setLocations([]);
      }
    } else {
      console.log('[DEBUG] No locations found in localStorage');
      setLocations([]);
    }
  }, []);

  const getLocationName = (locationId: string) => {
    console.log('[DEBUG] Getting location name for ID:', locationId);
    console.log('[DEBUG] Available locations:', locations);
    
    if (!locationId) return 'No Location';
    
    const location = locations.find(loc => loc.id === locationId);
    if (!location) {
      console.log('[DEBUG] Location not found for ID:', locationId);
      // Try to decode the locationId as a potential name (for backward compatibility)
      try {
        return decodeURIComponent(locationId);
      } catch (e) {
        console.error('[DEBUG] Error decoding location:', e);
      return locationId;
      }
    }
    
    console.log('[DEBUG] Found location:', location);
    return location.name;
  };

  const getCabinetName = (cabinetId: string | undefined) => {
    if (!cabinetId) return '';
    const cabinet = cabinets.find(c => c.id === cabinetId);
    return cabinet ? cabinet.name : cabinetId;
  };

  // Add totalValue to items for sorting/display
  const itemsWithTotalValue = useMemo(() => {
    return items.map(item => ({
      ...item,
      totalValue: item.costPerUnit !== undefined ? item.quantity * item.costPerUnit : undefined
    }));
  }, [items]);

  const sortedItems = useMemo(() => {
    let sorted = [...itemsWithTotalValue];

    // Apply cabinet filter
    if (cabinetFilter !== 'all') {
      sorted = sorted.filter(item => {
        if (cabinetFilter === 'none') return !item.cabinet;
        return item.cabinet === cabinetFilter;
      });
    }

    // Apply sorting
    sorted.sort((a, b) => {
      if (sortConfig.key === 'cabinet') {
        const cabinetA = getCabinetName(a.cabinet) || '';
        const cabinetB = getCabinetName(b.cabinet) || '';
        return sortConfig.direction === 'asc' 
          ? cabinetA.localeCompare(cabinetB)
          : cabinetB.localeCompare(cabinetA);
      }

      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === undefined || bValue === undefined) {
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
        if (bValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      }

      if (sortConfig.key === 'lastUpdated') {
        const aDate = aValue instanceof Date ? aValue : new Date(aValue as string);
        const bDate = bValue instanceof Date ? bValue : new Date(bValue as string);
        return sortConfig.direction === 'asc' 
          ? aDate.getTime() - bDate.getTime() 
          : bDate.getTime() - aDate.getTime();
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();
      return sortConfig.direction === 'asc'
        ? aString.localeCompare(bString)
        : bString.localeCompare(aString);
    });

    return sorted;
  }, [itemsWithTotalValue, sortConfig, cabinetFilter, cabinets]);

  // Apply filters first
  const filteredItemsByDropdown = useMemo(() => {
    if (Object.keys(filters).length === 0) return sortedItems;

    return sortedItems.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        const itemValue = item[key as keyof InventoryItem];
        if (itemValue === undefined || itemValue === null) return false;
        return String(itemValue).toLowerCase() === String(value).toLowerCase();
      });
    });
  }, [sortedItems, filters]);

  // Apply search query to the already filtered items
  const finalFilteredItems = useMemo(() => {
    if (!searchQuery) return filteredItemsByDropdown;

    const lowerCaseQuery = searchQuery.toLowerCase();
    return filteredItemsByDropdown.filter(item =>
      item.name.toLowerCase().includes(lowerCaseQuery) ||
      (item.description && item.description.toLowerCase().includes(lowerCaseQuery)) ||
      (item.category && item.category.toLowerCase().includes(lowerCaseQuery)) ||
      (item.project && item.project.toLowerCase().includes(lowerCaseQuery)) ||
      (item.notes && item.notes.toLowerCase().includes(lowerCaseQuery)) ||
      (item.barcode && item.barcode.toLowerCase().includes(lowerCaseQuery)) ||
      (item.supplier && item.supplier.toLowerCase().includes(lowerCaseQuery)) ||
      (getLocationName(item.location).toLowerCase().includes(lowerCaseQuery))
    );
  }, [filteredItemsByDropdown, searchQuery, locations]);

  const handleSort = (key: SortConfig['key']) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc"
    }));
  };

  const handleExportCurrentView = () => {
    if (finalFilteredItems.length === 0) {
      toast.warning("No items in the current view to export.");
      return;
    }
    const dataToExport = finalFilteredItems.map(item => {
      const exportRow: Record<string, any> = {};
      EXPORT_COLUMNS.forEach(colKey => {
        const value = item[colKey as keyof typeof item];
        if (colKey === 'lastUpdated' && value instanceof Date) {
          exportRow[formatHeader(colKey)] = format(value, "yyyy-MM-dd HH:mm:ss");
        } else if (colKey === 'costPerUnit' || colKey === 'totalValue') {
          exportRow[formatHeader(colKey)] = typeof value === 'number' ? value.toFixed(2) : "";
        } else {
          exportRow[formatHeader(colKey)] = value === null || value === undefined ? "" : String(value);
        }
      });
      return exportRow;
    });
    const dateStr = format(new Date(), "yyyy-MM-dd");
    let filename = `Inventory_Export_${dateStr}`;
    if (searchQuery || Object.keys(filters).length > 0) {
      filename = `Inventory_Filtered_${dateStr}`;
    }
    exportToExcel(dataToExport, filename, "Inventory Data");
    toast.success(`Exported ${finalFilteredItems.length} items to Excel`);
  };

  // Helper to format header keys
  const formatHeader = (key: string) => key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');

  const activeColumns = isDetailedView ? DETAILED_COLUMNS : SIMPLE_COLUMNS;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="text-sm text-muted-foreground">
            {finalFilteredItems.length} {finalFilteredItems.length === 1 ? 'item' : 'items'} found
          </div>
          <Button
            variant="default"
            size="default"
            onClick={() => setIsDetailedView(!isDetailedView)}
            className="gap-2 min-w-[140px] bg-secondary hover:bg-secondary/80"
          >
            {isDetailedView ? (
              <>
                <LayoutGrid className="h-4 w-4" />
                Simple View
              </>
            ) : (
              <>
                <LayoutList className="h-4 w-4" />
                Detailed View
              </>
            )}
          </Button>
        </div>
        <Button onClick={handleExportCurrentView} variant="outline" size="default" className="w-full sm:w-auto">
          <FileDown className="mr-2 h-4 w-4" />
          Export Current View
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Label>Filter by Cabinet:</Label>
          <Select
            value={cabinetFilter}
            onValueChange={setCabinetFilter}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select cabinet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cabinets</SelectItem>
              <SelectItem value="none">No Cabinet</SelectItem>
              {cabinets.map(cabinet => (
                <SelectItem key={cabinet.id} value={cabinet.id}>
                  {cabinet.name} {cabinet.isSecure && '🔒'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            {activeColumns.map((key) => (
              <TableHead key={key}>
                {key !== 'actions' ? (
                  <Button
                    variant="ghost"
                    onClick={() => handleSort(key as keyof InventoryItem | 'totalValue' | 'cabinet')}
                    className="p-0 h-auto text-left"
                  >
                    {formatHeader(key)}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <span className="text-right block">Actions</span>
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {finalFilteredItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={activeColumns.length} className="text-center h-24">
                No matching items found.
              </TableCell>
            </TableRow>
          ) : (
            finalFilteredItems.map((item) => (
              <TableRow
                key={item.id}
                className={cn(
                  "group hover:bg-muted/50",
                  { "bg-muted": highlightRowId === item.id }
                )}
              >
                {activeColumns.map((column) => {
                  if (column === 'actions') {
                    return (
                      <TableCell key={column} className="text-right">
                        {showActions && (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    );
                  }

                  let cellContent: React.ReactNode = '';

                  switch (column) {
                    case 'lastUpdated':
                      cellContent = item[column] instanceof Date 
                        ? format(item[column] as Date, "MMM d, yyyy")
                        : format(new Date(item[column] as string), "MMM d, yyyy");
                      break;
                    case 'totalValue':
                      cellContent = formatCurrency(item.costPerUnit ? item.quantity * item.costPerUnit : undefined);
                      break;
                    case 'costPerUnit':
                      cellContent = formatCurrency(item[column]);
                      break;
                    case 'location':
                      cellContent = getLocationName(item[column]);
                      break;
                    case 'name':
                      cellContent = (
                        <div className="flex items-center gap-2">
                          <span>{item[column]?.toString() || '-'}</span>
                          {item.reorderLevel !== undefined && item.quantity <= item.reorderLevel && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="destructive" className="flex items-center gap-1 px-2 py-0">
                                    <BarChart2 className="h-3 w-3" />
                                    <span className="text-xs">Low</span>
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Quantity below reorder level ({item.reorderLevel})</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {item.notes && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="secondary" className="flex items-center gap-1 px-2 py-0">
                                    <StickyNote className="h-3 w-3" />
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs whitespace-normal break-words">{item.notes}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      );
                      break;
                    default:
                      cellContent = item[column]?.toString() || '-';
                  }

                  return (
                    <TableCell key={column}>
                      {cellContent}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
} 