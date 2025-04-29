import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditItemForm } from "./EditItemForm";
import { InventoryItem, ItemWithSubcategories, CategoryNode } from "@/types/inventory";
import { Cabinet } from "@/types/cabinets";
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
  cabinets: Cabinet[];
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
      
      // Log the location ID and name for debugging
      const locationObj = locations.find(loc => loc.id === item.location);
      console.log('FORM SUBMIT - Original location:', { 
        id: item.location, 
        name: locationObj?.name
      });
      console.log('FORM SUBMIT - New location value:', values.location);
      
      // If we have a cabinet, get its details
      if (item.cabinet || values.cabinet) {
        const cabinetObj = cabinets.find(cab => cab.id === (values.cabinet || item.cabinet));
        console.log('FORM SUBMIT - Cabinet info:', { 
          id: values.cabinet || item.cabinet,
          name: cabinetObj?.name,
          locationId: cabinetObj?.locationId,
          matchesLocation: cabinetObj?.locationId === values.location
        });
      }
      
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
        serialNumber: values.serialNumber ?? item.serialNumber,
        manufacturer: values.manufacturer ?? item.manufacturer,
        modelNumber: values.modelNumber ?? item.modelNumber,
        dateInService: values.dateInService ?? item.dateInService,
        maintenanceNotes: values.maintenanceNotes ?? item.maintenanceNotes,
        unitSubcategory: values.unitSubcategory ?? item.unitSubcategory,
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
          existingItems={existingItems}
        />
      </DialogContent>
    </Dialog>
  );
}