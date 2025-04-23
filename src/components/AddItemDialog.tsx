import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddItemForm } from "@/components/AddItemForm";
import { InventoryItem } from "@/types/inventory";
import { useState, useEffect } from "react";

interface AddItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (newItemData: Omit<InventoryItem, "id" | "lastUpdated">) => void;
  categories: string[];
  units: string[];
  locations: string[];
  suppliers: string[];
  projects: string[];
}

export function AddItemDialog({
  isOpen,
  onClose,
  onAddItem,
  categories,
  units,
  locations,
  suppliers,
  projects
}: AddItemDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Listen for dialog-close events
  useEffect(() => {
    const handleDialogClose = () => {
      onClose();
    };

    document.addEventListener('dialog-close', handleDialogClose);

    return () => {
      document.removeEventListener('dialog-close', handleDialogClose);
    };
  }, [onClose]);

  const handleSubmit = async (values: Omit<InventoryItem, "id" | "lastUpdated">) => {
    try {
      setIsSubmitting(true);
      await onAddItem(values);
      onClose();
    } catch (error) {
      console.error("Error adding item:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Add New Inventory Item</DialogTitle>
          <DialogDescription>
            Fill in the details for the new item.
          </DialogDescription>
        </DialogHeader>
        <AddItemForm
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