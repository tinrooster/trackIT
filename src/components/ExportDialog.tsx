import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'sonner';
import { FileDown, Loader2 } from 'lucide-react';
import { InventoryItem } from '@/types/inventory';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
}

export function ExportDialog({ isOpen, onClose, items }: ExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({
    name: true,
    description: true,
    quantity: true,
    unit: true,
    costPerUnit: true,
    category: true,
    location: true,
    reorderLevel: true,
    barcode: true,
    notes: true,
    supplier: true,
    supplierWebsite: true,
    project: true,
    orderStatus: true,
    deliveryPercentage: true,
    expectedDeliveryDate: true
  });

  const toggleField = (field: string) => {
    setSelectedFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleExport = async () => {
    if (items.length === 0) {
      toast.warning("No items to export");
      return;
    }

    setIsExporting(true);

    try {
      // Filter the data based on selected fields
      const dataToExport = items.map(item => {
        const exportRow: Record<string, any> = {};
        
        Object.keys(selectedFields).forEach(field => {
          if (selectedFields[field]) {
            if (field === 'expectedDeliveryDate' && item[field as keyof InventoryItem]) {
              // Format date fields
              exportRow[field] = format(
                new Date(item[field as keyof InventoryItem] as string | Date), 
                'yyyy-MM-dd'
              );
            } else {
              exportRow[field] = item[field as keyof InventoryItem];
            }
          }
        });
        
        return exportRow;
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      XLSX.utils.book_append_sheet(wb, ws, "Inventory");

      // Generate filename with date
      const dateStr = format(new Date(), "yyyy-MM-dd");
      const filename = `Inventory_Export_${dateStr}.${exportFormat}`;

      // Export based on format
      if (exportFormat === 'xlsx') {
        XLSX.writeFile(wb, filename);
      } else {
        const csvContent = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
      }

      toast.success(`Exported ${items.length} items successfully`);
      onClose();
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Inventory</DialogTitle>
          <DialogDescription>
            Select the fields and format for your export file.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>Export Format</Label>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="format-xlsx"
                  checked={exportFormat === 'xlsx'}
                  onChange={() => setExportFormat('xlsx')}
                />
                <Label htmlFor="format-xlsx">Excel (.xlsx)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="format-csv"
                  checked={exportFormat === 'csv'}
                  onChange={() => setExportFormat('csv')}
                />
                <Label htmlFor="format-csv">CSV (.csv)</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fields to Export</Label>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-md p-2">
              {Object.keys(selectedFields).map(field => (
                <div key={field} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`field-${field}`}
                    checked={selectedFields[field]}
                    onCheckedChange={() => toggleField(field)}
                  />
                  <Label htmlFor={`field-${field}`} className="capitalize">
                    {field.replace(/([A-Z])/g, ' $1').trim()}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || Object.values(selectedFields).every(v => !v)}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Export {items.length} Items
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}