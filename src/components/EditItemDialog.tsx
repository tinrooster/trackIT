import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditItemForm } from "@/components/EditItemForm";
import { InventoryItem } from "@/types/inventory";
import { useState } from "react";
import { toast } from "sonner";

interface EditItemDialogProps {
  item: InventoryItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItemData: InventoryItem) => void;
  categories: string[];
  units: string[];
  locations: string[];
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
          units={units}
          locations={locations}
          suppliers={suppliers}
          projects={projects}
        />
      </DialogContent>
    </Dialog>
  );
}