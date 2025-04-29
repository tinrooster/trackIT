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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'sonner';
import { Copy, Loader2 } from 'lucide-react';
import { InventoryItem } from '@/types/inventory';

interface DuplicateItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem;
  onDuplicate: (newItem: Partial<InventoryItem>) => Promise<void>;
}

export function DuplicateItemDialog({ 
  isOpen, 
  onClose, 
  item, 
  onDuplicate 
}: DuplicateItemDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newName, setNewName] = useState(`${item.name} (Copy)`);
  const [quantity, setQuantity] = useState<number>(0);
  const [resetOrderStatus, setResetOrderStatus] = useState(true);
  
  // Fields to copy (all true by default except ID and lastUpdated which are always excluded)
  const [fieldsToCopy, setFieldsToCopy] = useState({
    description: true,
    unit: true,
    costPerUnit: true,
    category: true,
    location: true,
    reorderLevel: true,
    barcode: false, // Default false for barcode as it should be unique
    notes: true,
    supplier: true,
    supplierWebsite: true,
    project: true,
  });

  const toggleField = (field: string) => {
    setFieldsToCopy(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleDuplicate = async () => {
    if (!newName.trim()) {
      toast.error("Item name is required");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create new item object with selected fields
      const newItem: Partial<InventoryItem> = {
        name: newName.trim(),
        quantity: quantity,
      };

      // Copy selected fields
      Object.keys(fieldsToCopy).forEach(field => {
        if (fieldsToCopy[field as keyof typeof fieldsToCopy]) {
          (newItem as any)[field] = item[field as keyof InventoryItem];
        }
      });

      // Handle order status
      if (!resetOrderStatus) {
        newItem.orderStatus = item.orderStatus;
        newItem.deliveryPercentage = item.deliveryPercentage;
        newItem.expectedDeliveryDate = item.expectedDeliveryDate;
      } else {
        newItem.orderStatus = 'delivered';
        newItem.deliveryPercentage = 100;
        newItem.expectedDeliveryDate = undefined;
      }

      await onDuplicate(newItem);
      toast.success(`Duplicated "${item.name}" successfully`);
      onClose();
    } catch (error) {
      console.error("Duplication error:", error);
      toast.error("Failed to duplicate item");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Duplicate Item</DialogTitle>
          <DialogDescription>
            Create a copy of "{item.name}" with your selected properties.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-name">New Item Name</Label>
            <Input
              id="new-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter name for the duplicate item"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Initial Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              placeholder="Enter initial quantity"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="reset-order-status"
                checked={resetOrderStatus}
                onCheckedChange={() => setResetOrderStatus(!resetOrderStatus)}
              />
              <Label htmlFor="reset-order-status">
                Reset order status to "Delivered"
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Properties to Copy</Label>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-md p-2">
              {Object.keys(fieldsToCopy).map(field => (
                <div key={field} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`field-${field}`}
                    checked={fieldsToCopy[field as keyof typeof fieldsToCopy]}
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
            onClick={handleDuplicate} 
            disabled={isSubmitting || !newName.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Create Duplicate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}