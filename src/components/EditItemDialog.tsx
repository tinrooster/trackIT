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
      const locationId = locations.find(loc => loc.name === values.location)?.id || values.location;
      const updatedItem = {
        ...item,
        ...values,
        location: locationId,
        lastUpdated: new Date()
      };
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