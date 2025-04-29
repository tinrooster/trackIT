import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { InventoryItem } from "@/types/inventory";

interface ListItem {
  id: string;
  name: string;
  subcategories?: ListItem[];
}

interface DeleteListItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemToDelete: ListItem;
  listType: string;
  allItems: ListItem[];
  inventoryItems: InventoryItem[];
  onConfirmDelete: (reassignToId: string | null) => void;
}

export function DeleteListItemDialog({
  open,
  onOpenChange,
  itemToDelete,
  listType,
  allItems,
  inventoryItems,
  onConfirmDelete,
}: DeleteListItemDialogProps) {
  const [selectedReassignId, setSelectedReassignId] = useState<string>("");
  const [affectedItems, setAffectedItems] = useState<InventoryItem[]>([]);

  // Find items that use the list item to be deleted
  useEffect(() => {
    const affected = inventoryItems.filter(item => {
      const value = item[listType.slice(0, -1) as keyof InventoryItem];
      return value === itemToDelete.id || value === itemToDelete.name;
    });
    setAffectedItems(affected);
  }, [itemToDelete, listType, inventoryItems]);

  const otherItems = allItems.filter(item => item.id !== itemToDelete.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {listType.slice(0, -1)}</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{itemToDelete.name}"?
            {affectedItems.length > 0 && (
              <>
                <br /><br />
                This {listType.slice(0, -1)} is used by {affectedItems.length} item{affectedItems.length !== 1 ? 's' : ''}.
                You can reassign these items to another {listType.slice(0, -1)} or leave them as is.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {affectedItems.length > 0 && otherItems.length > 0 && (
          <div className="py-4">
            <Label>Reassign items to:</Label>
            <Select
              value={selectedReassignId}
              onValueChange={setSelectedReassignId}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${listType.slice(0, -1)}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Leave as is</SelectItem>
                {otherItems.map(item => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirmDelete(selectedReassignId || null);
              onOpenChange(false);
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 