import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditItemForm } from "./EditItemForm";
import { InventoryItem, ItemWithSubcategories, CategoryNode } from "@/types/inventory";
import { useState } from "react";
import { toast } from "sonner";
import * as React from "react";

interface EditItemDialogProps {
  item: InventoryItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItemData: InventoryItem) => void;
  categories: CategoryNode[];
  units: ItemWithSubcategories[];
  locations: { id: string; name: string; }[];
  suppliers: ItemWithSubcategories[];
  projects: ItemWithSubcategories[];
  cabinets: { id: string; name: string; locationId: string; isSecure?: boolean; }[];
  existingItems: InventoryItem[];
}

export function EditItemDialog({
  item,
  isOpen,
  onClose,
  onSave,
  categories,
  units,
  locations,
  suppliers,
  projects,
  cabinets,
  existingItems
}: EditItemDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      
      // Create a clean updated item object
      const updatedItem: InventoryItem = {
        ...item, // Start with all original values
        // Carefully merge updates, preserving original values if new values are empty/undefined
        name: values.name ?? item.name,
        description: values.description ?? item.description,
        category: values.category ?? item.category,
        subcategory: values.subcategory ?? item.subcategory,
        unit: values.unit ?? item.unit,
        location: values.location ?? item.location,
        cabinet: values.cabinet ?? item.cabinet,
        quantity: values.quantity !== undefined ? Number(values.quantity) : item.quantity,
        supplier: values.supplier ?? item.supplier,
        supplierWebsite: values.supplierWebsite ?? item.supplierWebsite,
        project: values.project ?? item.project,
        notes: values.notes ?? item.notes,
        orderStatus: values.orderStatus ?? item.orderStatus,
        deliveryPercentage: values.deliveryPercentage !== undefined ? Number(values.deliveryPercentage) : item.deliveryPercentage,
        expectedDeliveryDate: values.expectedDeliveryDate ?? item.expectedDeliveryDate,
        minQuantity: values.minQuantity !== undefined ? Number(values.minQuantity) : (item.minQuantity ?? 0),
        costPerUnit: values.costPerUnit !== undefined ? Number(values.costPerUnit) : (item.costPerUnit ?? 0),
        barcode: values.barcode ?? item.barcode,
        lastUpdated: new Date()
      };

      console.log('Original item:', item);
      console.log('Form values:', values);
      console.log('Updated item:', updatedItem);

      await onSave(updatedItem);
      onClose();
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Failed to update item");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Edit Inventory Item</DialogTitle>
          <DialogDescription>
            Make changes to your inventory item here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <EditItemForm
          key={item.id} // Add key to force form re-render with new item
          item={item}
          onSubmit={handleSubmit}
          onCancel={onClose}
          categories={categories}
          units={units}
          locations={locations}
          suppliers={suppliers}
          projects={projects}
          cabinets={cabinets}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}