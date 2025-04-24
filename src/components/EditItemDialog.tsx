import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditItemForm } from "@/components/EditItemForm";
import { InventoryItem, ItemWithSubcategories } from "@/types/inventory";
import { useState } from "react";
import { toast } from "sonner";
import * as React from "react";

interface EditItemDialogProps {
  item: InventoryItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItemData: InventoryItem) => void;
  categories: string[];
  units: ItemWithSubcategories[];
  locations: ItemWithSubcategories[];
  suppliers: string[];
  projects: string[];
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
  projects
}: EditItemDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Convert ItemWithSubcategories to string arrays
  const flattenedUnits = React.useMemo(() => {
    return units.flatMap(unit => [
      unit.name,
      ...(unit.subcategories?.map(sub => `${unit.name}/${sub}`) || [])
    ]);
  }, [units]);

  const flattenedLocations = React.useMemo(() => {
    return locations.flatMap(location => [
      location.name,
      ...(location.subcategories?.map(sub => `${location.name}/${sub}`) || [])
    ]);
  }, [locations]);

  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      const updatedItem = {
        ...item,
        ...values,
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
            Make changes to "{item.name}". Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <EditItemForm
          item={item}
          onSubmit={handleSubmit}
          onCancel={onClose}
          categories={categories}
          units={flattenedUnits}
          locations={flattenedLocations}
          suppliers={suppliers}
          projects={projects}
        />
      </DialogContent>
    </Dialog>
  );
}