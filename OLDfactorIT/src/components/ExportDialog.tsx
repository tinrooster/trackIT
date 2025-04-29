import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InventoryItem } from "@/types/inventory";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  defaultFilename?: string;
}

export function ExportDialog({ isOpen, onClose, items, defaultFilename }: ExportDialogProps) {
  const [format, setFormat] = useState<"csv" | "xlsx">("csv");
  const [filename, setFilename] = useState(defaultFilename || `inventory_export_${new Date().toISOString().split('T')[0]}`);

  const handleExport = () => {
    try {
      // Create data array with headers
      const headers = ['Name', 'Category', 'Location', 'Project', 'Quantity', 'Unit', 'Notes', 'Last Updated'];
      const rows = items.map(item => [
        item.name,
        item.category || '',
        item.location || '',
        item.project || '',
        item.quantity.toString(),
        item.unit || '',
        item.notes || '',
        new Date(item.lastUpdated).toLocaleDateString()
      ]);

      if (format === "csv") {
        // Export as CSV
        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => 
            `"${String(cell).replace(/"/g, '""')}"`
          ).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // For XLSX, we'll need to implement XLSX export
        // This would require the xlsx library
        console.error("XLSX export not yet implemented");
      }

      onClose();
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Inventory</DialogTitle>
          <DialogDescription>
            Choose your export format and filename
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="format">Export Format</Label>
            <Select
              value={format}
              onValueChange={(value: "csv" | "xlsx") => setFormat(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Comma Separated Values)</SelectItem>
                <SelectItem value="xlsx">Excel Workbook (XLSX)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="filename">Filename</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Enter filename without extension"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            Export
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}