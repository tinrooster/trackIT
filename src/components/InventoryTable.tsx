import React, { useState, useMemo } from "react";
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
    import { Pencil, ArrowUpDown, FileDown, DollarSign } from "lucide-react";
    import { Button } from "@/components/ui/button";
    import { exportToExcel } from "@/lib/exportUtils";
    import { cn } from "@/lib/utils";
    import { toast } from "sonner";
    import { DebugInfo } from '@/components/DebugInfo'; // Import DebugInfo

    type SortConfig = {
      key: keyof InventoryItem | 'totalValue';
      direction: "asc" | "desc";
    };

    // Helper to format currency
    const formatCurrency = (value: number | undefined) => {
      if (value === undefined || value === null) return '-';
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    // Define which columns to include in the display and export
    const COLUMNS_TO_DISPLAY: (keyof InventoryItem | 'totalValue' | 'actions')[] = [
        'name', 'category', 'quantity', 'unit', 'costPerUnit', 'totalValue', 'location', 'project', 'lastUpdated', 'actions'
    ];
    const EXPORT_COLUMNS: (keyof InventoryItem | 'totalValue')[] = [
        'name', 'description', 'category', 'quantity', 'unit', 'costPerUnit', 'totalValue', 'location', 'supplier', 'project', 'barcode', 'reorderLevel', 'notes', 'lastUpdated'
    ];

    interface InventoryTableProps {
        items: InventoryItem[];
        onEdit: (item: InventoryItem) => void;
        searchQuery?: string;
        filters?: Record<string, string>;
        highlightRowId?: string | null;
    }

    export function InventoryTable({
      items,
      onEdit,
      searchQuery = "",
      filters = {},
      highlightRowId = null
    }: InventoryTableProps) {
      console.log("InventoryTable: Rendering with items:", items.length, "Filters:", filters, "Search:", searchQuery);
      const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

      // Add totalValue to items for sorting/display
      const itemsWithTotalValue = useMemo(() => {
          console.log("InventoryTable: Calculating itemsWithTotalValue");
          return items.map(item => ({
              ...item,
              totalValue: item.costPerUnit !== undefined ? item.quantity * item.costPerUnit : undefined
          }));
      }, [items]);


      const sortedItems = useMemo(() => {
        console.log("InventoryTable: Sorting items");
        let sortableItems = [...itemsWithTotalValue];
        if (sortConfig !== null) {
          sortableItems.sort((a, b) => {
            const aValue = a[sortConfig.key as keyof typeof a];
            const bValue = b[sortConfig.key as keyof typeof b];
            if (aValue === undefined || bValue === undefined) {
                if (aValue === undefined && bValue === undefined) return 0;
                if (aValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
                if (bValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
            }
            if (sortConfig.key === 'lastUpdated' && aValue instanceof Date && bValue instanceof Date) {
                 return sortConfig.direction === 'asc' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime();
            }
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                 return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
            }
            if (String(aValue).toLowerCase() < String(bValue).toLowerCase()) return sortConfig.direction === "asc" ? -1 : 1;
            if (String(aValue).toLowerCase() > String(bValue).toLowerCase()) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
          });
        }
        return sortableItems;
      }, [itemsWithTotalValue, sortConfig]);

      // Apply filters first
      const filteredItemsByDropdown = useMemo(() => {
        console.log("InventoryTable: Applying dropdown filters:", filters);
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
        console.log("InventoryTable: Applying search query:", searchQuery);
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
          (item.location && item.location.toLowerCase().includes(lowerCaseQuery))
        );
      }, [filteredItemsByDropdown, searchQuery]);


      const requestSort = (key: keyof InventoryItem | 'totalValue') => {
        let direction: "asc" | "desc" = "asc";
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
          direction = "desc";
        }
        console.log("InventoryTable: Sorting by", key, direction);
        setSortConfig({ key, direction });
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
              }
               else {
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

      console.log("InventoryTable: Final items to render:", finalFilteredItems.length);

      return (
        <div className="space-y-4">
          {/* <DebugInfo data={{ items: finalFilteredItems, sortConfig }} name="InventoryTable State" /> */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {finalFilteredItems.length} {finalFilteredItems.length === 1 ? 'item' : 'items'} found
            </div>
            <Button onClick={handleExportCurrentView} variant="outline" size="sm">
              <FileDown className="mr-2 h-4 w-4" />
              Export Current View
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                {COLUMNS_TO_DISPLAY.map((key) => (
                  <TableHead key={key}>
                    {key !== 'actions' ? (
                      <Button
                        variant="ghost"
                        onClick={() => requestSort(key as keyof InventoryItem | 'totalValue')}
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
                 <TableRow><TableCell colSpan={COLUMNS_TO_DISPLAY.length} className="text-center h-24">No matching items found.</TableCell></TableRow>
              ) : (
                finalFilteredItems.map((item) => (
                  <TableRow key={item.id} className={cn("h-12", highlightRowId === item.id && "bg-primary/10 animate-pulse-bg")}>
                    {COLUMNS_TO_DISPLAY.map(key => {
                        if (key === 'actions') {
                            return <TableCell key={key} className="text-right"><Button variant="ghost" size="icon" onClick={() => onEdit(item)} title="Edit Item"><Pencil className="h-4 w-4" /></Button></TableCell>;
                        }
                        const value = item[key as keyof typeof item];
                        let displayValue: React.ReactNode = '-';
                        if (value !== null && value !== undefined) {
                            if (key === 'lastUpdated' && value instanceof Date) {
                                displayValue = format(value, 'PPp');
                            } else if (key === 'costPerUnit' || key === 'totalValue') {
                                displayValue = formatCurrency(value as number | undefined);
                            }
                             else {
                                displayValue = String(value);
                            }
                        }
                        const alignClass = ['quantity', 'costPerUnit', 'totalValue'].includes(key) ? 'text-right' : '';
                        const truncateClass = ['description', 'notes', 'supplierWebsite', 'project'].includes(key) ? 'max-w-[150px] truncate' : '';
                        return <TableCell key={key} className={cn(alignClass, truncateClass)} title={typeof displayValue === 'string' ? displayValue : undefined}>{displayValue}</TableCell>;
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      );
    }